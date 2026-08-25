// services/fraud/OdometerFraudDetectionService.ts

import { 
  FraudDetectionState, 
  FraudAnomaly, 
  OdometerReading, 
  VehicleProfile 
} from '../../store/types/fraudTypes';

interface CheckResult {
  enabled: boolean;
  anomalies: FraudAnomaly[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  threshold: number;
  lastKnownMileage: number | null;
  timeWindow: number;
  ecu_checks: boolean;
  checksumValidation: boolean;
}

interface FraudDetectionResult {
  overallRiskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  status: 'clean' | 'suspicious' | 'high_risk';
  checkResults: Partial<FraudDetectionState['checks']>;
  realECUDataUsed: boolean; // NEW: Track if real ECU data was used
  dataSourceAnalysis: {
    primarySource: 'obd' | 'manual' | 'service_record';
    dataQuality: 'high' | 'medium' | 'low';
    ecuConsistency: number; // 0-100 score
    crossValidationScore: number; // 0-100 score
  };
}

class OdometerFraudDetectionService {
  private obdService: any = null;
  private isRealTimeEnabled: boolean = false;
  private lastProcessedReading: OdometerReading | null = null;
  private realtimeCheckInterval: number = 30000; // 30 seconds
  private eventSubscriptions: Map<string, Function> = new Map();
  // Internal historical data storage for real-time comparison
  private realtimeHistoricalData: OdometerReading[] = [];
  private maxHistoricalEntries = 50; // Keep last 50 readings

  /**
   * Initialize real-time ECU monitoring
   */
  public initializeRealTimeMonitoring(obdService: any): void {
    
    
    this.obdService = obdService;
    this.isRealTimeEnabled = true;

    // Subscribe to live odometer data updates
    this.subscribeToOdometerUpdates();
    
    // Subscribe to other fraud-relevant data
    this.subscribeToFraudRelevantData();
    
    
  }

  /**
   * Subscribe to live odometer data from OBD service
   */
  private subscribeToOdometerUpdates(): void {
    if (!this.obdService) return;

    // Subscribe to OBD service events - correct pattern
    const odometerSubscription = this.obdService.subscribe((eventType: string, data: any) => {
      if (eventType === 'dataUpdate' && this.isOdometerData(data)) {
        
        this.processRealTimeOdometerData(data);
      }
    });

    this.eventSubscriptions.set('odometer', odometerSubscription);
  }

  /**
   * Subscribe to fraud-relevant ECU parameters
   */
  private subscribeToFraudRelevantData(): void {
    if (!this.obdService) return;

    const relevantPIDs = [
      'DISTANCE_SINCE_CODES_CLEARED',
      'DISTANCE_WITH_MIL_ON', 
      'RUNTIME_SINCE_ENGINE_START',
      'ENGINE_RUNTIME',
      'VEHICLE_SPEED',
      'ENGINE_RPM'
    ];

    // Subscribe to OBD service events - correct pattern
    const fraudDataSubscription = this.obdService.subscribe((eventType: string, data: any) => {
      if (eventType === 'dataUpdate' && relevantPIDs.includes(data.name)) {
        
        this.processFraudRelevantData(data);
      }
    });

    this.eventSubscriptions.set('fraudData', fraudDataSubscription);
  }

  /**
   * Check if received data is odometer-related
   */
  private isOdometerData(data: any): boolean {
    const odometerNames = [
      'TOTAL_DISTANCE',
      'ODOMETER_STANDARD', 
      'ODOMETER_TOYOTA',
      'ODOMETER_FORD',
      'ODOMETER_GM',
      'MILEAGE'
    ];
    
    return odometerNames.some(name => 
      data.name === name || 
      (data.name && data.name.includes('ODOMETER')) ||
      (data.name && data.name.includes('DISTANCE'))
    );
  }

  /**
   * Process real-time odometer data and trigger fraud detection
   */
  private async processRealTimeOdometerData(data: any): Promise<void> {
    try {
      // Convert OBD data to OdometerReading format
      const odometerReading: OdometerReading = {
        id: `realtime_${Date.now()}`,
        odometer: data.value,
        mileage: data.value,
        timestamp: data.timestamp || new Date().toISOString(),
        source: 'obd' as const,
        vehicleSpeed: this.getLatestValue('VEHICLE_SPEED'),
        engineRPM: this.getLatestValue('ENGINE_RPM'),
        distanceSinceCodesCleared: this.getLatestValue('DISTANCE_SINCE_CODES_CLEARED'),
        distanceWithMILOn: this.getLatestValue('DISTANCE_WITH_MIL_ON'),
        engineHours: this.calculateEngineHours(),
        raw: data.raw || ''
      };

      // Check if this is a new reading (avoid duplicate processing)
      
      if (this.isNewReading(odometerReading)) {
        
        
        // Use real-time historical data for comparison (more reliable than Redux store)
        const historicalData = [...this.realtimeHistoricalData];
        
        
        // Run fraud detection on real-time data
        const fraudResult = await this.detectFraud(odometerReading, historicalData);
        
        // Store this reading in our real-time history AFTER fraud detection
        this.addToRealtimeHistory(odometerReading);
        
        
        
        
        // Emit fraud detection results
        this.emitFraudDetectionResult(fraudResult, odometerReading);
        
        this.lastProcessedReading = odometerReading;
      }
    } catch (error) {
      
    }
  }

