import { useEffect, useRef, useState } from "react";
import {
  Plus,
  Globe,
  Library,
  Book,
  Home
} from "lucide-react";

export default function CanvasFAB({ icon, items, anchorPos, onClick }) {
  const ref = useRef(null);

  const IconMain = icon ?? Plus;

  // Estat lògic
  const [open, setOpen] = useState(false);

  // Estat visual (clau per animar sortida)
  const [renderMenu, setRenderMenu] = useState(false);
  const [closing, setClosing] = useState(false);

  const [hover, setHover] = useState(false);

  // -----------------------------
  // TANCAR amb animació
  // -----------------------------
  const triggerClose = () => {
    if (!renderMenu || closing) return;

    setClosing(true);
    setOpen(false);

    setTimeout(() => {
      setRenderMenu(false);
      setClosing(false);
    }, 260); // una mica > 240ms (durada animació)
  };

  // -----------------------------
  // Click fora
  // -----------------------------
  useEffect(() => {
    const onDown = (e) => {
      if (!ref.current) return;
      if (ref.current.contains(e.target)) return;
      triggerClose();
    };

    window.addEventListener("pointerdown", onDown, { capture: true });
    return () =>
      window.removeEventListener("pointerdown", onDown, { capture: true });
  }, [renderMenu, closing]);

  // -----------------------------
  // Posició sota el MiniMap
  // -----------------------------
  const miniSize = 180;
  const miniScaleIdle = 0.72;
  const top = (anchorPos?.y ?? 20) + miniSize * miniScaleIdle + 14;
  const left = (anchorPos?.x ?? 20) + 8;

  // -----------------------------
  // RENDER
  // -----------------------------
  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        top,
        left,
        zIndex: 10000,
        userSelect: "none",
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* KEYFRAMES */}
      <style>
        {`
        @keyframes fabItemIn {
          from {
            opacity: 0;
            transform: translateX(-6px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fabItemOut {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(-6px);
          }
        }
        `}
      </style>

      {/* BOTÓ FAB */}
      <button
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();

          // ⭐ SI HI HA onClick → acció directa (sense menú)
          if (onClick) {
            onClick();
            return;
          }

          // ⬇️ comportament normal amb menú
          if (!open) {
            setRenderMenu(true);
            setOpen(true);
            setClosing(false);
          } else {
            triggerClose();
          }
        }}
        style={{
          width: hover ? 46 : 34,
          height: hover ? 46 : 34,
          borderRadius: 999,
          border: "1px solid rgba(226,232,240,0.55)",
          background: hover
            ? "rgba(56,189,248,0.18)"
            : "rgba(15,23,42,0.65)",
          backdropFilter: "blur(8px)",
          color: "white",
          cursor: "pointer",
          boxShadow: hover
            ? "0 10px 24px rgba(0,0,0,0.35)"
            : "0 6px 14px rgba(0,0,0,0.25)",
          transition: "all 180ms ease",
          display: "grid",
          placeItems: "center",
          padding: 0,
        }}
      >

        <IconMain
          size={20}
          style={{
            transform: `rotate(${open ? 225 : hover ? 180 : 0}deg)`,
            transition: "transform 320ms cubic-bezier(.2,.8,.2,1)",
          }}
        />
      </button>

      {/* MENÚ */}
      {renderMenu && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 54,
            minWidth: 170,
            padding: 8,
            borderRadius: 12,
            border: "1px solid rgba(226,232,240,0.18)",
            background: "rgba(15,23,42,0.92)",
            backdropFilter: "blur(10px)",
            boxShadow: "0 16px 40px rgba(0,0,0,0.45)",
            opacity: closing ? 0 : 1,
            transform: closing
              ? "translateX(-6px) scale(0.96)"
              : "translateX(0) scale(1)",
            transition: "opacity 200ms ease, transform 220ms cubic-bezier(.2,.8,.2,1)",
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {items?.map((item, i) => (
          <MenuItem
            key={i}
            icon={item.icon}
            label={item.label}
            index={i}
            closing={closing}
            onClick={() => {
              item.action();
              triggerClose();
            }}
          />
        ))}
        </div>
      )}
    </div>
  );
}

// --------------------------------------------------
// ITEM DEL MENÚ (amb stagger + invers)
// --------------------------------------------------
function MenuItem({ icon: Icon, label, onClick, index, closing }) {
  return (
    <button
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        borderRadius: 10,
        border: "none",
        background: "transparent",
        color: "rgba(226,232,240,0.95)",
        cursor: "pointer",
        fontSize: 14,
        opacity: 0,
        transform: "translateX(-6px)",
        animation: `${
          closing ? "fabItemOut" : "fabItemIn"
        } 240ms ease forwards`,
        animationDelay: closing
          ? `${(2 - index) * 40}ms`
          : `${index * 40}ms`,
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.background = "rgba(56,189,248,0.14)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.background = "transparent")
      }
    >
      {Icon && <Icon size={16} color="#38bdf8" />}
      <span>{label}</span>
    </button>
  );
}


