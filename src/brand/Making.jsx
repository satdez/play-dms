import { useEffect, useMemo, useRef, useState } from 'react'
import { MousePointer2, PenTool, Square, Pipette, Spline, Copy, Pause, Play, RotateCcw } from 'lucide-react'
import { Tip } from '../shared/motion'
import { GLYPHS, X, R, RI, OUT, EX, EY, ux } from '../loaders/wlddGlyphs'

/*
  The making of the mark. Four cursors draw the four letters at once (pen, rectangle, rounded
  rectangle, corner radius), one cursor selects, picks colours with the eyedropper and fills, then
  adds the outline and the extrusion. Every point comes from the master geometry, so the last frame
  IS the logo. One clock drives everything; no state is stored per element.
*/
const [W, L, D1, D2] = GLYPHS
const WN = W.nodes[0]
const r0 = X / 8
const OUTER = [r0, R, R, r0]
const INNER = [r0, RI, RI, r0]
const ANGLE = Math.round((Math.atan2(EY, EX) * 180) / Math.PI)
const V = { x: -36, y: -26, w: 440, h: 292 }
const BOX = [W.box[0], D1.box[1], D2.box[2], D2.box[3]]
const DUR = 16
const REST = 14.2 // the frame shown for reduced motion

/* ── time helpers ── */
const clamp = (v) => Math.min(1, Math.max(0, v))
const ramp = (t, a, b) => clamp((t - a) / (b - a))
const io = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2)
const out = (u) => 1 - Math.pow(1 - u, 4)
const lerp = (a, b, u) => a + (b - a) * u
/** Position along waypoints [[t, x, y], …], eased between each pair. */
function track(t, pts) {
  if (t <= pts[0][0]) return [pts[0][1], pts[0][2]]
  for (let i = 0; i < pts.length - 1; i++) {
    const [a, ax, ay] = pts[i], [b, bx, by] = pts[i + 1]
    if (t < b) { const u = io(ramp(t, a, b)); return [lerp(ax, bx, u), lerp(ay, by, u)] }
  }
  const e = pts[pts.length - 1]
  return [e[1], e[2]]
}
const drag = (t, a, b, from, to) => { const u = io(ramp(t, a, b)); return [lerp(from[0], to[0], u), lerp(from[1], to[1], u)] }

function rrect(x0, y0, x1, y1, rad) {
  const w = x1 - x0, h = y1 - y0
  if (w < 0.5 || h < 0.5) return ''
  const m = Math.min(w, h) / 2
  const [tl, tr, br, bl] = rad.map((r) => Math.min(r, m))
  return `M${x0 + tl} ${y0}H${x1 - tr}A${tr} ${tr} 0 0 1 ${x1} ${y0 + tr}V${y1 - br}A${br} ${br} 0 0 1 ${x1 - br} ${y1}` +
    `H${x0 + bl}A${bl} ${bl} 0 0 1 ${x0} ${y1 - bl}V${y0 + tl}A${tl} ${tl} 0 0 1 ${x0 + tl} ${y0}Z`
}
const box = (a, b) => { const x0 = Math.min(a[0], b[0]), y0 = Math.min(a[1], b[1]); return rrect(x0, y0, Math.max(a[0], b[0]), Math.max(a[1], b[1]), [0, 0, 0, 0]) }

/* ── the script ── */
const TC = (k) => 0.6 + k * 0.26 // W: pen click k (13 anchors, then close on the first)
const [lx0, ly0, lx1, ly1] = L.box
const L_STEM = [[lx0, ly0], [lx0 + X, ly1]]
const L_FOOT = [[lx0 + 3 * X, ly1], [lx0, ly0 + 4.5 * X]]
const [d1x0, d1y0, d1x1, d1y1] = D1.box, [c1x0, c1y0, c1x1, c1y1] = D1.counter
const [d2x0, d2y0, d2x1, d2y1] = D2.box, [c2x0, c2y0, c2x1, c2y1] = D2.counter
const SEL = [5.1, 5.9]
const PICK = (i) => 6.9 + i * 1.05
const FILL = (i) => [PICK(i) + 0.72, PICK(i) + 1.05]
const OUTLINE = [11.8, 12.4]
const EXTRUDE = [13.0, 13.9]
const FILL_AT = [
  [W.box[0] + 0.75 * X, W.box[1] + X],
  [L.box[0] + 0.5 * X, L.box[1] + 2 * X],
  [D1.box[0] + 0.5 * X, D1.box[1] + 2.5 * X],
  [D2.box[0] + 0.5 * X, D2.box[1] + 2.5 * X],
]
const MQ = [[BOX[0] - 16, BOX[1] - 16], [BOX[2] + 18, BOX[3] + 18]]

