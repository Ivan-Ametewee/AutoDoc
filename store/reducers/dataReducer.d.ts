export interface HistoricalSession {
    id: string | null;
    startTime: string | null;
    endTime: string;
    duration: number;
    dataPoints: number;
    calculatedValues: any;
}

export interface DataState {
    liveData: any;
    isCollectingData: boolean;
    dataCollectionInterval: number;
    lastDataUpdate: string | null;
    dataPoints: any[];
    maxDataPoints: number;
    sessionData: any[];
    historicalSessions: HistoricalSession[];
    currentSessionId: string | null;
    sessionStartTime: string | null;
    sessionDuration: number;
    dtcCodes: any[];
    pendingDtcCodes: any[];
    permanentDtcCodes: any[];
    dtcCount: number;
    milStatus: boolean;
    freezeFrameData: any[];
    readinessTests: any;
    calculatedValues?: any;
    [key: string]: any;
}