  /**
   * Process other fraud-relevant ECU data
   */
  private processFraudRelevantData(data: any): void {
    // Store latest values for correlation analysis
    this.storeLatestValue(data.name, data.value, data.timestamp);
    
    // Trigger immediate validation if we have concerning patterns
    if (this.detectImmediateConcerns(data)) {
      
      this.triggerImmediateFraudCheck();
    }
  }

  /**
   * Check if this is a new reading to avoid duplicate processing
   */
  private isNewReading(newReading: OdometerReading): boolean {
    if (!this.lastProcessedReading) return true;
    
    const timeDiff = new Date(newReading.timestamp).getTime() - 
                    new Date(this.lastProcessedReading.timestamp).getTime();
    
    // Only process if more than 10 seconds have passed or value changed significantly
    return timeDiff > 10000 || 
           Math.abs((newReading.odometer || 0) - (this.lastProcessedReading.odometer || 0)) > 0.1;
  }

  /**
   * Emit fraud detection results to Redux store
   */
  private emitFraudDetectionResult(fraudResult: any, odometerReading: OdometerReading): void {
    
    
    
    
    // Emit event that Redux middleware can listen to
    this.obdService?.emit('fraudDetectionResult', {
      result: fraudResult,
      reading: odometerReading,
      timestamp: new Date().toISOString(),
      source: 'realtime'
    });
    
    
  }

  /**
   * Detect immediate concerns that require instant analysis
   */
  private detectImmediateConcerns(data: any): boolean {
    // Check for impossible values that indicate immediate tampering
    if (data.name === 'VEHICLE_SPEED' && data.value > 300) return true;
    if (data.name === 'ENGINE_RPM' && data.value > 8000) return true;
    
    // Check for speed without RPM (impossible scenario)
    const currentSpeed = data.name === 'VEHICLE_SPEED' ? data.value : this.getLatestValue('VEHICLE_SPEED');
    const currentRPM = data.name === 'ENGINE_RPM' ? data.value : this.getLatestValue('ENGINE_RPM');
    
    if (currentSpeed > 0 && currentRPM === 0) return true;
    
    return false;
  }

  /**
   * Trigger immediate fraud check for concerning patterns
   */
  private async triggerImmediateFraudCheck(): Promise<void> {
    if (!this.lastProcessedReading) return;
    
    try {
      const historicalData = this.getHistoricalData();
      const fraudResult = await this.detectFraud(this.lastProcessedReading, historicalData);
      
      this.emitFraudDetectionResult(fraudResult, this.lastProcessedReading);
    } catch (error) {
      
    }
  }

  // Helper methods for data management
  private latestValues: Map<string, { value: any, timestamp: string }> = new Map();

  private storeLatestValue(name: string, value: any, timestamp: string): void {
    this.latestValues.set(name, { value, timestamp });
  }

  private getLatestValue(name: string): any {
    return this.latestValues.get(name)?.value;
  }

  private calculateEngineHours(): number | undefined {
    const runtime = this.getLatestValue('RUNTIME_SINCE_ENGINE_START');
    if (runtime) {
      return runtime / 3600; // Convert seconds to hours
    }
    return undefined;
  }

  private reduxStore: any = null;

  /**
   * Set Redux store reference for accessing historical data
   */
  public setReduxStore(store: any): void {
    this.reduxStore = store;
    
  }

  private getHistoricalData(): OdometerReading[] {
    try {
      if (this.reduxStore) {
        const state = this.reduxStore.getState();
        return state.data?.historicalData || [];
      }
      return [];
    } catch (error) {
      
      return [];
    }
  }

  /**
   * Add reading to real-time historical data for fraud comparison
   */
  private addToRealtimeHistory(reading: OdometerReading): void {
    // Add to historical data
    this.realtimeHistoricalData.push(reading);
    
    // Maintain max size (keep only recent readings)
    if (this.realtimeHistoricalData.length > this.maxHistoricalEntries) {
      this.realtimeHistoricalData = this.realtimeHistoricalData.slice(-this.maxHistoricalEntries);
    }
    
    
  }

  /**
   * Clear real-time historical data
   */
  private clearRealtimeHistory(): void {
    this.realtimeHistoricalData = [];
    
  }

  /**
   * Disable real-time monitoring
   */
  public disableRealTimeMonitoring(): void {
    
    
    this.isRealTimeEnabled = false;
    
    // Unsubscribe from all events
    this.eventSubscriptions.forEach((unsubscribe, key) => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    });
    
    this.eventSubscriptions.clear();
    this.obdService = null;
    
    // Clear historical data when stopping monitoring
    this.clearRealtimeHistory();
    
    
  }

  /**
   * Check if real-time monitoring is active
   */
  public isRealTimeActive(): boolean {
    return this.isRealTimeEnabled && this.obdService !== null;
  }

  /**
   * Run fraud detection - wrapper method for actions compatibility
   */
  public async runFraudDetection(
    currentReading: OdometerReading,
    historicalData: OdometerReading[],
    vehicleProfile?: VehicleProfile,
    fraudDetectionSettings?: FraudDetectionState
  ): Promise<{
    riskScore: number;
    status: 'clean' | 'suspicious' | 'high_risk';
    checkResults: any;
    alerts: any[];
  }> {
    const result = await this.detectFraud(currentReading, historicalData, vehicleProfile, fraudDetectionSettings);
    
    return {
      riskScore: result.overallRiskScore,
      status: result.status,
      checkResults: result.checkResults,
      alerts: [] // Convert anomalies to alerts format if needed
    };
  }

