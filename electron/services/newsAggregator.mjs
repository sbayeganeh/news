import { searchNews } from './webSearch.mjs';

const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const SEARCH_CONCURRENCY = 3;

export class NewsAggregator {
  constructor() {
    this.cache = { headlines: [], timestamp: 0, genres: '' };
  }

  async _searchInBatches(genres) {
    const allResults = [];
    for (let i = 0; i < genres.length; i += SEARCH_CONCURRENCY) {
      const batch = genres.slice(i, i + SEARCH_CONCURRENCY);
      const results = await Promise.allSettled(
        batch.map((genre) => searchNews(genre))
      );
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          allResults.push(...result.value);
        }
      }
    }
    return allResults;
  }

  _dedupe(headlines) {
    const seen = new Set();
    const deduped = [];
    for (const h of headlines) {
      if (!seen.has(h.url)) {
        seen.add(h.url);
        deduped.push(h);
      }
    }
    return deduped;
  }

  _toHeadlines(searchResults) {
    return searchResults.map((r) => ({
      headline: r.title.length > 100 ? r.title.slice(0, 97) + '...' : r.title,
      url: r.url,
      genre: r.genre,
    }));
  }

  async fetchAllNews(genres) {
    if (!genres || genres.length === 0) {
      return [];
    }

    const genreKey = [...genres].sort().join(',');
    const now = Date.now();
    if (
      this.cache.headlines.length > 0 &&
      now - this.cache.timestamp < CACHE_TTL &&
      this.cache.genres === genreKey
    ) {
      return this.cache.headlines;
    }

    const allResults = await this._searchInBatches(genres);
    if (allResults.length === 0) {
      return [];
    }

    const headlines = this._dedupe(this._toHeadlines(allResults));
    this.cache = { headlines, timestamp: now, genres: genreKey };
    return headlines;
  }
}
