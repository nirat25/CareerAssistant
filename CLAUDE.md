# CLAUDE.md — Career Assistant Web App

## What This Is

Interactive web app that distills a 12-article career development curriculum into a guided, AI-powered tool for tech professionals seeking jobs in India's startup ecosystem. Built Feb 2026.

## Tech Stack

- **Next.js 14** (App Router, no `src/` dir)
- **TypeScript** (strict, `downlevelIteration` enabled in tsconfig)
- **Tailwind CSS** + **shadcn/ui** (class-based dark mode)
- **Anthropic Claude API** via `@anthropic-ai/sdk` for AI features
- **localStorage** for persistence (interface ready for Supabase swap)

## Commands

```bash
npm run dev      # dev server on localhost:3000
npm run build    # production build (also runs lint + typecheck)
npm run lint     # ESLint only
```

No test suite exists yet.

## Architecture

```
webapp/
├── app/                        # Next.js App Router pages
│   ├── layout.tsx              # Root layout → AppShell (client component)
│   ├── page.tsx                # Dashboard: stats, phase cards, markdown export
│   ├── api/ai/generate/route.ts  # Claude API proxy (POST, needs ANTHROPIC_API_KEY)
│   ├── api/jobs/search/route.ts  # Stub for future Indeed API
│   ├── audit/page.tsx          # Phase 1: 3-Minute Career Audit
│   ├── market/page.tsx         # Phase 2: Market Research Hub  ← SIGNIFICANTLY UPGRADED Feb 2026
│   ├── positioning/page.tsx    # Phase 3: Positioning Engine
│   ├── resume/page.tsx         # Phase 4: Resume Narrative Builder
│   ├── proof/page.tsx          # Phase 5: Proof of Work Tracker
│   ├── outreach/page.tsx       # Phase 6: Cold Email Workshop
│   └── search/page.tsx         # Phase 7: 4-Week Job Search System
├── components/
│   ├── ui/                     # shadcn/ui primitives (button, card, input, textarea, label, badge, tabs, progress, dialog, select, separator, sheet, scroll-area, tooltip)
│   └── layout/
│       ├── AppShell.tsx        # Client wrapper: loads data, renders sidebar + main
│       └── Sidebar.tsx         # Navigation with phase progress + dark mode toggle
├── hooks/
│   ├── useCareerData.ts        # Central state: loads from localStorage, exposes update()
│   └── useAI.ts                # Wraps fetch to /api/ai/generate
├── lib/
│   ├── types.ts                # All data models + PHASES constant  ← UPDATED Feb 2026
│   ├── storage.ts              # StorageProvider interface (LocalStorageProvider impl)
│   ├── ai.ts                   # Client-side AI helper (calls /api/ai/generate)
│   ├── frameworks.ts           # WIN_CHECKLISTS, INDUSTRY_METRICS, GRIP, JTBD, GAP_TYPES
│   └── export.ts               # exportToMarkdown() + downloadMarkdown()
└── public/
```

## Key Patterns

- **Every page is `'use client'`** — all pages use hooks for state and AI
- **State flows through `useCareerData()`** — single hook that reads/writes localStorage via `storage.ts`. Call `update(prev => newData)` to persist changes
- **AI calls go through `/api/ai/generate`** — server-side route that uses Anthropic SDK. Client uses `useAI()` hook which calls `lib/ai.ts`
- **Cross-phase data flow** — companies from Phase 2 feed into Phases 4-7; wins from Phase 3 feed into Phase 4 narratives; positioning flows into outreach; **superpower (from Profile) feeds into Phases 2, 3, 6**
- **shadcn/ui components** are in `components/ui/` — installed: button, card, input, textarea, label, badge, tabs, progress, dialog, select, separator, sheet, scroll-area, tooltip
- **Icons** from `lucide-react`

## Data Model (lib/types.ts)

Core entities: `UserProfile`, `CareerAudit`, `TargetCompany`, `Win`, `PositioningMatrix`, `GRIPNarrative`, `ElevatorPitch`, `ResumeNarrative`, `ProofOfWork`, `ColdEmail`, `JobApplication`, `WeeklyTracker`. All stored in a single `CareerData` object in localStorage under key `career-assistant-data`.

### UserProfile — key fields

| Field | Type | Notes |
|-------|------|-------|
| `name`, `currentRole`, `yearsExperience`, `function` | primitives | Basic info |
| `rawResume`, `rawLinkedIn` | string | Raw text pasted by user |
| `careerTimeline` | CareerRole[] | Extracted from resume |
| `skills`, `extractedWins` | string[] | AI-extracted from resume |
| `superpowers` | string[] | Legacy: 3-5 keyword tags from resume extraction. Still used as fallback |
| `careerSummary` | string | 2-3 sentence arc |
| `superpowerStatement` | string | **NEW** Full positioning statement (4-5 sentences). Primary superpower field |
| `superpowerPunchline` | string | **NEW** 1-sentence version (~15 words) |
| `superpowerStatement30s` | string | **NEW** 30-second version (2-3 sentences) |
| `superpowerStories` | SuperpowerStory[] | **NEW** 3 structured stories from wizard |
| `superpowerDomains` | string[] | **NEW** Domains they go deep in (finance, engineering, SQL, ops, etc.) |
| `superpowerAgency` | string[] | **NEW** Things they do themselves, not delegate |
| `superpowerDiscoveryCompleted` | boolean | **NEW** Whether wizard was completed |
| `onboardingCompleted` | boolean | Whether initial resume/LinkedIn setup is done |

### SuperpowerStory interface (NEW)

