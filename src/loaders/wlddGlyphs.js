/*
  WLDD master letters: geometric rebuild of the logo (traced original kept in wlddTraced.js).
  Logo space 370 × 215. Unit x = 20.5 (stem width).
  Cap 111 for every letter · stems 1x · gaps ½x-ish · D bowl corners r 1½x · D counter corners r 11.
  Only straight lines and true arcs.
*/
export const X = 20.5
export const R = X * 1.5 // D bowl radius: 1½x
export const RI = 11 // D counter radius: half the counter width, so its ends are fully round
const r0 = 2.5 // the D's square corners, just softened

/** Rounded rectangle as a path. radii: [top-left, top-right, bottom-right, bottom-left] */
function rr(x0, y0, x1, y1, [tl, tr, br, bl]) {
  return `M${x0 + tl} ${y0}H${x1 - tr}A${tr} ${tr} 0 0 1 ${x1} ${y0 + tr}V${y1 - br}A${br} ${br} 0 0 1 ${x1 - br} ${y1}` +
    `H${x0 + bl}A${bl} ${bl} 0 0 1 ${x0} ${y1 - bl}V${y0 + tl}A${tl} ${tl} 0 0 1 ${x0 + tl} ${y0}Z`
}
const poly = (pts) => 'M' + pts.map((p) => p.join(' ')).join('L') + 'Z'

/* W, mirrored about x = 78 */
const W_PTS = [[9, 19], [29.5, 19], [48.5, 90], [67.75, 19], [88.25, 19], [107.5, 90], [126.5, 19], [147, 19], [120, 130], [96, 130], [78, 71], [60, 130], [36, 130]]
/* L: stem 1x, foot 1x */
const L_PTS = [[159, 58.5], [179.5, 58.5], [179.5, 149], [223, 149], [223, 169.5], [159, 169.5]]

function dGlyph(x0, y0, c) {
  const x1 = x0 + 63, y1 = y0 + 111
  const ix0 = x0 + X, iy0 = y0 + X, ix1 = x1 - X, iy1 = y1 - X
  return {
    ch: 'D', c, box: [x0, y0, x1, y1],
    d: rr(x0, y0, x1, y1, [r0, R, R, r0]) + rr(ix0, iy0, ix1, iy1, [r0, RI, RI, r0]),
    nodes: [
      [[x0, y0], [x1 - R, y0], [x1, y0 + R], [x1, y1 - R], [x1 - R, y1], [x0, y1]],
      [[ix0, iy0], [ix1 - RI, iy0], [ix1, iy0 + RI], [ix1, iy1 - RI], [ix1 - RI, iy1], [ix0, iy1]],
    ],
    arcs: [[x1 - R, y0 + R, R], [x1 - R, y1 - R, R], [ix1 - RI, iy0 + RI, RI], [ix1 - RI, iy1 - RI, RI]],
  }
}

export const GLYPHS = [
  { ch: 'W', c: '#72CE85', box: [9, 19, 147, 130], d: poly(W_PTS), nodes: [W_PTS], arcs: [] },
  { ch: 'L', c: '#D37AF4', box: [159, 58.5, 223, 169.5], d: poly(L_PTS), nodes: [L_PTS], arcs: [] },
  dGlyph(203, 3.5, '#ED4C6F'),
  dGlyph(278, 77.5, '#F2C92D'),
]
