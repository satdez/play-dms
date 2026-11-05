import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Link2, Receipt, Hourglass, Banknote, FileSignature, RefreshCcw, MailOpen, CalendarClock, Send, Check, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { useStore } from '../store'
import { trackerFor, monthly, MONTHS, me, fmt, TODAY, STAGE_FULL, bdMonthly } from '../data'
import { Ticker, ConfirmButton, Tip, EASE } from '../../shared/motion'
import { Sparkline } from '../../shared/ui'
import { Seg, Track, go, ClientLogo } from '../ui'
import { view, canLeadApprove } from '../personas'

const TONE = { link: 'g', invoice: 'v', stalled: 'y', pay: 'v', req: 'p', tally: 'p', inbound: 'y', pitch: 'g', nudge: 'y' }
const ICON = { link: Link2, invoice: Receipt, stalled: Hourglass, pay: Banknote, req: FileSignature, tally: RefreshCcw, inbound: MailOpen, pitch: CalendarClock, nudge: Send }

export default function Home({ role }) {
  const s = useStore()
  const [filter, setFilter] = useState('all')
  const [done, setDone] = useState(() => new Set())
  const finish = (id) => setDone((d) => new Set(d).add(id))

  const items = useMemo(() => {
    const out = []
    if (role === 'pod') {
      s.campaigns.filter((c) => c.stage === 4 || c.stage === 5).forEach((c) => {
        const n = trackerFor(c).filter((r) => r.status === 'review').length
        if (n) out.push({ id: 'l' + c.id, kind: 'link', title: `${n} links to review`, ctx: c.name, at: c.updated, act: { label: 'Review', to: `/pod/campaigns/${c.id}/tracker` } })
      })
      if (canLeadApprove()) s.invoices.filter((x) => x.stage === 'lead').forEach((x) => out.push({ id: 'i' + x.id, kind: 'invoice', title: x.vendor.name, ctx: x.campaign, amount: x.amount, at: x.submitted, approve: () => s.advanceInvoice(x.id) }))
      s.campaigns.filter((c) => c.stage < 4 && (TODAY - c.updated) / 864e5 > 2).slice(0, 4).forEach((c) => out.push({ id: 's' + c.id, kind: 'stalled', title: `In ${STAGE_FULL[c.stage]}`, ctx: c.name, at: c.updated, act: { label: 'Open', to: `/pod/campaigns/${c.id}` } }))
    } else if (role === 'finance') {
      s.invoices.filter((x) => x.stage === 'finance').forEach((x) => out.push({ id: 'i' + x.id, kind: 'invoice', title: x.vendor.name, ctx: x.campaign, amount: x.amount, at: x.submitted, approve: () => s.advanceInvoice(x.id) }))
      const due = s.invoices.filter((x) => x.stage === 'scheduled')
      if (due.length) out.push({ id: 'pay', kind: 'pay', title: `${due.length} payouts scheduled`, ctx: fmt.inrFull(due.reduce((a, x) => a + x.amount, 0)), at: TODAY, act: { label: 'Pay', to: '/finance/payments' } })
      s.requests.forEach((r) => out.push({ id: 'r' + r.id, kind: 'req', title: r.vendor.name, ctx: r.kind === 'Onboarding' ? 'New vendor' : r.field + ' change', at: r.at, act: { label: 'Review', to: '/finance/requests' } }))
      s.campaigns.filter((c) => c.tally === 'failed').forEach((c) => out.push({ id: 't' + c.id, kind: 'tally', title: 'Tally sync failed', ctx: c.name, at: c.updated, retry: () => s.patchCampaign(c.id, { tally: 'synced' }) }))
    } else {
      s.inbound.forEach((r) => out.push({ id: 'n' + r.id, kind: 'inbound', title: r.company, ctx: r.summary, amount: r.budget, at: r.at, act: { label: 'Open', to: '/bd/inbound' } }))
      s.proposals.filter((p) => p.status === 'approved' || (p.status === 'mapped' && p.pitch > TODAY && p.pitch - TODAY < 7 * 864e5)).forEach((p) => out.push({ id: 'p' + p.id, kind: 'pitch', title: p.status === 'approved' ? `${p.brand} approved` : `Pitch ${fmt.date(p.pitch)}`, ctx: p.status === 'approved' ? 'Ready to convert' : p.brand, amount: p.billing, at: p.pitch, act: { label: 'Open', to: '/bd/proposals' } }))
      s.outreach.filter((o) => o.status === 'lead' && (TODAY - o.touched) / 864e5 > 8).forEach((o) => out.push({ id: 'o' + o.id, kind: 'nudge', title: o.brand, ctx: `${o.poc.name} · ${Math.round((TODAY - o.touched) / 864e5)}d quiet`, at: o.touched, nudge: true }))
    }
    // Decisions first (approve/pay/retry), then things to open.
    const weight = (x) => (x.approve || x.retry ? 0 : x.kind === 'pay' || x.kind === 'req' || x.kind === 'inbound' ? 1 : 2)
    return out.sort((a, b) => weight(a) - weight(b))
  }, [role, s, view().id]) // eslint-disable-line

  const visible = items.filter((x) => !done.has(x.id))
  const kinds = [...new Set(items.map((x) => x.kind))]
  const shown = visible.filter((x) => filter === 'all' || x.kind === filter)
  const kindLabel = { link: 'Links', invoice: 'Invoices', stalled: 'Stalled', pay: 'Payouts', req: 'Requests', tally: 'Tally', inbound: 'Inbound', pitch: 'Proposals', nudge: 'Follow-ups' }

  return (
    <div className="d-page wide home">
      <div className="home-grid">
        <section>
          <div className="d-head">
            <h1 className="d-h1 keep">Morning, {view().person.short}</h1>
          </div>
          <div style={{ marginBottom: 8 }}>
            <Seg id="home" value={filter} onChange={setFilter} options={[{ value: 'all', label: 'All', count: visible.length }, ...kinds.map((k) => ({ value: k, label: kindLabel[k], count: visible.filter((x) => x.kind === k).length }))]} />
          </div>

          <div className="list">
            <AnimatePresence initial={false}>
              {shown.map((x) => {
                const I = ICON[x.kind]
                return (
                  <motion.div key={x.id} className="li q" layout="position"
                    exit={{ opacity: 0, height: 0, minHeight: 0, transition: { duration: 0.22, ease: EASE } }}>
                    <span className={'glyph chip ' + TONE[x.kind]} style={{ padding: 0 }}><I size={13} /></span>
                    <div className="grow">
                      <div className="row"><span className="li-t ell">{x.title}</span>{x.amount != null && <span className="mute num">{fmt.inr(x.amount)}</span>}</div>
                      <div className="li-s ell">{x.ctx}</div>
                    </div>
                    <span className="mute xs num q-age">{fmt.agoShort(x.at).replace('in ', '+')}</span>
                    <span className="q-act">
                      {x.approve && <ConfirmButton className="b sm" label="Approve" doneLabel="Approved" icon={<Check size={13} />} onDone={() => { x.approve(); finish(x.id) }} />}
                      {x.retry && <ConfirmButton className="b sm" label="Retry" doneLabel="Synced" icon={<RefreshCcw size={13} />} onDone={() => { x.retry(); finish(x.id) }} />}
                      {x.nudge && <ConfirmButton className="b sm" label="Nudge" doneLabel="Sent" icon={<Send size={13} />} onDone={() => finish(x.id)} />}
                      {x.act && <button className="b sm" onClick={() => go(x.act.to)}>{x.act.label}</button>}
                    </span>
                  </motion.div>
                )
              })}
            </AnimatePresence>
            {!shown.length && <div className="empty"><Check size={20} /><b>Clear</b></div>}
          </div>
        </section>

        <aside className="home-side">
          <SideSummary role={role} />
        </aside>
      </div>
    </div>
  )
}

