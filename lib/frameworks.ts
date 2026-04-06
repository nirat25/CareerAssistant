// Function-specific win checklists from the Positioning Blueprint article
export const WIN_CHECKLISTS: Record<string, string[]> = {
  product: [
    'Shipped a 0→1 product or feature',
    'Led a product pivot based on user data',
    'Improved a key product metric (retention, activation, NPS)',
    'Built and managed a product roadmap',
    'Ran user research that changed product direction',
    'Managed cross-functional stakeholders (eng, design, marketing)',
    'Defined and tracked product OKRs',
    'Launched in a new market or segment',
    'Reduced churn through product improvements',
    'Built internal tools that improved team productivity',
  ],
  marketing: [
    'Built a brand from scratch or led a rebrand',
    'Grew organic traffic/SEO significantly',
    'Managed paid acquisition profitably',
    'Built and scaled content marketing engine',
    'Led a viral campaign or moment',
    'Built and grew a community',
    'Launched a product with marketing strategy',
    'Improved marketing attribution/measurement',
    'Built partnerships or co-marketing programs',
    'Managed a marketing team/agency',
  ],
  growth: [
    'Identified and exploited a growth loop',
    'Ran experiments at scale (A/B testing framework)',
    'Improved activation or onboarding metrics',
    'Built referral or viral mechanics',
    'Optimized pricing or monetization',
    'Improved retention through lifecycle engagement',
    'Identified and fixed conversion bottlenecks',
    'Built growth models or forecasts',
    'Scaled a channel from 0 to meaningful revenue',
    'Implemented data infrastructure for growth',
  ],
  tech: [
    'Architected a system from scratch',
    'Led a major migration or refactor',
    'Improved system performance significantly',
    'Built infrastructure that scaled 10x+',
    'Shipped under tight deadlines without quality loss',
    'Mentored junior engineers effectively',
    'Introduced new tech stack or practices to the team',
    'Built developer tools or internal platforms',
    'Handled production incidents and improved reliability',
    'Contributed to open source or technical community',
  ],
  other: [
    'Solved a problem no one else was solving',
    'Built something from scratch',
    'Improved a key metric',
    'Led a team or project',
    'Managed stakeholders across functions',
    'Introduced a new process or tool',
    'Handled a crisis or difficult situation',
    'Mentored or trained others',
    'Generated revenue or reduced costs',
    'Shipped something users loved',
  ],
};

export const INDUSTRY_METRICS: Record<string, string[]> = {
  saas: ['MRR/ARR', 'Churn rate', 'CAC payback', 'Net revenue retention', 'Expansion revenue', 'Time to value'],
  fintech: ['Transaction volume', 'Default rate', 'Approval rate', 'Compliance score', 'Unit economics', 'Regulatory milestones'],
  ecommerce: ['GMV', 'AOV', 'Repeat purchase rate', 'Cart conversion', 'Delivery SLA', 'Return rate'],
  consumer: ['DAU/MAU ratio', 'Session duration', 'Viral coefficient', 'D1/D7/D30 retention', 'NPS', 'Time to first value'],
  healthtech: ['Patient outcomes', 'Clinical accuracy', 'Regulatory clearance', 'Provider adoption', 'Cost per outcome', 'Compliance rate'],
  b2b: ['Pipeline generated', 'Sales cycle length', 'Win rate', 'Contract value', 'Implementation time', 'Customer health score'],
  marketplaces: ['Liquidity', 'Take rate', 'Supply/demand ratio', 'Repeat usage', 'Time to match', 'Network effects'],
  deeptech: ['Model accuracy', 'Inference latency', 'Data pipeline throughput', 'Research milestones', 'Patent filings', 'Benchmark performance'],
};

export const COMPANY_STAGES = [
  'Pre-seed / Idea stage',
  'Seed / Early product',
  'Series A / Product-market fit',
  'Series B / Scaling',
  'Series C+ / Growth',
  'Public / Enterprise',
];

export const ELEVATOR_PITCH_STRUCTURE = {
  warmup: 'Shared context or genuine observation',
  hook: 'The one thing that makes you memorable',
  meat: 'Your positioning statement with proof',
  intrigue: 'Leave them wanting to know more',
};

export const COLD_EMAIL_STRUCTURE = {
  start: ['Specificity', 'Genuine compliment', 'Straight to the point'],
  middle: ['Show value (not tell)', 'Reference their work', 'Connect to their problems'],
  cta: ['Binary time slots', 'Dead-easy reply'],
};

export const GAP_TYPES = [
  {
    id: 'context-translation',
    label: 'Context Translation',
    description: 'Different industry/company type but transferable skills',
  },
  {
    id: 'problem-alignment',
    label: 'Problem Alignment',
    description: "Your experience doesn't directly map to their problems",
  },
  {
    id: 'brand-bias',
    label: 'Brand Bias',
    description: "You don't have the logos they typically look for",
  },
  {
    id: 'hiring-manager-math',
    label: 'Hiring Manager Mental Math',
    description: 'Tenure, trajectory, or title gaps',
  },
] as const;
