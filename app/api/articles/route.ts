export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categorie = searchParams.get('categorie');
  const sourceId = searchParams.get('source');
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '30', 10)));

  const where: any = { scored: true };
  if (categorie) where.categorie = categorie;
  if (sourceId) where.sourceId = sourceId;

  const [articles, total, sources] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: [{ score: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
      include: { source: { select: { id: true, name: true, categorie: true } } },
    }),
    prisma.article.count({ where }),
    prisma.source.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
  ]);

  return NextResponse.json({
    articles: articles.map((a) => ({
      id: a.id,
      title: a.title,
      url: a.url,
      description: a.description?.replace(/<[^>]*>/g, '').substring(0, 220) ?? '',
      score: a.score,
      categorie: a.categorie,
      publishedAt: a.publishedAt,
      isSurprise: a.isSurprise,
      source: a.source?.name ?? 'Inconnue',
      sourceId: a.source?.id ?? null,
    })),
    sources,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
