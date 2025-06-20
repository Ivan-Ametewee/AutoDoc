/**
 * Validation utilities for OBDII Diagnostic App
 * Contains validation functions for user inputs, vehicle data, and system parameters
 */

// Vehicle Information Validators
export const validateVIN = (vin) => {
  if (!vin) return { isValid: false, error: 'VIN is required' };
  
  // Remove spaces and convert to uppercase
  const cleanVIN = vin.replace(/\s/g, '').toUpperCase();
  
  // Check length
  if (cleanVIN.length !== 17) {
    return { isValid: false, error: 'VIN must be exactly 17 characters' };
  }
  
  // Check for invalid characters (I, O, Q are not allowed in VIN)
  const invalidChars = /[IOQ]/;
  if (invalidChars.test(cleanVIN)) {
    return { isValid: false, error: 'VIN cannot contain letters I, O, or Q' };
  }
  
  // Check for valid characters (alphanumeric excluding I, O, Q)
  const validChars = /^[A-HJ-NPR-Z0-9]{17}$/;
  if (!validChars.test(cleanVIN)) {
    return { isValid: false, error: 'VIN contains invalid characters' };
  }
  
  return { isValid: true, cleanValue: cleanVIN };
};

export const validateYear = (year) => {
  if (!year) return { isValid: false, error: 'Year is required' };
  
  const numYear = parseInt(year);
  const currentYear = new Date().getFullYear();
  
  if (isNaN(numYear)) {
    return { isValid: false, error: 'Year must be a number' };
  }
  
  if (numYear < 1996) {
    return { isValid: false, error: 'OBDII standard started in 1996' };
  }
  
  if (numYear > currentYear + 1) {
    return { isValid: false, error: 'Year cannot be in the future' };
  }
  
  return { isValid: true, cleanValue: numYear };
};

export const validateMake = (make) => {
  if (!make || make.trim().length === 0) {
    return { isValid: false, error: 'Vehicle make is required' };
  }
  
  const cleanMake = make.trim();
  
  if (cleanMake.length < 2 || cleanMake.length > 50) {
    return { isValid: false, error: 'Make must be between 2 and 50 characters' };
  }
  
  // Allow letters, spaces, hyphens, and periods
  const validChars = /^[a-zA-Z\s\-\.]+$/;
  if (!validChars.test(cleanMake)) {
    return { isValid: false, error: 'Make contains invalid characters' };
  }
  
  return { isValid: true, cleanValue: cleanMake };
};

export const validateModel = (model) => {
  if (!model || model.trim().length === 0) {
    return { isValid: false, error: 'Vehicle model is required' };
  }
  
  const cleanModel = model.trim();
  
  if (cleanModel.length < 1 || cleanModel.length > 50) {
    return { isValid: false, error: 'Model must be between 1 and 50 characters' };
  }
  
  // Allow letters, numbers, spaces, hyphens, and periods
  const validChars = /^[a-zA-Z0-9\s\-\.]+$/;
  if (!validChars.test(cleanModel)) {
    return { isValid: false, error: 'Model contains invalid characters' };
  }
  
  return { isValid: true, cleanValue: cleanModel };
};

export const validateEngine = (engine) => {
  if (!engine || engine.trim().length === 0) {
    return { isValid: false, error: 'Engine specification is required' };
  }
  
  const cleanEngine = engine.trim();
  
  if (cleanEngine.length > 100) {
    return { isValid: false, error: 'Engine specification too long' };
  }
  
  // Allow letters, numbers, spaces, periods, and common engine notation
  const validChars = /^[a-zA-Z0-9\s\.\-LV]+$/;
  if (!validChars.test(cleanEngine)) {
    return { isValid: false, error: 'Engine specification contains invalid characters' };
  }
  
  return { isValid: true, cleanValue: cleanEngine };
};

// Threshold Validators
export const validateThreshold = (value, min = 0, max = 10000, name = 'Value') => {
  if (value === null || value === undefined || value === '') {
    return { isValid: false, error: `${name} is required` };
  }
  
  const numValue = parseFloat(value);
  
  if (isNaN(numValue)) {
    return { isValid: false, error: `${name} must be a valid number` };
  }
  
  if (numValue < min || numValue > max) {
    return { isValid: false, error: `${name} must be between ${min} and ${max}` };
  }
  
  return { isValid: true, cleanValue: numValue };
};

// Specific threshold validators
export const validateRPMThreshold = (rpm) => {
  return validateThreshold(rpm, 0, 8000, 'RPM threshold');
};

