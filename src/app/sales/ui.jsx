// Shared Sales pieces: source chips, relationship strength, the Ask box, the one Add-to-pipeline form,
// the bell, staged generators, decisions and the deck (viewer + present mode).
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import {
  Mail, Database, Network, CalendarDays, Video, NotebookPen, Radar, Wand2, Library, Layers, Bell, Check, X, ArrowUp, ArrowRight,
  ArrowUpRight, AlertTriangle, ChevronLeft, ChevronRight, Presentation, Link2, Download, PenLine, Loader2, MessageCircleQuestion, Reply, Clock, Building2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useStore } from '../store'
import { fmt, SERVICES } from '../data'
import { Tip, ConfirmButton, AutoHeight, EASE, DRAWER, TextMorph } from '../../shared/motion'
import { Avatar } from '../../shared/ui'
import { BrandLogo } from '../../shared/brands'
import { Popover, go } from '../ui'
import { Sheet } from '../pages/Finance'
import { refFor, resolve, Answer, suggestFor } from '../pages/Hub'
import { now, ahead, brandOf, repOf, caseById, proofFor, budgetOf, brands } from './data'
import { factsFor, relOf, brandIn, stageLabel, RELL } from './state'

/* ───────── Source chips ───────── */
const SRC_ICON = { Gmail: Mail, Apollo: Database, LinkedIn: Network, 'Google Calendar': CalendarDays, 'Google Meet': Video, Gemini: NotebookPen, 'Signals engine': Radar, AI: Wand2, 'Case Library': Library, DMS: Layers }
const SRC_TIP = { Gmail: 'From your Gmail', Apollo: 'From Apollo', LinkedIn: 'From LinkedIn', 'Google Calendar': 'Google Calendar', 'Google Meet': 'Google Meet', Gemini: 'Gemini meeting notes', 'Signals engine': 'Signals engine', AI: 'Written by AI', 'Case Library': 'WLDD Case Library', DMS: 'WLDD records' }
/** Quiet source tag: a generic icon plus the source's name. `s` may join sources with " · ". */
export function Src({ s, tip = true }) {
  const parts = String(s).split(' · ')
  const I = SRC_ICON[parts[0]] || Layers
  const chip = <span className="sl-src"><I size={11} strokeWidth={2} />{parts.join(' · ')}</span>
  return tip ? <Tip label={parts.map((p) => SRC_TIP[p] || p).join(' + ')}>{chip}</Tip> : chip
}

/* ───────── Relationship strength ───────── */
const REL_N = { client: 3, moved: 2, known: 2, cold: 1 }
export function Rel({ rel, compact }) {
  const n = REL_N[rel.kind] || 1
  const el = (
    <span className={'sl-rel r-' + rel.kind}>
      <span className="sl-bars" aria-hidden>{[1, 2, 3].map((k) => <i key={k} className={k <= n ? 'on' : ''} />)}</span>
      {!compact && RELL[rel.kind]}
    </span>
  )
  return rel.note || compact ? <Tip label={rel.note || RELL[rel.kind]}>{el}</Tip> : el
}

/** Unknown is a value too: shown, never guessed. */
export const Val = ({ v }) => (v == null || v === '' ? <span className="sl-unk">Unknown</span> : <>{v}</>)

/** Fact rows with their source. */
export function Facts({ facts, cols = 2 }) {
  return (
    <div className={'sl-facts c' + cols}>
      {facts.map((f) => (
        <div key={f.k} className="sl-fact">
          <span className="sl-fk">{f.k}</span>
          <span className="sl-fv">
            {f.cases ? <span className="sl-proofs">{f.cases.map((c) => <CaseChip key={c.id} c={c} />)}</span>
              : f.to ? <a href={'#' + f.to} className="sl-lnk">{f.v}</a> : <Val v={f.v} />}
          </span>
          <Src s={f.src} />
        </div>
      ))}
    </div>
  )
}

/** "Proof used" chip: opens the case. */
export const CaseChip = ({ c }) => (
  <a href={'#/bd/cases/' + c.id} className="chip sl-case"><BrandLogo name={c.client} size={14} radius={4} />{c.client}<span className="mute">{fmt.compact(c.views)}</span></a>
)
export function ProofUsed({ ids, src = 'AI · Case Library' }) {
  const list = ids.map(caseById).filter(Boolean)
  if (!list.length) return null
  return <div className="sl-proofrow"><span className="mute xs">Proof used</span>{list.map((c) => <CaseChip key={c.id} c={c} />)}<Src s={src} /></div>
}

