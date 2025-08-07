import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Share } from 'react-native';
import SettingsService from '../settings/SettingsService';
import DatabaseService from '../database/DatabaseService';

export interface ExportData {
  metadata: {
    exportDate: string;
    appVersion: string;
    exportType: 'complete' | 'settings' | 'diagnostics';
  };
  settings?: any;
  diagnosticHistory?: any[];
  vehicleData?: any[];
  dtcCodes?: any[];
}

class ExportService {
  private static instance: ExportService;

  public static getInstance(): ExportService {
    if (!ExportService.instance) {
      ExportService.instance = new ExportService();
    }
    return ExportService.instance;
  }

  /**
   * Export all app data including settings, diagnostic history, and vehicle data
   */
  public async exportCompleteData(): Promise<string> {
    try {
      console.log('📤 [EXPORT] Starting complete data export...');

      const exportData: ExportData = {
        metadata: {
          exportDate: new Date().toISOString(),
          appVersion: '1.0.0',
          exportType: 'complete',
        },
        settings: SettingsService.getAllSettings(),
      };

      // Try to get diagnostic data if DatabaseService is available
      try {
        const dbService = DatabaseService;
        
        // Get diagnostic history
        exportData.diagnosticHistory = await dbService.getDiagnosticHistory();
        
        // Get vehicle data
        exportData.vehicleData = await dbService.getVehicleDataHistory();
        
        // Get DTC codes
        exportData.dtcCodes = await dbService.getStoredDTCs();
        
        console.log('📤 [EXPORT] Database data included in export');
      } catch (error) {
        console.warn('📤 [EXPORT] Could not access database data:', error);
        // Continue without database data
      }

      const jsonString = JSON.stringify(exportData, null, 2);
      console.log(`📤 [EXPORT] Complete export data size: ${jsonString.length} characters`);
      
      return jsonString;
    } catch (error: any) {
      console.error('📤 [EXPORT] Error exporting complete data:', error.message);
      throw new Error(`Failed to export data: ${error.message}`);
    }
  }

  /**
   * Export only settings data
   */
  public async exportSettings(): Promise<string> {
    try {
      console.log('📤 [EXPORT] Exporting settings only...');

      const exportData: ExportData = {
        metadata: {
          exportDate: new Date().toISOString(),
          appVersion: '1.0.0',
          exportType: 'settings',
        },
        settings: SettingsService.getAllSettings(),
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error: any) {
      console.error('📤 [EXPORT] Error exporting settings:', error.message);
      throw new Error(`Failed to export settings: ${error.message}`);
    }
  }

  /**
   * Export diagnostic data in CSV format
   */
  public async exportDiagnosticsCSV(): Promise<string> {
    try {
      console.log('📤 [EXPORT] Exporting diagnostics as CSV...');

      const dbService = DatabaseService;
      const diagnosticHistory = await dbService.getDiagnosticHistory();

      if (!diagnosticHistory || diagnosticHistory.length === 0) {
        throw new Error('No diagnostic data available to export');
      }

      // Create CSV header
      let csvContent = 'Date,Time,PID,Parameter,Value,Unit,Status\\n';

      // Add data rows
      diagnosticHistory.forEach((record: any) => {
        const date = new Date(record.timestamp);
        const dateStr = date.toISOString().split('T')[0];
        const timeStr = date.toTimeString().split(' ')[0];
        
        csvContent += `${dateStr},${timeStr},${record.pid || ''},\"${record.parameter || ''}\",${record.value || ''},\"${record.unit || ''}\",\"${record.status || ''}\"\\n`;
      });

      console.log(`📤 [EXPORT] CSV export completed with ${diagnosticHistory.length} records`);
      return csvContent;
    } catch (error: any) {
      console.error('📤 [EXPORT] Error exporting CSV:', error.message);
      throw new Error(`Failed to export CSV: ${error.message}`);
    }
  }

  /**
   * Share exported data using the device's sharing mechanism
   */
  public async shareExportedData(
    data: string,
    filename: string,
    mimeType: string = 'application/json'
  ): Promise<boolean> {
    try {
      console.log(`📤 [EXPORT] Sharing data as ${filename}...`);

      // Create file in document directory
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(fileUri, data);

      // Try Expo Sharing first (better UX)
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          dialogTitle: 'Export Vehicle Diagnostics Data',
          mimeType: mimeType,
        });
        console.log('📤 [EXPORT] Data shared via Expo Sharing');
      } else {
        // Fallback to React Native Share API
        await Share.share({
          message: data,
          title: 'Vehicle Diagnostics Export',
        });
        console.log('📤 [EXPORT] Data shared via React Native Share');
      }

