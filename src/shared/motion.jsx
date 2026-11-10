// Motion primitives. Rules (Emil Kowalski / Benji Taylor):
// - Animate state changes, not page loads. Nothing "performs" on mount.
// - ease-out, < 300ms for UI. Drawers/trays may use the iOS curve.
// - Never scale from 0 (start ≥ 0.93). Origin-aware. Blur 2px to bridge crossfades.
// - Keyboard-triggered actions are instant.
import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useDragControls } from 'motion/react'
import { ArrowLeft, X, Check, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { clients, campaignTypes, fmt } from '../data'
import { BrandLogo } from './brands'

export const EASE = [0.23, 1, 0.32, 1]
export const DRAWER = [0.32, 0.72, 0, 1]

/* ───────── Tooltip: delayed first, instant after (warm-up window) ───────── */
let warmUntil = 0
export function Tip({ label, kbd, side = 'bottom', children, delay = 450 }) {
  const ref = useRef(null)
  const timer = useRef()
  const [state, setState] = useState(null) // { x, y, instant }
  const place = (instant, touch) => {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    const pos = touch ? { x: Math.min(Math.max(r.left + r.width / 2, 72), window.innerWidth - 72), y: r.top - 10 } // above the finger, kept on screen
      : side === 'right' ? { x: r.right + 8, y: r.top + r.height / 2 }
      : side === 'top' ? { x: r.left + r.width / 2, y: r.top - 8 }
      : { x: r.left + r.width / 2, y: r.bottom + 8 }
    setState({ ...pos, instant, touch })
  }
  const show = () => {
    clearTimeout(timer.current)
    if (Date.now() < warmUntil) place(true)
    else timer.current = setTimeout(() => place(false), delay)
  }
  const hide = () => {
    clearTimeout(timer.current)
    setState((s) => { if (s) warmUntil = Date.now() + 500; return null })
  }
  // Touch has no hover: press and hold shows the label, it clears itself.
  const press = (e) => {
    if (e.pointerType !== 'touch') return hide()
    clearTimeout(timer.current)
    timer.current = setTimeout(() => { place(true, true); timer.current = setTimeout(hide, 1600) }, 420)
  }
  const release = (e) => { if (e.pointerType === 'touch' && !state) clearTimeout(timer.current) }
  const mouse = (fn) => (e) => { if (e.pointerType !== 'touch') fn() }
  useEffect(() => () => clearTimeout(timer.current), [])
  return (
    <span ref={ref} className="tipw" onPointerEnter={mouse(show)} onPointerLeave={mouse(hide)} onPointerDown={press} onPointerUp={release} onPointerCancel={release}>
      {children}
      {state && createPortal(
        <span className={`tip tip-${state.touch ? 'top' : side}${state.instant ? ' instant' : ''}`} style={{ left: state.x, top: state.y }}>
          {label}{kbd && <span className="tip-k">{kbd}</span>}
        </span>, document.body)}
    </span>
  )
}

/* ───────── Rolling number: static on mount, digits roll on change ───────── */
const DIGITS = '0123456789'
export function Ticker({ value, format = (n) => Math.round(n).toLocaleString('en-IN') }) {
  const str = format(value)
  const chars = [...str]
  return (
    <span className="roll" aria-label={str}>
      {chars.map((ch, i) => {
        const key = chars.length - i
        const d = DIGITS.indexOf(ch)
        if (d === -1) return <span key={'s' + key + ch} aria-hidden>{ch}</span>
        return (
          <span key={key} className="roll-d" aria-hidden>
            <span className="roll-s" style={{ transform: `translateY(${-d * 10}%)` }}>
              {DIGITS.split('').map((n) => <span key={n}>{n}</span>)}
            </span>
          </span>
        )
      })}
    </span>
  )
}

/* ───────── Text morph: shared letters stay, the rest blur in/out ───────── */
export function TextMorph({ children, className = '' }) {
  const text = String(children)
  const seen = {}
  const chars = [...text].map((ch) => { seen[ch] = (seen[ch] || 0) + 1; return { ch, key: ch + seen[ch] } })
  return (
    <span className={'morph ' + className} aria-label={text}>
      <AnimatePresence mode="popLayout" initial={false}>
        {chars.map((c) => (
          <motion.span key={c.key} aria-hidden layout="position"
            initial={{ opacity: 0, filter: 'blur(3px)', y: 2 }} animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }} exit={{ opacity: 0, filter: 'blur(3px)', y: -2 }}
            transition={{ duration: 0.22, ease: EASE }} style={{ display: 'inline-block', whiteSpace: 'pre' }}>
            {c.ch}
          </motion.span>
        ))}
      </AnimatePresence>
    </span>
  )
}

