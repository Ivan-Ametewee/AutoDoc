/**
 * fraudDetectionActions.ts
 * Redux action creators for odometer fraud detection
 */

import { Dispatch } from 'redux';
import OdometerFraudDetectionService from '../../services/fraud/OdometerFraudDetectionService';
import { 
  FRAUD_DETECTION_TYPES,
  FraudDetectionAction,
  OdometerReading,
  VehicleProfile,
  FraudAlert,
} from '../types/fraudTypes';

// Types for root state
interface RootState {
  vehicle: {
    activeProfile: VehicleProfile | null;
    fraudDetection: any;
  };
  data: {
    historicalData: OdometerReading[];
  };
}

// Initialize fraud detection service
const fraudDetectionService = new OdometerFraudDetectionService();

/**
 * Run comprehensive fraud detection check
 */
export const runFraudDetection = (currentReading: OdometerReading) => {
  return async (dispatch: Dispatch<FraudDetectionAction>, getState: () => RootState) => {
    try {
      const state = getState();
      const { activeProfile } = state.vehicle;
      const { historicalData } = state.data;

      if (!activeProfile) {
        throw new Error('No active vehicle profile found');
      }

      // Dispatch start action
      dispatch({
        type: FRAUD_DETECTION_TYPES.RUN_FRAUD_CHECK,
      });

      // Run fraud detection
      const results = await fraudDetectionService.runFraudDetection(
        currentReading,
        historicalData || [],
        activeProfile
      );

      // Dispatch completion action
      dispatch({
        type: FRAUD_DETECTION_TYPES.FRAUD_CHECK_COMPLETE,
        payload: {
          riskScore: results.riskScore,
          status: results.status,
          checkResults: results.checkResults,
        },
      });

      // Dispatch alerts if any
      results.alerts.forEach(alert => {
        dispatch({
          type: FRAUD_DETECTION_TYPES.ADD_FRAUD_ALERT,
          payload: { alert },
        });
      });

      // Log anomalies for each check type
      Object.entries(results.checkResults).forEach(([checkType, result]) => {
        result.anomalies.forEach(anomaly => {
          dispatch({
            type: FRAUD_DETECTION_TYPES.ODOMETER_ANOMALY_DETECTED,
            payload: {
              checkType: checkType as any,
              anomaly,
            },
          });
        });
      });

      return results;

    } catch (error: any) {
      console.error('Fraud detection failed:', error);
      
      // Dispatch error alert
      dispatch({
        type: FRAUD_DETECTION_TYPES.ADD_FRAUD_ALERT,
        payload: {
          alert: {
            id: `error_${Date.now()}`,
            type: 'error' as const,
            message: `Fraud detection failed: ${error.message}`,
            timestamp: new Date().toISOString(),
            checkType: 'system',
            riskLevel: 0,
          },
        },
      });

      throw error;
    }
  };
};

/**
 * Run fraud detection when new odometer reading is received
 */
export const validateOdometerReading = (newReading: OdometerReading) => {
  return async (dispatch: Dispatch<FraudDetectionAction>, getState: () => RootState) => {
    const state = getState();
    const { fraudDetection } = state.vehicle;

    // Only run if fraud detection is enabled
    if (!fraudDetection.isEnabled) {
      return;
    }

    try {
      await dispatch(runFraudDetection(newReading) as any);
    } catch (error) {
      console.error('Odometer validation failed:', error);
    }
  };
};

/**
 * Update fraud detection settings
 */
export const updateFraudDetectionSettings = (settings: Partial<any>): FraudDetectionAction => {
  return {
    type: FRAUD_DETECTION_TYPES.UPDATE_FRAUD_SETTINGS,
    payload: { settings },
  };
};

/**
 * Toggle fraud detection on/off
 */
export const toggleFraudDetection = (enabled: boolean): FraudDetectionAction => {
  return {
    type: FRAUD_DETECTION_TYPES.TOGGLE_FRAUD_DETECTION,
    payload: { enabled },
  };
};

/**
 * Clear all fraud alerts
 */
export const clearFraudAlerts = (): FraudDetectionAction => {
  return {
    type: FRAUD_DETECTION_TYPES.CLEAR_FRAUD_ALERTS,
  };
};

/**
 * Clear fraud anomalies for specific check type or all
 */
export const clearFraudAnomalies = (checkType?: any): FraudDetectionAction => {
  return {
    type: FRAUD_DETECTION_TYPES.CLEAR_FRAUD_ANOMALIES,
    payload: { checkType },
  };
};

/**
 * Add manual fraud alert (for testing or manual reporting)
 */
export const addManualFraudAlert = (
  message: string,
  severity: 'warning' | 'error' | 'critical' = 'warning'
): FraudDetectionAction => {
  return {
    type: FRAUD_DETECTION_TYPES.ADD_FRAUD_ALERT,
    payload: {
      alert: {
        id: `manual_${Date.now()}`,
        type: severity,
        message,
        timestamp: new Date().toISOString(),
        checkType: 'manual',
        riskLevel: severity === 'critical' ? 100 : severity === 'error' ? 75 : 50,
      },
    },
  };
};

