import { useEffect, useRef, useState } from 'react'
import { Sun, Moon, Download } from 'lucide-react'
import { Seg } from '../app/ui'
import { Tip } from '../shared/motion'
import { GLYPHS, X, R, RI, OUT, EX, EY, CAP, ux } from '../loaders/wlddGlyphs'
import '../app/app.css'
import '../app/pages.css'
import '../loaders/loaders.css'
import './brand.css'

/* The geometric master (loaders/wlddGlyphs.js). Everything is built from x, and every label here is computed from the geometry. */
const [WN] = GLYPHS[0].nodes
const LEAN = Math.round((Math.atan2(WN[12][0] - WN[0][0], WN[12][1] - WN[0][1]) * 180) / Math.PI)
const ANGLE = Math.round((Math.atan2(EY, EX) * 180) / Math.PI)
const [W, L, D1, D2] = GLYPHS

/* Palette lives inside each SVG so a downloaded file looks the same as on screen. */
const PAL = {
  light: { bg: '#ECECEA', grid: '#D6D6D2', guide: '#7FA2E0', ink: '#141414', hatch: '#9A9A96', face: '#DADAD6', note: '#2F64C8', ghost: '#8C8C88', mark: '#141414' },
  dark: { bg: '#141415', grid: '#232325', guide: '#3F67B5', ink: '#EDEDED', hatch: '#4A4A4D', face: '#202022', note: '#7FA8F2', ghost: '#6A6A6E', mark: '#000000' },
}
function Style({ p }) {
  return (
    <style>{`
      .bg{fill:${p.bg}} .grid{stroke:${p.grid};stroke-width:.6} .guide{stroke:${p.guide};stroke-width:.7;fill:none}
      .diag{stroke:${p.guide};stroke-width:.7;opacity:.7} .ink{stroke:${p.ink};fill:none}
      .face{stroke:${p.ink};stroke-width:1.2;stroke-linejoin:round} .node{fill:${p.ink}} .node-o{fill:${p.bg};stroke:${p.ink};stroke-width:1}
      .ghost{stroke:${p.ghost};stroke-width:.9;stroke-dasharray:3 2.5;fill:none} .circ{stroke:${p.ink};stroke-width:.8;stroke-dasharray:2.5 2;fill:none}
      .dim{stroke:${p.note};stroke-width:1.6} .dimt{stroke:${p.note};stroke-width:.8} .lab{fill:${p.note};font:500 7px 'Geist Mono',ui-monospace,monospace;letter-spacing:.02em}
      .lab-ink{fill:${p.ink};font:600 7.5px 'Geist Mono',ui-monospace,monospace;letter-spacing:.04em} .hatch{stroke:${p.hatch};stroke-width:.9}
      .band{stroke:${p.guide};opacity:.35;fill:none} .xsq{fill:${p.guide};opacity:.22;stroke:${p.guide};stroke-width:.7} .solid{fill:${p.mark};stroke:${p.mark}} .mface{stroke:${p.mark};stroke-linejoin:round}
      .lab-lg{fill:${p.note};font:500 15px 'Geist Mono',ui-monospace,monospace} .lab-lg-ink{fill:${p.ink};font:600 16px 'Geist Mono',ui-monospace,monospace;letter-spacing:.04em}
    `}</style>
  )
}
function Defs({ id, p }) {
  return (
    <defs>
      <pattern id={id + 'h'} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="5" height="5" fill={p.face} /><line x1="0" y1="0" x2="0" y2="5" className="hatch" />
      </pattern>
    </defs>
  )
}

const fillOf = (g, mode, id) => (mode === 'colour' ? g.c : `url(#${id}h)`)
const Nodes = ({ i, size = 3.6 }) => GLYPHS[i].nodes.flat().map(([x, y], k) => <rect key={k} x={x - size / 2} y={y - size / 2} width={size} height={size} className="node" />)

