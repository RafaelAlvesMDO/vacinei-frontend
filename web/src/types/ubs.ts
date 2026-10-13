// Unidade Básica de Saúde (GET /ubs). Nunca é excluída, só desativada (D10)
export interface Ubs {
  id: string;
  cnes: string | null;
  name: string;
  // UBS antigas do seed podem não ter CEP, bairro ou horário
  zipCode: string | null;
  // Logradouro
  address: string;
  // Número do endereço ou "s/n"
  number: string;
  neighborhood: string | null;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  // Salvo com máscara, como no seed: "(82) 3312-5460"
  phone: string | null;
  openingHours: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Body do POST /ubs (RF008). No PUT, todos os campos são opcionais
export interface UbsPayload {
  name: string;
  zipCode: string;
  address: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  openingHours: string;
  phone?: string;
  cnes?: string;
}

// Resposta do ViaCEP já normalizada para o formulário
export interface CepAddress {
  address: string;
  neighborhood: string;
  city: string;
  state: string;
}
