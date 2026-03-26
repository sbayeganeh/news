import { LlamaChatSession } from 'node-llama-cpp';

export class LLMProcessor {
  constructor(modelManager) {
    this.modelManager = modelManager;
    this.context = null;
  }

  async init() {
    this.context = await this.modelManager.createContext();
  }

  async classifyAndSummarize(searchResults) {
    if (!this.context) {
      throw new Error('LLM context not initialized');
    }

    if (!searchResults || searchResults.length === 0) {
      return [];
    }

    const session = new LlamaChatSession({
      contextSequence: this.context.getSequence(),
      systemPrompt:
        'You are a news headline editor. Given raw search results, output a JSON array of the most newsworthy items. Each item must have: "headline" (concise, max 15 words), "url" (original URL), "genre" (one of: Politics, Business, Technology, Science, Sports, Entertainment, Crime, Health, World, Environment). Only output valid JSON, no extra text.',
    });

    // Build a compact input from search results
    const input = searchResults
      .map(
        (r, i) =>
          `[${i + 1}] Genre: ${r.genre} | Title: ${r.title} | URL: ${r.url} | Snippet: ${r.snippet}`
      )
      .join('\n');

    const prompt = `Here are ${searchResults.length} raw news search results. Pick the top newsworthy items (up to ${Math.min(searchResults.length, 20)}), write a concise headline for each (max 15 words), confirm or correct the genre, and return as a JSON array:\n\n${input}\n\nRespond ONLY with a valid JSON array of objects with keys "headline", "url", "genre".`;

    try {
      const response = await session.prompt(prompt, {
        maxTokens: 2048,
        temperature: 0.3,
      });

      session.dispose();

      // Extract JSON from response (handle markdown code blocks)
      let jsonStr = response.trim();
      const jsonMatch = jsonStr.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }

      const parsed = JSON.parse(jsonStr);

      if (!Array.isArray(parsed)) return [];

      // Validate and sanitize each item
      return parsed
        .filter((item) => item.headline && item.url && item.genre)
        .map((item) => ({
          headline: String(item.headline).slice(0, 200),
          url: String(item.url),
          genre: String(item.genre),
        }));
    } catch (err) {
      console.error('LLM processing failed:', err.message);
      // Fallback: return raw titles without LLM processing
      return searchResults.map((r) => ({
        headline: r.title.length > 100 ? r.title.slice(0, 97) + '...' : r.title,
        url: r.url,
        genre: r.genre,
      }));
    }
  }

  async dispose() {
    if (this.context) {
      await this.context.dispose();
      this.context = null;
    }
  }
}
