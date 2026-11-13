// Sales slice: one localStorage-backed state for the whole Sales portal, plus the actions every flow uses.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { seed, revive, now, ahead, brandOf, repOf, budgetOf, DEAL_STAGES, stageIx, proofFor, caseById, SIGNAL_KIND, brands } from './data'
import { me, fmt, TODAY } from '../data'
import { go } from '../ui'

const KEY = 'wldd-sales-v1'
const load = () => {
  try { const v = JSON.parse(localStorage.getItem(KEY) || 'null', revive); if (v?.v === 1) return v } catch {}
  return seed()
}
const uid = (p) => p + Math.random().toString(36).slice(2, 7)

/** Deals still being worked (not won, not lost). */
export const isOpen = (d) => d.stage !== 'won' && d.stage !== 'lost'
/** Stale: an open deal untouched for a week. */
export const staleDays = (d) => (isOpen(d) ? Math.floor((now() - d.updated) / 864e5) : 0)
export const isStale = (d) => staleDays(d) >= 7
export const stageLabel = (id) => DEAL_STAGES.find((s) => s.id === id)?.label || id

export function useSalesState() {
  const [st, setSt] = useState(load)
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(st)) } catch {} }, [st])
  const ref = useRef(st); ref.current = st
  const timers = useRef([])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const set = useCallback((fn) => setSt((s) => ({ ...s, ...fn(s) })), [])
  const patchDeal = useCallback((id, patch, quiet) => setSt((s) => ({
    ...s, deals: s.deals.map((d) => (d.id === id ? { ...d, ...(typeof patch === 'function' ? patch(d) : patch), ...(quiet ? null : { updated: now() }) } : d)),
  })), [])
  const log = useCallback((id, text, kind = 'note') => patchDeal(id, (d) => ({ history: [...d.history, { at: now(), text, kind, by: me.id }] })), [patchDeal])
  const notify = useCallback((n) => setSt((s) => ({ ...s, notifs: [{ id: uid('n'), at: now(), read: false, ...n }, ...s.notifs] })), [])

  /** The brand's live deal, if any (won counts too: it's an account now). */
  const dupOf = useCallback((brand, except) => {
    const b = String(brand || '').trim().toLowerCase()
    if (!b) return null
    return ref.current.deals.find((d) => d.id !== except && d.brand.toLowerCase() === b && d.stage !== 'lost') || null
  }, [])

  const addDeal = useCallback((f) => {
    const s = ref.current
    const n = Math.max(...s.deals.map((d) => +d.id.slice(1)), 100) + 1
    const id = 'd' + n
    const at = now()
    const d = {
      id, code: 'DL-' + (1000 + n), brand: f.brand.trim(), owner: me.id, value: Math.round((+f.value || 0) * 1e5), source: f.source,
      stage: 'new', created: at, updated: at, contact: f.contact?.name ? f.contact : null, services: f.services?.length ? f.services : ['amp'],
      next: f.next || 'Send intro email', due: f.due || ahead(1), reminders: [], proof: proofFor(f.brand).map((c) => c.id),
      history: [{ at, text: 'Added from ' + f.source, kind: 'add', by: me.id }, ...(f.note ? [{ at, text: f.note, kind: 'note', by: me.id }] : [])],
      outreach: null, brief: null, call: null, notes: null, scope: null, proposal: null, pitch: null, won: null, lost: null, origin: f.ref || null,
    }
    setSt((s) => {
      const r = f.ref || {}
      return {
        ...s, deals: [d, ...s.deals],
        signals: r.kind === 'signal' ? s.signals.map((x) => (x.id === r.id ? { ...x, status: 'added', deal: id } : x)) : s.signals,
        inbound: r.kind === 'inbound' ? s.inbound.map((x) => (x.id === r.id ? { ...x, status: 'added', owner: x.owner || me.id, deal: id } : x)) : s.inbound,
        accounts: r.kind === 'opp' ? s.accounts.map((a) => ({ ...a, opps: a.opps.map((o) => (o.id === r.id ? { ...o, deal: id } : o)) })) : s.accounts,
        contacts: r.kind === 'contact' ? s.contacts.map((c) => (c.id === r.id ? { ...c, deal: id } : c)) : s.contacts,
      }
    })
    toast.success('Added to pipeline', { description: d.brand + (d.value ? ' · ' + fmt.inr(d.value) : ''), action: { label: 'Open', onClick: () => go('/bd/pipeline/' + id) } })
    return id
  }, [])

  const moveDeal = useCallback((id, stage, why) => {
    const d = ref.current.deals.find((x) => x.id === id)
    if (!d || d.stage === stage) return
    const extra = {}
    if (stage === 'won' && !d.won) extra.won = { value: d.value, services: d.services, pod: null, campaignId: null, note: '' }
    if (stage === 'lost') extra.lost = { reason: d.lost?.reason || null, note: d.lost?.note || '', revive: null, at: now(), from: d.stage }
    if (stage !== 'lost' && d.stage === 'lost') extra.lost = null
    const next = { new: 'Send intro email', brief: 'Schedule the discovery call', negotiation: 'Draft the proposal', pitch: 'Generate the pitch deck', won: 'Hand off to a pod', lost: '' }[stage]
    patchDeal(id, (x) => ({ stage, next, ...extra, history: [...x.history, { at: now(), text: why || 'Moved to ' + stageLabel(stage), kind: stage === 'won' ? 'won' : stage === 'lost' ? 'lost' : 'move', by: me.id }] }))
  }, [patchDeal])

  /** Simulated Gmail: a reply lands a few seconds after sending. Lives here so leaving the page doesn't cancel it. */
  const simulateReply = useCallback((id, ms = 2600) => {
    timers.current.push(setTimeout(() => {
      const d = ref.current.deals.find((x) => x.id === id)
      if (!d || d.outreach?.reply) return
      const who = d.contact?.name || 'The client'
      const reply = { at: now(), from: who, text: `Thanks for this. The ${caseById(d.proof[0])?.client || 'case'} work is great. We're planning ${d.brand}'s next push now. Could we do a call on Thursday or Friday?`, next: 'Book a 30-min call on Thursday, 11:00' }
      patchDeal(id, (x) => ({ outreach: { ...x.outreach, reply }, next: 'Book the call', history: [...x.history, { at: now(), text: 'Reply from ' + who, kind: 'reply' }] }))
      notify({ kind: 'reply', text: 'Reply from ' + d.brand, ctx: 'Wants a call Thursday or Friday', to: '/bd/pipeline/' + id })
      toast('Reply from ' + who, { description: d.brand + ' · Gmail', action: { label: 'Open', onClick: () => go('/bd/pipeline/' + id + '/outreach') } })
    }, ms))
  }, [patchDeal, notify])

  const claim = useCallback((id) => setSt((s) => ({ ...s, inbound: s.inbound.map((x) => (x.id === id ? { ...x, owner: me.id } : x)) })), [])
  const reset = useCallback(() => { timers.current.forEach(clearTimeout); const fresh = seed(); setSt(fresh); try { localStorage.setItem(KEY, JSON.stringify(fresh)) } catch {} }, [])

  return useMemo(() => ({ ...st, set, patchDeal, log, notify, dupOf, addDeal, moveDeal, simulateReply, claim, reset }), [st, set, patchDeal, log, notify, dupOf, addDeal, moveDeal, simulateReply, claim, reset])
}

