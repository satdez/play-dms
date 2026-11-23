// #/todo — the List style's page. Two views of the same to-dos: List (grouped by date, company or assignee) and Timeline (start → due bars).
import { useEffect, useRef, useState } from 'react'
import { ChevronDown, GripVertical, X, Link2, User, AlarmClock, Check, Rows3, GanttChart, ArrowLeft, ArrowRight } from 'lucide-react'
import { useStore } from '../store'
import { Tip } from '../../shared/motion'
import { Avatar, AvatarStack } from '../../shared/ui'
import { BrandLogo } from '../../shared/brands'
import { Popover, Seg } from '../ui'
import { TODAY, fmt } from '../data'
import { bucketOf, mine, brandOfItem, top, whosOf, meId, dayDiff, at, spanLabel } from './logic'
import { todoStyle, openTodos, openTodo } from './state'
import { Composer, TodoRow, StyleMenu, Tick, TodoText, userOf, Span } from './ui'

export function TodoPage() {
  const style = todoStyle()
  // No page in Panel: land on Home and open the panel instead.
  useEffect(() => { if (style !== 'list') { location.replace('#/hub'); setTimeout(openTodos, 0) } }, [style])
  if (style === 'list') return <ListPage />
  return null
}

const byOrder = (a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || (a.order ?? 0) - (b.order ?? 0)
const byDue = (a, b) => (a.due ? +a.due : 9e15) - (b.due ? +b.due : 9e15) || (a.order ?? 0) - (b.order ?? 0)
const SECTIONS = [['today', 'Today'], ['upcoming', 'Upcoming'], ['someday', 'Someday']]
const GROUP_BY = [{ value: 'date', label: 'Date' }, { value: 'company', label: 'Company' }, { value: 'who', label: 'Assignee' }]

function useLocal(key, init) {
  const [v, set] = useState(() => { try { return JSON.parse(localStorage.getItem(key)) ?? init } catch { return init } })
  return [v, (x) => { set(x); try { localStorage.setItem(key, JSON.stringify(x)) } catch {} }]
}

/** Groups of open, top-level to-dos: { key, label, icon, list, reorder } */
function groupsOf(open, by) {
  if (by === 'date') return SECTIONS.map(([k, label]) => ({ key: k, label, reorder: true, list: open.filter((t) => (k === 'today' ? ['overdue', 'today'].includes(bucketOf(t)) : bucketOf(t) === k)).sort(byOrder) }))
  const m = new Map()
  for (const t of open) {
    // By assignee, a shared to-do shows under each person on it.
    const ks = by === 'company' ? [brandOfItem(t) || ''] : whosOf(t).length ? whosOf(t) : ['']
    for (const k of ks) { if (!m.has(k)) m.set(k, []); m.get(k).push(t) }
  }
  const out = [...m.entries()].map(([k, list]) => {
    if (by === 'company') return { key: 'c:' + k, label: k || 'No company', icon: k ? <BrandLogo name={k} size={16} radius={4} /> : null, list: list.sort(byDue), n: k ? 0 : 1 }
    const u = userOf(k)
    return { key: 'u:' + k, label: k === meId() ? 'You' : u?.name || 'Nobody', icon: u ? <Avatar user={u} size={16} /> : null, list: list.sort(byDue), n: k === meId() ? -1 : 0 }
  })
  return out.sort((a, b) => a.n - b.n || b.list.length - a.list.length || a.label.localeCompare(b.label))
}

/** Drag within a section by the grip. Pointer events, so touch works; the row follows the finger, a line marks the drop. */
function useReorder(onDrop) {
  const d = useRef(null)
  const [line, setLine] = useState(null) // { sec, top }
  const down = (e, id, sec, ids) => {
    if (e.button > 0) return
    const row = e.currentTarget.closest('.td-row')
    const box = row.parentElement
    const rows = [...box.children].filter((x) => x.classList.contains('td-row') && !x.classList.contains('is-sub'))
    d.current = { id, sec, ids, row, box, rects: rows.map((r) => r.getBoundingClientRect()), i0: rows.indexOf(row), y0: e.clientY, to: rows.indexOf(row) }
    e.currentTarget.setPointerCapture?.(e.pointerId)
    row.classList.add('td-lift')
    e.preventDefault()
  }
  const move = (e) => {
    const x = d.current
    if (!x) return
    x.row.style.transform = `translateY(${e.clientY - x.y0}px)`
    let to = 0
    x.rects.forEach((r, i) => { if (i !== x.i0 && e.clientY > r.top + r.height / 2) to++ })
    x.to = to
    const others = x.rects.filter((_, i) => i !== x.i0)
    const y = to === 0 ? (others[0]?.top ?? x.rects[x.i0].top) : others[to - 1].bottom
    setLine({ sec: x.sec, top: y - x.box.getBoundingClientRect().top })
  }
  const up = () => {
    const x = d.current
    if (!x) return
    x.row.style.transform = ''
    x.row.classList.remove('td-lift')
    d.current = null
    setLine(null)
    if (x.to !== x.i0) onDrop(x.id, x.ids, x.to)
  }
  const grip = (id, sec, ids) => (
    <button className="td-grip" aria-label="Drag to reorder" onPointerDown={(e) => down(e, id, sec, ids)} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
      <GripVertical size={14} />
    </button>
  )
  return { grip, line }
}

function ListPage() {
  const s = useStore()
  const [me, setMe] = useState(false)
  const [late, setLate] = useState(false)
  const [link, setLink] = useState(null) // brand name
  const [showDone, setShowDone] = useState(false)
  const [view, setView] = useLocal('wldd-todo-view', 'list')
  const [by, setBy] = useLocal('wldd-todo-group', 'date')
  const [sel, setSel] = useState(null)
  const { grip, line } = useReorder((id, ids, to) => s.todo.move(id, ids, to))
  const all = s.todo.items.filter(top)
  const items = all.filter((t) => (!me || mine(t)) && (!link || t.links.some((l) => l.brand === link)) && (!late || bucketOf(t) === 'overdue'))
  const open = items.filter((t) => !t.done)
  const groups = groupsOf(open, by)
  const done = items.filter((t) => t.done).sort((a, b) => b.doneAt - a.doneAt)
  const brands = {}
  all.forEach((t) => { const b = brandOfItem(t); if (b && !t.done) brands[b] = (brands[b] || 0) + 1 })
  const lateN = all.filter((t) => bucketOf(t) === 'overdue' && (!me || mine(t))).length

  // j / k move, x ticks, Enter opens. Instant (keyboard).
  const order = view === 'list' ? groups.flatMap((g) => g.list.map((t) => t.id)) : []
  const ordRef = useRef(order); ordRef.current = order
  useEffect(() => {
    if (view !== 'list') return
    const k = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.target.closest('input, textarea, [contenteditable], .pop, .sheet, .td-panel')) return
      const ids = ordRef.current
      if (e.key === 'j' || e.key === 'k') {
        e.preventDefault()
        setSel((c) => { const i = ids.indexOf(c); const n = ids[Math.max(0, Math.min(ids.length - 1, i < 0 ? 0 : i + (e.key === 'j' ? 1 : -1)))] ?? null; document.querySelector(`.td-page .td-row[data-id="${n}"]`)?.scrollIntoView({ block: 'nearest' }); return n })
      }
      if (e.key === 'x' && sel) { e.preventDefault(); s.todo.toggle(sel) }
      if (e.key === 'Enter' && sel) { e.preventDefault(); openTodo(sel) }
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [view, sel, s.todo])

  return (
    <div className={'d-page td-page' + (view === 'timeline' ? ' wide' : '')}>
      <div className="td-bar">
        <span className="td-vseg"><Seg id="td-view" value={view} onChange={setView} options={[{ value: 'list', label: <><Rows3 size={13} />List</> }, { value: 'timeline', label: <><GanttChart size={13} />Timeline</> }]} /></span>
        <span className="td-bar-sep" />
        <button className={'b sm td-f' + (me ? ' on' : '')} aria-pressed={me} onClick={() => setMe((x) => !x)}><User size={13} />Mine</button>
        {link ? (
          <button className="b sm td-f on" onClick={() => setLink(null)}><BrandLogo name={link} size={14} radius={3} />{link}<X size={12} className="mute" /></button>
        ) : (
          <Popover align="left" width={240} trigger={({ toggle }) => <button className="b sm td-f" onClick={toggle}><Link2 size={13} />Linked to…</button>}>
            {(close) => Object.entries(brands).sort((a, b) => b[1] - a[1]).map(([b, n]) => (
              <button key={b} onClick={() => { setLink(b); close() }}><BrandLogo name={b} size={16} radius={4} />{b}<span className="mute num" style={{ marginLeft: 'auto' }}>{n}</span></button>
            ))}
          </Popover>
        )}
        <button className={'b sm td-f' + (late ? ' on' : '')} aria-pressed={late} onClick={() => setLate((x) => !x)}><AlarmClock size={13} />Overdue{lateN > 0 && <span className="num td-f-n">{lateN}</span>}</button>
        <span className="grow" />
        <Popover width={200} trigger={({ toggle }) => <Tip label="Group by"><button className="b sm ghost" onClick={toggle}><span className="mute">Group</span>{GROUP_BY.find((x) => x.value === by)?.label}<ChevronDown size={13} className="mute" /></button></Tip>}>
          {(close) => GROUP_BY.map((x) => <button key={x.value} onClick={() => { setBy(x.value); close() }}><span className="grow">{x.label}</span>{by === x.value && <Check size={14} />}</button>)}
        </Popover>
        <StyleMenu />
      </div>
      <Composer className="td-top" placeholder="Add a to-do · @ links anything or assigns · “from mon to fri” sets a timeline" autoFocus={!window.matchMedia('(pointer: coarse)').matches} />
      {view === 'timeline' ? <Timeline groups={groups} /> : (
        <>
          {groups.map((g) => {
            if (!g.list.length && (g.key !== 'today' || late || link)) return null
            const ids = g.list.map((t) => t.id)
            return (
              <section key={g.key} className="td-sec">
                <div className="group-h td-sec-h">{g.icon}{g.label}<span className="mute num">{g.list.length}</span></div>
                <div className="td-rows">
                  {g.list.map((t) => <TodoRow key={t.id} t={t} edit sel={sel === t.id} by={by !== 'who'} grip={g.reorder ? grip(t.id, g.key, ids) : null} />)}
                  {line?.sec === g.key && <i className="td-drop" style={{ top: line.top }} />}
                </div>
                {!g.list.length && <div className="td-none mute"><Check size={14} />Clear</div>}
              </section>
            )
          })}
          {done.length > 0 && !late && (
            <section className="td-sec">
              <button className="group-h td-sec-h td-fold" onClick={() => setShowDone((x) => !x)} aria-expanded={showDone}>Done<span className="mute num">{done.length}</span><ChevronDown size={14} className={'mute td-chev' + (showDone ? ' on' : '')} /></button>
              {showDone && <div className="td-rows">{done.map((t) => <TodoRow key={t.id} t={t} />)}</div>}
            </section>
          )}
        </>
      )}
    </div>
  )
}

/* ───────── Timeline: three weeks from a few days back. Bars run start → due; drag a bar to move it, its right edge to change the due day. ───────── */
const BACK = 4, DAYS = 21
const WD1 = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
function Timeline({ groups }) {
  const s = useStore()
  const days = Array.from({ length: DAYS }, (_, i) => at(i - BACK))
  const drag = useRef(null)
  const [ghost, setGhost] = useState(null) // { id, a, b } in day offsets while dragging
  const off = (d) => dayDiff(d) + BACK
  const startDrag = (e, t, mode) => {
    if (e.button > 0) return
    e.stopPropagation(); e.preventDefault()
    const track = e.currentTarget.closest('.td-tl-track')
    const a = off(t.start || t.due), b = off(t.due)
    drag.current = { t, mode, x0: e.clientX, w: track.getBoundingClientRect().width / DAYS, a, b, moved: false }
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  const onMove = (e) => {
    const d = drag.current
    if (!d) return
    const n = Math.round((e.clientX - d.x0) / d.w)
    if (n) d.moved = true
    setGhost(d.mode === 'move' ? { id: d.t.id, a: d.a + n, b: d.b + n } : { id: d.t.id, a: d.a, b: Math.max(d.a, d.b + n) })
  }
  const onUp = () => {
    const d = drag.current
    drag.current = null
    if (!d) return
    if (!d.moved) { setGhost(null); openTodo(d.t.id); return }
    const g = ghost
    setGhost(null)
    if (!g) return
    const shift = (x, n) => { if (!x) return x; const y = new Date(x); y.setDate(y.getDate() + n); return y }
    const nb = g.b - d.b, na = g.a - d.a
    s.todo.patch(d.t.id, { due: shift(d.t.due, nb), remind: shift(d.t.due, nb), ...(d.t.start ? { start: shift(d.t.start, na) } : na ? { start: shift(d.t.due, na) } : null) })
  }
  const nodate = groups.reduce((n, g) => n + g.list.filter((t) => !t.due).length, 0)
  return (
    <div className="td-tl" style={{ '--days': DAYS }}>
      <div className="td-tl-row td-tl-head">
        <div className="td-tl-name" />
        <div className="td-tl-track">
          {days.map((d, i) => (
            <span key={i} className={'td-tl-day' + (i === BACK ? ' today' : '') + ([0, 6].includes(d.getDay()) ? ' we' : '')}>
              <i>{WD1[d.getDay()]}</i>{d.getDate() === 1 || i === 0 ? fmt.date(d) : d.getDate()}
            </span>
          ))}
        </div>
      </div>
      {groups.map((g) => {
        const list = g.list.filter((t) => t.due)
        if (!list.length) return null
        return (
          <section key={g.key} className="td-tl-g">
            <div className="group-h td-sec-h">{g.icon}{g.label}<span className="mute num">{list.length}</span></div>
            {list.map((t) => {
              const gh = ghost?.id === t.id ? ghost : null
              const a0 = gh ? gh.a : off(t.start || t.due), b0 = gh ? gh.b : off(t.due)
              const a = Math.max(0, a0), b = Math.min(DAYS - 1, b0)
              const visible = b0 >= 0 && a0 <= DAYS - 1
              const crew = whosOf(t).filter((x) => x !== meId()).map(userOf).filter(Boolean)
              return (
                <div key={t.id} className={'td-tl-row' + (bucketOf(t) === 'overdue' ? ' late' : '')} data-id={t.id}>
                  <div className="td-tl-name">
                    <Tick t={t} />
                    <button className="td-tl-t ell" onClick={() => openTodo(t.id)}>{t.text}</button>
                    {crew.length > 0 && <Tip label={crew.map((u) => u.short).join(', ')}><span className="td-by"><AvatarStack users={crew.slice(0, 3)} size={16} ring="var(--surface)" /></span></Tip>}
                  </div>
                  <div className="td-tl-track" onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
                    <i className="td-tl-now" style={{ left: `calc(${(BACK + 0.5) / DAYS} * 100%)` }} />
                    {visible ? (
                        <span title={spanLabel(t)} className={'td-tl-bar' + (gh ? ' drag' : '') + (b0 === a0 ? ' one' : '') + (a0 < 0 ? ' cut-l' : '') + (b0 > DAYS - 1 ? ' cut-r' : '')}
                          style={{ left: `calc(${a / DAYS} * 100%)`, width: `calc(${(b - a + 1) / DAYS} * 100% - 4px)` }}
                          onPointerDown={(e) => startDrag(e, t, 'move')}>
                          <span className="ell">{t.text}</span>
                          <span className="td-tl-end" onPointerDown={(e) => startDrag(e, t, 'end')} aria-hidden />
                        </span>
                    ) : <span className="td-tl-off td-span mute xs">{b0 < 0 && <ArrowLeft size={11} strokeWidth={2.2} className="td-span-i" />}<Span label={spanLabel(t)} />{a0 > DAYS - 1 && <ArrowRight size={11} strokeWidth={2.2} className="td-span-i" />}</span>}
                  </div>
                </div>
              )
            })}
          </section>
        )
      })}
      {nodate > 0 && <div className="td-none mute xs">{nodate} without a date</div>}
    </div>
  )
}
