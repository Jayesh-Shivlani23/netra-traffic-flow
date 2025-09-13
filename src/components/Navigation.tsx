import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { Car, Upload, BarChart3, Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { motion } from "framer-motion";

const Navigation = () => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  
  const navItems = [
    { path: "/", label: "Home", icon: Car },
    { path: "/upload", label: "Upload & Analyze", icon: Upload },
    { path: "/dashboard", label: "Dashboard", icon: BarChart3 },
  ];

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="border-b bg-card/95 backdrop-blur-sm shadow-[var(--shadow-card)] sticky top-0 z-50"
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3">
            <motion.div 
              className="h-10 w-10 rounded-xl gradient-primary shadow-[var(--shadow-soft)]"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            />
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Netra
            </span>
          </Link>
          
          <div className="flex items-center space-x-2">
            <div className="hidden md:flex space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <motion.div key={item.path} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      asChild
                      variant={isActive ? "default" : "ghost"}
                      className="flex items-center space-x-2 relative"
                    >
                      <Link to={item.path}>
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                        {isActive && (
                          <motion.div
                            className="absolute -bottom-1 left-1/2 w-1 h-1 bg-primary rounded-full"
                            layoutId="activeIndicator"
                            style={{ x: "-50%" }}
                          />
                        )}
                      </Link>
                    </Button>
                  </motion.div>
                );
              })}
            </div>
            
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="ml-2"
              >
                {theme === "light" ? (
                  <Moon className="h-5 w-5" />
                ) : (
                  <Sun className="h-5 w-5" />
                )}
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navigation;