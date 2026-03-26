import React, { useState, useEffect, useCallback, useRef } from 'react';
import Marquee from './components/Marquee';
import GenreDropdown from './components/GenreDropdown';
import { GENRES } from './utils/genreColors';

const DEFAULT_REFRESH = 600000; // 10 min

export default function App() {
  const [headlines, setHeadlines] = useState([]);
  const [enabledGenres, setEnabledGenres] = useState(GENRES);
  const [modelStatus, setModelStatus] = useState({
    status: 'initializing',
    progress: 0,
    message: 'Starting...',
  });
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

  // Listen to model status updates from main process
  useEffect(() => {
    if (!window.electronAPI) return;
    const cleanup = window.electronAPI.onModelStatus((status) => {
      setModelStatus(status);
    });
    // Also poll once
    window.electronAPI.getModelStatus().then(setModelStatus);
    return cleanup;
  }, []);

  // Fetch news
  const fetchNews = useCallback(async () => {
    if (!window.electronAPI) return;
    setLoading(true);
    setError(null);
    try {
      const result = await window.electronAPI.getNews(enabledGenres);
      if (result.error) {
        setError(result.error);
      } else if (result.headlines) {
        setHeadlines(result.headlines);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [enabledGenres]);

  // Auto-fetch when model becomes ready or genres change
  useEffect(() => {
    if (modelStatus.status === 'ready') {
      fetchNews();
    }
  }, [modelStatus.status, enabledGenres, fetchNews]);

  // Refresh interval
  useEffect(() => {
    if (modelStatus.status !== 'ready') return;
    refreshTimer.current = setInterval(fetchNews, DEFAULT_REFRESH);
    return () => clearInterval(refreshTimer.current);
  }, [modelStatus.status, fetchNews]);

  // Listen for force-refresh from tray
  useEffect(() => {
    if (!window.electronAPI) return;
    return window.electronAPI.onForceRefresh(() => {
      fetchNews();
    });
  }, [fetchNews]);

  // Save genres when changed
  const handleGenresChange = (genres) => {
    setEnabledGenres(genres);
    if (window.electronAPI) {
      window.electronAPI.saveSettings({ enabledGenres: genres });
    }
  };

  // Filter headlines by enabled genres
  const filtered = headlines.filter((h) => enabledGenres.includes(h.genre));

  // Render status area
  const renderStatus = () => {
    if (modelStatus.status === 'downloading') {
      return (
        <div className="status-message">
          <div className="spinner" />
          <span>Downloading AI model... {modelStatus.progress}%</span>
          <div className="progress-bar-container">
            <div
              className="progress-bar-fill"
              style={{ width: `${modelStatus.progress}%` }}
            />
          </div>
        </div>
      );
    }
    if (modelStatus.status === 'loading' || modelStatus.status === 'initializing') {
      return (
        <div className="status-message">
          <div className="spinner" />
          <span>{modelStatus.message || 'Loading AI model...'}</span>
        </div>
      );
    }
    if (modelStatus.status === 'error') {
      return (
        <div className="status-message error-message">
          ⚠ {modelStatus.message || 'Failed to load AI model'}
        </div>
      );
    }
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
    if (filtered.length === 0 && modelStatus.status === 'ready') {
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
    </div>
  );
}
