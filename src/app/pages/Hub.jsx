import { Wldd } from '../../loaders/Wldd'
import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowUp, ArrowUpRight, Check, Lock, Square, SquarePen, History, Search, Trash2, X, BadgeCheck, MessageSquare, Upload, Link2, Paperclip, AtSign, ListFilter, Pin } from 'lucide-react'
import { toast } from 'sonner'
import { useStore } from '../store'
import { ROLES, STAGES, PODS, trackerFor, monthly, bdMonthly, fmt, TODAY } from '../data'
import { Ticker, ConfirmButton, Tip, EASE, openNewCampaign } from '../../shared/motion'
import { Sparkline } from '../../shared/ui'
import { Track, ClientLogo, RoleIcon, Popover, go, useDock } from '../ui'
import { view, canLeadApprove } from '../personas'
import { WlddMark } from '../../shared/WlddMark'

/* Home: one page for everyone. KPIs for each workspace the person can open, and a chat
   that answers from the same data.
   A tile *shows* (a preview where the chat lives, nothing saved); typing *talks* (a chat, saved).
   A follow-up typed over a preview commits the preview as the chat's first answer. */

const stalledOf = (s) => s.campaigns.filter((c) => c.stage < 4 && (TODAY - c.updated) / 864e5 > 2)
const reviewOf = (s) => s.campaigns.filter((c) => c.stage >= 4).map((c) => [c, trackerFor(c).filter((r) => r.status === 'review').length]).filter(([, n]) => n)
/** "Netflix India × Diwali Drop" → "Diwali Drop": the row already shows the client. */
const act = (c) => c.name.split(' × ')[1] || c.name
const sum = (a, f) => a.reduce((t, x) => t + f(x), 0)

/** Every KPI per workspace. `q` is how it's asked; `k` are words that find it in free text. */
export const KPIS = {
  pod: [
    { id: 'live', label: 'Live', q: 'Live campaigns', k: ['live', 'running', 'active'], weak: ['campaign'], v: (s) => s.campaigns.filter((c) => c.stage >= 4).length },
    { id: 'links', label: 'Links to review', q: 'Links waiting for review', k: ['link', 'review', 'tracker'], v: (s) => sum(reviewOf(s), ([, n]) => n) },
    { id: 'stalled', label: 'Stalled', q: 'Stalled campaigns', k: ['stall', 'stuck', 'late', 'delay', 'slow'], v: (s) => stalledOf(s).length },
    { id: 'views', label: 'Views', q: 'Views this month', k: ['view', 'reach', 'performance'], v: () => monthly.views.value, f: fmt.compact, series: monthly.views.series },
  ],
  finance: [
    { id: 'waiting', label: 'To approve', q: 'Invoices waiting on Finance', k: ['invoice', 'approve', 'waiting', 'pending'], v: (s) => s.invoices.filter((x) => x.stage === 'finance').length },
    { id: 'scheduled', label: 'Scheduled', q: 'Scheduled payouts', k: ['schedul', 'payout', 'due', 'pay '], v: (s) => sum(s.invoices.filter((x) => x.stage === 'scheduled'), (x) => x.amount), f: fmt.inr },
    { id: 'paid', label: 'Paid', q: 'Paid this month', k: ['paid', 'spent', 'spend'], v: (s) => sum(s.invoices.filter((x) => x.stage === 'paid'), (x) => x.amount) + 3_840_000, f: fmt.inr },
    { id: 'billing', label: 'Billing', q: 'Billing this month', k: ['billing', 'revenue', 'billed'], v: () => monthly.billing.value, f: fmt.inr, series: monthly.billing.series },
  ],
  bd: [
    { id: 'inbound', label: 'Inbound', q: 'New inbound', k: ['inbound', 'enquir', 'lead'], v: (s) => s.inbound.length },
    { id: 'pipeline', label: 'Pipeline', q: 'Pipeline', k: ['pipeline', 'deal'], v: () => bdMonthly.pipeline.value, f: fmt.inr, series: bdMonthly.pipeline.series },
    { id: 'closed', label: 'Closed', q: 'Closed this month', k: ['closed', 'won', 'close'], v: () => bdMonthly.closed.value, f: fmt.inr, series: bdMonthly.closed.series },
    { id: 'conversion', label: 'Conversion', q: 'Conversion rate', k: ['conversion', 'rate', 'win rate'], v: () => bdMonthly.conversion.value, f: (n) => Math.round(n) + '%', series: bdMonthly.conversion.series },
  ],
}
const ALL = Object.entries(KPIS).flatMap(([mod, ks]) => ks.map((k) => ({ ...k, mod })))
const roleOf = (mod) => ROLES.find((r) => r.id === mod)
const OPEN = { pod: '/pod/campaigns', finance: '/finance/invoices', bd: '/bd/feed' }
const PAGE = { live: '/pod/campaigns', links: '/pod/campaigns', stalled: '/pod/campaigns', views: '/pod/campaigns', waiting: '/finance/invoices', scheduled: '/finance/payments', paid: '/finance/payments', billing: '/finance/campaigns', inbound: '/bd/inbound', pipeline: '/bd/pipeline', closed: '/bd/pipeline', conversion: '/bd/pipeline' }
const same = (a, b) => a && b && a.mod === b.mod && a.id === b.id

