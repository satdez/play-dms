import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Search, Check, X, ArrowRight, Globe, Mail, ChevronDown, Ban, CalendarDays, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useStore } from '../store'
import { PROPOSAL_STATUS, bdMonthly, MONTHS, fmt, TODAY, me, team } from '../data'
import { Ticker, ConfirmButton, Tip, TextMorph, SlidePanel, AutoHeight, Swap, EASE } from '../../shared/motion'
import { Avatar, AreaChart } from '../../shared/ui'
import { Seg, Svc, Popover, go } from '../ui'
import { Sheet } from './Finance'
import { BrandLogo } from '../../shared/brands'

const BrandMark = ({ name, size }) => <BrandLogo name={name} size={size} />

/* ═════════ Dashboard ═════════ */
export function BdDashboard() {
  const s = useStore()
  const [range, setRange] = useState('month')
  const k = { month: 1, quarter: 2.7, year: 9.6 }[range]
  const of = (st) => s.outreach.filter((o) => o.status === st).length
  const pf = (st) => s.proposals.filter((p) => p.status === st).length
  return (
    <div className="d-page">
      <div className="d-head">
        <h1 className="d-h1">Dashboard</h1>
        <Seg id="bdr" value={range} onChange={setRange} options={[{ value: 'month', label: 'Month' }, { value: 'quarter', label: 'Quarter' }, { value: 'year', label: 'Year' }]} />
      </div>
      <div className="metrics">
        <div className="metric"><span className="metric-l">Closed</span><span className="metric-v num"><Ticker value={Math.round(bdMonthly.closed.value * k)} format={(n) => fmt.inr(Math.round(n))} /></span></div>
        <div className="metric"><span className="metric-l">Pipeline</span><span className="metric-v num"><Ticker value={Math.round(bdMonthly.pipeline.value * k)} format={(n) => fmt.inr(Math.round(n))} /></span></div>
        <div className="metric"><span className="metric-l">Conversion</span><span className="metric-v num"><Ticker value={bdMonthly.conversion.value + (range === 'year' ? -3 : range === 'quarter' ? 1 : 0)} format={(n) => Math.round(n) + '%'} /></span></div>
      </div>
      <div className="card" style={{ marginTop: 16, padding: '18px 18px 10px', color: 'var(--fg)' }}>
        <AreaChart data={bdMonthly.closed.series} labels={MONTHS} height={180} color="var(--yellow)" format={fmt.inr} grid={false} />
      </div>
      <div className="funnels">
        <Funnel title="Outreach" parts={[['Proposal', of('proposal'), 'var(--fg)'], ['Lead', of('lead'), 'var(--yellow)'], ['Disqualified', of('disqualified'), 'var(--line-2)']]} />
        <Funnel title="Proposals" parts={[['Converted', pf('converted'), 'var(--fg)'], ['Approved', pf('approved'), 'var(--green)'], ['Mapped', pf('mapped'), 'var(--yellow)'], ['Cancelled', pf('cancelled'), 'var(--line-2)']]} />
      </div>
      <div className="group-h" style={{ marginTop: 28 }}>Recent outreach</div>
      <div className="list">
        {[...s.outreach].sort((a, b) => b.touched - a.touched).slice(0, 6).map((o) => (
          <a key={o.id} href="#/bd/outreach" className="li">
            <BrandMark name={o.brand} />
            <span className="grow ell"><span className="li-t">{o.brand}</span> <span className="mute">· {o.poc.name}</span></span>
            <span className="mute xs">{o.source}</span>
            <Avatar user={o.owner} size={20} />
            <span className="mute xs num" style={{ width: 36, textAlign: 'right' }}>{fmt.agoShort(o.touched)}</span>
          </a>
        ))}
      </div>
    </div>
  )
}
function Funnel({ title, parts }) {
  const total = parts.reduce((a, p) => a + p[1], 0)
  return (
    <div className="card">
      <div className="row" style={{ marginBottom: 12 }}><span className="d-h2">{title}</span><span className="grow" /><span className="num metric-v" style={{ fontSize: 20 }}><Ticker value={total} /></span></div>
      <div className="fbar">{parts.map(([l, v, c]) => <Tip key={l} label={`${l} · ${v}`}><i style={{ flexGrow: v || 0.0001, background: c }} /></Tip>)}</div>
      <div className="flegend">{parts.map(([l, v, c]) => <span key={l}><span className="dot" style={{ background: c }} />{l} <b className="num">{v}</b></span>)}</div>
    </div>
  )
}

