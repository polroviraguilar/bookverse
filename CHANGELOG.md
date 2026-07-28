# Changelog

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
