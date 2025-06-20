// OBDII Diagnostic App - Formatters
// Utility functions for formatting data display

import { UNITS, DATE_FORMATS } from './constants';

/**
 * Format temperature values with unit conversion
 * @param {number} celsius - Temperature in Celsius
 * @param {string} targetUnit - Target unit (celsius, fahrenheit, kelvin)
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted temperature string
 */
export const formatTemperature = (celsius, targetUnit = 'celsius', decimals = 1) => {
  if (celsius === null || celsius === undefined || isNaN(celsius)) {
    return '--';
  }

  let value = celsius;
  let unit = UNITS.CELSIUS;

  switch (targetUnit.toLowerCase()) {
    case 'fahrenheit':
      value = (celsius * 9/5) + 32;
      unit = UNITS.FAHRENHEIT;
      break;
    case 'kelvin':
      value = celsius + 273.15;
      unit = UNITS.KELVIN;
      break;
    default:
      // Keep celsius as default
      break;
  }

  return `${value.toFixed(decimals)}${unit}`;
};

/**
 * Format speed values with unit conversion
 * @param {number} kmh - Speed in km/h
 * @param {string} targetUnit - Target unit (kmh, mph)
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted speed string
 */
export const formatSpeed = (kmh, targetUnit = 'kmh', decimals = 0) => {
  if (kmh === null || kmh === undefined || isNaN(kmh)) {
    return '--';
  }

  let value = kmh;
  let unit = UNITS.KMH;

  if (targetUnit.toLowerCase() === 'mph') {
    value = kmh * 0.621371;
    unit = UNITS.MPH;
  }

  return `${value.toFixed(decimals)} ${unit}`;
};

/**
 * Format pressure values with unit conversion
 * @param {number} kpa - Pressure in kPa
 * @param {string} targetUnit - Target unit (kpa, psi, bar, mmhg)
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted pressure string
 */
export const formatPressure = (kpa, targetUnit = 'kpa', decimals = 1) => {
  if (kpa === null || kpa === undefined || isNaN(kpa)) {
    return '--';
  }

  let value = kpa;
  let unit = UNITS.KPA;

  switch (targetUnit.toLowerCase()) {
    case 'psi':
      value = kpa * 0.145038;
      unit = UNITS.PSI;
      break;
    case 'bar':
      value = kpa * 0.01;
      unit = UNITS.BAR;
      break;
    case 'mmhg':
      value = kpa * 7.50062;
      unit = UNITS.MMHG;
      break;
    default:
      // Keep kPa as default
      break;
  }

  return `${value.toFixed(decimals)} ${unit}`;
};

/**
 * Format percentage values
 * @param {number} value - Percentage value (0-100)
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage string
 */
export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '--';
  }

  return `${value.toFixed(decimals)}${UNITS.PERCENT}`;
};

/**
 * Format RPM values
 * @param {number} rpm - RPM value
 * @returns {string} Formatted RPM string
 */
export const formatRPM = (rpm) => {
  if (rpm === null || rpm === undefined || isNaN(rpm)) {
    return '--';
  }

  return `${Math.round(rpm)} ${UNITS.RPM}`;
};

/**
 * Format voltage values
 * @param {number} volts - Voltage value
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted voltage string
 */
export const formatVoltage = (volts, decimals = 2) => {
  if (volts === null || volts === undefined || isNaN(volts)) {
    return '--';
  }

  return `${volts.toFixed(decimals)} ${UNITS.VOLTS}`;
};

/**
 * Format fuel consumption values
 * @param {number} lph - Liters per hour
 * @param {string} targetUnit - Target unit (lph, gph)
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted fuel consumption string
 */
export const formatFuelConsumption = (lph, targetUnit = 'lph', decimals = 2) => {
  if (lph === null || lph === undefined || isNaN(lph)) {
    return '--';
  }

  let value = lph;
  let unit = UNITS.LPH;

  if (targetUnit.toLowerCase() === 'gph') {
    value = lph * 0.264172;
    unit = UNITS.GPH;
  }

  return `${value.toFixed(decimals)} ${unit}`;
};

/**
 * Format air flow values
 * @param {number} gps - Grams per second
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted air flow string
 */
export const formatAirFlow = (gps, decimals = 2) => {
  if (gps === null || gps === undefined || isNaN(gps)) {
    return '--';
  }

  return `${gps.toFixed(decimals)} ${UNITS.GPS}`;
};

/**
 * Format time values
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time string (HH:MM:SS)
 */
