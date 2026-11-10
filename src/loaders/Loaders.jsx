import { useEffect, useId, useRef, useState } from 'react'
import { motion, animate, useMotionValue, MotionConfig } from 'motion/react'
import { Sun, Moon } from 'lucide-react'
import { Seg } from '../app/ui'
import { Tip, TextMorph, EASE } from '../shared/motion'
import '../app/app.css'
import '../app/pages.css'
import './loaders.css'
import { ORBS } from './Orbs'
import { WLDDS } from './Wldd'

/* Brand sequence, in logo order: W L D D. */
export const C = ['#72CE85', '#D37AF4', '#ED4C6F', '#F2C92D']
const G = C[0]
const SPRING = { type: 'spring', stiffness: 260, damping: 24, mass: 0.9 }
const MORPH = { duration: 0.5, ease: EASE }

function useTick(ms, on) {
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!on) return
    const t = setInterval(() => setN((x) => x + 1), ms)
    return () => clearInterval(t)
  }, [ms, on])
  return n
}

/** Every glyph is the same number of lines, so any glyph can morph into any other (benji.org). */
const L = (x1, y1, x2, y2, o = 1) => ({ x1, y1, x2, y2, opacity: o })
const dot = (x, y) => L(x, y, x, y, 0)
function Lines({ glyph, rot = 0, colors, width = 2.4, transition = MORPH }) {
  return (
    <motion.g initial={false} animate={{ rotate: rot }} transition={SPRING} style={{ originX: '12px', originY: '12px', transformBox: 'view-box' }}>
      {glyph.map((l, i) => (
        <motion.line key={i} initial={false} animate={{ ...l, stroke: colors[i % colors.length] }} transition={transition}
          strokeWidth={width} strokeLinecap="round" />
      ))}
    </motion.g>
  )
}

/** Shared ending: a green disc with a check that draws in. */
function Tick({ on, r = 8 }) {
  return (
    <>
      <motion.circle cx="12" cy="12" initial={false} animate={{ r: on ? r : 0 }} transition={{ ...MORPH, delay: on ? 0.12 : 0 }} fill={G} />
      <motion.path d="M8 12.4l2.7 2.7L16 9.6" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        initial={false} animate={{ pathLength: on ? 1 : 0, opacity: on ? 1 : 0 }} transition={{ duration: 0.32, ease: EASE, delay: on ? 0.34 : 0 }} />
    </>
  )
}

