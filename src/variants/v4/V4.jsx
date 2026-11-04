import { useMemo, useState, useRef } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  Search, Home, Inbox, ChevronRight, Megaphone, CheckCheck, PenTool, BarChart3, BookOpen, Plus, MoreHorizontal, Table2,
  KanbanSquare, CalendarDays, X, Maximize2, MessageSquare, Clock, User, Building2, Hash, IndianRupee, Calendar, Link2, CircleDot,
  Check, PanelLeftClose, PanelLeft, Lightbulb, AlertTriangle, ArrowLeft, Sun, Moon, Settings, Trash2, FileText, StickyNote, Sparkles,
} from 'lucide-react'
import {
  campaigns, campaignById, clients, statuses, statusById, me, team, monthly, months, activity, pending, sketchboards, casDashboards,
  creators, fmt, kbTotal, industries, activeCampaigns, submissions, TODAY,
} from '../../data'
import { go, parseRoute, ease, Avatar, PlatformIcon, AreaChart, Bars, CommandMenu, useVariantRoot, useGlobalNav, useHotkeys, Ticker } from '../../shared/ui'
import { useInvoices, Thumb, BoardCover, industryHue } from '../../shared/state'
import { toast } from 'sonner'
import './v4.css'

const B = '/v4'
const tagHue = { proposal: 60, onboarding: 220, live: 145, posting: 290, closing: 40, payment: 15, closed: 0 }
const Tag = ({ s }) => <span className={'p-tag' + (s === 'closed' ? ' gray' : '')} style={{ '--h': tagHue[s] }}>{statusById[s].label}</span>

export default function V4({ path }) {
  const [theme, setTheme] = useState('light')
  useVariantRoot('v4', theme)
  const { page, id } = parseRoute(path)
  const [cmd, setCmd] = useState(false)
  const [side, setSide] = useState(true)
  useGlobalNav(B, setCmd)
  const inv = useInvoices()
  const [rows, setRows] = useState(campaigns)
  const move = (cid, s) => setRows((r) => r.map((c) => (c.id === cid ? { ...c, status: s } : c)))
  useHotkeys({ 'mod+\\': () => setSide((s) => !s) }, [])

  return (
    <div className="p">
      <motion.aside className="p-side" animate={{ width: side ? 248 : 0 }} transition={{ duration: 0.25, ease: ease.inOut }}>
        <Sidebar page={page} id={id} setCmd={setCmd} close={() => setSide(false)} inv={inv.items.length} theme={theme} setTheme={setTheme} />
      </motion.aside>
      <main className="p-main">
        <div className="p-topbar">
          {!side && <button className="p-ib press" onClick={() => setSide(true)} title="Open sidebar (⌘\)"><PanelLeft size={16} /></button>}
          <Crumbs page={page} id={id} />
          <div className="p-topbar-r">
            <span className="p-dim p-xs">Edited {fmt.ago(new Date(TODAY - 36e5 * 2))}</span>
            <button className="p-tb press" onClick={() => toast('Link copied')}>Share</button>
            <button className="p-ib press"><MessageSquare size={15} /></button>
            <button className="p-ib press"><MoreHorizontal size={16} /></button>
          </div>
        </div>
        <div className="p-scroll">
          {page === 'dashboard' && <HomePage inv={inv} rows={rows} />}
          {page === 'campaigns' && <CampaignsDB rows={rows} move={move} openId={id} />}
          {page === 'approvals' && <ApprovalsPage inv={inv} />}
          {page === 'sketchboards' && (id ? <Canvas board={sketchboards.find((b) => b.id === id)} /> : <BoardsPage />)}
          {page === 'analytics' && <AnalyticsPage />}
          {page === 'knowledge' && <KBPage />}
        </div>
      </main>
      <CommandMenu open={cmd} setOpen={setCmd} base={B} onToggleTheme={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))} />
    </div>
  )
}

