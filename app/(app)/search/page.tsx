'use client';

import { useState } from 'react';
import { v4 as uuid } from 'uuid';
import { useCareerData } from '@/hooks/useCareerData';
import { JobApplication } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Briefcase, Plus, AlertTriangle, Calendar, CheckSquare
} from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  researching: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  applied: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  response: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  interview: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  offer: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  ghosted: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

export default function SearchPage() {
  const { data, update, updatePhaseProgress } = useCareerData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('tracker');
  const [appForm, setAppForm] = useState({
    companyName: '',
    role: '',
    status: 'researching' as JobApplication['status'],
    nextSteps: '',
    notes: '',
    researchDone: false,
    requirementsMapped: false,
    coldDmSent: false,
  });

  const saveApplication = async () => {
    if (!appForm.companyName.trim()) return;
    const app: JobApplication = {
      id: uuid(),
      companyName: appForm.companyName,
      role: appForm.role,
      dateApplied: new Date().toISOString(),
      status: appForm.status,
      nextSteps: appForm.nextSteps,
      qualityChecklist: {
        researchDone: appForm.researchDone,
        requirementsMapped: appForm.requirementsMapped,
        coldDmSent: appForm.coldDmSent,
      },
      notes: appForm.notes,
    };
    await update((prev) => ({
      ...prev,
      applications: [...prev.applications, app],
    }));
    updatePhaseProgress('search', Math.min(100, ((data.applications.length + 1) / 20) * 100));
    setAppForm({ companyName: '', role: '', status: 'researching', nextSteps: '', notes: '', researchDone: false, requirementsMapped: false, coldDmSent: false });
    setDialogOpen(false);
  };

  const updateAppStatus = async (id: string, status: JobApplication['status']) => {
    await update((prev) => ({
      ...prev,
      applications: prev.applications.map((a) =>
        a.id === id ? { ...a, status, responseDate: ['response', 'interview', 'offer', 'rejected'].includes(status) ? new Date().toISOString() : a.responseDate } : a
      ),
    }));
  };

  // Analytics
  const totalApps = data.applications.length;
  const responsesReceived = data.applications.filter((a) => ['response', 'interview', 'offer'].includes(a.status)).length;
  const responseRate = totalApps > 0 ? (responsesReceived / totalApps) * 100 : 0;
  const interviews = data.applications.filter((a) => a.status === 'interview').length;
  const offers = data.applications.filter((a) => a.status === 'offer').length;

  // Burnout detection
  const recentApps = data.applications.filter((a) => {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return new Date(a.dateApplied) > dayAgo;
  });
  const isRageApplying = recentApps.length > 10;
  const lowQuality = recentApps.filter((a) =>
    !a.qualityChecklist.researchDone && !a.qualityChecklist.requirementsMapped
  ).length > 3;

  // Week calculation
  const weekNumber = data.weeklyTrackers.length > 0 ? data.weeklyTrackers.length : 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">4-Week Job Search System</h1>
          <p className="text-muted-foreground mt-1">
            2 quality applications per day. Deep work mornings. Track everything.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />Add Application
        </Button>
      </div>

      {/* Burnout warnings */}
      {(isRageApplying || lowQuality) && (
        <Card className="border-orange-500">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-orange-700">
              <AlertTriangle className="h-5 w-5" />
              <div>
                {isRageApplying && <p className="text-sm font-medium">Rage-applying detected: {recentApps.length} applications in 24hrs. Quality over quantity.</p>}
                {lowQuality && <p className="text-sm font-medium">Low quality apps detected. Take a breath, do the research first.</p>}
                <p className="text-xs mt-1">Recovery: Take a 1-day break, set a 1-application minimum, change your environment.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{totalApps}</div>
            <div className="text-xs text-muted-foreground">Applications</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className={`text-2xl font-bold ${responseRate < 10 ? 'text-red-500' : responseRate > 30 ? 'text-green-500' : 'text-yellow-500'}`}>
              {Math.round(responseRate)}%
            </div>
            <div className="text-xs text-muted-foreground">Response Rate</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{interviews}</div>
            <div className="text-xs text-muted-foreground">Interviews</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-500">{offers}</div>
            <div className="text-xs text-muted-foreground">Offers</div>
          </CardContent>
        </Card>
      </div>

      {/* Daily schedule */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Daily Time Blocks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <div className="text-sm font-medium">9:00 - 11:00 AM</div>
                <div className="text-xs text-muted-foreground">Deep work: Quality applications</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Briefcase className="h-5 w-5 text-primary" />
              <div>
                <div className="text-sm font-medium">2:00 - 3:00 PM</div>
                <div className="text-xs text-muted-foreground">Company deep dive research</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="tracker">Application Tracker</TabsTrigger>
          <TabsTrigger value="weekly">Weekly Review</TabsTrigger>
        </TabsList>

        <TabsContent value="tracker" className="mt-4 space-y-3">
          {data.applications.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No applications yet. Start with 2 quality applications today.</p>
              </CardContent>
            </Card>
          ) : (
            data.applications.map((app) => (
              <Card key={app.id}>
                <CardContent className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{app.companyName}</div>
                      <div className="text-xs text-muted-foreground">{app.role} &middot; {new Date(app.dateApplied).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Quality indicators */}
                      <div className="flex gap-1">
                        {app.qualityChecklist.researchDone && <CheckSquare className="h-3 w-3 text-green-500" />}
                        {app.qualityChecklist.requirementsMapped && <CheckSquare className="h-3 w-3 text-blue-500" />}
                        {app.qualityChecklist.coldDmSent && <CheckSquare className="h-3 w-3 text-purple-500" />}
                      </div>
                      <Select value={app.status} onValueChange={(v) => updateAppStatus(app.id, v as JobApplication['status'])}>
                        <SelectTrigger className="w-32 h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(STATUS_COLORS).map((s) => (
                            <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {app.nextSteps && (
                    <div className="text-xs text-muted-foreground mt-1">Next: {app.nextSteps}</div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="weekly" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Weekly Review</CardTitle>
              <CardDescription>
                Week {weekNumber + 1} of 4 &middot; Review patterns, iterate, improve
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-sm font-medium mb-2">This Week&apos;s Numbers</div>
                  <div className="space-y-1 text-sm">
                    <div>Applications: {data.applications.filter((a) => {
                      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                      return new Date(a.dateApplied) > weekAgo;
                    }).length}</div>
                    <div>Responses: {data.applications.filter((a) => {
                      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                      return a.responseDate && new Date(a.responseDate) > weekAgo;
                    }).length}</div>
                  </div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-sm font-medium mb-2">Pattern Check</div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div>&bull; Are you getting responses from a specific company type?</div>
                    <div>&bull; Which positioning angle gets the best response?</div>
                    <div>&bull; Are you spending enough time on research vs. application?</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 4-week progress */}
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((week) => (
              <Card key={week} className={week <= weekNumber ? 'border-primary' : ''}>
                <CardContent className="py-3 text-center">
                  <div className="text-sm font-medium">Week {week}</div>
                  <div className="text-xs text-muted-foreground">
                    {week <= weekNumber ? 'Complete' : week === weekNumber + 1 ? 'Current' : 'Upcoming'}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Application Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Application</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Company Name</Label>
              <Input value={appForm.companyName} onChange={(e) => setAppForm({ ...appForm, companyName: e.target.value })} placeholder="e.g., Razorpay" />
            </div>
            <div>
              <Label>Role</Label>
              <Input value={appForm.role} onChange={(e) => setAppForm({ ...appForm, role: e.target.value })} placeholder="e.g., Senior PM" />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={appForm.status} onValueChange={(v) => setAppForm({ ...appForm, status: v as JobApplication['status'] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.keys(STATUS_COLORS).map((s) => (
                    <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Next Steps</Label>
              <Input value={appForm.nextSteps} onChange={(e) => setAppForm({ ...appForm, nextSteps: e.target.value })} placeholder="e.g., Follow up in 3 days" />
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">Quality Checklist</Label>
              <div className="space-y-2">
                {[
                  { key: 'researchDone', label: 'Company research done' },
                  { key: 'requirementsMapped', label: 'Requirements mapped to my wins' },
                  { key: 'coldDmSent', label: 'Cold DM/email sent' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={appForm[key as keyof typeof appForm] as boolean}
                      onChange={(e) => setAppForm({ ...appForm, [key]: e.target.checked })}
                      className="rounded"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={appForm.notes} onChange={(e) => setAppForm({ ...appForm, notes: e.target.value })} rows={2} />
            </div>
            <Button onClick={saveApplication} className="w-full">Save Application</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
