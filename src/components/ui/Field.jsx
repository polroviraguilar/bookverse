export default function Field({ label, hint, icon: Icon, children, className = "" }) {
  return (
    <label className={`bv-field ${className}`.trim()}>
      <span className="bv-field__label">
        <span>
          {Icon ? <Icon size={14} aria-hidden="true" /> : null}
          {label}
        </span>
        {hint ? <small>{hint}</small> : null}
      </span>
      {children}
    </label>
  );
}
