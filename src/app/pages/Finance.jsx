import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { Check, X, Lock, RefreshCcw, Search, CalendarClock, Pause, Play, ArrowRight, Loader2, Banknote, ShieldCheck, BookCheck, MessageCircle, UserCheck } from 'lucide-react'
import { toast } from 'sonner'
import { useStore } from '../store'
import { TALLY_CATEGORIES, SERVICES, fmt, TODAY } from '../data'
import { Ticker, ConfirmButton, Tip, TextMorph, SlidePanel, AutoHeight, Swap, EASE, DRAWER } from '../../shared/motion'
import { Avatar } from '../../shared/ui'
import { Seg, Chain, ClientLogo, Popover, Switch } from '../ui'
import { InvoiceDetail } from './Pod'

/* ═════════ Campaigns: flags + Tally ═════════ */
const FLAGS = [['agreement', 'Agreement'], ['po', 'PO'], ['invoice', 'Invoice'], ['payment', 'Payment received']]
export function FinCampaigns() {
  const s = useStore()
  const [q, setQ] = useState('')
  const rows = s.campaigns.filter((c) => c.stage >= 2 && c.name.toLowerCase().includes(q.toLowerCase()))
  const toggle = (c, k) => {
    if (c.flags.payment && k !== 'payment') return
    s.patchCampaign(c.id, { flags: { ...c.flags, [k]: !c.flags[k] } })
  }
  return (
    <div className="d-page wide">
      <div className="d-head">
        <h1 className="d-h1">Campaigns</h1>
        <div className="inp" style={{ width: 240 }}><Search size={14} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" /></div>
      </div>
      <table className="tbl">
        <thead><tr><th>Campaign</th><th>Lead</th><th className="r">Budget</th><th className="r">Internal</th><th>Status</th><th>Tally</th></tr></thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.id}>
              <td><span className="row"><ClientLogo name={c.client} industry={c.industry} /><span className="ell" style={{ maxWidth: 280 }}><b style={{ fontWeight: 500 }}>{c.client}</b> <span className="mute">× {c.activity}</span></span></span></td>
              <td><span className="row"><Avatar user={c.lead} size={20} /><span className="fg2">{c.lead.short}</span></span></td>
              <td className="r num">{fmt.inr(c.budget)}</td>
              <td className="r num fg2">{fmt.inr(c.internal)}</td>
              <td>
                <span className="flags">
                  {FLAGS.map(([k, l]) => {
                    const locked = c.flags.payment && k !== 'payment'
                    return (
                      <Tip key={k} label={locked ? `${l} · locked` : l}>
                        <button className={'flag' + (c.flags[k] ? ' on' : '') + (locked ? ' locked' : '')} onClick={() => toggle(c, k)} aria-pressed={c.flags[k]}>{l[0]}</button>
                      </Tip>
                    )
                  })}
                </span>
              </td>
              <td><TallyCell c={c} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TallyCell({ c }) {
  const s = useStore()
  const queue = () => {
    s.patchCampaign(c.id, { tally: 'queued' })
    setTimeout(() => s.patchCampaign(c.id, { tally: 'synced', tallyKey: c.tallyKey || 'TK-' + (9000 + Number(c.id.slice(1))) }), 1600)
  }
  if (c.tally === 'synced') return <Tip label={c.tallyKey}><span className="chip g"><Check size={12} /><TextMorph>Synced</TextMorph></span></Tip>
  if (c.tally === 'queued') return <span className="chip y"><Loader2 size={12} className="spin" /><TextMorph>Queued</TextMorph></span>
  if (c.tally === 'failed') return <ConfirmButton className="b sm reject-soft" label="Retry" doneLabel="Queued" icon={<RefreshCcw size={12} />} onDone={queue} />
  return (
    <Popover width={260} trigger={({ toggle }) => <button className="b sm" onClick={toggle}>Send <ArrowRight size={12} /></button>}>
      {(close) => <TallyPicker onPick={() => { close(); queue() }} />}
    </Popover>
  )
}
function TallyPicker({ onPick }) {
  const [loading, setLoading] = useState(true)
  useEffect(() => { const t = setTimeout(() => setLoading(false), 550); return () => clearTimeout(t) }, [])
  return (
    <AutoHeight duration={0.2}>
      <div className="pop-h">Cost category</div>
      {loading
        ? [0, 1, 2].map((i) => <div key={i} className="shimmer" style={{ height: 24, margin: '6px 10px', borderRadius: 6 }} />)
        : TALLY_CATEGORIES.map((t) => <button key={t} onClick={onPick}>{t}</button>)}
    </AutoHeight>
  )
}

/* ═════════ Invoices ═════════ */
const REASONS = ['Wrong amount', 'Missing proof', 'Duplicate', 'GST mismatch']
export function FinInvoices() {
  const s = useStore()
  const [view, setView] = useState('finance')
  const [open, setOpen] = useState(null)
  const buckets = {
    finance: s.invoices.filter((x) => x.stage === 'finance'),
    upstream: s.invoices.filter((x) => x.stage === 'lead' || x.stage === 'procurement'),
    scheduled: s.invoices.filter((x) => x.stage === 'scheduled'),
    paid: s.invoices.filter((x) => x.stage === 'paid'),
    rejected: s.invoices.filter((x) => x.stage === 'rejected'),
  }
  const rows = buckets[view]
  const cur = s.invoices.find((x) => x.id === open)
  return (
    <div className="d-page wide">
      <div className="d-head"><h1 className="d-h1">Invoices</h1></div>
      <Seg id="inv" value={view} onChange={(v) => { setView(v); setOpen(null) }} options={[
        { value: 'finance', label: 'To review', count: buckets.finance.length },
        { value: 'scheduled', label: 'Scheduled', count: buckets.scheduled.length },
        { value: 'paid', label: 'Paid', count: buckets.paid.length },
        { value: 'upstream', label: 'Upstream', count: buckets.upstream.length },
        { value: 'rejected', label: 'Rejected', count: buckets.rejected.length },
      ]} />
      <SlidePanel k={view} index={['finance', 'scheduled', 'paid', 'upstream', 'rejected'].indexOf(view)} style={{ marginTop: 12 }}>
        <table className="tbl">
          <thead><tr><th>Vendor</th><th>Campaign</th><th>Type</th><th>Chain</th><th className="r">Amount</th><th>{view === 'scheduled' ? 'Pay on' : 'Submitted'}</th><th /></tr></thead>
          <tbody>
            <AnimatePresence initial={false}>
              {rows.map((x) => (
                <motion.tr key={x.id} className="click" onClick={() => setOpen(x.id)} layout="position" exit={{ opacity: 0, transition: { duration: 0.15 } }}>
                  <td><span className="row"><Avatar user={{ name: x.vendor.name, hue: x.vendor.name.charCodeAt(0) * 7 }} size={22} /><b className="ell" style={{ fontWeight: 500, maxWidth: 200 }}>{x.vendor.name}</b></span></td>
                  <td className="ell fg2" style={{ maxWidth: 240 }}>{x.campaign}</td>
                  <td><span className={'chip' + (x.type === 'misc' ? ' y' : '')}>{x.type === 'misc' ? SERVICES[x.service].short : `${x.items} links`}</span></td>
                  <td><Chain inv={x} /></td>
                  <td className="r num">{fmt.inrFull(x.amount)}</td>
                  <td className="fg2">{view === 'scheduled' ? fmt.date(x.scheduledFor) : fmt.ago(x.submitted)}</td>
                  <td className="r" onClick={(e) => e.stopPropagation()}>
                    {view === 'finance' && (
                      <span className="row" style={{ justifyContent: 'flex-end', gap: 4 }}>
                        <RejectButton onReject={() => s.advanceInvoice(x.id, 'reject')} />
                        <ConfirmButton className="b sm" label="Approve" doneLabel="Scheduled" icon={<Check size={13} />} onDone={() => s.advanceInvoice(x.id)} />
                      </span>
                    )}
                    {view === 'scheduled' && <Reschedule onPick={(d) => { s.setInvoices((l) => l.map((y) => (y.id === x.id ? { ...y, scheduledFor: d } : y))); toast('Rescheduled', { description: fmt.dateLong(d) }) }} />}
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
        {!rows.length && <div className="empty"><Check size={18} /><b>Clear</b></div>}
      </SlidePanel>

      <Sheet open={!!cur} onClose={() => setOpen(null)}>
        {cur && <Swap k={cur.id}><InvoiceDetail inv={cur} actions={cur.stage === 'finance' && (
          <>
            <RejectButton big onReject={() => { s.advanceInvoice(cur.id, 'reject'); setOpen(null) }} />
            <ConfirmButton className="b ink" label="Approve & schedule" doneLabel="Scheduled" icon={<Check size={14} />} onDone={() => { s.advanceInvoice(cur.id); setOpen(null) }} />
          </>
        )} /></Swap>}
      </Sheet>
    </div>
  )
}

function RejectButton({ onReject, big }) {
  return (
    <Popover width={200} trigger={({ toggle }) => big
      ? <button className="b" onClick={toggle}><X size={14} /> Reject</button>
      : <Tip label="Reject"><button className="b icon sm" onClick={toggle} aria-label="Reject"><X size={13} /></button></Tip>}>
      {(close) => (
        <>
          <div className="pop-h">Reason</div>
          {REASONS.map((r) => <button key={r} onClick={() => { close(); onReject(r) }}>{r}</button>)}
        </>
      )}
    </Popover>
  )
}

function Reschedule({ onPick }) {
  const days = [1, 3, 7, 14].map((d) => new Date(TODAY.getTime() + d * 864e5))
  return (
    <Popover width={180} trigger={({ toggle }) => <Tip label="Reschedule"><button className="b icon sm" onClick={toggle} aria-label="Reschedule"><CalendarClock size={13} /></button></Tip>}>
      {(close) => days.map((d) => <button key={+d} onClick={() => { close(); onPick(d) }}>{fmt.date(d)}<span className="mute xs" style={{ marginLeft: 'auto' }}>{d.toLocaleDateString('en-GB', { weekday: 'short' })}</span></button>)}
    </Popover>
  )
}

/** Right-hand sheet (iOS drawer curve), dismiss on scrim / Esc. */
export function Sheet({ open, onClose, children, width = 560 }) {
  useEffect(() => {
    if (!open) return
    const on = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [open, onClose])
  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="sheet-scrim" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} />
          <motion.aside className="sheet" style={{ width }} initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%', transition: { duration: 0.22, ease: EASE } }} transition={{ duration: 0.36, ease: DRAWER }}>
            <button className="b ghost icon sm sheet-x" onClick={onClose} aria-label="Close"><X size={15} /></button>
            {children}
          </motion.aside>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}

/* ═════════ Payments ═════════ */
export function Payments() {
  const s = useStore()
  const [range, setRange] = useState('week')
  const [part, setPart] = useState('taxable')
  const [held, setHeld] = useState(() => new Set())
  const [paying, setPaying] = useState(false)
  const inRange = (x) => {
    const d = (x.scheduledFor - TODAY) / 864e5
    return range === 'week' ? d <= 7 : range === 'next' ? d > 7 && d <= 14 : d > 14
  }
  const unpaid = (x) => (part === 'taxable' ? !x.paidTax : !x.paidGst)
  const rows = s.invoices.filter((x) => x.stage === 'scheduled' && x.scheduledFor && inRange(x))
  const [unsel, setUnsel] = useState(() => new Set())
  const payable = rows.filter((x) => unpaid(x) && !held.has(x.id) && !unsel.has(x.id))
  const amt = (x) => (part === 'taxable' ? x.taxable : x.gst)
  const total = payable.reduce((a, x) => a + amt(x), 0)

  const settle = () => {
    const ids = new Set(payable.map((x) => x.id))
    s.setInvoices((l) => l.map((x) => {
      if (!ids.has(x.id)) return x
      const n = { ...x, [part === 'taxable' ? 'paidTax' : 'paidGst']: true }
      if (n.paidTax && n.paidGst) n.stage = 'paid'
      return n
    }))
  }

  return (
    <div className="d-page wide">
      <div className="d-head">
        <h1 className="d-h1">Payments</h1>
        <Tip label="Taxable and GST are paid separately"><span><Seg id="part" value={part} onChange={setPart} options={[{ value: 'taxable', label: 'Taxable' }, { value: 'gst', label: 'GST' }]} /></span></Tip>
      </div>
      <Seg id="range" value={range} onChange={setRange} options={[{ value: 'week', label: 'This week' }, { value: 'next', label: 'Next week' }, { value: 'later', label: 'Later' }]} />
      <SlidePanel k={range} index={['week', 'next', 'later'].indexOf(range)} style={{ marginTop: 12 }}>
        <div className="list">
          {rows.map((x) => {
            const isHeld = held.has(x.id)
            const done = !unpaid(x)
            const on = !isHeld && !done && !unsel.has(x.id)
            return (
              <div key={x.id} className={'li pay-li' + (isHeld || done ? ' dim' : '')}>
                <button className={'cbx' + (on ? ' on' : '')} disabled={isHeld || done} onClick={() => setUnsel((u) => { const n = new Set(u); n.has(x.id) ? n.delete(x.id) : n.add(x.id); return n })} aria-label="Select">
                  {on && <Check size={11} strokeWidth={3} />}
                </button>
                <div className="grow">
                  <div className="li-t ell">{x.vendor.name}</div>
                  <div className="li-s ell">{x.campaign}</div>
                </div>
                <span className="pay-parts">
                  <Tip label={x.paidTax ? 'Taxable paid' : 'Taxable due'}><i className={x.paidTax ? 'on' : ''}>T</i></Tip>
                  <Tip label={x.paidGst ? 'GST paid' : 'GST due'}><i className={x.paidGst ? 'on' : ''}>G</i></Tip>
                </span>
                <span className="fg2 xs" style={{ width: 64 }}>{fmt.date(x.scheduledFor)}</span>
                <span className="num" style={{ width: 96, textAlign: 'right' }}>{fmt.inrFull(amt(x))}</span>
                <span className="row" style={{ gap: 2 }}>
                  <Tip label={isHeld ? 'Release' : 'Hold'}><button className="b ghost icon sm" disabled={done} onClick={() => setHeld((h) => { const n = new Set(h); n.has(x.id) ? n.delete(x.id) : n.add(x.id); return n })} aria-label="Hold">{isHeld ? <Play size={13} /> : <Pause size={13} />}</button></Tip>
                  <Reschedule onPick={(d) => s.setInvoices((l) => l.map((y) => (y.id === x.id ? { ...y, scheduledFor: d } : y)))} />
                </span>
              </div>
            )
          })}
          {!rows.length && <div className="empty"><Check size={18} /><b>Nothing scheduled</b></div>}
        </div>
      </SlidePanel>

      <AnimatePresence>
        {payable.length > 0 && !paying && (
          <motion.div className="bar" initial={{ y: 20, opacity: 0, scale: 0.97 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 20, opacity: 0, scale: 0.97 }} transition={{ duration: 0.22, ease: EASE }}>
            <span className="num"><Ticker value={payable.length} /> <span style={{ opacity: 0.6 }}>· {part === 'taxable' ? 'Taxable' : 'GST'}</span></span>
            <b className="num" style={{ marginLeft: 8 }}><Ticker value={total} format={(n) => fmt.inrFull(Math.round(n))} /></b>
            <button className="b primary press" style={{ marginLeft: 8 }} onClick={() => setPaying(true)}><Banknote size={14} /> Pay</button>
          </motion.div>
        )}
      </AnimatePresence>
      <PayTray open={paying} count={payable.length} total={total} part={part} onClose={() => setPaying(false)} onSettled={settle} />
    </div>
  )
}

const PAY_STEPS = [
  [Banknote, 'Payout initiated'],
  [ShieldCheck, 'Cashfree confirmed'],
  [BookCheck, 'Voucher posted to Tally'],
  [MessageCircle, 'Vendors notified'],
]
function PayTray({ open, count, total, part, onClose, onSettled }) {
  const [step, setStep] = useState(-1) // -1 confirm, 0..3 progress, 4 done
  useEffect(() => { if (open) setStep(-1) }, [open])
  useEffect(() => {
    if (step < 0 || step > 3) return
    const t = setTimeout(() => { setStep((x) => x + 1); if (step === 3) onSettled() }, step === 0 ? 700 : 520)
    return () => clearTimeout(t)
  }, [step]) // eslint-disable-line
  const title = step < 0 ? 'Pay' : step < 4 ? 'Paying' : 'Paid'
  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="tray-scrim" onClick={() => (step < 0 || step > 3) && onClose()} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.div className="tray" initial={{ y: '110%' }} animate={{ y: 0 }} exit={{ y: '110%' }} transition={{ duration: 0.38, ease: DRAWER }}>
            <div className="tray-h">
              <button className="tray-ib press" onClick={onClose} disabled={step >= 0 && step < 4} aria-label="Close"><X size={16} /></button>
              <b className="tray-t"><TextMorph>{title}</TextMorph></b><span />
            </div>
            <AutoHeight duration={0.32} ease={DRAWER}>
              <div className="tray-b">
                <div className="pay-amt num"><Ticker value={total} format={(n) => fmt.inrFull(Math.round(n))} /></div>
                <div className="mute" style={{ textAlign: 'center', marginTop: 4 }}>{count} vendors · {part === 'taxable' ? 'Taxable' : 'GST'}</div>
                {step >= 0 && (
                  <div className="pay-steps">
                    {PAY_STEPS.map(([I, l], i) => (
                      <div key={l} className={'pay-step' + (i < step ? ' done' : i === step ? ' cur' : '')}>
                        <span className="pay-ic">
                          <AnimatePresence mode="popLayout" initial={false}>
                            {i < step
                              ? <motion.span key="c" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', duration: 0.35, bounce: 0.35 }} style={{ display: 'grid' }}><Check size={13} strokeWidth={2.75} /></motion.span>
                              : i === step ? <motion.span key="l" exit={{ opacity: 0, scale: 0.6 }} style={{ display: 'grid' }}><Loader2 size={13} className="spin" /></motion.span>
                              : <motion.span key="i" style={{ display: 'grid' }}><I size={13} /></motion.span>}
                          </AnimatePresence>
                        </span>
                        {l}
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ marginTop: 18 }}>
                  {step < 0 && <button className="tray-cta press" onClick={() => setStep(0)}>Pay {fmt.inr(total)}</button>}
                  {step >= 4 && <button className="tray-cta press is-done" onClick={onClose}><Check size={16} strokeWidth={2.5} /> Done</button>}
                </div>
              </div>
            </AutoHeight>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}

/* ═════════ Billing requests ═════════ */
const CHECKS = [[UserCheck, 'No PAN conflict'], [BookCheck, 'Tally ledger updated'], [Banknote, 'Payout beneficiary set'], [MessageCircle, 'Vendor notified']]
export function Requests() {
  const s = useStore()
  const [sel, setSel] = useState(null)
  const [run, setRun] = useState(-1)
  const list = s.requests
  const cur = list.find((x) => x.id === sel) || list[0]
  const idx = list.indexOf(cur)
  useEffect(() => { setRun(-1) }, [cur?.id])
  useEffect(() => {
    if (run < 0 || run > CHECKS.length) return
    if (run === CHECKS.length) {
      const t = setTimeout(() => {
        const next = list[idx + 1] || list[idx - 1]
        s.setRequests((l) => l.filter((x) => x.id !== cur.id))
        toast.success('Approved · ' + cur.vendor.name)
        setSel(next?.id ?? null)
      }, 500)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setRun((r) => r + 1), 420)
    return () => clearTimeout(t)
  }, [run]) // eslint-disable-line

  return (
    <div className="split">
      <div className="split-l">
        <div style={{ height: 8 }} />
        <div className="list">
          <AnimatePresence initial={false}>
            {list.map((r) => (
              <motion.button key={r.id} layout="position" className={'li inv-li' + (r.id === cur?.id ? ' sel' : '')} onClick={() => setSel(r.id)} exit={{ opacity: 0, height: 0, minHeight: 0, transition: { duration: 0.2, ease: EASE } }}>
                <div className="grow">
                  <div className="row"><span className="li-t ell grow">{r.vendor.name}</span><span className="mute xs">{fmt.agoShort(r.at)}</span></div>
                  <div className="li-s">{r.kind === 'Onboarding' ? <span className="chip y">New</span> : r.field}</div>
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
              <div className="mute xs">{cur.kind === 'Onboarding' ? 'New vendor' : 'Billing change'}</div>
              <h2 className="d-h1" style={{ marginTop: 4 }}>{cur.vendor.name}</h2>
              <div className="diff">
                <span className="mute">{cur.field}</span>
                {cur.from && <span className="diff-from mono">{cur.from}</span>}
                {cur.from && <ArrowRight size={14} className="mute" />}
                <span className="diff-to mono">{cur.to}</span>
              </div>
              <AutoHeight>
                {run >= 0 && (
                  <div className="pay-steps" style={{ marginTop: 20 }}>
                    {CHECKS.map(([I, l], i) => (
                      <div key={l} className={'pay-step' + (i < run ? ' done' : i === run ? ' cur' : '')}>
                        <span className="pay-ic">{i < run ? <Check size={13} strokeWidth={2.75} /> : i === run ? <Loader2 size={13} className="spin" /> : <I size={13} />}</span>{l}
                      </div>
                    ))}
                  </div>
                )}
              </AutoHeight>
              <div className="inv-actions">
                <RejectButton big onReject={() => { const next = list[idx + 1] || list[idx - 1]; s.setRequests((l) => l.filter((x) => x.id !== cur.id)); toast('Rejected · ' + cur.vendor.name); setSel(next?.id ?? null) }} />
                <button className="b ink" disabled={run >= 0} onClick={() => setRun(0)}><Check size={14} /> <TextMorph>{run >= 0 ? 'Approving' : 'Approve'}</TextMorph></button>
              </div>
            </div>
          </Swap>
        )}
      </div>
    </div>
  )
}

/* ═════════ Vendors ═════════ */
export function Vendors() {
  const s = useStore()
  const [q, setQ] = useState('')
  const rows = s.vendors.filter((v) => (v.name + v.role).toLowerCase().includes(q.toLowerCase()))
  return (
    <div className="d-page wide">
      <div className="d-head">
        <h1 className="d-h1">Vendors</h1>
        <div className="inp" style={{ width: 240 }}><Search size={14} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Vendor or asset" /></div>
      </div>
      <table className="tbl">
        <thead><tr><th>Vendor</th><th>Role</th><th className="r">Assets</th><th>Tally</th><th className="r">Paid</th><th className="r">Invoicing</th></tr></thead>
        <tbody>
          {rows.map((v) => (
            <tr key={v.id}>
              <td><span className="row"><Avatar user={{ name: v.name, hue: v.name.charCodeAt(0) * 7 }} size={22} /><b style={{ fontWeight: 500 }}>{v.name}</b><span className="mute xs">{v.city}</span></span></td>
              <td className="fg2">{v.role}</td>
              <td className="r num fg2">{v.assets || '—'}</td>
              <td className="mono mute">{v.tallyKey}</td>
              <td className="r num">{fmt.inr(v.paid)}</td>
              <td className="r"><Switch on={v.invoicing} label="Invoicing" onChange={(on) => { s.setVendors((l) => l.map((x) => (x.id === v.id ? { ...x, invoicing: on } : x))); toast(on ? 'Invoicing enabled' : 'Invoicing disabled', { description: v.name }) }} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