/** The answer to one KPI: a line, then stats and/or records. Built from the store at ask time. */
function answerFor(kpi, s) {
  const r = { mod: kpi.mod, kpi }
  const v = kpi.v(s)
  const f = kpi.f || fmt.num
  if (kpi.mod === 'pod') {
    if (kpi.id === 'live') {
      const live = s.campaigns.filter((c) => c.stage >= 4)
      return { ...r, text: `${live.length} live, ${live.filter((c) => c.stage === 5).length} reporting.`, list: live.slice(0, 6).map((c) => ({ key: c.id, logo: c.client, industry: c.industry, title: c.client, sub: act(c), track: c.stage, to: `/pod/campaigns/${c.id}` })), more: live.length > 6 && { n: live.length, to: '/pod/campaigns' } }
    }
    if (kpi.id === 'links') {
      const rows = reviewOf(s)
      return { ...r, text: rows.length ? `${v} links across ${rows.length} campaigns.` : 'Nothing to review.', list: rows.slice(0, 6).map(([c, n]) => ({ key: c.id, logo: c.client, industry: c.industry, title: c.client, sub: act(c), n, to: `/pod/campaigns/${c.id}/tracker`, act: 'Review' })) }
    }
    if (kpi.id === 'stalled') {
      const rows = stalledOf(s)
      return { ...r, text: rows.length ? `${rows.length} haven't moved in 3+ days.` : 'Nothing stalled.', list: rows.slice(0, 6).map((c) => ({ key: c.id, logo: c.client, industry: c.industry, title: c.client, sub: fmt.agoShort(c.updated), track: c.stage, to: `/pod/campaigns/${c.id}` })) }
    }
  }
  if (kpi.mod === 'finance') {
    if (kpi.id === 'waiting') {
      const rows = s.invoices.filter((x) => x.stage === 'finance')
      return { ...r, text: rows.length ? `${rows.length} invoices, ${fmt.inr(sum(rows, (x) => x.amount))}.` : 'Nothing waiting.', list: rows.slice(0, 6).map((x) => ({ key: x.id, invoice: x.id, title: x.vendor.name, sub: x.campaign, amount: x.amount })), more: rows.length > 6 && { n: rows.length, to: '/finance/invoices' } }
    }
    if (kpi.id === 'scheduled') {
      const rows = s.invoices.filter((x) => x.stage === 'scheduled')
      return { ...r, text: `${rows.length} payouts, ${fmt.inr(v)}.`, list: rows.slice(0, 6).map((x) => ({ key: x.id, title: x.vendor.name, sub: x.campaign, amount: x.amount })), more: { n: rows.length, to: '/finance/payments', label: 'Pay' } }
    }
  }
  if (kpi.mod === 'bd' && kpi.id === 'inbound') {
    return { ...r, text: `${s.inbound.length} new, ${fmt.inr(sum(s.inbound, (x) => x.budget))} asked.`, list: s.inbound.slice(0, 6).map((x) => ({ key: x.id, logo: x.company, title: x.company, sub: x.summary, amount: x.budget, to: '/bd/inbound' })) }
  }
  // Single numbers: the value with its 12-month line.
  const first = kpi.series?.[0]
  const delta = first ? Math.round(((kpi.series.at(-1) - first) / first) * 100) : null
  return { ...r, stat: { label: kpi.label, value: v, f, series: kpi.series }, text: delta != null ? `${delta >= 0 ? 'Up' : 'Down'} ${Math.abs(delta)}% on 12 months.` : null }
}

/** A one-line read across every workspace the person can open. */
function summaryFor(mods, s) {
  return { summary: mods.map((m) => ({ mod: m, kpis: KPIS[m].slice(0, 2).map((k) => ({ label: k.label, value: k.v(s), f: k.f || fmt.num })) })) }
}

