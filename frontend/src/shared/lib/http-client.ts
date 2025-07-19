'use client';

import { useSessionStore } from '@/entities/user/model/session.store';

// Custom error classes for better error handling
export class TokenExpiredError extends Error {
  readonly isTokenExpiredError = true;
  
  constructor() {
    super('Token has expired');
    this.name = 'TokenExpiredError';
  }
}

// Type guard for checking TokenExpiredError
export const isTokenExpiredError = (error: unknown): error is TokenExpiredError => {
  return error instanceof TokenExpiredError || 
         (error && typeof error === 'object' && 'isTokenExpiredError' in error && 
          (error as { isTokenExpiredError: boolean }).isTokenExpiredError === true);
};

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// HTTP Client factory
export const createHttpClient = () => {
  const request = async <T = unknown>(
    url: string, 
    options: RequestInit = {}
  ): Promise<T> => {
    const { headers = {}, ...restOptions } = options;
    
    // Auto-inject auth token from Zustand store
    const accessToken = useSessionStore.getState().accessToken;
    const authHeaders = accessToken 
      ? { 'Authorization': `Bearer ${accessToken}` }
      : {};

    const response = await fetch(url, {
      ...restOptions,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...headers,
      },
    });

    if (!response.ok) {
      // Handle 401 Unauthorized specifically
      if (response.status === 401) {
        try {
          const errorData = await response.json();
          if (errorData.code === 'token_not_valid') {
            throw new TokenExpiredError();
          }
        } catch (error) {
          // If JSON parsing fails, still throw TokenExpiredError for 401s
          if (error instanceof TokenExpiredError) {
            throw error; // Re-throw TokenExpiredError
          }
          throw new TokenExpiredError();
        }
      }
      
      // Handle other HTTP errors
      let errorMessage = 'API Error occurred';
      let errorCode: string | undefined;
      
      try {
        const errorData = await response.json();
        
        // For 400 Bad Request (validation errors), preserve the original structure
        if (response.status === 400) {
          // Return the full error data as JSON string to maintain compatibility
          // with existing form error handling
          throw new Error(JSON.stringify(errorData));
        }
        
        errorMessage = errorData.error || errorData.detail || errorData.message || errorMessage;
        errorCode = errorData.code;
      } catch (parseError) {
        // If the error was already thrown above (validation error), re-throw it
        if (parseError instanceof Error && parseError.message.startsWith('{')) {
          throw parseError;
        }
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }
      
      throw new ApiError(errorMessage, response.status, errorCode);
    }

    return response.json();
  };

  // Convenience methods for different HTTP verbs
  const get = <T = unknown>(url: string, options?: RequestInit): Promise<T> => 
    request<T>(url, { ...options, method: 'GET' });

  const post = <T = unknown>(url: string, data?: unknown, options?: RequestInit): Promise<T> => 
    request<T>(url, { 
      ...options, 
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined 
    });

  const put = <T = unknown>(url: string, data?: unknown, options?: RequestInit): Promise<T> => 
    request<T>(url, { 
      ...options, 
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined 
    });

  const del = <T = unknown>(url: string, options?: RequestInit): Promise<T> => 
    request<T>(url, { ...options, method: 'DELETE' });

  return { request, get, post, put, delete: del };
};

// Global HTTP client instance
export const httpClient = createHttpClient();