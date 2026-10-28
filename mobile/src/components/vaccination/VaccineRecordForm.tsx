import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Banner, FilterChips, Icon, SelectField, TextField, type FilterOption, type SelectOption } from '@/components/ui';
import { colors, spacing, touchTarget, typography } from '@/theme';
import type { CardVaccine, CatalogVaccine } from '@/types/vaccination';
import { formatDateInput } from '@/utils/format';
import {
  getTakenDoseIds,
  LOTE_MAX_LENGTH,
  matchesCatalogSearch,
  normalizeLote,
  type RecordFormErrors,
  type RecordFormValues,
} from '@/utils/vaccineRecord';

// Acima disto, as sugestões pedem para refinar a busca
const MAX_SUGGESTIONS = 8;

interface Props {
  values: RecordFormValues;
  // Recebe só os campos alterados; quem controla o estado limpa o erro deles
  onChange: (patch: Partial<RecordFormValues>) => void;
  errors: RecordFormErrors;
  catalog: CatalogVaccine[];
  // Vacinas da caderneta, para sugerir a próxima dose e bloquear as já registradas
  cardVaccines: CardVaccine[];
  // Registro em edição: a dose dele não conta como já registrada
  editingRecordId: string | null;
  editable?: boolean;
}

/**
 * Campos do cadastro manual (RF005, RS003). Controlado e sem chamadas à API: serve ao cadastro,
 * à edição e, na etapa 8, à conferência dos dados lidos da caderneta (RF004, RNF12)
 */
export function VaccineRecordForm({
  values,
  onChange,
  errors,
  catalog,
  cardVaccines,
  editingRecordId,
  editable = true,
}: Props) {
  const selected = catalog.find((vaccine) => vaccine.id === values.vaccineId);
  const [query, setQuery] = useState(selected?.name ?? '');
  const taken = getTakenDoseIds(
    cardVaccines.find((item) => item.vaccine.id === selected?.id),
    editingRecordId,
  );

  const matches = catalog.filter((vaccine) => matchesCatalogSearch(vaccine, query));
  // A vacina escolhida continua entre as sugestões, destacada
  const suggestions = matches.slice(0, MAX_SUGGESTIONS);
  if (selected && !suggestions.includes(selected)) suggestions.unshift(selected);
  const chipOptions: FilterOption<string>[] = suggestions.map((vaccine) => ({ value: vaccine.id, label: vaccine.name }));

  const doseOptions: SelectOption<string>[] = (selected?.doses ?? []).map((dose) => ({
    value: dose.id,
    label: dose.doseName,
    description: taken.has(dose.id) ? 'Já está na sua caderneta' : undefined,
    disabled: taken.has(dose.id),
  }));

  const selectVaccine = (vaccineId: string) => {
    const vaccine = catalog.find((item) => item.id === vaccineId);
    if (!vaccine || vaccine.id === values.vaccineId) return;
    setQuery(vaccine.name);
    // Sem dose, quem controla o estado sugere a próxima pendente (`suggestDose`)
    onChange({ vaccineId: vaccine.id, doseId: null });
  };

  const changeQuery = (text: string) => {
    setQuery(text);
    // Ao mudar o texto, a escolha anterior deixa de valer
    if (values.vaccineId && text !== selected?.name) onChange({ vaccineId: null, doseId: null });
  };

  return (
    <View style={styles.container}>
      <View style={styles.group}>
        <TextField
          label="Nome da vacina"
          required
          placeholder="Busque pelo nome ou pela doença"
          hint={selected ? `Protege contra: ${selected.targetDisease}` : 'Toque em uma vacina da lista abaixo.'}
          value={query}
          onChangeText={changeQuery}
          autoCapitalize="none"
          autoCorrect={false}
          editable={editable}
          error={errors.vaccineId}
          trailing={
            query && editable ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Limpar a vacina"
                onPress={() => changeQuery('')}
                style={styles.clear}
              >
                <Icon name="close-circle" color={colors.muted} />
              </Pressable>
            ) : (
              <Icon name="search" color={colors.muted} />
            )
          }
        />
        {editable &&
          (chipOptions.length === 0 ? (
            <Text style={typography.muted} accessibilityLiveRegion="polite">
              Nenhuma vacina encontrada. Tente outro nome ou a doença.
            </Text>
          ) : (
            <>
              <FilterChips
                accessibilityLabel="Vacinas encontradas"
                options={chipOptions}
                selected={values.vaccineId ?? ''}
                onChange={selectVaccine}
              />
              {matches.length > MAX_SUGGESTIONS && (
                <Text style={styles.small}>
                  Mostrando {MAX_SUGGESTIONS} de {matches.length} vacinas. Digite para refinar a busca.
                </Text>
              )}
            </>
          ))}
      </View>

      <View style={styles.row}>
        <View style={styles.rowItem}>
          <SelectField
            label="Dose"
            required
            value={values.doseId}
            options={doseOptions}
            onChange={(doseId) => onChange({ doseId })}
            placeholder={selected ? 'Selecione' : 'Escolha a vacina'}
            disabled={!selected || !editable}
            error={errors.doseId}
          />
        </View>
        <View style={styles.rowItem}>
          <TextField
            label="Data de aplicação"
            required
            placeholder="DD/MM/AAAA"
            hint="Não pode ser uma data futura."
            icon="calendar-outline"
            value={values.applicationDate}
            onChangeText={(text) => onChange({ applicationDate: formatDateInput(text) })}
            keyboardType="number-pad"
            maxLength={10}
            editable={editable}
            error={errors.applicationDate}
          />
        </View>
      </View>

      <TextField
        label="Lote (opcional)"
        placeholder="Ex.: TV88321"
        hint="Está na caderneta, ao lado da vacina. Só letras e números."
        icon="create-outline"
        value={values.lote}
        onChangeText={(text) => onChange({ lote: normalizeLote(text) })}
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={LOTE_MAX_LENGTH}
        editable={editable}
        error={errors.lote}
      />

      <Banner tone="info" message="As doses disponíveis dependem da vacina escolhida. As que já estão na sua caderneta aparecem bloqueadas." />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  group: {
    gap: spacing.md,
  },
  clear: {
    minWidth: touchTarget,
    minHeight: touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -spacing.md,
  },
  small: {
    ...typography.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  // Dose e data lado a lado; em telas estreitas ou com fonte ampliada, uma embaixo da outra
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  rowItem: {
    flexGrow: 1,
    flexBasis: 150,
    minWidth: 0,
  },
});