/* ───────── Staged generator ───────── */
const prefersReduced = () => document.documentElement.dataset.motion === 'reduced' || (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false)
/** Runs steps one after another (simulated latency), then calls onDone. */
export function useGen(n, onDone, ms = 650) {
  const [i, setI] = useState(-1)
  const t = useRef([])
  useEffect(() => () => t.current.forEach(clearTimeout), [])
  const start = () => {
    if (i >= 0) return
    const step = prefersReduced() ? Math.round(ms / 2) : ms
    setI(0)
    for (let k = 1; k <= n; k++) t.current.push(setTimeout(() => { setI(k); if (k === n) onDone() }, step * k))
  }
  return { i, running: i >= 0 && i < n, start }
}
export function GenSteps({ steps, i }) {
  return (
    <div className="sl-gen" aria-live="polite">
      {steps.map((s, k) => (
        <div key={k} className={'sl-gs' + (k < i ? ' done' : k === i ? ' cur' : '')}>
          <span className="sl-gi">{k < i ? <Check size={12} strokeWidth={2.5} /> : k === i ? <Loader2 size={12} className="sl-spin" /> : <i />}</span>
          <span className="grow">{s.label}</span>
          {s.src && <Src s={s.src} tip={false} />}
        </div>
      ))}
    </div>
  )
}
/** A card that generates its content on first use, then shows it. */
export function Generated({ done, steps, onDone, label, icon: I = Wand2, children, src }) {
  const g = useGen(steps.length, onDone)
  if (done) return children
  return (
    <AutoHeight>
      {g.i < 0 ? (
        <button className="b sl-genb" onClick={g.start}><I size={14} />{label}{src && <Src s={src} tip={false} />}</button>
      ) : <GenSteps steps={steps} i={g.i} />}
    </AutoHeight>
  )
}

/* ───────── Decision ───────── */
/** A stage's yes/no question. "No" never closes straight away: it nudges first. */
export function Decision({ q, yes, onYes, nudge, onNudge, onLost, yesDisabled, extra }) {
  const [no, setNo] = useState(false)
  return (
    <div className="sl-dec">
      <div className="sl-dec-q">{q}</div>
      <AutoHeight>
        {!no ? (
          <div className="sl-dec-a">
            {extra}
            <button className="b" onClick={() => setNo(true)}>No</button>
            <ConfirmButton className={'b ink' + (yesDisabled ? ' dis' : '')} label={yes} doneLabel="Moved" icon={<ArrowRight size={14} />} onDone={onYes} />
          </div>
        ) : (
          <div className="sl-dec-n">
            <span className="grow">{nudge.text}</span>
            <button className="b" onClick={() => setNo(false)}>Back</button>
            <button className="b" onClick={() => { onNudge(); setNo(false) }}>{nudge.label}</button>
            <button className="b reject" onClick={onLost}>Close as lost</button>
          </div>
        )}
      </AutoHeight>
    </div>
  )
}

/* ───────── Ask box ───────── */
export const openAsk = (q) => window.dispatchEvent(new CustomEvent('sales:ask', { detail: { q } }))
export function AskButton() {
  return (
    <Tip label="Ask about any brand">
      <button className="b sm sl-askb" onClick={() => openAsk()} aria-label="Ask"><MessageCircleQuestion size={14} /><span className="m-hide">Ask</span></button>
    </Tip>
  )
}

