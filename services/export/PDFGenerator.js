// src/services/export/PDFGenerator.js
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import { formatters } from '../../utils/formatters';

class PDFGenerator {
  constructor() {
    this.pageSize = 'A4';
    this.orientation = 'portrait';
    this.margins = {
      top: 20,
      right: 20,
      bottom: 20,
      left: 20
    };
    this.colors = {
      primary: '#2563eb',
      secondary: '#64748b',
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444',
      background: '#f8fafc',
      text: '#1e293b'
    };
  }

  /**
   * Generate real-time data report
   * @param {Array} data - Real-time data array
   * @param {Object} options - Generation options
   * @returns {String} PDF file path
   */
  async generateRealtimeReport(data, options = {}) {
    const title = 'Real-Time Vehicle Data Report';
    const html = this.generateRealtimeHTML(data, options);
    
    return this.generatePDF(html, title, options);
  }

  /**
   * Generate historical data report
   * @param {Array} data - Historical data array
   * @param {Object} options - Generation options
   * @returns {String} PDF file path
   */
  async generateHistoricalReport(data, options = {}) {
    const title = 'Historical Vehicle Data Analysis';
    const html = this.generateHistoricalHTML(data, options);
    
    return this.generatePDF(html, title, options);
  }

  /**
   * Generate diagnostic trouble codes report
   * @param {Array} dtcCodes - DTC codes array
   * @param {Object} options - Generation options
   * @returns {String} PDF file path
   */
  async generateDiagnosticReport(dtcCodes, options = {}) {
    const title = 'Vehicle Diagnostic Report';
    const html = this.generateDiagnosticHTML(dtcCodes, options);
    
    return this.generatePDF(html, title, options);
  }

  /**
   * Generate vehicle profile report
   * @param {Object} vehicleProfile - Vehicle profile data
   * @param {Object} options - Generation options
   * @returns {String} PDF file path
   */
  async generateVehicleProfileReport(vehicleProfile, options = {}) {
    const title = 'Vehicle Profile Report';
    const html = this.generateVehicleProfileHTML(vehicleProfile, options);
    
    return this.generatePDF(html, title, options);
  }

  /**
   * Generate complete comprehensive report
   * @param {Object} allData - All data types combined
   * @param {Object} options - Generation options
   * @returns {String} PDF file path
   */
  async generateCompleteReport(allData, options = {}) {
    const title = 'Complete Vehicle Analysis Report';
    const html = this.generateCompleteHTML(allData, options);
    
    return this.generatePDF(html, title, options);
  }

  /**
   * Generate HTML for real-time data
   * @param {Array} data - Real-time data
   * @param {Object} options - Options
   * @returns {String} HTML content
   */
  generateRealtimeHTML(data, options) {
    const latestData = data[data.length - 1] || {};
    const previousData = data[data.length - 2] || {};
    
    return `
      ${this.getHTMLHeader('Real-Time Vehicle Data Report')}
      <body>
        ${this.getReportHeader('Real-Time Vehicle Data Report')}
        
        <div class="section">
          <h2>Current Vehicle Status</h2>
          <div class="timestamp">Data captured: ${formatters.formatDateTime(latestData.timestamp || new Date())}</div>
          
          <div class="grid">
            ${this.generateGaugeCard('Engine RPM', latestData.engineRPM, 'rpm', this.getRPMStatus(latestData.engineRPM))}
            ${this.generateGaugeCard('Vehicle Speed', latestData.vehicleSpeed, 'km/h', this.getSpeedStatus(latestData.vehicleSpeed))}
            ${this.generateGaugeCard('Engine Load', latestData.engineLoad, '%', this.getLoadStatus(latestData.engineLoad))}
            ${this.generateGaugeCard('Fuel Level', latestData.fuelLevel, '%', this.getFuelStatus(latestData.fuelLevel))}
            ${this.generateGaugeCard('Coolant Temp', latestData.coolantTemp, '°C', this.getTempStatus(latestData.coolantTemp))}
            ${this.generateGaugeCard('Throttle Position', latestData.throttlePosition, '%', 'normal')}
          </div>
        </div>

        <div class="section">
          <h2>Recent Trends</h2>
          ${this.generateTrendAnalysis(data.slice(-10))}
        </div>

        <div class="section">
          <h2>Data Summary</h2>
          <table class="data-table">
            <thead>
              <tr>
                <th>Parameter</th>
                <th>Current</th>
                <th>Previous</th>
                <th>Change</th>
              </tr>
            </thead>
            <tbody>
              ${this.generateDataComparisonRows(latestData, previousData)}
            </tbody>
          </table>
        </div>

        ${this.getReportFooter()}
      </body>
      </html>
    `;
  }

