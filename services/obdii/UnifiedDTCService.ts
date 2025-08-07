// Unified DTC Service that combines all DTC databases
// Uses the new separated DTC files for better organization and performance

import PowertrainDTCCodes from './PowertrainDTCCodes';
import BodyDTCCodes from './BodyDTCCodes';
import ChassisDTCCodes from './ChassisDTCCodes';
import NetworkDTCCodes from './NetworkDTCCodes';

export class UnifiedDTCService {
  private powertrainDB: PowertrainDTCCodes;
  private bodyDB: BodyDTCCodes;
  private chassisDB: ChassisDTCCodes;
  private networkDB: NetworkDTCCodes;

  constructor() {
    this.powertrainDB = new PowertrainDTCCodes();
    this.bodyDB = new BodyDTCCodes();
    this.chassisDB = new ChassisDTCCodes();
    this.networkDB = new NetworkDTCCodes();
  }

  /**
   * Get DTC information by code from appropriate database
   */
  getDTCInfo(code: string) {
    if (!code || typeof code !== 'string') {
      return null;
    }

    const normalizedCode = code.toUpperCase().trim();
    const systemPrefix = normalizedCode.charAt(0);

    switch (systemPrefix) {
      case 'P':
        return this.powertrainDB.getCode(normalizedCode);
      case 'B':
        return this.bodyDB.getCode(normalizedCode);
      case 'C':
        return this.chassisDB.getCode(normalizedCode);
      case 'U':
        return this.networkDB.getCode(normalizedCode);
      default:
        return null;
    }
  }

  /**
   * Get system type from code prefix
   */
  getSystemType(code: string) {
    if (!code || typeof code !== 'string') {
      return 'Unknown';
    }

    const systemPrefix = code.charAt(0).toUpperCase();
    const systemMap: { [key: string]: string } = {
      'P': 'Powertrain',
      'B': 'Body',
      'C': 'Chassis',
      'U': 'Network/Communication'
    };

    return systemMap[systemPrefix] || 'Unknown';
  }

  /**
   * Get code type (Generic/Manufacturer specific)
   */
  getCodeType(code: string) {
    if (!code || typeof code !== 'string' || code.length < 2) {
      return 'Unknown';
    }

    const secondChar = code.charAt(1);
    if (secondChar === '0') {
      return 'Generic (SAE)';
    } else if (secondChar === '1') {
      return 'Manufacturer Specific';
    } else if (secondChar === '2' || secondChar === '3') {
      return 'Reserved';
    }

    return 'Unknown';
  }

  /**
   * Get all codes for a specific system
   */
  getCodesBySystem(system: string) {
    const normalizedSystem = system.toLowerCase();
    
    switch (normalizedSystem) {
      case 'powertrain':
      case 'engine':
        return this.powertrainDB.getAllCodes();
      case 'body':
      case 'airbag':
        return this.bodyDB.getAllCodes();
      case 'chassis':
      case 'abs':
        return this.chassisDB.getAllCodes();
      case 'network':
      case 'communication':
      case 'electrical':
        return this.networkDB.getAllCodes();
      default:
        return {};
    }
  }

  /**
   * Get codes by subsystem
   */
  getCodesBySubsystem(subsystem: string) {
    const allCodes = {};
    
    // Search all databases for the subsystem
    Object.assign(allCodes, this.powertrainDB.getCodesBySubsystem(subsystem));
    Object.assign(allCodes, this.bodyDB.getCodesBySubsystem(subsystem));
    Object.assign(allCodes, this.chassisDB.getCodesBySubsystem(subsystem));
    Object.assign(allCodes, this.networkDB.getCodesBySubsystem(subsystem));
    
    return allCodes;
  }

  /**
   * Get codes by severity level
   */
  getCodesBySeverity(severity: string) {
    const allCodes = {};
    
    // Search all databases for the severity level
    Object.assign(allCodes, this.powertrainDB.getCodesBySeverity(severity));
    Object.assign(allCodes, this.bodyDB.getCodesBySeverity(severity));
    Object.assign(allCodes, this.chassisDB.getCodesBySeverity(severity));
    Object.assign(allCodes, this.networkDB.getCodesBySeverity(severity));
    
    return allCodes;
  }

