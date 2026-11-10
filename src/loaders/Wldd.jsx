import { useEffect, useId, useState } from 'react'
import { motion } from 'motion/react'
import { EASE } from '../shared/motion'
import { GLYPHS, OUT, EX, EY } from './wlddGlyphs'
import './wldd.css'

/* All units are the logo's own (370 × 215). Letter faces are traced from the logo; the outline and
   the down-right extrusion are measured from it too, so the resting pose IS the logo. */
const STEPS = 7
const U = 113 // letter height
const VB = '-6 -6 384 232'
const SPRING = { type: 'spring', stiffness: 380, damping: 22 }
const centre = (g) => [(g.box[0] + g.box[2]) / 2, (g.box[1] + g.box[3]) / 2]
const MID = [178, 104] // centre of the wordmark
const DOOR = [-62, 108] // portal mode: the portal stands left of the word
const VB_PORTAL = '-178 -12 562 244'
const VB_CYCLE = '96 24 172 172'

function useTick(ms, on) {
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!on) return
    const t = setInterval(() => setN((x) => x + 1), ms)
    return () => clearInterval(t)
  }, [ms, on])
  return n
}

/** One loop, six keyframes: wait · arrive (letter i, one after another) · hold · leave together · wait. */
const seq = (i) => { const a = 0.05 + i * 0.12; return [0, a, a + 0.11, 0.8, 0.9, 1] }
const LOOP = 3.2
const POP = [0.34, 1.5, 0.64, 1]

