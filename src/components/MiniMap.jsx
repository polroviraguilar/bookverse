import React, { useMemo, useEffect, useRef, useState } from "react";
import Konva from "konva";
import { Stage, Layer, Rect, Circle, Arc, Ring } from "react-konva";

function safeMin(arr, fallback = 0) {
  return arr.length ? Math.min(...arr) : fallback;
}
function safeMax(arr, fallback = 0) {
  return arr.length ? Math.max(...arr) : fallback;
}

function MiniMap({
  nodes,
  stageScale,
  stagePosition,
  onJumpTo,
  miniMapPos = { x: 20, y: 20 },
  setMiniMapPos,
}) {
  const size = 180;
  const radius = size / 2;
  const padding = 24;

  const [hover, setHover] = useState(false);
  
  const pulseRef = useRef(null);

  const SCALE_IDLE = 0.72;
  const SCALE_HOVER = 0.8;

  const STAGE_WIDTH = window.innerWidth - 320;
  const STAGE_HEIGHT = window.innerHeight;

  const cameraWorld = useMemo(() => ({
    x: -stagePosition.x / stageScale,
    y: -stagePosition.y / stageScale,
  }), [stagePosition, stageScale]);

  // -----------------------------
  // BOUNDING BOX “INTEL·LIGENT”
  // (evita zona buida i evita NaN)
  // -----------------------------
  const world = useMemo(() => {
    if (!nodes || nodes.length === 0) {
      // món per defecte quan no hi ha res
      return {
        minX: -500,
        minY: -400,
        maxX: 500,
        maxY: 400,
        worldWidth: 1000,
        worldHeight: 800,
      };
    }

    const xs = nodes.map((n) => Number(n.x) || 0);
    const ys = nodes.map((n) => Number(n.y) || 0);

    // mida aproximada segons tipus
    const widths = nodes.map((n) => (n.type === "saga" ? 240 : 200));
    const heights = nodes.map((n) => (n.type === "saga" ? 120 : 80));

    const minX = safeMin(xs, 0);
    const minY = safeMin(ys, 0);

    const maxX = safeMax(xs.map((x, i) => x + widths[i]), 0);
    const maxY = safeMax(ys.map((y, i) => y + heights[i]), 0);

    // marge perquè no quedi enganxat
    const margin = 200;

    const out = {
      minX: minX - margin,
      minY: minY - margin,
      maxX: maxX + margin,
      maxY: maxY + margin,
    };

    out.worldWidth = Math.max(1, out.maxX - out.minX);
    out.worldHeight = Math.max(1, out.maxY - out.minY);

    return out;
  }, [nodes]);

  const mapScale = useMemo(() => {
    const usable = size - padding * 2;
    return Math.min(usable / world.worldWidth, usable / world.worldHeight);
  }, [size, padding, world]);

  // -----------------------------
  // CONVERSIÓ coords mini → món
  // -----------------------------
  const handleDragOrClick = (e) => {
    const stage = e.target.getStage();
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const localX = pointer.x - radius;
    const localY = pointer.y - radius;

    const worldX = world.minX + localX / mapScale;
    const worldY = world.minY + localY / mapScale;

    onJumpTo({
      x: -worldX * stageScale + window.innerWidth / 2,
      y: -worldY * stageScale + window.innerHeight / 2,
    });
  };

  // -----------------------------
  // VIEWPORT (zona visible del canvas) dins el minimapa
  // -----------------------------
  const viewport = useMemo(() => {
    const viewWorldX = -stagePosition.x / stageScale;
    const viewWorldY = -stagePosition.y / stageScale;

    const viewWorldW = (window.innerWidth - 320) / stageScale;
    const viewWorldH = window.innerHeight / stageScale;

    return {
      x: (viewWorldX - cameraWorld.x) * mapScale + radius,
      y: (viewWorldY - cameraWorld.y) * mapScale + radius,
      w: viewWorldW * mapScale,
      h: viewWorldH * mapScale,
    };
  }, [stagePosition, stageScale, world, mapScale, radius]);

  // -----------------------------
  // DRAG del contenidor (opcional)
  // -----------------------------
  const handleMiniDrag = (e) => {
    if (!setMiniMapPos) return;
    setMiniMapPos({ x: e.clientX - size, y: e.clientY - size });
  };

  return (
    <div
      style={{
        position: "absolute",
        top: miniMapPos.y,
        left: miniMapPos.x,
        width: size,
        height: size,
        borderRadius: "50%",
        background: "#0b1220cc",
        backdropFilter: hover ? "blur(8px)" : "blur(4px)",
        border: "2px solid rgba(226,232,240,0.18)",
        boxShadow: hover
          ? "0 16px 36px rgba(0,0,0,0.45)"
          : "0 8px 18px rgba(0,0,0,0.25)",
        overflow: "hidden",
        cursor: "grab",
        opacity: hover ? 1 : 0.55,
        zIndex: 9999,
        userSelect: "none",

        // ⭐ CLAU
        transform: `scale(${hover ? SCALE_HOVER : SCALE_IDLE})`,
        transformOrigin: "center center",
        transition: `
          transform 0.28s cubic-bezier(.2,.8,.2,1),
          opacity 0.25s ease,
          box-shadow 0.25s ease,
          backdrop-filter 0.25s ease
        `,
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onMouseDown={(e) => {
        // ALT+drag mou el minimapa
        if (e.altKey) {
          e.preventDefault();
          const move = (ev) => handleMiniDrag(ev);
          const up = () => {
            window.removeEventListener("mousemove", move);
            window.removeEventListener("mouseup", up);
          };
          window.addEventListener("mousemove", move);
          window.addEventListener("mouseup", up);
        }
      }}
      title="Clic/drag per saltar · ALT+drag per moure el minimapa"
    >
      <Stage
        width={size}
        height={size}
        onMouseDown={handleDragOrClick}
        onMouseMove={(e) => {
          if (e.evt.buttons === 1) handleDragOrClick(e);
        }}
      >
        <Layer
          clipFunc={(ctx) => ctx.arc(radius, radius, radius, 0, Math.PI * 2)}
        >
          {/* Fons */}
          <Rect x={0} y={0} width={size} height={size} fill="#0a1020" />

          {/* Nodes com puntets */}
          {nodes.map((n) => {
          const nx =
            (n.x - cameraWorld.x) * mapScale + radius;

          const ny =
            (n.y - cameraWorld.y) * mapScale + radius;

          const dx = nx - radius;
          const dy = ny - radius;
          if (dx * dx + dy * dy > radius * radius) return null;

          let color = "#f87171";
          let r = 2.3;

          if (n.type === "saga") {
            color = "#38bdf8";
            r = 3.4;
          }

          if (n.type === "universe") {
            color = "#facc15"; // ⭐ GROC
            r = 4.6;           // ⭐ MÉS GRAN
          }

          return (
            <Circle
              key={n.id}
              x={nx}
              y={ny}
              radius={r}
              fill={color}
              opacity={0.95}
              listening={false}
            />
          );
        })}

          {/* Overlay fosc fora del viewport (donar focus) */}
          <Rect
            x={0}
            y={0}
            width={size}
            height={size}
            fill="rgba(0,0,0,0.28)"
            listening={false}
          />
          <Rect
            x={viewport.x}
            y={viewport.y}
            width={viewport.w}
            height={viewport.h}
            fill="rgba(0,0,0,0.0)"
            globalCompositeOperation="destination-out"
            listening={false}
          />

          {/* Pulse ring */}
          <Ring
            ref={pulseRef}
            x={radius}
            y={radius}
            innerRadius={radius - 18}
            outerRadius={radius - 14}
            fill="rgba(56,189,248,0.20)"
            opacity={0.12}
            listening={false}
          />

          {/* Punt central */}
          <Circle
            x={radius}
            y={radius}
            radius={3.5}
            fill="white"
            opacity={0.95}
            listening={false}
          />
        </Layer>
      </Stage>
    </div>
  );
}

export default MiniMap;
