// To-dos where people already look: Home (strip or card, every layout) and BD's Stream (In context).
import { useState } from 'react'
import { ListChecks, ChevronDown, Plus, ArrowUpRight, Check } from 'lucide-react'
import { useStore } from '../store'
import { Tip, AutoHeight } from '../../shared/motion'
import { BrandLogo } from '../../shared/brands'
import { bucketOf, dueLabel, brandOfItem, hrefOf, dayDiff } from './logic'
import { openTodos, openTodoAdd } from './state'
import { TodoRow, TodoText, Tick, dueMine, openMine, useGoing, isGoing } from './ui'

/** Strip: one quiet line above the KPIs that opens into today's list. */
export function TodoStrip() {
  const s = useStore()
  const [open, setOpen] = useState(false)
  const due = dueMine(s.todo.items)
  const late = due.filter((t) => bucketOf(t) === 'overdue').length
  const top = due.find((t) => t.pinned) || due.find((t) => bucketOf(t) === 'today') || due[0]
  return (
    <div className={'td-strip' + (open ? ' open' : '')}>
      <div className="td-strip-r">
        <button className="td-strip-b" onClick={() => setOpen((o) => !o)} aria-expanded={open} disabled={!due.length}>
          <ListChecks size={15} className="mute" />
          {due.length ? (
            <>
              <b className="num">{due.length}</b><span className="mute td-strip-n">{due.length === 1 ? 'to-do today' : 'to-dos today'}</span>
              {late > 0 && <span className="td-due b-overdue td-strip-late">{late} overdue</span>}
              <span className="mute td-strip-dot">·</span>
              <span className="ell td-strip-t">{top.text}</span>
              {due.length > 1 && <span className="mute num td-strip-plus">+{due.length - 1}</span>}
              <ChevronDown size={14} className={'mute td-chev' + (open ? ' on' : '')} />
            </>
          ) : <span className="mute">Nothing due today</span>}
        </button>
        <Tip label="Add a to-do" kbd="T"><button className="b ghost icon sm td-strip-add" onClick={() => openTodoAdd()} aria-label="Add a to-do"><Plus size={15} /></button></Tip>
      </div>
      <AutoHeight duration={0.24}>
        {open && due.length > 0 && (
          <div className="td-strip-l">
            <div className="td-rows">{due.map((t) => <TodoRow key={t.id} t={t} by={false} actions={false} />)}</div>
            <button className="td-more" onClick={openTodos}>All to-dos<ArrowUpRight size={12} /></button>
          </div>
        )}
      </AutoHeight>
    </div>
  )
}

/** Card: a KPI-sized tile — the count due today on the left, the items with ticks on the right. `kind` follows the Home layout. */
export function TodoCard({ kind = 'tiles' }) {
  const s = useStore()
  const due = dueMine(s.todo.items)
  const late = due.filter((t) => bucketOf(t) === 'overdue').length
  const left = openMine(s.todo.items).length
  const show = due.slice(0, kind === 'rows' ? 5 : 4)
  const head = (
    <div className="hub-mod-h td-hc-h">
      <span className="td-hc-ic"><ListChecks size={14} /></span><span>To-do</span>
      <span className="grow" />
    </div>
  )
  const list = (
    <div className="td-rows">
      {show.map((t) => <TodoRow key={t.id} t={t} by={false} actions={false} clamp />)}
      {!show.length && <div className="td-none mute"><Check size={14} />Clear</div>}
    </div>
  )
  return (
    <section className={'hub-mod td-hc k-' + kind}>
      {kind !== 'rows' && head}
      <div className="td-hcard">
        <div className="td-hc-k">
          {kind === 'rows' && <span className="metric-l row" style={{ gap: 6 }}><ListChecks size={14} />To-do</span>}
          {kind !== 'rows' && <span className="metric-l">Due today</span>}
          <span className="metric-v num">{due.length}</span>
          <span className="mute xs">{late > 0 ? <span className="td-due b-overdue">{late} overdue</span> : null}{late > 0 ? ' · ' : ''}{left} open</span>
          <span className="grow" />
          <div className="row td-hc-a">
            <Tip label="Add a to-do" kbd="T"><button className="b sm" onClick={() => openTodoAdd()}><Plus size={13} />Add</button></Tip>
            <Tip label="All to-dos"><button className="b sm ghost icon" onClick={openTodos} aria-label="All to-dos"><ArrowUpRight size={13} /></button></Tip>
          </div>
        </div>
        <div className="td-hc-l">{list}{due.length > show.length && <button className="td-more" onClick={openTodos}>+{due.length - show.length} more</button>}</div>
      </div>
    </section>
  )
}

/** Home's slot for the preference: strip above the KPIs, card after them. */
export function HomeTodos({ mode, at, kind }) {
  if (mode === 'strip' && at === 'top') return <TodoStrip />
  if (mode === 'card' && at === 'end') return <TodoCard kind={kind} />
  return null
}

/** Stream (In context): to-dos as cards at the head of the stream, mine, due within the week. */
export function StreamTodos() {
  const s = useStore()
  useGoing(null) // re-render when an item starts or stops ticking off
  const list = openMine(s.todo.items).filter((t) => t.due && ['overdue', 'today', 'upcoming'].includes(bucketOf(t)) && dayDiff(t.due) < 7).sort((a, b) => a.due - b.due).slice(0, 4)
  return list.map((t) => {
    const b = brandOfItem(t)
    const l = t.links.find((x) => x.kind !== 'phone' && hrefOf(x))
    return (
      <div key={t.id} className="bdv-card-w">
        <article className={'bdv-card td-scard' + (bucketOf(t) === 'overdue' ? ' late' : '') + (isGoing(t.id) ? ' td-going' : '')} data-id={t.id}>
          <div className="row bdv-card-h">
            <span className="bdv-type td-stype"><ListChecks size={12} />To-do</span>
            {b && <span className="row bdv-card-co"><BrandLogo name={b} size={18} /><b className="ell">{b}</b></span>}
            <span className="grow" />
            <span className={'xs td-due b-' + bucketOf(t)}>{dueLabel(t.due)}</span>
          </div>
          <div className="bdv-card-t td-scard-t"><Tick t={t} /><TodoText t={t} /></div>
          <div className="row bdv-card-a">
            {l && <a className="b sm" href={'#' + hrefOf(l)}><ArrowUpRight size={13} />Open</a>}
            <span className="grow" />
            <button className="b sm ghost" onClick={openTodos}>All to-dos</button>
          </div>
        </article>
      </div>
    )
  })
}
