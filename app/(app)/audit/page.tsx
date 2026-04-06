'use client';

import { useState, useEffect, useCallback } from 'react';
import { v4 as uuid } from 'uuid';
import { useCareerData } from '@/hooks/useCareerData';
import { useAI } from '@/hooks/useAI';
import { CareerAudit } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Clock, Play, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

const QUESTIONS = [
  { key: 'capabilityCheck' as const, label: 'Capability Check', prompt: 'What can I do now that I couldn\'t 6 months ago?' },
  { key: 'marketPosition' as const, label: 'Market Position', prompt: 'Who would hire me tomorrow and why?' },
  { key: 'learningEdge' as const, label: 'Learning Edge', prompt: 'What\'s the most important thing I need to learn next?' },
];

function scoreAnswer(answer: string): 'empty' | 'vague' | 'clear' {
  if (!answer.trim()) return 'empty';
  const words = answer.trim().split(/\s+/).length;
  if (words < 10) return 'vague';
  const hasSpecifics = /\d|%|metric|team|product|company|built|shipped|grew|reduced|improved/i.test(answer);
  return hasSpecifics ? 'clear' : 'vague';
}

const SCORE_COLORS: Record<string, string> = {
  empty: 'bg-red-500',
  vague: 'bg-yellow-500',
  clear: 'bg-green-500',
};

const SCORE_LABELS: Record<string, string> = {
  empty: 'Empty',
  vague: 'Vague',
  clear: 'Clear',
};

