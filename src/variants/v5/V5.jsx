import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  LayoutDashboard, Inbox, Megaphone, PenTool, BarChart3, BookOpen, Search, Settings, Receipt, Camera, Sparkles, CheckCircle2,
  Clock, AlarmClock, Check, X, ChevronDown, ArrowLeft, ArrowUpRight, Eye, Heart, MessageCircle, Target, Lock, Plus, Filter,
  CircleDashed, Send, Paperclip, Flag, Command, Radio, TrendingUp, TrendingDown, IndianRupee, Zap,
} from 'lucide-react'
import {
  campaigns, campaignById, clients, statuses, statusById, me, team, monthly, months, activity, pending, sketchboards, casDashboards,
  creators, fmt, kbTotal, industries, activeCampaigns, revenue, TODAY,
} from '../../data'
import {
  go, parseRoute, ease, Avatar, PlatformIcon, Sparkline, AreaChart, Meter, CommandMenu, useVariantRoot, useGlobalNav, useHotkeys, Ticker, toneColor,
} from '../../shared/ui'
import { useInvoices, useSubmissions, useSort, Thumb, BoardCover, industryHue } from '../../shared/state'
import { toast } from 'sonner'
import './v5.css'

const B = '/v5'

export default function V5({ path }) {
  useVariantRoot('v5', 'dark')
  const { page, id } = parseRoute(path)
  const [cmd, setCmd] = useState(false)
  useGlobalNav(B, setCmd)
  const inv = useInvoices()
  const subs = useSubmissions()
  const inboxCount = inv.items.length + subs.items.length

  return (
    <div className="s">
      <Rail page={page} setCmd={setCmd} inbox={inboxCount} />
      <main className="s-main">
        {page === 'dashboard' && <Overview inv={inv} subs={subs} />}
        {page === 'approvals' && <Triage inv={inv} subs={subs} />}
        {page === 'campaigns' && (id && campaignById[id] ? <Campaign c={campaignById[id]} /> : <CampaignList />)}
        {page === 'sketchboards' && <Boards />}
        {page === 'analytics' && <Analytics />}
        {page === 'knowledge' && <KB />}
      </main>
      <CommandMenu open={cmd} setOpen={setCmd} base={B} />
    </div>
  )
}

function Rail({ page, setCmd, inbox }) {
  const items = [
    ['dashboard', LayoutDashboard, 'Overview'], ['approvals', Inbox, 'Triage'], ['campaigns', Megaphone, 'Campaigns'],
    ['sketchboards', PenTool, 'Sketchboards'], ['analytics', BarChart3, 'Analytics'], ['knowledge', BookOpen, 'Knowledge base'],
  ]
  return (
    <nav className="s-rail">
      <div className="s-mark">W</div>
      <button className="s-rbtn press" onClick={() => setCmd(true)} data-tip="Search ⌘K"><Search size={18} /></button>
      <div className="s-rsep" />
      {items.map(([id, I, l]) => (
        <a key={id} href={`#${B}/${id}`} className={'s-rbtn' + (page === id ? ' on' : '')} data-tip={l}>
          {page === id && <motion.span layoutId="s-rail" className="s-rbg" transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }} />}
          <I size={18} />
          {id === 'approvals' && inbox > 0 && <span className="s-rbadge">{inbox}</span>}
        </a>
      ))}
      <div style={{ flex: 1 }} />
      <button className="s-rbtn press" data-tip="Settings"><Settings size={18} /></button>
      <Avatar user={me} size={28} />
    </nav>
  )
}

function Head({ title, sub, children }) {
  return (
    <header className="s-head">
      <div><h1>{title}</h1>{sub && <p>{sub}</p>}</div>
      <div className="s-head-r">{children}</div>
    </header>
  )
}

