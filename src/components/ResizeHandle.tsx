import { useRef } from "react";

type ResizeHandleProps = {
  width: number;
  min: number;
  max: number;
  onChange: (width: number) => void;
  onReset: () => void;
};

/** Drag handle between the text area and the brain. */
export function ResizeHandle({ width, min, max, onChange, onReset }: ResizeHandleProps) {
  const drag = useRef<{ startX: number; startW: number } | null>(null);

  return (
    <div
      className="resize-handle"
      role="separator"
      aria-orientation="vertical"
      aria-label="Drag to resize the text and the brain"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={Math.round(width)}
      tabIndex={0}
      title="Drag to resize · double-click to reset"
      onPointerDown={(e) => {
        e.preventDefault();
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        drag.current = { startX: e.clientX, startW: width };
        document.body.classList.add("is-resizing");
      }}
      onPointerMove={(e) => {
        if (!drag.current) return;
        const next = drag.current.startW + (e.clientX - drag.current.startX);
        onChange(Math.min(max, Math.max(min, next)));
      }}
      onPointerUp={(e) => {
        drag.current = null;
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
        document.body.classList.remove("is-resizing");
      }}
      onDoubleClick={onReset}
      onKeyDown={(e) => {
        const step = e.shiftKey ? 60 : 20;
        if (e.key === "ArrowLeft") onChange(Math.max(min, width - step));
        else if (e.key === "ArrowRight") onChange(Math.min(max, width + step));
        else return;
        e.preventDefault();
      }}
    >
      <span className="resize-grip" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
    </div>
  );
}
