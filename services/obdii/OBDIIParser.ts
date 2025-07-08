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

    // Clean the data - remove whitespace, '>', and other common ELM327 responses
    let cleanedData = rawData.replace(/[\s>]/g, '').toUpperCase();
    
    // Handle common ELM327 responses that aren't actual data
    if (cleanedData.includes('NODATA') || 
        cleanedData.includes('ERROR') || 
        cleanedData.includes('UNABLETOCONNECT') ||
        cleanedData.includes('SEARCHING') ||
        cleanedData.includes('OK') ||
        cleanedData === 'ATZ' ||
        cleanedData === 'ATE0' ||
        cleanedData === 'ATSP0') {
      console.log('Ignoring ELM327 status response:', rawData);
      return null;
    }

    // Remove common prefixes that might be present
    cleanedData = cleanedData.replace(/^(ATZ|ATE0|ATSP0|OK)+/, '');
    
    if (cleanedData.length < 4) {
      console.log('Insufficient data length after cleaning:', cleanedData);
      return null;
    }

    // Extract mode and PID from response
    const modeHex = cleanedData.substring(0, 2);
    const pidHex = cleanedData.substring(2, 4);

    console.log(`Parsing response - Mode: ${modeHex}, PID: ${pidHex}, Full: ${cleanedData}`);

    // Find the corresponding PID definition
    const pidDef = this.findPIDDefinition(modeHex, pidHex);

    if (!pidDef) {
      console.warn(`No PID definition found for mode ${modeHex} and PID ${pidHex}`);
      return null;
    }
    
    const dataBytesHex = cleanedData.substring(4);
    if (dataBytesHex.length === 0) {
      console.error('No data bytes found for PID', pidDef.name);
      return null;
    }

    // Ensure we have an even number of hex characters
    if (dataBytesHex.length % 2 !== 0) {
      console.error('Invalid data byte length for PID', pidDef.name, ':', dataBytesHex);
      return null;
    }

    const dataBytes = this.hexToBytes(dataBytesHex);
    
    // Verify we have enough bytes for this PID
    if (dataBytes.length < pidDef.bytes) {
      console.error(`Insufficient data bytes. Expected ${pidDef.bytes}, got ${dataBytes.length} for PID ${pidDef.name}`);
      return null;
    }

    try {
      // Only pass the required number of bytes to the parser
      const relevantBytes = dataBytes.slice(0, pidDef.bytes);
      const parsedValue = pidDef.parse(relevantBytes);

      console.log(`Successfully parsed ${pidDef.name}: ${parsedValue} ${pidDef.unit || ''}`);

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
      console.error(`Data bytes:`, dataBytes);
      return null;
    }
  }

  private static hexToBytes(hex: string): number[] {
    const bytes: number[] = [];
    for (let i = 0; i < hex.length; i += 2) {
      const byteString = hex.substring(i, i + 2);
      const byteValue = parseInt(byteString, 16);
      if (isNaN(byteValue)) {
        console.error(`Invalid hex byte: ${byteString}`);
        continue;
      }
      bytes.push(byteValue);
    }
    return bytes;
  }
  
  private static findPIDDefinition(modeHex: string, pidHex: string): PIDDefinition | undefined {
    const allPIDs = PIDDefinitions.getAllPIDs();
    
    // The response mode is always 0x40 greater than the request mode (e.g., req '01' -> res '41')
    let requestModeNum = parseInt(modeHex, 16) - 0x40;
    
    // Handle potential negative values or invalid modes
    if (requestModeNum < 0 || requestModeNum > 255) {
      console.error(`Invalid response mode: ${modeHex}`);
      return undefined;
    }
    
    const requestMode = requestModeNum.toString(16).padStart(2, '0').toUpperCase();
    
    const foundPID = allPIDs.find(p => 
      p.mode.toUpperCase() === requestMode && 
      p.pid.toUpperCase() === pidHex.toUpperCase()
    );

    if (foundPID) {
      console.log(`Found PID definition: ${foundPID.name} (${foundPID.mode}${foundPID.pid})`);
    }

    return foundPID;
  }

  /**
   * Validate if a raw response looks like valid OBD-II data
   */
  public static isValidOBDResponse(rawData: string): boolean {
    if (!rawData || typeof rawData !== 'string') {
      return false;
    }

    const cleaned = rawData.replace(/[\s>]/g, '').toUpperCase();
    
    // Check for error responses
    const errorResponses = ['NODATA', 'ERROR', 'UNABLETOCONNECT', 'SEARCHING', '?'];
    if (errorResponses.some(error => cleaned.includes(error))) {
      return false;
    }

    // Check for AT commands responses
    if (cleaned.includes('OK') || cleaned.startsWith('AT')) {
      return false;
    }

    // Must be at least 4 characters (mode + PID)
    if (cleaned.length < 4) {
      return false;
    }

    // Must be valid hex
    const hexPattern = /^[0-9A-F]+$/;
    if (!hexPattern.test(cleaned)) {
      return false;
    }

    // First byte should be a valid response mode (0x41, 0x42, etc.)
    const firstByte = parseInt(cleaned.substring(0, 2), 16);
    if (firstByte < 0x41 || firstByte > 0x4F) {
      return false;
    }

    return true;
  }

  /**
   * Extract multiple PID responses from a single response string
   * Some adapters may return multiple PIDs in one response
   */
  public static parseMultiplePIDs(rawData: string): ParsedPIDData[] {
    const results: ParsedPIDData[] = [];
    
    // Split by common delimiters
    const responses = rawData.split(/[\r\n]+/).filter(response => response.trim().length > 0);
    
    for (const response of responses) {
      if (this.isValidOBDResponse(response)) {
        const parsed = this.parse(response);
        if (parsed) {
          results.push(parsed);
        }
      }
    }
    
    return results;
  }
}