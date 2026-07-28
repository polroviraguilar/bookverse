export const NODE_RADII = {
  universe: 76,
  saga: 62,
  book: 48,
};

export const GENRE_COLORS = {
  fantasia: "#9b7bff",
  "ciencia-ficcio": "#4fd1ff",
  romantica: "#ff6fae",
  thriller: "#ff6b72",
  misteri: "#bfa6ff",
  historica: "#d8a763",
  terror: "#bf5d73",
  assaig: "#68d5c2",
  classics: "#e4c78d",
  altres: "#9aa8bd",
};

export const TYPE_COLORS = {
  universe: "#e9c878",
  saga: "#9b7bff",
  book: "#6bd5ff",
};

export function getNodeRadius(type) {
  return NODE_RADII[type] || NODE_RADII.book;
}

export function getNodeColor(node) {
  if (node.type === "universe") return TYPE_COLORS.universe;
  return GENRE_COLORS[node.genre] || TYPE_COLORS[node.type] || TYPE_COLORS.book;
}

export function getStatusLabel(status) {
  const labels = {
    pendent: "Pendent",
    "en-lectura": "En lectura",
    pausat: "Pausat",
    pausada: "Pausada",
    abandonat: "Abandonat",
    completat: "Completat",
    acabada: "Acabada",
    "no-comencada": "No començada",
    actiu: "Actiu",
  };
  return labels[status] || status || "Sense estat";
}