  /**
   * Generate HTML for historical data
   * @param {Array} data - Historical data
   * @param {Object} options - Options
   * @returns {String} HTML content
   */
  generateHistoricalHTML(data, options) {
    const stats = this.calculateHistoricalStats(data);
    const timeRange = options.timeRange || 'day';
    
    return `
      ${this.getHTMLHeader('Historical Vehicle Data Analysis')}
      <body>
        ${this.getReportHeader('Historical Vehicle Data Analysis')}
        
        <div class="section">
          <h2>Analysis Period</h2>
          <div class="info-box">
            <div class="info-item">
              <strong>Period:</strong> ${formatters.formatDateTime(stats.startDate)} - ${formatters.formatDateTime(stats.endDate)}
            </div>
            <div class="info-item">
              <strong>Total Records:</strong> ${stats.totalRecords}
            </div>
            <div class="info-item">
              <strong>Aggregation:</strong> ${timeRange}
            </div>
          </div>
        </div>

        <div class="section">
          <h2>Performance Summary</h2>
          <div class="grid">
            ${this.generateStatCard('Average Speed', stats.avgSpeed, 'km/h')}
            ${this.generateStatCard('Maximum Speed', stats.maxSpeed, 'km/h')}
            ${this.generateStatCard('Average RPM', stats.avgRPM, 'rpm')}
            ${this.generateStatCard('Maximum RPM', stats.maxRPM, 'rpm')}
            ${this.generateStatCard('Fuel Efficiency', stats.fuelEfficiency, 'L/100km')}
            ${this.generateStatCard('Operating Time', stats.operatingTime, 'hours')}
          </div>
        </div>

        <div class="section">
          <h2>Detailed Statistics</h2>
          <table class="data-table">
            <thead>
              <tr>
                <th>Parameter</th>
                <th>Average</th>
                <th>Minimum</th>
                <th>Maximum</th>
                <th>Standard Deviation</th>
              </tr>
            </thead>
            <tbody>
              ${this.generateStatisticsRows(stats)}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>Alerts and Recommendations</h2>
          ${this.generateRecommendations(stats)}
        </div>

        ${this.getReportFooter()}
      </body>
      </html>
    `;
  }

  /**
   * Generate HTML for diagnostic report
   * @param {Array} dtcCodes - DTC codes
   * @param {Object} options - Options
   * @returns {String} HTML content
   */
  generateDiagnosticHTML(dtcCodes, options) {
    const activeCodes = dtcCodes.filter(code => code.status === 'active');
    const clearedCodes = dtcCodes.filter(code => code.status === 'cleared');
    
    return `
      ${this.getHTMLHeader('Vehicle Diagnostic Report')}
      <body>
        ${this.getReportHeader('Vehicle Diagnostic Report')}
        
        <div class="section">
          <h2>Diagnostic Summary</h2>
          <div class="alert-summary">
            <div class="alert-item ${activeCodes.length > 0 ? 'critical' : 'success'}">
              <strong>Active Codes:</strong> ${activeCodes.length}
            </div>
            <div class="alert-item info">
              <strong>Cleared Codes:</strong> ${clearedCodes.length}
            </div>
            <div class="alert-item info">
              <strong>Total Codes:</strong> ${dtcCodes.length}
            </div>
          </div>
        </div>

        ${activeCodes.length > 0 ? `
        <div class="section">
          <h2>Active Diagnostic Trouble Codes</h2>
          <div class="dtc-list">
            ${activeCodes.map(code => this.generateDTCCard(code, 'active')).join('')}
          </div>
        </div>
        ` : ''}

        ${clearedCodes.length > 0 ? `
        <div class="section">
          <h2>Recently Cleared Codes</h2>
          <div class="dtc-list">
            ${clearedCodes.map(code => this.generateDTCCard(code, 'cleared')).join('')}
          </div>
        </div>
        ` : ''}

        <div class="section">
          <h2>Diagnostic Recommendations</h2>
          ${this.generateDiagnosticRecommendations(dtcCodes)}
        </div>

        ${this.getReportFooter()}
      </body>
      </html>
    `;
  }

