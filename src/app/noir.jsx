/* Noir desk: a dark, hairline look plus a desk-style way of working, each piece its own preference.
   style 'noir'          paint (styles.css), with three dials: highlight · canvas · grid lines
   prefs.sidebar 'sections'  flat sections sidebar (App.jsx)
   prefs.home 'brief'        Brief home (Hub.jsx)
   prefs.peek 'docked'       records open in a panel docked right (views.jsx → RecordDock)
   prefs.assistant 'docked'  an assistant panel docked right, toggled from the top bar
   The "Noir desk" preset turns all of them on; "Back to default" restores today's defaults. */
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { toast } from 'sonner'
import { AtSign, ArrowUp, ChevronDown, Copy, Check, Plus, Square, X, Search } from 'lucide-react'
import { Tip, EASE } from '../shared/motion'
import { useStore } from './store'
import { ROLES, clients } from './data'
import { view } from './personas'
import { Popover, RoleIcon } from './ui'
import { RecordDock } from './views'
import { Answer, resolve, refFor, suggestFor } from './pages/Hub'
import { Wldd } from '../loaders/Wldd'
import { WlddMark } from '../shared/WlddMark'

/* ───────── Dials ───────── */
export const NOIR_AXES = [
  { id: 'noirHl', label: 'Highlight', opts: [
    { id: 'periwinkle', label: 'Periwinkle', c: '#7c8cff' }, { id: 'violet', label: 'Violet', c: '#a78bfa' },
    { id: 'mint', label: 'Mint', c: '#5fd4a8' }, { id: 'amber', label: 'Amber', c: '#f2b14a' },
  ] },
  { id: 'noirCanvas', label: 'Canvas', opts: [{ id: 'black', label: 'Black' }, { id: 'graphite', label: 'Graphite' }] },
  { id: 'noirGrid', label: 'Grid lines', opts: [{ id: 'on', label: 'On' }, { id: 'off', label: 'Off' }] },
]
export const NOIR_DEFAULTS = { noirHl: 'periwinkle', noirCanvas: 'black', noirGrid: 'on' }
export const NOIR_SWATCH = ['#000000', '#7c8cff']
export const noirSwatch = (prefs) => ['#000000', NOIR_AXES[0].opts.find((o) => o.id === prefs.noirHl)?.c || '#7c8cff']

/** Dials live on <html> so CSS can read them; only Noir's rules do. */
export function applyNoir(prefs) {
  const d = document.documentElement.dataset
  d.noirHl = prefs.noirHl; d.noirCanvas = prefs.noirCanvas; d.noirGrid = prefs.noirGrid
}
export function clearNoir() {
  const d = document.documentElement.dataset
  delete d.noirHl; delete d.noirCanvas; delete d.noirGrid
}

