import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Screen, StateMessage, StepHeader } from '@/components/ui';
import { VaccineRecordForm } from '@/components/vaccination/VaccineRecordForm';
import { useFieldFocus } from '@/hooks/useFieldFocus';
import { spacing } from '@/theme';
import type { CatalogVaccine, VaccinationCard } from '@/types/vaccination';
import { validateScanItems, type ScanItem } from '@/utils/ocr';
import { suggestDose, getTakenDoseIds, type RecordField, type RecordFormErrors, type RecordFormValues } from '@/utils/vaccineRecord';
import { CropImage } from './CropImage';

// Ordem dos campos no formulário (foco no primeiro com erro)
const RECORD_FIELDS: RecordField[] = ['vaccineId', 'doseId', 'applicationDate', 'lote'];

interface Props {
  items: ScanItem[];
  itemKey: string;
  position: number;
  catalog: CatalogVaccine[] | null;
  catalogError: string | null;
  onReloadCatalog: () => void;
  card: VaccinationCard;
  onDone: (values: RecordFormValues) => void;
  onCancel: () => void;
}

/**
 * Editor completo de uma dose lida (o mesmo formulário do cadastro manual), com o recorte de cada campo:
 * escolher a vacina e a dose quando a leitura não as identificou, ou corrigir tudo. "Concluir" marca o item
 */
export function ItemEditor({ items, itemKey, position, catalog, catalogError, onReloadCatalog, card, onDone, onCancel }: Props) {
  const item = items.find((candidate) => candidate.key === itemKey);
  const [draft, setDraft] = useState<RecordFormValues | null>(item?.values ?? null);
  const [errors, setErrors] = useState<RecordFormErrors>({});
  const fieldFocus = useFieldFocus(RECORD_FIELDS);

  // O voltar do Android é tratado pelo fluxo (volta à lista, como o "Cancelar")
  if (!item || !draft) return null;
  const { suggestion } = item;

  // Vacina escolhida sem dose: sugere a próxima pendente da caderneta, como no cadastro manual
  const vaccine = catalog?.find((candidate) => candidate.id === draft.vaccineId);
  const cardVaccine = card.vaccines.find((candidate) => candidate.vaccine.id === draft.vaccineId);
  const values: RecordFormValues =
    vaccine && !draft.doseId
      ? { ...draft, doseId: suggestDose(vaccine, cardVaccine, getTakenDoseIds(cardVaccine, null))?.id ?? null }
      : draft;

  const change = (patch: Partial<RecordFormValues>) => {
    setDraft({ ...values, ...patch });
    setErrors((current) => {
      const next = { ...current };
      for (const field of Object.keys(patch) as RecordField[]) delete next[field];
      return next;
    });
  };

  const done = () => {
    if (!catalog) return;
    // Valida junto com os outros itens marcados, para não repetir a mesma dose
    const updated = items.map((candidate) => (candidate.key === itemKey ? { ...candidate, selected: true, values } : candidate));
    const found = validateScanItems(updated, catalog, card)[itemKey] ?? {};
    setErrors(found);
    if (Object.keys(found).length === 0) onDone(values);
    else fieldFocus.focusFirstError(found);
  };

  return (
    <Screen
      header={
        <StepHeader
          title={`Editar dose ${String(position).padStart(2, '0')}`}
          subtitle={`Na caderneta: ${suggestion.printedLabel}`}
          onBack={onCancel}
          backLabel="Cancelar"
        />
      }
      footer={
        <View style={styles.footer}>
          <Button label="Concluir" icon="checkmark" onPress={done} disabled={!catalog} accessibilityHint="Marca a dose para salvar e volta à lista" />
          <Button label="Cancelar" variant="link" onPress={onCancel} />
        </View>
      }
    >
      <CropImage uri={suggestion.cellCrop} label="Recorte da caderneta com esta dose" caption="Recorte da caderneta" height={140} />
      {catalog ? (
        <VaccineRecordForm
          values={values}
          onChange={change}
          errors={errors}
          catalog={catalog}
          cardVaccines={card.vaccines}
          editingRecordId={null}
          fieldFocus={fieldFocus}
          fieldAddons={{
            vaccineId:
              suggestion.kind === 'FREE' ? (
                <CropImage uri={suggestion.vaccine.crop} label="Recorte do nome da vacina escrito na caderneta" caption="Vacina na foto" />
              ) : undefined,
            applicationDate: (
              <CropImage uri={suggestion.applicationDate.crop} label="Recorte da data de aplicação na foto" caption="Data na foto" />
            ),
            lote: <CropImage uri={suggestion.lote.crop} label="Recorte do lote na foto" caption="Lote na foto" />,
          }}
        />
      ) : catalogError ? (
        <StateMessage
          variant="error"
          title="Não foi possível carregar as vacinas"
          message={catalogError}
          action={{ label: 'Tentar novamente', icon: 'refresh', onPress: onReloadCatalog }}
        />
      ) : (
        <StateMessage variant="loading" title="Carregando vacinas..." />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  footer: {
    gap: spacing.sm,
  },
});
