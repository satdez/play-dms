// Deal page: #/bd/pipeline/<id>/<tab>. Tabs appear as the deal moves forward.
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  Check, Mail, Send, Network, CalendarDays, Video, NotebookPen, Wand2, Presentation, Plus, Copy, ArrowUpRight, RotateCcw, Clock, Link2, Download, FileText,
  Reply, Hourglass, CircleSlash, PartyPopper, RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'
import { useStore } from '../store'
import { fmt, SERVICES, me, team, STAGE_FULL } from '../data'
import { ConfirmButton, Tip, AutoHeight, SlidePanel, EASE, TextMorph } from '../../shared/motion'
import { Avatar } from '../../shared/ui'
import { BrandLogo } from '../../shared/brands'
import { Seg, Svc, Track, go } from '../ui'
import { brandOf, repOf, caseById, stageIx, DEAL_STAGES, LOST_REASONS, PODS, now, ahead } from './data'
import { relOf, factsFor, isStale, staleDays, stageLabel } from './state'
import { Src, Rel, Val, Facts, CaseChip, ProofUsed, Generated, Decision, DeckViewer, deckFor } from './ui'
import { StageTag } from './pages'

const TAB_OF = { new: 'outreach', brief: 'brief', negotiation: 'proposal', pitch: 'pitch', won: 'handoff', lost: 'lost' }
const TAB_LABEL = { overview: 'Overview', outreach: 'Outreach', brief: 'Brief', proposal: 'Proposal', pitch: 'Pitch', handoff: 'Hand-off', lost: 'Closed lost' }
const when = (d) => new Date(d).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
const dur = (ms) => { const m = Math.max(1, Math.round(ms / 6e4)); const d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60); return d ? `${d}d ${h}h` : h ? `${h}h ${m % 60}m` : `${m}m` }
/** How far a deal got (lost deals keep the tabs they earned). */
const reachOf = (d) => (d.stage === 'lost' ? stageIx(d.lost?.from || 'new') : stageIx(d.stage))