  /**
   * Generate HTML for vehicle profile
   * @param {Object} vehicleProfile - Vehicle profile data
   * @param {Object} options - Options
   * @returns {String} HTML content
   */
  generateVehicleProfileHTML(vehicleProfile, options) {
    return `
      ${this.getHTMLHeader('Vehicle Profile Report')}
      <body>
        ${this.getReportHeader('Vehicle Profile Report')}
        
        <div class="section">
          <h2>Vehicle Information</h2>
          <div class="profile-grid">
            <div class="profile-item">
              <strong>Make:</strong> ${vehicleProfile.make || 'Not specified'}
            </div>
            <div class="profile-item">
              <strong>Model:</strong> ${vehicleProfile.model || 'Not specified'}
            </div>
            <div class="profile-item">
              <strong>Year:</strong> ${vehicleProfile.year || 'Not specified'}
            </div>
            <div class="profile-item">
              <strong>VIN:</strong> ${vehicleProfile.vin || 'Not specified'}
            </div>
            <div class="profile-item">
              <strong>Engine Type:</strong> ${vehicleProfile.engineType || 'Not specified'}
            </div>
            <div class="profile-item">
              <strong>Fuel Type:</strong> ${vehicleProfile.fuelType || 'Not specified'}
            </div>
            <div class="profile-item">
              <strong>Transmission:</strong> ${vehicleProfile.transmission || 'Not specified'}
            </div>
            <div class="profile-item">
              <strong>Odometer:</strong> ${vehicleProfile.odometer || 'Not specified'} km
            </div>
          </div>
        </div>

        ${vehicleProfile.supportedPIDs ? `
        <div class="section">
          <h2>Supported Parameters</h2>
          <div class="pid-grid">
            ${vehicleProfile.supportedPIDs.map(pid => `
              <div class="pid-item">
                <strong>PID ${pid.id}:</strong> ${pid.description}
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}

        <div class="section">
          <h2>Vehicle Specifications</h2>
          <table class="data-table">
            <tbody>
              <tr><td><strong>Registration Date</strong></td><td>${vehicleProfile.registrationDate || 'Not specified'}</td></tr>
              <tr><td><strong>License Plate</strong></td><td>${vehicleProfile.licensePlate || 'Not specified'}</td></tr>
              <tr><td><strong>Insurance Expiry</strong></td><td>${vehicleProfile.insuranceExpiry || 'Not specified'}</td></tr>
              <tr><td><strong>Last Service</strong></td><td>${vehicleProfile.lastService || 'Not specified'}</td></tr>
              <tr><td><strong>Next Service Due</strong></td><td>${vehicleProfile.nextServiceDue || 'Not specified'}</td></tr>
            </tbody>
          </table>
        </div>

        ${this.getReportFooter()}
      </body>
      </html>
    `;
  }

  /**
   * Generate complete HTML report
   * @param {Object} allData - All data combined
   * @param {Object} options - Options
   * @returns {String} HTML content
   */
  generateCompleteHTML(allData, options) {
    return `
      ${this.getHTMLHeader('Complete Vehicle Analysis Report')}
      <body>
        ${this.getReportHeader('Complete Vehicle Analysis Report')}
        
        <div class="section">
          <h2>Executive Summary</h2>
          ${this.generateExecutiveSummary(allData)}
        </div>

        ${allData.vehicleProfile ? `
        <div class="section">
          <h2>Vehicle Information</h2>
          ${this.generateVehicleInfoSection(allData.vehicleProfile)}
        </div>
        ` : ''}

        ${allData.dtcCodes && allData.dtcCodes.length > 0 ? `
        <div class="section">
          <h2>Diagnostic Status</h2>
          ${this.generateDiagnosticSection(allData.dtcCodes)}
        </div>
        ` : ''}

        ${allData.historicalData && allData.historicalData.length > 0 ? `
        <div class="section">
          <h2>Performance Analysis</h2>
          ${this.generatePerformanceSection(allData.historicalData)}
        </div>
        ` : ''}

        <div class="section">
          <h2>Recommendations</h2>
          ${this.generateComprehensiveRecommendations(allData)}
        </div>

        ${this.getReportFooter()}
      </body>
      </html>
    `;
  }

  /**
   * Generate PDF from HTML content
   * @param {String} html - HTML content
   * @param {String} title - PDF title
   * @param {Object} options - PDF options
   * @returns {String} PDF file path
   */
  async generatePDF(html, title, options = {}) {
    try {
      const pdfOptions = {
        html,
        fileName: title.replace(/\s+/g, '_').toLowerCase(),
        directory: 'Documents',
        base64: false,
        ...options
      };

      const pdf = await RNHTMLtoPDF.convert(pdfOptions);
      return pdf.filePath;
    } catch (error) {
      
      throw new Error(`Failed to generate PDF: ${error.message}`);
    }
  }

  /**
   * Get HTML header with styles
   * @param {String} title - Document title
   * @returns {String} HTML header
   */
  getHTMLHeader(title) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            line-height: 1.6;
            color: ${this.colors.text};
            background-color: white;
            padding: 20px;
          }
          
          .report-header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid ${this.colors.primary};
          }
          
