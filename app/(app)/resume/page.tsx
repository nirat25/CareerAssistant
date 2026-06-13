'use client';

import { useState } from 'react';
import { v4 as uuid } from 'uuid';
import { useCareerData } from '@/hooks/useCareerData';
import { useAI } from '@/hooks/useAI';
import { getSuperpowerContext, parseAIJson } from '@/lib/ai';
import { ResumeNarrative, GapAnalysis } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Sparkles, ShieldCheck, ShieldAlert, ArrowRight } from 'lucide-react';

// ── Example content for "See an example" disclosures ──
const NARRATIVE_EXAMPLE = `Swiggy is fighting a unit-economics problem in quick-commerce — dark-store costs are rising while order frequency plateaus in tier-2 cities. At Ola, I faced a structurally identical problem: driver cancellations after acceptance were killing per-trip margin. I didn't fix the algorithm — I redesigned the incentive model. Built a dynamic earning-guarantee system (SQL analysis + engineer collaboration + leadership ROI deck) that cut post-acceptance cancellations from 34% to 12%, adding ₹8 per trip to net margin. The core challenge is the same: you can't optimise your way out of a behavioural problem. You have to change the incentive structure itself. I'd bring that same reframe to your dark-store fulfilment cost model.`;

const BRIDGE_EXAMPLE = `Gap: Haven't worked in fintech — no direct payments or KYC experience.
Bridge: "I haven't built KYC flows, but at Cymax I designed automated reconciliation between 500+ vendor accounts — same trust-at-scale constraint, different regulatory wrapper. I also write my own SQL, so I won't need an analyst to quantify drop-off rates before proposing a solution."`;

