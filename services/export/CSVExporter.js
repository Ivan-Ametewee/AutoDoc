// src/services/export/CSVExporter.js
import { formatters } from '../../utils/formatters';

class CSVExporter {
  constructor() {
    this.delimiter = ',';
    this.lineBreak = '\n';
  }

  /**
   * Export real-time data to CSV format
   * @param {Array} data - Array of real-time data objects
   * @param {Object} options - Export options
   * @returns {String} CSV formatted string
   */
  exportRealtimeData(data, options = {}) {
    if (!data || data.length === 0) {
      throw new Error('No data provided for export');
    }

    const headers = this.getRealtimeDataHeaders(options.includedParameters);
    const csvRows = [headers];

    data.forEach(record => {
      const row = this.formatRealtimeDataRow(record, options.includedParameters);
      csvRows.push(row);
    });

    return this.arrayToCsv(csvRows);
  }

  /**
   * Export diagnostic trouble codes to CSV
   * @param {Array} dtcCodes - Array of DTC objects
   * @returns {String} CSV formatted string
   */
  exportDTCCodes(dtcCodes) {
    if (!dtcCodes || dtcCodes.length === 0) {
      throw new Error('No DTC codes provided for export');
    }

    const headers = ['Code', 'Description', 'Status', 'Detected At', 'Cleared At', 'Freeze Frame Data'];
    const csvRows = [headers];

    dtcCodes.forEach(dtc => {
      const row = [
        this.escapeField(dtc.code),
        this.escapeField(dtc.description),
        this.escapeField(dtc.status),
        this.escapeField(formatters.formatDateTime(dtc.detectedAt)),
        this.escapeField(dtc.clearedAt ? formatters.formatDateTime(dtc.clearedAt) : 'Not Cleared'),
        this.escapeField(JSON.stringify(dtc.freezeFrameData || {}))
      ];
      csvRows.push(row);
    });

    return this.arrayToCsv(csvRows);
  }

  /**
   * Export historical data with aggregation
   * @param {Array} data - Historical data array
   * @param {String} timeRange - Time range for aggregation
   * @returns {String} CSV formatted string
   */
  exportHistoricalData(data, timeRange = 'hour') {
    if (!data || data.length === 0) {
      throw new Error('No historical data provided for export');
    }

    const aggregatedData = this.aggregateHistoricalData(data, timeRange);
    const headers = [
      'Timestamp',
      'Avg Engine RPM',
      'Avg Vehicle Speed',
      'Avg Engine Load',
      'Avg Fuel Level',
      'Avg Coolant Temp',
      'Avg Intake Temp',
      'Avg Throttle Position',
      'Max Engine RPM',
      'Max Vehicle Speed',
      'Min Fuel Level'
    ];

    const csvRows = [headers];

    aggregatedData.forEach(record => {
      const row = [
        this.escapeField(formatters.formatDateTime(record.timestamp)),
        this.escapeField(record.avgEngineRPM?.toFixed(0) || 'N/A'),
        this.escapeField(record.avgVehicleSpeed?.toFixed(1) || 'N/A'),
        this.escapeField(record.avgEngineLoad?.toFixed(1) || 'N/A'),
        this.escapeField(record.avgFuelLevel?.toFixed(1) || 'N/A'),
        this.escapeField(record.avgCoolantTemp?.toFixed(1) || 'N/A'),
        this.escapeField(record.avgIntakeTemp?.toFixed(1) || 'N/A'),
        this.escapeField(record.avgThrottlePosition?.toFixed(1) || 'N/A'),
        this.escapeField(record.maxEngineRPM?.toFixed(0) || 'N/A'),
        this.escapeField(record.maxVehicleSpeed?.toFixed(1) || 'N/A'),
        this.escapeField(record.minFuelLevel?.toFixed(1) || 'N/A')
      ];
      csvRows.push(row);
    });

    return this.arrayToCsv(csvRows);
  }

