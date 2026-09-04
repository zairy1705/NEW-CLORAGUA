import { TankDimensions, ChlorineProduct } from '../types';

export interface VolumeResult {
  totalVolumeM3: number;
  totalVolumeLiters: number;
  waterVolumeM3: number;
  waterVolumeLiters: number;
  fillPercentage: number;
  hasInconsistency: boolean;
  errorMessage?: string;
}

export function calculateTankVolume(dim: TankDimensions): VolumeResult {
  let totalM3 = 0;
  let waterM3 = 0;
  let hasInconsistency = false;
  let errorMessage: string | undefined;

  switch (dim.type) {
    case 'cylindrical_vertical': {
      const radius = dim.radiusMeters ?? (dim.diameterMeters ? dim.diameterMeters / 2 : 0);
      const totalH = dim.totalHeightMeters ?? 0;
      const waterH = dim.waterHeightMeters ?? 0;

      if (waterH > totalH && totalH > 0) {
        hasInconsistency = true;
        errorMessage = 'La altura actual del agua no puede ser mayor que la altura total del tanque.';
      }

      const crossSectionArea = Math.PI * Math.pow(radius, 2);
      totalM3 = crossSectionArea * totalH;
      waterM3 = crossSectionArea * Math.min(waterH, totalH > 0 ? totalH : waterH);
      break;
    }

    case 'rectangular_cistern': {
      const length = dim.lengthMeters ?? 0;
      const width = dim.widthMeters ?? 0;
      const totalH = dim.totalHeightMeters ?? 0;
      const waterH = dim.waterHeightMeters ?? 0;

      if (waterH > totalH && totalH > 0) {
        hasInconsistency = true;
        errorMessage = 'La altura actual del agua excede la altura total de la cisterna.';
      }

      totalM3 = length * width * totalH;
      waterM3 = length * width * Math.min(waterH, totalH > 0 ? totalH : waterH);
      break;
    }

    case 'cubic': {
      const side = dim.sideMeters ?? 0;
      const totalH = dim.totalHeightMeters && dim.totalHeightMeters > 0 ? dim.totalHeightMeters : side;
      const waterH = dim.waterHeightMeters && dim.waterHeightMeters > 0 ? dim.waterHeightMeters : totalH;

      if (waterH > totalH) {
        hasInconsistency = true;
        errorMessage = 'El nivel de agua excede la altura total del tanque cúbico.';
      }

      totalM3 = Math.pow(side, 2) * totalH;
      waterM3 = Math.pow(side, 2) * Math.min(waterH, totalH);
      break;
    }

    case 'cylindrical_horizontal': {
      const diam = dim.horizontalDiameterMeters ?? 0;
      const length = dim.horizontalLengthMeters ?? 0;
      const waterH = dim.horizontalWaterLevelMeters ?? 0;
      const R = diam / 2;

      if (waterH > diam && diam > 0) {
        hasInconsistency = true;
        errorMessage = 'El nivel de agua excede el diámetro del cilindro horizontal.';
      }

      const totalCrossArea = Math.PI * Math.pow(R, 2);
      totalM3 = totalCrossArea * length;

      if (diam <= 0 || length <= 0 || waterH <= 0) {
        waterM3 = 0;
      } else if (waterH >= diam) {
        waterM3 = totalM3;
      } else {
        // Exact circular segment calculation
        const h = Math.min(waterH, diam);
        if (h <= R) {
          const theta = 2 * Math.acos((R - h) / R);
          const segmentArea = 0.5 * Math.pow(R, 2) * (theta - Math.sin(theta));
          waterM3 = segmentArea * length;
        } else {
          const dryH = diam - h;
          const thetaDry = 2 * Math.acos((R - dryH) / R);
          const drySegmentArea = 0.5 * Math.pow(R, 2) * (thetaDry - Math.sin(thetaDry));
          waterM3 = (totalCrossArea - drySegmentArea) * length;
        }
      }
      break;
    }

    case 'direct_volume': {
      const val = dim.directValue ?? 0;
      if (dim.directUnit === 'm3') {
        waterM3 = val;
        totalM3 = val;
      } else {
        waterM3 = val / 1000;
        totalM3 = val / 1000;
      }
      break;
    }
  }

  const totalLiters = totalM3 * 1000;
  const waterLiters = waterM3 * 1000;
  const fillPercentage = totalLiters > 0 ? Math.min(100, Math.max(0, (waterLiters / totalLiters) * 100)) : 100;

  return {
    totalVolumeM3: Number(totalM3.toFixed(2)),
    totalVolumeLiters: Math.round(totalLiters),
    waterVolumeM3: Number(waterM3.toFixed(2)),
    waterVolumeLiters: Math.round(waterLiters),
    fillPercentage: Math.round(fillPercentage),
    hasInconsistency,
    errorMessage,
  };
}