/** Free text → KPI, by keyword. Returns the best match across all workspaces (access is checked after). */
function route(text) {
  const t = ' ' + text.toLowerCase() + ' '
  if (/https?:\/\/|instagram\.com|youtu\.?be|x\.com\//.test(t)) return ALL.find((k) => k.id === 'links') // a pasted post goes to the review queue
  if (/\b(summary|overview|today|everything|how are we|status)\b/.test(t)) return 'summary'
  let best = null, score = 0
  ALL.forEach((k) => {
    const n = k.k.filter((w) => t.includes(w)).length + (k.weak || []).filter((w) => t.includes(w)).length * 0.4 + (t.includes(roleOf(k.mod).label.toLowerCase()) ? 0.3 : 0)
    if (n > score) { best = k; score = n }
  })
  return best
}

/* ───────── History ─────────
   Chats are saved per person (View as keeps them apart). A saved answer is only a pointer
   ('summary' · 'miss' · { locked } · { mod, id }); it's rebuilt from live data when shown. */
const KEY = (pid) => 'wldd-chats-' + pid
const loadChats = (pid) => { try { return JSON.parse(localStorage.getItem(KEY(pid)) || '[]') } catch { return [] } }
const saveChats = (pid, list) => { try { localStorage.setItem(KEY(pid), JSON.stringify(list.slice(0, 50))) } catch {} }
export const kpiOf = (ref) => { const k = ref?.mod && KPIS[ref.mod]?.find((x) => x.id === ref.id); return k ? { ...k, mod: ref.mod } : null }
export function resolve(ref, mods, s) {
  if (ref === 'summary') return summaryFor(mods, s)
  if (!ref || ref === 'miss') return { miss: true }
  if (ref.locked || !mods.includes(ref.mod)) return { locked: ref.locked || ref.mod }
  const k = kpiOf(ref)
  if (!k) return { miss: true }
  const a = answerFor(k, s)
  if (!ref.f || !a.list) return a
  const words = ref.f.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !STOP.has(w))
  const list = a.list.filter((x) => words.some((w) => (x.title + ' ' + (x.sub || '')).toLowerCase().includes(w)))
  if (!list.length) return { miss: true } // nothing in the list matches: it wasn't a filter, it was something we don't understand
  return { ...a, list, more: null, text: `${list.length} matching.` }
}
/** What a typed question points at. `ctx` is the last answer, so "only Netflix" narrows it. */
export function refFor(text, ctx, mods, kpi) {
  let hit = kpi || route(text)
  let f = null
  if (!hit && ctx && ctx.mod) { hit = kpiOf(ctx); f = text } // follow-up: narrow the last answer
  return !hit ? 'miss' : hit === 'summary' ? 'summary' : !mods.includes(hit.mod) ? { locked: hit.mod } : { mod: hit.mod, id: hit.id, ...(f && { f }) }
}
/** Two KPIs per workspace the person can open: the starter questions. */
export const suggestFor = (mods) => mods.flatMap((m) => KPIS[m].slice(0, 2).map((k) => ({ ...k, mod: m }))).slice(0, 4)
const STOP = new Set(['only', 'just', 'the', 'and', 'for', 'with', 'show', 'what', 'which', 'about', 'from', 'are', 'that', 'this', 'those'])
const dayKey = (t) => { const d = Math.round((new Date().setHours(0, 0, 0, 0) - new Date(t).setHours(0, 0, 0, 0)) / 864e5); return d <= 0 ? 'Today' : d === 1 ? 'Yesterday' : d < 7 ? 'This week' : 'Earlier' }
const hello = () => { const h = new Date().getHours(); return h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : 'Evening' }

/** Home layouts (Settings › Preferences › Home, ⌥H). Same data and chat, different arrangement.
    stack  — dashboard on top, chat underneath
    split  — chat is the page; KPIs in a slim column on the right
    focus  — chat first: greeting + composer centred, a strip of headline KPIs; the strip steps away once you talk
    dock   — dashboard is the page; chat lives in a panel on the right
    brief  — what's waiting in one sentence, three ways to start, open work as rows, the composer as a card at the foot */
export const HOME_LAYOUTS = [
  { value: 'stack', label: 'Stack' },
  { value: 'split', label: 'Split' },
  { value: 'focus', label: 'Focus' },
  { value: 'dock', label: 'Dock' },
  { value: 'brief', label: 'Brief' },
]

