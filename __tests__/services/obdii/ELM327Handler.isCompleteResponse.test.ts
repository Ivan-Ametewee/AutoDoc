// __tests__/services/obdii/ELM327Handler.isCompleteResponse.test.ts
//
// Characterization tests for ELM327Handler.isCompleteResponse().
// Locks in CURRENT behavior — a safety net for OBDIIService's command queue,
// which relies on this function to decide when to resolve a pending command.

import { ELM327Handler, ELM327Response } from '../../../services/obdii/ELM327Handler';

// Small helper to build a minimal ELM327Response for a given responseType/data.
function makeResponse(
  responseType: ELM327Response['responseType'],
  data: string = ''
): ELM327Response {
  return {
    success: true,
    data,
    responseType,
    rawResponse: data,
  };
}

describe('ELM327Handler.isCompleteResponse', () => {
  describe('response types that are always complete, regardless of command', () => {
    it.each(['OK', 'ERROR', 'UNABLE_TO_CONNECT', 'NO_DATA'] as const)(
      '%s is always complete',
      (responseType) => {
        expect(ELM327Handler.isCompleteResponse(makeResponse(responseType), '010C')).toBe(true);
        expect(ELM327Handler.isCompleteResponse(makeResponse(responseType), 'ATZ')).toBe(true);
      }
    );

    it('STOPPED is always complete', () => {
      expect(ELM327Handler.isCompleteResponse(makeResponse('STOPPED'), '010C')).toBe(true);
    });
  });

  describe('response types that are never complete, regardless of command', () => {
    it('ECHO is never complete (still waiting for the real response)', () => {
      expect(ELM327Handler.isCompleteResponse(makeResponse('ECHO', 'ATZ'), 'ATZ')).toBe(false);
    });

    it('SEARCHING is never complete (still waiting for protocol detection)', () => {
      expect(ELM327Handler.isCompleteResponse(makeResponse('SEARCHING'), '010C')).toBe(false);
    });

    it('PROMPT is never complete (just a prompt, not an actual response)', () => {
      expect(ELM327Handler.isCompleteResponse(makeResponse('PROMPT'), '010C')).toBe(false);
    });

    it('UNKNOWN falls through the default case to false', () => {
      expect(ELM327Handler.isCompleteResponse(makeResponse('UNKNOWN'), '010C')).toBe(false);
    });
  });

  describe('DATA response type — command-dependent completion logic', () => {
    it('is complete for an OBD command with valid hex data', () => {
      const response = makeResponse('DATA', '41 0C 1A F8');
      expect(ELM327Handler.isCompleteResponse(response, '010C')).toBe(true);
    });

    it('is NOT complete for an OBD command with non-hex data', () => {
      const response = makeResponse('DATA', 'not hex data');
      expect(ELM327Handler.isCompleteResponse(response, '010C')).toBe(false);
    });

    it('is complete for a non-ATZ AT command (e.g. ATE0) with any non-empty data', () => {
      const response = makeResponse('DATA', 'OK');
      expect(ELM327Handler.isCompleteResponse(response, 'ATE0')).toBe(true);
    });

    it('is NOT complete for an AT command with empty data', () => {
      const response = makeResponse('DATA', '');
      expect(ELM327Handler.isCompleteResponse(response, 'ATE0')).toBe(false);
    });

    it('is complete for ATZ when the data contains "ELM327" (the specific ATZ branch)', () => {
      const response = makeResponse('DATA', 'ELM327 v1.5');
      expect(ELM327Handler.isCompleteResponse(response, 'ATZ')).toBe(true);
    });

    it(
      'is ALSO complete for ATZ with non-empty data that does NOT contain "ELM327" ' +
        '(via the generic AT-command fallback, not the ATZ-specific branch — see note below)',
      () => {
        // This is a genuine, non-obvious finding worth documenting, not fixing:
        // the ATZ-specific check (`cleanCommand === 'ATZ' && data.includes('ELM327')`)
        // only matters for the edge case where the data is EMPTY. Any non-empty
        // DATA-classified response to "ATZ" already returns true via the later,
        // generic "cleanCommand.startsWith('AT') && data.length > 0" branch —
        // because "ATZ" itself starts with "AT". So in practice, the ATZ-specific
        // branch is close to redundant; it only changes the outcome when data is ''.
        const response = makeResponse('DATA', 'some other startup banner');
        expect(ELM327Handler.isCompleteResponse(response, 'ATZ')).toBe(true);
      }
    );

    it('is NOT complete for ATZ when data is empty (the one case where the specific branch would have mattered)', () => {
      const response = makeResponse('DATA', '');
      expect(ELM327Handler.isCompleteResponse(response, 'ATZ')).toBe(false);
    });

    it('is NOT complete for a command that is neither a hex OBD command nor an AT command', () => {
      // No branch inside the DATA case matches this, so it falls through to `return false`.
      const response = makeResponse('DATA', 'some data');
      expect(ELM327Handler.isCompleteResponse(response, 'NOTACOMMAND')).toBe(false);
    });
  });

  describe('command string normalization', () => {
    it('is case-insensitive and trailing-carriage-return-insensitive for the command argument', () => {
      const response = makeResponse('DATA', 'OK');
      expect(ELM327Handler.isCompleteResponse(response, 'ate0\r')).toBe(true);
    });
  });
});