// Prospecting engine shared by every BD layout: one global filter over signals, companies, people, inbound,
// moments, account alerts and follow-ups; heat; the stream's ranking; Apollo (simulated) fetches.
import { toast } from 'sonner'
import { TODAY, fmt, me, clients, SERVICES } from '../data'
import { brands, extras, apollo, brandById, brandOf, moments, budgetOf, domainOf, FUNDING, SIGNAL_KIND, F_EMPTY } from './data'
import { relOf } from './state'
import { dueOf } from './ui'

/* ───────── Layouts (Settings › Preferences › BD layout) ───────── */
export const LAYOUTS = [
  { value: 'sources', label: 'Sources (old)', desc: 'One page per lead source.' },
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
let layout = 'prospect'
/** App sets this every render (like the persona), so links can point at the right company page. */
export const setBdLayout = (v) => { layout = v || 'prospect' }
export const companyHref = (c) => '#' + (layout === 'accounts' ? '/bd/companies/' : '/bd/discover/') + c.id

/* ───────── Filter vocabulary ───────── */
const SIZE_B = { '1-50': [1, 49], '50-200': [50, 200], '200-1000': [201, 1000], '1000-5000': [1001, 5000], '5000+': [5001, Infinity] }
const DEAL_B = { lt10: [0, 10e5], '10-25': [10e5, 25e5], '25-50': [25e5, 50e5], '50+': [50e5, Infinity] }
const REC = { '1d': 1, '7d': 7, '14d': 14, '30d': 30 }
const ALL_CATS = [...new Set([...brands, ...extras, ...apollo].map((b) => b.cat))].sort()
const ALL_CITIES = [...new Set([...brands, ...extras, ...apollo].map((b) => b.hq))].sort()
export const ROLES_P = ['CXO', 'Head', 'Manager', 'Lead']
export const DEPTS = ['Marketing', 'Brand', 'Growth', 'Digital & social', 'Founder office']
/** Filter groups, so a reader knows what each filter narrows. Company facts reach every tab; the rest narrow their own entity
    and, through it, the companies behind it (one global filter). */
export const GROUPS = [
  { id: 'company', label: 'Company', hint: 'Company facts. They narrow every tab.' },
  { id: 'signal', label: 'Signals', hint: 'Narrow signals, and the companies behind them.' },
  { id: 'people', label: 'People', hint: 'Narrow people, and the companies they work at.' },
  { id: 'activity', label: 'Activity', hint: 'What shows in Stream: inbound, moments, alerts and follow-ups.' },
]
export const FILTERS = [
  { id: 'co', pl: 'Specific companies', label: 'Company', group: 'company', search: true, opts: [] }, // options come from our DB (optsOf)
  { id: 'funding', pl: 'Funding', label: 'Funding', group: 'company', opts: FUNDING.map((x) => [x, x]) },
  { id: 'size', pl: 'Team size', label: 'Employees', group: 'company', opts: [['1-50', '1–50'], ['50-200', '50–200'], ['200-1000', '200–1,000'], ['1000-5000', '1,000–5,000'], ['5000+', '5,000+']] },
  { id: 'cat', pl: 'Industry', label: 'Industry', group: 'company', search: true, opts: ALL_CATS.map((x) => [x, x]) },
  { id: 'city', pl: 'City', label: 'City', group: 'company', search: true, opts: ALL_CITIES.map((x) => [x, x]) },
  { id: 'rel', pl: 'Relationship', label: 'Relationship', group: 'company', opts: [['client', 'Client'], ['warm', 'Warm'], ['cold', 'Cold']] },
  { id: 'kind', pl: 'Type', label: 'Signal', group: 'signal', opts: Object.entries(SIGNAL_KIND) },
  { id: 'recency', pl: 'Within', seg: { '1d': 'Day', '7d': 'Week', '14d': '2 weeks', '30d': 'Month' }, label: 'Recency', group: 'signal', single: true, opts: [['1d', 'Last day'], ['7d', 'Last week'], ['14d', 'Last 2 weeks'], ['30d', 'Last 30 days']] },
  { id: 'fit', pl: 'Service fit', label: 'Service fit', group: 'signal', opts: ['memd', 'inf', 'amp', 'cc', 'tt', 'solo', 'off'].map((k) => [k, SERVICES[k].label]) },
  { id: 'relevance', pl: 'Relevance', label: 'BD relevance', group: 'signal', opts: [['high', 'High'], ['med', 'Medium'], ['low', 'Low']] },
  { id: 'deal', pl: 'Deal size', label: 'Deal size', group: 'signal', opts: [['lt10', 'Under ₹10L'], ['10-25', '₹10–25L'], ['25-50', '₹25–50L'], ['50+', '₹50L+']] },
  { id: 'role', pl: 'Seniority', label: 'Seniority', group: 'people', opts: ROLES_P.map((x) => [x, x]) },
  { id: 'dept', pl: 'Department', label: 'Department', group: 'people', opts: DEPTS.map((x) => [x, x]) },
  { id: 'contact', pl: 'Contact', seg: { known: 'On file', locked: 'Needs reveal' }, label: 'Contact', group: 'people', single: true, opts: [['known', 'On file · free'], ['locked', 'Needs a reveal']] },
  { id: 'pflag', pl: 'Movement', label: 'Movement', group: 'people', opts: [['new', 'New in role'], ['moved', 'Moved in from a brand']] },
  { id: 'types', pl: 'Show', label: 'Type', group: 'activity', opts: [['signal', 'Signals'], ['inbound', 'Inbound'], ['moment', 'Moments'], ['alert', 'Account alerts'], ['follow', 'Follow-ups']] },
  { id: 'owner', pl: 'Owner', seg: { mine: 'Mine', unclaimed: 'Unclaimed' }, label: 'Owner', group: 'activity', single: true, opts: [['mine', 'Mine'], ['unclaimed', 'Unclaimed']] },
]
/** Search scopes: what the search box looks at. */
export const SCOPES = [['all', 'All'], ['companies', 'Companies'], ['people', 'People'], ['signals', 'Signals']]
/** Options for a filter. Company names come from our DB, so they grow as Apollo fetches land. */
export const optsOf = (def, st) => (def.id === 'co' ? dbCompanies(st).map((c) => [c.id, c.name]).sort((a, b) => a[1].localeCompare(b[1])) : def.opts)
/** Filter placement, set by Shell from Settings > Preferences > BD filters. */
let fmode = 'bar'
export const setBdFilters = (v) => { fmode = v === 'panel' ? 'panel' : 'bar' }
export const bdFilters = () => fmode
let fside = 'left'
export const setBdFilterSide = (v) => { fside = v === 'right' ? 'right' : 'left' }
export const bdFilterSide = () => fside
/** What a new search looks at: the Prospecting tab you are on, otherwise everything. A search keeps the scope it was made in. */
let sscope = 'all'
export const setSearchScope = (v) => { sscope = v || 'all' }
export const searchScope = () => sscope
export const filterById = Object.fromEntries(FILTERS.map((x) => [x.id, x]))
const on = (v) => (Array.isArray(v) ? v.length > 0 : !!v)
export const activeCount = (f) => FILTERS.filter((x) => on(f[x.id])).length + (f.q ? 1 : 0)
const SCOPE_L = { companies: 'Companies', people: 'People', signals: 'Signals' }
/** One-line summary: "Series B · 50–200". */
export const describe = (f) => FILTERS.flatMap((x) => {
  const v = f[x.id]
  if (!on(v)) return []
  const lab = (k) => x.opts.find((o) => o[0] === k)?.[1] || (x.id === 'co' ? (brandById(k)?.name || k.replace(/^x-/, '').replace(/-/g, ' ')) : k)
  return Array.isArray(v) ? (v.length > 2 ? [x.label + ' ' + v.length] : v.map(lab)) : [lab(v)]
}).concat(f.q ? [(SCOPE_L[f.scope] ? SCOPE_L[f.scope] + ' ' : '') + '“' + f.q + '”'] : []).join(' · ')

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
export const deptOf = (title = '') => (/Founder|CEO|COO|Chief Executive/.test(title) ? 'Founder office' : /Growth|Performance|Acquisition/.test(title) ? 'Growth' : /Digital|Social|Content|Community/.test(title) ? 'Digital & social' : /Brand|Category/.test(title) ? 'Brand' : 'Marketing')
const peopleLevel = (f) => on(f.role) || on(f.dept) || on(f.contact) || on(f.pflag)
function personMatch(p, f, st) {
  return (!on(f.role) || f.role.includes(roleOf(p.title)))
    && (!on(f.dept) || f.dept.includes(deptOf(p.title)))
    && (!on(f.contact) || (f.contact === 'known') === isKnown(p, st))
    && (!on(f.pflag) || f.pflag.some((k) => (k === 'new' ? !!p.born : !!p.moved)))
}
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
  if (!c) return !(on(f.funding) || on(f.size) || on(f.cat) || on(f.city) || on(f.rel) || on(f.co))
  return (!on(f.funding) || f.funding.includes(c.funding))
    && (!on(f.size) || f.size.some((k) => c.size != null && c.size >= SIZE_B[k][0] && c.size <= SIZE_B[k][1]))
    && (!on(f.cat) || f.cat.includes(c.cat))
    && (!on(f.city) || f.city.includes(c.hq))
    && (!on(f.rel) || f.rel.includes(relKind(c, st)))
    && (!on(f.co) || f.co.includes(c.id))
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
const coLevel = (f) => on(f.funding) || on(f.size) || on(f.cat) || on(f.city) || on(f.rel) || on(f.co)
const GROUP_KEYS = ['s', 'c', 'p']
/** How set filter groups combine into the Company tab. Not a filter: Clear keeps it, saved views remember it. */
export const MATCH = [['any', 'Match any'], ['all', 'Match all']]
export const VIA = { s: 'Signal', c: 'Company', p: 'People' }
export const matchOf = (f) => (f?.match === 'all' ? 'all' : 'any')

/** Everything the filter matches, in one pass. Every layout reads this.
    Search has a scope: All looks everywhere; Companies, People or Signals look only at that entity, and the other tabs
    follow from it (the companies those people work at, the signals of those companies). */
export function run(st, f = F_EMPTY) {
  const q = (f.q || '').trim()
  const scope = q ? f.scope || 'all' : 'all'
  const qAll = scope === 'all' ? q : ''
  const cos = dbCompanies(st)
  const byName = Object.fromEntries(cos.map((c) => [c.name, c]))
  // Each filter group picks a set of companies on its own (a search counts toward the group of its scope).
  const set = { s: sigLevel(f) || scope === 'signals', c: coLevel(f) || scope === 'companies', p: peopleLevel(f) || scope === 'people' }
  const coOk = new Map(cos.map((c) => [c.name, coMatch(c, f, st) && (scope !== 'companies' || has(q, c.name, c.cat, c.hq, c.about))]))
  const pBy = new Map()
  const pq = scope === 'people' ? q : ''
  if (set.p) {
    cos.forEach((c) => {
      const ps = peopleOf(c, st).filter((p) => personMatch(p, f, st) && has(pq, p.name, p.title, p.email))
      if (ps.length) pBy.set(c.name, ps)
    })
  }
  const sigQ = (g) => (scope === 'signals' ? has(q, g.title, g.intent, g.pitch, SIGNAL_KIND[g.kind]) : has(qAll, g.brand, g.title, g.intent, g.pitch))
  const sigOk = (g) => g.status !== 'dismissed' && sigMatch(g, f) && sigQ(g)
  const sNames = new Set(set.s ? st.signals.filter(sigOk).map((g) => g.brand) : [])
  /** Groups a company matched, of the groups that are set. */
  const viaOf = (n) => GROUP_KEYS.filter((k) => set[k] && (k === 's' ? sNames.has(n) : k === 'c' ? (byName[n] ? coOk.get(n) : coMatch(null, f, st)) : pBy.has(n)))
  const nSet = GROUP_KEYS.filter((k) => set[k]).length
  const any = matchOf(f) === 'any'
  // The Company tab: everything when no group is set; Match all = every set group; Match any = at least one.
  const okName = (n) => { if (!nSet) return true; const v = viaOf(n).length; return any ? v > 0 : v === nSet }

  // Signals and People: matching records when their group is set, otherwise everything; always at Company-tab companies.
  const signals = typeOk(f, 'signal') ? st.signals.filter((g) => sigOk(g) && okName(g.brand)) : []
  const sideOk = scope === 'all' || scope === 'companies' || scope === 'people' // a Signals search hides the other kinds
  // Inbound: requests at Company-tab companies.
  const inbound = sideOk && typeOk(f, 'inbound')
    ? st.inbound.filter((x) => x.status === 'open' && okName(x.company)
      && (f.owner === 'mine' ? x.owner === me.id : f.owner === 'unclaimed' ? !x.owner : true) && has(qAll, x.company, x.name, x.summary))
    : []
  const momentList = sideOk && typeOk(f, 'moment') && !on(f.kind) && !on(f.fit) && !on(f.relevance) && !on(f.deal)
    ? moments.filter((m) => daysTo(m.at) >= -0.5 && (!on(f.recency) || daysTo(m.at) <= REC[f.recency]) && (!on(f.cat) || m.cats.some((k) => f.cat.includes(k))))
      .map((m) => ({ ...m, brands: cos.filter((c) => m.cats.includes(c.cat) && okName(c.name) && (inDb(c, st))).sort((a, b) => heatRaw(b, st) - heatRaw(a, st)) }))
      .filter((m) => m.brands.length && has(qAll, m.name, ...m.brands.map((c) => c.name)))
    : []
  const alerts = sideOk && typeOk(f, 'alert') && !on(f.kind) && !on(f.fit) && f.owner !== 'unclaimed'
    ? st.accounts.filter((a) => a.alerts.length && okName(a.brand) && (f.owner !== 'mine' || a.owner === me.id) && has(qAll, a.brand, ...a.alerts.map((x) => x.text)))
    : []
  const follows = sideOk && typeOk(f, 'follow') && !on(f.kind) && !on(f.fit) && f.owner !== 'unclaimed'
    ? dueOf(st).filter((d) => okName(d.deal.brand) && (f.owner !== 'mine' || d.deal.owner === me.id) && has(qAll, d.deal.brand, d.text))
    : []

  // Companies: the Company tab. Activity filters (Stream) narrow it to the companies behind what they show.
  const entity = on(f.types) || on(f.owner)
  const behind = new Set([...signals.map((g) => g.brand), ...inbound.map((x) => x.company), ...alerts.map((a) => a.brand), ...(on(f.types) ? momentList.flatMap((m) => m.brands.slice(0, 3).map((c) => c.name)) : [])])
  const sigBy = {}; signals.forEach((g) => { (sigBy[g.brand] ||= []).push(g) })
  const union = any && nSet > 1
  const companies = cos.filter((c) => okName(c.name) && (entity ? behind.has(c.name) : !qAll || has(qAll, c.name, c.cat, c.hq, c.about) || (sigBy[c.name]?.length > 0)))
    .map((c) => ({ c, sigs: sigBy[c.name] || [], inb: inbound.filter((x) => x.company === c.name).length, heat: heat(c, st), match: pBy.get(c.name)?.length || 0, via: union ? viaOf(c.name) : [] }))
    .sort((a, b) => b.via.length - a.via.length || b.sigs.length - a.sigs.length || b.heat - a.heat || a.c.name.localeCompare(b.c.name))
  const people = typeOk(f, 'person') || !on(f.types)
    ? companies.flatMap(({ c }) => (set.p ? pBy.get(c.name) || [] : peopleOf(c, st)))
      .filter((p) => !qAll || has(qAll, p.name, p.title, p.brand))
      .sort((a, b) => (b.born ? 1 : 0) - (a.born ? 1 : 0) || (isKnown(b, st) ? 1 : 0) - (isKnown(a, st) ? 1 : 0))
    : []
  return { signals: [...signals].sort((a, b) => b.at - a.at), companies, people, inbound, moments: momentList, alerts, follows, union }
}

/** Per-option counts for the side panel: how many results each option would give, all other filters kept.
    Company facets count companies, signal facets count signals, people facets count people. */
export function facetCounts(st, f) {
  const out = {}
  for (const def of FILTERS) {
    if (def.group === 'activity' || def.id === 'co') continue
    const base = run(st, { ...f, [def.id]: def.single ? '' : [] })
    const m = {}
    const bump = (k) => { m[k] = (m[k] || 0) + 1 }
    if (def.group === 'company') {
      for (const { c } of base.companies) {
        if (def.id === 'funding') bump(c.funding)
        else if (def.id === 'cat') bump(c.cat)
        else if (def.id === 'city') bump(c.hq)
        else if (def.id === 'rel') bump(relKind(c, st))
        else if (def.id === 'size') { for (const k of Object.keys(SIZE_B)) { if (c.size != null && c.size >= SIZE_B[k][0] && c.size <= SIZE_B[k][1]) bump(k) } }
      }
    } else if (def.group === 'signal') {
      for (const g of base.signals) {
        if (def.id === 'kind') bump(g.kind)
        else if (def.id === 'relevance') bump(g.relevance)
        else if (def.id === 'fit') (g.fit || []).forEach(bump)
        else if (def.id === 'recency') { for (const k of Object.keys(REC)) { if (daysAgo(g.at) <= REC[k]) bump(k) } }
        else if (def.id === 'deal') { for (const k of Object.keys(DEAL_B)) { if (inB(g.dealSize, DEAL_B[k])) bump(k) } }
      }
    } else if (def.group === 'people') {
      for (const p of base.people) {
        if (def.id === 'role') bump(roleOf(p.title))
        else if (def.id === 'dept') bump(deptOf(p.title))
        else if (def.id === 'contact') bump(isKnown(p, st) ? 'known' : 'locked')
        else if (def.id === 'pflag') { if (p.born) bump('new'); if (p.moved) bump('moved') }
      }
    }
    out[def.id] = m
  }
  return out
}

/** Quick lookup for the search box: a few companies, people and signals by name, title or headline. */
export function quickFind(st, q, scope = 'all') {
  q = q.trim().toLowerCase()
  if (!q) return { companies: [], people: [], signals: [] }
  const hit = (...t) => t.some((x) => x && String(x).toLowerCase().includes(q))
  const starts = (x) => (String(x).toLowerCase().startsWith(q) ? 0 : 1)
  const cos = dbCompanies(st)
  const companies = scope === 'all' || scope === 'companies' ? cos.filter((c) => hit(c.name, scope === 'companies' && c.cat, scope === 'companies' && c.hq)).sort((a, b) => starts(a.name) - starts(b.name) || a.name.localeCompare(b.name)).slice(0, 5) : []
  const people = scope === 'all' || scope === 'people' ? cos.flatMap((c) => peopleOf(c, st)).filter((p) => hit(p.name, p.title)).sort((a, b) => starts(a.name) - starts(b.name)).slice(0, 5) : []
  const signals = scope === 'all' || scope === 'signals' ? st.signals.filter((g) => g.status !== 'dismissed' && hit(g.title, g.intent, scope === 'all' && g.brand)).sort((a, b) => b.at - a.at).slice(0, 4) : []
  return { companies, people, signals }
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
