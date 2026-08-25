/**
 * ELM327 Command Handler
 * 
 * Implements proper ELM327 communication protocol according to datasheet specifications:
 * - Command formatting and validation
 * - Response parsing and validation
 * - Error handling for all ELM327 response types
 * - Proper initialization sequence
 * - Protocol detection and management
 */

export interface ELM327Response {
  success: boolean;
  data: string;
  error?: string;
  responseType: 'OK' | 'ERROR' | 'DATA' | 'PROMPT' | 'ECHO' | 'SEARCHING' | 'STOPPED' | 'UNABLE_TO_CONNECT' | 'NO_DATA' | 'UNKNOWN';
  rawResponse: string;
}

export interface ELM327Command {
  command: string;
  expectsData: boolean;
  timeout: number;
  description: string;
}

export class ELM327Handler {
  private static readonly PROMPT_CHAR = '>';
  private static readonly CARRIAGE_RETURN = '\r';
  private static readonly LINE_FEED = '\n';
  
  // ELM327 standard responses
  private static readonly RESPONSES = {
    OK: 'OK',
    ERROR: 'ERROR',
    SEARCHING: 'SEARCHING...',
    UNABLE_TO_CONNECT: 'UNABLE TO CONNECT',
    NO_DATA: 'NO DATA',
    BUS_INIT_ERROR: 'BUS INIT: ...ERROR',
    BUS_INIT_OK: 'BUS INIT: OK',
    DATA_ERROR: 'DATA ERROR',
    FB_ERROR: 'FB ERROR',
    LP_ALERT: 'LP ALERT',
    LV_RESET: 'LV RESET',
    BUFFER_FULL: 'BUFFER FULL',
    STOPPED: 'STOPPED',
    CAN_ERROR: 'CAN ERROR',
    ACT_ALERT: 'ACT ALERT'
  };

  // Standard ELM327 AT Commands
  public static readonly COMMANDS = {
    // Reset and identification
    RESET: { command: 'ATZ', expectsData: true, timeout: 3000, description: 'Reset ELM327' },
    IDENTIFY: { command: 'ATI', expectsData: true, timeout: 1000, description: 'Identify ELM327' },
    VERSION: { command: 'AT@1', expectsData: true, timeout: 1000, description: 'Get device identifier' },
    
    // Echo control
    ECHO_ON: { command: 'ATE1', expectsData: false, timeout: 1000, description: 'Enable echo' },
    ECHO_OFF: { command: 'ATE0', expectsData: false, timeout: 1000, description: 'Disable echo' },
    
    // Line feed control
    LINEFEED_ON: { command: 'ATL1', expectsData: false, timeout: 1000, description: 'Enable line feeds' },
    LINEFEED_OFF: { command: 'ATL0', expectsData: false, timeout: 1000, description: 'Disable line feeds' },
    
    // Memory control
    MEMORY_ON: { command: 'ATM1', expectsData: false, timeout: 1000, description: 'Enable memory' },
    MEMORY_OFF: { command: 'ATM0', expectsData: false, timeout: 1000, description: 'Disable memory' },
    
    // Headers control
    HEADERS_ON: { command: 'ATH1', expectsData: false, timeout: 1000, description: 'Show headers' },
    HEADERS_OFF: { command: 'ATH0', expectsData: false, timeout: 1000, description: 'Hide headers' },
    
    // Spaces control
    SPACES_ON: { command: 'ATS1', expectsData: false, timeout: 1000, description: 'Show spaces' },
    SPACES_OFF: { command: 'ATS0', expectsData: false, timeout: 1000, description: 'Hide spaces' },
    
    // Protocol selection
    PROTOCOL_AUTO: { command: 'ATSP0', expectsData: false, timeout: 2000, description: 'Auto protocol detection' },
    PROTOCOL_ISO9141_2: { command: 'ATSP3', expectsData: false, timeout: 2000, description: 'ISO9141-2' },
    PROTOCOL_KWP2000_5BAUD: { command: 'ATSP4', expectsData: false, timeout: 2000, description: 'KWP2000 5 baud' },
    PROTOCOL_KWP2000_FAST: { command: 'ATSP5', expectsData: false, timeout: 2000, description: 'KWP2000 fast' },
    PROTOCOL_CAN_11BIT_500K: { command: 'ATSP6', expectsData: false, timeout: 2000, description: 'CAN 11 bit 500k' },
    PROTOCOL_CAN_29BIT_500K: { command: 'ATSP7', expectsData: false, timeout: 2000, description: 'CAN 29 bit 500k' },
    PROTOCOL_CAN_11BIT_250K: { command: 'ATSP8', expectsData: false, timeout: 2000, description: 'CAN 11 bit 250k' },
    PROTOCOL_CAN_29BIT_250K: { command: 'ATSP9', expectsData: false, timeout: 2000, description: 'CAN 29 bit 250k' },
    
    // Protocol query
    DESCRIBE_PROTOCOL: { command: 'ATDP', expectsData: true, timeout: 1000, description: 'Describe current protocol' },
    DESCRIBE_PROTOCOL_NUMBER: { command: 'ATDPN', expectsData: true, timeout: 1000, description: 'Describe protocol number' },
    
    // Timing control
    SET_TIMEOUT: { command: 'ATST', expectsData: false, timeout: 1000, description: 'Set timeout' },
    ADAPTIVE_TIMING_ON: { command: 'ATAT1', expectsData: false, timeout: 1000, description: 'Enable adaptive timing' },
    ADAPTIVE_TIMING_OFF: { command: 'ATAT0', expectsData: false, timeout: 1000, description: 'Disable adaptive timing' },
    
    // Voltage monitoring
    READ_VOLTAGE: { command: 'ATRV', expectsData: true, timeout: 1000, description: 'Read input voltage' },
    
    // Low power mode
    LOW_POWER_MODE: { command: 'ATLP', expectsData: false, timeout: 1000, description: 'Enter low power mode' },
    
    // Restore defaults
    RESTORE_DEFAULTS: { command: 'ATD', expectsData: false, timeout: 1000, description: 'Restore to defaults' },
    
    // Warm start
    WARM_START: { command: 'ATWS', expectsData: false, timeout: 2000, description: 'Warm start' }
  } as const;

