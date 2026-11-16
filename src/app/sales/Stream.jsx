// Layout 4 · Stream: one ranked stream of everything, sorted by what to do next. Phone first.
import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Radar, Inbox, CalendarDays, AlertTriangle, Clock, X, Plus, UserCheck, KeyRound, Moon, ArrowUpRight, Check } from 'lucide-react'
import { toast } from 'sonner'
import { fmt, me, TODAY } from '../data'
import { Tip, EASE, Ticker } from '../../shared/motion'
import { BrandLogo } from '../../shared/brands'
import { go } from '../ui'
import { Sheet } from '../pages/Finance'
import { DEAL_STAGES, repOf } from './data'
import { isOpen } from './state'
import { openAddLead, dueOf } from './ui'
import { stream, companyByName, peopleOf, isKnown, revealPeople, fmtDays } from './prospect'
import { useProspect, useNarrow, useMq, ViewStrip, Enrich, BottomSheet, Dossier, BeyondRow, addSignal, addCompany } from './kit'

const TYPE = { signal: ['Signal', Radar], inbound: ['Inbound', Inbox], moment: ['Moment', CalendarDays], alert: ['Account alert', AlertTriangle], follow: ['Follow-up', Clock] }

export function Stream() {
  const { st, res } = useProspect()
  const cards = useMemo(() => stream(res, st), [res, st.hidden]) // eslint-disable-line react-hooks/exhaustive-deps
  const [co, setCo] = useState(null)
  const narrow = useNarrow()
  const touch = useMq('(pointer: coarse)')
  const hide = (card, until) => {
    if (card.type === 'signal' && !until) st.set((x) => ({ signals: x.signals.map((g) => (g.id === card.id ? { ...g, status: 'dismissed' } : g)) }))
    else st.set((x) => ({ hidden: [...x.hidden.filter((h) => h.id !== card.id), { id: card.id, until: until ? new Date(TODAY.getTime() + until * 864e5) : null }] }))
    const undo = () => st.set((x) => (card.type === 'signal' && !until ? { signals: x.signals.map((g) => (g.id === card.id ? { ...g, status: 'new' } : g)) } : { hidden: x.hidden.filter((h) => h.id !== card.id) }))
    toast(until ? 'Snoozed 3 days' : 'Dismissed', { description: card.brand, action: { label: 'Undo', onClick: undo } })
  }
  const dossier = co && <Dossier c={co} />
  return (
    <div className="bdv-stream">
      <div className="bdv-st-main">
        <div className="d-head"><h1 className="d-h1">Stream</h1></div>
        <ViewStrip />
        <div className="bdv-cards">
          <AnimatePresence initial={false}>
            {cards.map((c) => <Card key={c.id} card={c} touch={touch} onOpen={() => { const x = companyByName(c.brand, st); if (x) setCo(x) }} onHide={hide} />)}
          </AnimatePresence>
          {!cards.length && <div className="empty"><Check size={18} /><b>Clear</b></div>}
        </div>
        <BeyondRow kind="companies" list />
      </div>
      <Rail />
      {narrow ? <BottomSheet open={!!co} onClose={() => setCo(null)} tall>{dossier}</BottomSheet> : <Sheet open={!!co} onClose={() => setCo(null)} width={620}>{dossier}</Sheet>}
    </div>
  )
}

