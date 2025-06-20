import { createAction } from '@reduxjs/toolkit';

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
}

export const updateRealTimeData = createAction<VehicleData>('data/updateRealTimeData');