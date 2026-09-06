import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiErrorResponse, TokenResponse } from '@/types';

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

// Token state management - store in memory and sessionStorage
let accessToken: string | null = null;
let refreshToken: string | null = null;

export const setTokens = (tokens: { access_token: string; refresh_token: string } | null) => {
  if (tokens) {
    accessToken = tokens.access_token;
    refreshToken = tokens.refresh_token;
    try {
      sessionStorage.setItem('dms_session', JSON.stringify(tokens));
    } catch {
      // Ignored if storage is unavailable
    }
  } else {
    accessToken = null;
    refreshToken = null;
    try {
      sessionStorage.removeItem('dms_session');
    } catch {
      // Ignored
    }
  }
};

export const getAccessToken = () => {
  if (!accessToken) {
    try {
      const stored = sessionStorage.getItem('dms_session');
      if (stored) {
        const parsed = JSON.parse(stored);
        accessToken = parsed.access_token;
        refreshToken = parsed.refresh_token;
      }
    } catch {
      // Ignored
    }
  }
  return accessToken;
};

export const getRefreshToken = () => {
  if (!refreshToken) {
    try {
      const stored = sessionStorage.getItem('dms_session');
      if (stored) {
        const parsed = JSON.parse(stored);
        accessToken = parsed.access_token;
        refreshToken = parsed.refresh_token;
      }
    } catch {
      // Ignored
    }
  }
  return refreshToken;
};

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach Bearer token and Request ID
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Generate UUIDv4-like request ID
    if (!config.headers['X-Request-ID']) {
      config.headers['X-Request-ID'] = `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Token refresh queue
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor: handle token refresh and normalize errors
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized with token refresh (avoid infinite loops on refresh/login endpoints)
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      const currentRefreshToken = getRefreshToken();
      if (!currentRefreshToken) {
        setTokens(null);
        window.dispatchEvent(new CustomEvent('auth:expired'));
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await api.post<TokenResponse>('/auth/refresh', {
          refresh_token: currentRefreshToken,
        });

        const newTokens = {
          access_token: response.data.access_token,
          refresh_token: response.data.refresh_token,
        };
        setTokens(newTokens);
        processQueue(null, newTokens.access_token);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newTokens.access_token}`;
        }
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr as AxiosError, null);
        setTokens(null);
        window.dispatchEvent(new CustomEvent('auth:expired'));
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
