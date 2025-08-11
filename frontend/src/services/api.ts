import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// (opsional) auto-refresh kalau server sediain /auth/refresh yang set cookie baru
let isRefreshing = false as boolean;
let queue: Array<() => void> = [];

// Response interceptor untuk handle auth errors
api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const cfg = error.config || {};
    if (error.response?.status === 401 && !cfg._retry) {
      cfg._retry = true;

      // Cegah banyak refresh bersamaan
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          await api.post('/auth/refresh'); // server set cookie baru
          queue.forEach((cb) => cb());
          queue = [];
          return api(cfg);
        } catch (e) {
          queue = [];
          // Biarkan caller handle (mis. logout)
          return Promise.reject(e);
        } finally {
          isRefreshing = false;
        }
      }

      // Tunda request sampai refresh selesai
      return new Promise((resolve, reject) => {
        queue.push(async () => {
          try {
            resolve(await api(cfg));
          } catch (err) {
            reject(err);
          }
        });
      });
    }
    return Promise.reject(error);
  }
);

export default api;
