import React, { useState, useEffect, useCallback, useRef } from 'react';
import Marquee from './components/Marquee';
import GenreDropdown from './components/GenreDropdown';
import ResizeHandle from './components/ResizeHandle';
import DragHandle from './components/DragHandle';
import { GENRES } from './utils/genreColors';

const DEFAULT_REFRESH = 600000; // 10 min

export default function App() {
  const [headlines, setHeadlines] = useState([]);
  const [enabledGenres, setEnabledGenres] = useState(GENRES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const refreshTimer = useRef(null);

  // Load saved settings on mount
  useEffect(() => {
    if (!window.electronAPI) return;
    window.electronAPI.getSettings().then((settings) => {
      if (settings.enabledGenres && settings.enabledGenres.length > 0) {
        setEnabledGenres(settings.enabledGenres);
      }
    });
  }, []);

  const fetchNews = useCallback(async () => {
    if (!window.electronAPI) return;
    setLoading(true);
    setError(null);
    try {
      const result = await window.electronAPI.getNews(enabledGenres);
      if (result.error) {
        setError(result.error);
      } else if (result.headlines) {
        // Fisher-Yates shuffle so order varies on each load
        const shuffled = [...result.headlines];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        setHeadlines(shuffled);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [enabledGenres]);

  // Fetch on mount and when genres change
  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  // Refresh interval
  useEffect(() => {
    refreshTimer.current = setInterval(fetchNews, DEFAULT_REFRESH);
    return () => clearInterval(refreshTimer.current);
  }, [fetchNews]);

  // Listen for force-refresh from tray
  useEffect(() => {
    if (!window.electronAPI) return;
    return window.electronAPI.onForceRefresh(() => fetchNews());
  }, [fetchNews]);

  const handleGenresChange = (genres) => {
    setEnabledGenres(genres);
    if (window.electronAPI) {
      window.electronAPI.saveSettings({ enabledGenres: genres });
    }
  };

  const filtered = headlines.filter((h) => enabledGenres.includes(h.genre));

  const renderStatus = () => {
    if (loading && headlines.length === 0) {
      return (
        <div className="status-message">
          <div className="spinner" />
          <span>Fetching headlines...</span>
        </div>
      );
    }
    if (error && headlines.length === 0) {
      return (
        <div className="status-message error-message">
          ⚠ {error}
        </div>
      );
    }
    if (filtered.length === 0) {
      return (
        <div className="status-message">
          No headlines yet — fetching news...
        </div>
      );
    }
    return null;
  };

  const status = renderStatus();

  return (
    <div className="ticker-wrapper">
      <GenreDropdown enabledGenres={enabledGenres} onChange={handleGenresChange} />
      {status || <Marquee headlines={filtered} />}
      <DragHandle />
      <ResizeHandle />
    </div>
  );
}
