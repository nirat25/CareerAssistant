'use client';

import { useState } from 'react';
import { v4 as uuid } from 'uuid';
import { useCareerData } from '@/hooks/useCareerData';
import { useAI } from '@/hooks/useAI';
import { ProofOfWork, SprintDay, UserTestEntry } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, CheckCircle, Circle, Plus } from 'lucide-react';

export default function ProofPage() {
  const { data, update, updatePhaseProgress } = useCareerData();
  const { generate, loading: aiLoading } = useAI();
  const [companyId, setCompanyId] = useState('');
  const [topMetric, setTopMetric] = useState('');
  const [targetLever, setTargetLever] = useState('');

  const createProof = async () => {
    const company = data.companies.find((c) => c.id === companyId);
    if (!company) return;

    const sprintPlan: SprintDay[] = Array.from({ length: 10 }, (_, i) => ({
      day: i + 1,
      task: '',
      milestone: i === 4 ? 'MVP ready' : i === 7 ? 'User testing' : i === 9 ? 'Package & Send' : '',
      completed: false,
    }));

    const proof: ProofOfWork = {
      id: uuid(),
      companyId,
      companyType: company.type,
      growthEquation: { topMetric, levels: [] },
      targetLever,
      sprintPlan,
      userTestingLog: [],
    };

    await update((prev) => ({
      ...prev,
      proofsOfWork: [...prev.proofsOfWork, proof],
    }));
    updatePhaseProgress('proof', Math.min(100, ((data.proofsOfWork.length + 1) / 2) * 50));
  };

  const generateGrowthEquation = async () => {
    const company = data.companies.find((c) => c.id === companyId);
    if (!company) return;

    const result = await generate({
      prompt: `Decode the growth equation for ${company.name} (${company.industry}, ${company.type} company).

Break down their top-level metric into sub-levers. Format:
TOP METRIC: [e.g., Revenue]
LEVEL 1: [e.g., Orders × AOV]
LEVEL 2: [e.g., New Users × Activation Rate × Purchase Rate]
SUGGESTED LEVER: [Pick ONE lever that a job seeker could build proof-of-work around in 10 days]
10-DAY SPRINT: [Brief day-by-day plan]

Be specific to their business model.`,
    });

    if (result) {
      const topMatch = result.match(/TOP METRIC:\s*(.*)/i);
      const leverMatch = result.match(/SUGGESTED LEVER:\s*(.*)/i);
      if (topMatch) setTopMetric(topMatch[1].trim());
      if (leverMatch) setTargetLever(leverMatch[1].trim());
    }
  };

  const toggleSprintDay = async (proofId: string, dayIndex: number) => {
    await update((prev) => ({
      ...prev,
      proofsOfWork: prev.proofsOfWork.map((p) =>
        p.id === proofId
          ? {
              ...p,
              sprintPlan: p.sprintPlan.map((d, i) =>
                i === dayIndex ? { ...d, completed: !d.completed } : d
              ),
            }
          : p
      ),
    }));
  };

  const updateSprintTask = async (proofId: string, dayIndex: number, task: string) => {
    await update((prev) => ({
      ...prev,
      proofsOfWork: prev.proofsOfWork.map((p) =>
        p.id === proofId
          ? {
              ...p,
              sprintPlan: p.sprintPlan.map((d, i) =>
                i === dayIndex ? { ...d, task } : d
              ),
            }
          : p
      ),
    }));
  };

  const addTestEntry = async (proofId: string) => {
    const entry: UserTestEntry = {
      id: uuid(),
      date: new Date().toISOString(),
      quotes: [],
      delightMoments: [],
      confusionPoints: [],
      timeSaved: '',
    };
    await update((prev) => ({
      ...prev,
      proofsOfWork: prev.proofsOfWork.map((p) =>
        p.id === proofId ? { ...p, userTestingLog: [...p.userTestingLog, entry] } : p
      ),
    }));
  };

  const generatePitchEmail = async (proofId: string) => {
    const proof = data.proofsOfWork.find((p) => p.id === proofId);
    const company = data.companies.find((c) => c.id === proof?.companyId);
    if (!proof || !company) return;

    const completedDays = proof.sprintPlan.filter((d) => d.completed).length;

    const result = await generate({
      prompt: `Generate a proof-of-work pitch email for sending to ${company.name}.

Format: Problem → Solution → Feedback → Impact
Target lever: ${proof.targetLever}
Sprint progress: ${completedDays}/10 days completed
Company type: ${proof.companyType}

Make it concise, specific, and actionable. Include a clear CTA.`,
    });

    if (result) {
      await update((prev) => ({
        ...prev,
        proofsOfWork: prev.proofsOfWork.map((p) =>
          p.id === proofId ? { ...p, pitchEmail: result } : p
        ),
      }));
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Proof of Work Tracker</h1>
        <p className="text-muted-foreground mt-1">
          Build tangible proof in a 10-day sprint for your target companies
        </p>
      </div>

      {/* Create new proof */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Start a Proof-of-Work Sprint</CardTitle>
          <CardDescription>Pick a company, decode their growth equation, target one lever</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Target Company</Label>
            <Select value={companyId} onValueChange={setCompanyId}>
              <SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger>
              <SelectContent>
                {data.companies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name} ({c.type})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {companyId && (
            <>
              <Button variant="outline" onClick={generateGrowthEquation} disabled={aiLoading}>
                <Sparkles className="h-4 w-4 mr-2" />{aiLoading ? 'Analyzing...' : 'Decode Growth Equation with AI'}
              </Button>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Top Metric</Label>
                  <Input value={topMetric} onChange={(e) => setTopMetric(e.target.value)} placeholder="e.g., Revenue" />
                </div>
                <div>
                  <Label>Target Lever</Label>
                  <Input value={targetLever} onChange={(e) => setTargetLever(e.target.value)} placeholder="e.g., Activation rate" />
                </div>
              </div>
              <Button onClick={createProof} disabled={!topMetric || !targetLever}>
                <Plus className="h-4 w-4 mr-2" />Start 10-Day Sprint
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Existing proofs */}
      {data.proofsOfWork.map((proof) => {
        const company = data.companies.find((c) => c.id === proof.companyId);
        const completedDays = proof.sprintPlan.filter((d) => d.completed).length;

        return (
          <Card key={proof.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">{company?.name || 'Unknown'}</CardTitle>
                  <CardDescription>
                    Target: {proof.targetLever} &middot; {completedDays}/10 days
                  </CardDescription>
                </div>
                <Badge variant={completedDays === 10 ? 'default' : 'secondary'}>
                  {Math.round((completedDays / 10) * 100)}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="sprint">
                <TabsList>
                  <TabsTrigger value="sprint">Sprint Plan</TabsTrigger>
                  <TabsTrigger value="testing">User Testing</TabsTrigger>
                  <TabsTrigger value="pitch">Pitch Email</TabsTrigger>
                </TabsList>

                <TabsContent value="sprint" className="mt-4 space-y-2">
                  {proof.sprintPlan.map((day, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <button onClick={() => toggleSprintDay(proof.id, i)}>
                        {day.completed
                          ? <CheckCircle className="h-5 w-5 text-green-500" />
                          : <Circle className="h-5 w-5 text-muted-foreground" />}
                      </button>
                      <span className="text-sm font-medium w-14">Day {day.day}</span>
                      <Input
                        value={day.task}
                        onChange={(e) => updateSprintTask(proof.id, i, e.target.value)}
                        placeholder="What to do today..."
                        className="flex-1 text-sm"
                      />
                      {day.milestone && <Badge variant="outline" className="text-xs">{day.milestone}</Badge>}
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="testing" className="mt-4 space-y-4">
                  <Button variant="outline" size="sm" onClick={() => addTestEntry(proof.id)}>
                    <Plus className="h-4 w-4 mr-2" />Log Test Session
                  </Button>
                  {proof.userTestingLog.map((entry) => (
                    <div key={entry.id} className="p-3 bg-muted rounded-lg text-sm">
                      <div className="text-xs text-muted-foreground mb-1">
                        {new Date(entry.date).toLocaleDateString()}
                      </div>
                      <p className="text-muted-foreground">
                        Quotes: {entry.quotes.length} | Delight: {entry.delightMoments.length} | Confusion: {entry.confusionPoints.length}
                      </p>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="pitch" className="mt-4 space-y-4">
                  <Button variant="outline" onClick={() => generatePitchEmail(proof.id)} disabled={aiLoading}>
                    <Sparkles className="h-4 w-4 mr-2" />{aiLoading ? 'Generating...' : 'Generate Pitch Email'}
                  </Button>
                  {proof.pitchEmail && (
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm whitespace-pre-wrap">{proof.pitchEmail}</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
