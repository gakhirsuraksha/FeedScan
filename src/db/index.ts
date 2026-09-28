import Dexie, { type Table } from 'dexie';
import type { TestSession } from '../types';

/**
 * IndexedDB database for storing test sessions locally.
 * Uses Dexie for a clean Promise-based API.
 *
 * Data never leaves the device — fully offline-capable.
 */
class FeedQualityDB extends Dexie {
  sessions!: Table<TestSession, number>;

  constructor() {
    super('FeedQualityDB');
    this.version(1).stores({
      // Indexed fields: id (auto), sessionId, sampleId, sampleType, batchId, createdAt
      sessions: '++id, sessionId, sampleId, sampleType, batchId, createdAt',
    });
  }
}

/** Singleton database instance */
export const db = new FeedQualityDB();
