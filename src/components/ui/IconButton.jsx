export default function IconButton({
  icon: Icon,
  label,
  active = false,
  className = "",
  ...props
}) {
  return (
    <button
      type="button"
      className={`bv-icon-button ${active ? "is-active" : ""} ${className}`.trim()}
      aria-label={label}
      title={label}
      {...props}
    >
      <Icon size={18} aria-hidden="true" />
    </button>
  );
}
