// Right-click anything we hold — a company, person, deal, campaign, creator, teammate — to write a to-do on it or see its open ones.
// Right-click a to-do for its quick actions. Shift + right-click keeps the browser's own menu.
// Finding the thing under the cursor, most specific first:
//   a link chip → a to-do row → [data-ent] (rows that navigate in code) → an in-app link (#/bd/pipeline/…) →
//   the one logo ([data-brand]) or avatar ([data-person]) in the row under the cursor.
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'motion/react'
import { ListPlus, ArrowUpRight, CalendarDays, Pin, Check, Trash2, UserRound, ListTree, PanelRight, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { useStore } from '../store'
import { EASE } from '../../shared/motion'
import { team } from '../data'
import { indexOf, linkOf, pageCtx, linkedTo, hrefOf, KIND_ONE, meId, whoOf, dueLabel, at, top, bucketOf } from './logic'
import { openTodoAdd, openTodo } from './state'
import { Mark } from './ui'

/** For rows that navigate in code rather than with a link: `<tr data-ent={entAttr(link)}>`. */
export const entAttr = (l) => JSON.stringify({ kind: l.kind, id: l.id, label: l.label, brand: l.brand ?? null })

const ROWS = 'tr, .li, li, article, [role=row], .td-row, .bdv-card, .card, [data-row]'
function brandEnt(name, s) {
  const idx = indexOf(s)
  const e = idx.co.find((x) => x.label.toLowerCase() === name.toLowerCase())
  return e ? linkOf(e) : { kind: 'brand', id: name, label: name, brand: name }
}
function personEnt(name, s) {
  const u = team.find((x) => x.name === name)
  if (u) return { kind: 'member', id: u.id, label: u.name, hue: u.hue }
  const e = indexOf(s).byName[name.toLowerCase()]
  return e && e.kind === 'person' ? linkOf(e) : null
}
const one = (box, sel) => { if (box.matches(sel)) return box; const l = box.querySelectorAll(sel); return l.length === 1 ? l[0] : null }

function resolve(target, s) {
  if (target.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"], .td-ctx')) return null
  const chip = target.closest('a.td-chip')
  if (chip) { const e = fromHref(chip.getAttribute('href'), s); if (e) return { ent: e } }
  const row = target.closest('.td-row[data-id]')
  if (row) return { todo: row.dataset.id }
  const de = target.closest('[data-ent]')
  if (de) { try { return { ent: JSON.parse(de.dataset.ent) } } catch { /* fall through */ } }
  const a = target.closest('a[href^="#/"]')
  if (a) { const e = fromHref(a.getAttribute('href'), s); if (e) return { ent: e } }
  const direct = target.closest('[data-brand], [data-person]')
  const box = direct || target.closest(ROWS)
  if (!box) return null
  const b = one(box, '[data-brand]')
  if (b) return { ent: brandEnt(b.dataset.brand, s) }
  const p = one(box, '[data-person]')
  if (p) { const e = personEnt(p.dataset.person, s); if (e) return { ent: e } }
  return null
}
function fromHref(href, s) {
  if (!href || !href.startsWith('#/')) return null
  const c = pageCtx(href.slice(1).split('?')[0], s)
  return c ? c.links[0] : null
}

export function EntityMenu() {
  const s = useStore()
  const [m, setM] = useState(null) // { x, y, ent?, todo? }
  const sRef = useRef(s); sRef.current = s
  useEffect(() => {
    const on = (e) => {
      if (e.shiftKey || e.defaultPrevented) return
      const hit = resolve(e.target, sRef.current)
      if (!hit) { setM(null); return }
      e.preventDefault()
      setM({ x: e.clientX, y: e.clientY, ...hit })
    }
    document.addEventListener('contextmenu', on)
    return () => document.removeEventListener('contextmenu', on)
  }, [])
  useEffect(() => {
    if (!m) return
    const close = () => setM(null)
    const down = (e) => { if (!e.target.closest('.td-ctx')) close() }
    const key = (e) => { if (e.key === 'Escape') { e.preventDefault(); close() } }
    document.addEventListener('mousedown', down); window.addEventListener('keydown', key, true)
    window.addEventListener('scroll', close, true); window.addEventListener('resize', close); window.addEventListener('blur', close)
    return () => { document.removeEventListener('mousedown', down); window.removeEventListener('keydown', key, true); window.removeEventListener('scroll', close, true); window.removeEventListener('resize', close); window.removeEventListener('blur', close) }
  }, [m])
  return createPortal(
    <AnimatePresence>{m && <Menu key={m.x + ':' + m.y} m={m} close={() => setM(null)} />}</AnimatePresence>,
    document.body,
  )
}

function Menu({ m, close }) {
  const ref = useRef()
  const [pos, setPos] = useState({ left: m.x, top: m.y, origin: 'top left' })
  useLayoutEffect(() => {
    const r = ref.current.getBoundingClientRect()
    const left = m.x + r.width > window.innerWidth - 8 ? Math.max(8, m.x - r.width) : m.x
    const top = m.y + r.height > window.innerHeight - 8 ? Math.max(8, m.y - r.height) : m.y
    setPos({ left, top, origin: (top < m.y ? 'bottom' : 'top') + ' ' + (left < m.x ? 'right' : 'left') })
    ref.current.querySelector('button')?.focus({ preventScroll: true })
  }, [m.x, m.y])
  const nav = (e) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    e.preventDefault()
    const bs = [...ref.current.querySelectorAll('button:not(:disabled)')]
    const i = bs.indexOf(document.activeElement)
    bs[(i + (e.key === 'ArrowDown' ? 1 : -1) + bs.length) % bs.length]?.focus()
  }
  const run = (f) => () => { close(); f() }
  return (
    <motion.div ref={ref} className="pop td-ctx" role="menu" onKeyDown={nav} onContextMenu={(e) => e.preventDefault()}
      style={{ position: 'fixed', left: pos.left, top: pos.top, transformOrigin: pos.origin }}
      initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, transition: { duration: 0.08 } }} transition={{ duration: 0.13, ease: EASE }}>
      {m.todo ? <TodoMenu id={m.todo} run={run} /> : <EntMenu e={m.ent} run={run} />}
    </motion.div>
  )
}

