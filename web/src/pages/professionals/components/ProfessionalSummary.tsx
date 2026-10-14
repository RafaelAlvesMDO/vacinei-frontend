import React from 'react';
import { BadgeCheck, Mail, UserRound } from 'lucide-react';
import type { Professional } from '../../../types/professional';
import { formatRegistry } from '../../../utils/councils';

// Dados cadastrais do profissional exibidos nos modais de verificação e recusa
export const ProfessionalSummary: React.FC<{ professional: Professional }> = ({ professional }) => (
  <dl className="grid grid-cols-1 gap-3 rounded-xl bg-surface p-4 text-sm">
    <div className="flex items-start gap-2">
      <UserRound className="size-4 shrink-0 mt-0.5 text-primary" />
      <div className="min-w-0">
        <dt className="text-xs text-muted">Nome</dt>
        <dd className="font-semibold text-primary-dark break-words">{professional.name}</dd>
      </div>
    </div>
    <div className="flex items-start gap-2">
      <Mail className="size-4 shrink-0 mt-0.5 text-primary" />
      <div className="min-w-0">
        <dt className="text-xs text-muted">E-mail</dt>
        <dd className="font-semibold text-primary-dark break-all">{professional.email}</dd>
      </div>
    </div>
    <div className="flex items-start gap-2">
      <BadgeCheck className="size-4 shrink-0 mt-0.5 text-primary" />
      <div className="min-w-0">
        <dt className="text-xs text-muted">Registro profissional</dt>
        <dd className="font-semibold text-primary-dark break-words">{formatRegistry(professional.registry)}</dd>
      </div>
    </div>
  </dl>
);

export default ProfessionalSummary;
