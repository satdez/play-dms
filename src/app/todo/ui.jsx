// To-do pieces every variation shares: link chips, the tick, a row, the smart composer, the record block, the top-bar button.
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { Radar, Cog, Inbox, Check, Phone, Megaphone, Receipt, X, ArrowUp, CalendarDays, ListChecks, Plus, Trash2, Pin, Shapes, AtSign, CornerDownRight, GanttChart, ArrowRight } from 'lucide-react'
import { useStore } from '../store'
import { Tip } from '../../shared/motion'
import { Avatar, AvatarStack } from '../../shared/ui'
import { BrandLogo } from '../../shared/brands'
import { Popover, go } from '../ui'
import { team, TODAY } from '../data'
import {
  indexOf, search, settled, exact, linkOf, phoneLink, findPhones, parseDate, cut, hrefOf, segments, dueLabel, bucketOf, meId, mine,
  KIND_LABEL, KIND_ORDER, linkedTo, dayDiff, at, parseRange, whosOf, asList, spanLabel, top, originOf, deletable,
} from './logic'
import { openTodoAdd, openTodos, openTodo } from './state'

export const userOf = (id) => team.find((u) => u.id === id)
const KIND_ICON = { signal: Radar, campaign: Megaphone, invoice: Receipt, phone: Phone }

/** The picture for a link or index entry: a real logo for companies, an avatar for people, an icon otherwise. */
export function Mark({ e, size = 16 }) {
  if (e.kind === 'person' || e.kind === 'member' || e.kind === 'vendor') return <Avatar user={{ name: e.label, hue: e.hue ?? (e.label.length * 37) % 360 }} size={size} />
  if (e.kind === 'phone') return <Phone size={size - 3} className="td-ico" />
  const logo = e.logo || (e.kind === 'brand' || e.kind === 'deal' ? e.brand || e.label : e.kind === 'campaign' ? e.brand : null)
  if (logo) return <BrandLogo name={logo} size={size} radius={4} />
  const I = KIND_ICON[e.kind] || Shapes
  return <I size={size - 3} className="td-ico" />
}

/** A link inside item text. Companies, people, deals and campaigns open their page; a phone number dials. */
export function LinkChip({ l, sm }) {
  const href = l.kind === 'phone' ? 'tel:' + l.label.replace(/\s/g, '') : hrefOf(l)
  const text = l.kind === 'phone' && l.person ? l.person.name : l.label
  const tip = l.kind === 'phone' ? [l.person ? l.label : l.tip, l.brand].filter(Boolean).join(' · ') : l.kind === 'person' ? l.brand : l.kind === 'deal' ? 'Deal' : l.kind === 'campaign' ? 'Campaign' : l.kind === 'invoice' ? 'Invoice' : l.kind === 'vendor' ? 'Creator' : l.kind === 'signal' ? 'Signal · ' + l.brand : l.kind === 'member' ? 'Colleague' : null
  const body = <><Mark e={l} size={sm ? 13 : 15} /><span className="td-chip-t">{text}</span></>
  const chip = href ? <a className={'td-chip k-' + l.kind} href={href.startsWith('tel:') ? href : '#' + href} onClick={(e) => e.stopPropagation()}>{body}</a> : <span className={'td-chip k-' + l.kind}>{body}</span>
  return tip ? <Tip label={tip}>{chip}</Tip> : chip
}

/** Links the text already names don't trail again: "Send Rare Rabbit the deck" drops a trailing "Rare Rabbit deal". */
const named = (text, parts) => {
  const lo = text.toLowerCase()
  const inText = new Set(parts.filter((p) => typeof p !== 'string' && p.brand).map((p) => p.brand.toLowerCase()))
  return (l) => !(l.brand && (inText.has(l.brand.toLowerCase()) || lo.includes(l.brand.toLowerCase())))
}
/** Links for a two-line row's second line: one per thing, the text's own first. */
export const contextLinks = (t) => {
  const { parts, trail } = segments(t.text, t.links)
  const all = [...parts.filter((p) => typeof p !== 'string'), ...trail]
  return all.filter((l, i) => all.findIndex((x) => (x.brand && l.brand ? x.brand === l.brand : x.kind === l.kind && x.id === l.id)) === i)
}