export function DealPage({ id, tab }) {
  const s = useStore(); const st = s.sales
  const d = st.deals.find((x) => x.id === id)
  if (!d) return <div className="d-page"><div className="empty"><b>Not found</b><a className="b sm" href="#/bd/pipeline">Pipeline</a></div></div>
  const r = reachOf(d)
  const tabs = ['overview', 'outreach', r >= 1 && 'brief', r >= 2 && 'proposal', r >= 3 && 'pitch', d.stage === 'won' && 'handoff', d.stage === 'lost' && 'lost'].filter(Boolean)
  const cur = tabs.includes(tab) ? tab : TAB_OF[d.stage]
  const to = (t) => go(`/bd/pipeline/${d.id}/${t}`)
  const move = (stage, why) => { st.moveDeal(d.id, stage, why); to(TAB_OF[stage]) }
  const b = brandOf(d.brand)
  return (
    <div className="d-page wide sl-deal">
      <header className="sl-dh">
        <BrandLogo name={d.brand} size={44} />
        <div className="grow" style={{ minWidth: 0 }}>
          <h1 className="d-h1 keep ell">{d.brand}</h1>
          <div className="row sl-dh-m">
            <StageTag id={d.stage} /><span className="num fw5">{fmt.inr(d.value)}</span>
            <span className="row" style={{ gap: 6 }}><Avatar user={repOf(d.owner)} size={18} />{d.owner === me.id ? 'You' : repOf(d.owner).short}</span>
            <span className="mute m-hide">{d.source}</span>
            {isStale(d) && <span className="chip y"><Hourglass size={12} />Stale · {staleDays(d)}d</span>}
          </div>
        </div>
        <Stepper d={d} />
      </header>

      <div className="tabs sl-tabs" role="tablist">
        <AnimatePresence initial={false}>
          {tabs.map((t) => (
            <motion.button key={t} role="tab" aria-selected={cur === t} className={cur === t ? 'on' : ''} onClick={() => to(t)}
              initial={{ opacity: 0, x: -6, filter: 'blur(2px)' }} animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }} exit={{ opacity: 0 }} transition={{ duration: 0.24, ease: EASE }}>
              {TAB_LABEL[t]}
              {cur === t && <motion.span layoutId="tabs-deal" className="tabs-u" transition={{ type: 'spring', duration: 0.3, bounce: 0 }} />}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      <div className="sl-dgrid">
        <main className="sl-dmain">
          <SlidePanel k={cur} index={tabs.indexOf(cur)}>
            {cur === 'overview' && <Overview d={d} />}
            {cur === 'outreach' && <Outreach d={d} move={move} />}
            {cur === 'brief' && <Brief d={d} move={move} />}
            {cur === 'proposal' && <Proposal d={d} move={move} />}
            {cur === 'pitch' && <Pitch d={d} move={move} />}
            {cur === 'handoff' && <Handoff d={d} />}
            {cur === 'lost' && <Lost d={d} move={move} />}
          </SlidePanel>
        </main>
        <aside className="sl-dside">
          <Side d={d} b={b} />
        </aside>
      </div>
    </div>
  )
}

function Stepper({ d }) {
  const ix = d.stage === 'lost' ? -1 : stageIx(d.stage)
  return (
    <div className={'sl-step' + (d.stage === 'lost' ? ' lost' : '')} aria-label={'Stage ' + stageLabel(d.stage)}>
      {DEAL_STAGES.slice(0, 5).map((s, i) => (
        <Tip key={s.id} label={s.n + ' · ' + s.label}><span className={'sl-step-i' + (i < ix ? ' done' : i === ix ? ' cur' : '')}>{i < ix ? <Check size={10} strokeWidth={3} /> : s.n}</span></Tip>
      ))}
    </div>
  )
}

/* ───────── Side: relationship, warm intros, reminders, history ───────── */
function Side({ d, b }) {
  const s = useStore(); const st = s.sales
  const rel = relOf(d.brand, st)
  const [rem, setRem] = useState('')
  const moved = b?.people.find((p) => p.moved)
  const first = d.contact?.name?.split(' ')[0] || 'them'
  const paths = [
    moved && { id: 'p0', via: moved, text: `${moved.name} worked with us at ${moved.moved}`, strong: true },
    { id: 'p1', via: team[(d.brand.length + 3) % 10 || 3], text: `knows ${first} from ${['an IIM batch', 'Goafest juries', 'a past agency', 'a D2C founders group'][d.brand.length % 4]}` },
    { id: 'p2', via: team[(d.brand.length + 6) % 9 + 1], text: `2nd-degree · follows ${first}` },
  ].filter(Boolean).filter((p) => !p.via.me)
  const asked = d.intros || []
  const ask = (p) => { st.patchDeal(d.id, (x) => ({ intros: [...(x.intros || []), p.id], history: [...x.history, { at: now(), text: 'Asked ' + (p.via.short || p.via.name.split(' ')[0]) + ' for an intro', kind: 'intro', by: me.id }] })); toast('Intro request sent', { description: 'via ' + (p.via.name) + ' · LinkedIn' }) }
  const addRem = (days) => { if (!rem.trim()) return; st.patchDeal(d.id, (x) => ({ reminders: [...x.reminders, { id: 'r' + Date.now(), text: rem.trim(), at: ahead(days), done: false }] })); setRem(''); toast('Reminder set', { description: 'Google Calendar · ' + when(ahead(days)) }) }
  return (
    <>
      <section className="sl-sec">
        <div className="sl-sec-h">Relationship</div>
        <div className="row" style={{ flexWrap: 'wrap' }}><Rel rel={rel} />{rel.note && <span className="mute xs">{rel.note}</span>}</div>
        {d.contact ? (
          <div className="sl-contact">
            <Avatar user={{ name: d.contact.name, hue: d.contact.name.length * 37 }} size={28} />
            <div className="grow" style={{ minWidth: 0 }}><div className="ell" style={{ fontWeight: 500 }}>{d.contact.name}</div><div className="mute xs ell">{d.contact.title || 'Title unknown'}</div><div className="mono xs fg2 ell">{d.contact.email || <span className="sl-unk">Email unknown</span>}</div></div>
          </div>
        ) : <div className="mute xs" style={{ marginTop: 8 }}>No contact yet · <a className="sl-lnk" href={'#/bd/discover/' + (b?.id || '')}>Find people</a></div>}
      </section>
      <section className="sl-sec">
        <div className="sl-sec-h">Warm intros <Src s="LinkedIn" /></div>
        {paths.map((p) => (
          <div key={p.id} className="sl-path">
            <Avatar user={p.via.hue != null ? p.via : { name: p.via.name, hue: 60 }} size={22} />
            <div className="grow xs" style={{ minWidth: 0 }}><b style={{ fontWeight: 500 }}>{p.via.short || p.via.name}</b> <span className="fg2">{p.text}</span></div>
            {asked.includes(p.id) ? <span className="chip"><Check size={11} />Asked</span> : <button className="b sm" onClick={() => ask(p)}>Ask</button>}
          </div>
        ))}
      </section>
      <section className="sl-sec">
        <div className="sl-sec-h">Reminders <Src s="Google Calendar" /></div>
        {d.reminders.map((r) => (
          <label key={r.id} className={'sl-rem' + (r.done ? ' done' : '')}>
            <input type="checkbox" checked={r.done} onChange={() => st.patchDeal(d.id, (x) => ({ reminders: x.reminders.map((y) => (y.id === r.id ? { ...y, done: !y.done } : y)) }), true)} />
            <span className="grow ell">{r.text}</span><span className="mute xs">{fmt.ago(r.at)}</span>
          </label>
        ))}
        <div className="inp" style={{ marginTop: 6 }}><Clock size={13} /><input value={rem} onChange={(e) => setRem(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addRem(1) }} placeholder="Remind me to…" /></div>
        <AutoHeight>{rem.trim() && <div className="row" style={{ gap: 4, paddingTop: 6 }}>{[['Tomorrow', 1], ['In 3 days', 3], ['Next week', 7]].map(([l, n]) => <button key={l} className="chip sl-tog" onClick={() => addRem(n)}>{l}</button>)}</div>}</AutoHeight>
      </section>
      <section className="sl-sec">
        <div className="sl-sec-h">History <span className="mute num">{d.history.length}</span></div>
        <ol className="sl-hist">
          {[...d.history].reverse().map((h, i) => (
            <li key={i} className={'k-' + h.kind}><i /><span className="grow">{h.text}{h.by && h.by !== me.id && <span className="mute"> · {repOf(h.by).short}</span>}</span><span className="mute xs">{fmt.agoShort(h.at)}</span></li>
          ))}
        </ol>
      </section>
    </>
  )
}

/* ───────── Overview ───────── */
function Overview({ d }) {
  const s = useStore(); const st = s.sales
  const [next, setNext] = useState(d.next)
  useEffect(() => setNext(d.next), [d.next])
  return (
    <>
      {d.stage !== 'won' && d.stage !== 'lost' && (
        <div className="sl-nextb">
          <span className="mute xs">Next step</span>
          <input value={next} onChange={(e) => setNext(e.target.value)} onBlur={() => next !== d.next && st.patchDeal(d.id, { next })} aria-label="Next step" />
          {d.due && <span className="chip"><CalendarDays size={12} />{fmt.ago(d.due)}</span>}
        </div>
      )}
      <div className="sl-h3">What we know <Src s="AI" /></div>
      <Facts facts={factsFor(d.brand, st).filter((f) => f.k !== 'Pipeline')} />
      <div style={{ marginTop: 14 }}><ProofUsed ids={d.proof} /></div>
    </>
  )
}

/* ───────── Stage 1 · Outreach ───────── */
function draft(d, v) {
  const first = d.contact?.name?.split(' ')[0] || 'there'
  const proof = d.proof.map(caseById).filter(Boolean)
  const b = brandOf(d.brand)
  const open = [
    `Saw the news at ${d.brand}. Congratulations. Launch windows like this are where memes and creators move fastest.`,
    `${d.brand} has a voice the internet already likes. We think it can travel a lot further on meme pages.`,
    `Quick one: we have an idea for ${d.brand}'s next push that we'd love 20 minutes to walk you through.`,
  ][v % 3]
  const lines = proof.map((c) => `· ${c.client}, ${c.title.toLowerCase()}: ${c.result.charAt(0).toLowerCase() + c.result.slice(1)}.`)
  return {
    subject: [`${d.brand} × WLDD`, `An idea for ${d.brand}`, `20 minutes, one idea for ${d.brand}`][v % 3],
    body: `Hi ${first},\n\n${open}\n\nA couple of things we've done${b ? ' for ' + b.cat.toLowerCase() + ' and nearby' : ''}:\n${lines.join('\n')}\n\nWould a call this week work?\n\n${repOf(d.owner).short}\nWLDD`,
  }
}
function Outreach({ d, move }) {
  const s = useStore(); const st = s.sales
  const o = d.outreach
  const [v, setV] = useState(0)
  const [m, setM] = useState(() => draft(d, 0))
  const [busy, setBusy] = useState(false)
  const redraft = () => { setBusy(true); setTimeout(() => { setM(draft(d, v + 1)); setV(v + 1); setBusy(false) }, 500) }
  const send = () => {
    st.patchDeal(d.id, (x) => ({ outreach: { subject: m.subject, body: m.body, sentAt: now(), reply: null, callBooked: false }, next: 'Wait for a reply', history: [...x.history, { at: now(), text: 'Intro email sent from Gmail', kind: 'mail', by: me.id }] }))
    toast('Sent from your Gmail', { description: 'To ' + (d.contact?.email || d.brand) })
    st.simulateReply(d.id)
  }
  const book = () => {
    const at = ahead(2, 0.5)
    st.patchDeal(d.id, (x) => ({ outreach: { ...x.outreach, callBooked: true }, call: { at, done: false }, next: 'Prepare for the call', due: at, reminders: [...x.reminders, { id: 'r' + Date.now(), text: 'Discovery call · ' + (d.contact?.name || d.brand), at, done: false }], history: [...x.history, { at: now(), text: 'Call booked for ' + when(at), kind: 'call', by: me.id }] }))
    toast('Call booked', { description: when(at) + ' · Google Calendar' })
  }
  const remind = (days, text) => { st.patchDeal(d.id, (x) => ({ reminders: [...x.reminders, { id: 'r' + Date.now(), text, at: ahead(days), done: false }], next: text, due: ahead(days) })); toast('Reminder set', { description: text + ' · ' + when(ahead(days)) }) }
  const sent = o?.sentAt
  const body = o?.body || draft(d, 0).body
  return (
    <>
      <div className="sl-h3">Intro email <Src s="AI · Case Library" /></div>
      {!sent ? (
        <div className="card sl-mail">
          <div className="sl-mail-r"><span className="mute">To</span>{d.contact ? <span>{d.contact.name} <span className="mono fg2">{d.contact.email}</span></span> : <span className="sl-unk">No contact · add one on the left</span>}</div>
          <div className="sl-mail-r"><span className="mute">Subject</span><input value={m.subject} onChange={(e) => setM({ ...m, subject: e.target.value })} aria-label="Subject" /></div>
          <textarea className={'sl-mail-b' + (busy ? ' busy' : '')} rows={11} value={m.body} onChange={(e) => setM({ ...m, body: e.target.value })} aria-label="Email body" />
          <ProofUsed ids={d.proof} />
          <div className="row sl-mail-a">
            <button className="b sm ghost" onClick={redraft} disabled={busy}><Wand2 size={13} />{busy ? 'Redrafting…' : 'Redraft'}</button>
            <span className="grow" />
            <Src s="Gmail" />
            <ConfirmButton className="b ink" label="Send from Gmail" doneLabel="Sent" icon={<Send size={14} />} onDone={send} />
          </div>
        </div>
      ) : (
        <div className="card sl-mail sent">
          <div className="row"><Mail size={14} className="mute" /><b className="grow ell">{o.subject}</b><span className="mute xs">Sent {fmt.ago(o.sentAt)}</span><Src s="Gmail" /></div>
          <pre className="sl-mail-pre">{body}</pre>
        </div>
      )}

      <AutoHeight>
        {sent && !o.reply && <div className="sl-wait"><span className="sl-think"><i /><i /><i /></span>Watching for a reply<Src s="Gmail" /></div>}
        {o?.reply && (
          <div style={{ paddingTop: 12 }}><div className="sl-reply">
            <div className="row"><Reply size={14} className="mute" /><b>{o.reply.from}</b><span className="mute xs">{fmt.ago(o.reply.at)}</span><span className="grow" /><Src s="Gmail" /></div>
            <p>{o.reply.text}</p>
            <div className="sl-sugg">
              <div className="grow"><div className="mute xs row">Suggested next step <Src s="Gmail · AI" /></div><div style={{ marginTop: 3, fontWeight: 500 }}>{o.reply.next}</div></div>
              {o.callBooked ? <span className="chip g"><Check size={12} />Call booked</span> : <ConfirmButton className="b sm ink" label="Book call" doneLabel="Booked" icon={<CalendarDays size={13} />} onDone={book} />}
            </div>
          </div></div>
        )}
      </AutoHeight>

      {d.stage === 'new' ? (
        <Decision q="Client interested and call booked?" yes="Yes, move to Brief" onYes={() => move('brief', 'Call booked · moved to Brief')}
          nudge={{ text: 'Not yet? Follow up later before closing.', label: 'Remind me in 3 days' }} onNudge={() => remind(3, 'Follow up with ' + (d.contact?.name || d.brand))}
          onLost={() => move('lost', 'Closed lost at New lead')} />
      ) : <Passed text="Call booked · moved to Brief" />}
    </>
  )
}
const Passed = ({ text }) => <div className="sl-passed"><Check size={13} />{text}</div>

/* ───────── Call (Google Meet) + notes (Gemini), used by Brief and Pitch ───────── */
function Call({ d, call, label, notes, onSchedule, onDone, onNotes, notesBody }) {
  const [slot, setSlot] = useState(0)
  const slots = [ahead(1, 0.5), ahead(2, 4.5), ahead(3, 2)]
  return (
    <>
      <div className="sl-h3">{label} <Src s="Google Meet" /></div>
      {!call ? (
        <div className="sl-slots">
          {slots.map((t, i) => <button key={i} className={'chip sl-tog' + (slot === i ? ' on' : '')} aria-pressed={slot === i} onClick={() => setSlot(i)}>{when(t)}</button>)}
          <span className="grow" />
          <ConfirmButton className="b sm ink" label="Schedule" doneLabel="Scheduled" icon={<Video size={13} />} onDone={() => onSchedule(slots[slot])} />
        </div>
      ) : (
        <div className="sl-callrow">
          <Video size={15} className="mute" />
          <div className="grow"><div style={{ fontWeight: 500 }}>{when(call.at)}</div><div className="mute xs">{d.contact?.name || d.brand} · Google Meet</div></div>
          {!call.done && <button className="b sm ghost" onClick={() => { try { navigator.clipboard?.writeText('Meet link for ' + d.brand) } catch {} toast('Meet link copied') }}><Copy size={13} />Link</button>}
          {call.done ? <span className="chip g"><Check size={12} />Done</span> : <ConfirmButton className="b sm" label="Mark done" doneLabel="Done" icon={<Check size={13} />} onDone={onDone} />}
        </div>
      )}
      <AutoHeight>
        {call?.done && (
          <div style={{ paddingTop: 14 }}>
            <div className="sl-h3">Call notes <Src s="Gemini" /></div>
            <Generated done={notes} onDone={onNotes} label="Get call notes" icon={NotebookPen} src="Gemini"
              steps={[{ label: 'Pull the recording', src: 'Google Meet' }, { label: 'Transcribe and summarise', src: 'Gemini' }]}>
              {notesBody}
            </Generated>
          </div>
        )}
      </AutoHeight>
    </>
  )
}
const NoteBlock = ({ rows }) => <dl className="sl-notes">{rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>

/* ───────── Stage 2 · Brief ───────── */
const OBJ = {
  default: ['“We already have an agency.” Show the meme-page layer they don’t buy today.', '“Memes feel off-brand.” Walk through brand-safety review and approvals.', '“How do we measure it?” Weekly reads; saves and shares, not likes.'],
}
function Brief({ d, move }) {
  const s = useStore(); const st = s.sales
  const b = brandOf(d.brand)
  const [scope, setScope] = useState(null)
  const proof = d.proof.map(caseById).filter(Boolean)
  const other = b?.people.find((p) => p.name !== d.contact?.name)
  const notes = [['Summary', `${d.contact?.name?.split(' ')[0] || 'They'} wants ${d.brand} to show up where young India scrolls, without feeling like an ad.`], ['Needs', 'Reach in metros in launch week; a reactive layer after.'], ['Budget', `Around ${fmt.inr(d.value)}, flexible for proof.`], ['Timeline', 'Brief in 2 weeks, live in 6.'], ['Next steps', 'Send scope; proposal by Friday.']]
  const remind = () => { st.patchDeal(d.id, (x) => ({ reminders: [...x.reminders, { id: 'r' + Date.now(), text: 'Follow-up call · ' + d.brand, at: ahead(4), done: false }] })); toast('Follow-up call on your calendar', { description: when(ahead(4)) }) }
  return (
    <>
      <div className="sl-h3">Pre-call brief <Src s="AI" /></div>
      <Generated done={!!d.brief} onDone={() => st.patchDeal(d.id, { brief: true }, true)} label="Write the pre-call brief" src="AI"
        steps={[{ label: 'Read ' + d.brand, src: 'Apollo' }, { label: 'Scan the news', src: 'Signals engine' }, { label: 'Check past emails', src: 'Gmail' }, { label: 'Write the brief', src: 'AI' }]}>
        <div className="sl-brief">
          <div><dt>Brand <Src s="Apollo" /></dt><dd>{b?.about || <span className="sl-unk">Unknown</span>} {b && <span className="mute">{b.cat} · {b.hq} · revenue <Val v={b.rev && fmt.inr(b.rev)} /></span>}</dd></div>
          <div><dt>Competitors <Src s="AI · Apollo" /></dt><dd className="row" style={{ flexWrap: 'wrap', gap: 6 }}>{(b?.competitors || []).map((c) => <span key={c} className="chip"><BrandLogo name={c} size={14} radius={4} />{c}</span>)}{!b && <span className="sl-unk">Unknown</span>}</dd></div>
          <div><dt>Our angle <Src s="AI · Case Library" /></dt><dd>Lead with {proof.map((c) => c.client).join(' and ')}: {proof[0]?.result.toLowerCase()}.<div className="sl-proofs" style={{ marginTop: 6 }}>{proof.map((c) => <CaseChip key={c.id} c={c} />)}</div></dd></div>
          <div><dt>Likely objections <Src s="AI" /></dt><dd><ul>{OBJ.default.map((x) => <li key={x}>{x}</li>)}</ul></dd></div>
          <div><dt>Who you’re meeting <Src s="LinkedIn" /></dt><dd>{[d.contact, other].filter(Boolean).map((p) => <div key={p.name} className="row" style={{ marginBottom: 4 }}><Avatar user={{ name: p.name, hue: p.name.length * 37 }} size={20} /><b style={{ fontWeight: 500 }}>{p.name}</b><span className="mute">{p.title}</span></div>)}</dd></div>
        </div>
      </Generated>

      <div style={{ marginTop: 22 }}>
        <Call d={d} call={d.call} label="Discovery call" notes={!!d.notes}
          onSchedule={(at) => st.patchDeal(d.id, (x) => ({ call: { at, done: false }, next: 'Run the discovery call', due: at, reminders: [...x.reminders, { id: 'r' + Date.now(), text: 'Discovery call', at, done: false }], history: [...x.history, { at: now(), text: 'Discovery call scheduled · Google Meet', kind: 'call', by: me.id }] }))}
          onDone={() => st.patchDeal(d.id, (x) => ({ call: { ...x.call, at: now(), done: true }, history: [...x.history, { at: now(), text: 'Discovery call done', kind: 'call', by: me.id }] }))}
          onNotes={() => st.patchDeal(d.id, { notes: true }, true)} notesBody={<NoteBlock rows={notes} />} />
      </div>

      {d.stage === 'brief' ? (
        <>
          <Decision q="Need understood and scope agreed?" yes="Yes, agree scope" onYes={() => setScope({ need: 'Reach in metros in launch week, reactive layer after', services: d.services, value: String(d.value / 1e5), timeline: 'Live in 6 weeks' })}
            nudge={{ text: 'Not yet? Keep working before closing.', label: 'Book a follow-up call' }} onNudge={remind} onLost={() => move('lost', 'Closed lost at Brief')} />
          <AutoHeight>
            {scope && (
              <div style={{ paddingTop: 12 }}><div className="card sl-scope">
                <div className="row"><b className="grow">Scope</b><span className="sl-pre" style={{ margin: 0 }}><Wand2 size={12} />Pre-filled from the brief and call notes</span></div>
                <label className="sl-f"><span>Need</span><div className="inp"><input value={scope.need} onChange={(e) => setScope({ ...scope, need: e.target.value })} /></div></label>
                <div className="sl-grid2">
                  <label className="sl-f"><span>Budget, ₹ lakh</span><div className="inp"><input value={scope.value} onChange={(e) => setScope({ ...scope, value: e.target.value })} /></div></label>
                  <label className="sl-f"><span>Timeline</span><div className="inp"><input value={scope.timeline} onChange={(e) => setScope({ ...scope, timeline: e.target.value })} /></div></label>
                </div>
                <div className="sl-f"><span>Services</span><div className="sl-chips">{['amp', 'memd', 'inf', 'solo', 'tt', 'cc'].map((k) => { const on = scope.services.includes(k); return <button key={k} className={'chip sl-tog' + (on ? ' on' : '')} aria-pressed={on} onClick={() => setScope({ ...scope, services: on ? scope.services.filter((x) => x !== k) : [...scope.services, k] })}>{SERVICES[k].label}</button> })}</div></div>
                <div className="row" style={{ justifyContent: 'flex-end', marginTop: 12 }}>
                  <button className="b" onClick={() => setScope(null)}>Cancel</button>
                  <ConfirmButton className="b ink" label="Move to Negotiation" doneLabel="Moved" icon={<Check size={14} />} onDone={() => { st.patchDeal(d.id, { scope: { need: scope.need, services: scope.services, budget: +scope.value * 1e5, timeline: scope.timeline }, value: Math.round(+scope.value * 1e5) || d.value, services: scope.services.length ? scope.services : d.services }); move('negotiation', 'Scope agreed · moved to Negotiation') }} />
                </div>
              </div></div>
            )}
          </AutoHeight>
        </>
      ) : <Passed text="Scope agreed · moved to Negotiation" />}
    </>
  )
}

/* ───────── Stage 3 · Proposal ───────── */
const REVISE = [['Lower cost', -0.12], ['More creators', 0.1], ['Shorter timeline', 0], ['Swap in memes', 0.04]]
const PSTATUS = [{ value: 'sent', label: 'Sent' }, { value: 'revising', label: 'Revising' }, { value: 'hold', label: 'On hold' }, { value: 'procurement', label: 'Procurement' }]
function Proposal({ d, move }) {
  const s = useStore(); const st = s.sales
  const p = d.proposal
  const [ver, setVer] = useState(null)
  const [rev, setRev] = useState(false)
  const b = brandOf(d.brand)
  const proof = d.proof.map(caseById).filter(Boolean)
  const vs = p?.versions || []
  const cur = vs.find((x) => x.v === ver) || vs[vs.length - 1]
  const value = cur?.value || d.value
  const revise = ([note, k]) => {
    const v = vs.length + 1
    st.patchDeal(d.id, (x) => ({ proposal: { ...x.proposal, status: 'revising', versions: [...x.proposal.versions, { v, at: now(), note, value: Math.round((value * (1 + k)) / 1e5) * 1e5 }] }, history: [...x.history, { at: now(), text: `Proposal v${v} · ${note.toLowerCase()}`, kind: 'note', by: me.id }] }))
    setVer(v); setRev(false)
  }
  const send = () => st.patchDeal(d.id, (x) => ({ value, proposal: { ...x.proposal, status: 'sent', sentAt: now(), sentWall: x.proposal.sentWall || Date.now() }, next: 'Wait for feedback', history: [...x.history, { at: now(), text: `Proposal v${cur.v} sent from Gmail`, kind: 'mail', by: me.id }] }))
  const turnaround = p?.turnaround ? p.turnaround * 36e5 : p?.wall ? (p.sentWall || Date.now()) - p.wall : 0 // seeded hours, or real time spent in this session
  return (
    <>
      <div className="sl-h3">Client proposal <Src s="AI · Case Library" /></div>
      <Generated done={!!p} label="Draft the proposal" src="AI · Case Library"
        onDone={() => st.patchDeal(d.id, (x) => ({ proposal: { versions: [{ v: 1, at: now(), note: 'First draft', value: x.value }], status: 'draft', sentAt: null, wall: Date.now() }, history: [...x.history, { at: now(), text: 'Proposal v1 drafted', kind: 'note', by: me.id }] }))}
        steps={[{ label: 'Read the brief and call notes', src: 'Gemini' }, { label: 'Pick the strongest proof', src: 'Case Library' }, { label: 'Price the deliverables', src: 'AI' }, { label: 'Write it up', src: 'AI' }]}>
        {p && (
          <>
            <div className="sl-prop-bar">
              <Seg id={'pv' + d.id} value={cur.v} onChange={setVer} options={vs.map((x) => ({ value: x.v, label: 'v' + x.v }))} />
              {p.status === 'draft' ? <span className="chip">Draft</span> : <Seg id={'ps' + d.id} value={p.status} onChange={(v) => st.patchDeal(d.id, (x) => ({ proposal: { ...x.proposal, status: v }, history: [...x.history, { at: now(), text: 'Proposal ' + PSTATUS.find((y) => y.value === v).label.toLowerCase(), kind: 'note', by: me.id }] }))} options={PSTATUS} />}
              <span className="grow" />
              <Tip label="Draft to sent"><span className="chip"><Clock size={12} />{p.sentAt ? 'Turnaround ' : 'Running '}{dur(turnaround)}</span></Tip>
            </div>
            <article className="sl-doc">
              {cur.v > 1 && <div className="sl-pre" style={{ marginTop: 0 }}><RotateCcw size={12} />v{cur.v} · {cur.note}</div>}
              <section><h4>Why now</h4><p>{d.brand} is in a launch window and {b?.competitors?.[0] || 'competitors'} {b ? 'is' : 'are'} quiet on meme pages. <Src s="Signals engine" /></p></section>
              <section><h4>The idea</h4><p>{d.scope?.need || 'Reach in metros in launch week'}: meme pages set the joke, creators carry it, paid amplification spreads what works. <Src s="AI" /></p></section>
              <section><h4>Deliverables</h4>
                <div className="sl-rows">{d.services.map((k, i) => <div key={k}><span>{SERVICES[k].label}</span><span className="mute">{[30, 12, 8, 4][i % 4]} {k === 'inf' || k === 'solo' ? 'creators' : k === 'tt' ? 'trend days' : 'pages'}</span><b className="num">{fmt.inr(Math.round((value * [0.45, 0.3, 0.15, 0.1][i % 4]) / 1e5) * 1e5)}</b></div>)}</div>
              </section>
              <section><h4>Proof <Src s="Case Library" /></h4><div className="sl-proofs">{proof.map((c) => <CaseChip key={c.id} c={c} />)}</div><p className="fg2" style={{ marginTop: 6 }}>{proof.map((c) => c.result).join('. ')}.</p></section>
              <section className="sl-inv"><h4>Investment</h4><b className="num">{fmt.inr(value)}</b><span className="mute">+ GST · {d.scope?.timeline || 'live in 6 weeks'}</span></section>
            </article>
            <AutoHeight>{rev && <div className="sl-chips" style={{ paddingTop: 10 }}>{REVISE.map((r) => <button key={r[0]} className="chip sl-tog" onClick={() => revise(r)}>{r[0]}</button>)}</div>}</AutoHeight>
            <div className="row sl-mail-a">
              <button className={'b sm' + (rev ? ' on' : '')} onClick={() => setRev((v) => !v)}><Plus size={13} />New version</button>
              <span className="grow" />
              {p.sentAt && p.status === 'sent' ? <span className="mute xs">v{vs[vs.length - 1].v} sent {fmt.ago(p.sentAt)}</span> : null}
              <Src s="Gmail" />
              <ConfirmButton className="b ink" label={'Send v' + cur.v} doneLabel="Sent" icon={<Send size={14} />} onDone={send} />
            </div>
          </>
        )}
      </Generated>

      {d.stage === 'negotiation' ? (
        <Decision q="Client interested in the proposal?" yes="Yes, pitch call booked" yesDisabled={!p}
          onYes={() => { st.patchDeal(d.id, (x) => ({ reminders: [...x.reminders, { id: 'r' + Date.now(), text: 'Pitch call · ' + d.brand, at: ahead(3), done: false }] })); move('pitch', 'Pitch call booked · moved to Pitch') }}
          nudge={{ text: 'Not convinced? Revise first.', label: 'Start a new version' }} onNudge={() => setRev(true)} onLost={() => move('lost', 'Closed lost at Negotiation')} />
      ) : <Passed text="Proposal accepted · moved to Pitch" />}
    </>
  )
}

/* ───────── Stage 4 · Pitch ───────── */
const CITE_SRC = (c) => (c.startsWith('Case Library') ? 'Case Library' : c.startsWith('Gemini') ? 'Gemini' : c.startsWith('Signals') ? 'Signals engine' : c.startsWith('Proposal') ? 'DMS' : 'AI')
function Pitch({ d, move }) {
  const s = useStore(); const st = s.sales
  const pt = d.pitch || {}
  const deck = deckFor(d)
  deck.slides = deck.slides.map((sl, i) => (pt.edits?.[i] ? { ...sl, title: pt.edits[i] } : sl))
  const set = (patch, text) => st.patchDeal(d.id, (x) => ({ pitch: { ...(x.pitch || {}), ...patch }, ...(text ? { history: [...x.history, { at: now(), text, kind: 'note', by: me.id }] } : null) }))
  const share = (how) => { set({ shared: how }, 'Deck shared as ' + (how === 'pdf' ? 'PDF' : 'link')) }
  return (
    <>
      <div className="sl-h3">Pitch deck <Src s="AI · Case Library" /></div>
      <Generated done={!!pt.deck} label="Generate the pitch deck" icon={Presentation} src="AI · Case Library" onDone={() => set({ deck: true, edits: {} }, 'Pitch deck generated')}
        steps={[{ label: 'Research ' + d.brand, src: 'AI' }, { label: 'Find the best past WLDD pitches', src: 'Case Library' }, { label: 'Write the pitch plan, every claim cited', src: 'AI' }, { label: `Build the deck in ${d.brand}’s look`, src: 'AI' }]}>
        <div className="sl-plan">
          <div className="mute xs" style={{ marginBottom: 6 }}>Pitch plan</div>
          <ol>{deck.plan.map((c, i) => <li key={i}><span className="grow">{c.text}</span>{c.id ? <CaseChip c={caseById(c.id)} /> : <Src s={CITE_SRC(c.cite)} />}</li>)}</ol>
        </div>
        <DeckViewer deck={deck} file={`${d.brand} × WLDD`} onEdit={(i, t) => set({ edits: { ...(pt.edits || {}), [i]: t } })} onShare={share} onPresent={() => !pt.presented && set({ presented: true }, 'Deck presented')} />
      </Generated>

      <div style={{ marginTop: 22 }}>
        <Call d={d} call={pt.call} label="Pitch call" notes={!!pt.notes}
          onSchedule={(at) => { set({ call: { at, done: false } }, 'Pitch call scheduled · Google Meet'); st.patchDeal(d.id, (x) => ({ next: 'Present the deck', due: at, reminders: [...x.reminders, { id: 'r' + Date.now(), text: 'Pitch call', at, done: false }] })) }}
          onDone={() => set({ call: { ...(pt.call || {}), at: now(), done: true } }, 'Pitch call done')} onNotes={() => set({ notes: true })}
          notesBody={<NoteBlock rows={[['Reaction', 'Loved the idea slide; asked to keep the Zepto-style tone.'], ['Concerns', 'Wants weekly reporting and a brand-safety check.'], ['Decision', `${d.contact?.name?.split(' ')[0] || 'Client'} to confirm with finance this week.`]]} />} />
      </div>

      {(pt.presented || pt.call?.done) && (
        <div className="sl-share">
          <span className="grow">Share after the call</span>
          {pt.shared ? <span className="chip g"><Check size={12} />Shared as {pt.shared === 'pdf' ? 'PDF' : 'link'}</span> : null}
          <button className="b sm" onClick={() => { toast('Link copied', { description: d.brand + ' can view the deck' }); share('link') }}><Link2 size={13} />Link</button>
          <button className="b sm" onClick={() => { toast.success('PDF ready', { description: d.brand + ' × WLDD.pdf' }); share('pdf') }}><Download size={13} />PDF</button>
          <Src s="Gmail" />
        </div>
      )}

      {d.stage === 'pitch' ? (
        <Decision q="Did the client sign?" yes="Yes, signed" onYes={() => move('won', 'Signed · won')}
          nudge={{ text: 'Not yet? Follow up on the deck first.', label: 'Remind me in 2 days' }}
          onNudge={() => { st.patchDeal(d.id, (x) => ({ reminders: [...x.reminders, { id: 'r' + Date.now(), text: 'Follow up on the deck', at: ahead(2), done: false }] })); toast('Reminder set', { description: when(ahead(2)) }) }}
          onLost={() => move('lost', 'Closed lost at Pitch')} />
      ) : d.stage === 'won' ? <Passed text="Signed · won" /> : null}
    </>
  )
}

/* ───────── Stage 5 · Hand-off ───────── */
function Handoff({ d }) {
  const s = useStore(); const st = s.sales
  const w = d.won || { value: d.value, services: d.services, pod: null }
  const [val, setVal] = useState(String(w.value / 1e5))
  const [svc, setSvc] = useState(w.services)
  const [pod, setPod] = useState(w.pod || 'Kulfi')
  const [note, setNote] = useState(w.note || '')
  const camp = w.campaignId && s.campaigns.find((c) => c.id === w.campaignId)
  const acct = st.accounts.find((a) => a.brand.toLowerCase() === d.brand.toLowerCase())
  const handoff = () => {
    const value = Math.round(+val * 1e5) || d.value
    const cid = 'c' + (200 + Math.floor(Math.random() * 700))
    s.setCampaigns((l) => [{
      ...l[0], id: cid, code: 'WL-' + (2500 + l.length), client: d.brand, clientId: null, industry: 'Others', activity: 'Launch', name: `${d.brand} × Launch`, pod, lead: team[{ Kulfi: 2, Neon: 3, Masala: 4 }[pod]],
      stage: 0, services: svc, budget: value, planCost: Math.round(value * 0.65), internal: Math.round(value * 0.47), live: 0, views: 0, deliverables: 40,
      planApproved: false, pinned: false, flags: { agreement: false, po: false, invoice: false, payment: false }, tally: 'none', tallyKey: null, updated: new Date(), start: new Date(), brief: d.scope?.need || 'Brief from Sales hand-off.',
    }, ...l])
    st.set((x) => ({
      deals: x.deals.map((y) => (y.id === d.id ? { ...y, value, services: svc, updated: now(), next: '', won: { value, services: svc, pod, campaignId: cid, note }, history: [...y.history, { at: now(), text: `Handed to ${pod} with the pitch deck`, kind: 'won', by: me.id }] } : y)),
      accounts: x.accounts.some((a) => a.brand.toLowerCase() === d.brand.toLowerCase()) ? x.accounts : [{ id: d.brand.toLowerCase().replace(/[^a-z0-9]+/g, '-'), brand: d.brand, owner: d.owner, spend: value, prev: 0, services: svc, last: now(), renewal: ahead(365), alerts: [], opps: [], since: 2026, fresh: true }, ...x.accounts],
    }))
    st.notify({ kind: 'deal', text: `${d.brand} handed to ${pod}`, ctx: fmt.inr(value) + ' · now an account', to: '/bd/accounts' })
    toast.success(`Handed to ${pod}`, { description: `${d.brand} × Launch is in Pod`, action: { label: 'Open', onClick: () => go('/pod/campaigns/' + cid) } })
  }
  const bump = () => { if (!camp || camp.stage >= 6) return; s.patchCampaign(camp.id, { stage: camp.stage + 1, updated: new Date() }); toast(`${pod} moved it to ${camp.stage + 1 === 6 ? 'Complete' : STAGE_FULL[camp.stage + 1]}`) }
  if (!w.campaignId) return (
    <>
      <div className="sl-h3">Record the win</div>
      <div className="card sl-scope">
        <div className="sl-grid2">
          <label className="sl-f"><span>Final value, ₹ lakh</span><div className="inp"><input inputMode="decimal" value={val} onChange={(e) => setVal(e.target.value)} /></div></label>
          <div className="sl-f"><span>Delivery pod</span><Seg id={'pod' + d.id} value={pod} onChange={setPod} options={PODS.map((p) => ({ value: p, label: p }))} /></div>
        </div>
        <div className="sl-f"><span>Services</span><div className="sl-chips">{Object.keys(SERVICES).map((k) => { const on = svc.includes(k); return <button key={k} className={'chip sl-tog' + (on ? ' on' : '')} aria-pressed={on} onClick={() => setSvc(on ? svc.filter((x) => x !== k) : [...svc, k])}>{SERVICES[k].label}</button> })}</div></div>
        <div className="sl-f"><span>Goes with it</span><div className="row" style={{ flexWrap: 'wrap', gap: 6 }}>{d.pitch?.deck ? <span className="chip"><Presentation size={12} />Pitch deck</span> : <span className="chip mute">No deck</span>}{d.proposal && <span className="chip"><FileText size={12} />Proposal v{d.proposal.versions.length}</span>}{d.notes && <span className="chip"><NotebookPen size={12} />Call notes</span>}</div></div>
        <div className="row" style={{ justifyContent: 'flex-end', marginTop: 14 }}>
          <ConfirmButton className="b ink" label={'Hand off to ' + pod} doneLabel="Handed off" icon={<PartyPopper size={14} />} onDone={handoff} />
        </div>
      </div>
    </>
  )
  return (
    <>
      <motion.div className="sl-end" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.28, ease: EASE }}>
        <PartyPopper size={18} />
        <div className="grow">Campaign runs with <b>{w.pod}</b>. {d.brand} is now an <a className="sl-lnk" href={'#/bd/accounts/' + (acct?.id || '')}>Account</a> for future upsell.</div>
      </motion.div>
      <div className="sl-h3">Campaign status</div>
      {camp ? (
        <div className="sl-callrow">
          <span className="sl-pod">{w.pod[0]}</span>
          <div className="grow"><div style={{ fontWeight: 500 }}>{camp.name}</div><div className="mute xs">{camp.code} · {camp.stage === 6 ? 'Complete' : STAGE_FULL[camp.stage]}</div></div>
          <Track stage={camp.stage} />
          <Tip label="Check with the pod"><button className="b sm icon" onClick={bump} aria-label="Refresh status"><RefreshCw size={13} /></button></Tip>
          <a className="b sm" href={'#/pod/campaigns/' + camp.id}>Open<ArrowUpRight size={13} /></a>
        </div>
      ) : <div className="mute">Campaign not found</div>}
      <div className="kv-grid" style={{ marginTop: 16 }}>
        <div><span>Final value</span><span className="num">{fmt.inr(w.value)}</span></div>
        <div><span>Pod</span><span>{w.pod}</span></div>
        <div><span>Services</span><Svc list={w.services} /></div>
        <div><span>Deck</span><span>{d.pitch?.deck ? 'Attached' : '—'}</span></div>
      </div>
      <div className="sl-h3" style={{ marginTop: 20 }}>Relationship note</div>
      <div className="inp sl-ta"><textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} onBlur={() => note !== (w.note || '') && st.patchDeal(d.id, (x) => ({ won: { ...x.won, note }, history: [...x.history, { at: now(), text: 'Relationship note added', kind: 'note', by: me.id }] }))} placeholder="After the campaign: what worked, who to keep close, what to pitch next" /></div>
    </>
  )
}

