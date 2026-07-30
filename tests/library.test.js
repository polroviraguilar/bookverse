import test from "node:test";
import assert from "node:assert/strict";
import {
  applyNodeUpdate,
  createNode,
  deleteNodeCascade,
  deriveSagaStats,
  normalizeLibrary,
} from "../src/domain/library.js";

const sample = [
  { id: "u1", type: "universe", title: "U", x: 0, y: 0 },
  { id: "s1", type: "saga", title: "S", universeId: "u1", x: 10, y: 0 },
  { id: "b1", type: "book", title: "B1", parentSagaId: "s1", status: "completat", rating: 4, x: 20, y: 0 },
  { id: "b2", type: "book", title: "B2", parentSagaId: "s1", status: "pendent", rating: 5, x: 30, y: 0 },
  { id: "b3", type: "book", title: "Directe", universeId: "u1", x: 40, y: 0 },
];

test("normalizeLibrary inherits the saga universe", () => {
  const nodes = normalizeLibrary(sample);
  assert.equal(nodes.find((node) => node.id === "b1").universeId, "u1");
});

test("creating a saga in global view always returns a valid node", () => {
  const saga = createNode("saga", { x: 12, y: 13 }, { mode: "global" }, sample);
  assert.equal(saga.type, "saga");
  assert.equal(saga.universeId, null);
});

test("moving a saga updates child book universes", () => {
  const nodes = [...sample, { id: "u2", type: "universe", title: "U2", x: 0, y: 0 }];
  const saga = { ...nodes.find((node) => node.id === "s1"), universeId: "u2" };
  const updated = applyNodeUpdate(nodes, saga);
  assert.equal(updated.find((node) => node.id === "b1").universeId, "u2");
});

test("deleting a universe deletes sagas, saga books and direct books", () => {
  const result = deleteNodeCascade(sample, "u1");
  assert.equal(result.length, 0);
});

test("saga statistics are derived from books", () => {
  const stats = deriveSagaStats(normalizeLibrary(sample), "s1");
  assert.equal(stats.totalBooks, 2);
  assert.equal(stats.readBooks, 1);
  assert.equal(stats.progressPercent, 50);
  assert.equal(stats.sagaRatingAvg, 4.5);
});

test("global search only reveals the top-level ancestor", async () => {
  const { getVisibleNodes } = await import("../src/domain/library.js");

  const visible = getVisibleNodes(
    normalizeLibrary(sample),
    { mode: "global" },
    "B1",
    {
      type: "tots",
      genre: "tots",
      status: "tots",
    },
  );

  assert.deepEqual(
    new Set(visible.map((node) => node.id)),
    new Set(["u1"]),
  );
});

test("global view only contains nodes without parents", async () => {
  const { getVisibleNodes } = await import("../src/domain/library.js");

  const nodes = normalizeLibrary([
    ...sample,
    {
      id: "s2",
      type: "saga",
      title: "Saga independent",
      universeId: null,
      x: 100,
      y: 100,
    },
    {
      id: "b4",
      type: "book",
      title: "Llibre independent",
      parentSagaId: null,
      universeId: null,
      x: 200,
      y: 100,
    },
  ]);

  const visible = getVisibleNodes(
    nodes,
    { mode: "global" },
    "",
    {
      type: "tots",
      genre: "tots",
      status: "tots",
    },
  );

  assert.deepEqual(
    new Set(visible.map((node) => node.id)),
    new Set(["u1", "s2", "b4"]),
  );
});

test("dropping a book into a saga assigns both saga and universe", async () => {
  const { reparentNode } = await import("../src/domain/library.js");
  const nodes = reparentNode(sample, "b3", "s1", { x: 10, y: 0 });
  const book = nodes.find((node) => node.id === "b3");
  assert.equal(book.parentSagaId, "s1");
  assert.equal(book.universeId, "u1");
});

test("dropping a book into a universe makes it a direct universe book", async () => {
  const { reparentNode } = await import("../src/domain/library.js");
  const nodes = reparentNode(sample, "b1", "u1", { x: 0, y: 0 });
  const book = nodes.find((node) => node.id === "b1");
  assert.equal(book.parentSagaId, null);
  assert.equal(book.universeId, "u1");
});

test("dropping a saga into another universe moves its books with it", async () => {
  const { reparentNode } = await import("../src/domain/library.js");
  const nodes = [
    ...sample,
    { id: "u2", type: "universe", title: "U2", x: 500, y: 500 },
  ];
  const beforeBook = nodes.find((node) => node.id === "b1");
  const moved = reparentNode(nodes, "s1", "u2", { x: 500, y: 500 });
  const saga = moved.find((node) => node.id === "s1");
  const book = moved.find((node) => node.id === "b1");
  assert.equal(saga.universeId, "u2");
  assert.equal(book.universeId, "u2");
  assert.notEqual(book.x, beforeBook.x);
});

test("the bundled curated library has valid hierarchy and no dangling relations", async () => {
  const { readFile } = await import("node:fs/promises");
  const payload = JSON.parse(
    await readFile(new URL("../src/data/initialLibrary.json", import.meta.url), "utf8"),
  );
  const ids = new Set(payload.nodes.map((node) => node.id));
  assert.equal(payload.nodes.filter((node) => node.type === "universe").length, 7);
  assert.equal(payload.nodes.filter((node) => node.type === "saga").length, 48);
  assert.equal(payload.nodes.filter((node) => node.type === "book").length, 140);

  for (const node of payload.nodes) {
    if (node.universeId) assert.equal(ids.has(node.universeId), true);
    if (node.parentSagaId) assert.equal(ids.has(node.parentSagaId), true);
  }

  const earthsea = payload.nodes.find((node) => node.id === "saga-earthsea-cycle");
  assert.equal(earthsea.universeId, "universe-earthsea");
  assert.equal(
    payload.nodes.filter((node) => node.parentSagaId === earthsea.id).length,
    4,
  );

  assert.equal(
    payload.nodes.filter(
      (node) => node.type === "saga" && node.title.includes("Hitchhiker"),
    ).length,
    1,
  );
});
