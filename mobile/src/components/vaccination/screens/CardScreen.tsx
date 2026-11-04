import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Banner, Button, FilterChips, Icon, Screen, StateMessage, StepHeader, TextField, type FilterOption } from '@/components/ui';
import { CardLoadState } from '@/components/vaccination/CardLoadState';
import { VaccineListItem } from '@/components/vaccination/VaccineListItem';
import { useVaccinationCard } from '@/hooks/useVaccinationCard';
import { colors, spacing, touchTarget, typography } from '@/theme';
import type { AlertStatus } from '@/types/vaccination';
import { getCardTexts, matchesVaccineSearch, sortVaccines } from '@/utils/vaccination';

type Filter = 'TODAS' | AlertStatus;

const FILTERS: Filter[] = ['TODAS', 'EM_DIA', 'ATRASADA', 'AGUARDANDO_CONFERENCIA', 'COMPLETA'];

function isFilter(value: string | undefined): value is Filter {
  return FILTERS.some((filter) => filter === value);
}

interface Props {
  // Só na caderneta do dependente, que abre por cima das abas
  onBack?: () => void;
}

/**
 * Caderneta completa (RF006): vacinas pela situação do alerta (D32, atrasadas primeiro), com busca e filtros.
 * `?filtro=` abre a lista já filtrada. A mesma tela serve ao titular (aba Caderneta) e aos dependentes (D33)
 */
export function CardScreen({ onBack }: Props) {
  const { owner, paths, card, error, isRefreshing, reload } = useVaccinationCard();
  const isSelf = owner.kind === 'self';
  const texts = getCardTexts(isSelf, card?.citizen.name);
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
  const openRegistration = () => router.push(paths.record({}));
  const openScan = () => router.push(paths.scan);

  const scanButton = (
    <Button
      label="Digitalizar caderneta"
      icon="camera-outline"
      accessibilityHint={`Fotografe a caderneta física para ler as doses e salvá-las ${texts.inCard}`}
      onPress={openScan}
      style={styles.action}
    />
  );

  const hasVaccines = !!card && card.vaccines.length > 0;
  const registerButton = (
    <Button
      label="Cadastrar vacina"
      icon="add-circle-outline"
      variant="secondary"
      accessibilityHint={`Abre o cadastro manual de uma dose ${texts.inCard}`}
      onPress={openRegistration}
      style={styles.action}
    />
  );

  return (
    <Screen
      edges={isSelf ? ['top'] : undefined}
      header={
        isSelf ? undefined : (
          <StepHeader title="Caderneta do dependente" subtitle={card?.citizen.name} onBack={onBack} />
        )
      }
      refreshing={isRefreshing}
      onRefresh={() => reload({ refreshing: true })}
    >
      {/* Titular: só "Cadastrar vacina" (o Digitalizar é a aba central, como no design). Dependente: os dois,
          com o dependente já como dono da caderneta digitalizada */}
      {isSelf ? (
        <View style={styles.actions}>
          <View style={styles.heading}>
            <Text style={typography.title} accessibilityRole="header">
              Caderneta
            </Text>
            {card && <Text style={typography.muted}>{card.citizen.name}</Text>}
          </View>
          {hasVaccines && registerButton}
        </View>
      ) : (
        hasVaccines && (
          <View style={styles.actions}>
            {scanButton}
            {registerButton}
          </View>
        )
      )}

      {!card ? (
        <CardLoadState error={error} onRetry={() => reload()} loadingTitle={texts.loadingTitle} />
      ) : card.vaccines.length === 0 ? (
        <>
          {error && <Banner tone="danger" title="Não foi possível atualizar" message={error} />}
          <StateMessage
            variant="empty"
            icon="book-outline"
            title="Caderneta vazia"
            message={texts.emptyMessage}
            action={{ label: 'Cadastrar vacina', icon: 'add-circle-outline', onPress: openRegistration }}
          />
          {!isSelf && <View style={styles.actions}>{scanButton}</View>}
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
    flexGrow: 1,
    flexBasis: 160,
    gap: 2,
  },
  // Título e botão (titular) ou Digitalizar e Cadastrar (dependente) lado a lado; em telas estreitas ou com a
  // fonte ampliada, um embaixo do outro
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  action: {
    flexGrow: 1,
    flexBasis: 160,
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
