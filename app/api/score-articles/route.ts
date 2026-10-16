export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { scoreArticle } from '@/lib/scoring';

export async function POST() {
  const profile = await prisma.profile.findFirst();
  const stack = (Array.isArray(profile?.stack) ? profile.stack : []) as string[];
  const priorities = (Array.isArray(profile?.priorities) ? profile.priorities : []) as string[];

  const unscored = await prisma.article.findMany({
    where: { scored: false },
    take: 50,
    orderBy: { createdAt: 'desc' },
  });

  if (unscored.length === 0) {
    return NextResponse.json({ success: true, scored: 0, message: 'Aucun article \u00e0 scorer' });
  }

  let scoredCount = 0;
  let errors = 0;

  for (const article of unscored) {
    try {
      const { result, engine } = await scoreArticle(
        article.title,
        article.description ?? '',
        stack,
        priorities
      );
      if (engine === 'default') {
        // Aucune IA n'a donné de réponse valide : on ne met pas de fausse note, l'article sera re-noté au prochain passage
        errors++;
        await prisma.log.create({
          data: {
            type: 'error',
            message: `Article non noté (IA indisponible ou réponse invalide) : ${article.title.substring(0, 80)}`,
            metadata: { articleId: article.id },
          },
        });
        continue;
      }
      await prisma.article.update({
        where: { id: article.id },
        data: { score: result.score, categorie: result.categorie, scored: true },
      });
      scoredCount++;
    } catch (err: any) {
      errors++;
      await prisma.log.create({
        data: {
          type: 'error',
          message: `Erreur scoring article ${article.id}: ${err?.message}`,
          metadata: { articleId: article.id, error: err?.message },
        },
      });
    }
  }

  await prisma.log.create({
    data: {
      type: 'score',
      message: `Scoring termin\u00e9: ${scoredCount} articles scor\u00e9s, ${errors} erreurs`,
      metadata: { scored: scoredCount, errors, total: unscored.length },
    },
  });

  return NextResponse.json({ success: true, scored: scoredCount, errors, total: unscored.length });
}
