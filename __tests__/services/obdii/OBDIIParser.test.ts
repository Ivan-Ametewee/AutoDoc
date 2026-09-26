// __tests__/services/obdii/OBDIIParser.test.ts
//
// Characterization tests for OBDIIParser.parse() (Mode 01 + Mode 22).
// Expected values below are hand-computed against the real parse formulas
// in PIDDefinitions.ts, not guessed or copied from elsewhere.

import { OBDIIParser } from '../../../services/obdii/OBDIIParser';

describe('OBDIIParser.parse', () => {
  describe('Mode 01 (standard) responses', () => {
    it('parses ENGINE_RPM correctly', () => {
      // Raw bytes: 0x1A, 0xF8 -> ((26 * 256) + 248) / 4 = 6904 / 4 = 1726
      const result = OBDIIParser.parse('41 0C 1A F8');
      expect(result).not.toBeNull();
      expect(result!.name).toBe('ENGINE_RPM');
      expect(result!.value).toBe(1726);
      expect(result!.unit).toBe('rpm');
      expect(result!.mode).toBe('01');
    });

    it('parses VEHICLE_SPEED correctly', () => {
      // Raw byte: 0x28 = 40
      const result = OBDIIParser.parse('41 0D 28');
      expect(result).not.toBeNull();
      expect(result!.name).toBe('VEHICLE_SPEED');
      expect(result!.value).toBe(40);
      expect(result!.unit).toBe('km/h');
    });

    it('parses ENGINE_COOLANT_TEMP correctly (with the -40 offset)', () => {
      // Raw byte: 0x5F = 95 -> 95 - 40 = 55
      const result = OBDIIParser.parse('41 05 5F');
      expect(result).not.toBeNull();
      expect(result!.name).toBe('ENGINE_COOLANT_TEMP');
      expect(result!.value).toBe(55);
      expect(result!.unit).toBe('°C');
    });

    it('is case-insensitive (unlike ELM327Handler.isHexData, which is case-sensitive)', () => {
      // Worth documenting the contrast: OBDIIParser explicitly .toUpperCase()s
      // its input, so lowercase input parses identically to uppercase.
      const upper = OBDIIParser.parse('41 0D 28');
      const lower = OBDIIParser.parse('41 0d 28');
      expect(lower).not.toBeNull();
      expect(lower!.value).toBe(upper!.value);
    });

    it('falls back to an UNKNOWN_PID_* entry for a PID code with no matching definition', () => {
      // 'FF' is not a defined Mode 01 PID in PIDDefinitions.ts.
      const result = OBDIIParser.parse('41 FF 00');
      expect(result).not.toBeNull();
      expect(result!.name).toBe('UNKNOWN_PID_FF');
      expect(result!.mode).toBe('01');
      expect(result!.unit).toBe('');
    });
  });

  describe('Mode 22 (manufacturer-specific) responses', () => {
    it('parses the Toyota odometer PID correctly', () => {
      // PID 25AE, 4 data bytes: 0x00, 0x0F, 0xA1, 0x23
      // (0*16777216) + (15*65536) + (161*256) + 35 = 983040 + 41216 + 35 = 1024291
      const result = OBDIIParser.parse('6225AE000FA123');
      expect(result).not.toBeNull();
      expect(result!.name).toBe('ODOMETER_TOYOTA');
      expect(result!.value).toBe(1024291);
      expect(result!.unit).toBe('km');
      expect(result!.mode).toBe('22');
      expect(result!.manufacturer).toBe('Toyota');
    });

    it('falls back to an UNKNOWN_MODE22_PID_* entry for an unrecognized Mode 22 PID', () => {
      // '9999' matches no defined Mode 22 PID at any of the tried lengths (4, 2, 6).
      const result = OBDIIParser.parse('6299990000');
      expect(result).not.toBeNull();
      expect(result!.name).toBe('UNKNOWN_MODE22_PID_9999');
      expect(result!.mode).toBe('22');
    });

    it('returns null when a Mode 22 response has fewer data bytes than the PID definition requires', () => {
      // Toyota odometer PID needs 4 bytes; only 2 are supplied here (0x01, 0x02).
      const result = OBDIIParser.parse('6225AE0102');
      expect(result).toBeNull();
    });
  });

  describe('rejection paths', () => {
    it('returns null for a "NO DATA" response', () => {
      expect(OBDIIParser.parse('NO DATA')).toBeNull();
    });

    it('returns null for an "ERROR" response', () => {
      expect(OBDIIParser.parse('ERROR')).toBeNull();
    });

    it('returns null for an empty string', () => {
      expect(OBDIIParser.parse('')).toBeNull();
    });

    it('returns null for a response that starts with neither "41" nor "62" (e.g. a Mode 03 DTC response)', () => {
      expect(OBDIIParser.parse('43 01 33')).toBeNull();
    });
  });
});