  /**
   * Parse ELM327 response according to datasheet specifications
   */
  public static parseResponse(rawResponse: string): ELM327Response {
    const trimmed = rawResponse.trim();
    const upper = trimmed.toUpperCase();
    
    

    // Handle empty responses
    if (!trimmed) {
      
      return {
        success: false,
        data: '',
        error: 'Empty response',
        responseType: 'UNKNOWN',
        rawResponse
      };
    }

    // Check for prompt character (indicates ready for next command)
    if (trimmed === this.PROMPT_CHAR) {
      return {
        success: true,
        data: '',
        responseType: 'PROMPT',
        rawResponse
      };
    }

    // Check for standard ELM327 responses
    if (upper === this.RESPONSES.OK) {
      return {
        success: true,
        data: trimmed,
        responseType: 'OK',
        rawResponse
      };
    }

    if (upper.includes(this.RESPONSES.ERROR)) {
      return {
        success: false,
        data: trimmed,
        error: 'ELM327 reported error',
        responseType: 'ERROR',
        rawResponse
      };
    }

    if (upper.includes(this.RESPONSES.SEARCHING)) {
      return {
        success: true,
        data: trimmed,
        responseType: 'SEARCHING',
        rawResponse
      };
    }

    if (upper.includes(this.RESPONSES.STOPPED)) {
      return {
        success: false,
        data: trimmed,
        error: 'ELM327 stopped processing',
        responseType: 'STOPPED',
        rawResponse
      };
    }

    if (upper.includes(this.RESPONSES.UNABLE_TO_CONNECT)) {
      return {
        success: false,
        data: trimmed,
        error: 'Unable to connect to vehicle',
        responseType: 'UNABLE_TO_CONNECT',
        rawResponse
      };
    }

    if (upper.includes(this.RESPONSES.NO_DATA)) {
      return {
        success: false,
        data: trimmed,
        error: 'No data from vehicle',
        responseType: 'NO_DATA',
        rawResponse
      };
    }

    if (upper.includes(this.RESPONSES.BUS_INIT_ERROR)) {
      return {
        success: false,
        data: trimmed,
        error: 'Bus initialization error',
        responseType: 'ERROR',
        rawResponse
      };
    }

    if (upper.includes(this.RESPONSES.DATA_ERROR)) {
      return {
        success: false,
        data: trimmed,
        error: 'Data error - checksum or format issue',
        responseType: 'ERROR',
        rawResponse
      };
    }

    if (upper.includes(this.RESPONSES.BUFFER_FULL)) {
      return {
        success: false,
        data: trimmed,
        error: 'ELM327 buffer full',
        responseType: 'ERROR',
        rawResponse
      };
    }

    if (upper.includes(this.RESPONSES.CAN_ERROR)) {
      return {
        success: false,
        data: trimmed,
        error: 'CAN bus error',
        responseType: 'ERROR',
        rawResponse
      };
    }

    // Check for ELM327 version info first (takes priority over echo detection)
    // Handle corrupted data by extracting the ELM327 part
    const elm327Match = trimmed.match(/(ELM327[^\r\n]*v?\d+\.\d+[^\r\n]*)/i);
    if (elm327Match || upper.includes('ELM327') || upper.includes('V1.') || upper.includes('V2.')) {
      
      const cleanData = elm327Match ? elm327Match[1] : trimmed;
      return {
        success: true,
        data: cleanData,
        responseType: 'DATA',
        rawResponse
      };
    }

    // Check for concatenated AT command + response (e.g., "ATE0OK", "ATZELMX27")
    const atConcatenatedMatch = upper.match(/^(AT[A-Z0-9]+)(OK|ERROR|ELM327.*|[A-Z].*)$/);
    if (atConcatenatedMatch) {
      const [, command, response] = atConcatenatedMatch;
      // If it's just the command part, treat as echo
      if (response === command) {
        return {
          success: true,
          data: trimmed,
          responseType: 'ECHO',
          rawResponse
        };
      }
      // If it contains a response, extract just the response part
      if (response === 'OK') {
        return {
          success: true,
          data: 'OK',
          responseType: 'OK',
          rawResponse
        };
      }
      if (response === 'ERROR') {
        return {
          success: false,
          data: 'ERROR',
          error: 'ELM327 reported error',
          responseType: 'ERROR',
          rawResponse
        };
      }
      if (response.includes('ELM327')) {
        return {
          success: true,
          data: response,
          responseType: 'DATA',
          rawResponse
        };
      }
    }
    
    // Check if this looks like pure command echo (starts with AT but no additional data)
    if (upper.startsWith('AT') && !this.containsResponseData(upper)) {
      return {
        success: true,
        data: trimmed,
        responseType: 'ECHO',
        rawResponse
      };
    }

    // Check if this looks like hex data (OBD response)
    if (this.isHexData(trimmed)) {
      return {
        success: true,
        data: trimmed,
        responseType: 'DATA',
        rawResponse
      };
    }

    // Check for protocol descriptions
    if (upper.includes('ISO') || upper.includes('SAE') || upper.includes('CAN') || 
        upper.includes('KWP') || upper.includes('PWM') || upper.includes('AUTO')) {
      return {
        success: true,
        data: trimmed,
        responseType: 'DATA',
        rawResponse
      };
    }

    // Check for voltage readings
    if (trimmed.match(/^\d+\.\d+V?$/)) {
      return {
        success: true,
        data: trimmed,
        responseType: 'DATA',
        rawResponse
      };
    }

    // Unknown response type
    return {
      success: false,
      data: trimmed,
      error: 'Unknown response format',
      responseType: 'UNKNOWN',
      rawResponse
    };
  }

