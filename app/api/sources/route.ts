export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const sources = await prisma.source.findMany({ orderBy: { createdAt: 'asc' } });
  return NextResponse.json({ sources });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, url, categorie } = body ?? {};
    if (!name || !url || !categorie) {
      return NextResponse.json({ error: 'Nom, URL et cat\u00e9gorie requis' }, { status: 400 });
    }
    const source = await prisma.source.create({ data: { name, url, categorie } });
    return NextResponse.json({ source });
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return NextResponse.json({ error: 'Cette URL existe d\u00e9j\u00e0' }, { status: 409 });
    }
    return NextResponse.json({ error: err?.message ?? 'Erreur serveur' }, { status: 500 });
  }
}
