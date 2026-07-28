import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { parseCsv } from "../src/importers/csv.js";
import {
  buildGoodreadsImport,
  parseGoodreadsCsv,
  parseSeriesTitle,
} from "../src/importers/goodreads.js";

test("CSV parser supports commas, escaped quotes and line breaks", () => {
  const rows = parseCsv('A,B\n"x,y","hello ""world"""\n"line\nwrap",z');
  assert.equal(rows[0].A, "x,y");
  assert.equal(rows[0].B, 'hello "world"');
  assert.equal(rows[1].A, "line\nwrap");
});

test("series parser extracts Goodreads saga suffixes", () => {
  const parsed = parseSeriesTitle("Shōgun (Asian Saga, #1)");
  assert.equal(parsed.cleanTitle, "Shōgun");
  assert.equal(parsed.seriesName, "Asian Saga");
  assert.equal(parsed.volume, 1);
});

test("a representative Goodreads export parses completely", async () => {
  const csv = await readFile(new URL("./fixtures/goodreads-sample.csv", import.meta.url), "utf8");
  const items = parseGoodreadsCsv(csv);
  assert.equal(items.length, 3);
  assert.equal(items[0].seriesName, "Asian Saga");
  assert.equal(items[0].isbn13, "9781982603847");
  assert.equal(items[1].status, "en-lectura");
});

test("Goodreads import creates books and sagas without duplicates", async () => {
  const csv = await readFile(new URL("./fixtures/goodreads-sample.csv", import.meta.url), "utf8");
  const items = parseGoodreadsCsv(csv);
  const first = buildGoodreadsImport([], items, { createSagas: true });
  const second = buildGoodreadsImport(first.nodes, items, {
    createSagas: true,
    duplicateStrategy: "skip",
  });
  assert.equal(first.summary.created, 3);
  assert.equal(second.summary.skipped, 3);
});
