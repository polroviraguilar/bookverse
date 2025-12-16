import React, { useState, useRef, useEffect } from "react";
import Konva from "konva";
import { Stage, Layer, Group } from "react-konva";
import ConnectionLines from "./ConnectionLines";
import HybridGrid from "./HybridGrid";
import NodeVisual from "./nodes/NodeVisual";
import { getNodeRadius, getOrbitRingCount } from "./nodes/nodeUtils";
import OrbitingRings from "./nodes/OrbitingRings";
import NodeTooltip from "./nodes/NodeTooltip";
import CursorStarTrail from "./CursorStarTrail";

function CanvasBoard({
  nodes,
  allNodes,
  setNodes,
  onSelectNode,
  onEnterSaga,
  onEnterUniverse,
  selectedNodeId,
  selectionMode,
  viewMode,
  currentSagaId,
  stageScale,
  stagePosition,
  onStageChange,
  transition,
  centerWorld
}) {
  const stageRef = useRef(null);

  // ✅ Mida real del contenidor (no window resize)
  const containerRef = useRef(null);
  const [size, setSize] = useState({ width: 1, height: 1 });

  useEffect(() => {
    if (!containerRef.current) return;

    const el = containerRef.current;

    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;

      // evita 0s i renders inútils
      setSize((prev) => {
        const w = Math.max(1, Math.round(width));
        const h = Math.max(1, Math.round(height));
        if (prev.width === w && prev.height === h) return prev;
        return { width: w, height: h };
      });
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // 🎯 Valors suaus (sense re-render)
  const smoothScale = useRef(stageScale);
  const smoothPos = useRef({ x: stagePosition.x, y: stagePosition.y });

  useEffect(() => {
    let rafId;

    const animate = () => {
      const stage = stageRef.current;
      if (!stage) return;

      smoothScale.current += (stageScale - smoothScale.current) * 0.15;
      smoothPos.current.x += (stagePosition.x - smoothPos.current.x) * 0.18;
      smoothPos.current.y += (stagePosition.y - smoothPos.current.y) * 0.18;

      stage.scale({ x: smoothScale.current, y: smoothScale.current });
      stage.position({ x: smoothPos.current.x, y: smoothPos.current.y });

      stage.batchDraw();
      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [stageScale, stagePosition]);

  // Pan manual
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState(null);

  // ZOOM
  const handleWheel = (e) => {
    e.evt.preventDefault();
    const scaleBy = 1.05;

    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stageScale;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stagePosition.x) / oldScale,
      y: (pointer.y - stagePosition.y) / oldScale,
    };

    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;

    const newPosition = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    onStageChange({ scale: newScale, position: newPosition });
  };

  // Drag node
  const handleDragNode = (id, pos) => {
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, x: pos.x, y: pos.y } : n)));
  };

  const handleDragEndNode = () => {
    // ❌ abans feies setGuides([]) però aquí no existeix
    // Si tens snapping guides en un altre component, mou-ho allà.
  };

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%", height: "100%" }}>
      <Stage
        width={size.width}
        height={size.height}
        ref={stageRef}
        onWheel={handleWheel}
        style={{ background: "#020617", cursor: "grab" }}
        draggable={false}
        onMouseDown={(e) => {
          const stage = stageRef.current;
          const isEmpty = e.target === stage;

          if (!selectionMode && isEmpty) {
            onSelectNode?.(null);
            setIsPanning(true);
            setPanStart({
              x: e.evt.clientX - stagePosition.x,
              y: e.evt.clientY - stagePosition.y,
            });
          }
        }}
        onMouseMove={(e) => {
          if (!isPanning || !panStart) return;

          const newPosition = {
            x: e.evt.clientX - panStart.x,
            y: e.evt.clientY - panStart.y,
          };

          onStageChange({ scale: stageScale, position: newPosition });
        }}
        onMouseUp={() => setIsPanning(false)}
        onMouseLeave={() => setIsPanning(false)}
      >
        <CursorStarTrail stageRef={stageRef} />

        <Layer>
          <HybridGrid stageRef={stageRef} width={size.width} height={size.height} />

          <ConnectionLines
            nodes={nodes}
            transition={transition}
            centerWorld={centerWorld}
          />

          {/* --- NODES NORMALS --- */}
{!transition?.active && nodes.map((node) => (
  <GroupNode
    key={node.id}
    node={node}
    selected={selectedNodeId === node.id}
    onDragNode={handleDragNode}
    onDragEndNode={handleDragEndNode}
    onSelectNode={onSelectNode}
    onEnterSaga={onEnterSaga}
    onEnterUniverse={onEnterUniverse}
    selectionMode={selectionMode}
  />
))}

