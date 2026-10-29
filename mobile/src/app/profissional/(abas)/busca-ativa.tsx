import { useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View, type ScrollViewInstance } from 'react-native';
import { OverduePersonCard } from '@/components/professional/OverduePersonCard';
import { PageHeading } from '@/components/professional/PageHeading';
import { VerifiedOnly } from '@/components/professional/VerifiedOnly';
import {
  Banner,
  Pagination,
  Screen,
  SearchField,
  SegmentedControl,
  StateMessage,
  type SegmentOption,
} from '@/components/ui';
import { useDebounce } from '@/hooks/useDebounce';
import { useForbiddenSync } from '@/hooks/useForbiddenSync';
import { useReloadOnFocus } from '@/hooks/useReloadOnFocus';
import { useRequest } from '@/hooks/useRequest';
import { getOverdue } from '@/services/dashboard';
import { colors, fonts, radius, spacing, typography } from '@/theme';
import type { OverdueGroup } from '@/types/dashboard';
import { formatNumber } from '@/utils/format';

const PAGE_SIZE = 10;
const MIN_SEARCH_LENGTH = 2;

const EMPTY_MESSAGES: Record<OverdueGroup, string> = {
  ATRASADA: 'Nenhum cidadão com dose atrasada.',
  AGUARDANDO_CONFERENCIA: 'Nenhuma dose informada aguardando conferência.',
};

/**
 * Busca ativa (D21, D32): Atrasadas (mais atrasados primeiro) e Aguardando conferência, paginada (D22).
 * `?grupo=aguardando` abre o segundo grupo (atalho do painel)
 */
export default function OverdueScreen() {
  return (
    <VerifiedOnly>
      <OverdueContent />
    </VerifiedOnly>
  );
}

function OverdueContent() {
  const { grupo } = useLocalSearchParams<{ grupo?: string }>();
  const groupFromUrl: OverdueGroup = grupo === 'aguardando' ? 'AGUARDANDO_CONFERENCIA' : 'ATRASADA';
  // A escolha no seletor vale até chegar outro `grupo` pela URL
  const [chosen, setChosen] = useState<{ source: string | undefined; group: OverdueGroup } | null>(null);
  const group = chosen && chosen.source === grupo ? chosen.group : groupFromUrl;

  const [query, setQuery] = useState('');
  const trimmed = query.trim();
  const term = useDebounce(trimmed.length >= MIN_SEARCH_LENGTH ? trimmed : '', 400);

  // A página volta para 1 quando o grupo ou a busca mudam
  const filterKey = `${group}|${term}`;
  const [pageState, setPageState] = useState({ key: filterKey, page: 1 });
  const page = pageState.key === filterKey ? pageState.page : 1;
  const scrollRef = useRef<ScrollViewInstance>(null);

  // O grupo vai junto da resposta: até a nova chegar, a lista anterior continua com o visual do grupo dela
  const load = useCallback(
    async (signal: AbortSignal) => ({
      group,
      list: await getOverdue({ page, limit: PAGE_SIZE, search: term, status: group }, signal),
    }),
    [page, term, group],
  );
  const request = useRequest(load, 'Não foi possível carregar a busca ativa.');
  const { error, isLoading, isRefreshing, reload } = request;
  const data = request.data?.list ?? null;
  const shownGroup = request.data?.group ?? group;
  useForbiddenSync(error?.status);
  useReloadOnFocus(reload);

  const changePage = (next: number) => {
    setPageState({ key: filterKey, page: next });
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const options: SegmentOption<OverdueGroup>[] = [
    { value: 'ATRASADA', label: data ? `Atrasadas (${formatNumber(data.counts.ATRASADA)})` : 'Atrasadas' },
    {
      value: 'AGUARDANDO_CONFERENCIA',
      label: data
        ? `Aguardando conferência (${formatNumber(data.counts.AGUARDANDO_CONFERENCIA)})`
        : 'Aguardando conferência',
    },
  ];

  return (
    <Screen
      edges={['top']}
      scrollRef={scrollRef}
      refreshing={isRefreshing}
      onRefresh={() => reload({ refreshing: true })}
    >
      <PageHeading
        eyebrow="Busca ativa"
        title="Doses pendentes"
        subtitle="Priorize os cidadãos com esquemas vacinais pendentes e confira as doses informadas por eles."
      />

      {data && (
        <View style={styles.totals}>
          <Total
            label="Doses atrasadas"
            value={data.doseCounts.ATRASADA}
            people={data.counts.ATRASADA}
            color={colors.danger}
          />
          <Total
            label="Aguardando conferência"
            value={data.doseCounts.AGUARDANDO_CONFERENCIA}
            people={data.counts.AGUARDANDO_CONFERENCIA}
            color={colors.warning}
          />
        </View>
      )}

      <SegmentedControl
        accessibilityLabel="Grupo da busca ativa"
        options={options}
        selected={group}
        onChange={(value) => setChosen({ source: grupo, group: value })}
      />

      <SearchField
        label="Buscar por nome"
        placeholder="Nome do cidadão"
        value={query}
        onChangeText={setQuery}
        autoCapitalize="words"
        hint={trimmed.length > 0 && trimmed.length < MIN_SEARCH_LENGTH ? 'Digite ao menos 2 letras.' : undefined}
      />

      {!data ? (
        error ? (
          <StateMessage
            variant="error"
            title="Não foi possível carregar a busca ativa"
            message={error.message}
            action={{ label: 'Tentar novamente', icon: 'refresh', onPress: () => reload() }}
          />
        ) : (
          <StateMessage variant="loading" title="Carregando a busca ativa..." />
        )
      ) : (
        <>
          {error && <Banner tone="danger" title="Não foi possível atualizar" message={error.message} />}

          <View style={styles.listHeader}>
            <Text style={typography.muted} accessibilityLiveRegion="polite">
              {data.total === 1 ? '1 cidadão' : `${formatNumber(data.total)} cidadãos`}
            </Text>
            {isLoading && <ActivityIndicator color={colors.primary} accessibilityLabel="Atualizando a lista" />}
          </View>

          {data.items.length === 0 ? (
            <StateMessage
              variant="empty"
              icon={term ? 'search' : 'checkmark-done-outline'}
              title={term ? 'Nenhum cidadão encontrado' : 'Tudo em dia'}
              message={term ? 'Tente outro nome.' : EMPTY_MESSAGES[shownGroup]}
            />
          ) : (
            <View style={styles.list}>
              {data.items.map((person) => (
                <OverduePersonCard key={person.id} person={person} group={shownGroup} />
              ))}
            </View>
          )}

          <Pagination page={data.page} totalPages={data.totalPages} onChange={changePage} disabled={isLoading} />
        </>
      )}
    </Screen>
  );
}

function Total({ label, value, people, color }: { label: string; value: number; people: number; color: string }) {
  const peopleLabel = people === 1 ? '1 cidadão' : `${formatNumber(people)} cidadãos`;

  return (
    <View style={styles.total} accessible accessibilityLabel={`${label}: ${value}. ${peopleLabel}`}>
      <Text style={styles.totalLabel}>{label}</Text>
      <Text style={[styles.totalValue, { color }]}>{formatNumber(value)}</Text>
      <Text style={styles.totalLabel}>{peopleLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // Com a fonte ampliada, os quadros ficam um embaixo do outro
  totals: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  total: {
    flexGrow: 1,
    flexBasis: 140,
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: 2,
  },
  totalLabel: {
    ...typography.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  totalValue: {
    fontFamily: fonts.bold,
    fontSize: 28,
    lineHeight: 36,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  list: {
    gap: spacing.md,
  },
});
