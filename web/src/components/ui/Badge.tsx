import React from 'react';

export type BadgeVariant = 'success' | 'danger' | 'warning' | 'primary' | 'accent' | 'neutral';

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  success: 'bg-success-soft text-success border-success/20',
  danger: 'bg-danger-soft text-danger border-danger/20',
  warning: 'bg-warning-soft text-warning border-warning/25',
  primary: 'bg-primary text-white border-primary',
  accent: 'bg-accent/10 text-primary-dark border-accent/30',
  neutral: 'bg-background text-muted border-border',
};

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'neutral', className = '', children, ...props }) => (
  <span
    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${VARIANT_CLASSES[variant]} ${className}`}
    {...props}
  >
    {children}
  </span>
);

export default Badge;
