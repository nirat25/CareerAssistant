# Career Assistant

AI-powered career development tool for tech professionals in India's startup ecosystem. Walks you through a structured 7-phase job search process: self-assessment, market research, positioning, resume building, proof of work, cold outreach, and a 4-week job search sprint.

## Quick Start

```bash
# Install dependencies
npm install

# Set up your Claude API key
cp .env.example .env.local
# Edit .env.local and add your ANTHROPIC_API_KEY

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Features

### 7 Phases
1. **Career Audit** - Timed 3-minute self-assessment with AI analysis
2. **Market Research** - Track target companies, people/product/market signals
3. **Positioning Engine** - Win collection, fit matrix, GRIP narratives, elevator pitches
4. **Resume Builder** - Company-specific narratives with gap analysis and bridge statements
5. **Proof of Work** - 10-day sprint tracker with growth equation builder
6. **Cold Outreach** - JTBD email composer with "I" counter and reply rate tracking
7. **Job Search** - 4-week structured sprint with burnout detection

### AI-Powered
- Claude API generates positioning statements, resume narratives, cold emails, and more
- All AI features work through a single `/api/ai/generate` endpoint

### Data
- All data stored in localStorage (no account needed)
- Export everything as Markdown
- Architected for future Supabase migration

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Anthropic Claude API

## Environment Variables

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key from [console.anthropic.com](https://console.anthropic.com) |

## Deploy to Vercel

1. Push this repo to GitHub
2. Import in Vercel
3. Add `ANTHROPIC_API_KEY` environment variable
4. Deploy
