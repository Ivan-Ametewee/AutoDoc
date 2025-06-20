// OBDII Diagnostic App - Converters
// Utility functions for data conversion and calculation

/**
 * Convert temperature between different units
 */
export const temperatureConverter = {
  celsiusToFahrenheit: (celsius) => (celsius * 9/5) + 32,
  fahrenheitToCelsius: (fahrenheit) => (fahrenheit - 32) * 5/9,
  celsiusToKelvin: (celsius) => celsius + 273.15,
  kelvinToCelsius: (kelvin) => kelvin - 273.15,
  fahrenheitToKelvin: (fahrenheit) => ((fahrenheit - 32) * 5/9) + 273.15,
  kelvinToFahrenheit: (kelvin) => ((kelvin - 273.15) * 9/5) + 32,
};

/**
 * Convert speed between different units
 */
export const speedConverter = {
  kmhToMph: (kmh) => kmh * 0.621371,
  mphToKmh: (mph) => mph * 1.609344,
  msToKmh: (ms) => ms * 3.6,
  kmhToMs: (kmh) => kmh / 3.6,
  msToMph: (ms) => ms * 2.236936,
  mphToMs: (mph) => mph * 0.44704,
};

/**
 * Convert pressure between different units
 */
export const pressureConverter = {
  kpaToPsi: (kpa) => kpa * 0.145038,
  psiToKpa: (psi) => psi * 6.89476,
  kpaToBar: (kpa) => kpa * 0.01,
  barToKpa: (bar) => bar * 100,
  kpaToMmhg: (kpa) => kpa * 7.50062,
  mmhgToKpa: (mmhg) => mmhg * 0.133322,
  psiToBar: (psi) => psi * 0.0689476,
  barToPsi: (bar) => bar * 14.5038,
  atmToKpa: (atm) => atm * 101.325,
  kpaToAtm: (kpa) => kpa / 101.325,
};

/**
 * Convert volume between different units
 */
export const volumeConverter = {
  litersToGallons: (liters) => liters * 0.264172,
  gallonsToLiters: (gallons) => gallons * 3.78541,
  litersToImperialGallons: (liters) => liters * 0.219969,
  imperialGallonsToLiters: (imperialGallons) => imperialGallons * 4.54609,
  mlToOz: (ml) => ml * 0.033814,
  ozToMl: (oz) => oz * 29.5735,
};

/**
 * Convert fuel efficiency between different units
 */
export const fuelEfficiencyConverter = {
  l100kmToMpg: (l100km) => 235.214 / l100km,
  mpgToL100km: (mpg) => 235.214 / mpg,
  kmLToMpg: (kmL) => kmL * 2.352,
  mpgToKmL: (mpg) => mpg / 2.352,
  l100kmToKmL: (l100km) => 100 / l100km,
  kmLToL100km: (kmL) => 100 / kmL,
};

/**
 * Convert OBDII raw data to meaningful values
 */
