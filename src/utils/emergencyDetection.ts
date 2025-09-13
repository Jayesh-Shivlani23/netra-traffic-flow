// Emergency Vehicle Detection and Priority Override

export interface EmergencyVehicle {
  id: string;
  type: 'ambulance' | 'fire_truck' | 'police';
  confidence: number;
  direction: 'north' | 'south' | 'east' | 'west';
  estimatedArrival: number; // seconds
  priority: number;
  timestamp: Date;
}

export interface EmergencyAlert {
  vehicleId: string;
  junctionId: string;
  message: string;
  action: 'preempt' | 'clear_path' | 'extend_green';
  duration: number;
  timestamp: Date;
}

export class EmergencyVehicleDetector {
  private readonly EMERGENCY_CONFIDENCE_THRESHOLD = 0.7;
  private readonly PRIORITY_LEVELS = {
    fire_truck: 1,     // Highest priority
    ambulance: 2,      // High priority
    police: 3          // Standard priority
  };

  private activeEmergencyVehicles: Map<string, EmergencyVehicle> = new Map();
  private emergencyAlerts: EmergencyAlert[] = [];

  detectEmergencyVehicles(detections: any[]): EmergencyVehicle[] {
    const emergencyVehicles = detections
      .filter(detection => this.isEmergencyVehicle(detection))
      .map(detection => this.createEmergencyVehicle(detection))
      .filter(vehicle => vehicle.confidence >= this.EMERGENCY_CONFIDENCE_THRESHOLD);

    // Update active vehicles
    emergencyVehicles.forEach(vehicle => {
      this.activeEmergencyVehicles.set(vehicle.id, vehicle);
    });

    // Clean up old detections (older than 2 minutes)
    this.cleanupOldDetections();

    return Array.from(this.activeEmergencyVehicles.values());
  }

  private isEmergencyVehicle(detection: any): boolean {
    // Simple heuristic based on size, color patterns, and shape
    const hasLights = detection.hasFlashingLights || false;
    const hasProperSize = detection.width > 200 && detection.height > 100;
    const hasEmergencyMarking = detection.hasEmergencyMarking || false;
    
    return hasLights || hasEmergencyMarking || (hasProperSize && detection.speed > 30);
  }

  private createEmergencyVehicle(detection: any): EmergencyVehicle {
    return {
      id: `emergency-${Date.now()}-${Math.random()}`,
      type: this.classifyEmergencyType(detection),
      confidence: detection.confidence || 0.8,
      direction: this.determineDirection(detection),
      estimatedArrival: this.calculateArrivalTime(detection),
      priority: this.getPriority(this.classifyEmergencyType(detection)),
      timestamp: new Date()
    };
  }

  private classifyEmergencyType(detection: any): EmergencyVehicle['type'] {
    // Simple classification logic
    if (detection.color === 'red' && detection.size === 'large') return 'fire_truck';
    if (detection.hasAmbulanceMarking || detection.color === 'white') return 'ambulance';
    return 'police';
  }

  private determineDirection(detection: any): EmergencyVehicle['direction'] {
    const { x, y, previousX = 0, previousY = 0 } = detection;
    
    const deltaX = x - previousX;
    const deltaY = y - previousY;
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      return deltaX > 0 ? 'east' : 'west';
    } else {
      return deltaY > 0 ? 'south' : 'north';
    }
  }

  private calculateArrivalTime(detection: any): number {
    const distance = detection.distanceToIntersection || 100; // meters
    const speed = detection.speed || 15; // m/s
    return Math.round(distance / speed);
  }

  private getPriority(type: EmergencyVehicle['type']): number {
    return this.PRIORITY_LEVELS[type];
  }

  private cleanupOldDetections(): void {
    const now = Date.now();
    const maxAge = 2 * 60 * 1000; // 2 minutes

    for (const [id, vehicle] of this.activeEmergencyVehicles) {
      if (now - vehicle.timestamp.getTime() > maxAge) {
        this.activeEmergencyVehicles.delete(id);
      }
    }
  }

  createEmergencyAlert(
    vehicle: EmergencyVehicle, 
    junctionId: string
  ): EmergencyAlert {
    const alert: EmergencyAlert = {
      vehicleId: vehicle.id,
      junctionId,
      message: this.generateAlertMessage(vehicle),
      action: this.determineAction(vehicle),
      duration: this.calculatePreemptionDuration(vehicle),
      timestamp: new Date()
    };

    this.emergencyAlerts.push(alert);
    return alert;
  }

  private generateAlertMessage(vehicle: EmergencyVehicle): string {
    const typeMap = {
      ambulance: 'Ambulance',
      fire_truck: 'Fire Truck',
      police: 'Police Vehicle'
    };

    return `${typeMap[vehicle.type]} approaching from ${vehicle.direction}. ETA: ${vehicle.estimatedArrival}s`;
  }

  private determineAction(vehicle: EmergencyVehicle): EmergencyAlert['action'] {
    if (vehicle.estimatedArrival <= 10) return 'preempt';
    if (vehicle.estimatedArrival <= 30) return 'clear_path';
    return 'extend_green';
  }

  private calculatePreemptionDuration(vehicle: EmergencyVehicle): number {
    const baseDuration = 60; // 1 minute
    const priorityMultiplier = 1 / vehicle.priority;
    const urgencyMultiplier = Math.max(1, 30 / vehicle.estimatedArrival);
    
    return Math.round(baseDuration * priorityMultiplier * urgencyMultiplier);
  }

  getActiveAlerts(): EmergencyAlert[] {
    // Return only recent alerts (last 5 minutes)
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    return this.emergencyAlerts.filter(
      alert => alert.timestamp.getTime() > fiveMinutesAgo
    );
  }

  hasActiveEmergencyVehicles(): boolean {
    return this.activeEmergencyVehicles.size > 0;
  }

  getHighestPriorityVehicle(): EmergencyVehicle | null {
    if (this.activeEmergencyVehicles.size === 0) return null;
    
    return Array.from(this.activeEmergencyVehicles.values())
      .sort((a, b) => a.priority - b.priority)[0];
  }
}