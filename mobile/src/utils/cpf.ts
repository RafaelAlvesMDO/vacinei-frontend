import { onlyDigits } from './format';

export const CPF_LENGTH = 11;

/**
 * Máscara de CPF durante a digitação: "52998224725" → "529.982.247-25"
 */
export function formatCpf(value: string): string {
  const digits = onlyDigits(value).slice(0, CPF_LENGTH);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

/**
 * Valida os dígitos verificadores (aceita com ou sem máscara). Sequências repetidas são inválidas (D14)
 */
export function isValidCpf(value: string): boolean {
  const digits = onlyDigits(value);
  if (digits.length !== CPF_LENGTH || /^(\d)\1{10}$/.test(digits)) return false;

  const numbers = digits.split('').map(Number);
  const checkDigit = (length: number) => {
    const sum = numbers.slice(0, length).reduce((total, digit, index) => total + digit * (length + 1 - index), 0);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };

  return checkDigit(9) === numbers[9] && checkDigit(10) === numbers[10];
}

/**
 * Termo de busca com cara de CPF: só dígitos, pontos, hífen e espaços
 */
export function looksLikeCpf(value: string): boolean {
  return /^[\d.\-\s]+$/.test(value) && /\d/.test(value);
}
