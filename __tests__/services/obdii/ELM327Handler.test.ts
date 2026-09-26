// __tests__/services/obdii/ELM327Handler.test.ts
//
// Characterization tests for ELM327Handler.parseResponse().
// These lock in CURRENT behavior — they are not a spec of "correct" behavior,
// they're a safety net so future refactors don't silently change what this
// function does today. If a test here ever fails after a change, that change
// altered real behavior and needs a conscious decision, not an auto-fix.

import { ELM327Handler } from '../../../services/obdii/ELM327Handler';

describe('ELM327Handler.parseResponse', () => {
  describe('control / status responses', () => {
    it('parses a bare "OK"', () => {
      const result = ELM327Handler.parseResponse('OK');
      expect(result.responseType).toBe('OK');
      expect(result.success).toBe(true);
      expect(result.data).toBe('OK');
    });

    it('parses a bare "ERROR"', () => {
      const result = ELM327Handler.parseResponse('ERROR');
      expect(result.responseType).toBe('ERROR');
      expect(result.success).toBe(false);
      expect(result.error).toBe('ELM327 reported error');
    });

    it('parses "SEARCHING..."', () => {
      const result = ELM327Handler.parseResponse('SEARCHING...');
      expect(result.responseType).toBe('SEARCHING');
      expect(result.success).toBe(true);
    });

    it('parses "STOPPED"', () => {
      const result = ELM327Handler.parseResponse('STOPPED');
      expect(result.responseType).toBe('STOPPED');
      expect(result.success).toBe(false);
      expect(result.error).toBe('ELM327 stopped processing');
    });

    it('parses "UNABLE TO CONNECT"', () => {
      const result = ELM327Handler.parseResponse('UNABLE TO CONNECT');
      expect(result.responseType).toBe('UNABLE_TO_CONNECT');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Unable to connect to vehicle');
    });

    it('parses "NO DATA"', () => {
      const result = ELM327Handler.parseResponse('NO DATA');
      expect(result.responseType).toBe('NO_DATA');
      expect(result.success).toBe(false);
      expect(result.error).toBe('No data from vehicle');
    });

    it('parses "BUFFER FULL"', () => {
      // Note: of the four "extra" error variants defined in RESPONSES
      // (BUS_INIT_ERROR, DATA_ERROR, BUFFER_FULL, CAN_ERROR), this is the
      // only one that is actually reachable — see the note on
      // "DATA ERROR" below for why.
      const result = ELM327Handler.parseResponse('BUFFER FULL');
      expect(result.responseType).toBe('ERROR');
      expect(result.success).toBe(false);
      expect(result.error).toBe('ELM327 buffer full');
    });

    it('classifies "DATA ERROR" via the generic ERROR branch, not the specific one (documents a dead branch)', () => {
      // parseResponse checks `upper.includes('ERROR')` (the generic branch)
      // BEFORE it ever checks the DATA_ERROR-specific branch. Since "DATA ERROR"
      // contains the substring "ERROR", it always matches the generic branch
      // first. The specific branch (which would set
      // error: 'Data error - checksum or format issue') is currently dead code.
      // This test documents that as real, current behavior — not a guess.
      const result = ELM327Handler.parseResponse('DATA ERROR');
      expect(result.responseType).toBe('ERROR');
      expect(result.error).toBe('ELM327 reported error'); // NOT the DATA_ERROR-specific message
    });
  });

  describe('prompt and empty input', () => {
    it('parses the bare ">" prompt character', () => {
      const result = ELM327Handler.parseResponse('>');
      expect(result.responseType).toBe('PROMPT');
      expect(result.success).toBe(true);
      expect(result.data).toBe('');
    });

    it('parses an empty string as UNKNOWN', () => {
      const result = ELM327Handler.parseResponse('');
      expect(result.responseType).toBe('UNKNOWN');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Empty response');
    });

    it('treats a whitespace-only string the same as empty', () => {
      const result = ELM327Handler.parseResponse('   ');
      expect(result.responseType).toBe('UNKNOWN');
      expect(result.success).toBe(false);
    });
  });

  describe('ELM327 identification / version responses', () => {
    it('parses "ELM327 v1.5" as DATA', () => {
      const result = ELM327Handler.parseResponse('ELM327 v1.5');
      expect(result.responseType).toBe('DATA');
      expect(result.success).toBe(true);
      expect(result.data).toBe('ELM327 v1.5');
    });
  });

  describe('command echoes', () => {
    it('classifies a bare AT command with no response data as ECHO', () => {
      const result = ELM327Handler.parseResponse('ATZ');
      expect(result.responseType).toBe('ECHO');
      expect(result.success).toBe(true);
      expect(result.data).toBe('ATZ');
    });

    it('classifies "ATE0" (echo-off command) as ECHO when it has no attached response', () => {
      const result = ELM327Handler.parseResponse('ATE0');
      expect(result.responseType).toBe('ECHO');
    });
  });

  describe('OBD hex data responses', () => {
    it('parses a well-formed hex data string as DATA', () => {
      const result = ELM327Handler.parseResponse('41 0C 1A F8');
      expect(result.responseType).toBe('DATA');
      expect(result.success).toBe(true);
      expect(result.data).toBe('41 0C 1A F8');
    });

    it('parses a hex string with no spaces as DATA', () => {
      const result = ELM327Handler.parseResponse('410C1AF8');
      expect(result.responseType).toBe('DATA');
      expect(result.success).toBe(true);
    });

    it('does NOT classify lowercase hex as DATA (isHexData is case-sensitive, no /i flag)', () => {
      // This documents a real quirk in the current implementation:
      // isHexData()'s regex is /^[0-9A-F]+$/ with no 'i' flag, so lowercase
      // hex characters fail the hex check. Depending on what the real ELM327
      // adapter sends (usually uppercase, per the datasheet), this may never
      // matter in practice — but it IS the current, real behavior.
      const result = ELM327Handler.parseResponse('41 0c 1a f8');
      expect(result.responseType).not.toBe('DATA');
    });
  });

  describe('protocol description responses', () => {
    it('parses a protocol description as DATA', () => {
      const result = ELM327Handler.parseResponse('ISO 15765-4 (CAN 11/500)');
      expect(result.responseType).toBe('DATA');
      expect(result.success).toBe(true);
    });
  });

  describe('voltage readings', () => {
    it('parses a voltage reading as DATA', () => {
      const result = ELM327Handler.parseResponse('12.6V');
      expect(result.responseType).toBe('DATA');
      expect(result.success).toBe(true);
    });
  });

  describe('unrecognized input', () => {
    it('falls back to UNKNOWN for input matching no known pattern', () => {
      const result = ELM327Handler.parseResponse('this is not a real response');
      expect(result.responseType).toBe('UNKNOWN');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown response format');
    });
  });

  describe('rawResponse passthrough', () => {
    it('always preserves the original, untrimmed input in rawResponse', () => {
      const input = '  OK  ';
      const result = ELM327Handler.parseResponse(input);
      expect(result.rawResponse).toBe(input);
    });
  });
});