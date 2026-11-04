import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  Banner,
  Button,
  ConfirmDialog,
  FilterChips,
  Screen,
  StepHeader,
  TextField,
  type FilterOption,
} from '@/components/ui';
import { parseApiError } from '@/services/auth';
import { createDependent, updateDependent } from '@/services/dependents';
import { colors, fonts, spacing, typography } from '@/theme';
import type { Dependent, Relationship, Sex } from '@/types/dependent';
import { formatCpf } from '@/utils/cpf';
import {
  ADULT_RULE_MESSAGE,
  EMPTY_DEPENDENT_FORM,
  RELATIONSHIP_LABELS,
  RELATIONSHIPS,
  SEX_LABELS,
  SEXES,
  toDependentForm,
  toDependentPayload,
  validateDependentForm,
  type DependentField,
  type DependentFormErrors,
  type DependentFormValues,
} from '@/utils/dependents';
import { formatDateInput } from '@/utils/format';
import { NAME_MAX_LENGTH } from '@/utils/name';

const API_FIELDS: DependentField[] = ['name', 'birthDate', 'sex', 'cpf', 'relationship'];

const SEX_OPTIONS: FilterOption<Sex | ''>[] = SEXES.map((sex) => ({ value: sex, label: SEX_LABELS[sex] }));
const RELATIONSHIP_OPTIONS: FilterOption<Relationship | ''>[] = RELATIONSHIPS.map((value) => ({
  value,
  label: RELATIONSHIP_LABELS[value],
}));

interface Props {
  // Na edição, o dependente atual; sem ele, cadastro
  dependent?: Dependent | null;
  onSaved: (dependent: Dependent) => void;
  onExit: () => void;
}

/**
 * Cadastro e edição de dependente (RF012, D33): nome, nascimento, sexo, CPF opcional e parentesco.
 * Mostra as respostas da API: 409 de duplicidade (RS008) e 400 de idade (menor de 18, exceto curatelado)
 */
