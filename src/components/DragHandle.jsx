import React, { useCallback, useRef } from 'react';

export default function DragHandle() {
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const onMouseDown = useCallback((e) => {
    e.preventDefault();
    dragging.current = true;
    lastPos.current = { x: e.screenX, y: e.screenY };

    const onMouseMove = (e) => {
      if (!dragging.current) return;
      const deltaX = e.screenX - lastPos.current.x;
      const deltaY = e.screenY - lastPos.current.y;
      lastPos.current = { x: e.screenX, y: e.screenY };
      if (window.electronAPI) {
        window.electronAPI.moveWindow(deltaX, deltaY);
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
    <div className="drag-handle" onMouseDown={onMouseDown} title="Drag to move">
      <span className="drag-handle-icon">⠿</span>
    </div>
  );
}
