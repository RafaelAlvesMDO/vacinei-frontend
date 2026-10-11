import React from 'react';
import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  label?: string;
  fullScreen?: boolean;
}

export const Spinner: React.FC<SpinnerProps> = ({ label = 'Carregando...', fullScreen = false }) => (
  <div
    role="status"
    className={`flex flex-col items-center justify-center gap-3 text-slate-500 ${
      fullScreen ? 'min-h-screen w-full bg-slate-50' : 'py-12'
    }`}
  >
    <Loader2 className="size-8 animate-spin text-sky-600" />
    <span className="text-sm font-medium">{label}</span>
  </div>
);

export default Spinner;
