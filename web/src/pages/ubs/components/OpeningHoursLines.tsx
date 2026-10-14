import React from 'react';
import { splitOpeningHours } from '../openingHours';

interface OpeningHoursLinesProps {
  text: string | null;
  className?: string;
}

// Horário de funcionamento com cada faixa em uma linha ("Seg a Sex: 07:00 às 17:00")
export const OpeningHoursLines: React.FC<OpeningHoursLinesProps> = ({ text, className = '' }) => {
  const lines = text ? splitOpeningHours(text) : [];
  if (lines.length === 0) return <span className={className}>—</span>;

  return (
    <span className={`flex flex-col ${className}`}>
      {lines.map((line) => (
        <span key={line} className="whitespace-nowrap">
          {line}
        </span>
      ))}
    </span>
  );
};

export default OpeningHoursLines;