/** Horizontal dimension bar with end ticks and a label above (like the reference sheets). */
function HDim({ x1, x2, y, label, below }) {
  return (
    <g>
      <line x1={x1} x2={x2} y1={y} y2={y} className="dim" />
      <line x1={x1} x2={x1} y1={y - 3} y2={y + 3} className="dimt" />
      <line x1={x2} x2={x2} y1={y - 3} y2={y + 3} className="dimt" />
      <text x={(x1 + x2) / 2} y={below ? y + 10 : y - 5} textAnchor="middle" className="lab">{label}</text>
    </g>
  )
}
function VDim({ x, y1, y2, label, right }) {
  return (
    <g>
      <line x1={x} x2={x} y1={y1} y2={y2} className="dim" />
      <line x1={x - 3} x2={x + 3} y1={y1} y2={y1} className="dimt" />
      <line x1={x - 3} x2={x + 3} y1={y2} y2={y2} className="dimt" />
      <text x={right ? x + 6 : x - 6} y={(y1 + y2) / 2 + 2.5} textAnchor={right ? 'start' : 'end'} className="lab">{label}</text>
    </g>
  )
}
/** Infinite-looking line through (x, y) along the extrusion direction. */
const Diag = ({ x, y, len = 420 }) => {
  const k = len / Math.hypot(EX, EY)
  return <line x1={x - EX * k} y1={y - EY * k} x2={x + EX * k} y2={y + EY * k} className="diag" />
}
/** Corner-radius circles on a D's bowl: r = 1x, tangent to the top/bottom and the right side. */
const Bowl = ({ g, inner = true }) => g.arcs.filter((a) => inner || a[2] === R).map(([cx, cy, r], k) => <circle key={k} cx={cx} cy={cy} r={r} className="circ" />)

/* ─────────── Plates ─────────── */

function Construction({ mode, p, id }) {
  // every line below sits on real geometry; every label is computed from it
  const lStem = L.box[0] + X // right edge of L's stem
  const xs = [...new Set([...GLYPHS.flatMap((g) => [g.box[0], g.box[2]]), lStem])]
  const ys = [...new Set(GLYPHS.flatMap((g) => [g.box[1], g.box[3]]))]
  const V = { x: -116, y: -74, w: 562, h: 320 }
  const rowA = D1.box[1] - 2.6 * X, rowB = D1.box[1] - 1.5 * X
  const chain = D2.box[2] + EX + 2.4 * X
  const [cx, cy, r] = D1.arcs[0]
  const rp = [cx + r * Math.SQRT1_2, cy - r * Math.SQRT1_2] // the arc at 45 degrees
  const ex = [D2.box[0], D2.box[3]] // bottom-left corner of the second D, and its extruded twin
  const stem = (g, x0) => <HDim key={g.ch + x0} x1={x0} x2={x0 + X} y={g.box[1] - 0.55 * X} label={ux(X)} />
  return (
    <svg viewBox={`${V.x} ${V.y} ${V.w} ${V.h}`} xmlns="http://www.w3.org/2000/svg">
      <Style p={p} /><Defs id={id} p={p} />
      <rect x={V.x} y={V.y} width={V.w} height={V.h} className="bg" />
      {xs.map((x) => <line key={'v' + x} x1={x} x2={x} y1={V.y} y2={V.y + V.h} className="guide" opacity=".5" />)}
      {ys.map((y) => <line key={'h' + y} y1={y} y2={y} x1={V.x} x2={V.x + V.w} className="guide" opacity=".5" />)}
      {/* 45-degree extrusion lines, each through a real corner and its extruded twin */}
      <Diag x={W.nodes[0][0][0]} y={W.nodes[0][0][1]} />
      <Diag x={D1.box[0]} y={D1.box[1]} />
      <Diag x={ex[0]} y={ex[1]} />
      {GLYPHS.map((g, i) => <path key={'e' + i} d={g.d} className="ghost" transform={`translate(${EX} ${EY})`} />)}
      {/* the outline band: a 1/3x stroke centred on the edge */}
      {GLYPHS.map((g, i) => <path key={'o' + i} d={g.d} className="band" strokeWidth={OUT} strokeLinejoin="round" />)}
      {GLYPHS.map((g, i) => <path key={i} d={g.d} fill={fillOf(g, mode, id)} fillRule="evenodd" className="face" />)}
      <Bowl g={D1} inner={false} /><Bowl g={D2} inner={false} />
      {GLYPHS.map((_, i) => <Nodes key={'n' + i} i={i} />)}

      {/* stems */}
      {stem(W, W.box[0])}{stem(L, L.box[0])}{stem(D1, D1.box[0])}{stem(D2, D2.box[0])}
      {/* widths and spacing, between the guides */}
      <HDim x1={W.box[0]} x2={W.box[2]} y={rowA} label={ux(W.box[2] - W.box[0])} />
      <HDim x1={W.box[2]} x2={L.box[0]} y={rowA} label={ux(L.box[0] - W.box[2])} />
      <HDim x1={L.box[0]} x2={L.box[2]} y={rowA} label={ux(L.box[2] - L.box[0])} />
      <HDim x1={lStem} x2={D1.box[0]} y={rowB} label={ux(D1.box[0] - lStem)} />
      <HDim x1={D1.box[0]} x2={D1.box[2]} y={rowB} label={ux(D1.box[2] - D1.box[0])} />
      <HDim x1={D1.box[2]} x2={D2.box[0]} y={rowB} label={ux(D2.box[0] - D1.box[2])} />
      <HDim x1={D2.box[0]} x2={D2.box[2]} y={rowB} label={ux(D2.box[2] - D2.box[0])} />
      {/* heights: cap on the left, the stagger chain on the right */}
      <VDim x={W.box[0] - 1.3 * X} y1={W.box[1]} y2={W.box[3]} label={ux(W.box[3] - W.box[1])} />
      {[[D1.box[1], W.box[1]], [W.box[1], L.box[1]], [L.box[1], D2.box[1]], [D2.box[1], D2.box[3]]].map(([a, b]) => (
        <VDim key={a} x={chain} y1={a} y2={b} label={ux(b - a)} right />
      ))}
      {/* extrusion: a real corner to its twin */}
      <line x1={ex[0]} y1={ex[1]} x2={ex[0] + EX} y2={ex[1] + EY} className="dim" />
      <circle cx={ex[0]} cy={ex[1]} r="2.2" className="node-o" />
      <text x={ex[0] + EX + 6} y={ex[1] + EY + 9} className="lab">{ux(EX)} → {ux(EY)} ↓ · {ANGLE}°</text>
      {/* bowl radius: centre to arc */}
      <circle cx={cx} cy={cy} r="1.8" className="node" />
      <line x1={cx} y1={cy} x2={rp[0]} y2={rp[1]} className="dim" />
      <line x1={rp[0]} y1={rp[1]} x2={rp[0] + 0.55 * X} y2={rp[1] - 0.55 * X} className="dimt" />
      <text x={rp[0] + 0.6 * X} y={rp[1] - 0.6 * X} className="lab">r {ux(r)}</text>
      {/* outline band */}
      <line x1={W.box[0] - OUT * 0.35} y1={W.box[1] - OUT * 0.35} x2={W.box[0] - 1.1 * X} y2={W.box[1] - 1.1 * X} className="dimt" />
      <text x={W.box[0] - 1.15 * X} y={W.box[1] - 1.2 * X} textAnchor="end" className="lab">outline {ux(OUT)}, centred</text>
    </svg>
  )
}

