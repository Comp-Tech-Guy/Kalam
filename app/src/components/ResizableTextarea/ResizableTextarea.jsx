import { useRef, useEffect, useCallback } from "react";
import "./ResizableTextarea.css";

function ResizableTextarea({ value, onChange, rows, placeholder, className }) {
  const wrapperRef = useRef(null);
  const dragging = useRef(false);
  const startY = useRef(0);
  const startH = useRef(0);

  const stopDrag = useCallback(() => {
    dragging.current = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  const onMouseMove = useCallback((e) => {
    if (!dragging.current) return;
    const delta = e.clientY - startY.current;
    const newH = Math.max(80, startH.current + delta);
    if (wrapperRef.current) {
      wrapperRef.current.style.height = `${newH}px`;
    }
  }, []);

  const onMouseUp = useCallback(() => {
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
    stopDrag();
  }, [onMouseMove, stopDrag]);

  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      stopDrag();
    };
  }, [onMouseMove, onMouseUp, stopDrag]);

  const onHandleMouseDown = useCallback((e) => {
    dragging.current = true;
    startY.current = e.clientY;
    startH.current = wrapperRef.current?.offsetHeight || 160;
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    document.body.style.cursor = "ns-resize";
    document.body.style.userSelect = "none";
  }, [onMouseMove, onMouseUp]);

  return (
    <div className="resizable-textarea" ref={wrapperRef}>
      <textarea
        value={value}
        onChange={onChange}
        rows={rows}
        placeholder={placeholder}
        className={className}
      />
      <div className="resizable-textarea-handle" onMouseDown={onHandleMouseDown}>
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
          <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

export default ResizableTextarea;
