import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Group, Layer, Stage } from "react-konva";
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

function sameCamera(left, right) {
  return left.scale === right.scale
    && left.position.x === right.position.x
    && left.position.y === right.position.y;
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
  const panRef = useRef(null);
  const cameraRef = useRef(camera);
  const wheelTimerRef = useRef(null);
  const lastFitSignalRef = useRef(fitSignal);
  const [size, setSize] = useState({ width: 1, height: 1 });

  const applyCameraToStage = useCallback((nextCamera) => {
    const stage = stageRef.current;
    if (!stage) return;
    stage.scale({ x: nextCamera.scale, y: nextCamera.scale });
    stage.position(nextCamera.position);
    stage.batchDraw();
  }, []);

  const publishCamera = useCallback((nextCamera) => {
    cameraRef.current = nextCamera;
    const center = {
      x: (size.width / 2 - nextCamera.position.x) / nextCamera.scale,
      y: (size.height / 2 - nextCamera.position.y) / nextCamera.scale,
    };
    onCenterChanged?.(center);
    if (!sameCamera(nextCamera, camera)) onCameraChange(nextCamera);
  }, [camera, onCameraChange, onCenterChanged, size.height, size.width]);

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
    cameraRef.current = camera;
    applyCameraToStage(camera);
  }, [applyCameraToStage, camera]);

  useEffect(() => () => {
    if (wheelTimerRef.current) window.clearTimeout(wheelTimerRef.current);
  }, []);

  useEffect(() => {
    if (fitSignal === lastFitSignalRef.current || size.width <= 1) return;
    lastFitSignalRef.current = fitSignal;
    const nextCamera = getFitCamera(nodes, size);
    cameraRef.current = nextCamera;
    applyCameraToStage(nextCamera);
    publishCamera(nextCamera);
  }, [applyCameraToStage, fitSignal, nodes, publishCamera, size]);

  const orderedNodes = useMemo(
    () => [...nodes].sort((left, right) => {
      const order = { universe: 0, saga: 1, book: 2 };
      return order[left.type] - order[right.type];
    }),
    [nodes],
  );

  const renderedNodes = useMemo(() => {
    if (size.width <= 1 || size.height <= 1) return orderedNodes;
    const scale = Math.max(camera.scale, 0.01);
    const margin = 520 / scale;
    const left = -camera.position.x / scale - margin;
    const top = -camera.position.y / scale - margin;
    const right = left + size.width / scale + margin * 2;
    const bottom = top + size.height / scale + margin * 2;
    return orderedNodes.filter((node) => (
      node.x >= left && node.x <= right && node.y >= top && node.y <= bottom
    ));
  }, [camera, orderedNodes, size]);

  const handleWheel = (event) => {
    event.evt.preventDefault();
    const stage = stageRef.current;
    const pointer = stage?.getPointerPosition();
    if (!stage || !pointer) return;

    const current = cameraRef.current;
    const worldPoint = {
      x: (pointer.x - current.position.x) / current.scale,
      y: (pointer.y - current.position.y) / current.scale,
    };
    const factor = event.evt.deltaY > 0 ? 0.92 : 1.087;
    const scale = clamp(current.scale * factor, 0.22, 2.6);
    const nextCamera = {
      scale,
      position: {
        x: pointer.x - worldPoint.x * scale,
        y: pointer.y - worldPoint.y * scale,
      },
    };

    cameraRef.current = nextCamera;
    applyCameraToStage(nextCamera);

    if (wheelTimerRef.current) window.clearTimeout(wheelTimerRef.current);
    wheelTimerRef.current = window.setTimeout(() => publishCamera(cameraRef.current), 90);
  };

  const startPan = (event) => {
    if (event.target !== stageRef.current) return;
    onSelectNode(null);
    const current = cameraRef.current;
    panRef.current = {
      x: event.evt.clientX - current.position.x,
      y: event.evt.clientY - current.position.y,
    };
  };

  const movePan = (event) => {
    if (!panRef.current) return;
    const nextCamera = {
      scale: cameraRef.current.scale,
      position: {
        x: event.evt.clientX - panRef.current.x,
        y: event.evt.clientY - panRef.current.y,
      },
    };
    cameraRef.current = nextCamera;
    applyCameraToStage(nextCamera);
  };

  const finishPan = () => {
    if (!panRef.current) return;
    panRef.current = null;
    publishCamera(cameraRef.current);
  };

  return (
    <div ref={containerRef} className="bv-canvas-stage">
      <Stage
        ref={stageRef}
        width={size.width}
        height={size.height}
        onWheel={handleWheel}
        onMouseDown={startPan}
        onMouseMove={movePan}
        onMouseUp={finishPan}
        onMouseLeave={finishPan}
      >
        <Layer listening={false} perfectDrawEnabled={false}>
          <ConnectionLines nodes={renderedNodes} />
        </Layer>
        <Layer>
          {renderedNodes.map((node) => (
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

const NodeGroup = memo(function NodeGroup({ node, selected, stageScale, onSelect, onMove, onEnter }) {
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
      onDragEnd={(event) => onMove(node.id, { x: event.target.x(), y: event.target.y() })}
      onMouseEnter={() => {
        setHovered(true);
        document.body.style.cursor = "pointer";
        groupRef.current?.to({ scaleX: 1.035, scaleY: 1.035, duration: 0.12 });
      }}
      onMouseLeave={() => {
        setHovered(false);
        document.body.style.cursor = "default";
        groupRef.current?.to({ scaleX: 1, scaleY: 1, duration: 0.12 });
      }}
    >
      <NodeVisual node={node} selected={selected} hovered={hovered} stageScale={stageScale} />
      {hovered && stageScale >= 0.55 ? <NodeTooltip node={node} /> : null}
    </Group>
  );
}, (previous, next) => (
  previous.node === next.node
  && previous.selected === next.selected
  && previous.stageScale === next.stageScale
));
