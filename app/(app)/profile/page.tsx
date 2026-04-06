'use client';

import { useState } from 'react';
import { v4 as uuid } from 'uuid';
import { useCareerData } from '@/hooks/useCareerData';
import { UserProfile, SuperpowerStory } from '@/lib/types';
import { generateAI } from '@/lib/ai';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Loader2, CheckCircle, Edit2, RefreshCw, ChevronDown, ChevronUp,
  Sparkles, ArrowRight, ArrowLeft, Zap,
} from 'lucide-react';

// ---------- helpers ----------

function parseJSON<T>(raw: string): T | null {
  try {
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '').trim();
    return JSON.parse(cleaned);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) { try { return JSON.parse(match[0]); } catch { return null; } }
    return null;
  }
}

const EXTRACTION_PROMPT = `You are analyzing a professional's resume and LinkedIn profile. Return ONLY valid JSON, no markdown fences.

{
  "name": "...",
  "currentRole": "...",
  "yearsExperience": 0,
  "function": "product|marketing|growth|tech|other",
  "careerTimeline": [{ "company": "...", "title": "...", "startYear": 2020, "endYear": 2023, "highlights": ["..."] }],
  "skills": ["8-12 concrete skills"],
  "extractedWins": ["5-8 quantified achievements with metrics"],
  "superpowers": ["3-5 recurring themes across career"],
  "careerSummary": "2-3 sentence narrative framing career arc (India startup context)"
}

Rules: reverse chronological timeline. endYear: null if current. skills: concrete domains not soft skills. extractedWins: business impact with numbers. superpowers: meta-skills visible across roles. If unknown, use null/empty. No extra fields.`;

// ---------- constants ----------

const STORY_DOMAINS = [
  'Finance / Business Case',
  'Engineering / Architecture',
  'Data / SQL / Analytics',
  'User Research',
  'Operations / Supply Chain',
  'Design / UX',
  'Sales / GTM',
  'Legal / Compliance',
  'Team Management',
  'Other',
];

const EMPTY_STORY = (): SuperpowerStory => ({
  id: uuid(),
  situation: '',
  whatOthersSaw: '',
  whatYouSaw: '',
  action: '',
  outcome: '',
  domains: [],
});

const STEP_LABELS = ['Mine Your Stories', 'Find Your Pattern', 'Craft Your Statement', 'Save'];

// ---------- StoryCard ----------