const SUGGEST = ['What do we know about Licious?', 'Mokobara', 'Lenskart', 'Who owns Ather Energy?', 'Open pipeline']
export function AskDialog() {
  const s = useStore()
  const st = s.sales
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [thread, setThread] = useState([]) // { id, q, busy }
  const inp = useRef(null)
  const end = useRef(null)
  const ask = (text) => {
    const t = text.trim()
    if (!t) return
    const id = Math.random().toString(36).slice(2)
    setThread((l) => [...l, { id, q: t, busy: true }])
    setQ('')
    setTimeout(() => setThread((l) => l.map((x) => (x.id === id ? { ...x, busy: false } : x))), prefersReduced() ? 150 : 650)
  }
  useEffect(() => {
    const on = (e) => { setOpen(true); if (e.detail?.q) ask(e.detail.q) }
    window.addEventListener('sales:ask', on)
    return () => window.removeEventListener('sales:ask', on)
  }, []) // eslint-disable-line
  useEffect(() => {
    if (!open) return
    setTimeout(() => inp.current?.focus(), 30)
    const k = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [open])
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }) }, [thread])
  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="sl-ask-scrim" onClick={() => setOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} />
          <motion.div className="sl-ask" role="dialog" aria-label="Ask" initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.12 } }} transition={{ duration: 0.2, ease: EASE }}>
            <form className="sl-ask-in" onSubmit={(e) => { e.preventDefault(); ask(q) }}>
              <MessageCircleQuestion size={16} className="mute" />
              <input ref={inp} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask about any brand" aria-label="Ask about any brand" />
              <button className="b ink icon sm" type="submit" disabled={!q.trim()} aria-label="Ask"><ArrowUp size={14} /></button>
            </form>
            <div className="sl-ask-body">
              {!thread.length && <div className="sl-ask-sug">{SUGGEST.map((x) => <button key={x} className="chip" onClick={() => ask(x)}>{x}</button>)}</div>}
              {thread.map((m) => (
                <div key={m.id} className="sl-ask-m">
                  <div className="sl-ask-q">{m.q}</div>
                  {m.busy ? <div className="sl-think"><i /><i /><i /></div> : (
                    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: EASE }}>
                      <AskAnswer text={m.q} st={st} s={s} ask={ask} close={() => setOpen(false)} />
                    </motion.div>
                  )}
                </div>
              ))}
              <div ref={end} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}

/** Brand first; then the Home chat's KPI engine; otherwise an honest Unknown. */
function AskAnswer({ text, st, s, ask, close }) {
  const b = brandIn(text)
  const name = b?.name || guessName(text)
  if (!b) {
    const ref = refFor(text, null, ['bd'])
    if (ref !== 'miss') return <div className="sl-ans"><Answer a={resolve(ref, ['bd'], s)} ask={ask} suggest={suggestFor(['bd'])} /></div>
  }
  const facts = name ? factsFor(name, st) : []
  const rel = name ? relOf(name, st) : { kind: 'cold' }
  const deal = name && st.deals.find((d) => d.brand.toLowerCase() === name.toLowerCase() && d.stage !== 'lost')
  const known = facts.filter((f) => f.v != null && !f.cases).length
  return (
    <div className="sl-ans">
      <div className="sl-ans-h">
        {b ? <BrandLogo name={b.name} size={28} /> : <span className="sl-ans-x"><Building2 size={15} /></span>}
        <div className="grow"><div className="li-t">{name || 'Unknown brand'}</div><div className="mute xs">{b ? b.about : 'Nothing on file'}</div></div>
        {b && <Rel rel={rel} />}
        <Src s="AI" />
      </div>
      {b ? <p className="sl-ans-p">{summaryLine(b, st, deal, rel)}</p> : <p className="sl-ans-p mute">We have no records for this name. Every field stays Unknown until a source fills it.</p>}
      <Facts cols={1} facts={b ? facts : facts.map((f) => ({ ...f, v: f.k === 'Pipeline' ? 'Not in pipeline' : f.k === 'Relationship' ? null : null, cases: null, to: null }))} />
      <div className="sl-ans-a">
        <span className="mute xs">{known} known · {facts.length - known} unknown</span>
        <span className="grow" />
        {b && <button className="b sm" onClick={() => { close(); go('/bd/discover/' + b.id) }}>Profile<ArrowUpRight size={13} /></button>}
        {deal ? <button className="b sm" onClick={() => { close(); go('/bd/pipeline/' + deal.id) }}>Open deal<ArrowUpRight size={13} /></button>
          : <button className="b sm ink" onClick={() => { close(); openAddLead({ brand: name || '', source: 'Discover' }) }}>Add to pipeline</button>}
      </div>
    </div>
  )
}
const guessName = (t) => t.replace(/[?.!]/g, '').replace(/^(what|who|tell me|do we|anything)( do we know| owns| about| know)?( about)?/i, '').trim().replace(/\b\w/g, (c) => c.toUpperCase()) || null
function summaryLine(b, st, deal, rel) {
  const parts = []
  if (rel.kind === 'client') parts.push(`${b.name} is a client.`)
  if (deal) parts.push(`${deal.owner === 'u1' ? 'In your pipeline' : 'In ' + repOf(deal.owner).short + '’s pipeline'} at ${stageLabel(deal.stage)}.`)
  else if (rel.kind !== 'client') parts.push('Not in anyone’s pipeline.')
  if (rel.note) parts.push(rel.note + '.')
  const bud = budgetOf(b)
  if (bud) parts.push(`Creator budget about ${fmt.inr(bud.annual)} a year.`)
  return parts.join(' ')
}