function Card({ card, touch, onOpen, onHide }) {
  const { st } = useProspect()
  const [L, I] = TYPE[card.type]
  const c = companyByName(card.brand, st)
  const dragged = useRef(false)
  const g = card.g, x = card.x, m = card.m, a = card.a, d = card.d
  const born = g?.born ? peopleOf(c, st).find((p) => p.born === g.id) : null
  const opp = a?.opps.find((o) => !o.deal)
  // Primary action for each kind; swipe right runs it.
  const primary = g ? (g.status === 'added' ? null : { label: 'Add to pipeline', icon: Plus, run: () => addSignal(g) })
    : x ? (x.owner ? (x.owner === me.id ? { label: 'Add to pipeline', icon: Plus, run: () => openAddLead({ brand: x.company, source: 'Inbound', value: String(x.budget / 1e5), contact: { name: x.name, title: '', email: x.email }, note: x.summary, ref: { kind: 'inbound', id: x.id } }) } : null)
      : { label: 'Claim', icon: UserCheck, run: () => { st.claim(x.id); toast('Claimed · ' + x.company) } })
      : m ? (m.brands[0] ? { label: 'Add ' + m.brands[0].name, icon: Plus, run: () => addCompany(m.brands[0], st) } : null)
        : a ? (opp ? { label: 'Add to pipeline', icon: Plus, run: () => openAddLead({ brand: a.brand, source: 'Accounts', value: String(opp.value / 1e5), services: a.services, note: opp.title + '. ' + opp.why, next: opp.kind === 'renewal' ? 'Book the renewal call' : 'Send the upsell idea', ref: { kind: 'opp', id: opp.id } }) } : { label: 'Open account', icon: ArrowUpRight, run: () => go('/bd/accounts/' + a.id) })
          : { label: 'Open deal', icon: ArrowUpRight, run: () => go(d.to) }
  const end = (_, info) => {
    if (info.offset.x < -110) onHide(card)
    else if (info.offset.x > 110 && primary) primary.run()
    setTimeout(() => { dragged.current = false }, 0)
  }
  const tap = (e) => { if (dragged.current || e.target.closest('button, a')) return; onOpen() }
  return (
    <motion.div className="bdv-card-w" exit={{ opacity: 0, height: 0, marginBottom: 0, transition: { duration: 0.22, ease: EASE } }}>
      {touch && <div className="bdv-under" aria-hidden><span className="bdv-u-add">{primary && <><primary.icon size={15} />{primary.label}</>}</span><span className="grow" /><span className="bdv-u-x"><X size={15} />Dismiss</span></div>}
      <motion.article className={'bdv-card t-' + card.type} onClick={tap}
        drag={touch ? 'x' : false} dragConstraints={{ left: 0, right: 0 }} dragElastic={0.6} dragDirectionLock onDragStart={() => { dragged.current = true }} onDragEnd={end}>
        <div className="row bdv-card-h">
          <span className={'bdv-type t-' + card.type}><I size={12} />{L}</span>
          {card.brand && <span className="row bdv-card-co"><BrandLogo name={card.brand} size={18} /><b className="ell">{card.brand}</b></span>}
          <span className="grow" />
          <span className="mute xs">{g ? fmt.agoShort(g.at) : x ? fmt.agoShort(x.at) : m ? fmtDays(m.at) : a ? 'Renewal ' + fmtDays(a.renewal) : fmtDays(d.at)}</span>
        </div>
        {g && <><div className="bdv-card-t">{g.title}</div><Enrich g={g} /></>}
        {x && <><div className="bdv-card-t">{x.summary}</div><div className="mute xs bdv-card-s">{x.name} · {fmt.inr(x.budget)} · {x.owner ? 'Owned by ' + (x.owner === me.id ? 'you' : repOf(x.owner).short) : 'Unclaimed'}</div></>}
        {m && (
          <>
            <div className="bdv-card-t">{m.name} · {fmt.date(m.at)}</div>
            <div className="bdv-logos bdv-card-s">{m.brands.slice(0, 6).map((b) => <Tip key={b.id} label={b.name}><span><BrandLogo name={b.name} size={22} /></span></Tip>)}<span className="mute xs">{m.brands.length} {m.brands.length === 1 ? 'brand fits' : 'brands fit'}</span></div>
          </>
        )}
        {a && <><div className="bdv-card-t">{a.alerts.map((z) => z.text).join(' · ')}</div>{opp && <div className="mute xs bdv-card-s">{opp.title} · {fmt.inr(opp.value)}</div>}</>}
        {d && <><div className="bdv-card-t">{d.text}</div><div className="mute xs bdv-card-s">{d.ctx}</div></>}
        <div className="row bdv-card-a">
          {primary && <button className="b sm" onClick={primary.run}><primary.icon size={13} />{primary.label}</button>}
          {g?.status === 'added' && <a className="b sm" href={'#/bd/pipeline/' + g.deal}><Check size={13} />In pipeline</a>}
          {born && !isKnown(born, st) && <Tip label={born.name + ' · ' + born.title + ' · 1 credit'}><button className="b sm" onClick={() => revealPeople(st, [born])}><KeyRound size={13} />Reveal</button></Tip>}
          <span className="grow" />
          <Tip label="Snooze 3 days"><button className="b sm ghost icon" aria-label="Snooze" onClick={() => onHide(card, 3)}><Moon size={14} /></button></Tip>
          <Tip label="Dismiss"><button className="b sm ghost icon" aria-label="Dismiss" onClick={() => onHide(card)}><X size={14} /></button></Tip>
        </div>
      </motion.article>
    </motion.div>
  )
}

/** Desktop rail: credits, what's due today, the pipeline at a glance. */
function Rail() {
  const { st } = useProspect()
  const due = dueOf(st).filter((x) => x.deal.owner === me.id)
  const open = st.deals.filter(isOpen)
  const stages = DEAL_STAGES.filter((s) => s.n >= 1 && s.n <= 4)
  const maxN = Math.max(1, ...stages.map((s) => open.filter((x) => x.stage === s.id).length))
  return (
    <aside className="bdv-rail">
      <div className="bdv-rc">
        <span className="metric-l">Apollo credits</span>
        <span className="metric-v num"><Ticker value={st.credits} /></span>
      </div>
      <div className="bdv-rc">
        <span className="metric-l">Due <span className="num mute">{due.length}</span></span>
        <div className="list">{due.map((x) => (
          <a key={x.id} className="li bdv-due" href={'#' + x.to}><BrandLogo name={x.deal.brand} size={18} /><span className="grow ell">{x.text}</span><span className="mute xs">{x.kind === 'follow' ? 'Follow-up' : fmtDays(x.at)}</span></a>
        ))}</div>
        {!due.length && <span className="mute xs">Clear</span>}
      </div>
      <a className="bdv-rc bdv-rc-l" href="#/bd/pipeline">
        <span className="metric-l">Pipeline</span>
        <span className="metric-v num">{fmt.inr(open.reduce((t, x) => t + x.value, 0))}</span>
        <div className="bdv-mini">{stages.map((s) => {
          const k = open.filter((x) => x.stage === s.id).length
          return <div key={s.id} className="bdv-mini-r"><span className={'sl-stag s-' + s.id}><i />{s.label}</span><span className="bdv-bar"><i style={{ width: (k / maxN) * 100 + '%' }} /></span><span className="num">{k}</span></div>
        })}</div>
      </a>
    </aside>
  )
}
