import React, { useState } from 'react';
import {
  AlertCircle,
  BadgeCheck,
  CalendarDays,
  IdCard,
  Info,
  Loader2,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  Stethoscope,
  UserRound,
} from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { Card } from '../../../components/ui/Card';
import { FormField } from '../../../components/ui/FormField';
import { parseApiError, updateOwnName } from '../../../services/auth';
import type { OwnUser } from '../../../types/user';
import { formatRegistry } from '../../../utils/councils';
import { formatCpf } from '../../../utils/cpf';
import { formatCalendarDate, formatPhone } from '../../../utils/format';
import { NAME_MAX_LENGTH, normalizeName, validateFullName } from '../../../utils/name';
import { ROLE_LABELS } from '../../../utils/roles';
import { getCategoryLabel, getVerificationStatus, VERIFICATION_DISPLAY } from '../../users/utils';

const IDENTITY_CHECK_NOTICE = 'A alteração exige verificação de identidade (RF003) e estará disponível em breve.';

interface ReadOnlyItemProps {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
  note?: string;
}

// Dado exibido somente para leitura, com aviso opcional abaixo do valor
const ReadOnlyItem: React.FC<ReadOnlyItemProps> = ({ icon: Icon, label, children, note }) => (
  <div className="flex items-start gap-3 rounded-xl border border-border bg-background/60 px-4 py-3">
    <Icon className="size-5 shrink-0 text-muted mt-0.5" />
    <div className="min-w-0">
      <dt className="text-xs font-medium text-muted">{label}</dt>
      <dd className="text-sm font-semibold text-primary-dark break-words">{children}</dd>
      {note && (
        <p className="mt-1 flex items-start gap-1 text-xs text-muted">
          <Info className="size-3.5 shrink-0 mt-px" />
          <span>{note}</span>
        </p>
      )}
    </div>
  </div>
);

interface PersonalDataCardProps {
  user: OwnUser;
  onNameSaved: (name: string) => void;
}

export const PersonalDataCard: React.FC<PersonalDataCardProps> = ({ user, onNameSaved }) => {
  const [name, setName] = useState(user.name);
  const [nameError, setNameError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const hasChanged = normalizeName(name) !== user.name;
  const registry = user.professionalRegistry;
  const verification = registry ? VERIFICATION_DISPLAY[getVerificationStatus(registry)] : null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);

    const validationError = validateFullName(name);
    setNameError(validationError);
    if (validationError || !hasChanged) return;

    setIsSaving(true);
    try {
      const updated = await updateOwnName(normalizeName(name));
      setName(updated.name);
      onNameSaved(updated.name);
    } catch (error) {
      const parsed = parseApiError(error, 'Não foi possível salvar o nome. Tente novamente.');
      if (parsed.fieldErrors.name) setNameError(parsed.fieldErrors.name);
      else setSubmitError(parsed.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card title="Dados pessoais" description="Somente o nome pode ser alterado por aqui.">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex-1">
          <FormField
            id="profile-name"
            label="Nome completo"
            icon={UserRound}
            autoComplete="name"
            maxLength={NAME_MAX_LENGTH}
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setNameError(null);
            }}
            disabled={isSaving}
            error={nameError ?? undefined}
          />
        </div>
        <button
          type="submit"
          disabled={isSaving || !hasChanged}
          className="sm:mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {isSaving ? 'Salvando...' : 'Salvar nome'}
        </button>
      </form>

      {submitError && (
        <p
          role="alert"
          className="mt-3 flex items-start gap-2 rounded-xl border border-danger/20 bg-danger-soft p-3 text-sm text-danger"
        >
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <span>{submitError}</span>
        </p>
      )}

      <dl className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
        <ReadOnlyItem icon={Mail} label="E-mail" note={IDENTITY_CHECK_NOTICE}>
          {user.email}
        </ReadOnlyItem>
        <ReadOnlyItem icon={Phone} label="Celular" note={IDENTITY_CHECK_NOTICE}>
          {user.phone ? formatPhone(user.phone) : 'Não informado'}
        </ReadOnlyItem>
        <ReadOnlyItem icon={IdCard} label="CPF">
          {user.cpf ? formatCpf(user.cpf) : 'Não informado'}
        </ReadOnlyItem>
        <ReadOnlyItem icon={CalendarDays} label="Data de nascimento">
          {formatCalendarDate(user.birthDate)}
        </ReadOnlyItem>
        <ReadOnlyItem icon={ShieldCheck} label="Perfil">
          {ROLE_LABELS[user.role]}
        </ReadOnlyItem>
      </dl>

      {registry && verification && (
        <div className="mt-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-primary-dark">Registro profissional</h3>
            <Badge variant={verification.variant}>{verification.label}</Badge>
          </div>
          <dl className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <ReadOnlyItem icon={Stethoscope} label="Categoria">
              {getCategoryLabel(registry.category)}
            </ReadOnlyItem>
            <ReadOnlyItem icon={BadgeCheck} label="Conselho">
              {registry.council}
            </ReadOnlyItem>
            <ReadOnlyItem icon={IdCard} label="Registro / UF">
              {formatRegistry(registry)}
            </ReadOnlyItem>
          </dl>
        </div>
      )}
    </Card>
  );
};

export default PersonalDataCard;
