import { CareerData } from './types';

const STORAGE_KEY = 'career-assistant-data';

const DEFAULT_DATA: CareerData = {
  audits: [],
  companies: [],
  wins: [],
  gripNarratives: [],
  elevatorPitches: [],
  resumeNarratives: [],
  proofsOfWork: [],
  coldEmails: [],
  applications: [],
  weeklyTrackers: [],
  phaseProgress: {},
};

export interface StorageProvider {
  load(): Promise<CareerData>;
  save(data: CareerData): Promise<void>;
  clear(): Promise<void>;
}

class LocalStorageProvider implements StorageProvider {
  async load(): Promise<CareerData> {
    if (typeof window === 'undefined') return DEFAULT_DATA;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return DEFAULT_DATA;
      return { ...DEFAULT_DATA, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_DATA;
    }
  }

  async save(data: CareerData): Promise<void> {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  async clear(): Promise<void> {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
  }
}

// Future: SupabaseStorageProvider implements StorageProvider { ... }

export const storage: StorageProvider = new LocalStorageProvider();
