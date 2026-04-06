'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Radar, ChevronDown, ChevronUp, CheckCircle2, XCircle,
  ExternalLink, Building2, MapPin, Coins, AlertTriangle, Sparkles,
} from 'lucide-react';

interface ProblemMatch {
  signatureId: string;
  matchStrength: 'strong' | 'moderate' | 'weak';
  reasoning: string;
}

interface DiscoveredCompany {
  id: string;
  name: string;
  location: string;
  stage: string;
  funding: string;
  domain: string;
  employeeCount: string;
  description: string;
  problemSignatureMatches: ProblemMatch[];
  fitTier: string;
  fitRationale: string;
  gapsToBridge: string[];
  suggestedRole: string;
  actionRequired: string;
  sources: string[];
}

interface ProblemSignature {
  id: string;
  label: string;
  description: string;
  evidence: string;
}

interface DiscoveryData {
  results: {
    generatedAt: string;
    discoveryRun: { id: string; searchQueries: string[] };
    discoveredCompanies: DiscoveredCompany[];
    summary: {
      totalDiscovered: number;
      tier1: string[];
      tier2: string[];
      tier3: string[];
      topMatchingSignatures: string[];
    };
  };
  signatures: {
    problemSignatures: ProblemSignature[];
  } | null;
}

const TIER_COLORS: Record<string, string> = {
  tier1: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30',
  tier2: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',
  tier3: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30',
};

const MATCH_COLORS: Record<string, string> = {
  strong: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  moderate: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  weak: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
};

interface DiscoveryTabProps {
  onAddCompany: (company: DiscoveredCompany) => void;
  existingCompanyNames: string[];
}

