'use client';

import { useState, useEffect, useCallback } from 'react';
import { storage } from '@/lib/storage';
import { CareerData } from '@/lib/types';

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

export function useCareerData() {
  const [data, setData] = useState<CareerData>(DEFAULT_DATA);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    storage.load().then((loaded) => {
      setData(loaded);
      setLoading(false);
    });
  }, []);

  const update = useCallback(async (updater: (prev: CareerData) => CareerData) => {
    setData((prev) => {
      const next = updater(prev);
      storage.save(next);
      return next;
    });
  }, []);

  const updatePhaseProgress = useCallback((phaseId: string, progress: number) => {
    update((prev) => ({
      ...prev,
      phaseProgress: { ...prev.phaseProgress, [phaseId]: Math.min(100, Math.max(0, progress)) },
    }));
  }, [update]);

  return { data, loading, update, updatePhaseProgress };
}
