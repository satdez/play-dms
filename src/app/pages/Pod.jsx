import { useMemo, useState, useRef } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  Search, Lock, Pin, PinOff, FolderOpen, FileSpreadsheet, Minus, Plus, Check, X, Link2, User, Store, Eye, ArrowUpRight, Sparkles, CornerDownLeft,
} from 'lucide-react'
import { toast } from 'sonner'
import { useStore } from '../store'
import { STAGES, STAGE_FULL, PODS, planFor, trackerFor, fmt, TODAY, SERVICES, CHAIN_LABEL } from '../data'
import { Ticker, ConfirmButton, Tip, TextMorph, SlidePanel, AutoHeight, Swap, EASE } from '../../shared/motion'
import { Avatar, AvatarStack, Meter, Sparkline } from '../../shared/ui'
import { MediaGrid, postItem, invoiceMedia } from '../media'
import { Seg, Tabs, Svc, Track, Chain, ClientLogo, Popover, Switch, go, useExp } from '../ui'
import { CampaignViews } from '../views'

/* ═════════ Campaign list — rendered by the view engine (list · board · table · timeline · grid) ═════════ */
export function CampaignList() {
  const exp = useExp()
  return <CampaignViews key={exp} exp={exp} />
}

/* ═════════ Campaign page ═════════ */
const TABS = ['overview', 'plan', 'tracker', 'report']
export function CampaignPage({ id, tab }) {
  const s = useStore()
  const c = s.campaigns.find((x) => x.id === id)
  if (!c) return <div className="d-page"><div className="empty"><b>Not found</b></div></div>
  const planned = c.services.some((k) => SERVICES[k].planned)
  const setTab = (t) => go(`/pod/campaigns/${c.id}${t === 'overview' ? '' : '/' + t}`)
  const advance = () => s.patchCampaign(c.id, (x) => ({ stage: Math.min(6, x.stage + 1), planApproved: x.stage + 1 >= 4 ? true : x.planApproved }))

  return (
    <div className="d-page">
      <div className="cp-head">
        <ClientLogo name={c.client} industry={c.industry} size="lg" />
        <div className="grow">
          <h1 className="d-h1 ell">{c.client} <span className="mute" style={{ fontWeight: 500 }}>× {c.activity}</span></h1>
          <div className="row mute xs" style={{ marginTop: 4, gap: 10 }}>
            <span>{c.pod}</span><Svc list={c.services} />
          </div>
        </div>
        <Tip label={c.pinned ? 'Unpin' : 'Pin'}>
          <button className="b icon" onClick={() => s.patchCampaign(c.id, { pinned: !c.pinned })} aria-label="Pin">
            <Pin size={15} fill={c.pinned ? 'currentColor' : 'none'} style={{ transition: 'fill 200ms', rotate: c.pinned ? '0deg' : '20deg' }} />
          </button>
        </Tip>
        {c.stage < 6 && <ConfirmButton key={c.stage} className="b ink" label={c.stage === 5 ? 'Mark complete' : `Move to ${STAGES[c.stage + 1]}`} doneLabel={c.stage === 5 ? 'Complete' : `In ${STAGES[c.stage + 1]}`} icon={<ArrowUpRight size={14} />} onDone={advance} />}
      </div>

      <div className="stepper" style={{ margin: '22px 0 26px' }}>
        {STAGE_FULL.map((l, i) => (
          <div key={l} className={'step' + (i < c.stage ? ' done' : i === c.stage ? ' cur' : '')}>
            <div className="step-bar"><i style={{ transform: `scaleX(${i < c.stage ? 1 : i === c.stage ? 0.4 : 0})` }} /></div>
            <span>{l}</span>
          </div>
        ))}
      </div>

      <Tabs id="cp" value={tab} onChange={setTab} options={[
        { value: 'overview', label: 'Overview' },
        ...(planned ? [{ value: 'plan', label: 'Plan' }, { value: 'tracker', label: <span className="row" style={{ gap: 6 }}>Tracker {!c.planApproved && <Lock size={12} className="mute" />}</span> }] : []),
        { value: 'report', label: 'Report' },
      ]} />

      <SlidePanel k={tab} index={TABS.indexOf(tab)}>
        {tab === 'overview' && <Overview c={c} />}
        {tab === 'plan' && <Plan c={c} />}
        {tab === 'tracker' && <Tracker c={c} />}
        {tab === 'report' && <Report c={c} />}
      </SlidePanel>
    </div>
  )
}

