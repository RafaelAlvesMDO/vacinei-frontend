import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Banner, FilterChips, Icon, Screen, StateMessage, TextField, type FilterOption } from '@/components/ui';
import { CardLoadState } from '@/components/vaccination/CardLoadState';
import { VaccineListItem } from '@/components/vaccination/VaccineListItem';
import { useVaccinationCard } from '@/hooks/useVaccinationCard';
import { colors, spacing, touchTarget, typography } from '@/theme';
import type { VaccineScheduleStatus } from '@/types/vaccination';
import { EMPTY_CARD_MESSAGE, matchesVaccineSearch, sortVaccines } from '@/utils/vaccination';

type Filter = 'TODAS' | VaccineScheduleStatus;

/**
 * Caderneta completa (RF006): vacinas por status (atrasadas primeiro), com busca e filtros
 */
export default function VaccinationCardScreen() {
  const { card, error, isRefreshing, reload } = useVaccinationCard();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('TODAS');

  const searched = card ? sortVaccines(card.vaccines).filter((item) => matchesVaccineSearch(item, search)) : [];
  const visible = filter === 'TODAS' ? searched : searched.filter((item) => item.status === filter);
  // Os contadores respeitam a busca, como no web
  const countOf = (status: VaccineScheduleStatus) => searched.filter((item) => item.status === status).length;
  const options: FilterOption<Filter>[] = [
    { value: 'TODAS', label: 'Todas', count: searched.length },
    { value: 'EM_DIA', label: 'Em dia', count: countOf('EM_DIA') },
    { value: 'ATRASADA', label: 'Atrasadas', count: countOf('ATRASADA') },
    { value: 'COMPLETA', label: 'Completas', count: countOf('COMPLETA') },
  ];

  return (
    <Screen edges={['top']} refreshing={isRefreshing} onRefresh={() => reload({ refreshing: true })}>
      <View style={styles.heading}>
        <Text style={typography.title} accessibilityRole="header">
          Caderneta
        </Text>
        {card && <Text style={typography.muted}>{card.citizen.name}</Text>}
      </View>

      {!card ? (
        <CardLoadState error={error} onRetry={() => reload()} />
      ) : card.vaccines.length === 0 ? (
        <>
          {error && <Banner tone="danger" title="Não foi possível atualizar" message={error} />}
          <StateMessage variant="empty" icon="book-outline" title="Caderneta vazia" message={EMPTY_CARD_MESSAGE} />
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
  heading: {
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
