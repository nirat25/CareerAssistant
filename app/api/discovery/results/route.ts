import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

const DISCOVERY_DIR = join(process.cwd(), '..', 'job-search', 'discovery');

export async function GET() {
  try {
    const [resultsRaw, signaturesRaw] = await Promise.all([
      readFile(join(DISCOVERY_DIR, 'discovery-results.json'), 'utf-8').catch(() => null),
      readFile(join(DISCOVERY_DIR, 'problem-signatures.json'), 'utf-8').catch(() => null),
    ]);

    if (!resultsRaw) {
      return NextResponse.json(
        { error: 'No discovery results found. Run a discovery scan from Cowork first.' },
        { status: 404 }
      );
    }

    const results = JSON.parse(resultsRaw);
    const signatures = signaturesRaw ? JSON.parse(signaturesRaw) : null;

    return NextResponse.json({ results, signatures });
  } catch (error) {
    console.error('Discovery results error:', error);
    return NextResponse.json(
      { error: 'Failed to read discovery results.' },
      { status: 500 }
    );
  }
}