export const formatTime = (seconds) => {
  if (seconds === null || seconds === undefined || isNaN(seconds)) {
    return '--:--:--';
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Format date and time
 * @param {Date|string|number} date - Date object, ISO string, or timestamp
 * @param {string} format - Format type from DATE_FORMATS
 * @returns {string} Formatted date string
 */
export const formatDateTime = (date, format = DATE_FORMATS.DATETIME) => {
  if (!date) return '--';

  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return '--';

  const options = {};
  
  switch (format) {
    case DATE_FORMATS.SHORT:
      options.year = 'numeric';
      options.month = '2-digit';
      options.day = '2-digit';
      return dateObj.toLocaleDateString('en-US', options);
    
    case DATE_FORMATS.LONG:
      options.year = 'numeric';
      options.month = 'long';
      options.day = 'numeric';
      return dateObj.toLocaleDateString('en-US', options);
    
    case DATE_FORMATS.TIME:
      options.hour = '2-digit';
      options.minute = '2-digit';
      options.second = '2-digit';
      options.hour12 = false;
      return dateObj.toLocaleTimeString('en-US', options);
    
    case DATE_FORMATS.DATETIME:
      return `${formatDateTime(date, DATE_FORMATS.SHORT)} ${formatDateTime(date, DATE_FORMATS.TIME)}`;
    
    case DATE_FORMATS.ISO:
      return dateObj.toISOString();
    
    default:
      return dateObj.toLocaleString();
  }
};

/**
 * Format duration (elapsed time)
 * @param {number} milliseconds - Duration in milliseconds
 * @returns {string} Formatted duration string
 */
export const formatDuration = (milliseconds) => {
  if (milliseconds === null || milliseconds === undefined || isNaN(milliseconds)) {
    return '--';
  }

  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
};

/**
 * Format file size
 * @param {number} bytes - Size in bytes
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted file size string
 */
export const formatFileSize = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  if (bytes === null || bytes === undefined || isNaN(bytes)) return '--';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
};

/**
 * Format numeric values with thousands separator
 * @param {number} value - Numeric value
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted number string
 */
export const formatNumber = (value, decimals = 0) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '--';
  }

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

/**
 * Format DTC codes
 * @param {string} code - DTC code
 * @returns {string} Formatted DTC code
 */
export const formatDTCCode = (code) => {
  if (!code || typeof code !== 'string') return '--';
  
  // Remove any existing formatting and ensure uppercase
  const cleanCode = code.replace(/[^A-Z0-9]/g, '').toUpperCase();
  
  // Format as standard DTC format (e.g., P0123)
  if (cleanCode.length >= 5) {
    return `${cleanCode.charAt(0)}${cleanCode.substring(1, 5)}`;
  }
  
  return cleanCode;
};

/**
 * Format vehicle identification number (VIN)
 * @param {string} vin - VIN string
 * @returns {string} Formatted VIN
 */
export const formatVIN = (vin) => {
  if (!vin || typeof vin !== 'string') return '--';
  
  const cleanVIN = vin.replace(/[^A-Z0-9]/g, '').toUpperCase();
  
  if (cleanVIN.length === 17) {
    // Format VIN with spaces for readability: XXX XXX XXX XXXXXXXXX
    return `${cleanVIN.substring(0, 3)} ${cleanVIN.substring(3, 6)} ${cleanVIN.substring(6, 9)} ${cleanVIN.substring(9)}`;
  }
  
  return cleanVIN;
};

/**
 * Format sensor readings for display
 * @param {Object} reading - Sensor reading object
 * @param {string} reading.pid - PID identifier
 * @param {number} reading.value - Raw sensor value
 * @param {Object} pidDefinition - PID definition with formatting info
 * @returns {string} Formatted sensor reading
 */
export const formatSensorReading = (reading, pidDefinition) => {
  if (!reading || !pidDefinition) return '--';

  const { value } = reading;
  const { unit, decimals = 1, type } = pidDefinition;

  switch (type) {
    case 'temperature':
      return formatTemperature(value, unit, decimals);
    case 'speed':
      return formatSpeed(value, unit, decimals);
    case 'pressure':
      return formatPressure(value, unit, decimals);
    case 'percentage':
      return formatPercentage(value, decimals);
    case 'rpm':
      return formatRPM(value);
    case 'voltage':
      return formatVoltage(value, decimals);
    default:
      return `${value?.toFixed?.(decimals) || value} ${unit || ''}`.trim();
  }
};

/**
 * Format connection status for display
 * @param {string} status - Connection status
 * @returns {Object} Formatted status with color and label
 */
export const formatConnectionStatus = (status) => {
  const statusMap = {
    connected: { label: 'Connected', color: '#34C759' },
    connecting: { label: 'Connecting...', color: '#FF9500' },
    disconnected: { label: 'Disconnected', color: '#8E8E93' },
    error: { label: 'Connection Error', color: '#FF3B30' },
    scanning: { label: 'Scanning...', color: '#007AFF' },
  };

  return statusMap[status] || { label: 'Unknown', color: '#8E8E93' };
};

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text || typeof text !== 'string') return '';
  
  if (text.length <= maxLength) return text;
  
  return `${text.substring(0, maxLength - 3)}...`;
};