/* ─── Portal ─── */
/** A wobbly closed blob around (0,0): radius r, wobble amp (fraction), seeded so each ring differs. */
function blob(r, amp, seed, n = 30) {
  const p = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2
    const w = 0.6 * Math.sin(3 * a + seed) + 0.4 * Math.sin(5 * a + seed * 1.7) + 0.25 * Math.sin(9 * a + seed * 2.3)
    const rr = r * (1 + amp * w)
    return [rr * Math.cos(a), rr * Math.sin(a)]
  })
  // closed Catmull-Rom → cubic Béziers
  let d = `M${p[0][0].toFixed(1)} ${p[0][1].toFixed(1)}`
  for (let i = 0; i < n; i++) {
    const p0 = p[(i - 1 + n) % n], p1 = p[i], p2 = p[(i + 1) % n], p3 = p[(i + 2) % n]
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`
  }
  return d + 'Z'
}
const RIM = blob(104, 0.06, 1.3)
// green swirl in brand green shades; each ring sits off-centre so spinning reads as a swirl
const RINGS = [
  { d: blob(90, 0.1, 2.1), c: '#4FB46A', s: 7, dir: 1, o: [0, 0] },
  { d: blob(76, 0.13, 4.2), c: '#A9E7B6', s: 5, dir: -1, o: [5, -4] },
  { d: blob(62, 0.14, 0.7), c: '#72CE85', s: 4.2, dir: 1, o: [-4, 5] },
  { d: blob(47, 0.16, 3.3), c: '#3C9A56', s: 3.2, dir: -1, o: [4, 3] },
  { d: blob(32, 0.18, 5.1), c: '#C8F2D1', s: 2.4, dir: 1, o: [-3, -3] },
  { d: blob(16, 0.2, 2.8), c: '#F4FFF6', s: 1.6, dir: -1, o: [2, 1] },
]
const SPECKS = Array.from({ length: 16 }, (_, i) => {
  const a = i * 2.39996, r = 20 + ((i * 37) % 70)
  return { x: r * Math.cos(a), y: r * Math.sin(a), r: 2 + (i % 3) * 1.4, c: ['#fff', '#F2C92D', '#D37AF4', '#ED4C6F'][i % 4] }
})
const Spin = ({ s, dir = 1 }) => <animateTransform attributeName="transform" type="rotate" from="0" to={360 * dir} dur={s + 's'} repeatCount="indefinite" additive="sum" />

/* Portal life: a spark → burst open (overshoot, jelly wobble, spin settling) → hold →
   squeeze, spin up, implode → flash. Droplets fling out on open and are sucked back in on close. */
const IN_E = [0.55, 0, 0.9, 0.4], OUT_E = [0.16, 1, 0.3, 1]
const DROPS = Array.from({ length: 11 }, (_, i) => {
  const a = (i / 11) * Math.PI * 2 + (i % 2) * 0.25
  return { a, R: 118 + ((i * 29) % 46), r: 4 + (i % 3) * 2.2, c: ['#72CE85', '#A9E7B6', '#3C9A56', '#F2C92D', '#72CE85', '#D37AF4'][i % 6] }
})
/** Keyframe tracks for one open/close life inside a loop. o = [open start, open end], c = [close start, close end] (fractions of the loop). */
function lifeTracks(o, c) {
  const d = o[1] - o[0], e = c[1] - c[0]
  const body = {
    times: [0, o[0], o[0] + d * 0.38, o[0] + d * 0.62, o[0] + d * 0.82, o[1], c[0], c[0] + e * 0.45, c[1], 1],
    scaleX: [0, 0, 0.7, 1.12, 0.96, 1, 1, 1.12, 0, 0],
    scaleY: [0, 0, 1.22, 0.92, 1.03, 1, 1, 0.8, 0, 0],
    rotate: [-620, -620, -150, -30, -6, 0, 0, 90, 620, 620],
    ease: ['linear', OUT_E, 'easeInOut', 'easeInOut', 'easeOut', 'linear', 'easeIn', IN_E, 'linear'],
  }
  const flash = {
    times: [0, o[0], o[0] + d * 0.22, o[0] + d * 0.9, c[1] - e * 0.25, c[1], Math.min(c[1] + 0.05, 0.999), 1],
    opacity: [0, 0, 1, 0, 0, 0.95, 0, 0],
    scale: [0.1, 0.1, 1.2, 1.7, 0.1, 0.9, 1.6, 1.6],
    ease: ['linear', OUT_E, 'easeOut', 'linear', IN_E, 'easeOut', 'linear'],
  }
  const drops = {
    times: [0, o[0] + d * 0.12, o[0] + d * 0.7, o[0] + d * 1.25, c[0], c[0] + e * 0.2, c[1] - e * 0.08, 1],
    k: [0, 0, 1, 1.25, 1.25, 1.1, 0, 0], // distance factor
    opacity: [0, 0, 1, 0, 0, 1, 0, 0],
    scale: [0.4, 0.4, 1, 0.2, 0.2, 1, 0.2, 0.2],
    ease: ['linear', OUT_E, 'easeIn', 'linear', 'easeOut', IN_E, 'linear'],
  }
  return { body, flash, drops }
}

function Portal({ done, id, at = DOOR, tilt = -6, life }) {
  const [px, py] = at
  const T = life && lifeTracks(life.o, life.c)
  const dur = life?.duration
  const loop = (tr) => ({ duration: dur, times: tr.times, ease: tr.ease, repeat: Infinity })
  const CLOSE = { scaleX: [1, 1.12, 0], scaleY: [1, 0.8, 0], rotate: [0, 90, 620], opacity: 1 }
  const closeT = { duration: 0.6, times: [0, 0.45, 1], ease: ['easeIn', IN_E], delay: 0.2 }
  const bodyAnim = done ? CLOSE : T ? { scaleX: T.body.scaleX, scaleY: T.body.scaleY, rotate: T.body.rotate, opacity: 1 } : { scaleX: [1, 1.035, 1], scaleY: [1, 1.035, 1], rotate: 0, opacity: 1 }
  const bodyT = done ? closeT : T ? loop(T.body) : { duration: 1.8, ease: 'easeInOut', repeat: Infinity }
  const origin = { originX: `${px}px`, originY: `${py}px`, transformBox: 'view-box' }
  return (
    <g>
      <defs>
        <radialGradient id={id + 'f'}>
          <stop offset="0" stopColor="#fff" />
          <stop offset=".35" stopColor="#E9FFEE" />
          <stop offset="1" stopColor="#72CE85" stopOpacity="0" />
        </radialGradient>
        <filter id={id + 'g'} x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="14" /></filter>
      </defs>
      {/* glow behind */}
      <motion.ellipse cx={px} cy={py} rx="84" ry="118" fill="#72CE85" filter={`url(#${id}g)`} style={origin}
        initial={{ opacity: 0, scale: 0 }}
        animate={done ? { opacity: 0, scale: 0 } : T ? { opacity: T.body.scaleX.map((v) => Math.min(v, 1) * 0.55), scale: T.body.scaleY } : { opacity: [0.45, 0.6, 0.45], scale: 1 }}
        transition={done ? closeT : T ? loop(T.body) : { duration: 1.8, repeat: Infinity }} />
      {/* droplets flung out on open, pulled in on close */}
      {T && DROPS.map((p, i) => {
        const cos = Math.cos(p.a) * 0.72, sin = Math.sin(p.a)
        return (
          <motion.circle key={i} r={p.r} fill={p.c} className="wl-face" strokeWidth="3" paintOrder="stroke"
            initial={{ cx: px, cy: py, opacity: 0 }}
            animate={done ? { opacity: 0 } : { cx: T.drops.k.map((k) => px + cos * p.R * k), cy: T.drops.k.map((k) => py + sin * p.R * k), opacity: T.drops.opacity, scale: T.drops.scale }}
            transition={done ? { duration: 0.2 } : loop(T.drops)} />
        )
      })}
      {/* the portal itself */}
      <motion.g style={origin} initial={T ? { scaleX: 0, scaleY: 0, rotate: -620 } : { scaleX: 1, scaleY: 1, rotate: 0 }} animate={bodyAnim} transition={bodyT}>
        <g transform={`translate(${px} ${py}) rotate(${tilt}) scale(.66 1.04)`}>
          <path d={RIM} className="wl-ink" strokeWidth={OUT} transform={`translate(${EX * 0.7} ${EY * 0.7})`} />
          <g><Spin s={9} /><path d={RIM} fill="#72CE85" className="wl-face" strokeWidth={OUT} /></g>
          <clipPath id={id}><path d={RIM} /></clipPath>
          <g clipPath={`url(#${id})`}>
            {RINGS.map((r, i) => (
              <g key={i} transform={`translate(${r.o[0]} ${r.o[1]})`}>
                <g><Spin s={r.s} dir={r.dir} /><path d={r.d} fill={r.c} /></g>
              </g>
            ))}
            <g><Spin s={3.6} dir={-1} />{SPECKS.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={p.r} fill={p.c} opacity=".9" />)}</g>
          </g>
        </g>
      </motion.g>
      {/* flash: the spark it opens from, and the pop it closes with */}
      {(T || done) && (
        <motion.ellipse cx={px} cy={py} rx="70" ry="96" fill={`url(#${id}f)`} style={origin} initial={{ opacity: 0, scale: 0.1 }}
          animate={done ? { opacity: [0, 0, 0.95, 0], scale: [0.1, 0.1, 0.9, 1.6] } : { opacity: T.flash.opacity, scale: T.flash.scale }}
          transition={done ? { duration: 0.95, times: [0, 0.75, 0.85, 1] } : loop(T.flash)} />
      )}
    </g>
  )
}
/* Travel: in through one portal, out through another. One 4.6s loop. */
const EXIT = [436, 108] // the second portal, right of the word
const VB_TRAVEL = '-178 -12 760 244'
const TRAVEL = 4.6
// left: bursts open .01 → .14, letters come out, implodes .44 → .54
const LIFE_IN = { o: [0.01, 0.14], c: [0.44, 0.54], duration: TRAVEL }
// right: bursts open .48 → .6, letters go in, implodes .87 → .97
const LIFE_OUT = { o: [0.48, 0.6], c: [0.87, 0.97], duration: TRAVEL }
/** Travel timing: out W → D, in last D → W (nearest the exit first). */
const trip = (i) => { const a = 0.1 + i * 0.06, b = 0.61 + (3 - i) * 0.05; return [0, a, a + 0.14, b, b + 0.11, 1] }
/** Portal timing: out one by one (W first), back in one by one (last D first). */
const pin = (i) => { const a = 0.04 + i * 0.1, b = 0.64 + (3 - i) * 0.06; return [0, a, a + 0.14, b, b + 0.12, 1] }

