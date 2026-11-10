import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  Rows3, Columns3, Table2, GanttChart, LayoutGrid, SlidersHorizontal, ChevronDown, ChevronRight, Check, ListFilter, ArrowUpDown, ArrowDown,
  Plus, Search, Megaphone, GitCommitHorizontal, Hash, Layers, Users, Coins, Percent, Eye, CalendarDays, Clock, CircleDot, Tag, User, ArrowUpRight, Pin, X, Maximize2, ChevronsLeftRight, ZoomIn,
} from 'lucide-react'
import { useStore } from './store'
import { STAGES, STAGE_FULL, PODS, fmt, TODAY, team } from './data'
import { Tip, EASE, openNewCampaign, AutoHeight, MOD, MOD_SHIFT } from '../shared/motion'
import { Avatar, AvatarStack, Sparkline } from '../shared/ui'
import { Svc, Track, ClientLogo, Popover, Select, Switch, go } from './ui'
import { Sheet } from './pages/Finance'

/* ───────── Display model ───────── */
export const LAYOUTS = [
  { id: 'list', label: 'List', icon: Rows3 },
  { id: 'board', label: 'Board', icon: Columns3 },
  { id: 'table', label: 'Table', icon: Table2 },
  { id: 'timeline', label: 'Timeline', icon: GanttChart },
  { id: 'grid', label: 'Grid', icon: LayoutGrid },
]
const GROUPS = [
  { id: 'stage', label: 'Stage' }, { id: 'pod', label: 'Pod' }, { id: 'lead', label: 'Lead' },
  { id: 'industry', label: 'Industry' }, { id: 'none', label: 'No grouping' },
]
const ORDERS = [
  { id: 'updated', label: 'Last updated' }, { id: 'budget', label: 'Budget' }, { id: 'start', label: 'Start date' },
  { id: 'margin', label: 'Margin' }, { id: 'name', label: 'Name' },
]
const ZOOMS = [{ id: 'week', label: 'Weeks' }, { id: 'month', label: 'Months' }, { id: 'quarter', label: 'Quarter' }]
const PROPS = [
  { id: 'code', label: 'ID', icon: Hash },
  { id: 'stage', label: 'Stage', icon: CircleDot },
  { id: 'services', label: 'Services', icon: Layers },
  { id: 'pod', label: 'Pod', icon: Tag },
  { id: 'lead', label: 'Lead', icon: User },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'budget', label: 'Budget', icon: Coins },
  { id: 'margin', label: 'Margin', icon: Percent },
  { id: 'views', label: 'Views', icon: Eye },
  { id: 'start', label: 'Start', icon: CalendarDays },
  { id: 'updated', label: 'Updated', icon: Clock },
]
export const DEFAULTS = {
  linear: { layout: 'list', group: 'stage', order: 'updated', completed: true, zoom: 'week', props: ['code', 'services', 'stage', 'team', 'budget', 'updated'] },
  vercel: { layout: 'grid', group: 'none', order: 'updated', completed: true, zoom: 'week', props: ['services', 'stage', 'lead', 'budget', 'updated'] },
  attio: { layout: 'table', group: 'none', order: 'updated', completed: true, zoom: 'week', props: ['code', 'stage', 'pod', 'lead', 'services', 'budget', 'margin', 'views', 'start'] },
}

function useDisplay(exp) {
  const key = 'wldd-display-' + exp
  const [d, set] = useState(() => {
    try { return { ...DEFAULTS[exp], ...JSON.parse(localStorage.getItem(key) || '{}') } } catch { return DEFAULTS[exp] }
  })
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(d)) } catch {} }, [key, d])
  return [d, (patch) => set((x) => ({ ...x, ...patch })), () => set(DEFAULTS[exp])]
}

/* ───────── Values ───────── */
const margin = (c) => (c.budget - c.planCost) / c.budget
const DAY = 864e5
export const ago = (d) => {
  const h = Math.round((TODAY - d) / 36e5)
  if (h < 1) return 'now'
  if (h < 24) return h + 'h'
  const days = Math.round(h / 24)
  return days < 30 ? days + 'd' : fmt.date(d)
}
const SORT = {
  updated: (a, b) => b.updated - a.updated,
  budget: (a, b) => b.budget - a.budget,
  start: (a, b) => a.start - b.start,
  margin: (a, b) => margin(b) - margin(a),
  name: (a, b) => a.client.localeCompare(b.client),
}
const stageLabel = (i) => (i === 6 ? 'Complete' : STAGE_FULL[i])

/** Linear-style status glyph: dashed = not started, pie = progress, filled check = complete. */
export function StageIcon({ stage, size = 14 }) {
  const col = stage === 6 ? 'var(--violet)' : stage >= 4 ? 'var(--green)' : stage >= 1 ? 'var(--yellow)' : 'var(--muted)'
  const C = 2 * Math.PI * 2.5
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" style={{ flex: 'none', display: 'block' }} aria-hidden>
      {stage === 6 ? (
        <><circle cx="7" cy="7" r="6" fill={col} /><path d="M4.3 7.2l1.9 1.9 3.5-3.7" stroke="var(--surface)" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></>
      ) : (
        <>
          <circle cx="7" cy="7" r="5.5" fill="none" stroke={col} strokeWidth="1.5" strokeDasharray={stage === 0 ? '1.6 1.7' : undefined} />
          <circle cx="7" cy="7" r="2.5" fill="none" stroke={col} strokeWidth="5" strokeDasharray={`${(C * stage) / 6} ${C}`} transform="rotate(-90 7 7)" style={{ transition: 'stroke-dasharray 300ms cubic-bezier(.23,1,.32,1)' }} />
        </>
      )}
    </svg>
  )
}

const CELL = {
  code: (c) => <span className="mono mute">{c.code}</span>,
  stage: (c) => <Track stage={c.stage} />,
  services: (c) => <Svc list={c.services} />,
  pod: (c) => <span className="pod-tag"><span className="pod-dot" data-pod={c.pod} />{c.pod}</span>,
  lead: (c) => <span className="row" style={{ gap: 6 }}><Avatar user={c.lead} size={18} /><span className="fg2">{c.lead.short}</span></span>,
  team: (c) => <AvatarStack users={c.team} size={20} ring="var(--surface)" />,
  budget: (c) => <span className="num">{fmt.inr(c.budget)}</span>,
  margin: (c) => { const m = Math.round(margin(c) * 100); return <span className="num" style={{ color: m >= 30 ? 'var(--green)' : undefined }}>{m}%</span> },
  views: (c) => <span className="num fg2">{c.views ? fmt.compact(c.views) : '—'}</span>,
  start: (c) => <span className="mute">{fmt.date(c.start)}</span>,
  updated: (c) => <span className="mute num">{ago(c.updated)}</span>,
}
const AGG = {
  budget: (r) => fmt.inr(r.reduce((a, c) => a + c.budget, 0)),
  margin: (r) => (r.length ? Math.round((r.reduce((a, c) => a + margin(c), 0) / r.length) * 100) + '%' : '—'),
  views: (r) => fmt.compact(r.reduce((a, c) => a + c.views, 0)),
}
const AGG_L = { budget: 'Sum', margin: 'Avg', views: 'Sum' }