const IRA = [[0.2, lx0 - 34, ly0 - 26], [0.8, lx0, ly0], [1.5, ...L_STEM[1]], [1.9, ...L_FOOT[0]], [2.6, ...L_FOOT[1]], [4.5, ...L_FOOT[1]]]
const DEV = [[0.3, d1x0 - 30, d1y0 - 24], [0.9, d1x0, d1y0], [1.8, d1x1, d1y1], [2.1, c1x0, c1y0], [2.8, c1x1, c1y1], [4.5, c1x1, c1y1]]
const NEEL = [[0.4, d2x0 - 30, d2y0 - 24], [1.1, d2x0, d2y0], [2.0, d2x1, d2y1], [2.3, d2x1, d2y1], [3.1, d2x1 - R, d2y1 - R],
  [3.3, c2x0, c2y0], [3.9, c2x1, c2y1], [3.95, c2x1, c2y1], [4.45, c2x1 - RI, c2y1 - RI], [4.6, c2x1 - RI, c2y1 - RI]]

function pal(K) {
  const w = 122 * K, h = 38 * K
  const x = (BOX[0] + BOX[2] + EX) / 2 - w / 2, y = 238
  return { x, y, w, h, sw: (i) => [x + (8 + 11 + 28 * i) * K, y + 19 * K], start: [x - 12 * K, y + h + 6 * K] }
}
function satiPts(K) {
  const P = pal(K)
  const pts = [[0.2, WN[0][0] - 40, WN[0][1] - 28]]
  WN.forEach((p, k) => { if (k > 0) pts.push([TC(k - 1) + 0.04, ...WN[k - 1]]); pts.push([TC(k), ...p]) })
  pts.push([TC(12) + 0.04, ...WN[12]], [TC(13), ...WN[0]], [4.5, ...WN[0]], [SEL[0], ...MQ[0]], [SEL[1], ...MQ[1]], [6.35, ...MQ[1]], [6.75, ...P.start])
  let prev = P.start
  for (let i = 0; i < 4; i++) {
    const s = P.sw(i), t = PICK(i)
    pts.push([t, ...prev], [t + 0.3, ...s], [t + 0.42, ...s], [t + 0.72, ...FILL_AT[i]], [t + 0.9, ...FILL_AT[i]])
    prev = FILL_AT[i]
  }
  pts.push([11.2, ...prev], [OUTLINE[0], W.box[0], W.box[1]], [12.5, W.box[0], W.box[1]], [12.8, d2x1, d2y1], [EXTRUDE[0], d2x1, d2y1], [EXTRUDE[1], d2x1 + EX, d2y1 + EY], [14.3, d2x1 + EX, d2y1 + EY])
  return pts
}

