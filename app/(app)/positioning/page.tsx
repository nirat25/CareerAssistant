'use client';

import { useState } from 'react';
import { v4 as uuid } from 'uuid';
import { useCareerData } from '@/hooks/useCareerData';
import { useAI } from '@/hooks/useAI';
import { Win, GRIPNarrative, ElevatorPitch } from '@/lib/types';
import { WIN_CHECKLISTS, ELEVATOR_PITCH_STRUCTURE } from '@/lib/frameworks';
import { getSuperpowerContext, parseAIJson } from '@/lib/ai';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Plus, Trophy, Grid3X3, Compass, Mic, Sparkles, Trash2 } from 'lucide-react';

// ── Example content for "See an example" disclosures ──
const WIN_EXAMPLE = {
  title: 'Eliminated vendor invoice disputes (Cymax)',
  before: 'Vendor invoice disputes were costing $300K/year and draining ops bandwidth. The legacy bill-checker algorithm used hard-coded rules and kept producing false mismatches.',
  insight: 'Why are vendors sending invoices at all when we already have complete sales data? The invoice was redundant information we could generate ourselves.',
  action: 'Analysed dispute patterns, quantified cost, designed an automated invoicing flow with engineers, and built the ROI case for leadership.',
  after: 'Dispute rate dropped to 0.1%. $300K annual savings. Vendor satisfaction improved. Operations bandwidth freed.',
  metrics: ['0.1% dispute rate', '$300K annual savings'],
};

const GRIP_EXAMPLE = {
  gap: 'Razorpay needs a PM who has solved SMB adoption friction in tier-2 cities — their current merchant onboarding drops 40% before KYC completion.',
  result: 'At Vendaxo, cut CAC from $4 → $0.76 (81% reduction) by reframing the product for how industrial buyers actually search — information density over clean design.',
  inputLevers: 'Reframe (60%): Abandoned "clean design" after observing industrial buyers expect dense info above the fold. SEO-led growth (40%): Built proprietary matching and invested in SEO to reduce paid acquisition dependence.',
  plan: 'I\'d embed with Razorpay\'s merchant onboarding team for two weeks, map every drop-off point with SQL, identify the top 3 friction patterns, then prototype a localised onboarding flow that mirrors how tier-2 merchants already operate (WhatsApp-first, vernacular, low-data). Deliver a business case with projected KYC completion rate improvement before writing a single line of spec.',
};

