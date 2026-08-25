// services/obdii/OBDIIParser.ts

import { PIDDefinitions } from './PIDDefinitions';

export interface ParsedPIDData {
  name: string;
  value: number | string;
  unit: string;
  timestamp: Date;
  raw: string;
  mode?: string; // NEW: Track which mode was used
  manufacturer?: string; // NEW: Track manufacturer for Mode 22 PIDs
  pid?: string; // NEW: Track PID hex value
}

export class OBDIIParser {
  /**
   * Parse raw OBD-II response data
   */
  static parse(rawResponse: string): ParsedPIDData | null {
    try {
      const cleanResponse = rawResponse.replace(/\s+/g, '').toUpperCase().trim();
      
      if (!cleanResponse || cleanResponse.includes('NODATA') || cleanResponse.includes('ERROR')) {
        return null;
      }

      // Determine if this is a Mode 22 response or standard OBD-II
      if (cleanResponse.startsWith('62')) {
        return this.parseMode22Response(cleanResponse, rawResponse);
      } else if (cleanResponse.startsWith('41')) {
        return this.parseStandardResponse(cleanResponse, rawResponse);
      } else {
        
        return null;
      }
    } catch (error) {
      
      return null;
    }
  }

  /**
   * Parse standard OBD-II Mode 01 responses (starts with '41')
   */
  private static parseStandardResponse(cleanResponse: string, rawResponse: string): ParsedPIDData | null {
    try {
      // Standard format: 41 [PID] [DATA...]
      const responseCode = cleanResponse.substring(0, 2); // Should be '41'
      const pidCode = cleanResponse.substring(2, 4);
      const dataHex = cleanResponse.substring(4);

      // Find the PID definition
      const pidDefinition = this.findPIDByCode(pidCode, '01');
      
      if (!pidDefinition) {
        
        return {
          name: `UNKNOWN_PID_${pidCode}`,
          value: dataHex,
          unit: '',
          timestamp: new Date(),
          raw: rawResponse,
          mode: '01'
        };
      }

      // Convert hex data to byte array
      const dataBytes = this.hexStringToBytes(dataHex);
      
      // Parse using the PID's parse function
      const parsedValue = pidDefinition.parse(dataBytes);

      return {
        name: pidDefinition.name,
        value: parsedValue,
        unit: pidDefinition.unit || '',
        timestamp: new Date(),
        raw: rawResponse,
        mode: '01'
      };
    } catch (error) {
      
      return null;
    }
  }

  /**
   * Parse Mode 22 responses (starts with '62')
   */
  private static parseMode22Response(cleanResponse: string, rawResponse: string): ParsedPIDData | null {
    try {
      // Mode 22 format: 62 [PID] [DATA...]
      // PID can be variable length (e.g., 25AE, 00C0, DD01)
      
      const responseCode = cleanResponse.substring(0, 2); // Should be '62'
      
      // Try to find matching PID definition by checking different PID lengths
      let pidDefinition = null;
      let pidLength = 0;
      let dataStartIndex = 2;

      // Try common PID lengths (2, 4, 6 characters)
      for (const testLength of [4, 2, 6]) {
        const testPid = cleanResponse.substring(2, 2 + testLength);
        pidDefinition = this.findPIDByCode(testPid, '22');
        
        if (pidDefinition) {
          pidLength = testLength;
          dataStartIndex = 2 + testLength;
          break;
        }
      }

      if (!pidDefinition) {
        // Try to extract PID from known patterns
        const possiblePid = cleanResponse.substring(2, 6); // Assume 4-char PID
        
        
        return {
          name: `UNKNOWN_MODE22_PID_${possiblePid}`,
          value: cleanResponse.substring(6),
          unit: '',
          timestamp: new Date(),
          raw: rawResponse,
          mode: '22'
        };
      }

      // Extract data portion
      const dataHex = cleanResponse.substring(dataStartIndex);
      const dataBytes = this.hexStringToBytes(dataHex);

      // Validate we have enough bytes
      if (dataBytes.length < pidDefinition.bytes) {
        
        return null;
      }

      // Parse using the PID's parse function
      const parsedValue = pidDefinition.parse(dataBytes);

      return {
        name: pidDefinition.name,
        value: parsedValue,
        unit: pidDefinition.unit || '',
        timestamp: new Date(),
        raw: rawResponse,
        mode: '22',
        manufacturer: pidDefinition.manufacturer
      };
    } catch (error) {
      
      return null;
    }
  }