export const obdiiConverter = {
  /**
   * Convert raw PID response to actual value
   * @param {string} pid - PID identifier
   * @param {string} response - Raw hex response
   * @returns {number|null} Converted value
   */
  convertPIDResponse: (pid, response) => {
    if (!response || response.length < 4) return null;
    
    // Remove PID echo and extract data bytes
    const dataBytes = response.substring(4);
    const bytes = [];
    
    for (let i = 0; i < dataBytes.length; i += 2) {
      bytes.push(parseInt(dataBytes.substring(i, i + 2), 16));
    }
    
    switch (pid.toUpperCase()) {
      case '010C': // Engine RPM
        return bytes.length >= 2 ? ((bytes[0] * 256) + bytes[1]) / 4 : null;
      
      case '010D': // Vehicle Speed
        return bytes.length >= 1 ? bytes[0] : null;
      
      case '0105': // Engine Coolant Temperature
        return bytes.length >= 1 ? bytes[0] - 40 : null;
      
      case '010F': // Intake Air Temperature
        return bytes.length >= 1 ? bytes[0] - 40 : null;
      
      case '0104': // Calculated Engine Load
        return bytes.length >= 1 ? (bytes[0] * 100) / 255 : null;
      
      case '0111': // Throttle Position
        return bytes.length >= 1 ? (bytes[0] * 100) / 255 : null;
      
      case '012F': // Fuel Tank Level Input
        return bytes.length >= 1 ? (bytes[0] * 100) / 255 : null;
      
      case '010A': // Fuel System Pressure
        return bytes.length >= 1 ? bytes[0] * 3 : null;
      
      case '010B': // Intake Manifold Absolute Pressure
        return bytes.length >= 1 ? bytes[0] : null;
      
      case '0110': // MAF Air Flow Rate
        return bytes.length >= 2 ? ((bytes[0] * 256) + bytes[1]) / 100 : null;
      
      case '0114': // Oxygen Sensor Voltage
        return bytes.length >= 2 ? bytes[0] / 200 : null;
      
      case '0106': // Short Term Fuel Trim - Bank 1
      case '0107': // Long Term Fuel Trim - Bank 1
        return bytes.length >= 1 ? (bytes[0] - 128) * 100 / 128 : null;
      
      case '010E': // Timing Advance
        return bytes.length >= 1 ? (bytes[0] / 2) - 64 : null;
      
      case '0122': // Fuel Rail Pressure
        return bytes.length >= 2 ? ((bytes[0] * 256) + bytes[1]) * 0.079 : null;
      
      case '0133': // Barometric Pressure
        return bytes.length >= 1 ? bytes[0] : null;
      
      case '013C': // Catalyst Temperature Bank 1, Sensor 1
        return bytes.length >= 2 ? (((bytes[0] * 256) + bytes[1]) / 10) - 40 : null;
      
      default:
        return null;
    }
  },
  
  /**
   * Convert DTC code from hex to standard format
   * @param {string} hexCode - Hex DTC code
   * @returns {string} Standard DTC format (e.g., P0301)
   */
  convertDTCCode: (hexCode) => {
    if (!hexCode || hexCode.length !== 4) return null;
    
    const code = parseInt(hexCode, 16);
    const firstChar = Math.floor(code / 4096);
    const secondDigit = Math.floor((code % 4096) / 256);
    const thirdDigit = Math.floor((code % 256) / 16);
    const fourthDigit = code % 16;
    
    const prefixMap = {
      0: 'P', // Powertrain
      1: 'C', // Chassis
      2: 'B', // Body
      3: 'U', // Network
    };
    
    const prefix = prefixMap[firstChar] || 'P';
    return `${prefix}${secondDigit}${thirdDigit}${fourthDigit}`;
  },
  
  /**
   * Convert VIN position to vehicle information
   * @param {string} vin - Vehicle Identification Number
   * @returns {Object} Decoded VIN information
   */
  decodeVIN: (vin) => {
    if (!vin || vin.length !== 17) return null;
    
    const vinData = {
      wmi: vin.substring(0, 3), // World Manufacturer Identifier
      vds: vin.substring(3, 9), // Vehicle Descriptor Section
      vis: vin.substring(9, 17), // Vehicle Identifier Section
      modelYear: null,
      checkDigit: vin.charAt(8),
    };
    
    // Decode model year (position 10)
    const yearChar = vin.charAt(9);
    const yearMap = {
      'A': 2010, 'B': 2011, 'C': 2012, 'D': 2013, 'E': 2014,
      'F': 2015, 'G': 2016, 'H': 2017, 'J': 2018, 'K': 2019,
      'L': 2020, 'M': 2021, 'N': 2022, 'P': 2023, 'R': 2024,
      'S': 2025, 'T': 2026, 'V': 2027, 'W': 2028, 'X': 2029,
      'Y': 2030, '1': 2031, '2': 2032, '3': 2033, '4': 2034,
      '5': 2035, '6': 2036, '7': 2037, '8': 2038, '9': 2039,
    };
    
    vinData.modelYear = yearMap[yearChar] || null;
    
    return vinData;
  },
};

/**
 * Convert between different coordinate systems
 */
