export const SCHEMA_VERSION = 2;
export const AUTOSAVE_KEY = "bookverse-library-v2";
export const LEGACY_AUTOSAVE_KEY = "story-map-autosave-v1";

const DERIVED_KEYS = new Set([
  "totalBooks",
  "readBooks",
  "progressPercent",
  "sagaRatingAvg",
  "sagaRatingCount",
  "sagaRatingDist",
  "universeSagaCount",
  "universeBookCount",
]);

const VALID_TYPES = new Set(["universe", "saga", "book"]);
const BOOK_STATUSES = new Set([
  "pendent",
  "en-lectura",
  "pausat",
  "abandonat",
  "completat",
]);
const SAGA_STATUSES = new Set([
  "no-comencada",
  "en-lectura",
  "pausada",
  "acabada",
]);

export const GENRES = [
  { value: "fantasia", label: "Fantasia" },
  { value: "ciencia-ficcio", label: "Ciència-ficció" },
  { value: "romantica", label: "Romàntica" },
  { value: "thriller", label: "Thriller" },
  { value: "misteri", label: "Misteri" },
  { value: "historica", label: "Històrica" },
  { value: "terror", label: "Terror" },
  { value: "assaig", label: "Assaig" },
  { value: "classics", label: "Clàssics" },
  { value: "altres", label: "Altres" },
];

export const BOOK_STATUS_OPTIONS = [
  { value: "pendent", label: "Pendent" },
  { value: "en-lectura", label: "En lectura" },
  { value: "pausat", label: "Pausat" },
  { value: "abandonat", label: "Abandonat" },
  { value: "completat", label: "Completat" },
];

