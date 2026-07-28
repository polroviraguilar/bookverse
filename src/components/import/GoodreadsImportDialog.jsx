import { useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  BookCheck,
  BookOpen,
  Check,
  ChevronLeft,
  FileSpreadsheet,
  Layers3,
  Search,
  Sparkles,
  Star,
  UploadCloud,
} from "lucide-react";
import {
  buildGoodreadsImport,
  getGoodreadsPreviewStats,
  parseGoodreadsCsv,
} from "../../importers/goodreads.js";
import Button from "../ui/Button.jsx";
import Modal from "../ui/Modal.jsx";

export default function GoodreadsImportDialog({
  open,
  nodes,
  origin,
  onClose,
  onImport,
}) {
  const fileRef = useRef(null);
  const [step, setStep] = useState("upload");
  const [items, setItems] = useState([]);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [onlySeries, setOnlySeries] = useState(false);
  const [duplicateStrategy, setDuplicateStrategy] = useState("update");
  const [targetUniverseId, setTargetUniverseId] = useState("");
  const [createSagas, setCreateSagas] = useState(true);
  const [summary, setSummary] = useState(null);

  const universes = nodes.filter((node) => node.type === "universe");
  const previewStats = useMemo(() => getGoodreadsPreviewStats(items), [items]);
  const visibleItems = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      const match = !needle || `${item.title} ${item.author} ${item.seriesName}`.toLowerCase().includes(needle);
      return match && (!onlySeries || item.seriesName);
    });
  }, [items, onlySeries, query]);

  const reset = () => {
    setStep("upload");
    setItems([]);
    setFileName("");
    setError("");
    setQuery("");
    setOnlySeries(false);
    setDuplicateStrategy("update");
    setTargetUniverseId("");
    setCreateSagas(true);
    setSummary(null);
  };

  const close = () => {
    reset();
    onClose();
  };

  const loadFile = async (file) => {
    if (!file) return;
    try {
      setError("");
      const text = await file.text();
      const parsed = parseGoodreadsCsv(text);
      setItems(parsed);
      setFileName(file.name);
      setStep("review");
    } catch (loadError) {
      setError(loadError.message || "No s’ha pogut llegir el fitxer.");
    }
  };

  const updateItem = (importId, patch) => {
    setItems((current) => current.map((item) => item.importId === importId ? { ...item, ...patch } : item));
  };

  const toggleAllVisible = (selected) => {
    const ids = new Set(visibleItems.map((item) => item.importId));
    setItems((current) => current.map((item) => ids.has(item.importId) ? { ...item, selected } : item));
  };

  const runImport = () => {
    const result = buildGoodreadsImport(nodes, items, {
      createSagas,
      duplicateStrategy,
      targetUniverseId: targetUniverseId || null,
      origin,
    });
    onImport(result.nodes);
    setSummary(result.summary);
    setStep("done");
  };

  let footer = null;
  if (step === "review") {
    footer = (
      <>
        <Button icon={ChevronLeft} onClick={() => setStep("upload")}>Tornar</Button>
        <Button variant="primary" icon={Sparkles} onClick={() => setStep("options")} disabled={!previewStats.books}>
          Configurar importació
        </Button>
      </>
    );
  }
  if (step === "options") {
    footer = (
      <>
        <Button icon={ChevronLeft} onClick={() => setStep("review")}>Revisar llibres</Button>
        <Button variant="primary" icon={UploadCloud} onClick={runImport}>Importar {previewStats.books} llibres</Button>
      </>
    );
  }
  if (step === "done") {
    footer = <Button variant="primary" icon={Check} onClick={close}>Acabar</Button>;
  }

  return (
    <Modal
      open={open}
      title="Importa la teva biblioteca de Goodreads"
      eyebrow="Bookverse Import Studio"
      onClose={close}
      width="min(1120px, calc(100vw - 32px))"
      className="bv-goodreads-modal"
      footer={footer}
    >
      {step === "upload" ? (
        <div className="bv-import-upload">
          <div
            className="bv-dropzone"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              loadFile(event.dataTransfer.files?.[0]);
            }}
          >
            <span className="bv-dropzone__icon"><FileSpreadsheet size={32} /></span>
            <div className="bv-eyebrow">Goodreads Library Export</div>
            <h3>Arrossega aquí el teu fitxer CSV</h3>
            <p>Bookverse detectarà llibres, estats, valoracions, dates, ISBN i sagues abans d’importar res.</p>
            <Button variant="primary" icon={UploadCloud} onClick={() => fileRef.current?.click()}>Seleccionar CSV</Button>
            <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={(event) => loadFile(event.target.files?.[0])} />
          </div>
          {error ? <div className="bv-import-error"><AlertTriangle size={18} /><span>{error}</span></div> : null}
          <div className="bv-import-guarantees">
            <div><BookOpen size={18} /><span><strong>Vista prèvia completa</strong><small>No s’importa res sense confirmació.</small></span></div>
            <div><Layers3 size={18} /><span><strong>Detecció de sagues</strong><small>Revisa i corregeix la saga i el volum.</small></span></div>
            <div><BookCheck size={18} /><span><strong>Control de duplicats</strong><small>Actualitza o ignora llibres ja existents.</small></span></div>
          </div>
        </div>
      ) : null}

      {step === "review" ? (
        <div className="bv-import-review">
          <div className="bv-import-summarybar">
            <div><span>Llibres</span><strong>{previewStats.books}</strong></div>
            <div><span>Llegits</span><strong>{previewStats.completed}</strong></div>
            <div><span>En lectura</span><strong>{previewStats.reading}</strong></div>
            <div><span>Valorats</span><strong>{previewStats.rated}</strong></div>
            <div><span>Sagues</span><strong>{previewStats.series}</strong></div>
            <small>{fileName}</small>
          </div>

          <div className="bv-import-toolbar">
            <label className="bv-import-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cerca dins la importació" /></label>
            <label className="bv-check-row"><input type="checkbox" checked={onlySeries} onChange={(event) => setOnlySeries(event.target.checked)} /><span>Només amb saga detectada</span></label>
            <button type="button" onClick={() => toggleAllVisible(true)}>Seleccionar visibles</button>
            <button type="button" onClick={() => toggleAllVisible(false)}>Desmarcar visibles</button>
          </div>

          <div className="bv-import-table-wrap">
            <table className="bv-import-table">
              <thead>
                <tr>
                  <th aria-label="Seleccionar" />
                  <th>Llibre</th>
                  <th>Estat</th>
                  <th>Valoració</th>
                  <th>Saga detectada</th>
                  <th>Volum</th>
                </tr>
              </thead>
              <tbody>
                {visibleItems.map((item) => (
                  <tr key={item.importId} className={item.selected ? "" : "is-disabled"}>
                    <td><input type="checkbox" checked={item.selected !== false} onChange={(event) => updateItem(item.importId, { selected: event.target.checked })} /></td>
                    <td><strong>{item.title}</strong><small>{item.author}</small></td>
                    <td><span className={`bv-import-status bv-import-status--${item.status}`}>{item.status}</span></td>
                    <td>{item.rating > 0 ? <span className="bv-rating-chip"><Star size={13} fill="currentColor" />{item.rating}</span> : <span className="bv-muted">—</span>}</td>
                    <td><input value={item.seriesName} onChange={(event) => updateItem(item.importId, { seriesName: event.target.value })} placeholder="Sense saga" /></td>
                    <td><input className="bv-volume-input" type="number" step="0.5" value={item.seriesVolume ?? ""} onChange={(event) => updateItem(item.importId, { seriesVolume: Number(event.target.value) || null, seriesVolumeLabel: event.target.value })} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {step === "options" ? (
        <div className="bv-import-options">
          <div className="bv-import-options__hero">
            <span><Sparkles size={24} /></span>
            <div><div className="bv-eyebrow">Preparat per importar</div><h3>{previewStats.books} llibres i {previewStats.series} sagues potencials</h3><p>Tria com s’han de tractar les relacions i els duplicats. La teva biblioteca actual no s’esborrarà.</p></div>
          </div>

          <div className="bv-option-grid">
            <section>
              <div className="bv-option-title"><Layers3 size={18} /><div><strong>Crear sagues detectades</strong><small>Genera nodes de saga i hi vincula els llibres.</small></div></div>
              <label className="bv-switch"><input type="checkbox" checked={createSagas} onChange={(event) => setCreateSagas(event.target.checked)} /><span /></label>
            </section>

            <section>
              <div className="bv-option-title"><BookCheck size={18} /><div><strong>Duplicats</strong><small>Comparació per Goodreads ID, ISBN i títol + autor.</small></div></div>
              <select value={duplicateStrategy} onChange={(event) => setDuplicateStrategy(event.target.value)}>
                <option value="update">Actualitzar els llibres existents</option>
                <option value="skip">Ignorar els llibres existents</option>
              </select>
            </section>

            <section>
              <div className="bv-option-title"><BookOpen size={18} /><div><strong>Univers de destinació</strong><small>Opcional. Les sagues i llibres independents quedaran dins d’aquest univers.</small></div></div>
              <select value={targetUniverseId} onChange={(event) => setTargetUniverseId(event.target.value)}>
                <option value="">Sense univers assignat</option>
                {universes.map((universe) => <option key={universe.id} value={universe.id}>{universe.title}</option>)}
              </select>
            </section>
          </div>

          <div className="bv-import-note"><AlertTriangle size={17} /><p><strong>Les dates es tracten amb rigor.</strong> Goodreads aporta la data d’addició i, sovint, la data final de lectura, però no sempre la data d’inici. Bookverse no inventarà aquesta dada.</p></div>
        </div>
      ) : null}

      {step === "done" && summary ? (
        <div className="bv-import-complete">
          <span className="bv-import-complete__icon"><Check size={34} /></span>
          <div className="bv-eyebrow">Importació completada</div>
          <h3>La teva biblioteca ja forma part de Bookverse.</h3>
          <p>Hem normalitzat les dades i actualitzat les relacions de saga de manera segura.</p>
          <div className="bv-import-complete__stats">
            <div><span>Creats</span><strong>{summary.created}</strong></div>
            <div><span>Actualitzats</span><strong>{summary.updated}</strong></div>
            <div><span>Ignorats</span><strong>{summary.skipped}</strong></div>
            <div><span>Sagues noves</span><strong>{summary.sagasCreated}</strong></div>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