  /**
   * Enhanced fraud detection that prioritizes real ECU data
   */
  public async detectFraud(
    currentReading: OdometerReading,
    historicalData: OdometerReading[],
    vehicleProfile?: VehicleProfile,
    fraudDetectionSettings?: FraudDetectionState
  ): Promise<FraudDetectionResult> {
    
    
    
    
    
    // Initialize result
    const result: FraudDetectionResult = {
      overallRiskScore: 0,
      riskLevel: 'low',
      status: 'clean',
      checkResults: {},
      realECUDataUsed: currentReading.source === 'obd',
      dataSourceAnalysis: {
        primarySource: currentReading.source,
        dataQuality: this.assessDataQuality(currentReading, historicalData),
        ecuConsistency: 0,
        crossValidationScore: 0
      }
    };

    // Enhanced ECU data analysis for OBD readings
    if (currentReading.source === 'obd') {
      
      result.dataSourceAnalysis.ecuConsistency = this.calculateECUConsistency(currentReading, historicalData);
      result.dataSourceAnalysis.crossValidationScore = this.performCrossValidation(currentReading);
    } else {
      
    }

    // Run all fraud detection checks (only enabled ones)
    const checks = await Promise.all([
      this.detectOdometerRollback(currentReading, historicalData, vehicleProfile, fraudDetectionSettings),
      this.detectInconsistencies(currentReading, historicalData, vehicleProfile, fraudDetectionSettings),
      this.detectDigitalTampering(currentReading, historicalData, vehicleProfile, fraudDetectionSettings),
      this.checkDataIntegrity(currentReading, historicalData, vehicleProfile, fraudDetectionSettings),
      this.performECUCrossValidation(currentReading, historicalData, vehicleProfile, fraudDetectionSettings) // NEW
    ]);

    // Aggregate results
    result.checkResults = {
      odometerRollback: checks[0],
      inconsistentReporting: checks[1],
      digitalTampering: checks[2],
      dataIntegrity: checks[3]
    };

    // Calculate overall risk score with ECU data weighting
    result.overallRiskScore = this.calculateOverallRiskScore(checks, result.realECUDataUsed);
    result.riskLevel = this.determineRiskLevel(result.overallRiskScore);
    result.status = this.determineStatus(result.riskLevel);

    

    return result;
  }

  /**
   * NEW: Perform ECU cross-validation using multiple data points
   */
  private async performECUCrossValidation(
    currentReading: OdometerReading,
    historicalData: OdometerReading[],
    vehicleProfile?: VehicleProfile,
    fraudDetectionSettings?: FraudDetectionState
  ): Promise<CheckResult> {
    const result: CheckResult = this.getEmptyCheckResult();
    
    // Check if we have OBD data and if ECU validation is enabled in settings
    const hasObdData = currentReading.source === 'obd';
    const isEnabledInSettings = fraudDetectionSettings?.checks?.digitalTampering?.enabled ?? true;
    result.enabled = hasObdData && isEnabledInSettings;

    if (!hasObdData) {
      
      return result;
    }
    
    if (!isEnabledInSettings) {
      
      return result;
    }

    

    // 1. Engine hours vs odometer correlation
    if (currentReading.engineHours && currentReading.odometer) {
      const correlation = this.validateEngineHoursCorrelation(
        currentReading.engineHours,
        currentReading.odometer,
        vehicleProfile
      );

      if (correlation.riskLevel === 'high' || correlation.riskLevel === 'critical') {
        result.anomalies.push({
          id: this.generateId(),
          type: 'engine_hours_odometer_correlation',
          description: `Poor correlation between engine hours and odometer: ${correlation.description}`,
          severity: correlation.riskLevel,
          timestamp: new Date().toISOString(),
          data: correlation.data,
        });
      }
    }

    // 2. Distance consistency across multiple ECU sources
    if (currentReading.distanceSinceCodesCleared !== undefined) {
      const distanceConsistency = this.validateDistanceConsistency(currentReading, historicalData);
      
      if (distanceConsistency.suspicious) {
        result.anomalies.push({
          id: this.generateId(),
          type: 'distance_source_inconsistency',
          description: 'Inconsistency between different ECU distance measurements',
          severity: 'medium',
          timestamp: new Date().toISOString(),
          data: distanceConsistency,
        });
      }
    }

    // 3. Real-time ECU parameter validation
    const realtimeValidation = this.validateRealtimeECUParameters(currentReading);
    if (realtimeValidation.anomalies.length > 0) {
      result.anomalies.push(...realtimeValidation.anomalies);
    }

    result.confidence = result.anomalies.length > 0 ? 85 : 95; // Higher confidence with ECU data
    result.riskLevel = this.calculateRiskLevelFromAnomalies(result.anomalies);

    return result;
  }

