import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ExternalLink,
  Hash,
  Info,
  Landmark,
  Loader2,
  MapPin,
  MapPinned,
  Navigation,
  Phone,
  Route,
  Save,
} from 'lucide-react';
import { FormField, FormSelect } from '../../../components/ui/FormField';
import { Modal } from '../../../components/ui/Modal';
import { parseApiError } from '../../../services/auth';
import { createUbs, updateUbs } from '../../../services/ubs';
import { lookupCep } from '../../../services/viaCep';
import type { Ubs, UbsPayload } from '../../../types/ubs';
import { BRAZILIAN_UFS } from '../../../utils/councils';
import { formatCep, formatPhone, onlyDigits } from '../../../utils/format';
import {
  createSlot,
  formatOpeningHours,
  parseOpeningHours,
  slotFromLegacy,
  validateSlots,
  type OpeningSlot,
} from '../openingHours';
import { OpeningHoursField } from './OpeningHoursField';

interface UbsFormModalProps {
  // Sem `ubs`, o modal cadastra uma nova UBS
  ubs?: Ubs;
  onClose: () => void;
  onSuccess: (ubs: Ubs, mode: 'created' | 'updated') => void;
  // 404: a UBS editada não existe mais
  onOutdated: (message: string) => void;
}

interface FormValues {
  name: string;
  cnes: string;
  zipCode: string;
  address: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  openingHours: OpeningSlot[];
  phone: string;
  latitude: string;
  longitude: string;
}

type FieldName = keyof FormValues;
type TextFieldName = Exclude<FieldName, 'openingHours'>;
type FieldErrors = Partial<Record<FieldName, string>>;
type CepStatus = 'idle' | 'loading' | 'found' | 'not-found';

// A maioria das UBS cadastradas é de Maceió/AL
const DEFAULT_CITY = 'Maceió';
const DEFAULT_STATE = 'AL';
// Segunda a sexta, das 07:00 às 17:00 (horário mais comum entre as UBS)
const DEFAULT_SLOT = { days: [0, 1, 2, 3, 4], opensAt: '07:00', closesAt: '17:00' };
const CEP_LENGTH = 8;
const CNES_LENGTH = 7;
const NUMBER_MAX_LENGTH = 10;
const TEXT_MAX_LENGTH = 150;
const WITHOUT_NUMBER_REGEX = /^s\s*\/?\s*n\.?$/i;
// "-9.6658, -35.7353" colado no campo de latitude preenche as duas coordenadas
const COORDINATE_PAIR_REGEX = /^\s*(-?\d+\.\d+)\s*[,;]\s*(-?\d+\.\d+)\s*$/;
const OSM_DEFAULT_URL = 'https://www.openstreetmap.org/#map=13/-9.6498/-35.7089';
const GENERIC_ERROR = 'Não foi possível salvar a UBS. Tente novamente.';

const UF_OPTIONS = BRAZILIAN_UFS.map((uf) => ({ value: uf, label: uf }));
const FIELD_NAMES = new Set<string>([
  'name',
  'cnes',
  'zipCode',
  'address',
  'number',
  'neighborhood',
  'city',
  'state',
  'openingHours',
  'phone',
  'latitude',
  'longitude',
]);

function isFieldName(value: string): value is FieldName {
  return FIELD_NAMES.has(value);
}

function toFormValues(ubs?: Ubs): FormValues {
  if (!ubs) {
    return {
      name: '',
      cnes: '',
      zipCode: '',
      address: '',
      number: '',
      neighborhood: '',
      city: DEFAULT_CITY,
      state: DEFAULT_STATE,
      openingHours: [createSlot(DEFAULT_SLOT)],
      phone: '',
      latitude: '',
      longitude: '',
    };
  }

  const savedHours = ubs.openingHours ?? '';
  return {
    name: ubs.name,
    cnes: ubs.cnes ?? '',
    zipCode: formatCep(ubs.zipCode ?? ''),
    address: ubs.address,
    number: ubs.number,
    neighborhood: ubs.neighborhood ?? '',
    city: ubs.city,
    state: ubs.state,
    // Horário fora do padrão das faixas (dados antigos) é redefinido do zero
    openingHours: parseOpeningHours(savedHours) ?? [slotFromLegacy(savedHours)],
    phone: formatPhone(ubs.phone ?? ''),
    latitude: formatCoordinate(ubs.latitude),
    longitude: formatCoordinate(ubs.longitude),
  };
}

