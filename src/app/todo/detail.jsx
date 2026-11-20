// One to-do, opened: title, assignee, timeline (start → due), links, subtasks, notes. Lives in the Panel (beside or over its list) or a sheet.
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ChevronLeft, X, Pin, Trash2, Plus, CornerDownRight, ArrowRight, Search, Check } from 'lucide-react'
import { useStore } from '../store'
import { Tip } from '../../shared/motion'
import { Avatar } from '../../shared/ui'
import { Popover } from '../ui'
import { team, TODAY, fmt } from '../data'
import { indexOf, search, linkOf, KIND_ONE, whosOf, meId, dueLabel, dayDiff, at, bucketOf } from './logic'
import { Tick, LinkChip, Mark, Composer, TodoRow, Ring, userOf } from './ui'
import { openTodo } from './state'

const ymd = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
const QUICK = [['Today', () => at(0)], ['Tomorrow', () => at(1)], ['This weekend', () => at((6 - TODAY.getDay() + 7) % 7 || 7)], ['Next week', () => at(((8 - TODAY.getDay()) % 7) || 7)], ['In 2 weeks', () => at(14)]]
const byDue = (a, b) => (a.due ? +a.due : 9e15) - (b.due ? +b.due : 9e15) || (a.order ?? 0) - (b.order ?? 0)

/** A day, as a button that opens quick picks and a calendar. Keeps the time of day if the old value had one. */
function DayField({ value, onChange, empty, min, late }) {
  const keep = (d) => { if (value && d) { const x = new Date(d); x.setHours(value.getHours(), value.getMinutes()); return x } return d }
  return (
    <Popover align="left" width={230} trigger={({ toggle, open }) => (
      <button className={'td-dt-v' + (value ? '' : ' empty') + (open ? ' open' : '') + (late ? ' late' : '')} onClick={toggle}>{value ? dueLabel(value) : empty}</button>
    )}>
      {(close) => (
        <div className="td-duem">
          {QUICK.map(([l, f]) => { const d = f(); return <button key={l} disabled={min && d < min} onClick={() => { onChange(keep(d)); close() }}><span className="grow">{l}</span><span className="mute xs">{dueLabel(d)}</span></button> })}
          <label className="td-duem-pick"><span className="grow">Pick a day</span><input type="date" defaultValue={value ? ymd(value) : ''} min={min ? ymd(min) : undefined} onChange={(e) => { const [y, mo, d] = e.target.value.split('-').map(Number); if (y) { onChange(keep(new Date(y, mo - 1, d))); close() } }} /></label>
          {value && <><div className="pop-sep" /><button onClick={() => { onChange(null); close() }}><span className="grow">Clear</span></button></>}
        </div>
      )}
    </Popover>
  )
}

/** Everyone on it, as chips; the picker ticks people on and off and stays open so you can add several. */
function Assignee({ t }) {
  const s = useStore()
  const [q, setQ] = useState('')
  const whos = whosOf(t)
  const us = whos.map(userOf).filter(Boolean)
  const flip = (id) => s.todo.patch(t.id, { who: whos.includes(id) ? whos.filter((x) => x !== id) : [...whos, id] })
  const list = [...team].sort((a, b) => (b.id === meId()) - (a.id === meId()) || whos.includes(b.id) - whos.includes(a.id))
    .filter((x) => !q || (x.name + ' ' + x.role).toLowerCase().includes(q.toLowerCase()))
  return (
    <>
      {us.map((u) => (
        <span key={u.id} className="td-dt-who">
          <Avatar user={u} size={18} /><span className="ell">{u.id === meId() ? 'You' : us.length > 2 ? u.short : u.name}</span>
          <button className="td-cchip-x" onClick={() => flip(u.id)} aria-label={'Unassign ' + u.name}><X size={11} /></button>
        </span>
      ))}
      <Popover align="left" width={300} trigger={({ toggle, open }) => (
        us.length ? <button className={'td-dt-add' + (open ? ' on' : '')} onClick={toggle} aria-label="Add people"><Plus size={13} />{us.length ? '' : 'Assign'}</button>
          : <button className={'td-dt-v empty' + (open ? ' open' : '')} onClick={toggle}>Nobody</button>
      )}>
        {() => (
          <div className="td-lk td-who">
            <label className="td-lk-in"><Search size={13} className="mute" /><input autoFocus value={q} placeholder="Add people" onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && list[0]) { e.preventDefault(); flip(list[0].id); setQ('') } }} /></label>
            {list.map((x) => {
              const on = whos.includes(x.id)
              return (
                <button key={x.id} role="menuitemcheckbox" aria-checked={on} className={on ? 'picked' : ''} onClick={() => flip(x.id)}>
                  <Avatar user={x} size={20} />
                  <span className="td-who-n"><span className="ell">{x.id === meId() ? 'You' : x.name}</span><span className="mute xs ell">{x.role}</span></span>
                  <span className={'td-who-ck' + (on ? ' on' : '')}>{on && <Check size={12} />}</span>
                </button>
              )
            })}
          </div>
        )}
      </Popover>
    </>
  )
}

