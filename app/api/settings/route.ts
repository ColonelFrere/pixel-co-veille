export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const groqConfigured = !!(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'placeholder');
  const geminiConfigured = !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'placeholder');

  const lastLog = await prisma.log.findFirst({ orderBy: { createdAt: 'desc' } });
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const articleCount = await prisma.article.count({ where: { createdAt: { gte: todayStart } } });
  const errorCount = await prisma.log.count({ where: { type: 'error', createdAt: { gte: todayStart } } });

  return NextResponse.json({
    groqConfigured,
    geminiConfigured,
    lastRun: lastLog?.createdAt ?? null,
    lastRunType: lastLog?.type ?? null,
    todayArticles: articleCount,
    todayErrors: errorCount,
  });
}