// Exibe com vírgula decimal, no padrão brasileiro: -9.6658 → "-9,6658"
function formatCoordinate(value: number): string {
  return String(value).replace('.', ',');
}

// Aceita vírgula como separador decimal ("-9,6658")
function parseCoordinate(value: string): number | null {
  const normalized = value.trim().replace(',', '.');
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeNumber(value: string): string {
  const trimmed = value.trim();
  return WITHOUT_NUMBER_REGEX.test(trimmed) ? 's/n' : trimmed;
}

function validateForm(values: FormValues, originalCnes: string | null): FieldErrors {
  const errors: FieldErrors = {};

  if (values.name.trim().length < 3) errors.name = 'Informe o nome da UBS.';

  if (values.cnes && values.cnes.length !== CNES_LENGTH) {
    errors.cnes = `O CNES tem ${CNES_LENGTH} dígitos.`;
  } else if (!values.cnes && originalCnes) {
    // CNES vazio não é enviado no PUT, então não há como removê-lo
    errors.cnes = 'O CNES não pode ser removido. Corrija o código, se necessário.';
  }

  if (onlyDigits(values.zipCode).length !== CEP_LENGTH) errors.zipCode = 'Informe o CEP com 8 dígitos.';
  if (values.address.trim().length < 3) errors.address = 'Informe o logradouro.';
  if (!values.number.trim()) errors.number = 'Informe o número ou “s/n”.';
  if (values.neighborhood.trim().length < 2) errors.neighborhood = 'Informe o bairro.';
  if (values.city.trim().length < 2) errors.city = 'Informe a cidade.';
  if (!values.state) errors.state = 'Selecione a UF.';

  const phoneDigits = onlyDigits(values.phone);
  if (phoneDigits && phoneDigits.length !== 10 && phoneDigits.length !== 11) {
    errors.phone = 'Informe o telefone com DDD: (DD) XXXX-XXXX ou (DD) 9XXXX-XXXX.';
  }

  const latitude = parseCoordinate(values.latitude);
  if (latitude === null) {
    errors.latitude = 'Informe a latitude.';
  } else if (latitude < -90 || latitude > 90) {
    errors.latitude = 'A latitude vai de -90 a 90.';
  }

  const longitude = parseCoordinate(values.longitude);
  if (longitude === null) {
    errors.longitude = 'Informe a longitude.';
  } else if (longitude < -180 || longitude > 180) {
    errors.longitude = 'A longitude vai de -180 a 180.';
  }

  return errors;
}

// Chamado só depois de validateForm: as coordenadas já são números válidos
function buildPayload(values: FormValues): UbsPayload {
  return {
    name: values.name.trim().replace(/\s+/g, ' '),
    zipCode: formatCep(values.zipCode),
    address: values.address.trim(),
    number: normalizeNumber(values.number),
    neighborhood: values.neighborhood.trim(),
    city: values.city.trim(),
    state: values.state,
    latitude: parseCoordinate(values.latitude) ?? 0,
    longitude: parseCoordinate(values.longitude) ?? 0,
    // Texto sempre gerado a partir das faixas, nunca digitado
    openingHours: formatOpeningHours(values.openingHours),
    // Telefone salvo com máscara, no mesmo formato do seed
    phone: values.phone ? formatPhone(values.phone) : undefined,
    cnes: values.cnes || undefined,
  };
}

// No PUT, envia só os campos alterados. Telefone apagado vira "" para ser removido
function buildChanges(next: UbsPayload, original: UbsPayload): Partial<UbsPayload> {
  const changes: Partial<UbsPayload> = {};
  const keys = Object.keys(next) as Array<keyof UbsPayload>;
  for (const key of keys) {
    if (next[key] !== original[key]) Object.assign(changes, { [key]: next[key] });
  }
  if (original.phone && !next.phone) changes.phone = '';
  return changes;
}

// Cadastro e edição de UBS pelo ADMIN (RF008 nota 8)
export const UbsFormModal: React.FC<UbsFormModalProps> = ({ ubs, onClose, onSuccess, onOutdated }) => {
  const isEditing = !!ubs;
  const [values, setValues] = useState<FormValues>(() => toFormValues(ubs));
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [slotErrors, setSlotErrors] = useState<Record<string, string>>({});
  const [cepStatus, setCepStatus] = useState<CepStatus>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Horário salvo fora do padrão das faixas, exibido como referência na edição
  const [legacyHours] = useState(() =>
    ubs?.openingHours && !parseOpeningHours(ubs.openingHours) ? ubs.openingHours : null
  );

  // Na edição, o CEP já salvo não é consultado de novo ao abrir o modal
  const lastCepRef = useRef(onlyDigits(ubs?.zipCode ?? ''));
  const cepControllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => cepControllerRef.current?.abort(), []);

  const clearErrors = (fields: FieldName[]) => {
    setFieldErrors((prev) => {
      if (!fields.some((field) => prev[field])) return prev;
      const next = { ...prev };
      for (const field of fields) delete next[field];
      return next;
    });
  };

  const setField = (field: TextFieldName, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    clearErrors([field]);
  };

  const handleSlotsChange = (slots: OpeningSlot[]) => {
    setValues((prev) => ({ ...prev, openingHours: slots }));
    setSlotErrors({});
    clearErrors(['openingHours']);
  };

  const handleCepChange = (raw: string) => {
    const formatted = formatCep(raw);
    setField('zipCode', formatted);

    const digits = onlyDigits(formatted);
    if (digits.length !== CEP_LENGTH) {
      cepControllerRef.current?.abort();
      lastCepRef.current = '';
      setCepStatus('idle');
      return;
    }
    if (digits === lastCepRef.current) return;

    lastCepRef.current = digits;
    cepControllerRef.current?.abort();
    const controller = new AbortController();
    cepControllerRef.current = controller;
    setCepStatus('loading');

    lookupCep(digits, controller.signal)
      .then((address) => {
        if (controller.signal.aborted) return;
        if (!address) {
          setCepStatus('not-found');
          return;
        }

        // Só substitui o que o ViaCEP trouxe (CEPs gerais de cidade vêm sem logradouro)
        const uf = BRAZILIAN_UFS.find((option) => option === address.state);
        setValues((prev) => ({
          ...prev,
          address: address.address || prev.address,
          neighborhood: address.neighborhood || prev.neighborhood,
          city: address.city || prev.city,
          state: uf ?? prev.state,
        }));
        clearErrors(['address', 'neighborhood', 'city', 'state']);
        setCepStatus('found');
      })
      .catch(() => undefined);
  };

  const handleLatitudeChange = (value: string) => {
    const pair = COORDINATE_PAIR_REGEX.exec(value);
    if (pair) {
      setValues((prev) => ({
        ...prev,
        latitude: formatCoordinate(Number(pair[1])),
        longitude: formatCoordinate(Number(pair[2])),
      }));
      clearErrors(['latitude', 'longitude']);
      return;
    }
    setField('latitude', value);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBannerError(null);

    const errors = validateForm(values, ubs?.cnes ?? null);
    const hoursErrors = validateSlots(values.openingHours);
    setFieldErrors(errors);
    setSlotErrors(hoursErrors);
    if (Object.keys(errors).length > 0 || Object.keys(hoursErrors).length > 0) return;

    const payload = buildPayload(values);
    let changes: Partial<UbsPayload> | null = null;
    if (ubs) {
      // Compara com o horário salvo de fato, que pode estar fora do padrão das faixas
      const original = { ...buildPayload(toFormValues(ubs)), openingHours: ubs.openingHours ?? '' };
      changes = buildChanges(payload, original);
      if (Object.keys(changes).length === 0) {
        setBannerError('Nenhuma alteração para salvar.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (ubs && changes) {
        onSuccess(await updateUbs(ubs.id, changes), 'updated');
      } else {
        onSuccess(await createUbs(payload), 'created');
      }
    } catch (error) {
      const parsed = parseApiError(error, GENERIC_ERROR);

      if (parsed.status === 404) {
        onOutdated('A UBS não foi encontrada. A lista foi atualizada.');
      } else if (parsed.status === 409) {
        setFieldErrors({ cnes: 'Já existe uma UBS com este CNES.' });
        setBannerError(parsed.message);
      } else if (parsed.status === 400 && Object.keys(parsed.fieldErrors).length > 0) {
        const mapped: FieldErrors = {};
        const unmapped: string[] = [];
        for (const [path, message] of Object.entries(parsed.fieldErrors)) {
          if (isFieldName(path)) mapped[path] = message;
          else unmapped.push(message);
        }
        setFieldErrors(mapped);
        setBannerError(unmapped.length > 0 ? unmapped.join(' ') : 'Confira os campos destacados.');
      } else {
        setBannerError(parsed.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const latitude = parseCoordinate(values.latitude);
  const longitude = parseCoordinate(values.longitude);
  const osmUrl =
    latitude !== null && longitude !== null
      ? `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=17/${latitude}/${longitude}`
      : OSM_DEFAULT_URL;

  const cepHint =
    cepStatus === 'loading' ? (
      'Buscando endereço...'
    ) : cepStatus === 'found' ? (
      <span className="inline-flex items-center gap-1">
        <CheckCircle2 className="size-3.5 text-success" />
        Endereço preenchido pelo ViaCEP. Confira e ajuste, se necessário.
      </span>
    ) : cepStatus === 'not-found' ? (
      'Não foi possível consultar este CEP. Preencha o endereço manualmente.'
    ) : (
      'Ao digitar o CEP, o endereço é preenchido automaticamente.'
    );

  const sectionTitleClasses = 'text-xs font-semibold uppercase tracking-wide text-muted';

  return (
    <Modal
      isOpen
      onClose={isSubmitting ? () => undefined : onClose}
      title={isEditing ? 'Editar UBS' : 'Nova UBS'}
      maxWidth="max-w-[640px]"
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
        {bannerError && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-danger/20 bg-danger-soft p-3 text-sm text-danger"
          >
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            {bannerError}
          </p>
        )}

        <fieldset className="flex min-w-0 flex-col gap-4" disabled={isSubmitting}>
          <legend className={`${sectionTitleClasses} mb-3`}>Identificação</legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_10rem]">
            <FormField
              id="ubs-name"
              label="Nome"
              icon={Building2}
              type="text"
              maxLength={TEXT_MAX_LENGTH}
              value={values.name}
              onChange={(e) => setField('name', e.target.value)}
              placeholder="Ex.: UBS Jacintinho"
              error={fieldErrors.name}
            />
            <FormField
              id="ubs-cnes"
              label="CNES (opcional)"
              icon={Hash}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              maxLength={CNES_LENGTH}
              value={values.cnes}
              onChange={(e) => setField('cnes', onlyDigits(e.target.value))}
              placeholder="0000000"
              error={fieldErrors.cnes}
            />
          </div>
        </fieldset>

        <fieldset className="flex min-w-0 flex-col gap-4" disabled={isSubmitting}>
          <legend className={`${sectionTitleClasses} mb-3`}>Endereço</legend>
          <FormField
            id="ubs-zip-code"
            label="CEP"
            icon={MapPin}
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            value={values.zipCode}
            onChange={(e) => handleCepChange(e.target.value)}
            placeholder="00000-000"
            error={fieldErrors.zipCode}
            hint={cepHint}
            trailing={
              cepStatus === 'loading' ? (
                <div className="pr-4 flex items-center" role="status" aria-label="Buscando endereço">
                  <Loader2 className="size-5 animate-spin text-primary" />
                </div>
              ) : undefined
            }
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_8rem]">
            <FormField
              id="ubs-address"
              label="Logradouro"
              icon={Route}
              type="text"
              maxLength={TEXT_MAX_LENGTH}
              value={values.address}
              onChange={(e) => setField('address', e.target.value)}
              placeholder="Rua, avenida..."
              error={fieldErrors.address}
            />
            <FormField
              id="ubs-number"
              label="Número"
              icon={Hash}
              type="text"
              maxLength={NUMBER_MAX_LENGTH}
              value={values.number}
              onChange={(e) => setField('number', e.target.value)}
              onBlur={(e) => setField('number', normalizeNumber(e.target.value))}
              placeholder="123 ou s/n"
              error={fieldErrors.number}
            />
          </div>
          <FormField
            id="ubs-neighborhood"
            label="Bairro"
            icon={MapPinned}
            type="text"
            maxLength={TEXT_MAX_LENGTH}
            value={values.neighborhood}
            onChange={(e) => setField('neighborhood', e.target.value)}
            placeholder="Ex.: Jacintinho"
            error={fieldErrors.neighborhood}
          />
          <div className="grid grid-cols-1 gap-4 min-[400px]:grid-cols-[minmax(0,1fr)_7rem]">
            <FormField
              id="ubs-city"
              label="Cidade"
              icon={Landmark}
              type="text"
              maxLength={TEXT_MAX_LENGTH}
              value={values.city}
              onChange={(e) => setField('city', e.target.value)}
              error={fieldErrors.city}
            />
            <FormSelect
              id="ubs-state"
              label="UF"
              placeholder="UF"
              options={UF_OPTIONS}
              value={values.state}
              onChange={(e) => setField('state', e.target.value)}
              error={fieldErrors.state}
            />
          </div>
        </fieldset>

        <fieldset className="flex min-w-0 flex-col gap-4" disabled={isSubmitting}>
          <legend className={`${sectionTitleClasses} mb-3`}>Atendimento</legend>
          <OpeningHoursField
            slots={values.openingHours}
            onChange={handleSlotsChange}
            slotErrors={slotErrors}
            error={fieldErrors.openingHours}
            legacyText={legacyHours}
            disabled={isSubmitting}
          />
          <div className="sm:max-w-[50%] sm:pr-2">
            <FormField
              id="ubs-phone"
              label="Telefone (opcional)"
              icon={Phone}
              type="tel"
              inputMode="numeric"
              autoComplete="off"
              value={values.phone}
              onChange={(e) => setField('phone', formatPhone(e.target.value))}
              placeholder="(82) 3315-0000"
              error={fieldErrors.phone}
            />
          </div>
        </fieldset>

        <fieldset className="flex min-w-0 flex-col gap-4" disabled={isSubmitting}>
          <legend className={`${sectionTitleClasses} mb-3`}>Localização</legend>
          <div className="grid grid-cols-1 gap-4 min-[400px]:grid-cols-2">
            <FormField
              id="ubs-latitude"
              label="Latitude"
              icon={Navigation}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={values.latitude}
              onChange={(e) => handleLatitudeChange(e.target.value)}
              placeholder="-9,6658"
              error={fieldErrors.latitude}
            />
            <FormField
              id="ubs-longitude"
              label="Longitude"
              icon={Navigation}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={values.longitude}
              onChange={(e) => setField('longitude', e.target.value)}
              placeholder="-35,7353"
              error={fieldErrors.longitude}
            />
          </div>
          <div className="flex items-start gap-2 rounded-xl bg-surface p-3 text-xs text-primary-dark">
            <Info className="size-4 shrink-0 text-primary" />
            <div className="flex flex-col gap-1.5">
              <p>
                No OpenStreetMap, clique com o botão direito sobre a UBS e escolha “Mostrar endereço”. As coordenadas
                aparecem no painel à esquerda, com ponto decimal (-9.6658, -35.7353). Aqui vale vírgula ou ponto, e se
                colar as duas na latitude, os campos são separados automaticamente.
              </p>
              <a
                href={osmUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 self-start font-semibold text-primary underline underline-offset-2 hover:text-primary-dark rounded focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {latitude !== null && longitude !== null ? 'Conferir no OpenStreetMap' : 'Abrir o OpenStreetMap'}
                <ExternalLink className="size-3.5" />
              </a>
            </div>
          </div>
        </fieldset>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="h-12 rounded-xl border border-border px-5 text-sm font-semibold text-primary-dark hover:bg-surface cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-white hover:bg-primary-dark active:scale-[0.98] transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {isSubmitting ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Cadastrar UBS'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default UbsFormModal;
