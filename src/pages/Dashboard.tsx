import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";

import { Car, Clock, TrendingUp, AlertTriangle, Activity, Zap, Shield } from "lucide-react";
import { useRealTimeData } from "@/hooks/useRealTimeData";
import { motion } from "framer-motion";

interface Detection {
  id: string;
  timestamp: string;
  junction_id: string;
  vehicles_count: number;
  density: number;
}

interface JunctionStat {
  id: string;
  junction_id: string;
  avg_density: number;
  recommended_green_time: number;
  created_at: string;
}

const Dashboard = () => {
  const [detections, setDetections] = useState<Detection[]>([]);
  const [junctionStats, setJunctionStats] = useState<JunctionStat[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Use real-time data hook
  const realTimeData = useRealTimeData('main', 30000);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: detectionsData } = await supabase
        .from('detections')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(50);
      
      const { data: statsData } = await supabase
        .from('junction_stats')
        .select('*')
        .order('created_at', { ascending: false });

      if (detectionsData) setDetections(detectionsData);
      if (statsData) setJunctionStats(statsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Sample data for demonstration
  const sampleVehicleData = [
    { time: '00:00', vehicles: 45 },
    { time: '00:15', vehicles: 52 },
    { time: '00:30', vehicles: 38 },
    { time: '00:45', vehicles: 61 },
    { time: '01:00', vehicles: 47 },
    { time: '01:15', vehicles: 55 },
    { time: '01:30', vehicles: 42 },
  ];

  const sampleDensityData = [
    { time: '00:00', density: 0.7 },
    { time: '00:15', density: 0.8 },
    { time: '00:30', density: 0.6 },
    { time: '00:45', density: 0.9 },
    { time: '01:00', density: 0.7 },
    { time: '01:15', density: 0.8 },
    { time: '01:30', density: 0.6 },
  ];

  const recommendedGreenTime = junctionStats.length > 0 
    ? junctionStats[0].recommended_green_time 
    : 45;

  if (loading || realTimeData.loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Traffic Dashboard</h1>
          <p className="text-muted-foreground">Real-time traffic analytics and optimization insights</p>
        </div>

        {/* Emergency Alerts */}
        {realTimeData.emergencyAlerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="bg-danger/10 border border-danger/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-5 w-5 text-danger" />
                <span className="font-semibold text-danger">Emergency Alert</span>
              </div>
              {realTimeData.emergencyAlerts.map((alert, index) => (
                <div key={index} className="text-sm text-danger/80">
                  {alert.message}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Key Metrics */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Car className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Live Vehicle Count</p>
                    <p className="text-2xl font-bold">{realTimeData.trafficDensity.vehicleCount}</p>
                    <p className="text-xs text-success">
                      {realTimeData.trafficDensity.congestionLevel} congestion
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-success/10 rounded-full">
                    <Clock className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Optimal Green Time</p>
                    <p className="text-2xl font-bold">{realTimeData.signalTiming.greenTime}s</p>
                    <p className="text-xs text-muted-foreground">
                      Cycle: {realTimeData.signalTiming.cycleTime}s
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-warning/10 rounded-full">
                    <TrendingUp className="h-6 w-6 text-warning" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Traffic Density</p>
                    <p className="text-2xl font-bold">
                      {(realTimeData.trafficDensity.density * 100).toFixed(0)}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Avg Speed: {realTimeData.trafficDensity.averageSpeed}km/h
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-full ${realTimeData.emergencyVehicles.length > 0 ? 'bg-danger/10' : 'bg-accent/10'}`}>
                    {realTimeData.emergencyVehicles.length > 0 ? (
                      <Zap className="h-6 w-6 text-danger" />
                    ) : (
                      <AlertTriangle className="h-6 w-6 text-accent" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">System Status</p>
                    <p className="text-2xl font-bold">
                      {realTimeData.emergencyVehicles.length > 0 ? 'PRIORITY' : 'NORMAL'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {realTimeData.isConnected ? 'Connected' : 'Offline'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Key Metrics - First 2 columns */}
          <div className="lg:col-span-2 grid md:grid-cols-2 gap-6">
            {/* Vehicles per Minute Chart */}
            <Card className="shadow-[var(--shadow-card)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5 text-primary" />
                  Vehicles per Minute
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sampleVehicleData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="vehicles" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Traffic Density Line Graph */}
            <Card className="shadow-[var(--shadow-card)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-success" />
                  Traffic Density
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sampleDensityData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="density" 
                        stroke="hsl(var(--success))" 
                        strokeWidth={3}
                        dot={{ fill: "hsl(var(--success))" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Optimization Stats - Third column */}
          <div className="space-y-6">
            {/* Optimization Stats */}
            <Card className="shadow-[var(--shadow-card)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-accent" />
                  Optimization
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-success mb-1">{realTimeData.signalTiming.greenTime}s</div>
                  <p className="text-sm text-muted-foreground">Recommended Green Time</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-warning mb-1">{realTimeData.signalTiming.efficiency.toFixed(0)}%</div>
                  <p className="text-sm text-muted-foreground">Traffic Efficiency</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary mb-1">{realTimeData.signalTiming.waitTimeReduction.toFixed(1)}s</div>
                  <p className="text-sm text-muted-foreground">Wait Time Reduction</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;