/** Item text with its links. look: chips (filled pills) · quiet (logo + text, no repeats) · plain (words only; links live on line two). */
export function TodoText({ t, clamp, look = 'chips' }) {
  const seg = useMemo(() => segments(t.text, t.links), [t.text, t.links])
  const quiet = look === 'quiet'
  if (look === 'plain') return <span className={'td-text' + (clamp ? ' clamp' : '')}>{seg.parts.map((p, i) => <span key={i} className="td-tx">{typeof p === 'string' ? p : p.kind === 'phone' && p.person ? p.person.name : p.label}</span>)}</span>
  const parts = seg.parts
  const trail = quiet ? seg.trail.filter(named(t.text, parts)) : seg.trail
  // A number whose person is already a chip shows as the number.
  const byName = (l) => l.kind === 'phone' && l.person && t.links.some((x) => x.kind === 'person' && x.id === l.person.id) ? { ...l, person: null, tip: l.person.name } : l
  return (
    <span className={'td-text' + (clamp ? ' clamp' : '')}>
      {parts.map((p, i) => (typeof p === 'string' ? <span key={i} className="td-tx" style={{ '--i': i }}>{p}</span> : <LinkChip key={i} l={byName(p)} sm={quiet} />))}
      {quiet && trail.length > 0 && <span className="td-sep" aria-hidden>·</span>}
      {trail.map((l, i) => <LinkChip key={'t' + i} l={byName(l)} sm={quiet} />)}
    </span>
  )
}

/** A date label; "Mon → Fri" draws its arrow from the icon set, not a typed glyph. */
export const Span = ({ label }) => {
  const [a, b] = String(label).split(' → ')
  return b == null ? label : <span className="td-span">{a}<ArrowRight size={11} strokeWidth={2.2} className="td-span-i" aria-label="to" />{b}</span>
}
export const DueChip = ({ t }) => (t.due ? <span className={'td-due b-' + bucketOf({ ...t, done: false })}><Span label={t.start ? spanLabel(t) : dueLabel(t.due)} /></span> : null)

/** The date on a row, as a button: Today, Tomorrow, This weekend, Next week, a picked day, or no date.
    Rows without a date show a quiet "Date" on hover (always on touch). */
const QUICK_DUE = [['Today', () => at(0)], ['Tomorrow', () => at(1)], ['This weekend', () => at((6 - TODAY.getDay() + 7) % 7 || 7)], ['Next week', () => at(((8 - TODAY.getDay()) % 7) || 7)]]
const ymd = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
export function DueButton({ t }) {
  const s = useStore()
  const set = (due, close) => { s.todo.patch(t.id, { due, remind: due }); close?.() }
  if (t.done) return <DueChip t={t} />
  return (
    <Popover align="right" width={220} trigger={({ toggle, open }) => (
      <button className={'td-dueb' + (t.due ? '' : ' empty') + (open ? ' open' : '')} onClick={(e) => { e.stopPropagation(); toggle() }} aria-label={t.due ? 'Change date, ' + dueLabel(t.due) : 'Add a date'}>
        {t.due ? <DueChip t={t} /> : <span className="td-due td-due-add"><CalendarDays size={12} />Date</span>}
      </button>
    )}>
      {(close) => (
        <div className="td-duem" onClick={(e) => e.stopPropagation()}>
          <div className="pop-h">Due</div>
          {QUICK_DUE.map(([l, f]) => { const d = f(); return <button key={l} onClick={() => set(d, close)}><span className="grow">{l}</span><span className="mute xs">{dueLabel(d)}</span></button> })}
          <label className="td-duem-pick"><span className="grow">Pick a day</span><input type="date" defaultValue={t.due ? ymd(t.due) : ''} min={ymd(TODAY)} onChange={(e) => { const [y, mo, d] = e.target.value.split('-').map(Number); if (y) set(new Date(y, mo - 1, d), close) }} /></label>
          <div className="pop-sep" />
          <button onClick={() => { close(); openTodo(t.id) }}><GanttChart size={13} className="mute" /><span className="grow">Start and due…</span></button>
          {t.due && <button onClick={() => { s.todo.patch(t.id, { due: null, start: null, remind: null }); close() }}><span className="grow">No date</span></button>}
        </div>
      )}
    </Popover>
  )
}

/** The tick, choreographed (lead → detail → support, then one gesture):
      0ms     box presses and fills (lead)
      110ms   check mark draws (cause → effect, overlapping the fill)
      150ms   strike draws through the text, text dims (support)
      ~460ms  the item moves: its row slides to its new place in Done while every other row and header slides into
              the gap together with it (FLIP). If Done is closed the row fades out where it was, and the gap closes as it goes.
    Keyboard ticks at once; reduced motion skips the movement. "Going" lives outside React state so every place showing the
    item (panel, Home strip, a record block) plays it, and a row that re-renders mid-way keeps it. */
