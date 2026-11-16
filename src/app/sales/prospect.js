// Prospecting engine shared by every BD layout: one global filter over signals, companies, people, inbound,
// moments, account alerts and follow-ups; heat; the stream's ranking; Apollo (simulated) fetches.
import { toast } from 'sonner'
import { TODAY, fmt, me, clients, SERVICES } from '../data'
import { brands, extras, apollo, brandById, brandOf, moments, budgetOf, domainOf, FUNDING, SIGNAL_KIND, F_EMPTY } from './data'
import { relOf } from './state'
import { dueOf } from './ui'

/* ───────── Layouts (Settings › Preferences › BD layout) ───────── */
export const LAYOUTS = [
  { value: 'sources', label: 'Sources', desc: 'One page per lead source.' },
  { value: 'prospect', label: 'Prospecting', desc: 'One global filter across Signals, Companies, People and Inbound.' },
  { value: 'accounts', label: 'Companies first', desc: 'Everything rolls up to the company.' },
  { value: 'stream', label: 'Stream', desc: 'One stream of everything, sorted by what to do next.' },
]
export const BD_HOME = { sources: '/bd/feed', prospect: '/bd/prospect', accounts: '/bd/companies', stream: '/bd/stream' }
/** Pages each layout owns. Anything else under /bd redirects to the layout's home. */
export const BD_PAGES = {
  sources: ['feed', 'discover', 'inbound', 'accounts', 'contacts', 'pipeline', 'cases', 'kb', 'dashboard', 'outreach', 'proposals'],
  prospect: ['prospect', 'discover', 'accounts', 'pipeline', 'cases', 'kb'],
  accounts: ['companies', 'discover', 'accounts', 'pipeline', 'cases', 'kb'],
  stream: ['stream', 'discover', 'accounts', 'pipeline', 'cases', 'kb'],
}
let layout = 'sources'
/** App sets this every render (like the persona), so links can point at the right company page. */
export const setBdLayout = (v) => { layout = v || 'sources' }
export const companyHref = (c) => '#' + (layout === 'accounts' ? '/bd/companies/' : '/bd/discover/') + c.id

/* ───────── Filter vocabulary ───────── */
const SIZE_B = { '1-50': [1, 49], '50-200': [50, 200], '200-1000': [201, 1000], '1000-5000': [1001, 5000], '5000+': [5001, Infinity] }
const DEAL_B = { lt10: [0, 10e5], '10-25': [10e5, 25e5], '25-50': [25e5, 50e5], '50+': [50e5, Infinity] }
const REC = { '1d': 1, '7d': 7, '14d': 14, '30d': 30 }
const ALL_CATS = [...new Set([...brands, ...extras, ...apollo].map((b) => b.cat))].sort()
const ALL_CITIES = [...new Set([...brands, ...extras, ...apollo].map((b) => b.hq))].sort()
export const ROLES_P = ['CXO', 'Head', 'Manager', 'Lead']
export const FILTERS = [
  { id: 'funding', label: 'Funding', opts: FUNDING.map((x) => [x, x]) },
  { id: 'size', label: 'Employees', opts: [['1-50', '1–50'], ['50-200', '50–200'], ['200-1000', '200–1,000'], ['1000-5000', '1,000–5,000'], ['5000+', '5,000+']] },
  { id: 'cat', label: 'Industry', opts: ALL_CATS.map((x) => [x, x]) },
  { id: 'city', label: 'City', opts: ALL_CITIES.map((x) => [x, x]) },
  { id: 'kind', label: 'Signal', opts: Object.entries(SIGNAL_KIND) },
  { id: 'recency', label: 'Recency', single: true, opts: [['1d', 'Last day'], ['7d', 'Last week'], ['14d', 'Last 2 weeks'], ['30d', 'Last 30 days']] },
  { id: 'rel', label: 'Relationship', opts: [['client', 'Client'], ['warm', 'Warm'], ['cold', 'Cold']] },
  { id: 'fit', label: 'Service fit', opts: ['memd', 'inf', 'amp', 'cc', 'tt', 'solo', 'off'].map((k) => [k, SERVICES[k].label]) },
  { id: 'relevance', label: 'BD relevance', opts: [['high', 'High'], ['med', 'Medium'], ['low', 'Low']] },
  { id: 'deal', label: 'Deal size', opts: [['lt10', 'Under ₹10L'], ['10-25', '₹10–25L'], ['25-50', '₹25–50L'], ['50+', '₹50L+']] },
  { id: 'role', label: 'Role', opts: ROLES_P.map((x) => [x, x]) },
  { id: 'types', label: 'Type', opts: [['signal', 'Signals'], ['inbound', 'Inbound'], ['moment', 'Moments'], ['alert', 'Account alerts'], ['follow', 'Follow-ups']] },
  { id: 'owner', label: 'Owner', single: true, opts: [['mine', 'Mine'], ['unclaimed', 'Unclaimed']] },
]
export const filterById = Object.fromEntries(FILTERS.map((x) => [x.id, x]))
const on = (v) => (Array.isArray(v) ? v.length > 0 : !!v)
export const activeCount = (f) => FILTERS.filter((x) => on(f[x.id])).length + (f.q ? 1 : 0)
/** One-line summary: "Series B · 50–200". */
export const describe = (f) => FILTERS.flatMap((x) => {
  const v = f[x.id]
  if (!on(v)) return []
  const lab = (k) => x.opts.find((o) => o[0] === k)?.[1] || k
  return Array.isArray(v) ? (v.length > 2 ? [x.label + ' ' + v.length] : v.map(lab)) : [lab(v)]
}).concat(f.q ? ['“' + f.q + '”'] : []).join(' · ')