/* ───────── Add to pipeline: one form for every source ───────── */
export const openAddLead = (prefill = {}) => window.dispatchEvent(new CustomEvent('sales:add', { detail: prefill }))
export const SOURCES = ['Daily Feed', 'Discover', 'Inbound', 'Accounts', 'Own contacts']
const SVC_PICK = ['amp', 'memd', 'inf', 'solo', 'tt', 'cc', 'orm', 'aca', 'off']
const DUE = [['Today', 0], ['Tomorrow', 1], ['In 3 days', 3], ['Next week', 7]]
const blank = { brand: '', contact: { name: '', title: '', email: '' }, value: '', services: [], source: 'Discover', next: 'Send intro email', dueIn: 1, note: '', ref: null }

export function AddLeadSheet() {
  const s = useStore()
  const st = s.sales
  const [open, setOpen] = useState(false)
  const [f, setF] = useState(blank)
  const [ack, setAck] = useState(false)
  const [pre, setPre] = useState([])
  useEffect(() => {
    const on = (e) => {
      const p = e.detail || {}
      const b = brandOf(p.brand)
      const bud = budgetOf(b)
      const next = { ...blank, ...p, contact: { ...blank.contact, ...(p.contact || {}) }, services: p.services || [], value: p.value ?? (bud ? String(Math.round(bud.ours / 1e5)) : '') }
      setF(next); setAck(false); setOpen(true)
      setPre(Object.entries({ Brand: p.brand, Contact: p.contact?.name, Value: p.value != null || bud, Source: p.source, Note: p.note }).filter(([, v]) => v).map(([k]) => k))
    }
    window.addEventListener('sales:add', on)
    return () => window.removeEventListener('sales:add', on)
  }, [])
  const dup = open ? st.dupOf(f.brand) : null
  useEffect(() => setAck(false), [dup?.id])
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }))
  const setC = (k) => (e) => setF((x) => ({ ...x, contact: { ...x.contact, [k]: e.target.value } }))
  const b = brandOf(f.brand)
  const ok = f.brand.trim() && (!dup || ack)
  const submit = () => {
    if (!ok) return
    const id = st.addDeal({ ...f, due: ahead(f.dueIn) })
    setOpen(false)
    return id
  }
  const stop = () => { setOpen(false); toast('Stopped', { description: `${dup.brand} stays with ${repOf(dup.owner).short}` }) }
  return (
    <Sheet open={open} onClose={() => setOpen(false)} width={540}>
      <div className="sl-add">
        <div className="row" style={{ gap: 10, marginBottom: 4 }}>
          <h2 className="d-h1" style={{ fontSize: 20 }}>Add to pipeline</h2>
        </div>
        {pre.length > 0 && <div className="sl-pre"><Wand2 size={12} />Pre-filled · {pre.join(', ')}<span className="mute">from {f.source}</span></div>}

        <label className="sl-f"><span>Brand</span>
          <div className="inp">{f.brand && <BrandLogo name={f.brand} size={18} radius={5} />}<input list="sl-brands" value={f.brand} onChange={set('brand')} placeholder="Brand" autoFocus={!f.brand} /></div>
        </label>
        <datalist id="sl-brands">{brands.map((x) => <option key={x.id} value={x.name} />)}</datalist>

        <AutoHeight>
          {dup && (
            <div className={'sl-dup' + (ack ? ' ack' : '')} role="alert">
              <AlertTriangle size={15} />
              <div className="grow">
                <div><b>{dup.owner === 'u1' ? 'Already in your pipeline' : `In ${repOf(dup.owner).short}’s pipeline`}</b></div>
                <div className="row xs fg2" style={{ marginTop: 4 }}><Avatar user={repOf(dup.owner)} size={16} />{stageLabel(dup.stage)} · {fmt.inr(dup.value)} · <span className="mono">{dup.code}</span></div>
              </div>
              {!ack ? (
                <span className="row" style={{ gap: 6 }}>
                  <button className="b sm" onClick={stop}>Stop</button>
                  <button className="b sm" onClick={() => setAck(true)}>Add anyway</button>
                </span>
              ) : <span className="chip">Adding anyway</span>}
            </div>
          )}
        </AutoHeight>

        <div className="sl-grid2">
          <label className="sl-f"><span>Contact</span><div className="inp"><input value={f.contact.name} onChange={setC('name')} placeholder="Name" /></div></label>
          <label className="sl-f"><span>Title</span><div className="inp"><input value={f.contact.title} onChange={setC('title')} placeholder="Title" /></div></label>
          <label className="sl-f"><span>Email</span><div className="inp"><input type="email" value={f.contact.email} onChange={setC('email')} placeholder={b ? 'name@' + b.domain : 'Email'} /></div></label>
          <label className="sl-f"><span>Value, ₹ lakh</span><div className="inp"><input inputMode="decimal" value={f.value} onChange={set('value')} placeholder="0" />{budgetOf(b) && <Src s="AI" />}</div></label>
        </div>

        <div className="sl-f"><span>Services</span>
          <div className="sl-chips">{SVC_PICK.map((k) => {
            const on = f.services.includes(k)
            return <button key={k} className={'chip sl-tog' + (on ? ' on' : '')} aria-pressed={on} onClick={() => setF((x) => ({ ...x, services: on ? x.services.filter((y) => y !== k) : [...x.services, k] }))}>{SERVICES[k].label}</button>
          })}</div>
        </div>

        <div className="sl-grid2">
          <div className="sl-f"><span>Source</span>
            <div className="sl-chips">{SOURCES.map((x) => <button key={x} className={'chip sl-tog' + (f.source === x ? ' on' : '')} aria-pressed={f.source === x} onClick={() => setF((y) => ({ ...y, source: x }))}>{x}</button>)}</div>
          </div>
          <div className="sl-f"><span>Next step</span>
            <div className="inp"><input value={f.next} onChange={set('next')} /></div>
            <div className="sl-chips" style={{ marginTop: 6 }}>{DUE.map(([l, d]) => <button key={l} className={'chip sl-tog' + (f.dueIn === d ? ' on' : '')} aria-pressed={f.dueIn === d} onClick={() => setF((y) => ({ ...y, dueIn: d }))}>{l}</button>)}</div>
          </div>
        </div>

        <label className="sl-f"><span>Note</span><div className="inp sl-ta"><textarea rows={2} value={f.note} onChange={set('note')} placeholder="Why now" /></div></label>

        <div className="inv-actions">
          <button className="b" onClick={() => setOpen(false)}>Cancel</button>
          <button className={'b ink' + (ok ? '' : ' dis')} disabled={!ok} onClick={submit}><Check size={14} />{dup && ack ? 'Add anyway' : 'Add to pipeline'}</button>
        </div>
      </div>
    </Sheet>
  )
}

