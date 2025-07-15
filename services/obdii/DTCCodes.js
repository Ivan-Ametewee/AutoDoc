// src/services/obdii/DTCCodes.js

/**
 * Comprehensive OBDII Diagnostic Trouble Code (DTC) database
 * Format: DTC codes follow SAE J2012 standard
 * Structure: [Letter][Digit][Digit][Digit][Digit]
 * - First character: System (P=Powertrain, B=Body, C=Chassis, U=Network)
 * - Second character: 0=Generic, 1=Manufacturer specific, 2/3=Reserved
 */

import { comprehensiveDTCCodes } from './ComprehensiveDTCCodes.js';

export class DTCCodes {
  constructor() {
    // Use the comprehensive database
    this.comprehensiveDB = comprehensiveDTCCodes;
  }

  /**
   * Get DTC information by code - delegates to comprehensive database
   */
  getDTCInfo(code) {
    return this.comprehensiveDB.getDTCInfo(code);
  }

  /**
   * Get system type from code prefix
   */
  getSystemType(code) {
    return this.comprehensiveDB.getSystemType(code);
  }

  /**
   * Get code type (Generic/Manufacturer specific)
   */
  getCodeType(code) {
    return this.comprehensiveDB.getCodeType(code);
  }

  /**
   * Get all codes for a specific system
   */
  getCodesBySystem(system) {
    return this.comprehensiveDB.getCodesBySystem(system);
  }

  /**
   * Get codes by severity level
   */
  getCodesBySeverity(severity) {
    return this.comprehensiveDB.getCodesBySeverity(severity);
  }

  /**
   * Search codes by description or symptoms
   */
  searchCodes(searchTerm) {
    return this.comprehensiveDB.searchCodes(searchTerm);
  }

  /**
   * Get random DTC for testing
   */
  getRandomDTC() {
    return this.comprehensiveDB.getRandomDTC();
  }

  /**
   * Get all available codes
   */
  getAllCodes() {
    return this.comprehensiveDB.getAllCodes();
  }

  /**
   * Get system statistics
   */
  getSystemStatistics() {
    return this.comprehensiveDB.getSystemStatistics();
  }

  /**
   * Get codes by subsystem
   */
  getCodesBySubsystem(subsystem) {
    return this.comprehensiveDB.getCodesBySubsystem(subsystem);
  }

  /**
   * Get total number of codes in database
   */
  getTotalCodeCount() {
    return this.comprehensiveDB.getTotalCodeCount();
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
    
    const codes = scenarioDTCs[scenario] || [];
    return codes.map(code => this.getDTCInfo(code));
  }
}

// Export singleton instance
export const dtcCodes = new DTCCodes();
export default DTCCodes;