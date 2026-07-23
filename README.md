# Bookverse

**Bookverse** is an interactive, browser-based workspace for organizing literary universes, sagas, and books as a visual map.

Instead of managing a reading collection as a flat list, Bookverse represents it as a navigable hierarchy:

```text
Universe
├── Saga
│   ├── Book
│   └── Book
├── Saga
│   └── Book
└── Standalone book
```

The application combines a zoomable canvas, animated relationships, a contextual editor, a minimap, local persistence, JSON backups, search and filtering, and a date-based reading timeline. It is built entirely on the front end with React, Vite, Konva, and `react-konva`.

> The current interface text is primarily written in Catalan. This README documents the project in English.

---

## Table of contents

- [Overview](#overview)
- [Main features](#main-features)
- [Core concepts](#core-concepts)
- [Technology stack](#technology-stack)
- [Requirements](#requirements)
- [Getting started](#getting-started)
- [Available scripts](#available-scripts)
- [How to use the application](#how-to-use-the-application)
- [Canvas controls](#canvas-controls)
- [Timeline view](#timeline-view)
- [Data model](#data-model)
- [Persistence, import, and export](#persistence-import-and-export)
- [Project structure](#project-structure)
- [Component architecture](#component-architecture)
- [Visual design and performance](#visual-design-and-performance)
- [Browser compatibility](#browser-compatibility)
- [Known limitations](#known-limitations)
- [Troubleshooting](#troubleshooting)
- [Deployment](#deployment)
- [Possible future improvements](#possible-future-improvements)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Bookverse is designed for readers, collectors, reviewers, and world-building enthusiasts who want to visualize how books relate to one another.

The main screen is an infinite-style canvas where every item is represented as a circular node:

- **Universes** are the highest-level containers.
- **Sagas** can belong to a universe.
- **Books** can belong to a saga, belong directly to a universe, or remain completely standalone.

Relationships are shown with animated connection lines. Users can move nodes freely, zoom and pan around the canvas, enter a universe or saga to focus on its contents, and edit the selected item from the sidebar.

The application is currently a client-side project. It does not require an account, database, or server API. Data is autosaved in the browser and can be exported as a JSON file for backup or transfer.

---

## Main features

### Hierarchical literary map

Bookverse supports three node types:

1. **Universe**
2. **Saga**
3. **Book**

The hierarchy is flexible. A book may be:

- part of a saga;
- directly attached to a universe without a saga; or
- completely standalone.

### Multiple navigation levels

The canvas can operate in three view modes:

- **Global view** — displays top-level universes and standalone content.
- **Universe view** — displays one universe, its sagas, books inside those sagas, and books attached directly to the universe.
- **Saga view** — displays one saga and its books.

Entering and leaving focused views uses animated transitions so that nodes collapse toward or expand from the current visual center.

### Interactive canvas

The Konva-powered canvas provides:

- smooth wheel zoom centered around the pointer;
- click-and-drag panning on empty canvas space;
- draggable nodes;
- hover scaling and tooltips;
- selected-node glow effects;
- double-click navigation into universes and sagas;
- animated relationship lines;
- orbiting rings around universe and saga nodes;
- an animated starfield and cursor trail.

### Contextual sidebar editor

Selecting a node opens its details in the sidebar. Depending on the node type, users can edit:

- title;
- author;
- genre;
- reading status;
- volume number;
- reading start and end dates;
- rating from 0 to 5 in 0.5 increments;
- saga assignment;
- universe assignment;
- notes;
- comma-separated tags;
- custom cover image.

Uploaded cover images are converted to Base64 data URLs and stored directly with the node data.

### Automatic saga statistics

Bookverse derives saga-level information from its child books:

- total number of books;
- number of completed books;
- completion percentage;
- automatic saga reading status;
- average rating;
- number of rated books;
- rating distribution.

These values are recalculated when relevant book or saga information changes.

### Search and filtering

The filter panel supports:

- title search;
- author search;
- genre filtering;
- reading-status filtering.

The active filters are applied before the current global, universe, or saga view is calculated.

### Minimap navigation

The circular minimap provides a compact overview of the complete node collection.

It supports:

- clicking to jump to a location;
- dragging inside the minimap to move continuously;
- a visual distinction between universes, sagas, and books;
- `Alt` + drag to reposition the minimap itself.

### Timeline view

Books with reading dates can be visualized on a horizontal timeline. Each book is shown as a dated interval with genre-based coloring.

The timeline includes:

- horizontal panning;
- zoom control;
- range navigation;
- alternating labels above and below the axis;
- hover tooltips;
- automatic fallback duration when no end date is provided.

### Local autosave

The application autosaves its working state to `localStorage` after a short debounce. The stored state includes:

- all nodes;
- the active view mode;
- the selected node;
- the current universe or saga;
- canvas zoom and position.

### JSON backup and restore

Users can export the collection as a versioned JSON file and import it again later.

The export contains the node collection and selected view information. Import currently replaces the active collection rather than merging it.

### Safe hierarchical deletion

Deletion is confirmed through a modal and follows the hierarchy:

- deleting a **book** removes only that book;
- deleting a **saga** also removes every book inside it;
- deleting a **universe** also removes its sagas and the books contained by those sagas.

After deletion, the application returns to the global view and clears the active selection.

---

## Core concepts

### Universe

A universe is the highest-level grouping. It may contain multiple sagas and standalone books.

Typical examples include:

- a fictional continuity;
- a shared world;
- an author's connected setting;
- a custom personal collection.

Universe nodes are visually larger than other nodes and use multiple golden orbit rings.

### Saga

A saga groups related books in a reading order. A saga may optionally belong to a universe.

Saga nodes display calculated progress and rating information in the sidebar. Their book list is ordered by the `volume` field.

### Book

A book is the most detailed node type. It may have a parent saga, a universe, both through its saga relationship, or neither.

Book-specific metadata includes:

- volume;
- reading dates;
- rating;
- reading status.

### Relationships

Relationships are stored by ID rather than as nested objects:

- `saga.universeId` links a saga to a universe;
- `book.parentSagaId` links a book to a saga;
- `book.universeId` links a standalone book directly to a universe.

This keeps every node in a single array and makes canvas updates straightforward.

---

## Technology stack

| Technology | Role |
| --- | --- |
| React 19 | Component model and application state |
| React DOM 19 | Browser rendering |
| Vite 7 | Development server and production bundling |
| Konva 10 | High-performance 2D canvas primitives and animation |
| react-konva 19 | Declarative React bindings for Konva |
| Lucide React | Interface icons |
| use-image | Image loading for Konva node covers |
| ESLint 9 | Static analysis and React hook linting |

The project uses standard JavaScript and JSX rather than TypeScript.

---

## Requirements

Install the following before running the project:

- **Node.js 20.19 or newer**, or **Node.js 22.12 or newer**;
- **npm**;
- a modern desktop browser.

The Node.js requirement comes from the Vite 7 toolchain used by this project.

---

## Getting started

### 1. Clone or download the project

```bash
git clone <repository-url>
cd univers-literari
```

When working from a downloaded archive, extract it and open a terminal in the project root.

### 2. Install dependencies

For a reproducible installation based on `package-lock.json`:

```bash
npm ci
```

During active dependency development, the standard alternative is:

```bash
npm install
```

### 3. Start the development server

```bash
npm run dev
```

Vite will print a local URL, usually similar to:

```text
http://localhost:5173
```

Open that address in a browser.

### 4. Create a production build

```bash
npm run build
```

The generated static application is written to the `dist/` directory.

### 5. Preview the production build

```bash
npm run preview
```

This serves the generated `dist/` build locally for final verification.

---

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Starts the Vite development server with hot module replacement |
| `npm run build` | Creates an optimized production build in `dist/` |
| `npm run lint` | Runs ESLint across the project |
| `npm run preview` | Serves the production build locally |

No automated test command is currently configured.

---

## How to use the application

### Creating content

Use the first floating action button below the minimap to create:

- a universe;
- a saga;
- a book.

New nodes are created at the current center of the visible canvas.

Creation is context-aware:

- creating a saga while inside a universe automatically assigns it to that universe;
- creating a book while inside a saga automatically assigns it to that saga;
- creating a book while inside a universe creates a standalone book in that universe.

The new node becomes selected immediately and can be edited in the sidebar.

### Selecting and editing a node

1. Click a node on the canvas.
2. Edit its fields in the sidebar.
3. Changes are applied immediately.
4. The application schedules an autosave after the update.

There is no separate Save button.

### Entering a universe or saga

Double-click a universe or saga node to focus on it.

You can also use contextual navigation actions in the sidebar, such as opening the saga associated with a selected book.

Use the Home floating action button to return to the global view.

### Assigning relationships

From the sidebar:

- a saga can be assigned to any existing universe;
- a book can be assigned to any existing saga;
- selecting “no saga” makes the book standalone.

When a book is created inside a universe without a saga, its `universeId` stores the direct relationship.

### Adding a cover image

1. Select a node.
2. Hover over the large cover preview in the sidebar.
3. Click the change-image button.
4. Select an image file.

The browser reads the file as a Base64 data URL. The image is then included in autosaves and JSON exports.

### Searching and filtering

Open the search/filter floating menu and choose **Filter**.

The panel allows you to:

- search by title or author;
- show a specific genre;
- show a specific reading status.

Clicking outside the panel closes it. Current filter values remain active until changed.

### Exporting data

Open the additional-actions floating menu and select the JSON export action.

The browser downloads a file named:

```text
story-map.json
```

Keep this file as a portable backup.

### Importing data

Open the additional-actions menu and select the JSON import action, then choose a compatible file.

Important behavior:

- the file must use schema version `1`;
- the file must contain a top-level `nodes` array;
- imported nodes replace the current node collection;
- the import is not merged with existing data;
- malformed or unsupported files display an error message.

Export the current collection first when importing an unverified backup.

### Deleting content

1. Select a node.
2. Scroll to the delete button in the sidebar.
3. Confirm the action in the modal.

Deletion cannot currently be undone.

---

## Canvas controls

| Action | Control |
| --- | --- |
| Select a node | Click the node |
| Open a universe | Double-click a universe node |
| Open a saga | Double-click a saga node |
| Move a node | Drag the node |
| Pan the canvas | Drag an empty area |
| Zoom | Use the mouse wheel or trackpad over the canvas |
| Clear selection | Click an empty area |
| Jump through minimap | Click or drag inside the minimap |
| Move the minimap | Hold `Alt` and drag the minimap |
| Return to global view | Click the Home floating action button |
| Open node details | Select the node and use the sidebar |

The zoom operation preserves the world position beneath the pointer, which makes detailed navigation more natural.

---

## Timeline view

Open the search/tools floating menu and select **Timeline**.

### Included books

The timeline includes books that have a `startDate`. Books without a start date are omitted.

When an end date is missing, the visual interval defaults to seven days after the start date. This is a display fallback; it does not write an end date back into the book.

### Timeline interactions

- Drag an empty area horizontally to move through time.
- Use the **Zoom** slider to change pixels per day.
- Use the **Range** slider to move the center across the full dataset.
- Hover over a book marker to display its title.
- Use the **Canvas** button to return to the main map.

Book intervals are colored by genre.

---

## Data model

All entities are stored together in a single `nodes` array.

### Shared node properties

Most nodes may contain the following properties:

| Property | Type | Description |
| --- | --- | --- |
| `id` | string | Unique node identifier |
| `type` | string | `universe`, `saga`, or `book` |
| `x` | number | Horizontal world coordinate |
| `y` | number | Vertical world coordinate |
| `title` | string | Display title |
| `author` | string | Author name when applicable |
| `genre` | string | Genre identifier used for styling and filtering |
| `status` | string | Reading or completion status |
| `notes` | string | Free-form notes |
| `tags` | string[] | User-defined tags |
| `cover` | string or null | Base64 data URL or custom image source |
| `isNew` | boolean | Temporary flag used for creation animation |

### Universe properties

A universe normally uses the shared fields and acts as a relationship target for sagas and standalone books.

Example:

```json
{
  "id": "universe-1",
  "type": "universe",
  "x": 0,
  "y": 0,
  "title": "Main Universe",
  "notes": "",
  "tags": [],
  "cover": null
}
```

### Saga properties

| Property | Type | Description |
| --- | --- | --- |
| `universeId` | string or null | Parent universe ID |
| `totalBooks` | number | Number of books associated with the saga |
| `readBooks` | number | Number of completed books |
| `progressPercent` | number | Calculated completion percentage |
| `sagaRatingAvg` | number | Calculated average book rating |
| `sagaRatingCount` | number | Number of rated books |
| `sagaRatingDist` | object | Rounded rating distribution |

Example:

```json
{
  "id": "saga-1700000000000",
  "type": "saga",
  "x": 250,
  "y": 100,
  "title": "Example Saga",
  "author": "Example Author",
  "genre": "fantasia",
  "status": "en-lectura",
  "universeId": "universe-1",
  "totalBooks": 3,
  "readBooks": 1,
  "progressPercent": 33,
  "sagaRatingAvg": 4.5,
  "sagaRatingCount": 1,
  "notes": "",
  "tags": [],
  "cover": null
}
```

### Book properties

| Property | Type | Description |
| --- | --- | --- |
| `parentSagaId` | string or null | Parent saga ID |
| `universeId` | string or null | Direct universe relationship or inherited context |
| `volume` | number | Position within a saga |
| `startDate` | string | Reading start date in `YYYY-MM-DD` format |
| `endDate` | string | Reading end date in `YYYY-MM-DD` format |
| `rating` | number | Rating from 0 to 5 |

Example:

```json
{
  "id": "book-1700000000001",
  "type": "book",
  "x": 500,
  "y": 100,
  "title": "Example Book",
  "author": "Example Author",
  "genre": "fantasia",
  "status": "completat",
  "parentSagaId": "saga-1700000000000",
  "universeId": "universe-1",
  "volume": 1,
  "startDate": "2026-01-05",
  "endDate": "2026-01-18",
  "rating": 4.5,
  "notes": "Personal notes",
  "tags": ["favorite", "reread"],
  "cover": null
}
```

### Genre identifiers

The current interface recognizes:

| Identifier | Meaning |
| --- | --- |
| `fantasia` | Fantasy |
| `ciencia-ficcio` | Science fiction |
| `romantica` | Romance |
| `thriller` | Thriller |
| `altres` | Other |

Genre values also control node borders, sidebar overlays, and timeline colors.

### Status identifiers

Book statuses currently include:

- `pendent` — pending;
- `en-lectura` — currently reading;
- `pausat` — paused;
- `abandonat` — abandoned;
- `completat` — completed.

Saga statuses currently include:

- `no-comencada` — not started;
- `en-lectura` — in progress;
- `pausada` — paused;
- `acabada` — completed.

Saga progress logic treats completed child books as read and derives the saga status from the number of completed books.

---

## Persistence, import, and export

### Autosave

The autosave key is:

```text
story-map-autosave-v1
```

Autosaving is debounced by approximately 600 milliseconds after relevant state changes.

A typical autosave payload has this shape:

```json
{
  "version": 1,
  "savedAt": "2026-07-23T00:00:00.000Z",
  "state": {
    "viewMode": "global",
    "selectedNodeId": null,
    "currentSagaId": null,
    "currentUniverseId": null,
    "canvasView": {
      "scale": 1,
      "position": {
        "x": 0,
        "y": 0
      }
    }
  },
  "nodes": []
}
```

If no valid autosave is found, the application creates an initial universe node.

### Export format

A manual JSON export uses schema version `1` and contains:

```json
{
  "version": 1,
  "meta": {
    "exportedAt": "2026-07-23T00:00:00.000Z"
  },
  "state": {
    "viewMode": "global",
    "selectedNodeId": null
  },
  "nodes": []
}
```

### Storage considerations

`localStorage` has a browser-dependent size limit. Base64 cover images can consume this storage quickly because they are embedded directly in the saved JSON.

Recommended practices:

- resize large cover images before uploading them;
- export regular JSON backups;
- do not rely on browser storage as the only long-term copy;
- export before clearing site data or changing browsers.

Clearing browser data for the site also removes the autosave.

### Privacy

The current application does not upload collection data to a server. Data remains in the browser unless the user exports and shares the JSON file.

---

## Project structure

The source imports imply the following intended directory layout:

```text
univers-literari/
├── public/
│   └── favicon.svg
├── src/
│   ├── assets/
│   │   └── covers/
│   │       ├── universe-default.jpg
│   │       ├── saga-default.jpg
│   │       └── book-default.jpg
│   ├── components/
│   │   ├── nodes/
│   │   │   ├── NodeTooltip.jsx
│   │   │   ├── NodeVisual.jsx
│   │   │   ├── OrbitingRings.jsx
│   │   │   └── nodeUtils.js
│   │   ├── AnimatedLine.jsx
│   │   ├── CanvasBoard.jsx
│   │   ├── CanvasFAB.jsx
│   │   ├── ConfirmDeleteModal.jsx
│   │   ├── ConnectionLines.jsx
│   │   ├── CursorStarTrail.jsx
│   │   ├── HybridGrid.jsx
│   │   ├── MiniMap.jsx
│   │   ├── Sidebar.jsx
│   │   └── TimelineView.jsx
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── .gitignore
├── eslint.config.js
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
└── README.md
```

Ensure that the default cover files and favicon exist at the paths expected by the imports. Missing assets will cause Vite to report unresolved imports.

---

## Component architecture

### `App.jsx`

The application coordinator and primary state owner.

Responsibilities include:

- storing nodes and selection state;
- controlling global, universe, saga, and timeline views;
- calculating filtered and visible nodes;
- creating, updating, and deleting nodes;
- calculating saga progress and rating statistics;
- coordinating animated view transitions;
- managing local autosave;
- importing and exporting JSON;
- positioning the minimap;
- rendering the floating action menus and sidebar.

### `CanvasBoard.jsx`

Owns the interactive Konva stage.

Responsibilities include:

- responsive canvas sizing through `ResizeObserver`;
- pointer-centered wheel zoom;
- manual canvas panning;
- node dragging;
- node selection and double-click navigation;
- smooth interpolation toward external scale and position state;
- rendering transitions between focused views.

### `HybridGrid.jsx`

Creates the animated space background.

For performance, it combines:

- a cached bitmap containing thousands of low-cost stars;
- a smaller set of live Konva stars;
- twinkle animation;
- pointer repulsion and brightness response;
- world-edge wrapping.

### `ConnectionLines.jsx`

Builds relationships from the flat node array and renders:

- universe-to-saga connections;
- universe-to-standalone-book connections;
- saga-to-book connections.

It also interpolates line endpoints during view transitions.

### `AnimatedLine.jsx`

Uses a Konva animation loop to continuously move dashed line offsets, creating a slow flowing effect.

### `NodeVisual.jsx`

Renders the circular cover image, genre-colored border, hover glow, and selected-node pulse.

Default cover images are chosen according to node type when a custom cover is not present.

### `OrbitingRings.jsx`

Adds animated orbital decoration:

- three rings for universes;
- one ring for sagas;
- no rings for books.

### `NodeTooltip.jsx`

Displays lightweight node information while hovering over a canvas node.

### `MiniMap.jsx`

Calculates a world bounding box from all nodes, maps world coordinates into a circular overview, and converts minimap clicks back into canvas camera positions.

### `Sidebar.jsx`

Provides the node editor and contextual summaries.

It also handles:

- cover file reading;
- saga progress display;
- saga rating display;
- universe saga listing;
- relationship reassignment;
- deletion requests.

### `TimelineView.jsx`

Transforms book dates into pixel positions and renders reading intervals on a separate Konva stage.

### `CanvasFAB.jsx`

Reusable floating action button with:

- expandable action menus;
- direct-action mode;
- outside-click closing;
- entry and exit animations.

### `ConfirmDeleteModal.jsx`

Displays destructive-action confirmation before hierarchical deletion.

### `CursorStarTrail.jsx`

Adds a visual particle trail that follows the pointer across the canvas.

### `nodeUtils.js`

Centralizes node sizes, genre colors, orbit counts, and orbit styling constants.

---

## Visual design and performance

Bookverse uses a dark cosmic visual language:

- deep navy background;
- genre-colored borders;
- gold universe relationships;
- silver saga relationships;
- blurred glass-like controls;
- animated stars and orbit rings;
- glowing selected nodes.

Several implementation choices reduce unnecessary rendering work:

- the background starfield is partially rasterized into a reusable bitmap;
- live stars are updated through Konva node references instead of React state on every frame;
- canvas movement uses `requestAnimationFrame` interpolation;
- connection calculations are memoized;
- the canvas size is observed at the container level rather than relying only on global window resize events;
- decorative elements disable pointer listening where possible;
- node image rendering is clipped directly inside Konva groups.

Performance still depends on the number of nodes, live visual effects, image sizes, device GPU, and browser canvas implementation.

---

## Browser compatibility

The project expects a modern browser with support for:

- HTML Canvas;
- ES modules;
- `ResizeObserver`;
- `localStorage`;
- `FileReader`;
- `requestAnimationFrame`;
- modern CSS effects such as `backdrop-filter`.

Desktop Chrome, Edge, Firefox, and Safari are the most appropriate targets. The current interaction model is optimized primarily for mouse or trackpad use rather than touch-only devices.

---

## Known limitations

The current project is a front-end prototype and has several deliberate or unfinished constraints:

- There is no backend, user account, authentication, or cloud synchronization.
- Data is stored in a single browser profile unless manually exported.
- JSON import replaces data instead of merging collections.
- Import validation is intentionally minimal and checks only the schema version and `nodes` array.
- There is no undo or redo history.
- There is no automated test suite.
- The application does not currently provide keyboard shortcuts.
- Large Base64 cover images may exceed browser storage limits.
- The timeline uses `window.innerWidth` and `window.innerHeight`, so further work may be needed for complex embedded or mobile layouts.
- Some interface strings and status identifiers are Catalan-specific.
- Snapping-related state exists in the main application, but node snapping is not currently connected to the canvas behavior.
- Deletion is permanent after confirmation.

---

## Troubleshooting

### Vite reports that a cover image cannot be resolved

Confirm that these files exist:

```text
src/assets/covers/universe-default.jpg
src/assets/covers/saga-default.jpg
src/assets/covers/book-default.jpg
```

Also confirm that the source files are in the intended `src/components` and `src/components/nodes` directories so that relative imports remain valid.

### The application opens with an empty or unexpected collection

The app restores data from the browser autosave key:

```text
story-map-autosave-v1
```

Inspect or remove that entry through browser developer tools if you need to reset the application. Export a backup first when the existing data matters.

### A JSON file will not import

Check that:

- the file contains valid JSON;
- `version` is exactly `1`;
- `nodes` is a top-level array;
- the file is not a raw autosave fragment missing the required fields;
- node IDs and relationships use strings consistently.

### Cover images disappear after clearing browser data

Custom covers are embedded in the local application data. Clearing site storage removes them along with the node collection unless a JSON export was created first.

### The timeline is empty

At least one book must contain a `startDate` value. Books without a start date do not appear in the timeline.

### Installation fails because of the Node.js version

Check the installed version:

```bash
node --version
```

Use Node.js 20.19+ or 22.12+ for compatibility with the current Vite version.

### Linting reports unused variables

Run:

```bash
npm run lint
```

The ESLint configuration treats unused variables as errors, except for names matching the configured uppercase ignore pattern.

---

## Deployment

Bookverse builds as a static single-page application.

Create the production bundle with:

```bash
npm run build
```

Deploy the contents of `dist/` to any static hosting provider, such as:

- a conventional web server;
- a static hosting service;
- a CDN-backed object store;
- a platform that supports Vite applications.

When deploying below a URL subpath rather than at the domain root, configure Vite's `base` option in `vite.config.js` before building.

Because persistence uses browser `localStorage`, data is scoped to the deployed origin. Data stored on `localhost` will not automatically appear on the production domain.

---

## Possible future improvements

The following are natural next steps, but are not implemented yet:

- undo and redo history;
- drag snapping and alignment guides;
- collection merge during JSON import;
- stronger schema validation and migrations;
- cloud synchronization;
- user accounts and shared collections;
- internationalization;
- TypeScript conversion;
- unit, integration, and end-to-end tests;
- keyboard navigation and accessibility improvements;
- mobile and touch controls;
- image compression before Base64 storage;
- optional IndexedDB persistence for larger collections;
- custom genres and statuses;
- multiple timelines and advanced date filters;
- sorting and list views;
- reading statistics dashboards;
- relationship editing directly on the canvas;
- export to image or PDF;
- configurable themes and visual effects.

---

## Contributing

Contributions should keep the visual and data architecture consistent.

A suggested workflow is:

1. Create a feature branch.
2. Make focused changes.
3. Run the linter.
4. Build the production bundle.
5. Test canvas navigation, autosave, import/export, and deletion manually.
6. Submit a pull request with a clear description and screenshots for visual changes.

Before submitting changes, run:

```bash
npm run lint
npm run build
```

When changing the node schema, also update:

- creation defaults in `App.jsx`;
- sidebar fields;
- import/export compatibility;
- saga calculations where relevant;
- this README.

---

## License

No license file is currently included in the project.

Before publishing, redistributing, or accepting external contributions, add an explicit license such as MIT, Apache-2.0, GPL-3.0, or another license appropriate for the project.