/* ───────── Companies and people in our DB ───────── */
const slug = (n) => n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const isApollo = (c) => apollo.includes(c)
export const companyById = (id, st) => brandById(id) || st.db.stubs.find((x) => x.id === id) || null
export const companyByName = (name, st) => brandOf(name) || st.db.stubs.find((x) => x.name.toLowerCase() === String(name).toLowerCase()) || null
export const inDb = (c, st) => !!c && (!isApollo(c) || st.db.co.includes(c.id))
export const dbCompanies = (st) => [...brands, ...extras, ...apollo.filter((c) => st.db.co.includes(c.id)), ...st.db.stubs]
/** Fetched this session: shown as "New · saved to DB". */
export const FRESH = new Set()

export const roleOf = (title = '') => (/CMO|CEO|COO|VP|Founder|Chief/.test(title) ? 'CXO' : /^Head/.test(title) ? 'Head' : /Manager|Director/.test(title) ? 'Manager' : 'Lead')
/** People a signal introduced (a new CMO): they join People on their own. */
export function bornOf(g) {
  if (!g.born) return null
  const [first, last] = g.born.name.split(' ')
  const b = brandOf(g.brand)
  return { id: 'sb-' + g.id, name: g.born.name, title: g.born.title, brand: g.brand, email: `${first.toLowerCase()}.${(last || '').toLowerCase()}@${b?.domain || domainOf(g.brand)}`, phone: null, onFile: false, moved: g.born.moved || null, city: b?.hq || null, born: g.id, at: g.at }
}
export function peopleOf(c, st) {
  if (!c) return []
  const base = isApollo(c) ? c.people.filter((p) => st.db.pe.includes(p.id)) : c.people
  const born = st.signals.filter((g) => g.born && g.brand === c.name).map(bornOf)
  return [...born, ...base]
}
export const isKnown = (p, st) => p.onFile || st.revealed.includes(p.id)
export const sigsOf = (c, st) => st.signals.filter((g) => g.brand === c.name && g.status !== 'dismissed')

