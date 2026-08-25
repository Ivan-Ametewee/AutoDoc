// src/services/export/ExportService.js
import { Platform, Alert, PermissionsAndroid } from 'react-native';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import CSVExporter from './CSVExporter';
import PDFGenerator from './PDFGenerator';
import { formatters } from '../../utils/formatters';

class ExportService {
  constructor() {
    this.csvExporter = new CSVExporter();
    this.pdfGenerator = new PDFGenerator();
    this.exportDirectory = Platform.OS === 'ios' 
      ? RNFS.DocumentDirectoryPath 
      : RNFS.ExternalDirectoryPath;
  }

  /**
   * Export data in specified format
   * @param {String} dataType - Type of data to export (realtime, historical, dtc, profile)
   * @param {Array|Object} data - Data to export
   * @param {String} format - Export format (csv, pdf)
   * @param {Object} options - Export options
   * @returns {Object} Export result with file path and status
   */
  async exportData(dataType, data, format = 'csv', options = {}) {
    try {
      // Request permissions if needed
      const hasPermission = await this.requestStoragePermissions();
      if (!hasPermission) {
        throw new Error('Storage permissions are required for export');
      }

      // Validate input
      if (!data || (Array.isArray(data) && data.length === 0)) {
        throw new Error('No data provided for export');
      }

      // Generate export content
      let exportContent;
      let fileName;
      let mimeType;

      switch (format.toLowerCase()) {
        case 'csv':
          exportContent = await this.generateCSVContent(dataType, data, options);
          fileName = this.generateFileName(dataType, 'csv');
          mimeType = 'text/csv';
          break;
        case 'pdf':
          exportContent = await this.generatePDFContent(dataType, data, options);
          fileName = this.generateFileName(dataType, 'pdf');
          mimeType = 'application/pdf';
          break;
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }

      // Save file
      const filePath = `${this.exportDirectory}/${fileName}`;
      await this.saveFile(filePath, exportContent, format);

      // Prepare result
      const result = {
        success: true,
        filePath,
        fileName,
        fileSize: await this.getFileSize(filePath),
        mimeType,
        timestamp: new Date().toISOString()
      };

      // Auto-share if requested
      if (options.autoShare) {
        await this.shareFile(filePath, mimeType);
      }

      return result;
    } catch (error) {
      
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Generate CSV content based on data type
   * @param {String} dataType - Type of data
   * @param {*} data - Data to export
   * @param {Object} options - Export options
   * @returns {String} CSV content
   */
  async generateCSVContent(dataType, data, options) {
    switch (dataType.toLowerCase()) {
      case 'realtime':
      case 'live':
        return this.csvExporter.exportRealtimeData(data, options);
      case 'historical':
      case 'history':
        return this.csvExporter.exportHistoricalData(data, options.timeRange);
      case 'dtc':
      case 'diagnostics':
        return this.csvExporter.exportDTCCodes(data);
      case 'profile':
      case 'vehicle':
        return this.csvExporter.exportVehicleProfile(data);
      default:
        throw new Error(`Unsupported data type for CSV export: ${dataType}`);
    }
  }

  /**
   * Generate PDF content based on data type
   * @param {String} dataType - Type of data
   * @param {*} data - Data to export
   * @param {Object} options - Export options
   * @returns {String} PDF content (base64 or file path)
   */
  async generatePDFContent(dataType, data, options) {
    switch (dataType.toLowerCase()) {
      case 'realtime':
      case 'live':
        return this.pdfGenerator.generateRealtimeReport(data, options);
      case 'historical':
      case 'history':
        return this.pdfGenerator.generateHistoricalReport(data, options);
      case 'dtc':
      case 'diagnostics':
        return this.pdfGenerator.generateDiagnosticReport(data, options);
      case 'profile':
      case 'vehicle':
        return this.pdfGenerator.generateVehicleProfileReport(data, options);
      case 'summary':
      case 'complete':
        return this.pdfGenerator.generateCompleteReport(data, options);
      default:
        throw new Error(`Unsupported data type for PDF export: ${dataType}`);
    }
  }

  /**
   * Export multiple data types in a single operation
   * @param {Array} exports - Array of export configurations
   * @param {String} format - Export format
   * @param {Object} globalOptions - Global export options
   * @returns {Array} Array of export results
   */
  async exportMultiple(exports, format = 'csv', globalOptions = {}) {
    const results = [];
    
    for (const exportConfig of exports) {
      const options = { ...globalOptions, ...exportConfig.options };
      const result = await this.exportData(
        exportConfig.dataType,
        exportConfig.data,
        format,
        options
      );
      results.push({
        ...result,
        dataType: exportConfig.dataType,
        originalConfig: exportConfig
      });
    }

    return results;
  }

  /**
   * Create a comprehensive report with all available data
   * @param {Object} allData - Object containing all data types
   * @param {String} format - Export format
   * @param {Object} options - Export options
   * @returns {Object} Export result
   */
  async exportCompleteReport(allData, format = 'pdf', options = {}) {
    const reportData = {
      vehicleProfile: allData.vehicleProfile,
      realtimeData: allData.realtimeData || [],
      historicalData: allData.historicalData || [],
      dtcCodes: allData.dtcCodes || [],
      generatedAt: new Date().toISOString(),
      reportPeriod: options.reportPeriod || 'Complete History'
    };

    return this.exportData('complete', reportData, format, options);
  }

  /**
   * Schedule automatic exports
   * @param {Object} scheduleConfig - Schedule configuration
   * @returns {String} Schedule ID
   */
  async scheduleExport(scheduleConfig) {
    // This would integrate with a background task scheduler
    // For now, return a placeholder
    const scheduleId = `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store schedule configuration
    await this.storeScheduleConfig(scheduleId, scheduleConfig);
    
    return scheduleId;
  }

  /**
   * Cancel a scheduled export
   * @param {String} scheduleId - Schedule ID to cancel
   * @returns {Boolean} Success status
   */
  async cancelScheduledExport(scheduleId) {
    try {
      await this.removeScheduleConfig(scheduleId);
      return true;
    } catch (error) {
      
      return false;
    }
  }

  /**
   * Get list of exported files
   * @returns {Array} List of exported files with metadata
   */
  async getExportedFiles() {
    try {
      const files = await RNFS.readDir(this.exportDirectory);
      const exportFiles = files.filter(file => 
        file.name.startsWith('OBDII_') && (file.name.endsWith('.csv') || file.name.endsWith('.pdf'))
      );

      const fileDetails = await Promise.all(
        exportFiles.map(async (file) => {
          const stats = await RNFS.stat(file.path);
          return {
            name: file.name,
            path: file.path,
            size: stats.size,
            createdAt: stats.ctime,
            modifiedAt: stats.mtime,
            type: file.name.endsWith('.pdf') ? 'pdf' : 'csv'
          };
        })
      );

      return fileDetails.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
      
      return [];
    }
  }

  /**
   * Delete an exported file
   * @param {String} filePath - Path to file to delete
   * @returns {Boolean} Success status
   */
  async deleteExportedFile(filePath) {
    try {
      await RNFS.unlink(filePath);
      return true;
    } catch (error) {
      
      return false;
    }
  }

  /**
   * Share an exported file
   * @param {String} filePath - Path to file to share
   * @param {String} mimeType - MIME type of the file
   * @returns {Boolean} Success status
   */
  async shareFile(filePath, mimeType) {
    try {
      const shareOptions = {
        title: 'Share OBDII Report',
        message: 'OBDII Diagnostic Report',
        url: Platform.OS === 'ios' ? filePath : `file://${filePath}`,
        type: mimeType,
        failOnCancel: false
      };

      await Share.open(shareOptions);
      return true;
    } catch (error) {
      if (error.message !== 'User did not share') {
        
      }
      return false;
    }
  }