/** Exploded layers: face, outline, extrusion, mark. */
function Anatomy({ mode, p, id }) {
  const steps = [
    { k: 'Face', face: true },
    { k: 'Outline', face: true, outline: true },
    { k: 'Extrusion', extrude: true },
    { k: 'Mark', face: true, outline: true, extrude: true },
  ]
  const cw = 400
  return (
    <svg viewBox={`0 0 ${cw * 4} 312`} xmlns="http://www.w3.org/2000/svg">
      <Style p={p} /><Defs id={id} p={p} />
      <rect width={cw * 4} height="312" className="bg" />
      {steps.map((s, si) => (
        <g key={si} transform={`translate(${si * cw + 20} 30)`}>
          {si > 0 && <line x1="-20" x2="-20" y1="-30" y2="270" className="grid" />}
          {GLYPHS.map((g, i) => (
            <g key={i}>
              {s.extrude && Array.from({ length: 7 }, (_, k) => (
                <path key={k} d={g.d} className="solid" strokeWidth={OUT} strokeLinejoin="round" transform={`translate(${(EX * (k + 1)) / 7} ${(EY * (k + 1)) / 7})`} />
              ))}
              {s.face && <path d={g.d} fill={s.k === 'Mark' || mode === 'colour' ? g.c : `url(#${id}h)`} fillRule="evenodd"
                className={s.outline ? 'mface' : ''} strokeWidth={s.outline ? OUT : 0} paintOrder="stroke" strokeLinejoin="round" />}
            </g>
          ))}
          <text x="0" y="244" className="lab-lg-ink">{String(si + 1).padStart(2, '0')}  {s.k.toUpperCase()}</text>
          <text x="0" y="264" className="lab-lg">{[`built on x · cap ${ux(CAP)}`, `stroke ${ux(OUT)}, centred`, `${ux(EX)} → ${ux(EY)} ↓ · ${ANGLE}°`, 'face + outline + extrusion'][si]}</text>
        </g>
      ))}
    </svg>
  )
}

