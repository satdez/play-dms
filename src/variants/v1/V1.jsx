import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  Inbox, LayoutGrid, Megaphone, CheckCheck, PenTool, BarChart3, BookOpen, Search, SquarePen, Star, ChevronDown, ChevronRight,
  Users, HelpCircle, Bell, X, ArrowUpRight, SlidersHorizontal, ListFilter, Rows3, Columns3, Plus, Lock, Clock, IndianRupee,
  Check, CornerDownLeft, ArrowUp, ArrowDown, Building2, MoreHorizontal, Link2, Calendar, Eye, Heart, MessageCircle, Target,
  FileText, Camera, Sparkles, TrendingUp, TrendingDown,
} from 'lucide-react'
import {
  campaigns, campaignById, clients, statuses, statusById, team, me, monthly, months, activity, pending, sketchboards,
  casDashboards, creators, notifications, fmt, kbTotal, industries, TODAY, activeCampaigns,
} from '../../data'
import {
  go, parseRoute, ease, Avatar, AvatarStack, StatusIcon, PriorityIcon, PlatformIcon, Sparkline, AreaChart, Bars, Meter,
  CommandMenu, useVariantRoot, useGlobalNav, useHotkeys, Ticker, toneColor,
} from '../../shared/ui'
import { useInvoices, useSubmissions, useStars, useSort, Thumb, BoardCover, industryHue, greeting } from '../../shared/state'
import { toast } from 'sonner'
import { Tip, Swap, TextMorph, ConfirmButton, SlidePanel, openNewCampaign } from '../../shared/motion'
import './v1.css'

const B = '/v1'

export default function V1({ path }) {
  useVariantRoot('v1', 'dark')
  const { page, id } = parseRoute(path)
  const [cmd, setCmd] = useState(false)
  useGlobalNav(B, setCmd)
  const [stars, toggleStar] = useStars()
  const inv = useInvoices()
  const subs = useSubmissions()

  return (
    <div className="g">
      <Sidebar page={page} stars={stars} setCmd={setCmd} counts={{ approvals: inv.items.length, inbox: 12 }} />
      <main className="g-main">
        {page === 'dashboard' && <Dashboard inv={inv} subs={subs} />}
        {page === 'campaigns' && <Campaigns id={id} stars={stars} toggleStar={toggleStar} />}
        {page === 'approvals' && <Approvals inv={inv} subs={subs} />}
        {page === 'sketchboards' && <Sketchboards />}
        {page === 'analytics' && <Analytics />}
        {page === 'knowledge' && <Knowledge id={id} />}
      </main>
      <CommandMenu open={cmd} setOpen={setCmd} base={B} />
    </div>
  )
}

/* ───────────────────────── Sidebar ───────────────────────── */
function Sidebar({ page, stars, setCmd, counts }) {
  const [teamsOpen, setTeamsOpen] = useState(true)
  const nav = [
    { id: 'dashboard', label: 'Home', icon: LayoutGrid },
    { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
    { id: 'approvals', label: 'Approvals', icon: CheckCheck, count: counts.approvals },
    { id: 'sketchboards', label: 'Sketchboards', icon: PenTool },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'knowledge', label: 'Knowledge base', icon: BookOpen },
  ]
  const favs = campaigns.filter((c) => stars.has(c.id))
  return (
    <aside className="g-side">
      <div className="g-ws">
        <button className="g-ws-btn press">
          <span className="g-logo">W</span>
          <span>WLDD</span>
          <ChevronDown size={13} className="dim" />
        </button>
        <div className="g-ws-actions">
          <Tip label="Search" kbd="⌘K"><button className="g-icon-btn press" onClick={() => setCmd(true)}><Search size={15} /></button></Tip>
          <Tip label="New campaign" kbd="C"><button className="g-icon-btn g-new press" onClick={openNewCampaign}><SquarePen size={15} /></button></Tip>
        </div>
      </div>

      <nav className="g-nav">
        <button className="g-item press" onClick={() => toast('12 unread')}>
          <Inbox size={15} /> Inbox <span className="g-count"><Ticker value={counts.inbox} /></span>
        </button>
        {nav.map((n) => (
          <a key={n.id} href={`#${B}/${n.id}`} className={'g-item' + (page === n.id ? ' on' : '')}>
            <n.icon size={15} /> {n.label}
            {n.count ? <span className="g-count"><Ticker value={n.count} /></span> : null}
          </a>
        ))}

        <div className="g-sec">Favourites</div>
        <AnimatePresence initial={false}>
          {favs.map((c) => (
            <motion.a key={c.id} href={`#${B}/campaigns/${c.id}`} className="g-item g-fav"
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 28 }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2, ease: ease.out }}>
              <StatusIcon status={c.status} size={13} /> <span className="ell">{c.name}</span>
            </motion.a>
          ))}
        </AnimatePresence>
      </nav>

      <div className="g-side-foot">
        <div className="g-me">
          <Avatar user={me} size={22} />
          <span>{me.short}</span>
          <Tip label="Help" side="top"><button className="g-icon-btn press" style={{ marginLeft: 'auto' }}><HelpCircle size={15} /></button></Tip>
        </div>
      </div>
    </aside>
  )
}

