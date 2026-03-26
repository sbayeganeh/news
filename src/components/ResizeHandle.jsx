import React, { useCallback, useRef } from 'react';

export default function ResizeHandle() {
  const dragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const onMouseDown = useCallback((e) => {
    e.preventDefault();
    dragging.current = true;
    startX.current = e.screenX;

    if (window.electronAPI) {
      window.electronAPI.getWindowBounds().then((bounds) => {
        startWidth.current = bounds.width;
      });
    }

    const onMouseMove = (e) => {
      if (!dragging.current) return;
      const delta = e.screenX - startX.current;
      const newWidth = Math.max(300, startWidth.current + delta);
      if (window.electronAPI) {
        window.electronAPI.resizeWindowWidth(newWidth);
      }
    };

    const onMouseUp = () => {
      dragging.current = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, []);

  return (
    <div className="resize-handle" onMouseDown={onMouseDown}>
      <div className="resize-handle-grip" />
    </div>
  );
}
