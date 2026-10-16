export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '10', 10)));
  const skip = (page - 1) * limit;

  const [digests, total] = await Promise.all([
    prisma.digest.findMany({ orderBy: { date: 'desc' }, skip, take: limit }),
    prisma.digest.count(),
  ]);

  return NextResponse.json({ digests, total, page, limit, totalPages: Math.ceil(total / limit) });
}
