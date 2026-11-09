import { useRef, useState, type Ref } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { Badge, Button, Card, Checkbox, Icon, TextField } from '@/components/ui';
import type { FocusableView } from '@/hooks/useFieldFocus';
import { colors, fonts, radius, spacing, typography } from '@/theme';
import { formatDateInput } from '@/utils/format';
import type { ScanItem } from '@/utils/ocr';
import { LOTE_MAX_LENGTH, normalizeLote, type RecordFormErrors, type RecordFormValues } from '@/utils/vaccineRecord';
import { CropImage } from './CropImage';

interface Props {
  item: ScanItem;
  position: number;
  vaccineName: string;
  doseName: string;
  // Erros só dos itens marcados
  errors: RecordFormErrors | undefined;
  inCard: boolean;
  onToggle: (selected: boolean) => void;
  onChange: (patch: Partial<RecordFormValues>) => void;
  onEdit: () => void;
  onLayout?: (event: LayoutChangeEvent) => void;
  // Título do item, para o leitor de tela ir ao primeiro item com problema
  headerRef?: Ref<FocusableView>;
  // Linha (recorte + campo) da data ou do lote que ganhou ou perdeu o foco, para a tela rolar até ela
  onFieldFocus?: (row: FocusableView | null) => void;
  onFieldBlur?: (row: FocusableView | null) => void;
}

type FocusedField = 'date' | 'lote';

// Recorte do campo em foco (o padrão do CropImage é 64)
const FOCUSED_CROP_HEIGHT = 96;

/**
 * Uma dose sugerida pela leitura (RF004): vacina e dose, recorte da célula e data e lote editáveis ao lado dos
 * recortes. Vacina e dose sem `id` são escolhidas no editor completo. Item desmarcado não é enviado
 */
