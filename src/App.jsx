import { useEffect, useMemo, useRef, useState } from "react";
import CanvasBoard from "./components/canvas/CanvasBoard.jsx";
import MiniMap from "./components/canvas/MiniMap.jsx";
import GoodreadsImportDialog from "./components/import/GoodreadsImportDialog.jsx";
import AppHeader from "./components/shell/AppHeader.jsx";
import CanvasToolbar from "./components/shell/CanvasToolbar.jsx";
import FilterPanel from "./components/shell/FilterPanel.jsx";
import Inspector from "./components/shell/Inspector.jsx";
import WelcomeCard from "./components/shell/WelcomeCard.jsx";
import ReadingAtlas from "./components/timeline/ReadingAtlas.jsx";
import ConfirmDialog from "./components/ui/ConfirmDialog.jsx";
import ToastStack from "./components/ui/ToastStack.jsx";
import {
  AUTOSAVE_KEY,
  LEGACY_AUTOSAVE_KEY,
  applyNodeUpdate,
  createAutosavePayload,
  createNode,
  deleteNodeCascade,
  enrichLibrary,
  getBreadcrumbs,
  getLibraryStats,
  getParentView,
  getVisibleNodes,
  migratePayload,
  normalizeLibrary,
  updateNodePosition,
} from "./domain/library.js";

const DEFAULT_CAMERA = { scale: 1, position: { x: 0, y: 0 } };
const DEFAULT_VIEW = { mode: "global", universeId: null, sagaId: null };
const DEFAULT_FILTERS = { type: "tots", genre: "tots", status: "tots" };

