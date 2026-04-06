# Career Assistant Webapp — Full Roadmap

*Created: April 6, 2026 | Author: Cowork + Nirat*

---

## Philosophy

The 12-article curriculum prescribes a research-heavy, iterative job search. The webapp should make each step feel guided (not empty forms) while being honest about what requires human judgment vs. what can be automated. Where the app can't do something itself, it provides a ready-to-use prompt for an external tool (Cowork, Claude.ai, browser) that produces consistent, high-quality results the user can paste back in.

---

## Current State Summary

The app has 10 pages covering 7 phases. All are structurally complete but many have:
- **Empty-form problem**: pages present inputs without context or guidance on what good looks like
- **Fragile AI parsing**: generated text relies on exact label formats (GAP:, SUBJECT:) that break unpredictably
- **No data flow between phases**: wins don't inform resume narratives don't inform cold emails — each page is an island
- **Missing research layer**: the curriculum's heaviest step (company/people/market research) is manual and unassisted

---

## Milestones

### MILESTONE 0: Foundation Fixes (Make What Exists Actually Work)

These are small but critical fixes that make the existing pages usable before adding new features.

#### M0.1 — Fix AI output parsing across all pages
**Problem:** Every AI generation uses regex to parse labels like "GAP:", "SUBJECT:", "BODY:". If Claude doesn't use that exact format, the UI shows nothing or garbage.
**Solution:** Switch all AI generation endpoints to request structured JSON output. Add `Return ONLY valid JSON` instruction to every prompt. Parse JSON with try/catch fallback.
**Files:** `positioning/page.tsx` (GRIP + pitches), `resume/page.tsx` (narrative + gaps), `outreach/page.tsx` (email), `proof/page.tsx` (growth equation + pitch email)
**Tasks:**
- [ ] Audit every `generate()` call and its parsing logic
- [ ] Rewrite all AI prompts to request JSON output with defined schema
- [ ] Add JSON parsing with graceful fallback (show raw text if parse fails)
- [ ] Test each generation 3x to verify consistency
**Validation:** Generate GRIP, pitch, resume narrative, cold email, growth equation — all should parse correctly without manual intervention.

#### M0.2 — Add "what good looks like" guidance to every input
**Problem:** User faces empty textareas with no idea what to write. Curriculum has rich examples but they're not surfaced.
**Solution:** Add inline examples, placeholder text, and "show me an example" toggles to every form field.
**Files:** All page files + `lib/frameworks.ts`
**Tasks:**
- [ ] Add example text for each audit question (from curriculum)
- [ ] Add win examples per category (from `Positioning-blueprint.md`)
- [ ] Add GRIP story example (from `Choosing-positioning-as-a-generalist.md`)
- [ ] Add cold email examples per recipient type (from `Art-of-cold-emails.md`)
- [ ] Add pitch examples per format (from `Elevator-pitch-for-your-career.md`)
**Validation:** A new user should be able to understand what to write without reading the curriculum articles.

#### M0.3 — Wire phase-to-phase data flow
**Problem:** Wins created in Positioning don't show up as options in Resume. Resume narratives don't inform Cold Emails. Each page is isolated.
**Solution:** Add cross-page data references and "suggested from previous phase" sections.
**Tasks:**
- [ ] Resume page: auto-populate "your wins for this company" from positioning matrix
- [ ] Outreach page: show resume narrative + GRIP story when composing email for a company
- [ ] Proof page: show company's real problems when creating proof-of-work
- [ ] Search page: show cold email status when tracking an application
- [ ] Dashboard: show "suggested next action" based on what's complete vs. incomplete
**Validation:** Walk through the full flow for one company (GoKwik): add company → research → build wins → score matrix → generate GRIP → generate resume narrative → build proof → compose email → track application. Data should flow through without re-entering anything.

---

### MILESTONE 1: Smart Company Discovery (Cowork ↔ Webapp Pipeline)