function Overview({ c }) {
  const s = useStore()
  const margin = (c.budget - c.planCost) / c.budget
  const flags = [['agreement', 'Agreement'], ['po', 'PO'], ['invoice', 'Invoice'], ['payment', 'Payment']]
  return (
    <div className="ov">
      <div className="ov-main">
        <p className="brief">{c.brief}</p>
        <div className="metrics" style={{ marginTop: 24 }}>
          <div className="metric"><span className="metric-l">Budget</span><span className="metric-v num"><Ticker value={c.budget} format={fmt.inr} /></span></div>
          <div className="metric"><span className="metric-l">Plan cost</span><span className="metric-v num"><Ticker value={c.planCost} format={fmt.inr} /></span></div>
          <div className="metric"><span className="metric-l">Margin</span><span className="metric-v num" style={{ color: margin > 0.25 ? 'var(--green)' : 'var(--fg)' }}><Ticker value={Math.round(margin * 100)} format={(n) => Math.round(n) + '%'} /></span></div>
        </div>
        {c.stage >= 4 && (
          <div className="card" style={{ marginTop: 16 }}>
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
              <span className="metric-l">Delivered</span><span className="num fg2">{c.live}/{c.deliverables}</span>
            </div>
            <Meter value={c.live} max={c.deliverables} color="var(--green)" height={4} />
            <div style={{ marginTop: 16, color: 'var(--fg)' }}><Sparkline data={c.trend} width={620} height={56} color="currentColor" /></div>
          </div>
        )}
      </div>
      <aside className="ov-side">
        <div className="kv"><span>Lead</span><span className="row"><Avatar user={c.lead} size={20} />{c.lead.name}</span></div>
        <div className="kv"><span>Team</span><AvatarStack users={c.team} size={20} ring="var(--surface)" /></div>
        <div className="kv"><span>Started</span><span>{fmt.dateLong(c.start)}</span></div>
        <div className="kv"><span>Drive</span><a className="row fg2" href="#" onClick={(e) => { e.preventDefault(); toast('Opening Drive folder') }}><FolderOpen size={14} /> {c.code}</a></div>
        <div className="kv-sep" />
        <div className="kv"><span>Finance</span>
          <span className="flags">{flags.map(([k, l]) => <Tip key={k} label={l}><span className={'flag' + (c.flags[k] ? ' on' : '')}>{l[0]}</span></Tip>)}</span>
        </div>
        <div className="kv"><span>Tally</span><span className={'chip ' + ({ synced: 'g', queued: 'y', failed: 'p' }[c.tally] || '')}>{c.tally === 'none' ? 'Not sent' : c.tally[0].toUpperCase() + c.tally.slice(1)}</span></div>
        <div className="kv-sep" />
        <div className="kv"><span>Vendor submissions</span><Switch on={c.vendorVisible} onChange={(v) => s.patchCampaign(c.id, { vendorVisible: v })} label="Vendor visibility" /></div>
        <div className="kv"><span>Deep report</span><Switch on={c.deepReport} onChange={(v) => s.patchCampaign(c.id, { deepReport: v })} label="Deep report" /></div>
      </aside>
    </div>
  )
}

