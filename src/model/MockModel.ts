import type { QualityModel } from './ModelInterface';
import type {
  SensorReading,
  ImageFeatures,
  ModelOutput,
  Classification,
} from '../types';

/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  MockModel – transparent rule-based quality estimator        ║
 * ║                                                              ║
 * ║  ⚠️  NOT A TRAINED ML MODEL                                  ║
 * ║  This is a hand-crafted heuristic designed as a placeholder until a trained model is available          ║
 * ║  purposes only. Replace with OnnxModel when a trained        ║
 * ║  model is available.                                         ║
 * ║                                                              ║
 * ║  Rules are intentionally transparent so reviewers can        ║
 * ║  understand how the output is derived.                       ║
 * ╚══════════════════════════════════════════════════════════════╝
 */
export class MockModel implements QualityModel {
  predict(
    reading: SensorReading,
    sampleType: 'feed' | 'silage',
    imageFeatures?: ImageFeatures
  ): ModelOutput {
    const reasons: string[] = [];
    let score = 100; // Deduction-based score: start perfect, subtract for issues
    let adulterationFlag = false;
    let spoilageRisk = false;

    // ── Moisture analysis ─────────────────────────────────────────
    const moistureHighThreshold  = sampleType === 'feed' ? 18 : 70;
    const moistureVeryHighThresh = sampleType === 'feed' ? 24 : 75;

    if (reading.moisture_pct > moistureVeryHighThresh) {
      score -= 40;
      spoilageRisk = true;
      reasons.push(
        sampleType === 'feed'
          ? `Moisture very high (${reading.moisture_pct.toFixed(1)}%). Risk of mould and mycotoxins. Check storage immediately.`
          : `Silage moisture very high (${reading.moisture_pct.toFixed(1)}%). Spoilage is likely — check for effluent loss.`
      );
    } else if (reading.moisture_pct > moistureHighThreshold) {
      score -= 20;
      reasons.push(
        `Moisture elevated (${reading.moisture_pct.toFixed(1)}%). Monitor storage conditions and ventilation.`
      );
    }

    // ── pH analysis (silage only) ─────────────────────────────────
    if (sampleType === 'silage' && reading.ph !== undefined) {
      if (reading.ph > 5.0) {
        score -= 35;
        spoilageRisk = true;
        reasons.push(
          `pH ${reading.ph.toFixed(2)} is too high — good silage is typically pH 3.8–4.5. ` +
          `Spoilage organisms may be active. Aerobic deterioration risk.`
        );
      } else if (reading.ph > 4.5) {
        score -= 15;
        reasons.push(
          `pH ${reading.ph.toFixed(2)} is slightly elevated. Monitor fermentation progress over 24–48 hours.`
        );
      } else {
        reasons.push(
          `pH ${reading.ph.toFixed(2)} is within the good silage range (3.8–4.5). ✓`
        );
      }
    }

    // ── Spectral adulteration screening ──────────────────────────
    // Heuristic: elevated F1/F2 (blue-violet) relative to F5/F6 (green-amber)
    // can indicate non-native materials such as chalk, urea, or sand.
    // ⚠️  This is a spectral anomaly flag ONLY. Confirm with lab.
    const spectralRatio =
      (reading.f1_415nm + reading.f2_445nm) /
      Math.max(1, reading.f5_555nm + reading.f6_590nm);

    if (spectralRatio > 1.3) {
      score -= 30;
      adulterationFlag = true;
      reasons.push(
        `Spectral pattern: unusually high blue/violet reflectance ratio (${spectralRatio.toFixed(2)}). ` +
        `⚠️ Screening flag — possible adulterant or foreign material. ` +
        `This device cannot directly identify the substance. Confirm with a certified laboratory test.`
      );
    } else if (spectralRatio > 1.05) {
      score -= 8;
      reasons.push(
        `Spectral pattern is slightly atypical (ratio ${spectralRatio.toFixed(2)}). Further observation recommended.`
      );
    }

    // ── Temperature check ─────────────────────────────────────────
    if (reading.temperature_c > 30 && sampleType === 'silage') {
      score -= 20;
      spoilageRisk = true;
      reasons.push(
        `Storage temperature ${reading.temperature_c.toFixed(1)}°C is high. ` +
        `Silage above 25°C is prone to aerobic spoilage. Check the clamp face for heating.`
      );
    } else if (reading.temperature_c > 35 && sampleType === 'feed') {
      score -= 10;
      reasons.push(
        `Temperature ${reading.temperature_c.toFixed(1)}°C is elevated for dry feed storage. ` +
        `Ensure adequate airflow.`
      );
    }

    // ── Image colour analysis (optional) ─────────────────────────
    if (imageFeatures) {
      const { avgR, avgG, avgB, brightness } = imageFeatures;
      if (brightness < 60) {
        score -= 10;
        reasons.push(
          'Image appears dark — check lighting conditions or sample may have discolouration.'
        );
      }
      // Unusual redness vs green/blue → possible mould or heating
      if (avgR > avgG * 1.5 && avgR > avgB * 1.5) {
        score -= 15;
        spoilageRisk = true;
        reasons.push(
          'Image colour: unusual redness detected. May indicate mould growth, heat damage, or spoilage.'
        );
      }
    }

    // ── Positive note if no issues ────────────────────────────────
    const issueCount = reasons.filter(r => !r.includes('✓')).length;
    if (issueCount === 0) {
      reasons.unshift(
        'All key indicators (moisture, spectral pattern, temperature) are within expected ranges. ✓'
      );
    }

    // ── Estimated nutrient values (demo rule-based approximation) ─
    // ⚠️  These are NOT from a trained model. Displayed with "Estimated" label.
    const moisture = reading.moisture_pct;
    const dryMatterFactor = Math.max(0, (100 - moisture) / 100);

    const protein_pct =
      sampleType === 'feed'
        ? parseFloat((12 + dryMatterFactor * 8 - (adulterationFlag ? 3 : 0)).toFixed(1))
        : undefined;

    const fiber_pct =
      sampleType === 'feed'
        ? parseFloat((25 + (1 - dryMatterFactor) * 10).toFixed(1))
        : undefined;

    const ph = sampleType === 'silage' ? reading.ph : undefined;

    // ── Classify ──────────────────────────────────────────────────
    let classification: Classification;
    let confidence: number;

    if (score >= 75) {
      classification = 'GOOD';
      confidence = Math.min(0.93, 0.78 + (score - 75) / 100);
    } else if (score >= 45) {
      classification = 'CHECK';
      confidence = 0.68 + Math.random() * 0.12;
    } else {
      classification = 'ACTION_REQUIRED';
      confidence = 0.74 + Math.random() * 0.10;
    }

    return {
      classification,
      confidence,
      reasons,
      estimated: {
        moisture_pct: parseFloat(moisture.toFixed(1)),
        protein_pct,
        fiber_pct,
        ph,
        adulterationFlag,
        spoilageRisk,
      },
    };
  }
}