/* ───────────────────────── Shared header ───────────────────────── */
function Header({ crumbs, children, tabs, tab, setTab }) {
  return (
    <header className="g-head">
      <div className="g-crumbs">
        {crumbs.map((c, i) => (
          <span key={i} className={i === crumbs.length - 1 ? 'cur' : ''}>
            {i > 0 && <ChevronRight size={12} className="dim" />}
            {c}
          </span>
        ))}
      </div>
      {tabs && (
        <div className="g-tabs">
          {tabs.map((t) => (
            <button key={t.id} className={'g-tab' + (tab === t.id ? ' on' : '')} onClick={() => setTab(t.id)}>
              {tab === t.id && <motion.span layoutId={'g-tab-' + crumbs[0]} className="g-tab-bg" transition={{ type: 'spring', duration: 0.28, bounce: 0 }} />}
              <span>{t.label}</span>{t.count != null && <span className="g-tab-n"><Ticker value={t.count} /></span>}
            </button>
          ))}
        </div>
      )}
      <div className="g-head-r">{children}</div>
    </header>
  )
}

/* ───────────────────────── Dashboard ───────────────────────── */
function Dashboard({ inv, subs }) {
  const queues = [
    { label: 'Proposals', n: pending.campaigns.length, sub: 'In proposal for 2+ weeks', icon: FileText, to: 'campaigns', tone: 'gray', items: pending.campaigns.slice(0, 2).map((c) => c.name) },
    { label: 'Closings', n: pending.closings.length, sub: 'Past posting end date +7d', icon: Clock, to: 'campaigns', tone: 'amber', items: pending.closings.slice(0, 2).map((c) => c.name) },
    { label: 'Payments', n: pending.payments.length, sub: 'Payment not received yet', icon: IndianRupee, to: 'campaigns', tone: 'orange', items: pending.payments.slice(0, 2).map((c) => c.name) },
    { label: 'Screenshots', n: subs.items.filter((s) => s.kind === 'screenshot').length, sub: 'Awaiting approval', icon: Camera, to: 'approvals', tone: 'blue', items: subs.items.filter((s) => s.kind === 'screenshot').slice(0, 2).map((s) => s.creator.handle) },
    { label: 'Invoices', n: inv.items.length, sub: 'Awaiting finance review', icon: CheckCheck, to: 'approvals', tone: 'violet', items: inv.items.slice(0, 2).map((i) => i.vendor) },
    { label: 'Submissions', n: subs.items.filter((s) => s.kind === 'content').length, sub: 'Awaiting approval', icon: Sparkles, to: 'approvals', tone: 'green', items: subs.items.filter((s) => s.kind === 'content').slice(0, 2).map((s) => s.creator.handle) },
  ]
  const total = queues.reduce((a, q) => a + q.n, 0)
  const stats = [
    ['Executed', monthly.executed, (n) => Math.round(n)],
    ['Postings', monthly.postings, (n) => fmt.num(Math.round(n))],
    ['Views', monthly.views, fmt.compact],
    ['Likes', monthly.likes, fmt.compact],
    ['Comments', monthly.comments, fmt.compact],
  ]
  return (
    <>
      <Header crumbs={['Home']}>
        <Tip label="New campaign" kbd="C"><button className="g-btn g-btn-p press" onClick={openNewCampaign}><Plus size={14} /> New</button></Tip>
      </Header>
      <div className="g-scroll">
        <div className="g-page">
          <div className="g-hello">
            <h1>{greeting()}, {me.short}</h1>
          </div>

          <section className="g-queues">
            {queues.map((q, i) => (
              <motion.a key={q.label} href={`#${B}/${q.to}`} className="g-queue">
                <div className="g-queue-top">
                  <q.icon size={14} style={{ color: toneColor[q.tone] }} />
                  <Tip label={q.sub}><span>{q.label}</span></Tip>
                  <ArrowUpRight size={13} className="g-queue-arrow" />
                </div>
                <div className="g-queue-n"><Ticker value={q.n} /></div>
                <div className="g-queue-items">
                  {q.items.map((t) => <span key={t} className="ell">{t}</span>)}
                </div>
              </motion.a>
            ))}
          </section>

          <div className="g-sec-h"><h2>November</h2></div>
          <section className="g-stats">
            {stats.map(([label, s, f]) => (
              <div key={label} className="g-stat">
                <div className="dim sm">{label}</div>
                <div className="g-stat-row">
                  <span className="g-stat-v"><Ticker value={s.value} format={f} /></span>
                  <span className={'g-delta ' + (s.delta >= 0 ? 'up' : 'down')}>{s.delta >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}{fmt.pct(s.delta)}</span>
                </div>
                <Sparkline data={s.series} width={160} height={28} color={s.delta >= 0 ? '#7c7ff2' : '#eb5757'} />
              </div>
            ))}
          </section>

          <div className="g-cols">
            <section>
              <div className="g-sec-h"><h2>Active campaigns</h2><span className="dim sm">{activeCampaigns.length}</span><a className="g-link" href={`#${B}/campaigns`}>View all</a></div>
              <div className="g-list">
                {activeCampaigns.slice(0, 9).map((c) => <CampaignRow key={c.id} c={c} compact />)}
              </div>
            </section>
            <section>
              <div className="g-sec-h"><h2>Activity</h2></div>
              <div className="g-feed">
                {activity.slice(0, 12).map((a) => (
                  <div key={a.id} className="g-feed-i">
                    <Avatar user={a.user} size={18} />
                    <div><span>{a.text}</span> <span className="dim">· {fmt.agoShort(a.at)}</span></div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  )
}

/* ───────────────────────── Campaign row ───────────────────────── */
function CampaignRow({ c, compact, focused, onClick, starred, onStar }) {
  return (
    <a href={`#${B}/campaigns/${c.id}`} className={'g-row' + (focused ? ' focus' : '')} onClick={onClick} data-id={c.id}>
      {!compact && <span className="g-row-pri"><PriorityIcon priority={c.priority} /></span>}
      <span className="g-row-id">{c.id}</span>
      <StatusIcon status={c.status} />
      <span className="g-row-title ell">{c.name}</span>
      {starred && <Star size={12} className="g-star on" fill="currentColor" />}
      <span className="g-row-fill" />
      {!compact && (
        <span className="g-row-plat">{c.platforms.map((p) => <PlatformIcon key={p} platform={p} size={12} />)}</span>
      )}
      <span className="g-chip"><span className="g-dot" style={{ background: `oklch(0.7 0.12 ${industryHue[c.industry] ?? 200})` }} />{c.client}</span>
      {!compact && (
        <span className="g-row-prog" title={`${c.delivered}/${c.deliverables} deliverables`}>
          <Meter value={c.delivered} max={c.deliverables} color="#7c7ff2" height={3} />
          <span>{c.delivered}/{c.deliverables}</span>
        </span>
      )}
      <span className="g-row-date">{fmt.date(c.end)}</span>
      <Avatar user={c.owner} size={18} />
      {onStar && (
        <button className="g-row-starbtn" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onStar() }} title="Star (S)">
          <Star size={13} fill={starred ? 'currentColor' : 'none'} />
        </button>
      )}
    </a>
  )
}

/* ───────────────────────── Campaigns ───────────────────────── */
function Campaigns({ id, stars, toggleStar }) {
  const [tab, setTab] = useState('all')
  const [view, setView] = useState('list')
  const [q, setQ] = useState('')
  const [collapsed, setCollapsed] = useState(new Set(['closed']))
  const [cursor, setCursor] = useState(0)
  const listRef = useRef(null)

  const filtered = useMemo(() => campaigns.filter((c) => {
    if (tab === 'active' && !['live', 'posting', 'onboarding'].includes(c.status)) return false
    if (tab === 'proposals' && c.status !== 'proposal') return false
    if (tab === 'mine' && c.owner.id !== 'u4' && c.owner.id !== 'u3') return false
    if (q && !(c.name + c.client + c.id + c.type).toLowerCase().includes(q.toLowerCase())) return false
    return true
  }), [tab, q])
  const groups = statuses.map((s) => ({ ...s, items: filtered.filter((c) => c.status === s.id) })).filter((g) => g.items.length)
  const flat = groups.flatMap((g) => (collapsed.has(g.id) ? [] : g.items))
  const current = id ? campaignById[id] : null

  useEffect(() => { setCursor(0) }, [tab, q])
  useEffect(() => {
    const el = listRef.current?.querySelector('.g-row.focus')
    el?.scrollIntoView({ block: 'nearest' })
  }, [cursor])

  useHotkeys({
    j: () => setCursor((c) => Math.min(flat.length - 1, c + 1)),
    arrowdown: () => setCursor((c) => Math.min(flat.length - 1, c + 1)),
    k: () => setCursor((c) => Math.max(0, c - 1)),
    arrowup: () => setCursor((c) => Math.max(0, c - 1)),
    enter: () => flat[cursor] && go(`${B}/campaigns/${flat[cursor].id}`),
    s: () => flat[cursor] && toggleStar(flat[cursor].id),
    escape: () => id && go(`${B}/campaigns`),
    v: () => setView((v) => (v === 'list' ? 'board' : 'list')),
  }, [flat, cursor, id])

  const tabs = [
    { id: 'all', label: 'All campaigns', count: campaigns.length },
    { id: 'active', label: 'Active', count: activeCampaigns.length },
    { id: 'proposals', label: 'Proposals', count: pending.campaigns.length },
    { id: 'mine', label: 'My team' },
  ]

  return (
    <>
      <Header crumbs={['Campaigns']} tabs={tabs} tab={tab} setTab={setTab}>
        <div className="g-search">
          <Search size={13} className="dim" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter…" />
        </div>
        <Tip label="Filter" kbd="F"><button className="g-btn g-sq press" onClick={() => toast('Filters')}><ListFilter size={14} /></button></Tip>
        <div className="g-seg">
          <button className={view === 'list' ? 'on' : ''} onClick={() => setView('list')} aria-label="List"><Rows3 size={14} /></button>
          <button className={view === 'board' ? 'on' : ''} onClick={() => setView('board')} aria-label="Board"><Columns3 size={14} /></button>
        </div>
      </Header>

      <div className="g-split">
        <div className="g-scroll" ref={listRef}>
          {view === 'list' ? (
            <div className="g-groups">
              {groups.map((g) => {
                const isCol = collapsed.has(g.id)
                return (
                  <div key={g.id}>
                    <div className="g-group-h" onClick={() => setCollapsed((s) => { const n = new Set(s); n.has(g.id) ? n.delete(g.id) : n.add(g.id); return n })}>
                      <ChevronRight size={12} className="dim" style={{ rotate: isCol ? '0deg' : '90deg', transition: 'rotate 150ms' }} />
                      <StatusIcon status={g.id} />
                      <span>{g.label}</span>
                      <span className="dim">{g.items.length}</span>
                      <button className="g-group-add" onClick={(e) => { e.stopPropagation(); toast.success(`New campaign in ${g.label}`) }}><Plus size={14} /></button>
                    </div>
                    {!isCol && g.items.map((c) => {
                      const idx = flat.indexOf(c)
                      return (
                        <CampaignRow key={c.id} c={c} focused={idx === cursor || c.id === id} onClick={() => setCursor(idx)}
                          starred={stars.has(c.id)} onStar={() => toggleStar(c.id)} />
                      )
                    })}
                  </div>
                )
              })}
              {!groups.length && <div className="g-empty">No campaigns match “{q}”.</div>}
            </div>
          ) : (
            <Board items={filtered} />
          )}
        </div>
        <AnimatePresence>
          {current && <Peek key="peek" c={current} starred={stars.has(current.id)} onStar={() => toggleStar(current.id)} />}
        </AnimatePresence>
      </div>
    </>
  )
}

function Board({ items }) {
  return (
    <div className="g-board">
      {statuses.map((s) => {
        const col = items.filter((c) => c.status === s.id)
        return (
          <div key={s.id} className="g-col">
            <div className="g-col-h"><StatusIcon status={s.id} /> {s.label} <span className="dim">{col.length}</span></div>
            <div className="g-col-body">
              {col.map((c, i) => (
                <motion.a key={c.id} href={`#${B}/campaigns/${c.id}`} className="g-card" layout>
                  <div className="g-card-top"><span className="g-row-id">{c.id}</span><Avatar user={c.owner} size={16} /></div>
                  <div className="g-card-t">{c.name}</div>
                  <div className="g-card-meta">
                    <PriorityIcon priority={c.priority} size={12} />
                    <span className="g-chip sm"><span className="g-dot" style={{ background: `oklch(0.7 0.12 ${industryHue[c.industry] ?? 200})` }} />{c.client}</span>
                    <span className="dim sm" style={{ marginLeft: 'auto' }}>{fmt.inr(c.budget)}</span>
                  </div>
                </motion.a>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Peek({ c, starred, onStar }) {
  const s = statusById[c.status]
  const roster = creators.filter((_, i) => (i + c.id.charCodeAt(5)) % 9 === 0).slice(0, 6)
  const props = [
    ['Status', <><StatusIcon status={c.status} /> {s.label}</>],
    ['Priority', <><PriorityIcon priority={c.priority} /> <span style={{ textTransform: 'capitalize' }}>{c.priority}</span></>],
    ['Owner', <><Avatar user={c.owner} size={16} /> {c.owner.name}</>],
    ['Client', <><Building2 size={13} className="dim" /> {c.client}</>],
    ['Type', c.type],
    ['Budget', <>{fmt.inrFull(c.budget)} <span className="dim">· {Math.round((c.spent / c.budget) * 100)}% used</span></>],
    ['Window', <><Calendar size={13} className="dim" /> {fmt.date(c.start)} → {fmt.date(c.end)}</>],
    ['Platforms', <span className="g-row-plat">{c.platforms.map((p) => <PlatformIcon key={p} platform={p} />)}</span>],
  ]
  return (
    <motion.aside className="g-peek"
      initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24, transition: { duration: 0.15, ease: ease.out } }}
      transition={{ duration: 0.28, ease: ease.drawer }}>
      <div className="g-peek-h">
        <span className="g-row-id"><TextMorph>{c.id}</TextMorph></span>
        <div className="g-peek-actions">
          <Tip label="Star" kbd="S"><button className="g-icon-btn press" onClick={onStar}><Star size={14} fill={starred ? 'currentColor' : 'none'} className={starred ? 'g-star on' : ''} /></button></Tip>
          <Tip label="Copy link"><button className="g-icon-btn press" onClick={() => { navigator.clipboard?.writeText(location.href); toast('Link copied') }}><Link2 size={14} /></button></Tip>
          <button className="g-icon-btn press"><MoreHorizontal size={14} /></button>
          <Tip label="Close" kbd="Esc"><button className="g-icon-btn press" onClick={() => go(`${B}/campaigns`)}><X size={14} /></button></Tip>
        </div>
      </div>
      <Swap k={c.id} className="g-peek-body">
        <h2 className="g-peek-t">{c.name}</h2>
        <p className="g-peek-brief">{c.brief}</p>

        <div className="g-props">
          {props.map(([k, v]) => <div key={k} className="g-prop"><span className="dim">{k}</span><span className="g-prop-v">{v}</span></div>)}
        </div>

        <div className="g-peek-sec">
          <div className="g-sec-h"><h3>Delivery</h3><span className="dim sm mono">{c.delivered}/{c.deliverables}</span></div>
          <Meter value={c.delivered} max={c.deliverables} color="#7c7ff2" height={5} />
          <div className="g-mini-stats">
            {[[Eye, 'Views', fmt.compact(c.views)], [Heart, 'Likes', fmt.compact(c.likes)], [MessageCircle, 'Comments', fmt.compact(c.comments)], [Target, 'Eng. rate', c.er + '%']].map(([I, l, v]) => (
              <div key={l}><span className="dim sm"><I size={12} /> {l}</span><b>{v}</b></div>
            ))}
          </div>
          <div style={{ color: '#7c7ff2', marginTop: 12 }}><Sparkline data={c.trend} width={400} height={44} color="#7c7ff2" /></div>
        </div>

        <div className="g-peek-sec">
          <div className="g-sec-h"><h3>Creators</h3><span className="dim sm">{c.creators}</span></div>
          {roster.map((cr) => (
            <div key={cr.id} className="g-creator">
              <Avatar user={cr} size={22} />
              <div className="ell"><div className="ell">{cr.handle}</div><div className="dim sm">{cr.kind} · {cr.city}</div></div>
              <span className="dim sm" style={{ marginLeft: 'auto' }}><PlatformIcon platform={cr.platform} size={11} /> {fmt.compact(cr.followers)}</span>
              <span className="sm" style={{ width: 64, textAlign: 'right' }}>{fmt.inr(cr.rate)}</span>
            </div>
          ))}
        </div>

        <div className="g-peek-sec">
          <div className="g-sec-h"><h3>Activity</h3></div>
          {activity.filter((a, i) => i % 4 === c.id.charCodeAt(6) % 4).slice(0, 5).map((a) => (
            <div key={a.id} className="g-feed-i"><Avatar user={a.user} size={16} /><div>{a.text.replace(a.campaign.name, 'this campaign')} <span className="dim">· {fmt.agoShort(a.at)}</span></div></div>
          ))}
          <div className="g-comment">
            <Avatar user={me} size={20} />
            <input placeholder="Comment…" onKeyDown={(e) => { if (e.key === 'Enter' && e.currentTarget.value) { toast.success('Comment posted'); e.currentTarget.value = '' } }} />
          </div>
        </div>
      </Swap>
    </motion.aside>
  )
}

/* ───────────────────────── Approvals ───────────────────────── */
function Approvals({ inv, subs }) {
  const [tab, setTab] = useState('invoices')
  const [sel, setSel] = useState(inv.items[0]?.id)
  const items = inv.items
  const idx = Math.max(0, items.findIndex((x) => x.id === sel))
  const current = items[idx]
  useEffect(() => { if (!items.find((x) => x.id === sel) && items.length) setSel(items[Math.min(idx, items.length - 1)].id) }, [items])

  const decide = (verdict) => {
    if (!current) return
    const next = items[idx + 1] || items[idx - 1]
    verdict === 'a' ? inv.approve(current.id) : inv.reject(current.id)
    if (next) setSel(next.id)
  }
  useHotkeys({
    j: () => items[idx + 1] && setSel(items[idx + 1].id),
    k: () => items[idx - 1] && setSel(items[idx - 1].id),
    a: () => tab === 'invoices' && decide('a'),
    r: () => tab === 'invoices' && decide('r'),
  }, [items, idx, tab])

  const relatedSubs = current ? subs.items.filter((s) => s.campaignId === current.campaignId).slice(0, 6) : []
  const fallbackSubs = subs.items.slice(idx % 10, (idx % 10) + 6)
  const shown = relatedSubs.length >= 3 ? relatedSubs : fallbackSubs

  return (
    <>
      <Header crumbs={['Approvals']} tab={tab} setTab={setTab}
        tabs={[{ id: 'invoices', label: 'Invoices', count: inv.items.length }, { id: 'content', label: 'Content', count: subs.items.length }, { id: 'done', label: 'Reviewed', count: inv.done.length + subs.done.length }]}>
        <span className="g-head-sum"><IndianRupee size={13} className="dim" /><Ticker value={items.reduce((a, x) => a + x.amount, 0)} format={(n) => fmt.inr(Math.round(n))} /></span>
      </Header>
      {tab === 'invoices' && (
        <div className="g-split">
          <div className="g-scroll g-inbox">
            <AnimatePresence initial={false}>
              {items.map((x) => (
                <motion.button key={x.id} layout="position" className={'g-inbox-i' + (x.id === sel ? ' on' : '')} onClick={() => setSel(x.id)}
                  exit={{ opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0 }} transition={{ duration: 0.2, ease: ease.out }}>
                  <div className="g-inbox-r1"><span className="ell b">{x.vendor}</span><span className="dim sm">{fmt.agoShort(x.date)}</span></div>
                  <div className="g-inbox-r2"><span className="ell">{x.campaign}</span><span className="b mono">{fmt.inr(x.amount)}</span></div>
                  <div className="g-inbox-r3 dim sm"><span className="mono">{x.no}</span></div>
                </motion.button>
              ))}
            </AnimatePresence>
            {!items.length && <div className="g-empty"><Check size={16} /> All caught up</div>}
          </div>
          <div className="g-scroll g-detail">
            {current ? (
              <Swap k={current.id} className="g-detail-in">
                  <div className="g-detail-top">
                    <div>
                      <div className="dim sm mono">{current.no}</div>
                      <h2>{current.vendor}</h2>
                      <a className="g-link" href={`#${B}/campaigns/${current.campaignId}`}>{current.campaign} <ArrowUpRight size={12} /></a>
                    </div>
                    <div className="g-amount">{fmt.inrFull(current.amount)}</div>
                  </div>
                  <div className="g-props g-props-3">
                    {[['Client', current.client], ['Service', current.service], ['Submitted', fmt.dateLong(current.date)], ['Due', fmt.dateLong(current.due)], ['Submissions', `${current.approvedSubs}/${current.submissions} verified`], ['Raised by', 'Dev Malhotra']].map(([k, v]) => (
                      <div key={k} className="g-prop"><span className="dim">{k}</span><span className="g-prop-v">{v}</span></div>
                    ))}
                  </div>
                  <div className="g-sec-h"><h3>Deliverables</h3></div>
                  <div className="g-thumbs">
                    {shown.map((s) => <Thumb key={s.id} s={s} />)}
                  </div>
                  <div className="g-decide">
                    <span style={{ flex: 1 }} />
                    <Tip label="Reject" kbd="R" side="top"><ConfirmButton className="g-btn reject" label="Reject" doneLabel="Rejected" icon={<X size={14} />} doneIcon={<X size={14} />} onDone={() => decide('r')} /></Tip>
                    <Tip label="Approve" kbd="A" side="top"><ConfirmButton className="g-btn g-btn-p" label="Approve" doneLabel="Approved" icon={<Check size={14} />} onDone={() => decide('a')} /></Tip>
                  </div>
              </Swap>
            ) : <div className="g-empty">Select an invoice</div>}
          </div>
        </div>
      )}
      {tab === 'content' && (
        <div className="g-scroll"><div className="g-page">
          <div className="g-subgrid">
            <AnimatePresence initial={false}>
              {subs.items.map((s) => (
                <motion.div key={s.id} layout className="g-sub" exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2, ease: ease.out }}>
                  <Thumb s={s} />
                  <div className="g-sub-meta">
                    <div className="ell sm">{s.campaign}</div>
                    <div className="dim sm">{s.kind === 'screenshot' ? 'Screenshot' : s.format} · {fmt.agoShort(s.submitted)}</div>
                  </div>
                  <div className="g-sub-act">
                    <button className="g-icon-btn press" onClick={() => subs.reject(s.id)} title="Reject"><X size={14} /></button>
                    <button className="g-icon-btn g-ok press" onClick={() => subs.approve(s.id)} title="Approve"><Check size={14} /></button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div></div>
      )}
      {tab === 'done' && (
        <div className="g-scroll"><div className="g-page">
          {[...inv.done, ...subs.done].length === 0 && <div className="g-empty">Nothing reviewed yet</div>}
          <div className="g-list">
            {[...inv.done, ...subs.done].map((x) => (
              <div key={x.id} className="g-row">
                {x.verdict === 'approved' ? <Check size={14} style={{ color: toneColor.green }} /> : <X size={14} style={{ color: toneColor.red }} />}
                <span className="ell">{x.vendor || x.creator?.handle}</span><span className="dim ell">{x.campaign}</span>
                <span className="g-row-fill" /><span className="dim sm" style={{ textTransform: 'capitalize' }}>{x.verdict}</span>
              </div>
            ))}
          </div>
        </div></div>
      )}
    </>
  )
}

/* ───────────────────────── Sketchboards ───────────────────────── */
function Sketchboards() {
  const [filter, setFilter] = useState('all')
  const list = sketchboards.filter((b) => filter === 'all' || (filter === 'mine' ? b.owner.me : b.client == null))
  return (
    <>
      <Header crumbs={['Sketchboards']} tab={filter} setTab={setFilter}
        tabs={[{ id: 'all', label: 'All boards', count: sketchboards.length }, { id: 'mine', label: 'Created by me' }, { id: 'internal', label: 'Internal' }]}>
        <button className="g-btn g-btn-p press" onClick={() => toast.success('Board created')}><Plus size={14} /> New</button>
      </Header>
      <div className="g-scroll"><div className="g-page">
        <div className="g-boards">
          {list.map((b, i) => (
            <motion.button key={b.id} className="g-boardcard press" onClick={() => toast(b.title)}>
              <BoardCover board={b} height={128} dark />
              <div className="g-boardcard-m">
                <div className="ell b">{b.title}</div>
                <div className="g-boardcard-r dim sm">
                  <Avatar user={b.owner} size={14} /> {b.owner.short} · {b.cards} cards <span style={{ marginLeft: 'auto' }}>{fmt.agoShort(b.updated)}</span>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div></div>
    </>
  )
}

/* ───────────────────────── Analytics (CAS) ───────────────────────── */
function Analytics() {
  const [metric, setMetric] = useState('views')
  const series = { views: monthly.views, likes: monthly.likes, comments: monthly.comments, postings: monthly.postings }[metric]
  const topClients = [...campaigns].sort((a, b) => b.views - a.views).slice(0, 8)
  return (
    <>
      <Header crumbs={['Analytics', 'CAS reports']}>
        <button className="g-btn press"><Calendar size={14} /> 12M</button>
        <button className="g-btn g-btn-p press" onClick={() => toast.success('Dashboard created')}><Plus size={14} /> New</button>
      </Header>
      <div className="g-scroll"><div className="g-page">
        <section className="g-panel">
          <div className="g-panel-h">
            <div>
              <div className="dim sm">Total {metric}</div>
              <div className="g-big"><Ticker key={metric} value={series.value} format={metric === 'postings' ? (n) => fmt.num(Math.round(n)) : fmt.compact} /></div>
            </div>
            <div className="g-seg g-seg-text">
              {['views', 'likes', 'comments', 'postings'].map((m) => (
                <button key={m} className={metric === m ? 'on' : ''} onClick={() => setMetric(m)}>
                  {metric === m && <motion.span layoutId="g-metric" className="g-seg-bg" transition={{ type: 'spring', duration: 0.28, bounce: 0 }} />}
                  <span style={{ textTransform: 'capitalize', position: 'relative' }}>{m}</span>
                </button>
              ))}
            </div>
          </div>
          <Swap k={metric}><AreaChart data={series.series} labels={months} height={200} color="#7c7ff2" format={metric === 'postings' ? fmt.num : fmt.compact} /></Swap>
        </section>

        <div className="g-cols">
          <section>
            <div className="g-sec-h"><h2>Client dashboards</h2><span className="dim sm">{casDashboards.length}</span></div>
            <div className="g-list">
              {casDashboards.map((d) => (
                <div key={d.id} className="g-row">
                  {d.locked ? <Lock size={14} className="dim" /> : <BarChart3 size={14} style={{ color: '#7c7ff2' }} />}
                  <span className="ell">{d.title}</span>
                  <span className="g-chip">{d.client}</span>
                  <span className="g-row-fill" />
                  <span className="dim sm" style={{ width: 70, textAlign: 'right' }}>{d.kpi.split(' ')[0]}</span>
                  {d.locked ? (
                    <button className="g-btn sm press" onClick={() => toast.success('Requested', { description: 'Kirsten Menezes' })}>Request</button>
                  ) : (
                    <button className="g-btn sm press" onClick={() => toast(d.title, { description: `Refreshed ${fmt.ago(d.refreshed)}` })}>Open</button>
                  )}
                </div>
              ))}
            </div>
          </section>
          <section>
            <div className="g-sec-h"><h2>Top campaigns by views</h2></div>
            <div className="g-rank">
              {topClients.map((c, i) => (
                <div key={c.id} className="g-rank-i">
                  <span className="dim mono sm">{String(i + 1).padStart(2, '0')}</span>
                  <span className="ell">{c.name}</span>
                  <div className="g-rank-bar"><span style={{ width: (c.views / topClients[0].views) * 100 + '%' }} /></div>
                  <span className="mono sm">{fmt.compact(c.views)}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
        <section className="g-panel" style={{ marginTop: 24 }}>
          <div className="g-sec-h"><h2>Postings per month</h2></div>
          <Bars data={monthly.postings.series} labels={months} height={140} color="#7c7ff2" format={fmt.num} />
        </section>
      </div></div>
    </>
  )
}

/* ───────────────────────── Knowledge base ───────────────────────── */
function Knowledge({ id }) {
  const [q, setQ] = useState('')
  const [ind, setInd] = useState('All')
  const [menu, setMenu] = useState(false)
  const rows = useMemo(() => clients.filter((c) => (ind === 'All' || c.industry === ind) && c.name.toLowerCase().includes(q.toLowerCase())), [q, ind])
  const [sorted, sort, toggle] = useSort(rows, { key: 'campaigns', dir: 'desc' })
  const maxC = Math.max(...clients.map((c) => c.campaigns))
  const client = id ? clients.find((c) => c.id === id) : null
  useHotkeys({ escape: () => id && go(`${B}/knowledge`) }, [id])
  const Th = ({ k, children, style }) => (
    <button className={'g-th' + (sort.key === k ? ' on' : '')} onClick={() => toggle(k)} style={style}>
      {children}{sort.key === k && (sort.dir === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />)}
    </button>
  )
  return (
    <>
      <Header crumbs={['Knowledge base']}>
        <span className="dim sm">{kbTotal}</span>
      </Header>
      <div className="g-split">
        <div className="g-scroll"><div className="g-page">
          <div className="g-kb-bar">
            <div className="g-search g-search-lg">
              <Search size={14} className="dim" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search clients or campaigns…" />
              {q && <button onClick={() => setQ('')}><X size={13} className="dim" /></button>}
            </div>
            <div style={{ position: 'relative' }}>
              <button className="g-btn press" onClick={() => setMenu((m) => !m)}><SlidersHorizontal size={14} /> {ind === 'All' ? 'All industries' : ind} <ChevronDown size={13} className="dim" /></button>
              <AnimatePresence>
                {menu && (
                  <motion.div className="g-menu" initial={{ opacity: 0, scale: 0.96, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.14, ease: ease.out }} style={{ transformOrigin: 'top right' }}>
                    {['All', ...industries].map((i) => (
                      <button key={i} className={ind === i ? 'on' : ''} onClick={() => { setInd(i); setMenu(false) }}>
                        {i !== 'All' && <span className="g-dot" style={{ background: `oklch(0.7 0.12 ${industryHue[i]})` }} />}{i}
                        {ind === i && <Check size={13} style={{ marginLeft: 'auto' }} />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div className="g-table">
            <div className="g-tr g-thead">
              <Th k="name">Client</Th><Th k="industry">Industry</Th><Th k="campaigns">Campaigns</Th><Th k="spend">Lifetime billing</Th><Th k="lastCampaign">Last campaign</Th><span className="g-th">Owner</span>
            </div>
            {sorted.map((c) => (
              <a key={c.id} href={`#${B}/knowledge/${c.id}`} className={'g-tr' + (c.id === id ? ' on' : '')}>
                <span className="g-td-name"><span className="g-logo-sq" style={{ background: `oklch(0.35 0.06 ${industryHue[c.industry]})` }}>{c.name[0]}</span>{c.name}</span>
                <span><span className="g-chip"><span className="g-dot" style={{ background: `oklch(0.7 0.12 ${industryHue[c.industry]})` }} />{c.industry}</span></span>
                <span className="g-td-bar"><span className="mono">{c.campaigns}</span><i style={{ width: (c.campaigns / maxC) * 80 + 'px' }} /></span>
                <span className="mono">{fmt.inr(c.spend)}</span>
                <span className="dim">{fmt.ago(c.lastCampaign)}</span>
                <span><Avatar user={c.owner} size={18} /></span>
              </a>
            ))}
          </div>
        </div></div>
        <AnimatePresence>
          {client && (
            <motion.aside key={client.id} className="g-peek" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.22, ease: ease.drawer }}>
              <div className="g-peek-h"><span className="dim sm">Client</span><div className="g-peek-actions"><button className="g-icon-btn press" onClick={() => go(`${B}/knowledge`)}><X size={14} /></button></div></div>
              <div className="g-peek-body">
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span className="g-logo-sq lg" style={{ background: `oklch(0.35 0.06 ${industryHue[client.industry]})` }}>{client.name[0]}</span>
                  <div><h2 className="g-peek-t" style={{ margin: 0 }}>{client.name}</h2><div className="dim sm">{client.industry} · client since {client.since}</div></div>
                </div>
                <div className="g-props" style={{ marginTop: 18 }}>
                  {[['Campaigns', client.campaigns], ['Lifetime billing', fmt.inrFull(client.spend)], ['Account owner', <><Avatar user={client.owner} size={16} /> {client.owner.name}</>], ['Health', client.health], ['Last campaign', fmt.dateLong(client.lastCampaign)]].map(([k, v]) => (
                    <div key={k} className="g-prop"><span className="dim">{k}</span><span className="g-prop-v">{v}</span></div>
                  ))}
                </div>
                <div className="g-peek-sec">
                  <div className="g-sec-h"><h3>Campaign history</h3></div>
                  <div className="g-list">
                    {(campaigns.filter((c) => c.client === client.name).length ? campaigns.filter((c) => c.client === client.name) : campaigns.slice(0, 3)).map((c) => (
                      <a key={c.id} href={`#${B}/campaigns/${c.id}`} className="g-row"><StatusIcon status={c.status} /><span className="ell">{c.name}</span><span className="g-row-fill" /><span className="dim sm">{fmt.compact(c.views)} views</span></a>
                    ))}
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