/* ───────── Plan ───────── */
const TYPES = [['reel', 'Reel'], ['post', 'Post'], ['story', 'Story']]
function Plan({ c }) {
  const s = useStore()
  const [plan, setPlan] = useState(() => planFor(c))
  const bump = (catId, pageId, t, d) => setPlan((p) => p.map((cat) => cat.id !== catId ? cat : { ...cat, pages: cat.pages.map((pg) => pg.id !== pageId ? pg : { ...pg, qty: { ...pg.qty, [t]: Math.max(0, Math.min(9, pg.qty[t] + d)) } }) }))
  const rowCost = (pg) => TYPES.reduce((a, [t]) => a + pg.cost[t] * pg.qty[t], 0)
  const total = plan.reduce((a, cat) => a + cat.pages.reduce((b, pg) => b + rowCost(pg), 0), 0)
  const units = plan.reduce((a, cat) => a + cat.pages.reduce((b, pg) => b + pg.qty.reel + pg.qty.post + pg.qty.story, 0), 0)
  const pages = plan.reduce((a, cat) => a + cat.pages.length, 0)
  const over = total > c.budget

  return (
    <div>
      {plan.map((cat) => (
        <section key={cat.id} className="plan-cat">
          <div className="group-h">{cat.name}<span className="mute num">{cat.pages.length}</span><span className="grow" /><span className="num fg2"><Ticker value={cat.pages.reduce((b, pg) => b + rowCost(pg), 0)} format={(n) => fmt.inrFull(Math.round(n))} /></span></div>
          <div className="list">
            {cat.pages.map((pg) => (
              <div key={pg.id} className="li plan-li">
                <Avatar user={pg.page} size={28} />
                <div className="grow">
                  <div className="row"><span className="li-t ell">{pg.page.handle}</span>{pg.adhoc && <Tip label="Adhoc — locked to this campaign until approved"><span className="chip y">Adhoc</span></Tip>}</div>
                  <div className="li-s num">{fmt.compact(pg.page.followers)}</div>
                </div>
                {TYPES.map(([t, l]) => (
                  <Tip key={t} label={`${l} · ${fmt.inrFull(pg.cost[t])}`}>
                    <span className={'qty' + (pg.qty[t] ? ' has' : '')}>
                      <button onClick={() => bump(cat.id, pg.id, t, -1)} aria-label={'Less ' + l}><Minus size={12} /></button>
                      <span className="qty-v"><span className="qty-l">{l[0]}</span><Ticker value={pg.qty[t]} /></span>
                      <button onClick={() => bump(cat.id, pg.id, t, 1)} aria-label={'More ' + l}><Plus size={12} /></button>
                    </span>
                  </Tip>
                ))}
                <span className="num plan-cost"><Ticker value={rowCost(pg)} format={(n) => fmt.inrFull(Math.round(n))} /></span>
              </div>
            ))}
          </div>
        </section>
      ))}

      <div className="plan-bar">
        <span><b className="num"><Ticker value={pages} /></b> <span className="mute">pages</span></span>
        <span><b className="num"><Ticker value={units} /></b> <span className="mute">deliverables</span></span>
        <span className="grow plan-meter">
          <Meter value={total} max={c.budget} color={over ? 'var(--pink)' : 'var(--fg)'} height={4} />
        </span>
        <span className="num"><b style={{ color: over ? 'var(--pink)' : undefined }}><Ticker value={total} format={(n) => fmt.inr(Math.round(n))} /></b> <span className="mute">/ {fmt.inr(c.budget)}</span></span>
        <Tip label="Export to Sheet"><button className="b icon sm" onClick={() => toast('Exported to Google Sheets')} aria-label="Export"><FileSpreadsheet size={14} /></button></Tip>
        {c.planApproved
          ? <span className="chip g"><Check size={12} /> Approved</span>
          : <ConfirmButton className="b sm ink" label="Client approved" doneLabel="Tracker ready" icon={<Check size={13} />} onDone={() => { s.patchCampaign(c.id, { planApproved: true }); toast.success('Tracker created', { description: `${units} deliverables` }) }} />}
      </div>
    </div>
  )
}

