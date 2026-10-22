// Tokens de cor do docs/DESIGN.md (contraste AA conferido na tabela do documento)
export const colors = {
  primary: '#077A66',
  primaryDark: '#103B34',
  accent: '#047A80',
  surface: '#E8F4F0',
  background: '#F6F8F7',
  muted: '#5F6F6B',
  border: '#CFE0DA',
  input: '#7F948D',
  danger: '#B42318',
  dangerSoft: '#FEF3F2',
  warning: '#8F5B12',
  warningSoft: '#FDF5E6',
  success: '#077A66',
  successSoft: '#E8F4F0',
  white: '#FFFFFF',
  // primaryDark com 40% de opacidade, atrás das folhas de seleção
  overlay: 'rgba(16, 59, 52, 0.4)',
  // Fundo do ícone oficial (icone-vacinei.svg), usado no splash para emendar com o logo
  brand: '#087F6B',
} as const;

export type ColorToken = keyof typeof colors;