  /**
   * Search codes by description, causes, symptoms, or solutions
   */
  searchCodes(searchTerm: string) {
    if (!searchTerm || typeof searchTerm !== 'string') {
      return [];
    }

    const results: any[] = [];
    const normalizedSearchTerm = searchTerm.toLowerCase().trim();

    // Helper function to search within a database
    const searchInDatabase = (database: any, systemName: string) => {
      const allCodes = database.getAllCodes();
      
      Object.entries(allCodes).forEach(([code, data]: [string, any]) => {
        let matches = false;
        
        // Check if search term matches code
        if (code.toLowerCase().includes(normalizedSearchTerm)) {
          matches = true;
        }
        
        // Check description
        if (data.description && data.description.toLowerCase().includes(normalizedSearchTerm)) {
          matches = true;
        }
        
        // Check subsystem
        if (data.subsystem && data.subsystem.toLowerCase().includes(normalizedSearchTerm)) {
          matches = true;
        }
        
        // Check causes
        if (data.causes && Array.isArray(data.causes)) {
          data.causes.forEach((cause: string) => {
            if (cause.toLowerCase().includes(normalizedSearchTerm)) {
              matches = true;
            }
          });
        }
        
        // Check symptoms
        if (data.symptoms && Array.isArray(data.symptoms)) {
          data.symptoms.forEach((symptom: string) => {
            if (symptom.toLowerCase().includes(normalizedSearchTerm)) {
              matches = true;
            }
          });
        }
        
        // Check solutions
        if (data.solutions && Array.isArray(data.solutions)) {
          data.solutions.forEach((solution: string) => {
            if (solution.toLowerCase().includes(normalizedSearchTerm)) {
              matches = true;
            }
          });
        }
        
        if (matches) {
          results.push({
            code,
            description: data.description,
            system: systemName,
            subsystem: data.subsystem,
            severity: data.severity,
            causes: data.causes,
            symptoms: data.symptoms,
            solutions: data.solutions
          });
        }
      });
    };

    // Search all databases
    searchInDatabase(this.powertrainDB, 'Powertrain');
    searchInDatabase(this.bodyDB, 'Body');
    searchInDatabase(this.chassisDB, 'Chassis');
    searchInDatabase(this.networkDB, 'Network/Communication');

    // Sort results by code
    return results.sort((a: any, b: any) => a.code.localeCompare(b.code));
  }

  /**
   * Get all available codes from all databases
   */
  getAllCodes() {
    const allCodes = {};
    
    Object.assign(allCodes, this.powertrainDB.getAllCodes());
    Object.assign(allCodes, this.bodyDB.getAllCodes());
    Object.assign(allCodes, this.chassisDB.getAllCodes());
    Object.assign(allCodes, this.networkDB.getAllCodes());
    
    return allCodes;
  }

  /**
   * Get system statistics
   */
  getSystemStatistics() {
    const powertrainCodes = Object.keys(this.powertrainDB.getAllCodes()).length;
    const bodyCodes = Object.keys(this.bodyDB.getAllCodes()).length;
    const chassisCodes = Object.keys(this.chassisDB.getAllCodes()).length;
    const networkCodes = Object.keys(this.networkDB.getAllCodes()).length;
    
    return {
      total: powertrainCodes + bodyCodes + chassisCodes + networkCodes,
      powertrain: powertrainCodes,
      body: bodyCodes,
      chassis: chassisCodes,
      network: networkCodes,
      systems: {
        'Powertrain': powertrainCodes,
        'Body': bodyCodes,
        'Chassis': chassisCodes,
        'Network/Communication': networkCodes
      }
    };
  }

  /**
   * Get total number of codes in all databases
   */
  getTotalCodeCount() {
    return Object.keys(this.getAllCodes()).length;
  }

  /**
   * Get random DTC for testing
   */
  getRandomDTC() {
    const allCodes = this.getAllCodes();
    const codeKeys = Object.keys(allCodes);
    
    if (codeKeys.length === 0) {
      return null;
    }
    
    const randomIndex = Math.floor(Math.random() * codeKeys.length);
    const randomCode = codeKeys[randomIndex];
    
    return {
      code: randomCode,
      ...(allCodes as any)[randomCode]
    };
  }

  /**
   * Get DTCs for specific scenarios (for simulation)
   */
  getDTCsForScenario(scenario: string) {
    const scenarioDTCs: { [key: string]: string[] } = {
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
    return codes.map((code: string) => this.getDTCInfo(code)).filter((info: any) => info !== null);
  }

  /**
   * Get subsystems for a specific system
   */
  getSubsystemsForSystem(system: string) {
    const codes = this.getCodesBySystem(system);
    const subsystems = new Set();
    
    Object.values(codes).forEach((data: any) => {
      if (data.subsystem && data.subsystem !== 'Unknown') {
        subsystems.add(data.subsystem);
      }
    });
    
    return Array.from(subsystems).sort();
  }

  /**
   * Get severity levels present in the database
   */
  getAvailableSeverityLevels() {
    const allCodes = this.getAllCodes();
    const severityLevels = new Set();
    
    Object.values(allCodes).forEach((data: any) => {
      if (data.severity) {
        severityLevels.add(data.severity);
      }
    });
    
    return Array.from(severityLevels).sort();
  }

  /**
   * Validate DTC code format
   */
  validateDTCFormat(code: string): boolean {
    if (!code || typeof code !== 'string') {
      return false;
    }
    
    // DTC format: [P|B|C|U][0-3][0-9][0-9][0-9]
    const dtcPattern = /^[PBCU][0-3][0-9][0-9][0-9]$/i;
    return dtcPattern.test(code.trim());
  }

  /**
   * Get database information
   */
  getDatabaseInfo() {
    const stats = this.getSystemStatistics();
    
    return {
      version: '1.0.0',
      totalCodes: stats.total,
      systemBreakdown: stats.systems,
      lastUpdated: new Date().toISOString(),
      databases: {
        powertrain: 'PowertrainDTCCodes.ts',
        body: 'BodyDTCCodes.ts',
        chassis: 'ChassisDTCCodes.ts',
        network: 'NetworkDTCCodes.ts'
      }
    };
  }
}

// Export singleton instance
export const unifiedDTCService = new UnifiedDTCService();
export default UnifiedDTCService;