  /**
   * Export vehicle profile information
   * @param {Object} vehicleProfile - Vehicle profile data
   * @returns {String} CSV formatted string
   */
  exportVehicleProfile(vehicleProfile) {
    if (!vehicleProfile) {
      throw new Error('No vehicle profile provided for export');
    }

    const headers = ['Property', 'Value'];
    const csvRows = [headers];

    // Basic vehicle information
    const basicInfo = [
      ['Vehicle Make', vehicleProfile.make],
      ['Vehicle Model', vehicleProfile.model],
      ['Vehicle Year', vehicleProfile.year],
      ['VIN', vehicleProfile.vin],
      ['Engine Type', vehicleProfile.engineType],
      ['Fuel Type', vehicleProfile.fuelType],
      ['Transmission', vehicleProfile.transmission],
      ['Odometer Reading', vehicleProfile.odometer],
      ['License Plate', vehicleProfile.licensePlate]
    ];

    basicInfo.forEach(([property, value]) => {
      csvRows.push([
        this.escapeField(property),
        this.escapeField(value || 'Not Specified')
      ]);
    });

    // Add supported PIDs if available
    if (vehicleProfile.supportedPIDs) {
      csvRows.push(['', '']); // Empty row for separation
      csvRows.push(['Supported PIDs', '']);
      
      vehicleProfile.supportedPIDs.forEach(pid => {
        csvRows.push([
          this.escapeField(`PID ${pid.id}`),
          this.escapeField(pid.description)
        ]);
      });
    }

    return this.arrayToCsv(csvRows);
  }

  /**
   * Get headers for real-time data export
   * @param {Array} includedParameters - Parameters to include in export
   * @returns {Array} Header array
   */
  getRealtimeDataHeaders(includedParameters) {
    const defaultHeaders = [
      'Timestamp',
      'Engine RPM',
      'Vehicle Speed (km/h)',
      'Engine Load (%)',
      'Fuel Level (%)',
      'Coolant Temperature (°C)',
      'Intake Air Temperature (°C)',
      'Throttle Position (%)',
      'MAF Air Flow Rate (g/s)',
      'Fuel Pressure (kPa)',
      'Ignition Timing Advance (°)',
      'Engine Runtime (s)'
    ];

    if (includedParameters && includedParameters.length > 0) {
      return ['Timestamp', ...includedParameters.map(param => param.displayName || param.name)];
    }

    return defaultHeaders;
  }

  /**
   * Format a single real-time data row
   * @param {Object} record - Data record
   * @param {Array} includedParameters - Parameters to include
   * @returns {Array} Formatted row array
   */
  formatRealtimeDataRow(record, includedParameters) {
    const timestamp = this.escapeField(formatters.formatDateTime(record.timestamp));
    
    if (includedParameters && includedParameters.length > 0) {
      const values = includedParameters.map(param => {
        const value = record[param.key] || record.data?.[param.key];
        return this.escapeField(this.formatValue(value, param.unit));
      });
      return [timestamp, ...values];
    }

    // Default parameter set
    return [
      timestamp,
      this.escapeField(this.formatValue(record.engineRPM || record.data?.engineRPM, 'rpm')),
      this.escapeField(this.formatValue(record.vehicleSpeed || record.data?.vehicleSpeed, 'km/h')),
      this.escapeField(this.formatValue(record.engineLoad || record.data?.engineLoad, '%')),
      this.escapeField(this.formatValue(record.fuelLevel || record.data?.fuelLevel, '%')),
      this.escapeField(this.formatValue(record.coolantTemp || record.data?.coolantTemp, '°C')),
      this.escapeField(this.formatValue(record.intakeTemp || record.data?.intakeTemp, '°C')),
      this.escapeField(this.formatValue(record.throttlePosition || record.data?.throttlePosition, '%')),
      this.escapeField(this.formatValue(record.mafAirFlow || record.data?.mafAirFlow, 'g/s')),
      this.escapeField(this.formatValue(record.fuelPressure || record.data?.fuelPressure, 'kPa')),
      this.escapeField(this.formatValue(record.ignitionTiming || record.data?.ignitionTiming, '°')),
      this.escapeField(this.formatValue(record.engineRuntime || record.data?.engineRuntime, 's'))
    ];
  }