/* ───────── Bell: reminders, follow-ups, deal and account updates ───────── */
const NICON = { reply: Reply, reminder: CalendarDays, follow: Clock, account: Building2, deal: ArrowRight }
export function dueOf(st) {
  const soon = now().getTime() + 864e5
  const rem = st.deals.flatMap((d) => d.reminders.filter((r) => !r.done && r.at.getTime() <= soon).map((r) => ({ id: d.id + r.id, kind: 'reminder', text: r.text, ctx: d.brand + ' · ' + fmt.ago(r.at), to: '/bd/pipeline/' + d.id, deal: d, at: r.at })))
  const fol = st.deals.filter((d) => d.owner === 'u1' && d.stage === 'new' && d.outreach?.sentAt && !d.outreach.reply && now() - d.outreach.sentAt > 3 * 864e5)
    .map((d) => ({ id: 'f' + d.id, kind: 'follow', text: 'Follow up · ' + d.brand, ctx: 'No reply in ' + Math.floor((now() - d.outreach.sentAt) / 864e5) + ' days', to: '/bd/pipeline/' + d.id + '/outreach', deal: d, at: d.outreach.sentAt }))
  return [...rem, ...fol]
}
export function SalesBell() {
  const s = useStore()
  const st = s.sales
  const due = dueOf(st)
  const unread = st.notifs.filter((n) => !n.read).length
  const markRead = () => st.set((x) => ({ notifs: x.notifs.map((n) => ({ ...n, read: true })) }))
  const Row = ({ n, close }) => {
    const I = NICON[n.kind] || Bell
    return (
      <button className={'sl-nrow' + (n.read === false ? ' new' : '')} onClick={() => { close(); go(n.to) }}>
        <span className="sl-ni"><I size={13} /></span>
        <span className="grow" style={{ minWidth: 0 }}><span className="ell" style={{ display: 'block', fontWeight: 500 }}>{n.text}</span><span className="mute xs ell" style={{ display: 'block' }}>{n.ctx}</span></span>
        <span className="mute xs">{fmt.agoShort(n.at)}</span>
      </button>
    )
  }
  return (
    <Popover width={340} trigger={({ toggle }) => (
      <Tip label="Notifications"><button className="b ghost icon" onClick={() => { toggle(); setTimeout(markRead, 1200) }} aria-label="Notifications" style={{ position: 'relative' }}>
        <Bell size={16} />
        <AnimatePresence>{(unread > 0 || due.length > 0) && <motion.i className="sl-dot" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.15 }} />}</AnimatePresence>
      </button></Tip>
    )}>
      {(close) => (
        <div className="sl-bell">
          {due.length > 0 && <><div className="pop-h">Due <span className="num">{due.length}</span></div>{due.map((n) => <Row key={n.id} n={n} close={close} />)}<div className="pop-sep" /></>}
          <div className="pop-h">Updates</div>
          {st.notifs.slice(0, 8).map((n) => <Row key={n.id} n={n} close={close} />)}
          {!st.notifs.length && <div className="empty" style={{ padding: 20 }}><b>Clear</b></div>}
        </div>
      )}
    </Popover>
  )
}

