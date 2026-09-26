// __tests__/services/obdii/PIDDefinitions.test.ts
//
// Characterization tests for PIDDefinitions.ts: the remaining per-PID parse
// formulas not exercised by OBDIIParser.test.ts, plus the manufacturer
// odometer config matching logic. Expected values are hand-computed against
// the real formulas in PIDDefinitions.ts, not guessed.

import { PIDDefinitions } from '../../../services/obdii/PIDDefinitions';

describe('PIDDefinitions parse formulas', () => {
  it('ENGINE_LOAD: byte 128 -> 50.2% (percentage scaling formula)', () => {
    // Math.round((128 * 100) / 255 * 10) / 10
    // = Math.round(501.96...) / 10 = 502 / 10 = 50.2
    const pid = PIDDefinitions.getPID('ENGINE_LOAD')!;
    expect(pid.parse([128])).toBeCloseTo(50.2, 5);
  });

  it('THROTTLE_POSITION uses the identical percentage-scaling formula as ENGINE_LOAD', () => {
    const pid = PIDDefinitions.getPID('THROTTLE_POSITION')!;
    expect(pid.parse([128])).toBeCloseTo(50.2, 5);
  });

  it('FUEL_LEVEL uses the identical percentage-scaling formula as ENGINE_LOAD', () => {
    const pid = PIDDefinitions.getPID('FUEL_LEVEL')!;
    expect(pid.parse([128])).toBeCloseTo(50.2, 5);
  });

  it('DISTANCE_SINCE_CODES_CLEARED: bytes [1, 44] -> 300 (256*A + B)', () => {
    const pid = PIDDefinitions.getPID('DISTANCE_SINCE_CODES_CLEARED')!;
    expect(pid.parse([1, 44])).toBe(300);
  });

  it('DISTANCE_WITH_MIL_ON uses the identical two-byte formula', () => {
    const pid = PIDDefinitions.getPID('DISTANCE_WITH_MIL_ON')!;
    expect(pid.parse([1, 44])).toBe(300);
  });

  it('RUNTIME_SINCE_ENGINE_START uses the identical two-byte formula', () => {
    const pid = PIDDefinitions.getPID('RUNTIME_SINCE_ENGINE_START')!;
    expect(pid.parse([1, 44])).toBe(300);
  });

  it('INTAKE_AIR_TEMP: byte 100 -> 60°C (the -40 offset)', () => {
    const pid = PIDDefinitions.getPID('INTAKE_AIR_TEMP')!;
    expect(pid.parse([100])).toBe(60);
  });

  it('MAF_RATE: bytes [3, 232] -> 10.0 g/s', () => {
    // ((3 * 256) + 232) = 1000; /100 = 10; *10 = 100; round = 100; /10 = 10
    const pid = PIDDefinitions.getPID('MAF_RATE')!;
    expect(pid.parse([3, 232])).toBeCloseTo(10.0, 5);
  });

  it('CONTROL_MODULE_VOLTAGE: bytes [54, 176] -> 14.00V', () => {
    // (54 * 256) + 176 = 14000; /1000 = 14; *100 = 1400; round = 1400; /100 = 14
    const pid = PIDDefinitions.getPID('CONTROL_MODULE_VOLTAGE')!;
    expect(pid.parse([54, 176])).toBeCloseTo(14.0, 5);
  });

  it('boundary case: parse functions return a safe default when given too few bytes', () => {
    // Every parse function checks bytes.length before indexing; this documents
    // that the 1-byte and 2-byte PIDs don't throw on empty input.
    expect(PIDDefinitions.getPID('VEHICLE_SPEED')!.parse([])).toBe(0);
    expect(PIDDefinitions.getPID('ENGINE_COOLANT_TEMP')!.parse([])).toBe(-40);
    expect(PIDDefinitions.getPID('ENGINE_RPM')!.parse([])).toBe(0);
  });
});