  /**
   * Aggregate historical data by time range
   * @param {Array} data - Raw historical data
   * @param {String} timeRange - Aggregation period
   * @returns {Array} Aggregated data
   */
  aggregateHistoricalData(data, timeRange) {
    const intervals = this.groupDataByTimeInterval(data, timeRange);
    
    return intervals.map(interval => {
      const records = interval.records;
      const aggregated = {
        timestamp: interval.startTime,
        count: records.length
      };

      // Calculate averages and extremes
      const parameters = [
        'engineRPM', 'vehicleSpeed', 'engineLoad', 'fuelLevel',
        'coolantTemp', 'intakeTemp', 'throttlePosition'
      ];

      parameters.forEach(param => {
        const values = records
          .map(r => r[param] || r.data?.[param])
          .filter(v => v !== null && v !== undefined && !isNaN(v));

        if (values.length > 0) {
          aggregated[`avg${param.charAt(0).toUpperCase() + param.slice(1)}`] = 
            values.reduce((sum, val) => sum + val, 0) / values.length;
          
          if (['engineRPM', 'vehicleSpeed'].includes(param)) {
            aggregated[`max${param.charAt(0).toUpperCase() + param.slice(1)}`] = Math.max(...values);
          }
          
          if (param === 'fuelLevel') {
            aggregated.minFuelLevel = Math.min(...values);
          }
        }
      });

      return aggregated;
    });
  }

  /**
   * Group data by time intervals
   * @param {Array} data - Data to group
   * @param {String} interval - Time interval (hour, day, week)
   * @returns {Array} Grouped data
   */
  groupDataByTimeInterval(data, interval) {
    const sortedData = data.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const groups = [];
    let currentGroup = null;

    sortedData.forEach(record => {
      const recordTime = new Date(record.timestamp);
      const intervalStart = this.getIntervalStart(recordTime, interval);

      if (!currentGroup || currentGroup.startTime.getTime() !== intervalStart.getTime()) {
        currentGroup = {
          startTime: intervalStart,
          records: []
        };
        groups.push(currentGroup);
      }

      currentGroup.records.push(record);
    });

    return groups;
  }

  /**
   * Get the start time for a given interval
   * @param {Date} date - Date to process
   * @param {String} interval - Interval type
   * @returns {Date} Interval start time
   */
  getIntervalStart(date, interval) {
    const result = new Date(date);
    
    switch (interval) {
      case 'hour':
        result.setMinutes(0, 0, 0);
        break;
      case 'day':
        result.setHours(0, 0, 0, 0);
        break;
      case 'week':
        const dayOfWeek = result.getDay();
        result.setDate(result.getDate() - dayOfWeek);
        result.setHours(0, 0, 0, 0);
        break;
      default:
        result.setMinutes(0, 0, 0);
    }
    
    return result;
  }

  /**
   * Format a value with its unit
   * @param {*} value - Value to format
   * @param {String} unit - Unit of measurement
   * @returns {String} Formatted value
   */
  formatValue(value, unit) {
    if (value === null || value === undefined || isNaN(value)) {
      return 'N/A';
    }

    const numValue = parseFloat(value);
    
    switch (unit) {
      case 'rpm':
      case 's':
        return Math.round(numValue).toString();
      case '%':
      case '°C':
      case 'km/h':
      case 'g/s':
      case 'kPa':
      case '°':
        return numValue.toFixed(1);
      default:
        return value.toString();
    }
  }

  /**
   * Escape CSV field to handle commas, quotes, and newlines
   * @param {*} field - Field to escape
   * @returns {String} Escaped field
   */
  escapeField(field) {
    if (field === null || field === undefined) {
      return '';
    }

    const stringField = field.toString();
    
    // If field contains delimiter, quotes, or newlines, wrap in quotes and escape internal quotes
    if (stringField.includes(this.delimiter) || stringField.includes('"') || stringField.includes('\n')) {
      return `"${stringField.replace(/"/g, '""')}"`;
    }
    
    return stringField;
  }

  /**
   * Convert array of arrays to CSV string
   * @param {Array} data - 2D array of data
   * @returns {String} CSV string
   */
  arrayToCsv(data) {
    return data
      .map(row => row.join(this.delimiter))
      .join(this.lineBreak);
  }

  /**
   * Set custom delimiter
   * @param {String} delimiter - CSV delimiter
   */
  setDelimiter(delimiter) {
    this.delimiter = delimiter;
  }

  /**
   * Set custom line break
   * @param {String} lineBreak - Line break character(s)
   */
  setLineBreak(lineBreak) {
    this.lineBreak = lineBreak;
  }
}

export default CSVExporter;