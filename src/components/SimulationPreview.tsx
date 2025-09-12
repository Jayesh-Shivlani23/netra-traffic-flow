import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

interface Vehicle {
  id: number;
  x: number;
  y: number;
  direction: 'horizontal' | 'vertical';
  speed: number;
}

const SimulationPreview = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [lightState, setLightState] = useState<'red' | 'yellow' | 'green'>('green');
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(prev => prev + 1);
      
      // Simple traffic light cycle (faster for preview)
      const cycleTime = timer % 60; // 1 minute cycle
      if (cycleTime < 20) {
        setLightState('green');
      } else if (cycleTime < 25) {
        setLightState('yellow');
      } else {
        setLightState('red');
      }

      // Update vehicles
      setVehicles(prevVehicles => {
        let newVehicles = prevVehicles
          .map(vehicle => ({
            ...vehicle,
            x: vehicle.direction === 'horizontal' 
              ? vehicle.x + (lightState === 'green' ? vehicle.speed : vehicle.speed * 0.3)
              : vehicle.x,
            y: vehicle.direction === 'vertical'
              ? vehicle.y + (lightState === 'green' ? vehicle.speed : vehicle.speed * 0.3)
              : vehicle.y
          }))
          .filter(vehicle => 
            vehicle.x < 200 && vehicle.y < 150 && vehicle.x > -20 && vehicle.y > -20
          );

        // Add new vehicles occasionally
        if (Math.random() < 0.4 && newVehicles.length < 8) {
          const direction = Math.random() < 0.5 ? 'horizontal' : 'vertical';
          newVehicles.push({
            id: Date.now() + Math.random(),
            x: direction === 'horizontal' ? -15 : 80 + Math.random() * 40,
            y: direction === 'vertical' ? -15 : 60 + Math.random() * 30,
            direction,
            speed: 1 + Math.random() * 2
          });
        }

        return newVehicles;
      });
    }, 150);

    return () => clearInterval(interval);
  }, [timer, lightState]);

  const getLightColor = (color: string) => {
    const baseClasses = "w-2 h-2 rounded-full transition-all duration-300";
    switch (color) {
      case 'red':
        return `${baseClasses} ${lightState === 'red' ? 'bg-danger shadow-lg shadow-danger/50' : 'bg-muted'}`;
      case 'yellow':
        return `${baseClasses} ${lightState === 'yellow' ? 'bg-warning shadow-lg shadow-warning/50' : 'bg-muted'}`;
      case 'green':
        return `${baseClasses} ${lightState === 'green' ? 'bg-success shadow-lg shadow-success/50' : 'bg-muted'}`;
      default:
        return `${baseClasses} bg-muted`;
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <motion.div 
            className="w-2 h-2 rounded-full bg-primary"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          Live Simulation Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="relative w-full h-32 bg-gradient-to-br from-muted/30 to-muted/60 rounded-lg overflow-hidden">
          {/* Road Network */}
          <div className="absolute inset-0">
            {/* Horizontal road */}
            <div className="absolute top-1/2 left-0 w-full h-6 bg-muted-foreground/10 transform -translate-y-1/2">
              <div className="absolute top-1/2 left-0 w-full h-px bg-white/30 transform -translate-y-1/2"></div>
            </div>
            
            {/* Vertical road */}
            <div className="absolute left-1/2 top-0 w-6 h-full bg-muted-foreground/10 transform -translate-x-1/2">
              <div className="absolute left-1/2 top-0 w-px h-full bg-white/30 transform -translate-x-1/2"></div>
            </div>
          </div>

          {/* Traffic Light */}
          <motion.div 
            className="absolute top-6 left-1/2 transform -translate-x-1/2"
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <div className="bg-card border rounded-md p-1 shadow-md">
              <div className="space-y-1">
                <div className={getLightColor('red')}></div>
                <div className={getLightColor('yellow')}></div>
                <div className={getLightColor('green')}></div>
              </div>
            </div>
          </motion.div>

          {/* Vehicles */}
          {vehicles.map(vehicle => (
            <motion.div
              key={vehicle.id}
              className="absolute w-3 h-2 gradient-primary rounded-sm shadow-sm"
              style={{
                left: `${vehicle.x}px`,
                top: `${vehicle.y}px`,
              }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 300 }}
            />
          ))}
        </div>
        
        <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <div className={`w-1.5 h-1.5 rounded-full ${lightState === 'red' ? 'bg-danger' : lightState === 'yellow' ? 'bg-warning' : 'bg-success'}`}></div>
            Light: {lightState}
          </span>
          <span>{vehicles.length} vehicles</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default SimulationPreview;