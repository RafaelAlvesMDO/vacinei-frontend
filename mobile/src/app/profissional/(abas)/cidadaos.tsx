import { isCancel } from 'axios';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CitizenResultCard } from '@/components/professional/CitizenResultCard';
import { PageHeading } from '@/components/professional/PageHeading';
import { VerifiedOnly } from '@/components/professional/VerifiedOnly';
import { Banner, Button, Card, Icon, Screen, SearchField, StateMessage } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useDebounce } from '@/hooks/useDebounce';
import { useForbiddenSync } from '@/hooks/useForbiddenSync';
import { parseApiError } from '@/services/auth';
import { searchCitizens } from '@/services/citizens';
import { colors, spacing, typography } from '@/theme';
import type { CitizenSearchResult } from '@/types/citizen';
import { CPF_LENGTH, isValidCpf, looksLikeCpf } from '@/utils/cpf';
import { onlyDigits } from '@/utils/format';

const MIN_SEARCH_LENGTH = 2;
const MAX_SEARCH_LENGTH = 100;

const SEARCH_TIPS = ['Digite o nome sem abreviações', 'Confira a data de nascimento', 'Prefira o CPF, que é único'];

interface SearchState {
  term: string;
  results: CitizenSearchResult[];
  error: { status: number | null; message: string } | null;
}

/**
 * Registrar vacinação, etapa 1 (RF010 nota 1): busca do cidadão por nome ou CPF. O CPF, com ou sem máscara,
 * vai só com os números e exige os 11 dígitos válidos (busca exata)
 */
export default function CitizensScreen() {
  return (
    <VerifiedOnly>
      <CitizenSearchContent />
    </VerifiedOnly>
  );
}

function CitizenSearchContent() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [searchState, setSearchState] = useState<SearchState>({ term: '', results: [], error: null });
  // "Tentar novamente" refaz a busca com o mesmo termo
  const [attempt, setAttempt] = useState(0);
  useForbiddenSync(searchState.error?.status);

  const trimmed = query.trim();
  const isCpfQuery = looksLikeCpf(trimmed);
  const cpfDigits = isCpfQuery ? onlyDigits(trimmed) : '';
  const cpfHint = !isCpfQuery
    ? null
    : cpfDigits.length < CPF_LENGTH
      ? `Digite os ${CPF_LENGTH} dígitos do CPF para buscar.`
      : isValidCpf(cpfDigits)
        ? null
        : 'CPF inválido. Confira os números digitados.';
  const searchTerm = cpfHint ? '' : isCpfQuery ? cpfDigits : trimmed;
  const debounced = useDebounce(searchTerm, 400);
  const isQueryValid = debounced.length >= MIN_SEARCH_LENGTH;
  // A busca está pendente enquanto o resultado não corresponde ao termo digitado
  const isSearching = searchTerm.length >= MIN_SEARCH_LENGTH && searchState.term !== searchTerm;

  useEffect(() => {
    if (!isQueryValid) return;
    const controller = new AbortController();

    searchCitizens(debounced, controller.signal)
      .then((results) => setSearchState({ term: debounced, results, error: null }))
      .catch((reason: unknown) => {
        if (isCancel(reason)) return;
        const { status, message } = parseApiError(reason, 'Não foi possível buscar os cidadãos.');
        setSearchState({ term: debounced, results: [], error: { status, message } });
      });

    return () => controller.abort();
  }, [debounced, isQueryValid, attempt]);

  const retry = () => {
    setSearchState((current) => ({ ...current, term: '' }));
    setAttempt((current) => current + 1);
  };

  const showResults = !cpfHint && searchTerm.length >= MIN_SEARCH_LENGTH && !isSearching;
  const results = showResults ? searchState.results : [];
  const hint = cpfHint ?? (trimmed.length === 1 ? 'Digite ao menos 2 caracteres.' : 'Nome completo ou CPF, com ou sem pontos.');

  return (
    <Screen edges={['top']}>
      <PageHeading
        eyebrow="Registrar vacinação"
        title="Buscar cidadão"
        subtitle="Localize a pessoa com segurança antes de abrir a caderneta e confirmar a dose."
      />

      <Card>
        <SearchField
          label="Nome ou CPF do cidadão"
          placeholder="Ex.: Ana Souza ou 000.000.000-00"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="words"
          maxLength={MAX_SEARCH_LENGTH}
          hint={hint}
        />
      </Card>

      {isSearching ? (
        <StateMessage variant="loading" title="Buscando cidadãos..." />
      ) : showResults && searchState.error ? (
        <StateMessage
          variant="error"
          title="Não foi possível buscar"
          message={searchState.error.message}
          action={{ label: 'Tentar novamente', icon: 'refresh', onPress: retry }}
        />
      ) : showResults && results.length === 0 ? (
        <NotFound onClear={() => setQuery('')} />
      ) : showResults ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={typography.subtitle} accessibilityRole="header">
              Resultados encontrados
            </Text>
            <Text style={typography.muted} accessibilityLiveRegion="polite">
              {results.length === 1 ? '1 pessoa' : `${results.length} pessoas`}
            </Text>
          </View>
          {results.map((citizen) => (
            <CitizenResultCard key={citizen.id} citizen={citizen} isSelf={citizen.id === user?.id} />
          ))}
          <Banner
            icon="shield-checkmark-outline"
            title="Seleção segura"
            message="Confira o nome, a data de nascimento e o CPF para abrir a caderneta correta."
          />
        </View>
      ) : (
        <SearchTips />
      )}
    </Screen>
  );
}

function NotFound({ onClear }: { onClear: () => void }) {
  return (
    <>
      <Card style={styles.notFound}>
        <StateMessage
          variant="empty"
          icon="person-outline"
          title="Nenhum cidadão encontrado"
          message="Revise os dados informados ou tente outra identificação. Pequenas diferenças no nome podem alterar o resultado."
        />
        <Button label="Limpar busca" icon="close-circle-outline" variant="secondary" onPress={onClear} />
      </Card>
      <Banner
        title="Antes de tentar novamente"
        message="Confira se o nome está completo ou use o CPF. O cidadão precisa ter conta no Vacinei!?."
      />
      <SearchTips />
    </>
  );
}

function SearchTips() {
  return (
    <Card>
      <Text style={typography.subtitle} accessibilityRole="header">
        Dicas de busca
      </Text>
      {SEARCH_TIPS.map((tip) => (
        <View key={tip} style={styles.tip}>
          <Icon name="checkmark" color={colors.primary} />
          <Text style={[typography.body, styles.tipText]}>{tip}</Text>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: spacing.md,
  },
  notFound: {
    paddingVertical: 0,
    paddingBottom: spacing.xl,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  tipText: {
    flex: 1,
    minWidth: 0,
  },
});