export function ScanItemCard({
  item,
  position,
  vaccineName,
  doseName,
  errors,
  inCard,
  onToggle,
  onChange,
  onEdit,
  onLayout,
  headerRef,
  onFieldFocus,
  onFieldBlur,
}: Props) {
  const { suggestion, values, selected } = item;
  const hasErrors = selected && errors !== undefined;
  const missingIdentity = !values.vaccineId || !values.doseId;
  const identityError = errors?.vaccineId ?? errors?.doseId;
  const number = String(position).padStart(2, '0');

  // Campo em foco: o recorte dele vai para cima do campo, na largura do card e maior, para ler enquanto digita
  const [focused, setFocused] = useState<FocusedField | null>(null);
  const dateRow = useRef<FocusableView>(null);
  const loteRow = useRef<FocusableView>(null);

  const focus = (field: FocusedField, row: FocusableView | null) => {
    setFocused(field);
    onFieldFocus?.(row);
  };

  const blur = (field: FocusedField, row: FocusableView | null) => {
    setFocused((current) => (current === field ? null : current));
    onFieldBlur?.(row);
  };

  return (
    <View onLayout={onLayout}>
      <Card style={[styles.card, hasErrors && styles.cardError, !selected && styles.cardOff]}>
        <View style={styles.header}>
          <View style={[styles.number, hasErrors && styles.numberError]}>
            <Text style={[styles.numberText, hasErrors && styles.numberTextError]}>{number}</Text>
          </View>
          <View
            ref={headerRef}
            style={styles.flex}
            accessible
            accessibilityLabel={`Dose ${position}: ${vaccineName}, ${doseName}${hasErrors ? '. Precisa de atenção' : ''}`}
          >
            <Text style={styles.title}>{vaccineName}</Text>
            <Text style={typography.muted}>{doseName}</Text>
            <Text style={styles.printed}>Na caderneta: {suggestion.printedLabel}</Text>
          </View>
        </View>

        <Checkbox
          label={selected ? 'Salvar esta dose' : 'Salvar esta dose (desmarcada, não será salva)'}
          checked={selected}
          onChange={onToggle}
        />

        {(inCard || suggestion.vaccine.source === 'OCR') && (
          <View style={styles.badges}>
            {inCard && <Badge label="Já está na caderneta" tone="neutral" icon="checkmark-done-outline" />}
            {suggestion.vaccine.source === 'OCR' && suggestion.vaccine.id && (
              <Badge label="Vacina lida da escrita à mão" tone="warning" icon="create-outline" />
            )}
          </View>
        )}

        {selected && (
          <>
            <CropImage uri={suggestion.cellCrop} label={`Recorte da caderneta com a dose ${position}`} caption="Recorte da caderneta" height={120} />

            {suggestion.kind === 'FREE' && (
              <CropImage uri={suggestion.vaccine.crop} label="Recorte do nome da vacina escrito na caderneta" caption="Vacina escrita" />
            )}

            {(missingIdentity || identityError) && (
              <View style={styles.identity} accessibilityRole="alert">
                <Icon name="alert-circle-outline" color={colors.danger} />
                <Text style={[styles.identityText, styles.flex]}>
                  {!values.vaccineId
                    ? 'Não identificamos a vacina. Escolha a vacina e a dose olhando o recorte.'
                    : !values.doseId
                      ? 'Não identificamos a dose. Escolha a dose olhando o recorte.'
                      : identityError}
                </Text>
              </View>
            )}

            <View ref={dateRow} style={[styles.fieldRow, focused === 'date' && styles.fieldRowFocused]}>
              <CropImage
                uri={suggestion.applicationDate.crop}
                label="Recorte da data de aplicação na foto"
                caption="Data na foto"
                height={focused === 'date' ? FOCUSED_CROP_HEIGHT : undefined}
                style={focused === 'date' ? styles.stacked : styles.crop}
              />
              <View style={focused === 'date' ? styles.stacked : styles.field}>
                <TextField
                  label="Data de aplicação"
                  required
                  placeholder="DD/MM/AAAA"
                  hint={suggestion.applicationDate.value ? 'Lida da foto. Confira com o recorte.' : 'Não lida. Digite olhando o recorte.'}
                  value={values.applicationDate}
                  onChangeText={(text) => onChange({ applicationDate: formatDateInput(text) })}
                  keyboardType="number-pad"
                  maxLength={10}
                  error={errors?.applicationDate}
                  onFocus={() => focus('date', dateRow.current)}
                  onBlur={() => blur('date', dateRow.current)}
                />
              </View>
            </View>

            <View ref={loteRow} style={[styles.fieldRow, focused === 'lote' && styles.fieldRowFocused]}>
              <CropImage
                uri={suggestion.lote.crop}
                label="Recorte do lote na foto"
                caption="Lote na foto"
                height={focused === 'lote' ? FOCUSED_CROP_HEIGHT : undefined}
                style={focused === 'lote' ? styles.stacked : styles.crop}
              />
              <View style={focused === 'lote' ? styles.stacked : styles.field}>
                <TextField
                  label="Lote (opcional)"
                  onFocus={() => focus('lote', loteRow.current)}
                  onBlur={() => blur('lote', loteRow.current)}
                  placeholder="Ex.: TV88321"
                  hint={suggestion.lote.value ? 'Lido da foto. Confira com o recorte.' : 'Só letras e números.'}
                  value={values.lote}
                  onChangeText={(text) => onChange({ lote: normalizeLote(text) })}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={LOTE_MAX_LENGTH}
                  error={errors?.lote}
                />
              </View>
            </View>

            <Button
              label={missingIdentity ? 'Escolher vacina e dose' : 'Editar vacina, dose e todos os campos'}
              icon={missingIdentity ? 'list-outline' : 'create-outline'}
              variant={missingIdentity ? 'primary' : 'link'}
              onPress={onEdit}
              style={missingIdentity ? undefined : styles.editLink}
            />
          </>
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  cardError: {
    borderColor: colors.danger,
    borderWidth: 2,
  },
  cardOff: {
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  // Altura mínima: com a fonte ampliada, a caixa cresce com o número
  number: {
    minWidth: 36,
    minHeight: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  numberError: {
    backgroundColor: colors.dangerSoft,
  },
  numberText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.primary,
  },
  numberTextError: {
    color: colors.danger,
  },
  flex: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: fonts.semibold,
    fontSize: 17,
    lineHeight: 24,
    color: colors.primaryDark,
  },
  printed: {
    ...typography.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  identityText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.danger,
  },
  // Recorte ao lado do campo; em telas estreitas ou com fonte ampliada, o campo desce
  fieldRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  // Em foco: recorte e campo empilhados, na largura toda (o flexBasis da linha viraria altura na coluna)
  fieldRowFocused: {
    flexDirection: 'column',
    flexWrap: 'nowrap',
    alignItems: 'stretch',
    gap: spacing.sm,
  },
  stacked: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto',
    minWidth: 0,
  },
  crop: {
    flexGrow: 1,
    flexBasis: 120,
  },
  field: {
    flexGrow: 2,
    flexBasis: 170,
    minWidth: 0,
  },
  editLink: {
    alignSelf: 'flex-start',
    marginLeft: -spacing.sm,
  },
});
