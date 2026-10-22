import * as SecureStore from 'expo-secure-store';
import type { Ala } from '@/types/auth';

const LAST_ALA_KEY = 'vacinei.lastAla';

interface StoredAla {
  userId: string;
  ala: Ala;
}

function isAla(value: unknown): value is Ala {
  return value === 'cidadao' || value === 'profissional';
}

/**
 * Última ala escolhida pelo profissional (D23). Só vale para o mesmo usuário: outra conta no aparelho escolhe de novo
 */
export async function getLastAla(userId: string): Promise<Ala | null> {
  try {
    const json = await SecureStore.getItemAsync(LAST_ALA_KEY);
    if (!json) return null;
    const stored = JSON.parse(json) as Partial<StoredAla>;
    return stored.userId === userId && isAla(stored.ala) ? stored.ala : null;
  } catch {
    return null;
  }
}

/**
 * Preferência de navegação, mantida ao sair para o próximo login da mesma conta
 */
export async function saveLastAla(userId: string, ala: Ala): Promise<void> {
  try {
    await SecureStore.setItemAsync(LAST_ALA_KEY, JSON.stringify({ userId, ala } satisfies StoredAla));
  } catch {
    // Sem gravar, o profissional só escolhe a ala de novo no próximo login
  }
}
