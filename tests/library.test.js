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

test("global search reveals nested books together with their ancestors", async () => {
  const { getVisibleNodes } = await import("../src/domain/library.js");
  const visible = getVisibleNodes(normalizeLibrary(sample), { mode: "global" }, "B1", {
    type: "tots",
    genre: "tots",
    status: "tots",
  });
  assert.deepEqual(new Set(visible.map((node) => node.id)), new Set(["u1", "s1", "b1"]));
});
