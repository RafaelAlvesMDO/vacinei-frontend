// Limite do RF001 (POST /users)
export const EMAIL_MAX_LENGTH = 100;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Valida o e-mail no cliente. Retorna a mensagem de erro ou null se for válido
 */
export function validateEmail(value: string): string | null {
  const email = value.trim();
  if (!email) return 'Informe seu e-mail.';
  if (!EMAIL_REGEX.test(email)) return 'Informe um e-mail válido, como nome@email.com.';
  if (email.length > EMAIL_MAX_LENGTH) return `O e-mail deve ter no máximo ${EMAIL_MAX_LENGTH} caracteres.`;
  return null;
}
