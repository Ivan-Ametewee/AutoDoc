import SettingsService from '../services/settings/SettingsService';

// Temperature conversion functions
export const celsiusToFahrenheit = (celsius: number): number => {
  return (celsius * 9/5) + 32;
};

export const fahrenheitToCelsius = (fahrenheit: number): number => {
  return (fahrenheit - 32) * 5/9;
};

// Distance conversion functions
export const kmToMiles = (km: number): number => {
  return km * 0.621371;
};

export const milesToKm = (miles: number): number => {
  return miles / 0.621371;
};

// Speed conversion functions
export const kmhToMph = (kmh: number): number => {
  return kmh * 0.621371;
};

export const mphToKmh = (mph: number): number => {
  return mph / 0.621371;
};

// Pressure conversion functions
export const kpaToBar = (kpa: number): number => {
  return kpa / 100;
};

export const kpaToPsi = (kpa: number): number => {
  return kpa * 0.145038;
};

export const barToKpa = (bar: number): number => {
  return bar * 100;
};

export const psiToKpa = (psi: number): number => {
  return psi / 0.145038;
};

// Volume conversion functions
export const litersToGallons = (liters: number): number => {
  return liters * 0.264172; // US gallons
};

export const gallonsToLiters = (gallons: number): number => {
  return gallons / 0.264172;
};

// Flow rate conversion functions
export const gphToLph = (gph: number): number => {
  return gph / 0.264172;
};

export const lphToGph = (lph: number): number => {
  return lph * 0.264172;
};

// Smart conversion functions that use user preferences
export class UnitConverter {
  /**
   * Convert temperature based on user's preferred unit
   */
  static convertTemperature(value: number, fromCelsius: boolean = true): number {
    const userUnit = SettingsService.getTemperatureUnit();
    
    if (fromCelsius && userUnit === 'fahrenheit') {
      return celsiusToFahrenheit(value);
    } else if (!fromCelsius && userUnit === 'celsius') {
      return fahrenheitToCelsius(value);
    }
    
    return value; // No conversion needed
  }

  /**
   * Convert distance based on user's preferred unit
   */
  static convertDistance(value: number, fromKm: boolean = true): number {
    const userUnit = SettingsService.getDistanceUnit();
    
    if (fromKm && userUnit === 'miles') {
      return kmToMiles(value);
    } else if (!fromKm && userUnit === 'km') {
      return milesToKm(value);
    }
    
    return value; // No conversion needed
  }

  /**
   * Convert speed based on user's preferred unit
   */
  static convertSpeed(value: number, fromKmh: boolean = true): number {
    const userUnit = SettingsService.getDistanceUnit();
    
    if (fromKmh && userUnit === 'miles') {
      return kmhToMph(value);
    } else if (!fromKmh && userUnit === 'km') {
      return mphToKmh(value);
    }
    
    return value; // No conversion needed
  }

  /**
   * Format temperature with appropriate unit symbol
   */
  static formatTemperature(value: number, fromCelsius: boolean = true): string {
    const userUnit = SettingsService.getTemperatureUnit();
    const converted = this.convertTemperature(value, fromCelsius);
    const symbol = userUnit === 'fahrenheit' ? '°F' : '°C';
    
    if (Number.isInteger(converted)) {
      return `${converted}${symbol}`;
    } else {
      return `${Math.round(converted * 10) / 10}${symbol}`;
    }
  }

  /**
   * Format distance with appropriate unit symbol
   */
  static formatDistance(value: number, fromKm: boolean = true): string {
    const userUnit = SettingsService.getDistanceUnit();
    const converted = this.convertDistance(value, fromKm);
    const symbol = userUnit === 'miles' ? 'mi' : 'km';
    
    if (converted < 10) {
      return `${Math.round(converted * 100) / 100} ${symbol}`;
    } else {
      return `${Math.round(converted * 10) / 10} ${symbol}`;
    }
  }

  /**
   * Format speed with appropriate unit symbol
   */
  static formatSpeed(value: number, fromKmh: boolean = true): string {
    const userUnit = SettingsService.getDistanceUnit();
    const converted = this.convertSpeed(value, fromKmh);
    const symbol = userUnit === 'miles' ? 'mph' : 'km/h';
    
    return `${Math.round(converted)} ${symbol}`;
  }

  /**
   * Format pressure with appropriate unit (always show multiple units for reference)
   */
  static formatPressure(kpaValue: number, primaryUnit: 'kpa' | 'bar' | 'psi' = 'kpa'): string {
    const kpa = Math.round(kpaValue * 10) / 10;
    const bar = Math.round(kpaToBar(kpaValue) * 100) / 100;
    const psi = Math.round(kpaToPsi(kpaValue) * 10) / 10;
    
    switch (primaryUnit) {
      case 'bar':
        return `${bar} bar (${psi} psi)`;
      case 'psi':
        return `${psi} psi (${bar} bar)`;
      default:
        return `${kpa} kPa (${bar} bar)`;
    }
  }

  /**
   * Format fuel consumption based on user's distance unit
   */
  static formatFuelConsumption(litersPer100km: number): string {
    const userUnit = SettingsService.getDistanceUnit();
    
    if (userUnit === 'miles') {
      // Convert L/100km to MPG (US)
      const mpg = 235.214 / litersPer100km; // Conversion factor for US gallons
      return `${Math.round(mpg * 10) / 10} mpg`;
    } else {
      return `${Math.round(litersPer100km * 10) / 10} L/100km`;
    }
  }

  /**
   * Format volume based on user preferences
   */
  static formatVolume(liters: number): string {
    const userUnit = SettingsService.getDistanceUnit();
    
    if (userUnit === 'miles') {
      const gallons = litersToGallons(liters);
      return `${Math.round(gallons * 100) / 100} gal`;
    } else {
      return `${Math.round(liters * 100) / 100} L`;
    }
  }

  /**
   * Get unit symbols based on user preferences
   */
  static getUnits(): {
    temperature: string;
    distance: string;
    speed: string;
    volume: string;
  } {
    const tempUnit = SettingsService.getTemperatureUnit();
    const distanceUnit = SettingsService.getDistanceUnit();
    
    return {
      temperature: tempUnit === 'fahrenheit' ? '°F' : '°C',
      distance: distanceUnit === 'miles' ? 'mi' : 'km',
      speed: distanceUnit === 'miles' ? 'mph' : 'km/h',
      volume: distanceUnit === 'miles' ? 'gal' : 'L',
    };
  }

  /**
   * Convert any value based on parameter type
   */
  static convertByParameterType(value: number, parameterType: string): { value: number; unit: string } {
    const units = this.getUnits();
    
    switch (parameterType.toLowerCase()) {
      case 'temperature':
      case 'coolant_temp':
      case 'intake_temp':
      case 'oil_temp':
        return {
          value: this.convertTemperature(value),
          unit: units.temperature
        };
        
      case 'speed':
      case 'vehicle_speed':
        return {
          value: this.convertSpeed(value),
          unit: units.speed
        };
        
      case 'distance':
      case 'odometer':
        return {
          value: this.convertDistance(value),
          unit: units.distance
        };
        
      case 'fuel_level':
      case 'fuel_tank':
        return {
          value: this.convertDistance(value) === value ? value : litersToGallons(value),
          unit: units.volume
        };
        
      default:
        return { value, unit: '' };
    }
  }
}

export default UnitConverter;