  /**
   * Format command for ELM327 transmission
   */
  public static formatCommand(command: string): string {
    const clean = command.trim().toUpperCase();
    
    // Add carriage return if not present
    if (!clean.endsWith(this.CARRIAGE_RETURN)) {
      return clean + this.CARRIAGE_RETURN;
    }
    
    return clean;
  }

  /**
   * Validate if command is a valid ELM327 command
   */
  public static isValidCommand(command: string): boolean {
    const clean = command.trim().toUpperCase().replace(/\r$/, '');
    
    // Check if it's a standard AT command
    if (clean.startsWith('AT')) {
      return true;
    }
    
    // Check if it's an OBD command (2-6 hex characters)
    if (/^[0-9A-F]{2,6}$/.test(clean)) {
      return true;
    }
    
    return false;
  }

  /**
   * Check if string contains valid hex data
   */
  private static isHexData(data: string): boolean {
    const clean = data.replace(/[\s>]/g, '');
    return /^[0-9A-F]+$/.test(clean) && clean.length >= 2 && clean.length % 2 === 0;
  }

  /**
   * Check if the response contains actual response data beyond just command echo
   */
  private static containsResponseData(upperResponse: string): boolean {
    // Check for common response patterns that indicate data beyond echo
    const responsePatterns = [
      'ELM327',
      'V1.',
      'V2.',
      'OK',
      'ERROR',
      'SEARCHING',
      'NO DATA',
      'UNABLE TO CONNECT',
      'BUS INIT',
      'DATA ERROR',
      'BUFFER FULL',
      'CAN ERROR',
      'ISO',
      'SAE',
      'CAN',
      'KWP',
      'PWM',
      'AUTO'
    ];
    
    return responsePatterns.some(pattern => upperResponse.includes(pattern));
  }