export const validateTemperatureThreshold = (temp, unit = 'C') => {
  const min = unit === 'C' ? -40 : -40;
  const max = unit === 'C' ? 200 : 392;
  return validateThreshold(temp, min, max, 'Temperature threshold');
};

export const validateSpeedThreshold = (speed, unit = 'km/h') => {
  const max = unit === 'km/h' ? 300 : 186;
  return validateThreshold(speed, 0, max, 'Speed threshold');
};

export const validateOilPressureThreshold = (pressure) => {
  return validateThreshold(pressure, 0, 100, 'Oil pressure threshold');
};

export const validateVoltageThreshold = (voltage) => {
  return validateThreshold(voltage, 8, 18, 'Voltage threshold');
};

// Connection Validators
export const validateBluetoothAddress = (address) => {
  if (!address) return { isValid: false, error: 'Bluetooth address is required' };
  
  // MAC address format: XX:XX:XX:XX:XX:XX
  const macPattern = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
  
  if (!macPattern.test(address)) {
    return { isValid: false, error: 'Invalid Bluetooth address format' };
  }
  
  return { isValid: true, cleanValue: address.toUpperCase() };
};

export const validateIPAddress = (ip) => {
  if (!ip) return { isValid: false, error: 'IP address is required' };
  
  // IPv4 pattern
  const ipv4Pattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  
  if (!ipv4Pattern.test(ip)) {
    return { isValid: false, error: 'Invalid IP address format' };
  }
  
  return { isValid: true, cleanValue: ip };
};

export const validatePort = (port) => {
  if (!port) return { isValid: false, error: 'Port is required' };
  
  const numPort = parseInt(port);
  
  if (isNaN(numPort) || numPort < 1 || numPort > 65535) {
    return { isValid: false, error: 'Port must be between 1 and 65535' };
  }
  
  return { isValid: true, cleanValue: numPort };
};

// Form Validators
export const validateForm = (fields, validators) => {
  const errors = {};
  let isValid = true;
  
  for (const [fieldName, value] of Object.entries(fields)) {
    if (validators[fieldName]) {
      const result = validators[fieldName](value);
      if (!result.isValid) {
        errors[fieldName] = result.error;
        isValid = false;
      }
    }
  }
  
  return { isValid, errors };
};

// Email validator (for reports/exports)
export const validateEmail = (email) => {
  if (!email) return { isValid: false, error: 'Email is required' };
  
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailPattern.test(email)) {
    return { isValid: false, error: 'Invalid email format' };
  }
  
  return { isValid: true, cleanValue: email.toLowerCase() };
};

// File name validator
export const validateFileName = (fileName) => {
  if (!fileName || fileName.trim().length === 0) {
    return { isValid: false, error: 'File name is required' };
  }
  
  const cleanName = fileName.trim();
  
  // Check for invalid characters in file names
  const invalidChars = /[<>:"/\\|?*]/;
  if (invalidChars.test(cleanName)) {
    return { isValid: false, error: 'File name contains invalid characters' };
  }
  
  if (cleanName.length > 255) {
    return { isValid: false, error: 'File name too long' };
  }
  
  return { isValid: true, cleanValue: cleanName };
};

// PID validator
export const validatePID = (pid) => {
  if (!pid) return { isValid: false, error: 'PID is required' };
  
  // PID should be hex format (e.g., "01 0C" or "010C")
  const cleanPID = pid.replace(/\s/g, '').toUpperCase();
  
  if (cleanPID.length !== 4) {
    return { isValid: false, error: 'PID must be 4 characters (2 bytes)' };
  }
  
  const hexPattern = /^[0-9A-F]{4}$/;
  if (!hexPattern.test(cleanPID)) {
    return { isValid: false, error: 'PID must be valid hexadecimal' };
  }
  
  return { isValid: true, cleanValue: cleanPID };
};

// Export validation bundle
export const vehicleValidators = {
  vin: validateVIN,
  year: validateYear,
  make: validateMake,
  model: validateModel,
  engine: validateEngine
};

export const thresholdValidators = {
  rpm: validateRPMThreshold,
  temperature: validateTemperatureThreshold,
  speed: validateSpeedThreshold,
  oilPressure: validateOilPressureThreshold,
  voltage: validateVoltageThreshold
};

export const connectionValidators = {
  bluetoothAddress: validateBluetoothAddress,
  ipAddress: validateIPAddress,
  port: validatePort
};