export default function DiscoveryTab({ onAddCompany, existingCompanyNames }: DiscoveryTabProps) {
  const [data, setData] = useState<DiscoveryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [added, setAdded] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch('/api/discovery/results')
      .then(res => {
        if (!res.ok) throw new Error('No discovery results found');
        return res.json();
      })
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const toggleExpand = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAdd = (company: DiscoveredCompany) => {
    onAddCompany(company);
    setAdded(prev => new Set(prev).add(company.id));
  };

  const handleDismiss = (id: string) => {
    setDismissed(prev => new Set(prev).add(id));
  };

  const getSignatureLabel = (signatureId: string): string => {
    if (!data?.signatures) return signatureId;
    const sig = data.signatures.problemSignatures.find(s => s.id === signatureId);
    return sig?.label || signatureId;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center space-y-3">
          <Radar className="h-8 w-8 animate-spin mx-auto text-blue-500" />
          <p className="text-muted-foreground">Loading discovery results...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <Radar className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <div>
              <h3 className="font-semibold text-lg">No Discovery Results Yet</h3>
              <p className="text-muted-foreground mt-1 max-w-md mx-auto">
                Discovery runs happen in Cowork. Ask Claude to &quot;run company discovery&quot; and it will
                search the web, match companies to your problem signatures, and save results here.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { results, signatures } = data;
  const companies = results.discoveredCompanies.filter(c => !dismissed.has(c.id));
  const alreadyAdded = existingCompanyNames.map(n => n.toLowerCase());

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="text-muted-foreground">
              Last scan: {new Date(results.generatedAt).toLocaleDateString()}
            </span>
            <Separator orientation="vertical" className="h-4" />
            <span>{results.summary.totalDiscovered} companies found</span>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex gap-2">
              {results.summary.tier1.length > 0 && (
                <Badge variant="outline" className={TIER_COLORS.tier1}>
                  {results.summary.tier1.length} Tier 1
                </Badge>
              )}
              {results.summary.tier2.length > 0 && (
                <Badge variant="outline" className={TIER_COLORS.tier2}>
                  {results.summary.tier2.length} Tier 2
                </Badge>
              )}
              {results.summary.tier3.length > 0 && (
                <Badge variant="outline" className={TIER_COLORS.tier3}>
                  {results.summary.tier3.length} Tier 3
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Problem signatures summary */}
      {signatures && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Your Problem Signatures
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {signatures.problemSignatures.map(sig => (
                <Badge key={sig.id} variant="secondary" className="text-xs py-1">
                  {sig.label}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Company cards */}
      {companies.map(company => {
        const isExpanded = expanded[company.id];
        const isAdded = added.has(company.id) || alreadyAdded.includes(company.name.toLowerCase());
        const strongMatches = company.problemSignatureMatches.filter(m => m.matchStrength === 'strong').length;

        return (
          <Card key={company.id} className={isAdded ? 'opacity-60' : ''}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{company.name}</CardTitle>
                    <Badge variant="outline" className={TIER_COLORS[company.fitTier] || ''}>
                      {company.fitTier.replace('tier', 'Tier ')}
                    </Badge>
                    {strongMatches >= 2 && (
                      <Badge className="bg-green-600 text-white text-xs">
                        {strongMatches} strong matches
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{company.location}</span>
                    <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{company.stage}</span>
                    <span className="flex items-center gap-1"><Coins className="h-3 w-3" />{company.funding}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!isAdded ? (
                    <>
                      <Button size="sm" variant="outline" onClick={() => handleDismiss(company.id)}>
                        <XCircle className="h-4 w-4 mr-1" /> Skip
                      </Button>
                      <Button size="sm" onClick={() => handleAdd(company)}>
                        <CheckCircle2 className="h-4 w-4 mr-1" /> Add to Targets
                      </Button>
                    </>
                  ) : (
                    <Badge variant="outline" className="text-green-600 border-green-300">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Added
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              <p className="text-sm">{company.description}</p>

              {/* Match badges */}
              <div className="flex flex-wrap gap-2">
                {company.problemSignatureMatches.map((match, i) => (
                  <Badge key={i} variant="outline" className={MATCH_COLORS[match.matchStrength]}>
                    {match.matchStrength === 'strong' ? '●' : '○'} {getSignatureLabel(match.signatureId)}
                  </Badge>
                ))}
              </div>

              <p className="text-sm"><span className="font-medium">Suggested role:</span> {company.suggestedRole}</p>

              {/* Expandable details */}
              <Button
                variant="ghost" size="sm"
                onClick={() => toggleExpand(company.id)}
                className="text-xs text-muted-foreground p-0 h-auto"
              >
                {isExpanded ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
                {isExpanded ? 'Less detail' : 'More detail'}
              </Button>

              {isExpanded && (
                <div className="space-y-4 pt-2">
                  <Separator />

                  {/* Fit rationale */}
                  <div>
                    <h4 className="text-sm font-medium mb-1">Why this is a fit</h4>
                    <p className="text-sm text-muted-foreground">{company.fitRationale}</p>
                  </div>

                  {/* Match reasoning */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Problem signature matches</h4>
                    <div className="space-y-2">
                      {company.problemSignatureMatches.map((match, i) => (
                        <div key={i} className="text-sm border-l-2 pl-3 border-muted-foreground/20">
                          <span className="font-medium">{getSignatureLabel(match.signatureId)}</span>
                          <span className={`ml-2 text-xs ${match.matchStrength === 'strong' ? 'text-green-600' : 'text-blue-600'}`}>
                            ({match.matchStrength})
                          </span>
                          <p className="text-muted-foreground mt-0.5">{match.reasoning}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Gaps to bridge */}
                  {company.gapsToBridge.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-1 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 text-yellow-500" /> Gaps to bridge
                      </h4>
                      <ul className="space-y-1">
                        {company.gapsToBridge.map((gap, i) => (
                          <li key={i} className="text-sm text-muted-foreground">• {gap}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action required */}
                  <div>
                    <h4 className="text-sm font-medium mb-1">Next step</h4>
                    <p className="text-sm text-muted-foreground">{company.actionRequired}</p>
                  </div>

                  {/* Sources */}
                  {company.sources.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {company.sources.map((src, i) => (
                        <a key={i} href={src} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                          <ExternalLink className="h-3 w-3" />
                          Source {i + 1}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {companies.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          All discovered companies have been reviewed. Run another discovery scan for more results.
        </div>
      )}
    </div>
  );
}
