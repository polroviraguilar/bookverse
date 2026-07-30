# Curated library structure

Bookverse 2.0.3 includes the library exported on 30 July 2026 as `src/data/initialLibrary.json`.

## Counts

- 7 universes
- 48 sagas
- 140 books

## Universes created

| Universe | Included saga or direct book |
|---|---|
| Cosmere | Mistborn |
| Realm of the Elderlings | Farseer Trilogy |
| The Circle of the World | The First Law; Best Served Cold as a direct universe book |
| Middle-earth | The Lord of the Rings |
| Earthsea | Earthsea Cycle |
| Dune Universe | Dune |
| Foundation Universe | Foundation |

Only conservative and well-established shared settings were promoted to universe nodes. Sagas without a broader reliable setting remain standalone. Books without a reliable saga or universe remain standalone.

## Corrections applied

- Merged the duplicate `The Hitchhiker's Guide to the Galaxy` saga created by two slightly different Goodreads series names.
- Created `Earthsea Cycle` and assigned:
  1. A Wizard of Earthsea
  2. The Tombs of Atuan
  3. The Farthest Shore
  4. Tehanu
- Renamed the imported `Wool` saga to `Silo`.
- Ensured every book inside a saga inherits the saga universe.
- Preserved all book metadata, ratings, reading states, dates, ISBNs, Goodreads IDs, notes and tags from the supplied backup.

## Storage migration

Version 2.0.3 uses `bookverse-library-v3`. On the first run, the bundled curated library is loaded. Existing version 2 or version 1 browser data is copied to `bookverse-library-backup-before-v3` before the new library is activated.