  /**
   * Request storage permissions
   * @returns {Boolean} Permission granted status
   */
  async requestStoragePermissions() {
    if (Platform.OS === 'ios') {
      return true; // iOS doesn't require explicit storage permissions for app documents
    }

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: 'Storage Permission Required',
          message: 'This app needs access to storage to export your diagnostic data.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );

      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (error) {
      
      return false;
    }
  }

  /**
   * Generate filename based on data type and format
   * @param {String} dataType - Type of data
   * @param {String} format - File format
   * @returns {String} Generated filename
   */
  generateFileName(dataType, format) {
    const timestamp = formatters.formatDateTime(new Date(), 'YYYYMMDD_HHmmss');
    const sanitizedDataType = dataType.toLowerCase().replace(/[^a-z0-9]/g, '_');
    return `OBDII_${sanitizedDataType}_${timestamp}.${format}`;
  }

  /**
   * Save file to storage
   * @param {String} filePath - Path where to save the file
   * @param {String} content - File content
   * @param {String} format - File format
   */
  async saveFile(filePath, content, format) {
    if (format === 'pdf') {
      // For PDF, content might be base64 or binary
      await RNFS.writeFile(filePath, content, 'base64');
    } else {
      // For CSV and other text formats
      await RNFS.writeFile(filePath, content, 'utf8');
    }
  }

