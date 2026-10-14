import React from 'react';
import type { Dose } from '../../../types/vaccination';
import { formatInterval, formatRecommendedAge } from '../utils';

interface DoseScheduleProps {
  doses: Dose[];
  id?: string;
}

// Esquema de doses só para leitura (lista e edição): a API não permite alterar as doses de uma vacina
export const DoseSchedule: React.FC<DoseScheduleProps> = ({ doses, id }) => {
  if (doses.length === 0) {
    return (
      <p id={id} className="rounded-xl bg-surface p-3 text-sm text-muted">
        Nenhuma dose cadastrada no esquema desta vacina.
      </p>
    );
  }

  return (
    <div id={id} className="overflow-hidden rounded-xl border border-border bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface text-xs font-semibold uppercase tracking-wide text-muted">
          <tr>
            <th scope="col" className="px-4 py-2.5">
              Dose
            </th>
            <th scope="col" className="px-4 py-2.5">
              Idade recomendada
            </th>
            <th scope="col" className="px-4 py-2.5">
              <span className="hidden sm:inline">Intervalo desde a anterior</span>
              <span className="sm:hidden">Intervalo</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {doses.map((dose) => (
            <tr key={dose.id}>
              <td className="px-4 py-2.5 align-top">
                <p className="font-semibold text-primary-dark">{dose.doseName}</p>
                {dose.description && <p className="text-xs text-muted">{dose.description}</p>}
              </td>
              <td className="px-4 py-2.5 align-top text-primary-dark">{formatRecommendedAge(dose.recommendedAgeMonths)}</td>
              <td className="px-4 py-2.5 align-top text-primary-dark">
                {formatInterval(dose.intervalDaysFromPrevious)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DoseSchedule;