*Status: V1 COMPLETE (built today). This milestone covers enhancements.*

#### M1.1 — Enhance discovery results display
**Tasks:**
- [ ] Add problem signature detail view (click a signature badge to see evidence + industries)
- [ ] Add "re-run discovery" button that shows instructions for Cowork
- [ ] Add filter/sort controls (by tier, by match count, by location)
- [ ] Show which existing target companies already match each problem signature
**Validation:** User can review 7+ companies, filter by tier, and understand exactly why each was suggested.

#### M1.2 — Build the "Run Discovery" Cowork prompt
When the user wants fresh results, they copy this prompt into Cowork:

**Prompt (saved in-app as a copyable block):**
```
Run a company discovery scan for my job search.

1. Read my profile from profile/NiratPatel_Superpowers.md, profile/NiratPatel_BaseResume.md, and profile/job-search-context.md
2. Read my existing targets from job-search/targets/TargetCompanies_and_Roles.md
3. Read my problem signatures from job-search/discovery/problem-signatures.json

Then:
a) If my profile has changed since the last signature extraction, re-extract problem signatures and update problem-signatures.json
b) Run 6-8 web searches combining my problem signatures with my geography/seniority/domain preferences
c) For each discovered company NOT in my existing targets:
   - Score it against each problem signature (strong/moderate/weak)
   - Assign a fit tier (tier1/tier2/tier3)
   - Write fit rationale, gaps to bridge, suggested role, and next action
d) Save results to job-search/discovery/discovery-results.json

Focus on companies that are actively hiring product managers at my level (Senior PM / Lead PM / Director) in India, especially Series B+ companies in B2B SaaS, eCommerce enablement, marketplace infrastructure, or supply chain tech.
```

---

### MILESTONE 2: Deep Company Research Automation

This is Feature 2 — once a user selects target companies, automate the research the curriculum prescribes.

#### M2.1 — Company Research dossier (Cowork-powered)
**What:** For each selected company, Cowork runs multi-source research and generates a structured dossier.
**Output:** Saved to `job-search/outreach/[company]/research-dossier.json`
**Webapp reads:** New API route `/api/research/[company]` + "Research" panel on Market page company detail view.

**Cowork prompt (user copies when they want research on a specific company):**
```
Run deep research on [COMPANY NAME] for my job search.

Context: Read my profile from profile/NiratPatel_Superpowers.md and my problem signatures from job-search/discovery/problem-signatures.json

Research these 5 signal types:
1. JOB POSTINGS: Search for their current open roles on LinkedIn, careers page, and job boards. Extract: role titles, seniority levels, specific language about problems they're solving, tech stack mentioned.
2. TEAM & RECENT HIRES: Search LinkedIn for people recently hired into product roles at [COMPANY] in last 6 months. Note: where they came from, their backgrounds, what patterns emerge.
3. LEADERSHIP SIGNALS: Search for posts/tweets/talks by founders, CTO, CPO of [COMPANY]. What are they publicly worried about, celebrating, or debating?
4. PRODUCT & MARKET SIGNALS: Search for recent news, funding, product launches, G2/Capterra/app store reviews. What's working? What's broken? What are users complaining about?
5. COMPETITIVE CONTEXT: Who are their direct competitors? Who just raised money? Who's winning in their space?

Then synthesize:
- "The actual problem this company is trying to solve in the next 12 months" (1-2 paragraphs)
- Map to my problem signatures: which ones match? How?
- Identify the top 2-3 proof-of-work project ideas (each: what to build, which metric it targets, build time estimate, who to send it to)
- Draft a cold email opener based on something specific you found (a leadership post, a product complaint, a competitive move)

Save the full dossier to: job-search/outreach/[company-lowercase]/research-dossier.json

Format the JSON with these fields: companyName, researchDate, jobPostingSignals[], recentHireSignals[], leadershipSignals[], productSignals[], marketSignals[], competitiveContext, synthesizedProblem, problemSignatureMatches[], proofOfWorkIdeas[], coldEmailOpener, sources[]
```