function groupsFor(by, rows, keepEmpty) {
  let defs
  if (by === 'stage') defs = [0, 1, 2, 3, 4, 5, 6].map((i) => ({ key: i, label: stageLabel(i), icon: <StageIcon stage={i} />, test: (c) => c.stage === i }))
  else if (by === 'pod') defs = PODS.map((p) => ({ key: p, label: p, icon: <span className="pod-dot" data-pod={p} />, test: (c) => c.pod === p }))
  else if (by === 'lead') {
    const us = keepEmpty ? team.filter((u) => !u.me) : [...new Map(rows.map((c) => [c.lead.id, c.lead])).values()]
    defs = us.sort((a, b) => a.name.localeCompare(b.name)).map((u) => ({ key: u.id, label: u.short, icon: <Avatar user={u} size={16} />, test: (c) => c.lead.id === u.id }))
  } else if (by === 'industry') {
    defs = [...new Set(rows.map((c) => c.industry || 'Others'))].sort().map((x) => ({ key: x, label: x, test: (c) => (c.industry || 'Others') === x }))
  } else defs = [{ key: 'all', label: null, test: () => true }]
  const out = defs.map((g) => ({ ...g, items: rows.filter(g.test) }))
  return keepEmpty ? out : out.filter((g) => g.items.length)
}

/* ═════════ Campaign views ═════════ */
const SCOPES = [
  { id: 'all', label: 'All', test: () => true },
  { id: 'active', label: 'Active', test: (c) => c.stage >= 3 && c.stage < 6 },
  { id: 'pipeline', label: 'Pipeline', test: (c) => c.stage < 3 },
]

export function CampaignViews({ exp }) {
  const s = useStore()
  const [d, setD, reset] = useDisplay(exp)
  const [scope, setScope] = useState('all')
  const [q, setQ] = useState('')
  const [pod, setPod] = useState(null)
  const [peek, setPeek] = useState(null)

  const sc = SCOPES.find((x) => x.id === scope)
  const base = s.campaigns.filter((c) => (!pod || c.pod === pod) && (c.name + c.code).toLowerCase().includes(q.toLowerCase()) && (d.completed || c.stage < 6))
  const rows = base.filter(sc.test).sort(SORT[d.order])
  const groupBy = d.layout === 'board' && d.group === 'none' ? 'stage' : d.group
  const groups = groupsFor(groupBy, rows, d.layout === 'board' && groupBy !== 'industry')

  const open = (c) => (exp === 'attio' ? setPeek(c.id) : go(`/pod/campaigns/${c.id}`))

  // ⇧⌘B / Ctrl+Shift+B flips list ⇄ board (⌘B alone collapses the sidebar).
  useEffect(() => {
    const on = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'b') { e.preventDefault(); setD({ layout: d.layout === 'board' ? 'list' : 'board' }) }
    }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  })

  const display = <DisplayMenu d={d} setD={setD} reset={reset} exp={exp} />
  const podFilter = (label) => (
    <Popover width={180} trigger={({ toggle, open: o }) => (
      <Tip label="Filter"><button className={'b sm' + (label ? '' : ' icon') + (o || pod ? ' on' : '')} onClick={toggle} aria-label="Filter">
        <ListFilter size={14} />{label && (pod ? <>Pod <b className="fw5">{pod}</b></> : label)}
      </button></Tip>
    )}>
      {(close) => (
        <>
          <div className="pop-h">Pod</div>
          {[null, ...PODS].map((p) => (
            <button key={p || 'all'} onClick={() => { setPod(p); close() }}>
              {p ? <span className="pod-dot" data-pod={p} /> : <span style={{ width: 8 }} />}{p || 'Any'}{pod === p && <Check size={14} style={{ marginLeft: 'auto' }} />}
            </button>
          ))}
        </>
      )}
    </Popover>
  )
  const full = d.layout !== 'list' || exp === 'linear'

  return (
    <div className={'d-page vpage x-' + exp + (full ? ' full' : '') + ' l-' + d.layout}>
      {exp === 'linear' && (
        <div className="vbar lin">
          <div className="vtabs">
            {SCOPES.map((x) => (
              <button key={x.id} className={'vtab' + (scope === x.id ? ' on' : '')} onClick={() => setScope(x.id)}>
                {x.label}<span className="mute num">{base.filter(x.test).length}</span>
              </button>
            ))}
          </div>
          <span className="grow" />
          {podFilter()}
          {display}
        </div>
      )}

      {exp === 'vercel' && (
        <>
          <div className="vbar vc">
            <div className="inp grow"><Search size={15} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search Campaigns…" /><kbd className="k">/</kbd></div>
            {podFilter()}
            <div className="ictog" role="group">
              {[['grid', LayoutGrid], ['list', Rows3]].map(([id, I]) => (
                <Tip key={id} label={id === 'grid' ? 'Grid' : 'List'}><button className={d.layout === id ? 'on' : ''} onClick={() => setD({ layout: id })} aria-label={id}><I size={15} /></button></Tip>
              ))}
            </div>
            {display}
            <Select value={scope} onChange={setScope} options={SCOPES} />
          </div>
        </>
      )}

      {exp === 'attio' && (
        <>
          <div className="vbar at">
            <Popover align="left" width={220} trigger={({ toggle, open: o }) => {
              const L = LAYOUTS.find((l) => l.id === d.layout)
              return <button className={'b sm at-view' + (o ? ' on' : '')} onClick={toggle}><L.icon size={14} />{sc.label}<ChevronDown size={13} className="mute" /></button>
            }}>
              {(close) => SCOPES.map((x) => (
                <button key={x.id} onClick={() => { setScope(x.id); close() }}>{x.label}<span className="mute num" style={{ marginLeft: 'auto' }}>{base.filter(x.test).length}</span>{scope === x.id && <Check size={14} />}</button>
              ))}
            </Popover>
            <span className="vsep" />
            <Popover align="left" width={200} trigger={({ toggle, open: o }) => (
              <button className={'b sm ghost' + (o ? ' on' : '')} onClick={toggle}><ArrowUpDown size={14} />Sorted by <b className="fw5">{ORDERS.find((o2) => o2.id === d.order).label}</b></button>
            )}>
              {(close) => ORDERS.map((o) => <button key={o.id} onClick={() => { setD({ order: o.id }); close() }}>{o.label}{d.order === o.id && <Check size={14} style={{ marginLeft: 'auto' }} />}</button>)}
            </Popover>
            {podFilter('Filter')}
            <span className="grow" />
            <div className="inp at-q"><Search size={14} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" /></div>
            {display}
            <button className="b sm ink" onClick={() => openNewCampaign()}><Plus size={14} /> New campaign</button>
          </div>
        </>
      )}

      {d.layout === 'list' && <ListView groups={groups} d={d} onOpen={open} exp={exp} />}
      {d.layout === 'board' && <BoardView groups={groups} d={d} groupBy={groupBy} onOpen={open} />}
      {d.layout === 'table' && <TableView rows={rows} d={d} setD={setD} onOpen={open} />}
      {d.layout === 'timeline' && <TimelineSwitch groups={groups} d={d} onOpen={open} />}
      {d.layout === 'grid' && exp === 'vercel' && <VxDash rows={rows} all={s.campaigns}><VxCards rows={rows} d={d} onOpen={open} /></VxDash>}
      {d.layout === 'grid' && exp !== 'vercel' && <GridView groups={groups} d={d} onOpen={open} />}
      {!rows.length && <div className="empty"><b>No campaigns</b></div>}

      <Peek id={peek} onClose={() => setPeek(null)} />
    </div>
  )
}

