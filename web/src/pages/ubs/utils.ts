import type { Ubs } from '../../types/ubs';

/**
 * Endereço resumido: "Rua Belo Horizonte, 123"
 */
export function formatUbsAddress(ubs: Pick<Ubs, 'address' | 'number'>): string {
  return ubs.number ? `${ubs.address}, ${ubs.number}` : ubs.address;
}
