import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import arcuDaysLogo from "@assets/Copy of Copy of ARCU BANNER (50 x 50 mm).png";
import { LogOut } from "lucide-react";

const AdminNavbar = () => {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  // Navigation links for the admin section
  const navLinks = [
    { name: "Score Management", path: "/admin/scores", icon: "scoreboard" },
    { name: "Medal Management", path: "/admin/medals", icon: "emoji_events" },
    { name: "Team Management", path: "/admin/teams", icon: "groups" },
    { name: "Event Management", path: "/admin/events", icon: "event" },
    { name: "Publish Scores", path: "/admin/publish", icon: "publish" },
    { name: "View Scoreboard", path: "/scoreboard", icon: "visibility", external: true },
  ];

  // Check if a link is active
  const isActive = (path: string) => {
    if (path === "/admin/scores" && location === "/admin") {
      return true; // Special case for the default admin route
    }
    return location === path;
  };

  return (
    <div className="bg-[#000080] text-white shadow-md">
      {/* Admin Header */}
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <img src={arcuDaysLogo} alt="ArCu Days Logo" className="h-10 mr-3" />
          <h1 className="text-xl font-montserrat font-bold">USTP ArCu Days 2025 - Admin Panel</h1>
        </div>
        <div className="flex items-center">
          <span className="mr-4">Welcome, {user?.username || 'Admin'}</span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={logout}
            className="inline-flex items-center bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded-md text-sm"
          >
            <LogOut className="h-4 w-4 mr-1" />
            Logout
          </Button>
        </div>
      </div>
      
      {/* Admin Navigation */}
      <div className="bg-white shadow-md">
        <div className="container mx-auto px-4">
          <nav className="flex overflow-x-auto">
            {navLinks.map((link) => (
              link.external ? (
                <a key={link.path} href={link.path} target="_blank" rel="noopener noreferrer">
                  <Button
                    variant="ghost"
                    className="px-4 py-3 font-medium whitespace-nowrap text-gray-500 hover:text-[#000080]"
                  >
                    <span className="material-icons text-sm mr-1">{link.icon}</span>
                    {link.name}
                    <span className="material-icons text-xs ml-1">open_in_new</span>
                  </Button>
                </a>
              ) : (
                <Link key={link.path} href={link.path}>
                  <Button
                    variant="ghost"
                    className={`px-4 py-3 font-medium whitespace-nowrap ${
                      isActive(link.path)
                        ? "text-[#000080] border-b-2 border-[#000080]"
                        : "text-gray-500 hover:text-[#000080]"
                    }`}
                  >
                    <span className="material-icons text-sm mr-1">{link.icon}</span>
                    {link.name}
                  </Button>
                </Link>
              )
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
};

export default AdminNavbar;
