// utils/dataProcessing.ts
import { UnitConverter } from './unitConversion';
import SettingsService from '../services/settings/SettingsService';

export interface ProcessedOBDData {
  name: string;
  value: number;
  displayValue: string;
  unit: string;
  rawValue: number;
  status: 'normal' | 'warning' | 'critical';
}

/**
 * Centralized OBD-II data processing utility
 * Ensures consistent formatting and unit conversion across all screens
 */
export class DataProcessor {
  
  /**
   * Process raw OBD-II data with consistent formatting and unit conversion
   */
  static processOBDData(pidName: string, rawValue: number): ProcessedOBDData {
    const tempUnit = SettingsService.getTemperatureUnit();
    const distanceUnit = SettingsService.getDistanceUnit();
    
    let processedValue = rawValue;
    let unit = '';
    let displayValue = '';
    let status: 'normal' | 'warning' | 'critical' = 'normal';
    
    switch (pidName) {
      case 'ENGINE_RPM':
        processedValue = Math.round(rawValue);
        unit = 'rpm';
        displayValue = processedValue.toString();
        status = this.getRPMStatus(processedValue);
        break;
        
      case 'VEHICLE_SPEED':
        processedValue = UnitConverter.convertSpeed(rawValue, distanceUnit === 'miles');
        unit = distanceUnit === 'miles' ? 'mph' : 'km/h';
        displayValue = Math.round(processedValue).toString();
        status = this.getSpeedStatus(processedValue);
        break;
        
      case 'ENGINE_COOLANT_TEMP':
        processedValue = UnitConverter.convertTemperature(rawValue, tempUnit === 'fahrenheit');
        unit = tempUnit === 'fahrenheit' ? '°F' : '°C';
        displayValue = Math.round(processedValue).toString();
        status = this.getCoolantTempStatus(rawValue); // Use raw Celsius for status
        break;
        
      case 'INTAKE_AIR_TEMP':
      case 'AIR_INTAKE_TEMP':
        processedValue = UnitConverter.convertTemperature(rawValue, tempUnit === 'fahrenheit');
        unit = tempUnit === 'fahrenheit' ? '°F' : '°C';
        displayValue = Math.round(processedValue).toString();
        status = this.getIntakeAirTempStatus(rawValue); // Use raw Celsius for status
        break;
        
      case 'ENGINE_LOAD':
        processedValue = Math.round(rawValue);
        unit = '%';
        displayValue = processedValue.toString();
        status = this.getEngineLoadStatus(processedValue);
        break;
        
      case 'THROTTLE_POSITION':
        processedValue = Math.round(rawValue);
        unit = '%';
        displayValue = processedValue.toString();
        status = this.getThrottleStatus(processedValue);
        break;
        
      case 'FUEL_LEVEL':
        processedValue = Math.round(rawValue);
        unit = '%';
        displayValue = processedValue.toString();
        status = this.getFuelLevelStatus(processedValue);
        break;
        
      case 'MAF_RATE':
        processedValue = Math.round(rawValue * 10) / 10; // Round to 1 decimal
        unit = 'g/s';
        displayValue = processedValue.toFixed(1);
        status = this.getMAFStatus(processedValue);
        break;
        
      case 'CONTROL_MODULE_VOLTAGE':
        processedValue = Math.round(rawValue * 10) / 10; // Round to 1 decimal
        unit = 'V';
        displayValue = processedValue.toFixed(1);
        status = this.getBatteryVoltageStatus(processedValue);
        break;
        
      case 'TOTAL_DISTANCE':
      case 'ODOMETER':
      case 'VEHICLE_ODOMETER':
      case 'TOTAL_DISTANCE_TRAVELED':
        processedValue = UnitConverter.convertDistance(rawValue, distanceUnit === 'miles');
        unit = distanceUnit === 'miles' ? 'mi' : 'km';
        displayValue = Math.round(processedValue).toString();
        status = 'normal'; // Odometer doesn't have warning/critical status
        break;
        
      default:
        processedValue = Math.round(rawValue);
        unit = '';
        displayValue = processedValue.toString();
        status = 'normal';
    }
    
    return {
      name: pidName,
      value: processedValue,
      displayValue,
      unit,
      rawValue,
      status
    };
  }
  
  /**
   * Format processed data for display
   */
  static formatForDisplay(data: ProcessedOBDData, includeUnit = true): string {
    return includeUnit ? `${data.displayValue} ${data.unit}` : data.displayValue;
  }
  
  /**
   * Get parameter status based on value ranges
   */
  private static getRPMStatus(rpm: number): 'normal' | 'warning' | 'critical' {
    if (rpm > 6000) return 'critical';
    if (rpm > 4500) return 'warning';
    return 'normal';
  }
  
  private static getSpeedStatus(speed: number): 'normal' | 'warning' | 'critical' {
    if (speed > 120) return 'critical';
    if (speed > 80) return 'warning';
    return 'normal';
  }
  
  private static getCoolantTempStatus(tempCelsius: number): 'normal' | 'warning' | 'critical' {
    if (tempCelsius > 105) return 'critical';
    if (tempCelsius > 95 || tempCelsius < 70) return 'warning';
    return 'normal';
  }
  
  private static getIntakeAirTempStatus(tempCelsius: number): 'normal' | 'warning' | 'critical' {
    if (tempCelsius > 60) return 'critical';
    if (tempCelsius > 45) return 'warning';
    return 'normal';
  }
  
  private static getEngineLoadStatus(load: number): 'normal' | 'warning' | 'critical' {
    if (load > 85) return 'critical';
    if (load > 70) return 'warning';
    return 'normal';
  }
  
  private static getThrottleStatus(throttle: number): 'normal' | 'warning' | 'critical' {
    // Throttle position is informational, no critical values
    return 'normal';
  }
  
  private static getFuelLevelStatus(fuel: number): 'normal' | 'warning' | 'critical' {
    if (fuel < 10) return 'critical';
    if (fuel < 25) return 'warning';
    return 'normal';
  }
  
  private static getMAFStatus(maf: number): 'normal' | 'warning' | 'critical' {
    if (maf < 1 || maf > 50) return 'warning';
    return 'normal';
  }
  
  private static getBatteryVoltageStatus(voltage: number): 'normal' | 'warning' | 'critical' {
    if (voltage < 11.5) return 'critical';
    if (voltage < 12.0 || voltage > 14.5) return 'warning';
    return 'normal';
  }
}