/** Search what we hold and link it: companies, people, deals, campaigns, invoices, creators. */
export function LinkAdd({ t, label = 'Link' }) {
  const s = useStore()
  const [q, setQ] = useState('')
  const [hi, setHi] = useState(0)
  const idx = indexOf(s)
  const res = search(idx, q).filter((e) => e.kind !== 'member' && !t.links.some((l) => l.kind === e.kind && l.id === e.id)).slice(0, 8)
  const add = (e, close) => { s.todo.patch(t.id, { links: [...t.links, linkOf(e)] }); setQ(''); setHi(0); close() }
  return (
    <Popover align="left" width={320} trigger={({ toggle }) => <button className="td-dt-add" onClick={toggle}><Plus size={13} />{label}</button>}>
      {(close) => (
        <div className="td-lk">
          <label className="td-lk-in"><Search size={13} className="mute" /><input autoFocus value={q} placeholder="Company, person, deal, campaign…" onChange={(e) => { setQ(e.target.value); setHi(0) }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); setHi((h) => (h + (e.key === 'ArrowDown' ? 1 : -1) + res.length) % Math.max(1, res.length)) }
              if (e.key === 'Enter' && res[hi]) { e.preventDefault(); add(res[hi], close) }
            }} /></label>
          {res.map((e, i) => (
            <button key={e.kind + e.id} className={i === hi ? 'on' : ''} onMouseEnter={() => setHi(i)} onClick={() => add(e, close)}>
              <Mark e={e} size={18} /><span className="ell td-lk-l">{e.label}</span><span className="mute xs ell">{KIND_ONE[e.kind]}</span>
            </button>
          ))}
          {!res.length && <div className="mute xs td-lk-none">No match</div>}
        </div>
      )}
    </Popover>
  )
}

function Title({ t }) {
  const s = useStore()
  const [v, setV] = useState(t.text)
  const ref = useRef()
  useEffect(() => { setV(t.text) }, [t.id, t.text])
  useLayoutEffect(() => { const el = ref.current; if (el) { el.style.height = '0px'; el.style.height = el.scrollHeight + 'px' } }, [v])
  const save = () => { const x = v.replace(/\s+/g, ' ').trim(); if (x && x !== t.text) s.todo.patch(t.id, { text: x }); else setV(t.text) }
  return <textarea ref={ref} className={'td-dt-title' + (t.done ? ' done' : '')} rows={1} value={v} onChange={(e) => setV(e.target.value)} onBlur={save} aria-label="Title"
    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur() } if (e.key === 'Escape') { setV(t.text); e.currentTarget.blur(); e.stopPropagation() } }} />
}

function Notes({ t }) {
  const s = useStore()
  const [v, setV] = useState(t.notes || '')
  useEffect(() => { setV(t.notes || '') }, [t.id]) // eslint-disable-line react-hooks/exhaustive-deps
  return <textarea className="td-dt-notes" value={v} placeholder="Notes" onChange={(e) => setV(e.target.value)} onBlur={() => v !== (t.notes || '') && s.todo.patch(t.id, { notes: v })} aria-label="Notes" />
}