  /**
   * Validate engine hours to odometer correlation
   */
  private validateEngineHoursCorrelation(
    engineHours: number,
    odometer: number,
    vehicleProfile?: VehicleProfile
  ): { riskLevel: 'low' | 'medium' | 'high' | 'critical', description: string, data: any } {
    
    // Expected average speeds by vehicle type
    const expectedSpeeds = {
      passenger: { min: 20, max: 40 }, // mph
      commercial: { min: 25, max: 50 },
      heavy_duty: { min: 30, max: 55 },
      default: { min: 20, max: 45 }
    };

    const vehicleType = this.determineVehicleType(vehicleProfile);
    const speedRange = expectedSpeeds[vehicleType] || expectedSpeeds.default;
    
    // Convert km to miles for speed calculation
    const odometerMiles = odometer * 0.621371;
    const averageSpeed = odometerMiles / engineHours;

    const data = {
      engineHours,
      odometer,
      odometerMiles,
      averageSpeed,
      expectedSpeedRange: speedRange,
      vehicleType
    };

    if (averageSpeed < speedRange.min * 0.3) {
      return {
        riskLevel: 'critical',
        description: `Extremely low average speed (${averageSpeed.toFixed(1)} mph) suggests odometer tampering`,
        data
      };
    } else if (averageSpeed < speedRange.min * 0.6) {
      return {
        riskLevel: 'high',
        description: `Very low average speed (${averageSpeed.toFixed(1)} mph) may indicate odometer issues`,
        data
      };
    } else if (averageSpeed > speedRange.max * 2.5) {
      return {
        riskLevel: 'critical',
        description: `Impossibly high average speed (${averageSpeed.toFixed(1)} mph) suggests engine hour tampering`,
        data
      };
    } else if (averageSpeed > speedRange.max * 1.8) {
      return {
        riskLevel: 'high',
        description: `Very high average speed (${averageSpeed.toFixed(1)} mph) raises concerns`,
        data
      };
    }

    return {
      riskLevel: 'low',
      description: `Normal average speed (${averageSpeed.toFixed(1)} mph)`,
      data
    };
  }

  /**
   * Validate consistency between different distance measurements from ECU
   */
  private validateDistanceConsistency(
    currentReading: OdometerReading,
    historicalData: OdometerReading[]
  ): { suspicious: boolean, inconsistencies: any[], details: any } {
    
    const inconsistencies = [];
    
    // Compare odometer with distance since codes cleared
    if (currentReading.odometer && currentReading.distanceSinceCodesCleared) {
      // Distance since codes cleared should be less than total odometer
      if (currentReading.distanceSinceCodesCleared > currentReading.odometer) {
        inconsistencies.push({
          type: 'distance_since_codes_greater_than_odometer',
          description: 'Distance since codes cleared exceeds total odometer reading',
          odometer: currentReading.odometer,
          distanceSinceCodesCleared: currentReading.distanceSinceCodesCleared
        });
      }
    }

    // Check for rapid changes in distance measurements
    const recentECUData = historicalData
      .filter(reading => reading.source === 'obd')
      .slice(-5); // Last 5 ECU readings

    if (recentECUData.length >= 2) {
      const distanceChanges = this.analyzeDistanceChanges(recentECUData, currentReading);
      if (distanceChanges.suspiciousPattern) {
        inconsistencies.push({
          type: 'suspicious_distance_pattern',
          description: 'Unusual pattern in ECU distance measurements',
          pattern: distanceChanges
        });
      }
    }

    return {
      suspicious: inconsistencies.length > 0,
      inconsistencies,
      details: {
        currentReading: {
          odometer: currentReading.odometer,
          distanceSinceCodesCleared: currentReading.distanceSinceCodesCleared,
          distanceWithMILOn: currentReading.distanceWithMILOn
        },
        historicalECUReadingsAnalyzed: recentECUData.length
      }
    };
  }

  /**
   * Validate real-time ECU parameters for consistency
   */
  private validateRealtimeECUParameters(currentReading: OdometerReading): { anomalies: FraudAnomaly[] } {
    const anomalies: FraudAnomaly[] = [];

    // Check for impossible parameter combinations
    if (currentReading.vehicleSpeed !== undefined && 
        currentReading.engineRPM !== undefined &&
        currentReading.vehicleSpeed > 0 && 
        currentReading.engineRPM === 0) {
      
      anomalies.push({
        id: this.generateId(),
        type: 'impossible_speed_rpm_combination',
        description: 'Vehicle shows speed but zero RPM - possible ECU tampering',
        severity: 'high',
        timestamp: new Date().toISOString(),
        data: {
          vehicleSpeed: currentReading.vehicleSpeed,
          engineRPM: currentReading.engineRPM
        }
      });
    }

    // Check for fuel level consistency with engine operation
    if (currentReading.fuelLevel !== undefined &&
        currentReading.engineRPM !== undefined &&
        currentReading.fuelLevel === 0 &&
        currentReading.engineRPM > 0) {
      
      anomalies.push({
        id: this.generateId(),
        type: 'fuel_rpm_inconsistency',
        description: 'Engine running with zero fuel level reported',
        severity: 'medium',
        timestamp: new Date().toISOString(),
        data: {
          fuelLevel: currentReading.fuelLevel,
          engineRPM: currentReading.engineRPM
        }
      });
    }

    return { anomalies };
  }

