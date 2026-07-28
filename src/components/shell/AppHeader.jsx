import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Download,
  FileJson,
  FileSpreadsheet,
  Network,
  PanelRightClose,
  PanelRightOpen,
  Search,
  Upload,
} from "lucide-react";
import Button from "../ui/Button.jsx";
import IconButton from "../ui/IconButton.jsx";

export default function AppHeader({
  mode,
  onModeChange,
  breadcrumbs,
  onNavigate,
  search,
  onSearchChange,
  sidebarOpen,
  onToggleSidebar,
  onOpenGoodreads,
  onImportJson,
  onExportJson,
}) {
  const [importOpen, setImportOpen] = useState(false);
  const importRef = useRef(null);

  useEffect(() => {
    const close = (event) => {
      if (!importRef.current?.contains(event.target)) setImportOpen(false);
    };
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, []);

  return (
    <header className="bv-header">
      <div className="bv-brand" aria-label="Bookverse">
        <span className="bv-brand__mark"><BookOpen size={21} /></span>
        <div className="bv-brand__copy">
          <strong>Bookverse</strong>
          <span>Literary atlas</span>
        </div>
      </div>

      <nav className="bv-breadcrumbs" aria-label="Navegació">
        {breadcrumbs.map((crumb, index) => (
          <div key={crumb.id} className="bv-breadcrumbs__item">
            {index ? <ChevronRight size={13} aria-hidden="true" /> : null}
            <button type="button" onClick={() => onNavigate(crumb.view)}>
              {crumb.label}
            </button>
          </div>
        ))}
      </nav>

      <div className="bv-header__search">
        <Search size={16} aria-hidden="true" />
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Cerca títols, autors o etiquetes"
          aria-label="Cercar"
        />
        <kbd>⌘ K</kbd>
      </div>

      <div className="bv-view-switch" role="tablist" aria-label="Vista">
        <button
          type="button"
          className={mode === "canvas" ? "is-active" : ""}
          onClick={() => onModeChange("canvas")}
        >
          <Network size={16} />
          Mapa
        </button>
        <button
          type="button"
          className={mode === "timeline" ? "is-active" : ""}
          onClick={() => onModeChange("timeline")}
        >
          <CalendarDays size={16} />
          Atlas temporal
        </button>
      </div>

      <div className="bv-header__actions">
        <div className="bv-menu-anchor" ref={importRef}>
          <Button icon={Upload} onClick={() => setImportOpen((value) => !value)}>
            Importar
            <ChevronDown size={14} />
          </Button>
          {importOpen ? (
            <div className="bv-popover bv-import-menu">
              <button
                type="button"
                onClick={() => {
                  setImportOpen(false);
                  onOpenGoodreads();
                }}
              >
                <span><FileSpreadsheet size={18} /></span>
                <div><strong>Goodreads CSV</strong><small>Importació guiada amb sagues i duplicats</small></div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setImportOpen(false);
                  onImportJson();
                }}
              >
                <span><FileJson size={18} /></span>
                <div><strong>Còpia Bookverse</strong><small>Restaura un fitxer JSON de la biblioteca</small></div>
              </button>
            </div>
          ) : null}
        </div>
        <IconButton icon={Download} label="Exportar còpia JSON" onClick={onExportJson} />
        <IconButton
          icon={sidebarOpen ? PanelRightClose : PanelRightOpen}
          label={sidebarOpen ? "Tancar inspector" : "Obrir inspector"}
          active={sidebarOpen}
          onClick={onToggleSidebar}
        />
      </div>
    </header>
  );
}
