import { motion } from 'motion/react'
import { EASE } from '../shared/motion'
import './orbs.css'

/* Brand sequence, in logo order: W L D D. */
const C = ['#72CE85', '#D37AF4', '#ED4C6F', '#F2C92D']
const G = C[0]

/** Shared ending for orbs: a green disc settles over the orb and a check draws in. */
function OrbDone({ done, inset = 0, disc = true }) {
  return (
    <motion.span className="orb-done" style={{ inset }} initial={false}
      animate={{ opacity: done ? 1 : 0, scale: done ? 1 : 0.93 }} transition={{ duration: 0.3, ease: EASE }}>
      {disc && <span className="orb-done-bg" />}
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <motion.path d="M7.5 12.4l3 3L16.6 9.2" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
          initial={false} animate={{ pathLength: done ? 1 : 0 }} transition={{ duration: 0.32, ease: EASE, delay: done ? 0.18 : 0 }} />
      </svg>
    </motion.span>
  )
}
const vars = (size) => ({ '--s': size + 'px', width: size, height: size })

/** Aura: four colour fields drift inside a glass sphere. Thinking. */
export function Aura({ size, done }) {
  return (
    <span className={'orb orb-aura' + (done ? ' orb-fin' : '')} style={vars(size)}>
      <span className="orb-glass">
        {C.map((c, i) => <span key={i} className="orb-orbit" style={{ '--i': i }}><span className="orb-blob" style={{ background: c }} /></span>)}
      </span>
      <OrbDone done={done} />
    </span>
  )
}

/** Swirl: a conic sweep of the four colours turns round a breathing white core. Reasoning. */
export function Swirl({ size, done }) {
  return (
    <span className={'orb orb-swirl' + (done ? ' orb-fin' : '')} style={vars(size)}>
      <span className="orb-glass">
        <span className="orb-cone" />
        <span className="orb-core" />
      </span>
      <OrbDone done={done} />
    </span>
  )
}

/** Ripple: a small orb sends out a ring of each colour in turn. Streaming the answer. */
export function Ripple({ size, done }) {
  return (
    <span className={'orb orb-ripple' + (done ? ' orb-fin' : '')} style={vars(size)}>
      {C.map((c, i) => <span key={i} className="orb-rip" style={{ '--c': c, '--i': i }} />)}
      <span className="orb-glass orb-seed"><span className="orb-cone" /></span>
      <OrbDone done={done} inset="20%" />
    </span>
  )
}

/** Tide: four colour waves slosh while the level rises and falls; done fills it green. Working on a task. */
const WAVE = 'M0 10 Q25 0 50 10 T100 10 T150 10 T200 10 V100 H0Z'
export function Tide({ size, done }) {
  const back = [3, 2, 1, 0]
  return (
    <span className={'orb orb-tide' + (done ? ' orb-fin' : '')} style={vars(size)}>
      <span className="orb-glass">
        <motion.span className="orb-level" initial={{ y: '52%' }}
          animate={done ? { y: '-34%' } : { y: ['52%', '22%', '52%'] }}
          transition={done ? { duration: 0.6, ease: EASE } : { duration: 3.6, ease: 'easeInOut', repeat: Infinity }}>
          {back.map((ci, k) => (
            <span key={ci} className="orb-wave" style={{ '--k': k, top: k * 8 + '%' }}>
              <svg viewBox="0 0 200 100" preserveAspectRatio="none" aria-hidden><path d={WAVE} fill={done ? G : C[ci]} /></svg>
            </span>
          ))}
        </motion.span>
      </span>
      <OrbDone done={done} disc={false} />
    </span>
  )
}

export const ORBS = [
  { id: 'aura', name: 'Aura', C: Aura, tip: 'Thinking. Colour fields drift inside a glass sphere.' },
  { id: 'swirl', name: 'Swirl', C: Swirl, tip: 'Reasoning. A conic sweep turns round a breathing core.' },
  { id: 'ripple', name: 'Ripple', C: Ripple, tip: 'Streaming. Each colour leaves as a ring, in turn.' },
  { id: 'tide', name: 'Tide', C: Tide, tip: 'Working. Waves slosh as the level rises and falls; done fills it green.' },
]
