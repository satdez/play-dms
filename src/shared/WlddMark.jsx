import { GLYPHS, OUT, EX, EY } from '../loaders/wlddGlyphs'

/* The WLDD mark, quiet. Static on purpose (no motion on load). `height` in px.
   filled  — greys for faces, outline and the 1x → 1x extrusion.
   outline — line drawing: the contour of each letter (with its ⅓x outline) and of its extrusion, nothing filled.
             Built by knocking out: a wider shape in the line colour, then the shape itself in the background colour. */
const STEPS = 7
const step = (k) => `translate(${(EX * (k + 1)) / STEPS} ${(EY * (k + 1)) / STEPS})`

export function WlddMark({ height = 64, variant = 'outline', className = '' }) {
  const lw = (1.25 * 232) / height // ~1.25px line at any size
  const sweep = (g, cls, w) => Array.from({ length: STEPS }, (_, k) => (
    <path key={k} d={g.d} className={cls} strokeWidth={w} strokeLinejoin="round" transform={step(k)} />
  ))
  return (
    <svg className={'wm wm-' + variant + ' ' + className} viewBox="-10 -10 392 240" height={height} width={(height * 392) / 240} fill="none" role="img" aria-label="WLDD">
      {GLYPHS.map((g, i) => variant === 'outline' ? (
        <g key={i}>
          <g>{sweep(g, 'wm-line', OUT + lw * 2)}</g>
          <g>{sweep(g, 'wm-bg', OUT)}</g>
          <path d={g.d} className="wm-line" fillRule="evenodd" strokeWidth={OUT + lw * 2} strokeLinejoin="round" />
          <path d={g.d} className="wm-bg" fillRule="evenodd" strokeWidth={OUT} strokeLinejoin="round" />
        </g>
      ) : (
        <g key={i}>
          {sweep(g, 'wm-ink', OUT)}
          <path d={g.d} className="wm-face" fillRule="evenodd" strokeWidth={OUT} strokeLinejoin="round" paintOrder="stroke" />
        </g>
      ))}
    </svg>
  )
}
