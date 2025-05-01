import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Helper to get the base URL for API requests depending on the environment
export function getApiBaseUrl(): string {
  // For production deployments on Vercel or other platforms
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    // Use the current hostname (will work on Vercel, custom domains, etc.)
    return `${window.location.protocol}//${window.location.host}`;
  }
  
  // For local development
  return '';
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Normalize the URL with the correct base for the current environment
  const apiUrl = url.startsWith('http') ? url : `${getApiBaseUrl()}${url}`;
  
  try {
    const res = await fetch(apiUrl, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });
    
    // If there's an error status but API is available
    if (!res.ok) {
      console.warn(`API request failed with status ${res.status}: ${apiUrl}`);
      // For guesses, return a default response for deployment fallback
      if (url.includes('/guess') && method === 'POST') {
        console.log('Creating fallback response for guess endpoint');
        // Create a synthetic response for guess endpoint
        const mockResponse = new Response(JSON.stringify({
          isCorrect: false,
          partialMatchFeedback: null,
          matchedWord: null,
          matchType: 'none',
          hasCorrectWordsWrongOrder: false
        }), {
          status: 200,
          headers: {'Content-Type': 'application/json'}
        });
        return mockResponse;
      }
    }

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    console.error('API request error:', error);
    
    // Special case for deployment - provide fallback response for guess endpoint
    if (url.includes('/guess') && method === 'POST') {
      console.log('Creating fallback response for failed guess request');
      // Create a synthetic response
      const mockResponse = new Response(JSON.stringify({
        isCorrect: false,
        partialMatchFeedback: null,
        matchedWord: null,
        matchType: 'none',
        hasCorrectWordsWrongOrder: false
      }), {
        status: 200,
        headers: {'Content-Type': 'application/json'}
      });
      return mockResponse;
    }
    
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Extract URL from queryKey and normalize it
    const url = queryKey[0] as string;
    const apiUrl = url.startsWith('http') ? url : `${getApiBaseUrl()}${url}`;
    
    const res = await fetch(apiUrl, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
      // This will keep cache for 10 minutes even after components unmount
      gcTime: 1000 * 60 * 10,
    },
    mutations: {
      retry: false,
    },
  },
});

// Global navigation state manager to preserve state during navigation
export interface NavigationState {
  // Flag to track if the initial puzzle has been loaded
  initialPuzzleLoaded: boolean;
  // Flag to track if archive data has been loaded
  archiveLoaded: boolean;
  // Cached archive data
  archiveData: any[] | null;
  // Last visited page
  lastPageVisited: string;
  // Timestamp of when the app started
  sessionStartTime: number;
}

// Create an initial navigation state
export const navigationState: NavigationState = {
  initialPuzzleLoaded: false,
  archiveLoaded: false,
  archiveData: null,
  lastPageVisited: '/',
  sessionStartTime: Date.now(),
};

// Helper to update navigation state
export const updateNavigationState = (updates: Partial<NavigationState>) => {
  Object.assign(navigationState, updates);
  console.log('Navigation state updated:', updates);
};