/* ───────── Deck ───────── */
const readable = (hex) => {
  const n = parseInt(hex.slice(1), 16)
  const l = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255
  return l > 0.62 ? '#141414' : '#ffffff'
}
const IDEA = {
  Beverage: 'own the 11pm craving', Food: 'turn every snack break into a meme', Fashion: 'make the drop the conversation', Beauty: 'make the routine shareable',
  Fintech: 'make money talk funny', Mobility: 'ride with every city', Travel: 'be the trip everyone screenshots', EdTech: 'make study breaks go viral',
  Electronics: 'launch loud', Home: 'make comfort the punchline', Fitness: 'turn every gym into a creator studio', Jewellery: 'make the wedding season scroll stop',
}
/** Deck for a deal: brief + proposal + proof, every claim cited. */
export function deckFor(d) {
  const b = brandOf(d.brand) || { name: d.brand, color: '#18181b', cat: 'Brand', competitors: [] }
  const proof = d.proof.map(caseById).filter(Boolean).slice(0, 2)
  const idea = IDEA[b.cat] || 'own the internet’s attention'
  const v = d.won?.value || d.value
  const plan = [
    { text: `${b.name} is in a launch window right now`, cite: 'Signals engine' },
    { text: d.scope?.need ? `Need from the call: ${d.scope.need.toLowerCase()}` : 'Need from the call: reach in metros, fast', cite: 'Gemini · call notes' },
    { text: `Competitors ${b.competitors.slice(0, 2).join(' and ')} are quiet on meme pages`, cite: 'AI · Apollo' },
    ...proof.map((c) => ({ text: `${c.client}: ${c.result}`, cite: 'Case Library · ' + c.client, id: c.id })),
    { text: `Investment ${fmt.inr(v)} across ${d.services.length} services`, cite: 'Proposal v' + (d.proposal?.versions.length || 1) },
  ]
  const slides = [
    { kind: 'cover', title: `${b.name} × WLDD`, sub: `How ${b.name} can ${idea}` },
    { kind: 'list', eyebrow: 'Why now', title: 'The window is open', items: plan.slice(0, 3) },
    { kind: 'big', eyebrow: 'The idea', title: idea[0].toUpperCase() + idea.slice(1) + '.', sub: 'Meme pages start it, creators carry it, paid amplification spreads it.' },
    { kind: 'cols', eyebrow: 'How it rolls out', title: 'Three weeks, three beats', cols: [['Seed', '30 meme pages set the joke', 'Week 1'], ['Spark', '12 creators make it theirs', 'Week 2'], ['Spread', 'Paid boosts on the winners', 'Week 3']] },
    ...proof.map((c) => ({ kind: 'case', eyebrow: 'Proof', title: `${c.client} · ${c.title}`, case: c, cite: 'Case Library' })),
    { kind: 'invest', eyebrow: 'Investment', title: fmt.inr(v), rows: d.services.map((k, i) => [SERVICES[k].label, Math.round((v * [0.45, 0.3, 0.15, 0.1][i % 4]) / 1e5) * 1e5]), cite: 'Proposal' },
    { kind: 'big', eyebrow: 'Next', title: 'Sign this week, live in three.', sub: `${repOf(d.owner).name} · WLDD` },
  ]
  return { brand: b, plan, slides }
}
/** Creds deck from picked cases. */
export function credsDeck(ids) {
  const list = ids.map(caseById).filter(Boolean)
  return {
    brand: { name: 'WLDD', color: '#18181b' },
    slides: [
      { kind: 'cover', title: 'WLDD creds', sub: `${list.length} campaigns · ${fmt.compact(list.reduce((a, c) => a + c.views, 0))} views` },
      ...list.map((c) => ({ kind: 'case', eyebrow: c.year + ' · ' + c.services.map((k) => SERVICES[k].short).join(' · '), title: `${c.client} · ${c.title}`, case: c, cite: 'Case Library' })),
      { kind: 'big', eyebrow: 'Next', title: 'Let’s make yours next.', sub: 'WLDD · meme marketing, creators, amplification' },
    ],
  }
}

