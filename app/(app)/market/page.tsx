'use client';

import { useState } from 'react';
import { v4 as uuid } from 'uuid';
import { useCareerData } from '@/hooks/useCareerData';
import { useAI } from '@/hooks/useAI';
import { TargetCompany } from '@/lib/types';
import { COMPANY_STAGES } from '@/lib/frameworks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import {
  Plus, Building2, Users, Package, TrendingUp, Sparkles, Trash2, Edit,
  Target, Lightbulb, AlertTriangle, Briefcase, MapPin, Search, ChevronDown, ChevronUp, Radar,
} from 'lucide-react';
import { getSuperpowerContext } from '@/lib/ai';
import DiscoveryTab from '@/components/DiscoveryTab';

const INDUSTRIES = ['SaaS', 'FinTech', 'E-commerce', 'Consumer Social', 'HealthTech', 'B2B Infra', 'Marketplaces', 'Deep Tech', 'EdTech', 'Other'];

const TIER_LABELS: Record<string, { label: string; color: string }> = {
  tier1: { label: 'Tier 1', color: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30' },
  tier2: { label: 'Tier 2', color: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30' },
  tier3: { label: 'Tier 3', color: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30' },
  dropped: { label: 'Dropped', color: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30' },
};

const STATUS_LABELS: Record<string, string> = {
  shortlisted: 'Shortlisted',
  researching: 'Researching',
  'pow-building': 'Building POW',
  applied: 'Applied',
  dropped: 'Dropped',
};

function TagInput({ tags, onChange, placeholder }: { tags: string[]; onChange: (tags: string[]) => void; placeholder: string }) {
  const [input, setInput] = useState('');
  const addTag = () => {
    const tag = input.trim();
    if (tag && !tags.includes(tag)) { onChange([...tags, tag]); setInput(''); }
  };
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
          placeholder={placeholder} className="flex-1" />
        <Button type="button" variant="outline" size="sm" onClick={addTag}>Add</Button>
      </div>
      <div className="flex flex-wrap gap-1">
        {tags.map((tag, i) => (
          <Badge key={i} variant="secondary" className="cursor-pointer" onClick={() => onChange(tags.filter((_, j) => j !== i))}>
            {tag} &times;
          </Badge>
        ))}
      </div>
    </div>
  );
}

function TextAreaField({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder: string; rows?: number }) {
  return (
    <textarea
      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
      rows={rows}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

const EMPTY_COMPANY: Omit<TargetCompany, 'id'> = {
  name: '', industry: '', stage: '', type: 'internet-first',
  problems: [], skillsTheyHire: [], proofCues: [],
  peopleSignals: [], productSignals: [], marketSignals: [],
  jobPostingSignals: [], recentHireSignals: [], leadershipSignals: [], redFlags: [],
  openRoles: [],
  fitTier: 'tier2', companyStatus: 'shortlisted',
  location: '', hybridRemote: true, fundingInfo: '',
  realProblem: '', superpowerMatch: '', powIdea: '', fitRationale: '',
};

// --- Discover panel ---
interface DiscoverCriteria {
  geography: string;
  seniority: string;
  domain: string;
  stage: string;
}

interface SuggestedCompany {
  name: string;
  industry: string;
  stage: string;
  location: string;
  fitTier: 'tier1' | 'tier2' | 'tier3';
  realProblem: string;
  superpowerMatch: string;
  powIdea: string;
  openRoles: string[];
  fundingInfo: string;
  redFlags: string[];
}

function DiscoverPanel({ onAdd }: { onAdd: (c: Omit<TargetCompany, 'id'>) => void }) {
  const { data } = useCareerData();
  const { generate, loading } = useAI();
  const [criteria, setCriteria] = useState<DiscoverCriteria>({
    geography: 'West India (Mumbai, Pune, Ahmedabad) or Bangalore/Hyderabad hybrid/remote',
    seniority: 'Senior PM / Lead PM (Series B+) or Head / Director of Product (Series A)',
    domain: 'B2B SaaS, eCommerce enablement, marketplace infra, supply chain tech',
    stage: 'Series A through public',
  });
  const [suggestions, setSuggestions] = useState<SuggestedCompany[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [rawOutput, setRawOutput] = useState('');

  const discover = async () => {
    const superpowerCtx = getSuperpowerContext(data.profile);
    const profileContext = data.profile
      ? `Name: ${data.profile.name}, Role: ${data.profile.currentRole}, Experience: ${data.profile.yearsExperience} years.
${superpowerCtx || `Key themes: ${(data.profile.superpowers || []).join('; ')}`}
Key wins: ${(data.profile.extractedWins || []).slice(0, 5).join('; ')}`
      : `Experienced B2B Product Manager with 11+ years. Superpower: reframing problems, deep cross-domain execution (SQL, architecture, business cases), founder who built and sold a B2B marketplace (Vendaxo → acquired by Moglix). Key domains: B2B platforms, OMS/WMS, vendor management, marketplace scaling, enterprise IAM, checkout conversion.`;

    const prompt = `You are a career advisor helping a B2B Product Manager identify the right companies to target for their job search.

USER PROFILE:
${profileContext}

SEARCH CRITERIA:
- Geography: ${criteria.geography}
- Seniority target: ${criteria.seniority}
- Domain: ${criteria.domain}
- Company stage: ${criteria.stage}

Generate a shortlist of 8 Indian tech companies that are strong fits. For each company, provide a structured JSON array. Be specific and realistic about the Indian startup ecosystem.

Return ONLY a valid JSON array in this exact format (no markdown, no explanation):
[
  {
    "name": "Company Name",
    "industry": "B2B SaaS",
    "stage": "Series C / Growth",
    "location": "Mumbai (hybrid)",
    "fitTier": "tier1",
    "realProblem": "2-3 sentence description of the actual business challenge they're solving in next 12 months",
    "superpowerMatch": "How the user's specific background directly maps to this company's problem",
    "powIdea": "A specific proof-of-work artifact the user can build in 5-10 days and send cold",
    "openRoles": ["Senior PM - Platform", "Lead PM - Integrations"],
    "fundingInfo": "Series C, $50M raised, Tiger Global backed",
    "redFlags": []
  }
]

Tier definitions:
- tier1: Direct domain match, active hiring, healthy company, strong superpower alignment
- tier2: Good fit, worth pursuing with some gap to bridge
- tier3: Indirect fit, monitor but don't prioritize now

Sort by fitTier (tier1 first). Include at least 2 tier1 companies.`;

    const result = await generate({ prompt });
    if (!result) return;

    setRawOutput(result);
    try {
      const jsonMatch = result.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed: SuggestedCompany[] = JSON.parse(jsonMatch[0]);
        setSuggestions(parsed);
      }
    } catch {
      // Show raw if parse fails
    }
  };

  const addToList = (s: SuggestedCompany) => {
    onAdd({
      name: s.name,
      industry: s.industry,
      stage: s.stage,
      type: 'internet-first',
      problems: [],
      skillsTheyHire: [],
      proofCues: [],
      peopleSignals: [],
      productSignals: [],
      marketSignals: [],
      jobPostingSignals: [],
      recentHireSignals: [],
      leadershipSignals: [],
      redFlags: s.redFlags || [],
      openRoles: s.openRoles || [],
      location: s.location,
      hybridRemote: true,
      fundingInfo: s.fundingInfo,
      fitTier: s.fitTier,
      realProblem: s.realProblem,
      superpowerMatch: s.superpowerMatch,
      powIdea: s.powIdea,
      fitRationale: '',
      companyStatus: 'shortlisted',
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Search Criteria</CardTitle>
          <CardDescription>Set your preferences — AI will generate a shortlist of companies that fit</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Geography</Label>
              <Input value={criteria.geography} onChange={(e) => setCriteria({ ...criteria, geography: e.target.value })}
                placeholder="e.g., Mumbai, Pune, Bangalore hybrid/remote" />
            </div>
            <div className="space-y-1">
              <Label>Seniority Target</Label>
              <Input value={criteria.seniority} onChange={(e) => setCriteria({ ...criteria, seniority: e.target.value })}
                placeholder="e.g., Senior PM / Lead PM at Series B+" />
            </div>
            <div className="space-y-1">
              <Label>Domain / Industry</Label>
              <Input value={criteria.domain} onChange={(e) => setCriteria({ ...criteria, domain: e.target.value })}
                placeholder="e.g., B2B SaaS, marketplace infra" />
            </div>
            <div className="space-y-1">
              <Label>Company Stage</Label>
              <Input value={criteria.stage} onChange={(e) => setCriteria({ ...criteria, stage: e.target.value })}
                placeholder="e.g., Series A through public" />
            </div>
          </div>
          <Button onClick={discover} disabled={loading} className="w-full">
            <Sparkles className="h-4 w-4 mr-2" />
            {loading ? 'Generating shortlist...' : 'Generate Company Shortlist'}
          </Button>
        </CardContent>
      </Card>

      {suggestions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            {suggestions.length} Companies Found
          </h3>
          {suggestions.map((s, i) => {
            const tier = TIER_LABELS[s.fitTier] || TIER_LABELS.tier3;
            const isExpanded = expanded === i;
            return (
              <Card key={i} className="overflow-hidden">
                <div className="p-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold">{s.name}</span>
                      <Badge variant="outline" className={`text-xs border ${tier.color}`}>{tier.label}</Badge>
                      <span className="text-xs text-muted-foreground">{s.location}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{s.industry} &middot; {s.stage} &middot; {s.fundingInfo}</div>
                    {!isExpanded && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{s.realProblem}</p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="ghost" onClick={() => setExpanded(isExpanded ? null : i)}>
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                    <Button size="sm" onClick={() => addToList(s)}>
                      <Plus className="h-3 w-3 mr-1" /> Add
                    </Button>
                  </div>
                </div>
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3 border-t pt-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Real Problem</p>
                      <p className="text-sm">{s.realProblem}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Superpower Match</p>
                      <p className="text-sm">{s.superpowerMatch}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">POW Idea</p>
                      <p className="text-sm">{s.powIdea}</p>
                    </div>
                    {s.openRoles.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Open Roles</p>
                        <div className="flex flex-wrap gap-1">
                          {s.openRoles.map((r, j) => <Badge key={j} variant="secondary" className="text-xs">{r}</Badge>)}
                        </div>
                      </div>
                    )}
                    {s.redFlags.length > 0 && (
                      <div className="flex items-start gap-2 p-2 rounded bg-red-500/10 border border-red-500/20">
                        <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">Red Flags</p>
                          {s.redFlags.map((f, j) => <p key={j} className="text-xs text-muted-foreground">{f}</p>)}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {!loading && suggestions.length === 0 && rawOutput && (
        <Card>
          <CardContent className="py-4">
            <p className="text-sm font-medium mb-2">Raw AI output (parse failed — copy what you need):</p>
            <pre className="text-xs text-muted-foreground whitespace-pre-wrap">{rawOutput}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// --- Main page ---
export default function MarketPage() {
  const { data, update, updatePhaseProgress } = useCareerData();
  const { generate, loading: aiLoading } = useAI();
  const [activeTab, setActiveTab] = useState<'list' | 'discover' | 'discovery'>('list');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<TargetCompany, 'id'>>(EMPTY_COMPANY);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [filterTier, setFilterTier] = useState<string>('all');

  const openNew = () => { setEditingId(null); setForm(EMPTY_COMPANY); setDialogOpen(true); };

  const openEdit = (company: TargetCompany) => {
    setEditingId(company.id);
    setForm({
      name: company.name, industry: company.industry, stage: company.stage, type: company.type,
      problems: company.problems, skillsTheyHire: company.skillsTheyHire, proofCues: company.proofCues,
      peopleSignals: company.peopleSignals, productSignals: company.productSignals, marketSignals: company.marketSignals,
      jobPostingSignals: company.jobPostingSignals || [],
      recentHireSignals: company.recentHireSignals || [],
      leadershipSignals: company.leadershipSignals || [],
      redFlags: company.redFlags || [],
      openRoles: company.openRoles || [],
      fitTier: company.fitTier || 'tier2',
      fitRationale: company.fitRationale || '',
      realProblem: company.realProblem || '',
      superpowerMatch: company.superpowerMatch || '',
      powIdea: company.powIdea || '',
      location: company.location || '',
      hybridRemote: company.hybridRemote ?? true,
      fundingInfo: company.fundingInfo || '',
      companyStatus: company.companyStatus || 'shortlisted',
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) return;
    if (editingId) {
      await update((prev) => ({
        ...prev,
        companies: prev.companies.map((c) => c.id === editingId ? { id: editingId, ...form } : c),
      }));
    } else {
      await update((prev) => ({
        ...prev,
        companies: [...prev.companies, { id: uuid(), ...form }],
      }));
    }
    const newCount = data.companies.length + (editingId ? 0 : 1);
    updatePhaseProgress('market', Math.min(100, (newCount / 5) * 100));
    setDialogOpen(false);
  };

  const addDiscovered = async (company: Omit<TargetCompany, 'id'>) => {
    await update((prev) => ({
      ...prev,
      companies: [...prev.companies, { id: uuid(), ...company }],
    }));
    updatePhaseProgress('market', Math.min(100, ((data.companies.length + 1) / 5) * 100));
    setActiveTab('list');
  };

  const deleteCompany = async (id: string) => {
    await update((prev) => ({ ...prev, companies: prev.companies.filter((c) => c.id !== id) }));
  };

  const updateStatus = async (id: string, companyStatus: TargetCompany['companyStatus']) => {
    await update((prev) => ({
      ...prev,
      companies: prev.companies.map((c) => c.id === id ? { ...c, companyStatus } : c),
    }));
  };

  const generateFullAnalysis = async (companyId: string) => {
    const company = data.companies.find((c) => c.id === companyId);
    if (!company) return;

    const superpowerCtx = getSuperpowerContext(data.profile);
    const profileContext = data.profile
      ? `${superpowerCtx || `Key themes: ${(data.profile.superpowers || []).join('; ')}`}
Wins: ${(data.profile.extractedWins || []).slice(0, 4).join('; ')}`
      : `B2B PM, 11+ years, founder exit (Vendaxo → Moglix). Key wins: checkout conversion 12→18%, dispute rate to 0.1% ($300K saved), proved 30x sampling ROI via SQL, migrated 800 vendors, enterprise IAM 11K users.`;

    const prompt = `You are analyzing a company for a B2B Product Manager job search.

COMPANY: ${company.name} (${company.industry}, ${company.stage})
${company.location ? `Location: ${company.location}` : ''}
${company.fundingInfo ? `Funding: ${company.fundingInfo}` : ''}
${company.problems.length > 0 ? `Known problems: ${company.problems.join(', ')}` : ''}

USER PROFILE:
${profileContext}

Provide a structured analysis in exactly this JSON format (no markdown):
{
  "realProblem": "2-3 sentences: the actual business challenge this company is solving in the next 12 months, based on their stage, domain, and signals",
  "superpowerMatch": "2-3 sentences: how the user's specific background directly maps to this company's problem — be specific about which wins apply",
  "powIdea": "A concrete proof-of-work artifact the user can build in 5-10 days independently and send cold — be specific about what to analyze, what to build, what it demonstrates",
  "jobPostingSignals": ["Signal 1 from typical JDs for this type of company", "Signal 2"],
  "leadershipSignals": ["What leadership at this type of company typically talks about publicly"],
  "marketSignals": ["Key market tailwinds or headwinds for this company"],
  "redFlags": []
}`;

    const result = await generate({ prompt });
    if (!result) return;

    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        await update((prev) => ({
          ...prev,
          companies: prev.companies.map((c) =>
            c.id === companyId ? {
              ...c,
              realProblem: parsed.realProblem || c.realProblem,
              superpowerMatch: parsed.superpowerMatch || c.superpowerMatch,
              powIdea: parsed.powIdea || c.powIdea,
              jobPostingSignals: [...new Set([...(c.jobPostingSignals || []), ...(parsed.jobPostingSignals || [])])],
              leadershipSignals: [...new Set([...(c.leadershipSignals || []), ...(parsed.leadershipSignals || [])])],
              marketSignals: [...new Set([...c.marketSignals, ...(parsed.marketSignals || [])])],
              redFlags: [...new Set([...(c.redFlags || []), ...(parsed.redFlags || [])])],
            } : c
          ),
        }));
      }
    } catch {
      // silently fail — AI output wasn't JSON
    }
  };

  const researchSignals = async (companyId: string) => {
    const company = data.companies.find((c) => c.id === companyId);
    if (!company) return;

    const result = await generate({
      prompt: `Research this company for a job seeker: "${company.name}" (${company.industry}, ${company.stage}).

Provide:
1. Likely top 3 problems they're hiring to solve
2. Key skills they value
3. Proof cues that would impress them
4. Market signals (tailwinds/headwinds)

Be specific to the Indian tech ecosystem. Format as bullet points under each heading.`,
    });

    if (result) {
      const lines = result.split('\n').filter(Boolean);
      const problems: string[] = [], skills: string[] = [], cues: string[] = [], signals: string[] = [];
      let section = '';
      for (const line of lines) {
        if (/problem/i.test(line)) { section = 'problems'; continue; }
        if (/skill/i.test(line)) { section = 'skills'; continue; }
        if (/proof/i.test(line)) { section = 'cues'; continue; }
        if (/signal|market/i.test(line)) { section = 'signals'; continue; }
        const clean = line.replace(/^[-*•\d.)\s]+/, '').trim();
        if (!clean) continue;
        if (section === 'problems') problems.push(clean);
        else if (section === 'skills') skills.push(clean);
        else if (section === 'cues') cues.push(clean);
        else if (section === 'signals') signals.push(clean);
      }
      await update((prev) => ({
        ...prev,
        companies: prev.companies.map((c) =>
          c.id === companyId ? {
            ...c,
            problems: [...new Set([...c.problems, ...problems])],
            skillsTheyHire: [...new Set([...c.skillsTheyHire, ...skills])],
            proofCues: [...new Set([...c.proofCues, ...cues])],
            marketSignals: [...new Set([...c.marketSignals, ...signals])],
          } : c
        ),
      }));
    }
  };

  const filteredCompanies = data.companies.filter((c) => {
    if (filterTier === 'all') return true;
    return (c.fitTier || 'tier2') === filterTier;
  });

  const selected = data.companies.find((c) => c.id === selectedCompany);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Market Research Hub</h1>
          <p className="text-muted-foreground mt-1">
            Discover target companies, research signals, and build proof-of-work ideas
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setActiveTab('discover')}>
            <Search className="h-4 w-4 mr-2" />
            Discover
          </Button>
          <Button onClick={openNew}>
            <Plus className="h-4 w-4 mr-2" />
            Add Company
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'list' | 'discover' | 'discovery')}>
        <TabsList>
          <TabsTrigger value="list">My List ({data.companies.length})</TabsTrigger>
          <TabsTrigger value="discovery">
            <Radar className="h-3 w-3 mr-1" />
            Discovery
          </TabsTrigger>
          <TabsTrigger value="discover">
            <Sparkles className="h-3 w-3 mr-1" />
            AI Discover
          </TabsTrigger>
        </TabsList>

        <TabsContent value="discovery" className="mt-6">
          <DiscoveryTab
            existingCompanyNames={data.companies.map(c => c.name)}
            onAddCompany={(disc) => {
              const newCompany: Omit<TargetCompany, 'id'> = {
                name: disc.name,
                industry: disc.domain,
                stage: disc.stage,
                type: 'internet-first',
                problems: [],
                skillsTheyHire: [],
                proofCues: [],
                peopleSignals: [],
                productSignals: [],
                marketSignals: [],
                jobPostingSignals: [],
                recentHireSignals: [],
                leadershipSignals: [],
                redFlags: disc.gapsToBridge,
                openRoles: [disc.suggestedRole],
                fitTier: disc.fitTier as 'tier1' | 'tier2' | 'tier3',
                companyStatus: 'shortlisted',
                location: disc.location,
                hybridRemote: true,
                fundingInfo: disc.funding,
                realProblem: disc.description,
                superpowerMatch: disc.fitRationale,
                powIdea: disc.actionRequired,
                fitRationale: disc.problemSignatureMatches.map(m => `[${m.matchStrength}] ${m.reasoning}`).join('\n'),
              };
              addDiscovered(newCompany);
            }}
          />
        </TabsContent>

        <TabsContent value="discover" className="mt-6">
          <DiscoverPanel onAdd={addDiscovered} />
        </TabsContent>

        <TabsContent value="list" className="mt-6">
          {data.companies.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No target companies yet</h3>
                <p className="text-muted-foreground mb-4">
                  Use Discover to generate a shortlist, or add companies manually
                </p>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" onClick={() => setActiveTab('discover')}>
                    <Search className="h-4 w-4 mr-2" />Discover Companies
                  </Button>
                  <Button onClick={openNew}>
                    <Plus className="h-4 w-4 mr-2" />Add Manually
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-[300px_1fr] gap-6">
              {/* Company list */}
              <div className="space-y-3">
                <Select value={filterTier} onValueChange={setFilterTier}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Filter by tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All tiers</SelectItem>
                    <SelectItem value="tier1">Tier 1 only</SelectItem>
                    <SelectItem value="tier2">Tier 2 only</SelectItem>
                    <SelectItem value="tier3">Tier 3 only</SelectItem>
                    <SelectItem value="dropped">Dropped</SelectItem>
                  </SelectContent>
                </Select>
                <div className="space-y-2">
                  {filteredCompanies.map((company) => {
                    const tier = TIER_LABELS[company.fitTier || 'tier2'];
                    return (
                      <Card
                        key={company.id}
                        className={`cursor-pointer transition-colors ${selectedCompany === company.id ? 'border-primary' : 'hover:border-primary/50'}`}
                        onClick={() => setSelectedCompany(company.id)}
                      >
                        <CardContent className="py-3 px-4">
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="font-medium text-sm truncate">{company.name}</div>
                              <div className="text-xs text-muted-foreground truncate">
                                {company.industry} &middot; {company.stage}
                              </div>
                              {company.location && (
                                <div className="flex items-center gap-1 mt-0.5">
                                  <MapPin className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground truncate">{company.location}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              <Badge variant="outline" className={`text-xs border ${tier.color}`}>{tier.label}</Badge>
                              {company.companyStatus && (
                                <span className="text-xs text-muted-foreground">{STATUS_LABELS[company.companyStatus] || company.companyStatus}</span>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Company detail */}
              {selected ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle>{selected.name}</CardTitle>
                          {selected.fitTier && (
                            <Badge variant="outline" className={`border ${TIER_LABELS[selected.fitTier].color}`}>
                              {TIER_LABELS[selected.fitTier].label}
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="mt-1">
                          {selected.industry} &middot; {selected.stage}
                          {selected.location && ` &middot; ${selected.location}`}
                          {selected.fundingInfo && ` &middot; ${selected.fundingInfo}`}
                        </CardDescription>
                        {selected.openRoles && selected.openRoles.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {selected.openRoles.map((r, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                <Briefcase className="h-3 w-3 mr-1" />{r}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0 flex-wrap justify-end">
                        <Select
                          value={selected.companyStatus || 'shortlisted'}
                          onValueChange={(v) => updateStatus(selected.id, v as TargetCompany['companyStatus'])}
                        >
                          <SelectTrigger className="h-8 w-36 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(STATUS_LABELS).map(([val, label]) => (
                              <SelectItem key={val} value={val}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button variant="outline" size="sm" onClick={() => generateFullAnalysis(selected.id)} disabled={aiLoading}>
                          <Sparkles className="h-4 w-4 mr-1" />
                          {aiLoading ? 'Analysing...' : 'Full Analysis'}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => researchSignals(selected.id)} disabled={aiLoading}>
                          <Search className="h-4 w-4 mr-1" />
                          Signals
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openEdit(selected)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => { deleteCompany(selected.id); setSelectedCompany(null); }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="fit">
                      <TabsList className="grid grid-cols-4 w-full">
                        <TabsTrigger value="fit">Fit & POW</TabsTrigger>
                        <TabsTrigger value="signals">Signals</TabsTrigger>
                        <TabsTrigger value="research">Research</TabsTrigger>
                        <TabsTrigger value="flags">Flags</TabsTrigger>
                      </TabsList>

                      {/* Fit & POW tab */}
                      <TabsContent value="fit" className="space-y-5 mt-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Target className="h-4 w-4 text-muted-foreground" />
                            <Label className="text-sm font-medium">The Real Problem They&apos;re Solving</Label>
                          </div>
                          {selected.realProblem ? (
                            <p className="text-sm text-muted-foreground leading-relaxed">{selected.realProblem}</p>
                          ) : (
                            <p className="text-sm text-muted-foreground italic">Run &quot;Full Analysis&quot; to generate, or add manually via Edit.</p>
                          )}
                        </div>
                        <Separator />
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="h-4 w-4 text-muted-foreground" />
                            <Label className="text-sm font-medium">Your Superpower Match</Label>
                          </div>
                          {selected.superpowerMatch ? (
                            <p className="text-sm text-muted-foreground leading-relaxed">{selected.superpowerMatch}</p>
                          ) : (
                            <p className="text-sm text-muted-foreground italic">Run &quot;Full Analysis&quot; to generate.</p>
                          )}
                        </div>
                        <Separator />
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Lightbulb className="h-4 w-4 text-muted-foreground" />
                            <Label className="text-sm font-medium">Proof of Work Idea</Label>
                          </div>
                          {selected.powIdea ? (
                            <p className="text-sm text-muted-foreground leading-relaxed">{selected.powIdea}</p>
                          ) : (
                            <p className="text-sm text-muted-foreground italic">Run &quot;Full Analysis&quot; to generate.</p>
                          )}
                        </div>
                        {selected.fitRationale && (
                          <>
                            <Separator />
                            <div>
                              <Label className="text-sm font-medium mb-2 block">Fit Rationale</Label>
                              <p className="text-sm text-muted-foreground">{selected.fitRationale}</p>
                            </div>
                          </>
                        )}
                      </TabsContent>

                      {/* Signals tab */}
                      <TabsContent value="signals" className="space-y-5 mt-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                            <Label className="text-sm font-medium">Job Posting Signals</Label>
                          </div>
                          {(selected.jobPostingSignals || []).length > 0 ? (
                            (selected.jobPostingSignals || []).map((s, i) => (
                              <p key={i} className="text-sm text-muted-foreground">&bull; {s}</p>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground italic">What JD language reveals about their real priorities</p>
                          )}
                        </div>
                        <Separator />
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <Label className="text-sm font-medium">Recent Hire Signals</Label>
                          </div>
                          {(selected.recentHireSignals || []).length > 0 ? (
                            (selected.recentHireSignals || []).map((s, i) => (
                              <p key={i} className="text-sm text-muted-foreground">&bull; {s}</p>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground italic">Who they hired in last 6 months — signals direction of scaling</p>
                          )}
                        </div>
                        <Separator />
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            <Label className="text-sm font-medium">Leadership Signals</Label>
                          </div>
                          {(selected.leadershipSignals || []).length > 0 ? (
                            (selected.leadershipSignals || []).map((s, i) => (
                              <p key={i} className="text-sm text-muted-foreground">&bull; {s}</p>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground italic">What founders/leadership post publicly on LinkedIn/Twitter</p>
                          )}
                        </div>
                      </TabsContent>

                      {/* Research tab (existing) */}
                      <TabsContent value="research" className="space-y-5 mt-4">
                        <div>
                          <Label className="text-sm font-medium">Problems They&apos;re Solving</Label>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {selected.problems.map((p, i) => <Badge key={i} variant="secondary">{p}</Badge>)}
                            {selected.problems.length === 0 && <span className="text-sm text-muted-foreground">None added yet</span>}
                          </div>
                        </div>
                        <Separator />
                        <div>
                          <Label className="text-sm font-medium">Skills They Hire For</Label>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {selected.skillsTheyHire.map((s, i) => <Badge key={i} variant="outline">{s}</Badge>)}
                            {selected.skillsTheyHire.length === 0 && <span className="text-sm text-muted-foreground">None added yet</span>}
                          </div>
                        </div>
                        <Separator />
                        <div>
                          <Label className="text-sm font-medium">Proof Cues</Label>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {selected.proofCues.map((c, i) => <Badge key={i}>{c}</Badge>)}
                            {selected.proofCues.length === 0 && <span className="text-sm text-muted-foreground">None added yet</span>}
                          </div>
                        </div>
                        <Separator />
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <Label className="text-sm font-medium">Product Signals</Label>
                          </div>
                          {selected.productSignals.length > 0 ? (
                            selected.productSignals.map((s, i) => <p key={i} className="text-sm text-muted-foreground">&bull; {s}</p>)
                          ) : (
                            <p className="text-sm text-muted-foreground italic">Roadmap, features, reviews, gaps</p>
                          )}
                        </div>
                        <Separator />
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            <Label className="text-sm font-medium">Market Signals</Label>
                          </div>
                          {selected.marketSignals.length > 0 ? (
                            selected.marketSignals.map((s, i) => <p key={i} className="text-sm text-muted-foreground">&bull; {s}</p>)
                          ) : (
                            <p className="text-sm text-muted-foreground italic">Tailwinds, headwinds, competitive positioning</p>
                          )}
                        </div>
                      </TabsContent>

                      {/* Flags tab */}
                      <TabsContent value="flags" className="mt-4">
                        {(selected.redFlags || []).length > 0 ? (
                          <div className="space-y-2">
                            {(selected.redFlags || []).map((f, i) => (
                              <div key={i} className="flex items-start gap-2 p-3 rounded bg-red-500/10 border border-red-500/20">
                                <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                                <p className="text-sm">{f}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">No red flags noted. Add any concerns via Edit.</p>
                        )}
                        {(selected.peopleSignals || []).length > 0 && (
                          <>
                            <Separator className="my-4" />
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <Label className="text-sm font-medium">People Signals</Label>
                              </div>
                              {selected.peopleSignals.map((s, i) => (
                                <p key={i} className="text-sm text-muted-foreground">&bull; {s}</p>
                              ))}
                            </div>
                          </>
                        )}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">Select a company to view details</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Company' : 'Add Target Company'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Company Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., GoKwik" />
              </div>
              <div>
                <Label>Industry</Label>
                <Select value={form.industry} onValueChange={(v) => setForm({ ...form, industry: v })}>
                  <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map((ind) => <SelectItem key={ind} value={ind}>{ind}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Stage</Label>
                <Select value={form.stage} onValueChange={(v) => setForm({ ...form, stage: v })}>
                  <SelectTrigger><SelectValue placeholder="Select stage" /></SelectTrigger>
                  <SelectContent>
                    {COMPANY_STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Fit Tier</Label>
                <Select value={form.fitTier || 'tier2'} onValueChange={(v) => setForm({ ...form, fitTier: v as TargetCompany['fitTier'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tier1">Tier 1 — Pursue now</SelectItem>
                    <SelectItem value="tier2">Tier 2 — Secondary</SelectItem>
                    <SelectItem value="tier3">Tier 3 — Monitor</SelectItem>
                    <SelectItem value="dropped">Dropped</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.companyStatus || 'shortlisted'} onValueChange={(v) => setForm({ ...form, companyStatus: v as TargetCompany['companyStatus'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABELS).map(([val, label]) => <SelectItem key={val} value={val}>{label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Location</Label>
                <Input value={form.location || ''} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g., Hyderabad (hybrid)" />
              </div>
              <div>
                <Label>Funding Info</Label>
                <Input value={form.fundingInfo || ''} onChange={(e) => setForm({ ...form, fundingInfo: e.target.value })} placeholder="e.g., Series C, $50M, Tiger Global" />
              </div>
            </div>

            <div>
              <Label>Open Roles</Label>
              <TagInput tags={form.openRoles || []} onChange={(t) => setForm({ ...form, openRoles: t })} placeholder="e.g., Lead PM - Integrations" />
            </div>

            <Separator />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Fit Analysis</p>

            <div>
              <Label>The Real Problem They&apos;re Solving</Label>
              <TextAreaField value={form.realProblem || ''} onChange={(v) => setForm({ ...form, realProblem: v })}
                placeholder="2-3 sentences: the actual business challenge in the next 12 months" />
            </div>
            <div>
              <Label>Your Superpower Match</Label>
              <TextAreaField value={form.superpowerMatch || ''} onChange={(v) => setForm({ ...form, superpowerMatch: v })}
                placeholder="How your specific background maps to their problem" />
            </div>
            <div>
              <Label>Proof of Work Idea</Label>
              <TextAreaField value={form.powIdea || ''} onChange={(v) => setForm({ ...form, powIdea: v })}
                placeholder="A specific artifact you can build and send cold" rows={2} />
            </div>

            <Separator />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Research Signals</p>

            <div>
              <Label>Problems They&apos;re Solving</Label>
              <TagInput tags={form.problems} onChange={(t) => setForm({ ...form, problems: t })} placeholder="Add a problem" />
            </div>
            <div>
              <Label>Skills They Hire For</Label>
              <TagInput tags={form.skillsTheyHire} onChange={(t) => setForm({ ...form, skillsTheyHire: t })} placeholder="Add a skill" />
            </div>
            <div>
              <Label>Red Flags</Label>
              <TagInput tags={form.redFlags || []} onChange={(t) => setForm({ ...form, redFlags: t })} placeholder="e.g., fraud investigation, layoffs" />
            </div>

            <Button onClick={save} className="w-full">
              {editingId ? 'Save Changes' : 'Add Company'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