export default function Hub({ layout = 'stack' }) {
  const s = useStore()
  const p = view()
  const mods = ROLES.filter((r) => p.roles.includes(r.id)).map((r) => r.id)
  const [chats, setChatsRaw] = useState(() => loadChats(p.id))
  const [cur, setCur] = useState(null) // open chat id; null = a new chat
  const [peek, setPeek] = useState(null) // { mod, id } shown from a tile; not saved until you reply
  const [busy, setBusy] = useState(false)
  const [q, setQ] = useState('')
  const box = useRef()
  const end = useRef()
  const t = useRef()
  const setChats = (fn) => setChatsRaw((l) => { const n = typeof fn === 'function' ? fn(l) : fn; saveChats(p.id, n); return n })
  const chat = chats.find((c) => c.id === cur)
  const thread = chat?.msgs || []
  useEffect(() => () => clearTimeout(t.current), [])
  useEffect(() => { clearTimeout(t.current); setChatsRaw(loadChats(p.id)); setCur(null); setPeek(null); setBusy(false) }, [p.id])
  useEffect(() => { if (thread.length || peek) end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [thread.length, busy, cur, peek])
  // Esc closes a preview.
  useEffect(() => {
    if (!peek) return
    const on = (e) => { if (e.key === 'Escape' && !document.querySelector('.pop')) setPeek(null) }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [peek])
  // "/" focuses the composer, like search fields elsewhere.
  useEffect(() => {
    const on = (e) => { const tg = e.target; if (e.key === '/' && !(tg.tagName === 'INPUT' || tg.tagName === 'TEXTAREA') && !e.metaKey && !e.ctrlKey) { e.preventDefault(); box.current?.focus() } }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [])

  const push = (id, msg) => setChats((l) => l.map((c) => (c.id === id ? { ...c, at: Date.now(), msgs: [...c.msgs, msg] } : c)))
  const ask = (text, kpi) => {
    if (!text.trim() || busy) return
    const ctx = peek || (!kpi && [...thread].reverse().find((m) => m.ref?.mod)?.ref) // what "only Netflix" refers to
    const ref = refFor(text, ctx, mods, kpi)
    const now = Date.now()
    let id = cur
    const title = peek ? kpiOf(peek).q : text.trim()[0].toUpperCase() + text.trim().slice(1)
    if (!chat) { id = now; setChats((l) => [{ id, title, at: now, msgs: [] }, ...l]); setCur(id) }
    if (peek) { push(id, { id: now - 1, who: 'wldd', ref: { mod: peek.mod, id: peek.id } }); setPeek(null) }
    push(id, { id: now, who: 'me', text: text.trim() })
    setQ('')
    if (box.current) box.current.style.height = 'auto'
    setBusy(true)
    t.current = setTimeout(() => { push(id, { id: now + 1, who: 'wldd', ref }); setBusy(false) }, 1350) // long enough for Cycle to pass W → L → D
  }
  const stop = () => { clearTimeout(t.current); setBusy(false) }
  const show = (k) => { if (busy) return; setPeek((pk) => (same(pk, k) ? null : { mod: k.mod, id: k.id })) }
  const fresh = () => { stop(); setCur(null); setPeek(null); setQ(''); box.current?.focus() }
  const open = (id) => { stop(); setCur(id) }
  const remove = (id) => {
    const i = chats.findIndex((c) => c.id === id)
    const gone = chats[i]
    setChats((l) => l.filter((c) => c.id !== id))
    if (cur === id) setCur(null)
    toast('Chat deleted', { action: { label: 'Undo', onClick: () => setChats((l) => { const n = [...l]; n.splice(i, 0, gone); return n }) } })
  }
  const suggest = suggestFor(mods)

  /* Always there, pinned to the top of the chat while it scrolls (the composer is pinned to the bottom). */
  const bar = (
    <div className="hub-bar">
      <span className="hub-bar-t ell">{chat ? chat.title : ''}</span>
      <Tip label="New chat"><button className="b ghost sm" onClick={fresh} disabled={!chat && !peek}><SquarePen size={14} /><span className="m-hide">New</span></button></Tip>
      <Popover width={320} trigger={({ toggle }) => (
        <Tip label="History"><button className="b ghost sm" onClick={toggle}><History size={14} /><span className="m-hide">History</span>{chats.length > 0 && <span className="mute num">{chats.length}</span>}</button></Tip>
      )}>
        {(close) => <ChatList chats={chats} cur={cur} open={(id) => { open(id); close() }} remove={remove} />}
      </Popover>
    </div>
  )
  const threadEl = (
    <div className="hub-thread" aria-live="polite">
      <AnimatePresence initial={false} mode="popLayout">
        {thread.map((m) => (
          <motion.div key={cur + '-' + m.id} className={'hub-msg ' + m.who} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.12 } }} transition={{ duration: 0.22, ease: EASE }}>
            {m.who === 'me' ? <div className="hub-me">{m.text}</div> : <Answer a={resolve(m.ref, mods, s)} ask={ask} suggest={suggest} />}
          </motion.div>
        ))}
        {peek && (
          <motion.div key={'peek-' + peek.mod + peek.id} className="hub-msg wldd peek" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.12 } }} transition={{ duration: 0.22, ease: EASE }}>
            <Answer a={resolve(peek, mods, s)} ask={ask} suggest={suggest} onClose={() => setPeek(null)} />
          </motion.div>
        )}
        {busy && (
          <motion.div key="busy" className="hub-msg wldd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.1 } }}>
            <span className="hub-think" role="status" aria-label="Thinking"><Wldd mode="cycle" size={26} tight /></span>
          </motion.div>
        )}
      </AnimatePresence>
      <div ref={end} />
    </div>
  )
  const dock = (
    <div className="hub-dock">
      {!thread.length && !peek && layout !== 'focus' && ( /* focus: the KPI panel under the box already is the suggestions */
        <div className="hub-sug">
          {suggest.map((k) => <button key={k.mod + k.id} className="chip hub-chip" onClick={() => ask(k.q, k)}><RoleIcon role={k.mod} size={16} />{k.q}</button>)}
        </div>
      )}
      <form className="hub-box" onSubmit={(e) => { e.preventDefault(); ask(q) }} onMouseDown={(e) => { if (e.target === e.currentTarget) { e.preventDefault(); box.current?.focus() } }}>
        <textarea ref={box} rows={1} value={q} placeholder={peek ? 'Ask about ' + kpiOf(peek).label + '…' : chat ? 'Reply…' : 'Ask about campaigns, invoices, pipeline…'} aria-label="Ask"
          onChange={(e) => { setQ(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px' }}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(q) } }} />
        {busy
          ? <Tip label="Stop"><button type="button" className="b icon hub-send" onClick={stop} aria-label="Stop"><Square size={12} fill="currentColor" /></button></Tip>
          : <Tip label="Send" kbd="↵"><button type="submit" className="b ink icon hub-send" disabled={!q.trim()} aria-label="Send"><ArrowUp size={16} /></button></Tip>}
      </form>
    </div>
  )
  const kpis = (kind) => <Kpis kind={kind} mods={mods} show={show} peek={peek} />

  if (layout === 'split') return (
    <div className="hub l-split">
      {/* The scroller is the whole left cell, so the scrollbar sits on its edge; the chat is centred inside it. */}
      <div className="hub-col hub-chatwrap"><div className="hub-chatcol">{bar}{thread.length || peek ? threadEl : <div className="hub-hello"><WlddMark className="hub-mark" /><h1 className="d-h1 keep">{hello()}, {p.person.short}</h1></div>}{dock}</div></div>
      <aside className="hub-col hub-rail">{kpis('rows')}</aside>
    </div>
  )
  if (layout === 'dock') return (
    <div className="hub l-dock">
      <div className="hub-col hub-board">{kpis('tiles')}</div>
      <aside className="hub-col hub-chatcol">{bar}{thread.length || peek ? threadEl : <div className="hub-hello" />}{dock}</aside>
    </div>
  )
  if (layout === 'brief') {
    const talking = thread.length || peek
    const card = (
      <form className="br-box" onSubmit={(e) => { e.preventDefault(); ask(q) }} onMouseDown={(e) => { if (e.target === e.currentTarget) { e.preventDefault(); box.current?.focus() } }}>
        <div className="br-box-h">
          <span className="chip br-mode"><MessageSquare size={12} />Ask</span>
          <span className="mute xs br-hint m-hide">Enter to send</span>
        </div>
        <textarea ref={box} rows={2} value={q} placeholder={talking ? 'Reply…' : 'Ask about campaigns, invoices, pipeline…'} aria-label="Ask"
          onChange={(e) => { setQ(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px' }}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(q) } }} />
        <div className="br-box-f">
          {mods.includes('pod') && <Tip label="Upload a brief"><button type="button" className="b ghost icon sm" onClick={() => openNewCampaign()} aria-label="Upload a brief"><Paperclip size={14} /></button></Tip>}
          <Tip label="Mention"><button type="button" className="b ghost icon sm" onClick={() => { setQ((v) => v + '@'); box.current?.focus() }} aria-label="Mention"><AtSign size={14} /></button></Tip>
          <span className="grow" />
          {busy
            ? <Tip label="Stop"><button type="button" className="b icon br-send" onClick={stop} aria-label="Stop"><Square size={11} fill="currentColor" /></button></Tip>
            : <Tip label="Send" kbd="↵"><button type="submit" className="b ink icon br-send" disabled={!q.trim()} aria-label="Send"><ArrowUp size={16} /></button></Tip>}
        </div>
      </form>
    )
    return (
      <div className={'d-page hub l-brief' + (talking ? ' talking' : '')}>
        {talking ? <>{bar}{threadEl}</> : <Brief mods={mods} chats={chats} openChat={open} start={() => box.current?.focus()} />}
        <div className="br-foot">{card}</div>
      </div>
    )
  }
  if (layout === 'focus') return (
    <div className={'d-page hub l-focus' + (thread.length || peek ? ' talking' : '')}>
      {thread.length || peek ? <>{bar}{peek && !thread.length && <div className="hub-strip-top">{kpis('strip')}</div>}{threadEl}{dock}</> : (
        <>
          {bar}
          <div className="hub-hero">
            <h1 className="d-h1 keep">{hello()}, {p.person.short}</h1>
            {dock}
            {kpis('strip')}
          </div>
          {/* quiet sign-off, pinned to the foot of the page; gone once you talk */}
          <div className="hub-sign" aria-hidden><WlddMark height={44} /></div>
        </>
      )}
    </div>
  )
  return (
    <div className={'d-page wide hub l-stack' + (thread.length ? ' talking' : '')}>
      {kpis('tiles')}
      {bar}
      {threadEl}
      {dock}
    </div>
  )
}

/** What's waiting on this person, across the workspaces they can open. */
function dueOf(mods, s) {
  const parts = []
  if (mods.includes('pod') && canLeadApprove()) parts.push({ list: s.invoices.filter((x) => x.stage === 'lead'), to: '/pod/approvals' })
  if (mods.includes('finance')) parts.push({ list: s.invoices.filter((x) => x.stage === 'finance'), to: '/finance/invoices' })
  const inv = parts.flatMap((p) => p.list)
  if (!inv.length && mods.includes('bd')) {
    const x = s.inbound[0]
    return { n: s.inbound.length, noun: s.inbound.length === 1 ? 'lead' : 'leads', to: '/bd/inbound', top: x && { logo: x.company, title: x.company, via: x.name, at: x.at, n: s.inbound.length } }
  }
  // The campaign with the most waiting is the one to open first.
  const by = {}
  inv.forEach((x) => { (by[x.campaignId] ||= []).push(x) })
  const [cid, top] = Object.entries(by).sort((a, b) => b[1].length - a[1].length)[0] || []
  const c = cid && s.campaigns.find((x) => x.id === cid)
  const at = top && new Date(Math.max(...top.map((x) => +x.submitted)))
  return { n: inv.length, noun: inv.length === 1 ? 'approval' : 'approvals', to: parts.find((p) => p.list.length)?.to || parts[0]?.to, top: c && { logo: c.client, industry: c.industry, title: c.name, via: c.pod, at, n: top.length } }
}

/** Brief home: one sentence of what's waiting, three ways to start, then open work. */
function Brief({ mods, chats, openChat, start }) {
  const s = useStore()
  const dk = useDock()
  const due = dueOf(mods, s)
  const hasPod = mods.includes('pod')
  const [tab, setTab] = useState(hasPod ? 'open' : 'chats')
  const [pod, setPod] = useState(null)
  const open = s.campaigns.filter((c) => c.stage < 6 && (!pod || c.pod === pod)).sort((a, b) => b.updated - a.updated)
  const rows = open.slice(0, 8)
  const openRec = (c) => (dk.peek === 'docked' ? dk.setDock({ kind: 'record', id: c.id, ids: rows.map((x) => x.id) }) : go(`/pod/campaigns/${c.id}`))
  const starts = [
    { id: 'ask', icon: MessageSquare, tone: 'g', t: 'Ask anything', d: 'Campaigns, invoices, pipeline. Answers come from live data.', b: 'Start typing', on: start },
    hasPod && { id: 'up', icon: Upload, tone: 'v', t: 'Upload a brief', d: 'A deck or PDF from the client starts a campaign.', b: 'Upload a file', on: () => openNewCampaign() },
    hasPod && { id: 'link', icon: Link2, tone: 'y', t: 'Paste a link', d: 'A live reel or post goes to its review queue.', b: 'Paste a link', on: start },
  ].filter(Boolean)
  return (
    <div className="br">
      <section className="br-hero">
        <h1 className="br-say">
          {due.n ? <>You have <span className="br-badge" aria-hidden><BadgeCheck size={20} /></span> <span className="num">{due.n}</span> {due.noun} <span className="br-dim">ready to review.</span></>
            : <>Nothing waiting. <span className="br-dim">Start below.</span></>}
        </h1>
        {due.top && (
          <div className="br-top">
            <ClientLogo name={due.top.logo} industry={due.top.industry} />
            <span className="ell br-top-t">{due.top.title}</span>
            <span className="mute ell br-top-m">· {due.top.via} · {fmt.agoShort(due.top.at)}</span>
            <span className="grow" />
            <span className="br-wait"><i />{due.top.n} waiting</span>
            <button className="b sm" onClick={() => go(due.to)}>Open</button>
          </div>
        )}
      </section>

      <div className="br-starts">
        {starts.map((x) => (
          <div key={x.id} className="br-start">
            <span className={'br-ic ' + x.tone}><x.icon size={15} /></span>
            <b>{x.t}</b>
            <p className="mute">{x.d}</p>
            <button className="b sm br-start-b" onClick={x.on}>{x.b}</button>
          </div>
        ))}
      </div>

      <div className="br-tabs">
        <div className="vtabs">
          {hasPod && <button className={'vtab' + (tab === 'open' ? ' on' : '')} onClick={() => setTab('open')}>Open campaigns<span className="mute num">{open.length}</span></button>}
          <button className={'vtab' + (tab === 'chats' ? ' on' : '')} onClick={() => setTab('chats')}>Recent chats<span className="mute num">{chats.length}</span></button>
        </div>
        <span className="grow" />
        {tab === 'open' && (
          <Popover width={180} trigger={({ toggle, open: o }) => (
            <button className={'b sm' + (o || pod ? ' on' : '')} onClick={toggle}><ListFilter size={14} />{pod ? <>Pod <b className="fw5">{pod}</b></> : 'Filter'}</button>
          )}>
            {(close) => [null, ...PODS].map((p) => (
              <button key={p || 'all'} onClick={() => { setPod(p); close() }}>
                {p ? <span className="pod-dot" data-pod={p} /> : <span style={{ width: 8 }} />}{p || 'Any'}{pod === p && <Check size={14} style={{ marginLeft: 'auto' }} />}
              </button>
            ))}
          </Popover>
        )}
      </div>

      <div className="list br-list">
        {tab === 'open' && rows.map((c) => (
          <div key={c.id} className="li br-row">
            <ClientLogo name={c.client} industry={c.industry} />
            <div className="grow">
              <div className="li-t ell">{c.name}</div>
              <div className="br-meta"><span className="chip">{c.stage === 6 ? 'Complete' : STAGES[c.stage]}</span><span className="pod-tag"><span className="pod-dot" data-pod={c.pod} />{c.pod}</span><span className="mute m-hide">{fmt.agoShort(c.updated)}</span></div>
            </div>
            <button className="b sm m-hide" onClick={() => s.patchCampaign(c.id, { pinned: !c.pinned })}><Pin size={13} fill={c.pinned ? 'currentColor' : 'none'} />{c.pinned ? 'Pinned' : 'Pin'}</button>
            <button className="b sm" onClick={() => openRec(c)}>Open</button>
          </div>
        ))}
        {tab === 'chats' && chats.slice(0, 8).map((c) => (
          <div key={c.id} className="li br-row">
            <span className="br-ic"><MessageSquare size={14} /></span>
            <div className="grow">
              <div className="li-t ell">{c.title}</div>
              <div className="br-meta"><span className="mute">{dayKey(c.at)}</span></div>
            </div>
            <button className="b sm" onClick={() => openChat(c.id)}>Open</button>
          </div>
        ))}
        {tab === 'chats' && !chats.length && <div className="empty"><MessageSquare size={18} /><b>No chats</b></div>}
        {tab === 'open' && !rows.length && <div className="empty"><b>Clear</b></div>}
      </div>
    </div>
  )
}

/** KPIs for the workspaces this person can open. A tile is a question: clicking asks it.
    tiles — one row of four per workspace · rows — a slim list per workspace · strip — two headline tiles per workspace */
function Kpis({ kind, mods, show, peek }) {
  const s = useStore()
  const val = (k) => { const v = k.v(s); return <Ticker value={v} format={(n) => (k.f || fmt.num)(Math.round(n))} /> }
  const n = mods.length * 2
  if (kind === 'strip') return (
    /* Even rows only: 6 tiles → 3 × 2, 4 → 4, 2 → 2. Never an orphan row. */
    <div className="hub-strip" style={{ '--cols': n % 4 === 0 ? 4 : n % 3 === 0 ? 3 : Math.min(n, 4) }}>
      {mods.flatMap((m) => KPIS[m].slice(0, 2).map((k) => (
        <div key={m + k.id} className="hub-sw">
          <Tip label={k.q}>
            <button className={'hub-st' + (same(peek, { mod: m, id: k.id }) ? ' on' : '')} aria-pressed={same(peek, { mod: m, id: k.id })} onClick={() => show({ mod: m, id: k.id })}>
              <span className="metric-l hub-st-l"><RoleIcon role={m} size={16} />{k.label}</span>
              <span className="hub-st-v num">{val(k)}</span>
            </button>
          </Tip>
          <Tip label={'Open ' + k.label}><a className="b ghost icon sm hub-kgo" href={'#' + PAGE[k.id]} aria-label={'Open ' + k.label}><ArrowUpRight size={13} /></a></Tip>
        </div>
      )))}
    </div>
  )
  if (kind === 'rows') return (
    <div className="hub-rows">
      {mods.map((m) => (
        <section key={m} className="hub-mod">
          <Tip label={'Open ' + roleOf(m).label} side="left"><a className="hub-mod-h" href={'#' + OPEN[m]}><RoleIcon role={m} size={20} /><span>{roleOf(m).label}</span><ArrowUpRight size={13} className="hub-go" /></a></Tip>
          <div className="list">
            {KPIS[m].map((k) => (
              <button key={k.id} className={'li hub-row' + (same(peek, { mod: m, id: k.id }) ? ' on' : '')} aria-pressed={same(peek, { mod: m, id: k.id })} onClick={() => show({ mod: m, id: k.id })}>
                <span className="grow mute">{k.label}</span>
                {k.series && <span className="hub-row-s"><Sparkline data={k.series} width={44} height={16} color="currentColor" fill={false} strokeWidth={1.25} /></span>}
                <span className="num fw5">{val(k)}</span>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
  return (
    <div className="hub-kpis">
      {mods.map((m) => (
        <section key={m} className="hub-mod">
          <Tip label={'Open ' + roleOf(m).label} side="right"><a className="hub-mod-h" href={'#' + OPEN[m]}><RoleIcon role={m} size={20} /><span>{roleOf(m).label}</span><ArrowUpRight size={13} className="hub-go" /></a></Tip>
          <div className="metrics hub-m">
            {KPIS[m].map((k) => {
              const on = same(peek, { mod: m, id: k.id })
              return (
                <div key={k.id} className={'hub-kw' + (on ? ' on' : '')}>
                  <button className="metric hub-k" aria-pressed={on} onClick={() => show({ mod: m, id: k.id })}>
                    <span className="metric-l">{k.label}</span>
                    <span className="hub-kv">
                      <span className="metric-v num">{val(k)}</span>
                      {k.series && <Sparkline data={k.series} width={56} height={20} color="currentColor" fill={false} strokeWidth={1.25} />}
                    </span>
                  </button>
                  <Tip label={'Open ' + k.label}><a className="b ghost icon sm hub-kgo" href={'#' + PAGE[k.id]} aria-label={'Open ' + k.label}><ArrowUpRight size={13} /></a></Tip>
                </div>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}

/** History list: search, grouped by day, delete on hover. */
function ChatList({ chats, cur, open, remove }) {
  const [f, setF] = useState('')
  const needle = f.trim().toLowerCase()
  const shown = chats.filter((c) => !needle || c.title.toLowerCase().includes(needle) || c.msgs.some((m) => m.text?.toLowerCase().includes(needle)))
  const groups = []
  shown.forEach((c) => { const k = dayKey(c.at); const g = groups.find((x) => x.k === k); if (g) g.items.push(c); else groups.push({ k, items: [c] }) })
  return (
    <div className="hub-hist">
      <label className="inp hub-hist-f"><Search size={14} /><input autoFocus value={f} onChange={(e) => setF(e.target.value)} placeholder="Search chats" />{f && <button className="b ghost icon sm" onClick={() => setF('')} aria-label="Clear"><X size={12} /></button>}</label>
      <div className="hub-hist-l">
        {groups.map((g) => (
          <div key={g.k}>
            <div className="pop-h">{g.k}</div>
            {g.items.map((c) => (
              <div key={c.id} className={'hub-hist-r' + (c.id === cur ? ' on' : '')}>
                <button className="hub-hist-o" onClick={() => open(c.id)}>
                  <span className="ell grow">{c.title}</span>
                  <span className="mute xs num">{Math.ceil(c.msgs.length / 2)}</span>
                </button>
                <Tip label="Delete"><button className="b ghost icon sm hub-hist-x" onClick={() => remove(c.id)} aria-label="Delete chat"><Trash2 size={13} /></button></Tip>
              </div>
            ))}
          </div>
        ))}
        {!shown.length && <div className="empty hub-hist-e"><b>No chats</b></div>}
      </div>
    </div>
  )
}

export function Answer({ a, ask, suggest, onClose }) {
  const s = useStore()
  const [done, setDone] = useState(() => new Set())
  if (a.locked) return <div className="hub-a"><p className="hub-lock"><Lock size={14} /><b>Locked</b><span className="mute">No {roleOf(a.locked).label} access</span></p></div>
  if (a.miss) return (
    <div className="hub-a">
      <p className="mute">Not sure. Try</p>
      <div className="hub-sug in">{suggest.map((k) => <button key={k.mod + k.id} className="chip hub-chip" onClick={() => ask(k.q, k)}><RoleIcon role={k.mod} size={16} />{k.q}</button>)}</div>
    </div>
  )
  if (a.summary) return (
    <div className="hub-a">
      <div className="hub-sum">
        {a.summary.map((g) => (
          <div key={g.mod} className="hub-sum-r">
            <span className="hub-sum-m"><RoleIcon role={g.mod} size={18} />{roleOf(g.mod).label}</span>
            {g.kpis.map((k) => <span key={k.label} className="hub-sum-k"><span className="mute">{k.label}</span> <b className="num">{k.f(k.value)}</b></span>)}
          </div>
        ))}
      </div>
    </div>
  )
  const rows = (a.list || []).filter((x) => !done.has(x.key))
  return (
    <div className="hub-a">
      <div className="hub-src"><RoleIcon role={a.mod} size={16} />{a.kpi.q}{onClose && <Tip label="Close" kbd="Esc"><button className="b ghost icon sm hub-x" onClick={onClose} aria-label="Close"><X size={13} /></button></Tip>}</div>
      {a.stat && (
        <div className="hub-stat">
          <span className="metric-v num">{a.stat.f(a.stat.value)}</span>
          {a.stat.series && <Sparkline data={a.stat.series} width={160} height={36} color="currentColor" strokeWidth={1.5} />}
        </div>
      )}
      {a.text && <p>{a.text}</p>}
      {rows.length > 0 && (
        <div className="list hub-list">
          <AnimatePresence initial={false}>
            {rows.map((x) => (
              <motion.div key={x.key} className="li" exit={{ opacity: 0, height: 0, minHeight: 0, transition: { duration: 0.22, ease: EASE } }}>
                {x.logo && <ClientLogo name={x.logo} industry={x.industry} />}
                <div className="grow">
                  <div className="li-t ell">{x.title}</div>
                  <div className="li-s ell">{x.sub}</div>
                </div>
                {x.track != null && <Track stage={x.track} />}
                {x.n != null && <span className="mute num">{x.n}</span>}
                {x.amount != null && <span className="num fw5">{fmt.inr(x.amount)}</span>}
                {x.invoice && <ConfirmButton className="b sm" label="Approve" doneLabel="Approved" icon={<Check size={13} />} onDone={() => { s.advanceInvoice(x.invoice); setDone((d) => new Set(d).add(x.key)) }} />}
                {x.to && <button className="b sm ghost icon" onClick={() => go(x.to)} aria-label={x.act || 'Open'}><ArrowUpRight size={14} /></button>}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
      {a.list && !rows.length && <p className="hub-lock"><Check size={14} /><b>Clear</b></p>}
      {a.more && <button className="b sm hub-more" onClick={() => go(a.more.to)}>{a.more.label || 'All ' + a.more.n}<ArrowUpRight size={13} /></button>}
    </div>
  )
}
