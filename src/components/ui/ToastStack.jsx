import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

const icons = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
};

export default function ToastStack({ toasts, onDismiss }) {
  return (
    <div className="bv-toast-stack" aria-live="polite">
      {toasts.map((toast) => {
        const Icon = icons[toast.type] || Info;
        return (
          <div key={toast.id} className={`bv-toast bv-toast--${toast.type || "info"}`}>
            <Icon size={18} aria-hidden="true" />
            <div>
              <strong>{toast.title}</strong>
              {toast.message ? <p>{toast.message}</p> : null}
            </div>
            <button type="button" onClick={() => onDismiss(toast.id)} aria-label="Tancar">
              <X size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