/* ───────── Auto width / height containers ───────── */
function useSize(ref) {
  const [size, setSize] = useState(null)
  useLayoutEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver(([e]) => setSize({ w: e.borderBoxSize[0].inlineSize, h: e.borderBoxSize[0].blockSize }))
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [ref])
  return size
}
export function AutoHeight({ children, duration = 0.3, ease = EASE, className }) {
  const ref = useRef(null)
  const size = useSize(ref)
  return (
    <motion.div className={className} animate={{ height: size ? size.h : 'auto' }} transition={{ duration, ease }} style={{ overflow: 'hidden' }}>
      <div ref={ref}>{children}</div>
    </motion.div>
  )
}
export function AutoWidth({ children, className = '' }) {
  const ref = useRef(null)
  const size = useSize(ref)
  return (
    <motion.span className={'autow ' + className} animate={{ width: size ? size.w : 'auto' }} transition={{ duration: 0.25, ease: EASE }} style={{ display: 'inline-flex', overflow: 'hidden', justifyContent: 'center' }}>
      <span ref={ref} style={{ display: 'inline-flex', alignItems: 'center', gap: 'inherit', whiteSpace: 'nowrap', flex: 'none' }}>{children}</span>
    </motion.span>
  )
}

/* ───────── Confirm button: label morphs to a done state, then fires ─────────
   Mouse path: shows "Approved ✓" for ~380ms, then calls onDone.
   Keyboard path should call the action directly (instant). */
export function ConfirmButton({ label, doneLabel, onDone, className = '', icon, doneIcon = <Check size={14} strokeWidth={2.5} />, hold = 380 }) {
  const [done, setDone] = useState(false)
  const t = useRef()
  useEffect(() => () => clearTimeout(t.current), [])
  useEffect(() => { setDone(false) }, [label])
  return (
    <button className={className + ' press' + (done ? ' is-done' : '')} onClick={() => { if (done) return; setDone(true); t.current = setTimeout(() => { onDone(); setDone(false) }, hold) }}>
      <AutoWidth>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span key={done ? 'd' : 'i'} initial={{ opacity: 0, scale: 0.6, filter: 'blur(2px)' }} animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }} exit={{ opacity: 0, scale: 0.6, filter: 'blur(2px)' }} transition={{ duration: 0.18, ease: EASE }} style={{ display: 'inline-grid' }}>
            {done ? doneIcon : icon}
          </motion.span>
        </AnimatePresence>
        <TextMorph>{done ? doneLabel : label}</TextMorph>
      </AutoWidth>
    </button>
  )
}