const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)'
const MOVE_MS = 240
const reducedMotion = () => document.documentElement.dataset.motion === 'reduced' || (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false)
const GOING = new Set()
const ping = () => window.dispatchEvent(new Event('td:going'))
export const isGoing = (id) => GOING.has(id)
/** True while this item is being ticked off; rows add `td-going` with it. */
export function useGoing(id) {
  const [, bump] = useState(0)
  useEffect(() => { const on = () => bump((n) => n + 1); window.addEventListener('td:going', on); return () => window.removeEventListener('td:going', on) }, [])
  return GOING.has(id)
}
const MOVERS = '.td-row[data-id], .td-sec-h, .td-psec-h, .td-none'
const scrollerOf = (el) => { for (let p = el.parentElement; p; p = p.parentElement) { if (/(auto|scroll)/.test(getComputedStyle(p).overflowY)) return p } return document.documentElement }
const keyOf = (el) => (el.dataset.id ? 'r:' + el.dataset.id : 'h:' + el.textContent.replace(/[0-9]+/g, '').trim())
/** Where every row and section header is, per scrolling list (the same item can show in several lists at once). */
function snapshot() {
  const m = new Map()
  document.querySelectorAll(MOVERS).forEach((el) => {
    if (!el.getClientRects().length) return
    const sc = scrollerOf(el)
    if (!m.has(sc)) m.set(sc, new Map())
    m.get(sc).set(keyOf(el), { el, r: el.getBoundingClientRect() })
  })
  return m
}
export function Tick({ t, size }) {
  const s = useStore()
  const going = useGoing(t.id)
  const on = (e) => {
    e.stopPropagation()
    if (GOING.has(t.id)) return
    if (e.detail === 0 || t.done || reducedMotion()) { s.todo.toggle(t.id); return } // keyboard, un-ticking, reduced motion: instant
    GOING.add(t.id); ping()
    setTimeout(() => {
      if (!GOING.has(t.id)) return
      const before = snapshot()
      const ghostsFor = (el) => { const r = el.getBoundingClientRect(); const g = el.cloneNode(true); g.classList.add('td-ghost'); Object.assign(g.style, { position: 'fixed', left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px', margin: '0', zIndex: '60', pointerEvents: 'none' }); document.body.appendChild(g); return g }
      const rowsBefore = [...document.querySelectorAll(`.td-row[data-id="${t.id}"]`)].filter((el) => el.getClientRects().length).map((el) => ({ sc: scrollerOf(el), ghost: ghostsFor(el) }))
      // The item stops taking space now; the list re-renders synchronously so we can measure where everything went.
      flushSync(() => { GOING.delete(t.id); ping(); s.todo.toggle(t.id) })
      const after = snapshot()
      after.forEach((map, sc) => {
        const prev = before.get(sc)
        map.forEach(({ el, r }, k) => {
          const p = prev?.get(k)
          if (!p) { el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 180, easing: 'ease' }); return } // e.g. the Done header appearing
          const dx = p.r.left - r.left, dy = p.r.top - r.top
          if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return
          const mine = k === 'r:' + t.id
          if (mine) { el.style.position = 'relative'; el.style.zIndex = '2' } // the travelling row passes over the others
          el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0, 0)' }], { duration: MOVE_MS, easing: EASE_OUT })
            .finished.then(() => { if (mine) { el.style.position = ''; el.style.zIndex = '' } }, () => {})
        })
      })
      // A row whose list has no Done to land in (Done folded, Home strip, a record block) fades where it was.
      rowsBefore.forEach(({ sc, ghost }) => {
        const landed = after.get(sc)?.has('r:' + t.id)
        if (landed) { ghost.remove(); return }
        ghost.animate([{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(-4px)' }], { duration: 180, easing: EASE_OUT, fill: 'forwards' }).finished.then(() => ghost.remove(), () => ghost.remove())
      })
    }, 460) // a beat to read the strike
  }
  const checked = t.done || going
  return (
    <button className={'td-ck' + (checked ? ' on' : '') + (size === 'lg' ? ' lg' : '')} role="checkbox" aria-checked={checked} aria-label={checked ? 'Mark not done' : 'Mark done'} onClick={on}>
      <svg viewBox="0 0 16 16" aria-hidden><path d="M4 8.4l2.6 2.6L12 5.4" /></svg>
    </button>
  )
}

/** Subtask progress as a tiny ring. */
export function Ring({ n, of, size = 14 }) {
  const r = (size - 3) / 2, c = 2 * Math.PI * r
  return (
    <svg className="td-ring" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} />
      <circle cx={size / 2} cy={size / 2} r={r} className="on" strokeDasharray={c} strokeDashoffset={c * (1 - (of ? n / of : 0))} />
    </svg>
  )
}
const byDueOrder = (a, b) => (a.due ? +a.due : 9e15) - (b.due ? +b.due : 9e15) || (a.order ?? 0) - (b.order ?? 0)

/** Where it came from, only when it isn't simply yours: "Deal step", "Team task", "From Aarav". */
function OriginTag({ t, icon }) {
  const o = originOf(t)
  if (icon && o === 'system') return <Tip label={t.sys || 'System'}><span className="td-orgi" aria-label={t.sys || 'System'}><Cog size={13} /></span></Tip>
  if (icon && o === 'assigned') return <Tip label={'From ' + (userOf(t.by)?.short || 'a teammate')}><span className="td-orgi" aria-label="Given to you"><Inbox size={13} /></span></Tip>
  if (o === 'system') return <span className="td-org"><Cog size={11} />{t.sys || 'System'}</span>
  if (o === 'assigned') return <span className="td-org">From {userOf(t.by)?.short || 'a teammate'}</span>
  return null
}

/** Two-line rows: what it's about, where it came from, how far along. */
function Line2({ t, kids, kd }) {
  const ls = contextLinks(t)
  const o = originText(t)
  if (!ls.length && !o && !kids.length) return null
  const bits = [
    ...ls.map((l, i) => <LinkChip key={'l' + i} l={l} sm />),
    o && <span key="o">{o}</span>,
    kids.length > 0 && <span key="k" className="num">{kd}/{kids.length} done</span>,
  ].filter(Boolean)
  return <div className="td-l2">{bits.flatMap((b, i) => (i ? [<span key={'s' + i} className="td-l2-s" aria-hidden>·</span>, b] : [b]))}</div>
}

/** One to-do. Click opens its detail; double-click edits the text in place (`edit`). `grip`: a drag handle (the List page passes one).
    A to-do with subtasks shows "1/3"; clicking it folds the subtasks open under the row. `crumb`: show the parent of a subtask seen on its own. */
/** Origin as words, for a row's second line. */
const originText = (t) => { const o = originOf(t); return o === 'system' ? t.sys || 'System' : o === 'assigned' ? 'From ' + (userOf(t.by)?.short || 'a teammate') : null }

/** look: chips (the original) · quiet (one calm line) · two (text, then a muted context line) · grouped (quiet, origin shown by the group). */
export function TodoRow({ t, edit, grip, by = true, clamp, actions = true, subs = true, crumb, sel, look = 'chips' }) {
  const s = useStore()
  const going = useGoing(t.id)
  const [ed, setEd] = useState(false)
  const [v, setV] = useState(t.text)
  const [open, setOpen] = useState(false)
  const kids = subs && !t.parent ? s.todo.items.filter((x) => x.parent === t.id) : []
  const kd = kids.filter((x) => x.done).length
  const whos = whosOf(t)
  // Others on it: hidden when it's only you.
  const crew = whos.length === 1 && whos[0] === meId() ? [] : whos.map(userOf).filter(Boolean)
  const parent = crumb && t.parent ? s.todo.items.find((x) => x.id === t.parent) : null
  const save = () => { const x = v.trim(); if (x && x !== t.text) s.todo.patch(t.id, { text: x }); setEd(false) }
  return (
    <>
      <div className={'td-row' + (t.done ? ' done' : '') + (bucketOf(t) === 'overdue' ? ' late' : '') + (going ? ' td-going' : '') + (t.parent ? ' is-sub' : '') + (sel ? ' sel' : '')} data-id={t.id}>
        {grip}
        <Tick t={t} />
        <div className="td-body grow" onClick={(e) => { if (ed || e.detail > 1 || e.target.closest('a,button,input')) return; openTodo(t.id) }}
          onDoubleClick={(e) => { if (edit && !t.done && !e.target.closest('a,button')) { setV(t.text); setEd(true) } }}>
          {ed ? (
            <input className="td-edit" value={v} autoFocus onChange={(e) => setV(e.target.value)} onBlur={save} aria-label="Edit to-do"
              onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); setEd(false) } }} />
          ) : <TodoText t={t} clamp={clamp} look={look === 'two' ? 'plain' : look === 'chips' ? 'chips' : 'quiet'} />}
          {look === 'two' && !ed && <Line2 t={t} kids={kids} kd={kd} />}
          {parent && <span className="td-crumb ell"><CornerDownRight size={11} />{parent.text}</span>}
        </div>
        <span className="td-meta">
          {kids.length > 0 && look !== 'two' && (
            <Tip label={open ? 'Hide subtasks' : 'Show subtasks'}>
              <button className={'td-prog' + (open ? ' open' : '') + (kd === kids.length ? ' all' : '')} onClick={(e) => { e.stopPropagation(); setOpen((o) => !o) }} aria-expanded={open} aria-label={kd + ' of ' + kids.length + ' subtasks done'}>
                <Ring n={kd} of={kids.length} /><span className="num">{kd}/{kids.length}</span>
              </button>
            </Tip>
          )}
          {t.pinned && !t.done && <Pin size={12} className="mute td-pin" />}
          {look === 'chips' && <OriginTag t={t} />}
          {look === 'quiet' && <OriginTag t={t} icon />}
          <DueButton t={t} />
          {by && crew.length > 0 && <Tip label={crew.map((u) => (u.id === meId() ? 'You' : u.short)).join(', ')}><span className="td-by"><AvatarStack users={crew.slice(0, 3)} size={18} ring="var(--surface)" />{crew.length > 3 && <span className="td-by-n num">+{crew.length - 3}</span>}</span></Tip>}
          {actions && deletable(t) && <Tip label="Delete"><button className="b ghost icon sm td-del" onClick={(e) => { e.stopPropagation(); s.todo.remove(t.id) }} aria-label="Delete"><Trash2 size={13} /></button></Tip>}
        </span>
      </div>
      {open && kids.length > 0 && <div className="td-subs">{[...kids].sort(byDueOrder).map((k) => <TodoRow key={k.id} t={k} by={by} actions={actions} subs={false} look={look} />)}</div>}
    </>
  )
}