  /**
   * Get timeout for specific command
   */
  public static getCommandTimeout(command: string): number {
    const clean = command.trim().toUpperCase().replace(/\r$/, '');
    
    // Check predefined commands
    for (const cmd of Object.values(this.COMMANDS)) {
      if (cmd.command === clean) {
        return cmd.timeout;
      }
    }
    
    // Default timeouts based on command type
    if (clean.startsWith('AT')) {
      if (clean === 'ATZ') return 3000; // Reset takes longer
      if (clean.startsWith('ATSP')) return 2000; // Protocol selection
      return 1000; // Standard AT command
    }
    
    // OBD commands
    if (/^[0-9A-F]{2,6}$/.test(clean)) {
      return 2000; // OBD query timeout
    }
    
    return 1000; // Default timeout
  }

  /**
   * Check if response indicates command completion
   */
  public static isCompleteResponse(response: ELM327Response, command: string): boolean {
    const cleanCommand = command.trim().toUpperCase().replace(/\r$/, '');
    
    
    
    switch (response.responseType) {
      case 'OK':
      case 'ERROR':
      case 'UNABLE_TO_CONNECT':
      case 'NO_DATA':
        
        return true;
        
      case 'DATA':
        // For ATZ, ELM327 version info indicates completion
        if (cleanCommand === 'ATZ' && response.data.toUpperCase().includes('ELM327')) {
          
          return true;
        }
        // For OBD commands, hex data indicates completion
        if (/^[0-9A-F]{2,6}$/.test(cleanCommand) && this.isHexData(response.data)) {
          
          return true;
        }
        // For other AT commands expecting data
        if (cleanCommand.startsWith('AT') && response.data.length > 0) {
          
          return true;
        }
        
        return false;
        
      case 'ECHO':
        return false; // Command echo is not completion
        
      case 'SEARCHING':
        return false; // Still searching for protocol
        
      case 'STOPPED':
        return true; // ELM327 stopped processing - this is a complete response
        
      case 'PROMPT':
        return false; // Just a prompt, wait for actual response
        
      default:
        return false;
    }
  }

  /**
   * Generate standard ELM327 initialization sequence
   */
  public static getInitializationSequence(): ELM327Command[] {
    return [
      this.COMMANDS.RESET,           // Reset ELM327
      this.COMMANDS.ECHO_OFF,        // Turn off echo
      this.COMMANDS.LINEFEED_OFF,    // Turn off line feeds
      this.COMMANDS.HEADERS_OFF,     // Turn off headers
      this.COMMANDS.SPACES_OFF,      // Turn off spaces
      this.COMMANDS.MEMORY_OFF,      // Turn off memory
      this.COMMANDS.PROTOCOL_AUTO,   // Auto detect protocol
      this.COMMANDS.ADAPTIVE_TIMING_ON, // Enable adaptive timing
    ];
  }

  /**
   * Get protocol-specific initialization commands
   */
  public static getProtocolInitCommands(protocol: string): ELM327Command[] {
    const commands: ELM327Command[] = [];
    
    switch (protocol.toUpperCase()) {
      case 'CAN':
        commands.push(
          { command: 'ATST32', expectsData: false, timeout: 1000, description: 'Set timeout for CAN' },
          { command: 'ATSP0', expectsData: false, timeout: 2000, description: 'Auto protocol detection' }
        );
        break;
        
      case 'ISO9141':
        commands.push(
          { command: 'ATST64', expectsData: false, timeout: 1000, description: 'Set timeout for ISO9141' },
          { command: 'ATSP3', expectsData: false, timeout: 2000, description: 'ISO9141-2 protocol' }
        );
        break;
        
      case 'KWP2000':
        commands.push(
          { command: 'ATST32', expectsData: false, timeout: 1000, description: 'Set timeout for KWP2000' },
          { command: 'ATSP5', expectsData: false, timeout: 2000, description: 'KWP2000 fast init' }
        );
        break;
        
      default:
        commands.push(this.COMMANDS.PROTOCOL_AUTO);
    }
    
    return commands;
  }
}