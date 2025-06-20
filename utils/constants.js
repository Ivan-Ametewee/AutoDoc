// OBDII Diagnostic App - Constants
// Contains all app-wide constants and configuration values

// App Configuration
export const APP_CONFIG = {
  NAME: 'OBDII Diagnostic',
  VERSION: '1.0.0',
  DATABASE_VERSION: 1,
  MAX_HISTORY_RECORDS: 10000,
  DATA_REFRESH_INTERVAL: 1000, // milliseconds
  CONNECTION_TIMEOUT: 10000, // milliseconds
  RETRY_ATTEMPTS: 3,
};

// Connection Types
export const CONNECTION_TYPES = {
  BLUETOOTH: 'bluetooth',
  WIFI: 'wifi',
  SIMULATOR: 'simulator',
};

// Connection States
export const CONNECTION_STATES = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  ERROR: 'error',
  SCANNING: 'scanning',
};

// OBDII Protocol Types
export const OBDII_PROTOCOLS = {
  AUTO: 'AUTO',
  SAE_J1850_PWM: 'SAE J1850 PWM',
  SAE_J1850_VPW: 'SAE J1850 VPW',
  ISO_9141_2: 'ISO 9141-2',
  ISO_14230_4_KWP: 'ISO 14230-4 (KWP2000)',
  ISO_15765_4_CAN: 'ISO 15765-4 (CAN)',
  SAE_J1939_CAN: 'SAE J1939 (CAN)',
};

// Common OBDII PIDs
export const COMMON_PIDS = {
  VEHICLE_SPEED: '010D',
  ENGINE_RPM: '010C',
  ENGINE_TEMP: '0105',
  FUEL_LEVEL: '012F',
  INTAKE_TEMP: '010F',
  MAF_AIR_FLOW: '0110',
  THROTTLE_POSITION: '0111',
  ENGINE_LOAD: '0104',
  FUEL_PRESSURE: '010A',
  INTAKE_PRESSURE: '010B',
  O2_SENSOR_VOLTAGE: '0114',
  SHORT_TERM_FUEL_TRIM: '0106',
  LONG_TERM_FUEL_TRIM: '0107',
  TIMING_ADVANCE: '010E',
  CATALYST_TEMP: '013C',
  FUEL_RAIL_PRESSURE: '0122',
  COMMANDED_EGR: '012C',
  EGR_ERROR: '012D',
  FUEL_TANK_LEVEL: '012E',
  BAROMETRIC_PRESSURE: '0133',
};

// PID Categories
export const PID_CATEGORIES = {
  ENGINE: 'engine',
  FUEL: 'fuel',
  EMISSIONS: 'emissions',
  TRANSMISSION: 'transmission',
  TEMPERATURE: 'temperature',
  PRESSURE: 'pressure',
  SENSORS: 'sensors',
  PERFORMANCE: 'performance',
};

// Unit Types
export const UNITS = {
  // Temperature
  CELSIUS: '°C',
  FAHRENHEIT: '°F',
  KELVIN: 'K',
  
  // Speed
  KMH: 'km/h',
  MPH: 'mph',
  
  // Pressure
  KPA: 'kPa',
  PSI: 'psi',
  BAR: 'bar',
  MMHG: 'mmHg',
  
  // Volume
  LITERS: 'L',
  GALLONS: 'gal',
  
  // Flow
  LPH: 'L/h',
  GPH: 'gph',
  GPS: 'g/s',
  
  // Electrical
  VOLTS: 'V',
  AMPS: 'A',
  OHMS: 'Ω',
  
  // General
  PERCENT: '%',
  RPM: 'RPM',
  DEGREES: '°',
  MS: 'ms',
  SECONDS: 's',
  MINUTES: 'min',
};

// Alert Severity Levels
export const ALERT_SEVERITY = {
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical',
  ERROR: 'error',
};

// Alert Types
export const ALERT_TYPES = {
  HIGH_TEMPERATURE: 'high_temperature',
  LOW_FUEL: 'low_fuel',
  HIGH_RPM: 'high_rpm',
  DTC_DETECTED: 'dtc_detected',
  CONNECTION_LOST: 'connection_lost',
  ENGINE_MISFIRE: 'engine_misfire',
  EMISSION_SYSTEM: 'emission_system',
  TRANSMISSION_ISSUE: 'transmission_issue',
};

// Default Thresholds
export const DEFAULT_THRESHOLDS = {
  ENGINE_TEMP_WARNING: 95, // Celsius
  ENGINE_TEMP_CRITICAL: 105, // Celsius
  ENGINE_RPM_WARNING: 6000,
  ENGINE_RPM_CRITICAL: 7000,
  FUEL_LEVEL_WARNING: 20, // Percent
  FUEL_LEVEL_CRITICAL: 10, // Percent
  ENGINE_LOAD_WARNING: 85, // Percent
  ENGINE_LOAD_CRITICAL: 95, // Percent
};

// Chart Configuration
export const CHART_CONFIG = {
  MAX_DATA_POINTS: 100,
  UPDATE_INTERVAL: 2000, // milliseconds
  COLORS: {
    PRIMARY: '#007AFF',
    SUCCESS: '#34C759',
    WARNING: '#FF9500',
    ERROR: '#FF3B30',
    SECONDARY: '#8E8E93',
  },
  LINE_WIDTH: 2,
  GRID_COLOR: '#E5E5EA',
};