/* ───────── What we know about a brand ─────────
   Every fact carries its source; anything we don't have is null and renders as "Unknown". */
export function relOf(name, st) {
  const b = brandOf(name)
  if (st.accounts.some((a) => a.brand.toLowerCase() === String(name).toLowerCase())) return { kind: 'client' }
  const moved = b?.people.find((p) => p.moved)
  if (moved) return { kind: 'moved', note: `${moved.name} moved from ${moved.moved}` }
  const known = b?.people.filter((p) => p.onFile || st.revealed.includes(p.id)) || []
  if (known.length) return { kind: 'known', note: known.length === 1 ? 'One contact on file' : known.length + ' contacts on file' }
  return { kind: 'cold' }
}

export function factsFor(name, st) {
  const b = brandOf(name)
  const acct = st.accounts.find((a) => a.brand.toLowerCase() === String(name).toLowerCase())
  const deal = st.deals.find((d) => d.brand.toLowerCase() === String(name).toLowerCase() && d.stage !== 'lost')
  const sig = st.signals.find((x) => x.brand.toLowerCase() === String(name).toLowerCase())
  const bud = budgetOf(b)
  const onFile = b?.people.filter((p) => p.onFile || st.revealed.includes(p.id)) || []
  const proof = proofFor(name, 2)
  return [
    { k: 'Relationship', v: RELL[relOf(name, st).kind], src: 'DMS' },
    { k: 'Pipeline', v: deal ? `${stageLabel(deal.stage)} · ${repOf(deal.owner).short} · ${fmt.inr(deal.value)}` : 'Not in pipeline', src: 'DMS', to: deal && '/bd/pipeline/' + deal.id },
    acct && { k: 'Spend, 12 months', v: fmt.inr(acct.spend), src: 'DMS' },
    { k: 'Category', v: b?.cat ?? null, src: 'Apollo' },
    { k: 'HQ', v: b?.hq ?? null, src: 'Apollo' },
    { k: 'Revenue', v: b?.rev ? fmt.inr(b.rev) : null, src: 'Apollo' },
    { k: 'Employees', v: b?.size ? b.size.toLocaleString('en-IN') : null, src: 'Apollo' },
    { k: 'Creator budget', v: bud ? fmt.inr(bud.annual) + ' a year' : null, src: 'AI' },
    { k: 'Latest signal', v: sig ? sig.title : null, src: 'Signals engine' },
    { k: 'On file', v: onFile.length ? onFile.map((p) => p.name).join(', ') : null, src: 'Gmail' },
    { k: 'Agency of record', v: acct ? 'WLDD' : null, src: acct ? 'DMS' : 'AI' },
    { k: 'Best proof', v: proof.length ? proof.map((c) => c.client).join(', ') : null, src: 'Case Library', cases: proof },
  ].filter(Boolean)
}
export const RELL = { client: 'Existing client', moved: 'Contact moved there', known: 'Known contact', cold: 'Cold' }

