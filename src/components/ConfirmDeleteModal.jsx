import { AlertTriangle, Trash2, X } from "lucide-react";

function ConfirmDeleteModal({ open, title, message, onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <AlertTriangle size={20} color="#b91c1c" />
          <h3 style={{ margin: 0 }}>{title}</h3>
        </div>
        <p style={{ marginBottom: 20, color: "#475569" }}>{message}</p>

        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <button style={cancelBtn} onClick={onCancel}>
            Cancel·lar
          </button>
          <button style={dangerBtn} onClick={onConfirm}>
            Esborrar
          </button>
        </div>
      </div>
    </div>
  );
}

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(15,23,42,0.55)",
  backdropFilter: "blur(6px)",
  zIndex: 10000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const modalStyle = {
  background: "white",
  borderRadius: 16,
  padding: 24,
  width: 360,
  boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
  border: "1px solid #fecaca",
};

const cancelBtn = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  background: "#f8fafc",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 6,
};

const dangerBtn = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid #b91c1c",
  background: "#b91c1c",
  color: "white",
  fontWeight: 600,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 6,
};

export default ConfirmDeleteModal;
