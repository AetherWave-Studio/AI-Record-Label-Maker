import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface WelcomeModalProps {
  open: boolean;
  user: any;
}

export function WelcomeModal({ open, user }: WelcomeModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [username, setUsername] = useState("");
  const [checking, setChecking] = useState(false);
  const [availability, setAvailability] = useState<{
    available: boolean;
    message: string;
  } | null>(null);
  const [checkTimeout, setCheckTimeout] = useState<NodeJS.Timeout | null>(null);

  // Check username availability as user types
  useEffect(() => {
    // Clear previous timeout
    if (checkTimeout) {
      clearTimeout(checkTimeout);
    }

    // Reset availability state
    setAvailability(null);

    // Don't check if username is empty or too short
    if (!username || username.trim().length < 3) {
      return;
    }

    // Set a timeout to check availability after user stops typing
    const timeout = setTimeout(async () => {
      setChecking(true);
      try {
        const response = await fetch("/api/user/check-username", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: username.trim() }),
          credentials: "include",
        });

        const data = await response.json();
        setAvailability(data);
      } catch (error) {
        console.error("Error checking username:", error);
      } finally {
        setChecking(false);
      }
    }, 500); // 500ms delay after user stops typing

    setCheckTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [username]);

  const setUsernameMutation = useMutation({
    mutationFn: async (newUsername: string) => {
      const response = await apiRequest("PATCH", "/api/user/profile", {
        username: newUsername.trim(),
      });

      return response.json();
    },
    onSuccess: (updatedUser) => {
      // Update the cache with the new user data
      queryClient.setQueryData(["/api/auth/user"], updatedUser);
      
      // Also invalidate to ensure the query refetches and triggers a re-render
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });

      toast({
        title: "Welcome to AetherWave Studio!",
        description: `Your username @${updatedUser.username} has been set successfully.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to set username",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedUsername = username.trim();

    // Validate
    if (trimmedUsername.length < 3) {
      toast({
        title: "Invalid username",
        description: "Username must be at least 3 characters long",
        variant: "destructive",
      });
      return;
    }

    if (trimmedUsername.length > 20) {
      toast({
        title: "Invalid username",
        description: "Username must be 20 characters or less",
        variant: "destructive",
      });
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
      toast({
        title: "Invalid username",
        description: "Username can only contain letters, numbers, underscores, and hyphens",
        variant: "destructive",
      });
      return;
    }

    if (!availability?.available) {
      toast({
        title: "Username not available",
        description: availability?.message || "Please choose a different username",
        variant: "destructive",
      });
      return;
    }

    setUsernameMutation.mutate(trimmedUsername);
  };

  const getInputClasses = () => {
    if (!username || username.trim().length < 3) {
      return "";
    }
    if (checking) {
      return "";
    }
    if (availability?.available) {
      return "border-green-500 focus-visible:ring-green-500";
    }
    return "border-red-500 focus-visible:ring-red-500";
  };

  return (
    <Dialog open={open} modal>
      <DialogContent 
        className="sm:max-w-md" 
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl">Welcome to AetherWave Studio!</DialogTitle>
          <DialogDescription className="text-base pt-2">
            Let's get you set up with a unique username. This is how you'll be known across the platform.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="username">Choose your username</Label>
            <div className="relative">
              <Input
                id="username"
                data-testid="input-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className={getInputClasses()}
                autoComplete="off"
                autoFocus
                disabled={setUsernameMutation.isPending}
              />
              {checking && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              )}
              {!checking && username.trim().length >= 3 && availability && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {availability.available ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                </div>
              )}
            </div>

            {/* Validation messages */}
            {username && username.trim().length > 0 && username.trim().length < 3 && (
              <p className="text-sm text-muted-foreground">
                Must be at least 3 characters
              </p>
            )}
            {username.trim().length > 20 && (
              <p className="text-sm text-red-500">
                Must be 20 characters or less
              </p>
            )}
            {username.trim().length >= 3 && username.trim().length <= 20 && !/^[a-zA-Z0-9_-]+$/.test(username.trim()) && (
              <p className="text-sm text-red-500">
                Only letters, numbers, underscores, and hyphens allowed
              </p>
            )}
            {!checking && availability && username.trim().length >= 3 && (
              <p className={`text-sm ${availability.available ? "text-green-600" : "text-red-500"}`}>
                {availability.message}
              </p>
            )}
          </div>

          <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
            <p className="font-medium">Username requirements:</p>
            <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
              <li>3-20 characters long</li>
              <li>Letters, numbers, underscores (_), and hyphens (-) only</li>
              <li>Must be unique</li>
            </ul>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={
              setUsernameMutation.isPending ||
              checking ||
              !availability?.available ||
              username.trim().length < 3
            }
            data-testid="button-set-username"
          >
            {setUsernameMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Setting username...
              </>
            ) : (
              "Continue"
            )}
          </Button>
        </form>

        <p className="text-xs text-muted-foreground text-center">
          You can change your username once every 30 days in your profile settings.
        </p>
      </DialogContent>
    </Dialog>
  );
}
