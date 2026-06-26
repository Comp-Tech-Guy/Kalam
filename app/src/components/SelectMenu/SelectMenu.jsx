import { useState, useRef, useEffect, useCallback } from "react";
import "./SelectMenu.css";

function SelectMenu({ value, onChange, options, placeholder }) {
  const [open, setOpen] = useState(false);
  const [exiting, setExiting] = useState(false);
  const ref = useRef(null);
  const exitTimer = useRef(null);

  const selected = options.find((o) => o === value);

  const close = useCallback(() => {
    setExiting(true);
    exitTimer.current = setTimeout(() => {
      setOpen(false);
      setExiting(false);
    }, 120);
  }, []);

  const toggle = useCallback(() => {
    if (open || exiting) {
      close();
    } else {
      setOpen(true);
    }
  }, [open, exiting, close]);

  const handleSelect = useCallback((option) => {
    onChange({ target: { value: option } });
    close();
  }, [onChange, close]);

  useEffect(() => {
    if (!open || exiting) return;
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        close();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, exiting, close]);

  useEffect(() => {
    return () => clearTimeout(exitTimer.current);
  }, []);

  return (
    <div className="custom-select" ref={ref}>
      <button
        type="button"
        className={`custom-select-trigger${open ? " custom-select-trigger--open" : ""}`}
        onClick={toggle}
      >
        <span className={value ? "" : "custom-select-placeholder"}>
          {selected || placeholder || "Select..."}
        </span>
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className={`custom-select-arrow${open ? " custom-select-arrow--open" : ""}`}>
          <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {(open || exiting) && (
        <div className={`custom-select-menu${exiting ? " custom-select-menu--exit" : ""}`}>
          {options.length === 0 ? (
            <div className="custom-select-empty">No layouts found</div>
          ) : (
            options.map((option) => (
              <button
                key={option}
                type="button"
                className={`custom-select-option${option === value ? " custom-select-option--selected" : ""}`}
                onClick={() => handleSelect(option)}
              >
                {option}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default SelectMenu;
