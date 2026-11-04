import { useMemo, useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  Search, Bell, CheckSquare, Megaphone, Building2, Users, Receipt, LayoutGrid, PenTool, BarChart3, ChevronDown, Plus, ArrowUpDown,
  ListFilter, Settings2, Type, CircleDot, User, IndianRupee, Calendar, Hash, Percent, Link2, X, Check, MoreHorizontal, Star,
  ArrowUp, ArrowDown, Mail, Phone, MapPin, Sparkles, Clock, ChevronRight, AtSign, FileText, Lock,
} from 'lucide-react'
import {
  campaigns, campaignById, clients, statuses, statusById, me, team, monthly, months, activity, pending, sketchboards, casDashboards,
  creators, fmt, kbTotal, industries, activeCampaigns, submissions, notifications,
} from '../../data'
import {
  go, parseRoute, ease, Avatar, PlatformIcon, Sparkline, AreaChart, Bars, Meter, CommandMenu, useVariantRoot, useGlobalNav, useHotkeys, Ticker,
} from '../../shared/ui'
import { useInvoices, useSort, Thumb, BoardCover, industryHue, greeting } from '../../shared/state'
import { toast } from 'sonner'
import { Tip, Swap, TextMorph, SlidePanel, ConfirmButton, openNewCampaign } from '../../shared/motion'
import './v3.css'

const B = '/v3'
const statusHue = { proposal: 250, onboarding: 230, live: 150, posting: 290, closing: 75, payment: 45, closed: 260 }

export default function V3({ path }) {
  useVariantRoot('v3', 'light')
  const { page, id } = parseRoute(path)
  const [cmd, setCmd] = useState(false)
  useGlobalNav(B, setCmd)
  const inv = useInvoices()
  const [rows, setRows] = useState(campaigns)
  const setStatus = (cid, s) => { setRows((r) => r.map((c) => (c.id === cid ? { ...c, status: s } : c)));  }

  return (
    <div className="rec">
      <Side page={page} setCmd={setCmd} inv={inv.items.length} />
      <main className="r-main">
        {page === 'dashboard' && <Home inv={inv} />}
        {page === 'campaigns' && <CampaignsTable rows={rows} setStatus={setStatus} openId={id} />}
        {page === 'approvals' && <Invoices inv={inv} />}
        {page === 'creators' && <Creators />}
        {page === 'sketchboards' && <Gallery />}
        {page === 'analytics' && <Reports />}
        {page === 'knowledge' && <Clients openId={id} />}
      </main>
      <CommandMenu open={cmd} setOpen={setCmd} base={B} />
    </div>
  )
}

function Side({ page, setCmd, inv }) {
  const L = ({ id, icon: I, label, count, color }) => (
    <a href={`#${B}/${id}`} className={'r-nav' + (page === id ? ' on' : '')}>
      <span className="r-nav-ic" style={color ? { background: color, color: '#fff' } : undefined}><I size={13} /></span>{label}
      {count != null && <span className="r-nav-n"><Ticker value={count} /></span>}
    </a>
  )
  return (
    <aside className="r-side">
      <button className="r-ws press"><span className="r-ws-logo">W</span><b>WLDD</b><ChevronDown size={13} className="r-dim" /><Avatar user={me} size={22} className="r-ws-me" /></button>
      <button className="r-quick press" onClick={() => setCmd(true)}><Search size={14} /> Search <kbd>⌘K</kbd></button>
      <div className="r-navs">
        <button className="r-nav press" onClick={() => toast('3 unread notifications')}><span className="r-nav-ic"><Bell size={13} /></span>Notifications<span className="r-nav-dot" /></button>
        <L id="dashboard" icon={CheckSquare} label="Home" />
        <div className="r-navh">Records</div>
        <L id="campaigns" icon={Megaphone} label="Campaigns" count={campaigns.length} color="#3d63dd" />
        <L id="knowledge" icon={Building2} label="Clients" count={kbTotal} color="#7c5bd6" />
        <L id="creators" icon={Users} label="Creators" count={creators.length} color="#e5484d" />
        <L id="approvals" icon={Receipt} label="Invoices" count={inv} color="#12a594" />
        <div className="r-navh">Workspace</div>
        <L id="sketchboards" icon={PenTool} label="Sketchboards" />
        <L id="analytics" icon={BarChart3} label="Reports" />
      </div>
    </aside>
  )
}

