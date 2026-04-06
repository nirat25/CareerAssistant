'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCareerData } from '@/hooks/useCareerData';
import { UserProfile } from '@/lib/types';
import { generateAI } from '@/lib/ai';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CheckCircle, ArrowRight } from 'lucide-react';

function parseExtractedJSON(raw: string): Partial<UserProfile> | null {
  try {
    const cleaned = raw
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();
    return JSON.parse(cleaned);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

interface ProfileCardProps {
  extracted: Partial<UserProfile>;
  onChange: (updated: Partial<UserProfile>) => void;
}

function ProfileCard({ extracted, onChange }: ProfileCardProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 space-y-1">
          <Input
            value={extracted.name || ''}
            onChange={(e) => onChange({ ...extracted, name: e.target.value })}
            placeholder="Your name"
            className="text-lg font-semibold"
          />
          <Input
            value={extracted.currentRole || ''}
            onChange={(e) => onChange({ ...extracted, currentRole: e.target.value })}
            placeholder="Current role"
          />
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={extracted.yearsExperience || ''}
            onChange={(e) => onChange({ ...extracted, yearsExperience: Number(e.target.value) })}
            placeholder="Years"
            className="w-20"
          />
          <span className="text-sm text-muted-foreground">yrs</span>
          <Select
            value={extracted.function || 'other'}
            onValueChange={(v) => onChange({ ...extracted, function: v as UserProfile['function'] })}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(['product', 'marketing', 'growth', 'tech', 'other'] as const).map((fn) => (
                <SelectItem key={fn} value={fn}>{fn.charAt(0).toUpperCase() + fn.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Career Summary */}
      {extracted.careerSummary !== undefined && (
        <div>
          <Label className="text-sm font-semibold">Career Summary</Label>
          <Textarea
            value={extracted.careerSummary || ''}
            onChange={(e) => onChange({ ...extracted, careerSummary: e.target.value })}
            rows={3}
            placeholder="Your career narrative..."
            className="mt-1"
          />
        </div>
      )}

      {/* Superpowers */}
      {extracted.superpowers && extracted.superpowers.length > 0 && (
        <div>
          <Label className="text-sm font-semibold">Extracted Themes (from resume)</Label>
          <div className="mt-2 p-3 bg-muted border rounded-lg">
            <div className="flex flex-wrap gap-2 mb-2">
              {extracted.superpowers.map((sp, i) => (
                <Badge key={i} variant="secondary">{sp}</Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">These are recurring patterns from your resume — not your superpower. You&apos;ll discover your real superpower in the Profile section after setup.</p>
          </div>
        </div>
      )}

      {/* Career Timeline */}
      {extracted.careerTimeline && extracted.careerTimeline.length > 0 && (
        <div>
          <Label className="text-sm font-semibold">Career Timeline</Label>
          <div className="mt-2 space-y-2">
            {extracted.careerTimeline.map((role, i) => (
              <div key={i} className="flex items-start gap-3 text-sm p-2 bg-muted rounded">
                <div className="flex-1">
                  <span className="font-medium">{role.company}</span>
                  <span className="text-muted-foreground"> · {role.title}</span>
                </div>
                <span className="text-muted-foreground whitespace-nowrap">
                  {role.startYear}–{role.endYear ?? 'Present'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {extracted.skills && extracted.skills.length > 0 && (
        <div>
          <Label className="text-sm font-semibold">Skills</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {extracted.skills.map((skill, i) => (
              <Badge key={i} variant="secondary">{skill}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Key Wins */}
      {extracted.extractedWins && extracted.extractedWins.length > 0 && (
        <div>
          <Label className="text-sm font-semibold">Key Wins (from your resume)</Label>
          <ul className="mt-2 space-y-1">
            {extracted.extractedWins.map((win, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>{win}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

interface ManualFallbackProps {
  value: Partial<UserProfile>;
  onChange: (v: Partial<UserProfile>) => void;
}

function ManualFallback({ value, onChange }: ManualFallbackProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        AI extraction failed. Please fill in the basics manually.
      </p>
      <div>
        <Label>Full Name</Label>
        <Input value={value.name || ''} onChange={(e) => onChange({ ...value, name: e.target.value })} />
      </div>
      <div>
        <Label>Current Role</Label>
        <Input value={value.currentRole || ''} onChange={(e) => onChange({ ...value, currentRole: e.target.value })} />
      </div>
      <div>
        <Label>Years of Experience</Label>
        <Input
          type="number"
          value={value.yearsExperience || ''}
          onChange={(e) => onChange({ ...value, yearsExperience: Number(e.target.value) })}
        />
      </div>
      <div>
        <Label>Function</Label>
        <Select
          value={value.function || 'other'}
          onValueChange={(v) => onChange({ ...value, function: v as UserProfile['function'] })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(['product', 'marketing', 'growth', 'tech', 'other'] as const).map((fn) => (
              <SelectItem key={fn} value={fn}>{fn.charAt(0).toUpperCase() + fn.slice(1)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
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

export default function OnboardingPage() {
  const { data, update, loading } = useCareerData();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [resumeText, setResumeText] = useState('');
  const [linkedInText, setLinkedInText] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState<Partial<UserProfile> | null>(null);
  const [extractionFailed, setExtractionFailed] = useState(false);
  const [manualProfile, setManualProfile] = useState<Partial<UserProfile>>({
    function: 'other',
    targetIndustries: [],
    targetCompanyStages: [],
  });

  // Redirect if already onboarded
  useEffect(() => {
    if (!loading && data.profile?.onboardingCompleted) {
      router.replace('/');
    }
  }, [loading, data.profile?.onboardingCompleted, router]);

  const handleContinueToLinkedIn = () => {
    setStep(2);
  };

  const handleContinueToReview = async (skipLinkedIn = false) => {
    if (skipLinkedIn) setLinkedInText('');
    setStep(3);
    setExtracting(true);
    setExtractionFailed(false);

    const context = `RESUME:\n${resumeText}\n\nLINKEDIN:\n${skipLinkedIn || !linkedInText ? 'Not provided' : linkedInText}`;

    try {
      const result = await generateAI({ prompt: EXTRACTION_PROMPT, context, maxTokens: 2000 });
      if (result.error || !result.content) throw new Error(result.error || 'No content');

      const parsed = parseExtractedJSON(result.content);
      if (!parsed) throw new Error('JSON parse failed');

      setExtracted({
        ...parsed,
        targetIndustries: parsed.targetIndustries || [],
        targetCompanyStages: parsed.targetCompanyStages || [],
      });
    } catch {
      setExtractionFailed(true);
    } finally {
      setExtracting(false);
    }
  };

  const handleSaveAndGo = async () => {
    const profileData = extractionFailed ? manualProfile : extracted;
    await update((prev) => {
      const base = {
        name: '',
        currentRole: '',
        yearsExperience: 0,
        function: 'other' as const,
        targetIndustries: [] as string[],
        targetCompanyStages: [] as string[],
        ...prev.profile,
        ...profileData,
      };
      return {
        ...prev,
        profile: {
          ...base,
          targetIndustries: profileData?.targetIndustries || prev.profile?.targetIndustries || [],
          targetCompanyStages: profileData?.targetCompanyStages || prev.profile?.targetCompanyStages || [],
          rawResume: resumeText,
          rawLinkedIn: linkedInText || undefined,
          onboardingCompleted: true,
        },
      };
    });
    router.push('/');
  };

  const steps = ['Resume', 'LinkedIn', 'Review'];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Career Assistant</h1>
          <p className="text-muted-foreground">Let&apos;s set up your profile to personalize your experience</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2">
          {steps.map((label, i) => {
            const stepNum = i + 1;
            const isActive = step === stepNum;
            const isDone = step > stepNum;
            return (
              <div key={label} className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 ${isActive ? 'text-primary' : isDone ? 'text-green-600' : 'text-muted-foreground'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                    isActive ? 'border-primary bg-primary text-primary-foreground' :
                    isDone ? 'border-green-600 bg-green-600 text-white' :
                    'border-muted-foreground/40'
                  }`}>
                    {isDone ? '✓' : stepNum}
                  </div>
                  <span className="text-sm font-medium">{label}</span>
                </div>
                {i < steps.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground/40" />}
              </div>
            );
          })}
        </div>

        {/* Step 1 — Resume */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Paste your resume</CardTitle>
              <p className="text-sm text-muted-foreground">
                Copy all text from your resume (PDF → select all → copy). Include job titles, companies, dates, and bullet points.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste your resume text here...&#10;&#10;Tips:&#10;• Include all roles with dates&#10;• Keep bullet points and metrics&#10;• No need to format — plain text is perfect"
                className="min-h-[200px] font-mono text-sm"
              />
              <Button
                onClick={handleContinueToLinkedIn}
                disabled={resumeText.trim().length < 100}
                className="w-full"
              >
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              {resumeText.trim().length > 0 && resumeText.trim().length < 100 && (
                <p className="text-xs text-muted-foreground text-center">Please paste more text ({100 - resumeText.trim().length} more characters needed)</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 2 — LinkedIn */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Add your LinkedIn profile (optional)</CardTitle>
              <p className="text-sm text-muted-foreground">
                Go to your LinkedIn profile → click &quot;More&quot; → &quot;Save to PDF&quot; → copy text. Or just paste your About section and experience.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={linkedInText}
                onChange={(e) => setLinkedInText(e.target.value)}
                placeholder="Paste your LinkedIn text here (optional)...&#10;&#10;Helps the AI understand your:&#10;• Headline and summary&#10;• Recommendations&#10;• Skills endorsed by others"
                className="min-h-[200px] font-mono text-sm"
              />
              <Button onClick={() => handleContinueToReview(false)} className="w-full">
                Continue to review
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <button
                onClick={() => handleContinueToReview(true)}
                className="w-full text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
              >
                Skip for now
              </button>
            </CardContent>
          </Card>
        )}

        {/* Step 3 — Review */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>
                {extracting ? 'Analyzing your profile...' : extractionFailed ? 'Tell us about yourself' : 'Your extracted profile'}
              </CardTitle>
              {!extracting && !extractionFailed && (
                <p className="text-sm text-muted-foreground">Review and edit what was extracted from your resume. You can always update this later.</p>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {extracting && (
                <div className="flex flex-col items-center gap-4 py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Analyzing your resume and extracting key insights...</p>
                </div>
              )}

              {!extracting && extractionFailed && (
                <ManualFallback value={manualProfile} onChange={setManualProfile} />
              )}

              {!extracting && !extractionFailed && extracted && (
                <ProfileCard extracted={extracted} onChange={setExtracted} />
              )}

              {!extracting && (
                <Button onClick={handleSaveAndGo} className="w-full" size="lg">
                  Looks good, let&apos;s go!
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