export default function App() {
  const jsonInputRef = useRef(null);
  const saveTimerRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [nodes, setNodes] = useState([]);
  const [view, setView] = useState(DEFAULT_VIEW);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [mode, setMode] = useState("canvas");
  const [camera, setCamera] = useState(DEFAULT_CAMERA);
  const [centerWorld, setCenterWorld] = useState({ x: 0, y: 0 });
  const [fitSignal, setFitSignal] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [goodreadsOpen, setGoodreadsOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toasts, setToasts] = useState([]);

  const enrichedNodes = useMemo(() => enrichLibrary(nodes), [nodes]);
  const visibleNodes = useMemo(
    () => getVisibleNodes(enrichedNodes, view, search, filters),
    [enrichedNodes, filters, search, view],
  );
  const selectedNode = enrichedNodes.find((node) => node.id === selectedNodeId) || null;
  const stats = useMemo(() => getLibraryStats(enrichedNodes), [enrichedNodes]);
  const breadcrumbs = useMemo(() => getBreadcrumbs(enrichedNodes, view), [enrichedNodes, view]);
  const filtersActive = Object.values(filters).some((value) => value !== "tots");
  const counts = {
    all: enrichedNodes.length,
    universes: enrichedNodes.filter((node) => node.type === "universe").length,
    sagas: enrichedNodes.filter((node) => node.type === "saga").length,
    books: enrichedNodes.filter((node) => node.type === "book").length,
  };

  const notify = (type, title, message = "") => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((current) => [...current, { id, type, title, message }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 5200);
  };

  useEffect(() => {
    let loaded = null;
    for (const key of [AUTOSAVE_KEY, LEGACY_AUTOSAVE_KEY]) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        loaded = migratePayload(JSON.parse(raw));
        if (loaded) break;
      } catch {
        // Ignore invalid local payload and continue with the next source.
      }
    }

    if (loaded) {
      setNodes(loaded.nodes);
      setView(loaded.state.view || DEFAULT_VIEW);
      setSelectedNodeId(loaded.state.selectedNodeId || null);
      setCamera(loaded.state.camera || DEFAULT_CAMERA);
      window.setTimeout(() => setFitSignal((value) => value + 1), 120);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return undefined;
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      const payload = createAutosavePayload(nodes, {
        view,
        selectedNodeId,
        camera,
      });
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(payload));
    }, 500);
    return () => window.clearTimeout(saveTimerRef.current);
  }, [camera, nodes, ready, selectedNodeId, view]);

  useEffect(() => {
    const shortcut = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        document.querySelector(".bv-header__search input")?.focus();
      }
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, []);

  useEffect(() => {
    if (!selectedNodeId) return;
    if (!enrichedNodes.some((node) => node.id === selectedNodeId)) {
      setSelectedNodeId(null);
    }
  }, [enrichedNodes, selectedNodeId]);

  const handleCreate = (type) => {
    const created = createNode(type, centerWorld, view, enrichedNodes);
    setNodes((current) => normalizeLibrary([...current, created]));
    setSelectedNodeId(created.id);
    setSidebarOpen(true);
    notify("success", `${type === "universe" ? "Univers" : type === "saga" ? "Saga" : "Llibre"} creat`, "Ja el pots editar des de l’inspector.");
  };

  const handleNodeChange = (updatedNode) => {
    setNodes((current) => applyNodeUpdate(current, updatedNode));
  };

  const handleMoveNode = (nodeId, position) => {
    setNodes((current) => updateNodePosition(current, nodeId, position));
  };

  const enterNode = (node) => {
    if (node.type === "universe") {
      setView({ mode: "universe", universeId: node.id, sagaId: null });
      setSelectedNodeId(null);
      setFitSignal((value) => value + 1);
    }
    if (node.type === "saga") {
      setView({ mode: "saga", sagaId: node.id, universeId: node.universeId || null });
      setSelectedNodeId(null);
      setFitSignal((value) => value + 1);
    }
  };

  const navigateToNode = (node) => {
    if (node.type === "universe" || node.type === "saga") {
      enterNode(node);
      setMode("canvas");
      return;
    }
    setSelectedNodeId(node.id);
    setSidebarOpen(true);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setNodes((current) => deleteNodeCascade(current, deleteTarget.id));
    setSelectedNodeId(null);
    setView(DEFAULT_VIEW);
    setDeleteTarget(null);
    setFitSignal((value) => value + 1);
    notify("success", "Element eliminat", "Les relacions dependents també s’han actualitzat.");
  };

  const goBack = () => {
    setView(getParentView(enrichedNodes, view));
    setSelectedNodeId(null);
    setFitSignal((value) => value + 1);
  };

  const jumpMiniMap = ({ x, y }) => {
    setCamera((current) => ({
      ...current,
      position: {
        x: window.innerWidth / 2 - x * current.scale,
        y: window.innerHeight / 2 - y * current.scale,
      },
    }));
  };

  const exportJson = () => {
    const payload = createAutosavePayload(nodes, {
      view,
      selectedNodeId,
      camera,
    });
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `bookverse-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    notify("success", "Còpia exportada", "El fitxer JSON ja és a la carpeta de descàrregues.");
  };

  const importJson = async (file) => {
    if (!file) return;
    try {
      const payload = migratePayload(JSON.parse(await file.text()));
      if (!payload) throw new Error("El fitxer no conté una biblioteca compatible.");
      setNodes(payload.nodes);
      setView(payload.state.view || DEFAULT_VIEW);
      setSelectedNodeId(payload.state.selectedNodeId || null);
      setCamera(payload.state.camera || DEFAULT_CAMERA);
      setFitSignal((value) => value + 1);
      notify("success", "Còpia restaurada", `${payload.nodes.length} nodes carregats correctament.`);
    } catch (error) {
      notify("error", "No s’ha pogut importar", error.message);
    }
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSearch("");
  };

  return (
    <div className="bv-app">
      <AppHeader
        mode={mode}
        onModeChange={setMode}
        breadcrumbs={breadcrumbs}
        onNavigate={(nextView) => {
          setView({ ...DEFAULT_VIEW, ...nextView });
          setSelectedNodeId(null);
          setMode("canvas");
          setFitSignal((value) => value + 1);
        }}
        search={search}
        onSearchChange={setSearch}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((value) => !value)}
        onOpenGoodreads={() => setGoodreadsOpen(true)}
        onImportJson={() => jsonInputRef.current?.click()}
        onExportJson={exportJson}
      />

      <main className={`bv-workspace ${sidebarOpen ? "has-inspector" : ""}`}>
        <section className="bv-main-view">
          {mode === "canvas" ? (
            <div className="bv-canvas-shell">
              <CanvasBoard
                nodes={visibleNodes}
                camera={camera}
                onCameraChange={setCamera}
                selectedNodeId={selectedNodeId}
                onSelectNode={setSelectedNodeId}
                onMoveNode={handleMoveNode}
                onEnterNode={enterNode}
                fitSignal={fitSignal}
                onCenterChanged={setCenterWorld}
              />

              {enrichedNodes.length ? (
                <MiniMap nodes={enrichedNodes} camera={camera} onJump={jumpMiniMap} />
              ) : null}

              <CanvasToolbar
                onCreate={handleCreate}
                onFit={() => setFitSignal((value) => value + 1)}
                onResetFilters={resetFilters}
                filtersActive={filtersActive || Boolean(search)}
                filterOpen={filterOpen}
                onToggleFilters={() => setFilterOpen((value) => !value)}
                canGoBack={view.mode !== "global"}
                onGoBack={goBack}
              />

              <FilterPanel
                open={filterOpen}
                filters={filters}
                onChange={setFilters}
                onClose={() => setFilterOpen(false)}
                counts={counts}
              />

              {!enrichedNodes.length ? (
                <WelcomeCard
                  stats={stats}
                  onCreate={handleCreate}
                  onImport={() => setGoodreadsOpen(true)}
                />
              ) : null}

              {enrichedNodes.length && !visibleNodes.length ? (
                <div className="bv-no-results">
                  <strong>Cap node coincideix amb la cerca.</strong>
                  <button type="button" onClick={resetFilters}>Netejar cerca i filtres</button>
                </div>
              ) : null}
            </div>
          ) : (
            <ReadingAtlas
              nodes={enrichedNodes}
              onSelectBook={(book) => {
                setSelectedNodeId(book.id);
                setSidebarOpen(true);
              }}
            />
          )}
        </section>

        <Inspector
          node={selectedNode}
          nodes={enrichedNodes}
          open={sidebarOpen}
          onChange={handleNodeChange}
          onDelete={setDeleteTarget}
          onNavigate={navigateToNode}
        />
      </main>

      <GoodreadsImportDialog
        open={goodreadsOpen}
        nodes={enrichedNodes}
        origin={centerWorld}
        onClose={() => setGoodreadsOpen(false)}
        onImport={(importedNodes) => {
          setNodes(importedNodes);
          setView(DEFAULT_VIEW);
          setSelectedNodeId(null);
          setMode("canvas");
          setFitSignal((value) => value + 1);
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        node={deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />

      <ToastStack
        toasts={toasts}
        onDismiss={(id) => setToasts((current) => current.filter((toast) => toast.id !== id))}
      />

      <input
        ref={jsonInputRef}
        type="file"
        accept=".json,application/json"
        hidden
        onChange={(event) => {
          importJson(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
    </div>
  );
}
