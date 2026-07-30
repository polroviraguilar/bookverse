import { memo, useMemo } from "react";
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

function ConnectionLines({ nodes }) {
  const connections = useMemo(() => getConnections(nodes), [nodes]);

  return (
    <Group listening={false} perfectDrawEnabled={false}>
      {connections.map((connection) => {
        const universe = connection.kind === "universe";
        return (
          <Line
            key={connection.id}
            points={[connection.from.x, connection.from.y, connection.to.x, connection.to.y]}
            stroke={universe ? "#d9bc76" : "#8f80bd"}
            strokeWidth={universe ? 1.6 : 1.2}
            opacity={universe ? 0.38 : 0.28}
            dash={universe ? [10, 14] : [6, 12]}
            lineCap="round"
            listening={false}
            perfectDrawEnabled={false}
            shadowForStrokeEnabled={false}
          />
        );
      })}
    </Group>
  );
}

export default memo(ConnectionLines);