      return true;
    } catch (error: any) {
      console.error('📤 [EXPORT] Error sharing data:', error.message);
      throw new Error(`Failed to share data: ${error.message}`);
    }
  }

  /**
   * Generate filename based on export type and current date
   */
  public generateFilename(exportType: 'complete' | 'settings' | 'diagnostics', format: 'json' | 'csv' = 'json'): string {
    const dateStr = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
    
    return `vehicle-diagnostics-${exportType}-${dateStr}-${timeStr}.${format}`;
  }

  /**
   * Import settings from exported data
   */
  public async importSettings(jsonData: string): Promise<boolean> {
    try {
      console.log('📥 [IMPORT] Importing settings...');

      const importData: ExportData = JSON.parse(jsonData);
      
      if (!importData.settings) {
        throw new Error('No settings data found in import file');
      }

      // Validate the import data structure
      if (!importData.metadata || !importData.metadata.exportDate) {
        throw new Error('Invalid import file format');
      }

      // Import settings
      const success = await SettingsService.importSettings(JSON.stringify(importData.settings));
      
      if (success) {
        console.log('📥 [IMPORT] Settings imported successfully');
      }
      
      return success;
    } catch (error: any) {
      console.error('📥 [IMPORT] Error importing settings:', error.message);
      throw new Error(`Failed to import settings: ${error.message}`);
    }
  }

  /**
   * Validate export file format
   */
  public validateExportFile(jsonData: string): { valid: boolean; error?: string; type?: string } {
    try {
      const data = JSON.parse(jsonData);
      
      if (!data.metadata) {
        return { valid: false, error: 'Missing metadata' };
      }
      
      if (!data.metadata.exportType) {
        return { valid: false, error: 'Missing export type' };
      }
      
      if (!data.metadata.exportDate) {
        return { valid: false, error: 'Missing export date' };
      }

      return { valid: true, type: data.metadata.exportType };
    } catch (error: any) {
      return { valid: false, error: 'Invalid JSON format' };
    }
  }

  /**
   * Get storage usage information
   */
  public async getStorageInfo(): Promise<{
    totalSpace: number;
    freeSpace: number;
    usedSpace: number;
    formattedSizes: {
      total: string;
      free: string;
      used: string;
    };
  }> {
    try {
      const totalSpace = await FileSystem.getTotalDiskCapacityAsync();
      const freeSpace = await FileSystem.getFreeDiskStorageAsync();
      const usedSpace = totalSpace - freeSpace;

      return {
        totalSpace,
        freeSpace,
        usedSpace,
        formattedSizes: {
          total: this.formatBytes(totalSpace),
          free: this.formatBytes(freeSpace),
          used: this.formatBytes(usedSpace),
        },
      };
    } catch (error: any) {
      console.error('📤 [EXPORT] Error getting storage info:', error.message);
      throw error;
    }
  }

  /**
   * Format bytes to human readable format
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Clean up temporary export files
   */
  public async cleanupTempFiles(): Promise<boolean> {
    try {
      console.log('📤 [EXPORT] Cleaning up temporary files...');

      const docDir = FileSystem.documentDirectory;
      if (!docDir) return false;

      const files = await FileSystem.readDirectoryAsync(docDir);
      const exportFiles = files.filter(file => 
        file.startsWith('vehicle-diagnostics-') && 
        (file.endsWith('.json') || file.endsWith('.csv'))
      );

      for (const file of exportFiles) {
        const filePath = `${docDir}${file}`;
        const info = await FileSystem.getInfoAsync(filePath);
        
        // Delete files older than 24 hours
        if (info.exists && info.modificationTime) {
          const fileAge = Date.now() - info.modificationTime * 1000;
          const oneDayInMs = 24 * 60 * 60 * 1000;
          
          if (fileAge > oneDayInMs) {
            await FileSystem.deleteAsync(filePath);
            console.log(`📤 [EXPORT] Deleted old temp file: ${file}`);
          }
        }
      }

      return true;
    } catch (error: any) {
      console.error('📤 [EXPORT] Error cleaning up temp files:', error.message);
      return false;
    }
  }
}

export default ExportService.getInstance();