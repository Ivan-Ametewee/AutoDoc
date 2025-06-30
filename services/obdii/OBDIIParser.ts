// services/obdii/OBDIIParser.ts

import { PIDDefinition, PIDDefinitions } from './PIDDefinitions';

/**
 * Defines the structure for the data returned after parsing a PID response.
 */
export interface ParsedPIDData {
  name: string;
  value: number | string;
  unit?: string;
  timestamp: Date;
  raw: string;
  mode: string;
  pid: string;
}

/**
 * A static class with methods to parse raw OBD-II responses.
 */
export class OBDIIParser {

  /**
   * Parses a raw OBD-II response string into a structured data object.
   * @param rawData The raw string from the adapter (e.g., '410C1A2B').
   * @returns A ParsedPIDData object, or null if parsing fails.
   */
  public static parse(rawData: string): ParsedPIDData | null {
    if (!rawData || typeof rawData !== 'string') {
      console.error('Invalid raw data for parsing:', rawData);
      return null;
    }

    const cleanedData = rawData.replace(/[\s>]/g, ''); // Remove whitespace and the '>' prompt
    if (cleanedData.length < 4) {
      return null; // Not enough data
    }

    const modeHex = cleanedData.substring(0, 2);
    const pidHex = cleanedData.substring(2, 4);

    // Find the corresponding PID definition based on the response
    const pidDef = this.findPIDDefinition(modeHex, pidHex);

    if (!pidDef) {
      console.warn(`No PID definition found for response mode ${modeHex} and PID ${pidHex}`);
      return null;
    }
    
    const dataBytesHex = cleanedData.substring(4);
    if (dataBytesHex.length % 2 !== 0) {
      console.error('Invalid data byte length for PID', pidDef.name, ':', dataBytesHex);
      return null;
    }

    const dataBytes = this.hexToBytes(dataBytesHex);
    
    try {
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
      console.error(`Error during parsing logic for PID ${pidDef.name}:`, error);
      return null;
    }
  }

  private static hexToBytes(hex: string): number[] {
    const bytes: number[] = [];
    for (let i = 0; i < hex.length; i += 2) {
      bytes.push(parseInt(hex.substring(i, i + 2), 16));
    }
    return bytes;
  }
  
  private static findPIDDefinition(modeHex: string, pidHex: string): PIDDefinition | undefined {
    const allPIDs = PIDDefinitions.getAllPIDs();
    // The response mode is always 0x40 greater than the request mode (e.g., req '01' -> res '41')
    const requestMode = (parseInt(modeHex, 16) - 0x40).toString(16).padStart(2, '0').toUpperCase();
    
    return allPIDs.find(p => 
      p.mode.toUpperCase() === requestMode && 
      p.pid.toUpperCase() === pidHex.toUpperCase()
    );
  }
}