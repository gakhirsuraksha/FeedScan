import type { SensorReading, ImageFeatures, ModelOutput } from '../types';

/**
 * Interface for the quality prediction model.
 *
 * Current implementation: MockModel (transparent rule-based heuristics).
 * Future implementation: OnnxModel (real trained model via onnxruntime-web).
 *
 * To upgrade:
 * 1. Implement this interface in src/model/OnnxModel.ts
 * 2. Load a .onnx file: const session = await InferenceSession.create('/model.onnx')
 * 3. Map SensorReading → Float32Array input tensor
 * 4. Run inference: session.run({ input: tensor })
 * 5. Parse output tensor → ModelOutput
 * 6. Replace MockModel with OnnxModel in predict.ts
 */
export interface QualityModel {
  predict(
    reading: SensorReading,
    sampleType: 'feed' | 'silage',
    imageFeatures?: ImageFeatures
  ): ModelOutput;
}
