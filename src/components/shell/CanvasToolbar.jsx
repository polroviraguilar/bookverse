import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  Crosshair,
  Filter,
  Globe2,
  Layers3,
  Plus,
  RotateCcw,
  SearchX,
} from "lucide-react";
import IconButton from "../ui/IconButton.jsx";

export default function CanvasToolbar({
  onCreate,
  onFit,
  onResetFilters,
  filtersActive,
  filterOpen,
  onToggleFilters,
  canGoBack,
  onGoBack,
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (event) => {
      if (!ref.current?.contains(event.target)) setCreateOpen(false);
    };
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, []);

  return (
    <div className="bv-canvas-toolbar" ref={ref}>
      <div className="bv-menu-anchor">
        <button
          type="button"
          className={`bv-create-button ${createOpen ? "is-active" : ""}`}
          onClick={() => setCreateOpen((value) => !value)}
        >
          <Plus size={18} />
          Crear
        </button>
        {createOpen ? (
          <div className="bv-popover bv-create-menu">
            <button type="button" onClick={() => { setCreateOpen(false); onCreate("universe"); }}>
              <Globe2 size={18} /><span><strong>Univers</strong><small>Contenidor superior</small></span>
            </button>
            <button type="button" onClick={() => { setCreateOpen(false); onCreate("saga"); }}>
              <Layers3 size={18} /><span><strong>Saga</strong><small>Col·lecció ordenada</small></span>
            </button>
            <button type="button" onClick={() => { setCreateOpen(false); onCreate("book"); }}>
              <BookOpen size={18} /><span><strong>Llibre</strong><small>Títol individual</small></span>
            </button>
          </div>
        ) : null}
      </div>

      <span className="bv-toolbar-divider" />
      <IconButton icon={Crosshair} label="Enquadrar nodes" onClick={onFit} />
      <IconButton icon={Filter} label="Filtres" active={filterOpen || filtersActive} onClick={onToggleFilters} />
      {filtersActive ? <IconButton icon={SearchX} label="Netejar filtres" onClick={onResetFilters} /> : null}
      {canGoBack ? (
        <>
          <span className="bv-toolbar-divider" />
          <IconButton icon={RotateCcw} label="Tornar al nivell anterior" onClick={onGoBack} />
        </>
      ) : null}
    </div>
  );
}
