import { EventEmitter } from 'events';
import { ModelManager } from './modelManager.mjs';
import { LLMProcessor } from './llmProcessor.mjs';
import { searchNews } from './webSearch.mjs';

const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export class NewsAggregator extends EventEmitter {
  constructor() {
    super();
    this.modelManager = new ModelManager();
    this.llmProcessor = null;
    this.cache = { headlines: [], timestamp: 0, genres: [] };

    // Forward model status events
    this.modelManager.on('status', (status) => {
      this.emit('model-status', status);
    });
  }

  getModelStatus() {
    return this.modelManager.getStatus();
  }

  async init() {
    await this.modelManager.init();
    this.llmProcessor = new LLMProcessor(this.modelManager);
    await this.llmProcessor.init();
  }

  async fetchAllNews(genres) {
    if (!genres || genres.length === 0) {
      return [];
    }

    // Check cache
    const genreKey = genres.sort().join(',');
    const now = Date.now();
    if (
      this.cache.headlines.length > 0 &&
      now - this.cache.timestamp < CACHE_TTL &&
      this.cache.genres === genreKey
    ) {
      return this.cache.headlines;
    }

    // Search for each genre in parallel
    const searchPromises = genres.map((genre) => searchNews(genre));
    const results = await Promise.allSettled(searchPromises);

    const allResults = [];
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        allResults.push(...result.value);
      }
    }

    if (allResults.length === 0) {
      return [];
    }

    // Process through LLM
    let headlines;
    const modelStatus = this.modelManager.getStatus();

    if (modelStatus.status === 'ready' && this.llmProcessor) {
      try {
        headlines = await this.llmProcessor.classifyAndSummarize(allResults);
      } catch (err) {
        console.error('LLM processing failed, using raw results:', err.message);
        headlines = allResults.map((r) => ({
          headline: r.title,
          url: r.url,
          genre: r.genre,
        }));
      }
    } else {
      // Model not ready, pass through raw titles
      headlines = allResults.map((r) => ({
        headline: r.title,
        url: r.url,
        genre: r.genre,
      }));
    }

    // Deduplicate by URL
    const seen = new Set();
    const deduped = [];
    for (const h of headlines) {
      if (!seen.has(h.url)) {
        seen.add(h.url);
        deduped.push(h);
      }
    }

    // Update cache
    this.cache = { headlines: deduped, timestamp: now, genres: genreKey };

    return deduped;
  }

  async dispose() {
    if (this.llmProcessor) await this.llmProcessor.dispose();
    await this.modelManager.dispose();
  }
}
