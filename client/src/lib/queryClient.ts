import { QueryClient, defaultShouldDehydrateQuery, isServer } from "@tanstack/react-query";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        queryFn: async ({ queryKey }) => {
          const res = await fetch(queryKey[0] as string, {
            credentials: "include",
          });

          if (!res.ok) {
            if (res.status >= 500) {
              throw new Error(`${res.status}: ${res.statusText}`);
            }

            throw new Error(`${res.status}: ${await res.text()}`);
          }

          return res.json();
        },
        staleTime: 60 * 1000,
      },
      dehydrate: {
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
  if (isServer) {
    return makeQueryClient();
  } else {
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

export const queryClient = getQueryClient();

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export async function apiRequest(
  method: RequestMethod,
  url: string,
  data?: unknown
): Promise<Response> {
  const options: RequestInit = {
    method,
    credentials: "include",
    headers: {
      ...(!(data instanceof FormData) && { "Content-Type": "application/json" }),
    },
  };

  if (data) {
    options.body = data instanceof FormData ? data : JSON.stringify(data);
  }

  const res = await fetch(url, options);

  if (!res.ok) {
    if (res.headers.get("content-type")?.includes("application/json")) {
      const error = await res.json();
      throw new Error(error.error || error.message || `Request failed with status ${res.status}`);
    }
    throw new Error(`Request failed: ${res.statusText}`);
  }

  return res;
}
