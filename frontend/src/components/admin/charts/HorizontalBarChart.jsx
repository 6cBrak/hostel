import { useId, useState } from 'react'

const BAR_HEIGHT = 20
const BAR_GAP = 14 // between category rows
const SERIES_GAP = 2 // surface gap between grouped bars in the same row
const RADIUS = 4
const LABEL_WIDTH = 168
const CHART_WIDTH = 420
const TIP_LABEL_WIDTH = 74

// A horizontal rect rounded only on its data-end (right side), square at the baseline (left).
function roundedRightRectPath(w, h, r) {
  const rr = Math.min(r, h / 2, Math.max(w, 0.01) / 2)
  if (w <= 0) return ''
  if (w < rr * 2) {
    return `M0,0 H${w} V${h} H0 Z`
  }
  return `M0,0 H${w - rr} A${rr},${rr} 0 0 1 ${w},${rr} V${h - rr} A${rr},${rr} 0 0 1 ${w - rr},${h} H0 Z`
}

/**
 * Graphique en barres horizontales — 1 ou 2 séries groupées.
 * Suit le skill dataviz : marks ≤24px, extrémité arrondie 4px, légende
 * uniquement à partir de 2 séries, étiquette directe à l'extrémité de chaque barre,
 * infobulle au survol.
 */
export default function HorizontalBarChart({ title, hint, data, series, valueFormatter = (v) => v, getColor }) {
  const [hovered, setHovered] = useState(null) // { rowIndex, seriesKey }
  const uid = useId()

  const maxValue = Math.max(1, ...data.flatMap((d) => series.map((s) => Number(d[s.key]) || 0)))
  const trackWidth = CHART_WIDTH - LABEL_WIDTH - TIP_LABEL_WIDTH
  const rowHeight = series.length > 1 ? series.length * BAR_HEIGHT + (series.length - 1) * SERIES_GAP : BAR_HEIGHT
  const svgHeight = data.length * (rowHeight + BAR_GAP) - BAR_GAP + 8

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      {hint && <p className="mt-0.5 text-xs text-gray-500">{hint}</p>}

      {series.length > 1 && (
        <div className="mt-2 flex flex-wrap gap-4">
          {series.map((s) => (
            <span key={s.key} className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
      )}

      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${svgHeight}`}
        width="100%"
        height={svgHeight}
        role="img"
        aria-label={title}
        className="mt-3 overflow-visible"
      >
        {data.map((row, rowIndex) => {
          const y0 = rowIndex * (rowHeight + BAR_GAP)
          return (
            <g key={row.label} transform={`translate(0, ${y0})`}>
              <text
                x={LABEL_WIDTH - 10}
                y={rowHeight / 2}
                textAnchor="end"
                dominantBaseline="central"
                className="fill-gray-700"
                style={{ fontSize: 12 }}
              >
                {row.label}
              </text>

              {series.map((s, sIndex) => {
                const value = Number(row[s.key]) || 0
                const w = (value / maxValue) * trackWidth
                const barY = sIndex * (BAR_HEIGHT + SERIES_GAP)
                const isHovered = hovered?.rowIndex === rowIndex && hovered?.seriesKey === s.key
                const tipLabel = valueFormatter(value)
                const barColor = getColor ? getColor(row, s.key) : s.color

                return (
                  <g
                    key={s.key}
                    transform={`translate(${LABEL_WIDTH}, ${barY})`}
                    onPointerEnter={() => setHovered({ rowIndex, seriesKey: s.key })}
                    onPointerLeave={() => setHovered(null)}
                    tabIndex={0}
                    onFocus={() => setHovered({ rowIndex, seriesKey: s.key })}
                    onBlur={() => setHovered(null)}
                  >
                    {/* track */}
                    <rect x={0} y={0} width={trackWidth} height={BAR_HEIGHT} fill="#f3f4f6" rx={RADIUS} />
                    {/* larger invisible hit area for easier hover */}
                    <rect x={-4} y={-4} width={trackWidth + TIP_LABEL_WIDTH + 8} height={BAR_HEIGHT + 8} fill="transparent" />
                    <path
                      d={roundedRightRectPath(Math.max(w, value > 0 ? 3 : 0), BAR_HEIGHT, RADIUS)}
                      fill={barColor}
                      opacity={isHovered ? 0.85 : 1}
                    />
                    <text
                      x={Math.max(w, 0) + 8}
                      y={BAR_HEIGHT / 2}
                      dominantBaseline="central"
                      className="fill-gray-500"
                      style={{ fontSize: 11, fontVariantNumeric: 'tabular-nums' }}
                    >
                      {tipLabel}
                    </text>

                    {isHovered && (
                      <g transform={`translate(${Math.min(w, trackWidth) / 2}, ${-10})`}>
                        <foreignObject x={-60} y={-28} width={120} height={24} style={{ overflow: 'visible' }}>
                          <div className="pointer-events-none flex justify-center">
                            <div className="rounded bg-gray-900 px-2 py-1 text-center text-[11px] font-medium text-white shadow">
                              {row.label}{series.length > 1 ? ` · ${s.label}` : ''}: {tipLabel}
                            </div>
                          </div>
                        </foreignObject>
                      </g>
                    )}
                  </g>
                )
              })}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
