import { useEffect, useRef } from "react";
import { Check } from "lucide-react";
import { ACCENTS } from "../lib/theme";

type UserMenuProps = {
  open: boolean;
  accentId: string;
  onAccentChange: (id: string) => void;
  onClose: () => void;
};

export function UserMenu({ open, accentId, onAccentChange, onClose }: UserMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="user-menu" ref={ref} role="menu">
      <div className="user-menu-theme">
        <span className="user-menu-theme-label">Accent colour</span>
        <div className="user-menu-swatches">
          {ACCENTS.map((a) => (
            <button
              key={a.id}
              type="button"
              className={`user-menu-swatch ${accentId === a.id ? "is-active" : ""}`}
              style={{ background: a.accent }}
              onClick={() => onAccentChange(a.id)}
              aria-label={a.name}
              title={a.name}
            >
              {accentId === a.id && <Check size={13} />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