/* ── clock ── */
function useClock(run) {
  const [t, setT] = useState(0)
  const ref = useRef(0)
  useEffect(() => {
    if (!run) return
    let raf, last = performance.now()
    const tick = (now) => { ref.current = (ref.current + (now - last) / 1000) % DUR; last = now; setT(ref.current); raf = requestAnimationFrame(tick) }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [run])
  return [t, (v) => { ref.current = v; setT(v) }]
}

/* ── pieces (pixel-sized things live in a group scaled by K, so they stay the same size on screen) ── */
function Cursor({ x, y, c, name, body, icon: Icon, K, op, tag, p }) {
  const hot = body === 'arrow' ? [3, 3] : [2, 22]
  const Body = body === 'pen' ? PenTool : body === 'pipette' ? Pipette : MousePointer2
  const w = name.length * 6.4 + 26
  return (
    <g transform={`translate(${x} ${y}) scale(${K})`} opacity={op} pointerEvents="none">
      <Body x={-hot[0] * (20 / 24)} y={-hot[1] * (20 / 24)} size={20} strokeWidth={2}
        color={body === 'arrow' ? '#fff' : p.ink} fill={body === 'arrow' ? c : 'none'} />
      <g transform="translate(11 11)">
        <rect width={w} height="17" rx="8.5" fill={c} />
        <Icon x="6" y="3.5" size={10} strokeWidth={2.4} color="#141414" />
        <text x="19" y="12" fill="#141414" style={{ font: "600 10px 'Geist','Inter',system-ui,sans-serif" }}>{name}</text>
      </g>
      {tag && <Tag x={11} y={34} p={p}>{tag}</Tag>}
    </g>
  )
}
function Tag({ x, y, children, p }) {
  const w = String(children).length * 6.1 + 12
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width={w} height="17" rx="5" fill={p.bg} stroke={p.guide} strokeWidth="1" opacity=".92" />
      <text x="6" y="12" fill={p.note} style={{ font: "500 10px 'Geist Mono',ui-monospace,monospace" }}>{children}</text>
    </g>
  )
}
const Anchor = ({ x, y, c, K, solid }) => (
  <rect x={x - 3 * K} y={y - 3 * K} width={6 * K} height={6 * K} fill={solid ? c : 'var(--anchor-bg)'} stroke={c} strokeWidth="1" vectorEffect="non-scaling-stroke" />
)

const TOOLS = [
  { id: 'pen', icon: PenTool, label: 'Pen' },
  { id: 'shape', icon: Square, label: 'Shape' },
  { id: 'select', icon: MousePointer2, label: 'Select' },
  { id: 'pipette', icon: Pipette, label: 'Eyedropper' },
  { id: 'outline', icon: Spline, label: 'Outline' },
  { id: 'copy', icon: Copy, label: 'Offset' },
]
const activeTools = (t) => (t < 4.5 ? ['pen', 'shape'] : t < 6.2 ? ['select'] : t < 11.5 ? ['pipette'] : t < 12.6 ? ['outline'] : t < 14.4 ? ['copy'] : [])

