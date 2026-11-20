// To-do: the pure parts. Dates read the demo clock (TODAY), never the wall clock.
import { TODAY, fmt, clients, team } from '../data'
import { brands, extras, brandOf, PHONES } from '../sales/data'
import { dbCompanies, companyHref } from '../sales/prospect'
import { view } from '../personas'

const D = 864e5
export const startOf = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }
export const dayDiff = (d) => Math.round((startOf(d) - startOf(TODAY)) / D)
export const at = (days, h = 0, m = 0) => { const x = startOf(TODAY); x.setDate(x.getDate() + days); x.setHours(h, m, 0, 0); return x }
export { at as dayAt }

/** Where an item sits: overdue · today · upcoming · someday · done. */
export const bucketOf = (t) => (t.done ? 'done' : !t.due ? 'someday' : dayDiff(t.due) < 0 ? 'overdue' : dayDiff(t.due) === 0 ? 'today' : 'upcoming')
export const isDueNow = (t) => !t.done && !!t.due && dayDiff(t.due) <= 0
const timed = (d) => d.getHours() !== 0 || d.getMinutes() !== 0
export const fmtTime = (d) => { const h = d.getHours(), m = d.getMinutes(); return (h % 12 || 12) + (m ? ':' + String(m).padStart(2, '0') : '') + (h < 12 ? 'am' : 'pm') }
const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
/** "Today 5pm", "Tomorrow", "Fri", "12 Nov", "Yesterday". */
export function dueLabel(d) {
  if (!d) return ''
  const n = dayDiff(d)
  const day = n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : n === -1 ? 'Yesterday' : n > 1 && n < 7 ? WD[d.getDay()] : fmt.date(d)
  return timed(d) ? day + ' ' + fmtTime(d) : day
}
/** Mine: assigned to (or, unassigned, written by) whoever the app is showing (Settings › View as). */
export const meId = () => view().person.id
/** Assignees: `who` is a list (older saves hold one id). Empty list = nobody. */
export const asList = (w) => (Array.isArray(w) ? w : w ? [w] : [])
export const whosOf = (t) => (t.who === undefined ? asList(t.by) : asList(t.who))
export const whoOf = (t) => whosOf(t)[0] || null
export const assigned = (t, id) => whosOf(t).includes(id)
export const mine = (t) => assigned(t, meId())
/** Top-level to-dos only; subtasks show under their parent. */
export const top = (t) => !t.parent
export const subsOf = (items, id) => items.filter((x) => x.parent === id)
/** "Mon → Fri" for a to-do with a start, else its due label. */
export const spanLabel = (t) => (t.start && t.due && dayDiff(t.start) !== dayDiff(t.due) ? dueLabel(t.start).replace(/ \d.*$/, '') + ' → ' + dueLabel(t.due) : dueLabel(t.due))

