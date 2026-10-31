// __tests__/store/connectionReducer.test.ts
//
// Characterization tests for store/reducers/connectionReducer.js.
// Written BEFORE removing the unreachable cases (REF-037): these tests must pass against the
// current reducer AND after the trim. They cover only the four actions the live app dispatches
// inline from hooks/useLiveOBDData.ts (START_CONNECTION, CONNECTION_SUCCESS, CONNECTION_FAILED,
// DISCONNECT_DEVICE), plus unknown actions and the initial state shape. Payloads are shaped from
// the fields the reducer reads.

import connectionReducerModule from '../../store/reducers/connectionReducer';

const connectionReducer: any = connectionReducerModule;
const initial: any = connectionReducer(undefined, { type: '@@INIT' });

describe('connectionReducer — initial state and unknown actions', () => {
  it('returns the same state object for an unrecognized action', () => {
    expect(connectionReducer(initial, { type: 'SOME_UNKNOWN_ACTION' })).toBe(initial);
  });

  it('has the expected initial state shape and defaults', () => {
    expect(Object.keys(initial).sort()).toEqual(
      [
        'isConnected', 'isConnecting', 'isScanning', 'connectionType', 'mode', 'connectedDevice',
        'availableDevices', 'lastConnectedDevice', 'connectionStrength', 'lastDataReceived',
        'connectionErrors', 'reconnectAttempts', 'maxReconnectAttempts', 'supportedProtocols',
        'activeProtocol', 'protocolVersion', 'error', 'lastError', 'errorCount', 'autoReconnect',
        'connectionTimeout', 'scanDuration',
      ].sort()
    );
    expect(initial.isConnected).toBe(false);
    expect(initial.isConnecting).toBe(false);
    expect(initial.connectionType).toBeNull();
    expect(initial.connectedDevice).toBeNull();
    expect(initial.autoReconnect).toBe(true);
    expect(initial.connectionTimeout).toBe(10000);
    expect(initial.maxReconnectAttempts).toBe(5);
  });
});

describe('connectionReducer — START_CONNECTION', () => {
  it('marks the connection as in progress and clears the error and retry counter', () => {
    const prior = { ...initial, isConnected: true, error: 'old error', reconnectAttempts: 3 };
    const next = connectionReducer(prior, { type: 'START_CONNECTION' });
    expect(next.isConnecting).toBe(true);
    expect(next.isConnected).toBe(false);
    expect(next.error).toBeNull();
    expect(next.reconnectAttempts).toBe(0);
  });
});

describe('connectionReducer — CONNECTION_SUCCESS', () => {
  const device = { id: 'AA:BB:CC', name: 'OBDII' };

  it('records the device and connection type, and applies defaults for missing protocol fields', () => {
    const next = connectionReducer(
      { ...initial, isConnecting: true, error: 'old', errorCount: 2, reconnectAttempts: 1 },
      { type: 'CONNECTION_SUCCESS', payload: { device, connectionType: 'bluetooth' } }
    );
    expect(next.isConnected).toBe(true);
    expect(next.isConnecting).toBe(false);
    expect(next.connectedDevice).toEqual(device);
    expect(next.lastConnectedDevice).toEqual(device);
    expect(next.connectionType).toBe('bluetooth');
    expect(next.supportedProtocols).toEqual([]);
    expect(next.activeProtocol).toBeNull();
    expect(next.protocolVersion).toBeNull();
    expect(next.connectionStrength).toBe(100);
    expect(typeof next.lastDataReceived).toBe('string');
    expect(next.error).toBeNull();
    expect(next.errorCount).toBe(0);
    expect(next.reconnectAttempts).toBe(0);
  });

  it('carries through protocol information when provided', () => {
    const next = connectionReducer(initial, {
      type: 'CONNECTION_SUCCESS',
      payload: {
        device,
        connectionType: 'wifi',
        supportedProtocols: ['ISO 15765-4'],
        activeProtocol: 'ISO 15765-4',
        protocolVersion: '1.0',
      },
    });
    expect(next.connectionType).toBe('wifi');
    expect(next.supportedProtocols).toEqual(['ISO 15765-4']);
    expect(next.activeProtocol).toBe('ISO 15765-4');
    expect(next.protocolVersion).toBe('1.0');
  });
});

describe('connectionReducer — CONNECTION_FAILED', () => {
  it('clears the connection, records the error, and keeps at most the last 5 errors', () => {
    let state: any = { ...initial, isConnecting: true, connectedDevice: { id: 'x' }, connectionType: 'bluetooth' };
    for (let i = 1; i <= 7; i++) {
      state = connectionReducer(state, {
        type: 'CONNECTION_FAILED',
        payload: { error: `e${i}`, device: { id: i } },
      });
    }
    expect(state.isConnected).toBe(false);
    expect(state.isConnecting).toBe(false);
    expect(state.connectedDevice).toBeNull();
    expect(state.connectionType).toBeNull();
    expect(state.error).toBe('e7');
    expect(state.lastError).toBe('e7');
    expect(state.errorCount).toBe(7);
    expect(state.connectionErrors).toHaveLength(5);
    expect(state.connectionErrors.map((e: any) => e.error)).toEqual(['e3', 'e4', 'e5', 'e6', 'e7']);
    expect(typeof state.connectionErrors[0].timestamp).toBe('string');
  });
});

describe('connectionReducer — DISCONNECT_DEVICE', () => {
  it('resets the live connection fields but remembers the last connected device', () => {
    const device = { id: 'AA:BB:CC', name: 'OBDII' };
    const connected = connectionReducer(initial, {
      type: 'CONNECTION_SUCCESS',
      payload: { device, connectionType: 'bluetooth', activeProtocol: 'ISO 15765-4' },
    });
    const next = connectionReducer(connected, { type: 'DISCONNECT_DEVICE' });
    expect(next.isConnected).toBe(false);
    expect(next.isConnecting).toBe(false);
    expect(next.connectedDevice).toBeNull();
    expect(next.connectionType).toBeNull();
    expect(next.connectionStrength).toBe(0);
    expect(next.activeProtocol).toBeNull();
    expect(next.error).toBeNull();
    expect(next.lastConnectedDevice).toEqual(device);
  });
});