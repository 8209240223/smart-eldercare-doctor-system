import axios, { type AxiosRequestConfig, type AxiosResponse } from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  const tokenId = localStorage.getItem("tokenId");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (tokenId && config.headers) {
    config.headers["X-Token-Id"] = tokenId;
  }
  return config;
});

function clearExpiredSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("tokenId");
  localStorage.removeItem("userInfo");
  localStorage.removeItem("auth-storage");
}

function redirectToLogin() {
  if (window.location.pathname !== "/login") {
    window.location.assign("/login");
  }
}

apiClient.interceptors.response.use(
  (response) => {
    const responseCode = Number((response.data as { code?: unknown } | undefined)?.code);
    if (responseCode === 401 && localStorage.getItem("token")) {
      clearExpiredSession();
      redirectToLogin();
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      clearExpiredSession();
      redirectToLogin();
    }
    return Promise.reject(error);
  }
);

export async function api<T = unknown>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> {
  const response: AxiosResponse<T> = await apiClient(url, config);
  return response.data;
}

export async function post<T = unknown>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  return api<T>(url, { method: "POST", data, ...config });
}

export async function put<T = unknown>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  return api<T>(url, { method: "PUT", data, ...config });
}

export async function del<T = unknown>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> {
  return api<T>(url, { method: "DELETE", ...config });
}

export interface ApiResponse<T = unknown> {
  code: number;
  message?: string;
  msg?: string;
  data: T;
}

export function unwrap<T>(response: ApiResponse<T>): T {
  if (response.code !== 200 && response.code !== 0) {
    throw new Error(response.message || response.msg || "请求失败");
  }
  return response.data;
}