export function Slide({ s, brand, i, n }) {
  const bc = brand.color || '#18181b'
  const fg = readable(bc)
  const dark = s.kind === 'cover' || s.kind === 'big'
  return (
    <div className={'sl-slide k-' + s.kind + (dark ? ' dark' : '')} style={{ '--bc': bc, '--bfg': fg }}>
      <div className="sl-s-top">
        {brand.name !== 'WLDD' ? <BrandLogo name={brand.name} size={22} radius={6} /> : <span className="sl-s-w">WLDD</span>}
        {s.eyebrow && <span className="sl-s-eb">{s.eyebrow}</span>}
        <span className="grow" />
        {n && <span className="sl-s-n">{i + 1}/{n}</span>}
      </div>
      <div className="sl-s-body">
        <div className="sl-s-t">{s.title}</div>
        {s.sub && <div className="sl-s-sub">{s.sub}</div>}
        {s.items && <ul className="sl-s-list">{s.items.map((x, k) => <li key={k}>{x.text}<span className="sl-s-cite">{x.cite}</span></li>)}</ul>}
        {s.cols && <div className="sl-s-cols">{s.cols.map(([h, t, w]) => <div key={h}><b>{h}</b><span>{t}</span><em>{w}</em></div>)}</div>}
        {s.case && (
          <div className="sl-s-case">
            <div className="sl-s-stats"><div><b>{fmt.compact(s.case.views)}</b><span>views</span></div><div><b>{s.case.er}%</b><span>engagement</span></div><div><b>{s.case.creators}</b><span>creators</span></div></div>
            <div className="sl-s-res">{s.case.result}</div>
            {s.case.quote && <div className="sl-s-q">“{s.case.quote}”</div>}
          </div>
        )}
        {s.rows && <div className="sl-s-rows">{s.rows.map(([l, v]) => <div key={l}><span>{l}</span><b>{fmt.inr(v)}</b></div>)}</div>}
      </div>
      {s.cite && <div className="sl-s-foot">Source · {s.cite}</div>}
    </div>
  )
}

