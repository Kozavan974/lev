export function Logo({
  className = 'notification-logo'
}: {
  className?: string
}): React.JSX.Element {
  return (
    <svg className={className} viewBox="2.4 -1.3 24 24" fill="none" aria-hidden="true">
      <path
        d="M9.6 8 Q8.4 12.5 9 15.2 Q9.6 18 12.6 18 H20.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="11.4" cy="3.7" r="1.9" fill="var(--soleil)" />
    </svg>
  )
}