export default function PositioningPage() {
  const { data, update, updatePhaseProgress } = useCareerData();
  const { generate, loading: aiLoading } = useAI();
  const [activeTab, setActiveTab] = useState('wins');
  const [winDialogOpen, setWinDialogOpen] = useState(false);
  const [gripDialogOpen, setGripDialogOpen] = useState(false);
  const [pitchDialogOpen, setPitchDialogOpen] = useState(false);
  const [selectedFunction, setSelectedFunction] = useState<string>(data.profile?.function || 'product');

  // Win form
  const [winForm, setWinForm] = useState<Omit<Win, 'id'>>({
    title: '', category: '', before: '', insight: '', action: '', after: '', metrics: [], transferable: true,
  });
  const [metricInput, setMetricInput] = useState('');

  // GRIP form
  const [gripForm, setGripForm] = useState<Omit<GRIPNarrative, 'id'>>({
    companyId: '', gap: '', result: '', inputLevers: [{ lever: '', contribution: '', detail: '' }], plan: '',
  });

  // Pitch form
  const [pitchForm, setPitchForm] = useState<Omit<ElevatorPitch, 'id'>>({
    companyId: '', stranger10s: '', recruiter30s: '', peer2min: '',
  });

  const saveWin = async () => {
    if (!winForm.title.trim()) return;
    await update((prev) => ({
      ...prev,
      wins: [...prev.wins, { id: uuid(), ...winForm }],
    }));
    setWinForm({ title: '', category: '', before: '', insight: '', action: '', after: '', metrics: [], transferable: true });
    setWinDialogOpen(false);
    updatePhaseProgress('positioning', Math.min(100, ((data.wins.length + 1) / 5) * 50));
  };

  const deleteWin = async (id: string) => {
    await update((prev) => ({ ...prev, wins: prev.wins.filter((w) => w.id !== id) }));
  };

  const saveGrip = async () => {
    await update((prev) => ({
      ...prev,
      gripNarratives: [...prev.gripNarratives, { id: uuid(), ...gripForm }],
    }));
    setGripForm({ companyId: '', gap: '', result: '', inputLevers: [{ lever: '', contribution: '', detail: '' }], plan: '' });
    setGripDialogOpen(false);
  };

  const savePitch = async () => {
    await update((prev) => ({
      ...prev,
      elevatorPitches: [...prev.elevatorPitches, { id: uuid(), ...pitchForm }],
    }));
    setPitchForm({ companyId: '', stranger10s: '', recruiter30s: '', peer2min: '' });
    setPitchDialogOpen(false);
  };

  const generateGRIP = async () => {
    const company = data.companies.find((c) => c.id === gripForm.companyId);
    const winsText = data.wins.map((w) => `- ${w.title}: ${w.before} → ${w.after}`).join('\n');
    const superpowerCtx = getSuperpowerContext(data.profile);

    const result = await generate({
      prompt: `Generate a GRIP narrative (Gap → Result → Input Levers → Plan) for a tech professional targeting ${company?.name || 'a company'}.
${superpowerCtx ? `\nCandidate superpower:\n${superpowerCtx}\n` : ''}
Their wins:
${winsText || 'No wins recorded yet.'}

Company problems: ${company?.problems.join(', ') || 'Unknown'}

Return ONLY valid JSON with no other text:
{
  "gap": "The gap between their needs and the candidate's current positioning",
  "result": "The specific result the candidate delivered that maps to this gap",
  "inputLevers": "The key levers and their contributions (2-3 specific levers with 80/20 breakdown)",
  "plan": "How the candidate will close this gap (spend 80% of content here)"
}`,
    });

    if (result) {
      const parsed = parseAIJson<{ gap?: string; result?: string; inputLevers?: string; plan?: string }>(result);

      if (parsed) {
        setGripForm((prev) => ({
          ...prev,
          gap: parsed.gap || prev.gap,
          result: parsed.result || prev.result,
          plan: parsed.plan || prev.plan,
        }));
      } else {
        // Fallback: show raw text if JSON parsing fails
        setGripForm((prev) => ({
          ...prev,
          gap: result || prev.gap,
        }));
      }
    }
  };

  const generatePitches = async () => {
    const winsText = data.wins.map((w) => `- ${w.title}: ${w.after}`).join('\n');
    const company = data.companies.find((c) => c.id === pitchForm.companyId);
    const superpowerCtx = getSuperpowerContext(data.profile);

    const result = await generate({
      prompt: `Generate 3 elevator pitches for a tech professional. Use the Warmup → Hook → Meat → Intrigue structure.
${superpowerCtx ? `\nCandidate superpower:\n${superpowerCtx}\n` : ''}
Their wins:
${winsText || 'No wins yet.'}

Target: ${company?.name || 'Tech companies in India'}

Return ONLY valid JSON with no other text:
{
  "stranger10s": "10-second stranger pitch - one sentence that makes someone want to know more",
  "recruiter30s": "30-second recruiter pitch - your positioning + 1 proof point + what you're looking for",
  "peer2min": "2-minute peer pitch - full context with story, metrics, and positioning"
}`,
    });

    if (result) {
      const parsed = parseAIJson<{ stranger10s?: string; recruiter30s?: string; peer2min?: string }>(result);

      if (parsed) {
        setPitchForm((prev) => ({
          ...prev,
          stranger10s: parsed.stranger10s || prev.stranger10s,
          recruiter30s: parsed.recruiter30s || prev.recruiter30s,
          peer2min: parsed.peer2min || prev.peer2min,
        }));
      } else {
        // Fallback: show raw text if JSON parsing fails
        setPitchForm((prev) => ({
          ...prev,
          stranger10s: result || prev.stranger10s,
        }));
      }
    }
  };

  // Fit Matrix: wins (rows) x company problems (columns)
  const allProblems = data.companies.flatMap((c) => c.problems.map((p) => ({ companyId: c.id, companyName: c.name, problem: p })));
  const matrixScores = data.positioningMatrix?.scores || {};

  const setMatrixScore = async (winId: string, problemKey: string, score: 0 | 1 | 2) => {
    await update((prev) => ({
      ...prev,
      positioningMatrix: {
        wins: prev.wins,
        companies: prev.companies,
        scores: {
          ...prev.positioningMatrix?.scores,
          [winId]: {
            ...prev.positioningMatrix?.scores?.[winId],
            [problemKey]: score,
          },
        },
      },
    }));
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Positioning Engine</h1>
        <p className="text-muted-foreground mt-1">
          Collect wins, build your fit matrix, craft GRIP narratives and elevator pitches
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="wins"><Trophy className="h-4 w-4 mr-1" />Wins</TabsTrigger>
          <TabsTrigger value="matrix"><Grid3X3 className="h-4 w-4 mr-1" />Fit Matrix</TabsTrigger>
          <TabsTrigger value="grip"><Compass className="h-4 w-4 mr-1" />GRIP</TabsTrigger>
          <TabsTrigger value="pitches"><Mic className="h-4 w-4 mr-1" />Pitches</TabsTrigger>
        </TabsList>

        {/* WINS TAB */}
        <TabsContent value="wins" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Win Collection</h2>
              <p className="text-sm text-muted-foreground">Record your achievements using Before → Insight → Action → After</p>
            </div>
            <Button onClick={() => setWinDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />Add Win
            </Button>
          </div>

          {/* Function checklist */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Win Checklist for Your Function</CardTitle>
              <Select value={selectedFunction} onValueChange={setSelectedFunction}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.keys(WIN_CHECKLISTS).map((fn) => (
                    <SelectItem key={fn} value={fn}>{fn.charAt(0).toUpperCase() + fn.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {WIN_CHECKLISTS[selectedFunction]?.map((item, i) => {
                  const hasWin = data.wins.some((w) => w.title.toLowerCase().includes(item.toLowerCase().slice(0, 20)));
                  return (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${hasWin ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/30'}`}>
                        {hasWin && '✓'}
                      </div>
                      <span className={hasWin ? 'line-through text-muted-foreground' : ''}>{item}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Suggested wins from resume */}
          {data.wins.length === 0 && data.profile?.extractedWins && data.profile.extractedWins.length > 0 && (
            <Card className="border-dashed">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Suggested wins from your resume</CardTitle>
                <p className="text-xs text-muted-foreground">These were extracted from your resume. Click &quot;Add Win&quot; to capture them properly.</p>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.profile.extractedWins.map((win, i) => (
                  <div key={i} className="flex items-start justify-between gap-3 text-sm p-2 bg-muted rounded">
                    <span>{win}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-shrink-0"
                      onClick={() => {
                        setWinForm({ title: win, category: '', before: '', insight: '', action: '', after: '', metrics: [], transferable: true });
                        setWinDialogOpen(true);
                      }}
                    >
                      Add Win
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Win list */}
          {data.wins.map((win) => (
            <Card key={win.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{win.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    {win.transferable && <Badge>Transferable</Badge>}
                    <Button variant="ghost" size="sm" onClick={() => deleteWin(win.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {win.category && <Badge variant="outline">{win.category}</Badge>}
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 text-sm">
                  <div><strong>Before:</strong> {win.before}</div>
                  <div><strong>Insight:</strong> {win.insight}</div>
                  <div><strong>Action:</strong> {win.action}</div>
                  <div><strong>After:</strong> {win.after}</div>
                  {win.metrics.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {win.metrics.map((m, i) => <Badge key={i} variant="secondary">{m}</Badge>)}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* FIT MATRIX TAB */}
        <TabsContent value="matrix" className="mt-4">
          <h2 className="text-lg font-semibold mb-2">Fit Matrix</h2>
          <p className="text-sm text-muted-foreground mb-4">Score how well each win maps to each company problem (0=none, 1=partial, 2=strong)</p>

          {data.wins.length === 0 || allProblems.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Add wins and company problems first to build your fit matrix.
              </CardContent>
            </Card>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left p-2 sticky left-0 bg-background">Win</th>
                    {allProblems.map((p, i) => (
                      <th key={i} className="p-2 text-center min-w-[100px]">
                        <div className="text-xs font-normal text-muted-foreground">{p.companyName}</div>
                        <div className="text-xs">{p.problem}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.wins.map((win) => (
                    <tr key={win.id} className="border-t">
                      <td className="p-2 sticky left-0 bg-background font-medium">{win.title}</td>
                      {allProblems.map((p, i) => {
                        const key = `${p.companyId}:${p.problem}`;
                        const score = matrixScores[win.id]?.[key] ?? 0;
                        return (
                          <td key={i} className="p-2 text-center">
                            <button
                              onClick={() => setMatrixScore(win.id, key, ((score + 1) % 3) as 0 | 1 | 2)}
                              className={`w-8 h-8 rounded-full text-xs font-bold ${
                                score === 2 ? 'bg-green-500 text-white' :
                                score === 1 ? 'bg-yellow-500 text-white' :
                                'bg-muted text-muted-foreground'
                              }`}
                            >
                              {score}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* GRIP TAB */}
        <TabsContent value="grip" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">GRIP Narratives</h2>
              <p className="text-sm text-muted-foreground">Gap → Result → Input Levers → Plan</p>
            </div>
            <Button onClick={() => setGripDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />Add GRIP
            </Button>
          </div>

          <Card className="border-dashed">
            <CardContent className="py-4">
              <p className="text-sm">
                <strong>GRIP = Gap → Result → Input Levers → Plan.</strong> Spend 80% of your narrative on the <strong>Plan</strong> &mdash; that&apos;s where you show you can solve <strong>their</strong> problem, not just talk about your past.
              </p>
            </CardContent>
          </Card>

          {data.gripNarratives.map((grip) => {
            const company = data.companies.find((c) => c.id === grip.companyId);
            return (
              <Card key={grip.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{company?.name || 'General'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div><strong>Gap:</strong> {grip.gap}</div>
                  <div><strong>Result:</strong> {grip.result}</div>
                  <div>
                    <strong>Input Levers:</strong>
                    <ul className="list-disc list-inside ml-2">
                      {grip.inputLevers.map((l, i) => (
                        <li key={i}>{l.lever} ({l.contribution}): {l.detail}</li>
                      ))}
                    </ul>
                  </div>
                  <div><strong>Plan:</strong> {grip.plan}</div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* PITCHES TAB */}
        <TabsContent value="pitches" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Elevator Pitches</h2>
              <p className="text-sm text-muted-foreground">Stranger (10s) &middot; Recruiter (30s) &middot; Peer (2min)</p>
            </div>
            <Button onClick={() => setPitchDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />Add Pitch
            </Button>
          </div>

          <Card className="border-dashed">
            <CardContent className="py-4">
              <p className="text-sm">
                <strong>Three tests:</strong> Stranger (10s) &mdash; can they remember what you do? Recruiter (30s) &mdash; do they want to learn more? Peer (2min) &mdash; do they think &apos;this person gets it&apos;?
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-4">
              <div className="text-sm text-muted-foreground mb-2">Pitch Structure:</div>
              <div className="grid grid-cols-4 gap-2 text-xs">
                {Object.entries(ELEVATOR_PITCH_STRUCTURE).map(([key, desc]) => (
                  <div key={key} className="p-2 bg-muted rounded">
                    <div className="font-medium capitalize">{key}</div>
                    <div className="text-muted-foreground">{desc}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {data.elevatorPitches.map((pitch) => {
            const company = data.companies.find((c) => c.id === pitch.companyId);
            return (
              <Card key={pitch.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{company?.name || 'General'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <Badge variant="outline" className="mb-1">Stranger (10s)</Badge>
                    <p>{pitch.stranger10s}</p>
                  </div>
                  <Separator />
                  <div>
                    <Badge variant="outline" className="mb-1">Recruiter (30s)</Badge>
                    <p>{pitch.recruiter30s}</p>
                  </div>
                  <Separator />
                  <div>
                    <Badge variant="outline" className="mb-1">Peer (2min)</Badge>
                    <p className="whitespace-pre-wrap">{pitch.peer2min}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>

      {/* Win Dialog */}
      <Dialog open={winDialogOpen} onOpenChange={setWinDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add a Win</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <details className="rounded border bg-muted/40 p-2 text-xs text-muted-foreground">
              <summary className="cursor-pointer font-medium text-foreground select-none">See an example</summary>
              <div className="mt-2 space-y-1">
                <p><strong>Title:</strong> {WIN_EXAMPLE.title}</p>
                <p><strong>Before:</strong> {WIN_EXAMPLE.before}</p>
                <p><strong>Insight:</strong> {WIN_EXAMPLE.insight}</p>
                <p><strong>Action:</strong> {WIN_EXAMPLE.action}</p>
                <p><strong>After:</strong> {WIN_EXAMPLE.after}</p>
              </div>
            </details>
            <div>
              <Label>Title</Label>
              <Input value={winForm.title} onChange={(e) => setWinForm({ ...winForm, title: e.target.value })} placeholder="e.g., Built activation flow that improved D7 retention by 23%" />
            </div>
            <div>
              <Label>Category</Label>
              <Input value={winForm.category} onChange={(e) => setWinForm({ ...winForm, category: e.target.value })} placeholder="e.g., Growth, Product, Engineering" />
            </div>
            <div>
              <Label>Before (situation before your involvement)</Label>
              <p className="text-xs text-muted-foreground mb-1">What was the situation before you got involved? Include the metrics.</p>
              <Textarea value={winForm.before} onChange={(e) => setWinForm({ ...winForm, before: e.target.value })} rows={2} placeholder="e.g. Vendor invoice disputes were costing $300K/year and draining ops bandwidth" />
            </div>
            <div>
              <Label>Insight (what you noticed that others didn&apos;t)</Label>
              <p className="text-xs text-muted-foreground mb-1">What did you see that others didn&apos;t?</p>
              <Textarea value={winForm.insight} onChange={(e) => setWinForm({ ...winForm, insight: e.target.value })} rows={2} placeholder="e.g. The invoice itself was redundant — we already had complete sales data" />
            </div>
            <div>
              <Label>Action (what you specifically did)</Label>
              <p className="text-xs text-muted-foreground mb-1">What did YOU personally do? Not your team.</p>
              <Textarea value={winForm.action} onChange={(e) => setWinForm({ ...winForm, action: e.target.value })} rows={2} placeholder="e.g. Analysed dispute patterns, quantified cost, designed automated flow, built ROI case" />
            </div>
            <div>
              <Label>After (measurable outcome)</Label>
              <p className="text-xs text-muted-foreground mb-1">The result with metrics.</p>
              <Textarea value={winForm.after} onChange={(e) => setWinForm({ ...winForm, after: e.target.value })} rows={2} placeholder="e.g. Dispute rate → 0.1%. $300K annual savings." />
            </div>
            <div>
              <Label>Metrics</Label>
              <div className="flex gap-2">
                <Input value={metricInput} onChange={(e) => setMetricInput(e.target.value)} onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (metricInput.trim()) {
                      setWinForm({ ...winForm, metrics: [...winForm.metrics, metricInput.trim()] });
                      setMetricInput('');
                    }
                  }
                }} placeholder="e.g., 23% retention improvement" />
                <Button variant="outline" type="button" onClick={() => {
                  if (metricInput.trim()) {
                    setWinForm({ ...winForm, metrics: [...winForm.metrics, metricInput.trim()] });
                    setMetricInput('');
                  }
                }}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {winForm.metrics.map((m, i) => (
                  <Badge key={i} variant="secondary" className="cursor-pointer" onClick={() => setWinForm({ ...winForm, metrics: winForm.metrics.filter((_, j) => j !== i) })}>
                    {m} &times;
                  </Badge>
                ))}
              </div>
            </div>
            <Button onClick={saveWin} className="w-full">Save Win</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* GRIP Dialog */}
      <Dialog open={gripDialogOpen} onOpenChange={setGripDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add GRIP Narrative</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <details className="rounded border bg-muted/40 p-2 text-xs text-muted-foreground">
              <summary className="cursor-pointer font-medium text-foreground select-none">See an example GRIP story</summary>
              <div className="mt-2 space-y-1">
                <p><strong>Gap:</strong> {GRIP_EXAMPLE.gap}</p>
                <p><strong>Result:</strong> {GRIP_EXAMPLE.result}</p>
                <p><strong>Input Levers:</strong> {GRIP_EXAMPLE.inputLevers}</p>
                <p><strong>Plan (80% of story):</strong> {GRIP_EXAMPLE.plan}</p>
              </div>
            </details>
            <div>
              <Label>Target Company</Label>
              <Select value={gripForm.companyId} onValueChange={(v) => setGripForm({ ...gripForm, companyId: v })}>
                <SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger>
                <SelectContent>
                  {data.companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={generateGRIP} disabled={aiLoading} className="w-full">
              <Sparkles className="h-4 w-4 mr-2" />{aiLoading ? 'Generating...' : 'Generate with AI'}
            </Button>
            <div>
              <Label>Gap</Label>
              <Textarea value={gripForm.gap} onChange={(e) => setGripForm({ ...gripForm, gap: e.target.value })} rows={2} />
            </div>
            <div>
              <Label>Result</Label>
              <Textarea value={gripForm.result} onChange={(e) => setGripForm({ ...gripForm, result: e.target.value })} rows={2} />
            </div>
            <div>
              <Label>Input Levers</Label>
              {gripForm.inputLevers.map((lever, i) => (
                <div key={i} className="grid grid-cols-3 gap-2 mt-2">
                  <Input placeholder="Lever" value={lever.lever} onChange={(e) => {
                    const levers = [...gripForm.inputLevers];
                    levers[i] = { ...levers[i], lever: e.target.value };
                    setGripForm({ ...gripForm, inputLevers: levers });
                  }} />
                  <Input placeholder="Contribution %" value={lever.contribution} onChange={(e) => {
                    const levers = [...gripForm.inputLevers];
                    levers[i] = { ...levers[i], contribution: e.target.value };
                    setGripForm({ ...gripForm, inputLevers: levers });
                  }} />
                  <Input placeholder="Detail" value={lever.detail} onChange={(e) => {
                    const levers = [...gripForm.inputLevers];
                    levers[i] = { ...levers[i], detail: e.target.value };
                    setGripForm({ ...gripForm, inputLevers: levers });
                  }} />
                </div>
              ))}
              <Button variant="outline" size="sm" className="mt-2" onClick={() => setGripForm({ ...gripForm, inputLevers: [...gripForm.inputLevers, { lever: '', contribution: '', detail: '' }] })}>
                + Add Lever
              </Button>
            </div>
            <div>
              <Label>Plan</Label>
              <Textarea value={gripForm.plan} onChange={(e) => setGripForm({ ...gripForm, plan: e.target.value })} rows={2} />
            </div>
            <Button onClick={saveGrip} className="w-full">Save GRIP Narrative</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pitch Dialog */}
      <Dialog open={pitchDialogOpen} onOpenChange={setPitchDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Create Elevator Pitches</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Target Company (optional)</Label>
              <Select value={pitchForm.companyId || 'none'} onValueChange={(v) => setPitchForm({ ...pitchForm, companyId: v === 'none' ? '' : v })}>
                <SelectTrigger><SelectValue placeholder="General" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">General</SelectItem>
                  {data.companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={generatePitches} disabled={aiLoading} className="w-full">
              <Sparkles className="h-4 w-4 mr-2" />{aiLoading ? 'Generating...' : 'Generate with AI'}
            </Button>
            <div>
              <Label>Stranger (10 seconds)</Label>
              <Textarea value={pitchForm.stranger10s} onChange={(e) => setPitchForm({ ...pitchForm, stranger10s: e.target.value })} rows={2} />
            </div>
            <div>
              <Label>Recruiter (30 seconds)</Label>
              <Textarea value={pitchForm.recruiter30s} onChange={(e) => setPitchForm({ ...pitchForm, recruiter30s: e.target.value })} rows={3} />
            </div>
            <div>
              <Label>Peer (2 minutes)</Label>
              <Textarea value={pitchForm.peer2min} onChange={(e) => setPitchForm({ ...pitchForm, peer2min: e.target.value })} rows={6} />
            </div>
            <Button onClick={savePitch} className="w-full">Save Pitches</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