export function makeId(prefix = "node") {
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now().toString(36)}-${random}`;
}

export function normalizeText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function uniqueTags(tags) {
  const values = Array.isArray(tags)
    ? tags
    : String(tags || "")
        .split(",")
        .map((tag) => tag.trim());

  return [...new Set(values.filter(Boolean))];
}

function numberOr(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function stringOrNull(value) {
  const clean = String(value ?? "").trim();
  return clean || null;
}

function stripDerived(node) {
  return Object.fromEntries(
    Object.entries(node || {}).filter(([key]) => !DERIVED_KEYS.has(key)),
  );
}

function baseNode(node, index) {
  const clean = stripDerived(node);
  const type = VALID_TYPES.has(clean.type) ? clean.type : "book";
  const id = stringOrNull(clean.id) || makeId(type);

  return {
    ...clean,
    id,
    type,
    x: numberOr(clean.x, (index % 6) * 190),
    y: numberOr(clean.y, Math.floor(index / 6) * 160),
    title:
      String(clean.title || "").trim() ||
      (type === "universe"
        ? "Univers sense títol"
        : type === "saga"
          ? "Saga sense títol"
          : "Llibre sense títol"),
    author: String(clean.author || "").trim(),
    genre: String(clean.genre || "altres"),
    notes: String(clean.notes || ""),
    tags: uniqueTags(clean.tags),
    cover: stringOrNull(clean.cover),
  };
}

export function normalizeLibrary(rawNodes = []) {
  const source = Array.isArray(rawNodes) ? rawNodes.filter(Boolean) : [];
  const provisional = source.map(baseNode);

  const usedIds = new Set();
  const unique = provisional.map((node) => {
    let id = node.id;
    while (usedIds.has(id)) id = makeId(node.type);
    usedIds.add(id);
    return id === node.id ? node : { ...node, id };
  });

  const byId = new Map(unique.map((node) => [node.id, node]));

  const normalized = unique.map((node) => {
    if (node.type === "universe") {
      return {
        ...node,
        author: node.author || "",
        status: "actiu",
      };
    }

    if (node.type === "saga") {
      const universeId = stringOrNull(node.universeId);
      return {
        ...node,
        universeId:
          universeId && byId.get(universeId)?.type === "universe"
            ? universeId
            : null,
        status: SAGA_STATUSES.has(node.status)
          ? node.status
          : node.status === "completat"
            ? "acabada"
            : "no-comencada",
      };
    }

    const parentSagaId = stringOrNull(node.parentSagaId);
    const parentSaga = parentSagaId ? byId.get(parentSagaId) : null;
    const universeId = stringOrNull(node.universeId);

    return {
      ...node,
      parentSagaId: parentSaga?.type === "saga" ? parentSaga.id : null,
      universeId:
        parentSaga?.type === "saga"
          ? stringOrNull(parentSaga.universeId)
          : universeId && byId.get(universeId)?.type === "universe"
            ? universeId
            : null,
      volume: numberOr(node.volume, 1),
      volumeLabel: String(node.volumeLabel || ""),
      rating: Math.max(0, Math.min(5, numberOr(node.rating, 0))),
      status: BOOK_STATUSES.has(node.status)
        ? node.status
        : node.status === "acabada"
          ? "completat"
          : "pendent",
      startDate: String(node.startDate || ""),
      endDate: String(node.endDate || ""),
      dateAdded: String(node.dateAdded || ""),
      pageCount: Math.max(0, numberOr(node.pageCount, 0)),
      publicationYear: numberOr(node.publicationYear, 0) || null,
      originalPublicationYear:
        numberOr(node.originalPublicationYear, 0) || null,
      externalIds:
        node.externalIds && typeof node.externalIds === "object"
          ? { ...node.externalIds }
          : {},
      additionalAuthors: String(node.additionalAuthors || ""),
      isbn: stringOrNull(node.isbn),
      isbn13: stringOrNull(node.isbn13),
      publisher: String(node.publisher || ""),
      binding: String(node.binding || ""),
      review: String(node.review || ""),
      readCount: Math.max(0, numberOr(node.readCount, 0)),
      ownedCopies: Math.max(0, numberOr(node.ownedCopies, 0)),
    };
  });

  const normalizedById = new Map(normalized.map((node) => [node.id, node]));

  return normalized.map((node) => {
    if (node.type !== "book" || !node.parentSagaId) return node;
    const saga = normalizedById.get(node.parentSagaId);
    return {
      ...node,
      universeId: saga?.type === "saga" ? saga.universeId || null : null,
    };
  });
}

export function deriveSagaStats(nodes, sagaId) {
  const books = nodes.filter(
    (node) => node.type === "book" && node.parentSagaId === sagaId,
  );
  const completed = books.filter((book) => book.status === "completat");
  const rated = books.filter((book) => Number(book.rating) > 0);
  const ratingTotal = rated.reduce((sum, book) => sum + Number(book.rating), 0);
  const dist = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  rated.forEach((book) => {
    const rounded = Math.max(0, Math.min(5, Math.round(book.rating)));
    dist[rounded] += 1;
  });

  const totalBooks = books.length;
  const readBooks = completed.length;
  const progressPercent = totalBooks
    ? Math.round((readBooks / totalBooks) * 100)
    : 0;

  let status = "no-comencada";
  if (books.some((book) => book.status === "pausat")) status = "pausada";
  if (books.some((book) => book.status === "en-lectura")) status = "en-lectura";
  if (readBooks > 0 && readBooks < totalBooks) status = "en-lectura";
  if (totalBooks > 0 && readBooks === totalBooks) status = "acabada";

  return {
    totalBooks,
    readBooks,
    progressPercent,
    status,
    sagaRatingAvg: rated.length
      ? Number((ratingTotal / rated.length).toFixed(2))
      : 0,
    sagaRatingCount: rated.length,
    sagaRatingDist: dist,
  };
}

export function enrichLibrary(nodes) {
  const clean = normalizeLibrary(nodes);

  const sagaStats = new Map(
    clean
      .filter((node) => node.type === "saga")
      .map((saga) => [saga.id, deriveSagaStats(clean, saga.id)]),
  );

  const universeStats = new Map(
    clean
      .filter((node) => node.type === "universe")
      .map((universe) => {
        const sagaIds = clean
          .filter(
            (node) =>
              node.type === "saga" && node.universeId === universe.id,
          )
          .map((saga) => saga.id);
        const universeBookCount = clean.filter(
          (node) =>
            node.type === "book" &&
            (node.universeId === universe.id ||
              sagaIds.includes(node.parentSagaId)),
        ).length;

        return [
          universe.id,
          {
            universeSagaCount: sagaIds.length,
            universeBookCount,
          },
        ];
      }),
  );

  return clean.map((node) => {
    if (node.type === "saga") return { ...node, ...sagaStats.get(node.id) };
    if (node.type === "universe") {
      return { ...node, ...universeStats.get(node.id) };
    }
    return node;
  });
}

export function createNode(type, position, context = {}, nodes = []) {
  const x = numberOr(position?.x, 0);
  const y = numberOr(position?.y, 0);
  const id = makeId(type);

  if (type === "universe") {
    return {
      id,
      type,
      x,
      y,
      title: "Nou univers",
      author: "",
      genre: "altres",
      status: "actiu",
      notes: "",
      tags: [],
      cover: null,
    };
  }

  if (type === "saga") {
    return {
      id,
      type,
      x,
      y,
      title: "Nova saga",
      author: "",
      genre: "fantasia",
      status: "no-comencada",
      universeId:
        context.mode === "universe" ? context.universeId || null : null,
      notes: "",
      tags: [],
      cover: null,
    };
  }

  const parentSagaId =
    context.mode === "saga" ? context.sagaId || null : null;
  const parentSaga = nodes.find(
    (node) => node.type === "saga" && node.id === parentSagaId,
  );
  const universeId = parentSaga
    ? parentSaga.universeId || null
    : context.mode === "universe"
      ? context.universeId || null
      : null;

  return {
    id,
    type: "book",
    x,
    y,
    title: "Nou llibre",
    author: "",
    genre: "altres",
    status: "pendent",
    parentSagaId,
    universeId,
    volume: 1,
    volumeLabel: "",
    rating: 0,
    startDate: "",
    endDate: "",
    dateAdded: "",
    notes: "",
    tags: [],
    cover: null,
    externalIds: {},
  };
}

export function applyNodeUpdate(nodes, updatedNode) {
  const cleanNodes = normalizeLibrary(nodes);
  const previous = cleanNodes.find((node) => node.id === updatedNode?.id);
  if (!previous) return cleanNodes;

  let next = stripDerived({ ...previous, ...updatedNode });

  if (next.type === "book") {
    const saga = next.parentSagaId
      ? cleanNodes.find(
          (node) => node.type === "saga" && node.id === next.parentSagaId,
        )
      : null;

    next = {
      ...next,
      parentSagaId: saga?.id || null,
      universeId: saga ? saga.universeId || null : next.universeId || null,
      tags: uniqueTags(next.tags),
    };
  }

  if (next.type === "saga") {
    const validUniverse = next.universeId
      ? cleanNodes.some(
          (node) =>
            node.type === "universe" && node.id === next.universeId,
        )
      : false;
    next = {
      ...next,
      universeId: validUniverse ? next.universeId : null,
      tags: uniqueTags(next.tags),
    };
  }

  let result = cleanNodes.map((node) =>
    node.id === next.id ? next : node,
  );

  if (next.type === "saga" && previous.universeId !== next.universeId) {
    result = result.map((node) =>
      node.type === "book" && node.parentSagaId === next.id
        ? { ...node, universeId: next.universeId || null }
        : node,
    );
  }

  return normalizeLibrary(result);
}

export function updateNodePosition(nodes, nodeId, position) {
  return normalizeLibrary(nodes).map((node) =>
    node.id === nodeId
      ? { ...node, x: numberOr(position.x, node.x), y: numberOr(position.y, node.y) }
      : node,
  );
}

export function deleteNodeCascade(nodes, nodeId) {
  const clean = normalizeLibrary(nodes);
  const target = clean.find((node) => node.id === nodeId);
  if (!target) return clean;

  const ids = new Set([target.id]);

  if (target.type === "universe") {
    const sagaIds = clean
      .filter(
        (node) => node.type === "saga" && node.universeId === target.id,
      )
      .map((saga) => saga.id);

    sagaIds.forEach((id) => ids.add(id));
    clean.forEach((node) => {
      if (
        node.type === "book" &&
        (node.universeId === target.id || sagaIds.includes(node.parentSagaId))
      ) {
        ids.add(node.id);
      }
    });
  }

  if (target.type === "saga") {
    clean.forEach((node) => {
      if (node.type === "book" && node.parentSagaId === target.id) {
        ids.add(node.id);
      }
    });
  }

  return clean.filter((node) => !ids.has(node.id));
}

export function filterNodes(nodes, query = "", filters = {}) {
  const needle = normalizeText(query);
  return nodes.filter((node) => {
    const haystack = normalizeText(
      `${node.title} ${node.author || ""} ${(node.tags || []).join(" ")}`,
    );
    const matchesQuery = !needle || haystack.includes(needle);
    const matchesGenre =
      !filters.genre || filters.genre === "tots" || node.genre === filters.genre;
    const matchesStatus =
      !filters.status ||
      filters.status === "tots" ||
      node.status === filters.status;
    const matchesType =
      !filters.type || filters.type === "tots" || node.type === filters.type;
    return matchesQuery && matchesGenre && matchesStatus && matchesType;
  });
}

export function getVisibleNodes(nodes, view, query = "", filters = {}) {
  const filtered = filterNodes(nodes, query, filters);
  const hasCriteria =
    Boolean(normalizeText(query)) ||
    [filters.type, filters.genre, filters.status].some(
      (value) => value && value !== "tots",
    );

  const includeAncestors = (matches, scopeIds = null) => {
    const ids = new Set(matches.map((node) => node.id));
    matches.forEach((node) => {
      if (node.type === "book") {
        if (node.parentSagaId) ids.add(node.parentSagaId);
        if (node.universeId) ids.add(node.universeId);
      }
      if (node.type === "saga" && node.universeId) ids.add(node.universeId);
    });
    return nodes.filter(
      (node) => ids.has(node.id) && (!scopeIds || scopeIds.has(node.id)),
    );
  };

  if (view.mode === "universe" && view.universeId) {
    const sagaIds = nodes
      .filter(
        (node) =>
          node.type === "saga" && node.universeId === view.universeId,
      )
      .map((saga) => saga.id);
    const scope = nodes.filter(
      (node) =>
        (node.type === "universe" && node.id === view.universeId) ||
        (node.type === "saga" && node.universeId === view.universeId) ||
        (node.type === "book" &&
          (node.universeId === view.universeId ||
            sagaIds.includes(node.parentSagaId))),
    );

    if (!hasCriteria) return scope;
    const scopeIds = new Set(scope.map((node) => node.id));
    const matches = filtered.filter((node) => scopeIds.has(node.id));
    if (!matches.length) return [];
    return includeAncestors(matches, scopeIds);
  }

  if (view.mode === "saga" && view.sagaId) {
    const scope = nodes.filter(
      (node) =>
        (node.type === "saga" && node.id === view.sagaId) ||
        (node.type === "book" && node.parentSagaId === view.sagaId),
    );
    if (!hasCriteria) return scope;
    const scopeIds = new Set(scope.map((node) => node.id));
    const matches = filtered.filter((node) => scopeIds.has(node.id));
    if (!matches.length) return [];
    return includeAncestors(matches, scopeIds);
  }

  if (hasCriteria) {
    return filtered.length ? includeAncestors(filtered) : [];
  }

  return nodes.filter(
    (node) =>
      node.type === "universe" ||
      (node.type === "saga" && !node.universeId) ||
      (node.type === "book" && !node.parentSagaId && !node.universeId),
  );
}

export function getParentView(nodes, view) {
  if (view.mode === "saga" && view.sagaId) {
    const saga = nodes.find(
      (node) => node.type === "saga" && node.id === view.sagaId,
    );
    if (saga?.universeId) {
      return { mode: "universe", universeId: saga.universeId, sagaId: null };
    }
  }
  return { mode: "global", universeId: null, sagaId: null };
}

export function getBreadcrumbs(nodes, view) {
  const crumbs = [{ id: "global", label: "Biblioteca", view: { mode: "global" } }];

  if (view.mode === "universe" && view.universeId) {
    const universe = nodes.find((node) => node.id === view.universeId);
    if (universe) {
      crumbs.push({
        id: universe.id,
        label: universe.title,
        view: { mode: "universe", universeId: universe.id },
      });
    }
  }

  if (view.mode === "saga" && view.sagaId) {
    const saga = nodes.find((node) => node.id === view.sagaId);
    if (saga?.universeId) {
      const universe = nodes.find((node) => node.id === saga.universeId);
      if (universe) {
        crumbs.push({
          id: universe.id,
          label: universe.title,
          view: { mode: "universe", universeId: universe.id },
        });
      }
    }
    if (saga) {
      crumbs.push({
        id: saga.id,
        label: saga.title,
        view: { mode: "saga", sagaId: saga.id },
      });
    }
  }

  return crumbs;
}

export function migratePayload(payload) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const nodes = normalizeLibrary(payload.nodes || []);
  if (!nodes.length) return null;

  const state = payload.state || {};
  const mode = ["global", "universe", "saga"].includes(state.viewMode)
    ? state.viewMode
    : ["global", "universe", "saga"].includes(state.view?.mode)
      ? state.view.mode
      : "global";

  return {
    version: SCHEMA_VERSION,
    nodes,
    state: {
      view: {
        mode,
        universeId:
          state.currentUniverseId || state.view?.universeId || null,
        sagaId: state.currentSagaId || state.view?.sagaId || null,
      },
      selectedNodeId: state.selectedNodeId || null,
      camera: state.canvasView || state.camera || {
        scale: 1,
        position: { x: 0, y: 0 },
      },
    },
  };
}

export function createAutosavePayload(nodes, state = {}) {
  return {
    version: SCHEMA_VERSION,
    savedAt: new Date().toISOString(),
    state,
    nodes: normalizeLibrary(nodes),
  };
}

export function getLibraryStats(nodes) {
  const books = nodes.filter((node) => node.type === "book");
  const ratings = books.filter((book) => book.rating > 0);
  const pages = books.reduce((sum, book) => sum + (book.pageCount || 0), 0);

  return {
    universes: nodes.filter((node) => node.type === "universe").length,
    sagas: nodes.filter((node) => node.type === "saga").length,
    books: books.length,
    completed: books.filter((book) => book.status === "completat").length,
    reading: books.filter((book) => book.status === "en-lectura").length,
    pages,
    averageRating: ratings.length
      ? Number(
          (
            ratings.reduce((sum, book) => sum + book.rating, 0) /
            ratings.length
          ).toFixed(2),
        )
      : 0,
  };
}