function Sidebar({ page, id, setCmd, close, inv, theme, setTheme }) {
  const [open, setOpen] = useState({ campaigns: true, sketchboards: false })
  const T = ({ k, icon: I, label, kids, count }) => (
    <>
      <div className={'p-tree' + (page === k && !id ? ' on' : '')}>
        <button className="p-tw" onClick={() => kids && setOpen((o) => ({ ...o, [k]: !o[k] }))} style={{ visibility: kids ? 'visible' : 'hidden' }}>
          <ChevronRight size={12} style={{ rotate: open[k] ? '90deg' : '0deg', transition: 'rotate 150ms ease' }} />
        </button>
        <a href={`#${B}/${k}`}><I size={15} className="p-ti" /> {label}</a>
        {count ? <span className="p-tcount">{count}</span> : null}
      </div>
      <AnimatePresence initial={false}>
        {kids && open[k] && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2, ease: ease.out }} style={{ overflow: 'hidden' }}>
            {kids.map((c) => (
              <a key={c.id} href={`#${B}/${k}/${c.id}`} className={'p-tree p-tree-kid' + (id === c.id ? ' on' : '')}>
                <span className="p-tw" /><FileText size={14} className="p-ti" /> <span className="ell">{c.name || c.title}</span>
              </a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
  return (
    <div className="p-side-in">
      <div className="p-ws">
        <span className="p-ws-ic">W</span><b>WLDD HQ</b>
        <button className="p-ib sm press" onClick={close} style={{ marginLeft: 'auto' }} title="Close sidebar"><PanelLeftClose size={15} /></button>
      </div>
      <button className="p-tree p-plain press" onClick={() => setCmd(true)}><span className="p-tw" /><Search size={15} className="p-ti" /> Search <kbd>⌘K</kbd></button>
      <a href={`#${B}/dashboard`} className={'p-tree p-plain' + (page === 'dashboard' ? ' on' : '')}><span className="p-tw" /><Home size={15} className="p-ti" /> Home</a>
      <button className="p-tree p-plain press" onClick={() => toast('Inbox is empty')}><span className="p-tw" /><Inbox size={15} className="p-ti" /> Inbox</button>

      <div className="p-sh">Teamspace</div>
      <T k="campaigns" icon={Megaphone} label="Campaigns" kids={activeCampaigns.slice(0, 8)} />
      <T k="approvals" icon={CheckCheck} label="Approvals" count={inv} />
      <T k="sketchboards" icon={PenTool} label="Sketchboards" kids={sketchboards.slice(0, 6)} />
      <T k="analytics" icon={BarChart3} label="Analytics" />
      <T k="knowledge" icon={BookOpen} label="Knowledge base" />

      <div className="p-sh">Private</div>
      {['Satish’s scratchpad', 'Q4 pitch notes', 'Creator rate cards'].map((t) => <button key={t} className="p-tree p-plain press" onClick={() => toast(t)}><span className="p-tw" /><StickyNote size={15} className="p-ti" /> {t}</button>)}

      <div className="p-side-f">
        <button className="p-tree p-plain press" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}><span className="p-tw" />{theme === 'light' ? <Moon size={15} className="p-ti" /> : <Sun size={15} className="p-ti" />} {theme === 'light' ? 'Dark mode' : 'Light mode'}</button>
        <button className="p-tree p-plain press"><span className="p-tw" /><Settings size={15} className="p-ti" /> Settings</button>
        <button className="p-tree p-plain press"><span className="p-tw" /><Trash2 size={15} className="p-ti" /> Trash</button>
      </div>
    </div>
  )
}

function Crumbs({ page, id }) {
  const names = { dashboard: 'Home', campaigns: 'Campaigns', approvals: 'Approvals', sketchboards: 'Sketchboards', analytics: 'Analytics', knowledge: 'Knowledge base' }
  const child = id && (campaignById[id]?.name || sketchboards.find((b) => b.id === id)?.title)
  return (
    <div className="p-crumbs">
      <span>WLDD HQ</span><span className="p-dim">/</span>
      <a href={`#${B}/${page}`}>{names[page]}</a>
      {child && <><span className="p-dim">/</span><span className="ell">{child}</span></>}
    </div>
  )
}

function PageHead({ cover, icon: I, title, desc }) {
  return (
    <>
      <div className="p-cover" style={{ background: cover }} />
      <div className="p-doc">
        <motion.div className="p-icon"><I size={34} strokeWidth={1.5} /></motion.div>
        <h1 className="p-title">{title}</h1>
        {desc && <p className="p-desc">{desc}</p>}
      </div>
    </>
  )
}

/* ─────────── Home ─────────── */
function HomePage({ inv, rows }) {
  const queues = [
    ['Pending campaigns', pending.campaigns.length, 'in proposal for 2+ weeks', 'campaigns'],
    ['Pending closings', pending.closings.length, 'past posting end date +7 days', 'campaigns'],
    ['Pending payments', pending.payments.length, 'payment not received yet', 'campaigns'],
    ['Pending screenshots', pending.screenshots.length, 'awaiting approval', 'approvals'],
    ['Pending approvals', inv.items.length, 'invoices awaiting review', 'approvals'],
    ['Creator submissions', pending.submissions.length, 'awaiting approval', 'approvals'],
  ]
  return (
    <>
      <PageHead cover="linear-gradient(120deg, #f6d6b8 0%, #e9c3d6 45%, #c9d4f2 100%)" icon={Home} title="WLDD Operations" desc="The one page everyone opens first. What needs attention, what’s live, and how the month is going." />
      <div className="p-doc">
        <div className="p-callout"><Lightbulb size={18} className="p-callout-ic" /><div><b>{queues.reduce((a, q) => a + q[1], 0)} things need a decision.</b> Payments and closings first — they block month-end. Type <kbd>⌘K</kbd> to jump anywhere.</div></div>

        <h2 className="p-h2">Pending actions</h2>
        <div className="p-gallery">
          {queues.map(([l, n, sub, to], i) => (
            <motion.a key={l} href={`#${B}/${to}`} className="p-gcard">
              <span className="p-gcard-n"><Ticker value={n} /></span>
              <b>{l}</b>
              <span className="p-dim p-xs">{sub}</span>
            </motion.a>
          ))}
        </div>

        <h2 className="p-h2">November at a glance</h2>
        <div className="p-cols5">
          {[['Campaigns executed', monthly.executed, (n) => Math.round(n)], ['Total postings', monthly.postings, (n) => fmt.num(Math.round(n))], ['Total views', monthly.views, fmt.compact], ['Total likes', monthly.likes, fmt.compact], ['Total comments', monthly.comments, fmt.compact]].map(([l, s, f]) => (
            <div key={l}><div className="p-dim p-xs">{l}</div><div className="p-bignum"><Ticker value={s.value} format={f} /></div><div className={'p-xs ' + (s.delta >= 0 ? 'p-up' : 'p-down')}>{fmt.pct(s.delta)} vs Oct</div></div>
          ))}
        </div>

        <h2 className="p-h2">Active campaigns <a className="p-linkdb" href={`#${B}/campaigns`}>↗ Campaigns</a></h2>
        <MiniTable rows={rows.filter((c) => ['live', 'posting', 'onboarding'].includes(c.status)).slice(0, 8)} />

        <h2 className="p-h2">Recently</h2>
        <ul className="p-bullets">
          {activity.slice(0, 8).map((a) => (
            <li key={a.id}><span className="p-mention"><Avatar user={a.user} size={16} />{a.user.short}</span> {a.text.replace(a.user.short + ' ', '')} <span className="p-dim">— {fmt.ago(a.at)}</span></li>
          ))}
        </ul>
      </div>
    </>
  )
}

function MiniTable({ rows, onOpen }) {
  return (
    <div className="p-table">
      <div className="p-tr p-th"><span><FileText size={13} /> Name</span><span><CircleDot size={13} /> Status</span><span><Building2 size={13} /> Client</span><span><User size={13} /> Owner</span><span><IndianRupee size={13} /> Budget</span><span><Calendar size={13} /> Ends</span></div>
      {rows.map((c) => (
        <a key={c.id} href={`#${B}/campaigns/${c.id}`} className="p-tr" onClick={onOpen}>
          <span className="p-name"><FileText size={14} className="p-dim" /><span className="ell">{c.name}</span><span className="p-open">OPEN</span></span>
          <span><Tag s={c.status} /></span>
          <span className="ell">{c.client}</span>
          <span className="p-person"><Avatar user={c.owner} size={18} />{c.owner.short}</span>
          <span className="p-num">{fmt.inrFull(c.budget)}</span>
          <span className="p-dim">{fmt.dateLong(c.end)}</span>
        </a>
      ))}
    </div>
  )
}

/* ─────────── Campaigns database ─────────── */
function CampaignsDB({ rows, move, openId }) {
  const [view, setView] = useState('board')
  const open = openId ? rows.find((c) => c.id === openId) : null
  useHotkeys({ escape: () => openId && go(`${B}/campaigns`) }, [openId])
  return (
    <>
      <PageHead cover="linear-gradient(120deg, #c8e2d3, #d8e6f7 60%, #efe1f7)" icon={Megaphone} title="Campaigns" desc="Every brief, from proposal to payment. Drag cards across the board to move them through the pipeline." />
      <div className="p-doc p-doc-wide">
        <div className="p-views">
          {[['board', KanbanSquare, 'Pipeline'], ['table', Table2, 'All campaigns'], ['calendar', CalendarDays, 'Calendar']].map(([v, I, l]) => (
            <button key={v} className={'p-viewtab' + (view === v ? ' on' : '')} onClick={() => setView(v)}>
              <I size={14} /> {l}{view === v && <motion.i layoutId="p-vt" transition={{ type: 'spring', duration: 0.3, bounce: 0 }} />}
            </button>
          ))}
          <div className="p-views-r"><button className="p-tb press">Filter</button><button className="p-tb press">Sort</button><button className="p-new press" onClick={() => toast.success('New page in Campaigns')}>New</button></div>
        </div>
        {view === 'table' && <MiniTable rows={rows} />}
        {view === 'board' && <Kanban rows={rows} move={move} />}
        {view === 'calendar' && <CalendarView rows={rows} />}
      </div>
      <AnimatePresence>{open && <CenterPeek key={open.id} c={open} />}</AnimatePresence>
    </>
  )
}

function Kanban({ rows, move }) {
  const [drag, setDrag] = useState(null)
  const [over, setOver] = useState(null)
  return (
    <div className="p-kanban">
      {statuses.map((s) => {
        const col = rows.filter((c) => c.status === s.id)
        return (
          <div key={s.id} className={'p-kcol' + (over === s.id ? ' over' : '')}
            onDragOver={(e) => { e.preventDefault(); setOver(s.id) }} onDragLeave={() => setOver(null)}
            onDrop={() => { if (drag && campaignById[drag]) { const from = rows.find((c) => c.id === drag)?.status; if (from !== s.id) { move(drag, s.id); toast.success(`Moved to ${s.label}`, { description: campaignById[drag].name }) } } setDrag(null); setOver(null) }}>
            <div className="p-kh"><Tag s={s.id} /><span className="p-dim">{col.length}</span></div>
            <AnimatePresence initial={false}>
              {col.map((c) => (
                <motion.div key={c.id} layout layoutId={'k-' + c.id} transition={{ duration: 0.25, ease: ease.out }}>
                  <a href={`#${B}/campaigns/${c.id}`} className={'p-kcard' + (drag === c.id ? ' dragging' : '')} draggable
                    onDragStart={(e) => { setDrag(c.id); e.dataTransfer.effectAllowed = 'move' }} onDragEnd={() => { setDrag(null); setOver(null) }}>
                    <b>{c.name}</b>
                    <div className="p-kmeta"><span className="p-chip">{c.client}</span><span className="p-chip">{c.type}</span></div>
                    <div className="p-kfoot"><span className="p-person"><Avatar user={c.owner} size={16} />{c.owner.short}</span><span className="p-dim p-xs">{fmt.inr(c.budget)}</span></div>
                  </a>
                </motion.div>
              ))}
            </AnimatePresence>
            <button className="p-kadd press" onClick={() => toast.success(`New page in ${s.label}`)}><Plus size={14} /> New</button>
          </div>
        )
      })}
    </div>
  )
}

function CalendarView({ rows }) {
  const start = new Date(2026, 10, 1)
  const offset = (start.getDay() + 6) % 7
  const days = Array.from({ length: 35 }, (_, i) => new Date(2026, 10, i - offset + 1))
  return (
    <div className="p-cal">
      <div className="p-cal-h"><b>November 2026</b><span className="p-dim p-xs">Campaign end dates</span></div>
      <div className="p-cal-grid">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => <div key={d} className="p-cal-dn">{d}</div>)}
        {days.map((d, i) => {
          const items = rows.filter((c) => c.end.toDateString() === d.toDateString() || (i % 9 === 3 && c.id.endsWith(String(i % 10)) && d.getMonth() === 10))
          const today = d.toDateString() === TODAY.toDateString()
          return (
            <div key={i} className={'p-cal-d' + (d.getMonth() !== 10 ? ' out' : '')}>
              <span className={'p-cal-num' + (today ? ' today' : '')}>{d.getDate()}</span>
              {items.slice(0, 3).map((c) => <a key={c.id} href={`#${B}/campaigns/${c.id}`} className="p-cal-ev" style={{ '--h': tagHue[c.status] }}>{c.name}</a>)}
              {items.length > 3 && <span className="p-dim p-xs">+{items.length - 3} more</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CenterPeek({ c }) {
  const [todos, setTodos] = useState([
    ['Brief signed off by client', true], ['Creator shortlist approved', c.status !== 'proposal'], ['Content calendar shared', !['proposal', 'onboarding'].includes(c.status)],
    ['All posts live', ['closing', 'payment', 'closed'].includes(c.status)], ['Final report sent', ['payment', 'closed'].includes(c.status)], ['Payment received', c.status === 'closed'],
  ])
  const subs = submissions.filter((s) => s.campaignId === c.id).slice(0, 4)
  return (
    <>
      <motion.div className="p-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} onClick={() => go(`${B}/campaigns`)} />
      <motion.div className="p-peek" initial={{ opacity: 0, scale: 0.97, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 6 }} transition={{ duration: 0.22, ease: ease.out }}>
        <div className="p-peek-bar">
          <button className="p-ib press" onClick={() => go(`${B}/campaigns`)}><X size={16} /></button>
          <button className="p-ib press" onClick={() => toast('Opened as full page')}><Maximize2 size={14} /></button>
          <span className="p-dim p-xs" style={{ marginLeft: 'auto' }}>{c.id}</span>
          <button className="p-ib press"><MoreHorizontal size={16} /></button>
        </div>
        <div className="p-peek-body">
          <h1 className="p-title sm">{c.name}</h1>
          <div className="p-props">
            {[
              [CircleDot, 'Status', <Tag s={c.status} />], [Building2, 'Client', c.client], [User, 'Owner', <span className="p-person"><Avatar user={c.owner} size={18} />{c.owner.name}</span>],
              [Hash, 'Type', <span className="p-chip">{c.type}</span>], [IndianRupee, 'Budget', fmt.inrFull(c.budget)], [Calendar, 'Window', `${fmt.dateLong(c.start)} → ${fmt.dateLong(c.end)}`],
              [Link2, 'Platforms', <span className="p-person">{c.platforms.map((p) => <PlatformIcon key={p} platform={p} size={13} />)} {c.platforms.join(', ')}</span>],
              [Clock, 'Last edited', fmt.ago(c.updated)],
            ].map(([I, k, v]) => <div key={k} className="p-prop"><span className="p-prop-k"><I size={14} /> {k}</span><span className="p-prop-v">{v}</span></div>)}
          </div>
          <div className="p-comment-row"><Avatar user={me} size={22} /><input placeholder="Add a comment…" onKeyDown={(e) => { if (e.key === 'Enter' && e.currentTarget.value) { toast.success('Comment added'); e.currentTarget.value = '' } }} /></div>
          <h3 className="p-h3">Brief</h3>
          <p className="p-p">{c.brief}</p>
          <h3 className="p-h3">Checklist</h3>
          {todos.map(([t, d], i) => (
            <label key={t} className={'p-todo' + (d ? ' done' : '')}>
              <button className={'p-cb' + (d ? ' on' : '')} onClick={() => setTodos((x) => x.map((y, j) => (j === i ? [y[0], !y[1]] : y)))}>{d && <Check size={11} strokeWidth={3} />}</button>
              <span>{t}</span>
            </label>
          ))}
          <h3 className="p-h3">Numbers</h3>
          <div className="p-cols4">
            {[['Deliverables', `${c.delivered}/${c.deliverables}`], ['Views', fmt.compact(c.views)], ['Likes', fmt.compact(c.likes)], ['ER', c.er + '%']].map(([k, v]) => <div key={k}><div className="p-dim p-xs">{k}</div><div className="p-bignum sm">{v}</div></div>)}
          </div>
          {subs.length > 0 && (<><h3 className="p-h3">Latest content</h3><div className="p-thumbs">{subs.map((s) => <Thumb key={s.id} s={s} radius={4} />)}</div></>)}
        </div>
      </motion.div>
    </>
  )
}

/* ─────────── Approvals as toggle blocks ─────────── */
function ApprovalsPage({ inv }) {
  const [open, setOpen] = useState(new Set([inv.items[0]?.id]))
  return (
    <>
      <PageHead cover="linear-gradient(120deg, #e7e0ce, #f3e7c8 50%, #e9d3c2)" icon={CheckCheck} title="Deliverable approvals" desc="Review the deliverables in each invoice and approve or reject them. Expand a toggle to see what you’re paying for." />
      <div className="p-doc">
        {inv.items.length > 0 ? (
          <div className="p-callout warn"><AlertTriangle size={18} className="p-callout-ic" /><div><b>{inv.items.length} invoices · {fmt.inr(inv.items.reduce((a, x) => a + x.amount, 0))}</b> waiting. {inv.items.filter((x) => x.due < TODAY).length} are already past due.</div></div>
        ) : (
          <div className="p-callout"><Sparkles size={18} className="p-callout-ic" /><div><b>No invoices to approve.</b> You’re all caught up.</div></div>
        )}
        <AnimatePresence initial={false}>
          {inv.items.map((x) => {
            const isOpen = open.has(x.id)
            return (
              <motion.div key={x.id} className="p-toggle" layout="position" exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2, ease: ease.out }}>
                <button className="p-toggle-h" onClick={() => setOpen((s) => { const n = new Set(s); n.has(x.id) ? n.delete(x.id) : n.add(x.id); return n })}>
                  <ChevronRight size={14} style={{ rotate: isOpen ? '90deg' : '0deg', transition: 'rotate 150ms ease' }} />
                  <b>{x.vendor}</b><span className="p-dim">— {x.campaign}</span>
                  <span className="p-num" style={{ marginLeft: 'auto' }}>{fmt.inrFull(x.amount)}</span>
                  {x.due < TODAY && <span className="p-tag" style={{ '--h': 15 }}>Overdue</span>}
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div className="p-toggle-b" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22, ease: ease.out }}>
                      <div className="p-toggle-in">
                        <div className="p-props compact">
                          {[['Invoice', x.no], ['Client', x.client], ['Service', x.service], ['Submissions', `${x.approvedSubs} of ${x.submissions} verified`], ['Received', fmt.dateLong(x.date)], ['Due', fmt.dateLong(x.due)]].map(([k, v]) => <div key={k} className="p-prop"><span className="p-prop-k">{k}</span><span className="p-prop-v">{v}</span></div>)}
                        </div>
                        <div className="p-thumbs six">{submissions.slice((x.id.length * 3) % 20, (x.id.length * 3) % 20 + 6).map((s) => <Thumb key={s.id} s={s} radius={4} showMeta={false} />)}</div>
                        <div className="p-btnrow">
                          <button className="p-btn press" onClick={() => inv.reject(x.id)}>Reject</button>
                          <button className="p-btn p-btn-p press" onClick={() => inv.approve(x.id)}><Check size={14} /> Approve</button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </>
  )
}

/* ─────────── Sketchboards: gallery + canvas ─────────── */
function BoardsPage() {
  return (
    <>
      <PageHead cover="linear-gradient(120deg, #d9d2f3, #f3d2e4 50%, #f7e3c9)" icon={PenTool} title="Sketchboards" desc="Plan your campaign, explore client insights, create content samples for your pitch deck and more." />
      <div className="p-doc p-doc-wide">
        <div className="p-bgallery">
          {sketchboards.map((b, i) => (
            <motion.a key={b.id} href={`#${B}/sketchboards/${b.id}`} className="p-bcard">
              <BoardCover board={b} height={120} dark={document.documentElement.dataset.theme === 'dark'} />
              <div className="p-bcard-m"><b className="ell">{b.title}</b><div className="p-kmeta">{b.tags.map((t) => <span key={t} className="p-chip">{t}</span>)}</div><span className="p-dim p-xs">{b.cards} cards · edited {fmt.ago(b.updated)}</span></div>
            </motion.a>
          ))}
          <button className="p-bcard p-bnew press" onClick={() => toast.success('Board created')}><Plus size={18} /> New board</button>
        </div>
      </div>
    </>
  )
}

function Canvas({ board }) {
  const wrap = useRef(null)
  const seed = [
    { id: 'n1', x: 80, y: 70, t: 'Big idea', b: `“${board.client || 'WLDD'} — but make it a meme”`, h: board.palette[0] },
    { id: 'n2', x: 380, y: 50, t: 'Audience', b: 'Gen Z, tier-1 & 2, late-night scrollers', h: board.palette[1] },
    { id: 'n3', x: 680, y: 110, t: 'Hook bank', b: 'POV formats · “nobody: / me:” · reaction duets', h: board.palette[2] },
    { id: 'n4', x: 140, y: 290, t: 'Creators', b: '12 meme pages + 6 mid-tier creators', h: board.palette[0] },
    { id: 'n5', x: 450, y: 280, t: 'Timeline', b: 'Teasers D-3 · drop day blitz · recap D+2', h: board.palette[1] },
    { id: 'n6', x: 760, y: 330, t: 'KPIs', b: '25M views · 4% ER · 30K saves', h: board.palette[2] },
  ]
  const [notes, setNotes] = useState(seed)
  const [dragging, setDragging] = useState(null)
  const last = useRef({ x: 0, y: 0 })
  const links = [['n1', 'n2'], ['n2', 'n3'], ['n1', 'n4'], ['n4', 'n5'], ['n5', 'n6'], ['n3', 'n6']]
  const pos = Object.fromEntries(notes.map((n) => [n.id, n]))
  const W = 200, H = 96
  return (
    <div className="p-canvas-wrap">
      <div className="p-canvas-bar">
        <a href={`#${B}/sketchboards`} className="p-tb"><ArrowLeft size={14} /> Boards</a>
        <b>{board.title}</b>
        <span className="p-dim p-xs">Drag notes around — connectors follow.</span>
        <button className="p-tb press" style={{ marginLeft: 'auto' }} onClick={() => setNotes((n) => [...n, { id: 'n' + (n.length + 1), x: 300 + n.length * 12, y: 180 + n.length * 10, t: 'New note', b: 'Double-click to edit', h: board.palette[n.length % 3] }])}><Plus size={14} /> Note</button>
      </div>
      <div className="p-canvas" ref={wrap}>
        <svg className="p-links">
          {links.map(([a, b]) => pos[a] && pos[b] && (
            <path key={a + b} d={`M${pos[a].x + W / 2},${pos[a].y + H / 2} C${(pos[a].x + pos[b].x) / 2 + W / 2},${pos[a].y + H / 2} ${(pos[a].x + pos[b].x) / 2 + W / 2},${pos[b].y + H / 2} ${pos[b].x + W / 2},${pos[b].y + H / 2}`} />
          ))}
        </svg>
        {notes.map((n) => (
          <div key={n.id} className={'p-note' + (dragging === n.id ? ' dragging' : '')}
            style={{ transform: `translate(${n.x}px, ${n.y}px)`, width: W, '--h': n.h }}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId)
              setDragging(n.id)
              last.current = { x: e.clientX, y: e.clientY }
            }}
            onPointerMove={(e) => {
              if (dragging !== n.id) return
              const dx = e.clientX - last.current.x, dy = e.clientY - last.current.y
              last.current = { x: e.clientX, y: e.clientY }
              setNotes((ns) => ns.map((x) => (x.id === n.id ? { ...x, x: Math.max(0, x.x + dx), y: Math.max(0, x.y + dy) } : x)))
            }}
            onPointerUp={() => setDragging(null)}>
            <div className="p-note-in"><b>{n.t}</b><p>{n.b}</p></div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─────────── Analytics ─────────── */
function AnalyticsPage() {
  return (
    <>
      <PageHead cover="linear-gradient(120deg, #cfe6f3, #d6f0e3 60%, #eef3c9)" icon={BarChart3} title="Analytics" desc="Monthly performance across all campaigns, plus client-specific CAS dashboards." />
      <div className="p-doc">
        <h2 className="p-h2">Views, last 12 months</h2>
        <div className="p-chartbox"><AreaChart data={monthly.views.series} labels={months} height={220} color="var(--accent)" format={fmt.compact} /></div>
        <h2 className="p-h2">Postings per month</h2>
        <div className="p-chartbox"><Bars data={monthly.postings.series} labels={months} height={140} color="var(--accent)" format={fmt.num} /></div>
        <h2 className="p-h2">CAS dashboards</h2>
        <div className="p-callout"><Lightbulb size={18} className="p-callout-ic" /><div>Locked dashboards are curated by <span className="p-mention"><Avatar user={team[1]} size={16} />Kirsten</span>. Ask for access instead of seeing an error.</div></div>
        <div className="p-table">
          <div className="p-tr p-th c4"><span>Dashboard</span><span>Client</span><span>Headline</span><span>Access</span></div>
          {casDashboards.map((d) => (
            <div key={d.id} className="p-tr c4">
              <span className="p-name"><BarChart3 size={14} className="p-dim" />{d.title}</span><span>{d.client}</span><span className="p-num">{d.kpi}</span>
              <span>{d.locked ? <button className="p-btn sm press" onClick={() => toast.success('Request sent to Kirsten')}>Request access</button> : <span className="p-tag" style={{ '--h': 145 }}>Open</span>}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

/* ─────────── Knowledge base (grouped) ─────────── */
function KBPage() {
  const [q, setQ] = useState('')
  const [closed, setClosed] = useState(new Set())
  const groups = industries.map((i) => ({ i, rows: clients.filter((c) => c.industry === i && c.name.toLowerCase().includes(q.toLowerCase())) })).filter((g) => g.rows.length)
  return (
    <>
      <PageHead cover="linear-gradient(120deg, #efe6d6, #e6efe0 50%, #dfe7f2)" icon={BookOpen} title="Knowledge base" desc={`Browse ${kbTotal} clients and their campaign history, grouped by industry.`} />
      <div className="p-doc">
        <div className="p-inline-search"><Search size={14} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search clients…" /></div>
        {groups.map((g) => {
          const c = closed.has(g.i)
          return (
            <div key={g.i} className="p-group">
              <button className="p-group-h" onClick={() => setClosed((s) => { const n = new Set(s); n.has(g.i) ? n.delete(g.i) : n.add(g.i); return n })}>
                <ChevronRight size={14} style={{ rotate: c ? '0deg' : '90deg', transition: 'rotate 150ms' }} />
                <span className="p-tag" style={{ '--h': industryHue[g.i] }}>{g.i}</span><span className="p-dim">{g.rows.length}</span>
              </button>
              {!c && (
                <div className="p-table">
                  {g.rows.map((r) => (
                    <div key={r.id} className="p-tr c5" onClick={() => toast(r.name, { description: `${r.campaigns} campaigns` })}>
                      <span className="p-name"><Building2 size={14} className="p-dim" />{r.name}</span>
                      <span className="p-num">{r.campaigns} campaigns</span>
                      <span className="p-num">{fmt.inr(r.spend)}</span>
                      <span className="p-person"><Avatar user={r.owner} size={18} />{r.owner.short}</span>
                      <span className="p-dim">{fmt.ago(r.lastCampaign)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}
