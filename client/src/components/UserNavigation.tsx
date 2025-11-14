import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Coins, ShoppingBag, Video, Radio, User, Eraser } from "lucide-react";

export function UserNavigation() {
  const { user, isAuthenticated } = useAuth();
  const [location] = useLocation();

  const navItems = [
    { path: "/profile", label: "Profile", icon: User },
    { path: "/buy-credits", label: "Buy Credits", icon: Coins },
    { path: "/remove-background", label: "Remove Background", icon: Eraser },
	/*{ path: "/aimusic-media.html", label: "Creator Studio"},
	{ path: "/enclave/index.html", label: "Enclave" },
    { path: "/card-shop", label: "Card Shop", icon: ShoppingBag },
    { path: "/video-generation", label: "Video Generation", icon: Video },
    { path: "/channels", label: "Channels", icon: Radio },*/
  ];

  if (!isAuthenticated) {
    return (
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link 
              href="/" 
              className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent"
            >
              AetherWave Studio
            </Link>
            <Button asChild data-testid="button-login">
              <a href="/api/dev/login">Login</a>
            </Button>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4"   
	  style={{backgroundImage: "url('https://firebasestorage.googleapis.com/v0/b/aetherwave-playlists.firebasestorage.app/o/global-assets%2FBlack_Surface.png?alt=media&token=06d4bfdc-41d8-4d55-bbfd-5756c5d63845')",
	  backgroundSize:"100% 100%",
	  backgroundRepeat: "no-repeat",
	  
  }}>
        <div className="flex h-16 items-center justify-between gap-4">
          <a 
            href="/static/index.html" 
            className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent whitespace-nowrap"
          >
		  <img src="https://firebasestorage.googleapis.com/v0/b/aetherwave-playlists.firebasestorage.app/o/global-assets%2FAetherwave_Burning_LAbel.gif?alt=media&token=f20fb10d-27e5-429f-8641-217e46386d46"alt="Logo" style={{ height: '6em', display: 'inline', verticalAlign: 'middle' }}/>
          </a>

          <div className="flex items-center gap-2 flex-1 justify-center">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Button
                key={path}
                variant={location === path ? "default" : "ghost"}
                size="sm"
                asChild
                data-testid={`nav-${path.slice(1)}`}
				style={{ color: "white" }}
              >
                <Link href={path} className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline" 
				  style={{ color: "white" }}>{label}</span>
                </Link>
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm" data-testid="user-credits">
              <Coins className="w-4 h-4 text-yellow-500" />
              <span className="font-semibold">{user?.credits || 0}</span>
            </div>

            <Link href="/profile">
              <a className="cursor-pointer hover:opacity-80 transition-opacity" title="View Profile">
                <Avatar className="w-8 h-8" data-testid="user-avatar">
                  <AvatarImage src={user?.profileImageUrl || undefined} />
                  <AvatarFallback>
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
              </a>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}