**Tasks:**
- [ ] Create API route: `webapp/app/api/research/[company]/route.ts` — reads from `job-search/outreach/[company]/research-dossier.json`
- [ ] Create `ResearchDossierPanel` component showing all 5 signal types + synthesis
- [ ] Integrate into Market page company detail view (new "Research" section or enhanced existing "Research" tab)
- [ ] Add "Copy research prompt" button that pre-fills the company name
- [ ] When user adds research results, auto-populate company fields (problems, signals, etc.)
**Validation:** Run the Cowork prompt for GoKwik. Compare output to the manual research already in `job-search-context.md`. Should be comparable or better quality.

#### M2.2 — Hiring Manager Research
**What:** When user provides a hiring manager's LinkedIn URL, Cowork researches their activity and concerns.

**Cowork prompt:**
```
Research this hiring manager for my outreach to [COMPANY NAME].

Hiring manager LinkedIn: [URL]

1. Extract their current role, how long they've been there, what they did before
2. Search X/Twitter for their recent posts (last 3 months). What are they talking about, worried about, proud of?
3. Search for any talks, podcasts, blog posts, or articles they've published
4. Search for any public comments they've made about their company's challenges

Synthesize:
- What is this person's #1 professional concern right now?
- What would make them respond to a cold email?
- What compliment could I open with that proves I've done homework (be specific, not generic)?
- Which of my GRIP stories would resonate most with their concerns?

Read my stories from: profile/NiratPatel_Superpowers.md

Save to: job-search/outreach/[company-lowercase]/hiring-manager-[firstname].json
Format: { name, role, company, linkedinUrl, background, recentActivity[], publishedContent[], concerns[], suggestedOpener, bestGripStory, sources[] }
```

**Tasks:**
- [ ] Add "Hiring Manager" input field to company detail (name + LinkedIn URL)
- [ ] Add "Copy HM research prompt" button
- [ ] Create API route to read HM research JSON
- [ ] Show HM profile + concerns in company research panel
- [ ] Auto-suggest cold email opener based on HM research
**Validation:** Run for one real hiring manager. Does the suggested opener feel specific enough that the HM would know you did homework?

---

### MILESTONE 3: Proof-of-Work Enhancement

#### M3.1 — Fix growth equation decoder
**Problem:** Current parsing only extracts top metric and suggested lever; misses the 3-4 level decomposition that's core to the curriculum.
**Tasks:**
- [ ] Rewrite growth equation AI prompt to return JSON with nested levels
- [ ] Build visual tree component showing metric → sub-metrics → levers
- [ ] Highlight the suggested lever in the tree
- [ ] Add industry benchmarks where available (from `INDUSTRY_METRICS` in frameworks.ts)
**Validation:** Decode GoKwik's growth equation. Should show: Revenue → Merchants × ARPM → Checkout conversion × Avg. basket → ... with 3-4 levels.

#### M3.2 — Fix user testing log
**Problem:** Current log only stores counts (quote count, delight count) — not the actual content.
**Tasks:**
- [ ] Expand test entry to store: actual quotes (string[]), delight moments (string[]), confusion points (string[]), time saved metric
- [ ] Add inline editing for each test session
- [ ] Show aggregated insights across all test sessions
- [ ] Feed test quotes into pitch email generation
**Validation:** Log 3 test sessions with real quotes. Pitch email should reference specific user feedback.

#### M3.3 — Connect proof to outreach
**Problem:** Proof-of-work page and outreach page are completely disconnected.
**Tasks:**
- [ ] When composing cold email for a company, show proof-of-work status and pitch email
- [ ] Add "attach proof" option in email composer (link to demo/prototype)
- [ ] Show proof sprint progress on company detail card in Market page
**Validation:** For GoKwik, the outreach page should show "POW: Merchant ROI Decoder — 7/10 days complete" and offer to include the pitch in the email.

---

