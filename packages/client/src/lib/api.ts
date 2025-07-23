// API configuration with automatic retry and error handling
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (window.location.hostname === 'catapult-event-manager-client.onrender.com' 
    ? 'https://catapult-event-manager-server.onrender.com' 
    : 'http://localhost:3001');
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

interface ApiOptions extends RequestInit {
  retries?: number;
}

class ApiError extends Error {
  status: number;
  data?: any;
  
  constructor(status: number, message: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkServerHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const { retries = MAX_RETRIES, ...fetchOptions } = options;
  
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
    credentials: 'include', // for CORS
    ...fetchOptions,
  };

  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, defaultOptions);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          response.status,
          errorData.error || `HTTP ${response.status}: ${response.statusText}`,
          errorData
        );
      }
      
      // Handle empty responses
      const text = await response.text();
      return text ? JSON.parse(text) : {} as T;
      
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on client errors (4xx)
      if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
        throw error;
      }
      
      // Check if server is healthy before retrying
      if (attempt < retries) {
        console.warn(`API request failed (attempt ${attempt + 1}/${retries + 1}):`, error);
        
        // Check server health
        const isHealthy = await checkServerHealth();
        if (!isHealthy) {
          console.warn('Server health check failed, waiting before retry...');
          await delay(RETRY_DELAY * (attempt + 1)); // Exponential backoff
        }
        
        continue;
      }
    }
  }
  
  // If we get here, all retries failed
  console.error('All API request attempts failed:', lastError);
  throw new Error(`Failed to connect to server after ${retries + 1} attempts. Please check if the server is running.`);
}

// Convenience methods
export const api = {
  get: <T = any>(endpoint: string, options?: Omit<ApiOptions, 'method'>) => 
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),
    
  post: <T = any>(endpoint: string, data?: any, options?: Omit<ApiOptions, 'method' | 'body'>) => 
    apiRequest<T>(endpoint, { 
      ...options, 
      method: 'POST', 
      body: data ? JSON.stringify(data) : undefined 
    }),
    
  put: <T = any>(endpoint: string, data?: any, options?: Omit<ApiOptions, 'method' | 'body'>) => 
    apiRequest<T>(endpoint, { 
      ...options, 
      method: 'PUT', 
      body: data ? JSON.stringify(data) : undefined 
    }),
    
  delete: <T = any>(endpoint: string, options?: Omit<ApiOptions, 'method'>) => 
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
    
  patch: <T = any>(endpoint: string, data?: any, options?: Omit<ApiOptions, 'method' | 'body'>) => 
    apiRequest<T>(endpoint, { 
      ...options, 
      method: 'PATCH', 
      body: data ? JSON.stringify(data) : undefined 
    }),
    
  // Event-specific methods
  getEventContacts: async (eventId: string) => {
    const response = await apiRequest<{ data: any[] }>(`/api/contacts?eventId=${eventId}`);
    return response.data || [];
  }
};

// Export for use in components
export default api;