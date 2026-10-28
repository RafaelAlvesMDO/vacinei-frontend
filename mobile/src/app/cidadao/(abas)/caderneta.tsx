import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Banner, Button, FilterChips, Icon, Screen, StateMessage, TextField, type FilterOption } from '@/components/ui';
import { CardLoadState } from '@/components/vaccination/CardLoadState';
import { VaccineListItem } from '@/components/vaccination/VaccineListItem';
import { useVaccinationCard } from '@/hooks/useVaccinationCard';
import { colors, spacing, touchTarget, typography } from '@/theme';
import type { AlertStatus } from '@/types/vaccination';
import { EMPTY_CARD_MESSAGE, matchesVaccineSearch, sortVaccines } from '@/utils/vaccination';

type Filter = 'TODAS' | AlertStatus;

const FILTERS: Filter[] = ['TODAS', 'EM_DIA', 'ATRASADA', 'AGUARDANDO_CONFERENCIA', 'COMPLETA'];

function isFilter(value: string | undefined): value is Filter {
  return FILTERS.some((filter) => filter === value);
}

/**
 * Caderneta completa (RF006): vacinas pela situação do alerta (D32, atrasadas primeiro), com busca e filtros.
 * `?filtro=` abre a lista já filtrada (ex.: pelas notificações do sistema, na etapa final)
 */
export default function VaccinationCardScreen() {
  const { card, error, isRefreshing, reload } = useVaccinationCard();
  const { filtro } = useLocalSearchParams<{ filtro?: string }>();
  const [search, setSearch] = useState('');
  // A escolha nos chips vale até chegar outro `filtro` pela URL
  const [chosen, setChosen] = useState<{ source: string | undefined; filter: Filter } | null>(null);
  const filter: Filter = chosen && chosen.source === filtro ? chosen.filter : isFilter(filtro) ? filtro : 'TODAS';
  const setFilter = (value: Filter) => setChosen({ source: filtro, filter: value });

  const searched = card ? sortVaccines(card.vaccines).filter((item) => matchesVaccineSearch(item, search)) : [];
  const visible = filter === 'TODAS' ? searched : searched.filter((item) => item.alert.status === filter);
  // Os contadores respeitam a busca, como no web
  const countOf = (status: AlertStatus) => searched.filter((item) => item.alert.status === status).length;
  const options: FilterOption<Filter>[] = [
    { value: 'TODAS', label: 'Todas', count: searched.length },
    { value: 'EM_DIA', label: 'Em dia', count: countOf('EM_DIA') },
    { value: 'ATRASADA', label: 'Atrasadas', count: countOf('ATRASADA') },
    { value: 'AGUARDANDO_CONFERENCIA', label: 'Aguardando conferência', count: countOf('AGUARDANDO_CONFERENCIA') },
    { value: 'COMPLETA', label: 'Completas', count: countOf('COMPLETA') },
  ];
  const openRegistration = () => router.push('/cidadao/registro-vacina');

  return (
    <Screen edges={['top']} refreshing={isRefreshing} onRefresh={() => reload({ refreshing: true })}>
      <View style={styles.headingRow}>
        <View style={styles.heading}>
          <Text style={typography.title} accessibilityRole="header">
            Caderneta
          </Text>
          {card && <Text style={typography.muted}>{card.citizen.name}</Text>}
        </View>
        {card && card.vaccines.length > 0 && (
          <Button
            label="Cadastrar vacina"
            icon="add-circle-outline"
            variant="secondary"
            accessibilityHint="Abre o cadastro manual de uma dose"
            onPress={openRegistration}
          />
        )}
      </View>

      {!card ? (
        <CardLoadState error={error} onRetry={() => reload()} />
      ) : card.vaccines.length === 0 ? (
        <>
          {error && <Banner tone="danger" title="Não foi possível atualizar" message={error} />}
          <StateMessage
            variant="empty"
            icon="book-outline"
            title="Caderneta vazia"
            message={EMPTY_CARD_MESSAGE}
            action={{ label: 'Cadastrar vacina', icon: 'add-circle-outline', onPress: openRegistration }}
          />
        </>
      ) : (
        <>
          {error && <Banner tone="danger" title="Não foi possível atualizar" message={error} />}

          <TextField
            label="Buscar vacina"
            placeholder="Nome da vacina ou doença"
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            trailing={
              search ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Limpar busca"
                  onPress={() => setSearch('')}
                  style={styles.clear}
                >
                  <Icon name="close-circle" color={colors.muted} />
                </Pressable>
              ) : (
                <Icon name="search" color={colors.muted} />
              )
            }
          />

          <FilterChips accessibilityLabel="Filtrar por status" options={options} selected={filter} onChange={setFilter} />

          <Text style={typography.muted} accessibilityLiveRegion="polite">
            {visible.length === 1 ? '1 vacina' : `${visible.length} vacinas`}
          </Text>

          {visible.length === 0 ? (
            <StateMessage
              variant="empty"
              icon="search"
              title="Nenhuma vacina encontrada"
              message="Tente outro nome ou outro filtro."
            />
          ) : (
            <View style={styles.list}>
              {visible.map((item) => (
                <VaccineListItem key={item.vaccine.id} item={item} />
              ))}
            </View>
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  // Título e botão lado a lado; com a fonte ampliada, o botão desce
  headingRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  heading: {
    flexShrink: 1,
    gap: 2,
  },
  clear: {
    minWidth: touchTarget,
    minHeight: touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -spacing.md,
  },
  list: {
    gap: spacing.md,
  },
});