/* ───────── Closed lost ───────── */
function Lost({ d, move }) {
  const s = useStore(); const st = s.sales
  const l = d.lost || {}
  const [note, setNote] = useState(l.note || '')
  const [ask, setAsk] = useState(false)
  const setL = (p, text) => st.patchDeal(d.id, (x) => ({ lost: { ...x.lost, ...p }, ...(text ? { history: [...x.history, { at: now(), text, kind: 'lost', by: me.id }] } : null) }))
  const revive = (days) => {
    st.patchDeal(d.id, (x) => ({ outreach: null, reminders: days ? [...x.reminders, { id: 'r' + Date.now(), text: 'Revive ' + d.brand, at: ahead(days), done: false }] : x.reminders }))
    move('new', days ? `Revived · back in ${days === 30 ? 'a month' : 'a quarter'}` : 'Revived · back to New lead')
    toast('Revived · ' + d.brand, { description: 'Back to Stage 1 · New lead' })
  }
  return (
    <>
      <div className="sl-h3">Why it was lost</div>
      <div className="sl-chips">{LOST_REASONS.map((r) => <button key={r} className={'chip sl-tog' + (l.reason === r ? ' on' : '')} aria-pressed={l.reason === r} onClick={() => setL({ reason: r }, 'Lost reason · ' + r)}>{r}</button>)}</div>
      <div className="inp sl-ta" style={{ marginTop: 10 }}><textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} onBlur={() => note !== (l.note || '') && setL({ note })} placeholder="What happened" /></div>
      <div className="sl-dec">
        <div className="sl-dec-q">Worth reviving later?</div>
        {l.revive === false ? (
          <div className="sl-dec-a"><span className="chip"><CircleSlash size={12} />Stays closed</span><span className="grow" /><button className="b sm ghost" onClick={() => setL({ revive: null })}>Change</button></div>
        ) : (
          <AutoHeight>
            {!ask ? (
              <div className="sl-dec-a">
                <button className="b" onClick={() => setL({ revive: false }, 'Stays closed')}>No</button>
                <button className={'b ink' + (l.reason ? '' : ' dis')} disabled={!l.reason} onClick={() => setAsk(true)}><RotateCcw size={14} />Yes, revive</button>
              </div>
            ) : (
              <div className="sl-dec-n">
                <span className="grow">Back to Stage 1 · New lead</span>
                <button className="b" onClick={() => revive(90)}>In a quarter</button>
                <button className="b" onClick={() => revive(30)}>In a month</button>
                <button className="b ink" onClick={() => revive(0)}>Now</button>
              </div>
            )}
          </AutoHeight>
        )}
        {!l.reason && l.revive !== false && <div className="mute xs" style={{ marginTop: 6 }}>Pick a reason first</div>}
      </div>
    </>
  )
}
