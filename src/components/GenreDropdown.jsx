import React, { useState, useRef, useEffect } from 'react';
import { GENRES, getGenreColor } from '../utils/genreColors';

export default function GenreDropdown({ enabledGenres, onChange }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleGenre = (genre) => {
    const next = enabledGenres.includes(genre)
      ? enabledGenres.filter((g) => g !== genre)
      : [...enabledGenres, genre];
    // Don't allow deselecting all
    if (next.length > 0) onChange(next);
  };

  const activeCount = enabledGenres.length;

  return (
    <div className="genre-controls" ref={wrapperRef}>
      <button className="genre-btn" onClick={() => setOpen(!open)}>
        <span>☰</span>
        <span className="label">
          {activeCount === GENRES.length ? 'All' : activeCount}
        </span>
      </button>

      {open && (
        <div className="genre-dropdown">
          {GENRES.map((genre) => {
            const checked = enabledGenres.includes(genre);
            const color = getGenreColor(genre);
            return (
              <div
                key={genre}
                className="genre-dropdown-item"
                onClick={() => toggleGenre(genre)}
              >
                <div
                  className={`genre-checkbox ${checked ? 'checked' : ''}`}
                  style={checked ? { background: color } : {}}
                />
                <span
                  className="genre-color-dot"
                  style={{ background: color }}
                />
                <span className="genre-dropdown-label">{genre}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
