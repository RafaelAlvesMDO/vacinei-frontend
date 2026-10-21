// Espaçamentos em múltiplos de 4
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

// rounded-xl do web = 12
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 999,
} as const;

// Alvo de toque mínimo (RNF04) e altura dos campos (~48px, DESIGN.md)
export const touchTarget = 48;