  /**
   * Calculate ECU data consistency score
   */
  private calculateECUConsistency(
    currentReading: OdometerReading,
    historicalData: OdometerReading[]
  ): number {
    let consistencyScore = 100;
    
    const ecuReadings = historicalData.filter(reading => reading.source === 'obd');
    
    if (ecuReadings.length < 2) {
      return 80; // Medium score if insufficient data
    }

    // Check for consistency in ECU response patterns
    const responsePatterns = this.analyzeECUResponsePatterns(ecuReadings, currentReading);
    consistencyScore -= responsePatterns.inconsistencyPenalty;

    // Check parameter correlation consistency
    const parameterCorrelation = this.analyzeParameterCorrelations(ecuReadings, currentReading);
    consistencyScore -= parameterCorrelation.inconsistencyPenalty;

    return Math.max(0, Math.min(100, consistencyScore));
  }

  /**
   * Perform cross-validation of ECU parameters
   */
  private performCrossValidation(currentReading: OdometerReading): number {
    let validationScore = 100;
    const validations = [];

    // Validate speed vs RPM relationship (if both available)
    if (currentReading.vehicleSpeed !== undefined && currentReading.engineRPM !== undefined) {
      const speedRPMValidation = this.validateSpeedRPMRelationship(
        currentReading.vehicleSpeed,
        currentReading.engineRPM
      );
      validations.push(speedRPMValidation);
    }

    // Validate fuel consumption patterns
    if (currentReading.fuelLevel !== undefined && currentReading.engineHours !== undefined) {
      const fuelValidation = this.validateFuelConsistency(currentReading);
      validations.push(fuelValidation);
    }

    // Calculate average validation score
    if (validations.length > 0) {
      const averageScore = validations.reduce((sum, score) => sum + score, 0) / validations.length;
      validationScore = averageScore;
    }

    return Math.max(0, Math.min(100, validationScore));
  }

  // Helper methods for the new functionality
  
  private assessDataQuality(
    currentReading: OdometerReading,
    historicalData: OdometerReading[]
  ): 'high' | 'medium' | 'low' {
    if (currentReading.source === 'obd') {
      const ecuReadings = historicalData.filter(r => r.source === 'obd');
      if (ecuReadings.length >= 5) return 'high';
      if (ecuReadings.length >= 2) return 'medium';
      return 'low';
    }
    return 'medium';
  }

  private determineVehicleType(vehicleProfile?: VehicleProfile): 'passenger' | 'commercial' | 'heavy_duty' | 'default' {
    if (!vehicleProfile?.model) return 'default';
    
    const model = vehicleProfile.model.toLowerCase();
    
    if (model.includes('truck') || model.includes('van') || model.includes('commercial')) {
      return 'commercial';
    }
    if (model.includes('heavy') || model.includes('semi') || model.includes('trailer')) {
      return 'heavy_duty';
    }
    
    return 'passenger';
  }

  private analyzeDistanceChanges(historicalData: OdometerReading[], currentReading: OdometerReading): any {
    // Simplified analysis - would implement detailed pattern detection
    return {
      suspiciousPattern: false,
      analysis: 'Normal distance progression pattern'
    };
  }

  private analyzeECUResponsePatterns(historicalData: OdometerReading[], currentReading: OdometerReading): any {
    // Simplified analysis - would implement detailed ECU response pattern analysis
    return {
      inconsistencyPenalty: 0,
      analysis: 'Consistent ECU response patterns'
    };
  }

  private analyzeParameterCorrelations(historicalData: OdometerReading[], currentReading: OdometerReading): any {
    // Simplified analysis - would implement parameter correlation analysis
    return {
      inconsistencyPenalty: 0,
      analysis: 'Normal parameter correlations'
    };
  }

  private validateSpeedRPMRelationship(speed: number, rpm: number): number {
    // Simplified validation - realistic implementation would consider gear ratios, etc.
    if (speed === 0 && rpm === 0) return 100; // Idle state
    if (speed > 0 && rpm === 0) return 0; // Impossible
    if (speed === 0 && rpm > 0) return 90; // Idling with RPM is normal
    
    // Very rough validation - actual implementation would need vehicle-specific data
    const expectedRPMRange = speed * 25; // Very simplified assumption
    const rpmDeviation = Math.abs(rpm - expectedRPMRange) / expectedRPMRange;
    
    if (rpmDeviation > 2.0) return 30; // Very suspicious
    if (rpmDeviation > 1.0) return 60; // Suspicious
    if (rpmDeviation > 0.5) return 80; // Slightly suspicious
    
    return 100; // Normal
  }

  private validateFuelConsistency(currentReading: OdometerReading): number {
    // Simple fuel level validation
    if (currentReading.fuelLevel === undefined) return 100;
    
    // Check for impossible fuel levels
    if (currentReading.fuelLevel < 0 || currentReading.fuelLevel > 100) {
      return 0; // Impossible fuel level
    }
    
    return 100;
  }

  // === EXISTING FRAUD DETECTION METHODS (Enhanced) ===

