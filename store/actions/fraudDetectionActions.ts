/**
 * fraudDetectionActions.ts
 * Redux action creators for odometer fraud detection
 */

import { Dispatch } from 'redux';
import OdometerFraudDetectionService from '../../services/fraud/OdometerFraudDetectionService';
import DatabaseService from '../../services/database/DatabaseService';
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

// Use fraud detection service singleton
const fraudDetectionService = OdometerFraudDetectionService;

// Real-time fraud detection flag
let isRealTimeFraudDetectionActive = false;

/**
 * Run comprehensive fraud detection check
 */
export const runFraudDetection = (currentReading: OdometerReading) => {
  return async (dispatch: Dispatch<FraudDetectionAction>, getState: () => RootState) => {
    try {
      const state = getState();
      // Try to get active vehicle profile from different possible locations
      // Note: activeVehicle is typically just an ID, activeProfile would be the full object
      const activeProfile = state.vehicle?.activeProfile;
      const { historicalData } = state.data;

      // Fraud detection can work without a vehicle profile, but it's helpful for context
      let vehicleProfile = activeProfile;
      if (!vehicleProfile) {
        console.log('No active vehicle profile found, fraud detection will proceed with default profile');
        // Use a basic default profile for fraud detection context
        vehicleProfile = {
          id: '1',
          name: 'Default Vehicle',
          make: 'Unknown',
          model: 'Unknown',
          year: 2020,
          odometer: 10000,
          createdAt: new Date().toISOString(),
        };
      }

      // Dispatch start action
      dispatch({
        type: FRAUD_DETECTION_TYPES.RUN_FRAUD_CHECK,
      });

      // Run fraud detection
      const results = await fraudDetectionService.runFraudDetection(
        currentReading,
        historicalData || [],
        vehicleProfile
      );

      // Save results to database (optional, don't fail if database issues)
      try {
        await DatabaseService.saveFraudDetectionResult({
          odometerReading: currentReading.odometer || currentReading.mileage || 0,
          riskScore: results.riskScore,
          overallStatus: results.status,
          checkResults: results.checkResults,
          dataSource: currentReading.source || 'unknown'
        });
        console.log('✅ Fraud detection result saved to database');
      } catch (dbError) {
        console.warn('⚠️ Failed to save fraud detection result to database:', dbError);
        // Continue execution even if database save fails - fraud detection should still work
      }

      // Dispatch completion action
      dispatch({
        type: FRAUD_DETECTION_TYPES.FRAUD_CHECK_COMPLETE,
        payload: {
          riskScore: results.riskScore,
          status: results.status,
          checkResults: results.checkResults,
          lastCheck: new Date().toISOString(),
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
      Object.entries(results.checkResults).forEach(([checkType, result]: [string, any]) => {
        result.anomalies.forEach((anomaly: any) => {
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
 * Handle real-time fraud detection results from OBD service
 */
export const handleRealTimeFraudResult = (fraudData: {
  result: any;
  reading: OdometerReading;
  timestamp: string;
  source: string;
}) => {
  return (dispatch: Dispatch<FraudDetectionAction>) => {
    console.log('📊 Processing real-time fraud detection result:', fraudData);
    console.log('📊 About to dispatch FRAUD_CHECK_COMPLETE with riskScore:', fraudData.result.overallRiskScore);

    try {
      // Validate fraudData structure
      if (!fraudData || !fraudData.result || typeof fraudData.result !== 'object') {
        console.error('❌ Invalid fraud data structure:', fraudData);
        return;
      }
      // Dispatch the fraud check result
      console.log('🚀 Dispatching FRAUD_CHECK_COMPLETE action...');
      dispatch({
        type: FRAUD_DETECTION_TYPES.FRAUD_CHECK_COMPLETE,
        payload: {
          riskScore: fraudData.result.overallRiskScore,
          status: fraudData.result.status,
          checkResults: fraudData.result.checkResults,
          source: 'realtime',
          timestamp: fraudData.timestamp
        },
      });
      console.log('✅ FRAUD_CHECK_COMPLETE action dispatched');

      // Process any anomalies found
      if (fraudData.result.checkResults) {
        try {
          Object.entries(fraudData.result.checkResults).forEach(([checkType, result]: [string, any]) => {
          if (result && result.anomalies && Array.isArray(result.anomalies) && result.anomalies.length > 0) {
            result.anomalies.forEach((anomaly: any) => {
              // Skip processing if anomaly is null/undefined
              if (!anomaly || typeof anomaly !== 'object') {
                console.warn('⚠️ Skipping invalid anomaly:', anomaly);
                return;
              }

              // Create alert for significant anomalies
              if (anomaly.severity === 'high' || anomaly.severity === 'critical') {
                try {
                  dispatch({
                    type: FRAUD_DETECTION_TYPES.ADD_FRAUD_ALERT,
                    payload: {
                      alert: {
                        id: `realtime_${anomaly.id || Date.now()}`,
                        type: anomaly.severity === 'critical' ? 'critical' : 'error',
                        message: `Real-time detection: ${anomaly.description || 'Unknown anomaly'}`,
                        timestamp: fraudData.timestamp,
                        checkType: checkType,
                        riskLevel: anomaly.severity === 'critical' ? 100 : 75,
                      },
                    },
                  });
                } catch (alertError: any) {
                  console.error('❌ Error creating fraud alert:', alertError);
                  console.error('❌ Alert data:', anomaly);
                }
              }

              // Log the anomaly with safety checks
              try {
                const safeAnomalyData = (anomaly.data && typeof anomaly.data === 'object') ? anomaly.data : {};
                dispatch({
                  type: FRAUD_DETECTION_TYPES.ODOMETER_ANOMALY_DETECTED,
                  payload: {
                    checkType: checkType as any,
                    anomaly: {
                      id: anomaly.id || `unknown_${Date.now()}`,
                      type: anomaly.type || 'unknown',
                      description: anomaly.description || 'Unknown anomaly',
                      severity: anomaly.severity || 'low',
                      timestamp: anomaly.timestamp || fraudData.timestamp,
                      data: safeAnomalyData,
                      source: 'realtime'
                    },
                  },
                });
              } catch (anomalyError: any) {
                console.error('❌ Error creating anomaly payload:', anomalyError);
                console.error('❌ Anomaly data:', anomaly);
              }
            });
          }
          });
        } catch (checkResultsError: any) {
          console.error('❌ Error processing check results:', checkResultsError);
          console.error('❌ CheckResults data:', fraudData.result.checkResults);
        }
      }

      // If this is a high-risk detection, create urgent alert
      if (fraudData.result.status === 'high_risk') {
        dispatch({
          type: FRAUD_DETECTION_TYPES.ADD_FRAUD_ALERT,
          payload: {
            alert: {
              id: `urgent_${Date.now()}`,
              type: 'critical',
              message: `URGENT: High-risk fraud pattern detected in real-time (Risk Score: ${fraudData.result.overallRiskScore})`,
              timestamp: fraudData.timestamp,
              checkType: 'realtime_urgent',
              riskLevel: fraudData.result.overallRiskScore,
            },
          },
        });
      }

    } catch (error: any) {
      console.error('❌ Error processing real-time fraud result:', error);
      
      dispatch({
        type: FRAUD_DETECTION_TYPES.ADD_FRAUD_ALERT,
        payload: {
          alert: {
            id: `processing_error_${Date.now()}`,
            type: 'error',
            message: `Real-time fraud processing failed: ${error.message}`,
            timestamp: new Date().toISOString(),
            checkType: 'system',
            riskLevel: 25,
          },
        },
      });
    }
  };
};

/**
 * Initialize real-time fraud detection monitoring
 */
export const initializeRealTimeFraudDetection = (obdService: any) => {
  return (dispatch: Dispatch<FraudDetectionAction>) => {
    if (isRealTimeFraudDetectionActive) {
      console.log('⚠️ Real-time fraud detection already active');
      // Return a no-op cleanup function instead of undefined
      return () => {
        console.log('🔄 No-op cleanup - fraud detection was already active');
      };
    }

    console.log('🚀 Initializing real-time fraud detection');
    console.log('📋 OBD Service received:', !!obdService);
    console.log('📋 OBD Service subscribe method:', !!obdService?.subscribe);

    try {
      // Subscribe to real-time fraud alerts from OBD service
      const unsubscribe = obdService.subscribe((eventType: string, data: any) => {
        console.log('🔔 Redux received OBD event:', eventType);
        if (eventType === 'realtimeFraudAlert') {
          console.log('📊 Processing real-time fraud detection result:', data);
          console.log('📊 Risk Score from event:', data?.result?.overallRiskScore);
          console.log('📊 Status from event:', data?.result?.status);
          (handleRealTimeFraudResult(data) as any)(dispatch);
        }
      });

      isRealTimeFraudDetectionActive = true;

      // Dispatch initialization success
      dispatch({
        type: FRAUD_DETECTION_TYPES.UPDATE_FRAUD_SETTINGS,
        payload: {
          settings: {
            realTimeMonitoring: true,
            lastInitialized: new Date().toISOString()
          }
        },
      });

      console.log('✅ Real-time fraud detection initialized successfully');

      // Return cleanup function
      return () => {
        if (unsubscribe && typeof unsubscribe === 'function') {
          unsubscribe();
        }
        isRealTimeFraudDetectionActive = false;
        
        dispatch({
          type: FRAUD_DETECTION_TYPES.UPDATE_FRAUD_SETTINGS,
          payload: {
            settings: {
              realTimeMonitoring: false,
              lastStopped: new Date().toISOString()
            }
          },
        });
      };

    } catch (error: any) {
      console.error('❌ Failed to initialize real-time fraud detection:', error);
      
      dispatch({
        type: FRAUD_DETECTION_TYPES.ADD_FRAUD_ALERT,
        payload: {
          alert: {
            id: `init_error_${Date.now()}`,
            type: 'error',
            message: `Failed to initialize real-time fraud detection: ${error.message}`,
            timestamp: new Date().toISOString(),
            checkType: 'system',
            riskLevel: 50,
          },
        },
      });
      
      // Return a no-op cleanup function even if initialization failed
      return () => {
        console.log('🔄 No-op cleanup - initialization failed');
      };
    }
  };
};

/**
 * Stop real-time fraud detection monitoring
 */
export const stopRealTimeFraudDetection = () => {
  return (dispatch: Dispatch<FraudDetectionAction>) => {
    console.log('🛑 Stopping real-time fraud detection');

    try {
      // Disable real-time monitoring in the service
      fraudDetectionService.disableRealTimeMonitoring();
      
      isRealTimeFraudDetectionActive = false;

      dispatch({
        type: FRAUD_DETECTION_TYPES.UPDATE_FRAUD_SETTINGS,
        payload: {
          settings: {
            realTimeMonitoring: false,
            lastStopped: new Date().toISOString()
          }
        },
      });

      console.log('✅ Real-time fraud detection stopped');

    } catch (error: any) {
      console.error('❌ Error stopping real-time fraud detection:', error);
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
        Object.values(result.checkResults).flatMap((check: any) => check.anomalies)
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