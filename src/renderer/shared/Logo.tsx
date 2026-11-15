export function Logo({
  className = 'notification-logo',
  variante = 'normal',
  animer = false
}: {
  className?: string
  variante?: 'normal' | 'simplifie'
  animer?: boolean
}): React.JSX.Element {
  const classes = animer ? `${className} logo-anime` : className
  if (variante === 'simplifie') {
    return (
      <svg className={classes} viewBox="3 -1.45 24 24" fill="none" aria-hidden="true">
        <path
          d="M9.5 8.5 V14.5 Q9.5 18 13 18 H20.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle className="logo-bulle" cx="11" cy="3.6" r="2.5" fill="var(--soleil)" />
      </svg>
    )
  }
  return (
    <svg className={classes} viewBox="2.4 -1.3 24 24" fill="none" aria-hidden="true">
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
