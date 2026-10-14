// Regra de nome do RF001 (POST /users e PATCH /auth/me): nome e sobrenome, até 120 caracteres
export const NAME_MAX_LENGTH = 120;

/**
 * Remove espaços nas pontas e espaços repetidos entre as palavras
 */
export function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

/**
 * Valida o nome completo. Retorna a mensagem de erro ou null se for válido
 */
export function validateFullName(value: string): string | null {
  const name = normalizeName(value);

  if (!name) return 'Informe seu nome completo.';
  if (name.split(' ').length < 2) return 'Informe nome e sobrenome.';
  if (name.length > NAME_MAX_LENGTH) return `O nome deve ter no máximo ${NAME_MAX_LENGTH} caracteres.`;
  return null;
}
