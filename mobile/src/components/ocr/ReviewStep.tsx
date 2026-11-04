import { useRef } from 'react';
import { AccessibilityInfo, StyleSheet, Text, View, type ScrollViewInstance } from 'react-native';
import { Banner, Button, Icon, Screen, StepHeader } from '@/components/ui';
import { colors, fonts, radius, spacing, typography } from '@/theme';
import type { OcrResult } from '@/types/ocr';
import type { CatalogVaccine, VaccinationCard } from '@/types/vaccination';
import { describeItem, hasLowAlignment, isInCard, type ScanItem } from '@/utils/ocr';
import type { RecordFormErrors, RecordFormValues } from '@/utils/vaccineRecord';
import { ScanItemCard } from './ScanItemCard';

interface Props {
  result: OcrResult;
  items: ScanItem[];
  // Erros dos itens marcados, pela chave do item
  errors: Record<string, RecordFormErrors>;
  catalog: CatalogVaccine[] | null;
  card: VaccinationCard;
  subtitle: string;
  // Revisão só das doses que falharam ao salvar
  retrying: boolean;
  saving: { current: number; total: number } | null;
  saveError: string | null;
  onToggle: (key: string, selected: boolean) => void;
  onChange: (key: string, patch: Partial<RecordFormValues>) => void;
  onEdit: (key: string) => void;
  onSave: () => void;
  onBack: () => void;
}

function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

/**
 * Etapa 4: o cidadão confere cada dose lida (RF004, RNF12), marca as que vai salvar e corrige data e lote olhando
 * os recortes. Item marcado com erro não é enviado: o botão informa quantos precisam de atenção
 */
export function ReviewStep({
  result,
  items,
  errors,
  catalog,
  card,
  subtitle,
  retrying,
  saving,
  saveError,
  onToggle,
  onChange,
  onEdit,
  onSave,
  onBack,
}: Props) {
  const scrollRef = useRef<ScrollViewInstance>(null);
  const listY = useRef(0);
  const itemY = useRef<Record<string, number>>({});

  const selectedCount = items.filter((item) => item.selected).length;
  const attentionKeys = items.filter((item) => item.selected && errors[item.key]).map((item) => item.key);
  const attention = attentionKeys.length;
  const readyCount = selectedCount - attention;

  const goToFirstProblem = () => {
    const first = attentionKeys[0];
    if (first !== undefined) {
      scrollRef.current?.scrollTo({ y: Math.max(0, listY.current + (itemY.current[first] ?? 0)), animated: true });
    }
    AccessibilityInfo.announceForAccessibility(
      `${plural(attention, 'item precisa', 'itens precisam')} de atenção. Corrija os campos destacados ou desmarque o item.`,
    );
  };

  const saveLabel = `Salvar ${plural(selectedCount, 'dose', 'doses')}`;
  const footer = (
    <View style={styles.footer}>
      {saving ? (
        <Button label={saveLabel} loading loadingLabel={`Salvando ${saving.current} de ${saving.total}...`} onPress={onSave} />
      ) : selectedCount === 0 ? (
        <Button label="Marque ao menos uma dose" icon="checkbox-outline" onPress={onSave} disabled />
      ) : attention > 0 ? (
        <Button
          label={`${saveLabel}: ${plural(attention, 'precisa', 'precisam')} de atenção`}
          icon="alert-circle-outline"
          danger
          onPress={goToFirstProblem}
          accessibilityHint="Leva ao primeiro item com problema"
        />
      ) : (
        <Button label={saveLabel} icon="checkmark" onPress={onSave} />
      )}
      <Text style={[styles.small, styles.center]} accessibilityLiveRegion="polite">
        {attention > 0
          ? `${plural(attention, 'dose marcada precisa', 'doses marcadas precisam')} de atenção: corrija os campos destacados ou desmarque.`
          : `${plural(readyCount, 'dose pronta', 'doses prontas')} para salvar · ficam aguardando conferência na UBS.`}
      </Text>
    </View>
  );

  return (
    <Screen
      scrollRef={scrollRef}
      header={<StepHeader title="Conferir doses" subtitle={subtitle} onBack={onBack} step={{ current: 4, total: 4 }} />}
      footer={footer}
    >
      <View style={styles.found} accessible>
        <View style={styles.foundIcon}>
          <Icon name="checkmark-circle-outline" size={26} color={colors.white} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.foundTitle}>
            {retrying ? plural(items.length, 'dose para revisar', 'doses para revisar') : `Encontramos ${plural(items.length, 'dose', 'doses')}`}
          </Text>
          {result.model && <Text style={typography.muted}>{result.model.name}</Text>}
        </View>
      </View>

      <Banner tone="warning" title="Confira os dados com a caderneta" message="A leitura automática pode errar. Compare cada campo com o recorte da foto antes de salvar." />
      {hasLowAlignment(result) && (
        <Banner
          tone="info"
          title="Foto pouco alinhada"
          message="Parte da página ficou inclinada ou cortada. Se os dados não baterem com a caderneta, tente outra foto."
        />
      )}
      {saveError && <Banner tone="danger" title="Não foi possível salvar" message={saveError} />}

      <View
        style={styles.list}
        onLayout={(event) => {
          listY.current = event.nativeEvent.layout.y;
        }}
      >
        {items.map((item, index) => {
          const { vaccine, dose } = describeItem(item, catalog);
          return (
            <ScanItemCard
              key={item.key}
              item={item}
              position={index + 1}
              vaccineName={vaccine}
              doseName={dose}
              errors={item.selected ? errors[item.key] : undefined}
              inCard={isInCard(item.values, card)}
              onToggle={(selected) => onToggle(item.key, selected)}
              onChange={(patch) => onChange(item.key, patch)}
              onEdit={() => onEdit(item.key)}
              onLayout={(event) => {
                itemY.current[item.key] = event.nativeEvent.layout.y;
              }}
            />
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  footer: {
    gap: spacing.sm,
  },
  small: {
    ...typography.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  center: {
    textAlign: 'center',
  },
  found: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  foundIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  foundTitle: {
    fontFamily: fonts.semibold,
    fontSize: 17,
    lineHeight: 24,
    color: colors.primaryDark,
  },
  flex: {
    flex: 1,
    minWidth: 0,
  },
  list: {
    gap: spacing.lg,
  },
});