/* ─────────── Overview ─────────── */
function Overview({ inv, subs }) {
  const queues = [
    ['Invoices', inv.items.length, Receipt, 'violet'], ['Screenshots', subs.items.filter((s) => s.kind === 'screenshot').length, Camera, 'blue'],
    ['Creator content', subs.items.filter((s) => s.kind === 'content').length, Sparkles, 'green'], ['Proposals stalled', pending.campaigns.length, CircleDashed, 'gray'],
    ['Closings overdue', pending.closings.length, AlarmClock, 'amber'], ['Payments pending', pending.payments.length, IndianRupee, 'orange'],
  ]
  const posting = campaigns.filter((c) => ['live', 'posting'].includes(c.status)).slice(0, 7)
  return (
    <div className="s-scroll">
      <Head title={`Morning, ${me.short}`} sub="Tuesday 3 November · here’s the state of WLDD right now.">
        <button className="s-btn press" onClick={() => go(`${B}/approvals`)}><Inbox size={14} /> Open triage <kbd>G</kbd><kbd>A</kbd></button>
        <button className="s-btn s-btn-p press" onClick={() => toast.success('Campaign drafted')}><Plus size={14} /> New campaign</button>
      </Head>
      <div className="s-page">
        <div className="s-hero">
          <div className="s-glow" />
          <div className="s-hero-l">
            <span className="s-label">Views this month</span>
            <div className="s-hero-n"><Ticker value={monthly.views.value} format={fmt.compact} /></div>
            <span className="s-pill up"><TrendingUp size={12} /> {fmt.pct(monthly.views.delta)} vs October</span>
            <div className="s-hero-mini">
              <div><span className="s-label">Billings</span><b><Ticker value={revenue.value} format={fmt.inr} /></b></div>
              <div><span className="s-label">Executed</span><b><Ticker value={monthly.executed.value} /></b></div>
              <div><span className="s-label">Postings</span><b><Ticker value={monthly.postings.value} format={(n) => fmt.num(Math.round(n))} /></b></div>
            </div>
          </div>
          <div className="s-hero-chart"><AreaChart data={monthly.views.series} labels={months} height={200} color="#8b7bff" format={fmt.compact} grid={false} /></div>
        </div>

        <div className="s-grid3">
          <section className="s-card">
            <div className="s-card-h"><Inbox size={14} /> Queues <a href={`#${B}/approvals`} className="s-more">Triage <ArrowUpRight size={12} /></a></div>
            {queues.map(([l, n, I, tone]) => (
              <a key={l} href={`#${B}/${l.includes('Prop') || l.includes('Clos') || l.includes('Pay') ? 'campaigns' : 'approvals'}`} className="s-queue">
                <span className="s-qic" style={{ color: toneColor[tone], background: `color-mix(in oklab, ${toneColor[tone]} 14%, transparent)` }}><I size={13} /></span>
                <span>{l}</span>
                <span className="s-qn"><Ticker value={n} /></span>
              </a>
            ))}
          </section>
          <section className="s-card">
            <div className="s-card-h"><Radio size={14} /> Posting now <span className="s-live" /></div>
            {posting.map((c) => (
              <a key={c.id} href={`#${B}/campaigns/${c.id}`} className="s-live-row">
                <div className="ell"><div className="ell">{c.name}</div><div className="s-dim s-xs">{c.client} · {c.delivered}/{c.deliverables}</div></div>
                <Sparkline data={c.trend} width={70} height={22} color="#8b7bff" />
              </a>
            ))}
          </section>
          <section className="s-card">
            <div className="s-card-h"><Zap size={14} /> Activity</div>
            <div className="s-tl">
              {activity.slice(0, 7).map((a) => (
                <div key={a.id} className="s-tl-i"><Avatar user={a.user} size={20} /><div><div className="s-tl-t">{a.text}</div><div className="s-dim s-xs">{fmt.ago(a.at)}</div></div></div>
              ))}
            </div>
          </section>
        </div>

        <div className="s-grid4">
          {[['Likes', monthly.likes], ['Comments', monthly.comments], ['Postings', monthly.postings], ['Campaigns', monthly.executed]].map(([l, s]) => (
            <div key={l} className="s-card s-mcard">
              <div className="s-label">{l}</div>
              <div className="s-mrow"><b><Ticker value={s.value} format={l === 'Campaigns' ? (n) => Math.round(n) : fmt.compact} /></b><span className={'s-pill ' + (s.delta >= 0 ? 'up' : 'down')}>{s.delta >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}{fmt.pct(s.delta)}</span></div>
              <Sparkline data={s.series} width={240} height={36} color={s.delta >= 0 ? '#8b7bff' : '#ff6369'} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─────────── Triage (3-pane inbox) ─────────── */
function Triage({ inv, subs }) {
  const [queue, setQueue] = useState('all')
  const [snoozed, setSnoozed] = useState(new Set())
  const [snoozeMenu, setSnoozeMenu] = useState(false)
  const all = useMemo(() => [
    ...inv.items.map((x) => ({ kind: 'invoice', id: x.id, at: x.date, x })),
    ...subs.items.map((s) => ({ kind: s.kind, id: s.id, at: s.submitted, x: s })),
  ].sort((a, b) => b.at - a.at), [inv.items, subs.items])
  const list = all.filter((t) => !snoozed.has(t.id) && (queue === 'all' || t.kind === queue))
  const [sel, setSel] = useState(null)
  const idx = Math.max(0, list.findIndex((t) => t.id === sel))
  const cur = list[idx]
  useEffect(() => { if (cur && cur.id !== sel) setSel(cur.id) }, [cur, sel])

  const decide = (v) => {
    if (!cur) return
    const next = list[idx + 1] || list[idx - 1]
    if (cur.kind === 'invoice') v ? inv.approve(cur.id) : inv.reject(cur.id)
    else v ? subs.approve(cur.id) : subs.reject(cur.id)
    setSel(next?.id ?? null)
  }
  const snooze = (label) => {
    if (!cur) return
    const next = list[idx + 1] || list[idx - 1]
    setSnoozed((s) => new Set(s).add(cur.id))
    setSnoozeMenu(false)
    toast(`Snoozed until ${label}`, { description: cur.kind === 'invoice' ? cur.x.vendor : cur.x.creator.handle, action: { label: 'Undo', onClick: () => setSnoozed((s) => { const n = new Set(s); n.delete(cur.id); return n }) } })
    setSel(next?.id ?? null)
  }
  useHotkeys({
    j: () => list[idx + 1] && setSel(list[idx + 1].id),
    k: () => list[idx - 1] && setSel(list[idx - 1].id),
    e: () => decide(true),
    r: () => decide(false),
    h: () => setSnoozeMenu((m) => !m),
  }, [list, idx])

  const qs = [
    ['all', 'All open', Inbox, all.filter((t) => !snoozed.has(t.id)).length],
    ['invoice', 'Invoices', Receipt, inv.items.length],
    ['screenshot', 'Screenshots', Camera, subs.items.filter((s) => s.kind === 'screenshot').length],
    ['content', 'Creator content', Sparkles, subs.items.filter((s) => s.kind === 'content').length],
  ]
  const sla = (t) => {
    const h = Math.round(48 - (TODAY - t.at) / 36e5)
    return h < 0 ? { label: `${-h}h over`, tone: 'bad' } : h < 12 ? { label: `${h}h left`, tone: 'warn' } : { label: `${h}h left`, tone: 'ok' }
  }

  return (
    <div className="s-triage">
      <aside className="s-queues">
        <div className="s-queues-h">Triage</div>
        {qs.map(([id, l, I, n]) => (
          <button key={id} className={'s-qbtn' + (queue === id ? ' on' : '')} onClick={() => { setQueue(id); setSel(null) }}>
            <I size={15} /> {l} <span>{n}</span>
          </button>
        ))}
        <div className="s-queues-h" style={{ marginTop: 18 }}>Status</div>
        <button className="s-qbtn" onClick={() => toast(`${snoozed.size} snoozed items`)}><AlarmClock size={15} /> Snoozed <span>{snoozed.size}</span></button>
        <button className="s-qbtn" onClick={() => toast(`${inv.done.length + subs.done.length} reviewed this session`)}><CheckCircle2 size={15} /> Done <span>{inv.done.length + subs.done.length}</span></button>
        <div className="s-keys">
          <div><kbd>J</kbd><kbd>K</kbd> navigate</div><div><kbd>E</kbd> approve</div><div><kbd>R</kbd> reject</div><div><kbd>H</kbd> snooze</div>
        </div>
      </aside>

      <section className="s-threads">
        <div className="s-threads-h"><b>{qs.find((q) => q[0] === queue)[1]}</b><span className="s-dim">{list.length}</span><button className="s-ib" style={{ marginLeft: 'auto' }}><Filter size={14} /></button></div>
        <div className="s-threads-l">
          <AnimatePresence initial={false}>
            {list.map((t) => {
              const s = sla(t)
              const isInv = t.kind === 'invoice'
              return (
                <motion.button key={t.id} layout="position" className={'s-thread' + (t.id === cur?.id ? ' on' : '')} onClick={() => setSel(t.id)}
                  exit={{ opacity: 0, x: -12, height: 0, paddingTop: 0, paddingBottom: 0 }} transition={{ duration: 0.2, ease: ease.out }}>
                  <div className="s-th-1">
                    {isInv ? <span className="s-tic inv"><Receipt size={12} /></span> : <Avatar user={t.x.creator} size={20} />}
                    <b className="ell">{isInv ? t.x.vendor : t.x.creator.handle}</b>
                    <span className="s-dim s-xs" style={{ marginLeft: 'auto', flex: 'none' }}>{fmt.agoShort(t.at)}</span>
                  </div>
                  <div className="s-th-2 ell">{isInv ? `${fmt.inrFull(t.x.amount)} · ${t.x.service}` : `${t.kind === 'screenshot' ? 'Screenshot' : t.x.format} · “${t.x.caption}”`}</div>
                  <div className="s-th-3">
                    <span className="s-tag">{t.x.campaign.split('—')[0].trim()}</span>
                    <span className={'s-sla ' + s.tone}><Clock size={11} /> {s.label}</span>
                  </div>
                </motion.button>
              )
            })}
          </AnimatePresence>
          {!list.length && <div className="s-zero"><CheckCircle2 size={28} /><b>Inbox zero</b><span className="s-dim">Nothing left in this queue.</span></div>}
        </div>
      </section>

      <section className="s-detail">
        {cur ? (
          <>
            <div className="s-detail-body">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div key={cur.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }}>
                  {cur.kind === 'invoice' ? <InvoiceDetail x={cur.x} /> : <SubDetail s={cur.x} />}
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="s-composer">
              <div className="s-compose-in">
                <input placeholder="Reply or leave an internal note…" onKeyDown={(e) => { if (e.key === 'Enter' && e.currentTarget.value) { toast.success('Note added'); e.currentTarget.value = '' } }} />
                <button className="s-ib"><Paperclip size={14} /></button>
                <button className="s-ib"><Send size={14} /></button>
              </div>
              <div className="s-actions">
                <div style={{ position: 'relative' }}>
                  <button className="s-btn press" onClick={() => setSnoozeMenu((m) => !m)}><AlarmClock size={14} /> Snooze <kbd>H</kbd></button>
                  <AnimatePresence>
                    {snoozeMenu && (
                      <motion.div className="s-menu" initial={{ opacity: 0, scale: 0.96, y: 4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.13, ease: ease.out }} style={{ transformOrigin: 'bottom left' }}>
                        {['1 hour', 'This evening', 'Tomorrow 9am', 'Next Monday'].map((l) => <button key={l} onClick={() => snooze(l)}>{l}</button>)}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <button className="s-btn press" onClick={() => toast('Flagged for finance')}><Flag size={14} /> Flag</button>
                <span style={{ flex: 1 }} />
                <button className="s-btn s-btn-bad press" onClick={() => decide(false)}><X size={14} /> Reject <kbd>R</kbd></button>
                <button className="s-btn s-btn-p press" onClick={() => decide(true)}><Check size={14} /> Approve <kbd>E</kbd></button>
              </div>
            </div>
          </>
        ) : (
          <div className="s-zero"><Inbox size={28} /><b>Select a thread</b></div>
        )}
      </section>
    </div>
  )
}

function InvoiceDetail({ x }) {
  const c = campaignById[x.campaignId]
  const events = [
    { u: null, t: `${x.vendor} submitted ${x.no}`, at: x.date, icon: Receipt },
    { u: team[5], t: `verified ${x.approvedSubs} of ${x.submissions} deliverables against screenshots`, at: new Date(x.date.getTime() + 3 * 36e5) },
    { u: team[6], t: x.amount > 400000 ? 'flagged: amount above ₹4L needs AD sign-off' : 'checked GST & PAN — all good', at: new Date(x.date.getTime() + 6 * 36e5), note: true },
  ]
  return (
    <div className="s-d">
      <div className="s-d-top">
        <div>
          <div className="s-dim s-xs s-mono">{x.no}</div>
          <h2>{x.vendor}</h2>
          <a href={`#${B}/campaigns/${x.campaignId}`} className="s-more" style={{ marginLeft: 0 }}>{x.campaign} <ArrowUpRight size={12} /></a>
        </div>
        <div className="s-amt">{fmt.inrFull(x.amount)}<span className="s-dim s-xs">due {fmt.dateLong(x.due)}</span></div>
      </div>
      <div className="s-facts">
        {[['Client', x.client], ['Service', x.service], ['Deliverables', `${x.approvedSubs}/${x.submissions} verified`], ['Campaign owner', c?.owner.name]].map(([k, v]) => <div key={k}><span className="s-label">{k}</span><span>{v}</span></div>)}
      </div>
      <div className="s-label" style={{ margin: '20px 0 10px' }}>Timeline</div>
      <div className="s-events">
        {events.map((e, i) => (
          <div key={i} className={'s-ev' + (e.note ? ' note' : '')}>
            {e.u ? <Avatar user={e.u} size={22} /> : <span className="s-tic inv"><Receipt size={12} /></span>}
            <div><b>{e.u ? e.u.short : 'Vendor'}</b> {e.t}<div className="s-dim s-xs">{fmt.ago(e.at)}</div></div>
          </div>
        ))}
      </div>
      <div className="s-label" style={{ margin: '20px 0 10px' }}>Deliverables</div>
      <div className="s-thumbs">
        {(campaigns.length ? creators : []).slice(x.id.length * 2, x.id.length * 2 + 5).map((cr, i) => (
          <Thumb key={cr.id} s={{ id: cr.id, creator: cr, hue: (cr.hue + i * 40) % 360, format: ['Reel', 'Static post', 'Story', 'Carousel', 'Reel'][i], caption: ['When the plot twist hits 💀', 'Rate this out of 10', 'POV: Friday 6pm', 'Tag your bestie', 'No thoughts, just vibes'][i], views: cr.followers * 0.6 }} />
        ))}
      </div>
    </div>
  )
}

function SubDetail({ s }) {
  const c = campaignById[s.campaignId]
  return (
    <div className="s-d s-d-sub">
      <div className="s-sub-media"><Thumb s={s} ratio="4 / 5" radius={14} /></div>
      <div>
        <div className="s-dim s-xs s-mono">{s.id}</div>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Avatar user={s.creator} size={26} /> {s.creator.handle}</h2>
        <div className="s-dim">{s.creator.kind} · {fmt.compact(s.creator.followers)} followers · {s.creator.city}</div>
        <blockquote className="s-quote">“{s.caption}”</blockquote>
        <div className="s-facts">
          {[['Campaign', s.campaign], ['Client', s.client], ['Format', s.kind === 'screenshot' ? 'Screenshot proof' : s.format], ['Platform', s.creator.platform], ['Submitted', fmt.ago(s.submitted)], ['Owner', c?.owner.name]].map(([k, v]) => <div key={k}><span className="s-label">{k}</span><span>{v}</span></div>)}
        </div>
        <div className="s-checks">
          {[['Brand mention & #ad present', true], ['Posted within window', true], ['Link in bio updated', s.views % 3 !== 0], ['No competitor in frame', true]].map(([l, ok]) => (
            <div key={l} className={ok ? 'ok' : 'bad'}>{ok ? <Check size={13} /> : <X size={13} />} {l}</div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─────────── Campaigns ─────────── */
function CampaignList() {
  const [q, setQ] = useState('')
  const [st, setSt] = useState('all')
  const rows = campaigns.filter((c) => (st === 'all' || c.status === st) && (c.name + c.client + c.id).toLowerCase().includes(q.toLowerCase()))
  return (
    <div className="s-scroll">
      <Head title="Campaigns" sub={`${campaigns.length} campaigns · ${activeCampaigns.length} active`}>
        <button className="s-btn s-btn-p press" onClick={() => toast.success('Campaign drafted')}><Plus size={14} /> New campaign</button>
      </Head>
      <div className="s-page">
        <div className="s-bar">
          <div className="s-input"><Search size={14} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search campaigns…" /></div>
          <div className="s-segs">
            {['all', ...statuses.map((s) => s.id)].map((s) => (
              <button key={s} className={st === s ? 'on' : ''} onClick={() => setSt(s)}>
                {st === s && <motion.span layoutId="s-seg" className="s-seg-bg" transition={{ type: 'spring', duration: 0.3, bounce: 0 }} />}
                <span>{s === 'all' ? 'All' : statusById[s].label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="s-table">
          <div className="s-tr s-thd"><span>Campaign</span><span>Status</span><span>Client</span><span>Delivery</span><span className="r">Views</span><span className="r">Budget</span><span>Updated</span></div>
          {rows.map((c) => (
            <a key={c.id} href={`#${B}/campaigns/${c.id}`} className="s-tr">
              <span className="s-tname"><span className="s-mono s-dim">{c.id}</span><b className="ell">{c.name}</b></span>
              <span><Badge s={c.status} /></span>
              <span className="ell s-dim2">{c.client}</span>
              <span className="s-prog"><Meter value={c.delivered} max={c.deliverables} color="#8b7bff" height={4} /><span className="s-mono s-xs">{c.delivered}/{c.deliverables}</span></span>
              <span className="r s-mono">{fmt.compact(c.views)}</span>
              <span className="r s-mono">{fmt.inr(c.budget)}</span>
              <span className="s-dim s-xs">{fmt.ago(c.updated)}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

const Badge = ({ s }) => {
  const st = statusById[s]
  return <span className="s-badge" style={{ '--c': toneColor[st.tone] }}><i />{st.label}</span>
}

function Campaign({ c }) {
  const order = statuses.map((s) => s.id)
  const at = order.indexOf(c.status)
  const roster = creators.filter((_, i) => (i + c.id.charCodeAt(5)) % 6 === 0).slice(0, 8)
  return (
    <div className="s-scroll">
      <div className="s-page">
        <a href={`#${B}/campaigns`} className="s-back"><ArrowLeft size={14} /> Campaigns</a>
        <div className="s-c-top">
          <div>
            <div className="s-mono s-dim s-xs">{c.id} · {c.type}</div>
            <h1 className="s-c-title">{c.name}</h1>
            <div className="s-c-meta"><Badge s={c.status} /><span className="s-dim">{c.client}</span><span className="s-dim">·</span><Avatar user={c.owner} size={18} /><span className="s-dim">{c.owner.name}</span></div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="s-btn press" onClick={() => toast('Report link copied')}>Share report</button>
            <button className="s-btn s-btn-p press" onClick={() => toast.success(`Advanced to ${statuses[Math.min(at + 1, 6)].label}`)}>Advance stage</button>
          </div>
        </div>

        <div className="s-stepper">
          {statuses.map((s, i) => (
            <div key={s.id} className={'s-step' + (i < at ? ' done' : i === at ? ' cur' : '')}>
              <div className="s-step-bar"><i style={{ transform: `scaleX(${i < at ? 1 : i === at ? 0.5 : 0})` }} /></div>
              <span>{s.label}</span>
            </div>
          ))}
        </div>

        <div className="s-grid4" style={{ marginTop: 20 }}>
          {[[Eye, 'Views', c.views, fmt.compact], [Heart, 'Likes', c.likes, fmt.compact], [MessageCircle, 'Comments', c.comments, fmt.compact], [Target, 'Engagement', c.er, (n) => n.toFixed(1) + '%']].map(([I, l, v, f]) => (
            <div key={l} className="s-card s-mcard"><div className="s-label"><I size={12} /> {l}</div><div className="s-mrow"><b><Ticker value={v} format={f} /></b></div></div>
          ))}
        </div>

        <div className="s-grid2">
          <section className="s-card">
            <div className="s-card-h">Daily reach</div>
            <AreaChart data={c.trend} labels={c.trend.map((_, i) => `D${i + 1}`)} height={170} color="#8b7bff" format={(v) => fmt.compact(v * 12000)} grid={false} />
          </section>
          <section className="s-card">
            <div className="s-card-h">Budget</div>
            <div className="s-budget"><b>{fmt.inrFull(c.spent)}</b><span className="s-dim">of {fmt.inrFull(c.budget)}</span></div>
            <Meter value={c.spent} max={c.budget} color="#8b7bff" height={6} />
            <div className="s-facts" style={{ marginTop: 18 }}>
              {[['Window', `${fmt.date(c.start)} → ${fmt.date(c.end)}`], ['Creators', c.creators], ['Platforms', c.platforms.join(', ')], ['Deliverables', `${c.delivered}/${c.deliverables}`]].map(([k, v]) => <div key={k}><span className="s-label">{k}</span><span>{v}</span></div>)}
            </div>
          </section>
        </div>

        <section className="s-card" style={{ marginTop: 16 }}>
          <div className="s-card-h">Creators <span className="s-dim">{c.creators}</span></div>
          {roster.map((cr) => (
            <div key={cr.id} className="s-cr">
              <Avatar user={cr} size={26} />
              <div className="ell" style={{ flex: 1 }}><b>{cr.handle}</b><div className="s-dim s-xs">{cr.kind} · {cr.city}</div></div>
              <span className="s-dim2 s-xs"><PlatformIcon platform={cr.platform} size={12} /> {fmt.compact(cr.followers)}</span>
              <span className="s-mono s-xs" style={{ width: 60, textAlign: 'right' }}>{cr.er}%</span>
              <span className="s-mono s-xs" style={{ width: 80, textAlign: 'right' }}>{fmt.inrFull(cr.rate)}</span>
            </div>
          ))}
        </section>
      </div>
    </div>
  )
}

/* ─────────── Boards / Analytics / KB ─────────── */
function Boards() {
  return (
    <div className="s-scroll">
      <Head title="Sketchboards" sub="Plan your campaign, explore client insights, create content samples for your pitch deck."><button className="s-btn s-btn-p press" onClick={() => toast.success('Board created')}><Plus size={14} /> New board</button></Head>
      <div className="s-page">
        <div className="s-boards">
          {sketchboards.map((b, i) => (
            <motion.button key={b.id} className="s-board press" onClick={() => toast(b.title)}>
              <BoardCover board={b} height={140} dark />
              <div className="s-board-m"><b className="ell">{b.title}</b><span className="s-dim s-xs">{b.client || 'Internal'} · {b.cards} cards · {fmt.agoShort(b.updated)}</span></div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  )
}

function Analytics() {
  const [m, setM] = useState('views')
  const ser = monthly[m]
  const top = [...campaigns].sort((a, b) => b.views - a.views).slice(0, 8)
  return (
    <div className="s-scroll">
      <Head title="Analytics" sub="Performance across every campaign, last 12 months."><button className="s-btn press"><Clock size={14} /> 12 months <ChevronDown size={13} /></button></Head>
      <div className="s-page">
        <div className="s-card s-chartcard">
          <div className="s-glow sm" />
          <div className="s-segs" style={{ marginBottom: 18 }}>
            {['views', 'likes', 'comments', 'postings'].map((k) => (
              <button key={k} className={m === k ? 'on' : ''} onClick={() => setM(k)}>{m === k && <motion.span layoutId="s-seg2" className="s-seg-bg" transition={{ type: 'spring', duration: 0.3, bounce: 0 }} />}<span style={{ textTransform: 'capitalize' }}>{k}</span></button>
            ))}
          </div>
          <div className="s-hero-n sm"><Ticker key={m} value={ser.value} format={m === 'postings' ? (n) => fmt.num(Math.round(n)) : fmt.compact} /></div>
          <AreaChart key={m} data={ser.series} labels={months} height={240} color="#8b7bff" format={m === 'postings' ? fmt.num : fmt.compact} />
        </div>
        <div className="s-grid2">
          <section className="s-card">
            <div className="s-card-h">Top campaigns</div>
            {top.map((c, i) => (
              <a key={c.id} href={`#${B}/campaigns/${c.id}`} className="s-rank"><span className="s-mono s-dim">{i + 1}</span><span className="ell">{c.name}</span><span className="s-mono">{fmt.compact(c.views)}</span></a>
            ))}
          </section>
          <section className="s-card">
            <div className="s-card-h">CAS dashboards</div>
            {casDashboards.map((d) => (
              <div key={d.id} className="s-cas">
                <span className="s-tic" style={{ background: d.locked ? 'rgba(255,255,255,.06)' : 'rgba(139,123,255,.18)', color: d.locked ? 'var(--muted)' : '#b3a8ff' }}>{d.locked ? <Lock size={12} /> : <BarChart3 size={12} />}</span>
                <div className="ell" style={{ flex: 1 }}><div className="ell">{d.title}</div><div className="s-dim s-xs">{d.client} · {d.kpi}</div></div>
                {d.locked ? <button className="s-btn sm press" onClick={() => toast.success('Access requested from Kirsten Menezes')}>Request</button> : <button className="s-btn sm press" onClick={() => toast(d.title)}>Open</button>}
              </div>
            ))}
          </section>
        </div>
      </div>
    </div>
  )
}

function KB() {
  const [q, setQ] = useState('')
  const [ind, setInd] = useState('All')
  const [open, setOpen] = useState(false)
  const rows = clients.filter((c) => (ind === 'All' || c.industry === ind) && c.name.toLowerCase().includes(q.toLowerCase()))
  const [sorted, sort, toggle] = useSort(rows, { key: 'campaigns', dir: 'desc' })
  const H = ({ k, children, r }) => <button className={(r ? 'r ' : '') + (sort.key === k ? 'on' : '')} onClick={() => toggle(k)}>{children}{sort.key === k ? (sort.dir === 'asc' ? ' ↑' : ' ↓') : ''}</button>
  return (
    <div className="s-scroll">
      <Head title="Knowledge base" sub={`${kbTotal} clients and their campaign history.`} />
      <div className="s-page">
        <div className="s-bar">
          <div className="s-input"><Search size={14} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search clients or campaigns…" /></div>
          <div style={{ position: 'relative' }}>
            <button className="s-btn press" onClick={() => setOpen((o) => !o)}>{ind === 'All' ? 'All industries' : ind} <ChevronDown size={13} /></button>
            <AnimatePresence>
              {open && (
                <motion.div className="s-menu down" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.13, ease: ease.out }} style={{ transformOrigin: 'top right' }}>
                  {['All', ...industries].map((i) => <button key={i} onClick={() => { setInd(i); setOpen(false) }}>{i}{ind === i && <Check size={13} style={{ marginLeft: 'auto' }} />}</button>)}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <div className="s-table">
          <div className="s-tr s-kb s-thd"><H k="name">Client</H><H k="industry">Industry</H><H k="campaigns" r>Campaigns</H><H k="spend" r>Billing</H><H k="lastCampaign">Last active</H><span>Owner</span></div>
          {sorted.map((c) => (
            <div key={c.id} className="s-tr s-kb" onClick={() => toast(c.name, { description: `${c.campaigns} campaigns · ${fmt.inr(c.spend)}` })}>
              <span className="s-tname"><span className="s-logo" style={{ background: `oklch(0.45 0.1 ${industryHue[c.industry]})` }}>{c.name[0]}</span><b className="ell">{c.name}</b></span>
              <span><span className="s-badge" style={{ '--c': `oklch(0.75 0.12 ${industryHue[c.industry]})` }}><i />{c.industry}</span></span>
              <span className="r s-mono">{c.campaigns}</span>
              <span className="r s-mono">{fmt.inr(c.spend)}</span>
              <span className="s-dim s-xs">{fmt.ago(c.lastCampaign)}</span>
              <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Avatar user={c.owner} size={20} /><span className="s-dim2 s-xs">{c.owner.short}</span></span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