/* ───────── Natural dates ───────── */
const WDAY = { sun: 0, sunday: 0, mon: 1, monday: 1, tue: 2, tues: 2, tuesday: 2, wed: 3, weds: 3, wednesday: 3, thu: 4, thur: 4, thurs: 4, thursday: 4, fri: 5, friday: 5, sat: 6, saturday: 6 }
const MON = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11 }
const NUMW = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5 }
const PRE = '(?:(?<![\\w-])(?:by|on|due|before|for)\\s+)?'
const DATE_RULES = [
  [/day after tomorrow/, () => at(2)],
  [/\b(?:today|tonight|tdy|eod)\b/, (m) => (m[0] === 'tonight' ? at(0, 20) : m[0] === 'eod' ? at(0, 18) : at(0))],
  [/\b(?:tomorrow|tmrw|tmr|tomo)\b/, () => at(1)],
  [/\bnext week\b/, () => at(((8 - TODAY.getDay()) % 7) || 7)],
  [/\bthis weekend\b|\bweekend\b/, () => at((6 - TODAY.getDay() + 7) % 7 || 7)],
  [/\bthis week\b/, () => at(Math.max(0, 5 - TODAY.getDay()))],
  [/\bnext month\b/, () => { const x = startOf(TODAY); x.setMonth(x.getMonth() + 1, 1); return x }],
  [/\bin (a|an|one|two|three|four|five|\d+) (day|days|week|weeks|month|months)\b/, (m) => {
    const n = NUMW[m[1]] ?? +m[1]
    if (m[2].startsWith('day')) return at(n)
    if (m[2].startsWith('week')) return at(n * 7)
    const x = startOf(TODAY); x.setMonth(x.getMonth() + n); return x
  }],
  [/\b(next )?(sunday|monday|tuesday|wednesday|thursday|friday|saturday|sun|mon|tues|tue|weds|wed|thurs|thur|thu|fri|sat)\b/, (m) => {
    let n = (WDAY[m[2]] - TODAY.getDay() + 7) % 7 || 7
    if (m[1]) n += n < 7 ? 7 : 0
    return at(n)
  }],
  [/\b(\d{1,2})(?:st|nd|rd|th)? (jan|feb|mar|apr|may|jun|jul|aug|sept|sep|oct|nov|dec)[a-z]*\b/, (m) => monthDay(MON[m[2]], +m[1])],
  [/\b(jan|feb|mar|apr|may|jun|jul|aug|sept|sep|oct|nov|dec)[a-z]* (\d{1,2})(?:st|nd|rd|th)?\b/, (m) => monthDay(MON[m[1]], +m[2])],
  [/\b(\d{1,2})\/(\d{1,2})\b/, (m) => monthDay(+m[2] - 1, +m[1])],
  [/\b(?:the )?(\d{1,2})(?:st|nd|rd|th)\b/, (m) => nthOfMonth(+m[1])],
]
/** "25th" on its own: this month, or next month if the day has passed. */
function nthOfMonth(d) {
  if (d < 1 || d > 31) return null
  const x = new Date(TODAY.getFullYear(), TODAY.getMonth(), d)
  if (x < startOf(TODAY)) x.setMonth(x.getMonth() + 1)
  return x
}
function monthDay(mo, d) {
  if (mo == null || d < 1 || d > 31) return null
  const x = new Date(TODAY.getFullYear(), mo, d)
  if (x < startOf(TODAY)) x.setFullYear(x.getFullYear() + 1)
  return x
}
const TIME_RULES = [
  [/\b(?:at )?(\d{1,2})(?::(\d{2}))? ?(am|pm)\b/, (m) => [((+m[1] % 12) + (m[3] === 'pm' ? 12 : 0)), +(m[2] || 0)]],
  [/\bat (\d{1,2}):(\d{2})\b/, (m) => [+m[1], +m[2]]],
  [/\bat (\d{1,2})\b(?![:\d])/, (m) => [+m[1] < 8 ? +m[1] + 12 : +m[1], 0]],
  [/\bnoon\b/, () => [12, 0]],
]
/** Finds a due date in free text. Returns { date, spans:[[start,end]], label } or null. */
export function parseDate(text) {
  const lo = text.toLowerCase()
  const spans = []
  let date = null
  for (const [re, fn] of DATE_RULES) {
    const m = new RegExp(PRE + re.source).exec(lo)
    if (!m) continue
    const inner = re.exec(m[0].replace(/^(?:by|on|due|before|for)\s+/, ''))
    const d = inner && fn(inner)
    if (!d) continue
    date = d; spans.push([m.index, m.index + m[0].length]); break
  }
  let hm = null
  for (const [re, fn] of TIME_RULES) {
    const m = re.exec(lo)
    if (!m) continue
    if (spans.some(([a, b]) => m.index < b && m.index + m[0].length > a)) continue
    const [h, mi] = fn(m)
    if (h > 23 || mi > 59) continue
    hm = [h, mi]; spans.push([m.index, m.index + m[0].length]); break
  }
  if (!date && !hm) return null
  if (!date) date = hm[0] * 60 + hm[1] > TODAY.getHours() * 60 + TODAY.getMinutes() ? at(0) : at(1)
  if (hm) { date = new Date(date); date.setHours(hm[0], hm[1], 0, 0) }
  return { date, spans: spans.sort((a, b) => a[0] - b[0]), label: dueLabel(date), key: spans.map(([a, b]) => lo.slice(a, b)).join('|') }
}
/** "from mon to fri", "from today till 25th": a timeline. Returns parseDate's shape plus `start`. */
export function parseRange(text) {
  const lo = text.toLowerCase()
  const m = /\b(?:from|starting)\s+/.exec(lo)
  if (!m) return null
  const a0 = m.index + m[0].length
  const sep = /\s+(?:to|till|until|through|thru|-|–)\s+/.exec(lo.slice(a0))
  if (!sep) return null
  const a = parseDate(lo.slice(a0, a0 + sep.index))
  if (!a) return null
  const b0 = a0 + sep.index + sep[0].length
  const b = parseDate(lo.slice(b0))
  if (!b || b.spans[0][0] > 3) return null
  const start = a.date, due = b.date
  if (due < start) return null
  const end = b0 + Math.max(...b.spans.map((x) => x[1]))
  return { start, date: due, spans: [[m.index, end]], label: dueLabel(start).replace(/ \d.*$/, '') + ' → ' + dueLabel(due), key: lo.slice(m.index, end) }
}
/** Cut spans out of text and tidy the spaces they leave behind. */
export const cut = (text, spans) => {
  let out = text
  for (const [a, b] of [...spans].sort((x, y) => y[0] - x[0])) out = out.slice(0, a) + ' ' + out.slice(b)
  return out.replace(/\s+([,.;:!?])/g, '$1').replace(/\s{2,}/g, ' ').replace(/[\s,;:–-]+$/, '').trim()
}

