export function PictoYeux(): React.JSX.Element {
  return (
    <svg className="picto" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M2.5 12S6.2 6.5 12 6.5 21.5 12 21.5 12 17.8 17.5 12 17.5 2.5 12 2.5 12Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="12" r="2.4" fill="currentColor" />
    </svg>
  )
}

export function PictoBouger(): React.JSX.Element {
  return (
    <svg className="picto" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="4.5" r="2" fill="currentColor" />
      <path
        d="M12 7.2v6.2M12 9.2 7.2 6.4M12 9.2l5.2 2.2M12 13.4 8.6 19M12 13.4l3.6 5.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function PictoPosture(): React.JSX.Element {
  return (
    <svg className="picto" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="4.5" r="2" fill="currentColor" />
      <path
        d="M6.5 10.2h11M12 8v5.2M12 13.2 8.6 19.2M12 13.2l3.4 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function PictoLibre(): React.JSX.Element {
  return (
    <svg className="picto" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M8 4.5h8l-.8 12.2a3.2 3.2 0 0 1-3.2 2.8 3.2 3.2 0 0 1-3.2-2.8L8 4.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M8.6 10h6.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
