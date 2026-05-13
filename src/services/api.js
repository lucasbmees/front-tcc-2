// src/services/api.js
const BASE_URL = import.meta.env.VITE_API_URL || ''; 

export const apiRequest = async (endpoint, options = {}) => {
  // Se o endpoint não começar com /api, nós adicionamos (opcional, dependendo de como você prefere escrever)
  // Mas o ideal é passar o caminho completo no componente: apiRequest('/api/auth/register')
  const url = `${BASE_URL}${endpoint}`;
  
  const defaultOptions = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  return await fetch(url, defaultOptions);
};