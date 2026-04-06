import { NextRequest, NextResponse } from 'next/server';

// Stub for future Indeed API integration
export async function POST(request: NextRequest) {
  const { company, role, location } = await request.json();

  return NextResponse.json({
    message: 'Job search API not yet connected. This is a placeholder for Indeed API integration.',
    query: { company, role, location },
    results: [],
  });
}
