/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Calculates the estimated One-Rep Max (1RM) using the Epley formula.
 * Formula: Weight * (1 + (Reps / 30))
 */
export function calculateEpley1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  if (reps === 0) return 0;
  return weight * (1 + reps / 30);
}

/**
 * Calculates the estimated One-Rep Max (1RM) using the Brzycki formula.
 * Formula: Weight * (36 / (37 - Reps))
 */
export function calculateBrzycki1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  if (reps >= 37) return weight; // Formula breaks down at 37+ reps
  return weight * (36 / (37 - reps));
}

/**
 * A simplified RPE Intensity Chart (Percentage of 1RM)
 * Rows: Reps (1-12)
 * Columns: RPE (10, 9, 8, 7)
 */
const RPE_CHART: Record<number, Record<number, number>> = {
  1: { 10: 1.0, 9: 0.96, 8: 0.92, 7: 0.89 },
  2: { 10: 0.96, 9: 0.92, 8: 0.89, 7: 0.86 },
  3: { 10: 0.92, 9: 0.89, 8: 0.86, 7: 0.84 },
  4: { 10: 0.89, 9: 0.86, 8: 0.84, 7: 0.81 },
  5: { 10: 0.86, 9: 0.84, 8: 0.81, 7: 0.79 },
  6: { 10: 0.84, 9: 0.81, 8: 0.79, 7: 0.76 },
  7: { 10: 0.81, 9: 0.79, 8: 0.76, 7: 0.74 },
  8: { 10: 0.79, 9: 0.76, 8: 0.74, 7: 0.72 },
  9: { 10: 0.76, 9: 0.74, 8: 0.72, 7: 0.70 },
  10: { 10: 0.74, 9: 0.72, 8: 0.70, 7: 0.68 },
  11: { 10: 0.72, 9: 0.70, 8: 0.68, 7: 0.66 },
  12: { 10: 0.70, 9: 0.68, 8: 0.66, 7: 0.64 },
};

/**
 * Automatically calculates RPE based on Weight, Reps, and current 1RM.
 */
export function calculateAutomaticRPE(weight: number, reps: number, current1RM: number): number {
  if (current1RM <= 0 || weight <= 0 || reps <= 0) return 8; // Default to 8
  
  const intensity = weight / current1RM;
  const repsData = RPE_CHART[Math.min(reps, 12)];
  
  if (!repsData) return 8;

  // Find the closest RPE based on intensity
  let closestRPE = 8;
  let minDiff = Infinity;

  for (const [rpe, pct] of Object.entries(repsData)) {
    const diff = Math.abs(pct - intensity);
    if (diff < minDiff) {
      minDiff = diff;
      closestRPE = parseFloat(rpe);
    }
  }

  return closestRPE;
}

export function format1RM(value: number): string {
  return value.toFixed(1);
}
