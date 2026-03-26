import https from 'node:https';

const GENRE_QUERIES = {
  Politics: 'politics',
  Business: 'stock market business finance',
  Technology: 'technology',
  Science: 'science discovery',
  Sports: 'sports',
  Entertainment: 'entertainment celebrity',
  Crime: 'crime criminal justice',
  Health: 'health medical',
  World: 'world international',
  Environment: 'environment climate',
  Weather: 'weather severe',
  Automotive: 'automotive cars EV',
  Travel: 'travel tourism',
  Food: 'food culinary restaurant',
  Education: 'education university',
  'Real Estate': 'real estate housing market',
  Space: 'space NASA astronomy',
  'AI & Robotics': 'artificial intelligence robotics',
  Gaming: 'video games gaming',
  Fashion: 'fashion style',
  Crypto: 'cryptocurrency bitcoin blockchain',
  Military: 'military defense',
};

function fetchURL(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchURL(res.headers.location).then(resolve, reject);
      }
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function parseRSSItems(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = (block.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '';
    const link = (block.match(/<link>([\s\S]*?)<\/link>/) || [])[1] || '';
    const source = (block.match(/<source[^>]*>([\s\S]*?)<\/source>/) || [])[1] || '';
    const pubDate = (block.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1] || '';
    // Decode HTML entities
    const clean = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
    items.push({
      title: clean(title),
      url: clean(link),
      source: clean(source),
      date: pubDate,
    });
  }
  return items;
}

export async function searchNews(genre) {
  const query = GENRE_QUERIES[genre] || genre;
  const encoded = encodeURIComponent(query);
  const url = `https://news.google.com/rss/search?q=${encoded}&hl=en&gl=US&ceid=US:en`;

  try {
    const xml = await fetchURL(url);
    const items = parseRSSItems(xml);

    return items.slice(0, 8).map((r) => ({
      title: r.title,
      url: r.url,
      snippet: '',
      source: r.source,
      date: r.date,
      genre,
    }));
  } catch (err) {
    console.error(`Web search failed for genre "${genre}":`, err.message);
    return [];
  }
}