```typescript
interface SuperpowerStory {
  id: string;
  situation: string;        // What was the situation / what was broken?
  whatOthersSaw: string;    // What did others think the problem was?
  whatYouSaw: string;       // What did YOU see differently?
  action: string;           // What did you do? (personal, specific)
  outcome: string;          // Result / metric
  domains: string[];        // Domains you went deep in for this story
}
```

### TargetCompany — updated fields (Feb 2026)

Original fields kept: `id`, `name`, `industry`, `stage`, `type`, `problems`, `skillsTheyHire`, `proofCues`, `peopleSignals`, `productSignals`, `marketSignals`

New fields added (all optional, backwards compatible):

| Field | Type | Notes |
|-------|------|-------|
| `fitTier` | 'tier1' \| 'tier2' \| 'tier3' \| 'dropped' | Priority ranking |
| `fitRationale` | string | Why this tier |
| `realProblem` | string | The actual business challenge they're solving in 12 months |
| `superpowerMatch` | string | How user's specific background maps to this company's problem |
| `powIdea` | string | Specific proof-of-work artifact to build and send cold |
| `jobPostingSignals` | string[] | What JD language reveals |
| `recentHireSignals` | string[] | What recent hires signal about direction |
| `leadershipSignals` | string[] | What founders/leadership post publicly |
| `redFlags` | string[] | Legal/financial/culture concerns |
| `location` | string | City + work mode |
| `hybridRemote` | boolean | Whether hybrid/remote is offered |
| `openRoles` | string[] | Specific roles currently open |
| `fundingInfo` | string | Stage, amount, lead investor |
| `companyStatus` | 'shortlisted' \| 'researching' \| 'pow-building' \| 'applied' \| 'dropped' | User's workflow state |

## What Each Phase Does

| Phase | Route | Core Feature | AI Feature |
|-------|-------|-------------|------------|
| 1. Career Audit | `/audit` | Timed 3-question assessment (60s each), traffic-light scoring, audit history | Analyzes answers for coasting/vagueness |
| 2. Market Research | `/market` | **Discover tab** (AI shortlist from criteria), company cards with tier system (Tier 1/2/3/Dropped), status workflow (shortlisted→pow-building→applied), 4-tab detail view | **Discover**: generates ranked company shortlist with real problem + superpower match + POW idea. **Full Analysis**: generates fit analysis for any company. **Signals**: generates domain-specific signals |
| 3. Positioning | `/positioning` | Win collection (BIAR structure), fit matrix (wins × company problems), GRIP narratives, elevator pitches (10s/30s/2min) | Generates GRIP narratives and pitches |
| 4. Resume Builder | `/resume` | Per-company narrative builder, 4-gap analyzer, trust ladder | Generates tailored narratives with gap/bridge analysis |
| 5. Proof of Work | `/proof` | Growth equation decoder, 10-day sprint tracker, user testing log | Decodes growth equations, generates pitch emails |
| 6. Cold Outreach | `/outreach` | JTBD email composer, "I" counter (warns >2), reply rate tracking with benchmarks (<10% = weak, >40% = found it) | Drafts cold emails per recipient type |
| 7. Job Search | `/search` | Application tracker with status pipeline, daily time blocks, quality checklist, burnout detection (rage-applying, skipping routines), 4-week progress | — |

## Superpower Discovery Feature (PLANNED — not yet built)

A guided wizard added as a new tab on the Profile page (`/profile`). Addresses the gap that resumes describe WHAT someone did, not HOW they think — and superpowers live in the method, not the outcome.

**4-step flow:**

1. **Story Mining** — User writes 3 "peak impact" stories via structured prompts:
   - Situation / what was broken
   - What others thought the problem was
   - What you saw differently (the reframe)
   - What you did personally (specific actions)
   - Outcome / metric
   - Which domains you went deep in

2. **AI Pattern Analysis** — AI reads all 3 stories, surfaces:
   - The reframe pattern ("In each story, you [X]")
   - Domain depth pattern ("You consistently go deep in [X] and [Y]")
   - Agency pattern ("You consistently do [X] yourself rather than delegating")

3. **AI Synthesis** — Generates 3 versions: punchline (1-sentence), 30-second, full positioning statement. User edits each.

4. **Confirm + Save** — Saves to `superpowerStatement`, `superpowerPunchline`, `superpowerStatement30s`. Sets `superpowerDiscoveryCompleted = true`.

**Downstream propagation:** The `superpowerStatement` feeds into:
- Market Research: Discover panel uses it as profile context for AI shortlisting
- Market Research: Full Analysis uses it when generating company fit analysis
- Positioning: GRIP narrative AI prompts
- Cold Outreach: Email drafting context

**Milestones (in task list):**
- M1: Extend `UserProfile` type + `SuperpowerStory` interface
- M2: Build Superpower Discovery Wizard UI (Profile page, new tab)
- M3: Upgrade Profile page display (replace tags with statement)
- M4: Propagate `superpowerStatement` into AI prompts across all phases
- M5: Update this CLAUDE.md (done in current session)

## Environment

- `ANTHROPIC_API_KEY` in `.env.local` (required for AI features, app works without it)
- `.env.example` has the template

## Known Limitations / Future Work

- No database — localStorage only (StorageProvider interface ready for Supabase)
- No auth / user accounts
- Job search API (`/api/jobs/search`) is a stub — designed for Indeed API integration
- No tests
- No PDF export (markdown only)
- Superpower Discovery wizard not yet built (M1-M4 in task list)
- Fit matrix UI works but doesn't auto-highlight positioning edges/gaps yet
- User testing log in Proof of Work has basic structure but no inline editing of quotes/moments
- Market Research "Signals" tab: recentHireSignals and jobPostingSignals require manual entry or AI generation — no live LinkedIn/web scraping