// Screen Names for Navigation
export const SCREEN_NAMES = {
  DASHBOARD: 'Dashboard',
  DIAGNOSTICS: 'Diagnostics',
  HISTORY: 'History',
  SETTINGS: 'Settings',
  CONNECTION: 'Connection',
  VEHICLE_PROFILE: 'VehicleProfile',
  ALERTS: 'Alerts',
  REPORTS: 'Reports',
};

// Tab Navigator Configuration
export const TAB_CONFIG = {
  DASHBOARD: {
    name: SCREEN_NAMES.DASHBOARD,
    icon: 'speedometer-outline',
    activeIcon: 'speedometer',
  },
  DIAGNOSTICS: {
    name: SCREEN_NAMES.DIAGNOSTICS,
    icon: 'medical-outline',
    activeIcon: 'medical',
  },
  HISTORY: {
    name: SCREEN_NAMES.HISTORY,
    icon: 'time-outline',
    activeIcon: 'time',
  },
  SETTINGS: {
    name: SCREEN_NAMES.SETTINGS,
    icon: 'settings-outline',
    activeIcon: 'settings',
  },
};

// Storage Keys
export const STORAGE_KEYS = {
  VEHICLE_PROFILE: 'vehicle_profile',
  USER_SETTINGS: 'user_settings',
  CONNECTION_HISTORY: 'connection_history',
  ALERT_SETTINGS: 'alert_settings',
  EXPORT_SETTINGS: 'export_settings',
  CALIBRATION_DATA: 'calibration_data',
};

// Export Formats
export const EXPORT_FORMATS = {
  PDF: 'pdf',
  CSV: 'csv',
  JSON: 'json',
  XML: 'xml',
};

// Date/Time Formats
export const DATE_FORMATS = {
  SHORT: 'MM/DD/YYYY',
  LONG: 'MMMM DD, YYYY',
  TIME: 'HH:mm:ss',
  DATETIME: 'MM/DD/YYYY HH:mm:ss',
  ISO: 'YYYY-MM-DDTHH:mm:ss.sssZ',
};

// Vehicle Types
export const VEHICLE_TYPES = {
  CAR: 'car',
  TRUCK: 'truck',
  SUV: 'suv',
  MOTORCYCLE: 'motorcycle',
  VAN: 'van',
  OTHER: 'other',
};

// Fuel Types
export const FUEL_TYPES = {
  GASOLINE: 'gasoline',
  DIESEL: 'diesel',
  HYBRID: 'hybrid',
  ELECTRIC: 'electric',
  E85: 'e85',
  CNG: 'cng',
  LPG: 'lpg',
};

// Common Error Codes
export const ERROR_CODES = {
  CONNECTION_FAILED: 'CONNECTION_FAILED',
  DEVICE_NOT_FOUND: 'DEVICE_NOT_FOUND',
  PROTOCOL_ERROR: 'PROTOCOL_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  INVALID_RESPONSE: 'INVALID_RESPONSE',
  NO_DATA: 'NO_DATA',
  ADAPTER_ERROR: 'ADAPTER_ERROR',
};

// Bluetooth Configuration
export const BLUETOOTH_CONFIG = {
  SERVICE_UUID: '00001101-0000-1000-8000-00805F9B34FB', // SPP UUID
  SCAN_DURATION: 10000, // milliseconds
  CONNECTION_RETRY_DELAY: 2000, // milliseconds
  READ_TIMEOUT: 5000, // milliseconds
};

// WiFi Configuration
export const WIFI_CONFIG = {
  DEFAULT_PORT: 35000,
  CONNECTION_TIMEOUT: 10000, // milliseconds
  KEEPALIVE_INTERVAL: 30000, // milliseconds
};

// Simulation Configuration
export const SIMULATION_CONFIG = {
  UPDATE_INTERVAL: 500, // milliseconds
  RANDOM_VARIATION: 0.1, // 10% random variation
  ENABLE_REALISTIC_TRENDS: true,
  FAULT_INJECTION_PROBABILITY: 0.001, // 0.1% chance
};

// Color Schemes
export const COLOR_SCHEMES = {
  LIGHT: {
    PRIMARY: '#007AFF',
    BACKGROUND: '#FFFFFF',
    SURFACE: '#F2F2F7',
    TEXT: '#000000',
    TEXT_SECONDARY: '#8E8E93',
    BORDER: '#C7C7CC',
    ERROR: '#FF3B30',
    WARNING: '#FF9500',
    SUCCESS: '#34C759',
  },
  DARK: {
    PRIMARY: '#0A84FF',
    BACKGROUND: '#000000',
    SURFACE: '#1C1C1E',
    TEXT: '#FFFFFF',
    TEXT_SECONDARY: '#8E8E93',
    BORDER: '#38383A',
    ERROR: '#FF453A',
    WARNING: '#FF9F0A',
    SUCCESS: '#30D158',
  },
};

// Gauge Configurations
export const GAUGE_CONFIG = {
  RPM: {
    MIN: 0,
    MAX: 8000,
    WARNING: 6000,
    CRITICAL: 7000,
    UNIT: UNITS.RPM,
  },
  SPEED: {
    MIN: 0,
    MAX: 200,
    WARNING: 120,
    CRITICAL: 160,
    UNIT: UNITS.KMH,
  },
  TEMPERATURE: {
    MIN: -40,
    MAX: 150,
    WARNING: 95,
    CRITICAL: 105,
    UNIT: UNITS.CELSIUS,
  },
  FUEL_LEVEL: {
    MIN: 0,
    MAX: 100,
    WARNING: 20,
    CRITICAL: 10,
    UNIT: UNITS.PERCENT,
  },
};