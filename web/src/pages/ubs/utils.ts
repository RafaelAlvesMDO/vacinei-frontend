import type { Ubs } from '../../types/ubs';

/**
 * Endereço resumido: "Rua Belo Horizonte, 123"
 */
export function formatUbsAddress(ubs: Pick<Ubs, 'address' | 'number'>): string {
  return ubs.number ? `${ubs.address}, ${ubs.number}` : ubs.address;
}

/**
 * Minúsculas e sem acentos, para a busca por nome ou bairro: "pajucara" encontra "Pajuçara"
 */
export function normalizeSearch(value: string): string {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
}
