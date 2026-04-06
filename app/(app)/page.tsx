'use client';

import Link from 'next/link';
import { PHASES } from '@/lib/types';
import { useCareerData } from '@/hooks/useCareerData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { exportToMarkdown, downloadMarkdown } from '@/lib/export';
import {
  ClipboardCheck, Search, Target, FileText, Hammer, Mail, Briefcase, ArrowRight, Download
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  ClipboardCheck, Search, Target, FileText, Hammer, Mail, Briefcase,
};

const PHASE_DESCRIPTIONS: Record<string, string> = {
  audit: 'Take stock of where you are with a timed self-assessment',
  market: 'Research companies, people, and market signals',
  positioning: 'Build your unique positioning with wins and frameworks',
  resume: 'Craft company-specific resume narratives',
  proof: 'Build tangible proof of work for target companies',
  outreach: 'Compose cold emails using the JTBD framework',
  search: 'Execute a structured 4-week job search sprint',
};

export default function Dashboard() {
  const { data } = useCareerData();

  const overallProgress = PHASES.reduce((sum, phase) => {
    return sum + (data.phaseProgress[phase.id] || 0);
  }, 0) / PHASES.length;

  const stats = {
    audits: data.audits.length,
    companies: data.companies.length,
    wins: data.wins.length,
    applications: data.applications.length,
  };

  const firstName = data.profile?.name?.split(' ')[0];
  const title = firstName ? `Welcome back, ${firstName}` : 'Career Assistant';

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground mt-1">
            Your AI-powered guide to landing your next role in tech
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => downloadMarkdown(exportToMarkdown(data), 'career-assistant-export.md')}
        >
          <Download className="h-4 w-4 mr-2" />Export
        </Button>
      </div>

      {data.profile?.careerSummary && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4 pb-4">
            <p className="text-sm leading-relaxed">{data.profile.careerSummary}</p>
            {data.profile.superpowers && data.profile.superpowers.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {data.profile.superpowers.map((sp, i) => (
                  <Badge key={i} className="bg-primary/10 text-primary border-primary/30">{sp}</Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Progress value={overallProgress} className="flex-1" />
            <span className="text-sm font-medium w-12 text-right">{Math.round(overallProgress)}%</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Audits', value: stats.audits },
          { label: 'Target Companies', value: stats.companies },
          { label: 'Wins Collected', value: stats.wins },
          { label: 'Applications', value: stats.applications },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4">
        {PHASES.map((phase, index) => {
          const Icon = ICON_MAP[phase.icon] || Target;
          const progress = data.phaseProgress[phase.id] || 0;

          return (
            <Link key={phase.id} href={phase.path}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          Phase {index + 1}: {phase.label}
                        </CardTitle>
                        <CardDescription>{PHASE_DESCRIPTIONS[phase.id]}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {progress > 0 && (
                        <Badge variant={progress === 100 ? 'default' : 'secondary'}>
                          {progress}%
                        </Badge>
                      )}
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardHeader>
                {progress > 0 && (
                  <CardContent className="pt-0">
                    <Progress value={progress} className="h-1" />
                  </CardContent>
                )}
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
