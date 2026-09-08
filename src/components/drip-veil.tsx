export function DripVeil() {
  return (
    <svg
      className="pointer-events-none absolute inset-x-0 top-0 z-0 h-36 w-full opacity-90"
      viewBox="0 0 400 140"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d="M12 0 v38 c0 14 8 18 8 32 s-7 22 -7 40"
        fill="none"
        stroke="var(--color-magenta)"
        strokeWidth="5"
        strokeLinecap="round"
        opacity="0.85"
      />
      <path
        d="M46 0 v22 c0 10 6 14 6 26 s-5 16 -5 30"
        fill="none"
        stroke="var(--color-magenta)"
        strokeWidth="3.5"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d="M78 0 v16 c0 8 4 10 4 20"
        fill="none"
        stroke="var(--color-magenta)"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.55"
      />
      <circle cx="13" cy="112" r="4" fill="var(--color-magenta)" />
      <circle cx="47" cy="80" r="3" fill="var(--color-magenta)" />
      <path
        d="M388 0 v44 c0 12 -7 16 -7 28 s6 18 6 34"
        fill="none"
        stroke="var(--color-magenta)"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.75"
      />
      <circle cx="387" cy="108" r="3.5" fill="var(--color-magenta)" />
    </svg>
  );
}
