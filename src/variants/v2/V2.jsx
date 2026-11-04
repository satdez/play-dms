import { useMemo, useState, useRef, useEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  Search, Plus, ChevronsUpDown, Bell, Sun, Moon, MoreHorizontal, ArrowLeft, ArrowUpRight, Check, X, Calendar, Filter,
  GitBranch, Clock, Copy, ExternalLink, Lock, Eye, Heart, MessageCircle, Megaphone, ChevronDown, Command, Circle,
} from 'lucide-react'
import {
  campaigns, campaignById, clients, statuses, statusById, me, monthly, months, activity, pending, sketchboards, casDashboards,
  creators, fmt, kbTotal, industries, activeCampaigns, submissions, TODAY,
} from '../../data'
import {
  go, parseRoute, ease, Avatar, PlatformIcon, Sparkline, AreaChart, Meter, CommandMenu, useVariantRoot, useGlobalNav, Ticker, toneColor,
} from '../../shared/ui'
import { Tip, Swap, TextMorph, AutoWidth, openNewCampaign } from '../../shared/motion'
import { useInvoices, useSort, Thumb, BoardCover, industryHue } from '../../shared/state'
import { toast } from 'sonner'
import './v2.css'

const B = '/v2'
const tabs = [
  ['dashboard', 'Overview'], ['campaigns', 'Campaigns'], ['approvals', 'Approvals'], ['sketchboards', 'Sketchboards'],
  ['analytics', 'Analytics'], ['knowledge', 'Knowledge Base'],
]

export default function V2({ path }) {
  const [theme, setTheme] = useState('dark')
  useVariantRoot('v2', theme)
  const { page, id } = parseRoute(path)
  const [cmd, setCmd] = useState(false)
  useGlobalNav(B, setCmd)
  const inv = useInvoices()
  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  return (
    <div className="m">
      <TopBar theme={theme} toggleTheme={toggleTheme} setCmd={setCmd} />
      <Tabs page={page} approvals={inv.items.length} />
      <div className="m-body">
        {page === 'dashboard' && <Overview inv={inv} />}
        {page === 'campaigns' && (id ? <CampaignDetail c={campaignById[id]} /> : <Campaigns />)}
        {page === 'approvals' && <Approvals inv={inv} />}
        {page === 'sketchboards' && <Boards />}
        {page === 'analytics' && <Analytics />}
        {page === 'knowledge' && <Knowledge />}
      </div>
      <CommandMenu open={cmd} setOpen={setCmd} base={B} onToggleTheme={toggleTheme} />
    </div>
  )
}

function Logo() {
  return <svg width="22" height="22" viewBox="0 0 24 24"><path d="M12 3l9.5 17h-19z" fill="currentColor" /></svg>
}

function TopBar({ theme, toggleTheme, setCmd }) {
  return (
    <header className="m-top">
      <a href={`#${B}/dashboard`} className="m-logo"><Logo /></a>
      <span className="m-slash">/</span>
      <button className="m-scope press"><span className="m-wlddmark">WLDD</span><ChevronsUpDown size={14} className="m-dim" /></button>
      <div className="m-top-r">
        <button className="m-kbar press" onClick={() => setCmd(true)}><Search size={14} /> <span>Find…</span> <kbd>⌘K</kbd></button>
        <Tip label="Theme"><button className="m-ibtn press" onClick={toggleTheme}>
          <Swap k={theme}>{theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}</Swap>
        </button></Tip>
        <Tip label="Notifications"><button className="m-ibtn press m-bell"><Bell size={15} /><i /></button></Tip>
        <Avatar user={me} size={28} />
      </div>
    </header>
  )
}

