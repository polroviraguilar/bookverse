import { AlertTriangle, Trash2 } from "lucide-react";
import Button from "./Button.jsx";
import Modal from "./Modal.jsx";

export default function ConfirmDialog({ open, node, onCancel, onConfirm }) {
  const label = node?.type === "book" ? "llibre" : node?.type === "saga" ? "saga" : "univers";
  return (
    <Modal
      open={open}
      title="Confirmar l’eliminació"
      eyebrow="Acció irreversible"
      onClose={onCancel}
      width="min(520px, calc(100vw - 32px))"
      className="bv-modal--danger"
      footer={
        <>
          <Button onClick={onCancel}>Cancel·lar</Button>
          <Button variant="danger" icon={Trash2} onClick={onConfirm}>
            Eliminar {label}
          </Button>
        </>
      }
    >
      <div className="bv-confirm-copy">
        <span className="bv-confirm-copy__icon"><AlertTriangle size={24} /></span>
        <div>
          <p>
            Estàs a punt d’eliminar <strong>{node?.title}</strong>.
          </p>
          <p>
            {node?.type === "universe"
              ? "També s’eliminaran totes les sagues i tots els llibres que conté."
              : node?.type === "saga"
                ? "També s’eliminaran tots els llibres assignats a aquesta saga."
                : "Aquesta acció no es pot desfer."}
          </p>
        </div>
      </div>
    </Modal>
  );
}
