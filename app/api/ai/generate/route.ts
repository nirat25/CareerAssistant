import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

const SYSTEM_PROMPT = `You are a career coach AI specializing in helping tech professionals in India's startup ecosystem. You help with positioning, resume narratives, cold emails, and job search strategy.

Key frameworks you use:
- GRIP: Gap → Result → Input Levers → Plan
- JTBD: Jobs to Be Done for cold emails
- Positioning: Frame skills as solutions to specific business problems
- Pattern matching: Logos, trajectory, keywords, tenure, metrics

Be direct, specific, and actionable. Avoid generic advice. Reference Indian tech companies (Swiggy, Razorpay, Zomato, CRED, etc.) when relevant.`;

export async function POST(request: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY not configured. Add it to .env.local' },
        { status: 500 }
      );
    }

    const { prompt, context, maxTokens = 1024 } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const messages: Anthropic.MessageParam[] = [];

    if (context) {
      messages.push({ role: 'user', content: `Context about this user:\n${context}` });
      messages.push({ role: 'assistant', content: 'I understand the context. How can I help?' });
    }

    messages.push({ role: 'user', content: prompt });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: maxTokens,
      system: SYSTEM_PROMPT,
      messages,
    });

    const content = response.content
      .filter((block) => block.type === 'text')
      .map((block) => {
        if (block.type === 'text') return block.text;
        return '';
      })
      .join('\n');

    return NextResponse.json({ content });
  } catch (error) {
    console.error('AI generation error:', error);
    return NextResponse.json(
      { error: 'AI generation failed. Check your API key and try again.' },
      { status: 500 }
    );
  }
}
