import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3333',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para injetar o Access Token JWT nas requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('@vacinei:token');

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Interceptor para tratamento de erros e expiração de sessão (401)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Sessão expirada ou não autorizada
      localStorage.removeItem('@vacinei:token');
      localStorage.removeItem('@vacinei:user');
    }

    return Promise.reject(error);
  }
);
