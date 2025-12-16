import React, { useMemo, useState, useRef } from "react";
import { Stage, Layer, Line, Circle, Text, Group } from "react-konva";

// Colors per gènere (igual estil que al canvas)
function getGenreColor(genre) {
  switch (genre) {
    case "fantasia":
      return "#4c1d95";
    case "ciencia-ficcio":
      return "#1e3a8a";
    case "romantica":
      return "#831843";
    case "thriller":
      return "#7f1d1d";
    default:
      return "#1e293b";
  }
}

// Colors per estat (per si vols fer servir més endavant)
function getStatusColor(status) {
  switch (status) {
    case "en-lectura":
      return "#60a5fa";
    case "pausada":
      return "#fbbf24";
    case "acabada":
    case "completat":
      return "#22c55e";
    case "abandonat":
      return "#f97373";
    default:
      return "#94a3b8";
  }
}

const DAY_MS = 24 * 60 * 60 * 1000;

const Control = ({ label, children }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
    <span style={{ fontSize: 11, color: "#94a3b8" }}>{label}</span>
    {children}
  </div>
);

const TopControl = ({ label, children }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      gap: 4,
      padding: "6px 10px",
      borderRadius: 10,
      background: "rgba(15,23,42,0.6)",
      border: "1px solid rgba(148,163,184,0.18)",
      minWidth: 110,
    }}
  >
    <span
      style={{
        fontSize: 10,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "#94a3b8",
      }}
    >
      {label}
    </span>
    {children}
  </div>
);

