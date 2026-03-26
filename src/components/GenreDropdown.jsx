import React, { useState, useRef, useEffect } from 'react';
import { GENRES, getGenreColor } from '../utils/genreColors';

export default function GenreDropdown({ enabledGenres, onChange }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  // Resize window when dropdown opens/closes
  useEffect(() => {
    if (window.electronAPI) {
      // 60px bar + 6px gap + 420px max dropdown
      window.electronAPI.resizeWindow(open ? 486 : 60);
    }
  }, [open]);

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

  const allSelected = enabledGenres.length === GENRES.length;
  const toggleAll = () => onChange(allSelected ? [GENRES[0]] : [...GENRES]);
  const activeCount = enabledGenres.length;

  return (
    <div className="genre-controls" ref={wrapperRef}>
      <button className={`genre-btn${open ? ' open' : ''}`} onClick={() => setOpen(!open)}>
        <span>☰</span>
        <span className="label">
          {activeCount === GENRES.length ? 'All' : activeCount}
        </span>
        <span className="chevron">▾</span>
      </button>

      {open && (
        <div className="genre-dropdown">
          <div className="genre-dropdown-header" onClick={toggleAll}>
            <div
              className={`genre-checkbox ${allSelected ? 'checked' : ''}`}
              style={allSelected ? { background: '#4CC9F0' } : {}}
            />
            <span className="genre-dropdown-label">
              {allSelected ? 'Deselect All' : 'Select All'}
            </span>
          </div>
          <div className="genre-dropdown-divider" />
          <div className="genre-dropdown-list">
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
        </div>
      )}
    </div>
  );
}
