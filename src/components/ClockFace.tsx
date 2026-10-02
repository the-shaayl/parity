import { formatTime } from '../modes/clock/generator'

const C = 100 // centre of the 200 × 200 drawing
const TICKS = Array.from({ length: 60 }, (_, i) => i)
const HOURS = Array.from({ length: 12 }, (_, i) => i + 1)

/** Point at `radius` from the centre, `degrees` clockwise from 12 o'clock. */
function polar(degrees: number, radius: number): [number, number] {
  const rad = (degrees * Math.PI) / 180
  return [C + radius * Math.sin(rad), C - radius * Math.cos(rad)]
}

/** A plain analog clock. The hour hand sits between the hours as the minutes pass. */
export function ClockFace({ hour, minute, className = '' }: { hour: number; minute: number; className?: string }) {
  const hourAngle = (hour % 12) * 30 + minute * 0.5
  const minuteAngle = minute * 6
  // The minute hand stops short of the numbers, which it always points at on this game's times.
  const [hx, hy] = polar(hourAngle, 40)
  const [mx, my] = polar(minuteAngle, 61)

  return (
    <svg
      viewBox="0 0 200 200"
      role="img"
      aria-label={`Clock showing ${formatTime(hour, minute)}`}
      className={className}
    >
      <circle cx={C} cy={C} r={97} fill="none" stroke="var(--border)" strokeWidth={2} />

      {TICKS.map((i) => {
        const hourMark = i % 5 === 0
        const [x1, y1] = polar(i * 6, hourMark ? 85 : 89)
        const [x2, y2] = polar(i * 6, 93)
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={hourMark ? 'var(--fg)' : 'var(--muted)'}
            strokeWidth={hourMark ? 2 : 1}
            strokeLinecap="round"
          />
        )
      })}

      {HOURS.map((h) => {
        const [x, y] = polar(h * 30, 72)
        return (
          <text
            key={h}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={14}
            fontWeight={600}
            fill="var(--muted)"
          >
            {h}
          </text>
        )
      })}

      {/* Hour hand: short and thick. Minute hand: long and thin. */}
      <line x1={C} y1={C} x2={hx} y2={hy} stroke="var(--fg)" strokeWidth={7} strokeLinecap="round" />
      <line x1={C} y1={C} x2={mx} y2={my} stroke="var(--fg)" strokeWidth={2.5} strokeLinecap="round" />
      <circle cx={C} cy={C} r={5} fill="var(--fg)" />
    </svg>
  )
}