export default function TimelineView({ books, onExit }) {
  // Si no hi ha res a mostrar
  if (!books || books.length === 0) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#020617",
          color: "#e5e7eb",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        No hi ha llibres per mostrar a la línia temporal.
      </div>
    );
  }

  // -------------------------
  // 1) PREPARAR DADES
  // -------------------------
  const parsedBooks = useMemo(() => {
    return books
      .filter((b) => b.startDate) // només llibres amb data d'inici
      .map((b) => {
        const startTs = Date.parse(b.startDate);
        const endTs = b.endDate ? Date.parse(b.endDate) : startTs + DAY_MS * 7; // si no hi ha fi, +7 dies

        return {
          ...b,
          startTs: isNaN(startTs) ? Date.now() : startTs,
          endTs: isNaN(endTs) ? Date.now() + DAY_MS * 7 : endTs,
        };
      });
  }, [books]);

  if (parsedBooks.length === 0) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#020617",
          color: "#e5e7eb",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        No hi ha dates vàlides per mostrar.
      </div>
    );
  }

  // Rang mínim / màxim (per tot el conjunt)
  const globalMin = parsedBooks.reduce(
    (min, b) => Math.min(min, b.startTs),
    parsedBooks[0].startTs
  );
  const globalMax = parsedBooks.reduce(
    (max, b) => Math.max(max, b.endTs),
    parsedBooks[0].endTs
  );

  const fullSpan = Math.max(globalMax - globalMin, DAY_MS); // evitar 0

  const width = window.innerWidth;
  const height = window.innerHeight;
  const timelineY = height * 0.6;

  // -------------------------
  // 2) ESTATS: ZOOM I CENTRE
  // -------------------------
  const [zoom, setZoom] = useState(1.4); // 1 = base, 2 = més ampli
  const [centerTs, setCenterTs] = useState(globalMin + fullSpan / 2);

  // Slider temporal (0-100 → min..max)
  const sliderValue =
    ((centerTs - globalMin) / fullSpan) * 100 < 0 ||
    ((centerTs - globalMin) / fullSpan) * 100 > 100
      ? 50
      : ((centerTs - globalMin) / fullSpan) * 100;

  // PX per dia segons zoom
  const getPxPerDay = () => 40 * zoom;

  // Mapping de temps → X
  const timeToX = (ts) => {
    const pxPerDay = getPxPerDay();
    const daysFromCenter = (ts - centerTs) / DAY_MS;
    return width / 2 + daysFromCenter * pxPerDay;
  };

  // -------------------------
  // 3) PAN HORIZONTAL
  // -------------------------
  const [isPanning, setIsPanning] = useState(false);
  const [lastX, setLastX] = useState(null);

  const handleMouseDown = (e) => {
    const stage = e.target.getStage();
    const isEmpty = e.target === stage;
    if (!isEmpty) return;

    setIsPanning(true);
    setLastX(e.evt.clientX);
  };

  const handleMouseMove = (e) => {
    if (!isPanning || lastX == null) return;

    const currentX = e.evt.clientX;
    const dx = currentX - lastX;
    setLastX(currentX);

    const pxPerDay = getPxPerDay();
    const deltaDays = -dx / pxPerDay;
    const deltaMs = deltaDays * DAY_MS;

    setCenterTs((prev) => prev + deltaMs);
  };

  const stopPan = () => {
    setIsPanning(false);
    setLastX(null);
  };

  // -------------------------
  // 4) TOOLTIP
  // -------------------------
  const containerRef = useRef(null);
  const [tooltip, setTooltip] = useState({
    visible: false,
    x: 0,
    y: 0,
    book: null,
  });

  const showTooltip = (book, pointer) => {
    setTooltip({
      visible: true,
      x: pointer.x,
      y: pointer.y,
      book,
    });
  };

  const hideTooltip = () => {
    setTooltip((prev) => ({ ...prev, visible: false }));
  };

  // -------------------------
  // 5) CAPÇALERA: CONTROLS
  // -------------------------
  const formatDate = (ts) => {
    const d = new Date(ts);
    return d.toLocaleDateString("ca-ES", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  };

  const windowSpanDays = (width / getPxPerDay()) || 1; // quants dies caben en pantalla
  const startWindowTs = centerTs - (windowSpanDays / 2) * DAY_MS;
  const endWindowTs = centerTs + (windowSpanDays / 2) * DAY_MS;
  const sliderStyle = `
    input[type="range"] {
      -webkit-appearance: none;
      appearance: none;
      width: 100%;
      height: 6px;
      border-radius: 999px;
      background: linear-gradient(
        90deg,
        #7c3aed,
        #9333ea
      );
      box-shadow: inset 0 0 0 1px rgba(255,255,255,0.15),
                  0 0 18px rgba(124,58,237,0.35);
      cursor: pointer;
    }

    input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 18px;
      height: 18px;
      border-radius: 999px;
      background: radial-gradient(
        circle at top left,
        #f5f3ff,
        #7c3aed
      );
      box-shadow:
        0 0 0 2px rgba(124,58,237,0.45),
        0 6px 18px rgba(0,0,0,0.55);
      transition: transform 0.15s ease;
    }

    input[type="range"]:hover::-webkit-slider-thumb {
      transform: scale(1.15);
    }

    input[type="range"]::-moz-range-thumb {
      width: 18px;
      height: 18px;
      border-radius: 999px;
      background: #7c3aed;
      border: none;
    }
    `;

  // -------------------------
  // 6) RENDER
  // -------------------------
  return (
  <div
    style={{
      position: "relative",
      width: "100vw",
      height: "100vh",
      background: "#020617",
      fontFamily: "Inter, system-ui, sans-serif",
    }}
  >
    <style>{sliderStyle}</style>

    {/* TOP BAR */}
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 30,
        padding: "12px 16px",
        background:
          "linear-gradient(180deg, rgba(15,23,42,0.96), rgba(2,6,23,0.9))",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(148,163,184,0.12)",
        boxShadow: "0 12px 40px rgba(0,0,0,0.55)",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "auto 1fr auto",
          alignItems: "center",
          gap: 16,
        }}
      >
        {/* ← CANVAS */}
        <button
          onClick={onExit}
          style={{
            padding: "8px 14px",
            borderRadius: 999,
            background: "rgba(15,23,42,0.85)",
            border: "1px solid rgba(148,163,184,0.25)",
            color: "#e5e7eb",
            fontSize: 13,
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
          }}
        >
          ← Canvas
        </button>

        {/* TÍTOL */}
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#94a3b8",
              marginBottom: 2,
            }}
          >
            Línia temporal
          </div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: "#e5e7eb",
            }}
          >
            {formatDate(startWindowTs)} — {formatDate(endWindowTs)}
          </div>
        </div>

        {/* CONTROLS */}
        <div style={{ display: "flex", gap: 12 }}>
          <TopControl label="Zoom">
            <input
              type="range"
              min="0.6"
              max="3"
              step="0.1"
              value={zoom}
              onChange={(e) => setZoom(+e.target.value)}
            />
          </TopControl>

          <TopControl label="Rang">
            <input
              type="range"
              min="0"
              max="100"
              value={sliderValue}
              onChange={(e) => {
                const v = +e.target.value;
                setCenterTs(globalMin + (fullSpan * v) / 100);
              }}
            />
          </TopControl>
        </div>
      </div>
    </div>

    {/* STAGE + TOOLTIP */}
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        inset: "88px 0 0 0",
      }}
    >
      <Stage
        width={width}
        height={height - 88}
        style={{ background: "transparent" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={stopPan}
        onMouseLeave={stopPan}
      >
        <Layer>
          {/* LÍNIA BASE */}
          <Line
            points={[60, timelineY, width - 60, timelineY]}
            stroke="rgba(15,23,42,0.9)"
            strokeWidth={10}
            shadowBlur={20}
            shadowColor="rgba(0,0,0,0.6)"
            lineCap="round"
          />

          <Line
            points={[60, timelineY, width - 60, timelineY]}
            stroke="rgba(148,163,184,0.35)"
            strokeWidth={1.5}
          />

          {/* SEGMENTS */}
          {parsedBooks.map((book) => {
            const xStart = timeToX(book.startTs);
            const xEnd = timeToX(book.endTs);
            if (xEnd < 0 || xStart > width) return null;

            return (
              <Line
                key={book.id}
                points={[xStart, timelineY, xEnd, timelineY]}
                stroke={getGenreColor(book.genre)}
                strokeWidth={8}
                opacity={0.85}
                lineCap="round"
              />
            );
          })}

          {/* NODES */}
          {parsedBooks.map((book, index) => {
            const xMid = timeToX((book.startTs + book.endTs) / 2);
            if (xMid < -120 || xMid > width + 120) return null;

            const up = index % 2 === 0;
            const nodeY = up ? timelineY - 120 : timelineY + 120;
            const labelY = up ? nodeY - 70 : nodeY + 50;
            const dateY = labelY + 22;

            return (
              <Group
                key={book.id}
                onMouseEnter={(e) => {
                  const p = e.target.getStage().getPointerPosition();
                  if (p) showTooltip(book, p);
                }}
                onMouseMove={(e) => {
                  const p = e.target.getStage().getPointerPosition();
                  if (p)
                    setTooltip((t) => ({ ...t, x: p.x, y: p.y }));
                }}
                onMouseLeave={hideTooltip}
              >
                <Line
                  points={[xMid, timelineY, xMid, nodeY]}
                  stroke="#64748b"
                  strokeWidth={2}
                  dash={[4, 5]}
                />

                <Circle
                  x={xMid}
                  y={nodeY}
                  radius={28}
                  fill="#020617"
                  stroke={getGenreColor(book.genre)}
                  strokeWidth={2}
                  shadowBlur={18}
                  shadowColor="rgba(0,0,0,0.6)"
                />

                <Text
                  x={xMid - 24}
                  y={nodeY - 8}
                  width={48}
                  align="center"
                  text={book.startDate?.substring(0, 4) || "?"}
                  fontSize={16}
                  fill="#e5e7eb"
                  fontStyle="bold"
                />

                <Text
                  x={xMid - 140}
                  y={labelY}
                  width={280}
                  align="center"
                  text={book.title}
                  fontSize={15}
                  fill="#e5e7eb"
                />
                <Text
                  x={xMid - 140}
                  y={dateY}
                  width={280}
                  align="center"
                  text={
                    book.endDate
                      ? `${book.startDate} → ${book.endDate}`
                      : book.startDate
                  }
                  fontSize={11}
                  fill="#94a3b8"
                />
              </Group>
            );
          })}
        </Layer>
      </Stage>

      {tooltip.visible && tooltip.book && (
        <div
          style={{
            position: "absolute",
            left: tooltip.x,
            top: tooltip.y,
            transform: "translate(-50%, -130%)",
            background: "rgba(15,23,42,0.96)",
            padding: "10px 12px",
            borderRadius: 12,
            color: "#e5e7eb",
            pointerEvents: "none",
            boxShadow: "0 18px 45px rgba(0,0,0,0.65)",
            border: "1px solid rgba(148,163,184,0.4)",
            backdropFilter: "blur(10px)",
            fontSize: 13,
          }}
        >
          <strong>{tooltip.book.title}</strong>
        </div>
      )}
    </div>
  </div>
);
}