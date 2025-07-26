export interface VehicleInfo {
    id: string | null;
    name: string;
    nickname: string;
    vin: string;
    make: string;
    model: string;
    year: number | null;
    trim: string;
    color: string;
    licensePlate: string;
    engine: any;
    transmission: any;
    specifications: any;
    obdInfo: any;
    maintenance: any;
    serviceHistory: any[];
    customSettings: any;
    statistics: any;
    notes?: string;
}

export interface VehicleState {
    activeVehicle: string | null;
    activeProfile?: VehicleInfo | null;
    vehicles: VehicleInfo[];
    defaultVehicleInfo: VehicleInfo;
    loading?: any;
    currentVehicle?: VehicleInfo | null;
    fraudDetection?: any;
}