### MILESTONE 4: Resume Export & Narrative Polish

#### M4.1 — Company-specific resume document generation
**Problem:** Resume page generates narrative text but doesn't produce an actual resume document.
**Tasks:**
- [ ] Add "Export Resume" button that generates a `.docx` file (use docx skill)
- [ ] Template: clean, professional, uses narrative as summary, GRIP stories as experience bullets
- [ ] Include: trust factors as "why hire me" section, bridge statements for gaps
- [ ] Company-specific customization: use their language, mirror their job posting keywords

**Cowork prompt (for generating a tailored resume when user doesn't want to use the webapp export):**
```
Generate a tailored resume for my application to [COMPANY NAME] for the [ROLE TITLE] position.

Read these files:
- profile/NiratPatel_BaseResume.md (base resume)
- profile/NiratPatel_Superpowers.md (GRIP stories and superpower)
- job-search/outreach/[company]/research-dossier.json (if exists, for company context)

Tailoring instructions:
1. Use the company's own language from their job posting and research dossier
2. Lead with the GRIP story that best maps to their #1 problem
3. Rewrite experience bullets to emphasize problems similar to theirs
4. Add a 2-sentence "Why [COMPANY]" header that references something specific about their challenges
5. Include bridge statements for any gaps (context translation, brand bias, etc.)
6. Keep to 1 page. No fluff. Every line should answer "why should [COMPANY] hire this person?"

Save to: job-search/outreach/[company-lowercase]/resume-[company].md
```

**Validation:** Generate resume for GoKwik and Zenoti. They should feel noticeably different — different lead story, different language, different emphasis.

#### M4.2 — Gap analysis improvement
**Tasks:**
- [ ] Rewrite gap analysis to return structured JSON (not regex-parsed text)
- [ ] For each gap type, show: the gap, why it matters to this company, your bridge statement, what you could do to close it
- [ ] Add "gap closing actions" as trackable tasks
**Validation:** Resume page for Zenoti should clearly show "Wellness/salon domain gap → bridge: your B2B multi-location enterprise work at Cymax is structurally identical."

---

### MILESTONE 5: Outreach & Email Polish

#### M5.1 — Recipient targeting
**Tasks:**
- [ ] Add "contacts" field to company (name, role, LinkedIn, email, channel)
- [ ] When composing email, select from saved contacts
- [ ] Track email status per contact (not just per company)
**Validation:** For GoKwik, save 2 contacts (Head of Product, Growth PM). Send different email variants to each. Track separately.

#### M5.2 — Email variant analysis
**Tasks:**
- [ ] Track reply rate per variant label
- [ ] Show "best performing variant" per recipient type
- [ ] Add A/B test view: side-by-side comparison of variants
**Validation:** After sending 5+ emails with 2 variants, see which variant has higher reply rate.

#### M5.3 — Follow-up system
**Tasks:**
- [ ] After marking email "sent", auto-create follow-up reminder (5 days)
- [ ] Show overdue follow-ups on dashboard
- [ ] Add follow-up email template (shorter, reference original)

**Cowork prompt (for generating follow-up emails):**
```
Generate a follow-up cold email for [COMPANY NAME].

Original email was sent on [DATE] to [CONTACT NAME] ([ROLE]) via [CHANNEL].
Original subject: [SUBJECT]
Original body: [BODY]

No response received. Generate a follow-up that:
1. Is shorter than the original (max 3 sentences)
2. References the original without repeating it
3. Adds ONE new piece of value (a new insight, a metric, a relevant news item about their company)
4. Has a dead-easy CTA ("Worth 15 minutes? I'm free Thursday 3-4pm.")
5. Does NOT sound desperate or needy

Return JSON: { "subject": "Re: [original subject]", "body": "..." }
```

---

### MILESTONE 6: Search Sprint Structure

#### M6.1 — Implement real 4-week sprint
**Problem:** Weekly tracker exists in data model but is never populated or used.
**Tasks:**
- [ ] Add "Start Sprint" flow: pick start date, set weekly goals
- [ ] Week 1: Foundation (target mapping, workspace setup, morning routine)
- [ ] Week 2: Velocity (daily application targets, burnout guardrails)
- [ ] Week 3: Iteration (reply rate analysis, positioning adjustment)
- [ ] Week 4: Momentum (continue despite interviews, maintain energy)
- [ ] Weekly review form: what worked, what didn't, one pattern to fix
- [ ] Show current week prominently on dashboard
**Validation:** Start a sprint. After 1 week, the weekly review should show: apps sent, response rate, patterns identified, and next week's adjusted targets.

#### M6.2 — Burnout detection improvement
**Tasks:**
- [ ] Track: days since last application, days skipped, application pacing (trend)
- [ ] Detect: rage-applying (>5 in one day without quality checks), ghosting (0 apps for 3+ days), quality drop (quality checklist scores declining)
- [ ] Show interventions: "Take a day off", "Change location", "Build something fun", "Reach out to accountability partner"
**Validation:** Simulate rage-applying pattern (add 8 apps in one day). App should show warning with specific intervention.

---

### MILESTONE 7: Curriculum Integration

#### M7.1 — In-app curriculum reader
**Problem:** 12 articles exist as files but are not accessible from the webapp.
**Tasks:**
- [ ] New route: `/learn` or `/curriculum`
- [ ] Sidebar navigation for all 12 articles in learning order
- [ ] Markdown renderer for article content
- [ ] "Apply this" CTA at end of each article linking to the relevant phase page
- [ ] Progress tracking (which articles read)
- [ ] Contextual links: from each phase page, link to the relevant curriculum article
**Validation:** User can read "How Hiring Works" in-app and click "Start your audit" at the bottom.

#### M7.2 — Phase-specific curriculum excerpts
**Tasks:**
- [ ] On each phase page, show a collapsible "From the curriculum" section with key frameworks
- [ ] Audit page: show the 3 questions explained with "what clear looks like"
- [ ] Market page: show "5 signal types" research framework
- [ ] Positioning page: show GRIP framework with examples
- [ ] Resume page: show "4 gaps" framework with bridge statement examples
- [ ] Proof page: show growth equation framework with decomposition example
- [ ] Outreach page: show JTBD email structure with START/MIDDLE/CTA examples
- [ ] Search page: show 4-week sprint structure with weekly focus areas

---

### MILESTONE 8: Dashboard Intelligence

#### M8.1 — "What to do next" recommendations
**Tasks:**
- [ ] Analyze completion state across all phases
- [ ] Generate contextual next-action: "You have 3 target companies but no wins. Add your first win to start building positioning."
- [ ] Show urgency: "GoKwik has been in 'researching' status for 5 days. Ready to start proof-of-work?"
- [ ] Suggest daily actions based on current sprint week
**Validation:** Dashboard should show different recommendations based on what's complete.

#### M8.2 — Quality gates
**Problem:** The curriculum has clear quality gates (reply rate <10% = rework positioning) but the app doesn't enforce them.
**Tasks:**
- [ ] Reply rate gate: if <10% after 10 emails, show "rework positioning" warning with link to positioning page
- [ ] Fit matrix gate: if no wins score 2 for a company, warn before generating resume narrative
- [ ] Proof-of-work gate: if sprint not started, warn before composing cold email
- [ ] Audit gate: if last audit >30 days ago, suggest re-audit

---

## External Tool Prompt Library

These prompts are stored in the webapp and shown contextually when the user needs to use an external tool.

### Prompt 1: Run Company Discovery (Cowork)
*Shown on: Market page → Discovery tab → "Run new discovery" button*
```
Run a company discovery scan for my job search.

1. Read my profile from profile/NiratPatel_Superpowers.md, profile/NiratPatel_BaseResume.md, and profile/job-search-context.md
2. Read my existing targets from job-search/targets/TargetCompanies_and_Roles.md
3. Read my problem signatures from job-search/discovery/problem-signatures.json

Then:
a) If my profile has changed since the last signature extraction, re-extract problem signatures and update problem-signatures.json
b) Run 6-8 web searches combining my problem signatures with my geography/seniority/domain preferences. Search for:
   - "[domain] companies India hiring senior product manager 2026"
   - "[specific problem like checkout conversion] platform India Series B+"
   - "India B2B SaaS raised funding 2025 2026 [domain]"
c) For each discovered company NOT in my existing targets:
   - Research: stage, funding, location, domain, team size
   - Score against each problem signature (strong/moderate/weak) with reasoning
   - Assign fit tier (tier1/tier2/tier3)
   - Write: fit rationale, gaps to bridge, suggested role, next action
   - Include source URLs
d) Save results to job-search/discovery/discovery-results.json in the existing format

Exclude companies already in my target list. Focus on companies actively hiring at my level.
```

### Prompt 2: Deep Company Research (Cowork)
*Shown on: Market page → Company card → "Research this company" button*
```
Run deep research on [COMPANY NAME] for my job search.

Context: Read profile/NiratPatel_Superpowers.md and job-search/discovery/problem-signatures.json

Research these 5 signal categories and search the web for each:

1. JOB POSTINGS: Search "[COMPANY] careers" and "[COMPANY] product manager LinkedIn". Extract: open roles at my level, specific language about what they need, tech stack, team structure clues.

2. RECENT HIRES (6 months): Search "[COMPANY] product manager hired 2025 2026". Note: where they came from, their backgrounds, seniority, what patterns emerge. This reveals what they actually value vs. what the JD says.

3. LEADERSHIP SIGNALS: Search for the CEO/CTO/CPO of [COMPANY] on Twitter/X and LinkedIn. Find their recent posts. What are they publicly worried about? Celebrating? Debating?

4. PRODUCT & REVIEW SIGNALS: Search "[COMPANY] reviews" on G2, Capterra, Reddit, app stores. Also search for their product blog, changelog, recent launches. What's working? What's broken? What are users frustrated about?

5. COMPETITIVE CONTEXT: Search "[COMPANY] competitors" and "[COMPANY] vs [competitor]". Who are they fighting? Who just raised money? Who's winning and why?

Then synthesize everything into:
- THE REAL PROBLEM: What is this company actually trying to solve in the next 12 months? (Not what their marketing says — what the signals reveal.) 1-2 paragraphs.
- SUPERPOWER MATCH: Which of my problem signatures match? Score each as strong/moderate/weak with reasoning.
- PROOF-OF-WORK IDEAS: Top 2-3 projects I could build in 5-10 days. For each: what to build, which metric it targets, estimated build time, who to send it to, why it would get their attention.
- COLD EMAIL OPENER: Draft an opening line based on something specific you found (a leadership post, a product complaint, a competitive move). Not generic.
- RED FLAGS: Anything concerning (layoffs, legal issues, stagnant growth, toxic reviews).

Save to: job-search/outreach/[company-name-lowercase]/research-dossier.json with fields:
{ companyName, researchDate, jobPostingSignals[], recentHireSignals[], leadershipSignals[], productSignals[], marketSignals[], competitiveContext, synthesizedProblem, problemSignatureMatches[], proofOfWorkIdeas[{title, description, targetMetric, buildTimeDays, sendTo}], coldEmailOpener, redFlags[], sources[] }
```

### Prompt 3: Hiring Manager Research (Cowork)
*Shown on: Market page → Company card → "Research hiring manager" button*
```
Research this hiring manager for my cold outreach to [COMPANY NAME].

Hiring manager: [NAME]
LinkedIn: [LINKEDIN URL]
Role: [THEIR ROLE]

Read my profile: profile/NiratPatel_Superpowers.md

Research:
1. Their career background: current role duration, previous companies, trajectory pattern
2. Recent public activity: Search Twitter/X for "[NAME]" + relevant keywords. Check LinkedIn for recent posts. Look for talks, podcasts, blog posts.
3. Professional concerns: What themes emerge from their content? What problems are they thinking about?
4. Company context: How does their focus area map to the company's overall challenges?

Synthesize:
- THEIR TOP CONCERN: What is this person most worried about professionally right now? (1-2 sentences, be specific)
- OPENER: Write a genuine cold email opening line that proves I've done homework. Reference something specific they said, wrote, or built. Not flattery — insight.
- BEST STORY TO LEAD WITH: Which of my GRIP stories (from Superpowers.md) would resonate most with their concerns? Why?
- WHAT NOT TO SAY: Any topics to avoid based on their background or company context?

Save to: job-search/outreach/[company-lowercase]/hiring-manager-[firstname-lowercase].json
{ name, role, company, linkedinUrl, careerBackground, recentActivity[], publishedContent[], topConcerns[], suggestedOpener, bestGripStory, avoidTopics[], sources[] }
```

### Prompt 4: Tailored Resume Generation (Cowork or Claude.ai)
*Shown on: Resume page → "Generate full resume" button*
```
Create a tailored 1-page resume for my application to [COMPANY NAME] for the [ROLE TITLE] position.

Read these files:
- profile/NiratPatel_BaseResume.md (my base resume with all experience)
- profile/NiratPatel_Superpowers.md (my GRIP stories and positioning)
- job-search/outreach/[company]/research-dossier.json (company research, if it exists)

Tailoring rules:
1. LANGUAGE: Use [COMPANY]'s own words from their job posting and leadership posts. If they say "merchant success" not "customer success", use their term.
2. LEAD STORY: Start the summary with the GRIP story that maps most closely to their #1 problem. Use the Before → Insight → Action → After structure in 3-4 lines.
3. EXPERIENCE BULLETS: Rewrite each role's bullets to emphasize problems similar to [COMPANY]'s. Lead with metrics. Cut anything that doesn't strengthen the narrative.
4. BRIDGE STATEMENTS: If there's a context gap (e.g., they're B2C and I'm B2B), add a bridge line: "Structural parallel: [their context] shares [specific dynamic] with [my context]."
5. WHY THEM: Add a 2-sentence "Why [COMPANY]" section that references something specific from research (not generic praise).
6. FORMAT: Clean, single-page, no fluff. Every line answers "why should [COMPANY]'s hiring manager say yes?"

Output as Markdown. Save to: job-search/outreach/[company-lowercase]/resume-[company].md
```

### Prompt 5: Proof-of-Work Ideation (Claude.ai or Cowork)
*Shown on: Proof page → "Need ideas?" button*
```
Help me design a proof-of-work project for [COMPANY NAME].

Context:
- My superpower: "I step back, find the reframe others miss, and I have the agency to go deep — data, systems, business case — and deliver it myself."
- Company's real problem: [PASTE FROM RESEARCH DOSSIER OR DESCRIBE]
- Their growth stage: [Series B/C/D/Public]
- My target role: [ROLE TITLE]

I have 7-10 days to build something that demonstrates I can solve their problem.

Requirements:
1. It must be a WORKING THING (not a deck, not a Notion doc, not a blog post). A tool, calculator, analysis, prototype, or teardown with real data.
2. It must target a SPECIFIC METRIC they care about.
3. It must be something I can BUILD MYSELF (I know: Next.js, Python, SQL, Supabase, basic ML).
4. It must be SENDABLE — I need to be able to email a link to the hiring manager with a 1-paragraph explanation.

Give me:
- 3 project ideas ranked by (impact × feasibility in 10 days)
- For each: what to build, what metric it targets, data sources to use, estimated build time, who to send it to
- For the top idea: a day-by-day 10-day sprint plan with milestones at day 5 (MVP), day 7 (user testing), day 10 (send)
- A 3-sentence pitch email for the top idea (problem → what I built → ask)
```

### Prompt 6: Cold Email Generation (Claude.ai)
*Shown on: Outreach page → "Need help writing?" button*
```
Write a cold email to [CONTACT NAME] ([ROLE]) at [COMPANY NAME].

Channel: [Email / LinkedIn DM / Twitter DM]
My positioning: "I step back, find the reframe others miss, and I have the agency to go deep — data, systems, business case — and deliver it myself."

What I know about them: [PASTE HM RESEARCH OR DESCRIBE]
What I know about their company's problem: [PASTE FROM RESEARCH OR DESCRIBE]
My proof-of-work (if built): [LINK AND 1-LINE DESCRIPTION]
My best GRIP story for them: [PASTE RELEVANT GRIP STORY]

Rules:
1. MAX 150 words (for email) or 100 words (for DM)
2. MAX 2 uses of "I" in the entire message
3. Structure: JTBD framework
   - START: Something specific about THEM (not about me). Reference their recent post, their company's problem, or a product insight. Be specific enough that they know this isn't a template.
   - MIDDLE: Show value, don't pitch capability. If I have proof-of-work, lead with that. If not, lead with the most relevant metric from my experience.
   - CTA: Make reply dead easy. Offer specific time slots. "Friday 3pm or 4pm — either work?"
4. NO: "I hope this email finds you well", "I'm reaching out because", "I'd love to connect", "I'm passionate about"
5. Subject line: <8 words, specific, not clickbait

Return JSON:
{
  "subject": "...",
  "body": "...",
  "iCount": [number],
  "wordCount": [number],
  "whyThisWorks": "1-sentence explanation of the angle"
}
```

### Prompt 7: Weekly Sprint Review (Claude.ai)
*Shown on: Search page → Weekly Review tab → "Do my weekly review" button*
```
Help me do my weekly job search review.

This is Week [X] of my 4-week job search sprint.

My numbers this week:
- Applications sent: [N]
- Cold emails sent: [N]
- Responses received: [N]
- Interviews scheduled: [N]
- Reply rate: [X%]

What happened:
[USER DESCRIBES THEIR WEEK — what went well, what was frustrating, any patterns noticed]

Analyze:
1. PACING: Am I on track for week [X]? (Week 1 = foundation, Week 2 = velocity, Week 3 = iteration, Week 4 = momentum)
2. QUALITY: Based on my reply rate, is my positioning working? (<10% = rework, 10-20% = refine, >20% = scale)
3. PATTERNS: What's one pattern I should fix this week? Be specific.
4. ENERGY: Any burnout signals? (rage-applying, skipping mornings, avoiding tracker)
5. NEXT WEEK: What are my top 3 priorities for next week?

Be direct. Don't sugarcoat. If my numbers are bad, tell me what to change.
```

---

## Milestone Dependency Map

```
M0 (Foundation Fixes) ← Must do first, everything else depends on it
├── M1 (Discovery Enhancement) ← Already started
├── M2 (Deep Research) ← Needs M1 for company data
│   └── M3 (Proof-of-Work) ← Needs M2 for research context
│       └── M5 (Outreach) ← Needs M3 for proof links
├── M4 (Resume Export) ← Can run parallel to M2/M3
├── M7 (Curriculum) ← Independent, can run anytime
└── M6 (Search Sprint) ← Needs M5 for outreach tracking
    └── M8 (Dashboard Intelligence) ← Needs everything above for data
```

## Recommended Build Order

1. **M0** — Foundation fixes (1-2 sessions)
2. **M1** — Discovery enhancements (1 session)
3. **M2** — Deep research pipeline (1-2 sessions)
4. **M3** — Proof-of-work fixes (1 session)
5. **M4** — Resume export (1 session)
6. **M5** — Outreach polish (1 session)
7. **M7** — Curriculum integration (1 session)
8. **M6** — Search sprint (1 session)
9. **M8** — Dashboard intelligence (1 session)

Total estimate: ~10-12 working sessions
