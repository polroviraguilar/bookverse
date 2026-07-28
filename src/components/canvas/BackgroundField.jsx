import { useEffect, useMemo, useRef } from "react";
import Konva from "konva";
import { Circle, Group, Rect } from "react-konva";

function createStars(count, bounds) {
  return Array.from({ length: count }, (_, index) => ({
    id: index,
    x: (Math.random() - 0.5) * bounds * 2,
    y: (Math.random() - 0.5) * bounds * 2,
    radius: Math.random() * 1.35 + 0.35,
    opacity: Math.random() * 0.38 + 0.08,
    phase: Math.random() * Math.PI * 2,
    speed: Math.random() * 0.45 + 0.15,
  }));
}

export default function BackgroundField({ bounds = 9000 }) {
  const groupRef = useRef(null);
  const starRefs = useRef([]);
  const stars = useMemo(() => createStars(380, bounds), [bounds]);

  useEffect(() => {
    const layer = groupRef.current?.getLayer();
    if (!layer) return undefined;
    const animation = new Konva.Animation((frame) => {
      const time = frame.time / 1000;
      stars.forEach((star, index) => {
        const node = starRefs.current[index];
        if (!node) return;
        node.opacity(Math.max(0.04, star.opacity + Math.sin(time * star.speed + star.phase) * 0.09));
      });
    }, layer);
    animation.start();
    return () => animation.stop();
  }, [stars]);

  return (
    <Group ref={groupRef} listening={false}>
      <Rect x={-bounds} y={-bounds} width={bounds * 2} height={bounds * 2} fill="#050711" />
      <Rect
        x={-bounds}
        y={-bounds}
        width={bounds * 2}
        height={bounds * 2}
        fillRadialGradientStartPoint={{ x: 0, y: 0 }}
        fillRadialGradientStartRadius={0}
        fillRadialGradientEndPoint={{ x: 0, y: 0 }}
        fillRadialGradientEndRadius={bounds * 0.8}
        fillRadialGradientColorStops={[0, "rgba(62,44,106,0.22)", 0.45, "rgba(13,17,31,0.08)", 1, "rgba(5,7,17,0)"]}
      />
      {stars.map((star, index) => (
        <Circle
          key={star.id}
          ref={(node) => { starRefs.current[index] = node; }}
          x={star.x}
          y={star.y}
          radius={star.radius}
          fill="#f4f0ff"
          opacity={star.opacity}
          shadowColor="#b9a5ff"
          shadowBlur={star.radius > 1.1 ? 5 : 0}
          perfectDrawEnabled={false}
        />
      ))}
    </Group>
  );
}