/* ───────── Display popover ───────── */
function DisplayMenu({ d, setD, reset, exp }) {
  const toggleProp = (id) => setD({ props: d.props.includes(id) ? d.props.filter((x) => x !== id) : [...d.props, id] })
  const label = exp === 'attio' ? 'View settings' : exp === 'linear' ? 'Display' : null
  return (
    <Popover width={340} className="dv" trigger={({ toggle, open }) => (
      <Tip label="Display options" kbd={MOD_SHIFT + 'B'}><button className={'b sm' + (label ? '' : ' icon') + (open ? ' on' : '')} onClick={toggle} aria-label="Display options">
        <SlidersHorizontal size={14} />{label}
      </button></Tip>
    )}>
      {() => (
        <>
          <div className="dv-lay">
            {LAYOUTS.map((l) => (
              <button key={l.id} className={'dv-l' + (d.layout === l.id ? ' on' : '')} onClick={() => setD({ layout: l.id })}>
                <l.icon size={15} />{l.label}
              </button>
            ))}
          </div>
          <div className="dv-sec">
            <div className="dv-row"><span>Grouping</span><Select value={d.group} options={GROUPS} onChange={(g) => setD({ group: g })} /></div>
            <div className="dv-row"><span>Ordering</span><Select value={d.order} options={ORDERS} onChange={(o) => setD({ order: o })} /></div>
          </div>
          <div className="dv-sec">
            <div className="dv-row"><span>Show completed</span><Switch on={d.completed} onChange={(v) => setD({ completed: v })} label="Show completed" /></div>
          </div>
          <AutoHeight duration={0.22}>
            {d.layout === 'timeline' && (
              <div className="dv-sec">
                <div className="dv-t">Timeline</div>
                <div className="dv-row"><span>Zoom</span><Select value={d.zoom} options={ZOOMS} onChange={(z) => setD({ zoom: z })} /></div>
              </div>
            )}
          </AutoHeight>
          <div className="dv-sec">
            <div className="dv-t">Properties</div>
            <div className="dv-props">
              {PROPS.map((p) => <button key={p.id} className={'dv-p' + (d.props.includes(p.id) ? ' on' : '')} onClick={() => toggleProp(p.id)}>{p.label}</button>)}
            </div>
          </div>
          <div className="dv-f"><button className="dv-reset" onClick={reset}>Reset</button></div>
        </>
      )}
    </Popover>
  )
}