  /**
   * Find PID definition by PID code and mode
   */
  private static findPIDByCode(pidCode: string, mode: string) {
    const allPIDs = PIDDefinitions.getAllPIDs();
    
    return allPIDs.find(pid => 
      pid.pid.toUpperCase() === pidCode.toUpperCase() && 
      pid.mode === mode
    );
  }

  /**
   * Convert hex string to array of bytes
   */
  private static hexStringToBytes(hexString: string): number[] {
    const bytes: number[] = [];
    
    for (let i = 0; i < hexString.length; i += 2) {
      const byteHex = hexString.substring(i, i + 2);
      if (byteHex.length === 2) {
        const byteValue = parseInt(byteHex, 16);
        if (!isNaN(byteValue)) {
          bytes.push(byteValue);
        }
      }
    }
    
    return bytes;
  }

  /**
   * Parse multiple PID responses (for cases where multiple PIDs are returned)
   */
  static parseMultipleResponses(rawResponse: string): ParsedPIDData[] {
    const results: ParsedPIDData[] = [];
    
    // Split response by common delimiters
    const responses = rawResponse.split(/[\r\n>]+/).filter(r => r.trim());
    
    for (const response of responses) {
      const parsed = this.parse(response);
      if (parsed) {
        results.push(parsed);
      }
    }
    
    return results;
  }

  /**
   * Validate response format
   */
  static isValidResponse(response: string): boolean {
    const clean = response.replace(/\s+/g, '').toUpperCase();
    
    // Check for error responses
    if (clean.includes('NODATA') || 
        clean.includes('ERROR') || 
        clean.includes('UNABLE') ||
        clean.includes('TIMEOUT')) {
      return false;
    }

    // Check for valid response patterns
    return clean.startsWith('41') || // Standard OBD-II
           clean.startsWith('62') || // Mode 22
           clean.startsWith('43') || // DTCs
           clean.startsWith('49');   // Vehicle info
  }

  /**
   * Extract error information from response
   */
  static parseError(response: string): string | null {
    const upperResponse = response.toUpperCase();
    
    if (upperResponse.includes('NO DATA')) {
      return 'No data available';
    }
    if (upperResponse.includes('ERROR')) {
      return 'Communication error';
    }
    if (upperResponse.includes('UNABLE TO CONNECT')) {
      return 'Unable to connect to vehicle';
    }
    if (upperResponse.includes('TIMEOUT')) {
      return 'Command timeout';
    }
    if (upperResponse.includes('BUS INIT')) {
      return 'Bus initialization error';
    }
    
    return null;
  }

  /**
   * Format parsed data for display
   */
  static formatForDisplay(parsedData: ParsedPIDData): string {
    let value = parsedData.value;
    
    // Format numeric values
    if (typeof value === 'number') {
      if (parsedData.unit === '%') {
        value = value.toFixed(1);
      } else if (parsedData.unit === 'rpm') {
        value = Math.round(value);
      } else if (parsedData.unit === 'km' || parsedData.unit === 'km/h') {
        value = Math.round(value);
      } else {
        value = value.toFixed(2);
      }
    }
    
    return `${value}${parsedData.unit ? ' ' + parsedData.unit : ''}`;
  }

  /**
   * Check if parsed data represents an odometer reading
   */
  static isOdometerReading(parsedData: ParsedPIDData): boolean {
    return parsedData.name.toLowerCase().includes('odometer') ||
           parsedData.name.toLowerCase().includes('distance') ||
           parsedData.name.toLowerCase().includes('mileage');
  }

  /**
   * Check if parsed data is from a manufacturer-specific PID
   */
  static isManufacturerSpecific(parsedData: ParsedPIDData): boolean {
    return parsedData.mode === '22' || 
           parsedData.manufacturer !== undefined;
  }
}