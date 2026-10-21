// Resposta do GET /health (rota pública, sem o envelope { status, data })
export interface HealthResponse {
  status: 'ok';
  timestamp: string;
  uptime: number;
}
