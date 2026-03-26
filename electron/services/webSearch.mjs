import DDG from 'duck-duck-scrape';

const GENRE_QUERIES = {
  Politics: 'politics news today',
  Business: 'stock market business finance news today',
  Technology: 'technology news today',
  Science: 'science discovery news today',
  Sports: 'sports news today',
  Entertainment: 'entertainment celebrity news today',
  Crime: 'crime criminal justice news today',
  Health: 'health medical news today',
  World: 'world international news today',
  Environment: 'environment climate news today',
};

export async function searchNews(genre) {
  const query = GENRE_QUERIES[genre] || `${genre} news today`;

  try {
    const results = await DDG.searchNews(query, {
      safeSearch: DDG.SafeSearchType.MODERATE,
    });

    if (!results || !results.results) return [];

    return results.results.slice(0, 8).map((r) => ({
      title: r.title || '',
      url: r.url || '',
      snippet: r.excerpt || r.body || '',
      source: r.source || '',
      date: r.date ? new Date(r.date * 1000).toISOString() : '',
      genre,
    }));
  } catch (err) {
    console.error(`Web search failed for genre "${genre}":`, err.message);
    return [];
  }
}
