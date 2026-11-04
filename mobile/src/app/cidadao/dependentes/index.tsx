import { router } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DependentListItem } from '@/components/dependents/DependentListItem';
import { Banner, Button, Icon, Screen, StateMessage, StepHeader } from '@/components/ui';
import { useDependents } from '@/hooks/useDependents';
import { useReloadOnFocus } from '@/hooks/useReloadOnFocus';
import { colors, fonts, radius, spacing, typography } from '@/theme';

/**
 * Meus dependentes (RF012, D33): lista com idade, parentesco e o resumo da situação de cada caderneta (D32).
 * Vale para o cidadão e para o profissional na ala Cidadão (D11)
 */
export default function DependentsList() {
  const { dependents, error, isRefreshing, reload } = useDependents();
  // Voltando do perfil ou da caderneta de um dependente, os resumos já aparecem atualizados
  useReloadOnFocus(useCallback(() => reload({ silent: true }), [reload]));

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/cidadao/perfil'));
  const isEmpty = dependents !== null && dependents.length === 0;
  const add = () => router.push('/cidadao/dependentes/novo');

  return (
    <Screen
      header={<StepHeader title="Dependentes" onBack={goBack} />}
      refreshing={isRefreshing}
      onRefresh={() => reload({ refreshing: true })}
      footer={
        dependents !== null && (
          <Button
            label={isEmpty ? 'Adicionar primeiro dependente' : 'Adicionar dependente'}
            icon="person-add-outline"
            onPress={add}
          />
        )
      }
    >
      {!dependents ? (
        error ? (
          <StateMessage
            variant="error"
            title="Não foi possível carregar"
            message={error}
            action={{ label: 'Tentar novamente', icon: 'refresh', onPress: () => reload() }}
          />
        ) : (
          <StateMessage variant="loading" title="Carregando dependentes..." />
        )
      ) : isEmpty ? (
        <>
          <StateMessage
            variant="empty"
            icon="people-outline"
            title="Cuide de quem está com você"
            message="Adicione seu primeiro dependente para acompanhar a caderneta de vacinação de quem depende de você."
          />
          <Banner
            tone="info"
            icon="shield-checkmark-outline"
            message="Só você acessa os dados dos seus dependentes. Profissionais de saúde verificados podem encontrá-los para conferir as doses. Você pode remover o vínculo quando quiser."
          />
        </>
      ) : (
        <>
          {error && <Banner tone="danger" title="Não foi possível atualizar" message={error} />}
          <View style={styles.summary} accessible>
            <View style={styles.summaryIcon}>
              <Icon name="people-outline" size={24} color={colors.white} />
            </View>
            <View style={styles.summaryText}>
              <Text style={styles.summaryTitle} accessibilityRole="header">
                {dependents.length === 1 ? '1 dependente vinculado' : `${dependents.length} dependentes vinculados`}
              </Text>
              <Text style={typography.muted}>Acompanhe cadernetas e pendências.</Text>
            </View>
          </View>
          <View style={styles.list}>
            {dependents.map((overview) => (
              <DependentListItem key={overview.dependent.id} overview={overview} />
            ))}
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  summaryTitle: {
    fontFamily: fonts.semibold,
    fontSize: 17,
    lineHeight: 24,
    color: colors.primaryDark,
  },
  list: {
    gap: spacing.md,
  },
});
