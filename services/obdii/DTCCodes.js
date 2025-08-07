// src/services/obdii/DTCCodes.js

/**
 * Comprehensive OBDII Diagnostic Trouble Code (DTC) database
 * Format: DTC codes follow SAE J2012 standard
 * Structure: [Letter][Digit][Digit][Digit][Digit]
 * - First character: System (P=Powertrain, B=Body, C=Chassis, U=Network)
 * - Second character: 0=Generic, 1=Manufacturer specific, 2/3=Reserved
 */

import { unifiedDTCService } from './UnifiedDTCService';

export class DTCCodes {
  constructor() {
    // Use the unified database
    this.unifiedDB = unifiedDTCService;
  }

  /**
   * Get DTC information by code - delegates to unified database
   */
  getDTCInfo(code) {
    return this.unifiedDB.getDTCInfo(code);
  }

  /**
   * Get system type from code prefix
   */
  getSystemType(code) {
    return this.unifiedDB.getSystemType(code);
  }

  /**
   * Get code type (Generic/Manufacturer specific)
   */
  getCodeType(code) {
    return this.unifiedDB.getCodeType(code);
  }

  /**
   * Get all codes for a specific system
   */
  getCodesBySystem(system) {
    return this.unifiedDB.getCodesBySystem(system);
  }

  /**
   * Get codes by severity level
   */
  getCodesBySeverity(severity) {
    return this.unifiedDB.getCodesBySeverity(severity);
  }

  /**
   * Search codes by description or symptoms
   */
  searchCodes(searchTerm) {
    return this.unifiedDB.searchCodes(searchTerm);
  }

  /**
   * Get random DTC for testing
   */
  getRandomDTC() {
    return this.unifiedDB.getRandomDTC();
  }

  /**
   * Get all available codes
   */
  getAllCodes() {
    return this.unifiedDB.getAllCodes();
  }

  /**
   * Get system statistics
   */
  getSystemStatistics() {
    return this.unifiedDB.getSystemStatistics();
  }

  /**
   * Get codes by subsystem
   */
  getCodesBySubsystem(subsystem) {
    return this.unifiedDB.getCodesBySubsystem(subsystem);
  }

  /**
   * Get total number of codes in database
   */
  getTotalCodeCount() {
    return this.unifiedDB.getTotalCodeCount();
  }

  /**
   * Get DTCs for specific scenarios (for simulation)
   */
  getDTCsForScenario(scenario) {
    const scenarioDTCs = {
      'overheating': ['P0217', 'P0128', 'P0116'],
      'engine_trouble': ['P0300', 'P0301', 'P0171', 'P0172'],
      'low_fuel': ['P0171', 'P0174'],
      'cold_start': ['P1000', 'P0125'],
      'emissions': ['P0420', 'P0430', 'P0130', 'P0440'],
      'transmission': ['P0700', 'P0750'],
      'abs_issues': ['C0035', 'C0040', 'C0045'],
      'communication': ['U0100', 'U0001', 'U0101'],
      'airbag': ['B0001', 'B0002'],
      'fuel_system': ['P0171', 'P0172', 'P0174', 'P0175']
    };
    
    return this.unifiedDB.getDTCsForScenario(scenario);
  }
}

// Export singleton instance
export const dtcCodes = new DTCCodes();
export default DTCCodes;