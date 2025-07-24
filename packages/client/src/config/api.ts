// API configuration with environment-based URL
export const getApiUrl = (): string => {
  // First check for environment variable
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // In production, try to use a relative URL (assumes same domain)
  if (import.meta.env.PROD) {
    // If client and server are on same domain but different ports
    const url = new URL(window.location.href);
    
    // Common patterns for API URLs
    if (url.hostname.includes('catapult-event-manager-client')) {
      // Replace 'client' with 'server' in the hostname
      return `https://${url.hostname.replace('-client', '-server')}.onrender.com`;
    }
    
    // Default to same origin
    return '';
  }
  
  // Development default
  return 'http://localhost:3001';
};

export const API_URL = getApiUrl();