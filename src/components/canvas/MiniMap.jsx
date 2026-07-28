import { useMemo } from "react";
import { Circle, Layer, Rect, Stage } from "react-konva";
import { getNodeColor } from "./nodeUtils.js";

export default function MiniMap({ nodes, camera, onJump }) {
  const width = 196;
  const height = 126;
  const padding = 18;

  const world = useMemo(() => {
    if (!nodes.length) return { minX: -300, minY: -200, maxX: 300, maxY: 200 };
    const xs = nodes.map((node) => node.x);
    const ys = nodes.map((node) => node.y);
    return {
      minX: Math.min(...xs) - 180,
      minY: Math.min(...ys) - 160,
      maxX: Math.max(...xs) + 180,
      maxY: Math.max(...ys) + 160,
    };
  }, [nodes]);

  const scale = Math.min(
    (width - padding * 2) / Math.max(1, world.maxX - world.minX),
    (height - padding * 2) / Math.max(1, world.maxY - world.minY),
  );

  const toMini = (x, y) => ({
    x: padding + (x - world.minX) * scale,
    y: padding + (y - world.minY) * scale,
  });

  const handleJump = (event) => {
    const pointer = event.target.getStage()?.getPointerPosition();
    if (!pointer) return;
    const worldX = world.minX + (pointer.x - padding) / scale;
    const worldY = world.minY + (pointer.y - padding) / scale;
    onJump({ x: worldX, y: worldY });
  };

  const cameraPoint = toMini(
    -camera.position.x / camera.scale,
    -camera.position.y / camera.scale,
  );

  return (
    <div className="bv-minimap" title="Clica per moure la càmera">
      <div className="bv-minimap__label">OVERVIEW</div>
      <Stage width={width} height={height} onMouseDown={handleJump}>
        <Layer>
          <Rect x={0} y={0} width={width} height={height} fill="rgba(8,10,20,0.96)" />
          {nodes.map((node) => {
            const point = toMini(node.x, node.y);
            return (
              <Circle
                key={node.id}
                x={point.x}
                y={point.y}
                radius={node.type === "universe" ? 4.2 : node.type === "saga" ? 3.3 : 2.2}
                fill={getNodeColor(node)}
                opacity={0.92}
                listening={false}
              />
            );
          })}
          <Circle x={cameraPoint.x} y={cameraPoint.y} radius={6} stroke="#fff" strokeWidth={1.2} opacity={0.75} listening={false} />
        </Layer>
      </Stage>
    </div>
  );
}