export default function AuditPage() {
  const { data, update, updatePhaseProgress } = useCareerData();
  const { generate, loading: aiLoading } = useAI();

  const [mode, setMode] = useState<'history' | 'active'>('history');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({
    capabilityCheck: '',
    marketPosition: '',
    learningEdge: '',
  });
  const [timeLeft, setTimeLeft] = useState(60);
  const [timerActive, setTimerActive] = useState(false);
  const [expandedAudit, setExpandedAudit] = useState<string | null>(null);

  useEffect(() => {
    if (!timerActive || timeLeft <= 0) return;
    const interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  const startAudit = () => {
    setMode('active');
    setCurrentQuestion(0);
    setAnswers({ capabilityCheck: '', marketPosition: '', learningEdge: '' });
    setTimeLeft(60);
    setTimerActive(true);
  };

  const nextQuestion = () => {
    if (currentQuestion < 2) {
      setCurrentQuestion((q) => q + 1);
      setTimeLeft(60);
      setTimerActive(true);
    }
  };

  const saveAudit = useCallback(async () => {
    setTimerActive(false);
    const audit: CareerAudit = {
      id: uuid(),
      date: new Date().toISOString(),
      capabilityCheck: answers.capabilityCheck,
      marketPosition: answers.marketPosition,
      learningEdge: answers.learningEdge,
      scores: {
        capability: scoreAnswer(answers.capabilityCheck),
        market: scoreAnswer(answers.marketPosition),
        learning: scoreAnswer(answers.learningEdge),
      },
    };

    await update((prev) => ({
      ...prev,
      audits: [audit, ...prev.audits],
    }));

    const progress = Math.min(100, (data.audits.length + 1) * 25);
    updatePhaseProgress('audit', progress);
    setMode('history');
  }, [answers, data.audits.length, update, updatePhaseProgress]);

  const analyzeWithAI = async (auditId: string) => {
    const audit = data.audits.find((a) => a.id === auditId);
    if (!audit) return;

    const result = await generate({
      prompt: `Analyze this career audit and identify if the person is coasting, being vague, or lacks clarity. Be direct and specific.

Capability Check: "${audit.capabilityCheck}"
Market Position: "${audit.marketPosition}"
Learning Edge: "${audit.learningEdge}"

Provide a brief diagnostic (3-4 sentences): Are they growing or coasting? Is their market position specific or generic? Is their learning edge aligned with market demand?`,
    });

    if (result) {
      await update((prev) => ({
        ...prev,
        audits: prev.audits.map((a) =>
          a.id === auditId ? { ...a, aiAnalysis: result } : a
        ),
      }));
    }
  };

  if (mode === 'active') {
    const q = QUESTIONS[currentQuestion];
    const timerPercent = (timeLeft / 60) * 100;

    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">3-Minute Career Audit</h1>
          <p className="text-muted-foreground mt-1">1 minute per question. Be honest. Be specific.</p>
        </div>

        <div className="flex items-center gap-2 mb-4">
          {QUESTIONS.map((_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-full ${i <= currentQuestion ? 'bg-primary' : 'bg-muted'}`}
            />
          ))}
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Question {currentQuestion + 1}: {q.label}</CardTitle>
                <CardDescription className="mt-1 text-base">{q.prompt}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Clock className={`h-4 w-4 ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-muted-foreground'}`} />
                <span className={`text-lg font-mono font-bold ${timeLeft <= 10 ? 'text-red-500' : ''}`}>
                  0:{timeLeft.toString().padStart(2, '0')}
                </span>
              </div>
            </div>
            <Progress value={timerPercent} className="mt-2 h-1" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Write your answer here..."
              value={answers[q.key]}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [q.key]: e.target.value }))}
              rows={6}
              className="text-base"
              autoFocus
            />
            <div className="flex items-center justify-between">
              <Badge variant="outline">
                {answers[q.key].trim().split(/\s+/).filter(Boolean).length} words
              </Badge>
              <div className="flex gap-2">
                {currentQuestion < 2 ? (
                  <Button onClick={nextQuestion}>
                    Next Question
                  </Button>
                ) : (
                  <Button onClick={saveAudit}>
                    Complete Audit
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">3-Minute Career Audit</h1>
          <p className="text-muted-foreground mt-1">
            Monthly check-in: capability, market position, learning edge
          </p>
        </div>
        <Button onClick={startAudit}>
          <Play className="h-4 w-4 mr-2" />
          Start Audit
        </Button>
      </div>

      {data.audits.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No audits yet</h3>
            <p className="text-muted-foreground mb-4">
              Take 3 minutes to assess where you are. One question per minute.
            </p>
            <Button onClick={startAudit}>
              <Play className="h-4 w-4 mr-2" />
              Start Your First Audit
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Audit History</h2>
          {data.audits.map((audit) => (
            <Card key={audit.id}>
              <CardHeader
                className="cursor-pointer"
                onClick={() => setExpandedAudit(expandedAudit === audit.id ? null : audit.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-sm">
                      {new Date(audit.date).toLocaleDateString('en-IN', {
                        year: 'numeric', month: 'short', day: 'numeric'
                      })}
                    </CardTitle>
                    <div className="flex gap-1">
                      {(['capability', 'market', 'learning'] as const).map((key) => (
                        <div
                          key={key}
                          className={`w-3 h-3 rounded-full ${SCORE_COLORS[audit.scores[key]]}`}
                          title={`${key}: ${SCORE_LABELS[audit.scores[key]]}`}
                        />
                      ))}
                    </div>
                  </div>
                  {expandedAudit === audit.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </CardHeader>
              {expandedAudit === audit.id && (
                <CardContent className="space-y-4">
                  {QUESTIONS.map((q) => (
                    <div key={q.key}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{q.label}</span>
                        <div className={`w-2 h-2 rounded-full ${SCORE_COLORS[audit.scores[q.key === 'capabilityCheck' ? 'capability' : q.key === 'marketPosition' ? 'market' : 'learning']]}`} />
                        <span className="text-xs text-muted-foreground">
                          {SCORE_LABELS[audit.scores[q.key === 'capabilityCheck' ? 'capability' : q.key === 'marketPosition' ? 'market' : 'learning']]}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {audit[q.key] || <em>No answer</em>}
                      </p>
                    </div>
                  ))}
                  <Separator />
                  {audit.aiAnalysis ? (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">AI Analysis</span>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{audit.aiAnalysis}</p>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => analyzeWithAI(audit.id)}
                      disabled={aiLoading}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      {aiLoading ? 'Analyzing...' : 'Analyze with AI'}
                    </Button>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