export interface DosageResult {
  deltaClPpm: number;
  theoreticalDoseActiveMgL: number;
  pureChlorineGrams: number;
  productAmount: number;
  productUnit: 'mL' | 'L' | 'g' | 'kg';
  secondaryDisplay?: string;
  explanation: string;
  contactTimeMinutes: number;
}

export function calculateChlorineDosage(
  waterVolumeLiters: number,
  product: ChlorineProduct,
  currentResidualPpm: number,
  targetResidualPpm: number,
  chlorineDemandPpm: number = 0
): DosageResult {
  const safeCurrent = Math.max(0, currentResidualPpm);
  const safeTarget = Math.max(0, targetResidualPpm);
  const safeDemand = Math.max(0, chlorineDemandPpm);

  // Delta required: target - current + demand
  const netRequiredPpm = Math.max(0, safeTarget - safeCurrent + safeDemand);

  // Pure chlorine grams: (mg/L * L) / 1000
  const pureChlorineGrams = (netRequiredPpm * waterVolumeLiters) / 1000;

  const concDecimal = (product.concentrationPercent || 1) / 100;
  const concFactor = product.concentrationPercent * 10; // grams active per liter or kg

  let productAmount = 0;
  let productUnit: 'mL' | 'L' | 'g' | 'kg' = 'mL';
  let secondaryDisplay: string | undefined;

  if (product.form === 'liquid') {
    // mL of liquid solution = (pure grams / (concentration% * 10)) * 1000 mL
    const totalMl = (pureChlorineGrams / concFactor) * 1000;
    if (totalMl >= 1000) {
      productAmount = Number((totalMl / 1000).toFixed(2));
      productUnit = 'L';
      secondaryDisplay = `${Math.round(totalMl).toLocaleString('es-PE')} mL`;
    } else {
      productAmount = Number(totalMl.toFixed(1));
      productUnit = 'mL';
    }
  } else {
    // Granular or tablets in grams
    const totalGrams = pureChlorineGrams / concDecimal;
    if (totalGrams >= 1000) {
      productAmount = Number((totalGrams / 1000).toFixed(2));
      productUnit = 'kg';
      secondaryDisplay = `${Math.round(totalGrams).toLocaleString('es-PE')} g`;
    } else {
      productAmount = Number(totalGrams.toFixed(1));
      productUnit = 'g';
    }
  }

  const explanation = `Para elevar el cloro de ${safeCurrent.toFixed(2)} a ${safeTarget.toFixed(2)} mg/L (Δ = +${netRequiredPpm.toFixed(2)} mg/L${safeDemand > 0 ? ` incl. demanda de ${safeDemand.toFixed(2)} mg/L` : ''}) en ${waterVolumeLiters.toLocaleString('es-PE')} L con ${product.name} al ${product.concentrationPercent}%, se requieren ${pureChlorineGrams.toFixed(1)} g de Cloro Activo puro.`;

  return {
    deltaClPpm: Number(netRequiredPpm.toFixed(2)),
    theoreticalDoseActiveMgL: Number(netRequiredPpm.toFixed(2)),
    pureChlorineGrams: Number(pureChlorineGrams.toFixed(2)),
    productAmount,
    productUnit,
    secondaryDisplay,
    explanation,
    contactTimeMinutes: 30, // Default according to MINSA/DIGESA
  };
}

export interface AdvancedTechnicalResult {
  chlorineDoseMgL: number;
  productConsumptionPerHour: number;
  productConsumptionUnit: string;
  dosingFlowMlMin: number;
  dosingFlowMlHour: number;
  dosingFlowLHour: number;
  activeChlorineGramHour: number;
  ctValue: number; // Concentration * Time (mg*min/L)
  isCtCompliant: boolean;
}