/* ───────── Phone numbers ───────── */
const PHONE_RE = /(?<![\w+])(?:\+?91[\s-]?|0)?[6-9](?:[\s-]?\d){9}(?!\d)/g
export const digits10 = (s) => String(s || '').replace(/\D/g, '').slice(-10)
export const fmtPhone = (s) => { const d = digits10(s); return '+91 ' + d.slice(0, 5) + ' ' + d.slice(5) }
export function findPhones(text) {
  return [...text.matchAll(PHONE_RE)].map((m) => ({ raw: m[0], start: m.index, end: m.index + m[0].length, digits: digits10(m[0]) })).filter((p) => p.digits.length === 10)
}

/* ───────── What we already hold: the @ index ───────── */
const hueOf = (n) => (n.length * 37 + n.charCodeAt(0) * 11) % 360
let cache = { key: null, idx: null }
/** Brands, people, deals, campaigns and invoices, each as { kind, id, label, sub, logo, brand, phone }. Rebuilt when the store changes. */
export function indexOf(s) {
  const st = s.sales
  const key = [st.db, st.contacts, st.inbound, st.deals, s.campaigns, s.invoices, s.vendors, meId()]
  if (cache.key && cache.key.every((x, i) => x === key[i])) return cache.idx
  const seen = new Set()
  const co = dbCompanies(st).filter((c) => { const k = c.name.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true })
    .map((c) => ({ kind: 'brand', id: c.id, label: c.name, sub: c.cat || '', logo: c.name, brand: c.name }))
  const pod = clients.filter((c) => !seen.has(c.name.toLowerCase())).map((c) => ({ kind: 'brand', id: 'kb:' + c.id, label: c.name, sub: c.industry || 'Client', logo: c.name, brand: c.name }))
  const people = [
    ...st.contacts.map((p) => ({ kind: 'person', id: p.id, label: p.name, sub: [p.title, p.brand].filter(Boolean).join(' · '), brand: p.brand, phone: p.phone || PHONES[p.id] || null, hue: hueOf(p.name) })),
    ...st.inbound.map((x) => ({ kind: 'person', id: x.id, label: x.name, sub: 'Inbound · ' + x.company, brand: x.company, phone: x.phone || PHONES[x.id] || null, hue: hueOf(x.name) })),
    ...[...brands, ...extras].flatMap((b) => b.people.map((p) => ({ kind: 'person', id: p.id, label: p.name, sub: p.title + ' · ' + b.name, brand: b.name, phone: PHONES[p.id] || p.phone, hue: hueOf(p.name) }))),
  ]
  const deals = st.deals.map((d) => ({ kind: 'deal', id: d.id, label: d.brand + ' deal', sub: d.code + ' · ' + ({ new: 'New lead', brief: 'Brief', negotiation: 'Negotiation', pitch: 'Pitch', won: 'Won', lost: 'Closed lost' }[d.stage] || d.stage), logo: d.brand, brand: d.brand }))
  const camps = s.campaigns.map((c) => ({ kind: 'campaign', id: c.id, label: c.name, sub: c.code + ' · ' + c.pod, logo: c.client, brand: c.client }))
  const invs = s.invoices.map((x) => ({ kind: 'invoice', id: x.id, label: x.no, sub: x.vendor.name + ' · ' + x.campaign, brand: x.campaign.split(' × ')[0] }))
  const vends = (s.vendors || []).map((v) => ({ kind: 'vendor', id: v.id, label: v.name, sub: v.kind + ' · ' + v.role, brand: null, hue: hueOf(v.name) }))
  // Teammates: picking one assigns the to-do rather than linking it.
  const crew = team.map((u) => ({ kind: 'member', id: u.id, label: u.name, sub: u.id === meId() ? 'You · ' + u.role : u.role, hue: u.hue, short: u.short }))
  const byPhone = {}
  people.forEach((p) => { if (p.phone && !byPhone[digits10(p.phone)]) byPhone[digits10(p.phone)] = p })
  const idx = { all: [...co, ...pod, ...people, ...deals, ...camps, ...invs, ...vends, ...crew], byPhone, co: [...co, ...pod], byName: {} }
  idx.all.forEach((e) => { const k = e.label.toLowerCase(); if (!idx.byName[k]) idx.byName[k] = e })
  cache = { key, idx }
  return idx
}
export const KIND_ORDER = ['brand', 'person', 'deal', 'campaign', 'invoice', 'vendor', 'member']
export const KIND_LABEL = { brand: 'Companies', person: 'People', deal: 'Deals', campaign: 'Campaigns', invoice: 'Invoices', vendor: 'Creators & vendors', member: 'Assign to' }
export const KIND_ONE = { brand: 'Company', person: 'Person', deal: 'Deal', campaign: 'Campaign', invoice: 'Invoice', vendor: 'Creator', member: 'Teammate', phone: 'Phone' }
const CAP = { brand: 5, person: 4, deal: 3, campaign: 3, invoice: 3, vendor: 3, member: 3 }
/** Picker results for "@query": grouped in KIND_ORDER, best first. */
export function search(idx, q) {
  const t = q.trim().toLowerCase()
  const score = (e) => {
    const l = e.label.toLowerCase()
    if (!t) return e.kind === 'brand' || e.kind === 'deal' || e.kind === 'campaign' || e.kind === 'member' ? 0 : 9
    if (e.kind === 'member' && e.short.toLowerCase().startsWith(t)) return 0
    if (l.startsWith(t)) return 0
    if (l.split(/[\s×·.-]+/).some((w) => w.startsWith(t))) return 1
    if (l.includes(t)) return 2
    if (t.length > 2 && e.sub.toLowerCase().includes(t)) return 3
    return 9
  }
  const out = []
  for (const k of KIND_ORDER) {
    const list = idx.all.filter((e) => e.kind === k).map((e) => [score(e), e]).filter(([s]) => s < 9).sort((a, b) => a[0] - b[0] || a[1].label.length - b[1].label.length)
    out.push(...list.slice(0, t ? CAP[k] : k === 'brand' ? 4 : k === 'deal' ? 3 : k === 'campaign' ? 2 : k === 'member' ? 3 : 0).map(([, e]) => e))
  }
  return out
}
/** "@Rare Rabbit t…": the name is complete once the next word can't continue any label. */
export function settled(idx, q) {
  const t = q.toLowerCase()
  if (!t.includes(' ')) return null
  if (idx.all.some((e) => e.label.toLowerCase().startsWith(t))) return null
  const hits = idx.all.filter((e) => t.startsWith(e.label.toLowerCase() + ' '))
  if (!hits.length) return null
  return hits.sort((a, b) => b.label.length - a.label.length || KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind))[0]
}
export const exact = (idx, q) => { const t = q.trim().toLowerCase(); return t ? idx.all.filter((e) => e.label.toLowerCase() === t).sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind))[0] || null : null }

