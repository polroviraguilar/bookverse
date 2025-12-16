export const NODE_SIZES = {
  universe: 90,
  saga: 62,
  book: 42,
};

export function getGenreColor(genre) {
  switch (genre) {
    case "fantasia":
      return "#7c3aed";
    case "ciencia-ficcio":
      return "#2563eb";
    case "romantica":
      return "#db2777";
    case "thriller":
      return "#b91c1c";
    default:
      return "#475569";
  }
}

export function getNodeRadius(type) {
  return NODE_SIZES[type] || NODE_SIZES.book;
}

export const getOrbitRingCount = (type) => {
  if (type === "universe") return 3;
  if (type === "saga") return 1;
  return 0; // llibre
};

// pots posar-ho a nodeUtils.js o constants visuals
export const ORBIT_COLORS = {
  universe: {
    stroke: "#facc15",      // daurat
    shadow: "#fde047",
  },
  saga: {
    stroke: "#e5e7eb",      // platejat
    shadow: "#cbd5f5",
  },
};