/* ───────── Tracker ───────── */
function Tracker({ c }) {
  const s = useStore()
  const [rows, setRows] = useState(() => trackerFor(c))
  const [f, setF] = useState(() => (rows.some((r) => r.status === 'review') ? 'review' : 'all'))
  if (!c.planApproved) {
    return <div className="empty"><Lock size={20} /><b>Locked</b><span>Opens once the client approves the plan</span><button className="b sm" onClick={() => go(`/pod/campaigns/${c.id}/plan`)}>Go to plan</button></div>
  }
  const count = (st) => rows.filter((r) => r.status === st).length
  const set = (id, patch) => setRows((l) => l.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  const shown = rows.filter((r) => f === 'all' || r.status === f)
  const live = count('live')

  return (
    <div>
      <div className="row" style={{ marginBottom: 12, gap: 12 }}>
        <Seg id="trk" value={f} onChange={setF} options={[
          { value: 'all', label: 'All', count: rows.length },
          { value: 'review', label: 'Review', count: count('review') },
          { value: 'missing', label: 'Missing', count: count('missing') },
          { value: 'live', label: 'Live', count: live },
        ]} />
        <span className="grow" />
        <span className="row xs mute"><Store size={13} /> Vendors <Switch on={c.vendorVisible} onChange={(v) => s.patchCampaign(c.id, { vendorVisible: v })} label="Vendor visibility" /></span>
        <span className="trk-prog"><Meter value={live} max={rows.length} color="var(--green)" height={4} /><span className="num xs fg2"><Ticker value={live} />/{rows.length}</span></span>
        <Tip label="Export to Sheet"><button className="b icon sm" onClick={() => toast('Exported to client sheet')} aria-label="Export"><FileSpreadsheet size={14} /></button></Tip>
      </div>
      <table className="tbl">
        <thead><tr><th>Page</th><th>Type</th><th>Link</th><th /><th className="r">Views</th></tr></thead>
        <tbody>
          <AnimatePresence initial={false}>
            {shown.map((r) => (
              <motion.tr key={r.id} layout="position" exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <td><span className="row"><Avatar user={r.page} size={22} /><span className="ell" style={{ maxWidth: 200, fontWeight: 500 }}>{r.page.handle}</span></span></td>
                <td><span className="chip">{r.type[0].toUpperCase() + r.type.slice(1)}</span></td>
                <td style={{ width: '42%' }}>
                  {r.link
                    ? <span className="row"><Tip label={r.source === 'vendor' ? 'Submitted by vendor' : 'Added by team'}><span className="mute" style={{ display: 'grid' }}>{r.source === 'vendor' ? <Store size={13} /> : <User size={13} />}</span></Tip><span className="mono ell fg2">{r.link}</span></span>
                    : <LinkInput onSubmit={(link) => set(r.id, { link, status: 'live', source: 'team', views: 0 })} />}
                </td>
                <td style={{ width: 120 }}>
                  {r.status === 'review' && (
                    <span className="row" style={{ gap: 4 }}>
                      <Tip label="Reject"><button className="b icon sm" onClick={() => set(r.id, { status: 'missing', link: null, source: null })} aria-label="Reject"><X size={13} /></button></Tip>
                      <ConfirmButton className="b sm" label="Approve" doneLabel="Live" icon={<Check size={13} />} hold={300} onDone={() => set(r.id, { status: 'live', views: Math.round(r.page.followers * 0.4) })} />
                    </span>
                  )}
                  {r.status === 'live' && <span className="chip g"><span className="dot" style={{ background: 'var(--green)' }} />Live</span>}
                </td>
                <td className="r num fg2">{r.views ? fmt.compact(r.views) : <span className="mute">—</span>}</td>
              </motion.tr>
            ))}
          </AnimatePresence>
        </tbody>
      </table>
      {!shown.length && <div className="empty"><Check size={18} /><b>Nothing here</b></div>}
    </div>
  )
}

function LinkInput({ onSubmit }) {
  const [v, setV] = useState('')
  return (
    <span className="inp link-inp">
      <Link2 size={13} />
      <input value={v} onChange={(e) => setV(e.target.value)} placeholder="Paste link" onKeyDown={(e) => { if (e.key === 'Enter' && v.trim()) { onSubmit(v.trim().replace(/^https?:\/\/(www\.)?/, '')); setV('') } }} />
      {v && <CornerDownLeft size={12} />}
    </span>
  )
}

/* ───────── Report ───────── */
function Report({ c }) {
  const s = useStore()
  const rows = useMemo(() => trackerFor(c).filter((r) => r.status === 'live'), [c])
  const gallery = useMemo(() => rows.slice(0, 12).map((r, i) => postItem({ id: r.id, handle: r.page.handle, avatarHue: r.page.hue, type: r.type, views: r.views, date: r.submitted, link: r.link, i })), [rows])
  const topics = [['Relatable humour', 34], ['Plot discussion', 22], ['Tagging friends', 18], ['Brand recall', 15], ['Complaints', 6]]
  if (!rows.length) return <div className="empty"><Sparkles size={20} /><b>No posts yet</b></div>
  return (
    <div>
      <div className="metrics">
        <div className="metric"><span className="metric-l">Views</span><span className="metric-v num">{fmt.compact(rows.reduce((a, r) => a + r.views, 0))}</span></div>
        <div className="metric"><span className="metric-l">Posts</span><span className="metric-v num">{rows.length}</span></div>
        <div className="metric"><span className="metric-l">Avg / post</span><span className="metric-v num">{fmt.compact(Math.round(rows.reduce((a, r) => a + r.views, 0) / rows.length))}</span></div>
      </div>
      <div className="row" style={{ margin: '24px 0 12px' }}>
        <span className="d-h2">Gallery</span><span className="grow" />
        <span className="row xs mute">Deep analysis <Switch on={c.deepReport} onChange={(v) => s.patchCampaign(c.id, { deepReport: v })} label="Deep analysis" /></span>
      </div>
      <AutoHeight>
        {c.deepReport && (
          <div className="card topics">
            {topics.map(([t, v]) => (
              <div key={t} className="topic"><span className="ell">{t}</span><span className="topic-bar"><i style={{ width: v * 2.4 + '%' }} /></span><span className="num mute xs">{v}%</span></div>
            ))}
          </div>
        )}
      </AutoHeight>
      <MediaGrid items={gallery} />
    </div>
  )
}

/* ═════════ Approvals — misc invoices waiting on the campaign lead ═════════ */
export function PodApprovals() {
  const s = useStore()
  const [view, setView] = useState('mine')
  const mine = s.invoices.filter((x) => x.type === 'misc' && x.stage === 'lead')
  const sent = s.invoices.filter((x) => x.type === 'misc' && x.stage !== 'lead')
  const list = view === 'mine' ? mine : sent
  const [sel, setSel] = useState(null)
  const cur = list.find((x) => x.id === sel) || list[0]
  const idx = list.indexOf(cur)
  const approve = (v) => { const next = list[idx + 1] || list[idx - 1]; s.advanceInvoice(cur.id, v); setSel(next?.id ?? null) }

  return (
    <div className="split">
      <div className="split-l">
        <div style={{ padding: '12px 0 10px' }}>
          <Seg id="pa" value={view} onChange={(v) => { setView(v); setSel(null) }} options={[{ value: 'mine', label: 'Waiting on you', count: mine.length }, { value: 'sent', label: 'Sent on', count: sent.length }]} />
        </div>
        <div className="list">
          <AnimatePresence initial={false}>
            {list.map((x) => (
              <motion.button key={x.id} layout="position" className={'li inv-li' + (x.id === cur?.id ? ' sel' : '')} onClick={() => setSel(x.id)}
                exit={{ opacity: 0, height: 0, minHeight: 0, transition: { duration: 0.2, ease: EASE } }}>
                <div className="grow">
                  <div className="row"><span className="li-t ell grow">{x.vendor.name}</span><span className="num">{fmt.inr(x.amount)}</span></div>
                  <div className="row li-s"><span className="ell grow">{SERVICES[x.service].label} · {x.campaign.split(' × ')[0]}</span><Chain inv={x} /></div>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
          {!list.length && <div className="empty"><Check size={18} /><b>Clear</b></div>}
        </div>
      </div>
      <div className="split-r">
        {cur ? (
          <Swap k={cur.id}>
            <InvoiceDetail inv={cur} actions={view === 'mine' && (
              <>
                <ConfirmButton className="b reject" label="Reject" doneLabel="Rejected" icon={<X size={14} />} doneIcon={<X size={14} />} onDone={() => approve('reject')} />
                <ConfirmButton className="b ink" label="Approve" doneLabel="Sent to procurement" icon={<Check size={14} />} onDone={() => approve('approve')} />
              </>
            )} />
          </Swap>
        ) : <div className="empty"><b>Nothing selected</b></div>}
      </div>
    </div>
  )
}

/** Shared invoice detail — used by Pod approvals and Finance invoices. */
export function InvoiceDetail({ inv, actions }) {
  const s = useStore()
  const c = s.campaigns.find((x) => x.id === inv.campaignId)
  const steps = inv.type === 'misc' ? ['lead', 'procurement', 'finance', 'scheduled', 'paid'] : ['finance', 'scheduled', 'paid']
  const at = steps.indexOf(inv.stage)
  return (
    <div className="inv-d">
      <div className="row" style={{ alignItems: 'flex-start', gap: 16 }}>
        <div className="grow">
          <div className="mono mute">{inv.no}</div>
          <h2 className="d-h1" style={{ marginTop: 4 }}>{inv.vendor.name}</h2>
          <a className="row fg2" style={{ marginTop: 4 }} href={`#/pod/campaigns/${inv.campaignId}`}>{inv.campaign}<ArrowUpRight size={13} /></a>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="metric-v num">{fmt.inrFull(inv.amount)}</div>
          <div className="mute xs num">{fmt.inrFull(inv.taxable)} + {fmt.inrFull(inv.gst)} GST</div>
        </div>
      </div>

      <div className="chain-big">
        {steps.map((st, i) => (
          <div key={st} className={'cb' + (inv.stage === 'rejected' ? (i === 0 ? ' rej' : '') : i < at ? ' done' : i === at ? ' cur' : '') + (st === 'paid' && inv.stage === 'paid' ? ' paid' : '')}>
            <span className="cb-bar"><i /></span>
            <span className="cb-l">{CHAIN_LABEL[st]}</span>
          </div>
        ))}
      </div>

      <div className="kv-grid">
        <div><span>Service</span><span>{SERVICES[inv.service].label}</span></div>
        <div><span>Type</span><span>{inv.type === 'misc' ? 'Proof of work' : `${inv.items} links`}</span></div>
        <div><span>Submitted</span><span>{fmt.dateLong(inv.submitted)}</span></div>
        <div><span>Lead</span><span className="row"><Avatar user={c?.lead || inv.vendor} size={18} />{c?.lead.short}</span></div>
      </div>

      <MediaGrid items={invoiceMedia(inv, SERVICES[inv.service].label)} size="sm" />
      {actions && <div className="inv-actions">{actions}</div>}
    </div>
  )
}