export default function Making({ p, id }) {
  const wrap = useRef(null)
  const [K, setK] = useState(0.42)
  const [vis, setVis] = useState(true)
  const [playing, setPlaying] = useState(true)
  const reduce = useMemo(() => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches, [])
  const [clock, seek] = useClock(playing && vis && !reduce)
  const t = reduce ? REST : clock

  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const ro = new ResizeObserver(() => setK(Math.min(1.2, Math.max(0.3, V.w / Math.max(el.clientWidth, 1)))))
    const io2 = new IntersectionObserver(([e]) => setVis(e.isIntersecting), { threshold: 0.1 })
    ro.observe(el); io2.observe(el)
    return () => { ro.disconnect(); io2.disconnect() }
  }, [])

  const P = pal(K)
  const sati = useMemo(() => satiPts(K), [K])
  const fade = Math.min(ramp(t, 0, 0.3), 1 - ramp(t, 15.45, 15.95))

  /* letters: drawing (thin stroke in the cursor's colour) */
  const nW = WN.filter((_, k) => t >= TC(k)).length
  const wClosed = t >= TC(13)
  const sPos = track(t, sati)
  const wD = nW ? 'M' + WN.slice(0, nW).map((q) => q.join(' ')).join('L') + (wClosed ? 'Z' : '') : ''

  const stemC = drag(t, 0.8, 1.5, L_STEM[0], L_STEM[1]), footC = drag(t, 1.9, 2.6, L_FOOT[0], L_FOOT[1])
  const d1o = drag(t, 0.9, 1.8, [d1x0, d1y0], [d1x1, d1y1]), d1i = drag(t, 2.1, 2.8, [c1x0, c1y0], [c1x1, c1y1])
  const d2o = drag(t, 1.1, 2.0, [d2x0, d2y0], [d2x1, d2y1]), d2i = drag(t, 3.3, 3.9, [c2x0, c2y0], [c2x1, c2y1])
  const radO = R * io(ramp(t, 2.3, 3.1)), radI = RI * io(ramp(t, 3.95, 4.45))
  const lUnion = ramp(t, 3.0, 3.4)

  const draw = [
    wD,
    lUnion >= 1 ? L.d : (t > 0.8 ? box(L_STEM[0], stemC) : '') + (t > 1.9 ? box(L_FOOT[0], footC) : ''),
    (t > 0.9 ? rrect(d1x0, d1y0, d1o[0], d1o[1], OUTER) : '') + (t > 2.1 ? rrect(c1x0, c1y0, d1i[0], d1i[1], INNER) : ''),
    (t > 1.1 ? rrect(d2x0, d2y0, d2o[0], d2o[1], [r0 * io(ramp(t, 2.3, 3.1)), radO, radO, r0 * io(ramp(t, 2.3, 3.1))]) : '') +
      (t > 3.3 ? rrect(c2x0, c2y0, d2i[0], d2i[1], [r0, radI, radI, r0]) : ''),
  ]
  const thin = 1 - ramp(t, OUTLINE[0], OUTLINE[1])
  const nodeOp = [1, lUnion * ramp(t, 3.3, 3.7), ramp(t, 2.9, 3.2), ramp(t, 4.3, 4.6)].map((v) => v * (1 - ramp(t, 11.7, 12.1)))
  const fillU = GLYPHS.map((_, i) => ramp(t, ...FILL(i)))
  const inkU = ramp(t, OUTLINE[0], OUTLINE[1])
  const extU = io(ramp(t, ...EXTRUDE))

  /* cursors */
  const cs = [
    { name: 'Sati', c: W.c, pos: sPos, body: t < 4.5 ? 'pen' : t >= 6.35 && t < 11.5 ? 'pipette' : 'arrow', icon: t < 4.5 ? PenTool : t < 6.35 ? MousePointer2 : t < 11.5 ? Pipette : t < 12.6 ? Spline : Copy,
      op: ramp(t, 0.2, 0.5) * (1 - ramp(t, 14.4, 14.9)),
      tag: t > SEL[0] && t < 6.4 ? `${ux(Math.abs(sPos[0] - MQ[0][0]))} × ${ux(Math.abs(sPos[1] - MQ[0][1]))}` : t > OUTLINE[0] && t < 12.9 ? `outline ${ux(OUT)}` : t > EXTRUDE[0] - 0.1 && t < 14.3 ? `${ux(EX)} → ${ux(EY)} ↓ · ${ANGLE}°` : '' },
    { name: 'Ira', c: L.c, pos: track(t, IRA), body: 'arrow', icon: Square, op: ramp(t, 0.3, 0.6) * (1 - ramp(t, 4.7, 5.1)),
      tag: t > 0.8 && t < 1.8 ? `${ux(Math.abs(stemC[0] - L_STEM[0][0]))} × ${ux(Math.abs(stemC[1] - L_STEM[0][1]))}` : t > 1.9 && t < 2.9 ? `${ux(Math.abs(footC[0] - L_FOOT[0][0]))} × ${ux(Math.abs(footC[1] - L_FOOT[0][1]))}` : '' },
    { name: 'Dev', c: D1.c, pos: track(t, DEV), body: 'arrow', icon: Square, op: ramp(t, 0.4, 0.7) * (1 - ramp(t, 4.7, 5.1)),
      tag: t > 0.9 && t < 2.05 ? `${ux(d1o[0] - d1x0)} × ${ux(d1o[1] - d1y0)}` : t > 2.1 && t < 3.1 ? `${ux(d1i[0] - c1x0)} × ${ux(d1i[1] - c1y0)}` : '' },
    { name: 'Neel', c: D2.c, pos: track(t, NEEL), body: 'arrow', icon: Square, op: ramp(t, 0.5, 0.8) * (1 - ramp(t, 4.7, 5.1)),
      tag: t > 1.1 && t < 2.3 ? `${ux(d2o[0] - d2x0)} × ${ux(d2o[1] - d2y0)}` : t > 2.3 && t < 3.3 ? `r ${ux(radO)}` : t > 3.3 && t < 4.2 ? `${ux(d2i[0] - c2x0)} × ${ux(d2i[1] - c2y0)}` : t > 4.2 && t < 4.7 ? `r ${ux(radI)}` : '' },
  ]

  /* palette */
  const open = out(ramp(t, 6.55, 6.8)) * (1 - ramp(t, 11.2, 11.45))
  const picked = [0, 1, 2, 3].filter((i) => t >= PICK(i) + 0.3).pop() ?? -1
  const ps = 0.93 + 0.07 * open
  const ox = P.x, oy = P.y + P.h
  const hex = picked >= 0 ? GLYPHS[picked].c.toUpperCase() : ''
  const clickRing = [0, 1, 2, 3].map((i) => ramp(t, PICK(i) + 0.72, PICK(i) + 1.05))

  const active = activeTools(t)
  const hand = (cx, cy, op, key) => op > 0.01 && <circle key={key} cx={cx} cy={cy} r={3.2 * K} fill="var(--anchor-bg)" stroke={D2.c} strokeWidth="1" vectorEffect="non-scaling-stroke" opacity={op} />
  const hO = ramp(t, 2.2, 2.3) * (1 - ramp(t, 3.1, 3.5)), hI = ramp(t, 3.85, 3.95) * (1 - ramp(t, 4.45, 4.85))
  const sel = ramp(t, SEL[1], SEL[1] + 0.05) * (1 - ramp(t, 6.2, 6.5))

  return (
    <section className="br-plate">
      <div className="br-head">
        <h2>Making</h2>
        <div className="br-ctl">
          <Tip label={playing ? 'Pause' : 'Play'}><button className="b ghost icon sm" onClick={() => setPlaying(!playing)} aria-label={playing ? 'Pause' : 'Play'}>{playing ? <Pause size={15} /> : <Play size={15} />}</button></Tip>
          <Tip label="Replay"><button className="b ghost icon sm" onClick={() => { seek(0); setPlaying(true) }} aria-label="Replay"><RotateCcw size={15} /></button></Tip>
        </div>
      </div>
      <div className="br-art br-make" style={{ '--anchor-bg': p.bg, background: p.bg }}>
        <div className="br-rail">
          {TOOLS.map((o) => (
            <Tip key={o.id} label={o.label}><span className={'br-tool' + (active.includes(o.id) ? ' on' : '')}><o.icon size={16} /></span></Tip>
          ))}
        </div>
        <div className="br-stage" ref={wrap}>
          <svg viewBox={`${V.x} ${V.y} ${V.w} ${V.h}`} xmlns="http://www.w3.org/2000/svg" role="img" aria-label="WLDD, drawn by four cursors">
            <defs>
              <pattern id={id + 'dots'} width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="6" cy="6" r=".8" fill={p.ghost} opacity=".45" /></pattern>
              {GLYPHS.map((g, i) => (
                <clipPath key={i} id={id + 'f' + i}><rect x={g.box[0] - OUT} y={g.box[1] - OUT} width={(g.box[2] - g.box[0] + 2 * OUT) * fillU[i]} height={g.box[3] - g.box[1] + 2 * OUT} /></clipPath>
              ))}
            </defs>
            <rect x={V.x} y={V.y} width={V.w} height={V.h} fill={p.bg} />
            <rect x={V.x} y={V.y} width={V.w} height={V.h} fill={`url(#${id}dots)`} />
            <g opacity={fade}>
              {GLYPHS.map((g, i) => (
                <g key={i}>
                  {extU > 0 && Array.from({ length: 7 }, (_, k) => (
                    <path key={k} d={g.d} fill={p.mark} stroke={p.mark} strokeWidth={OUT} strokeLinejoin="round" transform={`translate(${(EX * extU * (k + 1)) / 7} ${(EY * extU * (k + 1)) / 7})`} />
                  ))}
                  {inkU > 0 && <path d={g.d} fill="none" stroke={p.mark} strokeWidth={OUT} strokeLinejoin="round" opacity={inkU} />}
                  {fillU[i] > 0 && <path d={g.d} fill={g.c} fillRule="evenodd" clipPath={`url(#${id}f${i})`} />}
                  {thin > 0 && draw[i] && <path d={draw[i]} fill="none" stroke={g.c} strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" opacity={thin}
                    strokeDasharray={undefined} />}
                  {/* pen rubber band */}
                  {i === 0 && !wClosed && nW > 0 && thin > 0 && (
                    <line x1={WN[nW - 1][0]} y1={WN[nW - 1][1]} x2={sPos[0]} y2={sPos[1]} stroke={g.c} strokeWidth="1.2" vectorEffect="non-scaling-stroke" strokeDasharray="3 3" />
                  )}
                  {/* anchors */}
                  {nodeOp[i] > 0.01 && <g opacity={nodeOp[i]}>
                    {(i === 0 ? WN.slice(0, nW) : i === 1 ? L.nodes[0] : g.nodes.flat()).map(([x, y], k, a) => (
                      <Anchor key={k} x={x} y={y} c={g.c} K={K} solid={i === 0 && !wClosed && k === a.length - 1} />
                    ))}
                  </g>}
                </g>
              ))}
              {/* corner-radius handles */}
              {[hand(d2x1 - radO, d2y0 + radO, hO, 'a'), hand(d2x1 - radO, d2y1 - radO, hO, 'b'), hand(c2x1 - radI, c2y0 + radI, hI, 'c'), hand(c2x1 - radI, c2y1 - radI, hI, 'd')]}
              {/* selection */}
              {t > SEL[0] && t < 6.6 && (
                t < SEL[1]
                  ? <rect x={MQ[0][0]} y={MQ[0][1]} width={Math.max(0, sPos[0] - MQ[0][0])} height={Math.max(0, sPos[1] - MQ[0][1])} fill={p.note} fillOpacity=".08" stroke={p.note} strokeWidth="1" vectorEffect="non-scaling-stroke" strokeDasharray="4 3" />
                  : <g opacity={sel}>
                    <rect x={BOX[0]} y={BOX[1]} width={BOX[2] - BOX[0]} height={BOX[3] - BOX[1]} fill="none" stroke={p.note} strokeWidth="1" vectorEffect="non-scaling-stroke" />
                    {[[BOX[0], BOX[1]], [BOX[2], BOX[1]], [BOX[0], BOX[3]], [BOX[2], BOX[3]]].map(([x, y], k) => <Anchor key={k} x={x} y={y} c={p.note} K={K} />)}
                  </g>
              )}
              {/* click ring on fill */}
              {clickRing.map((u, i) => u > 0 && u < 1 && <circle key={i} cx={FILL_AT[i][0]} cy={FILL_AT[i][1]} r={(4 + 16 * out(u)) * K} fill="none" stroke={GLYPHS[i].c} strokeWidth="1.5" vectorEffect="non-scaling-stroke" opacity={1 - u} />)}
              {/* palette */}
              {open > 0.01 && (
                <g opacity={open} transform={`translate(${ox} ${oy}) scale(${ps}) translate(${-ox} ${-oy})`}>
                  <g transform={`translate(${P.x} ${P.y}) scale(${K})`}>
                    <rect width="122" height="38" rx="11" fill={p.bg} stroke={p.guide} strokeWidth="1" />
                    {GLYPHS.map((g, i) => (
                      <g key={i} transform={`translate(${8 + 28 * i} 8)`}>
                        {picked === i && <rect x="-3" y="-3" width="28" height="28" rx="9" fill="none" stroke={p.ink} strokeWidth="1.5" />}
                        <rect width="22" height="22" rx="7" fill={g.c} />
                      </g>
                    ))}
                  </g>
                  {hex && (
                    <g transform={`translate(${P.x + P.w + 8 * K} ${P.y + 10 * K}) scale(${K})`}>
                      <circle cx="6" cy="9" r="5" fill={GLYPHS[picked].c} />
                      <text x="16" y="13" fill={p.ink} style={{ font: "600 11px 'Geist Mono',ui-monospace,monospace" }}>{hex}</text>
                    </g>
                  )}
                </g>
              )}
              {/* cursors, on top */}
              {cs.map((c) => c.op > 0.01 && <Cursor key={c.name} x={c.pos[0]} y={c.pos[1]} c={c.c} name={c.name} body={c.body} icon={c.icon} K={K} op={c.op} tag={c.tag} p={p} />)}
            </g>
          </svg>
        </div>
      </div>
    </section>
  )
}