/** A stored link from an index entry. */
export const linkOf = (e) => ({ kind: e.kind, id: e.id, label: e.label, brand: e.brand || null })
export const phoneLink = (p, idx) => {
  const who = idx.byPhone[p.digits]
  return { kind: 'phone', id: p.digits, label: fmtPhone(p.digits), brand: who?.brand || null, person: who ? { id: who.id, name: who.label } : null }
}

/* ───────── Where a link goes ───────── */
const can = (r) => view().roles.includes(r)
const clientId = (name) => clients.find((c) => c.name.toLowerCase() === String(name || '').toLowerCase())?.id
function brandHref(id, name) {
  if (String(id).startsWith('kb:')) return (can('pod') ? '/pod/kb/' : '/bd/kb/') + id.slice(3)
  if (can('bd') && (brandOf(name) || id)) return companyHref({ id: brandOf(name)?.id || id }).slice(1)
  const c = clientId(name)
  return c ? (can('pod') ? '/pod/kb/' : '/bd/kb/') + c : null
}
export function hrefOf(l) {
  if (l.kind === 'brand') return brandHref(l.id, l.label)
  if (l.kind === 'deal') return can('bd') ? '/bd/pipeline/' + l.id : null
  if (l.kind === 'campaign') return can('pod') ? '/pod/campaigns/' + l.id : can('finance') ? '/finance/campaigns' : null
  if (l.kind === 'invoice') return can('finance') ? '/finance/invoices' : can('pod') ? '/pod/approvals' : null
  if (l.kind === 'person') return l.brand ? brandHref(brandOf(l.brand)?.id || '', l.brand) : null
  if (l.kind === 'vendor') return can('finance') ? '/finance/vendors' : null
  return null
}

