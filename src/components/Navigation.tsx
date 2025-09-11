import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { Car, Upload, BarChart3, Zap } from "lucide-react";

const Navigation = () => {
  const location = useLocation();
  
  const navItems = [
    { path: "/", label: "Home", icon: Car },
    { path: "/upload", label: "Upload & Analyze", icon: Upload },
    { path: "/dashboard", label: "Dashboard", icon: BarChart3 },
    { path: "/simulation", label: "Simulation", icon: Zap },
  ];

  return (
    <nav className="border-b bg-card shadow-sm">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-primary to-accent"></div>
            <span className="text-xl font-bold text-foreground">Netra</span>
          </Link>
          
          <div className="hidden md:flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.path}
                  asChild
                  variant={location.pathname === item.path ? "default" : "ghost"}
                  className="flex items-center space-x-2"
                >
                  <Link to={item.path}>
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;