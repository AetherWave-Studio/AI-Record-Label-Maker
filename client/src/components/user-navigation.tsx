import { useAuth, useLogout } from "@/hooks/useAuth";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { User, LogOut, FileText, Coins } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface UserNavigationProps {
  onShowMyCards?: () => void;
  onShowAuth?: () => void;
}

export default function UserNavigation({ onShowMyCards, onShowAuth }: UserNavigationProps) {
  const { user, isAuthenticated } = useAuth();
  const logoutMutation = useLogout();
  
  // Fetch user credit balance
  const { data: creditData } = useQuery({
    queryKey: ["/api/credits"],
    retry: false,
    enabled: isAuthenticated,
  });

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (!isAuthenticated) {
    return (
      <Button 
        onClick={onShowAuth}
        variant="outline"
        data-testid="button-login"
      >
        <User className="w-4 h-4 mr-2" />
        Sign In
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* Credit Display */}
      <div className="flex items-center gap-1 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-1">
        <Coins className="w-3 h-3 text-yellow-400" />
        <span className="text-xs font-semibold text-yellow-400" data-testid="credit-display">
          {creditData?.credits?.toLocaleString() || "0"}
        </span>
      </div>
      
      {/* User Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" data-testid="button-user-menu">
            <User className="w-4 h-4 mr-2" />
            {user?.username || user?.firstName || "User"}
          </Button>
        </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={onShowMyCards}
          data-testid="button-my-cards"
        >
          <FileText className="w-4 h-4 mr-2" />
          My Cards
        </DropdownMenuItem>
        <DropdownMenuItem asChild data-testid="button-my-profile">
          <Link href={`/user/${user?.id}`}>
            <User className="w-4 h-4 mr-2" />
            My Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handleLogout}
          data-testid="button-logout"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}