/* ───────── Smart capture ───────── */
/** "@query" right before the caret, if the @ starts a word. */
function activeMention(text, caret) {
  const before = text.slice(0, caret)
  const i = before.lastIndexOf('@')
  if (i < 0 || (i > 0 && !/\s/.test(before[i - 1]))) return null
  const q = before.slice(i + 1)
  if (q.length > 40 || /\n/.test(q) || /\s{2}/.test(q)) return null
  // "@c:Rare" narrows to one kind: c companies · s signals · p people · m colleagues · d deals · k campaigns · i invoices · v creators.
  const pm = /^([cspmdkiv]):/i.exec(q)
  return pm ? { start: i, q: q.slice(2), kind: SCOPE_KEYS[pm[1].toLowerCase()], pl: 2 } : { start: i, q, kind: null, pl: 0 }
}
const SCOPE_KEYS = { c: 'brand', s: 'signal', p: 'person', m: 'member', d: 'deal', k: 'campaign', i: 'invoice', v: 'vendor' }
const SCOPE_TABS = [['', 'All'], ['brand', 'Companies'], ['signal', 'Signals'], ['person', 'People'], ['member', 'Colleagues'], ['deal', 'Deals'], ['campaign', 'Campaigns'], ['invoice', 'Invoices'], ['vendor', 'Creators']]
const scopeLetter = (k) => Object.keys(SCOPE_KEYS).find((x) => SCOPE_KEYS[x] === k)
/** Hide link labels and numbers from the date reader ("Sun Pharma" is not a Sunday). */
const mask = (v, labels) => {
  let out = v
  for (const l of labels) {
    const lo = out.toLowerCase(), n = l.toLowerCase()
    let p = lo.indexOf(n)
    while (n && p !== -1) { out = out.slice(0, p) + '·'.repeat(n.length) + out.slice(p + n.length); p = out.toLowerCase().indexOf(n, p + n.length) }
  }
  return out
}
const sameLink = (a, b) => a.kind === b.kind && a.id === b.id

