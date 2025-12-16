import { useState, useEffect, useRef } from "react";
import CanvasBoard from "./components/CanvasBoard";
import Sidebar from "./components/Sidebar";
import MiniMap from "./components/MiniMap";
import TimelineView from "./components/TimelineView";
import CanvasFAB from "./components/CanvasFAB";
import ConfirmDeleteModal from "./components/ConfirmDeleteModal";

import {
  Download,
  Upload,
  ChevronLeft,
  ChevronRight,
  CalendarRange,
  Search,
  Filter,
  MoreHorizontal,
  Plus,
  Globe,
  Library,
  Book,
  Home
} from "lucide-react";

const AUTOSAVE_KEY = "story-map-autosave-v1";

// ⭐ Calcula la valoració d'una saga a partir dels llibres
const calculateSagaRatings = (nodes, sagaId) => {
  const books = nodes.filter(
    (n) => n.type === "book" && n.parentSagaId === sagaId && n.rating > 0
  );

  if (books.length === 0) {
    return {
      sagaRatingAvg: 0,
      sagaRatingCount: 0,
      sagaRatingDist: { 0:0, 1:0, 2:0, 3:0, 4:0, 5:0 }
    };
  }

  const dist = { 0:0, 1:0, 2:0, 3:0, 4:0, 5:0 };
  let sum = 0;

  books.forEach((b) => {
    const r = Math.round(b.rating);
    dist[r] += 1;
    sum += b.rating;
  });

  return {
    sagaRatingAvg: Number((sum / books.length).toFixed(2)),
    sagaRatingCount: books.length,
    sagaRatingDist: dist
  };
};