export function TodoDetail({ id, onBack, onClose, backLabel = 'To-do' }) {
  const s = useStore()
  const t = s.todo.items.find((x) => x.id === id)
  if (!t) return <div className="td-dt"><div className="td-dt-hd">{onBack && <button className="b ghost sm" onClick={onBack}><ChevronLeft size={15} />{backLabel}</button>}</div><div className="td-none mute">Deleted</div></div>
  const parent = t.parent ? s.todo.items.find((x) => x.id === t.parent) : null
  const kids = s.todo.items.filter((x) => x.parent === t.id).sort(byDue)
  const kd = kids.filter((x) => x.done).length
  const by = userOf(t.by)
  const span = t.start && t.due ? dayDiff(t.due) - dayDiff(t.start) + 1 : 0
  const set = (p) => s.todo.patch(t.id, p)
  const drop = (l) => set({ links: t.links.filter((x) => !(x.kind === l.kind && x.id === l.id)) })
  return (
    <div className="td-dt">
      <div className="td-dt-hd">
        {onBack && <button className="b ghost sm td-dt-back" onClick={onBack}><ChevronLeft size={15} />{backLabel}</button>}
        <span className="grow" />
        <Tip label={t.pinned ? 'Unpin' : 'Pin to the top'}><button className={'b ghost icon sm' + (t.pinned ? ' on' : '')} aria-pressed={!!t.pinned} onClick={() => set({ pinned: !t.pinned })} aria-label="Pin"><Pin size={14} /></button></Tip>
        <Tip label="Delete"><button className="b ghost icon sm" onClick={() => { s.todo.remove(t.id); (onBack || onClose)?.() }} aria-label="Delete"><Trash2 size={14} /></button></Tip>
        {onClose && <button className="b ghost icon sm" onClick={onClose} aria-label="Close"><X size={15} /></button>}
      </div>
      <div className="td-dt-b">
        {parent && <button className="td-dt-parent" onClick={() => openTodo(parent.id)}><CornerDownRight size={12} /><span className="ell">{parent.text}</span></button>}
        <div className="td-dt-top"><Tick t={t} size="lg" /><Title t={t} /></div>

        <dl className="td-dt-props">
          <dt>Assignees</dt><dd className="td-dt-whos"><Assignee t={t} /></dd>
          <dt>Timeline</dt>
          <dd className="td-dt-tl">
            <DayField value={t.start} empty="Start" onChange={(d) => set({ start: d, ...(d && t.due && d > t.due ? { due: d, remind: d } : null) })} />
            <ArrowRight size={13} className="mute" />
            <DayField value={t.due} empty="Due" min={t.start} late={!t.done && bucketOf(t) === 'overdue'} onChange={(d) => set({ due: d, remind: d, ...(d ? null : { start: null }) })} />
            {span > 1 && <span className="mute xs num">{span} days</span>}
          </dd>
          <dt>Linked</dt>
          <dd className="td-dt-links">
            {t.links.map((l) => (
              <span key={l.kind + l.id} className="td-dt-link"><LinkChip l={l} /><button className="td-cchip-x" onClick={() => drop(l)} aria-label={'Unlink ' + l.label}><X size={11} /></button></span>
            ))}
            <LinkAdd t={t} />
          </dd>
        </dl>

        {!t.parent && (
          <section className="td-dt-sec">
            <div className="td-dt-sh">
              <span>Subtasks</span>
              {kids.length > 0 && <><Ring n={kd} of={kids.length} /><span className="mute num">{kd}/{kids.length}</span></>}
            </div>
            <div className="td-rows">{kids.map((k) => <TodoRow key={k.id} t={k} subs={false} edit />)}</div>
            <Composer bare key={t.id} placeholder="Add a subtask" extra={() => ({ parent: t.id })} className="td-dt-add-sub" />
          </section>
        )}

        <section className="td-dt-sec">
          <div className="td-dt-sh"><span>Notes</span></div>
          <Notes t={t} />
        </section>
        <div className="td-dt-foot mute xs">{by ? (by.id === meId() ? 'You' : by.name) : 'Someone'} added this {fmt.date(t.at)}{t.done && t.doneAt ? ' · done ' + dueLabel(t.doneAt) : ''}</div>
      </div>
    </div>
  )
}