function ObjHeader({ icon: I, color, title, count, children }) {
  return (
    <header className="r-head">
      <span className="r-obj-ic" style={{ background: color }}><I size={14} /></span>
      <h1>{title}</h1>
      {count != null && <span className="r-dim">{count}</span>}
      <div className="r-head-r">{children}</div>
    </header>
  )
}

/* ─────────── Generic spreadsheet ─────────── */
function Sheet({ cols, rows, onRow, activeId, footer }) {
  const [sorted, sort, toggle] = useSort(rows)
  const [sel, setSel] = useState(new Set())
  const allSel = sel.size === rows.length && rows.length > 0
  return (
    <div className="r-sheet-wrap">
      <table className="r-sheet">
        <thead>
          <tr>
            <th className="r-cb sticky"><span className={'r-box' + (allSel ? ' on' : '')} onClick={() => setSel(allSel ? new Set() : new Set(rows.map((r) => r.id)))}>{allSel && <Check size={10} strokeWidth={3} />}</span></th>
            {cols.map((c, i) => (
              <th key={c.key} style={{ width: c.w, minWidth: c.w }} className={(i === 0 ? 'sticky first ' : '') + (c.align === 'r' ? 'r' : '')}>
                <button className="r-th" onClick={() => c.sort !== false && toggle(c.sortKey || c.key)}>
                  <c.icon size={13} className="r-dim" /> {c.label}
                  {sort.key === (c.sortKey || c.key) && (sort.dir === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />)}
                </button>
              </th>
            ))}
            <th className="r-add"><Plus size={14} className="r-dim" /></th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr key={r.id} className={(activeId === r.id ? 'on ' : '') + (sel.has(r.id) ? 'sel' : '')} onClick={() => onRow?.(r)}>
              <td className="r-cb sticky" onClick={(e) => { e.stopPropagation(); setSel((s) => { const n = new Set(s); n.has(r.id) ? n.delete(r.id) : n.add(r.id); return n }) }}>
                <span className={'r-box' + (sel.has(r.id) ? ' on' : '')}>{sel.has(r.id) && <Check size={10} strokeWidth={3} />}</span>
              </td>
              {cols.map((c, i) => <td key={c.key} className={(i === 0 ? 'sticky first ' : '') + (c.align === 'r' ? 'r' : '')}>{c.render ? c.render(r) : r[c.key]}</td>)}
              <td />
            </tr>
          ))}
        </tbody>
        {footer && (
          <tfoot>
            <tr>
              <td className="r-cb sticky" />
              {cols.map((c, i) => <td key={c.key} className={(i === 0 ? 'sticky first ' : '') + (c.align === 'r' ? 'r' : '')}>{c.agg ? <span className="r-agg"><span>{c.agg[0]}</span> {c.agg[1](rows)}</span> : i === 0 ? <span className="r-agg">{rows.length} rows</span> : null}</td>)}
              <td />
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  )
}

const StatusTag = ({ s, morph }) => <span className="r-tag" style={{ '--h': statusHue[s] }}>{morph ? <TextMorph>{statusById[s].label}</TextMorph> : statusById[s].label}</span>
const ClientChip = ({ name }) => {
  const c = clients.find((x) => x.name === name)
  return <span className="r-rec"><span className="r-rec-logo" style={{ background: `oklch(0.62 0.13 ${industryHue[c?.industry] ?? 200})` }}>{name[0]}</span>{name}</span>
}
const Person = ({ u }) => <span className="r-person"><Avatar user={u} size={18} />{u.name}</span>

