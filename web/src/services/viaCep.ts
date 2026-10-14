import type { CepAddress } from '../types/ubs';

const VIACEP_TIMEOUT_MS = 8000;

interface ViaCepResponse {
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean | string;
}

/**
 * Consulta o endereço de um CEP (8 dígitos) no ViaCEP. Usa fetch próprio, e não o
 * cliente `api`, para não enviar o token a um serviço externo. Retorna null se o CEP
 * não existir ou se o serviço falhar, e o preenchimento continua manual.
 */
export async function lookupCep(cep: string, signal?: AbortSignal): Promise<CepAddress | null> {
  const timeoutSignal = AbortSignal.timeout(VIACEP_TIMEOUT_MS);
  const combinedSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { signal: combinedSignal });
    if (!response.ok) return null;

    const data = (await response.json()) as ViaCepResponse;
    if (data.erro) return null;

    return {
      address: data.logradouro ?? '',
      neighborhood: data.bairro ?? '',
      city: data.localidade ?? '',
      state: data.uf ?? '',
    };
  } catch (error) {
    // O cancelamento pelo chamador é repassado; falhas de rede e timeout viram null
    if (signal?.aborted) throw error;
    return null;
  }
}
