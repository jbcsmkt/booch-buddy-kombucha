import { BatchData } from '../types/brewing';

export const calculateBrewRatios = (brewSize: number) => ({
  starterVolume: brewSize * 16, // fl oz
  teaWeight: brewSize * 2, // oz
  waterVolume: brewSize, // gal
  sugarAmount: brewSize * 1, // cups
});

export const calculateAlcoholEstimate = (startBrix: number, endBrix: number): number => {
  return (startBrix - endBrix) * 0.59;
};

export const calculateForceCardPSI = (temp: number, co2Volume: number): number => {
  // Formula: (CO2 - 1) * (Temp + 100) / 50
  return Math.round((co2Volume - 1) * (temp + 100) / 50);
};

export const calculateCarbTimeEstimate = (psi: number): number => {
  // Estimate carbonation time in hours based on PSI
  return Math.round(24 + (psi - 10) * 2);
};

export const isPrimaryFermentComplete = (pH: number, brix: number, taste: string): boolean => {
  return pH <= 3.2 && brix <= 2 && (taste === 'Tangy + Dry' || taste === 'Sour + Balanced');
};

export const isReadyToBottle = (batch: BatchData): boolean => {
  return !!(
    batch.secondaryStartDate &&
    batch.secondaryEndDate &&
    batch.finalPH &&
    batch.finalBrix &&
    batch.clarityAchieved &&
    batch.finalPH <= 3.2 &&
    batch.finalPH >= 2.4
  );
};

export const isUnsafeToBottle = (pH: number): boolean => {
  return pH > 4.0;
};

export const isOverFermented = (pH: number): boolean => {
  return pH < 2.4;
};

export const calculateProgressPercentage = (batch: BatchData | null | undefined): number => {
  if (!batch) return 0;
  
  let progress = 0;
  
  // Basic info entered (25%)
  if (batch.startPH && batch.startBrix) progress += 25;
  
  // Fermentation tracking (25%)
  if (batch.endPH && batch.endBrix && batch.tasteProfile) progress += 25;
  
  // Flavoring/Filtering (25%)
  if (batch.flavoringMethod && batch.filteringMethod) progress += 25;
  
  // Carbonation/Packaging (25%)
  if ((batch.carbonationStatus === 'Complete' || batch.packagingDate)) progress += 25;
  
  return progress;
};

export const getBatchStatus = (batch: BatchData | null | undefined): BatchData['status'] => {
  if (!batch) return 'needs-attention';
  
  const progress = calculateProgressPercentage(batch);
  
  if (batch.finalPH && isUnsafeToBottle(batch.finalPH)) return 'needs-attention';
  if (batch.finalPH && isOverFermented(batch.finalPH)) return 'needs-attention';
  if (progress === 100) return 'complete';
  if (progress >= 50) return 'ready';
  if (progress > 0) return 'in-progress';
  return 'needs-attention';
};