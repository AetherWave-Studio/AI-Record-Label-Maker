import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage;
    try {
      const responseText = await res.text();
      console.error('API Error Response:', responseText);
      
      // Try to parse as JSON first
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorData.error || responseText;
      } catch {
        // If not JSON, use the text directly
        errorMessage = responseText || res.statusText;
      }
    } catch {
      // If response text reading fails, use status text
      errorMessage = res.statusText;
    }
    
    console.error(`API Error ${res.status}:`, errorMessage);
    throw new Error(`${res.status}: ${errorMessage}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  options?: { timeout?: number }
): Promise<Response> {
  const isFormData = data instanceof FormData;
  const timeout = options?.timeout || (isFormData ? 300000 : 30000); // 5 minutes for file uploads, 30 seconds for other requests
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    console.log(`Making ${method} request to ${url} with ${timeout}ms timeout`);
    
    const res = await fetch(url, {
      method,
      headers: data && !isFormData ? { "Content-Type": "application/json" } : {},
      body: isFormData ? data : data ? JSON.stringify(data) : undefined,
      credentials: "include",
      signal: controller.signal,
    });

    console.log(`Response received: ${res.status} ${res.statusText}`);
    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    console.error('Fetch error:', error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeout / 1000} seconds. Please try again with a smaller file or check your connection.`);
    }
    
    // Re-throw with more context
    throw new Error(`Network request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    clearTimeout(timeoutId);
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
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
    },
    mutations: {
      retry: false,
    },
  },
});
