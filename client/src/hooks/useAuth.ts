import { useQuery } from "@tanstack/react-query";

export interface User {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  username: string | null;
  lastUsernameChange: string | null;
  vocalGenderPreference: string | null;
  subscriptionPlan: "free" | "studio" | "studio_plus" | "pro" | "mogul";
  credits: number;
  welcomeBonusClaimed: number;
  lastCreditReset: string;
  createdAt: string;
  updatedAt: string;
}

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
  };
}