function StoryCard({
  story,
  index,
  onChange,
}: {
  story: SuperpowerStory;
  index: number;
  onChange: (updated: SuperpowerStory) => void;
}) {
  const [open, setOpen] = useState(index === 0);
  const isFilled = story.situation.trim().length > 20 && story.outcome.trim().length > 10;

  const field = (
    label: string,
    key: keyof SuperpowerStory,
    placeholder: string,
    hint?: string,
    rows = 2,
  ) => (
    <div className="space-y-1">
      <Label className="text-sm font-medium">{label}</Label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      <Textarea
        rows={rows}
        value={(story[key] as string) || ''}
        onChange={(e) => onChange({ ...story, [key]: e.target.value })}
        placeholder={placeholder}
        className="resize-none text-sm"
      />
    </div>
  );

  const toggleDomain = (d: string) => {
    const domains = story.domains.includes(d)
      ? story.domains.filter((x) => x !== d)
      : [...story.domains, d];
    onChange({ ...story, domains });
  };

  return (
    <Card className={`transition-colors ${isFilled ? 'border-primary/40' : ''}`}>
      <button
        type="button"
        className="w-full text-left px-4 py-3 flex items-center justify-between"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex items-center gap-3">
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
            isFilled ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground border'
          }`}>
            {isFilled ? '✓' : index + 1}
          </span>
          <span className="font-medium text-sm">
            Story {index + 1}
            {story.situation && (
              <span className="text-muted-foreground font-normal ml-2 line-clamp-1">
                — {story.situation.slice(0, 60)}{story.situation.length > 60 ? '…' : ''}
              </span>
            )}
          </span>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {open && (
        <CardContent className="pt-0 space-y-4">
          <Separator />
          {field(
            'The situation',
            'situation',
            'e.g. "Vendor invoice disputes were costing $300K/year and draining ops bandwidth. The existing bill-checker algorithm was the assumed solution..."',
            'What was broken or not working? What was the assumed problem?',
            3,
          )}
          {field(
            'What others thought the problem was',
            'whatOthersSaw',
            'e.g. "The team wanted to make the bill-checker algorithm smarter with better validation rules."',
            'The conventional view — what most people would have done.',
          )}
          {field(
            'What you saw differently',
            'whatYouSaw',
            'e.g. "Why are vendors sending invoices at all when we already have complete sales data? The invoice is redundant information."',
            'The reframe. The assumption you questioned. What others missed.',
            3,
          )}
          {field(
            'What you personally did',
            'action',
            'e.g. "I analysed dispute patterns, quantified the cost, designed an automated invoicing flow with engineers, and built the ROI case for leadership."',
            'Be specific. What did YOU do — not your team, not later hires.',
            3,
          )}
          {field(
            'Outcome',
            'outcome',
            'e.g. "Dispute rate dropped to 0.1%. $300K annual savings. Vendor satisfaction improved."',
            'The result with metrics.',
          )}

          <div className="space-y-2">
            <Label className="text-sm font-medium">Domains you went deep in for this story</Label>
            <p className="text-xs text-muted-foreground">Which disciplines did you need specialist-level fluency in to pull this off?</p>
            <div className="flex flex-wrap gap-2">
              {STORY_DOMAINS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDomain(d)}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                    story.domains.includes(d)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// ---------- SuperpowerWizard ----------

function SuperpowerWizard({
  profile,
  onSave,
}: {
  profile: UserProfile;
  onSave: (updates: Partial<UserProfile>) => Promise<void>;
}) {
  const existingStories = profile.superpowerStories;
  const [step, setStep] = useState(1);
  const [stories, setStories] = useState<SuperpowerStory[]>(
    existingStories && existingStories.length === 3
      ? existingStories
      : [EMPTY_STORY(), EMPTY_STORY(), EMPTY_STORY()],
  );
  const [reframePattern, setReframePattern] = useState('');
  const [domainPattern, setDomainPattern] = useState('');
  const [agencyPattern, setAgencyPattern] = useState('');
  const [punchline, setPunchline] = useState(profile.superpowerPunchline || '');
  const [statement30s, setStatement30s] = useState(profile.superpowerStatement30s || '');
  const [fullStatement, setFullStatement] = useState(profile.superpowerStatement || '');
  const [analyzing, setAnalyzing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const filledStoryCount = stories.filter(
    (s) => s.situation.trim().length > 20 && s.outcome.trim().length > 10,
  ).length;

  const canAnalyze = filledStoryCount >= 2;
  const canGenerate = reframePattern.trim().length > 20;
  const canSave = punchline.trim().length > 10 && fullStatement.trim().length > 30;

  const updateStory = (i: number, updated: SuperpowerStory) => {
    setStories((prev) => prev.map((s, j) => (j === i ? updated : s)));
  };

  const analyzePatterns = async () => {
    setAnalyzing(true);
    const storySummaries = stories
      .filter((s) => s.situation.trim())
      .map(
        (s, i) =>
          `STORY ${i + 1}:\nSituation: ${s.situation}\nOthers saw: ${s.whatOthersSaw}\nYou saw: ${s.whatYouSaw}\nWhat you did: ${s.action}\nOutcome: ${s.outcome}\nDomains: ${s.domains.join(', ')}`,
      )
      .join('\n\n');

    const result = await generateAI({
      prompt: `You are identifying a professional's unique superpower pattern from their career stories.

${storySummaries}

Analyse these stories and return ONLY valid JSON:
{
  "reframePattern": "A specific sentence starting with 'In each story, [they]...' describing the consistent way they reframe problems — be specific, not generic",
  "domainPattern": "A specific sentence about which domains they consistently go deep in and how — mention specific domains from the stories",
  "agencyPattern": "A specific sentence about what they consistently do themselves (not delegate) — mention specific actions"
}

Be specific. Avoid generic phrases like 'results-driven' or 'thinks outside the box'. Ground everything in the actual stories.`,
      maxTokens: 600,
    });

    if (result.content) {
      const parsed = parseJSON<{ reframePattern: string; domainPattern: string; agencyPattern: string }>(result.content);
      if (parsed) {
        setReframePattern(parsed.reframePattern || '');
        setDomainPattern(parsed.domainPattern || '');
        setAgencyPattern(parsed.agencyPattern || '');
        setStep(2);
      }
    }
    setAnalyzing(false);
  };

  const generateStatement = async () => {
    setGenerating(true);
    const wins = stories
      .filter((s) => s.outcome.trim())
      .map((s) => s.outcome)
      .join(' | ');

    const result = await generateAI({
      prompt: `You are crafting a professional positioning statement for a job seeker.

PATTERNS IDENTIFIED:
- Reframe: ${reframePattern}
- Domain depth: ${domainPattern}
- Agency: ${agencyPattern}

KEY OUTCOMES FROM THEIR STORIES:
${wins}

CAREER CONTEXT:
Role: ${profile.currentRole}, ${profile.yearsExperience} years experience

Generate 3 versions of their superpower statement. Return ONLY valid JSON:
{
  "punchline": "One memorable sentence (~15 words) in first person that captures their unique value. No clichés.",
  "statement30s": "2-3 sentences in first person for a recruiter conversation. Specific and grounded in how they work.",
  "fullStatement": "4-5 sentences in first person: full positioning with proof points, domain depth, and what makes them different."
}

Rules: first person. No buzzwords. Specific over general. Mention actual domains and methods.`,
      maxTokens: 800,
    });

    if (result.content) {
      const parsed = parseJSON<{ punchline: string; statement30s: string; fullStatement: string }>(result.content);
      if (parsed) {
        setPunchline(parsed.punchline || '');
        setStatement30s(parsed.statement30s || '');
        setFullStatement(parsed.fullStatement || '');
        setStep(3);
      }
    }
    setGenerating(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const allDomains = [...new Set(stories.flatMap((s) => s.domains))];
    const agencyItems = agencyPattern ? [agencyPattern] : [];
    await onSave({
      superpowerStories: stories,
      superpowerPunchline: punchline,
      superpowerStatement30s: statement30s,
      superpowerStatement: fullStatement,
      superpowerDomains: allDomains,
      superpowerAgency: agencyItems,
      superpowerDiscoveryCompleted: true,
    });
    setSaving(false);
    setStep(4);
  };

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-1">
        {STEP_LABELS.map((label, i) => {
          const num = i + 1;
          const isDone = step > num;
          const isActive = step === num;
          return (
            <div key={label} className="flex items-center gap-1 flex-1">
              <div className={`flex items-center gap-1.5 ${isActive ? 'text-primary' : isDone ? 'text-green-600' : 'text-muted-foreground'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border-2 ${
                  isActive ? 'border-primary bg-primary text-primary-foreground' :
                  isDone ? 'border-green-600 bg-green-600 text-white' :
                  'border-muted-foreground/30'
                }`}>
                  {isDone ? '✓' : num}
                </div>
                <span className="text-xs font-medium hidden sm:block">{label}</span>
              </div>
              {i < STEP_LABELS.length - 1 && (
                <div className={`flex-1 h-px mx-1 ${isDone ? 'bg-green-600' : 'bg-border'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Step 1: Story Mining ── */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Mine your stories</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Think of 3 moments where you created disproportionate value — not just delivered results, but saw something others missed. Fill in at least 2 to continue.
            </p>
          </div>

          <Card className="bg-muted/40 border-dashed">
            <CardContent className="py-3 px-4">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Why stories?</span>{' '}
                Resumes describe WHAT you did. Your superpower is HOW you think. These stories will reveal the pattern.
              </p>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {stories.map((story, i) => (
              <StoryCard key={story.id} story={story} index={i} onChange={(u) => updateStory(i, u)} />
            ))}
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-muted-foreground">
              {filledStoryCount}/3 stories filled {filledStoryCount < 2 && '— need at least 2'}
            </p>
            <Button onClick={analyzePatterns} disabled={!canAnalyze || analyzing}>
              {analyzing ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Analysing...</>
              ) : (
                <>Find my pattern <ArrowRight className="h-4 w-4 ml-2" /></>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 2: Pattern Analysis ── */}
      {step === 2 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-semibold">Your patterns</h2>
            <p className="text-sm text-muted-foreground mt-1">
              These patterns emerged from your stories. Edit anything that doesn&apos;t feel right — then generate your superpower statement.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-sm font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary" />
                The Reframe Pattern
              </Label>
              <p className="text-xs text-muted-foreground">How you consistently question problems before solving them</p>
              <Textarea
                rows={3}
                value={reframePattern}
                onChange={(e) => setReframePattern(e.target.value)}
                className="resize-none text-sm"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-sm font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                The Domain Depth Pattern
              </Label>
              <p className="text-xs text-muted-foreground">Which disciplines you go deep in — earning specialist credibility, not just translator fluency</p>
              <Textarea
                rows={3}
                value={domainPattern}
                onChange={(e) => setDomainPattern(e.target.value)}
                className="resize-none text-sm"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-sm font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                The Agency Pattern
              </Label>
              <p className="text-xs text-muted-foreground">What you consistently do yourself rather than delegating</p>
              <Textarea
                rows={3}
                value={agencyPattern}
                onChange={(e) => setAgencyPattern(e.target.value)}
                className="resize-none text-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />Back
            </Button>
            <Button onClick={generateStatement} disabled={!canGenerate || generating}>
              {generating ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Crafting...</>
              ) : (
                <><Sparkles className="h-4 w-4 mr-2" />Generate my superpower</>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 3: Statement Versions ── */}
      {step === 3 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-semibold">Your superpower statement</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Three versions for different contexts. Edit until each feels true — not polished, true.
            </p>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                <Label className="text-sm font-semibold">The Punchline</Label>
                <Badge variant="outline" className="text-xs">~15 words · for a cold intro</Badge>
              </div>
              <Textarea
                rows={2}
                value={punchline}
                onChange={(e) => setPunchline(e.target.value)}
                className="resize-none text-sm font-medium"
                placeholder="One memorable sentence that captures your unique value..."
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-semibold">The 30-Second Version</Label>
                <Badge variant="outline" className="text-xs">recruiter conversations</Badge>
              </div>
              <Textarea
                rows={4}
                value={statement30s}
                onChange={(e) => setStatement30s(e.target.value)}
                className="resize-none text-sm"
                placeholder="2-3 sentences for when someone asks 'tell me about yourself'..."
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-semibold">The Full Statement</Label>
                <Badge variant="outline" className="text-xs">positioning doc · cold email context</Badge>
              </div>
              <Textarea
                rows={6}
                value={fullStatement}
                onChange={(e) => setFullStatement(e.target.value)}
                className="resize-none text-sm"
                placeholder="4-5 sentences with proof points and domain depth..."
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button variant="outline" onClick={() => setStep(2)}>
              <ArrowLeft className="h-4 w-4 mr-2" />Back
            </Button>
            <Button onClick={handleSave} disabled={!canSave || saving}>
              {saving ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
              ) : (
                <><CheckCircle className="h-4 w-4 mr-2" />Save my superpower</>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 4: Done ── */}
      {step === 4 && (
        <div className="space-y-6">
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Zap className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-xl font-bold">Superpower saved</h2>
            <p className="text-sm text-muted-foreground mt-1">
              This will now drive your company research, positioning, and outreach — everywhere.
            </p>
          </div>

          <div className="space-y-4">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="py-4 px-5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Punchline</p>
                <p className="font-semibold leading-snug">{punchline}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="py-4 px-5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">30-Second Version</p>
                <p className="text-sm leading-relaxed">{statement30s}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="py-4 px-5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Full Statement</p>
                <p className="text-sm leading-relaxed">{fullStatement}</p>
              </CardContent>
            </Card>
          </div>

          <Button variant="outline" className="w-full" onClick={() => setStep(1)}>
            Redo discovery
          </Button>
        </div>
      )}
    </div>
  );
}

// ---------- SuperpowerDisplay (already completed) ----------

function SuperpowerDisplay({
  profile,
  onRedo,
}: {
  profile: UserProfile;
  onRedo: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Your superpower</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Discovered via structured story analysis</p>
        </div>
        <Button variant="outline" size="sm" onClick={onRedo}>
          <RefreshCw className="h-4 w-4 mr-2" />Redo discovery
        </Button>
      </div>

      {profile.superpowerPunchline && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-4 px-5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Punchline</p>
            <p className="text-lg font-bold leading-snug">{profile.superpowerPunchline}</p>
          </CardContent>
        </Card>
      )}

      {profile.superpowerStatement30s && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">30-Second Version</p>
          <p className="text-sm leading-relaxed">{profile.superpowerStatement30s}</p>
        </div>
      )}

      {profile.superpowerStatement && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Full Statement</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{profile.superpowerStatement}</p>
        </div>
      )}

      {profile.superpowerDomains && profile.superpowerDomains.length > 0 && (
        <div className="space-y-2">
          <Separator />
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Domains you go deep in</p>
          <div className="flex flex-wrap gap-2">
            {profile.superpowerDomains.map((d, i) => (
              <Badge key={i} variant="secondary">{d}</Badge>
            ))}
          </div>
        </div>
      )}

      {profile.superpowerStories && profile.superpowerStories.length > 0 && (
        <div className="space-y-2">
          <Separator />
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Stories this was built from</p>
          {profile.superpowerStories.filter(s => s.situation).map((s, i) => (
            <div key={s.id} className="text-sm p-3 bg-muted rounded-lg">
              <span className="font-medium">Story {i + 1}: </span>
              <span className="text-muted-foreground">{s.situation.slice(0, 120)}{s.situation.length > 120 ? '…' : ''}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- ProfileDetails (existing content) ----------

function ProfileDetails({ profile }: { profile: UserProfile }) {
  const { data, update } = useCareerData();
  const [editing, setEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>(profile);
  const [reprocessing, setReprocessing] = useState(false);

  const handleSave = async () => {
    await update((prev) => ({
      ...prev,
      profile: {
        name: '',
        currentRole: '',
        yearsExperience: 0,
        function: 'other',
        targetIndustries: [],
        targetCompanyStages: [],
        ...prev.profile,
        ...editedProfile,
      },
    }));
    setEditing(false);
  };

  const handleReprocess = async () => {
    if (!profile.rawResume) return;
    setReprocessing(true);
    const context = `RESUME:\n${profile.rawResume}\n\nLINKEDIN:\n${profile.rawLinkedIn || 'Not provided'}`;
    try {
      const result = await generateAI({ prompt: EXTRACTION_PROMPT, context, maxTokens: 2000 });
      if (result.error || !result.content) throw new Error('Failed');
      const parsed = parseJSON<Partial<UserProfile>>(result.content);
      if (!parsed) throw new Error('Parse failed');
      await update((prev) => {
        const base = {
          name: '',
          currentRole: '',
          yearsExperience: 0,
          function: 'other' as const,
          targetIndustries: [] as string[],
          targetCompanyStages: [] as string[],
          ...prev.profile,
          ...parsed,
        };
        return {
          ...prev,
          profile: {
            ...base,
            targetIndustries: parsed.targetIndustries || prev.profile?.targetIndustries || [],
            targetCompanyStages: parsed.targetCompanyStages || prev.profile?.targetCompanyStages || [],
            rawResume: profile.rawResume,
            rawLinkedIn: profile.rawLinkedIn,
            onboardingCompleted: true,
          },
        };
      });
      setEditedProfile({ ...data.profile, ...parsed });
    } catch {
      // silently fail
    } finally {
      setReprocessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base">Profile Details</CardTitle>
          <div className="flex items-center gap-2">
            {profile.rawResume && (
              <Button variant="outline" size="sm" onClick={handleReprocess} disabled={reprocessing}>
                {reprocessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                Re-process Resume
              </Button>
            )}
            <Button size="sm" onClick={() => { setEditedProfile(profile); setEditing(!editing); }} variant={editing ? 'secondary' : 'outline'}>
              <Edit2 className="h-4 w-4 mr-2" />{editing ? 'Cancel' : 'Edit'}
            </Button>
            {editing && <Button size="sm" onClick={handleSave}>Save</Button>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Name</Label>
            {editing ? (
              <Input value={editedProfile.name || ''} onChange={(e) => setEditedProfile({ ...editedProfile, name: e.target.value })} className="mt-1" />
            ) : (
              <p className="mt-1 font-medium">{profile.name || '—'}</p>
            )}
          </div>
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Current Role</Label>
            {editing ? (
              <Input value={editedProfile.currentRole || ''} onChange={(e) => setEditedProfile({ ...editedProfile, currentRole: e.target.value })} className="mt-1" />
            ) : (
              <p className="mt-1 font-medium">{profile.currentRole || '—'}</p>
            )}
          </div>
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Years of Experience</Label>
            {editing ? (
              <Input type="number" value={editedProfile.yearsExperience || ''} onChange={(e) => setEditedProfile({ ...editedProfile, yearsExperience: Number(e.target.value) })} className="mt-1" />
            ) : (
              <p className="mt-1 font-medium">{profile.yearsExperience ?? '—'} years</p>
            )}
          </div>
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Function</Label>
            {editing ? (
              <Select value={editedProfile.function || 'other'} onValueChange={(v) => setEditedProfile({ ...editedProfile, function: v as UserProfile['function'] })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(['product', 'marketing', 'growth', 'tech', 'other'] as const).map((fn) => (
                    <SelectItem key={fn} value={fn}>{fn.charAt(0).toUpperCase() + fn.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="mt-1"><Badge>{profile.function}</Badge></div>
            )}
          </div>
        </div>

        {(profile.careerSummary || editing) && (
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Career Summary</Label>
            {editing ? (
              <Textarea value={editedProfile.careerSummary || ''} onChange={(e) => setEditedProfile({ ...editedProfile, careerSummary: e.target.value })} rows={3} className="mt-1" />
            ) : (
              <p className="mt-1 text-sm leading-relaxed">{profile.careerSummary}</p>
            )}
          </div>
        )}

        {/* Legacy superpowers tags — shown only if discovery not completed */}
        {!profile.superpowerDiscoveryCompleted && profile.superpowers && profile.superpowers.length > 0 && (
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Extracted Themes (from resume)</Label>
            <div className="mt-2 p-3 bg-muted rounded-lg">
              <div className="flex flex-wrap gap-2">
                {profile.superpowers.map((sp, i) => (
                  <Badge key={i} variant="secondary">{sp}</Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">These are resume keywords, not your superpower. Go to the Superpower tab to discover the real thing.</p>
            </div>
          </div>
        )}

        {profile.careerTimeline && profile.careerTimeline.length > 0 && (
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Career Timeline</Label>
            <div className="mt-2 space-y-2">
              {profile.careerTimeline.map((role, i) => (
                <div key={i} className="flex items-start gap-3 text-sm p-3 bg-muted rounded-lg">
                  <div className="flex-1">
                    <span className="font-medium">{role.company}</span>
                    <span className="text-muted-foreground"> · {role.title}</span>
                    {role.highlights && role.highlights.length > 0 && (
                      <ul className="mt-1 list-disc list-inside text-muted-foreground space-y-0.5">
                        {role.highlights.map((h, j) => <li key={j}>{h}</li>)}
                      </ul>
                    )}
                  </div>
                  <span className="text-muted-foreground whitespace-nowrap">{role.startYear}–{role.endYear ?? 'Present'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {profile.skills && profile.skills.length > 0 && (
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Skills</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {profile.skills.map((skill, i) => <Badge key={i} variant="secondary">{skill}</Badge>)}
            </div>
          </div>
        )}

        {profile.extractedWins && profile.extractedWins.length > 0 && (
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Key Wins (from resume)</Label>
            <ul className="mt-2 space-y-1">
              {profile.extractedWins.map((win, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span>{win}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------- Main Page ----------

export default function ProfilePage() {
  const { data, update } = useCareerData();
  const [wizardKey, setWizardKey] = useState(0); // force remount on redo
  const profile = data.profile;

  const saveSuperpowerUpdates = async (updates: Partial<UserProfile>) => {
    await update((prev) => ({
      ...prev,
      profile: {
        name: '',
        currentRole: '',
        yearsExperience: 0,
        function: 'other' as const,
        targetIndustries: [] as string[],
        targetCompanyStages: [] as string[],
        ...prev.profile,
        ...updates,
      },
    }));
  };

  if (!profile) return null;

  const superpowerTabLabel = profile.superpowerDiscoveryCompleted
    ? <span className="flex items-center gap-1.5"><Zap className="h-3 w-3 text-yellow-500" />Superpower</span>
    : <span className="flex items-center gap-1.5"><Sparkles className="h-3 w-3" />Discover Superpower</span>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground mt-1">Your career profile and superpower — used across all phases</p>
      </div>

      <Tabs defaultValue={profile.superpowerDiscoveryCompleted ? 'superpower' : 'profile'}>
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="superpower">{superpowerTabLabel}</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <ProfileDetails profile={profile} />
        </TabsContent>

        <TabsContent value="superpower" className="mt-6">
          {profile.superpowerDiscoveryCompleted ? (
            <SuperpowerDisplay
              profile={profile}
              onRedo={() => {
                setWizardKey((k) => k + 1);
                saveSuperpowerUpdates({ superpowerDiscoveryCompleted: false });
              }}
            />
          ) : (
            <SuperpowerWizard
              key={wizardKey}
              profile={profile}
              onSave={saveSuperpowerUpdates}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