{/* --- TRANSICIÓ: FROM + TO --- */}
{transition?.active && (
  <>
    {/* SORTINTS: col·lapse cap al centre */}
    {transition.fromNodes.map((node) => {
      const p = Math.max(0, transition.progress - 0.1) / 0.9;
      const cx =
        transition.direction === "exit"
          ? 0
          : centerWorld?.x ?? 0;

      const cy =
        transition.direction === "exit"
          ? 0
          : centerWorld?.y ?? 0;

      const x = node.x + (cx - node.x) * p;
      const y = node.y + (cy - node.y) * p;

      const opacity = 1 - p;
      const scale = 1 - p * 0.25;

      return (
        <GroupNode
          key={"from-" + node.id}
          node={{ ...node, x, y }}
          selected={false}
          onDragNode={null}
          onDragEndNode={null}
          onSelectNode={null}
          onEnterSaga={null}
          onEnterUniverse={null}
          selectionMode={true}
          forcedOpacity={opacity}
          forcedScale={scale}
        />
      );
    })}

    {/* ENTRANTS: neixen del centre i s’expandeixen */}
      {transition.toNodes.map((node) => {
        const p = transition.progress; // 0 → 1
        const cx = centerWorld?.x ?? 0;
        const cy = centerWorld?.y ?? 0;

        const x = cx + (node.x - cx) * p;
        const y = cy + (node.y - cy) * p;

        const opacity = p;
        const scale = 0.85 + p * 0.15;

        return (
          <GroupNode
            key={"to-" + node.id}
            node={{ ...node, x, y }}
            selected={false}
            onDragNode={null}
            onDragEndNode={null}
            onSelectNode={null}
            onEnterSaga={null}
            onEnterUniverse={null}
            selectionMode={true}
            forcedOpacity={opacity}
            forcedScale={scale}
          />
        );
      })}
    </>
  )}
        </Layer>
      </Stage>
    </div>
  );
}

// NODE
function GroupNode({
  node,
  selected,
  onDragNode,
  onDragEndNode,
  onSelectNode,
  onEnterSaga,
  onEnterUniverse,
  selectionMode,
  forcedOpacity,
  forcedScale
}) {
  const groupRef = useRef(null);
  const radius = getNodeRadius(node.type);
  const ringCount = getOrbitRingCount(node.type);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (!node.isNew) return;
    const g = groupRef.current;
    if (!g) return;

    g.to({
      opacity: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 0.35,
      easing: Konva.Easings.EaseOut,
    });
  }, [node.isNew]);

  return (
    <Group
      ref={groupRef}
      x={node.x}
      y={node.y}
      draggable={!selectionMode}
      opacity={forcedOpacity ?? (node.isNew ? 0 : 1)}
      scaleX={(forcedScale ?? 1) * (node.isNew ? 0.85 : 1)}
      scaleY={(forcedScale ?? 1) * (node.isNew ? 0.85 : 1)}
      onMouseDown={(e) => (e.cancelBubble = true)}
      onMouseUp={(e) => {
        e.cancelBubble = true;
        onSelectNode?.(node.id);
      }}
      onDragMove={(e) => {
        onDragNode?.(node.id, { x: e.target.x(), y: e.target.y() });
      }}
      onDragEnd={() => onDragEndNode?.()}
      onMouseEnter={() => {
        setHovered(true);
        document.body.style.cursor = "pointer";
        groupRef.current?.to({ scaleX: 1.08, scaleY: 1.08, duration: 0.18 });
      }}
      onMouseLeave={() => {
        setHovered(false);
        document.body.style.cursor = "default";
        groupRef.current?.to({ scaleX: 1, scaleY: 1, duration: 0.18 });
      }}
      onDblClick={(e) => {
        e.cancelBubble = true;
        if (node.type === "saga") onEnterSaga?.(node.id);
        if (node.type === "universe") onEnterUniverse?.(node.id);
      }}
    >
      <OrbitingRings
        count={ringCount}
        radius={radius}
        nodeType={node.type}
      />
      <NodeVisual node={node} selected={selected} hovered={hovered} />
      {hovered && <NodeTooltip node={node} />}
    </Group>
  );
}

export default CanvasBoard;