/* ───────── Directional panel: content slides toward where you went ───────── */
export function useDirection(index) {
  const prev = useRef(index)
  const dir = index > prev.current ? 1 : index < prev.current ? -1 : 0
  useEffect(() => { prev.current = index }, [index])
  return dir
}
const slide = {
  enter: (d) => ({ x: d * 16, opacity: 0, filter: 'blur(2px)' }),
  center: { x: 0, opacity: 1, filter: 'blur(0px)' },
  exit: (d) => ({ x: d * -16, opacity: 0, filter: 'blur(2px)' }),
}
export function SlidePanel({ k, index, children, className, style }) {
  const dir = useDirection(index)
  return (
    <AnimatePresence mode="popLayout" initial={false} custom={dir}>
      <motion.div key={k} custom={dir} variants={slide} initial="enter" animate="center" exit="exit" transition={{ duration: 0.22, ease: EASE }} className={className} style={style}>
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
/** Blur crossfade for swapping content in place (e.g. peek panel switching records). */
export function Swap({ k, children, className, style }) {
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.div key={k} initial={{ opacity: 0, filter: 'blur(2px)' }} animate={{ opacity: 1, filter: 'blur(0px)' }} exit={{ opacity: 0, filter: 'blur(2px)' }} transition={{ duration: 0.16, ease: EASE }} className={className} style={style}>
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

/* ───────── New campaign tray (Family-style dynamic tray) ───────── */
/** Open the new-campaign flow. Pass 'key' when a shortcut opened it, so it appears instantly.
    Desktop gets NewCampaignDialog (centred, keyboard-first); phones get this tray. */
export const openNewCampaign = (via) => {
  const fire = () => window.dispatchEvent(new CustomEvent('dms:new-campaign', { detail: { key: via === 'key' } }))
  // from a shortcut, open after the keystroke finishes so its letter never lands in the new field
  via === 'key' ? setTimeout(fire, 0) : fire()
}
export const isPhone = () => window.matchMedia('(max-width: 760px)').matches

const typeIcon = { 'Meme marketing': '◎', Influencer: '◉', UGC: '◐', 'Music promotion': '♪', 'Product launch': '▲', 'Always-on': '∞', Event: '✦' }
export function NewCampaignTray() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [client, setClient] = useState(null)
  const [type, setType] = useState(null)
  const [budget, setBudget] = useState(1000000)
  const [done, setDone] = useState(false)
  const reset = () => { setStep(0); setClient(null); setType(null); setBudget(1000000); setDone(false) }
  useEffect(() => {
    const on = () => { if (!isPhone()) return; reset(); setOpen(true) }
    window.addEventListener('dms:new-campaign', on)
    return () => window.removeEventListener('dms:new-campaign', on)
  }, [])
  const close = useCallback(() => setOpen(false), [])
  const drag = useDragControls()
  const phone = open && window.matchMedia('(max-width: 760px)').matches
  useEffect(() => {
    if (!open) return
    const on = (e) => { if (e.key === 'Escape') { e.stopPropagation(); step > 0 && !done ? setStep((s) => s - 1) : close() } }
    window.addEventListener('keydown', on, true)
    return () => window.removeEventListener('keydown', on, true)
  }, [open, step, done, close])

  const titles = ['Client', 'Type', 'Budget', 'Review']
  const create = () => {
    setDone(true)
    setTimeout(() => { close(); toast.success(client.name + ' · ' + type, { description: 'WL-1282' }) }, 650)
  }
  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="tray-scrim" onClick={close} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} />
          <motion.div className="tray" role="dialog" aria-label="New campaign"
            initial={{ y: '110%' }} animate={{ y: 0 }} exit={{ y: '110%' }} transition={{ duration: 0.38, ease: DRAWER }}
            {...(phone ? { drag: 'y', dragConstraints: { top: 0, bottom: 0 }, dragElastic: { top: 0, bottom: 0.6 }, dragListener: false, dragControls: drag,
              onDragEnd: (_, i) => { if (i.offset.y > 90 || i.velocity.y > 500) close() } } : {})}>
            {phone && <div className="tray-grab" onPointerDown={(e) => drag.start(e)} aria-hidden><i /></div>}
            <div className="tray-h">
              <button className="tray-ib press" onClick={() => (step === 0 ? close() : setStep(step - 1))} aria-label={step === 0 ? 'Close' : 'Back'}>
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span key={step === 0 ? 'x' : 'b'} initial={{ opacity: 0, scale: 0.7, rotate: step === 0 ? -45 : 45 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} exit={{ opacity: 0, scale: 0.7 }} transition={{ duration: 0.18, ease: EASE }} style={{ display: 'grid' }}>
                    {step === 0 ? <X size={16} /> : <ArrowLeft size={16} />}
                  </motion.span>
                </AnimatePresence>
              </button>
              <b className="tray-t"><TextMorph>{done ? 'Created' : titles[step]}</TextMorph></b>
              <span className="tray-dots">{titles.map((_, i) => <i key={i} className={i <= step ? 'on' : ''} />)}</span>
            </div>
            <AutoHeight duration={0.32} ease={DRAWER}>
              <SlidePanel k={step} index={step} className="tray-b">
                {step === 0 && (
                  <div className="tray-grid">
                    {clients.slice(0, 12).map((c) => (
                      <button key={c.id} className={'tray-opt press' + (client?.id === c.id ? ' on' : '')} onClick={() => { setClient(c); setStep(1) }}>
                        <BrandLogo name={c.name} size={36} radius={11} />
                        <span className="ell">{c.name}</span>
                      </button>
                    ))}
                  </div>
                )}
                {step === 1 && (
                  <div className="tray-list">
                    {campaignTypes.map((t) => (
                      <button key={t} className={'tray-row press' + (type === t ? ' on' : '')} onClick={() => { setType(t); setStep(2) }}>
                        <span className="tray-glyph">{typeIcon[t]}</span>{t}
                      </button>
                    ))}
                  </div>
                )}
                {step === 2 && (
                  <div className="tray-budget">
                    <div className="tray-amt"><Ticker value={budget} format={(n) => fmt.inrFull(Math.round(n))} /></div>
                    <div className="tray-chips">
                      {[500000, 1000000, 2500000, 5000000].map((v) => (
                        <button key={v} className={'tray-chip press' + (budget === v ? ' on' : '')} onClick={() => setBudget(v)}>{fmt.inr(v)}</button>
                      ))}
                    </div>
                    <button className="tray-cta press" onClick={() => setStep(3)}>Continue</button>
                  </div>
                )}
                {step === 3 && (
                  <div className="tray-review">
                    <div className="tray-sum">
                      <BrandLogo name={client.name} size={44} radius={13} />
                      <div><b>{client.name}</b><span>{type}</span></div>
                      <b className="tray-sum-amt">{fmt.inr(budget)}</b>
                    </div>
                    <button className={'tray-cta press' + (done ? ' is-done' : '')} onClick={create}>
                      <AnimatePresence mode="popLayout" initial={false}>
                        {done && <motion.span key="c" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2, ease: EASE }} style={{ display: 'grid' }}><Check size={16} strokeWidth={2.5} /></motion.span>}
                      </AnimatePresence>
                      <TextMorph>{done ? 'Created' : 'Create campaign'}</TextMorph>
                    </button>
                  </div>
                )}
              </SlidePanel>
            </AutoHeight>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}
export { Plus }

/* Shortcut labels follow the OS: ⌥ / ⌘ on Mac, Alt+ / Ctrl+ elsewhere. */
const IS_MAC = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)
export const ALT = IS_MAC ? '⌥' : 'Alt+'
export const MOD = IS_MAC ? '⌘' : 'Ctrl+'
export const MOD_SHIFT = IS_MAC ? '⇧⌘' : 'Ctrl+Shift+'
