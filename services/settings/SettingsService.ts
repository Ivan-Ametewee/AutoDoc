import AsyncStorage from '@react-native-async-storage/async-storage';
// Lightweight internal event emitter to avoid external typings issues

// Settings type definitions
export interface AppSettings {
  // Vehicle settings
  vehicle_profile: {
    make: string;
    model: string;
    year: number;
    vin?: string;
  };
  auto_connect: boolean;
  connection_timeout: number;

  // Data & Monitoring
  data_collection: boolean;
  logging_frequency: number;
  storage_limit: number;
  auto_backup: boolean;

  // Alerts & Notifications
  push_notifications: boolean;
  dtc_alerts: boolean;
  performance_alerts: boolean;
  maintenance_reminders: boolean;

  // Display & Interface
  theme: 'light' | 'dark' | 'auto';
  temperature_unit: 'celsius' | 'fahrenheit';
  distance_unit: 'km' | 'miles';
  language: string;

  // Advanced
  diagnostic_mode: boolean;
  debug_mode: boolean;
  export_format: 'csv' | 'json' | 'pdf';
  simulation_mode: boolean;
}

export type SettingKey = keyof AppSettings;

class SettingsService {
  private static instance: SettingsService;
  private settings: AppSettings;
  private readonly STORAGE_KEY = '@VehicleDiagnostics:Settings';

  // internal event map: event name -> array of listeners
  private events: Map<string, Array<(...args: any[]) => void>> = new Map();

  private constructor() {
    this.settings = this.getDefaultSettings();
    this.loadSettings();
  }

  // Event emitter API (minimal subset)
  public on(event: string, listener: (...args: any[]) => void): void {
    const list = this.events.get(event) || [];
    list.push(listener);
    this.events.set(event, list);
  }

  public removeListener(event: string, listener: (...args: any[]) => void): void {
    const list = this.events.get(event);
    if (!list) return;
    const idx = list.indexOf(listener);
    if (idx >= 0) {
      list.splice(idx, 1);
      this.events.set(event, list);
    }
  }

  public removeAllListeners(event?: string): void {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }

  public emit(event: string, ...args: any[]): void {
    const list = this.events.get(event);
    if (!list) return;
    // create a copy to avoid mutation during iteration
    [...list].forEach((listener) => {
      try {
        listener(...args);
      } catch (e) {
        // swallow listener errors to avoid breaking emitter
        
      }
    });
  }

  public static getInstance(): SettingsService {
    if (!SettingsService.instance) {
      SettingsService.instance = new SettingsService();
    }
    return SettingsService.instance;
  }

  private getDefaultSettings(): AppSettings {
    return {
      // Vehicle settings
      vehicle_profile: {
        make: '',
        model: '',
        year: new Date().getFullYear(),
        vin: '',
      },
      auto_connect: true,
      connection_timeout: 30,

      // Data & Monitoring
      data_collection: true,
      logging_frequency: 5,
      storage_limit: 500,
      auto_backup: false,

      // Alerts & Notifications
      push_notifications: true,
      dtc_alerts: true,
      performance_alerts: false,
      maintenance_reminders: true,

      // Display & Interface
      theme: 'auto',
      temperature_unit: 'celsius',
      distance_unit: 'km',
      language: 'en',

      // Advanced
      diagnostic_mode: false,
      debug_mode: false,
      export_format: 'csv',
      simulation_mode: false,
    };
  }

  public async loadSettings(): Promise<AppSettings> {
    try {
      
      const storedSettings = await AsyncStorage.getItem(this.STORAGE_KEY);

      if (storedSettings) {
        const parsed = JSON.parse(storedSettings);
        // Merge with defaults to ensure all keys exist
        this.settings = { ...this.getDefaultSettings(), ...parsed };
        
      } else {
        
        this.settings = this.getDefaultSettings();
        await this.saveSettings(); // Save defaults
      }

      this.emit('settingsLoaded', this.settings);
      return this.settings;
    } catch (error: any) {
      
      this.settings = this.getDefaultSettings();
      return this.settings;
    }
  }

  public async saveSettings(): Promise<boolean> {
    try {
      
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.settings));
      
