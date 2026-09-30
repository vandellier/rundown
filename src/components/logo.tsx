export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="#1b160f" />
      <path
        d="M7 22h18M9.5 16.5h13M12 11h8"
        fill="none"
        stroke="#e4b15a"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Equalizer() {
  return (
    <span className="eq" aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
  );
}