          .report-title {
            font-size: 28px;
            font-weight: bold;
            color: ${this.colors.primary};
            margin-bottom: 10px;
          }
          
          .report-subtitle {
            font-size: 14px;
            color: ${this.colors.secondary};
          }
          
          .section {
            margin-bottom: 30px;
            page-break-inside: avoid;
          }
          
          h2 {
            font-size: 20px;
            color: ${this.colors.primary};
            margin-bottom: 15px;
            padding-bottom: 5px;
            border-bottom: 1px solid ${this.colors.secondary};
          }
          
          .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
          }
          
          .card {
            background: ${this.colors.background};
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 15px;
          }
          
          .card-title {
            font-size: 14px;
            color: ${this.colors.secondary};
            margin-bottom: 5px;
          }
          
          .card-value {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          
          .card-unit {
            font-size: 12px;
            color: ${this.colors.secondary};
          }
          
          .status-normal { color: ${this.colors.success}; }
          .status-warning { color: ${this.colors.warning}; }
          .status-critical { color: ${this.colors.danger}; }
          
          .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
          }
          
          .data-table th,
          .data-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
          }
          
          .data-table th {
            background-color: ${this.colors.background};
            font-weight: 600;
            color: ${this.colors.primary};
          }
          
          .data-table tr:hover {
            background-color: ${this.colors.background};
          }
          
          .dtc-card {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
            border-left: 4px solid;
          }
          
          .dtc-active {
            border-left-color: ${this.colors.danger};
          }
          
          .dtc-cleared {
            border-left-color: ${this.colors.success};
          }
          
          .dtc-code {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          
          .dtc-description {
            color: ${this.colors.secondary};
            margin-bottom: 10px;
          }
          
          .dtc-meta {
            font-size: 12px;
            color: ${this.colors.secondary};
          }
          
          .alert-summary {
            display: flex;
            gap: 15px;
            margin-bottom: 20px;
          }
          
          .alert-item {
            flex: 1;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
          }
          
          .alert-item.success {
            background-color: #dcfce7;
            color: #166534;
          }
          
          .alert-item.critical {
            background-color: #fef2f2;
            color: #991b1b;
          }
          
          .alert-item.info {
            background-color: #eff6ff;
            color: #1e40af;
          }
          
          .recommendation {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
          }
          
          .recommendation-title {
            font-weight: bold;
            color: #92400e;
            margin-bottom: 5px;
          }
          
          .recommendation-text {
            color: #92400e;
          }
          
          .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid ${this.colors.secondary};
            text-align: center;
            font-size: 12px;
            color: ${this.colors.secondary};
          }
          
          @media print {
            body { margin: 0; padding: 15px; }
            .section { page-break-inside: avoid; }
            .card { page-break-inside: avoid; }
            .dtc-card { page-break-inside: avoid; }
          }
        </style>
      </head>
    `;
  }

  /**
   * Get report header section
   * @param {String} title - Report title
   * @returns {String} HTML header section
   */
  getReportHeader(title) {
    return `
      <div class="report-header">
        <div class="report-title">${title}</div>
        <div class="report-subtitle">
          Generated on ${formatters.formatDateTime(new Date())}
        </div>
      </div>
    `;
  }

  /**
   * Get report footer section
   * @returns {String} HTML footer section
   */
  getReportFooter() {
    return `
      <div class="footer">
        <p>Generated by OBDII Diagnostic App</p>
        <p>Report created on ${formatters.formatDateTime(new Date())}</p>
      </div>
    `;
  }

  /**
   * Generate gauge card HTML
   * @param {String} title - Card title
   * @param {Number} value - Value to display
   * @param {String} unit - Unit of measurement
   * @param {String} status - Status (normal, warning, critical)
   * @returns {String} HTML card
   */
  generateGaugeCard(title, value, unit, status = 'normal') {
    const displayValue = value !== null && value !== undefined ? value : 'N/A';
    const displayUnit = value !== null && value !== undefined ? unit : '';
    
    return `
      <div class="card">
        <div class="card-title">${title}</div>
        <div class="card-value status-${status}">${displayValue}</div>
        <div class="card-unit">${displayUnit}</div>
      </div>
    `;
  }

  /**
   * Generate statistics card HTML
   * @param {String} title - Card title
   * @param {Number} value - Value to display
   * @param {String} unit - Unit of measurement
   * @returns {String} HTML card
   */
  generateStatCard(title, value, unit) {
    const displayValue = value !== null && value !== undefined ? 
      (typeof value === 'number' ? value.toFixed(1) : value) : 'N/A';
    const displayUnit = value !== null && value !== undefined ? unit : '';
    
    return `
      <div class="card">
        <div class="card-title">${title}</div>
        <div class="card-value">${displayValue}</div>
        <div class="card-unit">${displayUnit}</div>
      </div>
    `;
  }

  /**
   * Generate DTC card HTML
   * @param {Object} dtc - DTC code object
   * @param {String} status - Status (active, cleared)
   * @returns {String} HTML card
   */
  generateDTCCard(dtc, status) {
    return `
      <div class="dtc-card dtc-${status}">
        <div class="dtc-code">${dtc.code}</div>
        <div class="dtc-description">${dtc.description}</div>
        <div class="dtc-meta">
          Detected: ${formatters.formatDateTime(dtc.detectedAt)} | 
          Status: ${dtc.status} | 
          ${dtc.clearedAt ? `Cleared: ${formatters.formatDateTime(dtc.clearedAt)}` : 'Not cleared'}
        </div>
      </div>
    `;
  }

  // Helper methods for status determination
  getRPMStatus(rpm) {
    if (!rpm) return 'normal';
    if (rpm > 6000) return 'critical';
    if (rpm > 4000) return 'warning';
    return 'normal';
  }

  getSpeedStatus(speed) {
    if (!speed) return 'normal';
    if (speed > 120) return 'warning';
    return 'normal';
  }

  getLoadStatus(load) {
    if (!load) return 'normal';
    if (load > 90) return 'critical';
    if (load > 70) return 'warning';
    return 'normal';
  }

  getFuelStatus(fuel) {
    if (!fuel) return 'normal';
    if (fuel < 10) return 'critical';
    if (fuel < 25) return 'warning';
    return 'normal';
  }

  getTempStatus(temp) {
    if (!temp) return 'normal';
    if (temp > 100) return 'critical';
    if (temp > 90) return 'warning';
    return 'normal';
  }

  /**
   * Calculate historical statistics
   * @param {Array} data - Historical data array
   * @returns {Object} Statistics object
   */
  calculateHistoricalStats(data) {
    if (!data || data.length === 0) {
      return {
        totalRecords: 0,
        startDate: null,
        endDate: null,
        avgSpeed: 0,
        maxSpeed: 0,
        avgRPM: 0,
        maxRPM: 0,
        fuelEfficiency: 0,
        operatingTime: 0
      };
    }

    const speeds = data.map(d => d.vehicleSpeed || d.data?.vehicleSpeed).filter(Boolean);
    const rpms = data.map(d => d.engineRPM || d.data?.engineRPM).filter(Boolean);
    
    return {
      totalRecords: data.length,
      startDate: new Date(data[0].timestamp),
      endDate: new Date(data[data.length - 1].timestamp),
      avgSpeed: speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0,
      maxSpeed: speeds.length > 0 ? Math.max(...speeds) : 0,
      avgRPM: rpms.length > 0 ? rpms.reduce((a, b) => a + b, 0) / rpms.length : 0,
      maxRPM: rpms.length > 0 ? Math.max(...rpms) : 0,
      fuelEfficiency: this.calculateFuelEfficiency(data),
      operatingTime: this.calculateOperatingTime(data)
    };
  }

  /**
   * Calculate fuel efficiency from data
   * @param {Array} data - Historical data
   * @returns {Number} Fuel efficiency in L/100km
   */
  calculateFuelEfficiency(data) {
    // Simplified calculation - would need more complex logic in real implementation
    const avgSpeed = data.reduce((sum, d) => sum + (d.vehicleSpeed || d.data?.vehicleSpeed || 0), 0) / data.length;
    const avgLoad = data.reduce((sum, d) => sum + (d.engineLoad || d.data?.engineLoad || 0), 0) / data.length;
    
    // Basic efficiency estimation based on speed and load
    const baseEfficiency = 8.0; // L/100km
    const speedFactor = avgSpeed > 80 ? 1.2 : 1.0;
    const loadFactor = avgLoad > 50 ? 1.3 : 1.0;
    
    return baseEfficiency * speedFactor * loadFactor;
  }

  /**
   * Calculate operating time from data
   * @param {Array} data - Historical data
   * @returns {Number} Operating time in hours
   */
  calculateOperatingTime(data) {
    if (data.length < 2) return 0;
    
    const startTime = new Date(data[0].timestamp);
    const endTime = new Date(data[data.length - 1].timestamp);
    
    return (endTime - startTime) / (1000 * 60 * 60); // Convert to hours
  }

  // Additional helper methods would go here for generating various HTML sections
  // These are simplified versions - full implementation would be more detailed

  generateTrendAnalysis(data) {
    return '<div class="trend-analysis">Trend analysis would be displayed here with charts and insights.</div>';
  }

  generateDataComparisonRows(current, previous) {
    const parameters = ['engineRPM', 'vehicleSpeed', 'engineLoad', 'fuelLevel'];
    return parameters.map(param => {
      const currentVal = current[param] || current.data?.[param] || 'N/A';
      const previousVal = previous[param] || previous.data?.[param] || 'N/A';
      const change = (currentVal !== 'N/A' && previousVal !== 'N/A') ? 
        (currentVal - previousVal).toFixed(1) : 'N/A';
      
      return `
        <tr>
          <td>${param}</td>
          <td>${currentVal}</td>
          <td>${previousVal}</td>
          <td class="status-${(currentVal > previousVal) ? 'success' : (currentVal < previousVal) ? 'danger' : 'normal'}">${change}</td>
        </tr>
      `;
    }).join('');
  }

  generateStatisticsRows = (stats) => {
    const parameters = [
      { key: 'engineRPM', label: 'Engine RPM', unit: 'rpm' },
      { key: 'vehicleSpeed', label: 'Vehicle Speed', unit: 'km/h' },
      { key: 'engineLoad', label: 'Engine Load', unit: '%' },
      { key: 'coolantTemp', label: 'Coolant Temperature', unit: '°C' },
      { key: 'throttlePosition', label: 'Throttle Position', unit: '%' }
    ];

    return parameters.map(param => {
      const data = stats[param.key] || {};
      return `
        <tr>
          <td>${param.label}</td>
          <td>${data.avg ? data.avg.toFixed(1) : 'N/A'} ${param.unit}</td>
          <td>${data.min ? data.min.toFixed(1) : 'N/A'} ${param.unit}</td>
          <td>${data.max ? data.max.toFixed(1) : 'N/A'} ${param.unit}</td>
          <td>${data.stdDev ? data.stdDev.toFixed(2) : 'N/A'}</td>
        </tr>
      `;
    }).join('');
  }

  generateExecutiveSummary = (allData) => {
    const vehicleInfo = allData.vehicleProfile || {};
    const activeDTCs = (allData.dtcCodes || []).filter(code => code.status === 'active');
    const historicalStats = allData.historicalData ? this.calculateHistoricalStats(allData.historicalData) : {};

    return `
      <div class="summary-section">
        <div class="info-box">
          <p><strong>Vehicle:</strong> ${vehicleInfo.year || ''} ${vehicleInfo.make || ''} ${vehicleInfo.model || 'Not specified'}</p>
          <p><strong>Report Period:</strong> ${formatters.formatDateTime(historicalStats.startDate || new Date())} - ${formatters.formatDateTime(historicalStats.endDate || new Date())}</p>
          <p><strong>Active Issues:</strong> ${activeDTCs.length} diagnostic trouble codes</p>
          <p><strong>Overall Status:</strong> ${this.getOverallStatus(allData)}</p>
        </div>
      </div>
    `;
  }

  generateVehicleInfoSection(profile) {
    return `
      <div class="info-section">
        <table class="data-table">
          <tbody>
            <tr><td>Make/Model</td><td>${profile.make} ${profile.model}</td></tr>
            <tr><td>Year</td><td>${profile.year}</td></tr>
            <tr><td>VIN</td><td>${profile.vin}</td></tr>
            <tr><td>Engine</td><td>${profile.engineType}</td></tr>
            <tr><td>Transmission</td><td>${profile.transmission}</td></tr>
            <tr><td>Current Mileage</td><td>${profile.odometer} km</td></tr>
          </tbody>
        </table>
      </div>
    `;
  }

  generateDiagnosticSection(dtcCodes) {
    const activeCodes = dtcCodes.filter(code => code.status === 'active');
    const criticalCodes = activeCodes.filter(code => code.severity === 'critical');

    return `
      <div class="diagnostic-section">
        <div class="alert-summary">
          <div class="alert-item ${criticalCodes.length > 0 ? 'critical' : 'success'}">
            <strong>Critical Issues:</strong> ${criticalCodes.length}
          </div>
          <div class="alert-item ${activeCodes.length > 0 ? 'warning' : 'success'}">
            <strong>Active Issues:</strong> ${activeCodes.length}
          </div>
        </div>
        ${activeCodes.map(code => this.generateDTCCard(code, 'active')).join('')}
      </div>
    `;
  }

  generatePerformanceSection(historicalData) {
    const stats = this.calculateHistoricalStats(historicalData);
    return `
      <div class="performance-section">
        <div class="grid">
          ${this.generateStatCard('Average Speed', stats.avgSpeed, 'km/h')}
          ${this.generateStatCard('Maximum Speed', stats.maxSpeed, 'km/h')}
          ${this.generateStatCard('Average RPM', stats.avgRPM, 'rpm')}
          ${this.generateStatCard('Fuel Efficiency', stats.fuelEfficiency, 'L/100km')}
        </div>
      </div>
    `;
  }

  generateRecommendations(stats) {
    const recommendations = [];

    if (stats.maxRPM > 6000) {
      recommendations.push({
        title: 'High RPM Warning',
        text: 'Engine has been operated at high RPM. Consider gentler acceleration to improve engine longevity.'
      });
    }

    if (stats.avgSpeed > 120) {
      recommendations.push({
        title: 'High Speed Operation',
        text: 'Vehicle frequently operated at high speeds. This may impact fuel efficiency and safety.'
      });
    }

    return recommendations.map(rec => `
      <div class="recommendation">
        <div class="recommendation-title">${rec.title}</div>
        <div class="recommendation-text">${rec.text}</div>
      </div>
    `).join('') || '<p>No specific recommendations at this time.</p>';
  }

  generateDiagnosticRecommendations(dtcCodes) {
    const activeCodes = dtcCodes.filter(code => code.status === 'active');
    if (activeCodes.length === 0) {
      return '<p>No active diagnostic codes. Vehicle systems operating normally.</p>';
    }

    return activeCodes.map(code => `
      <div class="recommendation">
        <div class="recommendation-title">Code ${code.code}</div>
        <div class="recommendation-text">
          <p><strong>Issue:</strong> ${code.description}</p>
          <p><strong>Recommended Action:</strong> ${code.solution || 'Consult a qualified mechanic for diagnosis.'}</p>
          <p><strong>Priority:</strong> ${code.severity.toUpperCase()}</p>
        </div>
      </div>
    `).join('');
  }

  generateComprehensiveRecommendations(allData) {
    const recommendations = [];
    
    // Add diagnostic recommendations
    if (allData.dtcCodes && allData.dtcCodes.length > 0) {
      const activeCodes = allData.dtcCodes.filter(code => code.status === 'active');
      activeCodes.forEach(code => {
        recommendations.push({
          title: `Diagnostic Code ${code.code}`,
          text: code.solution || 'Consult a qualified mechanic for diagnosis.',
          priority: code.severity
        });
      });
    }

    // Add maintenance recommendations
    if (allData.vehicleProfile) {
      const profile = allData.vehicleProfile;
      const mileage = profile.odometer || 0;

      if (mileage > 5000 && !profile.lastService) {
        recommendations.push({
          title: 'Regular Maintenance Required',
          text: 'Vehicle is due for regular maintenance service.',
          priority: 'medium'
        });
      }
    }

    // Add performance recommendations
    if (allData.historicalData) {
      const stats = this.calculateHistoricalStats(allData.historicalData);
      if (stats.fuelEfficiency > 12) {
        recommendations.push({
          title: 'Fuel Efficiency',
          text: 'Fuel consumption is higher than average. Consider checking tire pressure and driving habits.',
          priority: 'low'
        });
      }
    }

    return recommendations.map(rec => `
      <div class="recommendation">
        <div class="recommendation-title">${rec.title}</div>
        <div class="recommendation-text">
          ${rec.text}
          <p class="priority">(Priority: ${rec.priority})</p>
        </div>
      </div>
    `).join('') || '<p>No specific recommendations at this time.</p>';
  }

  getOverallStatus = (allData) => {
    const activeDTCs = (allData.dtcCodes || []).filter(code => code.status === 'active');
    const criticalDTCs = activeDTCs.filter(code => code.severity === 'critical');

    if (criticalDTCs.length > 0) {
      return 'Critical Attention Required';
    } else if (activeDTCs.length > 0) {
      return 'Service Recommended';
    } else {
      return 'Normal Operation';
    }
  }
}

// Export singleton instance
export const pdfGenerator = new PDFGenerator();
export default PDFGenerator;