export default function ResumePage() {
  const { data, update, updatePhaseProgress } = useCareerData();
  const { generate, loading: aiLoading } = useAI();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [narrative, setNarrative] = useState('');
  const [gaps, setGaps] = useState<GapAnalysis[]>([]);
  const [trustFactors, setTrustFactors] = useState<string[]>([]);
  const [riskFactors, setRiskFactors] = useState<string[]>([]);

  const selectedCompany = data.companies.find((c) => c.id === selectedCompanyId);
  const companyWins = data.wins.filter((w) => {
    const scores = data.positioningMatrix?.scores?.[w.id];
    if (!scores) return false;
    return Object.entries(scores).some(([key, score]) => key.startsWith(selectedCompanyId) && score >= 1);
  });

  const generateNarrative = async () => {
    if (!selectedCompany) return;
    const winsText = (companyWins.length > 0 ? companyWins : data.wins)
      .map((w) => `- ${w.title}: Before: ${w.before} → After: ${w.after}`)
      .join('\n');

    const superpowerCtx = getSuperpowerContext(data.profile);
    const gripNarrative = data.gripNarratives.find((g) => g.companyId === selectedCompanyId);

    const result = await generate({
      prompt: `Generate a tailored resume narrative for a tech professional applying to ${selectedCompany.name} (${selectedCompany.industry}, ${selectedCompany.stage}).

${superpowerCtx ? `CANDIDATE SUPERPOWER:\n${superpowerCtx}\n` : ''}${gripNarrative ? `EXISTING GRIP POSITIONING:\nGap: ${gripNarrative.gap}\nResult: ${gripNarrative.result}\n` : ''}Their problems: ${selectedCompany.problems.join(', ')}
Skills they hire: ${selectedCompany.skillsTheyHire.join(', ')}

Candidate wins:
${winsText || 'No specific wins recorded.'}

Write using "Before → Insight → Action → After" structure. Make it specific to this company's needs. Use language from the Indian tech ecosystem.

Return ONLY valid JSON, no markdown fences:
{
  "narrative": "The full resume narrative using Before → Insight → Action → After structure, tailored to this company",
  "gaps": [
    {
      "type": "context-translation|problem-alignment|brand-bias|hiring-manager-math",
      "description": "Description of the gap",
      "bridgeStatement": "How to bridge this gap"
    }
  ],
  "trustFactors": ["credibility signal 1", "credibility signal 2", "credibility signal 3"],
  "riskFactors": ["concern 1", "concern 2"]
}`,
      maxTokens: 2048,
    });

    if (result) {
      const parsed = parseAIJson<{
        narrative: string;
        gaps: GapAnalysis[];
        trustFactors: string[];
        riskFactors: string[];
      }>(result);

      if (parsed) {
        setNarrative(parsed.narrative || '');
        setGaps(parsed.gaps || []);
        setTrustFactors(parsed.trustFactors || []);
        setRiskFactors(parsed.riskFactors || []);
      } else {
        // Fallback: show raw text as narrative if JSON parsing fails
        setNarrative(result);
      }
    }
  };

  const saveNarrative = async () => {
    if (!selectedCompanyId || !narrative) return;
    const resumeNarrative: ResumeNarrative = {
      id: uuid(),
      companyId: selectedCompanyId,
      companyProblems: selectedCompany?.problems || [],
      mappedWins: companyWins.map((w) => w.id),
      narrative,
      gaps,
      bridgeStatements: gaps.map((g) => g.bridgeStatement).filter(Boolean),
      trustFactors,
      riskFactors,
    };
    await update((prev) => ({
      ...prev,
      resumeNarratives: [...prev.resumeNarratives, resumeNarrative],
    }));
    updatePhaseProgress('resume', Math.min(100, ((data.resumeNarratives.length + 1) / 3) * 100));
    setNarrative('');
    setGaps([]);
    setTrustFactors([]);
    setRiskFactors([]);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Resume Narrative Builder</h1>
        <p className="text-muted-foreground mt-1">
          Build company-specific narratives, not one generic resume
        </p>
      </div>

      {/* Step 1: Select company */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Step 1: Select Target Company</CardTitle>
          <CardDescription>Choose a company from your research hub</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
            <SelectTrigger><SelectValue placeholder="Select a company" /></SelectTrigger>
            <SelectContent>
              {data.companies.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name} — {c.industry}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {data.companies.length === 0 && (
            <p className="text-sm text-muted-foreground mt-2">Add companies in the Market Research phase first.</p>
          )}
        </CardContent>
      </Card>

      {selectedCompany && (
        <>
          {/* Step 2: Company problems */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Step 2: Their Top Problems</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {selectedCompany.problems.length > 0 ? (
                  selectedCompany.problems.map((p, i) => <Badge key={i} variant="secondary">{p}</Badge>)
                ) : (
                  <span className="text-sm text-muted-foreground">No problems recorded. Add them in Market Research.</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Step 3: Mapped wins */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Step 3: Your Mapped Wins</CardTitle>
              <CardDescription>
                {companyWins.length > 0
                  ? `${companyWins.length} wins matched via fit matrix`
                  : 'No wins directly mapped. Using all wins as fallback.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(companyWins.length > 0 ? companyWins : data.wins.slice(0, 5)).map((win) => (
                  <div key={win.id} className="flex items-center gap-2 text-sm">
                    <ArrowRight className="h-3 w-3 text-primary" />
                    <span className="font-medium">{win.title}</span>
                    <span className="text-muted-foreground">— {win.after}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Step 4: Generate */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Step 4: Generate Narrative</CardTitle>
                <Button onClick={generateNarrative} disabled={aiLoading}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {aiLoading ? 'Generating...' : 'Generate with AI'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <details className="rounded border bg-muted/40 p-2 text-xs text-muted-foreground">
                <summary className="cursor-pointer font-medium text-foreground select-none">See an example narrative + bridge statement</summary>
                <div className="mt-2 space-y-2">
                  <div>
                    <p className="font-medium text-foreground mb-1">Company-specific narrative (Before → Insight → Action → After):</p>
                    <p className="whitespace-pre-wrap">{NARRATIVE_EXAMPLE}</p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground mb-1">Gap bridge statement:</p>
                    <p className="whitespace-pre-wrap">{BRIDGE_EXAMPLE}</p>
                  </div>
                </div>
              </details>
              <Textarea
                value={narrative}
                onChange={(e) => setNarrative(e.target.value)}
                rows={12}
                placeholder="Your narrative will appear here..."
                className="text-sm"
              />

              {/* Gap Analysis */}
              {gaps.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">Gap Analysis</h3>
                  <div className="grid gap-2">
                    {gaps.map((gap, i) => (
                      <div key={i} className="p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{gap.type.replace('-', ' ')}</Badge>
                        </div>
                        {gap.bridgeStatement && (
                          <p className="text-sm mt-1"><strong>Bridge:</strong> {gap.bridgeStatement}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Trust Ladder */}
              {(trustFactors.length > 0 || riskFactors.length > 0) && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldCheck className="h-4 w-4 text-green-500" />
                      <h3 className="text-sm font-semibold">Trust Factors</h3>
                    </div>
                    {trustFactors.map((f, i) => (
                      <p key={i} className="text-sm text-muted-foreground">&bull; {f}</p>
                    ))}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldAlert className="h-4 w-4 text-red-500" />
                      <h3 className="text-sm font-semibold">Risk Factors</h3>
                    </div>
                    {riskFactors.map((f, i) => (
                      <p key={i} className="text-sm text-muted-foreground">&bull; {f}</p>
                    ))}
                  </div>
                </div>
              )}

              {narrative && (
                <Button onClick={saveNarrative} className="w-full">
                  Save Narrative for {selectedCompany.name}
                </Button>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Saved Narratives */}
      {data.resumeNarratives.length > 0 && (
        <>
          <Separator />
          <h2 className="text-xl font-semibold">Saved Narratives</h2>
          {data.resumeNarratives.map((rn) => {
            const company = data.companies.find((c) => c.id === rn.companyId);
            return (
              <Card key={rn.id}>
                <CardHeader>
                  <CardTitle className="text-base">{company?.name || 'Unknown'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{rn.narrative}</p>
                </CardContent>
              </Card>
            );
          })}
        </>
      )}
    </div>
  );
}