/** Vercel-style tabs: a hover highlight that glides between items, plus an active underline. */
function Tabs({ page, approvals }) {
  const [hover, setHover] = useState(null)
  return (
    <nav className="m-tabs" onMouseLeave={() => setHover(null)}>
      {tabs.map(([id, label]) => (
        <a key={id} href={`#${B}/${id}`} className={'m-tab' + (page === id ? ' on' : '')} onMouseEnter={() => setHover(id)}>
          {hover === id && <motion.span layoutId="m-hover" className="m-tab-hover" transition={{ type: 'spring', duration: 0.3, bounce: 0 }} />}
          <span className="m-tab-l">{label}{id === 'approvals' && approvals > 0 && <span className="m-tab-n"><Ticker value={approvals} /></span>}</span>
          {page === id && <motion.span layoutId="m-under" className="m-tab-under" transition={{ type: 'spring', duration: 0.35, bounce: 0 }} />}
        </a>
      ))}
    </nav>
  )
}

const StatusDot = ({ s, label = true }) => {
  const st = statusById[s]
  return (
    <span className="m-status">
      <span className={'m-sdot' + (s === 'live' ? ' pulse' : '')} style={{ background: toneColor[st.tone] }} />
      {label && st.label}
    </span>
  )
}

/* ───────────── Overview ───────────── */
function Overview({ inv }) {
  const [q, setQ] = useState('')
  const [menu, setMenu] = useState(false)
  const list = activeCampaigns.concat(campaigns.filter((c) => c.status === 'closing')).filter((c) => (c.name + c.client).toLowerCase().includes(q.toLowerCase()))
  const usage = [
    ['Proposals', pending.campaigns.length, 12, 'In proposal for 2+ weeks', 'campaigns'],
    ['Closings', pending.closings.length, 10, 'Past posting end date +7 days', 'campaigns'],
    ['Payments', pending.payments.length, 10, 'Payment not received', 'campaigns'],
    ['Screenshots', pending.screenshots.length, 20, 'Awaiting approval', 'approvals'],
    ['Invoices', inv.items.length, 30, 'Awaiting review', 'approvals'],
    ['Submissions', pending.submissions.length, 30, 'Creator content awaiting approval', 'approvals'],
  ]
  return (
    <div className="m-wrap">
      <div className="m-toolbar">
        <div className="m-input"><Search size={14} className="m-dim" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search Campaigns…" /></div>
        <div style={{ position: 'relative' }}>
          <button className="m-btn m-btn-p press" onClick={() => setMenu((m) => !m)}>Add New… <ChevronDown size={14} style={{ rotate: menu ? '180deg' : '0deg', transition: 'rotate 200ms cubic-bezier(.23,1,.32,1)' }} /></button>
          <AnimatePresence>
            {menu && (
              <motion.div className="m-menu" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.1 } }} transition={{ duration: 0.15, ease: ease.out }} style={{ transformOrigin: 'top right' }}>
                {['Campaign', 'Sketchboard', 'Dashboard', 'Client'].map((x) => (
                  <button key={x} onClick={() => { setMenu(false); x === 'Campaign' ? openNewCampaign() : toast.success(`${x} created`) }}>{x}</button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="m-ov">
        <aside className="m-ov-side">
          <div className="m-card">
            <div className="m-card-h"><span>Pending</span></div>
            {usage.map(([l, n, max, hint, to]) => (
              <a key={l} href={`#${B}/${to}`} className="m-usage">
                <Ring value={n} max={max} />
                <Tip label={hint} side="right"><span>{l}</span></Tip>
                <span className="m-mono"><Ticker value={n} /></span>
              </a>
            ))}
          </div>
          <div className="m-card">
            <div className="m-card-h"><span>November</span></div>
            {[['Campaigns executed', monthly.executed, (n) => Math.round(n)], ['Postings', monthly.postings, (n) => fmt.num(Math.round(n))], ['Views', monthly.views, fmt.compact], ['Likes', monthly.likes, fmt.compact], ['Comments', monthly.comments, fmt.compact]].map(([l, s, f]) => (
              <div key={l} className="m-kv">
                <span className="m-dim">{l}</span>
                <span className="m-kv-r"><Sparkline data={s.series} width={56} height={16} fill={false} strokeWidth={1.25} /><b><Ticker value={s.value} format={f} /></b></span>
              </div>
            ))}
          </div>
          <div className="m-card">
            <div className="m-card-h"><span>Activity</span></div>
            {activity.slice(0, 6).map((a) => (
              <div key={a.id} className="m-act"><Avatar user={a.user} size={18} /><span>{a.text}</span><span className="m-dim m-sm">{fmt.agoShort(a.at)}</span></div>
            ))}
          </div>
        </aside>

        <section>
          <div className="m-sec-h">Active <span className="m-dim">{list.length}</span></div>
          <div className="m-grid">
            {list.map((c) => (
              <a key={c.id} href={`#${B}/campaigns/${c.id}`} className="m-proj">
                <div className="m-proj-h">
                  <span className="m-proj-ic" style={{ background: `oklch(0.6 0.13 ${industryHue[c.industry]})` }}>{c.client[0]}</span>
                  <div className="m-proj-t">
                    <b>{c.name}</b>
                    <span className="m-dim m-sm">{c.client}</span>
                  </div>
                </div>
                <Tip label={`${c.delivered} of ${c.deliverables} posted`} side="top"><span className="m-proj-meter"><Meter value={c.delivered} max={c.deliverables} color="var(--fg)" height={3} /></span></Tip>
                <div className="m-proj-f">
                  <StatusDot s={c.status} />
                  <span className="m-dim m-sm">{fmt.agoShort(c.updated)}</span>
                  <Avatar user={c.owner} size={18} />
                </div>
              </a>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function Ring({ value, max, size = 16 }) {
  const r = 6, C = 2 * Math.PI * r
  const p = Math.min(1, value / max)
  const color = p > 0.75 ? '#f5a524' : 'var(--accent-ring)'
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" style={{ rotate: '-90deg', flex: 'none' }}>
      <circle cx="8" cy="8" r={r} fill="none" stroke="var(--border)" strokeWidth="2" />
      <circle cx="8" cy="8" r={r} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeDasharray={C}
        strokeDashoffset={C * (1 - p)} style={{ transition: 'stroke-dashoffset 500ms cubic-bezier(.23,1,.32,1), stroke 200ms' }} />
    </svg>
  )
}

/* ───────────── Campaigns (deployments list) ───────────── */
function Campaigns() {
  const [q, setQ] = useState('')
  const [st, setSt] = useState(new Set())
  const [menu, setMenu] = useState(false)
  const rows = campaigns.filter((c) => (!st.size || st.has(c.status)) && (c.name + c.client + c.id).toLowerCase().includes(q.toLowerCase()))
  return (
    <div className="m-wrap">
      <div className="m-pagehead">
        <h1>Campaigns</h1>
      </div>
      <div className="m-toolbar">
        <div className="m-input"><Search size={14} className="m-dim" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, client or ID…" /></div>
        <Tip label="Date range"><button className="m-btn m-sq press"><Calendar size={14} /></button></Tip>
        <div style={{ position: 'relative' }}>
          <button className="m-btn press" onClick={() => setMenu((m) => !m)}><Filter size={14} /> {st.size ? <Ticker value={st.size} /> : 'Status'} <ChevronDown size={14} className="m-dim" /></button>
          <AnimatePresence>
            {menu && (
              <motion.div className="m-menu" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.13, ease: ease.out }} style={{ transformOrigin: 'top right' }}>
                {statuses.map((s) => (
                  <button key={s.id} onClick={() => setSt((x) => { const n = new Set(x); n.has(s.id) ? n.delete(s.id) : n.add(s.id); return n })}>
                    <span className={'m-check' + (st.has(s.id) ? ' on' : '')}>{st.has(s.id) && <Check size={11} strokeWidth={3} />}</span>
                    <StatusDot s={s.id} />
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className="m-table">
        {rows.map((c) => (
          <a key={c.id} href={`#${B}/campaigns/${c.id}`} className="m-dep">
            <div className="m-dep-a">
              <b className="ell">{c.name}</b>
              <span className="m-dim m-sm">{c.client}</span>
            </div>
            <div className="m-dep-b">
              <StatusDot s={c.status} />
              
            </div>
            <div className="m-dep-c">
              <Tip label={`${c.delivered}/${c.deliverables} posted`} side="top"><span className="m-proj-meter"><Meter value={c.delivered} max={c.deliverables} color="var(--fg)" height={3} /></span></Tip>
            </div>
            <div className="m-dep-d">
              <span className="m-dim m-sm">{fmt.agoShort(c.updated)}</span>
              <Avatar user={c.owner} size={22} />
            </div>
          </a>
        ))}
        {!rows.length && <div className="m-empty">No campaigns found.</div>}
      </div>
    </div>
  )
}

function CampaignDetail({ c }) {
  if (!c) return <div className="m-wrap"><div className="m-empty">Campaign not found.</div></div>
  return <CampaignDetailInner c={c} />
}
function CampaignDetailInner({ c }) {
  const subs = submissions.filter((s) => s.campaignId === c.id)
  const gallery = (subs.length ? subs : submissions).slice(0, 3)
  const log = useMemo(() => {
    const lines = []
    let t = new Date(c.start)
    const add = (m, lvl = 'info') => { lines.push({ t: new Date(t), m, lvl }); t = new Date(t.getTime() + 37 * 60e3 * (1 + (lines.length % 5))) }
    add(`Campaign ${c.id} created by ${c.owner.name}`)
    add(`Brief approved by ${c.client} (v3)`)
    add(`Onboarded ${c.creators} creators across ${c.platforms.join(', ')}`)
    add(`Content calendar locked — ${c.deliverables} deliverables`)
    creators.slice(c.id.charCodeAt(5) % 20, (c.id.charCodeAt(5) % 20) + 7).forEach((cr, i) => {
      add(`${cr.handle} posted ${['Reel', 'Story', 'Static post', 'Carousel'][i % 4]} → ${fmt.compact(cr.followers * 0.4)} reach`, i === 3 ? 'warn' : 'info')
    })
    if (c.status === 'closing' || c.status === 'payment' || c.status === 'closed') add('Posting window ended. Generating final report…')
    if (c.status === 'closed') add('Payment received. Campaign closed ✓', 'ok')
    return lines
  }, [c])
  return (
    <div className="m-wrap">
      <a href={`#${B}/campaigns`} className="m-back"><ArrowLeft size={14} /> Campaigns</a>
      <div className="m-detail-h">
        <div>
          <h1>{c.name}</h1>
          <div className="m-dim">{c.client}</div>
        </div>
        <div className="m-detail-actions">
          <Tip label="Copy link"><button className="m-btn m-sq press" onClick={() => toast('Link copied')}><Copy size={14} /></button></Tip>
          <Tip label="Client report"><button className="m-btn m-sq press" onClick={() => toast('Opening report')}><ExternalLink size={14} /></button></Tip>
          <button className="m-btn m-btn-p press" onClick={() => toast.success('Status updated', { description: 'Moved to the next stage' })}>Advance stage</button>
        </div>
      </div>

      <div className="m-dcard">
        <div className="m-preview">
          {gallery.map((s) => <Thumb key={s.id} s={s} radius={6} />)}
        </div>
        <div className="m-dgrid">
          <div><span className="m-lbl">Status</span><StatusDot s={c.status} /></div>
          <div><span className="m-lbl">Created</span><span>{fmt.dateLong(c.start)} by {c.owner.short}</span></div>
          <div><span className="m-lbl">Posting window</span><span><Clock size={13} className="m-dim" /> {fmt.date(c.start)} – {fmt.date(c.end)}</span></div>
          <div><span className="m-lbl">Budget</span><span className="m-mono">{fmt.inrFull(c.budget)}</span></div>
          <div className="m-span2"><span className="m-lbl">Delivery</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Meter value={c.delivered} max={c.deliverables} color="var(--fg)" height={4} /><span className="m-mono m-sm" style={{ whiteSpace: 'nowrap' }}>{c.delivered}/{c.deliverables}</span></div>
          </div>
          <div><span className="m-lbl">Platforms</span><span style={{ display: 'flex', gap: 8 }}>{c.platforms.map((p) => <PlatformIcon key={p} platform={p} size={14} />)}</span></div>
          <div><span className="m-lbl">Team</span><span style={{ display: 'flex', gap: 4 }}>{[c.owner, ...c.collaborators].map((u) => <Avatar key={u.id} user={u} size={20} />)}</span></div>
          <div className="m-span2 m-metrics">
            {[[Eye, 'Views', c.views], [Heart, 'Likes', c.likes], [MessageCircle, 'Comments', c.comments]].map(([I, l, v]) => (
              <div key={l}><span className="m-lbl"><I size={12} /> {l}</span><b><Ticker value={v} format={fmt.compact} /></b></div>
            ))}
            <div><span className="m-lbl">Eng. rate</span><b>{c.er}%</b></div>
          </div>
        </div>
      </div>

      <div className="m-sec-h" style={{ marginTop: 32 }}>Log</div>
      <div className="m-log">
        {log.map((l, i) => (
          <motion.div key={i} className={'m-log-l ' + l.lvl}>
            <span className="m-log-t">{l.t.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            <span>{l.m}</span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

/* ───────────── Approvals (bulk select) ───────────── */
function Approvals({ inv }) {
  const [sel, setSel] = useState(new Set())
  const items = inv.items
  const all = items.length && sel.size === items.length
  const toggle = (id) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const bulk = (v) => { sel.forEach((id) => (v === 'a' ? inv.approve(id) : inv.reject(id))); setSel(new Set()) }
  const total = [...sel].reduce((a, id) => a + (items.find((x) => x.id === id)?.amount || 0), 0)
  return (
    <div className="m-wrap">
      <div className="m-pagehead">
        <h1>Approvals</h1>
      </div>
      <div className="m-table">
        <div className="m-tr m-th">
          <button className={'m-check' + (all ? ' on' : '')} onClick={() => setSel(all ? new Set() : new Set(items.map((x) => x.id)))}>{all ? <Check size={11} strokeWidth={3} /> : null}</button>
          <span>Vendor</span><span>Invoice</span><span>Campaign</span><span>Service</span><span>Submissions</span><span className="r">Amount</span><span>Date</span><span />
        </div>
        <AnimatePresence initial={false}>
          {items.map((x) => (
            <motion.div key={x.id} className={'m-tr' + (sel.has(x.id) ? ' sel' : '')} layout="position"
              exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2, ease: ease.out }} onClick={() => toggle(x.id)}>
              <span className={'m-check' + (sel.has(x.id) ? ' on' : '')}>{sel.has(x.id) && <Check size={11} strokeWidth={3} />}</span>
              <b className="ell">{x.vendor}</b>
              <span className="m-mono m-dim">{x.no}</span>
              <a className="ell m-link" href={`#${B}/campaigns/${x.campaignId}`} onClick={(e) => e.stopPropagation()}>{x.campaign}</a>
              <span className="ell m-dim">{x.service}</span>
              <span className="m-subs"><Meter value={x.approvedSubs} max={x.submissions} color="var(--fg)" height={3} /> <span className="m-mono m-sm">{x.approvedSubs}/{x.submissions}</span></span>
              <span className="m-mono r">{fmt.inrFull(x.amount)}</span>
              <span className="m-dim m-sm">{fmt.date(x.date)}</span>
              <span className="m-row-act" onClick={(e) => e.stopPropagation()}>
                <Tip label="Reject"><button className="m-ibtn sm press" onClick={() => inv.reject(x.id)}><X size={14} /></button></Tip>
                <Tip label="Approve"><button className="m-ibtn sm m-ok press" onClick={() => inv.approve(x.id)}><Check size={14} /></button></Tip>
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
        {!items.length && <div className="m-empty">All caught up</div>}
      </div>

      <AnimatePresence>
        {sel.size > 0 && (
          <motion.div className="m-bulk" initial={{ y: 16, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 16, opacity: 0, scale: 0.98 }} transition={{ duration: 0.22, ease: ease.out }}>
            <span className="m-bulk-n"><b><Ticker value={sel.size} /></b><span className="m-dim">·</span><span className="m-mono"><Ticker value={total} format={(n) => fmt.inrFull(Math.round(n))} /></span></span>
            <button className="m-ghost press" onClick={() => setSel(new Set())}>Clear</button>
            <button className="m-btn press" onClick={() => bulk('r')}><X size={14} /> Reject</button>
            <button className="m-btn m-btn-p press" onClick={() => bulk('a')}><Check size={14} /> Approve</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ───────────── Boards ───────────── */
function Boards() {
  return (
    <div className="m-wrap">
      <div className="m-pagehead m-pagehead-row">
        <h1>Sketchboards</h1>
        <button className="m-btn m-btn-p press" onClick={() => toast.success('Board created')}><Plus size={14} /> New</button>
      </div>
      <div className="m-grid">
        {sketchboards.map((b, i) => (
          <motion.button key={b.id} className="m-proj m-board press" onClick={() => toast(b.title)}>
            <div className="m-board-cover"><BoardCover board={b} height={140} dark={document.documentElement.dataset.theme === 'dark'} /></div>
            <div className="m-board-m">
              <b className="ell">{b.title}</b>
              <div className="m-dim m-sm" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <Avatar user={b.owner} size={16} /> {fmt.agoShort(b.updated)}
              </div>
              
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  )
}

/* ───────────── Analytics ───────────── */
function Analytics() {
  const [k, setK] = useState('views')
  const kpis = [['views', 'Views', monthly.views, fmt.compact], ['likes', 'Likes', monthly.likes, fmt.compact], ['comments', 'Comments', monthly.comments, fmt.compact], ['postings', 'Postings', monthly.postings, fmt.num]]
  const cur = kpis.find((x) => x[0] === k)
  const byClient = useMemo(() => {
    const m = {}
    campaigns.forEach((c) => (m[c.client] = (m[c.client] || 0) + c.views))
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 8)
  }, [])
  const byPlatform = [['Instagram', 61], ['YouTube', 22], ['X', 9], ['LinkedIn', 5], ['Snapchat', 3]]
  const byFormat = [['Reel', 44], ['Static post', 21], ['Story', 16], ['Carousel', 11], ['Short', 8]]
  const Panel = ({ title, rows, fmtv }) => {
    const max = rows[0][1]
    return (
      <div className="m-card m-panel">
        <div className="m-card-h"><span>{title}</span></div>
        {rows.map(([l, v], i) => (
          <div key={l} className="m-hbar">
            <i style={{ width: (v / max) * 100 + '%' }} />
            <span className="ell">{title === 'Platforms' && <PlatformIcon platform={l} size={12} />} {l}</span>
            <span className="m-mono">{fmtv(v)}</span>
          </div>
        ))}
      </div>
    )
  }
  return (
    <div className="m-wrap">
      <div className="m-pagehead m-pagehead-row">
        <h1>Analytics</h1>
        <button className="m-btn press"><Calendar size={14} /> 12M</button>
      </div>
      <div className="m-card m-chartcard">
        <div className="m-kpis">
          {kpis.map(([id, l, s, f]) => (
            <button key={id} className={'m-kpi' + (k === id ? ' on' : '')} onClick={() => setK(id)}>
              <span className="m-dim m-sm">{l}</span>
              <b><Ticker value={s.value} format={f} /></b>
              <span className={'m-sm ' + (s.delta >= 0 ? 'm-up' : 'm-down')}>{fmt.pct(s.delta)}</span>
            </button>
          ))}
        </div>
        <div className="m-chart-in"><Swap k={k}><AreaChart data={cur[2].series} labels={months} height={240} color="var(--fg)" format={cur[3]} /></Swap></div>
      </div>
      <div className="m-three">
        <Panel title="Top clients" rows={byClient} fmtv={fmt.compact} />
        <Panel title="Platforms" rows={byPlatform} fmtv={(v) => v + '%'} />
        <Panel title="Content formats" rows={byFormat} fmtv={(v) => v + '%'} />
      </div>
      <div className="m-sec-h" style={{ marginTop: 32 }}>CAS dashboards</div>
      <div className="m-grid">
        {casDashboards.map((d) => (
          <div key={d.id} className="m-proj">
            <div className="m-proj-h">
              <span className="m-proj-ic" style={{ background: 'var(--fg)', color: 'var(--bg)' }}>{d.locked ? <Lock size={13} /> : d.client[0]}</span>
              <div className="m-proj-t"><b>{d.title}</b><span className="m-dim m-sm">{d.client}</span></div>
            </div>
            <div className="m-proj-f">
              <span className="m-sm">{d.kpi}</span>
              {d.locked
                ? <button className="m-btn sm press" style={{ marginLeft: 'auto' }} onClick={() => toast.success('Requested', { description: 'Kirsten Menezes' })}>Request</button>
                : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ───────────── Knowledge base ───────────── */
function Knowledge() {
  const [q, setQ] = useState('')
  const [ind, setInd] = useState('All')
  const rows = clients.filter((c) => (ind === 'All' || c.industry === ind) && c.name.toLowerCase().includes(q.toLowerCase()))
  const [sorted, sort, toggle] = useSort(rows, { key: 'campaigns', dir: 'desc' })
  const H = ({ k, children, r }) => <button className={'m-thb' + (r ? ' r' : '') + (sort.key === k ? ' on' : '')} onClick={() => toggle(k)}>{children} {sort.key === k && (sort.dir === 'asc' ? '↑' : '↓')}</button>
  return (
    <div className="m-wrap">
      <div className="m-pagehead"><h1>Knowledge Base <span className="m-dim" style={{ fontWeight: 400 }}>{kbTotal}</span></h1></div>
      <div className="m-toolbar"><div className="m-input"><Search size={14} className="m-dim" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search clients or campaigns…" /></div></div>
      <div className="m-pills">
        {['All', ...industries].map((i) => (
          <button key={i} className={'m-pill' + (ind === i ? ' on' : '')} onClick={() => setInd(i)}>
            {ind === i && <motion.span layoutId="m-pill" className="m-pill-bg" transition={{ type: 'spring', duration: 0.3, bounce: 0 }} />}
            <span>{i}</span>
          </button>
        ))}
      </div>
      <div className="m-table">
        <div className="m-kb m-th"><H k="name">Client</H><H k="industry">Industry</H><H k="campaigns" r>Campaigns</H><H k="spend" r>Billing</H><H k="lastCampaign">Last active</H><span>Owner</span></div>
        {sorted.map((c) => (
          <div key={c.id} className="m-kb" onClick={() => toast(c.name, { description: `${c.campaigns} campaigns · ${c.industry}` })}>
            <b>{c.name}</b>
            <span><span className="m-ind"><i style={{ background: `oklch(0.68 0.13 ${industryHue[c.industry]})` }} />{c.industry}</span></span>
            <span className="m-mono r">{c.campaigns}</span>
            <span className="m-mono r">{fmt.inr(c.spend)}</span>
            <span className="m-dim">{fmt.ago(c.lastCampaign)}</span>
            <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Avatar user={c.owner} size={20} /><span className="m-dim m-sm">{c.owner.short}</span></span>
          </div>
        ))}
      </div>
    </div>
  )
}
