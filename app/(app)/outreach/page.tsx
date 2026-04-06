'use client';

import { useState, useMemo } from 'react';
import { v4 as uuid } from 'uuid';
import { useCareerData } from '@/hooks/useCareerData';
import { useAI } from '@/hooks/useAI';
import { ColdEmail } from '@/lib/types';
import { COLD_EMAIL_STRUCTURE } from '@/lib/frameworks';
import { getSuperpowerContext } from '@/lib/ai';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sparkles, Plus, AlertTriangle, Send, CheckCircle, Clock } from 'lucide-react';

const RECIPIENT_TYPES = [
  { value: 'hiring-manager', label: 'Hiring Manager' },
  { value: 'boutique-agency', label: 'Boutique Agency' },
  { value: 'vc-talent', label: 'VC Talent Partner' },
  { value: 'community', label: 'Community' },
] as const;

const CHANNELS = [
  { value: 'email', label: 'Email', timing: 'Tue-Thu, 10am-12pm' },
  { value: 'linkedin', label: 'LinkedIn', timing: 'Tue-Thu, morning' },
  { value: 'twitter', label: 'Twitter/X', timing: 'Sunday evening for founders' },
] as const;

function countIs(text: string): number {
  return (text.match(/\bI\b/g) || []).length;
}

export default function OutreachPage() {
  const { data, update, updatePhaseProgress } = useCareerData();
  const { generate, loading: aiLoading } = useAI();
  const [dialogOpen, setDialogOpen] = useState(false);

  const [form, setForm] = useState({
    companyId: '',
    recipientType: 'hiring-manager' as ColdEmail['recipientType'],
    channel: 'email' as ColdEmail['channel'],
    subject: '',
    body: '',
    variant: '',
  });

  const iCount = useMemo(() => countIs(form.body), [form.body]);

  const generateEmail = async () => {
    const company = data.companies.find((c) => c.id === form.companyId);
    const winsText = data.wins.slice(0, 3).map((w) => `- ${w.title}: ${w.after}`).join('\n');
    const superpowerCtx = getSuperpowerContext(data.profile);

    const result = await generate({
      prompt: `Write a cold ${form.channel === 'email' ? 'email' : 'DM'} using the JTBD (Jobs to Be Done) framework for reaching out to a ${form.recipientType.replace('-', ' ')} at ${company?.name || 'a tech company'}.
${superpowerCtx ? `\nCandidate superpower (use this as the hook/angle):\n${superpowerCtx}\n` : ''}
Candidate wins:
${winsText || 'Not provided'}

Company problems: ${company?.problems.join(', ') || 'Not provided'}

Rules:
- START: Be specific, give a genuine compliment, or get straight to the point
- MIDDLE: Show value (don't tell), reference their work/problems
- CTA: Binary time slots, dead-easy reply
- Use no more than 2 "I" references
- Keep it under 150 words
- Be conversational, not formal

Provide SUBJECT line and BODY separately.`,
    });

    if (result) {
      const subjectMatch = result.match(/SUBJECT:\s*(.*)/i);
      const bodyMatch = result.match(/BODY:\s*([\s\S]*)/i);
      setForm((prev) => ({
        ...prev,
        subject: subjectMatch?.[1]?.trim() || prev.subject,
        body: bodyMatch?.[1]?.trim() || result,
      }));
    }
  };

  const saveEmail = async () => {
    const email: ColdEmail = {
      id: uuid(),
      companyId: form.companyId,
      recipientType: form.recipientType,
      channel: form.channel,
      subject: form.subject,
      body: form.body,
      iCount: countIs(form.body),
      sent: false,
      replied: false,
      variant: form.variant || 'v1',
    };

    await update((prev) => ({
      ...prev,
      coldEmails: [...prev.coldEmails, email],
    }));
    updatePhaseProgress('outreach', Math.min(100, ((data.coldEmails.length + 1) / 5) * 100));
    setForm({ companyId: '', recipientType: 'hiring-manager', channel: 'email', subject: '', body: '', variant: '' });
    setDialogOpen(false);
  };

  const markSent = async (emailId: string) => {
    await update((prev) => ({
      ...prev,
      coldEmails: prev.coldEmails.map((e) =>
        e.id === emailId ? { ...e, sent: true, sentDate: new Date().toISOString() } : e
      ),
    }));
  };

  const markReplied = async (emailId: string) => {
    await update((prev) => ({
      ...prev,
      coldEmails: prev.coldEmails.map((e) =>
        e.id === emailId ? { ...e, replied: true, repliedDate: new Date().toISOString() } : e
      ),
    }));
  };

  // A/B test analytics
  const sentEmails = data.coldEmails.filter((e) => e.sent);
  const repliedEmails = data.coldEmails.filter((e) => e.replied);
  const replyRate = sentEmails.length > 0 ? (repliedEmails.length / sentEmails.length) * 100 : 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cold Email Workshop</h1>
          <p className="text-muted-foreground mt-1">
            JTBD-powered emails that get replies
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />Compose Email
        </Button>
      </div>

      {/* Channel Guide */}
      <div className="grid md:grid-cols-3 gap-4">
        {CHANNELS.map((ch) => (
          <Card key={ch.value}>
            <CardContent className="pt-4">
              <div className="font-medium text-sm">{ch.label}</div>
              <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <Clock className="h-3 w-3" />{ch.timing}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Analytics */}
      {sentEmails.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Reply Rate Tracker</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{sentEmails.length}</div>
                <div className="text-xs text-muted-foreground">Sent</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{repliedEmails.length}</div>
                <div className="text-xs text-muted-foreground">Replied</div>
              </div>
              <div>
                <div className={`text-2xl font-bold ${replyRate < 10 ? 'text-red-500' : replyRate > 40 ? 'text-green-500' : 'text-yellow-500'}`}>
                  {Math.round(replyRate)}%
                </div>
                <div className="text-xs text-muted-foreground">Reply Rate</div>
              </div>
            </div>
            {replyRate < 10 && sentEmails.length >= 5 && (
              <div className="flex items-center gap-2 mt-3 p-2 bg-red-50 rounded text-sm text-red-700">
                <AlertTriangle className="h-4 w-4" />
                Below 10% — your positioning may not be sharp enough
              </div>
            )}
            {replyRate > 40 && (
              <div className="flex items-center gap-2 mt-3 p-2 bg-green-50 rounded text-sm text-green-700">
                <CheckCircle className="h-4 w-4" />
                Above 40% — you found your positioning!
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Email List */}
      <div className="space-y-4">
        {data.coldEmails.map((email) => {
          const company = data.companies.find((c) => c.id === email.companyId);
          return (
            <Card key={email.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm">{email.subject || 'No subject'}</CardTitle>
                    <CardDescription>
                      {company?.name || 'Unknown'} &middot; {email.recipientType.replace('-', ' ')} &middot; {email.channel}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {email.iCount > 2 && (
                      <Badge variant="destructive" className="text-xs">
                        {email.iCount} &quot;I&quot;s
                      </Badge>
                    )}
                    <Badge variant={email.variant ? 'outline' : 'secondary'}>{email.variant || 'v1'}</Badge>
                    {email.replied ? (
                      <Badge className="bg-green-500">Replied</Badge>
                    ) : email.sent ? (
                      <Badge variant="secondary">Sent</Badge>
                    ) : (
                      <Badge variant="outline">Draft</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap mb-3">{email.body}</p>
                <div className="flex gap-2">
                  {!email.sent && (
                    <Button variant="outline" size="sm" onClick={() => markSent(email.id)}>
                      <Send className="h-3 w-3 mr-1" />Mark Sent
                    </Button>
                  )}
                  {email.sent && !email.replied && (
                    <Button variant="outline" size="sm" onClick={() => markReplied(email.id)}>
                      <CheckCircle className="h-3 w-3 mr-1" />Mark Replied
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Compose Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Compose Cold Email</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Target Company</Label>
              <Select value={form.companyId} onValueChange={(v) => setForm({ ...form, companyId: v })}>
                <SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger>
                <SelectContent>
                  {data.companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Recipient Type</Label>
                <Select value={form.recipientType} onValueChange={(v) => setForm({ ...form, recipientType: v as ColdEmail['recipientType'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {RECIPIENT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Channel</Label>
                <Select value={form.channel} onValueChange={(v) => setForm({ ...form, channel: v as ColdEmail['channel'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CHANNELS.map((ch) => (
                      <SelectItem key={ch.value} value={ch.value}>{ch.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Variant Label</Label>
              <Input value={form.variant} onChange={(e) => setForm({ ...form, variant: e.target.value })} placeholder="e.g., v1-product-angle" />
            </div>

            <Button variant="outline" onClick={generateEmail} disabled={aiLoading} className="w-full">
              <Sparkles className="h-4 w-4 mr-2" />{aiLoading ? 'Generating...' : 'Generate with AI (JTBD Framework)'}
            </Button>

            {/* JTBD structure reference */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              {Object.entries(COLD_EMAIL_STRUCTURE).map(([section, tips]) => (
                <div key={section} className="p-2 bg-muted rounded">
                  <div className="font-medium capitalize mb-1">{section}</div>
                  {tips.map((tip, i) => (
                    <div key={i} className="text-muted-foreground">&bull; {tip}</div>
                  ))}
                </div>
              ))}
            </div>

            <div>
              <Label>Subject</Label>
              <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Email subject line" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Body</Label>
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${iCount > 2 ? 'text-red-500 font-bold' : 'text-muted-foreground'}`}>
                    &quot;I&quot; count: {iCount}
                  </span>
                  {iCount > 2 && <AlertTriangle className="h-3 w-3 text-red-500" />}
                </div>
              </div>
              <Textarea
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                rows={8}
                placeholder="Write your cold email..."
              />
            </div>
            <Button onClick={saveEmail} className="w-full" disabled={!form.body.trim()}>
              Save Email
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
