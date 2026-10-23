// Objeto Ubs da API (GET /ubs e GET /ubs/:id)
export interface Ubs {
  id: string;
  cnes: string | null;
  name: string;
  zipCode: string | null;
  // Logradouro
  address: string;
  number: string;
  neighborhood: string | null;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  phone: string | null;
  // "Seg a Sex: 07:00 às 17:00 · Sáb: 07:00 às 14:00"
  openingHours: string | null;
  isActive: boolean;
  // Só quando a consulta envia latitude e longitude
  distanceKm?: number;
}

export interface Coords {
  latitude: number;
  longitude: number;
}
