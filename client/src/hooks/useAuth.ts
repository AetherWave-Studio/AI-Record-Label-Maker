import { useQuery } from "@tanstack/react-query";

interface User {
  id: string;
  username?: string;
  plan: string;
  credits: number;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  level?: string;
  totalCards?: number;
  fame?: number;
  totalStreams?: number;
  chartPosition?: number;
}

interface AuthResponse {
  user: User;
}

export function useAuth() {
  const { data, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const authData = data as AuthResponse | undefined;

  return {
    user: authData?.user,
    isLoading,
    isAuthenticated: !!authData?.user,
  };
}
