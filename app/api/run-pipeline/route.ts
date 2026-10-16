export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const baseUrl = request.headers.get('x-forwarded-proto') && request.headers.get('host')
    ? `${request.headers.get('x-forwarded-proto')}://${request.headers.get('host')}`
    : 'http://localhost:3000';

  const results: any = {};

  // Step 1: Fetch feeds
  try {
    const fetchRes = await fetch(`${baseUrl}/api/fetch-feeds`, { method: 'POST' });
    results.fetch = await fetchRes.json();
  } catch (err: any) {
    results.fetch = { error: err?.message };
  }

  // Step 2: Score articles
  try {
    const scoreRes = await fetch(`${baseUrl}/api/score-articles`, { method: 'POST' });
    results.score = await scoreRes.json();
  } catch (err: any) {
    results.score = { error: err?.message };
  }

  // Step 3: Generate digest
  try {
    const digestRes = await fetch(`${baseUrl}/api/generate-digest`, { method: 'POST' });
    results.digest = await digestRes.json();
  } catch (err: any) {
    results.digest = { error: err?.message };
  }

  return NextResponse.json({ success: true, pipeline: results });
}
