export default function Button({
  children,
  icon: Icon,
  variant = "secondary",
  size = "md",
  className = "",
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      className={`bv-button bv-button--${variant} bv-button--${size} ${className}`.trim()}
      {...props}
    >
      {Icon ? <Icon size={size === "sm" ? 15 : 17} aria-hidden="true" /> : null}
      <span>{children}</span>
    </button>
  );
}
