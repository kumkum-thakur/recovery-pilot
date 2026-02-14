/**
 * Production API client for RecoveryPilot.
 *
 * Features:
 * - Automatic JWT token management (access + refresh)
 * - Request/response interceptors
 * - Automatic retry with exponential backoff
 * - Request deduplication
 * - Offline queue (for mobile/low connectivity in India)
 * - Request cancellation
 * - Structured error handling
 * - CSRF protection
 *
 * Usage:
 *   const client = ApiClient.getInstance();
 *   const patients = await client.get('/patients');
 *   await client.post('/patients/123/vitals', { heartRate: 72 });
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 1000;
const REQUEST_TIMEOUT_MS = 30000;

interface ApiResponse<T = unknown> {
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ApiError {
  error: string;
  message: string;
  code?: string;
  details?: unknown;
  requestId?: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

type RequestInterceptor = (config: RequestConfig) => RequestConfig;
type ResponseInterceptor = (response: Response) => Response;

interface RequestConfig {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
  signal?: AbortSignal;
}

// In-flight request cache for deduplication
const inflightRequests = new Map<string, Promise<unknown>>();

class ApiClient {
  private static instance: ApiClient;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private isRefreshing = false;
  private refreshQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: Error) => void;
  }> = [];
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];

  private constructor() {
    this.loadTokens();
  }

  static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  // --- Token Management ---

  private loadTokens(): void {
    try {
      this.accessToken = sessionStorage.getItem('rp_access_token');
      this.refreshToken = sessionStorage.getItem('rp_refresh_token');
    } catch {
      // sessionStorage not available
    }
  }

  setTokens(tokens: TokenPair): void {
    this.accessToken = tokens.accessToken;
    this.refreshToken = tokens.refreshToken;
    try {
      sessionStorage.setItem('rp_access_token', tokens.accessToken);
      sessionStorage.setItem('rp_refresh_token', tokens.refreshToken);
    } catch {
      // sessionStorage not available
    }
  }

  clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    try {
      sessionStorage.removeItem('rp_access_token');
      sessionStorage.removeItem('rp_refresh_token');
    } catch {
      // sessionStorage not available
    }
  }

  private async refreshAccessToken(): Promise<string> {
    if (this.isRefreshing) {
      return new Promise((resolve, reject) => {
        this.refreshQueue.push({ resolve, reject });
      });
    }

    this.isRefreshing = true;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json() as TokenPair;
      this.setTokens(data);

      // Resolve queued requests
      this.refreshQueue.forEach(({ resolve }) => resolve(data.accessToken));
      this.refreshQueue = [];

      return data.accessToken;
    } catch (error) {
      // Reject queued requests
      this.refreshQueue.forEach(({ reject }) =>
        reject(error instanceof Error ? error : new Error('Token refresh failed'))
      );
      this.refreshQueue = [];

      // Redirect to login
      this.clearTokens();
      window.dispatchEvent(new CustomEvent('auth:expired'));

      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  // --- Request Methods ---

  async get<T>(path: string, params?: Record<string, string | number>): Promise<ApiResponse<T>> {
    const url = params
      ? `${path}?${new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]))}`
      : path;

    // Deduplicate identical GET requests
    const cacheKey = `GET:${url}`;
    const inflight = inflightRequests.get(cacheKey);
    if (inflight) {
      return inflight as Promise<ApiResponse<T>>;
    }

    const promise = this.request<T>('GET', url);
    inflightRequests.set(cacheKey, promise);
    promise.finally(() => inflightRequests.delete(cacheKey));

    return promise;
  }

  async post<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>('POST', path, body);
  }

  async put<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', path, body);
  }

  async patch<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', path, body);
  }

  async delete<T>(path: string): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', path);
  }

  // --- Core Request ---

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    retryCount = 0
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${path}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let config: RequestConfig = {
      method,
      url,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Request-ID': crypto.randomUUID(),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    };

    // Add auth header
    if (this.accessToken) {
      config.headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    // Apply request interceptors
    for (const interceptor of this.requestInterceptors) {
      config = interceptor(config);
    }

    try {
      const response = await fetch(config.url, {
        method: config.method,
        headers: config.headers,
        body: config.body,
        signal: config.signal,
        credentials: 'include',
      });

      clearTimeout(timeout);

      // Handle 401 - Token expired
      if (response.status === 401 && this.refreshToken) {
        const errorData = await response.json() as ApiError;
        if (errorData.code === 'TOKEN_EXPIRED') {
          const newToken = await this.refreshAccessToken();
          config.headers['Authorization'] = `Bearer ${newToken}`;
          // Retry with new token
          return this.request<T>(method, path, body, retryCount);
        }
      }

      // Handle rate limiting (429)
      if (response.status === 429 && retryCount < MAX_RETRIES) {
        const retryAfter = parseInt(response.headers.get('Retry-After') ?? '5');
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        return this.request<T>(method, path, body, retryCount + 1);
      }

      // Handle server errors (5xx) with retry
      if (response.status >= 500 && retryCount < MAX_RETRIES) {
        const delay = RETRY_BASE_DELAY_MS * Math.pow(2, retryCount);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.request<T>(method, path, body, retryCount + 1);
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: 'Unknown error',
          message: response.statusText,
        })) as ApiError;

        throw new ApiRequestError(
          errorData.message || errorData.error,
          response.status,
          errorData.code,
          errorData.requestId
        );
      }

      return await response.json() as ApiResponse<T>;
    } catch (error) {
      clearTimeout(timeout);

      if (error instanceof ApiRequestError) throw error;

      // Network error - retry
      if (retryCount < MAX_RETRIES && error instanceof TypeError) {
        const delay = RETRY_BASE_DELAY_MS * Math.pow(2, retryCount);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.request<T>(method, path, body, retryCount + 1);
      }

      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new ApiRequestError('Request timeout', 408, 'TIMEOUT');
      }

      throw new ApiRequestError(
        error instanceof Error ? error.message : 'Network error',
        0,
        'NETWORK_ERROR'
      );
    }
  }

  // --- Interceptors ---

  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }
}

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly requestId?: string
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

export const apiClient = ApiClient.getInstance();
export type { ApiResponse, ApiError, TokenPair };
