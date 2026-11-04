import { motion } from 'motion/react'
import { ArrowUpRight, Command, Keyboard, MousePointerClick, Sparkles } from 'lucide-react'
import { VARIANTS, go, useHotkeys, useVariantRoot, ease } from './shared/ui'
import './launcher.css'

const previews = {
  v1: { bg: '#0b0b0d', panel: '#141417', line: '#26262b', accent: '#7c7ff2', layout: 'sidebar' },
  v2: { bg: '#000', panel: '#0a0a0a', line: '#262626', accent: '#ededed', layout: 'tabs' },
  v3: { bg: '#fbfbfa', panel: '#fff', line: '#e9e9e7', accent: '#3d63dd', layout: 'table' },
  v4: { bg: '#f7f6f3', panel: '#fffefb', line: '#e7e4dc', accent: '#c4553a', layout: 'doc' },
  v5: { bg: '#0d0e12', panel: '#14161c', line: '#232631', accent: '#8b7bff', layout: 'split' },
}

function Preview({ id }) {
  const p = previews[id]
  const row = (w, o = 1, a) => <i style={{ width: w, background: a ? p.accent : p.line, opacity: o }} />
  return (
    <div className="lp-prev" style={{ background: p.bg, borderColor: p.line }}>
      {p.layout === 'tabs' && <div className="lp-top" style={{ borderColor: p.line }}>{row('14%', 1, true)}{row('10%')}{row('10%')}{row('10%')}</div>}
      <div className="lp-body">
        {(p.layout === 'sidebar' || p.layout === 'doc' || p.layout === 'split' || p.layout === 'table') && (
          <div className="lp-side" style={{ borderColor: p.line, background: p.layout === 'doc' ? '#efede8' : 'transparent' }}>
            {row('70%', 1, true)}{row('55%')}{row('62%')}{row('48%')}{row('58%')}
          </div>
        )}
        {p.layout === 'split' && <div className="lp-list" style={{ borderColor: p.line }}>{[0, 1, 2, 3, 4].map((i) => <div key={i} className="lp-li" style={{ background: i === 1 ? p.panel : 'transparent', borderColor: p.line }}>{row('70%')}{row('40%', 0.5)}</div>)}</div>}
        <div className="lp-main" style={{ background: p.layout === 'sidebar' ? p.panel : 'transparent', borderColor: p.line }}>
          {p.layout === 'doc' && <div style={{ fontFamily: 'Newsreader, serif', fontSize: 15, color: '#37352f', marginBottom: 6 }}>Campaigns</div>}
          {p.layout === 'tabs' ? (
            <div className="lp-grid">{[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="lp-card" style={{ borderColor: p.line, background: p.panel }}>{row('50%')}{row('80%', 0.5)}</div>)}</div>
          ) : (
            [0, 1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="lp-row" style={{ borderColor: p.line }}>
                <b style={{ background: ['#45b26b', '#9b87f5', '#e2b340', '#4ea7fc'][i % 4] }} />{row(`${40 + ((i * 13) % 35)}%`)}{row('12%', 0.5)}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default function Launcher() {
  useVariantRoot('home', 'dark')
  useHotkeys(Object.fromEntries(VARIANTS.map((v, i) => [String(i + 1), () => go('/' + v.id)])))
  return (
    <div className="lp">
      <header className="lp-head">
        <motion.div>
          <div className="lp-logo"><span style={{ color: '#5fd38d' }}>W</span><span style={{ color: '#c58af9' }}>L</span><span style={{ color: '#ff6b8b' }}>D</span><span style={{ color: '#ffd166' }}>D</span><em>DMS · Playground</em></div>
          <h1>Five directions for the new DMS.</h1>
          <p>Same data, same workflows — campaigns, approvals, sketchboards, analytics and the knowledge base — explored through five different design systems. Every screen is interactive.</p>
        </motion.div>
        <div className="lp-hints">
          <span><Command size={13} /> <kbd>⌘K</kbd> anywhere</span>
          <span><Keyboard size={13} /> <kbd>G</kbd> then <kbd>C</kbd> / <kbd>A</kbd> / <kbd>K</kbd> to jump</span>
          <span><MousePointerClick size={13} /> press <kbd>1</kbd>–<kbd>5</kbd> to open</span>
        </div>
      </header>

      <div className="lp-grid-v">
        {VARIANTS.map((v, i) => (
          <motion.button
            key={v.id} className="lp-v press" onClick={() => go('/' + v.id)}
          >
            <Preview id={v.id} />
            <div className="lp-meta">
              <div className="lp-t"><span className="lp-n">{v.n}</span>{v.name}<ArrowUpRight size={14} className="lp-arrow" /></div>
              <div className="lp-ref">{v.ref}</div>
              <p>{v.desc}</p>
            </div>
          </motion.button>
        ))}
        <motion.div className="lp-v lp-notes">
          <div className="lp-t"><Sparkles size={14} /> Principles applied</div>
          <ul>
            <li><b>Neutral first.</b> Colour is reserved for status & meaning; chrome stays greyscale (Linear's LCH rework).</li>
            <li><b>Fewer tokens.</b> Each variant is ~10 CSS variables: bg, panel, border, fg, muted, accent.</li>
            <li><b>Ease-out, under 300ms.</b> cubic-bezier(.23,1,.32,1) for UI, drawer curve for sheets.</li>
            <li><b>Never animate keyboard actions.</b> J/K and shortcuts are instant; only mouse-initiated state animates.</li>
            <li><b>Origin-aware & interruptible.</b> Popovers scale from their trigger, transitions retarget mid-flight.</li>
            <li><b>Tactile.</b> Buttons press to 0.97; numbers tick up once on load, then stay still.</li>
          </ul>
        </motion.div>
      </div>
    </div>
  )
}
