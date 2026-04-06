export interface CareerRole {
  company: string;
  title: string;
  startYear: number;
  endYear?: number;
  highlights: string[];
}

export interface SuperpowerStory {
  id: string;
  situation: string;       // What was broken / what was the context?
  whatOthersSaw: string;   // What did others think the problem was?
  whatYouSaw: string;      // What did YOU see differently? (the reframe)
  action: string;          // What did you personally do? (specific, not team)
  outcome: string;         // Result + metric
  domains: string[];       // Domains you went deep in for this story
}

export interface UserProfile {
  name: string;
  currentRole: string;
  yearsExperience: number;
  function: 'product' | 'marketing' | 'growth' | 'tech' | 'other';
  targetIndustries: string[];
  targetCompanyStages: string[];
  rawResume?: string;
  rawLinkedIn?: string;
  careerTimeline?: CareerRole[];
  skills?: string[];
  extractedWins?: string[];
  superpowers?: string[];        // Legacy: keyword tags from resume extraction. Still used as fallback.
  careerSummary?: string;
  onboardingCompleted?: boolean;
  // Superpower Discovery (from wizard — HOW you think, not WHAT you've done)
  superpowerStatement?: string;         // Full positioning statement (4-5 sentences)
  superpowerPunchline?: string;         // 1-sentence version (~15 words)
  superpowerStatement30s?: string;      // 30-second version (2-3 sentences)
  superpowerStories?: SuperpowerStory[]; // 3 structured stories from wizard
  superpowerDomains?: string[];         // Domains they go deep in
  superpowerAgency?: string[];          // Things they do themselves, not delegate
  superpowerDiscoveryCompleted?: boolean;
}

export interface CareerAudit {
  id: string;
  date: string;
  capabilityCheck: string;
  marketPosition: string;
  learningEdge: string;
  scores: {
    capability: 'empty' | 'vague' | 'clear';
    market: 'empty' | 'vague' | 'clear';
    learning: 'empty' | 'vague' | 'clear';
  };
  aiAnalysis?: string;
}

export interface TargetCompany {
  id: string;
  name: string;
  industry: string;
  stage: string;
  type: 'internet-first' | 'ai-first';
  problems: string[];
  skillsTheyHire: string[];
  proofCues: string[];
  peopleSignals: string[];
  productSignals: string[];
  marketSignals: string[];
  // Discovery & fit analysis
  fitTier?: 'tier1' | 'tier2' | 'tier3' | 'dropped';
  fitRationale?: string;
  realProblem?: string;
  superpowerMatch?: string;
  powIdea?: string;
  // Additional research signals
  jobPostingSignals?: string[];
  recentHireSignals?: string[];
  leadershipSignals?: string[];
  redFlags?: string[];
  // Logistics
  location?: string;
  hybridRemote?: boolean;
  openRoles?: string[];
  fundingInfo?: string;
  companyStatus?: 'shortlisted' | 'researching' | 'pow-building' | 'applied' | 'dropped';
}

export interface Win {
  id: string;
  title: string;
  category: string;
  before: string;
  insight: string;
  action: string;
  after: string;
  metrics: string[];
  transferable: boolean;
}

export interface PositioningMatrix {
  wins: Win[];
  companies: TargetCompany[];
  scores: Record<string, Record<string, 0 | 1 | 2>>; // winId -> companyProblem -> score
}

export interface GRIPNarrative {
  id: string;
  companyId: string;
  gap: string;
  result: string;
  inputLevers: { lever: string; contribution: string; detail: string }[];
  plan: string;
}

export interface ElevatorPitch {
  id: string;
  companyId?: string;
  stranger10s: string;
  recruiter30s: string;
  peer2min: string;
}

export interface ResumeNarrative {
  id: string;
  companyId: string;
  companyProblems: string[];
  mappedWins: string[];
  narrative: string;
  gaps: GapAnalysis[];
  bridgeStatements: string[];
  trustFactors: string[];
  riskFactors: string[];
}

export interface GapAnalysis {
  type: 'context-translation' | 'problem-alignment' | 'brand-bias' | 'hiring-manager-math';
  description: string;
  bridgeStatement: string;
}

export interface ProofOfWork {
  id: string;
  companyId: string;
  companyType: 'internet-first' | 'ai-first';
  growthEquation: GrowthEquation;
  targetLever: string;
  sprintPlan: SprintDay[];
  userTestingLog: UserTestEntry[];
  pitchEmail?: string;
}

export interface GrowthEquation {
  topMetric: string;
  levels: { metric: string; subMetrics: string[] }[];
}

export interface SprintDay {
  day: number;
  task: string;
  milestone: string;
  completed: boolean;
}

export interface UserTestEntry {
  id: string;
  date: string;
  quotes: string[];
  delightMoments: string[];
  confusionPoints: string[];
  timeSaved: string;
}

export interface ColdEmail {
  id: string;
  companyId: string;
  recipientType: 'hiring-manager' | 'boutique-agency' | 'vc-talent' | 'community';
  channel: 'email' | 'linkedin' | 'twitter';
  subject: string;
  body: string;
  iCount: number;
  sent: boolean;
  sentDate?: string;
  replied: boolean;
  repliedDate?: string;
  variant: string;
}

export interface JobApplication {
  id: string;
  companyId?: string;
  companyName: string;
  role: string;
  dateApplied: string;
  status: 'researching' | 'applied' | 'response' | 'interview' | 'offer' | 'rejected' | 'ghosted';
  responseDate?: string;
  nextSteps: string;
  qualityChecklist: {
    researchDone: boolean;
    requirementsMapped: boolean;
    coldDmSent: boolean;
  };
  notes: string;
}

export interface WeeklyTracker {
  weekNumber: 1 | 2 | 3 | 4;
  startDate: string;
  dailyLogs: DailyLog[];
  weeklyReview?: string;
}

export interface DailyLog {
  date: string;
  applicationsSubmitted: number;
  companiesResearched: number;
  morningRoutineDone: boolean;
  deepWorkHours: number;
  notes: string;
}

export interface CareerData {
  profile?: UserProfile;
  audits: CareerAudit[];
  companies: TargetCompany[];
  wins: Win[];
  positioningMatrix?: PositioningMatrix;
  gripNarratives: GRIPNarrative[];
  elevatorPitches: ElevatorPitch[];
  resumeNarratives: ResumeNarrative[];
  proofsOfWork: ProofOfWork[];
  coldEmails: ColdEmail[];
  applications: JobApplication[];
  weeklyTrackers: WeeklyTracker[];
  phaseProgress: Record<string, number>;
}

export const PHASES = [
  { id: 'audit', label: 'Career Audit', path: '/audit', icon: 'ClipboardCheck' },
  { id: 'market', label: 'Market Research', path: '/market', icon: 'Search' },
  { id: 'positioning', label: 'Positioning', path: '/positioning', icon: 'Target' },
  { id: 'resume', label: 'Resume Builder', path: '/resume', icon: 'FileText' },
  { id: 'proof', label: 'Proof of Work', path: '/proof', icon: 'Hammer' },
  { id: 'outreach', label: 'Cold Outreach', path: '/outreach', icon: 'Mail' },
  { id: 'search', label: 'Job Search', path: '/search', icon: 'Briefcase' },
] as const;

export type PhaseId = typeof PHASES[number]['id'];
