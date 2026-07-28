import { useEffect, useMemo, useRef, useState } from "react";
import { Group, Layer, Stage } from "react-konva";
import BackgroundField from "./BackgroundField.jsx";
import ConnectionLines from "./ConnectionLines.jsx";
import NodeTooltip from "./NodeTooltip.jsx";
import NodeVisual from "./NodeVisual.jsx";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function getFitCamera(nodes, size) {
  if (!nodes.length) return { scale: 1, position: { x: size.width / 2, y: size.height / 2 } };
  const xs = nodes.map((node) => node.x);
  const ys = nodes.map((node) => node.y);
  const minX = Math.min(...xs) - 150;
  const maxX = Math.max(...xs) + 150;
  const minY = Math.min(...ys) - 150;
  const maxY = Math.max(...ys) + 190;
  const worldWidth = Math.max(300, maxX - minX);
  const worldHeight = Math.max(300, maxY - minY);
  const scale = clamp(Math.min(size.width / worldWidth, size.height / worldHeight) * 0.88, 0.34, 1.35);
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  return {
    scale,
    position: {
      x: size.width / 2 - centerX * scale,
      y: size.height / 2 - centerY * scale,
    },
  };
}

export default function CanvasBoard({
  nodes,
  camera,
  onCameraChange,
  selectedNodeId,
  onSelectNode,
  onMoveNode,
  onEnterNode,
  fitSignal,
  onCenterChanged,
}) {
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const lastFitSignalRef = useRef(fitSignal);
  const [size, setSize] = useState({ width: 1, height: 1 });
  const [pan, setPan] = useState(null);

  useEffect(() => {
    if (!containerRef.current) return undefined;
    const observer = new ResizeObserver(([entry]) => {
      const width = Math.max(1, Math.round(entry.contentRect.width));
      const height = Math.max(1, Math.round(entry.contentRect.height));
      setSize({ width, height });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (fitSignal === lastFitSignalRef.current || size.width <= 1) return;
    lastFitSignalRef.current = fitSignal;
    onCameraChange(getFitCamera(nodes, size));
  }, [fitSignal, nodes, size, onCameraChange]);

  useEffect(() => {
    const center = {
      x: (size.width / 2 - camera.position.x) / camera.scale,
      y: (size.height / 2 - camera.position.y) / camera.scale,
    };
    onCenterChanged?.(center);
  }, [camera, size, onCenterChanged]);

  const orderedNodes = useMemo(
    () => [...nodes].sort((left, right) => {
      const order = { universe: 0, saga: 1, book: 2 };
      return order[left.type] - order[right.type];
    }),
    [nodes],
  );

  const handleWheel = (event) => {
    event.evt.preventDefault();
    const stage = stageRef.current;
    const pointer = stage?.getPointerPosition();
    if (!stage || !pointer) return;
    const oldScale = camera.scale;
    const worldPoint = {
      x: (pointer.x - camera.position.x) / oldScale,
      y: (pointer.y - camera.position.y) / oldScale,
    };
    const factor = event.evt.deltaY > 0 ? 0.92 : 1.087;
    const scale = clamp(oldScale * factor, 0.22, 2.6);
    onCameraChange({
      scale,
      position: {
        x: pointer.x - worldPoint.x * scale,
        y: pointer.y - worldPoint.y * scale,
      },
    });
  };

  const startPan = (event) => {
    if (event.target !== stageRef.current) return;
    onSelectNode(null);
    setPan({
      x: event.evt.clientX - camera.position.x,
      y: event.evt.clientY - camera.position.y,
    });
  };

  const movePan = (event) => {
    if (!pan) return;
    onCameraChange({
      scale: camera.scale,
      position: {
        x: event.evt.clientX - pan.x,
        y: event.evt.clientY - pan.y,
      },
    });
  };

  return (
    <div ref={containerRef} className="bv-canvas-stage">
      <Stage
        ref={stageRef}
        width={size.width}
        height={size.height}
        scaleX={camera.scale}
        scaleY={camera.scale}
        x={camera.position.x}
        y={camera.position.y}
        onWheel={handleWheel}
        onMouseDown={startPan}
        onMouseMove={movePan}
        onMouseUp={() => setPan(null)}
        onMouseLeave={() => setPan(null)}
      >
        <Layer listening={false}>
          <BackgroundField />
          <ConnectionLines nodes={nodes} />
        </Layer>
        <Layer>
          {orderedNodes.map((node) => (
            <NodeGroup
              key={node.id}
              node={node}
              selected={node.id === selectedNodeId}
              stageScale={camera.scale}
              onSelect={onSelectNode}
              onMove={onMoveNode}
              onEnter={onEnterNode}
            />
          ))}
        </Layer>
      </Stage>
      <div className="bv-canvas-vignette" />
    </div>
  );
}

function NodeGroup({ node, selected, stageScale, onSelect, onMove, onEnter }) {
  const groupRef = useRef(null);
  const [hovered, setHovered] = useState(false);

  return (
    <Group
      ref={groupRef}
      x={node.x}
      y={node.y}
      draggable
      onMouseDown={(event) => { event.cancelBubble = true; }}
      onClick={(event) => { event.cancelBubble = true; onSelect(node.id); }}
      onTap={(event) => { event.cancelBubble = true; onSelect(node.id); }}
      onDblClick={(event) => { event.cancelBubble = true; onEnter(node); }}
      onDblTap={(event) => { event.cancelBubble = true; onEnter(node); }}
      onDragMove={(event) => onMove(node.id, { x: event.target.x(), y: event.target.y() })}
      onMouseEnter={() => {
        setHovered(true);
        document.body.style.cursor = "pointer";
        groupRef.current?.to({ scaleX: 1.045, scaleY: 1.045, duration: 0.16 });
      }}
      onMouseLeave={() => {
        setHovered(false);
        document.body.style.cursor = "default";
        groupRef.current?.to({ scaleX: 1, scaleY: 1, duration: 0.16 });
      }}
    >
      <NodeVisual node={node} selected={selected} hovered={hovered} stageScale={stageScale} />
      {hovered ? <NodeTooltip node={node} /> : null}
    </Group>
  );
}