/* ───────── Matching ───────── */
const daysAgo = (d) => (TODAY - d) / 864e5
const daysTo = (d) => (d - TODAY) / 864e5
const inB = (v, [lo, hi]) => v != null && v >= lo && v < hi
const has = (q, ...t) => !q || t.join(' ').toLowerCase().includes(q.toLowerCase())
export const relKind = (c, st) => { const k = relOf(c.name, st).kind; return k === 'client' ? 'client' : k === 'cold' ? 'cold' : 'warm' }
export function coMatch(c, f, st) {
  if (!c) return !(on(f.funding) || on(f.size) || on(f.cat) || on(f.city) || on(f.rel))
  return (!on(f.funding) || f.funding.includes(c.funding))
    && (!on(f.size) || f.size.some((k) => c.size != null && c.size >= SIZE_B[k][0] && c.size <= SIZE_B[k][1]))
    && (!on(f.cat) || f.cat.includes(c.cat))
    && (!on(f.city) || f.city.includes(c.hq))
    && (!on(f.rel) || f.rel.includes(relKind(c, st)))
}
const sigLevel = (f) => on(f.kind) || on(f.recency) || on(f.fit) || on(f.relevance) || on(f.deal)
const typeOk = (f, t) => !on(f.types) || f.types.includes(t)
function sigMatch(g, f) {
  return (!on(f.kind) || f.kind.includes(g.kind))
    && (!on(f.recency) || daysAgo(g.at) <= REC[f.recency])
    && (!on(f.fit) || f.fit.some((k) => g.fit?.includes(k)))
    && (!on(f.relevance) || f.relevance.includes(g.relevance))
    && (!on(f.deal) || f.deal.some((k) => inB(g.dealSize, DEAL_B[k])))
}
const inbRel = (x) => (x.budget >= 20e5 ? 'high' : x.budget >= 10e5 ? 'med' : 'low')

/** Everything the filter matches, in one pass. Every layout reads this. */
export function run(st, f = F_EMPTY) {
  const q = (f.q || '').trim()
  const cos = dbCompanies(st)
  const byName = Object.fromEntries(cos.map((c) => [c.name, c]))
  const coOk = new Map(cos.map((c) => [c.name, coMatch(c, f, st)]))
  const okName = (n) => (byName[n] ? coOk.get(n) : coMatch(null, f, st))

  const signals = typeOk(f, 'signal') ? st.signals.filter((g) => g.status !== 'dismissed' && okName(g.brand) && sigMatch(g, f) && has(q, g.brand, g.title, g.intent, g.pitch)) : []
  const inbound = typeOk(f, 'inbound') && !on(f.kind) && !on(f.fit)
    ? st.inbound.filter((x) => x.status === 'open' && okName(x.company) && (!on(f.recency) || daysAgo(x.at) <= REC[f.recency]) && (!on(f.relevance) || f.relevance.includes(inbRel(x)))
      && (!on(f.deal) || f.deal.some((k) => inB(x.budget, DEAL_B[k]))) && (f.owner === 'mine' ? x.owner === me.id : f.owner === 'unclaimed' ? !x.owner : true) && has(q, x.company, x.name, x.summary))
    : []
  const momentList = typeOk(f, 'moment') && !on(f.kind) && !on(f.fit) && !on(f.relevance) && !on(f.deal)
    ? moments.filter((m) => daysTo(m.at) >= -0.5 && (!on(f.recency) || daysTo(m.at) <= REC[f.recency]) && (!on(f.cat) || m.cats.some((k) => f.cat.includes(k))))
      .map((m) => ({ ...m, brands: cos.filter((c) => m.cats.includes(c.cat) && coOk.get(c.name) && (inDb(c, st))).sort((a, b) => heatRaw(b, st) - heatRaw(a, st)) }))
      .filter((m) => m.brands.length && has(q, m.name, ...m.brands.map((c) => c.name)))
    : []
  const alerts = typeOk(f, 'alert') && !on(f.kind) && !on(f.fit) && f.owner !== 'unclaimed'
    ? st.accounts.filter((a) => a.alerts.length && okName(a.brand) && (f.owner !== 'mine' || a.owner === me.id) && has(q, a.brand, ...a.alerts.map((x) => x.text)))
    : []
  const follows = typeOk(f, 'follow') && !on(f.kind) && !on(f.fit) && f.owner !== 'unclaimed'
    ? dueOf(st).filter((d) => okName(d.deal.brand) && (f.owner !== 'mine' || d.deal.owner === me.id) && has(q, d.deal.brand, d.text))
    : []

  // Companies: every match when only company facts are filtered; otherwise the companies behind what matched.
  const entity = sigLevel(f) || on(f.types) || on(f.owner)
  const behind = new Set([...signals.map((g) => g.brand), ...inbound.map((x) => x.company), ...alerts.map((a) => a.brand), ...(on(f.types) ? momentList.flatMap((m) => m.brands.slice(0, 3).map((c) => c.name)) : [])])
  const sigBy = {}; signals.forEach((g) => { (sigBy[g.brand] ||= []).push(g) })
  const companies = cos.filter((c) => coOk.get(c.name) && (entity ? behind.has(c.name) : has(q, c.name, c.cat, c.hq, c.about) || (sigBy[c.name]?.length > 0)))
    .map((c) => ({ c, sigs: sigBy[c.name] || [], inb: inbound.filter((x) => x.company === c.name).length, heat: heat(c, st) }))
    .sort((a, b) => b.sigs.length - a.sigs.length || b.heat - a.heat || a.c.name.localeCompare(b.c.name))
  const people = typeOk(f, 'person') || !on(f.types)
    ? companies.flatMap(({ c }) => peopleOf(c, st)).filter((p) => (!on(f.role) || f.role.includes(roleOf(p.title))) && (!q || has(q, p.name, p.title, p.brand) || has(q, p.brand)))
      .sort((a, b) => (b.born ? 1 : 0) - (a.born ? 1 : 0) || (isKnown(b, st) ? 1 : 0) - (isKnown(a, st) ? 1 : 0))
    : []
  return { signals: [...signals].sort((a, b) => b.at - a.at), companies, people, inbound, moments: momentList, alerts, follows }
}

