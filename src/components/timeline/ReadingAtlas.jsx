import { useCallback, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  ChevronDown,
  Clock3,
  Filter,
  Layers3,
  Search,
  Sparkles,
  Star,
  ZoomIn,
} from "lucide-react";
import bookCover from "../../assets/covers/book-default.jpg";
import { GENRES } from "../../domain/library.js";

const DAY_MS = 86_400_000;
const CARD_WIDTH = 184;
const SLOT_HEIGHT = 78;
const EMPTY_TIMELINE_FALLBACK_TS = Date.UTC(2000, 0, 1);
const DATE_FORMATTER = new Intl.DateTimeFormat("ca-ES", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});
const MONTH_FORMATTER = new Intl.DateTimeFormat("ca-ES", { month: "short" });

function dateTs(value) {
  if (!value) return null;
  const parsed = Date.parse(`${value}T00:00:00`);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatDate(value) {
  const ts = typeof value === "number" ? value : dateTs(value);
  if (!ts) return "Sense data";
  return DATE_FORMATTER.format(new Date(ts));
}

function getEvent(book, mode) {
  const start = dateTs(book.startDate);
  const end = dateTs(book.endDate);
  const added = dateTs(book.dateAdded);

  if (mode === "read") {
    const anchor = end || start;
    if (!anchor) return null;
    return { anchor, start: start || anchor, end: end || anchor };
  }
  if (mode === "added") {
    if (!added) return null;
    return { anchor: added, start: added, end: added };
  }
  const anchor = end || start || added;
  if (!anchor) return null;
  return { anchor, start: start || anchor, end: end || anchor };
}

function assignSlots(items) {
  const slotEnds = [];
  const placed = items
    .slice()
    .sort((left, right) => left.x - right.x)
    .map((item) => {
      let slot = slotEnds.findIndex((end) => item.x - CARD_WIDTH / 2 > end + 18);
      if (slot === -1) slot = slotEnds.length;
      slotEnds[slot] = item.x + CARD_WIDTH / 2;
      return { ...item, slot };
    });
  return { items: placed, slots: Math.max(1, slotEnds.length) };
}

function buildTicks(minTs, maxTs, pxPerDay) {
  const ticks = [];
  const cursor = new Date(minTs);
  cursor.setDate(1);
  cursor.setHours(0, 0, 0, 0);

  while (cursor.getTime() <= maxTs) {
    const ts = cursor.getTime();
    const month = cursor.getMonth();
    const year = cursor.getFullYear();
    const major = month === 0;
    const showMonth = pxPerDay >= 0.82;
    ticks.push({
      ts,
      major,
      label: major
        ? String(year)
        : showMonth
          ? MONTH_FORMATTER.format(cursor)
          : "",
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return ticks;
}

function Stat({ label, value, icon: Icon }) {
  return (
    <div className="bv-atlas-stat">
      <span><Icon size={15} /></span>
      <div><small>{label}</small><strong>{value}</strong></div>
    </div>
  );
}

export default function ReadingAtlas({ nodes, onSelectBook }) {
  const scrollRef = useRef(null);
  const [mode, setMode] = useState("activity");
  const [zoom, setZoom] = useState(1);
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("tots");
  const [status, setStatus] = useState("tots");
  const [controlsOpen, setControlsOpen] = useState(false);

  const sagas = useMemo(
    () => new Map(nodes.filter((node) => node.type === "saga").map((saga) => [saga.id, saga])),
    [nodes],
  );

  const events = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return nodes
      .filter((node) => node.type === "book")
      .filter((book) => !needle || `${book.title} ${book.author}`.toLowerCase().includes(needle))
      .filter((book) => genre === "tots" || book.genre === genre)
      .filter((book) => status === "tots" || book.status === status)
      .map((book) => ({ book, event: getEvent(book, mode) }))
      .filter((entry) => entry.event);
  }, [genre, mode, nodes, query, status]);

  const minEvent = events.length
    ? Math.min(...events.map((entry) => entry.event.start))
    : EMPTY_TIMELINE_FALLBACK_TS;
  const maxEvent = events.length
    ? Math.max(...events.map((entry) => entry.event.end))
    : EMPTY_TIMELINE_FALLBACK_TS;
  const minTs = new Date(new Date(minEvent).getFullYear() - 1, 0, 1).getTime();
  const maxTs = new Date(new Date(maxEvent).getFullYear() + 1, 0, 1).getTime();
  const pxPerDay = 0.72 * zoom;
  const timelineWidth = Math.max(1180, ((maxTs - minTs) / DAY_MS) * pxPerDay);
  const xFor = useCallback(
    (ts) => ((ts - minTs) / DAY_MS) * pxPerDay,
    [minTs, pxPerDay],
  );
  const ticks = useMemo(() => buildTicks(minTs, maxTs, pxPerDay), [maxTs, minTs, pxPerDay]);
  const gridTicks = useMemo(() => ticks.filter((tick) => tick.major), [ticks]);

  const lanes = useMemo(() => {
    const groups = new Map();
    events.forEach(({ book, event }) => {
      const saga = book.parentSagaId ? sagas.get(book.parentSagaId) : null;
      const key = saga?.id || "standalone";
      if (!groups.has(key)) {
        groups.set(key, {
          id: key,
          title: saga?.title || "Llibres independents",
          subtitle: saga ? `${saga.readBooks || 0}/${saga.totalBooks || 0} llegits` : "Sense saga",
          saga,
          items: [],
        });
      }
      groups.get(key).items.push({ book, event, x: xFor(event.anchor) });
    });

    return [...groups.values()]
      .map((lane) => ({ ...lane, layout: assignSlots(lane.items) }))
      .sort((left, right) => {
        if (left.id === "standalone") return 1;
        if (right.id === "standalone") return -1;
        return left.title.localeCompare(right.title, "ca");
      });
  }, [events, sagas, xFor]);

  const stats = useMemo(() => {
    let completed = 0;
    let pages = 0;
    let ratingTotal = 0;
    let ratingCount = 0;

    events.forEach(({ book }) => {
      if (book.status === "completat") completed += 1;
      pages += book.pageCount || 0;
      if (book.rating > 0) {
        ratingTotal += book.rating;
        ratingCount += 1;
      }
    });

    return {
      books: events.length,
      completed,
      pages,
      rating: ratingCount ? (ratingTotal / ratingCount).toFixed(1) : "—",
    };
  }, [events]);

  const yearHistogram = (() => {
    const counts = new Map();
    events.forEach(({ event }) => {
      const year = new Date(event.anchor).getFullYear();
      counts.set(year, (counts.get(year) || 0) + 1);
    });
    const values = [...counts.entries()].sort((a, b) => a[0] - b[0]);
    const max = Math.max(1, ...values.map(([, count]) => count));
    return values.map(([year, count]) => ({ year, count, height: (count / max) * 42 }));
  })();

  const centerAll = () => {
    if (scrollRef.current) scrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
  };

  return (
    <div className="bv-atlas">
      <section className="bv-atlas-hero">
        <div className="bv-atlas-hero__copy">
          <div className="bv-eyebrow"><Sparkles size={13} /> Reading Atlas</div>
          <h1>La teva vida lectora, convertida en paisatge.</h1>
          <p>Explora quan vas descobrir, començar i acabar cada llibre. Les sagues es converteixen en carrils i cada lectura deixa una empremta temporal.</p>
        </div>
        <div className="bv-atlas-stats">
          <Stat label="Llibres visibles" value={stats.books} icon={BookOpen} />
          <Stat label="Completats" value={stats.completed} icon={CalendarDays} />
          <Stat label="Pàgines" value={stats.pages.toLocaleString("ca-ES")} icon={Layers3} />
          <Stat label="Valoració mitjana" value={stats.rating} icon={Star} />
        </div>
        <div className="bv-atlas-histogram" aria-label="Lectures per any">
          {yearHistogram.map((item) => (
            <div key={item.year} title={`${item.count} llibres el ${item.year}`}>
              <span style={{ height: item.height }} />
              <small>{item.year}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="bv-atlas-controls">
        <div className="bv-atlas-tabs">
          <button type="button" className={mode === "activity" ? "is-active" : ""} onClick={() => setMode("activity")}>Activitat</button>
          <button type="button" className={mode === "read" ? "is-active" : ""} onClick={() => setMode("read")}>Lectures</button>
          <button type="button" className={mode === "added" ? "is-active" : ""} onClick={() => setMode("added")}>Biblioteca</button>
        </div>
        <label className="bv-atlas-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cerca dins l’atles" /></label>
        <button type="button" className={`bv-atlas-filter-button ${controlsOpen ? "is-active" : ""}`} onClick={() => setControlsOpen((value) => !value)}><Filter size={15} /> Filtres <ChevronDown size={14} /></button>
        <label className="bv-atlas-zoom"><ZoomIn size={15} /><input type="range" min="0.45" max="3" step="0.05" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} /><span>{Math.round(zoom * 100)}%</span></label>
        <button type="button" className="bv-atlas-center" onClick={centerAll}>Veure inici</button>
        {controlsOpen ? (
          <div className="bv-atlas-filter-popover">
            <label><span>Gènere</span><select value={genre} onChange={(event) => setGenre(event.target.value)}><option value="tots">Tots</option>{GENRES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
            <label><span>Estat</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="tots">Tots</option><option value="pendent">Pendent</option><option value="en-lectura">En lectura</option><option value="pausat">Pausat</option><option value="abandonat">Abandonat</option><option value="completat">Completat</option></select></label>
          </div>
        ) : null}
      </section>

      {events.length ? (
        <div className="bv-atlas-scroll" ref={scrollRef}>
          <div className="bv-atlas-axis-row" style={{ width: timelineWidth + 220 }}>
            <div className="bv-atlas-axis-label"><Clock3 size={14} /> Cronologia</div>
            <div className="bv-atlas-axis" style={{ width: timelineWidth }}>
              {ticks.map((tick) => (
                <div key={tick.ts} className={`bv-atlas-tick ${tick.major ? "is-major" : ""}`} style={{ left: xFor(tick.ts) }}><span /><small>{tick.label}</small></div>
              ))}
            </div>
          </div>

          {lanes.map((lane) => {
            const laneHeight = Math.max(112, lane.layout.slots * SLOT_HEIGHT + 28);
            return (
              <div key={lane.id} className="bv-atlas-lane" style={{ width: timelineWidth + 220, height: laneHeight }}>
                <div className="bv-atlas-lane__label">
                  <span className={lane.saga ? "is-saga" : "is-standalone"}>{lane.saga ? <Layers3 size={15} /> : <BookOpen size={15} />}</span>
                  <div><strong>{lane.title}</strong><small>{lane.subtitle}</small></div>
                </div>
                <div className="bv-atlas-lane__track" style={{ width: timelineWidth, height: laneHeight }}>
                  {gridTicks.map((tick) => <span key={tick.ts} className="bv-atlas-gridline is-major" style={{ left: xFor(tick.ts) }} />)}
                  {lane.layout.items.map(({ book, event, x, slot }) => {
                    const segmentLeft = xFor(event.start);
                    const segmentWidth = Math.max(2, xFor(event.end) - segmentLeft);
                    return (
                      <div key={book.id}>
                        {event.end > event.start ? <span className="bv-reading-segment" style={{ left: segmentLeft, width: segmentWidth, top: slot * SLOT_HEIGHT + 54 }} /> : null}
                        <button
                          type="button"
                          className={`bv-timeline-card bv-timeline-card--${book.status}`}
                          style={{ left: x - CARD_WIDTH / 2, top: slot * SLOT_HEIGHT + 12 }}
                          onClick={() => onSelectBook(book)}
                          title={`${book.title} — ${formatDate(event.anchor)}`}
                        >
                          <img src={book.cover || bookCover} alt="" loading="lazy" decoding="async" />
                          <span className="bv-timeline-card__copy">
                            <strong>{book.title}</strong>
                            <small>{book.author || "Autor desconegut"}</small>
                            <em>{formatDate(event.anchor)}</em>
                          </span>
                          {book.rating > 0 ? <span className="bv-timeline-card__rating"><Star size={11} fill="currentColor" />{book.rating}</span> : null}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bv-atlas-empty">
          <span><CalendarDays size={30} /></span>
          <h2>No hi ha dates per mostrar amb aquests filtres.</h2>
          <p>Afegeix una data de lectura o d’addició als llibres, o canvia el mode de l’atles temporal.</p>
        </div>
      )}
    </div>
  );
}