/** Highlight · Canvas · Grid lines. Same rows as the Pop mixer so the menus read alike. */
export function NoirTuner({ prefs, setPrefs }) {
  return (
    <div className="pt">
      {NOIR_AXES.map((a) => (
        <div key={a.id} className="pt-row">
          <span className="pt-l">{a.label}</span>
          <div className="pt-seg" role="radiogroup" aria-label={a.label} style={{ gridTemplateColumns: `repeat(${a.opts.length}, 1fr)` }}>
            {a.opts.map((o) => {
              const on = prefs[a.id] === o.id
              return (
                <Tip key={o.id} label={o.label}>
                  <button role="radio" aria-checked={on} aria-label={a.label + ' ' + o.label} className={'pt-o' + (on ? ' on' : '')} onClick={() => setPrefs({ ...prefs, [a.id]: o.id })}>
                    {o.c ? <span className="nr-dot" style={{ background: o.c }} /> : <span className="pt-aa">{o.label}</span>}
                  </button>
                </Tip>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ───────── Preset ───────── */
export const DESK_ON = { sidebar: 'sections', home: 'brief', peek: 'docked', assistant: 'docked' }
export const DESK_OFF = { sidebar: 'stack', home: 'stack', peek: 'overlay', assistant: 'off' }
export const deskIsOn = (look) => look.style === 'noir' && Object.entries(DESK_ON).every(([k, v]) => look.prefs[k] === v)

/** Two buttons: turn the whole desk on, or put every piece back to today's defaults. */
export function DeskPreset({ look, close, compact }) {
  const on = deskIsOn(look)
  return (
    <div className={'nr-desk' + (compact ? ' compact' : '')}>
      <button className={'b sm' + (on ? ' on' : '')} aria-pressed={on} onClick={() => { look.setDesk(true); close?.() }}>
        <span className="nr-orb" aria-hidden />Noir desk{on && <Check size={13} />}
      </button>
      <button className="b sm ghost" onClick={() => { look.setDesk(false); close?.() }}>Back to default</button>
    </div>
  )
}

/* ───────── Dock host ───────── */
const usePhone = () => {
  const q = '(max-width: 760px)'
  const [m, setM] = useState(() => window.matchMedia?.(q).matches ?? false)
  useEffect(() => { const mq = window.matchMedia?.(q); if (!mq) return; const on = () => setM(mq.matches); mq.addEventListener('change', on); return () => mq.removeEventListener('change', on) }, [])
  return m
}
const WIDTH = { record: 460, assistant: 380 }

/** The right-hand slot. Desktop: docked beside the page (the page shrinks). Phones: a full-screen sheet. */
export function DockPanel({ dock, setDock, chat, reduced }) {
  const phone = usePhone()
  const w = dock ? WIDTH[dock.kind] : 0
  const t = { duration: reduced ? 0 : 0.24, ease: EASE }
  return (
    <AnimatePresence initial={false}>
      {dock && (
        <motion.aside key="dock" className={'nd-dock k-' + dock.kind} role="complementary" aria-label={dock.kind === 'record' ? 'Record' : 'Assistant'}
          initial={phone ? { y: '100%' } : { width: 0 }} animate={phone ? { y: 0 } : { width: w }} exit={phone ? { y: '100%', transition: t } : { width: 0, transition: t }} transition={t}>
          <div className="nd-in" style={phone ? undefined : { width: w }}>
            {dock.kind === 'record'
              ? <RecordDock id={dock.id} ids={dock.ids} onClose={() => setDock(null)} onMove={(id) => setDock({ ...dock, id })} />
              : <AssistantPanel chat={chat} onClose={() => setDock(null)} />}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}

/* ───────── Assistant ─────────
   Same answer engine as Home's chat (route → ref → resolve), so answers are always live data.
   Messages last for the session; Home keeps the saved history. */
export function useAssistant() {
  const [msgs, setMsgs] = useState([])
  const [busy, setBusy] = useState(false)
  const t = useRef()
  useEffect(() => () => clearTimeout(t.current), [])
  const ask = (text, mods, kpi) => {
    if (!text.trim() || busy) return
    const ctx = !kpi && [...msgs].reverse().find((m) => m.ref?.mod)?.ref
    const ref = refFor(text, ctx, mods, kpi)
    const now = Date.now()
    setMsgs((l) => [...l, { id: now, who: 'me', text: text.trim() }])
    setBusy(true)
    t.current = setTimeout(() => { setMsgs((l) => [...l, { id: now + 1, who: 'wldd', ref }]); setBusy(false) }, 900)
  }
  const stop = () => { clearTimeout(t.current); setBusy(false) }
  const reset = () => { stop(); setMsgs([]) }
  return { msgs, busy, ask, stop, reset }
}

/** One muted line saying what was read, opening to the source. */
function Step({ a }) {
  const [open, setOpen] = useState(false)
  if (a.miss || a.locked) return null
  const label = a.summary ? `Read ${a.summary.length} workspaces` : a.list ? `Looked up ${a.list.length} ${a.mod === 'finance' ? 'invoices' : a.mod === 'bd' ? 'leads' : 'campaigns'}` : `Read ${a.kpi.label.toLowerCase()}`
  return (
    <div className="as-step">
      <button className="as-step-b" onClick={() => setOpen((o) => !o)} aria-expanded={open}>{label}<ChevronDown size={12} style={{ rotate: open ? '180deg' : '0deg' }} /></button>
      {open && <div className="as-step-d">{a.summary ? a.summary.map((g) => ROLES.find((r) => r.id === g.mod).label).join(' · ') : <>{ROLES.find((r) => r.id === a.mod).label} › {a.kpi.q}</>} · live</div>}
    </div>
  )
}
const plain = (a) => [a.kpi?.q, a.text, ...(a.list || []).map((x) => `${x.title} · ${x.sub}`), ...(a.summary || []).map((g) => g.kpis.map((k) => `${k.label} ${k.f(k.value)}`).join(', '))].filter(Boolean).join('\n')

function AssistantPanel({ chat, onClose }) {
  const s = useStore()
  const p = view()
  const mods = ROLES.filter((r) => p.roles.includes(r.id)).map((r) => r.id)
  const suggest = suggestFor(mods)
  const [q, setQ] = useState('')
  const [copied, setCopied] = useState(null)
  const box = useRef()
  const end = useRef()
  useEffect(() => { box.current?.focus() }, [])
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }) }, [chat.msgs.length, chat.busy])
  useEffect(() => {
    const on = (e) => { if (e.key === 'Escape' && !document.querySelector('.pop, .cmdk-content')) onClose() }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [onClose])
  const send = (text, kpi) => { chat.ask(text, mods, kpi); setQ(''); if (box.current) box.current.style.height = 'auto' }
  const copy = (m, a) => { navigator.clipboard?.writeText(plain(a)); setCopied(m.id); setTimeout(() => setCopied(null), 1200) }
  return (
    <div className="as">
      <div className="as-h">
        <b className="as-name">Ask WLDD</b>
        <span className="grow" />
        <Tip label="New chat"><button className="b ghost icon sm" onClick={chat.reset} disabled={!chat.msgs.length} aria-label="New chat"><Plus size={15} /></button></Tip>
        <Tip label="Close" kbd="Esc"><button className="b ghost icon sm" onClick={onClose} aria-label="Close"><X size={15} /></button></Tip>
      </div>
      <div className="as-body" aria-live="polite">
        {!chat.msgs.length && (
          <div className="as-empty">
            <WlddMark height={28} className="as-mark" />
            <div className="as-sug">{suggest.map((k) => <button key={k.mod + k.id} className="chip hub-chip" onClick={() => send(k.q, k)}><RoleIcon role={k.mod} size={16} />{k.q}</button>)}</div>
          </div>
        )}
        <AnimatePresence initial={false}>
          {chat.msgs.map((m) => {
            if (m.who === 'me') return <motion.div key={m.id} className="as-msg me" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: EASE }}><div className="as-me">{m.text}</div></motion.div>
            const a = resolve(m.ref, mods, s)
            return (
              <motion.div key={m.id} className="as-msg wldd" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: EASE }}>
                <div className="as-who">
                  <span className="as-av" aria-hidden>W</span><span>WLDD</span>
                  <Tip label={copied === m.id ? 'Copied' : 'Copy'}><button className="b ghost icon sm as-copy" onClick={() => copy(m, a)} aria-label="Copy">{copied === m.id ? <Check size={13} /> : <Copy size={13} />}</button></Tip>
                </div>
                <Step a={a} />
                <Answer a={a} ask={send} suggest={suggest} />
              </motion.div>
            )
          })}
        </AnimatePresence>
        {chat.busy && <div className="as-msg wldd"><span className="hub-think" role="status" aria-label="Thinking"><Wldd mode="cycle" size={22} tight /></span></div>}
        <div ref={end} />
      </div>
      <form className="as-box" onSubmit={(e) => { e.preventDefault(); send(q) }} onMouseDown={(e) => { if (e.target === e.currentTarget) { e.preventDefault(); box.current?.focus() } }}>
        <textarea ref={box} rows={1} value={q} placeholder={chat.msgs.length ? 'Reply…' : 'What do you need?'} aria-label="Ask WLDD"
          onChange={(e) => { setQ(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px' }}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(q) } }} />
        <div className="as-box-f">
          <Popover align="left" width={220} side="top" trigger={({ toggle }) => (
            <Tip label="Mention a client"><button type="button" className="b ghost icon sm" onClick={toggle} aria-label="Mention a client"><AtSign size={14} /></button></Tip>
          )}>
            {(close) => <Mention pick={(n) => { setQ((v) => (v ? v.replace(/\s*$/, ' ') : '') + n + ' '); close(); box.current?.focus() }} />}
          </Popover>
          <span className="grow" />
          {chat.busy
            ? <Tip label="Stop"><button type="button" className="b icon sm as-send" onClick={chat.stop} aria-label="Stop"><Square size={10} fill="currentColor" /></button></Tip>
            : <Tip label="Send" kbd="↵"><button type="submit" className="b ink icon sm as-send" disabled={!q.trim()} aria-label="Send"><ArrowUp size={15} /></button></Tip>}
        </div>
      </form>
    </div>
  )
}

function Mention({ pick }) {
  const [f, setF] = useState('')
  const list = clients.filter((c) => c.name.toLowerCase().includes(f.toLowerCase())).slice(0, 8)
  return (
    <>
      <label className="inp hub-hist-f"><Search size={14} /><input autoFocus value={f} onChange={(e) => setF(e.target.value)} placeholder="Client" /></label>
      {list.map((c) => <button key={c.id} onClick={() => pick(c.name)}>{c.name}</button>)}
      {!list.length && <div className="pop-h">No match</div>}
    </>
  )
}

export const toastDesk = (on) => toast(on ? 'Noir desk on' : 'Back to default')