export function calculateAdvancedTechnical(
  flowRateLps: number,
  targetDoseMgL: number,
  solutionConcentrationPercent: number,
  contactTimeMinutes: number,
  reservoirVolumeM3: number
): AdvancedTechnicalResult {
  const Q_Lps = Math.max(0.01, flowRateLps);
  const dose = Math.max(0.1, targetDoseMgL);
  const concGPerL = Math.max(0.1, solutionConcentrationPercent * 10); // 1% = 10 g/L

  // Active Chlorine required per hour: Q (L/s) * 3600 s/h * Dose (mg/L) / 1000 mg/g
  const activeChlorineGramHour = Q_Lps * 3.6 * dose;

  // Dosing solution flow rate:
  // (activeChlorineGramHour / concGPerL) in L/h
  const dosingFlowLHour = activeChlorineGramHour / concGPerL;
  const dosingFlowMlHour = dosingFlowLHour * 1000;
  const dosingFlowMlMin = dosingFlowMlHour / 60;

  // CT compliance (Concentration * Time). Standard CT for disinfection is >= 15 mg*min/L
  const ctValue = dose * contactTimeMinutes;
  const isCtCompliant = ctValue >= 15 && contactTimeMinutes >= 30;

  return {
    chlorineDoseMgL: Number(dose.toFixed(2)),
    productConsumptionPerHour: Number(dosingFlowLHour.toFixed(2)),
    productConsumptionUnit: 'L/h',
    dosingFlowMlMin: Number(dosingFlowMlMin.toFixed(2)),
    dosingFlowMlHour: Number(dosingFlowMlHour.toFixed(1)),
    dosingFlowLHour: Number(dosingFlowLHour.toFixed(3)),
    activeChlorineGramHour: Number(activeChlorineGramHour.toFixed(1)),
    ctValue: Number(ctValue.toFixed(1)),
    isCtCompliant,
  };
}

export interface DilutionResult {
  commercialProductVolumeMl: number;
  commercialProductVolumeL: number;
  waterVolumeL: number;
  finalVolumeL: number;
  explanation: string;
}

export function calculateDilution(
  initialConcPercent: number,
  targetConcPercent: number,
  finalVolumeL: number
): DilutionResult {
  if (targetConcPercent >= initialConcPercent || initialConcPercent <= 0) {
    return {
      commercialProductVolumeMl: 0,
      commercialProductVolumeL: 0,
      waterVolumeL: finalVolumeL,
      finalVolumeL,
      explanation: 'La concentración deseada debe ser menor que la concentración del producto comercial concentrado.',
    };
  }

  // C1 * V1 = C2 * V2 -> V1 = (C2 * V2) / C1
  const v1L = (targetConcPercent * finalVolumeL) / initialConcPercent;
  const vWaterL = Math.max(0, finalVolumeL - v1L);
  const v1Ml = v1L * 1000;

  return {
    commercialProductVolumeMl: Number(v1Ml.toFixed(1)),
    commercialProductVolumeL: Number(v1L.toFixed(3)),
    waterVolumeL: Number(vWaterL.toFixed(2)),
    finalVolumeL,
    explanation: `Para preparar ${finalVolumeL} L de solución al ${targetConcPercent}% a partir de cloro al ${initialConcPercent}%, agregue ${v1L >= 1 ? `${v1L.toFixed(2)} L` : `${Math.round(v1Ml)} mL`} de producto concentrado a ${vWaterL.toFixed(2)} L de agua limpia.`,
  };
}

export interface PumpCalibrationResult {
  theoreticalFlowMlMin: number;
  observedFlowMlMin: number;
  errorPercentage: number;
  isCalibrated: boolean;
  recommendation: string;
}

export function calculatePumpCalibration(
  theoreticalFlowMlMin: number,
  observedVolumeMl: number,
  timeSeconds: number
): PumpCalibrationResult {
  if (timeSeconds <= 0) {
    return {
      theoreticalFlowMlMin,
      observedFlowMlMin: 0,
      errorPercentage: 0,
      isCalibrated: false,
      recommendation: 'Ingrese un tiempo de prueba válido mayor a 0 segundos.',
    };
  }

  const observedFlowMlMin = (observedVolumeMl / timeSeconds) * 60;
  const error = theoreticalFlowMlMin > 0 ? ((observedFlowMlMin - theoreticalFlowMlMin) / theoreticalFlowMlMin) * 100 : 0;
  const absError = Math.abs(error);
  const isCalibrated = absError <= 5; // Within +/- 5% is acceptable

  let recommendation = '';
  if (isCalibrated) {
    recommendation = '🟢 Dosificador calibrado dentro del margen de tolerancia admisible (±5%).';
  } else if (observedFlowMlMin > theoreticalFlowMlMin) {
    recommendation = `🟠 El dosificador está inyectando un +${error.toFixed(1)}% más de reactivo. Disminuya la carrera o frecuencia de inyección.`;
  } else {
    recommendation = `🔴 El dosificador inyecta un ${error.toFixed(1)}% menos de lo requerido. Revise la válvula de pie, contrapresión o purgue burbujas de aire.`;
  }

  return {
    theoreticalFlowMlMin: Number(theoreticalFlowMlMin.toFixed(2)),
    observedFlowMlMin: Number(observedFlowMlMin.toFixed(2)),
    errorPercentage: Number(error.toFixed(1)),
    isCalibrated,
    recommendation,
  };
}
