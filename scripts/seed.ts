import { prisma } from '../lib/db';

const sources = [
  { name: 'Hacker News', url: 'https://news.ycombinator.com/rss', categorie: 'tendances' },
  { name: 'web.dev', url: 'https://web.dev/feed.xml', categorie: 'tendances' },
  { name: 'Wordfence', url: 'https://www.wordfence.com/blog/feed/', categorie: 'sécurité' },
  { name: 'CVE Feed', url: 'https://cvefeed.io/rss.xml', categorie: 'sécurité' },
  { name: 'Next.js Releases', url: 'https://github.com/vercel/next.js/releases.atom', categorie: 'versions' },
  { name: 'React Releases', url: 'https://github.com/facebook/react/releases.atom', categorie: 'versions' },
];

async function main() {
  // Seed sources
  for (const s of sources) {
    await prisma.source.upsert({
      where: { url: s.url },
      update: { name: s.name, categorie: s.categorie },
      create: s,
    });
  }
  console.log(`Seeded ${sources.length} sources`);

  // Seed profile
  const existing = await prisma.profile.findFirst();
  if (!existing) {
    await prisma.profile.create({
      data: {
        name: 'Pixel & Co',
        agency: 'Agence web spécialisée WordPress et Next.js',
        stack: ['WordPress', 'Next.js', 'React', 'PHP', 'TypeScript', 'Tailwind CSS'],
        priorities: ['Sécurité WordPress', 'Nouvelles versions Next.js/React', 'Tendances web', 'Performance web'],
      },
    });
    console.log('Seeded profile');
  } else {
    console.log('Profile already exists, skipping');
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
