import { useRef, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  FileText,
  Globe2,
  Hash,
  Image,
  Info,
  Layers3,
  Link2,
  NotebookPen,
  Star,
  Tag,
  Trash2,
  UserRound,
} from "lucide-react";
import bookCover from "../../assets/covers/book-default.jpg";
import sagaCover from "../../assets/covers/saga-default.jpg";
import universeCover from "../../assets/covers/universe-default.jpg";
import { BOOK_STATUS_OPTIONS, GENRES } from "../../domain/library.js";
import Button from "../ui/Button.jsx";
import Field from "../ui/Field.jsx";

function fallbackCover(type) {
  if (type === "universe") return universeCover;
  if (type === "saga") return sagaCover;
  return bookCover;
}

function Section({ title, icon: Icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="bv-inspector-section">
      <button type="button" className="bv-inspector-section__header" onClick={() => setOpen((value) => !value)}>
        <span><Icon size={15} />{title}</span>
        {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
      </button>
      {open ? <div className="bv-inspector-section__body">{children}</div> : null}
    </section>
  );
}

function typeLabel(type) {
  if (type === "universe") return "Univers";
  if (type === "saga") return "Saga";
  return "Llibre";
}

export default function Inspector({
  node,
  nodes,
  open,
  onChange,
  onDelete,
  onNavigate,
}) {
  const fileRef = useRef(null);
  if (!open) return null;

  if (!node) {
    return (
      <aside className="bv-inspector bv-inspector--empty">
        <div className="bv-inspector-empty__orb"><Info size={28} /></div>
        <div className="bv-eyebrow">Inspector</div>
        <h2>Selecciona un node</h2>
        <p>Fes clic sobre un univers, una saga o un llibre per editar-ne les dades i les relacions.</p>
      </aside>
    );
  }

  const isBook = node.type === "book";
  const isSaga = node.type === "saga";
  const isUniverse = node.type === "universe";
  const universes = nodes.filter((item) => item.type === "universe");
  const sagas = nodes.filter((item) => item.type === "saga");
  const sagaBooks = isSaga
    ? nodes.filter((item) => item.type === "book" && item.parentSagaId === node.id)
    : [];
  const universeSagas = isUniverse
    ? nodes.filter((item) => item.type === "saga" && item.universeId === node.id)
    : [];
  const directBooks = isUniverse
    ? nodes.filter((item) => item.type === "book" && item.universeId === node.id && !item.parentSagaId)
    : [];

  const update = (field, value) => onChange({ ...node, [field]: value });

  const handleImage = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => update("cover", reader.result);
    reader.readAsDataURL(file);
  };

  return (
    <aside className="bv-inspector">
      <div className="bv-inspector__scroll">
        <div className="bv-inspector-cover">
          <img src={node.cover || fallbackCover(node.type)} alt="" />
          <div className="bv-inspector-cover__shade" />
          <div className="bv-inspector-cover__meta">
            <span className={`bv-type-pill bv-type-pill--${node.type}`}>{typeLabel(node.type)}</span>
            {isBook && node.status ? <span className="bv-status-pill">{BOOK_STATUS_OPTIONS.find((option) => option.value === node.status)?.label || node.status}</span> : null}
          </div>
          <button type="button" className="bv-cover-action" onClick={() => fileRef.current?.click()}>
            <Image size={15} /> Canviar portada
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(event) => handleImage(event.target.files?.[0])} />
        </div>

        <div className="bv-inspector__titleblock">
          <div className="bv-eyebrow">{typeLabel(node.type)}</div>
          <h2>{node.title}</h2>
          <p>{node.author || (isUniverse ? "Arxiu narratiu" : "Autor pendent")}</p>
        </div>

        {isSaga ? (
          <div className="bv-saga-metrics">
            <div><span>Progrés</span><strong>{node.progressPercent || 0}%</strong></div>
            <div><span>Llegits</span><strong>{node.readBooks || 0}/{node.totalBooks || 0}</strong></div>
            <div><span>Valoració</span><strong>{node.sagaRatingAvg || "—"}</strong></div>
            <div className="bv-progress-track"><span style={{ width: `${node.progressPercent || 0}%` }} /></div>
          </div>
        ) : null}

        {isUniverse ? (
          <div className="bv-saga-metrics">
            <div><span>Sagues</span><strong>{node.universeSagaCount || 0}</strong></div>
            <div><span>Llibres</span><strong>{node.universeBookCount || 0}</strong></div>
            <div><span>Directes</span><strong>{directBooks.length}</strong></div>
          </div>
        ) : null}

        <Section title="Identitat" icon={FileText}>
          <Field label="Títol" icon={BookOpen}>
            <input value={node.title || ""} onChange={(event) => update("title", event.target.value)} />
          </Field>
          {!isUniverse ? (
            <Field label="Autor/a" icon={UserRound}>
              <input value={node.author || ""} onChange={(event) => update("author", event.target.value)} />
            </Field>
          ) : null}
          <Field label="Gènere" icon={Tag}>
            <select value={node.genre || "altres"} onChange={(event) => update("genre", event.target.value)}>
              {GENRES.map((genre) => <option key={genre.value} value={genre.value}>{genre.label}</option>)}
            </select>
          </Field>
        </Section>

        {isBook ? (
          <Section title="Lectura" icon={CalendarDays}>
            <Field label="Estat" icon={BookOpen}>
              <select value={node.status || "pendent"} onChange={(event) => update("status", event.target.value)}>
                {BOOK_STATUS_OPTIONS.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
              </select>
            </Field>
            <div className="bv-field-grid">
              <Field label="Inici" icon={CalendarDays}><input type="date" value={node.startDate || ""} onChange={(event) => update("startDate", event.target.value)} /></Field>
              <Field label="Final" icon={CalendarDays}><input type="date" value={node.endDate || ""} onChange={(event) => update("endDate", event.target.value)} /></Field>
            </div>
            <div className="bv-field-grid">
              <Field label="Valoració" icon={Star}><input type="number" min="0" max="5" step="0.5" value={node.rating || 0} onChange={(event) => update("rating", Number(event.target.value))} /></Field>
              <Field label="Volum" icon={Hash}><input type="number" min="0" step="0.5" value={node.volume || 1} onChange={(event) => update("volume", Number(event.target.value))} /></Field>
            </div>
            <Field label="Data d’addició" hint="Goodreads / biblioteca" icon={CalendarDays}><input type="date" value={node.dateAdded || ""} onChange={(event) => update("dateAdded", event.target.value)} /></Field>
          </Section>
        ) : null}

        <Section title="Relacions" icon={Link2}>
          {isSaga ? (
            <Field label="Univers" icon={Globe2}>
              <select value={node.universeId || ""} onChange={(event) => update("universeId", event.target.value || null)}>
                <option value="">Sense univers</option>
                {universes.map((universe) => <option key={universe.id} value={universe.id}>{universe.title}</option>)}
              </select>
            </Field>
          ) : null}
          {isBook ? (
            <>
              <Field label="Saga" icon={Layers3}>
                <select value={node.parentSagaId || ""} onChange={(event) => update("parentSagaId", event.target.value || null)}>
                  <option value="">Sense saga</option>
                  {sagas.map((saga) => <option key={saga.id} value={saga.id}>{saga.title}</option>)}
                </select>
              </Field>
              {!node.parentSagaId ? (
                <Field label="Univers directe" icon={Globe2}>
                  <select value={node.universeId || ""} onChange={(event) => update("universeId", event.target.value || null)}>
                    <option value="">Sense univers</option>
                    {universes.map((universe) => <option key={universe.id} value={universe.id}>{universe.title}</option>)}
                  </select>
                </Field>
              ) : (
                <p className="bv-field-note">L’univers s’hereta automàticament de la saga.</p>
              )}
            </>
          ) : null}
          {isUniverse && universeSagas.length ? (
            <div className="bv-related-list">
              {universeSagas.map((saga) => (
                <button type="button" key={saga.id} onClick={() => onNavigate(saga)}>
                  <Layers3 size={15} /><span>{saga.title}</span><small>{saga.totalBooks || 0} llibres</small>
                </button>
              ))}
            </div>
          ) : null}
          {isSaga && sagaBooks.length ? (
            <div className="bv-related-list">
              {sagaBooks
                .sort((left, right) => (left.volume || 0) - (right.volume || 0))
                .map((book) => (
                  <button type="button" key={book.id} onClick={() => onNavigate(book)}>
                    <BookOpen size={15} /><span>{book.title}</span><small>Vol. {book.volume || "—"}</small>
                  </button>
                ))}
            </div>
          ) : null}
        </Section>

        {isBook ? (
          <Section title="Edició i metadades" icon={NotebookPen} defaultOpen={false}>
            <div className="bv-field-grid">
              <Field label="Pàgines"><input type="number" min="0" value={node.pageCount || ""} onChange={(event) => update("pageCount", Number(event.target.value))} /></Field>
              <Field label="Any"><input type="number" min="0" value={node.publicationYear || ""} onChange={(event) => update("publicationYear", Number(event.target.value) || null)} /></Field>
            </div>
            <Field label="Editorial"><input value={node.publisher || ""} onChange={(event) => update("publisher", event.target.value)} /></Field>
            <Field label="Format"><input value={node.binding || ""} onChange={(event) => update("binding", event.target.value)} /></Field>
            <div className="bv-field-grid">
              <Field label="ISBN"><input value={node.isbn || ""} onChange={(event) => update("isbn", event.target.value || null)} /></Field>
              <Field label="ISBN13"><input value={node.isbn13 || ""} onChange={(event) => update("isbn13", event.target.value || null)} /></Field>
            </div>
          </Section>
        ) : null}

        <Section title="Notes i etiquetes" icon={NotebookPen}>
          <Field label="Notes"><textarea rows="5" value={node.notes || ""} onChange={(event) => update("notes", event.target.value)} /></Field>
          {isBook ? <Field label="Ressenya"><textarea rows="5" value={node.review || ""} onChange={(event) => update("review", event.target.value)} /></Field> : null}
          <Field label="Etiquetes" hint="Separades per comes" icon={Tag}>
            <input value={(node.tags || []).join(", ")} onChange={(event) => update("tags", event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean))} />
          </Field>
        </Section>

        <section className="bv-danger-zone">
          <div><Trash2 size={16} /><span><strong>Zona perillosa</strong><small>Aquesta acció no es pot desfer.</small></span></div>
          <Button variant="danger-ghost" icon={Trash2} onClick={() => onDelete(node)}>Eliminar {typeLabel(node.type).toLowerCase()}</Button>
        </section>
      </div>
    </aside>
  );
}
