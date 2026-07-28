import { SlidersHorizontal, X } from "lucide-react";
import { BOOK_STATUS_OPTIONS, GENRES } from "../../domain/library.js";
import IconButton from "../ui/IconButton.jsx";

export default function FilterPanel({ open, filters, onChange, onClose, counts }) {
  if (!open) return null;
  return (
    <aside className="bv-filter-panel">
      <header>
        <div><SlidersHorizontal size={16} /><strong>Filtra el mapa</strong></div>
        <IconButton icon={X} label="Tancar filtres" onClick={onClose} />
      </header>
      <label>
        <span>Tipus de node</span>
        <select value={filters.type} onChange={(event) => onChange({ ...filters, type: event.target.value })}>
          <option value="tots">Tots ({counts.all})</option>
          <option value="universe">Universos ({counts.universes})</option>
          <option value="saga">Sagues ({counts.sagas})</option>
          <option value="book">Llibres ({counts.books})</option>
        </select>
      </label>
      <label>
        <span>Gènere</span>
        <select value={filters.genre} onChange={(event) => onChange({ ...filters, genre: event.target.value })}>
          <option value="tots">Tots els gèneres</option>
          {GENRES.map((genre) => <option key={genre.value} value={genre.value}>{genre.label}</option>)}
        </select>
      </label>
      <label>
        <span>Estat de lectura</span>
        <select value={filters.status} onChange={(event) => onChange({ ...filters, status: event.target.value })}>
          <option value="tots">Tots els estats</option>
          {BOOK_STATUS_OPTIONS.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
        </select>
      </label>
      <p>Els filtres s’apliquen dins del nivell actual del mapa.</p>
    </aside>
  );
}
