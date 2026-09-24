import axios from 'axios';

const API = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  timeout: 30000, // ⚡ 10s se badhakar 30s karein
});

const GET_CACHE_TTL = 15000;
const getCache = new Map();
const pendingGets = new Map();
const originalGet = API.get.bind(API);

API.get = (url, config = {}) => {
  const key = `${url}?${JSON.stringify(config.params || {})}`;
  const cached = getCache.get(key);
  if (cached && Date.now() - cached.timestamp < GET_CACHE_TTL) {
    return Promise.resolve(cached.response);
  }
  if (pendingGets.has(key)) return pendingGets.get(key);

  const request = originalGet(url, config)
    .then((response) => {
      getCache.set(key, { response, timestamp: Date.now() });
      return response;
    })
    .finally(() => pendingGets.delete(key));

  pendingGets.set(key, request);
  return request;
};

API.interceptors.request.use((config) => {
  if (config.method && config.method.toLowerCase() !== 'get') getCache.clear();
  return config;
});

// Request interceptor: attach token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let refreshRequest = null;

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const refreshToken = localStorage.getItem('refresh_token');

    if (error.response?.status !== 401 || originalRequest?._retry || !refreshToken) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      refreshRequest = refreshRequest || axios.post(`${API.defaults.baseURL}/auth/token/refresh/`, {
        refresh: refreshToken,
      });
      const response = await refreshRequest;
      const accessToken = response.data.access;
      localStorage.setItem('access_token', accessToken);
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return API(originalRequest);
    } catch (refreshError) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_data');
      return Promise.reject(refreshError);
    } finally {
      refreshRequest = null;
    }
  }
);

export default API;