/** One composer for every surface. @ links what we hold, a phone number becomes a chip, "tomorrow 5pm" becomes the due date. Enter adds. */
export function Composer({ pre = [], assign = null, autoFocus, placeholder = 'Add a to-do', up, onAdded, onEscape, extra, className = '', bare }) {
  const s = useStore()
  const idx = indexOf(s)
  const [text, setText] = useState('')
  const [links, setLinks] = useState([])
  const preKey = pre.map((l) => l.kind + l.id).join()
  const [prel, setPrel] = useState(pre)
  useEffect(() => { setPrel(pre) }, [preKey]) // eslint-disable-line react-hooks/exhaustive-deps
  const assignKey = asList(assign).join()
  const [who, setWho] = useState(() => asList(assign))
  useEffect(() => { setWho(asList(assign)) }, [assignKey]) // eslint-disable-line react-hooks/exhaustive-deps
  const addWho = (id) => setWho((w) => (w.includes(id) ? w : [...w, id]))
  const [skipPh, setSkipPh] = useState([])
  const [skipDate, setSkipDate] = useState(null)
  const [caret, setCaret] = useState(0)
  const [closed, setClosed] = useState(-1)
  const [hi, setHi] = useState(0)
  const [tab, setTab] = useState('') // the kind chosen on the picker's strip; '' = everything
  const inp = useRef()
  const root = useRef(null)
  const want = useRef(null)
  useLayoutEffect(() => { if (want.current != null && inp.current) { inp.current.setSelectionRange(want.current, want.current); want.current = null } })
  useEffect(() => { if (autoFocus) setTimeout(() => inp.current?.focus({ preventScroll: true }), 40) }, [autoFocus])

  const m = activeMention(text, caret)
  const kind = m?.kind || tab || null
  const results = m && m.start !== closed ? search(idx, m.q, kind) : []
  const has = results.length > 0
  const pickOn = !!m && m.start !== closed && (has || !!kind)
  useEffect(() => { if (!m) setTab('') }, [!!m]) // eslint-disable-line react-hooks/exhaustive-deps
  // A press anywhere outside the composer closes the @ list; clicking back into the input opens it again.
  useEffect(() => {
    if (!pickOn) return
    const out = (e) => { if (!root.current?.contains(e.target)) setClosed(m.start) }
    document.addEventListener('pointerdown', out, true)
    return () => document.removeEventListener('pointerdown', out, true)
  }, [pickOn, m?.start])
  const present = links.filter((l) => text.toLowerCase().includes(l.label.toLowerCase()))
  const phones = findPhones(text).filter((p) => !skipPh.includes(p.digits)).map((p) => ({ ...p, link: phoneLink(p, idx) }))
  const masked = mask(text, [...present.map((l) => l.label), ...phones.map((p) => p.raw)])
  let date = parseRange(masked) || parseDate(masked)
  if (date && date.key === skipDate) date = null

  const change = (e) => {
    let v = e.target.value
    let c = e.target.selectionStart ?? v.length
    const mm = activeMention(v, c)
    const hit = mm && settled(idx, mm.q, mm.kind || tab || null)
    if (hit) {
      v = v.slice(0, mm.start) + hit.label + v.slice(mm.start + 1 + mm.pl + hit.label.length)
      c -= 1; want.current = c
      setLinks((l) => (l.some((x) => sameLink(x, hit)) ? l : [...l, linkOf(hit)]))
      if (hit.kind === 'member') addWho(hit.id) // a colleague is tagged and given the to-do
    }
    setText(v); setCaret(c); setHi(0)
    if (closed >= 0 && (!mm || mm.start !== closed)) setClosed(-1)
  }
  const pick = (e) => {
    if (e.kind === 'member') addWho(e.id)
    const v = text.slice(0, m.start) + e.label + ' ' + text.slice(caret)
    const c = m.start + e.label.length + 1
    setText(v); setCaret(c); want.current = c; setHi(0)
    setLinks((l) => (l.some((x) => sameLink(x, e)) ? l : [...l, linkOf(e)]))
    inp.current?.focus()
  }
  const submit = () => {
    let v = text
    let ls = [...links]
    let w = who
    if (m) {
      const e = exact(idx, m.q, kind)
      if (e) { v = v.slice(0, m.start) + e.label + v.slice(m.start + 1 + m.pl + m.q.length); ls.push(linkOf(e)) }
    }
    ls = ls.filter((l) => v.toLowerCase().includes(l.label.toLowerCase()))
    // Tagged colleagues get the to-do too, so it shows on their side as well as on yours.
    for (const l of ls) if (l.kind === 'member' && !w.includes(l.id)) w = [...w, l.id]
    const ph = findPhones(v).filter((p) => !skipPh.includes(p.digits))
    const phl = ph.map((p) => phoneLink(p, idx))
    for (const p of [...ph].sort((a, b) => b.start - a.start)) v = v.slice(0, p.start) + phoneLink(p, idx).label + v.slice(p.end)
    const mv = mask(v, [...ls.map((l) => l.label), ...phl.map((l) => l.label)])
    let d = parseRange(mv) || parseDate(mv)
    if (d && d.key === skipDate) d = null
    if (d) v = cut(v, d.spans)
    v = v.replace(/\s{2,}/g, ' ').trim()
    if (!v) return
    const all = [...prel, ...ls, ...phl].filter((l, i, a) => a.findIndex((x) => sameLink(x, l)) === i)
    const t = s.todo.add({ text: v[0].toUpperCase() + v.slice(1), links: all, due: d?.date || null, start: d?.start || null, by: meId(), who: w.length ? w : [meId()], ...(extra ? extra() : null) })
    setText(''); setLinks([]); setSkipPh([]); setSkipDate(null); setCaret(0); setClosed(-1); setWho(asList(assign))
    onAdded?.(t)
  }
  const key = (e) => {
    if (pickOn && has && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) { e.preventDefault(); setHi((h) => (h + (e.key === 'ArrowDown' ? 1 : -1) + results.length) % results.length); return }
    if (pickOn && has && (e.key === 'Enter' || e.key === 'Tab')) { e.preventDefault(); pick(results[Math.min(hi, results.length - 1)]); return }
    if (e.key === 'Enter') { e.preventDefault(); submit(); return }
    if (e.key === 'Escape') { if (m && m.start !== closed && pickOn) { e.preventDefault(); e.stopPropagation(); setClosed(m.start) } else onEscape?.(e) }
  }
  const sync = (e) => setCaret(e.target.selectionStart ?? 0)

  let gi = -1
  const picker = pickOn && (
    <div className="td-pick" role="listbox" aria-label="Link to">
      <div className="td-pick-tabs" role="tablist" aria-label="Kind">
        {SCOPE_TABS.map(([k, l]) => (
          <button key={k} type="button" role="tab" aria-selected={(kind || '') === k} className={'td-pick-tab' + ((kind || '') === k ? ' on' : '')} title={k ? 'Type @' + scopeLetter(k) + ': to jump here' : undefined}
            onMouseDown={(e) => e.preventDefault()} onClick={() => { setTab(k); setHi(0); inp.current?.focus() }}>{l}</button>
        ))}
      </div>
      {!has && <div className="td-pick-none mute xs">No match</div>}
      {KIND_ORDER.map((k) => {
        const rows = results.filter((r) => r.kind === k)
        if (!rows.length) return null
        return (
          <div key={k} className="td-pick-g">
            <div className="td-pick-h">{KIND_LABEL[k]}</div>
            {rows.map((r) => {
              gi += 1
              const i = gi
              return (
                <button key={r.kind + r.id} type="button" role="option" aria-selected={i === hi} className={'td-opt' + (i === hi ? ' on' : '')}
                  onMouseDown={(e) => e.preventDefault()} onMouseEnter={() => setHi(i)} onClick={() => pick(r)}>
                  <Mark e={r} size={20} />
                  <span className="td-opt-l ell">{r.label}</span>
                  <span className="td-opt-s ell">{r.sub}</span>
                </button>
              )
            })}
          </div>
        )
      })}
    </div>
  )
  const chips = [
    ...prel.map((l) => ({ k: 'p' + l.kind + l.id, e: l, label: l.label, drop: () => setPrel((x) => x.filter((y) => !sameLink(y, l))) })),
    ...present.filter((l) => !prel.some((p) => sameLink(p, l))).map((l) => ({ k: 'm' + l.kind + l.id, e: l, label: l.label, sub: l.kind === 'member' ? 'Assignee' : undefined, drop: () => { setLinks((x) => x.filter((y) => !sameLink(y, l))); if (l.kind === 'member') setWho((w) => w.filter((x) => x !== l.id)) } })),
    ...phones.map((p) => ({ k: 'ph' + p.digits, e: p.link, label: p.link.label, sub: p.link.person ? p.link.person.name + (p.link.brand ? ' · ' + p.link.brand : '') : 'Not on file', drop: () => setSkipPh((x) => [...x, p.digits]) })),
    date && { k: 'due', due: true, label: date.label, drop: () => setSkipDate(date.key) },
    ...who.map(userOf).filter(Boolean).filter((u) => !(who.length === 1 && u.id === meId())).filter((u) => !present.some((l) => l.kind === 'member' && l.id === u.id)).map((u) => ({ k: 'who' + u.id, e: { kind: 'member', label: u.name, hue: u.hue }, label: u.id === meId() ? 'You' : u.short, sub: 'Assignee', drop: () => setWho((w) => w.filter((x) => x !== u.id)) })),
  ].filter(Boolean)
  return (
    <div ref={root} className={'td-comp' + (up ? ' up' : '') + (pickOn ? ' picking' : '') + (bare ? ' bare' : '') + ' ' + className}>
      {up && picker}
      <div className="td-comp-r">
        <Plus size={16} className="td-comp-i" />
        <input ref={inp} className="td-in" value={text} onChange={change} onKeyDown={key} onKeyUp={sync} onClick={(e) => { sync(e); setClosed(-1) }} placeholder={placeholder} aria-label="Add a to-do"
          enterKeyHint="done" autoComplete="off" spellCheck={false} role="combobox" aria-expanded={pickOn} aria-autocomplete="list" />
        <Tip label="Tag a company, signal, person or colleague"><button type="button" className="b ghost icon sm td-at" onMouseDown={(e) => e.preventDefault()} onClick={() => { const v = text + (text && !/\s$/.test(text) ? ' @' : '@'); setText(v); setCaret(v.length); want.current = v.length; inp.current?.focus() }} aria-label="Link"><AtSign size={15} /></button></Tip>
        <Tip label="Add" kbd="↵"><button type="button" className="b ink icon sm td-go" onMouseDown={(e) => e.preventDefault()} onClick={submit} disabled={!text.trim()} aria-label="Add"><ArrowUp size={14} /></button></Tip>
      </div>
      {chips.length > 0 && (
        <div className="td-comp-c">
          {chips.map((c) => (
            <span key={c.k} className={'td-cchip' + (c.due ? ' due' : '')}>
              {c.due ? <CalendarDays size={13} className="td-ico" /> : <Mark e={c.e} size={15} />}
              <span className="ell">{c.due ? <Span label={c.label} /> : c.label}</span>
              {c.sub && <span className="td-cchip-s ell">{c.sub}</span>}
              <button type="button" className="td-cchip-x" onMouseDown={(e) => e.preventDefault()} onClick={c.drop} aria-label={'Remove ' + c.label}><X size={12} /></button>
            </span>
          ))}
        </div>
      )}
      {!up && picker}
    </div>
  )
}

