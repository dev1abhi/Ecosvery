
// API request timeout (30 seconds)
const DEFAULT_TIMEOUT = 30000;

// Retry configuration
const DEFAULT_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public endpoint?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Fetch with timeout support
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = DEFAULT_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError(`Request timeout after ${timeout}ms`, undefined, url);
    }
    throw error;
  }
}

/**
 * Retry failed requests with exponential backoff
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries = DEFAULT_RETRY_ATTEMPTS
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options);
      
      // Don't retry on client errors (4xx), only server errors (5xx) and network issues
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response;
      }

      lastError = new ApiError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        url
      );
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }

    // Wait before retrying (exponential backoff)
    if (attempt < maxRetries - 1) {
      const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError || new ApiError('Unknown error', undefined, url);
}

/**
 * Validate required environment variables on app startup
 */
export function validateEnvironment(): { valid: boolean; missing: string[] } {
  const requiredVars = [
    'VITE_BACKEND_BASE_URL',
    'VITE_UNIPROT_FTP_URL',
    'VITE_YOUTUBE_EMBED_BASE_URL',
    'VITE_DEFAULT_VIDEO_ID',
    'VITE_DEFAULT_IMAGE_URL',
  ];

  const missing = requiredVars.filter(
    (varName) => !import.meta.env[varName]
  );

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Safe JSON parse with error handling
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * Cache utilities with expiration support
 */
export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
}

export function getCachedData<T>(key: string): T | null {
  try {
    const cached = sessionStorage.getItem(key);
    if (!cached) return null;

    const data = JSON.parse(cached);
    
    // Check expiration if timestamp exists
    if (data._timestamp) {
      const now = Date.now();
      const age = now - data._timestamp;
      const ttl = data._ttl || Infinity;
      
      if (age > ttl) {
        sessionStorage.removeItem(key);
        return null;
      }
    }

    return data.value as T;
  } catch (error) {
    console.warn(`Failed to read cache for key: ${key}`, error);
    return null;
  }
}

export function setCachedData<T>(
  key: string,
  value: T,
  options: CacheOptions = {}
): void {
  try {
    const data = {
      value,
      _timestamp: Date.now(),
      _ttl: options.ttl,
    };
    sessionStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.warn(`Failed to set cache for key: ${key}`, error);
  }
}

/**
 * Debounce utility for search inputs
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
