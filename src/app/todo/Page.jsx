// #/todo — List (variation 1) or Canvas (variation 3). Panel and In context have no page.
import { useEffect, useRef, useState } from 'react'
import { ChevronDown, GripVertical, X, Link2, User, AlarmClock, Check } from 'lucide-react'
import { useStore } from '../store'
import { BrandLogo } from '../../shared/brands'
import { Popover } from '../ui'
import { bucketOf, mine, brandOfItem } from './logic'
import { todoStyle, openTodos } from './state'
import { Composer, TodoRow, StyleMenu } from './ui'
import { CanvasPage } from './Canvas'

export function TodoPage() {
  const style = todoStyle()
  // No page in Panel or In context: land on Home and open that variation's surface instead.
  useEffect(() => { if (style !== 'list' && style !== 'canvas') { location.replace('#/hub'); setTimeout(openTodos, 0) } }, [style])
  if (style === 'canvas') return <CanvasPage />
  if (style === 'list') return <ListPage />
  return null
}

const byOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0)
const SECTIONS = [['today', 'Today'], ['upcoming', 'Upcoming'], ['someday', 'Someday']]

/** Drag within a section by the grip. Pointer events, so touch works; the row follows the finger, a line marks the drop. */
function useReorder(onDrop) {
  const d = useRef(null)
  const [line, setLine] = useState(null) // { sec, top }
  const down = (e, id, sec, ids) => {
    if (e.button > 0) return
    const row = e.currentTarget.closest('.td-row')
    const box = row.parentElement
    const rows = [...box.children].filter((x) => x.classList.contains('td-row'))
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
  const { grip, line } = useReorder((id, ids, to) => s.todo.move(id, ids, to))
  const items = s.todo.items.filter((t) => (!me || mine(t)) && (!link || t.links.some((l) => l.brand === link)) && (!late || bucketOf(t) === 'overdue'))
  const sec = (k) => items.filter((t) => (k === 'today' ? ['overdue', 'today'].includes(bucketOf(t)) : bucketOf(t) === k)).sort(byOrder)
  const done = items.filter((t) => t.done).sort((a, b) => b.doneAt - a.doneAt)
  const brands = {}
  s.todo.items.forEach((t) => { const b = brandOfItem(t); if (b && !t.done) brands[b] = (brands[b] || 0) + 1 })
  const lateN = s.todo.items.filter((t) => bucketOf(t) === 'overdue' && (!me || mine(t))).length
  return (
    <div className="d-page td-page">
      <div className="td-bar">
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
        <StyleMenu />
      </div>
      <Composer className="td-top" placeholder="Add a to-do · @ links a company, person, deal or campaign" autoFocus={!window.matchMedia('(pointer: coarse)').matches} />
      {SECTIONS.map(([k, label]) => {
        const list = sec(k)
        if (!list.length && (k !== 'today' || late || link)) return null
        const ids = list.map((t) => t.id)
        return (
          <section key={k} className="td-sec">
            <div className="group-h td-sec-h">{label}<span className="mute num">{list.length}</span></div>
            <div className="td-rows">
              {list.map((t) => <TodoRow key={t.id} t={t} edit grip={grip(t.id, k, ids)} />)}
              {line?.sec === k && <i className="td-drop" style={{ top: line.top }} />}
            </div>
            {!list.length && <div className="td-none mute"><Check size={14} />Clear</div>}
          </section>
        )
      })}
      {done.length > 0 && !late && (
        <section className="td-sec">
          <button className="group-h td-sec-h td-fold" onClick={() => setShowDone((x) => !x)} aria-expanded={showDone}>Done<span className="mute num">{done.length}</span><ChevronDown size={14} className={'mute td-chev' + (showDone ? ' on' : '')} /></button>
          {showDone && <div className="td-rows">{done.map((t) => <TodoRow key={t.id} t={t} />)}</div>}
        </section>
      )}
    </div>
  )
}
