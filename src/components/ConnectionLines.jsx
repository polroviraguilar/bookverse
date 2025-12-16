import React, { useMemo } from "react";
import AnimatedLine from "./AnimatedLine";

const buildLines = (nodes) => {
  const result = [];

  const universes = nodes.filter(n => n.type === "universe");
  const sagas = nodes.filter(n => n.type === "saga");
  const books = nodes.filter(n => n.type === "book");

  // 🌌 Univers → Sagues
  universes.forEach(universe => {
    sagas.forEach(saga => {
      if (saga.universeId === universe.id) {
        result.push({
          key: `u-s-${universe.id}-${saga.id}`,
          from: universe,
          to: saga,
          style: LINE_STYLES.universeSaga,
        });
      }
    });
  });

  // 🌌 Univers → Llibres standalone
  universes.forEach(universe => {
    books.forEach(book => {
      if (book.universeId === universe.id && !book.parentSagaId) {
        result.push({
          key: `u-b-${universe.id}-${book.id}`,
          from: universe,
          to: book,
          style: LINE_STYLES.universeSaga,
        });
      }
    });
  });

  // 📚 Saga → Llibres
  sagas.forEach(saga => {
    books.forEach(book => {
      if (book.parentSagaId === saga.id) {
        result.push({
          key: `s-b-${saga.id}-${book.id}`,
          from: saga,
          to: book,
          style: LINE_STYLES.sagaBook,
        });
      }
    });
  });

  return result;
};

const LINE_STYLES = {
  universeSaga: {
    stroke: "#facc15",
    shadowColor: "#fde047",
    opacity: 0.55,
    dash: [8, 10],
    strokeWidth: 2.2,
  },
  sagaBook: {
    stroke: "#e5e7eb",
    shadowColor: "#cbd5f5",
    opacity: 0.45,
    dash: [6, 12],
    strokeWidth: 1.8,
  },
};

const ConnectionLines = React.memo(function ConnectionLines({ nodes, transition, centerWorld }) {

const { normalLines, fromLines, toLines } = useMemo(() => {
  if (!transition?.active) {
    return {
      normalLines: buildLines(nodes),
      fromLines: [],
      toLines: [],
    };
  }

  return {
    normalLines: [],
    fromLines: buildLines(transition.fromNodes),
    toLines: buildLines(transition.toNodes),
  };
}, [nodes, transition]);

  return (
    <>
  {/* LÍNIES NORMALS */}
  {normalLines.map(l => (
    <AnimatedLine
      key={l.key}
      points={[
        l.from.x,
        l.from.y,
        l.to.x,
        l.to.y,
      ]}
      style={l.style}
    />
  ))}

  {/* TRANSICIÓ */}
  {transition?.active && (
    <>
      {/* SORTINTS */}
      {fromLines.map(l => {
        const p = Math.max(0, transition.progress - 0.1) / 0.9;

        const cx =
          transition.direction === "exit"
            ? 0
            : centerWorld?.x ?? 0;
        const cy =
          transition.direction === "exit"
            ? 0
            : centerWorld?.y ?? 0;

        const fx = l.from.x + (cx - l.from.x) * p;
        const fy = l.from.y + (cy - l.from.y) * p;
        const tx = l.to.x + (cx - l.to.x) * p;
        const ty = l.to.y + (cy - l.to.y) * p;

        return (
          <AnimatedLine
            key={"from-" + l.key}
            points={[fx, fy, tx, ty]}
            style={{
              ...l.style,
              opacity: l.style.opacity * (1 - p),
            }}
          />
        );
      })}

      {/* ENTRANTS */}
      {toLines.map(l => {
        const p = transition.progress;

        const cx =
          transition.direction === "exit"
            ? 0
            : centerWorld?.x ?? 0;
        const cy =
          transition.direction === "exit"
            ? 0
            : centerWorld?.y ?? 0;

        const fx = cx + (l.from.x - cx) * p;
        const fy = cy + (l.from.y - cy) * p;
        const tx = cx + (l.to.x - cx) * p;
        const ty = cy + (l.to.y - cy) * p;

        return (
          <AnimatedLine
            key={"to-" + l.key}
            points={[fx, fy, tx, ty]}
            style={{
              ...l.style,
              opacity: l.style.opacity * p,
            }}
          />
        );
      })}
    </>
  )}
</>
  );
});

export default ConnectionLines;
