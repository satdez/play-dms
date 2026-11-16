// To-do pieces every variation shares: link chips, the tick, a row, the smart composer, the record block, the top-bar button.
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Check, Phone, Megaphone, Receipt, X, ArrowUp, CalendarDays, ListChecks, Plus, Trash2, Pin, Shapes, AtSign } from 'lucide-react'
import { useStore } from '../store'
import { Tip } from '../../shared/motion'
import { Avatar } from '../../shared/ui'
import { BrandLogo } from '../../shared/brands'
import { Popover, go } from '../ui'
import { team } from '../data'
import {
  indexOf, search, settled, exact, linkOf, phoneLink, findPhones, parseDate, cut, hrefOf, segments, dueLabel, bucketOf, meId, mine,
  KIND_LABEL, linkedTo, dayDiff,
} from './logic'
import { openTodoAdd, openTodos, setTodoPref, todoStyle, TODO_STYLES } from './state'

const userOf = (id) => team.find((u) => u.id === id)
const KIND_ICON = { campaign: Megaphone, invoice: Receipt, phone: Phone }

/** The picture for a link or index entry: a real logo for companies, an avatar for people, an icon otherwise. */
function Mark({ e, size = 16 }) {
  if (e.kind === 'person') return <Avatar user={{ name: e.label, hue: e.hue ?? (e.label.length * 37) % 360 }} size={size} />
  if (e.kind === 'phone') return <Phone size={size - 3} className="td-ico" />
  const logo = e.logo || (e.kind === 'brand' || e.kind === 'deal' ? e.brand || e.label : e.kind === 'campaign' ? e.brand : null)
  if (logo) return <BrandLogo name={logo} size={size} radius={4} />
  const I = KIND_ICON[e.kind] || Shapes
  return <I size={size - 3} className="td-ico" />
}

/** A link inside item text. Companies, people, deals and campaigns open their page; a phone number dials. */
export function LinkChip({ l }) {
  const href = l.kind === 'phone' ? 'tel:' + l.label.replace(/\s/g, '') : hrefOf(l)
  const text = l.kind === 'phone' && l.person ? l.person.name : l.label
  const tip = l.kind === 'phone' ? [l.person ? l.label : l.tip, l.brand].filter(Boolean).join(' · ') : l.kind === 'person' ? l.brand : l.kind === 'deal' ? 'Deal' : l.kind === 'campaign' ? 'Campaign' : l.kind === 'invoice' ? 'Invoice' : null
  const body = <><Mark e={l} size={15} /><span className="td-chip-t">{text}</span></>
  const chip = href ? <a className={'td-chip k-' + l.kind} href={href.startsWith('tel:') ? href : '#' + href} onClick={(e) => e.stopPropagation()}>{body}</a> : <span className={'td-chip k-' + l.kind}>{body}</span>
  return tip ? <Tip label={tip}>{chip}</Tip> : chip
}

/** Item text with its links as chips, in place. */
export function TodoText({ t, clamp }) {
  const { parts, trail } = useMemo(() => segments(t.text, t.links), [t.text, t.links])
  // A number whose person is already a chip shows as the number.
  const named = (l) => l.kind === 'phone' && l.person && t.links.some((x) => x.kind === 'person' && x.id === l.person.id) ? { ...l, person: null, tip: l.person.name } : l
  return (
    <span className={'td-text' + (clamp ? ' clamp' : '')}>
      {parts.map((p, i) => (typeof p === 'string' ? <span key={i}>{p}</span> : <LinkChip key={i} l={named(p)} />))}
      {trail.map((l, i) => <LinkChip key={'t' + i} l={named(l)} />)}
    </span>
  )
}

export const DueChip = ({ t }) => (t.due ? <span className={'td-due b-' + bucketOf({ ...t, done: false })}>{dueLabel(t.due)}</span> : null)

/** The tick. A click plays it, then the item moves; the keyboard ticks at once. */
export function Tick({ t, size }) {
  const s = useStore()
  const [pop, setPop] = useState(false)
  const timer = useRef()
  useEffect(() => () => clearTimeout(timer.current), [])
  const on = (e) => {
    e.stopPropagation()
    if (e.detail === 0 || t.done || document.documentElement.dataset.motion === 'reduced') { s.todo.toggle(t.id); return }
    setPop(true)
    timer.current = setTimeout(() => { setPop(false); s.todo.toggle(t.id) }, 260)
  }
  const checked = t.done || pop
  return (
    <button className={'td-ck' + (checked ? ' on' : '') + (pop ? ' pop' : '') + (size === 'lg' ? ' lg' : '')} role="checkbox" aria-checked={checked} aria-label={checked ? 'Mark not done' : 'Mark done'} onClick={on}>
      <svg viewBox="0 0 16 16" aria-hidden><path d="M4 8.4l2.6 2.6L12 5.4" /></svg>
    </button>
  )
}