  /**
   * Enhanced odometer rollback detection with ECU data priority
   */
  private async detectOdometerRollback(
    currentReading: OdometerReading,
    historicalData: OdometerReading[],
    vehicleProfile?: VehicleProfile,
    fraudDetectionSettings?: FraudDetectionState
  ): Promise<CheckResult> {
    const result: CheckResult = this.getEmptyCheckResult();
    result.threshold = -100; // Negative threshold for rollback detection
    
    // Check if this detection type is enabled
    const isEnabled = fraudDetectionSettings?.checks?.odometerRollback?.enabled ?? true;
    result.enabled = isEnabled;
    
    if (!isEnabled) {
      
      return result;
    }

    if (historicalData.length === 0) {
      return result;
    }

    

    // Prioritize ECU data for comparison
    const ecuData = historicalData.filter(reading => reading.source === 'obd');
    const comparisonData = ecuData.length > 0 ? ecuData : historicalData;
    
    // Get most recent reading for comparison
    const lastReading = comparisonData[comparisonData.length - 1];
    const currentOdometer = currentReading.odometer || currentReading.mileage || 0;
    const lastOdometer = lastReading.odometer || lastReading.mileage || 0;

    if (currentOdometer < lastOdometer) {
      const rollbackAmount = lastOdometer - currentOdometer;
      const timeDiff = this.calculateTimeDifference(lastReading.timestamp, currentReading.timestamp);
      
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
      
      if (rollbackAmount > 50000) { // > 50k rollback
        severity = 'critical';
      } else if (rollbackAmount > 10000) { // > 10k rollback
        severity = 'high';
      } else if (rollbackAmount > 1000) { // > 1k rollback
        severity = 'medium';
      } else {
        severity = 'low';
      }

      // Higher severity for ECU data rollbacks (harder to fake)
      if (currentReading.source === 'obd' && lastReading.source === 'obd') {
        if (severity === 'medium') severity = 'high';
        if (severity === 'high') severity = 'critical';
      }

      result.anomalies.push({
        id: this.generateId(),
        type: 'odometer_rollback',
        description: `Odometer rollback detected: ${rollbackAmount} units`,
        severity,
        timestamp: new Date().toISOString(),
        data: {
          currentReading: currentOdometer,
          previousReading: lastOdometer,
          rollbackAmount,
          timeDiff,
          dataSource: currentReading.source,
          previousDataSource: lastReading.source
        },
      });
    }

    // Check for pattern of small rollbacks (sophisticated tampering)
    if (comparisonData.length >= 5) {
      const rollbackPattern = this.detectRollbackPattern(comparisonData, currentReading);
      if (rollbackPattern.detected) {
        result.anomalies.push({
          id: this.generateId(),
          type: 'rollback_pattern',
          description: 'Pattern of small rollbacks detected',
          severity: 'high',
          timestamp: new Date().toISOString(),
          data: rollbackPattern,
        });
      }
    }

    result.confidence = comparisonData.length >= 3 ? 90 : 70;
    result.riskLevel = this.calculateRiskLevelFromAnomalies(result.anomalies);
    result.lastKnownMileage = currentOdometer;

    return result;
  }

  /**
   * Enhanced inconsistency detection with ECU cross-validation
   */
  private async detectInconsistencies(
    currentReading: OdometerReading,
    historicalData: OdometerReading[],
    vehicleProfile?: VehicleProfile,
    fraudDetectionSettings?: FraudDetectionState
  ): Promise<CheckResult> {
    const result: CheckResult = this.getEmptyCheckResult();
    result.threshold = 500; // Daily mileage threshold
    result.timeWindow = 24; // Hours
    
    // Check if this detection type is enabled
    const isEnabled = fraudDetectionSettings?.checks?.inconsistentReporting?.enabled ?? true;
    result.enabled = isEnabled;
    
    if (!isEnabled) {
      
      return result;
    }

    if (historicalData.length < 2) {
      return result;
    }

    

    // Analyze daily mileage patterns
    const dailyMileages = this.calculateDailyMileages([...historicalData, currentReading]);
    const avgDailyMileage = dailyMileages.reduce((a, b) => a + b, 0) / dailyMileages.length;
    const maxDailyMileage = Math.max(...dailyMileages);
    const currentDailyMileage = dailyMileages[dailyMileages.length - 1];

    // Check for unrealistic daily mileage
    if (currentDailyMileage > 1000) { // > 1000 miles/day
      result.anomalies.push({
        id: this.generateId(),
        type: 'unrealistic_daily_mileage',
        description: `Unusually high daily mileage: ${currentDailyMileage.toFixed(0)} miles`,
        severity: currentDailyMileage > 2000 ? 'critical' : 'high',
        timestamp: new Date().toISOString(),
        data: {
          currentDailyMileage,
          avgDailyMileage,
          maxDailyMileage,
          threshold: 1000,
        },
      });
    }

    // Enhanced ECU parameter validation
    if (currentReading.source === 'obd') {
      const ecuInconsistencies = this.detectECUInconsistencies(currentReading, historicalData);
      result.anomalies.push(...ecuInconsistencies);
    }

    result.confidence = result.anomalies.length > 0 ? 85 : 75;
    result.riskLevel = this.calculateRiskLevelFromAnomalies(result.anomalies);

    return result;
  }

