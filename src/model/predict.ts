import { RandomForestModel } from './RandomForestModel';
import type { QualityModel } from './ModelInterface';
import type { SensorReading, ImageFeatures, ModelOutput } from '../types';

/**
 * Singleton model instance.
 *
 * Currently a Random Forest trained on synthetic bootstrap data, with the
 * rule-based MockModel providing reasons and a safety guardrail. To upgrade,
 * retrain with ml/train_model.py on real lab-referenced samples.
 */
const model: QualityModel = new RandomForestModel();

/**
 * Run quality prediction on a sensor reading.
 * Single entry point for all model inference throughout the app.
 */
export function predict(
  reading: SensorReading,
  sampleType: 'feed' | 'silage',
  imageFeatures?: ImageFeatures
): ModelOutput {
  return model.predict(reading, sampleType, imageFeatures);
}