function StatusCell({ c, setStatus }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const on = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', on)
    return () => document.removeEventListener('mousedown', on)
  }, [open])
  return (
    <span ref={ref} className="r-statuscell" onClick={(e) => { e.stopPropagation(); setOpen((o) => !o) }}>
      <StatusTag s={c.status} morph /><ChevronDown size={12} className="r-dim r-caret" />
      <AnimatePresence>
        {open && (
          <motion.div className="r-pop" initial={{ opacity: 0, scale: 0.96, y: -2 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.13, ease: ease.out }} style={{ transformOrigin: 'top left' }}>
            {statuses.map((s) => (
              <button key={s.id} onClick={(e) => { e.stopPropagation(); setOpen(false); if (s.id !== c.status) setStatus(c.id, s.id) }}>
                <StatusTag s={s.id} />{s.id === c.status && <Check size={13} style={{ marginLeft: 'auto' }} />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  )
}

/* ─────────── Home ─────────── */
function Home({ inv }) {
  const tasks0 = [
    ...pending.campaigns.map((c) => ({ id: 't-p-' + c.id, text: `Chase proposal sign-off`, rec: c, due: 'Today', who: c.owner })),
    ...pending.closings.map((c) => ({ id: 't-c-' + c.id, text: `Close out & send final report`, rec: c, due: 'Overdue', who: c.owner })),
    ...pending.payments.map((c) => ({ id: 't-$-' + c.id, text: `Follow up on payment`, rec: c, due: 'Tomorrow', who: team[6] })),
  ]
  const [doneSet, setDone] = useState(new Set())
  const toggle = (id) => setDone((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const stats = [['Campaigns executed', monthly.executed, (n) => Math.round(n)], ['Postings', monthly.postings, (n) => fmt.num(Math.round(n))], ['Views', monthly.views, fmt.compact], ['Likes', monthly.likes, fmt.compact], ['Comments', monthly.comments, fmt.compact]]
  return (
    <div className="r-scroll">
      <div className="r-home">
        <h1 className="r-hello">{greeting()}, {me.short}</h1>

        <div className="r-statrow">
          {stats.map(([l, s, f]) => (
            <div key={l} className="r-stat">
              <span className="r-dim">{l}</span>
              <b><Ticker value={s.value} format={f} /></b>
              <div className="r-stat-f"><span className={s.delta >= 0 ? 'r-up' : 'r-down'}>{fmt.pct(s.delta)}</span><Sparkline data={s.series} width={64} height={18} color={s.delta >= 0 ? '#3d63dd' : '#e5484d'} fill={false} /></div>
            </div>
          ))}
        </div>

        <div className="r-home-cols">
          <section className="r-box-card">
            <div className="r-card-h"><CheckSquare size={14} /> Tasks <span className="r-dim">{tasks0.length - doneSet.size}</span><button className="r-btn sm press" style={{ marginLeft: 'auto' }} onClick={() => toast.success('Task created')}><Plus size={13} /> New task</button></div>
            {tasks0.map((t) => {
              const d = doneSet.has(t.id)
              return (
                <div key={t.id} className={'r-task' + (d ? ' done' : '')}>
                  <button className={'r-round' + (d ? ' on' : '')} onClick={() => toggle(t.id)}>
                    <AnimatePresence>{d && <motion.span initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ type: 'spring', duration: 0.3, bounce: 0.4 }}><Check size={10} strokeWidth={3} /></motion.span>}</AnimatePresence>
                  </button>
                  <span className="r-task-t">{t.text}</span>
                  <a href={`#${B}/campaigns/${t.rec.id}`} className="r-rec sm"><Megaphone size={11} />{t.rec.name}</a>
                  <span className={'r-due ' + (t.due === 'Overdue' ? 'late' : '')}>{t.due}</span>
                  <Avatar user={t.who} size={18} />
                </div>
              )
            })}
          </section>
          <section className="r-box-card">
            <div className="r-card-h"><Sparkles size={14} /> Activity</div>
            {activity.slice(0, 11).map((a) => (
              <div key={a.id} className="r-act"><Avatar user={a.user} size={20} /><div><div>{a.text}</div><div className="r-dim r-xs">{fmt.ago(a.at)}</div></div></div>
            ))}
          </section>
        </div>
      </div>
    </div>
  )
}

/* ─────────── Campaigns object ─────────── */
function CampaignsTable({ rows, setStatus, openId }) {
  const [view, setView] = useState('all')
  const [q, setQ] = useState('')
  const filtered = rows.filter((c) => (view === 'all' || (view === 'active' ? ['live', 'posting', 'onboarding'].includes(c.status) : c.status === 'proposal')) && (c.name + c.client).toLowerCase().includes(q.toLowerCase()))
  const open = openId ? rows.find((c) => c.id === openId) : null
  useHotkeys({ escape: () => openId && go(`${B}/campaigns`) }, [openId])
  const cols = [
    { key: 'name', label: 'Campaign', icon: Type, w: 280, render: (c) => <span className="r-namecell"><span className="r-rec-logo sq" style={{ background: `oklch(0.62 0.13 ${statusHue[c.status]})` }}><Megaphone size={10} /></span><b className="ell">{c.name}</b></span> },
    { key: 'status', label: 'Status', icon: CircleDot, w: 170, render: (c) => <StatusCell c={c} setStatus={setStatus} /> },
    { key: 'client', label: 'Client', icon: Building2, w: 170, render: (c) => <ClientChip name={c.client} /> },
    { key: 'owner', label: 'Owner', icon: User, w: 160, sortKey: 'ownerName', render: (c) => <Person u={c.owner} /> },
    { key: 'type', label: 'Type', icon: Hash, w: 140, render: (c) => <span className="r-plain">{c.type}</span> },
    { key: 'budget', label: 'Budget', icon: IndianRupee, w: 120, align: 'r', render: (c) => <span className="r-num">{fmt.inrFull(c.budget)}</span>, agg: ['Sum', (r) => fmt.inr(r.reduce((a, c) => a + c.budget, 0))] },
    { key: 'delivered', label: 'Delivery', icon: Percent, w: 150, render: (c) => <span className="r-prog"><Meter value={c.delivered} max={c.deliverables} color="#3d63dd" height={4} /><span className="r-num">{Math.round((c.delivered / c.deliverables) * 100)}%</span></span> },
    { key: 'views', label: 'Views', icon: Hash, w: 100, align: 'r', render: (c) => <span className="r-num">{fmt.compact(c.views)}</span>, agg: ['Sum', (r) => fmt.compact(r.reduce((a, c) => a + c.views, 0))] },
    { key: 'er', label: 'Eng. rate', icon: Percent, w: 100, align: 'r', render: (c) => <span className="r-num">{c.er}%</span>, agg: ['Avg', (r) => (r.reduce((a, c) => a + c.er, 0) / Math.max(1, r.length)).toFixed(1) + '%'] },
    { key: 'end', label: 'Ends', icon: Calendar, w: 110, render: (c) => <span className="r-plain">{fmt.dateLong(c.end)}</span> },
    { key: 'platforms', label: 'Platforms', icon: Link2, w: 120, sort: false, render: (c) => <span className="r-plats">{c.platforms.map((p) => <PlatformIcon key={p} platform={p} size={13} />)}</span> },
  ]
  return (
    <>
      <ObjHeader icon={Megaphone} color="#3d63dd" title="Campaigns" count={rows.length}>
        <Tip label="New campaign" kbd="C"><button className="r-btn r-btn-p press" onClick={openNewCampaign}><Plus size={14} /> New</button></Tip>
      </ObjHeader>
      <div className="r-viewbar">
        {[['all', 'All campaigns'], ['active', 'Active'], ['proposals', 'Proposals']].map(([v, l]) => (
          <button key={v} className={'r-view' + (view === v ? ' on' : '')} onClick={() => setView(v)}>{l}</button>
        ))}
        <span className="r-sep" />
        <Tip label="Sort"><button className="r-btn sm r-sq press"><ArrowUpDown size={13} /></button></Tip>
        <Tip label="Filter"><button className="r-btn sm r-sq press"><ListFilter size={13} /></button></Tip>
        <div className="r-search"><Search size={13} className="r-dim" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" /></div>
        <span style={{ marginLeft: 'auto' }} /><Tip label="View settings"><button className="r-btn sm r-sq press"><Settings2 size={13} /></button></Tip>
      </div>
      <div className="r-split">
        <Sheet cols={cols} rows={filtered.map((c) => ({ ...c, ownerName: c.owner.name }))} onRow={(c) => go(`${B}/campaigns/${c.id}`)} activeId={openId} footer />
        <AnimatePresence>{open && <RecordSheet key="sheet" c={open} setStatus={setStatus} />}</AnimatePresence>
      </div>
    </>
  )
}

function RecordSheet({ c, setStatus }) {
  const [tab, setTab] = useState('overview')
  const roster = creators.filter((_, i) => (i + c.id.charCodeAt(6)) % 7 === 0).slice(0, 10)
  const subs = submissions.filter((s) => s.campaignId === c.id)
  return (
    <motion.aside className="r-sheetpanel" initial={{ x: 24, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 24, opacity: 0 }} transition={{ duration: 0.24, ease: ease.drawer }}>
      <div className="r-sp-top">
        <span className="r-rec-logo sq lg" style={{ background: `oklch(0.62 0.13 ${statusHue[c.status]})` }}><Megaphone size={16} /></span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h2 className="ell">{c.name}</h2>
          <div className="r-dim r-xs">{c.id} · Campaign</div>
        </div>
        <button className="r-ibtn press" onClick={() => toast('Starred')}><Star size={15} /></button>
        <button className="r-ibtn press"><MoreHorizontal size={15} /></button>
        <button className="r-ibtn press" onClick={() => go(`${B}/campaigns`)}><X size={15} /></button>
      </div>
      <div className="r-sp-tabs">
        {[['overview', 'Overview'], ['creators', `Creators ${roster.length}`], ['content', `Content ${subs.length}`], ['activity', 'Activity']].map(([t, l]) => (
          <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>{l}{tab === t && <motion.i layoutId="r-sp-u" transition={{ type: 'spring', duration: 0.3, bounce: 0 }} />}</button>
        ))}
      </div>
      <div className="r-sp-body">
        {tab === 'overview' && (
          <>
            <div className="r-attrs">
              {[
                [CircleDot, 'Status', <StatusCell c={c} setStatus={setStatus} />],
                [Building2, 'Client', <ClientChip name={c.client} />],
                [User, 'Owner', <Person u={c.owner} />],
                [Users, 'Team', <span className="r-person">{c.collaborators.map((u) => <Avatar key={u.id} user={u} size={18} />)} {c.collaborators.map((u) => u.short).join(', ')}</span>],
                [Hash, 'Type', c.type],
                [IndianRupee, 'Budget', <span className="r-num">{fmt.inrFull(c.budget)}</span>],
                [IndianRupee, 'Spent', <span className="r-num">{fmt.inrFull(c.spent)}</span>],
                [Calendar, 'Window', `${fmt.dateLong(c.start)} → ${fmt.dateLong(c.end)}`],
                [Link2, 'Platforms', <span className="r-plats">{c.platforms.map((p) => <span key={p} className="r-plain"><PlatformIcon platform={p} size={12} /> {p}</span>)}</span>],
              ].map(([I, k, v]) => (
                <div key={k} className="r-attr"><span className="r-attr-k"><I size={13} /> {k}</span><span className="r-attr-v">{v}</span></div>
              ))}
            </div>
            <div className="r-card-h" style={{ marginTop: 20 }}><FileText size={14} /> Brief</div>
            <p className="r-brief">{c.brief}</p>
            <div className="r-card-h" style={{ marginTop: 20 }}><BarChart3 size={14} /> Performance</div>
            <div className="r-perf">
              {[['Views', fmt.compact(c.views)], ['Likes', fmt.compact(c.likes)], ['Comments', fmt.compact(c.comments)], ['ER', c.er + '%']].map(([k, v]) => <div key={k}><span className="r-dim r-xs">{k}</span><b>{v}</b></div>)}
            </div>
            <div style={{ marginTop: 10 }}><Sparkline data={c.trend} width={420} height={48} color="#3d63dd" /></div>
          </>
        )}
        {tab === 'creators' && roster.map((cr) => (
          <div key={cr.id} className="r-cr">
            <Avatar user={cr} size={28} />
            <div style={{ minWidth: 0, flex: 1 }}><div className="ell"><b>{cr.handle}</b></div><div className="r-dim r-xs">{cr.kind} · {cr.city}</div></div>
            <span className="r-plain"><PlatformIcon platform={cr.platform} size={12} /> {fmt.compact(cr.followers)}</span>
            <span className="r-num" style={{ width: 70, textAlign: 'right' }}>{fmt.inr(cr.rate)}</span>
          </div>
        ))}
        {tab === 'content' && (subs.length ? <div className="r-thumbs">{subs.map((s) => <Thumb key={s.id} s={s} />)}</div> : <div className="r-empty">No submissions yet for this campaign.</div>)}
        {tab === 'activity' && (
          <div className="r-timeline">
            {activity.slice(0, 9).map((a) => (
              <div key={a.id} className="r-tl"><Avatar user={a.user} size={20} /><div><div>{a.text.replace(a.campaign.name, 'this campaign')}</div><div className="r-dim r-xs">{fmt.ago(a.at)}</div></div></div>
            ))}
          </div>
        )}
      </div>
    </motion.aside>
  )
}

/* ─────────── Invoices ─────────── */
function Invoices({ inv }) {
  const [open, setOpen] = useState(null)
  const cur = inv.items.find((x) => x.id === open)
  const cols = [
    { key: 'vendor', label: 'Vendor', icon: Building2, w: 220, render: (x) => <span className="r-namecell"><span className="r-rec-logo sq" style={{ background: '#12a594' }}><Receipt size={10} /></span><b className="ell">{x.vendor}</b></span> },
    { key: 'no', label: 'Invoice no', icon: Hash, w: 150, render: (x) => <span className="r-num r-dim">{x.no}</span> },
    { key: 'campaign', label: 'Campaign', icon: Megaphone, w: 240, render: (x) => <span className="r-rec"><Megaphone size={11} />{x.campaign}</span> },
    { key: 'service', label: 'Service', icon: Type, w: 200, render: (x) => <span className="r-plain">{x.service}</span> },
    { key: 'submissions', label: 'Submissions', icon: Hash, w: 130, render: (x) => <span className="r-prog"><Meter value={x.approvedSubs} max={x.submissions} color="#12a594" height={4} /><span className="r-num">{x.approvedSubs}/{x.submissions}</span></span> },
    { key: 'amount', label: 'Amount', icon: IndianRupee, w: 120, align: 'r', render: (x) => <span className="r-num">{fmt.inrFull(x.amount)}</span>, agg: ['Sum', (r) => fmt.inr(r.reduce((a, x) => a + x.amount, 0))] },
    { key: 'date', label: 'Received', icon: Calendar, w: 110, render: (x) => <span className="r-plain">{fmt.date(x.date)}</span> },
    { key: 'actions', label: 'Review', icon: Check, w: 170, sort: false, render: (x) => (
      <span className="r-actions" onClick={(e) => e.stopPropagation()}>
        <button className="r-btn sm press" onClick={() => inv.reject(x.id)}>Reject</button>
        <button className="r-btn sm r-btn-ok press" onClick={() => inv.approve(x.id)}><Check size={12} /> Approve</button>
      </span>
    ) },
  ]
  return (
    <>
      <ObjHeader icon={Receipt} color="#12a594" title="Invoices" count={inv.items.length}>
      </ObjHeader>
      <div className="r-viewbar">
        <button className="r-view on">Awaiting review</button><button className="r-view" onClick={() => toast('Showing approved invoices')}>Approved</button><button className="r-view">Paid</button>
      </div>
      <div className="r-split">
        <Sheet cols={cols} rows={inv.items} onRow={(x) => setOpen(x.id)} activeId={open} footer />
        <AnimatePresence>
          {cur && (
            <motion.aside className="r-sheetpanel" initial={{ x: 24, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 24, opacity: 0 }} transition={{ duration: 0.24, ease: ease.drawer }}>
              <div className="r-sp-top">
                <span className="r-rec-logo sq lg" style={{ background: '#12a594' }}><Receipt size={16} /></span>
                <div style={{ flex: 1, minWidth: 0 }}><h2 className="ell">{cur.vendor}</h2><div className="r-dim r-xs">{cur.no}</div></div>
                <button className="r-ibtn press" onClick={() => setOpen(null)}><X size={15} /></button>
              </div>
              <div className="r-sp-body">
                <div className="r-amount">{fmt.inrFull(cur.amount)}</div>
                <div className="r-attrs">
                  {[[Megaphone, 'Campaign', cur.campaign], [Building2, 'Client', <ClientChip name={cur.client} />], [Type, 'Service', cur.service], [Calendar, 'Due', fmt.dateLong(cur.due)]].map(([I, k, v]) => (
                    <div key={k} className="r-attr"><span className="r-attr-k"><I size={13} /> {k}</span><span className="r-attr-v">{v}</span></div>
                  ))}
                </div>
                <div className="r-thumbs" style={{ marginTop: 16 }}>{submissions.slice(cur.id.length, cur.id.length + 6).map((s) => <Thumb key={s.id} s={s} />)}</div>
                <div className="r-sp-actions">
                  <button className="r-btn press" onClick={() => { inv.reject(cur.id); setOpen(null) }}>Reject</button>
                  <button className="r-btn r-btn-p press" onClick={() => { inv.approve(cur.id); setOpen(null) }}><Check size={14} /> Approve invoice</button>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}

/* ─────────── Creators ─────────── */
function Creators() {
  const [q, setQ] = useState('')
  const rows = creators.filter((c) => (c.handle + (c.name || '') + c.city).toLowerCase().includes(q.toLowerCase()))
  const cols = [
    { key: 'handle', label: 'Handle', icon: AtSign, w: 240, render: (c) => <span className="r-namecell"><Avatar user={c} size={20} /><b className="ell">{c.handle}</b></span> },
    { key: 'kind', label: 'Kind', icon: CircleDot, w: 120, render: (c) => <span className="r-tag" style={{ '--h': c.kind === 'Creator' ? 20 : 280 }}>{c.kind}</span> },
    { key: 'platform', label: 'Platform', icon: Link2, w: 130, render: (c) => <span className="r-plain"><PlatformIcon platform={c.platform} size={13} /> {c.platform}</span> },
    { key: 'followers', label: 'Followers', icon: Users, w: 110, align: 'r', render: (c) => <span className="r-num">{fmt.compact(c.followers)}</span>, agg: ['Sum', (r) => fmt.compact(r.reduce((a, c) => a + c.followers, 0))] },
    { key: 'er', label: 'Eng. rate', icon: Percent, w: 100, align: 'r', render: (c) => <span className="r-num" style={{ color: c.er > 6 ? '#12a594' : undefined }}>{c.er}%</span>, agg: ['Avg', (r) => (r.reduce((a, c) => a + c.er, 0) / Math.max(1, r.length)).toFixed(1) + '%'] },
    { key: 'rate', label: 'Rate card', icon: IndianRupee, w: 110, align: 'r', render: (c) => <span className="r-num">{fmt.inrFull(c.rate)}</span> },
    { key: 'city', label: 'City', icon: MapPin, w: 120, render: (c) => <span className="r-plain">{c.city}</span> },
    { key: 'name', label: 'Contact', icon: User, w: 160, render: (c) => <span className="r-plain r-dim">{c.name || 'Page admin'}</span> },
  ]
  return (
    <>
      <ObjHeader icon={Users} color="#e5484d" title="Creators" count={creators.length}><button className="r-btn r-btn-p press" onClick={() => toast.success('Creator added')}><Plus size={14} /> Add creator</button></ObjHeader>
      <div className="r-viewbar">
        <button className="r-view on">All creators</button><button className="r-view">Meme pages</button><button className="r-view">Shortlisted</button><span className="r-sep" />
        <div className="r-search"><Search size={13} className="r-dim" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search handle, city…" /></div>
      </div>
      <div className="r-split"><Sheet cols={cols} rows={rows} onRow={(c) => toast(c.handle, { description: `${fmt.compact(c.followers)} followers · ${c.er}% ER · ${fmt.inr(c.rate)}/post` })} footer /></div>
    </>
  )
}

/* ─────────── Clients (Knowledge base) ─────────── */
function Clients({ openId }) {
  const [ind, setInd] = useState('All')
  const rows = clients.filter((c) => ind === 'All' || c.industry === ind)
  const healthHue = { Strong: 150, Steady: 230, 'At risk': 25 }
  const cols = [
    { key: 'name', label: 'Client', icon: Building2, w: 220, render: (c) => <span className="r-namecell"><span className="r-rec-logo" style={{ background: `oklch(0.62 0.13 ${industryHue[c.industry]})` }}>{c.name[0]}</span><b className="ell">{c.name}</b></span> },
    { key: 'industry', label: 'Industry', icon: Hash, w: 170, render: (c) => <span className="r-tag" style={{ '--h': industryHue[c.industry] }}>{c.industry}</span> },
    { key: 'campaigns', label: 'Campaigns', icon: Megaphone, w: 120, align: 'r', render: (c) => <span className="r-num">{c.campaigns}</span>, agg: ['Sum', (r) => r.reduce((a, c) => a + c.campaigns, 0)] },
    { key: 'spend', label: 'Lifetime billing', icon: IndianRupee, w: 150, align: 'r', render: (c) => <span className="r-num">{fmt.inr(c.spend)}</span>, agg: ['Sum', (r) => fmt.inr(r.reduce((a, c) => a + c.spend, 0))] },
    { key: 'health', label: 'Health', icon: CircleDot, w: 110, render: (c) => <span className="r-tag" style={{ '--h': healthHue[c.health] }}>{c.health}</span> },
    { key: 'owner', label: 'Account owner', icon: User, w: 170, sortKey: 'ownerName', render: (c) => <Person u={c.owner} /> },
    { key: 'lastCampaign', label: 'Last campaign', icon: Clock, w: 130, render: (c) => <span className="r-plain">{fmt.ago(c.lastCampaign)}</span> },
    { key: 'since', label: 'Client since', icon: Calendar, w: 110, render: (c) => <span className="r-num">{c.since}</span> },
  ]
  return (
    <>
      <ObjHeader icon={Building2} color="#7c5bd6" title="Clients" count={kbTotal}><button className="r-btn r-btn-p press" onClick={() => toast.success('Client created')}><Plus size={14} /> New client</button></ObjHeader>
      <div className="r-viewbar r-viewbar-scroll">
        {['All', ...industries].map((i) => <button key={i} className={'r-view' + (ind === i ? ' on' : '')} onClick={() => setInd(i)}>{i}</button>)}
      </div>
      <div className="r-split"><Sheet cols={cols} rows={rows.map((c) => ({ ...c, ownerName: c.owner.name }))} onRow={(c) => toast(c.name, { description: `${c.campaigns} campaigns · ${fmt.inr(c.spend)} lifetime` })} footer /></div>
    </>
  )
}

/* ─────────── Gallery ─────────── */
function Gallery() {
  return (
    <>
      <ObjHeader icon={PenTool} color="#f76b15" title="Sketchboards" count={sketchboards.length}><button className="r-btn r-btn-p press" onClick={() => toast.success('Board created')}><Plus size={14} /> New board</button></ObjHeader>
      <div className="r-scroll"><div className="r-gallery">
        {sketchboards.map((b, i) => (
          <motion.button key={b.id} className="r-gcard press" onClick={() => toast(b.title)}>
            <BoardCover board={b} height={130} />
            <div className="r-gcard-m">
              <b className="ell">{b.title}</b>
              <div className="r-attrs-mini">
                <span><User size={12} /> <Person u={b.owner} /></span>
                <span><Building2 size={12} /> {b.client ? <ClientChip name={b.client} /> : <span className="r-dim">Internal</span>}</span>
                <span><Hash size={12} /> {b.cards} cards · {fmt.ago(b.updated)}</span>
              </div>
            </div>
          </motion.button>
        ))}
      </div></div>
    </>
  )
}

/* ─────────── Reports ─────────── */
function Reports() {
  const ind = useMemo(() => {
    const m = {}
    clients.forEach((c) => (m[c.industry] = (m[c.industry] || 0) + c.campaigns))
    return Object.entries(m).sort((a, b) => b[1] - a[1])
  }, [])
  const max = ind[0][1]
  return (
    <>
      <ObjHeader icon={BarChart3} color="#0d74ce" title="Reports"><button className="r-btn press"><Calendar size={13} /> Last 12 months</button><button className="r-btn r-btn-p press" onClick={() => toast.success('CAS dashboard created')}><Plus size={14} /> New CAS dashboard</button></ObjHeader>
      <div className="r-scroll"><div className="r-reports">
        <div className="r-rcard span2">
          <div className="r-card-h">Views over time <span className="r-dim">All campaigns</span><b style={{ marginLeft: 'auto' }}><Ticker value={monthly.views.value} format={fmt.compact} /></b></div>
          <AreaChart data={monthly.views.series} labels={months} height={220} color="#3d63dd" format={fmt.compact} />
        </div>
        <div className="r-rcard">
          <div className="r-card-h">Postings per month</div>
          <Bars data={monthly.postings.series} labels={months.map((m) => m[0])} height={170} color="#12a594" format={fmt.num} />
        </div>
        <div className="r-rcard">
          <div className="r-card-h">Campaigns by industry</div>
          {ind.map(([k, v], i) => (
            <div key={k} className="r-hb"><span className="ell">{k}</span><div><i style={{ width: (v / max) * 100 + '%', background: `oklch(0.7 0.12 ${industryHue[k]})` }} /></div><span className="r-num">{v}</span></div>
          ))}
        </div>
        <div className="r-rcard span2">
          <div className="r-card-h">Client dashboards (CAS)</div>
          <div className="r-cas">
            {casDashboards.map((d) => (
              <div key={d.id} className="r-cas-i">
                <ClientChip name={d.client} />
                <span className="ell">{d.title}</span>
                <span className="r-dim r-xs">{d.widgets} widgets · {d.viewers} viewers</span>
                <span className="r-num">{d.kpi}</span>
                {d.locked ? <button className="r-btn sm press" onClick={() => toast.success('Requested', { description: 'Kirsten Menezes' })}><Lock size={12} /> Request</button> : <button className="r-btn sm press" onClick={() => toast(d.title)}>Open</button>}
              </div>
            ))}
          </div>
        </div>
      </div></div>
    </>
  )
}
