import { makeId, normalizeLibrary, normalizeText, uniqueTags } from "../domain/library.js";
import { parseCsv } from "./csv.js";

const REQUIRED_COLUMNS = ["Book Id", "Title", "Author", "Exclusive Shelf"];
const STATUS_SHELVES = new Set([
  "read",
  "to-read",
  "currently-reading",
  "paused",
  "abandoned",
]);

function cleanWrappedNumber(value) {
  const raw = String(value || "").trim();
  const unwrapped = raw.replace(/^="(.*)"$/, "$1").trim();
  return unwrapped || null;
}

function toNumber(value, fallback = 0) {
  const parsed = Number(String(value || "").trim());
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeDate(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const match = raw.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  if (!match) return "";
  const [, year, month, day] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function splitShelves(value) {
  return uniqueTags(
    String(value || "")
      .split(",")
      .map((shelf) => shelf.trim())
      .filter(Boolean),
  );
}

function inferGenre(shelves, title) {
  const haystack = normalizeText(`${shelves.join(" ")} ${title}`);
  const rules = [
    ["ciencia-ficcio", ["science fiction", "sci fi", "scifi", "space opera", "cyberpunk"]],
    ["fantasia", ["fantasy", "fantasia", "high fantasy", "urban fantasy"]],
    ["romantica", ["romance", "romantica", "love story"]],
    ["thriller", ["thriller", "suspense", "crime"]],
    ["misteri", ["mystery", "detective", "misteri"]],
    ["historica", ["historical", "history", "historica"]],
    ["terror", ["horror", "terror", "gothic"]],
    ["assaig", ["non fiction", "nonfiction", "essay", "philosophy", "biography"]],
    ["classics", ["classic", "classics", "clàssic", "clasico"]],
  ];

  return (
    rules.find(([, keywords]) =>
      keywords.some((keyword) => haystack.includes(normalizeText(keyword))),
    )?.[0] || "altres"
  );
}

function mapStatus(row) {
  const shelf = normalizeText(row["Exclusive Shelf"] || "");
  const dateRead = normalizeDate(row["Date Read"]);
  const readCount = toNumber(row["Read Count"], 0);

  // Goodreads pot mantenir Read Count > 0 en una relectura actual.
  // L'estat explícit de la prestatgeria té prioritat sobre el recompte.
  if (shelf === "currently reading") return "en-lectura";
  if (shelf === "paused") return "pausat";
  if (shelf === "abandoned") return "abandonat";
  if (dateRead || shelf === "read" || readCount > 0) return "completat";
  return "pendent";
}

export function parseSeriesTitle(rawTitle) {
  const title = String(rawTitle || "").trim();
  const parenthetical = title.match(/\(([^()]*)\)\s*$/);
  if (!parenthetical) {
    return {
      cleanTitle: title,
      seriesName: "",
      volume: null,
      volumeLabel: "",
      confidence: "none",
    };
  }

  const body = parenthetical[1].trim();
  const patterns = [
    /^(.*?),\s*#\s*([0-9]+(?:\.[0-9]+)?(?:\s*-\s*[0-9]+(?:\.[0-9]+)?)?)$/i,
    /^(.*?)\s*,?\s*(?:book|volume|vol\.?|tome)\s*#?\s*([0-9]+(?:\.[0-9]+)?)$/i,
    /^(.*?)\s+#\s*([0-9]+(?:\.[0-9]+)?)$/i,
  ];

  for (const pattern of patterns) {
    const match = body.match(pattern);
    if (!match) continue;
    const seriesName = match[1].trim().replace(/[,:;-]+$/, "").trim();
    const volumeLabel = match[2].replace(/\s+/g, "");
    const volume = Number.parseFloat(volumeLabel);
    if (!seriesName || !Number.isFinite(volume)) continue;

    return {
      cleanTitle: title.slice(0, parenthetical.index).trim(),
      seriesName,
      volume,
      volumeLabel,
      confidence: "high",
    };
  }

  return {
    cleanTitle: title,
    seriesName: "",
    volume: null,
    volumeLabel: "",
    confidence: "none",
  };
}

export function mapGoodreadsRow(row, index = 0) {
  const series = parseSeriesTitle(row.Title);
  const shelves = splitShelves(row.Bookshelves);
  const exclusiveShelf = String(row["Exclusive Shelf"] || "").trim();
  const retainedShelves = shelves.filter(
    (shelf) => !STATUS_SHELVES.has(normalizeText(shelf).replace(/ /g, "-")),
  );
  if (exclusiveShelf && !STATUS_SHELVES.has(exclusiveShelf)) {
    retainedShelves.push(exclusiveShelf);
  }

  return {
    importId: `goodreads-row-${index}`,
    selected: true,
    title: series.cleanTitle || String(row.Title || "").trim(),
    originalTitle: String(row.Title || "").trim(),
    author: String(row.Author || "").trim(),
    additionalAuthors: String(row["Additional Authors"] || "").trim(),
    genre: inferGenre(retainedShelves, row.Title),
    status: mapStatus(row),
    rating: Math.max(0, Math.min(5, toNumber(row["My Rating"], 0))),
    startDate: "",
    endDate: normalizeDate(row["Date Read"]),
    dateAdded: normalizeDate(row["Date Added"]),
    pageCount: Math.max(0, toNumber(row["Number of Pages"], 0)),
    publicationYear: toNumber(row["Year Published"], 0) || null,
    originalPublicationYear:
      toNumber(row["Original Publication Year"], 0) || null,
    publisher: String(row.Publisher || "").trim(),
    binding: String(row.Binding || "").trim(),
    isbn: cleanWrappedNumber(row.ISBN),
    isbn13: cleanWrappedNumber(row.ISBN13),
    review: String(row["My Review"] || "").trim(),
    notes: String(row["Private Notes"] || "").trim(),
    tags: uniqueTags(retainedShelves),
    readCount: Math.max(0, toNumber(row["Read Count"], 0)),
    ownedCopies: Math.max(0, toNumber(row["Owned Copies"], 0)),
    externalIds: {
      goodreads: String(row["Book Id"] || "").trim(),
    },
    seriesName: series.seriesName,
    seriesVolume: series.volume,
    seriesVolumeLabel: series.volumeLabel,
    seriesConfidence: series.confidence,
  };
}

export function parseGoodreadsCsv(text) {
  const rows = parseCsv(text);
  if (!rows.length) {
    throw new Error("El CSV no conté cap registre.");
  }

  const columns = Object.keys(rows[0]);
  const missing = REQUIRED_COLUMNS.filter((column) => !columns.includes(column));
  if (missing.length) {
    throw new Error(
      `Aquest fitxer no sembla un export de Goodreads. Falten les columnes: ${missing.join(", ")}.`,
    );
  }

  return rows.map(mapGoodreadsRow);
}

function findDuplicate(nodes, item) {
  const goodreadsId = item.externalIds?.goodreads;
  if (goodreadsId) {
    const byGoodreads = nodes.find(
      (node) =>
        node.type === "book" &&
        node.externalIds?.goodreads === goodreadsId,
    );
    if (byGoodreads) return byGoodreads;
  }

  if (item.isbn13) {
    const byIsbn13 = nodes.find(
      (node) => node.type === "book" && node.isbn13 === item.isbn13,
    );
    if (byIsbn13) return byIsbn13;
  }

  if (item.isbn) {
    const byIsbn = nodes.find(
      (node) => node.type === "book" && node.isbn === item.isbn,
    );
    if (byIsbn) return byIsbn;
  }

  const key = `${normalizeText(item.title)}|${normalizeText(item.author)}`;
  return nodes.find(
    (node) =>
      node.type === "book" &&
      `${normalizeText(node.title)}|${normalizeText(node.author)}` === key,
  );
}

function mergeTags(left, right) {
  return uniqueTags([...(left || []), ...(right || [])]);
}

function createSeriesMap(nodes, selectedItems, targetUniverseId, origin) {
  const result = new Map();
  const existingSagas = nodes.filter((node) => node.type === "saga");
  const seriesNames = [
    ...new Set(
      selectedItems
        .map((item) => item.seriesName.trim())
        .filter(Boolean),
    ),
  ];

  seriesNames.forEach((seriesName, index) => {
    const existing = existingSagas.find(
      (saga) =>
        normalizeText(saga.title) === normalizeText(seriesName) &&
        (targetUniverseId ? saga.universeId === targetUniverseId : true),
    );

    if (existing) {
      result.set(normalizeText(seriesName), existing);
      return;
    }

    const columns = Math.max(1, Math.ceil(Math.sqrt(seriesNames.length)));
    const row = Math.floor(index / columns);
    const column = index % columns;
    const saga = {
      id: makeId("saga"),
      type: "saga",
      title: seriesName,
      author:
        selectedItems.find(
          (item) => normalizeText(item.seriesName) === normalizeText(seriesName),
        )?.author || "",
      x: origin.x + column * 280,
      y: origin.y + row * 230,
      genre:
        selectedItems.find(
          (item) => normalizeText(item.seriesName) === normalizeText(seriesName),
        )?.genre || "altres",
      status: "no-comencada",
      universeId: targetUniverseId || null,
      notes: "",
      tags: ["Goodreads"],
      cover: null,
    };
    result.set(normalizeText(seriesName), saga);
  });

  return result;
}

function itemToBook(item, index, options, saga, sequence) {
  let x;
  let y;

  if (saga) {
    const ringIndex = Math.floor(sequence / 8);
    const positionInRing = sequence % 8;
    const angle = (positionInRing / 8) * Math.PI * 2 - Math.PI / 2 + ringIndex * 0.22;
    const radius = 190 + ringIndex * 125;
    x = saga.x + Math.cos(angle) * radius;
    y = saga.y + Math.sin(angle) * radius;
  } else {
    const columns = 9;
    const row = Math.floor(sequence / columns);
    const column = sequence % columns;
    x = options.origin.x + column * 190;
    y = options.standaloneStartY + row * 175;
  }

  return {
    id: makeId("book"),
    type: "book",
    x,
    y,
    title: item.title,
    author: item.author,
    additionalAuthors: item.additionalAuthors,
    genre: item.genre,
    status: item.status,
    rating: item.rating,
    startDate: item.startDate,
    endDate: item.endDate,
    dateAdded: item.dateAdded,
    pageCount: item.pageCount,
    publicationYear: item.publicationYear,
    originalPublicationYear: item.originalPublicationYear,
    publisher: item.publisher,
    binding: item.binding,
    isbn: item.isbn,
    isbn13: item.isbn13,
    review: item.review,
    notes: item.notes,
    tags: mergeTags(item.tags, ["Goodreads"]),
    readCount: item.readCount,
    ownedCopies: item.ownedCopies,
    externalIds: item.externalIds,
    parentSagaId: saga?.id || null,
    universeId: saga?.universeId || options.targetUniverseId || null,
    volume: item.seriesVolume || 1,
    volumeLabel: item.seriesVolumeLabel || "",
    cover: null,
  };
}

export function buildGoodreadsImport(existingNodes, items, options = {}) {
  const clean = normalizeLibrary(existingNodes);
  const selected = items.filter((item) => item.selected !== false);
  const settings = {
    duplicateStrategy: options.duplicateStrategy || "update",
    createSagas: options.createSagas !== false,
    targetUniverseId: options.targetUniverseId || null,
    origin: options.origin || { x: 0, y: 0 },
  };

  const seriesMap = settings.createSagas
    ? createSeriesMap(
        clean,
        selected,
        settings.targetUniverseId,
        settings.origin,
      )
    : new Map();

  const newSagas = [...seriesMap.values()].filter(
    (saga) => !clean.some((node) => node.id === saga.id),
  );
  const importedSagaValues = [...seriesMap.values()];
  const maxSagaY = importedSagaValues.length
    ? Math.max(...importedSagaValues.map((saga) => saga.y))
    : settings.origin.y;
  settings.standaloneStartY = maxSagaY + 420;

  let result = [...clean, ...newSagas];
  let created = 0;
  let updated = 0;
  let skipped = 0;
  let standaloneSequence = 0;
  const sagaSequences = new Map();

  selected.forEach((item, index) => {
    const saga = item.seriesName
      ? seriesMap.get(normalizeText(item.seriesName))
      : null;
    const sequence = saga
      ? sagaSequences.get(saga.id) || 0
      : standaloneSequence;
    const candidate = itemToBook(item, index, settings, saga, sequence);

    if (saga) sagaSequences.set(saga.id, sequence + 1);
    else standaloneSequence += 1;
    const duplicate = findDuplicate(result, candidate);

    if (duplicate && settings.duplicateStrategy === "skip") {
      skipped += 1;
      return;
    }

    if (duplicate) {
      const merged = {
        ...duplicate,
        ...candidate,
        id: duplicate.id,
        x: duplicate.x,
        y: duplicate.y,
        cover: duplicate.cover || candidate.cover,
        notes: duplicate.notes || candidate.notes,
        review: duplicate.review || candidate.review,
        tags: mergeTags(duplicate.tags, candidate.tags),
      };
      result = result.map((node) => (node.id === duplicate.id ? merged : node));
      updated += 1;
      return;
    }

    result.push(candidate);
    created += 1;
  });

  return {
    nodes: normalizeLibrary(result),
    summary: {
      selected: selected.length,
      created,
      updated,
      skipped,
      sagasCreated: newSagas.length,
    },
  };
}

export function getGoodreadsPreviewStats(items) {
  const selected = items.filter((item) => item.selected !== false);
  return {
    books: selected.length,
    completed: selected.filter((item) => item.status === "completat").length,
    reading: selected.filter((item) => item.status === "en-lectura").length,
    rated: selected.filter((item) => item.rating > 0).length,
    series: new Set(
      selected.map((item) => normalizeText(item.seriesName)).filter(Boolean),
    ).size,
  };
}
