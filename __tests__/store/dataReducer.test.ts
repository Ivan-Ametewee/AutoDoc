// __tests__/store/dataReducer.test.ts
//
// Characterization tests for store/reducers/dataReducer.js.
// Written BEFORE removing the 26 unreachable cases (REF-022): these tests must pass against the
// current reducer AND after the trim. They cover only what the live app can actually trigger:
// the two RTK action types from dataActions.ts, plus unknown actions and the initial state shape.

import dataReducerModule from '../../store/reducers/dataReducer';

const dataReducer: any = dataReducerModule;
const initial: any = dataReducer(undefined, { type: '@@INIT' });

describe('dataReducer — initial state and unknown actions', () => {
  it('returns the same state object for an unrecognized action', () => {
    const next = dataReducer(initial, { type: 'SOME_UNKNOWN_ACTION' });
    expect(next).toBe(initial);
  });

  it('has the expected initial state shape', () => {
    expect(Object.keys(initial).sort()).toEqual(
      [
        'liveData', 'pidData', 'rawPIDValues', 'isCollectingData', 'dataCollectionInterval',
        'lastDataUpdate', 'dataPoints', 'maxDataPoints', 'sessionData', 'historicalSessions',
        'currentSessionId', 'sessionStartTime', 'sessionDuration', 'dtcCodes', 'pendingDtcCodes',
        'permanentDtcCodes', 'dtcCount', 'milStatus', 'freezeFrameData', 'readinessTests',
        'vehicleInfo', 'calculatedValues', 'activeAlerts', 'alertHistory', 'thresholds',
        'exportSettings', 'dataErrors', 'lastDataError', 'errorCount', 'isSimulationMode',
        'simulationScenario',
      ].sort()
    );
  });

  it('starts with null odometer and battery voltage (the UI shows dashes until real data arrives)', () => {
    expect(initial.liveData.odometer).toBeNull();
    expect(initial.liveData.batteryVoltage).toBeNull();
    expect(initial.liveData.rpm).toBe(0);
  });
});

describe("dataReducer — 'data/updateRealTimeData'", () => {
  it('merges the payload into liveData and records a data point', () => {
    const next = dataReducer(initial, {
      type: 'data/updateRealTimeData',
      payload: { rpm: 2500, speed: 60 },
    });
    expect(next.liveData.rpm).toBe(2500);
    expect(next.liveData.speed).toBe(60);
    expect(next.liveData.engineTemp).toBe(0); // untouched fields are preserved
    expect(next.liveData.lastUpdate).toBeInstanceOf(Date);
    expect(typeof next.lastDataUpdate).toBe('string');
    expect(next.dataPoints).toHaveLength(1);
    expect(next.dataPoints[0]).toMatchObject({ rpm: 2500, speed: 60 });
    expect(typeof next.dataPoints[0].timestamp).toBe('string');
    expect(next.sessionData).toHaveLength(1);
  });

  it('keeps at most maxDataPoints data points (sessionData is not capped — documents current behavior)', () => {
    // Characterization only: sessionData grows without bound in the current reducer.
    let state: any = { ...initial, maxDataPoints: 3 };
    for (let i = 1; i <= 5; i++) {
      state = dataReducer(state, { type: 'data/updateRealTimeData', payload: { rpm: i * 100 } });
    }
    expect(state.dataPoints).toHaveLength(3);
    expect(state.dataPoints.map((d: any) => d.rpm)).toEqual([300, 400, 500]);
    expect(state.sessionData).toHaveLength(5);
  });
});

describe("dataReducer — 'data/updatePIDData'", () => {
  it('stores the PID under its name, serializes the timestamp, and merges vehicleData into liveData', () => {
    const ts = new Date('2026-01-01T00:00:00.000Z');
    const next = dataReducer(initial, {
      type: 'data/updatePIDData',
      payload: {
        pidData: { name: 'ENGINE_RPM', value: 1726, unit: 'rpm', timestamp: ts, raw: '41 0C 1A F8', mode: '01' },
        vehicleData: { rpm: 1726 },
      },
    });
    expect(next.pidData.ENGINE_RPM).toMatchObject({
      name: 'ENGINE_RPM',
      value: 1726,
      unit: 'rpm',
      timestamp: '2026-01-01T00:00:00.000Z',
    });
    expect(next.rawPIDValues.ENGINE_RPM).toBe('41 0C 1A F8');
    expect(next.liveData.rpm).toBe(1726);
    expect(next.lastDataUpdate).toBe('2026-01-01T00:00:00.000Z');
    // This action does not touch the data point history.
    expect(next.dataPoints).toHaveLength(0);
    expect(next.sessionData).toHaveLength(0);
  });

  it('accepts a string timestamp', () => {
    const next = dataReducer(initial, {
      type: 'data/updatePIDData',
      payload: {
        pidData: { name: 'VEHICLE_SPEED', value: 40, timestamp: '2026-02-02T00:00:00.000Z', raw: '41 0D 28' },
        vehicleData: { speed: 40 },
      },
    });
    expect(next.pidData.VEHICLE_SPEED.timestamp).toBe('2026-02-02T00:00:00.000Z');
    expect(next.lastDataUpdate).toBe('2026-02-02T00:00:00.000Z');
    expect(next.liveData.speed).toBe(40);
  });
});