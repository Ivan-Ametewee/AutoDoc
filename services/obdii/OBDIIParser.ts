import { PIDDefinition, PIDDefinitions } from './PIDDefinitions';

export interface ParsedPIDData {
  name: string;
  value: number | string;
  unit?: string;
  timestamp: Date;
  raw: string;
  mode: string;
  pid: string;
}

export class OBDIIParser {
  /**
   * **REFACTORED**: This method now correctly parses raw OBD-II responses.
   * @param rawData The raw string from the adapter (e.g., '410544').
   */
  public static parse(rawData: string): ParsedPIDData | null {
    if (!rawData || typeof rawData !== 'string') {
      return null;
    }

    const cleanedData = rawData.replace(/\s/g, '');
    if (cleanedData.length < 4) {
      return null;
    }

    const responseModeHex = cleanedData.substring(0, 2);
    const pidHex = cleanedData.substring(2, 4);

    // Find the corresponding PID definition
    const pidDef = this.findPIDDefinition(responseModeHex, pidHex);

    if (!pidDef) {
      console.warn(`No PID definition found for response: ${rawData}`);
      return null;
    }

    // Extract the data bytes (the part of the string after the mode and PID)
    const dataBytesHex = cleanedData.substring(4);
    if (dataBytesHex.length !== pidDef.bytes * 2) {
      // Check if the number of hex characters matches the expected byte count
      return null;
    }

    try {
      // Convert the hex string to an array of numbers
      const dataBytes: number[] = [];
      for (let i = 0; i < dataBytesHex.length; i += 2) {
        dataBytes.push(parseInt(dataBytesHex.substring(i, i + 2), 16));
      }

      // Use the 'parse' function from the PID definition to get the final value
      const parsedValue = pidDef.parse(dataBytes);

      return {
        name: pidDef.name,
        value: parsedValue,
        unit: pidDef.unit,
        timestamp: new Date(),
        raw: rawData,
        mode: pidDef.mode,
        pid: pidDef.pid,
      };
    } catch (error) {
      console.error(`Error parsing PID ${pidDef.name}:`, error);
      return null;
    }
  }

  /**
   * Finds the PID definition based on the response from the adapter.
   * @param modeHex The hex for the response mode (e.g., '41').
   * @param pidHex The hex for the PID (e.g., '0C').
   */
  private static findPIDDefinition(modeHex: string, pidHex: string): PIDDefinition | undefined {
    // A response mode ('41') is 0x40 greater than the request mode ('01').
    const requestMode = (parseInt(modeHex, 16) - 0x40).toString(16).padStart(2, '0').toUpperCase();
    
    // Find the definition that matches both the mode and PID.
    return PIDDefinitions.getAllPIDs().find(p => 
      p.mode.toUpperCase() === requestMode && 
      p.pid.toUpperCase() === pidHex.toUpperCase()
    );
  }
}