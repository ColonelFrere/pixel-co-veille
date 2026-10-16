import { XMLParser } from 'fast-xml-parser';

export interface FeedItem {
  title: string;
  url: string;
  description: string;
  publishedAt: Date | null;
}

export async function parseFeed(feedUrl: string): Promise<FeedItem[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(feedUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'PixelCoVeille/1.0' },
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
    const parsed = parser.parse(xml);

    // RSS 2.0
    const rssItems = parsed?.rss?.channel?.item;
    if (rssItems) {
      const items = Array.isArray(rssItems) ? rssItems : [rssItems];
      return items.map((item: any) => ({
        title: String(item?.title ?? '').substring(0, 500),
        url: String(item?.link ?? item?.guid ?? ''),
        description: String(item?.description ?? item?.['content:encoded'] ?? '').substring(0, 1000),
        publishedAt: item?.pubDate ? new Date(item.pubDate) : null,
      })).filter((i: FeedItem) => i.url && i.title);
    }

    // Atom
    const atomEntries = parsed?.feed?.entry;
    if (atomEntries) {
      const entries = Array.isArray(atomEntries) ? atomEntries : [atomEntries];
      return entries.map((entry: any) => {
        const link = Array.isArray(entry?.link)
          ? entry.link.find((l: any) => l?.['@_rel'] === 'alternate')?.['@_href'] ?? entry.link[0]?.['@_href']
          : entry?.link?.['@_href'] ?? '';
        return {
          title: String(entry?.title?.['#text'] ?? entry?.title ?? '').substring(0, 500),
          url: String(link),
          description: String(entry?.summary?.['#text'] ?? entry?.summary ?? entry?.content?.['#text'] ?? entry?.content ?? '').substring(0, 1000),
          publishedAt: entry?.updated ? new Date(entry.updated) : (entry?.published ? new Date(entry.published) : null),
        };
      }).filter((i: FeedItem) => i.url && i.title);
    }

    return [];
  } catch (err: any) {
    clearTimeout(timeout);
    throw err;
  }
}
