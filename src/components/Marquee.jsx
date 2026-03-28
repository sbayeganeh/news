import React, { useRef, useMemo, useCallback, memo } from 'react';
import { getGenreColor } from '../utils/genreColors';

const HeadlineItem = memo(function HeadlineItem({ item, color }) {
  const handleClick = useCallback((e) => {
    e.preventDefault();
    if (window.electronAPI) {
      window.electronAPI.openExternal(item.url);
    }
  }, [item.url]);

  return (
    <a
      className="headline-item"
      href={item.url}
      onClick={handleClick}
      title={`${item.headline} — ${item.genre}`}
      style={{ color }}
    >
      <span className="headline-text">{item.headline}</span>
      <span className="headline-genre-tag" style={{ color }}>{item.genre}</span>
    </a>
  );
});

export default function Marquee({ headlines }) {
  const trackRef = useRef(null);

  // Calculate animation duration based on content length
  const duration = useMemo(() => {
    const baseSpeed = 80; // pixels per second
    const totalChars = headlines.reduce((sum, h) => sum + h.headline.length + 10, 0);
    const estimatedWidth = totalChars * 9;
    const seconds = Math.max(30, estimatedWidth / baseSpeed);
    return `${seconds}s`;
  }, [headlines]);

  // We duplicate the headlines so the scroll loops seamlessly
  const doubledHeadlines = useMemo(
    () => [...headlines, ...headlines],
    [headlines]
  );

  // Pre-compute colors once
  const colors = useMemo(
    () => headlines.map((h) => getGenreColor(h.genre)),
    [headlines]
  );

  if (headlines.length === 0) return null;

  return (
    <div className="marquee-container">
      <div
        className="marquee-track"
        ref={trackRef}
        style={{ '--marquee-duration': duration }}
      >
        {doubledHeadlines.map((item, i) => (
          <HeadlineItem
            key={`${item.url}-${i}`}
            item={item}
            color={colors[i % headlines.length]}
          />
        ))}
      </div>
    </div>
  );
}