/* ───────── Heat: recent signals × relevance, plus relationship and open inbound ───────── */
const RELW = { high: 3, med: 2, low: 1 }
const recW = (d) => (d <= 1 ? 1 : d <= 3 ? 0.85 : d <= 7 ? 0.7 : d <= 14 ? 0.5 : 0.25)
function heatRaw(c, st) {
  const s = st.signals.filter((g) => g.brand === c.name && g.status !== 'dismissed').reduce((t, g) => t + (RELW[g.relevance] || 1) * recW(daysAgo(g.at)), 0)
  const r = { client: 1.5, moved: 2, known: 1, cold: 0 }[relOf(c.name, st).kind] || 0
  const i = st.inbound.filter((x) => x.company === c.name && x.status === 'open').length * 2
  return s + r + i
}
/** 0–100, against the hottest company. */
export function heat(c, st) {
  const max = heatMax(st)
  return max ? Math.round((heatRaw(c, st) / max) * 100) : 0
}
const hm = new WeakMap()
function heatMax(st) {
  if (hm.has(st.signals) && hm.get(st.signals).inb === st.inbound) return hm.get(st.signals).v
  const v = Math.max(1, ...[...brands, ...extras].map((c) => heatRaw(c, st)))
  hm.set(st.signals, { v, inb: st.inbound })
  return v
}

/* ───────── Stream: one ranked list of what to do next ───────── */
const dealW = (v) => 1 + Math.min(v || 0, 60e5) / 60e5
export function stream(res, st) {
  const hidden = new Set(st.hidden.filter((h) => !h.until || new Date(h.until) > TODAY).map((h) => h.id))
  const cards = [
    ...res.signals.filter((g) => g.status === 'new').map((g) => ({ id: g.id, type: 'signal', brand: g.brand, at: g.at, g, score: (RELW[g.relevance] || 1) * recW(daysAgo(g.at)) * dealW(g.dealSize) })),
    ...res.inbound.map((x) => ({ id: x.id, type: 'inbound', brand: x.company, at: x.at, x, score: (RELW[inbRel(x)] + (x.owner ? 0 : 0.5)) * recW(daysAgo(x.at)) * dealW(x.budget) })),
    ...res.moments.filter((m) => daysTo(m.at) <= 30).map((m) => ({ id: m.id, type: 'moment', brand: m.brands[0]?.name, at: m.at, m, score: (daysTo(m.at) <= 7 ? 3 : daysTo(m.at) <= 14 ? 2 : 1.2) * 0.8 * dealW(25e5) })),
    ...res.alerts.map((a) => ({ id: 'al-' + a.id, type: 'alert', brand: a.brand, at: a.renewal, a, score: 3 * 0.85 * dealW(a.opps[0]?.value) })),
    ...res.follows.map((d) => ({ id: 'fu-' + d.id, type: 'follow', brand: d.deal.brand, at: d.at, d, score: 3 * (d.at <= TODAY ? 1 : 0.85) * dealW(d.deal.value) })),
  ]
  return cards.filter((c) => !hidden.has(c.id)).sort((a, b) => b.score - a.score)
}

