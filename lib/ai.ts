import { UserProfile } from './types';

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