/** One to-do. `edit`: click the text to edit it in place. `grip`: a drag handle (the List page passes one). */
export function TodoRow({ t, edit, grip, by = true, clamp, actions = true }) {
  const s = useStore()
  const [ed, setEd] = useState(false)
  const [v, setV] = useState(t.text)
  const who = t.by !== meId() && userOf(t.by)
  const save = () => { const x = v.trim(); if (x && x !== t.text) s.todo.patch(t.id, { text: x }); setEd(false) }
  return (
    <div className={'td-row' + (t.done ? ' done' : '') + (bucketOf(t) === 'overdue' ? ' late' : '')} data-id={t.id}>
      {grip}
      <Tick t={t} />
      <div className="td-body grow" onClick={(e) => { if (edit && !ed && !t.done && !e.target.closest('a,button')) { setV(t.text); setEd(true) } }}>
        {ed ? (
          <input className="td-edit" value={v} autoFocus onChange={(e) => setV(e.target.value)} onBlur={save} aria-label="Edit to-do"
            onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); setEd(false) } }} />
        ) : <TodoText t={t} clamp={clamp} />}
      </div>
      <span className="td-meta">
        {t.pinned && !t.done && <Pin size={12} className="mute td-pin" />}
        <DueChip t={t} />
        {by && who && <Tip label={who.name}><span className="td-by"><Avatar user={who} size={18} /></span></Tip>}
        {actions && <Tip label="Delete"><button className="b ghost icon sm td-del" onClick={(e) => { e.stopPropagation(); s.todo.remove(t.id) }} aria-label="Delete"><Trash2 size={13} /></button></Tip>}
      </span>
    </div>
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
  return { start: i, q }
}
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
export function Composer({ pre = [], autoFocus, placeholder = 'Add a to-do', up, onAdded, onEscape, extra, className = '' }) {
  const s = useStore()
  const idx = indexOf(s)
  const [text, setText] = useState('')
  const [links, setLinks] = useState([])
  const preKey = pre.map((l) => l.kind + l.id).join()
  const [prel, setPrel] = useState(pre)
  useEffect(() => { setPrel(pre) }, [preKey]) // eslint-disable-line react-hooks/exhaustive-deps
  const [skipPh, setSkipPh] = useState([])
  const [skipDate, setSkipDate] = useState(null)
  const [caret, setCaret] = useState(0)
  const [closed, setClosed] = useState(-1)
  const [hi, setHi] = useState(0)
  const inp = useRef()
  const want = useRef(null)
  useLayoutEffect(() => { if (want.current != null && inp.current) { inp.current.setSelectionRange(want.current, want.current); want.current = null } })
  useEffect(() => { if (autoFocus) setTimeout(() => inp.current?.focus({ preventScroll: true }), 40) }, [autoFocus])

  const m = activeMention(text, caret)
  const results = m && m.start !== closed ? search(idx, m.q) : []
  const pickOn = results.length > 0
  const present = links.filter((l) => text.toLowerCase().includes(l.label.toLowerCase()))
  const phones = findPhones(text).filter((p) => !skipPh.includes(p.digits)).map((p) => ({ ...p, link: phoneLink(p, idx) }))
  let date = parseDate(mask(text, [...present.map((l) => l.label), ...phones.map((p) => p.raw)]))
  if (date && date.key === skipDate) date = null

  const change = (e) => {
    let v = e.target.value
    let c = e.target.selectionStart ?? v.length
    const mm = activeMention(v, c)
    const hit = mm && settled(idx, mm.q)
    if (hit) {
      v = v.slice(0, mm.start) + hit.label + v.slice(mm.start + 1 + hit.label.length)
      c -= 1; want.current = c
      setLinks((l) => (l.some((x) => sameLink(x, hit)) ? l : [...l, linkOf(hit)]))
    }
    setText(v); setCaret(c); setHi(0)
    if (closed >= 0 && (!mm || mm.start !== closed)) setClosed(-1)
  }
  const pick = (e) => {
    const v = text.slice(0, m.start) + e.label + ' ' + text.slice(caret)
    const c = m.start + e.label.length + 1
    setText(v); setCaret(c); want.current = c; setHi(0)
    setLinks((l) => (l.some((x) => sameLink(x, e)) ? l : [...l, linkOf(e)]))
    inp.current?.focus()
  }
  const submit = () => {
    let v = text
    let ls = [...links]
    if (m) { const e = exact(idx, m.q); if (e) { v = v.slice(0, m.start) + e.label + v.slice(m.start + 1 + m.q.length); ls.push(linkOf(e)) } }
    ls = ls.filter((l) => v.toLowerCase().includes(l.label.toLowerCase()))
    const ph = findPhones(v).filter((p) => !skipPh.includes(p.digits))
    const phl = ph.map((p) => phoneLink(p, idx))
    for (const p of [...ph].sort((a, b) => b.start - a.start)) v = v.slice(0, p.start) + phoneLink(p, idx).label + v.slice(p.end)
    let d = parseDate(mask(v, [...ls.map((l) => l.label), ...phl.map((l) => l.label)]))
    if (d && d.key === skipDate) d = null
    if (d) v = cut(v, d.spans)
    v = v.replace(/\s{2,}/g, ' ').trim()
    if (!v) return
    const all = [...prel, ...ls, ...phl].filter((l, i, a) => a.findIndex((x) => sameLink(x, l)) === i)
    const t = s.todo.add({ text: v[0].toUpperCase() + v.slice(1), links: all, due: d?.date || null, by: meId(), ...(extra ? extra() : null) })
    setText(''); setLinks([]); setSkipPh([]); setSkipDate(null); setCaret(0); setClosed(-1)
    onAdded?.(t)
  }
  const key = (e) => {
    if (pickOn && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) { e.preventDefault(); setHi((h) => (h + (e.key === 'ArrowDown' ? 1 : -1) + results.length) % results.length); return }
    if (pickOn && (e.key === 'Enter' || e.key === 'Tab')) { e.preventDefault(); pick(results[Math.min(hi, results.length - 1)]); return }
    if (e.key === 'Enter') { e.preventDefault(); submit(); return }
    if (e.key === 'Escape') { if (m && m.start !== closed && results.length) { e.preventDefault(); e.stopPropagation(); setClosed(m.start) } else onEscape?.(e) }
  }
  const sync = (e) => setCaret(e.target.selectionStart ?? 0)

  let gi = -1
  const picker = pickOn && (
    <div className="td-pick" role="listbox" aria-label="Link to">
      {['brand', 'person', 'deal', 'campaign', 'invoice'].map((k) => {
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
    ...present.filter((l) => !prel.some((p) => sameLink(p, l))).map((l) => ({ k: 'm' + l.kind + l.id, e: l, label: l.label, drop: () => setLinks((x) => x.filter((y) => !sameLink(y, l))) })),
    ...phones.map((p) => ({ k: 'ph' + p.digits, e: p.link, label: p.link.label, sub: p.link.person ? p.link.person.name + (p.link.brand ? ' · ' + p.link.brand : '') : 'Not on file', drop: () => setSkipPh((x) => [...x, p.digits]) })),
    date && { k: 'due', due: true, label: date.label, drop: () => setSkipDate(date.key) },
  ].filter(Boolean)
  return (
    <div className={'td-comp' + (up ? ' up' : '') + (pickOn ? ' picking' : '') + ' ' + className}>
      {up && picker}
      <div className="td-comp-r">
        <Plus size={16} className="td-comp-i" />
        <input ref={inp} className="td-in" value={text} onChange={change} onKeyDown={key} onKeyUp={sync} onClick={sync} placeholder={placeholder} aria-label="Add a to-do"
          enterKeyHint="done" autoComplete="off" spellCheck={false} role="combobox" aria-expanded={pickOn} aria-autocomplete="list" />
        <Tip label="Link a company, person, deal or campaign"><button type="button" className="b ghost icon sm td-at" onMouseDown={(e) => e.preventDefault()} onClick={() => { const v = text + (text && !/\s$/.test(text) ? ' @' : '@'); setText(v); setCaret(v.length); want.current = v.length; inp.current?.focus() }} aria-label="Link"><AtSign size={15} /></button></Tip>
        <Tip label="Add" kbd="↵"><button type="button" className="b ink icon sm td-go" onMouseDown={(e) => e.preventDefault()} onClick={submit} disabled={!text.trim()} aria-label="Add"><ArrowUp size={14} /></button></Tip>
      </div>
      {chips.length > 0 && (
        <div className="td-comp-c">
          {chips.map((c) => (
            <span key={c.k} className={'td-cchip' + (c.due ? ' due' : '')}>
              {c.due ? <CalendarDays size={13} className="td-ico" /> : <Mark e={c.e} size={15} />}
              <span className="ell">{c.label}</span>
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
  const mineOf = s.todo.items.filter((t) => linkedTo(t, ctx))
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

/** Switch variation from where you are (writes the same preference as Settings). */
export function StyleMenu() {
  const cur = todoStyle()
  return (
    <Popover width={290} trigger={({ toggle }) => (
      <Tip label="To-do style"><button className="b sm ghost td-style" onClick={toggle}><Shapes size={14} /><span className="m-hide">{TODO_STYLES.find((x) => x.value === cur)?.label}</span></button></Tip>
    )}>
      {(close) => (
        <>
          <div className="pop-h">To-do style</div>
          {TODO_STYLES.map((x) => (
            <button key={x.value} className="td-sopt" onClick={() => { close(); setTodoPref('todo', x.value) }}>
              <span className="grow"><b>{x.label}</b><span className="mute xs td-sopt-d">{x.desc}</span></span>
              {cur === x.value && <Check size={14} />}
            </button>
          ))}
        </>
      )}
    </Popover>
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