/* ═════════ Outreach ═════════ */
export function Outreach() {
  const s = useStore()
  const [view, setView] = useState('lead')
  const [q, setQ] = useState('')
  const count = (st) => s.outreach.filter((o) => o.status === st).length
  const rows = s.outreach.filter((o) => o.status === view && (o.brand + o.poc.name).toLowerCase().includes(q.toLowerCase()))
  const propose = (o) => {
    s.setOutreach((l) => l.map((x) => (x.id === o.id ? { ...x, status: 'proposal', touched: TODAY } : x)))
    s.setProposals((l) => [{ id: 'p-' + o.id, brand: o.brand, services: ['amp'], billing: o.value, pitch: new Date(TODAY.getTime() + 7 * 864e5), owner: o.owner, status: 'mapped', brief: '', source: 'Outreach' }, ...l])
    toast('Proposal created · ' + o.brand, { action: { label: 'Open', onClick: () => go('/bd/proposals') } })
  }
  return (
    <div className="d-page wide">
      <div className="d-head">
        <h1 className="d-h1">Outreach</h1>
        <div className="inp" style={{ width: 220 }}><Search size={14} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Brand or POC" /></div>
        <button className="b ink" onClick={() => toast('New outreach')}><Plus size={15} /> New</button>
      </div>
      <Seg id="out" value={view} onChange={setView} options={[{ value: 'lead', label: 'Leads', count: count('lead') }, { value: 'proposal', label: 'Proposed', count: count('proposal') }, { value: 'disqualified', label: 'Disqualified', count: count('disqualified') }]} />
      <SlidePanel k={view} index={['lead', 'proposal', 'disqualified'].indexOf(view)} style={{ marginTop: 12 }}>
        <table className="tbl">
          <thead><tr><th>Brand</th><th>Point of contact</th><th>Source</th><th className="r">Value</th><th>Owner</th><th>Last touch</th><th /></tr></thead>
          <tbody>
            <AnimatePresence initial={false}>
              {rows.map((o) => (
                <motion.tr key={o.id} layout="position" exit={{ opacity: 0, transition: { duration: 0.15 } }}>
                  <td><span className="row"><BrandMark name={o.brand} /><b style={{ fontWeight: 500 }}>{o.brand}</b>{o.kind === 'Agency' && <span className="chip">Agency</span>}</span></td>
                  <td><div>{o.poc.name}</div><div className="mute xs">{o.poc.role}</div></td>
                  <td className="fg2">{o.source}</td>
                  <td className="r num">{fmt.inr(o.value)}</td>
                  <td><Avatar user={o.owner} size={20} /></td>
                  <td className="fg2">{fmt.ago(o.touched)}</td>
                  <td className="r">
                    {o.status === 'lead' && (
                      <span className="row" style={{ justifyContent: 'flex-end', gap: 4 }}>
                        <Tip label="Disqualify"><button className="b icon sm" onClick={() => { s.setOutreach((l) => l.map((x) => (x.id === o.id ? { ...x, status: 'disqualified' } : x))); toast('Disqualified · ' + o.brand) }} aria-label="Disqualify"><Ban size={13} /></button></Tip>
                        <ConfirmButton className="b sm" label="Propose" doneLabel="Proposed" icon={<ArrowRight size={13} />} onDone={() => propose(o)} />
                      </span>
                    )}
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
        {!rows.length && <div className="empty"><b>Nothing here</b></div>}
      </SlidePanel>
    </div>
  )
}

/* ═════════ Proposals — board; Converted hands off to POD ═════════ */
export function Proposals() {
  const s = useStore()
  const [drag, setDrag] = useState(null)
  const [over, setOver] = useState(null)
  const [open, setOpen] = useState(null)
  const cur = s.proposals.find((p) => p.id === open)

  const move = (id, status) => {
    const p = s.proposals.find((x) => x.id === id)
    if (!p || p.status === status) return
    s.setProposals((l) => l.map((x) => (x.id === id ? { ...x, status } : x)))
    if (status === 'converted') convert(p)
  }
  const convert = (p) => {
    const cid = 'c' + (100 + Math.floor(Math.random() * 900))
    s.setCampaigns((l) => [{
      ...l[0], id: cid, code: 'WL-' + (2500 + l.length), client: p.brand, clientId: null, industry: 'Others', activity: 'Launch', name: `${p.brand} × Launch`,
      stage: 0, services: p.services, budget: p.billing, planCost: Math.round(p.billing * 0.65), internal: Math.round(p.billing * 0.47), live: 0, views: 0,
      planApproved: false, pinned: false, flags: { agreement: false, po: false, invoice: false, payment: false }, tally: 'none', tallyKey: null, updated: TODAY, start: TODAY, brief: p.brief || 'Brief to be added.',
    }, ...l])
    toast.success('Campaign created in Pod', { description: `${p.brand} × Launch`, action: { label: 'Open', onClick: () => go('/pod/campaigns/' + cid) } })
  }

  return (
    <div className="d-page wide">
      <div className="d-head"><h1 className="d-h1">Proposals</h1></div>
      <div className="board">
        {PROPOSAL_STATUS.map((st) => {
          const col = s.proposals.filter((p) => p.status === st.id)
          return (
            <div key={st.id} className={'board-col' + (over === st.id ? ' over' : '')}
              onDragOver={(e) => { e.preventDefault(); setOver(st.id) }} onDragLeave={() => setOver(null)}
              onDrop={() => { if (drag) move(drag, st.id); setDrag(null); setOver(null) }}>
              <div className="board-h">{st.label}<span className="mute num">{col.length}</span><span className="grow" /><span className="mute num xs">{fmt.inr(col.reduce((a, p) => a + p.billing, 0))}</span></div>
              <AnimatePresence initial={false}>
                {col.map((p) => (
                  <motion.div key={p.id} layout layoutId={'prop-' + p.id} transition={{ duration: 0.25, ease: EASE }}>
                    <div className={'pcard' + (drag === p.id ? ' dragging' : '')} draggable onDragStart={() => setDrag(p.id)} onDragEnd={() => { setDrag(null); setOver(null) }} onClick={() => setOpen(p.id)}>
                      <div className="row"><BrandMark name={p.brand} /><b className="grow ell" style={{ fontWeight: 600 }}>{p.brand}</b><Avatar user={p.owner} size={18} /></div>
                      <div className="row" style={{ justifyContent: 'space-between' }}>
                        <Svc list={p.services} />
                        <span className="num fg2">{fmt.inr(p.billing)}</span>
                      </div>
                      <div className="mute xs row" style={{ gap: 5 }}><CalendarDays size={12} /> {fmt.date(p.pitch)}</div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
      <Sheet open={!!cur} onClose={() => setOpen(null)} width={480}>
        {cur && (
          <div className="inv-d">
            <div className="row"><BrandMark name={cur.brand} /><span className="chip">{PROPOSAL_STATUS.find((x) => x.id === cur.status).label}</span></div>
            <h2 className="d-h1" style={{ marginTop: 12 }}>{cur.brand}</h2>
            <div className="kv-grid" style={{ marginTop: 20 }}>
              <div><span>Billing</span><span className="num">{fmt.inrFull(cur.billing)}</span></div>
              <div><span>Pitch</span><span>{fmt.dateLong(cur.pitch)}</span></div>
              <div><span>Owner</span><span className="row"><Avatar user={cur.owner} size={18} />{cur.owner.short}</span></div>
              <div><span>Source</span><span>{cur.source}</span></div>
            </div>
            <div style={{ marginTop: 16 }}><Svc list={cur.services} /></div>
            {cur.brief && <p className="brief" style={{ marginTop: 20 }}>{cur.brief}</p>}
            <div className="inv-actions">
              {cur.status === 'mapped' && <ConfirmButton className="b ink" label="Mark approved" doneLabel="Approved" icon={<Check size={14} />} onDone={() => move(cur.id, 'approved')} />}
              {cur.status === 'approved' && <ConfirmButton className="b ink" label="Convert to campaign" doneLabel="Sent to Pod" icon={<ArrowRight size={14} />} onDone={() => { move(cur.id, 'converted'); setOpen(null) }} />}
            </div>
          </div>
        )}
      </Sheet>
    </div>
  )
}

/* ═════════ Inbound ═════════ */
export function InboundPage() {
  const s = useStore()
  const [sel, setSel] = useState(null)
  const [showEmail, setShowEmail] = useState(false)
  const list = s.inbound
  const cur = list.find((x) => x.id === sel) || list[0]
  const idx = list.indexOf(cur)
  const dismiss = (toOutreach) => {
    const next = list[idx + 1] || list[idx - 1]
    s.setInbound((l) => l.filter((x) => x.id !== cur.id))
    if (toOutreach) {
      s.setOutreach((l) => [{ id: 'o-' + cur.id, brand: cur.company, kind: 'Brand', poc: { name: cur.name, role: 'Inbound' }, source: 'Inbound', status: 'lead', owner: team[8], touched: TODAY, value: cur.budget }, ...l])
      toast('Added to outreach · ' + cur.company, { action: { label: 'Open', onClick: () => go('/bd/outreach') } })
    } else toast('Rejected · ' + cur.company)
    setSel(next?.id ?? null); setShowEmail(false)
  }
  return (
    <div className="split">
      <div className="split-l">
        <div style={{ height: 8 }} />
        <div className="list">
          <AnimatePresence initial={false}>
            {list.map((r) => (
              <motion.button key={r.id} layout="position" className={'li inv-li' + (r.id === cur?.id ? ' sel' : '')} onClick={() => { setSel(r.id); setShowEmail(false) }} exit={{ opacity: 0, height: 0, minHeight: 0, transition: { duration: 0.2, ease: EASE } }}>
                <div className="grow">
                  <div className="row"><BrandMark name={r.company} size={20} /><span className="li-t ell grow">{r.company}</span><span className="mute" style={{ display: 'grid' }}>{r.source === 'email' ? <Mail size={13} /> : <Globe size={13} />}</span><span className="mute xs">{fmt.agoShort(r.at)}</span></div>
                  <div className="li-s ell">{r.summary}</div>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
          {!list.length && <div className="empty"><Check size={18} /><b>Clear</b></div>}
        </div>
      </div>
      <div className="split-r">
        {cur && (
          <Swap k={cur.id}>
            <div className="inv-d">
              <div className="row" style={{ alignItems: 'flex-start' }}>
                <div className="grow">
                  <div className="mute xs row" style={{ gap: 6 }}>{cur.source === 'email' ? <Mail size={12} /> : <Globe size={12} />}{cur.name}</div>
                  <h2 className="d-h1 row" style={{ marginTop: 4, gap: 12 }}><BrandMark name={cur.company} size={32} />{cur.company}</h2>
                </div>
                <div className="metric-v num">{fmt.inr(cur.budget)}</div>
              </div>
              <p className="brief" style={{ marginTop: 20 }}>{cur.summary}</p>
              {cur.body && (
                <>
                  <button className="b ghost sm" style={{ marginTop: 12, marginLeft: -8 }} onClick={() => setShowEmail((v) => !v)}>
                    <ChevronDown size={14} style={{ rotate: showEmail ? '180deg' : '0deg', transition: 'rotate 200ms cubic-bezier(.23,1,.32,1)' }} /> Original email
                  </button>
                  <AutoHeight>{showEmail && <pre className="email">{cur.body}</pre>}</AutoHeight>
                </>
              )}
              <div className="inv-actions">
                <button className="b" onClick={() => dismiss(false)}><X size={14} /> Reject</button>
                <ConfirmButton className="b ink" label="Add to outreach" doneLabel="Added" icon={<ArrowRight size={14} />} onDone={() => dismiss(true)} />
              </div>
            </div>
          </Swap>
        )}
      </div>
    </div>
  )
}