describe('PIDDefinitions duplicate pid/mode codes (documents TD-017)', () => {
  it('five separate PID names share pid "A6" / mode "01"', () => {
    const allPIDs = PIDDefinitions.getAllPIDs();
    const a6Pids = allPIDs.filter((p) => p.pid === 'A6' && p.mode === '01');
    const names = a6Pids.map((p) => p.name).sort();
    expect(names).toEqual(
      ['ODOMETER', 'ODOMETER_STANDARD', 'TOTAL_DISTANCE', 'TOTAL_DISTANCE_TRAVELED', 'VEHICLE_ODOMETER'].sort()
    );
  });
});

describe('PIDDefinitions.getAllOdometerPIDs (name-substring filter)', () => {
  it('includes PIDs whose name contains "odometer" (case-insensitive)', () => {
    const names = PIDDefinitions.getAllOdometerPIDs().map((p) => p.name);
    expect(names).toEqual(
      expect.arrayContaining(['ODOMETER_TOYOTA', 'ODOMETER_STANDARD', 'ODOMETER', 'VEHICLE_ODOMETER'])
    );
  });

  it('excludes "TOTAL_DISTANCE" / "TOTAL_DISTANCE_TRAVELED" even though they are functionally odometer PIDs (name-substring filter gap)', () => {
    // Documents a real, minor inconsistency: getAllOdometerPIDs() filters purely
    // on whether the PID's *name* contains the substring "odometer" — so these
    // two functionally-identical aliases are silently excluded from the result,
    // despite sharing the exact same pid/mode/parse-formula as ODOMETER_STANDARD.
    const names = PIDDefinitions.getAllOdometerPIDs().map((p) => p.name);
    expect(names).not.toContain('TOTAL_DISTANCE');
    expect(names).not.toContain('TOTAL_DISTANCE_TRAVELED');
  });
});

describe('PIDDefinitions.getOdometerPIDForManufacturer', () => {
  it('returns the Toyota-specific odometer PID for "Toyota"', () => {
    const pid = PIDDefinitions.getOdometerPIDForManufacturer('Toyota');
    expect(pid).toBeDefined();
    expect(pid!.name).toBe('ODOMETER_TOYOTA');
  });

  it('is case-insensitive on manufacturer name', () => {
    const pid = PIDDefinitions.getOdometerPIDForManufacturer('toyota');
    expect(pid).toBeDefined();
    expect(pid!.name).toBe('ODOMETER_TOYOTA');
  });

  it('returns undefined for a manufacturer with no configured odometer PID', () => {
    const pid = PIDDefinitions.getOdometerPIDForManufacturer('Mazda');
    expect(pid).toBeUndefined();
  });
});

describe('PIDDefinitions.isOdometerConfigCompatible', () => {
  const toyotaConfig = PIDDefinitions.getManufacturerOdometerConfigs().find(
    (c) => c.manufacturer === 'Toyota'
  )!;

  it('is compatible for a matching make, model, and year within range', () => {
    expect(
      PIDDefinitions.isOdometerConfigCompatible(toyotaConfig, 'Toyota', 'Camry', 2010)
    ).toBe(true);
  });

  it('is NOT compatible for a different make entirely', () => {
    expect(
      PIDDefinitions.isOdometerConfigCompatible(toyotaConfig, 'Honda', 'Camry', 2010)
    ).toBe(false);
  });

  it('is NOT compatible for a matching make but unsupported model', () => {
    expect(
      PIDDefinitions.isOdometerConfigCompatible(toyotaConfig, 'Toyota', 'Sienna', 2010)
    ).toBe(false);
  });

  it('is NOT compatible for a matching make/model but a year below the supported minimum (2005)', () => {
    expect(
      PIDDefinitions.isOdometerConfigCompatible(toyotaConfig, 'Toyota', 'Camry', 2003)
    ).toBe(false);
  });

  it('is compatible when no model is provided (model check is skipped)', () => {
    expect(
      PIDDefinitions.isOdometerConfigCompatible(toyotaConfig, 'Toyota', undefined, 2010)
    ).toBe(true);
  });

  it('is compatible when no year is provided (year check is skipped)', () => {
    expect(
      PIDDefinitions.isOdometerConfigCompatible(toyotaConfig, 'Toyota', 'Camry', undefined)
    ).toBe(true);
  });
});