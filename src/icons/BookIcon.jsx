export default function BookIcon({ size = 16, color = "#94a3b8" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M6 4h11a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"
        stroke={color}
        strokeWidth="2"
      />
      <path d="M6 8h12" stroke={color} strokeWidth="2" />
    </svg>
  );
}
