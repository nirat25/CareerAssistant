'use client';

import { useState, useCallback } from 'react';
import { generateAI, AIGenerateRequest } from '@/lib/ai';

export function useAI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (request: AIGenerateRequest): Promise<string> => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateAI(request);
      if (result.error) {
        setError(result.error);
        return '';
      }
      return result.content;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setError(msg);
      return '';
    } finally {
      setLoading(false);
    }
  }, []);

  return { generate, loading, error };
}
