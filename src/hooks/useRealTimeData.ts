// Real-time Dashboard Updates Hook

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { EnhancedVehicleDetector, TrafficDensity } from '@/utils/vehicleDetection';
import { SmartSignalController, SignalTimingResult } from '@/utils/signalTiming';
import { EmergencyVehicleDetector, EmergencyVehicle, EmergencyAlert } from '@/utils/emergencyDetection';

export interface RealTimeData {
  detections: any[];
  trafficDensity: TrafficDensity;
  signalTiming: SignalTimingResult;
  emergencyVehicles: EmergencyVehicle[];
  emergencyAlerts: EmergencyAlert[];
  lastUpdated: Date;
  isConnected: boolean;
}

export const useRealTimeData = (junctionId: string = 'main', refreshInterval: number = 30000) => {
  const [data, setData] = useState<RealTimeData>({
    detections: [],
    trafficDensity: {
      vehicleCount: 0,
      density: 0,
      congestionLevel: 'low',
      averageSpeed: 50,
      queueLength: 0
    },
    signalTiming: {
      greenTime: 45,
      redTime: 30,
      cycleTime: 75,
      efficiency: 75,
      waitTimeReduction: 0
    },
    emergencyVehicles: [],
    emergencyAlerts: [],
    lastUpdated: new Date(),
    isConnected: false
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize detectors
  const vehicleDetector = new EnhancedVehicleDetector();
  const signalController = new SmartSignalController();
  const emergencyDetector = new EmergencyVehicleDetector();

  const fetchLatestData = useCallback(async () => {
    try {
      setError(null);
      
      // Fetch latest detections
      const { data: detectionsData, error: detectionsError } = await supabase
        .from('detections')
        .select('*')
        .eq('junction_id', junctionId)
        .order('timestamp', { ascending: false })
        .limit(10);

      if (detectionsError) throw detectionsError;

      // Process detections with enhanced algorithm
      const rawDetections = detectionsData || [];
      const processedDetections = vehicleDetector.filterDetectionsByConfidence(rawDetections);
      
      // Calculate traffic density
      const trafficDensity = vehicleDetector.calculateTrafficDensity(processedDetections);
      
      // Detect emergency vehicles
      const emergencyVehicles = emergencyDetector.detectEmergencyVehicles(rawDetections);
      const emergencyAlerts = emergencyDetector.getActiveAlerts();
      
      // Calculate optimal signal timing
      const isRushHour = signalController.isRushHour();
      let signalTiming = signalController.calculateOptimalTiming(trafficDensity, undefined, isRushHour);
      
      // Apply emergency preemption if needed
      if (emergencyDetector.hasActiveEmergencyVehicles()) {
        signalTiming = signalController.preemptForEmergency(signalTiming);
      }

      // Update database with new recommendations
      await updateJunctionStats(junctionId, trafficDensity, signalTiming);

      setData({
        detections: rawDetections,
        trafficDensity,
        signalTiming,
        emergencyVehicles,
        emergencyAlerts,
        lastUpdated: new Date(),
        isConnected: true
      });

    } catch (err) {
      console.error('Error fetching real-time data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      setData(prev => ({ ...prev, isConnected: false }));
    } finally {
      setLoading(false);
    }
  }, [junctionId]);

  const updateJunctionStats = async (
    junctionId: string, 
    density: TrafficDensity, 
    timing: SignalTimingResult
  ) => {
    try {
      const { error } = await supabase
        .from('junction_stats')
        .upsert({
          junction_id: junctionId,
          avg_density: density.density,
          recommended_green_time: timing.greenTime,
          efficiency: timing.efficiency,
          wait_time_reduction: timing.waitTimeReduction,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (err) {
      console.error('Error updating junction stats:', err);
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    const subscription = supabase
      .channel(`detections-${junctionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'detections',
          filter: `junction_id=eq.${junctionId}`
        },
        () => {
          fetchLatestData();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [junctionId, fetchLatestData]);

  // Set up periodic refresh
  useEffect(() => {
    fetchLatestData();

    const interval = setInterval(fetchLatestData, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchLatestData, refreshInterval]);

  // Emergency alert handler
  const handleEmergencyAlert = useCallback((alert: EmergencyAlert) => {
    // This could trigger notifications, API calls, etc.
    console.log('Emergency Alert:', alert);
    
    // Update signal timing immediately for emergency
    setData(prev => ({
      ...prev,
      signalTiming: signalController.preemptForEmergency(prev.signalTiming),
      lastUpdated: new Date()
    }));
  }, []);

  // Manual refresh function
  const refresh = useCallback(() => {
    setLoading(true);
    fetchLatestData();
  }, [fetchLatestData]);

  return {
    ...data,
    loading,
    error,
    refresh,
    handleEmergencyAlert
  };
};