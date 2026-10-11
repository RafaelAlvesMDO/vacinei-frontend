// Regra de senha RF001: mínimo de 8 caracteres, com ao menos 1 maiúscula,
// 1 minúscula, 1 número e 1 símbolo (mesma regra validada pelo backend)
export const PASSWORD_MIN_LENGTH = 8;

export interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

export const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  { label: `Mínimo de ${PASSWORD_MIN_LENGTH} caracteres`, test: (password) => password.length >= PASSWORD_MIN_LENGTH },
  { label: 'Uma letra maiúscula', test: (password) => /[A-Z]/.test(password) },
  { label: 'Uma letra minúscula', test: (password) => /[a-z]/.test(password) },
  { label: 'Um número', test: (password) => /\d/.test(password) },
  { label: 'Um símbolo (ex.: @, #, !)', test: (password) => /[^A-Za-z0-9]/.test(password) },
];

/**
 * Valida a senha segundo a RF001. Retorna a mensagem de erro ou null se for válida.
 */
export function validatePassword(password: string): string | null {
  if (!password) return 'Informe a nova senha.';

  const isValid = PASSWORD_REQUIREMENTS.every((requirement) => requirement.test(password));
  if (isValid) return null;

  return `A senha deve ter no mínimo ${PASSWORD_MIN_LENGTH} caracteres, com letra maiúscula, letra minúscula, número e símbolo.`;
}
