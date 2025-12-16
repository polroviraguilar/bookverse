import { useEffect, useRef } from "react";
import Konva from "konva";
import { Group, Circle } from "react-konva";
import { ORBIT_COLORS } from "./nodeUtils";

function OrbitingRings({ count, radius, nodeType }) {
  const groupRef = useRef(null);

  useEffect(() => {
    if (!groupRef.current) return;

    const layer = groupRef.current.getLayer();
    if (!layer) return;

    const anim = new Konva.Animation((frame) => {
      const speed = 0.002; // rotació lenta
      groupRef.current.rotation(frame.time * speed);
    }, layer);

    anim.start();
    return () => anim.stop();
  }, []);

  if (!count || count <= 0) return null;

  const color =
    nodeType === "universe"
      ? ORBIT_COLORS.universe
      : nodeType === "saga"
      ? ORBIT_COLORS.saga
      : null;

  if (!color) return null;

  return (
    <Group ref={groupRef}>
      {Array.from({ length: count }).map((_, i) => (
        <Circle
          key={i}
          x={0}
          y={0}
          radius={radius + 12 + i * 12}
          stroke={color.stroke}
          strokeWidth={1}
          dash={[6, 6]}
          opacity={0.65}
          shadowColor={color.shadow}
          shadowBlur={8}
          shadowOpacity={0.6}
          listening={false}
        />
      ))}
    </Group>
  );
}

export default OrbitingRings;
