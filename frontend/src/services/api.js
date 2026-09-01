import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ── In-Memory Request Cache & In-Flight Promise Deduplication ────────────────
const memoryCache = new Map();
const inFlightRequests = new Map();
const DEFAULT_CACHE_TTL = 10000; // 10 seconds

export const clearApiCache = () => {
  memoryCache.clear();
};

api.clearCache = clearApiCache;

// Interceptor: Add Authorization header & Cache Handling
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;

  const method = (config.method || 'get').toLowerCase();

  // If this is a mutation request (POST, PUT, PATCH, DELETE), invalidate cache
  if (['post', 'put', 'patch', 'delete'].includes(method)) {
    memoryCache.clear();
  }

  return config;
});

// Custom wrapper for cached GET requests
const originalGet = api.get.bind(api);
api.get = function (url, config = {}) {
  const bypassCache = config.cache === false || (typeof url === 'string' && url.includes('t='));
  const cacheKey = `${url}_${JSON.stringify(config.params || {})}`;
  const now = Date.now();

  if (!bypassCache) {
    // 1. Return cached response if valid
    if (memoryCache.has(cacheKey)) {
      const { timestamp, ttl, data } = memoryCache.get(cacheKey);
      if (now - timestamp < ttl) {
        return Promise.resolve(JSON.parse(JSON.stringify(data)));
      }
      memoryCache.delete(cacheKey);
    }

    // 2. Return in-flight request if identical GET is already active
    if (inFlightRequests.has(cacheKey)) {
      return inFlightRequests.get(cacheKey);
    }
  }

  // 3. Execute request and store in cache
  const requestPromise = originalGet(url, config)
    .then((response) => {
      if (!bypassCache && response.status >= 200 && response.status < 300) {
        const ttl = config.ttl || DEFAULT_CACHE_TTL;
        memoryCache.set(cacheKey, { timestamp: Date.now(), ttl, data: response });
      }
      return response;
    })
    .finally(() => {
      inFlightRequests.delete(cacheKey);
    });

  if (!bypassCache) {
    inFlightRequests.set(cacheKey, requestPromise);
  }

  return requestPromise;
};

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('role');

      const requestUrl = err.config?.url || '';
      if (requestUrl.includes('superadmin')) {
        window.location.href = '/superadmin/login';
      } else {
        window.location.href = '/';
      }
    }
    return Promise.reject(err);
  }
);

export default api;