  /**
   * Enhanced digital tampering detection with Mode 22 validation
   */
  private async detectDigitalTampering(
    currentReading: OdometerReading,
    historicalData: OdometerReading[],
    vehicleProfile?: VehicleProfile,
    fraudDetectionSettings?: FraudDetectionState
  ): Promise<CheckResult> {
    const result: CheckResult = this.getEmptyCheckResult();
    result.ecu_checks = true;
    
    // Check if this detection type is enabled
    const isEnabled = fraudDetectionSettings?.checks?.digitalTampering?.enabled ?? true;
    result.enabled = isEnabled;
    
    if (!isEnabled) {
      
      return result;
    }

    

    // Enhanced ECU data analysis for OBD readings
    if (currentReading.source === 'obd') {
      // Check for ECU parameter relationships
      const ecuValidation = this.validateECUParameterRelationships(currentReading);
      if (ecuValidation.suspicious) {
        result.anomalies.push({
          id: this.generateId(),
          type: 'ecu_parameter_inconsistency',
          description: 'Suspicious ECU parameter relationships detected',
          severity: 'medium',
          timestamp: new Date().toISOString(),
          data: ecuValidation,
        });
      }

      // Check for data source consistency patterns
      const sourcePattern = this.analyzeDataSourcePatterns(historicalData, currentReading);
      if (sourcePattern.suspicious) {
        result.anomalies.push({
          id: this.generateId(),
          type: 'data_source_pattern_anomaly',
          description: 'Unusual data source switching pattern',
          severity: 'medium',
          timestamp: new Date().toISOString(),
          data: sourcePattern,
        });
      }
    }

    result.confidence = currentReading.source === 'obd' ? 80 : 60;
    result.riskLevel = this.calculateRiskLevelFromAnomalies(result.anomalies);

    return result;
  }

  /**
   * Enhanced data integrity checking
   */
  private async checkDataIntegrity(
    currentReading: OdometerReading,
    historicalData: OdometerReading[],
    vehicleProfile?: VehicleProfile,
    fraudDetectionSettings?: FraudDetectionState
  ): Promise<CheckResult> {
    const result: CheckResult = this.getEmptyCheckResult();
    result.checksumValidation = true;
    
    // Check if this detection type is enabled
    const isEnabled = fraudDetectionSettings?.checks?.dataIntegrity?.enabled ?? true;
    result.enabled = isEnabled;
    
    if (!isEnabled) {
      
      return result;
    }

    

    // Check for missing or invalid timestamps
    if (!currentReading.timestamp) {
      result.anomalies.push({
        id: this.generateId(),
        type: 'missing_timestamp',
        description: 'Missing timestamp in odometer reading',
        severity: 'medium',
        timestamp: new Date().toISOString(),
        data: { reading: currentReading },
      });
    }

    // Check for future timestamps
    const readingTime = new Date(currentReading.timestamp);
    const now = new Date();
    if (readingTime > now) {
      result.anomalies.push({
        id: this.generateId(),
        type: 'future_timestamp',
        description: 'Reading timestamp is in the future',
        severity: 'high',
        timestamp: new Date().toISOString(),
        data: { 
          readingTime: readingTime.toISOString(), 
          currentTime: now.toISOString() 
        },
      });
    }

    // Enhanced integrity checks for ECU data
    if (currentReading.source === 'obd') {
      const integrityScore = this.calculateECUDataIntegrity(currentReading);
      if (integrityScore < 70) {
        result.anomalies.push({
          id: this.generateId(),
          type: 'ecu_data_integrity_low',
          description: `ECU data integrity score below threshold: ${integrityScore}%`,
          severity: integrityScore < 50 ? 'high' : 'medium',
          timestamp: new Date().toISOString(),
          data: { integrityScore, threshold: 70 },
        });
      }
    }

    result.confidence = result.anomalies.length === 0 ? 90 : 60;
    result.riskLevel = this.calculateRiskLevelFromAnomalies(result.anomalies);

    return result;
  }

  // === HELPER METHODS ===

  private getEmptyCheckResult(): CheckResult {
    return {
      enabled: true,
      anomalies: [],
      riskLevel: 'low',
      confidence: 0,
      threshold: 0,
      lastKnownMileage: null,
      timeWindow: 24,
      ecu_checks: true,
      checksumValidation: true,
    };
  }