function EntMenu({ e, run }) {
  const s = useStore()
  const member = e.kind === 'member'
  const ctx = { keys: new Set([e.kind + ':' + e.id]), brand: e.kind === 'brand' || e.kind === 'deal' ? e.brand : null }
  const open = s.todo.items.filter((t) => !t.done && top(t) && (member ? whoOf(t) === e.id : linkedTo(t, ctx)))
    .sort((a, b) => (a.due ? +a.due : 9e15) - (b.due ? +b.due : 9e15))
  const href = !member && e.kind !== 'phone' ? hrefOf(e) : null
  const here = href && location.hash.slice(1).startsWith(href)
  const isMe = member && e.id === meId()
  return (
    <>
      <div className="td-ctx-h"><Mark e={e} size={18} /><span className="ell">{e.label}</span><span className="mute xs">{isMe ? 'You' : KIND_ONE[e.kind]}</span></div>
      <button role="menuitem" onClick={run(() => (member ? openTodoAdd([], { who: e.id }) : openTodoAdd([e])))}>
        <ListPlus size={14} /><span className="grow">{member && !isMe ? 'Assign a to-do' : 'Add to-do'}</span>
      </button>
      {open.length > 0 && (
        <>
          <div className="pop-sep" />
          <div className="pop-h">Open to-dos <span className="num">{open.length}</span></div>
          {open.slice(0, 4).map((t) => (
            <button key={t.id} role="menuitem" className="td-ctx-t" onClick={run(() => openTodo(t.id))}>
              <span className="td-ctx-dot" /><span className="grow ell">{t.text}</span>{t.due && <span className={'td-due b-' + bucketOf(t)}>{dueLabel(t.due)}</span>}
            </button>
          ))}
          {open.length > 4 && <div className="mute xs td-ctx-more">+{open.length - 4} more</div>}
        </>
      )}
      <div className="pop-sep" />
      {href && !here && <button role="menuitem" onClick={run(() => { location.hash = '#' + href })}><ArrowUpRight size={14} /><span className="grow">Open {KIND_ONE[e.kind].toLowerCase()}</span></button>}
      <button role="menuitem" onClick={run(() => { navigator.clipboard?.writeText(e.label); toast('Copied', { description: e.label }) })}><Copy size={14} /><span className="grow">Copy name</span></button>
    </>
  )
}

function TodoMenu({ id, run }) {
  const s = useStore()
  const t = s.todo.items.find((x) => x.id === id)
  if (!t) return null
  const set = (p) => s.todo.patch(t.id, p)
  const mineNow = whoOf(t) === meId()
  return (
    <>
      <div className="td-ctx-h td-ctx-h-t"><span className="ell">{t.text}</span></div>
      <button role="menuitem" onClick={run(() => openTodo(t.id))}><PanelRight size={14} /><span className="grow">Open</span></button>
      {!t.parent && <button role="menuitem" onClick={run(() => openTodo(t.id))}><ListTree size={14} /><span className="grow">Add subtask</span></button>}
      <div className="pop-sep" />
      <div className="pop-h">Due</div>
      <div className="td-ctx-due">
        {[['Today', at(0)], ['Tomorrow', at(1)], ['Next week', at(((8 - at(0).getDay()) % 7) || 7)]].map(([l, d]) => (
          <button key={l} role="menuitem" className={t.due && +t.due === +d ? 'on' : ''} onClick={run(() => set({ due: d, remind: d, ...(t.start && t.start > d ? { start: null } : null) }))}>{l}</button>
        ))}
        {t.due && <button role="menuitem" onClick={run(() => set({ due: null, start: null, remind: null }))} aria-label="No date"><CalendarDays size={13} />None</button>}
      </div>
      <div className="pop-sep" />
      {!mineNow && <button role="menuitem" onClick={run(() => set({ who: meId() }))}><UserRound size={14} /><span className="grow">Assign to me</span></button>}
      <button role="menuitem" onClick={run(() => set({ pinned: !t.pinned }))}><Pin size={14} /><span className="grow">{t.pinned ? 'Unpin' : 'Pin'}</span></button>
      <button role="menuitem" onClick={run(() => s.todo.toggle(t.id))}><Check size={14} /><span className="grow">{t.done ? 'Mark not done' : 'Mark done'}</span></button>
      <button role="menuitem" className="td-ctx-del" onClick={run(() => s.todo.remove(t.id))}><Trash2 size={14} /><span className="grow">Delete</span></button>
    </>
  )
}