/**
 * Schedule periodic fraud detection
 */
export const schedulePeriodicFraudCheck = (intervalMinutes: number = 60) => {
  return (dispatch: Dispatch<FraudDetectionAction>, getState: () => RootState) => {
    const runPeriodicCheck = async () => {
      const state = getState();
      const { historicalData } = state.data;
      
      if (historicalData && historicalData.length > 0) {
        const latestReading = historicalData[historicalData.length - 1];
        await dispatch(runFraudDetection(latestReading) as any);
      }
    };

    // Run initial check
    runPeriodicCheck();

    // Schedule periodic checks
    const intervalId = setInterval(runPeriodicCheck, intervalMinutes * 60 * 1000);

    // Return cleanup function
    return () => clearInterval(intervalId);
  };
};

/**
 * Analyze historical data for fraud patterns
 */
export const analyzeHistoricalFraudPatterns = () => {
  return async (dispatch: Dispatch<FraudDetectionAction>, getState: () => RootState) => {
    try {
      const state = getState();
      const { historicalData } = state.data;
      const { activeProfile } = state.vehicle;

      if (!historicalData || historicalData.length < 5 || !activeProfile) {
        return;
      }

      // Run fraud detection on multiple historical points
      const analysisPromises = historicalData
        .slice(-10) // Analyze last 10 readings
        .map(reading => 
          fraudDetectionService.runFraudDetection(
            reading,
            historicalData.slice(0, historicalData.indexOf(reading)),
            activeProfile
          )
        );

      const results = await Promise.all(analysisPromises);

      // Aggregate results
      const aggregatedAnomalies = results.flatMap(result => 
        Object.values(result.checkResults).flatMap(check => check.anomalies)
      );

      const highRiskReadings = results.filter(result => result.status === 'high_risk').length;
      const averageRiskScore = results.reduce((sum, result) => sum + result.riskScore, 0) / results.length;

      // Dispatch summary alert if concerning patterns found
      if (highRiskReadings > 2 || averageRiskScore > 50) {
        dispatch({
          type: FRAUD_DETECTION_TYPES.ADD_FRAUD_ALERT,
          payload: {
            alert: {
              id: `historical_analysis_${Date.now()}`,
              type: 'warning' as const,
              message: `Historical analysis detected ${aggregatedAnomalies.length} anomalies across ${results.length} readings`,
              timestamp: new Date().toISOString(),
              checkType: 'historical_analysis',
              riskLevel: Math.round(averageRiskScore),
            },
          },
        });
      }

      return {
        totalReadingsAnalyzed: results.length,
        totalAnomalies: aggregatedAnomalies.length,
        highRiskReadings,
        averageRiskScore,
        anomaliesByType: groupAnomaliesByType(aggregatedAnomalies),
      };

    } catch (error: any) {
      console.error('Historical fraud analysis failed:', error);
      throw error;
    }
  };
};

/**
 * Export fraud detection report
 */
export const exportFraudDetectionReport = () => {
  return (dispatch: Dispatch<FraudDetectionAction>, getState: () => RootState) => {
    const state = getState();
    const { fraudDetection } = state.vehicle;
    const { historicalData } = state.data;

    const report = {
      timestamp: new Date().toISOString(),
      overallStatus: fraudDetection.overallStatus,
      riskScore: fraudDetection.riskScore,
      alerts: fraudDetection.alerts,
      checks: fraudDetection.checks,
      dataPointsAnalyzed: historicalData?.length || 0,
      lastCheck: fraudDetection.lastCheck,
    };

    // Convert to JSON and trigger download (React Native compatible)
    try {
      // For React Native, we would use a different approach
      // This is a placeholder that could be adapted for actual file system access
      console.log('Fraud Detection Report:', JSON.stringify(report, null, 2));
      
      // In a real React Native app, you might use:
      // - react-native-fs to write to device storage
      // - react-native-share to share the report
      // - expo-sharing if using Expo
      
      return report;
    } catch (error) {
      console.error('Error exporting fraud detection report:', error);
      dispatch({
        type: FRAUD_DETECTION_TYPES.ADD_FRAUD_ALERT,
        payload: {
          alert: {
            id: `export_error_${Date.now()}`,
            type: 'error',
            message: 'Failed to export fraud detection report',
            timestamp: new Date().toISOString(),
            checkType: 'system',
            riskLevel: 25,
          },
        },
      });
      throw error;
    }
  };
};

// Helper function to group anomalies by type
function groupAnomaliesByType(anomalies: any[]) {
  return anomalies.reduce((groups, anomaly) => {
    const type = anomaly.type;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(anomaly);
    return groups;
  }, {} as Record<string, any[]>);
}