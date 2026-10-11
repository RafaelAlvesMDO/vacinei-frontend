import React from 'react';
import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  label?: string;
  fullScreen?: boolean;
}

export const Spinner: React.FC<SpinnerProps> = ({ label = 'Carregando...', fullScreen = false }) => (
  <div
    role="status"
    className={`flex flex-col items-center justify-center gap-3 text-muted ${
      fullScreen ? 'min-h-screen w-full bg-background' : 'py-12'
    }`}
  >
    <Loader2 className="size-8 animate-spin text-primary" />
    <span className="text-sm font-medium">{label}</span>
  </div>
);

export default Spinner;
