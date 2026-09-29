/**
 * Core domain types for the FeedScan Feed & Silage Quality Testing app.
 */

/** Raw reading from the AS7341 spectral sensor plus ancillary sensors */
export interface SensorReading {
  // AS7341 spectral channels (raw counts, 0–65535 typical)
  f1_415nm: number;
  f2_445nm: number;
  f3_480nm: number;
  f4_515nm: number;
  f5_555nm: number;
  f6_590nm: number;
  f7_630nm: number;
  f8_680nm: number;
  clear: number;
  nir: number;
  // Ancillary sensors
  moisture_pct: number;
  temperature_c: number;
  ph?: number; // silage only
  timestamp: number;
}

/** Optional image colour features extracted from a photo */
export interface ImageFeatures {
  avgR: number;
  avgG: number;
  avgB: number;
  brightness: number;
  imageDataUrl?: string;
}

/** Result classification */
export type Classification = 'GOOD' | 'CHECK' | 'ACTION_REQUIRED';

/** Output of the quality model (Random Forest + rule-based guardrail) */
export interface ModelOutput {
  classification: Classification;
  /** Fraction of forest trees voting for the class (0–1). Not an accuracy measure. */
  confidence: number;
  reasons: string[];
  estimated: {
    moisture_pct: number;
    /** Feed only. Labelled "Estimated" in UI – not from a trained model. */
    protein_pct?: number;
    /** Feed only. Labelled "Estimated" in UI – not from a trained model. */
    fiber_pct?: number;
    /** Silage only. */
    ph?: number;
    /** Spectral screening flag. Confirm with lab test. */
    adulterationFlag: boolean;
    spoilageRisk: boolean;
  };
}

/** A complete test session stored in IndexedDB */
export interface TestSession {
  id?: number;
  sessionId: string;
  sampleId: string;
  sampleType: 'feed' | 'silage';
  feedType?: string;
  batchId: string;
  scenario: string;
  reading: SensorReading;
  imageFeatures?: ImageFeatures;
  modelOutput: ModelOutput;
  createdAt: number;
}

/** Selectable simulation scenarios */
export type ScenarioName =
  | 'good_feed'
  | 'high_moisture'
  | 'suspicious'
  | 'good_silage'
  | 'spoiling_silage';

/** Account type. Farmers run tests; producers publish batch reference data. */
export type UserRole = 'farmer' | 'producer';

/**
 * Reference data a feed/silage PRODUCER declares for a batch, stored in the
 * shared Realtime Database (not the local per-device IndexedDB). Any farmer
 * looking up this batch ID sees this, alongside their own device's test
 * results for the same batch ID.
 */
export interface BatchRecord {
  batchId: string;
  producerId: string;
  producerName: string;
  sampleType: 'feed' | 'silage';
  feedType?: string;
  moisture_pct?: number;
  ph?: number;
  protein_pct?: number;
  fiber_pct?: number;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Scenario {
  name: ScenarioName;
  label: string;
  sampleType: 'feed' | 'silage';
  description: string;
}