      this.emit('settingsSaved', this.settings);
      return true;
    } catch (error: any) {
      
      return false;
    }
  }

  public async updateSetting<K extends SettingKey>(
    key: K,
    value: AppSettings[K]
  ): Promise<boolean> {
    try {
      

      const oldValue = this.settings[key];
      this.settings[key] = value;

      const saved = await this.saveSettings();
      if (saved) {
        this.emit('settingChanged', { key, value, oldValue });
        this.emit(`settingChanged:${key}`, value, oldValue);
      }

      return saved;
    } catch (error: any) {
      
      return false;
    }
  }

  public getSetting<K extends SettingKey>(key: K): AppSettings[K] {
    return this.settings[key];
  }

  public getAllSettings(): AppSettings {
    return { ...this.settings };
  }

  public async resetToDefaults(): Promise<boolean> {
    try {
      
      this.settings = this.getDefaultSettings();
      const saved = await this.saveSettings();

      if (saved) {
        this.emit('settingsReset', this.settings);
      }

      return saved;
    } catch (error: any) {
      
      return false;
    }
  }

  // Utility methods for common operations
  public isDebugMode(): boolean {
    return this.settings.debug_mode;
  }

  public isDiagnosticMode(): boolean {
    return this.settings.diagnostic_mode;
  }

  public isSimulationMode(): boolean {
    return this.settings.simulation_mode;
  }

  public getConnectionTimeout(): number {
    return this.settings.connection_timeout * 1000; // Convert to milliseconds
  }

  public getLoggingInterval(): number {
    return this.settings.logging_frequency * 1000; // Convert to milliseconds
  }

  public shouldAutoConnect(): boolean {
    return this.settings.auto_connect;
  }

  public getTheme(): 'light' | 'dark' | 'auto' {
    return this.settings.theme;
  }

  public getTemperatureUnit(): 'celsius' | 'fahrenheit' {
    return this.settings.temperature_unit;
  }

  public getDistanceUnit(): 'km' | 'miles' {
    return this.settings.distance_unit;
  }

  public getExportFormat(): 'csv' | 'json' | 'pdf' {
    return this.settings.export_format;
  }

  public getVehicleProfile() {
    return { ...this.settings.vehicle_profile };
  }

  public async updateVehicleProfile(profile: Partial<AppSettings['vehicle_profile']>): Promise<boolean> {
    const updatedProfile = { ...this.settings.vehicle_profile, ...profile };
    return await this.updateSetting('vehicle_profile', updatedProfile);
  }

  // Temperature conversion utilities
  public convertTemperature(value: number, fromUnit?: 'celsius' | 'fahrenheit'): number {
    const unit = fromUnit || this.getTemperatureUnit();

    if (unit === 'fahrenheit') {
      // Convert Celsius to Fahrenheit if current setting is Fahrenheit
      return (value * 9 / 5) + 32;
    } else {
      // Already in Celsius or convert Fahrenheit to Celsius
      return (value - 32) * 5 / 9;
    }
  }

  // Distance conversion utilities
  public convertDistance(value: number, fromUnit?: 'km' | 'miles'): number {
    const unit = fromUnit || this.getDistanceUnit();

    if (unit === 'miles') {
      // Convert km to miles if current setting is miles
      return value * 0.621371;
    } else {
      // Already in km or convert miles to km
      return value / 0.621371;
    }
  }

  // Format values according to user preferences
  public formatTemperature(value: number): string {
    const unit = this.getTemperatureUnit();
    const symbol = unit === 'celsius' ? '°C' : '°F';
    const converted = unit === 'fahrenheit' ? this.convertTemperature(value) : value;
    return `${Math.round(converted)}${symbol}`;
  }

  public formatDistance(value: number): string {
    const unit = this.getDistanceUnit();
    const symbol = unit === 'km' ? 'km' : 'mi';
    const converted = unit === 'miles' ? this.convertDistance(value) : value;
    return `${Math.round(converted * 10) / 10} ${symbol}`;
  }

  public formatSpeed(value: number): string {
    const unit = this.getDistanceUnit();
    const symbol = unit === 'km' ? 'km/h' : 'mph';
    const converted = unit === 'miles' ? this.convertDistance(value) : value;
    return `${Math.round(converted)} ${symbol}`;
  }

  // Storage management
  public async clearCache(): Promise<boolean> {
    try {
      

      // Get all AsyncStorage keys
      const keys = await AsyncStorage.getAllKeys();

      // Filter out settings key and keep only cache/temporary data keys
      const cacheKeys = keys.filter(key =>
        key.includes('cache') ||
        key.includes('temp') ||
        key.includes('logs') ||
        key.includes('diagnostic_history')
      );

      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
        
      }

      this.emit('cacheCleared');
      return true;
    } catch (error: any) {
      
      return false;
    }
  }

  public async exportSettings(): Promise<string> {
    try {
      const exportData = {
        settings: this.settings,
        exportDate: new Date().toISOString(),
        appVersion: '1.0.0',
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error: any) {
      
      throw error;
    }
  }

  public async importSettings(settingsJson: string): Promise<boolean> {
    try {
      const importData = JSON.parse(settingsJson);

      if (importData.settings) {
        // Validate and merge with defaults
        this.settings = { ...this.getDefaultSettings(), ...importData.settings };
        const saved = await this.saveSettings();

        if (saved) {
          this.emit('settingsImported', this.settings);
        }

        return saved;
      }

      throw new Error('Invalid settings format');
    } catch (error: any) {
      
      return false;
    }
  }
}

export default SettingsService.getInstance();