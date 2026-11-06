// __tests__/services/settingsService.test.ts
//
// Pins the startup contract of SettingsService that ThemeContext depends on (BUG-011):
//   1. At import time the in-memory settings are the DEFAULTS (theme 'auto'); storage is read
//      asynchronously, so any consumer that reads once at mount can see the default.
//   2. The stored values only appear after loading finishes, and 'settingsLoaded' is the event
//      that signals it.
//   3. User changes emit 'settingChanged:theme' with the new value.
// These tests pass before and after the ThemeContext fix: they document the cause and protect the
// contract the fix uses. The ThemeContext change itself is verified manually (rendering it in a
// test would need extra dependencies, which is a separate task).

jest.mock('@react-native-async-storage/async-storage', () => {
  const pending: Array<(value: string | null) => void> = [];
  return {
    __esModule: true,
    default: {
      // getItem stays pending until the test releases it, so the "load not finished" window is observable.
      getItem: jest.fn(() => new Promise<string | null>((resolve) => { pending.push(resolve); })),
      setItem: jest.fn(async () => {}),
      getAllKeys: jest.fn(async () => []),
      multiRemove: jest.fn(async () => {}),
    },
    __pending: pending,
  };
});

import * as AsyncStorageModule from '@react-native-async-storage/async-storage';
import SettingsService from '../../services/settings/SettingsService';

const pending: Array<(value: string | null) => void> = (AsyncStorageModule as any).__pending;

describe('SettingsService startup contract', () => {
  it('starts with the default theme and only reflects the stored theme after settingsLoaded fires', async () => {
    // Storage read is still pending: this is the window in which a read-once consumer gets the default.
    expect(SettingsService.getTheme()).toBe('auto');

    const loaded = new Promise<void>((resolve) => SettingsService.on('settingsLoaded', () => resolve()));
    pending.forEach((resolve) => resolve(JSON.stringify({ theme: 'light' })));
    await loaded;

    expect(SettingsService.getTheme()).toBe('light');
  });

  it("emits 'settingChanged:theme' with the new value when the theme is updated", async () => {
    const seen: any[] = [];
    SettingsService.on('settingChanged:theme', (value: any, oldValue: any) => seen.push([value, oldValue]));

    await SettingsService.updateSetting('theme', 'dark');

    expect(seen).toEqual([['dark', 'light']]);
    expect(SettingsService.getTheme()).toBe('dark');
  });
});