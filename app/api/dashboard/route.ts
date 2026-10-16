export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const now = new Date();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // KPIs
  const [totalArticles, todayArticles, totalSources, activeSources, avgScore, todayErrors, digestCount] =
    await Promise.all([
      prisma.article.count(),
      prisma.article.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.source.count(),
      prisma.source.count({ where: { active: true } }),
      prisma.article.aggregate({ _avg: { score: true }, where: { scored: true } }),
      prisma.log.count({ where: { type: 'error', createdAt: { gte: todayStart } } }),
      prisma.digest.count(),
    ]);

  // Articles by category
  const byCat = await prisma.article.groupBy({
    by: ['categorie'],
    _count: { id: true },
    where: { scored: true },
  });

  // Recent top articles
  const topArticles = await prisma.article.findMany({
    where: { scored: true, score: { gte: 7 } },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: { source: { select: { name: true } } },
  });

  // Articles per day (last 7 days)
  const articlesPerDay: any[] = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);
    const count = await prisma.article.count({ where: { createdAt: { gte: dayStart, lte: dayEnd } } });
    articlesPerDay.push({
      date: dayStart.toISOString().split('T')[0],
      articles: count,
    });
  }

  return NextResponse.json({
    data_as_of: now.toISOString(),
    data: {
      kpis: [
        { metric: 'articles_total', label: 'Articles collect\u00e9s', value: totalArticles, format: 'integer', delta: todayArticles, delta_label: "aujourd'hui", good_when: 'up' },
        { metric: 'sources_actives', label: 'Sources actives', value: activeSources, format: 'integer', delta: totalSources - activeSources, delta_label: 'inactives', good_when: 'up' },
        { metric: 'score_moyen', label: 'Score moyen', value: Number((avgScore?._avg?.score ?? 0).toFixed(1)), format: 'number', delta: 0, delta_label: '', good_when: 'up' },
        { metric: 'erreurs', label: 'Erreurs du jour', value: todayErrors, format: 'integer', delta: 0, delta_label: '', good_when: 'down' },
      ],
      by_category: (byCat ?? []).map((c: any) => ({
        categorie: c.categorie ?? 'Non class\u00e9',
        count: c._count?.id ?? 0,
      })),
      articles_trend: articlesPerDay,
      top_articles: (topArticles ?? []).map((a: any) => ({
        title: a.title,
        score: a.score ?? 0,
        categorie: a.categorie ?? '',
        source: a.source?.name ?? '',
        url: a.url,
        date: a.createdAt?.toISOString?.()?.split?.('T')?.[0] ?? '',
      })),
    },
  });
}
