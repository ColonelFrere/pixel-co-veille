export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { parseFeed } from '@/lib/feed-parser';

export async function POST() {
  const sources = await prisma.source.findMany({ where: { active: true } });
  let totalNew = 0;
  let errors = 0;

  for (const source of sources) {
    try {
      const items = await parseFeed(source.url);
      let newCount = 0;

      for (const item of items) {
        if (!item.url) continue;
        try {
          await prisma.article.create({
            data: {
              sourceId: source.id,
              title: item.title,
              url: item.url,
              description: item.description,
              publishedAt: item.publishedAt,
              categorie: source.categorie,
            },
          });
          newCount++;
        } catch (err: any) {
          // Unique constraint violation = duplicate, skip silently
          if (err?.code === 'P2002') continue;
          console.error(`Erreur insertion article ${item.url}:`, err?.message);
        }
      }

      // Clear error status on success
      if (source.lastError) {
        await prisma.source.update({ where: { id: source.id }, data: { lastError: null } });
      }

      totalNew += newCount;
      await prisma.log.create({
        data: {
          type: 'fetch',
          message: `${source.name}: ${items.length} articles trouv\u00e9s, ${newCount} nouveaux`,
          metadata: { sourceId: source.id, sourceName: source.name, total: items.length, new: newCount },
        },
      });
    } catch (err: any) {
      errors++;
      const errorMsg = err?.message ?? 'Erreur inconnue';
      await prisma.source.update({ where: { id: source.id }, data: { lastError: errorMsg } });
      await prisma.log.create({
        data: {
          type: 'error',
          message: `Erreur collecte ${source.name}: ${errorMsg}`,
          metadata: { sourceId: source.id, sourceName: source.name, error: errorMsg },
        },
      });
    }
  }

  return NextResponse.json({ success: true, sourcesProcessed: sources.length, newArticles: totalNew, errors });
}