/** Each letter on its own grid, with its nodes and construction. */
function Letters({ mode, p, id }) {
  const cell = 220
  return (
    <svg viewBox={`0 0 ${cell * 4} ${cell}`} xmlns="http://www.w3.org/2000/svg">
      <Style p={p} /><Defs id={id} p={p} />
      <rect width={cell * 4} height={cell} className="bg" />
      {GLYPHS.map((g, i) => {
        const [x0, y0, x1, y1] = g.box
        const s = 150 / Math.max(x1 - x0, y1 - y0)
        const tx = i * cell + cell / 2 - ((x0 + x1) / 2) * s
        const ty = cell / 2 - ((y0 + y1) / 2) * s - 6
        const grid = []
        for (let gx = x0 - X * 3; gx <= x1 + X * 3; gx += X) grid.push(<line key={'gx' + gx} x1={gx} x2={gx} y1={y0 - X * 3} y2={y1 + X * 3} className="grid" vectorEffect="non-scaling-stroke" />)
        for (let gy = y0 - X * 3; gy <= y1 + X * 3; gy += X) grid.push(<line key={'gy' + gy} y1={gy} y2={gy} x1={x0 - X * 3} x2={x1 + X * 3} className="grid" vectorEffect="non-scaling-stroke" />)
        return (
          <g key={i}>
            <clipPath id={id + 'c' + i}><rect x={i * cell} y="0" width={cell} height={cell} /></clipPath>
            {i > 0 && <line x1={i * cell} x2={i * cell} y1="0" y2={cell} className="guide" opacity=".5" />}
            <g clipPath={`url(#${id}c${i})`}>
              <g transform={`translate(${tx} ${ty}) scale(${s})`}>
                {grid}
                {[x0, x1].map((v) => <line key={'bx' + v} x1={v} x2={v} y1={y0 - 80} y2={y1 + 80} className="guide" vectorEffect="non-scaling-stroke" />)}
                {[y0, y1].map((v) => <line key={'by' + v} y1={v} y2={v} x1={x0 - 80} x2={x1 + 80} className="guide" vectorEffect="non-scaling-stroke" />)}
                <path d={g.d} fill={fillOf(g, mode, id)} fillRule="evenodd" className="face" vectorEffect="non-scaling-stroke" />
                {g.ch === 'D' && <g style={{ vectorEffect: 'non-scaling-stroke' }}><Bowl g={g} /></g>}
                {g.ch === 'W' && <>
                  <line x1={WN[0][0]} y1={WN[0][1]} x2={WN[12][0]} y2={WN[12][1]} className="guide" vectorEffect="non-scaling-stroke" />
                  <line x1={WN[0][0]} y1={WN[0][1]} x2={WN[0][0]} y2={WN[12][1]} className="guide" vectorEffect="non-scaling-stroke" strokeDasharray="2 2" />
                  <line x1={(x0 + x1) / 2} y1={y0 - X} x2={(x0 + x1) / 2} y2={y1 + X} className="guide" vectorEffect="non-scaling-stroke" strokeDasharray="4 3" />
                </>}
                <Nodes i={i} size={4.2 / s * 1.6} />
              </g>
            </g>
            <text x={i * cell + 12} y={cell - 12} className="lab-ink">{g.ch}{i === 3 ? '²' : ''}</text>
            <text x={i * cell + cell - 12} y={cell - 12} textAnchor="end" className="lab">
              {[`tops ${ux(WN[1][0] - WN[0][0])} · feet ${ux(WN[11][0] - WN[12][0])} · lean ${LEAN}° · mirrored`, `stem ${ux(X)} · foot ${ux(X)} · ${ux(L.box[2] - L.box[0])} wide`, `stem ${ux(X)} · r ${ux(R)} · counter ${ux(X)}, r ${ux(RI)}`, `stem ${ux(X)} · r ${ux(R)} · counter ${ux(X)}, r ${ux(RI)}`][i]}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

/** Clear space: 2x on every side of the mark, extrusion included. */
function ClearSpace({ mode, p, id }) {
  const b = [Math.min(...GLYPHS.map((g) => g.box[0])) - OUT / 2, Math.min(...GLYPHS.map((g) => g.box[1])) - OUT / 2,
    Math.max(...GLYPHS.map((g) => g.box[2])) + EX + OUT / 2, Math.max(...GLYPHS.map((g) => g.box[3])) + EY + OUT / 2]
  const m = X * 2
  const o = [b[0] - m, b[1] - m, b[2] + m, b[3] + m]
  return (
    <svg viewBox={`${o[0] - 30} ${o[1] - 30} ${o[2] - o[0] + 60} ${o[3] - o[1] + 60}`} xmlns="http://www.w3.org/2000/svg">
      <Style p={p} /><Defs id={id} p={p} />
      <rect x={o[0] - 30} y={o[1] - 30} width={o[2] - o[0] + 60} height={o[3] - o[1] + 60} className="bg" />
      <rect x={o[0]} y={o[1]} width={o[2] - o[0]} height={o[3] - o[1]} className="guide" strokeDasharray="4 3" />
      <rect x={b[0]} y={b[1]} width={b[2] - b[0]} height={b[3] - b[1]} className="guide" />
      {[[o[0], o[1]], [b[2], o[1]], [o[0], b[3]], [b[2], b[3]]].map(([x, y], k) => <rect key={k} x={x} y={y} width={m} height={m} className="xsq" />)}
      {GLYPHS.map((g, i) => (
        <g key={i}>
          {Array.from({ length: 7 }, (_, k) => <path key={k} d={g.d} className="solid" strokeWidth={OUT} strokeLinejoin="round" transform={`translate(${(EX * (k + 1)) / 7} ${(EY * (k + 1)) / 7})`} />)}
          <path d={g.d} fill={mode === 'colour' ? g.c : `url(#${id}h)`} fillRule="evenodd" className="mface" strokeWidth={OUT} paintOrder="stroke" />
        </g>
      ))}
      <HDim x1={o[0]} x2={b[0]} y={(b[1] + b[3]) / 2} label={ux(m)} />
      <HDim x1={b[2]} x2={o[2]} y={(b[1] + b[3]) / 2} label={ux(m)} />
      <VDim x={(b[0] + b[2]) / 2} y1={o[1]} y2={b[1]} label={ux(m)} right />
      <VDim x={(b[0] + b[2]) / 2} y1={b[3]} y2={o[3]} label={ux(m)} right />
    </svg>
  )
}

const PLATES = [
  { id: 'construction', name: 'Construction', C: Construction },
  { id: 'anatomy', name: 'Anatomy', C: Anatomy },
  { id: 'letters', name: 'Letters', C: Letters },
  { id: 'clearspace', name: 'Clear space', C: ClearSpace },
]

function Plate({ x, mode, theme }) {
  const ref = useRef(null)
  const save = () => {
    const svg = ref.current?.querySelector('svg')
    if (!svg) return
    const blob = new Blob(['<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' })
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `wldd-${x.id}-${mode}-${theme}.svg` })
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  }
  const K = x.C
  return (
    <section className="br-plate">
      <div className="br-head">
        <h2>{x.name}</h2>
        <Tip label="Download SVG"><button className="b ghost icon sm" onClick={save} aria-label={'Download ' + x.name}><Download size={15} /></button></Tip>
      </div>
      <div className="br-art" ref={ref}><K mode={mode} p={PAL[theme]} id={'br' + x.id} /></div>
    </section>
  )
}

export default function Brand() {
  const [theme, setTheme] = useState(() => { try { return localStorage.getItem('wldd-theme') === 'dark' ? 'dark' : 'light' } catch { return 'light' } })
  const [mode, setMode] = useState('mono')
  useEffect(() => {
    const h = document.documentElement
    h.dataset.variant = 'app'
    h.dataset.theme = theme
    document.title = 'Brand · WLDD'
  }, [theme])
  return (
    <div className="ld br">
      <header className="ld-head">
        <a href="/#/hub" className="ld-logo" aria-label="WLDD home"><img src="/wldd-logo.svg" alt="WLDD" /></a>
        <h1>Logo construction</h1>
        <span className="grow" />
        <Seg id="br-mode" value={mode} onChange={setMode} options={[{ value: 'mono', label: 'Mono' }, { value: 'colour', label: 'Colour' }]} />
        <Tip label="Theme"><button className="b ghost icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme">
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button></Tip>
      </header>
      {PLATES.map((x) => <Plate key={x.id} x={x} mode={mode} theme={theme} />)}
    </div>
  )
}