function SideSummary({ role }) {
  const s = useStore()
  if (role === 'finance') {
    const sched = s.invoices.filter((x) => x.stage === 'scheduled')
    const paid = s.invoices.filter((x) => x.stage === 'paid')
    return (
      <>
        <Stat label="Scheduled" value={sched.reduce((a, x) => a + x.amount, 0)} fmtv={fmt.inr} />
        <Stat label="Paid this month" value={paid.reduce((a, x) => a + x.amount, 0) + 3_840_000} fmtv={fmt.inr} />
        <Stat label="Billing" value={monthly.billing.value} fmtv={fmt.inr} series={monthly.billing.series} />
      </>
    )
  }
  if (role === 'bd') {
    return (
      <>
        <Stat label="Closed" value={bdMonthly.closed.value} fmtv={fmt.inr} series={bdMonthly.closed.series} />
        <Stat label="Pipeline" value={bdMonthly.pipeline.value} fmtv={fmt.inr} series={bdMonthly.pipeline.series} />
        <Stat label="Conversion" value={bdMonthly.conversion.value} fmtv={(n) => Math.round(n) + '%'} />
      </>
    )
  }
  const live = s.campaigns.filter((c) => c.stage === 4 || c.stage === 5)
  return (
    <>
      <Stat label="Views" value={monthly.views.value} fmtv={fmt.compact} series={monthly.views.series} />
      <div className="side-h">Live <span className="mute num">{live.length}</span></div>
      <div className="list">
        {live.slice(0, 8).map((c) => (
          <a key={c.id} href={`#/pod/campaigns/${c.id}`} className="li side-li">
            <ClientLogo name={c.client} industry={c.industry} />
            <span className="grow ell" style={{ fontWeight: 500 }}>{c.client}</span>
            <Track stage={c.stage} />
          </a>
        ))}
      </div>
    </>
  )
}

function Stat({ label, value, fmtv, series }) {
  return (
    <div className="side-stat">
      <div className="metric-l">{label}</div>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <span className="metric-v"><Ticker value={value} format={(n) => fmtv(Math.round(n))} /></span>
        {series && <span style={{ color: 'var(--fg)' }}><Sparkline data={series} width={72} height={24} color="currentColor" fill={false} strokeWidth={1.25} /></span>}
      </div>
    </div>
  )
}