export const coordinateConverter = {
  /**
   * Convert degrees to radians
   */
  degreesToRadians: (degrees) => degrees * (Math.PI / 180),
  
  /**
   * Convert radians to degrees
   */
  radiansToDegrees: (radians) => radians * (180 / Math.PI),
  
  /**
   * Calculate distance between two GPS coordinates
   * @param {number} lat1 - Latitude 1
   * @param {number} lon1 - Longitude 1
   * @param {number} lat2 - Latitude 2
   * @param {number} lon2 - Longitude 2
   * @returns {number} Distance in kilometers
   */
  calculateDistance: (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = coordinateConverter.degreesToRadians(lat2 - lat1);
    const dLon = coordinateConverter.degreesToRadians(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(coordinateConverter.degreesToRadians(lat1)) *
              Math.cos(coordinateConverter.degreesToRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },
};

/**
 * Convert time between different formats
 */
export const timeConverter = {
  /**
   * Convert milliseconds to various time units
   */
  msToSeconds: (ms) => ms / 1000,
  msToMinutes: (ms) => ms / (1000 * 60),
  msToHours: (ms) => ms / (1000 * 60 * 60),
  msToDays: (ms) => ms / (1000 * 60 * 60 * 24),
  
  /**
   * Convert seconds to various time units
   */
  secondsToMs: (seconds) => seconds * 1000,
  secondsToMinutes: (seconds) => seconds / 60,
  secondsToHours: (seconds) => seconds / 3600,
  secondsToDays: (seconds) => seconds / 86400,
  
  /**
   * Convert engine hours to various formats
   */
  engineHoursToKm: (hours, avgSpeed = 50) => hours * avgSpeed,
  kmToEngineHours: (km, avgSpeed = 50) => km / avgSpeed,
};

/**
 * Convert electrical measurements
 */
export const electricalConverter = {
  /**
   * Convert between electrical units
   */
  millivoltsToVolts: (mv) => mv / 1000,
  voltsToMillivolts: (v) => v * 1000,
  milliampsToAmps: (ma) => ma / 1000,
  ampsToMilliamps: (a) => a * 1000,
  
  /**
   * Calculate electrical power
   */
  calculatePower: (voltage, current) => voltage * current,
  calculateResistance: (voltage, current) => voltage / current,
  calculateCurrent: (voltage, resistance) => voltage / resistance,
  calculateVoltage: (current, resistance) => current * resistance,
};

/**
 * Convert data sizes
 */
export const dataConverter = {
  bytesToKB: (bytes) => bytes / 1024,
  bytesToMB: (bytes) => bytes / (1024 * 1024),
  bytesToGB: (bytes) => bytes / (1024 * 1024 * 1024),
  kbToBytes: (kb) => kb * 1024,
  mbToBytes: (mb) => mb * 1024 * 1024,
  gbToBytes: (gb) => gb * 1024 * 1024 * 1024,
};

/**
 * Convert between number bases
 */
export const baseConverter = {
  hexToDec: (hex) => parseInt(hex, 16),
  decToHex: (dec) => dec.toString(16).toUpperCase(),
  binToDec: (bin) => parseInt(bin, 2),
  decToBin: (dec) => dec.toString(2),
  hexToBin: (hex) => parseInt(hex, 16).toString(2),
  binToHex: (bin) => parseInt(bin, 2).toString(16).toUpperCase(),
};

/**
 * Convert checksum calculations
 */
export const checksumConverter = {
  /**
   * Calculate simple checksum
   */
  calculateChecksum: (data) => {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data.charCodeAt(i);
    }
    return sum % 256;
  },
  
  /**
   * Calculate CRC-8 checksum
   */
  calculateCRC8: (data) => {
    let crc = 0;
    for (let i = 0; i < data.length; i++) {
      crc ^= data.charCodeAt(i);
      for (let j = 0; j < 8; j++) {
        if (crc & 0x80) {
          crc = (crc << 1) ^ 0x07;
        } else {
          crc <<= 1;
        }
        crc &= 0xFF;
      }
    }
    return crc;
  },
};

/**
 * Convert statistical calculations
 */
export const statisticalConverter = {
  /**
   * Calculate average
   */
  calculateAverage: (values) => {
    if (!values || values.length === 0) return 0;
    const sum = values.reduce((acc, val) => acc + val, 0);
    return sum / values.length;
  },
  
  /**
   * Calculate median
   */
  calculateMedian: (values) => {
    if (!values || values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 
      ? (sorted[mid - 1] + sorted[mid]) / 2 
      : sorted[mid];
  },
  
  /**
   * Calculate standard deviation
   */
  calculateStandardDeviation: (values) => {
    if (!values || values.length === 0) return 0;
    const avg = statisticalConverter.calculateAverage(values);
    const squaredDiffs = values.map(val => Math.pow(val - avg, 2));
    const avgSquaredDiff = statisticalConverter.calculateAverage(squaredDiffs);
    return Math.sqrt(avgSquaredDiff);
  },
  
  /**
   * Calculate min/max values
   */
  findMinMax: (values) => {
    if (!values || values.length === 0) return { min: 0, max: 0 };
    return {
      min: Math.min(...values),
      max: Math.max(...values),
    };
  },
};

/**
 * Convert angle measurements
 */
export const angleConverter = {
  degreesToRadians: (degrees) => degrees * (Math.PI / 180),
  radiansToDegrees: (radians) => radians * (180 / Math.PI),
  normalizeAngle: (angle) => {
    while (angle > 360) angle -= 360;
    while (angle < 0) angle += 360;
    return angle;
  },
};