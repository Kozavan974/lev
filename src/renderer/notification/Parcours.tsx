interface Point {
  x: number
  y: number
}

const LARGEUR = 320
const HAUTEUR = 72

export function Parcours({ faits, total }: { faits: number; total: number }): React.JSX.Element {
  const points = pointsDuParcours(total)
  const fait = Math.max(0, Math.min(faits, points.length - 1))
  return (
    <svg viewBox={`0 0 ${LARGEUR} ${HAUTEUR}`} aria-hidden="true">
      <path
        d={chemin(points)}
        fill="none"
        stroke="var(--trace)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {fait >= 2 ? (
        <path
          d={chemin(points.slice(0, fait))}
          fill="none"
          stroke="var(--action)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      ) : null}
      {points.map((point, index) => (
        <circle
          key={index}
          cx={point.x}
          cy={point.y}
          r="5.5"
          fill={couleurPoint(index, fait, points.length)}
        />
      ))}
    </svg>
  )
}

function pointsDuParcours(total: number): Point[] {
  const nombre = Math.max(total, 1) + 1
  const marge = 12
  return Array.from({ length: nombre }, (_, index) => {
    const t = nombre === 1 ? 0 : index / (nombre - 1)
    return {
      x: marge + t * (LARGEUR - marge * 2),
      y: 36 - Math.sin(t * Math.PI * 2) * 12
    }
  })
}

function chemin(points: readonly Point[]): string {
  const debut = points[0]
  if (!debut || points.length < 2) {
    return ''
  }
  let trace = `M ${debut.x} ${debut.y}`
  for (let index = 0; index < points.length - 1; index += 1) {
    const p0 = points[index - 1] ?? points[index]
    const p1 = points[index]
    const p2 = points[index + 1]
    const p3 = points[index + 2] ?? p2
    if (!p0 || !p1 || !p2 || !p3) {
      continue
    }
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    trace += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`
  }
  return trace
}

function couleurPoint(index: number, faits: number, nombre: number): string {
  if (index === nombre - 1) {
    return 'var(--soleil)'
  }
  if (index < faits) {
    return 'var(--action)'
  }
  return 'var(--trace)'
}