/* ───────── Page context: what's on screen ───────── */
/** The record a page is about, as { links (to pre-link), keys, brand, label }. Null on lists. */
export function pageCtx(path, s) {
  const p = path.split('/').filter(Boolean)
  if (p[0] === 'bd' && p[1] === 'pipeline' && p[2]) {
    const d = s.sales.deals.find((x) => x.id === p[2])
    if (!d) return null
    const l = { kind: 'deal', id: d.id, label: d.brand + ' deal', brand: d.brand }
    return { links: [l], keys: new Set(['deal:' + d.id]), brand: d.brand, label: d.brand, logo: d.brand }
  }
  if (p[0] === 'bd' && ['discover', 'companies', 'accounts'].includes(p[1]) && p[2] && !p[2].startsWith('~')) {
    const acct = s.sales.accounts.find((a) => a.id === p[2])
    const c = dbCompanies(s.sales).find((x) => x.id === p[2]) || (acct ? brandOf(acct.brand) || { id: acct.id, name: acct.brand } : null)
    if (!c) return null
    return { links: [{ kind: 'brand', id: c.id, label: c.name, brand: c.name }], keys: new Set(['brand:' + c.id]), brand: c.name, label: c.name, logo: c.name }
  }
  if (p[0] === 'pod' && p[1] === 'campaigns' && p[2]) {
    const c = s.campaigns.find((x) => x.id === p[2])
    if (!c) return null
    return { links: [{ kind: 'campaign', id: c.id, label: c.name, brand: c.client }], keys: new Set(['campaign:' + c.id]), brand: c.client, label: c.name, logo: c.client }
  }
  if ((p[0] === 'pod' || p[0] === 'bd') && p[1] === 'kb' && p[2]) {
    const c = clients.find((x) => x.id === p[2])
    if (!c) return null
    return { links: [{ kind: 'brand', id: 'kb:' + c.id, label: c.name, brand: c.name }], keys: new Set(['brand:kb:' + c.id]), brand: c.name, label: c.name, logo: c.name }
  }
  return null
}
/** Linked to a record: directly, or through its brand (a deal's to-dos include the brand's). */
export const linkedTo = (t, ctx) => !!ctx && t.links.some((l) => ctx.keys.has(l.kind + ':' + l.id) || (ctx.brand && l.brand && l.brand.toLowerCase() === ctx.brand.toLowerCase()))
export const brandOfItem = (t) => t.links.find((l) => l.brand)?.brand || null
export const colorOf = (name) => brandOf(name)?.color || null

/* ───────── Text with chips ───────── */
/** Splits item text into strings and links; links whose label isn't in the text trail at the end. */
export function segments(text, links) {
  const hits = []
  const lo = text.toLowerCase()
  const order = links.map((l, i) => [l, i]).sort((a, b) => b[0].label.length - a[0].label.length)
  const trail = []
  for (const [l] of order) {
    const needle = l.label.toLowerCase()
    let from = 0, pos = -1
    while ((pos = lo.indexOf(needle, from)) !== -1) {
      const end = pos + needle.length
      if (!hits.some((h) => pos < h.end && end > h.start)) break
      from = pos + 1
    }
    if (pos === -1 || !needle) trail.push(l)
    else hits.push({ start: pos, end: pos + needle.length, l })
  }
  hits.sort((a, b) => a.start - b.start)
  const out = []
  let i = 0
  for (const h of hits) { if (h.start > i) out.push(text.slice(i, h.start)); out.push(h.l); i = h.end }
  if (i < text.length) out.push(text.slice(i))
  return { parts: out, trail: links.filter((l) => trail.includes(l)) }
}
