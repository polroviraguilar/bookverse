import { X } from "lucide-react";
import IconButton from "./IconButton.jsx";

export default function Modal({
  open,
  title,
  eyebrow,
  children,
  footer,
  onClose,
  width = "min(920px, calc(100vw - 32px))",
  className = "",
}) {
  if (!open) return null;

  return (
    <div className="bv-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className={`bv-modal ${className}`.trim()}
        style={{ width }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bv-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="bv-modal__header">
          <div>
            {eyebrow ? <div className="bv-eyebrow">{eyebrow}</div> : null}
            <h2 id="bv-modal-title">{title}</h2>
          </div>
          <IconButton icon={X} label="Tancar" onClick={onClose} />
        </header>
        <div className="bv-modal__content">{children}</div>
        {footer ? <footer className="bv-modal__footer">{footer}</footer> : null}
      </section>
    </div>
  );
}
