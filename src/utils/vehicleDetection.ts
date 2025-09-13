// Enhanced Vehicle Detection with confidence filtering and classification

export interface DetectionResult {
  id: string;
  vehicleType: 'car' | 'truck' | 'bus' | 'motorcycle' | 'bicycle';
  confidence: number;
  x: number;
  y: number;
  width: number;
  height: number;
  timestamp: Date;
}

export interface TrafficDensity {
  vehicleCount: number;
  density: number;
  congestionLevel: 'low' | 'medium' | 'high';
  averageSpeed: number;
  queueLength: number;
}

export class EnhancedVehicleDetector {
  private readonly CONFIDENCE_THRESHOLD = 0.5;
  private readonly VEHICLE_WEIGHTS = {
    car: 1.0,
    motorcycle: 0.5,
    bicycle: 0.3,
    truck: 2.0,
    bus: 2.5
  };

  filterDetectionsByConfidence(detections: any[]): DetectionResult[] {
    return detections
      .filter(detection => detection.confidence >= this.CONFIDENCE_THRESHOLD)
      .map(detection => ({
        id: `${Date.now()}-${Math.random()}`,
        vehicleType: this.classifyVehicle(detection),
        confidence: detection.confidence,
        x: detection.x,
        y: detection.y,
        width: detection.width,
        height: detection.height,
        timestamp: new Date()
      }));
  }

  private classifyVehicle(detection: any): DetectionResult['vehicleType'] {
    // Simple classification based on size ratios
    const area = detection.width * detection.height;
    const aspectRatio = detection.width / detection.height;

    if (area > 15000) return 'bus';
    if (area > 10000) return 'truck';
    if (aspectRatio < 0.8) return 'motorcycle';
    if (area < 3000) return 'bicycle';
    return 'car';
  }

  calculateTrafficDensity(detections: DetectionResult[], roadCapacity: number = 50): TrafficDensity {
    const totalVehicles = detections.length;
    const weightedCount = detections.reduce((sum, detection) => 
      sum + this.VEHICLE_WEIGHTS[detection.vehicleType], 0
    );
    
    const density = Math.min(weightedCount / roadCapacity, 1.0);
    const congestionLevel = this.getCongestionLevel(density);
    
    return {
      vehicleCount: totalVehicles,
      density,
      congestionLevel,
      averageSpeed: this.estimateAverageSpeed(density),
      queueLength: Math.round(weightedCount * 0.8) // Estimate queue length
    };
  }

  private getCongestionLevel(density: number): 'low' | 'medium' | 'high' {
    if (density < 0.3) return 'low';
    if (density < 0.7) return 'medium';
    return 'high';
  }

  private estimateAverageSpeed(density: number): number {
    // Speed decreases with density (km/h)
    const maxSpeed = 50;
    return Math.round(maxSpeed * (1 - density * 0.8));
  }
}