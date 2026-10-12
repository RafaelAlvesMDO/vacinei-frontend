import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeftRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Loader2,
  Plus,
  UserRound,
  X,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { CardEmpty, CardError, CardLoading } from '../../../components/ui/CardState';
import { StatCard } from '../../../components/ui/StatCard';
import { useAsync } from '../../../hooks/useAsync';
import { useAuth } from '../../../hooks/useAuth';
import { getVaccinationCard } from '../../../services/citizens';
import { listVaccines } from '../../../services/vaccines';
import type { CardVaccine, ConfirmDoseResult, VaccineScheduleStatus } from '../../../types/vaccination';
import { formatCalendarDate, formatNumber } from '../../../utils/format';
import { ConfirmDoseModal } from './ConfirmDoseModal';
import { VaccineCardItem } from './VaccineCardItem';

const FEEDBACK_DURATION_MS = 8000;

// Atrasadas primeiro, depois em dia e completas
const STATUS_ORDER: Record<VaccineScheduleStatus, number> = { ATRASADA: 0, EM_DIA: 1, COMPLETA: 2 };

const FEEDBACK_TITLES: Record<ConfirmDoseResult['action'], string> = {
  CREATED: 'Dose registrada',
  CONFIRMED_EXISTING: 'Registro do cidadão confirmado',
};

interface Feedback {
  title: string;
  detail: string;
  vaccineId: string;
}

function calculateAge(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getUTCFullYear();
  const hasHadBirthday =
    today.getMonth() > birth.getUTCMonth() ||
    (today.getMonth() === birth.getUTCMonth() && today.getDate() >= birth.getUTCDate());
  if (!hasHadBirthday) age -= 1;
  return age;
}

function sortVaccines(vaccines: CardVaccine[]): CardVaccine[] {
  return [...vaccines].sort(
    (a, b) =>
      STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.vaccine.name.localeCompare(b.vaccine.name, 'pt-BR')
  );
}

interface CitizenVaccinationCardProps {
  citizenId: string;
}

// Caderneta do cidadão com confirmação presencial de doses (RF010)
export const CitizenVaccinationCard: React.FC<CitizenVaccinationCardProps> = ({ citizenId }) => {
  const { user, refreshProfile } = useAuth();

  const fetchCard = useCallback(() => getVaccinationCard(citizenId), [citizenId]);
  const card = useAsync(fetchCard, 'Não foi possível carregar a caderneta do cidadão.');
  const catalog = useAsync(listVaccines, 'Não foi possível carregar o catálogo de vacinas.');

  // undefined = modal fechado; null = registrar qualquer vacina; string = vacina sugerida
  const [modalVaccineId, setModalVaccineId] = useState<string | null | undefined>(undefined);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  // 403: a verificação do profissional mudou desde o login; sincroniza o perfil
  const isForbidden = card.error?.status === 403;
  useEffect(() => {
    if (isForbidden) refreshProfile().catch(() => undefined);
  }, [isForbidden, refreshProfile]);

  useEffect(() => {
    if (!feedback) return;
    const timeout = window.setTimeout(() => setFeedback(null), FEEDBACK_DURATION_MS);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  const sortedVaccines = useMemo(() => sortVaccines(card.data?.vaccines ?? []), [card.data]);

  const closeModal = useCallback(() => setModalVaccineId(undefined), []);

  const handleSuccess = (result: ConfirmDoseResult) => {
    const { dose, lotNumber } = result.record;
    setModalVaccineId(undefined);
    setFeedback({
      title: FEEDBACK_TITLES[result.action],
      detail: `${dose.vaccine.name} · ${dose.doseName}${lotNumber ? ` · Lote ${lotNumber}` : ''}`,
      vaccineId: dose.vaccine.id,
    });
    card.reload();
  };

  if (!card.data) {
    if (card.isLoading) {
      return (
        <Card>
          <CardLoading label="Carregando caderneta..." />
        </Card>
      );
    }

    const isNotFound = card.error?.status === 404 || card.error?.status === 400;
    return (
      <Card>
        <CardError
          message={isNotFound ? 'Cidadão não encontrado. Busque novamente pelo nome ou CPF.' : card.error?.message ?? ''}
          onRetry={isNotFound ? undefined : card.reload}
        />
      </Card>
    );
  }

  const { citizen, summary } = card.data;
  const age = calculateAge(citizen.birthDate);

  return (
    <div className="flex flex-col gap-6">
      {feedback && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-2xl border border-success/30 bg-success-soft p-4 text-success shadow-sm animate-in fade-in slide-in-from-top-2 duration-300"
        >
          <CheckCircle2 className="size-6 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{feedback.title}</p>
            <p className="text-sm">{feedback.detail}</p>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            aria-label="Fechar aviso"
            className="rounded-full p-1 hover:bg-white/60 cursor-pointer focus:outline-none focus:ring-2 focus:ring-success/30"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      <Card>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-surface text-primary">
              <UserRound className="size-6" />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-primary-dark truncate">{citizen.name}</h2>
              <p className="text-sm text-muted">
                Nasc. {formatCalendarDate(citizen.birthDate)}
                {age !== null && ` · ${age} ${age === 1 ? 'ano' : 'anos'}`}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              to="/confirmar-vacina"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold text-primary-dark hover:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <ArrowLeftRight className="size-4" />
              Trocar cidadão
            </Link>
            <button
              type="button"
              onClick={() => setModalVaccineId(null)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-dark active:scale-[0.98] transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <Plus className="size-4" />
              Registrar outra vacina
            </button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:gap-6">
        <StatCard title="Vacinas em dia" icon={Clock} value={formatNumber(summary.emDia)} />
        <StatCard
          title="Vacinas atrasadas"
          icon={AlertTriangle}
          variant={summary.atrasadas > 0 ? 'danger' : 'default'}
          value={formatNumber(summary.atrasadas)}
        />
        <StatCard title="Vacinas completas" icon={CheckCircle2} value={formatNumber(summary.completas)} />
      </div>

      <Card
        title="Caderneta de vacinação"
        description={`${formatNumber(summary.totalVaccines)} ${summary.totalVaccines === 1 ? 'vacina registrada' : 'vacinas registradas'}`}
        action={
          card.isLoading ? (
            <span role="status" className="flex items-center gap-1.5 text-xs text-muted">
              <Loader2 className="size-4 animate-spin text-primary" />
              Atualizando...
            </span>
          ) : undefined
        }
      >
        {sortedVaccines.length === 0 ? (
          <CardEmpty
            icon={BookOpen}
            message="Nenhuma vacina registrada na caderneta. Use “Registrar outra vacina” para lançar a primeira dose."
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {sortedVaccines.map((item) => (
              <VaccineCardItem
                key={item.vaccine.id}
                item={item}
                isHighlighted={feedback?.vaccineId === item.vaccine.id}
                onConfirm={setModalVaccineId}
              />
            ))}
          </ul>
        )}
      </Card>

      {modalVaccineId !== undefined && (
        <ConfirmDoseModal
          citizen={citizen}
          cardVaccines={card.data.vaccines}
          catalog={catalog}
          initialVaccineId={modalVaccineId}
          professionalName={user?.name ?? '—'}
          onClose={closeModal}
          onSuccess={handleSuccess}
          onConflict={card.reload}
        />
      )}
    </div>
  );
};

export default CitizenVaccinationCard;
