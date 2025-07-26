/**
 * fraudValidators.ts
 * Validation utilities specifically for fraud detection
 * Extends the existing validators.ts with fraud-specific validations
 */

interface ValidationResult {
  isValid: boolean;
  error?: string;
  cleanValue?: any;
  fraudRisk?: 'low' | 'medium' | 'high' | 'critical';
  warnings?: string[];
}

interface OdometerReading {
  odometer?: number;
  mileage?: number;
  timestamp: string;
  source: 'obd' | 'manual' | 'service_record';
  vehicleSpeed?: number;
  engineHours?: number;
}

/**
 * Validate odometer reading against fraud indicators
 */
export const validateOdometerWithFraudCheck = (
  currentReading: number,
  previousReading: number | null,
  timeBetweenReadings: number, // in days
  vehicleAge: number // in years
): ValidationResult => {
  const warnings: string[] = [];
  let fraudRisk: 'low' | 'medium' | 'high' | 'critical' = 'low';

  // Basic validation
  if (!currentReading || currentReading < 0) {
    return { isValid: false, error: 'Invalid odometer reading' };
  }

  if (currentReading > 999999) {
    return { isValid: false, error: 'Odometer reading exceeds maximum limit' };
  }

  // Fraud-specific validations
  if (previousReading !== null) {
    // Check for rollback
    if (currentReading < previousReading) {
      const difference = previousReading - currentReading;
      
      if (difference > 10000) {
        fraudRisk = 'critical';
        warnings.push(`Major odometer rollback detected: ${difference} units`);
      } else if (difference > 1000) {
        fraudRisk = 'high';
        warnings.push(`Significant odometer rollback: ${difference} units`);
      } else {
        fraudRisk = 'medium';
        warnings.push(`Minor odometer rollback: ${difference} units`);
      }
    }

    // Check for unrealistic increases
    if (timeBetweenReadings > 0) {
      const dailyIncrease = (currentReading - previousReading) / timeBetweenReadings;
      
      if (dailyIncrease > 1000) {
        fraudRisk = 'critical';
        warnings.push(`Unrealistic daily mileage: ${dailyIncrease.toFixed(0)} miles/day`);
      } else if (dailyIncrease > 500) {
        fraudRisk = 'high';
        warnings.push(`Very high daily mileage: ${dailyIncrease.toFixed(0)} miles/day`);
      } else if (dailyIncrease > 300) {
        fraudRisk = 'medium';
        warnings.push(`High daily mileage: ${dailyIncrease.toFixed(0)} miles/day`);
      }
    }
  }

  // Check against vehicle age expectations
  const expectedMaxMileage = vehicleAge * 15000; // 15k miles/year average
  const expectedMinMileage = vehicleAge * 5000;  // 5k miles/year minimum

  if (currentReading > expectedMaxMileage * 2) {
    fraudRisk = Math.max(fraudRisk === 'low' ? 1 : fraudRisk === 'medium' ? 2 : fraudRisk === 'high' ? 3 : 4, 3) === 3 ? 'high' : 'critical';
    warnings.push(`Extremely high mileage for vehicle age`);
  } else if (currentReading < expectedMinMileage && vehicleAge > 2) {
    fraudRisk = Math.max(fraudRisk === 'low' ? 1 : fraudRisk === 'medium' ? 2 : 3, 2) === 2 ? 'medium' : 'high';
    warnings.push(`Unusually low mileage for vehicle age`);
  }

  // Round number detection (often indicates tampering)
  if (currentReading % 1000 === 0 && currentReading > 10000) {
    if (fraudRisk === 'low') fraudRisk = 'medium';
    warnings.push(`Odometer reading is a round number (${currentReading})`);
  }

  return {
    isValid: true,
    cleanValue: currentReading,
    fraudRisk,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
};

/**
 * Validate VIN against known fraud databases (mock implementation)
 */
export const validateVINForFraud = async (vin: string): Promise<ValidationResult> => {
  // Basic VIN validation first
  const basicValidation = validateVIN(vin);
  if (!basicValidation.isValid) {
    return basicValidation;
  }

  const cleanVIN = basicValidation.cleanValue as string;
  const warnings: string[] = [];
  let fraudRisk: 'low' | 'medium' | 'high' | 'critical' = 'low';

  try {
    // Mock fraud database check (in real implementation, this would call external APIs)
    const fraudCheck = await mockVINFraudCheck(cleanVIN);
    
    if (fraudCheck.isStolen) {
      fraudRisk = 'critical';
      warnings.push('VIN matches stolen vehicle database');
    }
    
    if (fraudCheck.hasMultipleTitles) {
      fraudRisk = 'high';
      warnings.push('Multiple title transfers detected');
    }
    
    if (fraudCheck.salvageHistory) {
      if (fraudRisk === 'low') fraudRisk = 'medium';
      warnings.push('Vehicle has salvage history');
    }

    if (fraudCheck.odometerDiscrepancies > 0) {
      if (fraudRisk === 'low') fraudRisk = 'medium';
      warnings.push(`${fraudCheck.odometerDiscrepancies} odometer discrepancies found in history`);
    }

  } catch (error) {
    warnings.push('Unable to verify VIN against fraud databases');
  }

  return {
    isValid: true,
    cleanValue: cleanVIN,
    fraudRisk,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
};

/**
 * Validate engine hours against odometer reading
 */
export const validateEngineHoursCorrelation = (
  engineHours: number,
  odometerReading: number,
  vehicleType: 'passenger' | 'commercial' | 'heavy_duty' = 'passenger'
): ValidationResult => {
  const warnings: string[] = [];
  let fraudRisk: 'low' | 'medium' | 'high' | 'critical' = 'low';

  if (engineHours <= 0 || odometerReading <= 0) {
    return { isValid: false, error: 'Invalid engine hours or odometer reading' };
  }

  // Calculate expected correlations based on vehicle type
  const expectedSpeedRanges = {
    passenger: { min: 25, max: 35 }, // mph average
    commercial: { min: 30, max: 45 },
    heavy_duty: { min: 35, max: 50 },
  };

  const range = expectedSpeedRanges[vehicleType];
  const actualAvgSpeed = odometerReading / engineHours;

  if (actualAvgSpeed < range.min * 0.5) {
    fraudRisk = 'high';
    warnings.push(`Extremely low average speed indicates potential odometer tampering`);
  } else if (actualAvgSpeed < range.min * 0.7) {
    fraudRisk = 'medium';
    warnings.push(`Low average speed may indicate odometer issues`);
  }

  if (actualAvgSpeed > range.max * 2) {
    fraudRisk = 'critical';
    warnings.push(`Impossibly high average speed indicates engine hour tampering`);
  } else if (actualAvgSpeed > range.max * 1.5) {
    fraudRisk = 'high';
    warnings.push(`Very high average speed raises concerns about data accuracy`);
  }

  return {
    isValid: true,
    cleanValue: { engineHours, odometerReading, calculatedAvgSpeed: actualAvgSpeed },
    fraudRisk,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
};

/**
 * Validate service record consistency
 */
export const validateServiceRecordConsistency = (
  serviceRecords: Array<{
    date: string;
    mileage: number;
    serviceType: string;
    provider: string;
  }>
): ValidationResult => {
  const warnings: string[] = [];
  let fraudRisk: 'low' | 'medium' | 'high' | 'critical' = 'low';

  if (serviceRecords.length < 2) {
    return {
      isValid: true,
      cleanValue: serviceRecords,
      fraudRisk: 'low',
    };
  }

  // Sort records by date
  const sortedRecords = serviceRecords.sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  for (let i = 1; i < sortedRecords.length; i++) {
    const prev = sortedRecords[i - 1];
    const curr = sortedRecords[i];

    // Check for mileage rollback
    if (curr.mileage < prev.mileage) {
      const difference = prev.mileage - curr.mileage;
      
      if (difference > 5000) {
        fraudRisk = 'critical';
        warnings.push(`Major mileage rollback in service records: ${difference} miles`);
      } else {
        fraudRisk = 'high';
        warnings.push(`Mileage rollback in service records: ${difference} miles`);
      }
    }

    // Check for unrealistic mileage increases
    const daysBetween = (new Date(curr.date).getTime() - new Date(prev.date).getTime()) / (1000 * 60 * 60 * 24);
    if (daysBetween > 0) {
      const dailyMileage = (curr.mileage - prev.mileage) / daysBetween;
      
      if (dailyMileage > 500) {
        fraudRisk = 'high';
        warnings.push(`Unrealistic daily mileage between service records: ${dailyMileage.toFixed(0)} miles/day`);
      }
    }
  }

  // Check for duplicate mileage entries (suspicious)
  const mileageValues = sortedRecords.map(r => r.mileage);
  const duplicates = mileageValues.filter((value, index) => mileageValues.indexOf(value) !== index);
  
  if (duplicates.length > 0) {
    if (fraudRisk === 'low') fraudRisk = 'medium';
    warnings.push(`Duplicate mileage entries found in service records`);
  }

  return {
    isValid: true,
    cleanValue: sortedRecords,
    fraudRisk,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
};

/**
 * Mock VIN fraud check (replace with real API calls)
 */
async function mockVINFraudCheck(vin: string): Promise<{
  isStolen: boolean;
  hasMultipleTitles: boolean;
  salvageHistory: boolean;
  odometerDiscrepancies: number;
}> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Mock response based on VIN characteristics
  return {
    isStolen: false,
    hasMultipleTitles: vin.includes('1') && vin.includes('2'), // Mock logic
    salvageHistory: vin.endsWith('0'),
    odometerDiscrepancies: Math.floor(Math.random() * 3),
  };
}

/**
 * Import existing VIN validator (assuming it exists in validators.ts)
 */
function validateVIN(vin: string): ValidationResult {
  if (!vin) return { isValid: false, error: 'VIN is required' };
  
  const cleanVIN = vin.replace(/\s/g, '').toUpperCase();
  
  if (cleanVIN.length !== 17) {
    return { isValid: false, error: 'VIN must be exactly 17 characters' };
  }
  
  const invalidChars = /[IOQ]/;
  if (invalidChars.test(cleanVIN)) {
    return { isValid: false, error: 'VIN cannot contain letters I, O, or Q' };
  }
  
  const validChars = /^[A-HJ-NPR-Z0-9]{17}$/;
  if (!validChars.test(cleanVIN)) {
    return { isValid: false, error: 'VIN contains invalid characters' };
  }
  
  return { isValid: true, cleanValue: cleanVIN };
}

/**
 * Comprehensive fraud risk assessment
 */
export const assessOverallFraudRisk = (
  odometerValidation: ValidationResult,
  vinValidation: ValidationResult,
  engineHoursValidation: ValidationResult,
  serviceRecordValidation: ValidationResult
): {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number; // 0-100
  summary: string;
  recommendations: string[];
} => {
  const validations = [odometerValidation, vinValidation, engineHoursValidation, serviceRecordValidation];
  const risks = validations.map(v => v.fraudRisk || 'low');
  
  // Calculate risk score
  const riskScores = risks.map(risk => {
    switch (risk) {
      case 'critical': return 100;
      case 'high': return 75;
      case 'medium': return 50;
      case 'low': return 25;
      default: return 0;
    }
  });
  
  const avgRiskScore = riskScores.reduce((sum: number, score: number) => sum + score, 0) / riskScores.length;
  
  // Determine overall risk
  const criticalCount = risks.filter(r => r === 'critical').length;
  const highCount = risks.filter(r => r === 'high').length;
  const mediumCount = risks.filter(r => r === 'medium').length;
  
  let overallRisk: 'low' | 'medium' | 'high' | 'critical';
  if (criticalCount > 0) {
    overallRisk = 'critical';
  } else if (highCount >= 2) {
    overallRisk = 'critical';
  } else if (highCount >= 1) {
    overallRisk = 'high';
  } else if (mediumCount >= 2) {
    overallRisk = 'high';
  } else if (mediumCount >= 1) {
    overallRisk = 'medium';
  } else {
    overallRisk = 'low';
  }
  
  // Generate summary and recommendations
  const allWarnings = validations.flatMap(v => v.warnings || []);
  const summary = `${allWarnings.length} potential fraud indicators detected. Overall risk: ${overallRisk.toUpperCase()}`;
  
  const recommendations: string[] = [];
  if (overallRisk === 'critical') {
    recommendations.push('URGENT: Do not proceed with transaction');
    recommendations.push('Contact law enforcement if vehicle theft is suspected');
    recommendations.push('Require professional inspection before any purchase');
  } else if (overallRisk === 'high') {
    recommendations.push('Require professional vehicle inspection');
    recommendations.push('Request additional documentation');
    recommendations.push('Consider third-party verification services');
  } else if (overallRisk === 'medium') {
    recommendations.push('Request service history documentation');
    recommendations.push('Consider professional odometer verification');
    recommendations.push('Negotiate price based on potential issues');
  } else {
    recommendations.push('Proceed with standard due diligence');
    recommendations.push('Continue regular monitoring');
  }
  
  return {
    overallRisk,
    riskScore: Math.round(avgRiskScore),
    summary,
    recommendations,
  };
};