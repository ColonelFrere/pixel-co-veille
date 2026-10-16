export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const profile = await prisma.profile.findFirst();
  return NextResponse.json({ profile });
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { name, agency, stack, priorities } = body ?? {};
    const existing = await prisma.profile.findFirst();
    if (!existing) {
      const profile = await prisma.profile.create({ data: { name, agency, stack, priorities } });
      return NextResponse.json({ profile });
    }
    const profile = await prisma.profile.update({
      where: { id: existing.id },
      data: { name, agency, stack: stack ?? existing.stack, priorities: priorities ?? existing.priorities },
    });
    return NextResponse.json({ profile });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Erreur' }, { status: 500 });
  }
}