/** Find the brand a free-text question is about. Longest name wins, so "Swiggy Instamart" beats "Swiggy". */
export function brandIn(text) {
  const t = ' ' + text.toLowerCase() + ' '
  const hit = [...brands].sort((a, b) => b.name.length - a.name.length).find((b) => t.includes(b.name.toLowerCase()) || t.includes(' ' + b.id.replace(/-/g, ' ') + ' '))
  return hit || null
}

/* ───────── Paste box: names, brands, emails out of free text ───────── */
const TITLE_RE = /\b(CMO|CEO|COO|Founder|Co-founder|VP,? Marketing|Head of [A-Z][a-z]+(?: [A-Z][a-z]+)?|(?:Senior )?Brand Manager|Marketing (?:Director|Lead|Head|Manager)|Growth Lead|Category Head|Digital Lead|Social Media Manager)\b/
const STOPW = new Set(['Hi', 'Hey', 'Hello', 'Thanks', 'Regards', 'Met', 'Call', 'Email', 'Brand', 'Head', 'Marketing', 'Manager', 'Lead', 'Director', 'Founder', 'The', 'We', 'They', 'She', 'He', 'Spoke', 'Wants', 'Budget', 'Event', 'Summit', 'Coffee', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Q1', 'Q2', 'Q3', 'Q4', 'LinkedIn', 'WLDD', 'Goafest', 'Today', 'Tomorrow', 'Also', 'Name'])
export function parseNotes(text) {
  const out = { name: '', title: '', brand: '', email: '', source: '', value: '' }
  if (!text.trim()) return out
  const email = text.match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/)
  if (email) out.email = email[0].toLowerCase()
  const b = brandIn(text) || (out.email && brands.find((x) => out.email.endsWith('@' + x.domain)))
  if (b) out.brand = b.name
  const t = text.match(TITLE_RE)
  if (t) out.title = t[0].replace(/^vp,? marketing$/i, 'VP Marketing')
  const brandWords = new Set((out.brand || '').split(/\s+/))
  // "Name <email>", then any two capitalised words in a row that aren't a brand or a stop word.
  const angle = text.match(/([A-Z][a-z]+(?: [A-Z][a-z]+)+)\s*<[^>]+@/)
  const pairs = [...text.matchAll(/\b([A-Z][a-z]+) ([A-Z][a-z]+)\b/g)].map((m) => [m[1], m[2]]).filter(([a, z]) => !STOPW.has(a) && !STOPW.has(z) && !brandWords.has(a) && !brandWords.has(z))
  if (angle) out.name = angle[1]
  else if (pairs.length) out.name = pairs[0].join(' ')
  else if (out.email) out.name = out.email.split('@')[0].split(/[._]/).filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join(' ')
  const lo = text.toLowerCase()
  out.source = /linkedin|dm'?d|inmail/.test(lo) ? 'LinkedIn' : /refer|intro(duced)?/.test(lo) ? 'Referral' : /cold call|called|phone/.test(lo) ? 'Cold call' : /event|summit|conference|goafest|meetup|panel/.test(lo) ? 'Event' : ''
  const money = text.match(/₹\s?(\d+(?:\.\d+)?)\s?(l|lakh|lakhs|cr|crore)\b/i) || text.match(/(\d+(?:\.\d+)?)\s?(l|lakh|lakhs|cr|crore)\b/i)
  if (money) out.value = String(+money[1] * (/^c/i.test(money[2]) ? 100 : 1))
  return out
}

export { TODAY, SIGNAL_KIND }
