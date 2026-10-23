// __tests__/services/database/DatabaseService.test.ts
//
// Tests for the DTC / alert history path in DatabaseService (BUG-001, BUG-002, BUG-009).
// These bugs are latent in the running app (nothing writes the dtc_codes/alerts tables yet),
// so they cannot be reproduced by tapping around — the expo-sqlite layer is mocked here instead.
//
// Written BEFORE the fix: three tests are expected to FAIL against the current code, then pass
// once the fix script is applied. Two tests pass both before and after; they guard against
// breaking the export's current behavior (see "includes cleared DTCs" below).

jest.mock('expo-sqlite', () => {
  const db = {
    execAsync: jest.fn(async () => {}),
    runAsync: jest.fn(async () => ({ lastInsertRowId: 1 })),
    getAllAsync: jest.fn(async () => [] as any[]),
    getFirstAsync: jest.fn(async () => null),
    closeAsync: jest.fn(async () => {}),
  };
  return { openDatabaseAsync: jest.fn(async () => db), __db: db };
});

import * as SQLite from 'expo-sqlite';
import DatabaseService from '../../../services/database/DatabaseService';

const mockDb: any = (SQLite as any).__db;

beforeAll(async () => {
  await DatabaseService.initialize();
});

beforeEach(() => {
  mockDb.getAllAsync.mockReset();
  mockDb.getAllAsync.mockResolvedValue([]);
});

describe('DatabaseService.getDTCs (BUG-001)', () => {
  it('filters by vehicle and excludes cleared codes when asked to', async () => {
    await DatabaseService.getDTCs(5, false);
    const [sql, params] = mockDb.getAllAsync.mock.calls[0];
    expect(sql).toContain('vehicle_id = ?');
    expect(sql).toContain("status != 'cleared'");
    expect(params).toEqual([5]);
  });

  it('does not filter on status when includeCleared is true', async () => {
    await DatabaseService.getDTCs(null, true);
    const [sql] = mockDb.getAllAsync.mock.calls[0];
    expect(sql).not.toContain("status != 'cleared'");
  });
});

describe('DatabaseService.getDiagnosticHistory', () => {
  it('still includes cleared DTCs (guards the behavior-preservation trap in BUG-001)', async () => {
    mockDb.getAllAsync.mockImplementation(async (sql: string) => {
      if (sql.includes('FROM dtc_codes')) {
        const rows = [
          { code: 'P0300', status: 'active', description: 'Misfire' },
          { code: 'P0171', status: 'cleared', description: 'Lean' },
        ];
        // Emulate the database honoring a status filter if one is present in the query.
        return sql.includes("status != 'cleared'") ? rows.filter((r) => r.status !== 'cleared') : rows;
      }
      return [];
    });
    const history = await DatabaseService.getDiagnosticHistory();
    expect(history.map((h: any) => h.code)).toEqual(['P0300', 'P0171']);
  });

  it('maps alert rows using the real alert fields (BUG-002)', async () => {
    mockDb.getAllAsync.mockImplementation(async (sql: string) => {
      if (sql.includes('FROM alerts')) {
        return [
          {
            alert_id: 'a1',
            parameter: 'engineTemp',
            type: 'above_threshold',
            priority: 'high',
            message: 'Engine temperature is above safe range',
            timestamp: '2026-01-01T00:00:00Z',
            threshold_data: '{"min":70,"max":105}',
            acknowledged: 0,
            resolved: 0,
          },
        ];
      }
      return [];
    });
    const history = await DatabaseService.getDiagnosticHistory();
    const alertRow = history.find((h: any) => h.type === 'Alert');
    expect(alertRow).toBeDefined();
    expect(alertRow.code).toBe('engineTemp');
    expect(alertRow.severity).toBe('high');
  });
});

describe('DatabaseService.getStoredDTCs (BUG-009)', () => {
  it('returns the stored DTC rows instead of silently returning []', async () => {
    mockDb.getAllAsync.mockImplementation(async (sql: string) =>
      sql.includes('FROM dtc_codes')
        ? [
            {
              code: 'P0171',
              description: 'System Too Lean',
              status: 'active',
              first_detected: '2026-01-01',
              cleared_at: null,
              freeze_frame_data: '{"rpm":800}',
            },
          ]
        : []
    );
    const stored = await DatabaseService.getStoredDTCs();
    expect(stored).toHaveLength(1);
    expect(stored[0].code).toBe('P0171');
    expect(stored[0].freezeFrameData).toEqual({ rpm: 800 });
  });
});