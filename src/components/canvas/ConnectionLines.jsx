import { useEffect, useMemo, useRef } from "react";
import Konva from "konva";
import { Group, Line } from "react-konva";

function getConnections(nodes) {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const lines = [];

  nodes.forEach((node) => {
    if (node.type === "saga" && node.universeId) {
      const parent = byId.get(node.universeId);
      if (parent) lines.push({ id: `${parent.id}-${node.id}`, from: parent, to: node, kind: "universe" });
    }
    if (node.type === "book" && node.parentSagaId) {
      const parent = byId.get(node.parentSagaId);
      if (parent) lines.push({ id: `${parent.id}-${node.id}`, from: parent, to: node, kind: "saga" });
    }
    if (node.type === "book" && !node.parentSagaId && node.universeId) {
      const parent = byId.get(node.universeId);
      if (parent) lines.push({ id: `${parent.id}-${node.id}`, from: parent, to: node, kind: "universe" });
    }
  });

  return lines;
}

export default function ConnectionLines({ nodes }) {
  const groupRef = useRef(null);
  const lineRefs = useRef([]);
  const connections = useMemo(() => getConnections(nodes), [nodes]);

  useEffect(() => {
    const layer = groupRef.current?.getLayer();
    if (!layer) return undefined;
    const animation = new Konva.Animation((frame) => {
      lineRefs.current.forEach((line, index) => {
        if (line) line.dashOffset(-(frame.time * (index % 2 ? 0.014 : 0.01)));
      });
    }, layer);
    animation.start();
    return () => animation.stop();
  }, [connections.length]);

  return (
    <Group ref={groupRef} listening={false}>
      {connections.map((connection, index) => {
        const universe = connection.kind === "universe";
        return (
          <Line
            key={connection.id}
            ref={(node) => { lineRefs.current[index] = node; }}
            points={[connection.from.x, connection.from.y, connection.to.x, connection.to.y]}
            stroke={universe ? "#d9bc76" : "#8f80bd"}
            strokeWidth={universe ? 1.8 : 1.35}
            opacity={universe ? 0.44 : 0.34}
            dash={universe ? [10, 14] : [6, 12]}
            lineCap="round"
            shadowColor={universe ? "#d9bc76" : "#8f80bd"}
            shadowBlur={universe ? 8 : 5}
            shadowOpacity={0.28}
          />
        );
      })}
    </Group>
  );
}
