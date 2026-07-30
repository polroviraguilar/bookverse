# Validation

## Completed in the generation environment

- 14 Node tests passed.
- The complete JavaScript and JSX source tree was parsed successfully with TypeScript in no-emit mode.
- The curated JSON contains 7 universes, 48 sagas and 140 books.
- No dangling `universeId` or `parentSagaId` values were found.
- Drag relationship tests cover book-to-saga, book-to-universe and saga-to-universe operations.

## Local validation still required

The generation environment could not install the npm dependency tree because its internal npm mirror returned a 404 for a transitive package. Run the following commands on the target computer before publishing:

```bash
npm ci
npm run lint
npm test
npm run build
npm run dev
```

Then manually verify the drag-and-drop interactions in the browser.
