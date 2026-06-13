import { UserProfile } from './types';

/**
 * Robustly parse a JSON object OR array out of an AI text response.
 * Strips markdown code fences, attempts a direct parse, then falls back to
 * extracting the first {...} or [...] block. Returns null on total failure.
 *
 * Single source of truth for AI JSON parsing (M0.1) — pages should import this
 * instead of redefining a local parseJSON helper.
 */
export function parseAIJson<T>(raw: string): T | null {
  if (!raw) return null;
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const objMatch = cleaned.match(/\{[\s\S]*\}/);
    const arrMatch = cleaned.match(/\[[\s\S]*\]/);
    const candidates = [objMatch, arrMatch]
      .filter((m): m is RegExpMatchArray => m !== null)
      .sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
    for (const m of candidates) {
      try {
        return JSON.parse(m[0]) as T;
      } catch {
        // try next candidate
      }
    }
    return null;
  }
}

export interface AIGenerateRequest {
  prompt: string;
  context?: string;
  maxTokens?: number;
}

export interface AIGenerateResponse {
  content: string;
  error?: string;
}

export async function generateAI(request: AIGenerateRequest): Promise<AIGenerateResponse> {
  try {
    const res = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!res.ok) {
      const err = await res.json();
      return { content: '', error: err.error || 'AI generation failed' };
    }
    return await res.json();
  } catch (error) {
    return { content: '', error: `Network error: ${error}` };
  }
}

/**
 * Returns the best available superpower context for use in AI prompts.
 * Priority: superpowerStatement > superpowerPunchline > legacy superpowers tags
 * Also includes domains and agency if available.
 */
export function getSuperpowerContext(profile?: UserProfile): string {
  if (!profile) return '';
  const parts: string[] = [];
  if (profile.superpowerStatement) {
    parts.push(`Superpower statement: ${profile.superpowerStatement}`);
  } else if (profile.superpowerPunchline) {
    parts.push(`Superpower: ${profile.superpowerPunchline}`);
  } else if (profile.superpowers && profile.superpowers.length > 0) {
    parts.push(`Key themes: ${profile.superpowers.join(', ')}`);
  }
  if (profile.superpowerDomains && profile.superpowerDomains.length > 0) {
    parts.push(`Deep domains: ${profile.superpowerDomains.join(', ')}`);
  }
  if (profile.superpowerAgency && profile.superpowerAgency.length > 0) {
    parts.push(`Does personally (not delegated): ${profile.superpowerAgency.join(', ')}`);
  }
  return parts.join('\n');
}
