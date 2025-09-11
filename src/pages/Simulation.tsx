import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw } from "lucide-react";
import Navigation from "@/components/Navigation";

const Simulation = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [lightState, setLightState] = useState<'red' | 'yellow' | 'green'>('red');
  const [vehicles, setVehicles] = useState<Array<{ id: number; x: number; y: number; direction: string }>>([]);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
        
        // Traffic light cycle
        const cycleTime = timer % 120; // 2 minute cycle
        if (cycleTime < 45) {
          setLightState('green');
        } else if (cycleTime < 50) {
          setLightState('yellow');
        } else {
          setLightState('red');
        }

        // Update vehicle positions
        setVehicles(prevVehicles => {
          let newVehicles = prevVehicles.map(vehicle => ({
            ...vehicle,
            x: vehicle.direction === 'right' 
              ? vehicle.x + (lightState === 'green' ? 2 : 0.5)
              : vehicle.x - (lightState === 'green' ? 2 : 0.5),
          })).filter(vehicle => 
            vehicle.x > -50 && vehicle.x < 450
          );

          // Add new vehicles occasionally
          if (Math.random() < 0.3) {
            newVehicles.push({
              id: Date.now() + Math.random(),
              x: Math.random() < 0.5 ? -30 : 430,
              y: 180 + (Math.random() - 0.5) * 40,
              direction: Math.random() < 0.5 ? 'right' : 'left',
            });
          }

          return newVehicles;
        });
      }, 100);
    }

    return () => clearInterval(interval);
  }, [isRunning, timer, lightState]);

  const toggleSimulation = () => {
    setIsRunning(!isRunning);
  };

  const resetSimulation = () => {
    setIsRunning(false);
    setTimer(0);
    setLightState('red');
    setVehicles([]);
  };

  const getLightColor = (color: string) => {
    switch (color) {
      case 'red':
        return lightState === 'red' ? 'bg-danger' : 'bg-muted';
      case 'yellow':
        return lightState === 'yellow' ? 'bg-warning' : 'bg-muted';
      case 'green':
        return lightState === 'green' ? 'bg-success' : 'bg-muted';
      default:
        return 'bg-muted';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Traffic Simulation</h1>
          <p className="text-muted-foreground">Interactive traffic light and vehicle flow simulation</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Simulation Canvas */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Junction Simulation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative w-full h-96 bg-gradient-to-b from-muted/50 to-muted rounded-lg overflow-hidden">
                  {/* Road */}
                  <div className="absolute inset-0">
                    {/* Horizontal road */}
                    <div className="absolute top-1/2 left-0 w-full h-16 bg-muted-foreground/20 transform -translate-y-1/2">
                      <div className="absolute top-1/2 left-0 w-full h-1 bg-white/50 transform -translate-y-1/2"></div>
                    </div>
                    
                    {/* Vertical road */}
                    <div className="absolute left-1/2 top-0 w-16 h-full bg-muted-foreground/20 transform -translate-x-1/2">
                      <div className="absolute left-1/2 top-0 w-1 h-full bg-white/50 transform -translate-x-1/2"></div>
                    </div>
                  </div>

                  {/* Traffic Light */}
                  <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="bg-card border rounded-lg p-2 shadow-lg">
                      <div className="space-y-2">
                        <div className={`w-4 h-4 rounded-full ${getLightColor('red')}`}></div>
                        <div className={`w-4 h-4 rounded-full ${getLightColor('yellow')}`}></div>
                        <div className={`w-4 h-4 rounded-full ${getLightColor('green')}`}></div>
                      </div>
                    </div>
                  </div>

                  {/* Vehicles */}
                  {vehicles.map(vehicle => (
                    <div
                      key={vehicle.id}
                      className="absolute w-6 h-3 bg-primary rounded-sm transform transition-all duration-100"
                      style={{
                        left: `${vehicle.x}px`,
                        top: `${vehicle.y}px`,
                      }}
                    >
                      <div className="w-full h-full bg-gradient-to-r from-primary to-primary-glow rounded-sm"></div>
                    </div>
                  ))}
                </div>

                {/* Controls */}
                <div className="flex items-center space-x-4 mt-6">
                  <Button onClick={toggleSimulation} variant="default">
                    {isRunning ? (
                      <>
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Start
                      </>
                    )}
                  </Button>
                  
                  <Button onClick={resetSimulation} variant="outline">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                  
                  <div className="text-sm text-muted-foreground">
                    Time: {Math.floor(timer / 10)}s
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Simulation Stats */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Current Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Light State</span>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${getLightColor(lightState)}`}></div>
                    <span className="text-sm font-medium capitalize">{lightState}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Vehicles</span>
                  <span className="text-sm font-medium">{vehicles.length}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Simulation</span>
                  <span className="text-sm font-medium">{isRunning ? 'Running' : 'Stopped'}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Traffic Light Cycle</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-success"></div>
                  <span className="text-sm">Green: 45s</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-warning"></div>
                  <span className="text-sm">Yellow: 5s</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-danger"></div>
                  <span className="text-sm">Red: 70s</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Throughput</span>
                  <span className="text-sm font-medium">24 veh/min</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Avg Wait</span>
                  <span className="text-sm font-medium">32s</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Efficiency</span>
                  <span className="text-sm font-medium text-success">87%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Simulation;