/** Extrusion + outlined face for one letter. `press` pushes the face toward its shadow. */
function Letter({ g, press, i }) {
  return (
    <>
      {Array.from({ length: STEPS }, (_, k) => {
        const t = (k + 1) / STEPS
        return <path key={k} d={g.d} className="wl-ink" strokeWidth={OUT} strokeLinejoin="round" transform={`translate(${EX * t} ${EY * t})`} />
      })}
      <motion.path d={g.d} fill={g.c} className="wl-face" strokeWidth={OUT} strokeLinejoin="round" paintOrder="stroke" fillRule="evenodd"
        initial={{ x: 0, y: 0 }}
        animate={press ? { x: [0, EX * 0.75, 0], y: [0, EY * 0.75, 0] } : { x: 0, y: 0 }}
        transition={press ? { duration: 0.34, ease: 'easeInOut', repeat: Infinity, repeatDelay: 0.95, delay: i * 0.17 } : { duration: 0.3, ease: EASE }} />
    </>
  )
}

/**
 * WLDD wordmark loader. `size` ≈ the logo's height in px.
 * mode: press · dance · drop · flip · build · deal · swatch · cycle. Done settles every letter into the logo.
 */
export function Wldd({ size = 48, done = false, mode = 'press', tight = false }) {
  const n = useTick(mode === 'cycle' ? 620 : 520, (mode === 'dance' || mode === 'cycle') && !done)
  const uid = useId().replace(/:/g, '')
  const wide = mode === 'portal' || mode === 'travel'
  const h = tight && mode === 'cycle' ? size : size * (wide ? 1.5 : 1.05)
  // tight: Cycle only uses the middle slot, so crop to a square around it (for inline use, e.g. chat)
  const crop = tight && mode === 'cycle'
  const vb = crop ? VB_CYCLE : mode === 'travel' ? VB_TRAVEL : mode === 'portal' ? VB_PORTAL : VB
  const ratio = crop ? 1 : mode === 'travel' ? 760 / 244 : mode === 'portal' ? 562 / 244 : 384 / 232
  return (
    <svg className={'wl wl-' + mode} viewBox={vb} height={h} width={h * ratio} fill="none" aria-label="Loading" role="img">
      {mode === 'portal' && <Portal done={done} id={'wlp' + uid} />}
      {mode === 'travel' && <>
        <Portal done={done} id={'wla' + uid} life={LIFE_IN} />
        <Portal done={done} id={'wlb' + uid} at={EXIT} tilt={6} life={LIFE_OUT} />
      </>}
      {GLYPHS.map((g, i) => {
        const [cx, cy] = centre(g)
        const rest = { x: 0, y: 0, rotate: 0, scale: 1, scaleX: 1, opacity: 1 }
        let anim = rest
        let t = { duration: 0.45, ease: EASE }
        let tile = null
        const loop = (ease) => ({ duration: LOOP, times: seq(i), ease, repeat: Infinity })
        if (!done) {
          if (mode === 'dance') {
            // the logo's uneven baseline passes from letter to letter
            const p = GLYPHS[(i + n) % 4]
            anim = { ...rest, y: p.box[1] - g.box[1], rotate: ((i + n) % 2 ? 1 : -1) * 5 }
            t = SPRING
          } else if (mode === 'drop') {
            anim = { ...rest, y: [-U * 1.3, 0, 0, U * 0.4], opacity: [0, 1, 1, 0], rotate: [-14, 0, 0, 8] }
            t = { duration: 2.2, times: [0, 0.18, 0.78, 0.94], ease: ['backOut', 'linear', 'easeIn'], repeat: Infinity, delay: i * 0.09 }
          } else if (mode === 'flip') {
            anim = { ...rest, scaleX: [1, 1, -1, 1], y: [0, 0, -U * 0.14, 0] }
            t = { duration: 0.8, times: [0, 0.05, 0.5, 1], ease: [0.65, 0, 0.35, 1], repeat: Infinity, repeatDelay: 0.8, delay: i * 0.14 }
          } else if (mode === 'build') {
            anim = { ...rest, opacity: [0, 0, 1, 1, 0, 0], scale: [0.4, 0.4, 1, 1, 0.7, 0.4], y: [U * 0.4, U * 0.4, 0, 0, -U * 0.2, U * 0.4], rotate: [-28, -28, 0, 0, 10, -28] }
            t = loop(['linear', 'backOut', 'linear', 'easeIn', 'linear'])
          } else if (mode === 'deal') {
            const sx = MID[0] - cx, sy = MID[1] - cy, tilt = (i - 1.5) * 9
            anim = { ...rest, x: [sx, sx, 0, 0, sx, sx], y: [sy, sy, 0, 0, sy, sy], rotate: [tilt, tilt, 0, 0, tilt, tilt], scale: [0.9, 0.9, 1, 1, 0.9, 0.9] }
            t = loop([EASE, [0.34, 1.4, 0.64, 1], 'linear', [0.65, 0, 0.35, 1], 'linear'])
          } else if (mode === 'swatch') {
            anim = { ...rest, rotate: [-90, -90, 0, 0, -90, -90], scale: [0, 0, 1, 1, 0, 0] }
            t = loop(['linear', POP, 'linear', 'easeIn', 'linear'])
            tile = { scale: [1, 1, 0, 0, 1, 1], rotate: [0, 0, 90, 90, 0, 0] }
          } else if (mode === 'travel') {
            // out of the left portal into place, then on into the right portal
            const lx = DOOR[0] - cx, ly = DOOR[1] - cy, rx = EXIT[0] - cx, ry = EXIT[1] - cy
            anim = { ...rest, x: [lx, lx, 0, 0, rx, rx], y: [ly, ly, 0, 0, ry, ry], scale: [0.1, 0.1, 1, 1, 0.1, 0.1], rotate: [-220, -220, 0, 0, 260, 260], opacity: [0, 0, 1, 1, 0, 0] }
            t = { duration: TRAVEL, times: trip(i), ease: ['linear', [0.22, 1.35, 0.36, 1], 'linear', [0.55, 0, 0.9, 0.4], 'linear'], repeat: Infinity }
          } else if (mode === 'portal') {
            // spun out of the portal to its place, held, then pulled back in
            const sx = DOOR[0] - cx, sy = DOOR[1] - cy
            anim = { ...rest, x: [sx, sx, 0, 0, sx, sx], y: [sy, sy, 0, 0, sy, sy], scale: [0.1, 0.1, 1, 1, 0.1, 0.1], rotate: [-220, -220, 0, 0, 260, 260], opacity: [0, 0, 1, 1, 0, 0] }
            t = { duration: 3.6, times: pin(i), ease: ['linear', [0.22, 1.35, 0.36, 1], 'linear', [0.55, 0, 0.9, 0.4], 'linear'], repeat: Infinity }
          } else if (mode === 'cycle') {
            // all four share the centre; the current one is shown, the rest are tucked away
            const on = n % 4 === i
            const was = (n + 3) % 4 === i
            anim = { x: MID[0] - cx, y: MID[1] - cy, opacity: on ? 1 : 0, scale: on ? 1.1 : 0.55, rotate: on ? 0 : was ? 24 : -24, scaleX: 1 }
            t = { type: 'spring', stiffness: 420, damping: 26 }
          }
        }
        const start = mode === 'portal' || mode === 'travel' ? { ...rest, x: DOOR[0] - cx, y: DOOR[1] - cy, scale: 0.1, opacity: 0 } : mode === 'swatch' ? { ...rest, scale: 0 } : mode === 'cycle' ? { ...rest, x: MID[0] - cx, y: MID[1] - cy, opacity: i === 0 ? 1 : 0 } : rest
        return (
          <g key={i}>
            {mode === 'swatch' && (
              <motion.g style={{ originX: `${cx}px`, originY: `${cy}px`, transformBox: 'view-box' }} initial={{ scale: 1, rotate: 0 }}
                animate={tile || { scale: 0, rotate: 90 }}
                transition={tile ? loop(['linear', 'easeIn', 'linear', POP, 'linear']) : { duration: 0.3, ease: EASE }}>
                <rect x={cx - 34 + EX * 0.5} y={cy - 34 + EY * 0.5} width="68" height="68" rx="12" className="wl-ink" strokeWidth={OUT} />
                <rect x={cx - 34} y={cy - 34} width="68" height="68" rx="12" fill={g.c} className="wl-face" strokeWidth={OUT} paintOrder="stroke" />
              </motion.g>
            )}
            <motion.g style={{ originX: `${cx}px`, originY: `${cy}px`, transformBox: 'view-box' }} initial={start} animate={anim} transition={t}>
              <Letter g={g} i={i} press={mode === 'press' && !done} />
            </motion.g>
          </g>
        )
      })}
    </svg>
  )
}