  private generateId(): string {
    return `fraud_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateTimeDifference(timestamp1: string, timestamp2: string): number {
    const date1 = new Date(timestamp1);
    const date2 = new Date(timestamp2);
    return Math.abs(date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24); // Days
  }

  private calculateDailyMileages(historicalData: OdometerReading[]): number[] {
    const dailyMileages: number[] = [];

    for (let i = 1; i < historicalData.length; i++) {
      const prev = historicalData[i - 1];
      const curr = historicalData[i];
      const prevMileage = prev.odometer || prev.mileage || 0;
      const currMileage = curr.odometer || curr.mileage || 0;
      const timeDiff = this.calculateTimeDifference(prev.timestamp, curr.timestamp);
      
      if (timeDiff > 0 && currMileage >= prevMileage) {
        dailyMileages.push((currMileage - prevMileage) / timeDiff);
      }
    }

    return dailyMileages;
  }

  private detectRollbackPattern(historicalData: OdometerReading[], currentReading: OdometerReading): any {
    let rollbackCount = 0;
    const dataToAnalyze = [...historicalData, currentReading];
    
    for (let i = 1; i < dataToAnalyze.length; i++) {
      const prev = dataToAnalyze[i - 1];
      const curr = dataToAnalyze[i];
      const prevMileage = prev.odometer || prev.mileage || 0;
      const currMileage = curr.odometer || curr.mileage || 0;
      
      if (currMileage < prevMileage) {
        rollbackCount++;
      }
    }

    return {
      detected: rollbackCount >= 2,
      rollbackCount,
      analysisPeriod: dataToAnalyze.length,
      suspicionLevel: rollbackCount >= 3 ? 'high' : rollbackCount >= 2 ? 'medium' : 'low'
    };
  }

  private detectECUInconsistencies(currentReading: OdometerReading, historicalData: OdometerReading[]): FraudAnomaly[] {
    const anomalies: FraudAnomaly[] = [];
    
    // Check engine hours progression
    if (currentReading.engineHours !== undefined) {
      const ecuReadings = historicalData.filter(r => r.source === 'obd' && r.engineHours !== undefined);
      if (ecuReadings.length > 0) {
        const lastECUReading = ecuReadings[ecuReadings.length - 1];
        if (currentReading.engineHours < lastECUReading.engineHours!) {
          anomalies.push({
            id: this.generateId(),
            type: 'engine_hours_rollback',
            description: 'Engine hours decreased between readings',
            severity: 'high',
            timestamp: new Date().toISOString(),
            data: {
              currentEngineHours: currentReading.engineHours,
              previousEngineHours: lastECUReading.engineHours
            }
          });
        }
      }
    }

    return anomalies;
  }

  private validateECUParameterRelationships(currentReading: OdometerReading): { suspicious: boolean, details: any } {
    const issues = [];
    
    // Check speed vs odometer consistency (if both available)
    if (currentReading.vehicleSpeed !== undefined && currentReading.odometer !== undefined) {
      // This is a simplified check - real implementation would be more sophisticated
      if (currentReading.vehicleSpeed > 200) { // Unrealistic speed
        issues.push('Unrealistic vehicle speed reported');
      }
    }

    return {
      suspicious: issues.length > 0,
      details: { issues, reading: currentReading }
    };
  }

  private analyzeDataSourcePatterns(historicalData: OdometerReading[], currentReading: OdometerReading): { suspicious: boolean, pattern: any } {
    const recentReadings = [...historicalData.slice(-10), currentReading];
    const sourceChanges = [];
    
    for (let i = 1; i < recentReadings.length; i++) {
      if (recentReadings[i].source !== recentReadings[i-1].source) {
        sourceChanges.push({
          from: recentReadings[i-1].source,
          to: recentReadings[i].source,
          timestamp: recentReadings[i].timestamp
        });
      }
    }

    return {
      suspicious: sourceChanges.length > recentReadings.length * 0.5, // More than 50% changes
      pattern: {
        totalReadings: recentReadings.length,
        sourceChanges: sourceChanges.length,
        changes: sourceChanges
      }
    };
  }

  private calculateECUDataIntegrity(currentReading: OdometerReading): number {
    let integrityScore = 100;
    
    // Check for required ECU parameters
    const requiredParams = ['odometer', 'timestamp', 'source'];
    const missingParams = requiredParams.filter(param => !currentReading[param as keyof OdometerReading]);
    integrityScore -= missingParams.length * 20;
    
    // Check for reasonable value ranges
    if (currentReading.vehicleSpeed !== undefined) {
      if (currentReading.vehicleSpeed < 0 || currentReading.vehicleSpeed > 300) {
        integrityScore -= 15;
      }
    }
    
    if (currentReading.engineRPM !== undefined) {
      if (currentReading.engineRPM < 0 || currentReading.engineRPM > 8000) {
        integrityScore -= 15;
      }
    }

    return Math.max(0, integrityScore);
  }

  private calculateOverallRiskScore(checks: CheckResult[], realECUDataUsed: boolean): number {
    let totalScore = 0;
    let weightSum = 0;
    
    checks.forEach((check, index) => {
      if (check.enabled) {
        // Calculate risk contribution from anomalies
        const anomalyScore = check.anomalies.reduce((sum, anomaly) => {
          const severityWeight = {
            'low': 10,
            'medium': 25,
            'high': 50,
            'critical': 100
          };
          return sum + severityWeight[anomaly.severity];
        }, 0);
        
        // Weight different check types
        const checkWeights = [2.0, 1.5, 2.5, 1.0, 3.0]; // rollback, inconsistency, tampering, integrity, ECU cross-validation
        const weight = checkWeights[index] || 1.0;
        
        // Boost weight for ECU data
        const ecuBoost = realECUDataUsed ? 1.5 : 1.0;
        const finalWeight = weight * ecuBoost;
        
        totalScore += anomalyScore * finalWeight;
        weightSum += finalWeight;
      }
    });
    
    return weightSum > 0 ? Math.min(100, totalScore / weightSum) : 0;
  }

  private determineRiskLevel(riskScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (riskScore >= 80) return 'critical';
    if (riskScore >= 60) return 'high';
    if (riskScore >= 30) return 'medium';
    return 'low';
  }

  private determineStatus(riskLevel: 'low' | 'medium' | 'high' | 'critical'): 'clean' | 'suspicious' | 'high_risk' {
    if (riskLevel === 'critical' || riskLevel === 'high') return 'high_risk';
    if (riskLevel === 'medium') return 'suspicious';
    return 'clean';
  }

  private calculateRiskLevelFromAnomalies(anomalies: FraudAnomaly[]): 'low' | 'medium' | 'high' | 'critical' {
    if (anomalies.length === 0) return 'low';
    
    const hasCritical = anomalies.some(a => a.severity === 'critical');
    if (hasCritical) return 'critical';
    
    const hasHigh = anomalies.some(a => a.severity === 'high');
    if (hasHigh || anomalies.length >= 3) return 'high';
    
    const hasMedium = anomalies.some(a => a.severity === 'medium');
    if (hasMedium || anomalies.length >= 2) return 'medium';
    
    return 'low';
  }
}

export default new OdometerFraudDetectionService();