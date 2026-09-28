import type { QualityModel } from './ModelInterface';
import type { SensorReading, ImageFeatures, ModelOutput, Classification } from '../types';
import { MockModel } from './MockModel';
import { RF_CLASSES, RF_TREES } from './rfModelData';

/**
 * RandomForestModel – runs a trained Random Forest in the browser (offline).
 *
 * IMPORTANT: the forest was trained on SYNTHETIC bootstrap data (see
 * ml/train_model.py and docs/ml-training.md), to validate the ML pipeline.
 * It has NOT been validated on real feed. Retrain on lab-referenced samples
 * once the sensor hardware is available.
 *
 * Design:
 *  - The forest classifies GOOD / CHECK / ACTION_REQUIRED from sensor readings.
 *  - The rule-based MockModel supplies the plain-language reasons and the
 *    estimated values, and acts as a safety guardrail: the final class is never
 *    less severe than the rules' class (e.g. photo-based warnings).
 *  - "confidence" is the fraction of trees voting for the class, not an
 *    accuracy measure.
 */
const SEVERITY: Record<Classification, number> = { GOOD: 0, CHECK: 1, ACTION_REQUIRED: 2 };

/** Feature order MUST match FEATURES in ml/train_model.py */
function toFeatures(r: SensorReading, sampleType: 'feed' | 'silage'): number[] {
  return [
    r.f1_415nm, r.f2_445nm, r.f3_480nm, r.f4_515nm, r.f5_555nm,
    r.f6_590nm, r.f7_630nm, r.f8_680nm, r.clear, r.nir,
    r.moisture_pct, r.temperature_c, r.ph ?? 0, sampleType === 'silage' ? 1 : 0,
    (r.f1_415nm + r.f2_445nm) / Math.max(1, r.f5_555nm + r.f6_590nm),
    r.nir / Math.max(1, r.clear),
  ];
}

/** Average class probabilities across all trees. */
export function forestProba(x: number[]): number[] {
  const acc = new Array(RF_CLASSES.length).fill(0);
  for (const t of RF_TREES) {
    let n = 0;
    while (t.l[n] !== -1) n = x[t.f[n]] <= t.t[n] ? t.l[n] : t.r[n];
    t.v[n].forEach((p, i) => { acc[i] += p; });
  }
  return acc.map((v) => v / RF_TREES.length);
}

export class RandomForestModel implements QualityModel {
  private rules = new MockModel();

  predict(
    reading: SensorReading,
    sampleType: 'feed' | 'silage',
    imageFeatures?: ImageFeatures
  ): ModelOutput {
    const ruleOut = this.rules.predict(reading, sampleType, imageFeatures);

    const proba = forestProba(toFeatures(reading, sampleType));
    const best = proba.indexOf(Math.max(...proba));
    const rfClass = RF_CLASSES[best] as Classification;

    const classification =
      SEVERITY[ruleOut.classification] > SEVERITY[rfClass] ? ruleOut.classification : rfClass;

    return {
      ...ruleOut,
      classification,
      confidence: proba[best],
    };
  }
}
