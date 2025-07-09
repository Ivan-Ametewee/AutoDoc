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
    lastUpdate: Date;
}

export interface PIDDataPayload {
    pidData: ParsedPIDData;
    vehicleData: Partial<VehicleData>;
}

export const updateRealTimeData = createAction<VehicleData>('data/updateRealTimeData');
export const updatePIDData = createAction<PIDDataPayload>('data/updatePIDData');

// Utility function to map PID data to VehicleData format
export function mapPIDToVehicleData(pidData: ParsedPIDData): Partial<VehicleData> {
    const result: Partial<VehicleData> = {
        lastUpdate: pidData.timestamp
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
        case 'ODOMETER':
        case 'odometer':
            result.odometer = typeof pidData.value === 'number' ? pidData.value : 0;
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
            break;
        case 'TRIP_DISTANCE':
        case 'tripDistance':
            result.tripOdometer = typeof pidData.value === 'number' ? pidData.value : 0;
            break;
        default:
            console.log(`Unmapped PID: ${pidData.name} = ${pidData.value}`);
            break;
    }

    return result;
}