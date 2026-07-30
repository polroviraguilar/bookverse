# Changelog

## 2.0.3 — Drag hierarchy and curated library

### Drag and drop

- Books can be dropped onto sagas to assign `parentSagaId` and inherit the saga universe.
- Books can be dropped directly onto universes, clearing any previous saga relationship.
- Sagas can be dropped onto universes; all child books inherit the new universe and move with the saga cluster.
- Valid drop targets display a gold halo and a clear release hint.
- Invalid target combinations are ignored and the node is only repositioned.

### Curated library

- Bundled the supplied 30 July 2026 Bookverse backup as the initial version 3 library.
- Added 7 conservative shared universes: Cosmere, Realm of the Elderlings, The Circle of the World, Middle-earth, Earthsea, Dune Universe and Foundation Universe.
- Created Earthsea Cycle and assigned the four existing Earthsea novels with correct volume order.
- Merged the duplicate Hitchhiker saga.
- Renamed the imported Wool saga to Silo.
- Kept books and sagas without a reliable parent as standalone items.
- Added a clean root and nested layout.

### Persistence

- Bumped the schema and autosave key to version 3.
- Previous version 2 and version 1 localStorage payloads are backed up before the curated library is activated.

## 2.0.2 — Node interaction hotfix

- Restored a dedicated interactive hit area for every Konva node.
- Fixed click, tap, hover, drag and double-click interactions after the performance optimization.
- Selecting a node opens the inspector automatically.

## 2.0.1 — Performance hotfix

### Canvas

- Camera panning and wheel zoom now update the Konva stage directly instead of rerendering the complete React application for every pointer event.
- Camera state is synchronized only after an interaction settles, reducing autosave work and full application renders.
- Node positions are committed on drag end instead of on every drag frame.
- Removed continuous starfield and connection-line animations that forced permanent canvas redraws.
- Added viewport culling so nodes far outside the current camera area are not mounted.
- Added level-of-detail rendering: distant nodes use a lightweight representation, while covers and labels appear when zoomed in.
- Memoized node visuals and static connection lines.
- Reduced expensive canvas shadows and perfect-draw passes.
- Moved the cosmic background treatment to CSS so it does not redraw with the Konva world.

### Reading Atlas

- Lane gridlines now render yearly markers instead of duplicating every monthly marker in every saga lane.
- Reused date formatters and lazy-loaded timeline cover images.
- Consolidated timeline statistics into a single memoized pass.

### Data work

- Library summary statistics no longer enrich and normalize the entire collection a second time.

## 2.0.0

### New experience

- Complete editorial-cosmic visual redesign.
- New application header with breadcrumbs, global search, view switcher, import menu and export action.
- New contextual inspector with collapsible sections, cover management, relationships, reading data and metadata.
- New canvas toolbar, filter panel, minimap and empty states.
- Refined canvas nodes with permanent labels, saga progress rings, completion indicators and premium selection states.
- New **Reading Atlas** timeline with saga lanes, dynamic zoom, filters, yearly activity histogram, reading intervals and interactive book cards.

### Saga reliability

- Fixed saga creation from the global view.
- Centralized relationship normalization.
- Moving a book to a saga now inherits the saga universe correctly.
- Moving a saga to another universe updates all its child books.
- Saga statistics are derived from books and are no longer manually editable.
- Universe deletion now removes direct books, child sagas and all books inside those sagas.
- Invalid, duplicate and orphaned node relationships are repaired during load and import.

### Goodreads import

- Added an RFC 4180-compatible CSV parser with support for quoted commas, escaped quotes and multiline fields.
- Added Goodreads column validation.
- Added import preview and row selection.
- Added editable saga and volume detection.
- Added mapping for status, rating, dates, ISBN, ISBN13, pages, publication years, publisher, binding, review, private notes, shelves and Goodreads Book ID.
- Added duplicate detection by Goodreads ID, ISBN13, ISBN and normalized title plus author.
- Added update and skip strategies for duplicates.
- Added optional target universe assignment.
- Added final import report.

### Persistence and deployment

- Added schema version 2.
- Added migration from the previous `story-map-autosave-v1` payload.
- Added GitHub Pages deployment workflow.
- Added tests for saga relationships, cascading deletion, CSV parsing and the supplied Goodreads export structure.
