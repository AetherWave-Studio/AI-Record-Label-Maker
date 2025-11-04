import { useQuery } from "@tanstack/react-query";

export interface User {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  username: string | null;
  subscriptionPlan: "free" | "studio" | "studio_plus" | "pro" | "mogul";
  credits: number;
  welcomeBonusClaimed: number;
}

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/user"],
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
  };
}
