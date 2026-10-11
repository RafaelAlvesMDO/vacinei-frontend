import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLElement> {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ title, description, action, className = '', children, ...props }) => (
  <section
    className={`bg-white rounded-2xl border border-border shadow-sm p-5 sm:p-6 flex flex-col ${className}`}
    {...props}
  >
    {(title || action) && (
      <header className="flex items-start justify-between gap-3 mb-4">
        <div>
          {title && <h2 className="text-base font-semibold text-primary-dark">{title}</h2>}
          {description && <p className="text-sm text-muted mt-0.5">{description}</p>}
        </div>
        {action}
      </header>
    )}
    {children}
  </section>
);

export default Card;