/* ───────── A record's to-dos (deal, company, campaign pages) ───────── */
export function TodoBlock({ ctx, className = '' }) {
  const s = useStore()
  const [done, setDone] = useState(false)
  if (!ctx) return null
  const mineOf = s.todo.items.filter((t) => top(t) && linkedTo(t, ctx))
  const open = mineOf.filter((t) => !t.done).sort((a, b) => (a.due ? +a.due : 9e15) - (b.due ? +b.due : 9e15))
  const fin = mineOf.filter((t) => t.done)
  return (
    <section className={'td-blk ' + className}>
      <div className="td-blk-h">
        <ListChecks size={14} className="mute" /><span>To-do</span>{open.length > 0 && <span className="mute num">{open.length}</span>}
        <span className="grow" />
        <Tip label={'Add a to-do for ' + ctx.label} kbd="T"><button className="b sm td-blk-add" onClick={() => openTodoAdd(ctx.links)}><Plus size={13} />Add</button></Tip>
      </div>
      <div className="td-rows">
        {open.map((t) => <TodoRow key={t.id} t={t} edit actions={false} />)}
        {done && fin.map((t) => <TodoRow key={t.id} t={t} actions={false} />)}
      </div>
      {!open.length && !done && <div className="td-none mute xs">None open</div>}
      {fin.length > 0 && <button className="td-more" onClick={() => setDone((x) => !x)}>{done ? 'Hide done' : 'Done ' + fin.length}</button>}
    </section>
  )
}

