// store/actions/dataActions.ts

import { createAction } from '@reduxjs/toolkit';
import { ParsedPIDData } from '../../services/obdii/OBDIIParser';

export interface VehicleData {
    speed: number;
    rpm: number;
    engineTemp: number;
    fuelLevel: number;
    throttlePosition: number;
    engineLoad: number;
    maf: number;
    o2Voltage: number;
    timing: number;
    intakeAirTemp: number;
    intakeManifoldPressure: number;
    odometer?: number;
    tripOdometer?: number;
    engineHours?: number;
    distanceSinceCodesCleared?: number; // NEW: For fraud detection
    distanceWithMILOn?: number; // NEW: For fraud detection
    runtimeSinceEngineStart?: number; // NEW: For fraud detection
    lastUpdate: Date | string;
}

// Type for PID data with serialized timestamp (for Redux)
export type SerializedPIDData = Omit<ParsedPIDData, 'timestamp'> & { timestamp: string };

export interface PIDDataPayload {
    pidData: ParsedPIDData | SerializedPIDData;
    vehicleData: Partial<VehicleData>;
}

export const updateRealTimeData = createAction<VehicleData>('data/updateRealTimeData');
export const updatePIDData = createAction<PIDDataPayload>('data/updatePIDData');

// Utility function to map PID data to VehicleData format
export function mapPIDToVehicleData(pidData: ParsedPIDData): Partial<VehicleData> {
    const result: Partial<VehicleData> = {
        lastUpdate: pidData.timestamp instanceof Date ? pidData.timestamp.toISOString() : String(pidData.timestamp)
    };

    // Map PID names to VehicleData properties
    switch (pidData.name) {
        case 'VEHICLE_SPEED':
            result.speed = typeof pidData.value === 'number' ? pidData.value : 0;
            break;
        case 'ENGINE_RPM':
            result.rpm = typeof pidData.value === 'number' ? pidData.value : 0;
            break;
        case 'ENGINE_COOLANT_TEMP':
            result.engineTemp = typeof pidData.value === 'number' ? pidData.value : 0;
            break;
        case 'FUEL_LEVEL':
            result.fuelLevel = typeof pidData.value === 'number' ? pidData.value : 0;
            break;
        case 'THROTTLE_POSITION':
            result.throttlePosition = typeof pidData.value === 'number' ? pidData.value : 0;
            break;
        case 'ENGINE_LOAD':
            result.engineLoad = typeof pidData.value === 'number' ? pidData.value : 0;
            break;
        case 'MAF_RATE':
            result.maf = typeof pidData.value === 'number' ? pidData.value : 0;
            break;
        case 'O2_SENSOR_1':
            result.o2Voltage = typeof pidData.value === 'number' ? pidData.value : 0;
            break;
        case 'TIMING_ADVANCE':
            result.timing = typeof pidData.value === 'number' ? pidData.value : 0;
            break;
        case 'INTAKE_AIR_TEMP':
            result.intakeAirTemp = typeof pidData.value === 'number' ? pidData.value : 0;
            break;
        case 'INTAKE_MANIFOLD_PRESSURE':
            result.intakeManifoldPressure = typeof pidData.value === 'number' ? pidData.value : 0;
            break;
            
        // === ODOMETER READINGS (Multiple sources) ===
        case 'ODOMETER_TOYOTA':
        case 'ODOMETER_HONDA':
        case 'ODOMETER_FORD':
        case 'ODOMETER_STANDARD':
        case 'ODOMETER':
        case 'odometer':
        case 'TOTAL_DISTANCE':
        case 'TOTAL_DISTANCE_TRAVELED':
        case 'VEHICLE_ODOMETER':
            result.odometer = typeof pidData.value === 'number' ? pidData.value : 0;
            console.log(`🚗 Odometer reading received: ${result.odometer} km from ${pidData.name}`);
            break;
            
        case 'TRIP_ODOMETER':
        case 'tripOdometer':
            result.tripOdometer = typeof pidData.value === 'number' ? pidData.value : 0;
            break;
        case 'ENGINE_HOURS':
        case 'engineHours':
            result.engineHours = typeof pidData.value === 'number' ? pidData.value : 0;
            break;
        case 'TOTAL_DISTANCE':
        case 'totalDistance':
            result.odometer = typeof pidData.value === 'number' ? pidData.value : 0;
            console.log(`🚗 Total distance reading: ${result.odometer} km`);
            break;
        case 'TRIP_DISTANCE':
        case 'tripDistance':
            result.tripOdometer = typeof pidData.value === 'number' ? pidData.value : 0;
            break;
            
        // === FRAUD DETECTION DATA ===
        case 'DISTANCE_SINCE_CODES_CLEARED':
            result.distanceSinceCodesCleared = typeof pidData.value === 'number' ? pidData.value : 0;
            console.log(`📊 Distance since codes cleared: ${result.distanceSinceCodesCleared} km`);
            break;
        case 'DISTANCE_WITH_MIL_ON':
            result.distanceWithMILOn = typeof pidData.value === 'number' ? pidData.value : 0;
            console.log(`⚠️ Distance with MIL on: ${result.distanceWithMILOn} km`);
            break;
        case 'RUNTIME_SINCE_ENGINE_START':
            result.runtimeSinceEngineStart = typeof pidData.value === 'number' ? pidData.value : 0;
            // Convert seconds to hours for easier fraud detection calculations
            result.engineHours = result.runtimeSinceEngineStart / 3600;
            console.log(`⏱️ Runtime since engine start: ${result.runtimeSinceEngineStart} seconds (${result.engineHours?.toFixed(2)} hours)`);
            break;
            
        default:
            console.log(`⚠️ Unmapped PID: ${pidData.name} = ${pidData.value} ${pidData.unit || ''}`);
            break;
    }

    return result;
}

/**
 * Create an odometer reading object for fraud detection
 */
export function createOdometerReading(vehicleData: Partial<VehicleData>, source: 'obd' | 'manual' | 'service_record' = 'obd') {
    return {
        odometer: vehicleData.odometer,
        mileage: vehicleData.odometer, // Use odometer as mileage for compatibility
        timestamp: new Date().toISOString(),
        source,
        vehicleSpeed: vehicleData.speed,
        engineHours: vehicleData.engineHours,
        fuelLevel: vehicleData.fuelLevel,
        engineRPM: vehicleData.rpm,
        distanceSinceCodesCleared: vehicleData.distanceSinceCodesCleared,
        distanceWithMILOn: vehicleData.distanceWithMILOn,
        runtimeSinceEngineStart: vehicleData.runtimeSinceEngineStart,
    };
}

/**
 * Check if vehicle data contains odometer information
 */
export function hasOdometerData(vehicleData: Partial<VehicleData>): boolean {
    return vehicleData.odometer !== undefined && 
           vehicleData.odometer !== null && 
           vehicleData.odometer > 0;
}

/**
 * Check if vehicle data contains fraud detection supporting data
 */
export function hasFraudDetectionData(vehicleData: Partial<VehicleData>): boolean {
    return hasOdometerData(vehicleData) || 
           vehicleData.distanceSinceCodesCleared !== undefined ||
           vehicleData.distanceWithMILOn !== undefined ||
           vehicleData.engineHours !== undefined;
}