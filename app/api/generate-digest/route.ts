export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const articles = await prisma.article.findMany({
    where: { scored: true, createdAt: { gte: since } },
    orderBy: { score: 'desc' },
    include: { source: { select: { name: true } } },
  });

  if (articles.length === 0) {
    return NextResponse.json({ success: false, message: 'Aucun article scor\u00e9 dans les derni\u00e8res 24h' });
  }

  // Group by category
  const groups: Record<string, typeof articles> = {};
  for (const a of articles) {
    const cat = a.categorie ?? 'tendances';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(a);
  }

  // Top 3 per category
  const digestContent: Record<string, any[]> = {};
  const usedIds = new Set<string>();

  for (const [cat, items] of Object.entries(groups)) {
    const top3 = items.slice(0, 3);
    digestContent[cat] = top3.map((a: any) => ({
      id: a.id,
      title: a.title,
      url: a.url,
      score: a.score,
      source: a.source?.name ?? 'Inconnu',
      description: a.description?.substring(0, 200) ?? '',
    }));
    top3.forEach((a: any) => usedIds.add(a.id));
  }

  // Surprise article — random article not in top 3
  const remaining = articles.filter((a: any) => !usedIds.has(a.id));
  if (remaining.length > 0) {
    const surprise = remaining[Math.floor(Math.random() * remaining.length)];
    if (surprise) {
      await prisma.article.update({ where: { id: surprise.id }, data: { isSurprise: true } });
      digestContent['surprise'] = [{
        id: surprise.id,
        title: surprise.title,
        url: surprise.url,
        score: surprise.score,
        source: (surprise as any).source?.name ?? 'Inconnu',
        description: surprise.description?.substring(0, 200) ?? '',
        categorie: surprise.categorie,
      }];
    }
  }

  const totalArticles = Object.values(digestContent).reduce((sum: number, arr: any[]) => sum + (arr?.length ?? 0), 0);

  const digest = await prisma.digest.create({
    data: {
      date: new Date(),
      content: digestContent,
      articleCount: totalArticles,
    },
  });

  await prisma.log.create({
    data: {
      type: 'digest',
      message: `Digest g\u00e9n\u00e9r\u00e9 avec ${totalArticles} articles`,
      metadata: { digestId: digest.id, articleCount: totalArticles },
    },
  });

  return NextResponse.json({ success: true, digestId: digest.id, articleCount: totalArticles });
}
