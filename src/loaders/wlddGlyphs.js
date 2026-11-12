/*
  WLDD master letters. Every coordinate is derived from one unit, x (the stem width), so every
  measurement on the construction sheets is exact. Traced original kept in wlddTraced.js.

  Letter      width 3x (W 7x) · height 5½x · stems 1x
  W           tops 1x wide at 0–1x, 3–4x, 6–7x · feet 1¼x wide · every stroke edge parallel (lean 1:4), so stems stay 1x · valleys at 4x · peak at 2x · mirrored
  L           stem 1x · foot 1x · width 3x
  D           width 3x · bowl corners r 1½x · counter 1x wide, ends r ½x (fully round)
  Spacing     W ½x L · D starts 1x after L's stem (overlaps the foot) · D ½x D
  Stagger     D¹ top 0 · W +1x · L +3x · D² +4x (each from D¹'s top)
  Mark        outline stroke ⅓x, centred (shows ⅙x outside) · extrusion 1x → 1x ↓ (45°)
*/
export const X = 20.5
export const CAP = 5.5 * X
export const R = 1.5 * X // D bowl radius
export const RI = 0.5 * X // D counter end radius = half the counter width
export const OUT = X / 3 // outline stroke, centred on the edge
export const EX = X, EY = X // extrusion
const r0 = X / 8 // the D's square corners, just softened

const TOP = 3.5 // D¹ top, in logo space
const LEFT = 9 // W left

/** Rounded rectangle as a path. radii: [top-left, top-right, bottom-right, bottom-left] */
function rr(x0, y0, x1, y1, [tl, tr, br, bl]) {
  return `M${x0 + tl} ${y0}H${x1 - tr}A${tr} ${tr} 0 0 1 ${x1} ${y0 + tr}V${y1 - br}A${br} ${br} 0 0 1 ${x1 - br} ${y1}` +
    `H${x0 + bl}A${bl} ${bl} 0 0 1 ${x0} ${y1 - bl}V${y0 + tl}A${tl} ${tl} 0 0 1 ${x0 + tl} ${y0}Z`
}
const poly = (pts) => 'M' + pts.map((p) => p.join(' ')).join('L') + 'Z'
const at = (x0, y0, uv) => uv.map(([u, v]) => [x0 + u * X, y0 + v * X])

/* positions, all in x */
const W0 = [LEFT, TOP + 1 * X]
const L0 = [LEFT + 7.5 * X, TOP + 3 * X]
const D10 = [L0[0] + 2 * X, TOP]
const D20 = [D10[0] + 3.5 * X, TOP + 4 * X]

const W_UV = [[0, 0], [1, 0], [2, 4], [3, 0], [4, 0], [5, 4], [6, 0], [7, 0], [5.625, 5.5], [4.375, 5.5], [3.5, 2], [2.625, 5.5], [1.375, 5.5]]
const L_UV = [[0, 0], [1, 0], [1, 4.5], [3, 4.5], [3, 5.5], [0, 5.5]]

function dGlyph([x0, y0], c) {
  const x1 = x0 + 3 * X, y1 = y0 + CAP
  const ix0 = x0 + X, iy0 = y0 + X, ix1 = x1 - X, iy1 = y1 - X
  return {
    ch: 'D', c, box: [x0, y0, x1, y1], counter: [ix0, iy0, ix1, iy1],
    d: rr(x0, y0, x1, y1, [r0, R, R, r0]) + rr(ix0, iy0, ix1, iy1, [r0, RI, RI, r0]),
    nodes: [
      [[x0, y0], [x1 - R, y0], [x1, y0 + R], [x1, y1 - R], [x1 - R, y1], [x0, y1]],
      [[ix0, iy0], [ix1 - RI, iy0], [ix1, iy0 + RI], [ix1, iy1 - RI], [ix1 - RI, iy1], [ix0, iy1]],
    ],
    arcs: [[x1 - R, y0 + R, R], [x1 - R, y1 - R, R], [ix1 - RI, iy0 + RI, RI], [ix1 - RI, iy1 - RI, RI]],
  }
}
const W_PTS = at(W0[0], W0[1], W_UV)
const L_PTS = at(L0[0], L0[1], L_UV)

export const GLYPHS = [
  { ch: 'W', c: '#72CE85', box: [W0[0], W0[1], W0[0] + 7 * X, W0[1] + CAP], d: poly(W_PTS), nodes: [W_PTS], arcs: [] },
  { ch: 'L', c: '#D37AF4', box: [L0[0], L0[1], L0[0] + 3 * X, L0[1] + CAP], d: poly(L_PTS), nodes: [L_PTS], arcs: [] },
  dGlyph(D10, '#ED4C6F'),
  dGlyph(D20, '#F2C92D'),
]

/** x-multiples as labels: 0.5 → "½x", 5.5 → "5½x", 1/3 → "⅓x". */
export function ux(v) {
  const n = v / X
  const FR = [[0, ''], [1 / 6, '⅙'], [1 / 4, '¼'], [1 / 3, '⅓'], [1 / 2, '½'], [2 / 3, '⅔'], [3 / 4, '¾']]
  const w = Math.floor(n + 1e-6), f = n - w
  const hit = FR.find(([v2]) => Math.abs(f - v2) < 0.01)
  if (!hit) return n.toFixed(2) + 'x'
  return (w ? w : hit[1] ? '' : '0') + hit[1] + 'x'
}
