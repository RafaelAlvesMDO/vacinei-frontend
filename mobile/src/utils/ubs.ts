import { Linking, Platform } from 'react-native';
import type { Coords, Ubs } from '@/types/ubs';
import { normalizeSearch, onlyDigits } from './format';

/**
 * Distância em km com uma casa decimal: 1.234 → "1,2 km"
 */
export function formatDistance(km: number): string {
  return `${km.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`;
}

/**
 * Logradouro, número e bairro: "Rua do Campo, s/n · Bom Parto"
 */
export function formatStreet(ubs: Ubs): string {
  const street = `${ubs.address}, ${ubs.number}`;
  return ubs.neighborhood ? `${street} · ${ubs.neighborhood}` : street;
}

/**
 * Endereço completo (RF008 nota 1): "Rua do Campo, s/n · Bom Parto · Maceió — AL · CEP 57000-000"
 */
export function formatFullAddress(ubs: Ubs): string {
  const parts = [formatStreet(ubs), `${ubs.city} — ${ubs.state}`];
  if (ubs.zipCode) parts.push(`CEP ${ubs.zipCode}`);
  return parts.join(' · ');
}

/**
 * Busca por nome, bairro, logradouro ou CEP, sem acentos (RF008 nota 7): "pajucara" encontra "Pajuçara"
 */
export function matchesUbsSearch(ubs: Ubs, search: string): boolean {
  const term = normalizeSearch(search);
  if (!term) return true;
  return [ubs.name, ubs.neighborhood, ubs.address, ubs.zipCode].some(
    (text) => text !== null && normalizeSearch(text).includes(term),
  );
}

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Distância em linha reta (haversine), a mesma conta do backend. Usada no detalhe aberto pela caderneta,
 * que não passa pela lista ordenada pela API
 */
export function distanceKm(from: Coords, to: Coords): number {
  const dLat = toRadians(to.latitude - from.latitude);
  const dLon = toRadians(to.longitude - from.longitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(from.latitude)) * Math.cos(toRadians(to.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

/**
 * Abre a discagem com o número da UBS (RF008 nota 5)
 */
export function callUbs(phone: string): Promise<void> {
  return Linking.openURL(`tel:${onlyDigits(phone)}`);
}

/**
 * "Como chegar": abre o app de mapas do celular com o destino. No Android, o `geo:` deixa a pessoa
 * escolher o app; no iOS, o Apple Maps. Se nada abrir, a rota vai para o Google Maps no navegador
 */
export async function openDirections(ubs: Ubs): Promise<void> {
  const destination = `${ubs.latitude},${ubs.longitude}`;
  const label = encodeURIComponent(ubs.name);
  const nativeUrl =
    Platform.OS === 'ios'
      ? `http://maps.apple.com/?daddr=${destination}&q=${label}`
      : `geo:${destination}?q=${destination}(${label})`;

  try {
    await Linking.openURL(nativeUrl);
  } catch {
    await Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${destination}`);
  }
}