export const WLDDS = [
  { id: 'press', name: 'Press', tip: 'Each letter presses into its own shadow, W → L → D → D.' },
  { id: 'dance', name: 'Dance', tip: 'The logo’s uneven baseline passes from letter to letter.' },
  { id: 'drop', name: 'Drop', tip: 'Letters drop in one by one, hold the logo, then fall away.' },
  { id: 'flip', name: 'Flip', tip: 'Letters flip over in sequence.' },
  { id: 'build', name: 'Build', tip: 'One by one: each letter pops up with a twist into its place, then all leave together.' },
  { id: 'deal', name: 'Deal', tip: 'All four start in one pile and are dealt out to their places, then gathered back.' },
  { id: 'swatch', name: 'Swatch', tip: 'The four brand swatches turn into their letters, one by one, and back.' },
  { id: 'cycle', name: 'Cycle', tip: 'One slot; each letter takes its turn. Done sends them out into the word.' },
  { id: 'travel', wide: true, name: 'Travel', tip: 'A portal opens, WLDD comes out, another opens and takes it in; both close. Loops.' },
  { id: 'portal', wide: true, name: 'Portal', tip: 'Wubba lubba dub dub. Letters spin out of a portal and get pulled back in; done closes it.' },
].map((x) => ({ ...x, C: (p) => <Wldd {...p} mode={x.id} /> }))