const Svg = ({ size, children }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden className="ld-svg">{children}</svg>

/* ─────────────────── General ─────────────────── */

/** Turn — four tiles as one rotation group. Square ↔ squircle on alternate quarters. */
function Turn({ size, done }) {
  const n = useTick(620, !done)
  const cells = [[3, 3], [13, 3], [13, 13], [3, 13]]
  return (
    <Svg size={size}>
      <motion.g initial={false} animate={{ rotate: n * 90 }} transition={SPRING} style={{ originX: '12px', originY: '12px', transformBox: 'view-box' }}>
        {cells.map(([x, y], i) => (
          <motion.rect key={i} initial={false}
            animate={done ? { x: 4, y: 4, width: 16, height: 16, rx: 8, fill: G } : { x, y, width: 8, height: 8, rx: n % 2 ? 4 : 1.6, fill: C[i] }}
            transition={MORPH} />
        ))}
      </motion.g>
      <motion.path d="M8 12.4l2.7 2.7L16 9.6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        initial={false} animate={{ pathLength: done ? 1 : 0, opacity: done ? 1 : 0 }} transition={{ duration: 0.32, ease: EASE, delay: done ? 0.3 : 0 }} />
    </Svg>
  )
}

/** Strokes — four lines, one per colour, morphing W → bars → square → diamond → plus, then rotating plus → cross. */
const STROKES = [
  { g: [L(4, 7, 8, 17), L(8, 17, 12, 9), L(12, 9, 16, 17), L(16, 17, 20, 7)], r: 0 },
  { g: [L(6, 9, 6, 15), L(10, 6, 10, 18), L(14, 8, 14, 16), L(18, 10, 18, 14)], r: 0 },
  { g: [L(6, 6, 18, 6), L(18, 6, 18, 18), L(18, 18, 6, 18), L(6, 18, 6, 6)], r: 0 },
  { g: [L(12, 4, 20, 12), L(20, 12, 12, 20), L(12, 20, 4, 12), L(4, 12, 12, 4)], r: 0 },
  { g: [L(12, 5, 12, 11), L(13, 12, 19, 12), L(12, 19, 12, 13), L(5, 12, 11, 12)], r: 0 },
  { g: [L(12, 5, 12, 11), L(13, 12, 19, 12), L(12, 19, 12, 13), L(5, 12, 11, 12)], r: 45 },
]
const CHECK4 = [L(5, 12.5, 10, 17.5), L(10, 17.5, 19, 7), dot(10, 17.5), dot(10, 17.5)]
function Strokes({ size, done }) {
  const n = useTick(720, !done)
  const s = STROKES[n % STROKES.length]
  return (
    <Svg size={size}>
      <Lines glyph={done ? CHECK4 : s.g} rot={done ? 0 : s.r} colors={done ? [G] : C} />
    </Svg>
  )
}

/** Hop — four dots jump in sequence over a ground shadow, then gather into one. */
function Hop({ size, done }) {
  const xs = [4.5, 9.5, 14.5, 19.5]
  const loop = (i) => ({ duration: 0.9, ease: 'easeInOut', repeat: Infinity, repeatDelay: 0.25, delay: i * 0.11 })
  return (
    <Svg size={size}>
      {xs.map((x, i) => (
        <motion.ellipse key={'s' + i} cy="19.5" ry=".9" fill="currentColor" className="ld-shadow"
          animate={done ? { cx: 12, rx: 0, opacity: 0 } : { cx: x, rx: [2.2, 1, 2.2], opacity: [0.22, 0.08, 0.22] }}
          transition={done ? MORPH : loop(i)} />
      ))}
      {xs.map((x, i) => (
        <motion.circle key={i} initial={{ cx: x, cy: 15.5, r: 2.6, fill: C[i] }}
          animate={done ? { cx: 12, cy: 12, r: 8, fill: G } : { cx: x, cy: [15.5, 7.5, 15.5], r: 2.6, fill: C[i] }}
          transition={done ? { ...MORPH, delay: i * 0.03 } : { ...loop(i), cx: MORPH, r: MORPH, fill: MORPH }} />
      ))}
      <motion.path d="M8 12.4l2.7 2.7L16 9.6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        initial={false} animate={{ pathLength: done ? 1 : 0, opacity: done ? 1 : 0 }} transition={{ duration: 0.32, ease: EASE, delay: done ? 0.4 : 0 }} />
    </Svg>
  )
}

/** Ring — four arcs chase round a circle, stretching and shrinking; done closes them into one green ring. */
function Ring({ size, done }) {
  const rot = useMotionValue(0)
  useEffect(() => {
    if (done) { animate(rot, Math.ceil(rot.get() / 90) * 90 + 90, { duration: 0.6, ease: EASE }); return }
    rot.set(rot.get() % 360)
    const c = animate(rot, [rot.get(), rot.get() + 360], { duration: 1.3, ease: 'linear', repeat: Infinity })
    return () => c.stop()
  }, [done, rot])
  return (
    <Svg size={size}>
      <motion.g style={{ rotate: rot, originX: '12px', originY: '12px', transformBox: 'view-box' }}>
        {C.map((c, i) => (
          <motion.circle key={i} cx="12" cy="12" r="8" pathLength="100" strokeWidth="2.6" strokeLinecap="round"
            transform={`rotate(${i * 90 - 90} 12 12)`} initial={{ strokeDasharray: '3 97', stroke: c }}
            animate={done ? { strokeDasharray: '25 75', stroke: G } : { strokeDasharray: ['3 97', '17 83', '3 97'], stroke: c }}
            transition={done ? MORPH : { strokeDasharray: { duration: 1.3, ease: 'easeInOut', repeat: Infinity, delay: i * 0.16 }, stroke: MORPH }} />
        ))}
      </motion.g>
      <motion.path d="M8 12.4l2.7 2.7L16 9.6" stroke={G} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        initial={false} animate={{ pathLength: done ? 1 : 0, opacity: done ? 1 : 0 }} transition={{ duration: 0.32, ease: EASE, delay: done ? 0.3 : 0 }} />
    </Svg>
  )
}

/* ─────────────────── Ring family ─────────────────── */

const ORIGIN = { originX: '12px', originY: '12px', transformBox: 'view-box' }
const RingCheck = ({ done, delay = 0.3 }) => (
  <motion.path d="M8 12.4l2.7 2.7L16 9.6" stroke={G} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    initial={false} animate={{ pathLength: done ? 1 : 0, opacity: done ? 1 : 0 }} transition={{ duration: 0.32, ease: EASE, delay: done ? delay : 0 }} />
)
/** Arc on the r=8 track, starting at 12 o'clock. pathLength 100 so dash values are percentages. */
const arc = { cx: 12, cy: 12, r: 8, pathLength: 100, strokeWidth: 2.6, strokeLinecap: 'round', transform: 'rotate(-90 12 12)' }

/** Relay — one arc, Material-style grow and chase; it hands the baton to the next colour each lap, at its shortest. */
function Relay({ size, done }) {
  const lap = 1.25
  const t = [0, 0.245, 0.25, 0.495, 0.5, 0.745, 0.75, 0.995, 1]
  return (
    <Svg size={size}>
      <motion.g initial={{ rotate: 0 }} animate={done ? { rotate: 360 } : { rotate: [0, 360] }}
        transition={done ? MORPH : { duration: lap * 0.8, ease: 'linear', repeat: Infinity }} style={ORIGIN}>
        <motion.circle {...arc} initial={{ strokeDasharray: '1 99', strokeDashoffset: 0, stroke: C[0] }}
          animate={done ? { strokeDasharray: '100 0', strokeDashoffset: 0, stroke: G }
            : { strokeDasharray: ['1 99', '46 54', '46 54'], strokeDashoffset: [0, -18, -99], stroke: [C[0], C[0], C[1], C[1], C[2], C[2], C[3], C[3], C[0]] }}
          transition={done ? MORPH : {
            strokeDasharray: { duration: lap, ease: 'easeInOut', repeat: Infinity },
            strokeDashoffset: { duration: lap, ease: 'easeInOut', repeat: Infinity },
            stroke: { duration: lap * 4, times: t, ease: 'linear', repeat: Infinity },
          }} />
      </motion.g>
      <RingCheck done={done} />
    </Svg>
  )
}

/** Notch — four fixed segments; the ring clicks round a quarter at a time and the gaps breathe on each click. */
function Notch({ size, done }) {
  const n = useTick(560, !done)
  const len = done ? 25 : n % 2 ? 13 : 19
  return (
    <Svg size={size}>
      <motion.g initial={false} animate={{ rotate: n * 90 }} transition={{ type: 'spring', stiffness: 320, damping: 17 }} style={ORIGIN}>
        {C.map((c, i) => (
          <motion.circle key={i} {...arc} transform={`rotate(${i * 90 - 90} 12 12)`} initial={false}
            animate={{ strokeDasharray: `${len} ${100 - len}`, strokeDashoffset: done ? 0 : -(25 - len) / 2, stroke: done ? G : c }}
            transition={MORPH} />
        ))}
      </motion.g>
      <RingCheck done={done} />
    </Svg>
  )
}

/** Chase — four short arcs share one eased lap, a beat apart, so they bunch up and spread out like a comet. */
function Chase({ size, done }) {
  return (
    <Svg size={size}>
      {C.map((c, i) => (
        <motion.g key={i} initial={{ rotate: 0 }} animate={done ? { rotate: 360 + i * 90 } : { rotate: [0, 360] }}
          transition={done ? { ...MORPH, delay: (3 - i) * 0.04 } : { duration: 1.5, ease: [0.65, 0, 0.35, 1], repeat: Infinity, delay: (3 - i) * 0.1, repeatDelay: 0.15 }} style={ORIGIN}>
          <motion.circle {...arc} initial={{ strokeDasharray: '7 93', stroke: c }}
            animate={{ strokeDasharray: done ? '25 75' : '7 93', stroke: done ? G : c }} transition={MORPH} />
        </motion.g>
      ))}
      <RingCheck done={done} delay={0.45} />
    </Svg>
  )
}

/** Gyro — four concentric orbits at their own speeds, alternating direction; done folds them into one ring. */
const GYRO = [{ r: 10.4, d: 1.7 }, { r: 7.8, d: 1.3 }, { r: 5.2, d: 1 }, { r: 2.6, d: 0.8 }]
function Gyro({ size, done }) {
  return (
    <Svg size={size}>
      {GYRO.map((o, i) => {
        const dir = i % 2 ? -360 : 360
        return (
          <motion.g key={i} initial={{ rotate: 0 }} animate={done ? { rotate: 0 } : { rotate: [0, dir] }}
            transition={done ? MORPH : { duration: o.d, ease: 'linear', repeat: Infinity }} style={ORIGIN}>
            <motion.circle cx="12" cy="12" pathLength="100" strokeLinecap="round" transform="rotate(-90 12 12)"
              initial={{ r: o.r, strokeWidth: 1.7, strokeDasharray: '32 68', stroke: C[i] }}
              animate={done ? { r: 8, strokeWidth: 2.6, strokeDasharray: '100 0', stroke: G } : { r: o.r, strokeWidth: 1.7, strokeDasharray: '32 68', stroke: C[i] }}
              transition={{ ...MORPH, delay: done ? i * 0.04 : 0 }} />
          </motion.g>
        )
      })}
      <RingCheck done={done} delay={0.4} />
    </Svg>
  )
}

/* ─────────────────── AI ─────────────────── */

/** Orb — four colour blobs orbit and fuse through a goo filter. Thinking. */
function Orb({ size, done }) {
  const id = useId().replace(/:/g, '')
  const orbit = [
    { d: 2.4, r: [4.6, 2.2, 4.6] },
    { d: 3.1, r: [2.4, 5, 2.4] },
    { d: 3.7, r: [5, 3, 5] },
    { d: 2.8, r: [3, 4.8, 3] },
  ]
  return (
    <Svg size={size}>
      <defs>
        <filter id={id} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.1" result="b" />
          <feColorMatrix in="b" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -8" result="g" />
          <feComposite in="SourceGraphic" in2="g" operator="atop" />
        </filter>
      </defs>
      <g filter={`url(#${id})`}>
        {orbit.map((o, i) => (
          <motion.g key={i} initial={{ rotate: i * 90 }} animate={done ? { rotate: i * 90 } : { rotate: [i * 90, i * 90 + (i % 2 ? -360 : 360)] }}
            transition={done ? MORPH : { duration: o.d, ease: 'linear', repeat: Infinity }} style={{ originX: '12px', originY: '12px', transformBox: 'view-box' }}>
            <motion.circle cx="12" initial={{ cy: 12 - o.r[0], r: 3.1, fill: C[i] }}
              animate={done ? { cy: 12, r: 8, fill: G } : { cy: o.r.map((d) => 12 - d), r: [3.1, 3.6, 3.1], fill: C[i] }}
              transition={done ? MORPH : { cy: { duration: o.d * 0.9, ease: 'easeInOut', repeat: Infinity }, r: { duration: 1.6, repeat: Infinity, ease: 'easeInOut', delay: i * 0.2 }, fill: MORPH }} />
          </motion.g>
        ))}
      </g>
      <motion.path d="M8 12.4l2.7 2.7L16 9.6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        initial={false} animate={{ pathLength: done ? 1 : 0, opacity: done ? 1 : 0 }} transition={{ duration: 0.32, ease: EASE, delay: done ? 0.38 : 0 }} />
    </Svg>
  )
}

/** Think — four ideas, faintly linked, keep rearranging until they settle into a check. */
const SHAPES = [
  [[6, 6], [18, 6], [18, 18], [6, 18]],
  [[12, 4], [20, 12], [12, 20], [4, 12]],
  [[5, 16], [10, 8], [15, 15], [19, 7]],
  [[12, 5], [19, 17], [12, 13], [5, 17]],
  [[5, 12], [12, 5], [19, 12], [12, 12]],
]
const THINK_DONE = [[5.5, 12.5], [10, 17], [14.5, 12], [18.5, 7]]
function Think({ size, done }) {
  const n = useTick(820, !done)
  const pts = done ? THINK_DONE : SHAPES[n % SHAPES.length]
  return (
    <Svg size={size}>
      {pts.map((p, i) => {
        const q = pts[(i + 1) % 4]
        const closing = i === 3
        return <motion.line key={'l' + i} initial={false} strokeWidth={done ? 2.2 : 1.1} strokeLinecap="round"
          animate={{ x1: p[0], y1: p[1], x2: q[0], y2: q[1], stroke: done ? G : 'var(--ld-link)', opacity: done && closing ? 0 : 1 }} transition={SPRING} />
      })}
      {pts.map((p, i) => (
        <motion.circle key={i} initial={false} animate={{ cx: p[0], cy: p[1], r: done ? 1.1 : 2.1, fill: done ? G : C[i] }}
          transition={{ ...SPRING, delay: done ? 0 : i * 0.045 }} />
      ))}
    </Svg>
  )
}

/** Write — lines of text fill in behind a caret that takes each brand colour in turn. */
const ROWS = [{ y: 7, w: 16 }, { y: 12, w: 18 }, { y: 17, w: 10 }]
function Write({ size, done }) {
  const n = useTick(560, !done)
  const step = done ? 3 : n % 5 // 0..2 writing row, 3 hold, 4 clear
  const D = { duration: 0.52, ease: [0.45, 0, 0.55, 1] }
  const row = Math.min(step, 2)
  const caretX = step >= 4 ? 3 : 3 + ROWS[row].w
  return (
    <Svg size={size}>
      {ROWS.map((r, i) => (
        <motion.rect key={i} x="3" y={r.y - 1.25} height="2.5" rx="1.25" className="ld-bar" initial={false}
          animate={{ width: step === 4 || i > row ? 0 : r.w, opacity: step === 4 ? 0 : 1 }}
          transition={step === 4 ? { duration: 0.3, ease: EASE } : D} />
      ))}
      <motion.rect width="2.4" rx="1.2" initial={false}
        animate={done ? { x: 3 + ROWS[2].w + 2.5, y: ROWS[2].y - 3.2, height: 6.4, width: 6.4, rx: 3.2, fill: G }
          : { x: caretX + 0.8, y: ROWS[step >= 4 ? 0 : row].y - 3, height: 6, width: 2.4, rx: 1.2, fill: C[n % 4] }}
        transition={step === 4 ? { duration: 0.3, ease: EASE } : D} />
    </Svg>
  )
}

/** Work — a three-line glyph steps through what the agent is doing, with a morphing label. */
const WORK = [
  { label: 'Reading', g: [L(5, 7, 19, 7), L(5, 12, 19, 12), L(5, 17, 13, 17)], r: 0 },
  { label: 'Fetching', g: [L(5, 12, 19, 12), L(13, 6, 19, 12), L(13, 18, 19, 12)], r: 90 },
  { label: 'Building', g: [L(12, 5, 12, 19), L(5, 12, 19, 12), dot(12, 12)], r: 180 },
  { label: 'Writing', g: [L(4, 15, 9, 9), L(9, 9, 14, 15), L(14, 15, 20, 9)], r: 180 },
]
const CHECK3 = [L(5, 12.5, 10, 17.5), L(10, 17.5, 19, 7), dot(10, 17.5)]
function Work({ size, done, label = true }) {
  const n = useTick(1300, !done)
  const i = n % WORK.length
  const s = WORK[i]
  return (
    <span className="ld-work">
      <Svg size={size}>
        <Lines glyph={done ? CHECK3 : s.g} rot={done ? Math.ceil(s.r / 360) * 360 : s.r} colors={[done ? G : C[i]]} width={2.4} />
      </Svg>
      {label && <TextMorph className="ld-work-l">{done ? 'Done' : s.label}</TextMorph>}
    </span>
  )
}

/* ─────────────────── Page ─────────────────── */

const GENERAL = [
  { id: 'turn', name: 'Turn', C: Turn, tip: 'Rotation group, 90° steps. Corners morph on every quarter.' },
  { id: 'strokes', name: 'Strokes', C: Strokes, tip: 'Four lines, one per colour. W → bars → square → diamond → plus → cross.' },
  { id: 'hop', name: 'Hop', C: Hop, tip: 'Staggered hops over a ground shadow.' },
  { id: 'ring', name: 'Ring', C: Ring, tip: 'Four arcs chase and stretch.' },
]
const RINGS = [
  { id: 'relay', name: 'Relay', C: Relay, tip: 'One arc grows and chases its tail. Colour hands off each lap, at its shortest.' },
  { id: 'notch', name: 'Notch', C: Notch, tip: 'Rotation group. Clicks a quarter turn on a spring; gaps breathe.' },
  { id: 'chase', name: 'Chase', C: Chase, tip: 'Same eased lap, staggered. Arcs bunch and spread.' },
  { id: 'gyro', name: 'Gyro', C: Gyro, tip: 'Four orbits, own speeds, alternating direction. Done folds them into one ring.' },
]
const AI = [
  { id: 'orb', name: 'Goo', C: Orb, tip: 'Thinking. Blobs orbit and fuse through a goo filter.' },
  { id: 'think', name: 'Think', C: Think, tip: 'Reasoning. Linked points rearrange, then settle into a check.' },
  { id: 'write', name: 'Write', C: Write, tip: 'Generating. Lines fill behind a colour-cycling caret.' },
  { id: 'work', name: 'Work', C: Work, tip: 'Agent task. One glyph steps through what it is doing.' },
]
const SIZES = [{ value: 24, label: '24' }, { value: 48, label: '48' }, { value: 96, label: '96' }]

function Card({ x, size, all, inline }) {
  const [own, setOwn] = useState(null)
  useEffect(() => setOwn(null), [all])
  const done = own ?? all
  const K = x.C
  return (
    <div className={'ld-card' + (x.wide ? ' ld-wide' : '')}>
      <button className="ld-stage" onClick={() => setOwn(!done)} aria-label={(done ? 'Restart ' : 'Finish ') + x.name}>
        <K size={size} done={done} />
      </button>
      <div className="ld-foot">
        <Tip label={x.tip}><span className="ld-name">{x.name}</span></Tip>
        {inline && <span className="ld-inline">{inline(done)}</span>}
      </div>
    </div>
  )
}

export default function Loaders() {
  const [theme, setTheme] = useState(() => { try { return localStorage.getItem('wldd-theme') === 'dark' ? 'dark' : 'light' } catch { return 'light' } })
  const [size, setSize] = useState(96)
  const [state, setState] = useState('loading')
  useEffect(() => {
    const h = document.documentElement
    h.dataset.variant = 'app'
    h.dataset.theme = theme
    document.title = 'Loaders · WLDD'
  }, [theme])
  const all = state === 'done'
  return (
    <MotionConfig reducedMotion="never">
      <div className="ld">
        <header className="ld-head">
          <a href="/#/hub" className="ld-logo" aria-label="WLDD home"><img src="/wldd-logo.svg" alt="WLDD" /></a>
          <h1>Loaders</h1>
          <span className="grow" />
          <Seg id="ld-state" value={state} onChange={setState} options={[{ value: 'loading', label: 'Loading' }, { value: 'done', label: 'Done' }]} />
          <Seg id="ld-size" value={size} onChange={setSize} options={SIZES} />
          <Tip label="Theme"><button className="b ghost icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button></Tip>
        </header>

        <section>
          <h2>WLDD <span className="mute num">{WLDDS.length}</span></h2>
          <div className="ld-grid">
            {WLDDS.map((x) => <Card key={x.id} x={x} size={size} all={all}
              inline={(d) => <button className="b sm" tabIndex={-1}><x.C size={20} done={d} />{d ? 'Saved' : 'Saving'}</button>} />)}
          </div>
        </section>

        <section>
          <h2>General <span className="mute num">4</span></h2>
          <div className="ld-grid">
            {GENERAL.map((x) => <Card key={x.id} x={x} size={size} all={all}
              inline={(d) => <button className="b sm" tabIndex={-1}><x.C size={14} done={d} />{d ? 'Saved' : 'Saving'}</button>} />)}
          </div>
        </section>

        <section>
          <h2>Ring <span className="mute num">4</span></h2>
          <div className="ld-grid">
            {RINGS.map((x) => <Card key={x.id} x={x} size={size} all={all}
              inline={(d) => <button className="b sm" tabIndex={-1}><x.C size={14} done={d} />{d ? 'Saved' : 'Saving'}</button>} />)}
          </div>
        </section>

        <section>
          <h2>AI <span className="mute num">4</span></h2>
          <div className="ld-grid">
            {AI.map((x) => <Card key={x.id} x={x} size={size} all={all}
              inline={(d) => <span className="ld-bubble">{x.id === 'work' ? <Work size={14} done={d} /> : <x.C size={14} done={d} />}</span>} />)}
          </div>
        </section>

        <section>
          <h2>AI orbs <span className="mute num">4</span></h2>
          <div className="ld-grid">
            {ORBS.map((x) => <Card key={x.id} x={x} size={size} all={all}
              inline={(d) => <span className="ld-bubble"><x.C size={16} done={d} /></span>} />)}
          </div>
        </section>
      </div>
    </MotionConfig>
  )
}