/** Thumbnails + the current slide + actions. `onEdit(i, title)` makes headlines editable. */
export function DeckViewer({ deck, file, onEdit, onShare, onPresent, extra }) {
  const [i, setI] = useState(0)
  const [edit, setEdit] = useState(false)
  const [present, setPresent] = useState(false)
  const n = deck.slides.length
  const cur = deck.slides[Math.min(i, n - 1)]
  return (
    <div className="sl-deck">
      <div className="sl-deck-bar">
        <span className="mute xs num">{i + 1} / {n}</span>
        <span className="grow" />
        {onEdit && <button className={'b sm' + (edit ? ' on' : '')} aria-pressed={edit} onClick={() => setEdit((v) => !v)}><PenLine size={13} />{edit ? 'Done' : 'Edit'}</button>}
        <button className="b sm" onClick={() => { try { navigator.clipboard?.writeText(location.href.split('#')[0] + '#/bd/cases') } catch {} toast('Link copied', { description: 'Anyone at the client can view' }); onShare?.('link') }}><Link2 size={13} />Share</button>
        <button className="b sm" onClick={() => { toast.success('PDF ready', { description: (file || 'Deck') + '.pdf · ' + n + ' slides' }); onShare?.('pdf') }}><Download size={13} /><span className="m-hide">PDF</span></button>
        {extra}
        <button className="b sm ink" onClick={() => { setPresent(true); onPresent?.() }}><Presentation size={13} />Present</button>
      </div>
      <div className="sl-deck-main">
        <Slide s={cur} brand={deck.brand} i={i} n={n} />
        {edit && <div className="inp" style={{ marginTop: 8 }}><PenLine size={13} /><input value={cur.title} onChange={(e) => onEdit(i, e.target.value)} aria-label="Slide headline" /></div>}
        <button className="b icon sm sl-deck-prev" disabled={i === 0} onClick={() => setI((k) => Math.max(0, k - 1))} aria-label="Previous slide"><ChevronLeft size={15} /></button>
        <button className="b icon sm sl-deck-next" disabled={i === n - 1} onClick={() => setI((k) => Math.min(n - 1, k + 1))} aria-label="Next slide"><ChevronRight size={15} /></button>
      </div>
      <div className="sl-thumbs">
        {deck.slides.map((s, k) => (
          <button key={k} className={'sl-thumb' + (k === i ? ' on' : '')} onClick={() => setI(k)} aria-label={'Slide ' + (k + 1)}><Slide s={s} brand={deck.brand} /></button>
        ))}
      </div>
      {present && <Presenter deck={deck} start={i} onClose={(k) => { setPresent(false); setI(k) }} />}
    </div>
  )
}

/** Full-screen present mode. Arrow keys, space, Home/End; Esc leaves. Keyboard moves are instant. */
export function Presenter({ deck, start = 0, onClose }) {
  const [i, setI] = useState(start)
  const n = deck.slides.length
  const ref = useRef(i); ref.current = i
  useEffect(() => {
    const el = document.documentElement
    try { el.requestFullscreen?.().catch(() => {}) } catch {}
    const k = (e) => {
      if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].includes(e.key)) { e.preventDefault(); setI((x) => Math.min(n - 1, x + 1)) }
      else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(e.key)) { e.preventDefault(); setI((x) => Math.max(0, x - 1)) }
      else if (e.key === 'Home') setI(0)
      else if (e.key === 'End') setI(n - 1)
      else if (e.key === 'Escape') { e.stopPropagation(); close() }
    }
    window.addEventListener('keydown', k, true)
    return () => window.removeEventListener('keydown', k, true)
  }, []) // eslint-disable-line
  const close = () => { try { if (document.fullscreenElement) document.exitFullscreen?.() } catch {} onClose(ref.current) }
  return createPortal(
    <motion.div className="sl-present" role="dialog" aria-label="Present" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, ease: EASE }}>
      <div className="sl-present-stage" onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); setI((x) => (e.clientX - r.left < r.width / 3 ? Math.max(0, x - 1) : Math.min(n - 1, x + 1))) }}>
        <Slide s={deck.slides[i]} brand={deck.brand} i={i} n={n} />
      </div>
      <div className="sl-present-bar">
        <button className="b sm ghost" onClick={() => setI((x) => Math.max(0, x - 1))} aria-label="Previous"><ChevronLeft size={15} /></button>
        <span className="num">{i + 1} / {n}</span>
        <button className="b sm ghost" onClick={() => setI((x) => Math.min(n - 1, x + 1))} aria-label="Next"><ChevronRight size={15} /></button>
        <span className="sl-present-k">← → · Esc</span>
        <button className="b sm ghost" onClick={close} aria-label="Exit"><X size={15} /></button>
      </div>
    </motion.div>,
    document.body,
  )
}