  /**
   * Get file size
   * @param {String} filePath - Path to file
   * @returns {Number} File size in bytes
   */
  async getFileSize(filePath) {
    try {
      const stats = await RNFS.stat(filePath);
      return stats.size;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Store schedule configuration
   * @param {String} scheduleId - Schedule ID
   * @param {Object} config - Schedule configuration
   */
  async storeScheduleConfig(scheduleId, config) {
    // Implementation would store in AsyncStorage or database
    // Placeholder for now
    
  }

  /**
   * Remove schedule configuration
   * @param {String} scheduleId - Schedule ID
   */
  async removeScheduleConfig(scheduleId) {
    // Implementation would remove from AsyncStorage or database
    // Placeholder for now
    
  }

  /**
   * Get export statistics
   * @returns {Object} Export statistics
   */
  async getExportStatistics() {
    try {
      const files = await this.getExportedFiles();
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      
      const typeStats = files.reduce((stats, file) => {
        stats[file.type] = (stats[file.type] || 0) + 1;
        return stats;
      }, {});

      return {
        totalFiles: files.length,
        totalSize,
        typeBreakdown: typeStats,
        oldestExport: files.length > 0 ? files[files.length - 1].createdAt : null,
        newestExport: files.length > 0 ? files[0].createdAt : null
      };
    } catch (error) {
      
      return {
        totalFiles: 0,
        totalSize: 0,
        typeBreakdown: {},
        oldestExport: null,
        newestExport: null
      };
    }
  }

  /**
   * Clean up old export files
   * @param {Number} maxAge - Maximum age in days
   * @param {Number} maxFiles - Maximum number of files to keep
   * @returns {Object} Cleanup result
   */
  async cleanupOldExports(maxAge = 30, maxFiles = 50) {
    try {
      const files = await this.getExportedFiles();
      const now = new Date();
      const maxAgeMs = maxAge * 24 * 60 * 60 * 1000;
      
      let deletedCount = 0;
      let deletedSize = 0;

      // Delete files older than maxAge
      for (const file of files) {
        const fileAge = now.getTime() - new Date(file.createdAt).getTime();
        if (fileAge > maxAgeMs) {
          if (await this.deleteExportedFile(file.path)) {
            deletedCount++;
            deletedSize += file.size;
          }
        }
      }

      // Delete excess files if more than maxFiles remain
      const remainingFiles = files.filter(file => {
        const fileAge = now.getTime() - new Date(file.createdAt).getTime();
        return fileAge <= maxAgeMs;
      });

      if (remainingFiles.length > maxFiles) {
        const excessFiles = remainingFiles.slice(maxFiles);
        
        for (const file of excessFiles) {
          if (await this.deleteExportedFile(file.path)) {
            deletedCount++;
            deletedSize += file.size;
          }
        }
      }

      return {
        success: true,
        deletedCount,
        deletedSize,
        remainingFiles: files.length - deletedCount
      };
    } catch (error) {
      
      return {
        success: false,
        error: error.message,
        deletedCount: 0,
        deletedSize: 0
      };
    }
  }

  /**
   * Validate export data before processing
   * @param {String} dataType - Type of data
   * @param {*} data - Data to validate
   * @returns {Object} Validation result
   */
  validateExportData(dataType, data) {
    const result = { isValid: true, errors: [] };

    if (!data) {
      result.isValid = false;
      result.errors.push('No data provided');
      return result;
    }

    switch (dataType.toLowerCase()) {
      case 'realtime':
      case 'live':
        if (!Array.isArray(data) || data.length === 0) {
          result.isValid = false;
          result.errors.push('Real-time data must be a non-empty array');
        } else if (!data[0].timestamp) {
          result.isValid = false;
          result.errors.push('Real-time data must include timestamps');
        }
        break;

      case 'historical':
      case 'history':
        if (!Array.isArray(data) || data.length === 0) {
          result.isValid = false;
          result.errors.push('Historical data must be a non-empty array');
        }
        break;

      case 'dtc':
      case 'diagnostics':
        if (!Array.isArray(data)) {
          result.isValid = false;
          result.errors.push('DTC data must be an array');
        } else if (data.length > 0 && !data[0].code) {
          result.isValid = false;
          result.errors.push('DTC data must include error codes');
        }
        break;

      case 'profile':
      case 'vehicle':
        if (typeof data !== 'object' || Array.isArray(data)) {
          result.isValid = false;
          result.errors.push('Vehicle profile must be an object');
        }
        break;

      default:
        result.isValid = false;
        result.errors.push(`Unknown data type: ${dataType}`);
    }

    return result;
  }

  /**
   * Get export templates for different scenarios
   * @returns {Object} Available export templates
   */
  getExportTemplates() {
    return {
      quickDiagnostic: {
        name: 'Quick Diagnostic Report',
        description: 'Basic vehicle status and recent DTC codes',
        dataTypes: ['profile', 'dtc'],
        format: 'pdf',
        options: {
          includeSummary: true,
          includeCharts: false
        }
      },
      
      detailedAnalysis: {
        name: 'Detailed Analysis Report',
        description: 'Comprehensive report with historical data and trends',
        dataTypes: ['profile', 'historical', 'dtc'],
        format: 'pdf',
        options: {
          includeSummary: true,
          includeCharts: true,
          timeRange: 'week'
        }
      },
      
      dataBackup: {
        name: 'Data Backup',
        description: 'Complete data export for backup purposes',
        dataTypes: ['profile', 'realtime', 'historical', 'dtc'],
        format: 'csv',
        options: {
          includeAllParameters: true,
          rawData: true
        }
      },
      
      performanceReport: {
        name: 'Performance Report',
        description: 'Focus on engine performance and efficiency metrics',
        dataTypes: ['historical'],
        format: 'pdf',
        options: {
          focusParameters: ['engineRPM', 'vehicleSpeed', 'engineLoad', 'fuelLevel'],
          includeCharts: true,
          timeRange: 'day'
        }
      },
      
      maintenanceLog: {
        name: 'Maintenance Log',
        description: 'Service-oriented report for maintenance records',
        dataTypes: ['profile', 'dtc', 'historical'],
        format: 'pdf',
        options: {
          maintenanceFocus: true,
          includeSummary: true,
          timeRange: 'month'
        }
      }
    };
  }

  /**
   * Export using a predefined template
   * @param {String} templateName - Name of the template to use
   * @param {Object} allData - All available data
   * @param {Object} customOptions - Custom options to override template
   * @returns {Object} Export result
   */
  async exportWithTemplate(templateName, allData, customOptions = {}) {
    const templates = this.getExportTemplates();
    const template = templates[templateName];
    
    if (!template) {
      throw new Error(`Unknown export template: ${templateName}`);
    }

    const options = { ...template.options, ...customOptions };
    const exportPromises = [];

    // Export each data type specified in the template
    for (const dataType of template.dataTypes) {
      if (allData[dataType]) {
        exportPromises.push(
          this.exportData(dataType, allData[dataType], template.format, options)
        );
      }
    }

    const results = await Promise.all(exportPromises);
    
    // If all exports are successful and template specifies combining
    if (results.every(r => r.success) && options.combineFiles) {
      // Logic to combine multiple exports into a single file
      return this.combineExports(results, template.format, options);
    }

    return {
      template: templateName,
      results,
      success: results.every(r => r.success),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Combine multiple export results into a single file
   * @param {Array} exportResults - Array of export results
   * @param {String} format - Target format
   * @param {Object} options - Combine options
   * @returns {Object} Combined export result
   */
  async combineExports(exportResults, format, options = {}) {
    // This is a placeholder for combining multiple exports
    // Implementation would depend on the specific requirements
    
    const combinedFileName = this.generateFileName('combined', format);
    const combinedPath = `${this.exportDirectory}/${combinedFileName}`;
    
    // For now, just return the first successful export
    // In a real implementation, you'd combine the actual file contents
    const firstSuccess = exportResults.find(r => r.success);
    
    return {
      ...firstSuccess,
      fileName: combinedFileName,
      filePath: combinedPath,
      combined: true,
      sourceFiles: exportResults.map(r => r.fileName).filter(Boolean)
    };
  }
}

export default ExportService;