// Sidebar.jsx
import universeCover from "../assets/covers/universe-default.jpg";
import sagaCover from "../assets/covers/saga-default.jpg";
import bookCover from "../assets/covers/book-default.jpg";
import { useRef, useState } from "react";

import {
  Library,
  Book,
  Home,
  ArrowLeft,
  DoorOpen,
  PlusCircle,
  Link as LinkIcon,
  Type,
  User,
  Shapes,
  ListChecks,
  Hash,
  Calendar,
  Star,
  StickyNote,
  Tag,
  Globe,
  Image,
  Trash2
} from "lucide-react";

  const ICON_SIZE = 16;
  const getCoverImage = (node) => {
    if (!node) return null;

    // ⭐ Cover personalitzada
    if (node.cover) return node.cover;

    // Fallbacks
    if (node.type === "universe") return universeCover;
    if (node.type === "saga") return sagaCover;
    if (node.type === "book") return bookCover;

    return null;
  };

  const getGenreOverlayColor = (node) => {
  if (!node) return "rgba(0,0,0,0.4)";

  switch (node.genre) {
    case "fantasia":
      return "rgba(124, 58, 237, 0.35)"; // violeta
    case "ciencia-ficcio":
      return "rgba(37, 99, 235, 0.35)"; // blau
    case "romantica":
      return "rgba(219, 39, 119, 0.35)"; // rosa
    case "thriller":
      return "rgba(185, 28, 28, 0.35)"; // vermell
    default:
      return "rgba(15, 23, 42, 0.35)"; // neutre
  }
};