/* ───────── List ───────── */
function ListView({ groups, d, onOpen, exp }) {
  const [collapsed, setCollapsed] = useState({})
  const [cursor, setCursor] = useState(null)
  const flat = groups.flatMap((g) => (collapsed[g.key] ? [] : g.items))
  const has = (p) => d.props.includes(p)

  // j / k / ↑ / ↓ move, Enter opens. Instant — keyboard never animates.
  useEffect(() => {
    const on = (e) => {
      const t = e.target
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') || e.metaKey || e.ctrlKey || e.altKey) return
      const i = flat.findIndex((c) => c.id === cursor)
      let n = null
      if (e.key === 'j' || e.key === 'ArrowDown') n = flat[Math.min(flat.length - 1, i + 1)]
      else if (e.key === 'k' || e.key === 'ArrowUp') n = flat[Math.max(0, i - 1)]
      else if (e.key === 'Enter' && i >= 0) { e.preventDefault(); onOpen(flat[i]); return }
      if (n) { e.preventDefault(); setCursor(n.id); document.getElementById('row-' + n.id)?.scrollIntoView({ block: 'nearest' }) }
    }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  })

  return (
    <div className="vlist" onMouseLeave={() => setCursor(null)}>
      {groups.map((g) => (
        <div key={g.key}>
          {g.label && (
            <button className="vgroup" onClick={() => setCollapsed((x) => ({ ...x, [g.key]: !x[g.key] }))}>
              <ChevronRight size={13} className="vgroup-c" style={{ rotate: collapsed[g.key] ? '0deg' : '90deg' }} />
              {g.icon}{g.label}<span className="mute num">{g.items.length}</span>
              {exp !== 'vercel' && <span className="vgroup-sum mute num">{fmt.inr(g.items.reduce((a, c) => a + c.budget, 0))}</span>}
            </button>
          )}
          <AnimatePresence initial={false}>
            {!collapsed[g.key] && (
              <motion.div className="list" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22, ease: EASE }} style={{ overflow: 'hidden' }}>
                {g.items.map((c) => (
                  <a key={c.id} id={'row-' + c.id} href={`#/pod/campaigns/${c.id}`} className={'li vli' + (cursor === c.id ? ' sel' : '')}
                    onClick={(e) => { e.preventDefault(); onOpen(c) }} onMouseMove={() => cursor !== c.id && setCursor(c.id)}>
                    {has('code') && <span className="mono mute vli-id">{c.code}</span>}
                    <Tip label={stageLabel(c.stage)}><span style={{ display: 'grid' }}><StageIcon stage={c.stage} /></span></Tip>
                    <ClientLogo name={c.client} industry={c.industry} />
                    <span className="grow ell"><span className="li-t">{c.client}</span> <span className="mute">× {c.activity}</span></span>
                    {has('services') && <Svc list={c.services} />}
                    {has('pod') && <span className="pod-tag"><span className="pod-dot" data-pod={c.pod} />{c.pod}</span>}
                    {has('stage') && <Track stage={c.stage} />}
                    {has('margin') && <span className="vli-n">{CELL.margin(c)}</span>}
                    {has('views') && <span className="vli-n">{CELL.views(c)}</span>}
                    {has('budget') && <span className="vli-n num fg2">{fmt.inr(c.budget)}</span>}
                    {has('start') && <span className="vli-d mute">{fmt.date(c.start)}</span>}
                    {has('updated') && <span className="vli-d mute num">{ago(c.updated)}</span>}
                    {has('lead') && <Tip label={c.lead.name}><span style={{ display: 'grid' }}><Avatar user={c.lead} size={20} /></span></Tip>}
                    {has('team') && <AvatarStack users={c.team} size={20} ring="var(--surface)" />}
                  </a>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  )
}

/* ───────── Board (kanban) ───────── */
function BoardView({ groups, d, groupBy, onOpen }) {
  const s = useStore()
  const [drag, setDrag] = useState(null)
  const [over, setOver] = useState(null)
  const can = ['stage', 'pod', 'lead'].includes(groupBy)
  const has = (p) => d.props.includes(p)
  const drop = (key) => {
    const c = s.campaigns.find((x) => x.id === drag)
    if (!c || !can) return
    if (groupBy === 'stage' && c.stage !== key) s.patchCampaign(c.id, { stage: key, planApproved: key >= 4 || c.planApproved, updated: TODAY })
    if (groupBy === 'pod' && c.pod !== key) s.patchCampaign(c.id, { pod: key, updated: TODAY })
    if (groupBy === 'lead' && c.lead.id !== key) s.patchCampaign(c.id, { lead: team.find((u) => u.id === key), updated: TODAY })
  }
  return (
    <div className="kb">
      {groups.map((g) => (
        <div key={g.key} className={'kb-col' + (over === g.key ? ' over' : '')}
          onDragOver={(e) => { if (!can) return; e.preventDefault(); if (over !== g.key) setOver(g.key) }}
          onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOver(null) }}
          onDrop={() => { drop(g.key); setDrag(null); setOver(null) }}>
          <div className="kb-h">
            {g.icon}<span className="ell">{g.label}</span><span className="mute num">{g.items.length}</span>
            <span className="grow" />
            <span className="mute num xs">{g.items.length ? fmt.inr(g.items.reduce((a, c) => a + c.budget, 0)) : ''}</span>
          </div>
          <div className="kb-list">
            {g.items.map((c) => (
              <motion.div key={c.id} layout="position" layoutId={'kb-' + c.id} transition={{ duration: 0.28, ease: EASE }}>
                <div className={'kcard' + (drag === c.id ? ' dragging' : '')} draggable
                  onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; setDrag(c.id) }} onDragEnd={() => { setDrag(null); setOver(null) }}
                  onClick={() => onOpen(c)}>
                  <div className="row kcard-top">
                    {has('code') && <span className="mono mute xs">{c.code}</span>}
                    <span className="grow" />
                    {has('lead') && <Avatar user={c.lead} size={18} />}
                  </div>
                  <div className="row" style={{ gap: 8 }}>
                    <ClientLogo name={c.client} industry={c.industry} />
                    <div className="grow" style={{ minWidth: 0 }}>
                      <div className="li-t ell">{c.client}</div>
                      <div className="mute xs ell">{c.activity}</div>
                    </div>
                  </div>
                  <div className="kcard-props">
                    {groupBy !== 'stage' && has('stage') && <span className="chip"><StageIcon stage={c.stage} size={12} />{STAGES[c.stage] || 'Done'}</span>}
                    {has('services') && <Svc list={c.services} />}
                    {groupBy !== 'pod' && has('pod') && <span className="pod-tag"><span className="pod-dot" data-pod={c.pod} />{c.pod}</span>}
                    {has('budget') && <span className="chip num">{fmt.inr(c.budget)}</span>}
                    {has('margin') && <span className="chip">{CELL.margin(c)}</span>}
                    {has('views') && c.views > 0 && <span className="chip"><Eye size={11} />{fmt.compact(c.views)}</span>}
                    {has('start') && <span className="chip"><CalendarDays size={11} />{fmt.date(c.start)}</span>}
                    {has('updated') && <span className="mute xs num" style={{ marginLeft: 'auto' }}>{ago(c.updated)}</span>}
                  </div>
                  {has('team') && <AvatarStack users={c.team} size={18} ring="var(--surface)" />}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ───────── Table (records) ───────── */
const STAGE_OPTS = [0, 1, 2, 3, 4, 5, 6].map((i) => ({ id: i, label: stageLabel(i) }))
function TableView({ rows, d, setD, onOpen }) {
  const s = useStore()
  const [sel, setSel] = useState(() => new Set())
  const cols = PROPS.filter((p) => d.props.includes(p.id))
  const all = rows.length > 0 && rows.every((c) => sel.has(c.id))
  const tog = (id) => setSel((x) => { const n = new Set(x); n.has(id) ? n.delete(id) : n.add(id); return n })
  const sortable = (id) => ORDERS.some((o) => o.id === id)

  const edit = (c, p) => {
    if (p.id === 'stage') return (
      <Popover align="left" width={210} trigger={({ toggle }) => (
        <button className="gt-edit" onClick={(e) => { e.stopPropagation(); toggle() }}><StageIcon stage={c.stage} />{stageLabel(c.stage)}</button>
      )}>
        {(close) => STAGE_OPTS.map((o) => <button key={o.id} onClick={() => { s.patchCampaign(c.id, { stage: o.id, planApproved: o.id >= 4 || c.planApproved, updated: TODAY }); close() }}><StageIcon stage={o.id} />{o.label}{c.stage === o.id && <Check size={14} style={{ marginLeft: 'auto' }} />}</button>)}
      </Popover>
    )
    if (p.id === 'pod') return (
      <Popover align="left" width={160} trigger={({ toggle }) => <button className="gt-edit" onClick={(e) => { e.stopPropagation(); toggle() }}><span className="pod-tag"><span className="pod-dot" data-pod={c.pod} />{c.pod}</span></button>}>
        {(close) => PODS.map((x) => <button key={x} onClick={() => { s.patchCampaign(c.id, { pod: x, updated: TODAY }); close() }}><span className="pod-dot" data-pod={x} />{x}{c.pod === x && <Check size={14} style={{ marginLeft: 'auto' }} />}</button>)}
      </Popover>
    )
    if (p.id === 'lead') return (
      <Popover align="left" width={200} trigger={({ toggle }) => <button className="gt-edit" onClick={(e) => { e.stopPropagation(); toggle() }}>{CELL.lead(c)}</button>}>
        {(close) => team.filter((u) => !u.me).map((u) => <button key={u.id} onClick={() => { s.patchCampaign(c.id, { lead: u, updated: TODAY }); close() }}><Avatar user={u} size={18} />{u.short}{c.lead.id === u.id && <Check size={14} style={{ marginLeft: 'auto' }} />}</button>)}
      </Popover>
    )
    return CELL[p.id](c)
  }

  const bulkNext = () => { sel.forEach((id) => s.patchCampaign(id, (x) => ({ stage: Math.min(6, x.stage + 1), updated: TODAY }))); setSel(new Set()) }
  const bulkPin = () => { sel.forEach((id) => s.patchCampaign(id, { pinned: true })); setSel(new Set()) }

  return (
    <>
      <div className="gt-wrap">
        <table className="gt">
          <thead>
            <tr>
              <th className="gt-ck"><Check2 on={all} onClick={() => setSel(all ? new Set() : new Set(rows.map((c) => c.id)))} /></th>
              <th className="gt-first"><span className="gt-th"><Megaphone size={13} />Campaign</span></th>
              {cols.map((p) => (
                <th key={p.id} className={(sortable(p.id) ? 'sortable' : '') + (d.order === p.id ? ' on' : '')} onClick={() => sortable(p.id) && setD({ order: p.id })}>
                  <span className="gt-th"><p.icon size={13} />{p.label}{d.order === p.id && <ArrowDown size={12} />}</span>
                </th>
              ))}
              <th className="gt-fill" />
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className={sel.has(c.id) ? 'sel' : ''}>
                <td className="gt-ck"><Check2 on={sel.has(c.id)} onClick={() => tog(c.id)} /></td>
                <td className="gt-first">
                  <button className="gt-rec" onClick={() => onOpen(c)}>
                    <ClientLogo name={c.client} industry={c.industry} />
                    <span className="ell"><span className="li-t">{c.client}</span> <span className="mute">× {c.activity}</span></span>
                    <Maximize2 size={12} className="gt-open" />
                  </button>
                </td>
                {cols.map((p) => <td key={p.id}>{edit(c, p)}</td>)}
                <td className="gt-fill" />
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td className="gt-ck" />
              <td className="gt-first"><span className="mute">Count</span> <span className="num fw5">{rows.length}</span></td>
              {cols.map((p) => <td key={p.id}>{AGG[p.id] && <><span className="mute">{AGG_L[p.id]}</span> <span className="num fw5">{AGG[p.id](rows)}</span></>}</td>)}
              <td className="gt-fill" />
            </tr>
          </tfoot>
        </table>
      </div>
      <AnimatePresence>
        {sel.size > 0 && (
          <motion.div className="bar" initial={{ opacity: 0, y: 12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.98 }} transition={{ duration: 0.2, ease: EASE }}>
            <span className="num" style={{ fontWeight: 600 }}>{sel.size}</span><span style={{ opacity: 0.6, marginRight: 8 }}>selected</span>
            <button className="b sm" onClick={bulkNext}><ArrowUpRight size={14} /> Next stage</button>
            <button className="b sm" onClick={bulkPin}><Pin size={14} /> Pin</button>
            <button className="b sm icon" onClick={() => setSel(new Set())} aria-label="Clear"><X size={14} /></button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
const Check2 = ({ on, onClick }) => (
  <button role="checkbox" aria-checked={on} className={'ck' + (on ? ' on' : '')} onClick={(e) => { e.stopPropagation(); onClick() }}>
    {on && <Check size={11} strokeWidth={3} />}
  </button>
)

/* ───────── Timeline ───────── */
const usePhone = () => {
  const q = '(max-width: 760px)'
  const [m, setM] = useState(() => window.matchMedia(q).matches)
  useEffect(() => {
    const mq = window.matchMedia(q), on = () => setM(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return m
}
function TimelineSwitch(props) {
  return usePhone() ? <TimelineStack {...props} /> : <TimelineView {...props} />
}

/* ───────── Timeline on phones: a vertical agenda ─────────
   Opens on Today (live campaigns, ending soonest first), then upcoming weeks; the past folds into "Earlier".
   Each row says where it stands ("ends in 12d"). */
const weekOf = (dt) => { const m = new Date(dt); m.setHours(0, 0, 0, 0); m.setDate(m.getDate() - ((m.getDay() + 6) % 7)); return m }
const weekLabel = (wk) => {
  const diff = Math.round((wk - weekOf(TODAY)) / (7 * DAY))
  if (diff === 0) return 'This week'
  if (diff === 1) return 'Next week'
  if (diff === -1) return 'Last week'
  return 'Week of ' + wk.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', ...(wk.getFullYear() !== TODAY.getFullYear() ? { year: 'numeric' } : {}) })
}
const daysTo = (dt) => Math.round((weekless(dt) - weekless(TODAY)) / DAY)
const weekless = (dt) => { const x = new Date(dt); x.setHours(0, 0, 0, 0); return x }
const inDays = (n) => (n === 0 ? 'today' : n === 1 ? 'tomorrow' : `in ${n}d`)
function agendaState(c) {
  const end = c.end || new Date(c.start.getTime() + 30 * DAY)
  if (c.start > TODAY) { const n = daysTo(c.start); return { k: 'next', end, note: 'starts ' + inDays(n), soon: n <= 3 } }
  if (end >= weekless(TODAY)) {
    const n = daysTo(end)
    return { k: 'live', end, note: n === 0 ? 'ends today' : 'ends ' + inDays(n), soon: n <= 7, prog: Math.min(1, (TODAY - c.start) / Math.max(DAY, end - c.start)) }
  }
  const n = -daysTo(end)
  return { k: 'done', end, note: `ended ${n}d ago` }
}

function TimelineStack({ groups, onOpen }) {
  const all = groups.flatMap((g) => g.items).map((c) => ({ c, s: agendaState(c) }))
  // Today first: what's live, ending soonest at the top. Then upcoming by start week. The past folds away at the bottom.
  const live = all.filter((x) => x.s.k === 'live').sort((a, b) => a.s.end - b.s.end)
  const next = all.filter((x) => x.s.k === 'next').sort((a, b) => a.c.start - b.c.start)
  const done = all.filter((x) => x.s.k === 'done').sort((a, b) => b.s.end - a.s.end)
  const weeks = []
  for (const x of next) {
    const w = weekOf(x.c.start)
    if (!weeks.length || +weeks[weeks.length - 1].wk !== +w) weeks.push({ wk: w, items: [] })
    weeks[weeks.length - 1].items.push(x)
  }
  const [showPast, setShowPast] = useState(false)

  const Row = ({ c, s }) => (
    <button className={'agd-row ' + s.k} onClick={() => onOpen(c)}>
      <span className="agd-node" />
      <span className="agd-body">
        <span className="agd-top">
          <ClientLogo name={c.client} industry={c.industry} />
          <span className="ell grow"><span className="li-t">{c.client}</span> <span className="mute">× {c.activity}</span></span>
          <StageIcon stage={c.stage} />
        </span>
        <span className="agd-meta">
          <span className="num">{fmt.date(c.start)} – {fmt.date(s.end)}</span>
          <span className={'agd-note' + (s.soon ? ' soon' : '')}>{s.note}</span>
        </span>
        {s.k === 'live' && <span className="agd-prog"><i style={{ width: s.prog * 100 + '%' }} /></span>}
      </span>
    </button>
  )

  return (
    <div className="agd">
      <div className="agd-today"><i />Today<span className="num">{fmt.date(TODAY)}</span><span className="agd-c num">{live.length} live</span></div>
      {live.map((x) => <Row key={x.c.id} {...x} />)}
      {!live.length && <div className="agd-empty">Nothing live</div>}

      {weeks.map((w) => (
        <div key={+w.wk}>
          <div className="agd-wk">{weekLabel(w.wk)}<span className="mute num">{w.items.length}</span></div>
          {w.items.map((x) => <Row key={x.c.id} {...x} />)}
        </div>
      ))}

      {done.length > 0 && (
        <>
          <button className={'agd-wk agd-past' + (showPast ? ' on' : '')} onClick={() => setShowPast((v) => !v)} aria-expanded={showPast}>
            Earlier<span className="mute num">{done.length}</span>
            <ChevronDown size={14} className="agd-chev" />
          </button>
          <AnimatePresence initial={false}>
            {showPast && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.24, ease: EASE }} style={{ overflow: 'hidden' }}>
                {done.map((x) => <Row key={x.c.id} {...x} />)}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  )
}

function TimelineView({ groups, d, onOpen }) {
  const scroller = useRef(null)
  // Phones/tablets: a narrow frozen name column, plus "Fit" to see the whole range at once. Desktop unchanged.
  const MQ = '(max-width: 960px)'
  const [narrow, setNarrow] = useState(() => window.matchMedia(MQ).matches)
  const [cw, setCw] = useState(0)
  const [fitOn, setFit] = useState(false)
  useEffect(() => {
    const m = window.matchMedia(MQ), on = () => setNarrow(m.matches)
    m.addEventListener('change', on)
    const ro = new ResizeObserver(() => setCw(scroller.current?.clientWidth || 0))
    if (scroller.current) ro.observe(scroller.current)
    return () => { m.removeEventListener('change', on); ro.disconnect() }
  }, [])
  const NW = narrow ? 128 : 300
  const fit = narrow && fitOn && cw > NW
  const from = new Date(TODAY.getTime() - 63 * DAY)
  from.setDate(from.getDate() - ((from.getDay() + 6) % 7)) // Monday
  const days = d.zoom === 'quarter' ? 280 : 168
  const dw = fit ? (cw - NW) / days : { week: 16, month: 6, quarter: 3 }[d.zoom]
  const W = days * dw
  const x = (dt) => ((dt - from) / DAY) * dw
  useLayoutEffect(() => { if (scroller.current) scroller.current.scrollLeft = fit ? 0 : Math.max(0, x(TODAY) - (narrow ? 48 : 320)) }, [d.zoom, narrow, fit]) // eslint-disable-line

  const months = []
  for (let i = 0; i < days; i++) {
    const dt = new Date(from.getTime() + i * DAY)
    if (i === 0 || dt.getDate() === 1) months.push({ i, label: dt.toLocaleDateString('en-GB', { month: 'short' }) + (dt.getMonth() === 0 || i === 0 ? ' ' + dt.getFullYear() : '') })
  }
  const weeks = Array.from({ length: Math.ceil(days / 7) }, (_, i) => new Date(from.getTime() + i * 7 * DAY))
  const has = (p) => d.props.includes(p)

  return (
    <div className="tl" ref={scroller} style={narrow ? { '--tl-name': NW + 'px' } : undefined}>
      <div className="tl-in" style={{ width: NW + W }}>
        <div className="tl-head">
          <div className="tl-name tl-corner">
            {narrow && (
              <button className={'tl-fit' + (fit ? ' on' : '')} onClick={() => setFit((f) => !f)} aria-pressed={fit}>
                {fit ? <ZoomIn size={14} /> : <ChevronsLeftRight size={14} />}{fit ? 'Zoom' : 'Fit'}
              </button>
            )}
          </div>
          <div className="tl-scale" style={{ width: W }}>
            {(fit ? fitMonths(months, dw, W) : months).map((m) => <span key={m.i} className="tl-m" style={{ left: m.i * dw }}>{m.label}</span>)}
            {d.zoom !== 'quarter' && !fit && weeks.map((w, i) => <span key={i} className="tl-w num" style={{ left: i * 7 * dw }}>{d.zoom === 'week' ? w.getDate() : ''}</span>)}
          </div>
        </div>
        <div className="tl-body">
          <div className="tl-grid" style={{ left: NW, width: W, backgroundSize: `${(fit ? 28 : 7) * dw}px 100%` }} />
          <div className="tl-today" style={{ left: NW + x(TODAY) }}><span>Today</span></div>
          {groups.map((g) => (
            <div key={g.key}>
              {g.label && <div className="tl-g"><div className="tl-name">{g.icon}{g.label}<span className="mute num">{g.items.length}</span></div></div>}
              {g.items.map((c) => {
                const l = x(c.start), w = Math.max(dw * 2, x(c.end || new Date(c.start.getTime() + 30 * DAY)) - l)
                const prog = c.stage === 6 ? 1 : c.stage / 6
                return (
                  <div key={c.id} className="tl-row">
                    <button className="tl-name" onClick={() => onOpen(c)}>
                      <StageIcon stage={c.stage} />
                      <ClientLogo name={c.client} industry={c.industry} />
                      <span className="ell"><span className="li-t">{c.client}</span> <span className="mute">× {c.activity}</span></span>
                    </button>
                    <div className="tl-track" style={{ width: W }}>
                      <Tip label={`${fmt.date(c.start)} → ${fmt.date(c.end || c.start)}`}>
                        <button className={'tl-bar s' + Math.min(c.stage, 6)} style={{ left: l, width: w }} onClick={() => onOpen(c)}>
                          <i style={{ transform: `scaleX(${prog})` }} />
                          <span className="ell">{w > 120 ? c.client : ''}{w > 220 && has('budget') ? <span className="tl-amt num"> · {fmt.inr(c.budget)}</span> : null}</span>
                        </button>
                      </Tip>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Fit mode packs ~6 months into a phone width: short names, and drop a leading partial month that would collide.
const fitMonths = (months, dw, W) => months
  .filter((m, k) => !(k === 0 && months[1] && months[1].i * dw < 44) && m.i * dw < W - 30)
  .map((m) => ({ ...m, label: m.label.split(' ')[0] }))

/* ───────── Grid (cards) ───────── */
function GridView({ groups, d, onOpen }) {
  const has = (p) => d.props.includes(p)
  return (
    <div className="vgrid-wrap">
      {groups.map((g) => (
        <div key={g.key}>
          {g.label && <div className="group-h">{g.icon}{g.label} <span className="mute num">{g.items.length}</span></div>}
          <div className="vgrid">
            {g.items.map((c) => (
              <a key={c.id} href={`#/pod/campaigns/${c.id}`} className="vcard" onClick={(e) => { e.preventDefault(); onOpen(c) }}>
                <div className="row" style={{ gap: 12 }}>
                  <ClientLogo name={c.client} industry={c.industry} size="lg" />
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div className="li-t ell">{c.client} <span className="mute" style={{ fontWeight: 400 }}>× {c.activity}</span></div>
                    <div className="mute xs ell">{has('code') ? c.code + ' · ' : ''}{c.pod}</div>
                  </div>
                  {has('lead') && <Avatar user={c.lead} size={22} />}
                </div>
                <div className="vcard-chart">
                  <Sparkline data={c.trend} width={320} height={44} color={c.stage >= 4 ? 'var(--green)' : 'var(--muted)'} />
                </div>
                <div className="row vcard-f">
                  <StageIcon stage={c.stage} />
                  <span className="fg2 ell">{stageLabel(c.stage)}</span>
                  {has('services') && <Svc list={c.services} />}
                  <span className="grow" />
                  {has('budget') && <span className="num fw5">{fmt.inr(c.budget)}</span>}
                </div>
                {(has('updated') || has('start')) && (
                  <div className="mute xs row" style={{ gap: 6 }}>
                    {has('start') && <><CalendarDays size={12} />{fmt.date(c.start)}</>}
                    {has('updated') && <span style={{ marginLeft: has('start') ? 'auto' : 0 }}>{ago(c.updated) === 'now' ? 'Updated just now' : `Updated ${ago(c.updated)} ago`}</span>}
                  </div>
                )}
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ───────── Vercel: summary column + flat project-style cards ───────── */
const LAST_EVENT = [
  () => 'Brief received',
  (c) => `Team allocated · ${c.lead.short} leads`,
  () => 'Pitch deck sent to client',
  () => 'Plan sent for client approval',
  (c) => `${c.live}/${c.deliverables} links live`,
  () => 'Report in progress',
  () => 'Report shared with client',
]
const Ring = ({ v }) => {
  const C = 2 * Math.PI * 6
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" style={{ flex: 'none' }} aria-hidden>
      <circle cx="8" cy="8" r="6" fill="none" stroke="var(--line-2)" strokeWidth="2" />
      <circle cx="8" cy="8" r="6" fill="none" stroke={v >= 0.9 ? 'var(--yellow)' : 'var(--fg)'} strokeWidth="2" strokeDasharray={`${C * Math.min(1, v)} ${C}`} transform="rotate(-90 8 8)" strokeLinecap="round" />
    </svg>
  )
}

function VxDash({ rows, all, children }) {
  const live = all.filter((c) => c.stage >= 4 && c.stage < 6)
  const budget = all.filter((c) => c.stage < 6).reduce((a, c) => a + c.budget, 0)
  const links = live.reduce((a, c) => a + c.live, 0), linksT = live.reduce((a, c) => a + c.deliverables, 0)
  const views = all.reduce((a, c) => a + c.views, 0)
  const avgM = all.reduce((a, c) => a + margin(c), 0) / all.length
  const usage = [
    ['Open pipeline', budget / 2e8, `${fmt.inr(budget)} / ₹20Cr`],
    ['Links live', links / linksT, `${fmt.compact(links)} / ${fmt.compact(linksT)}`],
    ['Views', views / 5e8, `${fmt.compact(views)} / 500M`],
    ['Avg margin', avgM / 0.3, `${Math.round(avgM * 100)}% / 30%`],
  ]
  const thin = all.filter((c) => c.stage < 6 && margin(c) < 0.18).slice(0, 3)
  const recent = [...all].sort((a, b) => b.updated - a.updated).slice(0, 4)
  return (
    <div className="vx-dash">
      <div className="vx-col">
        <div className="vx-h">Usage</div>
        <div className="vx-panel">
          <div className="vx-panel-h">This quarter</div>
          {usage.map(([l, v, t]) => (
            <div key={l} className="vx-u"><Ring v={v} /><span className="grow ell">{l}</span><span className="mute num">{t}</span></div>
          ))}
        </div>
        <div className="vx-h">Alerts</div>
        <div className="vx-panel">
          {thin.length ? thin.map((c) => (
            <a key={c.id} href={`#/pod/campaigns/${c.id}`} className="vx-u">
              <span className="vx-dot" /><span className="grow ell">{c.client} <span className="mute">margin {Math.round(margin(c) * 100)}%</span></span><ChevronRight size={14} className="mute" />
            </a>
          )) : <div className="vx-u mute">Nothing needs attention</div>}
        </div>
        <div className="vx-h">Recent</div>
        <div className="vx-panel vx-recent">
          {recent.map((c) => (
            <a key={c.id} href={`#/pod/campaigns/${c.id}`} className="vx-r">
              <div className="row" style={{ gap: 8 }}><StageIcon stage={c.stage} /><b className="fw5 ell">{c.client}</b><span className="mute ell">{LAST_EVENT[c.stage](c)}</span></div>
              <div className="row" style={{ gap: 6, marginTop: 8 }}>
                <span className="vx-pill"><Avatar user={c.lead} size={14} />{c.lead.short}</span>
                <span className="vx-pill">{c.pod}</span>
                <span className="vx-pill mono"><span className="dot" style={{ background: c.stage >= 4 ? 'var(--green)' : 'var(--yellow)' }} />{c.code}</span>
              </div>
            </a>
          ))}
        </div>
      </div>
      <div className="vx-col grow">
        <div className="vx-h vx-split">
          {[['Active', (c) => c.stage >= 3 && c.stage < 6, 4], ['Pipeline', (c) => c.stage < 3, 1], ['Complete', (c) => c.stage === 6, 6]].map(([l, t, st]) => (
            <span key={l} className="row" style={{ gap: 6 }}><StageIcon stage={st} size={12} /><span className="fw5">{rows.filter(t).length}</span><span className="mute" style={{ fontWeight: 400 }}>{l}</span></span>
          ))}
        </div>
        {children}
      </div>
    </div>
  )
}

function VxCards({ rows, d, onOpen }) {
  const has = (p) => d.props.includes(p)
  return (
    <div className="vx-cards">
      {rows.map((c) => (
        <a key={c.id} href={`#/pod/campaigns/${c.id}`} className="vx-card" onClick={(e) => { e.preventDefault(); onOpen(c) }}>
          <div className="row" style={{ gap: 12, alignItems: 'flex-start' }}>
            <ClientLogo name={c.client} industry={c.industry} size="lg" />
            <div className="grow" style={{ minWidth: 0 }}>
              <div className="fw6 ell">{c.client} <span className="mute" style={{ fontWeight: 400 }}>× {c.activity}</span></div>
              <div className="mute ell">{has('code') ? c.code + ' · ' : ''}{c.pod}{has('budget') ? ' · ' + fmt.inr(c.budget) : ''}</div>
            </div>
            {c.views > 0 ? (
              <div className="vx-mini"><span className="mute xs">Views</span><span className="num xs fw5">{fmt.compact(c.views)}</span><Sparkline data={c.trend} width={36} height={12} fill={false} color="var(--blue, #3b82f6)" strokeWidth={1.25} /></div>
            ) : (
              <Tip label={stageLabel(c.stage)}><span className="vx-status"><StageIcon stage={c.stage} /></span></Tip>
            )}
          </div>
          <div className="vx-ev ell"><GitCommitHorizontal size={15} />{LAST_EVENT[c.stage](c)}</div>
          <div className="mute row ell" style={{ gap: 6 }}>
            {has('lead') && <><Avatar user={c.lead} size={14} />{c.lead.short} · </>}
            {has('services') && <span>{c.services.map((k) => k.toUpperCase()).join(' · ')}</span>}
            {has('updated') && <span>· {ago(c.updated) === 'now' ? 'just now' : fmt.date(c.updated)}</span>}
          </div>
        </a>
      ))}
    </div>
  )
}

/* ───────── Record peek (Attio) ───────── */
function Peek({ id, onClose }) {
  const s = useStore()
  const last = useRef(null)
  const live = s.campaigns.find((x) => x.id === id)
  if (live) last.current = live
  const c = live || last.current
  const attrs = c ? [
    [CircleDot, 'Stage', <span className="row" style={{ gap: 6 }}><StageIcon stage={c.stage} />{stageLabel(c.stage)}</span>],
    [Hash, 'ID', <span className="mono">{c.code}</span>],
    [Tag, 'Pod', <span className="pod-tag"><span className="pod-dot" data-pod={c.pod} />{c.pod}</span>],
    [User, 'Lead', CELL.lead(c)],
    [Users, 'Team', <AvatarStack users={c.team} size={20} ring="var(--surface)" />],
    [Layers, 'Services', <Svc list={c.services} />],
    [Coins, 'Budget', <span className="num">{fmt.inrFull(c.budget)}</span>],
    [Coins, 'Plan cost', <span className="num">{fmt.inrFull(c.planCost)}</span>],
    [Percent, 'Margin', CELL.margin(c)],
    [Eye, 'Views', CELL.views(c)],
    [CalendarDays, 'Dates', <span>{fmt.date(c.start)} → {fmt.date(c.end || c.start)}</span>],
    [Clock, 'Updated', <span>{ago(c.updated)} ago</span>],
  ] : []
  return (
    <Sheet open={!!live} onClose={onClose} width={460}>
      {c && (
        <div className="peek">
          <div className="row" style={{ gap: 12, paddingRight: 32 }}>
            <ClientLogo name={c.client} industry={c.industry} size="lg" />
            <div className="grow" style={{ minWidth: 0 }}>
              <div className="peek-t ell">{c.client}</div>
              <div className="mute ell">{c.activity}</div>
            </div>
          </div>
          <div className="row" style={{ gap: 6, margin: '16px 0 20px' }}>
            <button className="b sm" onClick={() => { onClose(); go(`/pod/campaigns/${c.id}`) }}><Maximize2 size={13} /> Open</button>
            <button className="b sm" onClick={() => s.patchCampaign(c.id, { pinned: !c.pinned })}><Pin size={13} fill={c.pinned ? 'currentColor' : 'none'} /> {c.pinned ? 'Pinned' : 'Pin'}</button>
          </div>
          <div className="attrs">
            {attrs.map(([I, l, v]) => (
              <div key={l} className="attr"><span className="attr-l"><I size={13} />{l}</span><span className="attr-v">{v}</span></div>
            ))}
          </div>
          <div className="peek-sec">Brief</div>
          <p className="fg2" style={{ lineHeight: 1.6, margin: 0 }}>{c.brief}</p>
          <div className="peek-sec">Reach</div>
          <Sparkline data={c.trend} width={396} height={56} color="var(--green)" />
        </div>
      )}
    </Sheet>
  )
}
