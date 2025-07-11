/**
 * Fraud Detection Types and Interfaces
 */

export interface FraudAnomaly {
  id: string;
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  data: Record<string, any>;
}

export interface FraudAlert {
  id: string;
  type: 'warning' | 'error' | 'critical';
  message: string;
  timestamp: string;
  checkType: string;
  riskLevel: number;
}

export interface FraudDetectionState {
  isEnabled: boolean;
  realTimeMonitoring: boolean;
  lastInitialized?: string;
  lastStopped?: string;
  checks: {
    odometerRollback: {
      enabled: boolean;
      threshold: number; // Miles/km that trigger suspicion
      lastKnownMileage: number | null;
      anomalies: FraudAnomaly[];
    };
    inconsistentReporting: {
      enabled: boolean;
      threshold: number; // Daily mileage threshold
      timeWindow: number; // Hours
      anomalies: FraudAnomaly[];
    };
    digitalTampering: {
      enabled: boolean;
      ecu_checks: boolean;
      anomalies: FraudAnomaly[];
    };
    dataIntegrity: {
      enabled: boolean;
      checksumValidation: boolean;
      anomalies: FraudAnomaly[];
    };
  };
  riskScore: number; // 0-100 scale
  lastCheck: string | null;
  overallStatus: 'clean' | 'suspicious' | 'high_risk';
  alerts: FraudAlert[];
}

export const initialFraudDetectionState: FraudDetectionState = {
  isEnabled: true,
  realTimeMonitoring: false,
  checks: {
    odometerRollback: {
      enabled: true,
      threshold: -100,
      lastKnownMileage: null,
      anomalies: [],
    },
    inconsistentReporting: {
      enabled: true,
      threshold: 500,
      timeWindow: 24,
      anomalies: [],
    },
    digitalTampering: {
      enabled: true,
      ecu_checks: true,
      anomalies: [],
    },
    dataIntegrity: {
      enabled: true,
      checksumValidation: true,
      anomalies: [],
    }
  },
  riskScore: 0,
  lastCheck: null,
  overallStatus: 'clean',
  alerts: [],
};

// Action Types
export enum FRAUD_DETECTION_TYPES {
  RUN_FRAUD_CHECK = 'RUN_FRAUD_CHECK',
  FRAUD_CHECK_COMPLETE = 'FRAUD_CHECK_COMPLETE',
  ADD_FRAUD_ALERT = 'ADD_FRAUD_ALERT',
  CLEAR_FRAUD_ALERTS = 'CLEAR_FRAUD_ALERTS',
  UPDATE_FRAUD_SETTINGS = 'UPDATE_FRAUD_SETTINGS',
  ODOMETER_ANOMALY_DETECTED = 'ODOMETER_ANOMALY_DETECTED',
  TOGGLE_FRAUD_DETECTION = 'TOGGLE_FRAUD_DETECTION',
  CLEAR_FRAUD_ANOMALIES = 'CLEAR_FRAUD_ANOMALIES',
  INITIALIZE_REAL_TIME_FRAUD_DETECTION = 'INITIALIZE_REAL_TIME_FRAUD_DETECTION',
  STOP_REAL_TIME_FRAUD_DETECTION = 'STOP_REAL_TIME_FRAUD_DETECTION',
}

// Action Interfaces
export interface FraudCheckCompleteAction {
  type: FRAUD_DETECTION_TYPES.FRAUD_CHECK_COMPLETE;
  payload: {
    riskScore: number;
    status: 'clean' | 'suspicious' | 'high_risk';
    checkResults: Partial<FraudDetectionState['checks']>;
    lastCheck?: string;
    source?: string;
    timestamp?: string;
  };
  [key: string]: any;
}

export interface AddFraudAlertAction {
  type: FRAUD_DETECTION_TYPES.ADD_FRAUD_ALERT;
  payload: {
    alert: FraudAlert;
  };
  [key: string]: any;
}

export interface OdometerAnomalyDetectedAction {
  type: FRAUD_DETECTION_TYPES.ODOMETER_ANOMALY_DETECTED;
  payload: {
    checkType: keyof FraudDetectionState['checks'];
    anomaly: FraudAnomaly;
  };
  [key: string]: any;
}

export interface UpdateFraudSettingsAction {
  type: FRAUD_DETECTION_TYPES.UPDATE_FRAUD_SETTINGS;
  payload: {
    settings: Partial<FraudDetectionState>;
  };
  [key: string]: any;
}

export interface ToggleFraudDetectionAction {
  type: FRAUD_DETECTION_TYPES.TOGGLE_FRAUD_DETECTION;
  payload: {
    enabled: boolean;
  };
  [key: string]: any;
}

export interface RunFraudCheckAction {
  type: FRAUD_DETECTION_TYPES.RUN_FRAUD_CHECK;
  [key: string]: any;
}

export interface ClearFraudAlertsAction {
  type: FRAUD_DETECTION_TYPES.CLEAR_FRAUD_ALERTS;
  [key: string]: any;
}

export interface ClearFraudAnomaliesAction {
  type: FRAUD_DETECTION_TYPES.CLEAR_FRAUD_ANOMALIES;
  payload: {
    checkType?: keyof FraudDetectionState['checks'];
  };
  [key: string]: any;
}

export interface InitializeRealTimeFraudDetectionAction {
  type: FRAUD_DETECTION_TYPES.INITIALIZE_REAL_TIME_FRAUD_DETECTION;
  payload: {
    obdService: any;
  };
  [key: string]: any;
}

export interface StopRealTimeFraudDetectionAction {
  type: FRAUD_DETECTION_TYPES.STOP_REAL_TIME_FRAUD_DETECTION;
  [key: string]: any;
}

// Union type for all fraud detection actions
export type FraudDetectionAction =
  | RunFraudCheckAction
  | FraudCheckCompleteAction
  | AddFraudAlertAction
  | OdometerAnomalyDetectedAction
  | UpdateFraudSettingsAction
  | ToggleFraudDetectionAction
  | ClearFraudAlertsAction
  | ClearFraudAnomaliesAction
  | InitializeRealTimeFraudDetectionAction
  | StopRealTimeFraudDetectionAction;

// OBD Reading Interface (for fraud detection)
export interface OdometerReading {
  odometer?: number;
  mileage?: number;
  timestamp: string;
  source: 'obd' | 'manual' | 'service_record';
  vehicleSpeed?: number;
  engineHours?: number;
  fuelLevel?: number;
  engineRPM?: number;
  [key: string]: any;
}

// Vehicle Profile Interface (for fraud detection)
export interface VehicleProfile {
  id: string;
  vin?: string;
  year: number;
  make: string;
  model: string;
  odometer: number;
  lastServiceDate?: string;
  createdAt: string;
  [key: string]: any;
}