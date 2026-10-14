import React from 'react';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';

export interface Feedback {
  variant: 'success' | 'warning';
  title: string;
  detail: string;
}

interface FeedbackBannerProps {
  feedback: Feedback;
  onClose: () => void;
}

// Aviso no topo da página após uma ação do usuário (RNF03)
export const FeedbackBanner: React.FC<FeedbackBannerProps> = ({ feedback, onClose }) => {
  const Icon = feedback.variant === 'warning' ? AlertTriangle : CheckCircle2;

  return (
    <div
      role="status"
      className={`flex items-start gap-3 rounded-2xl border p-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300 ${
        feedback.variant === 'warning'
          ? 'border-warning/25 bg-warning-soft text-warning'
          : 'border-success/30 bg-success-soft text-success'
      }`}
    >
      <Icon className="size-6 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{feedback.title}</p>
        <p className="text-sm">{feedback.detail}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar aviso"
        className="rounded-full p-1 hover:bg-white/60 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
      >
        <X className="size-4" />
      </button>
    </div>
  );
};

export default FeedbackBanner;
