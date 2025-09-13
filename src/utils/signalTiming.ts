// Smart Signal Timing Algorithm

import { TrafficDensity } from './vehicleDetection';

export interface SignalTimingResult {
  greenTime: number;
  redTime: number;
  cycleTime: number;
  efficiency: number;
  waitTimeReduction: number;
}

export interface JunctionConfig {
  id: string;
  maxGreenTime: number;
  minGreenTime: number;
  baseRedTime: number;
  rushHourMultiplier: number;
}

export class SmartSignalController {
  private readonly DEFAULT_CONFIG: JunctionConfig = {
    id: 'default',
    maxGreenTime: 90,
    minGreenTime: 15,
    baseRedTime: 30,
    rushHourMultiplier: 1.3
  };

  calculateOptimalTiming(
    trafficDensity: TrafficDensity,
    config: JunctionConfig = this.DEFAULT_CONFIG,
    isRushHour: boolean = false
  ): SignalTimingResult {
    const { density, vehicleCount, queueLength, congestionLevel } = trafficDensity;
    
    // Base green time calculation
    let greenTime = this.calculateBaseGreenTime(density, vehicleCount, config);
    
    // Apply rush hour adjustments
    if (isRushHour) {
      greenTime *= config.rushHourMultiplier;
    }
    
    // Apply congestion level adjustments
    greenTime = this.applyCongestionAdjustment(greenTime, congestionLevel);
    
    // Ensure within bounds
    greenTime = Math.max(config.minGreenTime, Math.min(greenTime, config.maxGreenTime));
    
    // Calculate other timing parameters
    const redTime = this.calculateRedTime(greenTime, queueLength, config);
    const cycleTime = greenTime + redTime;
    
    // Calculate efficiency metrics
    const efficiency = this.calculateEfficiency(trafficDensity, greenTime);
    const waitTimeReduction = this.calculateWaitTimeReduction(trafficDensity, greenTime);
    
    return {
      greenTime: Math.round(greenTime),
      redTime: Math.round(redTime),
      cycleTime: Math.round(cycleTime),
      efficiency,
      waitTimeReduction
    };
  }

  private calculateBaseGreenTime(density: number, vehicleCount: number, config: JunctionConfig): number {
    // Linear relationship between density and green time
    const densityFactor = density * 0.8;
    const vehicleFactor = Math.min(vehicleCount / 20, 1.0) * 0.2;
    
    const totalFactor = densityFactor + vehicleFactor;
    const range = config.maxGreenTime - config.minGreenTime;
    
    return config.minGreenTime + (range * totalFactor);
  }

  private applyCongestionAdjustment(greenTime: number, congestionLevel: 'low' | 'medium' | 'high'): number {
    const adjustments = {
      low: 0.8,    // Reduce green time for low traffic
      medium: 1.0,  // Keep standard timing
      high: 1.4     // Increase green time for high traffic
    };
    
    return greenTime * adjustments[congestionLevel];
  }

  private calculateRedTime(greenTime: number, queueLength: number, config: JunctionConfig): number {
    // Base red time with adjustment for queue clearance
    const queueClearanceTime = queueLength * 2; // 2 seconds per vehicle
    return Math.max(config.baseRedTime, queueClearanceTime);
  }

  private calculateEfficiency(trafficDensity: TrafficDensity, greenTime: number): number {
    const { density, vehicleCount } = trafficDensity;
    
    // Efficiency based on throughput vs wait time
    const throughput = (vehicleCount * greenTime) / 60; // vehicles per minute
    const optimalThroughput = 30; // target vehicles per minute
    
    return Math.min((throughput / optimalThroughput) * 100, 100);
  }

  private calculateWaitTimeReduction(trafficDensity: TrafficDensity, greenTime: number): number {
    const { queueLength } = trafficDensity;
    
    // Estimate wait time reduction based on queue clearing
    const standardWaitTime = queueLength * 3; // 3 seconds per vehicle
    const optimizedWaitTime = Math.max(queueLength * 2, greenTime * 0.3);
    
    return Math.max(0, standardWaitTime - optimizedWaitTime);
  }

  // Emergency preemption logic
  preemptForEmergency(currentTiming: SignalTimingResult): SignalTimingResult {
    return {
      ...currentTiming,
      greenTime: 120, // Extended green for emergency vehicles
      redTime: 10,    // Minimal red time
      cycleTime: 130,
      efficiency: 100, // Full priority
      waitTimeReduction: currentTiming.waitTimeReduction + 60
    };
  }

  isRushHour(): boolean {
    const now = new Date();
    const hour = now.getHours();
    
    // Rush hours: 7-9 AM and 5-7 PM
    return (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
  }
}