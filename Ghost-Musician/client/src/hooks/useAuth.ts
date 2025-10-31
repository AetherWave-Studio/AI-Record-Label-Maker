import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface User {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  level?: string;
  experience?: number;
  influence?: number;
  totalCards?: number;
  fame?: number;
  totalStreams?: number;
  dailyStreams?: number;
  chartPosition?: number;
  fanbase?: number;
  lastActivityDate?: Date;
  hasStreamingDistribution?: boolean;
  aetherwavePartner?: boolean;
  canCustomizeArtistStyle?: boolean;
  canSetArtistPhilosophy?: boolean;
  canUploadProfileImages?: boolean;
  canHardcodeParameters?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface AuthResponse {
  user: User;
}

export function useAuth() {
  const { data, isLoading } = useQuery({
    queryKey: ["/api/user"],
    retry: false,
  });

  const authData = data as AuthResponse | undefined;

  return {
    user: authData?.user,
    isLoading,
    isAuthenticated: !!authData?.user,
  };
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Login failed");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Registration failed");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        throw new Error("Logout failed");
      }
      return response.json();
    },
    onSuccess: () => {
      // Clear all cached data and force a full refresh
      queryClient.clear();
      // Force page reload to completely clear session state
      window.location.href = "/";
    },
  });
}