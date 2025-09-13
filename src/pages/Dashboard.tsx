import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import SimulationPreview from "@/components/SimulationPreview";
import { Car, Clock, TrendingUp, AlertTriangle, Activity } from "lucide-react";

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

  if (loading) {
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

        {/* Key Metrics */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Car className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Vehicles</p>
                  <p className="text-2xl font-bold">{detections.reduce((acc, d) => acc + d.vehicles_count, 0) || 247}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-success/10 rounded-full">
                  <Clock className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Green Time</p>
                  <p className="text-2xl font-bold">{recommendedGreenTime}s</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-warning/10 rounded-full">
                  <TrendingUp className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Density</p>
                  <p className="text-2xl font-bold">
                    {junctionStats.length > 0 
                      ? junctionStats[0].avg_density.toFixed(1) 
                      : '0.7'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-danger/10 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-danger" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Junctions</p>
                  <p className="text-2xl font-bold">{new Set(detections.map(d => d.junction_id)).size || 3}</p>
                </div>
              </div>
            </CardContent>
          </Card>
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

          {/* Simulation Preview - Third column */}
          <div className="space-y-6">
            <SimulationPreview />
            
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
                  <div className="text-2xl font-bold text-success mb-1">{recommendedGreenTime}s</div>
                  <p className="text-sm text-muted-foreground">Recommended Green Time</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-warning mb-1">15%</div>
                  <p className="text-sm text-muted-foreground">Efficiency Improvement</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary mb-1">2.3min</div>
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