export function DependentForm({ dependent = null, onSaved, onExit }: Props) {
  const isEditing = dependent !== null;
  const [values, setValues] = useState<DependentFormValues>(() =>
    dependent ? toDependentForm(dependent) : EMPTY_DEPENDENT_FORM,
  );
  const [errors, setErrors] = useState<DependentFormErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [duplicate, setDuplicate] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const setField = <K extends DependentField>(field: K, value: DependentFormValues[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleApiError = (reason: unknown) => {
    const parsed = parseApiError(reason, 'Não foi possível salvar o dependente. Tente novamente.');
    const fieldErrors: DependentFormErrors = {};
    for (const field of API_FIELDS) {
      if (parsed.fieldErrors[field]) fieldErrors[field] = parsed.fieldErrors[field];
    }

    if (parsed.status === 409) {
      // CPF já usado por qualquer pessoa; ou mesmo nome e nascimento para este responsável (RS008)
      if (parsed.message.toLowerCase().includes('cpf')) fieldErrors.cpf = parsed.message;
      else setDuplicate(parsed.message);
    } else if (parsed.status === 400 && Object.keys(fieldErrors).length === 0) {
      const text = parsed.message.toLowerCase();
      if (text.includes('18 anos')) fieldErrors.relationship = parsed.message;
      else if (text.includes('nascimento')) fieldErrors.birthDate = parsed.message;
      else setError(parsed.message);
    } else if (parsed.status === 404) {
      setError('Dependente não encontrado. Ele pode ter sido removido.');
    } else if (Object.keys(fieldErrors).length === 0) {
      setError(parsed.message);
    }

    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) setError('Confira os campos destacados.');
  };

  const submit = async () => {
    const found = validateDependentForm(values, dependent);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setError('Confira os campos destacados.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const payload = toDependentPayload(values);
      const saved = dependent ? await updateDependent(dependent.id, payload) : await createDependent(payload);
      onSaved(saved);
    } catch (reason) {
      handleApiError(reason);
    } finally {
      setSaving(false);
    }
  };

  const showAdultHint = values.relationship !== 'CURATELADO';

  return (
    <Screen
      header={
        <StepHeader
          title={isEditing ? 'Editar dependente' : 'Cadastrar dependente'}
          subtitle="Dados pessoais e vínculo"
          onBack={onExit}
        />
      }
      footer={
        <View style={styles.footer}>
          <Button
            label={isEditing ? 'Salvar alterações' : 'Salvar'}
            loadingLabel="Salvando..."
            icon="checkmark"
            loading={saving}
            onPress={() => void submit()}
          />
          <Text style={[styles.small, styles.center]}>* Campos obrigatórios</Text>
        </View>
      }
    >
      {error && <Banner tone="danger" title="Não foi possível salvar" message={error} />}

      <TextField
        label="Nome completo"
        required
        icon="person-outline"
        hint={`${values.name.length} de ${NAME_MAX_LENGTH} caracteres. Nome e sobrenome.`}
        value={values.name}
        onChangeText={(text) => setField('name', text)}
        autoCapitalize="words"
        autoCorrect={false}
        maxLength={NAME_MAX_LENGTH}
        editable={!saving}
        error={errors.name}
      />

      <TextField
        label="Data de nascimento"
        required
        icon="calendar-outline"
        hint={
          showAdultHint
            ? 'DD/MM/AAAA. Não pode ser futura. O dependente deve ter menos de 18 anos, exceto curatelado(a).'
            : 'DD/MM/AAAA. Não pode ser futura.'
        }
        value={values.birthDate}
        onChangeText={(text) => setField('birthDate', formatDateInput(text))}
        placeholder="DD/MM/AAAA"
        keyboardType="number-pad"
        maxLength={10}
        editable={!saving}
        error={errors.birthDate}
      />

      <ChoiceField
        label="Sexo"
        options={SEX_OPTIONS}
        selected={values.sex ?? ''}
        onChange={(value) => value && setField('sex', value)}
        error={errors.sex}
      />

      <TextField
        label="CPF"
        icon="card-outline"
        hint="Opcional. Crianças sem CPF podem ser cadastradas sem ele."
        value={values.cpf}
        onChangeText={(text) => setField('cpf', formatCpf(text))}
        placeholder="000.000.000-00"
        keyboardType="number-pad"
        maxLength={14}
        editable={!saving}
        error={errors.cpf}
      />

      <ChoiceField
        label="Parentesco"
        options={RELATIONSHIP_OPTIONS}
        selected={values.relationship ?? ''}
        onChange={(value) => value && setField('relationship', value)}
        error={errors.relationship}
        hint={values.relationship === 'CURATELADO' ? undefined : ADULT_RULE_MESSAGE}
      />

      <Banner
        tone="info"
        icon="lock-closed-outline"
        message="Os dados serão usados apenas para organizar a caderneta e o calendário vacinal. Só você vê os dados do dependente; profissionais de saúde verificados o encontram para conferir as doses."
      />

      <ConfirmDialog
        visible={duplicate !== null}
        icon="people-outline"
        title="Cadastro já existente"
        message={duplicate ?? ''}
        confirmLabel="Voltar e revisar"
        showCancel={false}
        onConfirm={() => setDuplicate(null)}
        onCancel={() => setDuplicate(null)}
      />
    </Screen>
  );
}

interface ChoiceFieldProps<T extends string> {
  label: string;
  options: FilterOption<T | ''>[];
  selected: T | '';
  onChange: (value: T | '') => void;
  error?: string;
  hint?: string;
}

// Escolha obrigatória em pílulas (sexo e parentesco), com rótulo e erro no padrão do TextField
function ChoiceField<T extends string>({ label, options, selected, onChange, error, hint }: ChoiceFieldProps<T>) {
  return (
    <View style={styles.choice}>
      <Text style={typography.label} importantForAccessibility="no" accessibilityElementsHidden>
        {label}
        <Text style={styles.required}> *</Text>
      </Text>
      <FilterChips
        accessibilityLabel={error ? `${label}, obrigatório. ${error}` : `${label}, obrigatório`}
        options={options}
        selected={selected}
        onChange={onChange}
      />
      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : (
        hint && <Text style={styles.small}>{hint}</Text>
      )}
    </View>
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
  choice: {
    gap: spacing.sm,
  },
  required: {
    color: colors.danger,
  },
  error: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.danger,
  },
});