/* ───────── Apollo (simulated) ───────── */
/** What "Search beyond our DB" would bring back: company facts only (Apollo has no signals). */
export function apolloFind(f, st, kind) {
  const q = (f.q || '').trim()
  const cos = apollo.filter((c) => coMatch(c, f, st) && (!q || has(q, c.name, c.cat, c.about) || c.people.some((p) => has(q, p.name, p.title))))
  if (kind === 'companies') return cos.filter((c) => !st.db.co.includes(c.id))
  return cos.flatMap((c) => c.people).filter((p) => !st.db.pe.includes(p.id) && (!on(f.role) || f.role.includes(roleOf(p.title))))
}
/** Spend credits and keep what came back, for good. Companies bring their people; people bring their company. */
export function apolloFetch(st, { companies = [], people = [] }) {
  const cost = companies.length + people.length
  if (!cost) return 0
  if (st.credits < cost) { toast('Not enough credits', { description: cost + ' needed · ' + st.credits + ' left' }); return -1 }
  const co = [...companies.map((c) => c.id), ...people.map((p) => brandOf(p.brand).id)]
  const pe = [...companies.flatMap((c) => c.people.map((p) => p.id)), ...people.map((p) => p.id)]
  co.forEach((id) => FRESH.add(id)); pe.forEach((id) => FRESH.add(id))
  st.set((x) => ({ credits: x.credits - cost, db: { ...x.db, co: [...new Set([...x.db.co, ...co])], pe: [...new Set([...x.db.pe, ...pe])] } }))
  toast.success('Saved to our DB', { description: [companies.length && companies.length + (companies.length === 1 ? ' company' : ' companies'), people.length && people.length + (people.length === 1 ? ' person' : ' people')].filter(Boolean).join(' · ') + ' · ' + cost + (cost === 1 ? ' credit' : ' credits') })
  return cost
}
/** Discover an unknown name: Apollo returns what it has, the rest stays Unknown. 1 credit. */
export function fetchName(st, name) {
  const c = brandOf(name)
  if (c && isApollo(c)) return apolloFetch(st, { companies: [c] }) > 0 ? c : null
  if (st.credits < 1) { toast('Out of credits'); return null }
  const stub = { id: 'x-' + slug(name), name, cat: null, hq: null, size: null, rev: null, stage: null, funding: null, about: null, competitors: [], people: [], domain: slug(name).replace(/-/g, '') + '.com', stub: true }
  FRESH.add(stub.id)
  st.set((x) => ({ credits: x.credits - 1, db: { ...x.db, stubs: [...x.db.stubs.filter((s) => s.id !== stub.id), stub] } }))
  toast.success('Saved to our DB', { description: name + ' · 1 credit · most fields Unknown on Apollo' })
  return stub
}
/** Reveal contacts: 1 credit each. */
export function revealPeople(st, list) {
  const ids = list.filter((p) => !isKnown(p, st)).map((p) => p.id)
  if (!ids.length) return
  if (st.credits < ids.length) return toast('Not enough credits', { description: ids.length + ' needed · ' + st.credits + ' left' })
  st.set((x) => ({ revealed: [...new Set([...x.revealed, ...ids])], credits: x.credits - ids.length }))
  toast.success(ids.length === 1 ? 'Contact revealed' : ids.length + ' contacts revealed', { description: ids.length + (ids.length === 1 ? ' Apollo credit' : ' Apollo credits') })
}

/* ───────── Everything we know about one company ───────── */
export function kbOf(c) {
  const k = clients.find((x) => x.name.toLowerCase() === c.name.toLowerCase())
  return k ? { id: k.id, campaigns: k.campaigns } : null
}
export const fitOf = (c, st) => [...new Set(sigsOf(c, st).flatMap((g) => g.fit || []))]
export const dealGuess = (c) => budgetOf(c)?.ours ?? null
export const fmtDays = (d) => { const n = Math.round(daysTo(d)); return n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : n > 0 ? 'in ' + n + 'd' : fmt.ago(d) }
export { daysAgo, daysTo }
