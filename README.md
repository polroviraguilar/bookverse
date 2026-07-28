# Bookverse 2.0

Bookverse is a visual literary atlas built with React, Vite and Konva. It turns a reading library into an explorable hierarchy of universes, sagas and books, with a premium canvas, a contextual inspector, a Reading Atlas timeline and a guided Goodreads importer.

## Highlights

- Visual hierarchy: **Universe → Saga → Book**.
- Standalone sagas and standalone books are supported.
- Drag, pan and pointer-centred zoom on the canvas.
- Derived saga progress and rating statistics.
- Safe relationship updates when books or sagas are moved.
- Cascading deletion with confirmation.
- Browser autosave and versioned JSON backups.
- Guided Goodreads CSV import with saga review and duplicate handling.
- Reading Atlas with saga lanes, date modes, zoom, filters and activity statistics.
- GitHub Pages workflow included.

## Requirements

- Node.js 20.19+ or Node.js 22.12+.
- npm.
- A modern desktop browser.

## Run locally

From the project root:

```bash
npm ci
npm run dev
```

Vite will print the local URL, normally `http://localhost:5173`.

## Validate the project

Run the complete local validation sequence:

```bash
npm test
npm run lint
npm run build
npm run preview
```

The production build is written to `dist/`.

## Import Goodreads

1. In Goodreads, open **My Books**.
2. Use **Import and export**.
3. Export the library as CSV.
4. In Bookverse, select **Importar → Goodreads CSV**.
5. Upload the file.
6. Review the detected books, sagas and volume numbers.
7. Choose the duplicate strategy and optional target universe.
8. Confirm the import.

The importer does not invent reading start dates. Goodreads usually provides `Date Added` and sometimes `Date Read`, but not the real date when reading started.

### Imported Goodreads fields

- Goodreads Book ID
- Title and author
- Additional authors
- ISBN and ISBN13
- Personal rating
- Publisher and binding
- Page count
- Publication years
- Date read and date added
- Shelves and tags
- Reading status
- Review and private notes
- Read count and owned copies
- Detected saga and volume

## Data and privacy

Bookverse remains a client-side application. The library is saved in the browser using `localStorage`. Data is not uploaded to a server by the application.

Create JSON backups regularly, especially before clearing browser data or moving to another device.

## Data migration

Bookverse 2.0 reads:

- the new `bookverse-library-v2` autosave payload;
- the previous `story-map-autosave-v1` payload.

Legacy data is normalized automatically. Invalid nodes are removed, orphaned relationships are repaired and books inside sagas inherit the correct universe.

## GitHub Pages deployment

The project includes `.github/workflows/deploy.yml`.

### First-time repository configuration

1. Push the project to the `main` branch.
2. Open the GitHub repository.
3. Go to **Settings → Pages**.
4. Under **Build and deployment**, select **GitHub Actions** as the source.
5. Open the **Actions** tab and wait for the deployment workflow to finish.

The current Vite base path is configured for a repository named `bookverse`:

```js
base: command === "build" ? "/bookverse/" : "/"
```

If the repository is renamed, update this value in `vite.config.js` before building.

## Replace the existing repository with Bookverse 2.0

Back up the current repository first. Then replace its contents with this project, preserving the `.git` directory.

From the repository root:

```bash
git add -A
git commit -m "Release Bookverse 2.0"
git push origin main
```

The included workflow will test, lint, build and deploy the application.

## Main source structure

```text
src/
├── assets/covers/
├── components/
│   ├── canvas/
│   ├── import/
│   ├── shell/
│   ├── timeline/
│   └── ui/
├── domain/
│   └── library.js
├── importers/
│   ├── csv.js
│   └── goodreads.js
├── styles/
│   └── index.css
├── App.jsx
└── main.jsx
```

## Tests

The Node test suite covers:

- global saga creation;
- inherited universe relationships;
- moving a saga between universes;
- universe cascading deletion;
- derived saga statistics;
- quoted and multiline CSV values;
- Goodreads saga detection;
- parsing the supplied 140-row Goodreads export structure;
- duplicate handling during repeated imports.