function Sidebar({
  node,
  nodes,
  onNodeChange,
  onEnterSaga,
  onExitSaga,
  onEnterUniverse,   // ⭐
  onExitUniverse,    // ⭐
  onSelectNode,
  onCreateBookInsideSaga,
  onRequestDelete,
  viewMode
}) {

  const fileInputRef = useRef(null);
  const [coverHover, setCoverHover] = useState(false);

  const handleChange = (field, value) => {
    if (!node) return;
    onNodeChange({ ...node, [field]: value });
  };

  const isSaga = node?.type === "saga";
  const isBook = node?.type === "book";
  const isUniverse = node?.type === "universe";

  const sagaBooks = isSaga
    ? nodes
        .filter((n) => n.parentSagaId === node.id)
        .sort((a, b) => (a.volume || 0) - (b.volume || 0))
    : [];

  const sagas = nodes.filter((n) => n.type === "saga");

  const universes = nodes.filter((n) => n.type === "universe");

  const universeSagas = isUniverse
    ? nodes.filter((n) => n.type === "saga" && n.universeId === node.id)
    : [];

  const universeNameForSaga = isSaga
    ? (universes.find((u) => u.id === node.universeId)?.title || "— Sense univers —")
    : null;

  const titleIcon = isUniverse ? <Globe size={ICON_SIZE} /> :
                  isSaga ? <Library size={ICON_SIZE} /> :
                  isBook ? <Book size={ICON_SIZE} /> :
                  <Home size={ICON_SIZE} />;

  const handleCoverFile = (file) => {
    if (!file || !node) return;

    // 🛡️ Validació bàsica
    if (!file.type.startsWith("image/")) {
      alert("El fitxer ha de ser una imatge");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      onNodeChange({
        ...node,
        cover: reader.result, // ⭐ Base64
      });
    };

    reader.readAsDataURL(file);
  };

  return (
    <div
      className="sidebar-scroll"
      style={{
        height: "100vh",           // ⭐ fixa al viewport
        overflowY: "auto",         // ⭐ scroll intern
        overflowX: "hidden",
        padding: "18px",
        background: "#020617",
        color: "#e5e7eb"
      }}
    >
      {!node && (
      <div
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: "14px",
          opacity: 0.9
        }}
      >

        <h2
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "18px",
            fontWeight: 700
          }}
        >
          <Home size={ICON_SIZE} />
          Sense selecció
        </h2>

        <p style={{ fontSize: "14px", color: "#94a3b8", lineHeight: 1.5 }}>
          Fes clic sobre una saga, univers o llibre al canvas per veure’n els detalls.
        </p>
      </div>
    )}
    {node && (
    <>
      {/* COVER IMAGE */}
      <div
        style={{
          width: "100%",
          aspectRatio: "2 / 3",          // ⭐ clau
          maxHeight: "280px",
          borderRadius: "16px",
          overflow: "hidden",
          marginBottom: "18px",
          background: "#0f172a",
          boxShadow: "0 12px 28px rgba(0,0,0,0.45)",
          position: "relative",
        }}
        className="cover-container"
        onMouseEnter={() => setCoverHover(true)}
        onMouseLeave={() => setCoverHover(false)}
      >
        <img
          src={getCoverImage(node)}
          alt="Cover"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />

        {/* Overlay de color segons gènere */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: getGenreOverlayColor(node),
            mixBlendMode: "multiply",
          }}
        />

        {/* Gradient per llegibilitat */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.05), rgba(0,0,0,0.75))",
          }}
        />

        {coverHover && (
          <button
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              padding: "8px 12px",
              borderRadius: "999px",
              background: "rgba(15,23,42,0.85)",
              color: "white",
              border: "1px solid rgba(255,255,255,0.25)",
              fontSize: "13px",
              cursor: "pointer",
              backdropFilter: "blur(6px)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <Image size={ICON_SIZE} />
            Canviar
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => handleCoverFile(e.target.files[0])}
      />

      {/* TÍTOL NODAL */}
      <h2 style={{ marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
        {titleIcon}
        {isSaga ? "Saga" : isBook ? "Llibre" : "Univers"}
      </h2>

      {/* LLIBRES DE LA SAGA */}
      {isSaga && node.sagaRatingCount > 0 && (
      <div
        style={{
          marginBottom: "16px",
          padding: "12px",
          borderRadius: "10px",
          background: "rgba(15,23,42,0.9)",
          border: "1px solid rgba(148,163,184,0.2)"
        }}
      >
        <h3 style={{ fontSize: "14px", marginBottom: "6px" }}>
          <Star size={ICON_SIZE} style={{ marginRight: 6 }} />
          Valoració de la saga
        </h3>

        <div style={{ fontSize: "22px", fontWeight: 700 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Star size={ICON_SIZE} fill="#facc15" stroke="#facc15" />
            <strong>{node.sagaRatingAvg}</strong> / 5
          </div>
        </div>

        <div style={{ fontSize: "13px", color: "#94a3b8" }}>
          Basat en {node.sagaRatingCount} llibre(s)
        </div>
      </div>
    )}

    {isSaga && (
      <div style={panelStyle}>
        <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "6px" }}>
          Progrés de la saga
        </div>

        {/* Barra */}
        <div
          style={{
            height: "10px",
            borderRadius: "999px",
            background: "#e2e8f0",
            overflow: "hidden",
            marginBottom: "6px"
          }}
        >
          <div
            style={{
              width: `${node.progressPercent || 0}%`,
              height: "100%",
              background:
                node.progressPercent === 100
                  ? "#22c55e"
                  : "#3b82f6",
              transition: "width 0.4s ease"
            }}
          />
        </div>

        <div style={{ fontSize: "13px", color: "#94a3b8" }}>
          {node.readBooks || 0} de {node.totalBooks || 0} llibres llegits ·{" "}
          <strong>{node.progressPercent || 0}%</strong>
        </div>
      </div>
    )}

      {isBook && node.parentSagaId && (
        <button style={buttonStyle} onClick={() => onEnterSaga(node.parentSagaId)}>
          <LinkIcon size={ICON_SIZE} style={{ marginRight: 6 }} />
          Anar a la saga
        </button>
      )}

      {/* --- UNIVERS INFO --- */}
      {isUniverse && (
        <div style={panelStyle}>
          <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "6px" }}>
            Sagues dins l’univers
          </div>

          {universeSagas.length === 0 ? (
            <div style={{ fontSize: "13px", color: "#64748b" }}>
              Encara no hi ha sagues assignades a aquest univers.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {universeSagas.map((s) => (
                <button
                  key={s.id}
                  style={{
                    ...buttonStyle,
                    marginTop: 0,
                    background: "rgba(15,23,42,0.9)",
                    color: "#e5e7eb",
                    border: "1px solid rgba(148,163,184,0.25)",
                    justifyContent: "space-between",
                    padding: "10px 12px"
                  }}
                  onClick={() => onSelectNode(s.id)}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Library size={ICON_SIZE} />
                    {s.title}
                  </span>
                  <span style={{ fontSize: 12, color: "#64748b" }}>Obrir</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FORMULARI AMB ICONES */}
      <Label icon={<Type />} text="Títol" />
      <input style={inputStyle} value={node.title || ""} onChange={(e) => handleChange("title", e.target.value)} />

      <Label icon={<User />} text="Autor/a" />
      <input style={inputStyle} value={node.author || ""} onChange={(e) => handleChange("author", e.target.value)} />

      <Label icon={<Shapes />} text="Gènere" />
      <select style={inputStyle} value={node.genre} onChange={(e) => handleChange("genre", e.target.value)}>
        <option value="fantasia">Fantasia</option>
        <option value="ciencia-ficcio">Ciència-ficció</option>
        <option value="romantica">Romàntica</option>
        <option value="thriller">Thriller</option>
        <option value="altres">Altres</option>
      </select>

      <Label icon={<ListChecks />} text="Estat de lectura" />
      <select
        style={inputStyle}
        value={node.status}
        onChange={(e) => handleChange("status", e.target.value)}
      >
        {isSaga ? (
          <>
            <option value="no-comencada">No començada</option>
            <option value="en-lectura">En lectura</option>
            <option value="pausada">Pausada</option>
            <option value="acabada">Acabada</option>
          </>
        ) : (
          <>
            <option value="pendent">Pendent</option>
            <option value="en-lectura">En lectura</option>
            <option value="pausat">Pausat</option>
            <option value="abandonat">Abandonat</option>
            <option value="completat">Completat</option>
          </>
        )}
      </select>

      {/* FORMULARI DE LLIBRE */}
      {isBook && (
        <>
          <Label icon={<Hash />} text="Volum" />
          <input
            style={inputStyle}
            type="number"
            value={node.volume || 1}
            onChange={(e) => handleChange("volume", Number(e.target.value))}
          />

          <Label icon={<Calendar />} text="Data d’inici" />
          <input
            type="date"
            style={inputStyle}
            value={node.startDate || ""}
            onChange={(e) => handleChange("startDate", e.target.value)}
          />

          <Label icon={<Calendar />} text="Data de fi" />
          <input
            type="date"
            style={inputStyle}
            value={node.endDate || ""}
            onChange={(e) => handleChange("endDate", e.target.value)}
          />

          <Label icon={<Star />} text="Valoració" />
          <input
            type="number"
            min="0"
            max="5"
            step="0.5"
            style={inputStyle}
            value={node.rating || 0}
            onChange={(e) => handleChange("rating", Number(e.target.value))}
          />
        </>
      )}

      {/* CANVIAR SAGA DEL LLIBRE */}
      {isBook && (
        <>
          <Label icon={<Library />} text="Saga" />
          <select
            style={inputStyle}
            value={node.parentSagaId || ""}
            onChange={(e) =>
              handleChange(
                "parentSagaId",
                e.target.value === "" ? null : e.target.value
              )
            }
          >
            <option value="">— Sense saga —</option>

            {sagas.map((saga) => (
              <option key={saga.id} value={saga.id}>
                {saga.title}
              </option>
            ))}
          </select>
        </>
      )}

      {/* CANVIAR UNIVERS DE LA SAGA */}
      {isSaga && (
        <>
          <Label icon={<Globe />} text="Univers" />
          <select
            style={inputStyle}
            value={node.universeId || ""}
            onChange={(e) =>
              handleChange("universeId", e.target.value === "" ? null : e.target.value)
            }
          >
            <option value="">— Sense univers —</option>
            {universes.map((u) => (
              <option key={u.id} value={u.id}>
                {u.title}
              </option>
            ))}
          </select>

          {/* Info ràpida */}
          <div style={{ fontSize: "13px", color: "#64748b", marginTop: 6 }}>
            Ara està a: <strong>{universeNameForSaga}</strong>
          </div>
        </>
      )}

      {/* FORMULARI DE SAGA */}
      {isSaga && (
        <>
          <Label icon={<Hash />} text="Total llibres" />
          <input
            type="number"
            style={inputStyle}
            value={node.totalBooks || 0}
            onChange={(e) => handleChange("totalBooks", Number(e.target.value))}
          />

          <Label icon={<Hash />} text="Llibres llegits" />
          <input
            type="number"
            style={inputStyle}
            value={node.readBooks || 0}
            onChange={(e) => handleChange("readBooks", Number(e.target.value))}
          />
        </>
      )}

      <Label icon={<StickyNote />} text="Notes" />
      <textarea
        style={{ ...inputStyle, height: "120px" }}
        value={node.notes || ""}
        onChange={(e) => handleChange("notes", e.target.value)}
      />

      <Label icon={<Tag />} text="Tags" />
      <input
        style={inputStyle}
        value={Array.isArray(node.tags) ? node.tags.join(", ") : ""}
        onChange={(e) =>
          handleChange(
            "tags",
            e.target.value.split(",").map((t) => t.trim())
          )
        }
      />
      <button
        style={{
          ...buttonStyle,
          background: "rgba(127,29,29,0.25)",
          border: "1px solid rgba(248,113,113,0.35)",
          color: "#fecaca",
          marginTop: 24,
        }}
        onClick={() => onRequestDelete(node)}
      >
        <Trash2 size={ICON_SIZE} />
        Esborrar 
        {node.type === "book"
          ? " llibre"
          : node.type === "saga"
          ? " saga"
          : " univers"}
      </button>
      </>
    )}
    </div>
  );
}

const Label = ({ icon, text }) => (
  <label style={labelStyle}>
    <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      {icon} {text}
    </span>
  </label>
);

const labelStyle = {
  display: "block",
  marginTop: "18px",
  marginBottom: "6px",
  fontSize: "13px",
  fontWeight: 600,
  letterSpacing: "0.02em",
  color: "#cbd5f5"
};

const inputStyle = {
  width: "100%",
  padding: "11px 12px",
  borderRadius: "12px",
  border: "1px solid rgba(148,163,184,0.15)",
  background: "rgba(15,23,42,0.75)",
  color: "#e5e7eb",
  fontSize: "14px",
  outline: "none"
};

const buttonStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "12px",
  marginTop: "12px",
  background: "linear-gradient(180deg, #1e293b, #020617)",
  color: "#e5e7eb",
  fontWeight: 600,
  border: "1px solid rgba(148,163,184,0.25)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  boxShadow: "0 6px 18px rgba(0,0,0,0.4)"
};

const panelStyle = {
  marginBottom: "16px",
  padding: "14px",
  borderRadius: "14px",
  background: "rgba(15,23,42,0.8)",
  border: "1px solid rgba(148,163,184,0.15)",
  boxShadow: "0 10px 30px rgba(0,0,0,0.35)"
};

export default Sidebar;