function App() {
  const [currentUniverseId, setCurrentUniverseId] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [viewMode, setViewMode] = useState("global"); // 'global' o 'saga'
  const [currentSagaId, setCurrentSagaId] = useState(null); // id de la saga activa
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [toolbarCollapsed, setToolbarCollapsed] = useState(false);
  const [timelineMode, setTimelineMode] = useState(false);
  const [timelineZoom, setTimelineZoom] = useState(1);  // 1 = normal
  const [timelineRange, setTimelineRange] = useState({
    start: 2010,
    end: 2030
  });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const fileInputRef = useRef(null);

  // Vista del canvas (posició + zoom) → per CanvasBoard + MiniMap
  const [canvasView, setCanvasView] = useState({
    scale: 1,
    position: { x: 0, y: 0 },
  });

  // Snapping options
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [snapToNodes, setSnapToNodes] = useState(true);

  const [transition, setTransition] = useState({
    active: false,
    progress: 0,
    fromNodes: [],
    toNodes: [],
    direction: "enter", // "enter" | "exit"
  });

  const autosaveTimeout = useRef(null);
  const filterPanelRef = useRef(null);

  useEffect(() => {
    // No autosave si no hi ha dades
    if (!nodes || nodes.length === 0) return;

    // Debounce
    if (autosaveTimeout.current) {
      clearTimeout(autosaveTimeout.current);
    }

    autosaveTimeout.current = setTimeout(() => {
      try {
        const payload = getAutosavePayload();
        localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(payload));
        // console.log("💾 Autosave OK");
      } catch (err) {
        console.error("❌ Autosave error", err);
      }
    }, 600); // ⏱️ 600ms és ideal

    return () => clearTimeout(autosaveTimeout.current);
  }, [
    nodes,
    viewMode,
    selectedNodeId,
    currentSagaId,
    currentUniverseId,
    canvasView,
  ]);

  // Posició del minimapa (si més endavant el vols moure)
  const [miniMapPos, setMiniMapPos] = useState({ x: 20, y: 20 });

  const handleExportJSON = () => {
    const data = {
      version: 1,
      meta: {
        exportedAt: new Date().toISOString(),
      },
      state: {
        viewMode,
        selectedNodeId,
      },
      nodes,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "story-map.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (file) => {
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);

        // 🛡️ Validacions mínimes
        if (!data || data.version !== 1) {
          throw new Error("Versió de fitxer no compatible");
        }

        if (!Array.isArray(data.nodes)) {
          throw new Error("Fitxer invàlid (nodes)");
        }

        // 🧼 Reset segur
        setNodes(data.nodes);
        setViewMode(data.state?.viewMode || "global");
        setSelectedNodeId(data.state?.selectedNodeId || null);
      } catch (err) {
        alert("Error important el fitxer JSON:\n" + err.message);
      }
    };

    reader.readAsText(file);
  };

  const handleJumpTo = ({ x, y }) => {
    setCanvasView((prev) => ({
      ...prev,
      position: { x, y },
    }));
  };

  // ------ Progrés automàtic de sagues ------
  const updateSagaProgress = (sagaId) => {
    setNodes((prev) => {
      const saga = prev.find((n) => n.id === sagaId);
      if (!saga) return prev;

      const books = prev.filter((n) => n.parentSagaId === sagaId);

      const totalBooks = books.length;
      const readBooks = books.filter(
        (b) => b.status === "acabada" || b.status === "completat"
      ).length;

      const progressPercent =
        totalBooks > 0 ? Math.round((readBooks / totalBooks) * 100) : 0;

      let newStatus = "no-comencada";
      if (totalBooks > 0) {
        if (readBooks === 0) newStatus = "no-comencada";
        else if (readBooks < totalBooks) newStatus = "en-lectura";
        else newStatus = "acabada";
      }

      // ⭐ AFEGIT AQUÍ
      const ratingStats = calculateSagaRatings(prev, sagaId);

      return prev.map((n) =>
        n.id === sagaId
          ? {
              ...n,
              totalBooks,
              readBooks,
              progressPercent, // ⭐ NOU
              status: newStatus,
              ...ratingStats
            }
          : n
      );
    });
  };


  // 🔄 Carregar des de localStorage al començar
  useEffect(() => {
    const autosaved = localStorage.getItem(AUTOSAVE_KEY);

    if (autosaved) {
      try {
        const data = JSON.parse(autosaved);

        if (data.version === 1 && Array.isArray(data.nodes)) {
          setNodes(data.nodes);
          setViewMode(data.state?.viewMode || "global");
          setSelectedNodeId(data.state?.selectedNodeId || null);
          setCurrentSagaId(data.state?.currentSagaId || null);
          setCurrentUniverseId(data.state?.currentUniverseId || null);
          setCanvasView(data.state?.canvasView || { scale: 1, position: { x: 0, y: 0 } });
          return;
        }
      } catch (e) {
        console.warn("Autosave corrupte, carregant fallback");
      }
    }

    // 🔙 Fallback inicial
    setNodes([
      {
        id: "universe-1",
        type: "universe",
        x: 0,
        y: 0,
        title: "Univers principal",
        notes: "",
        tags: [],
      },
    ]);
  }, []);

  useEffect(() => {
    setNodes((prev) =>
      prev.map((n) =>
        n.isNew ? { ...n, isNew: false } : n
      )
    );
  }, [nodes.length]);

  useEffect(() => {
    if (!filterOpen) return;

    const handlePointerDown = (e) => {
      if (!filterPanelRef.current) return;

      // Si el clic és dins del panell → no tanquem
      if (filterPanelRef.current.contains(e.target)) return;

      setFilterOpen(false);
    };

    window.addEventListener("pointerdown", handlePointerDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [filterOpen]);

  // ✏ Actualitzar un node (quan es modifica a la Sidebar)
  const handleNodeChange = (updatedNode) => {
    setNodes((prev) => {
      const newList = prev.map((n) =>
        n.id === updatedNode.id ? updatedNode : n
      );

      if (updatedNode.type === "book" && updatedNode.parentSagaId) {
        setTimeout(() => updateSagaProgress(updatedNode.parentSagaId), 0);
      }
      if (updatedNode.type === "saga") {
        setTimeout(() => updateSagaProgress(updatedNode.id), 0);
      }
      if (updatedNode.type === "book" && updatedNode.parentSagaId) {
        const saga = nodes.find(n => n.id === updatedNode.parentSagaId);
        updatedNode = {
          ...updatedNode,
          universeId: saga?.universeId || null,
        };
      }

      return newList;
    });
  };

  const handleDeleteNode = (node) => {
    setNodes((prev) => {
      let toDeleteIds = new Set([node.id]);

      // 🔥 ESBORRAT EN CASCADA
      if (node.type === "universe") {
        prev.forEach((n) => {
          if (n.type === "saga" && n.universeId === node.id) {
            toDeleteIds.add(n.id);
            prev.forEach((b) => {
              if (b.parentSagaId === n.id) toDeleteIds.add(b.id);
            });
          }
        });
      }

      if (node.type === "saga") {
        prev.forEach((b) => {
          if (b.parentSagaId === node.id) toDeleteIds.add(b.id);
        });
      }

      return prev.filter((n) => !toDeleteIds.has(n.id));
    });

    // 🧹 NETEJA D’ESTAT GLOBAL
    setSelectedNodeId(null);
    setCurrentSagaId(null);
    setCurrentUniverseId(null);
    setViewMode("global");
    setDeleteTarget(null);
  };

  // ➕ Crear saga o llibre
  const handleCreateNode = (type, position, parentSagaId = null) => {
    const id = `${type}-${Date.now()}`;

    let newNode;

    // ⭐ CONTEXT AUTOMÀTIC
    if (type === "book" && viewMode === "saga" && currentSagaId) {
      parentSagaId = currentSagaId;
    }

    if (type === "saga" && viewMode === "universe" && currentUniverseId) {
      newNode = {
        id,
        type: "saga",
        x: position.x,
        y: position.y,
        title: "Nova Saga",
        universeId: currentUniverseId, // ⭐ CLAU
        author: "",
        genre: "fantasia",
        status: "no-comencada",
        notes: "",
        tags: [],
        cover: null,
        isNew: true,
      };
    }

    else if (type === "book") {
      let resolvedSagaId = parentSagaId;
      let resolvedUniverseId = null;

      // ⭐ CONTEXT DE SAGA
      if (viewMode === "saga" && currentSagaId) {
        resolvedSagaId = currentSagaId;
        const saga = nodes.find(n => n.id === currentSagaId);
        resolvedUniverseId = saga?.universeId || null;
      }

      // ⭐ CONTEXT D’UNIVERS (standalone)
      if (viewMode === "universe" && currentUniverseId) {
        resolvedSagaId = null;
        resolvedUniverseId = currentUniverseId;
      }

      newNode = {
        id,
        type: "book",
        x: position.x,
        y: position.y,
        title: "Nou Llibre",
        author: "",
        genre: "fantasia",
        status: "pendent",
        notes: "",
        tags: [],
        parentSagaId: resolvedSagaId,
        universeId: resolvedUniverseId, // ✅ ARA SÍ
        volume: 1,
        rating: 0,
        cover: null,
        isNew: true,
      };
    }

    else if (type === "universe") {
      newNode = {
        id,
        type: "universe",
        x: position.x,
        y: position.y,
        title: "Nou Univers",
        notes: "",
        tags: [],
        cover: null,
        isNew: true,
      };
    }

    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeId(id);

    if (parentSagaId) {
      setTimeout(() => updateSagaProgress(parentSagaId), 0);
    }
  };

  const handleCreateBookInsideSaga = (sagaId) => {
    const saga = nodes.find((n) => n.id === sagaId);
    const pos = saga ? { x: saga.x + 250, y: saga.y } : { x: 100, y: 100 };
    handleCreateNode("book", pos, sagaId);
  };

  const startViewTransition = ({
    toViewMode,
    toSagaId = null,
    toUniverseId = null,
    direction = "enter",
  }) => {
    // 1) nodes visibles actuals (abans)
    const fromVisible = computeVisibleNodes({
      nodes,
      filteredNodes,
      viewMode,
      currentUniverseId,
      currentSagaId,
    });

    // 2) nodes visibles després (simulem el futur viewMode)
    const toVisible = computeVisibleNodes({
      nodes,
      filteredNodes,
      viewMode: toViewMode,
      currentUniverseId: toUniverseId,
      currentSagaId: toSagaId,
    });

    // 3) prepara transició
    setTransition({
      active: true,
      progress: 0,
      fromNodes: fromVisible,
      toNodes: toVisible,
      direction,
    });

    const duration = 420; // ms
    const t0 = performance.now();

    const tick = (now) => {
      const t = Math.min(1, (now - t0) / duration);
      setTransition(prev => (prev.active ? { ...prev, progress: t } : prev));

      if (t < 1) {
        requestAnimationFrame(tick);
        return;
      }

      // 4) commit del canvi de vista quan acaba l’animació
      setViewMode(toViewMode);
      setCurrentSagaId(toSagaId);
      setCurrentUniverseId(toUniverseId);
      setSelectedNodeId(null);
      setFilterOpen(false);

      // 5) tanca transició
      setTimeout(() => {
        setTransition({ active: false, progress: 0, fromNodes: [], toNodes: [] });
      }, 0);
    };

    requestAnimationFrame(tick);
  };

  const handleEnterSaga = (sagaId) => {
    startViewTransition({
      toViewMode: "saga",
      toSagaId: sagaId,
      toUniverseId: null,
    });

    // si vols mantenir-ho:
    setTimeout(() => updateSagaProgress(sagaId), 0);
  };

  const handleEnterUniverse = (universeId) => {
    startViewTransition({
      toViewMode: "universe",
      toUniverseId: universeId,
      toSagaId: null,
    });
  };

  const handleGoGlobal = () => {
    startViewTransition({
      toViewMode: "global",
      toSagaId: null,
      toUniverseId: null,
      direction: "exit", // ⭐ CLAU
    });
  };

  const handleExitUniverse = () => {
    startViewTransition({
      toViewMode: "global",
      direction: "exit",
    });
  };

  const handleExitSaga = () => {
    startViewTransition({
      toViewMode: "global",
      direction: "exit",
    });
  };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;

  // 🔎 Cerca i filtres
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("tots");
  const [filterGenre, setFilterGenre] = useState("tots");

  const getAutosavePayload = () => ({
    version: 1,
    savedAt: new Date().toISOString(),
    state: {
      viewMode,
      selectedNodeId,
      currentSagaId,
      currentUniverseId,
      canvasView,
    },
    nodes,
  });

  const computeVisibleNodes = ({
    nodes,
    filteredNodes,
    viewMode,
    currentUniverseId,
    currentSagaId,
  }) => {
    let visibleNodes = filteredNodes;

    if (viewMode === "global") {
      visibleNodes = filteredNodes.filter((node) =>
        node.type === "universe" ||
        (node.type === "saga" && !node.universeId) ||
        (node.type === "book" && !node.parentSagaId && !node.universeId)
      );
    }

    if (viewMode === "universe" && currentUniverseId) {
      const sagaIds = filteredNodes
        .filter(n => n.type === "saga" && n.universeId === currentUniverseId)
        .map(s => s.id);

      visibleNodes = filteredNodes.filter(n =>
        (n.type === "universe" && n.id === currentUniverseId) ||
        (n.type === "saga" && n.universeId === currentUniverseId) ||
        (n.type === "book" &&
          (
            sagaIds.includes(n.parentSagaId) ||
            (n.parentSagaId == null && n.universeId === currentUniverseId)
          )
        )
      );
    }

    if (viewMode === "saga" && currentSagaId) {
      visibleNodes = filteredNodes.filter(
        (node) =>
          (node.type === "saga" && node.id === currentSagaId) ||
          (node.type === "book" && node.parentSagaId === currentSagaId)
      );
    }

    return visibleNodes;
  };

  const filteredNodes = nodes.filter((node) => {
    const matchesSearch =
      node.title.toLowerCase().includes(search.toLowerCase()) ||
      (node.author || "").toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      filterStatus === "tots" || node.status === filterStatus;

    const matchesGenre =
      filterGenre === "tots" || node.genre === filterGenre;

    return matchesSearch && matchesStatus && matchesGenre;
  });

  const centerWorld = {
    x: (-canvasView.position.x + window.innerWidth / 2) / canvasView.scale,
    y: (-canvasView.position.y + window.innerHeight / 2) / canvasView.scale,
  };

  // Nodes visibles segons vista
  let visibleNodes = filteredNodes;

  if (viewMode === "global") {
    visibleNodes = filteredNodes.filter((node) =>
      node.type === "universe" ||
      (node.type === "saga" && !node.universeId) ||
      (node.type === "book" && !node.parentSagaId && !node.universeId)
    );
  }

  if (viewMode === "universe" && currentUniverseId) {
    const sagaIds = filteredNodes
      .filter(n => n.type === "saga" && n.universeId === currentUniverseId)
      .map(s => s.id);

    visibleNodes = filteredNodes.filter(n =>
      (n.type === "universe" && n.id === currentUniverseId) ||
      (n.type === "saga" && n.universeId === currentUniverseId) ||
      (n.type === "book" &&
        (
          sagaIds.includes(n.parentSagaId) || // llibres dins saga
          (n.parentSagaId == null && n.universeId === currentUniverseId) // ⭐ standalone
        )
      )
    );
  }

  if (viewMode === "saga" && currentSagaId) {
    visibleNodes = filteredNodes.filter(
      (node) =>
        (node.type === "saga" && node.id === currentSagaId) ||
        (node.type === "book" && node.parentSagaId === currentSagaId)
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100vh",
      }}
    >

      {/* 🧩 Estructura principal: Canvas + Sidebar */}
      <div
        style={{
          display: "flex",
          height: "100vh",      // ⭐ clau
          width: "100vw",
          overflow: "hidden",  // ⭐ clau
          background: "#020617",
        }}
      >
        
        {/* Canvas o Timeline */}
        <div
          style={{
            flex: 1,
            minWidth: 0,          // 🔥 clau en layouts flex
            position: "relative",
            background: "#020617",
          }}
        >

          {timelineMode ? (
          <>
            <TimelineView
              books={nodes.filter(n => n.type === "book")}
              onExit={() => setTimelineMode(false)}
            />
          </>
        ) : (
            <>
              {/* --- CANVAS NORMAL --- */}
              <CanvasBoard
                nodes={transition.active ? transition.fromNodes : visibleNodes}
                transition={transition}                // ⭐ nou
                centerWorld={centerWorld}              // ⭐ nou
                allNodes={nodes}
                setNodes={setNodes}
                onSelectNode={setSelectedNodeId}
                viewMode={viewMode}
                currentSagaId={currentSagaId}
                stageScale={canvasView.scale}
                stagePosition={canvasView.position}
                onStageChange={setCanvasView}
                selectedNodeId={selectedNodeId}
                onEnterSaga={handleEnterSaga}
                onEnterUniverse={handleEnterUniverse}
              />

              {/* --- MINIMAPA --- */}
              <MiniMap
                nodes={nodes}
                stageScale={canvasView.scale}
                stagePosition={canvasView.position}
                onJumpTo={handleJumpTo}
                miniMapPos={miniMapPos}
                setMiniMapPos={setMiniMapPos}
              />

              <CanvasFAB
                anchorPos={miniMapPos}
                icon={Plus}
                items={[
                  { icon: Globe, label: "Crear univers", action: () => handleCreateNode("universe", centerWorld) },
                  {
                    icon: Library,
                    label: "Crear saga",
                    action: () => handleCreateNode("saga", centerWorld)
                  },
                  { 
                    icon: Book,
                    label: "Crear llibre",
                    action: () =>
                      viewMode === "saga"
                        ? handleCreateNode("book", centerWorld, currentSagaId)
                        : handleCreateNode("book", centerWorld)
                  }
                ]}
              />

              <CanvasFAB
                anchorPos={{ x: miniMapPos.x, y: miniMapPos.y + 50 }}
                icon={Search}
                items={[
                  {
                    icon: Filter,
                    label: "Filtrar",
                    action: () => setFilterOpen(v => !v), // 🔑 AQUÍ
                  },
                  {
                    icon: CalendarRange,
                    label: "Timeline",
                    action: () => setTimelineMode(v => !v),
                  },
                ]}
              />

              <CanvasFAB
                anchorPos={{ x: miniMapPos.x, y: miniMapPos.y + 100 }}
                icon={MoreHorizontal}
                items={[
                  { icon: Download, label: "Exportar JSON", action: handleExportJSON },
                  { icon: Upload, label: "Importar JSON", action: () => fileInputRef.current.click() },
                ]}
              />

              {viewMode !== "global" && (
                <CanvasFAB
                  anchorPos={{ x: miniMapPos.x, y: miniMapPos.y + 150 }}
                  icon={Home}
                  onClick={handleGoGlobal}   // ⭐ CLICK DIRECTE
                />
              )}
            </>
          )}

          {filterOpen && (
            <div
              ref={filterPanelRef}
              style={{
                position: "absolute",
                top: 140,
                left: 80,
                width: 260,
                padding: 14,
                borderRadius: 12,
                background: "rgba(15,23,42,0.95)",
                border: "1px solid rgba(148,163,184,0.2)",
                zIndex: 10001,
                backdropFilter: "blur(10px)",
              }}
            >
            {/* 🔍 CERCA */}
            <input
              placeholder="Cercar títol o autor…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 10,
                background: "#020617",
                color: "#e5e7eb",
                border: "1px solid rgba(148,163,184,0.25)",
                marginBottom: 10,
              }}
            />

            {/* 🎭 GÈNERE */}
            <select
              value={filterGenre}
              onChange={(e) => setFilterGenre(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 10,
                background: "#020617",
                color: "#e5e7eb",
                border: "1px solid rgba(148,163,184,0.25)",
                marginBottom: 10,
              }}
            >
              <option value="tots">Tots els gèneres</option>
              <option value="fantasia">Fantasia</option>
              <option value="ciencia-ficcio">Ciència-ficció</option>
              <option value="romantica">Romàntica</option>
              <option value="thriller">Thriller</option>
            </select>

            {/* 📊 ESTAT */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 10,
                background: "#020617",
                color: "#e5e7eb",
                border: "1px solid rgba(148,163,184,0.25)",
              }}
            >
              <option value="tots">Tots els estats</option>
              <option value="pendent">Pendent</option>
              <option value="en-lectura">En lectura</option>
              <option value="acabada">Acabada</option>
            </select>
          </div>
          
        )}

        </div>

        {/* Sidebar */}
        <div
          style={{
            width: sidebarOpen ? "360px" : "0px",
            transition: "width 0.25s ease, opacity 0.2s ease",
            overflow: "hidden",
            borderLeft: sidebarOpen
              ? "1px solid rgba(148,163,184,0.08)"
              : "none",
            background: "#020617",

            pointerEvents: sidebarOpen ? "auto" : "none",
            opacity: sidebarOpen ? 1 : 0,
            visibility: sidebarOpen ? "visible" : "hidden",
          }}
        >
          <Sidebar
            node={selectedNode}
            onNodeChange={handleNodeChange}
            onEnterSaga={handleEnterSaga}
            onExitSaga={handleExitSaga}
            onEnterUniverse={handleEnterUniverse}
            onExitUniverse={handleExitUniverse}
            onSelectNode={setSelectedNodeId}
            onCreateBookInsideSaga={handleCreateBookInsideSaga}
            nodes={nodes}
            viewMode={viewMode}
            onRequestDelete={(node) => setDeleteTarget(node)}
          />
        </div>
      </div>

      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{
          position: "absolute",
          right: sidebarOpen ? "340px" : "0px",
          top: "2vh",
          transform: "translateX(50%)",
          width: "26px",
          height: "44px",
          borderRadius: "10px",
          background: "linear-gradient(180deg, #1e293b, #020617)",
          border: "1px solid rgba(148,163,184,0.25)",
          color: "white",
          cursor: "pointer",
          boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
          transition: "all 0.25s ease",
          zIndex: 9999,
        }}
      >
        {sidebarOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
      
      <ConfirmDeleteModal
        open={!!deleteTarget}
        title="Confirmar esborrat"
        message={`Segur que vols esborrar "${deleteTarget?.title}" i tot el seu contingut? Aquesta acció no es pot desfer.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => handleDeleteNode(deleteTarget)}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImportJSON(file);
          e.target.value = ""; // 🔑 permet reimportar el mateix fitxer
        }}
      />
    </div>
  );
}

export default App;
