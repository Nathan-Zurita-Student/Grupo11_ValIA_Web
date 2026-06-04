import axios from 'axios';

// URL da API. Em produção, defina NEXT_PUBLIC_API_URL no ambiente.
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

const api = axios.create({ baseURL: BASE_URL });

// Anexa o token JWT (guardado no navegador) em todas as requisições.
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('valia:token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

// ─── Serviços ────────────────────────────────────────────────────────────
export const authService = {
  register: (data) => api.post('/auth/register', data).then((r) => r.data),
  login: (data) => api.post('/auth/login', data).then((r) => r.data),
};

export const productService = {
  list: (pantryId, category) =>
    api
      .get(`/pantries/${pantryId}/products`, { params: category ? { category } : {} })
      .then((r) => r.data),
  create: (pantryId, product) =>
    api.post(`/pantries/${pantryId}/products`, product).then((r) => r.data),
  resolve: (pantryId, productId, action) =>
    api.patch(`/pantries/${pantryId}/products/${productId}/resolve`, { action }).then((r) => r.data),
  report: (pantryId) => api.get(`/pantries/${pantryId}/report`).then((r) => r.data),
};
