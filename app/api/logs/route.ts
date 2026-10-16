export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const limit = 30;
  const skip = (page - 1) * limit;

  const where = type ? { type } : {};
  const [logs, total] = await Promise.all([
    prisma.log.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
    prisma.log.count({ where }),
  ]);

  return NextResponse.json({ logs, total, page, limit, totalPages: Math.ceil(total / limit) });
}