/* ───────── Top bar ───────── */
export const openMine = (items) => items.filter((t) => !t.done && mine(t))
export const dueMine = (items) => openMine(items).filter((t) => t.due && dayDiff(t.due) <= 0).sort((a, b) => a.due - b.due)
export function TodoButton({ path }) {
  const s = useStore()
  const n = openMine(s.todo.items).length
  const on = path === '/todo'
  return (
    <Tip label={'To-do' + (n ? ' · ' + n + ' open' : '')} kbd="T">
      <button className={'b ghost td-tb' + (on ? ' on' : '')} onClick={openTodos} aria-label="To-do">
        <ListChecks size={16} />{n > 0 && <span className="td-tb-n num">{n}</span>}
      </button>
    </Tip>
  )
}

/** Bell rows: what's due today or overdue. */
export function TodoBellRows({ close }) {
  const s = useStore()
  const due = dueMine(s.todo.items)
  if (!due.length) return null
  return (
    <>
      <div className="pop-h">To-do <span className="num">{due.length}</span></div>
      {due.slice(0, 5).map((t) => {
        const l = t.links[0]
        return (
          <button key={t.id} className="sl-nrow new td-nrow" onClick={() => { close(); const h = l && l.kind !== 'phone' ? hrefOf(l) : null; if (h) go(h); else openTodos() }}>
            <span className="sl-ni"><ListChecks size={13} /></span>
            <span className="grow" style={{ minWidth: 0 }}><span className="ell" style={{ display: 'block', fontWeight: 500 }}>{t.text}</span><span className={'xs ell td-due b-' + bucketOf(t)} style={{ display: 'block' }}>{dueLabel(t.due)}{l?.brand ? ' · ' + l.brand : ''}</span></span>
          </button>
        )
      })}
      <div className="pop-sep" />
    </>
  )
}
