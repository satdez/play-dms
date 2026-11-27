// Apollo, simulated to the shape of the real REST API (docs.apollo.io). Only what each endpoint really returns is returned.
//   POST /api/v1/mixed_companies/search   1 credit per page, up to 100 per page. Identity only: no industry, headcount,
//                                          revenue, location or funding on the result. There is no funding-stage filter.
//   POST /api/v1/organizations/enrich      1 credit per company. Firmographics: industry, employees, revenue, funding stage.
//   POST /api/v1/mixed_people/api_search   0 credits. Last name obfuscated, no email or phone, only has_* flags.
//   POST /api/v1/people/bulk_match         Up to 10 people per call. 1 credit per person matched (demographics/email);
//                                          reveal_phone_number adds 8 credits if a mobile is found, delivered later by webhook.
// The Apollo universe is every company we model (ours included): a search returns companies we already have too.
import { toast } from 'sonner'
import { TODAY } from '../data'
import { brands, extras, apollo, brandOf } from './data'

const ALL = [...brands, ...extras, ...apollo]
const fnv = (s, h = 0x811c9dc5) => { for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) } return h >>> 0 }
const hex24 = (s) => [fnv(s), fnv(s, 0x1234567), fnv(s, 0x9abcdef)].map((n) => n.toString(16).padStart(8, '0')).join('')
const iso = (daysAgo) => new Date(TODAY.getTime() - daysAgo * 864e5).toISOString().replace('Z', '+00:00')

/* ───────── Apollo vocabulary ───────── */
/** Our category → Apollo's industry (lower-case LinkedIn taxonomy). Coarser than ours: Food and Beverage are one industry. */
export const INDUSTRY = {
  Beauty: 'cosmetics', 'Personal care': 'consumer goods', Food: 'food & beverages', Beverage: 'food & beverages', Fashion: 'apparel & fashion',
  Home: 'furniture', Travel: 'leisure, travel & tourism', Jewellery: 'luxury goods & jewelry', Electronics: 'consumer electronics',
  Fintech: 'financial services', EdTech: 'e-learning', Mobility: 'automotive', Auto: 'automotive', Fitness: 'health, wellness & fitness',
  OTT: 'entertainment', Gaming: 'computer games', 'E-commerce': 'internet', 'Quick commerce': 'internet', 'Food delivery': 'internet',
  Services: 'consumer services', Eyewear: 'retail',
}
export const RANGES = { '1-50': '1,50', '50-200': '51,200', '200-1000': '201,1000', '1000-5000': '1001,5000', '5000+': '5001,1000000' }
const STATE = { Mumbai: 'Maharashtra', Bengaluru: 'Karnataka', Delhi: 'Delhi', Gurugram: 'Haryana', Chandigarh: 'Chandigarh', Kolkata: 'West Bengal', Ahmedabad: 'Gujarat', Hyderabad: 'Telangana' }
const AREA = { Mumbai: '22', Delhi: '11', Bengaluru: '80', Gurugram: '124', Kolkata: '33', Hyderabad: '40', Ahmedabad: '79', Chandigarh: '172' }
export const SENIORITY = { CXO: 'c_suite', Head: 'head', Manager: 'manager', Lead: 'senior' }
const SEN_OF = (title = '') => (/CMO|CEO|COO|VP|Founder|Chief/.test(title) ? 'c_suite' : /^Head/.test(title) ? 'head' : /Manager|Director/.test(title) ? 'manager' : 'senior')
const inRange = (n, r) => { const [lo, hi] = r.split(',').map(Number); return n != null && n >= lo && n <= hi }
const loc = (city) => city + ', India'

/* ───────── Records, as Apollo returns them ───────── */
const coOf = new Map(ALL.map((c) => [hex24('o:' + c.id), c]))
export const apolloOrgId = (c) => hex24('o:' + c.id)
export const companyOfOrg = (id) => coOf.get(id)
const phoneOf = (c) => { const n = String(1e7 + (fnv(c.id) % 9e7)).slice(0, 8); return '+91 ' + (AREA[c.hq] || '22') + ' ' + n.slice(0, 4) + ' ' + n.slice(4) }
const handle = (c) => c.id.replace(/-/g, '')

/** One `organizations[]` item of mixed_companies/search. Who the company is; nothing about size, money or place. */
export function orgOf(c) {
  const h = fnv(c.id)
  const phone = phoneOf(c)
  const big = (c.size || 0) > 3000
  return {
    id: apolloOrgId(c),
    name: c.name,
    website_url: 'http://www.' + c.domain,
    blog_url: null,
    angellist_url: null,
    linkedin_url: 'http://www.linkedin.com/company/' + c.id,
    twitter_url: h % 3 ? 'https://twitter.com/' + handle(c) : null,
    facebook_url: h % 4 ? 'https://facebook.com/' + handle(c) : null,
    primary_phone: { number: phone, source: 'Scraped', sanitized_number: phone.replace(/\s/g, '') },
    languages: h % 2 ? ['English'] : ['English', 'Hindi'],
    alexa_ranking: h % 5 ? null : 20000 + (h % 400000),
    phone,
    linkedin_uid: String(1e6 + (h % 9e7)),
    founded_year: big ? 1995 + (h % 15) : 2010 + (h % 12),
    publicly_traded_symbol: null,
    publicly_traded_exchange: null,
    logo_url: 'https://zenprospect-production.s3.amazonaws.com/uploads/pictures/' + hex24('l:' + c.id) + '/picture',
    crunchbase_url: /Series|Seed|Pre-IPO/.test(c.stage || '') ? 'https://www.crunchbase.com/organization/' + c.id : null,
    primary_domain: c.domain,
    sanitized_phone: phone.replace(/\s/g, ''),
    owned_by_organization_id: null,
    show_intent: true,
    has_intent_signal_account: false,
    intent_signal_account: null,
  }
}
const usd = (inr) => inr / 83
const printed = (v) => (v >= 1e9 ? +(v / 1e9).toFixed(1) + 'B' : v >= 1e6 ? +(v / 1e6).toFixed(1) + 'M' : Math.round(v / 1e3) + 'K')
/** organizations/enrich: the firmographics company search leaves out. */
export function orgEnriched(c) {
  const rev = c.rev != null ? Math.round(usd(c.rev)) : null
  return {
    ...orgOf(c),
    industry: INDUSTRY[c.cat] || null,
    keywords: [c.cat?.toLowerCase(), 'd2c', 'consumer brand'].filter(Boolean),
    estimated_num_employees: c.size ?? null,
    industries: INDUSTRY[c.cat] ? [INDUSTRY[c.cat]] : [],
    raw_address: c.hq ? c.hq + ', ' + (STATE[c.hq] || '') + ', India' : null,
    city: c.hq || null, state: STATE[c.hq] || null, country: c.hq ? 'India' : null,
    short_description: c.about || null,
    annual_revenue: rev,
    annual_revenue_printed: rev != null ? printed(rev) : null,
    latest_funding_stage: c.stage || null,
    total_funding: null, total_funding_printed: null,
  }
}

/* ───────── Requests: our filter → Apollo params, and what can't be sent ───────── */
const on = (v) => (Array.isArray(v) ? v.length > 0 : !!v)
const orgParams = (f) => ({
  ...(on(f.cat) && { 'organization_industries[]': [...new Set(f.cat.map((k) => INDUSTRY[k]).filter(Boolean))] }),
  ...(on(f.size) && { 'organization_num_employees_ranges[]': f.size.map((k) => RANGES[k]) }),
  ...(on(f.city) && { 'organization_locations[]': f.city.map(loc) }),
})
const NOT_SENT = {
  funding: 'Apollo has no funding-stage filter, only funding amount and date',
  rel: 'Relationship is ours, not Apollo’s',
  co: 'Specific companies are picked from our DB',
  signal: 'Apollo has no signals',
  dept: 'No department filter on people search',
  contact: 'On file is ours',
  pflag: 'Movement comes from our signals',
  activity: 'Inbound, moments and follow-ups are ours',
}
export function companyRequest(f, page = 1, per_page = 25) {
  const q = (f.q || '').trim()
  const params = { ...orgParams(f), ...(q && (f.scope === 'companies' || f.scope === 'all' || !f.scope) && { q_organization_name: q }), page, per_page }
  const skipped = [
    on(f.funding) && ['Funding', NOT_SENT.funding],
    on(f.rel) && ['Relationship', NOT_SENT.rel],
    on(f.co) && ['Company', NOT_SENT.co],
    (on(f.kind) || on(f.recency) || on(f.fit) || on(f.relevance) || on(f.deal)) && ['Signal filters', NOT_SENT.signal],
    (on(f.role) || on(f.dept) || on(f.contact) || on(f.pflag)) && ['People filters', 'Company search ignores people filters'],
  ].filter(Boolean)
  return { method: 'POST', path: '/api/v1/mixed_companies/search', params, skipped }
}
export function peopleRequest(f, page = 1, per_page = 25) {
  const q = (f.q || '').trim()
  const params = {
    ...(on(f.role) && { 'person_seniorities[]': f.role.map((k) => SENIORITY[k]) }),
    ...orgParams(f),
    ...(q && f.scope === 'people' && { q_keywords: q }),
    page, per_page,
  }
  const skipped = [
    on(f.dept) && ['Department', NOT_SENT.dept],
    on(f.contact) && ['Contact', NOT_SENT.contact],
    on(f.pflag) && ['Movement', NOT_SENT.pflag],
    on(f.funding) && ['Funding', NOT_SENT.funding],
    on(f.rel) && ['Relationship', NOT_SENT.rel],
    (on(f.kind) || on(f.recency) || on(f.fit) || on(f.relevance) || on(f.deal)) && ['Signal filters', NOT_SENT.signal],
  ].filter(Boolean)
  return { method: 'POST', path: '/api/v1/mixed_people/api_search', params, skipped }
}

/* ───────── Responses ───────── */
function orgMatch(c, p) {
  const ind = p['organization_industries[]'], rng = p['organization_num_employees_ranges[]'], locs = p['organization_locations[]']
  return (!ind || ind.includes(INDUSTRY[c.cat]))
    && (!rng || rng.some((r) => inRange(c.size, r)))
    && (!locs || locs.includes(loc(c.hq)))
    && (!p.q_organization_name || c.name.toLowerCase().includes(p.q_organization_name.toLowerCase()))
}
const BREAD = { 'organization_industries[]': 'Industry', 'organization_num_employees_ranges[]': '# Employees', 'organization_locations[]': 'Company Locations', 'person_seniorities[]': 'Seniority', q_organization_name: 'Company Name', q_keywords: 'Keywords' }
const breadcrumbs = (p) => Object.entries(p).filter(([k]) => BREAD[k]).flatMap(([k, v]) => [].concat(v).map((x) => ({ label: BREAD[k], signal_field_name: k.replace('[]', ''), value: x, display_name: k.includes('ranges') ? x.replace(',', '-') : x })))
/** Apollo ranks by its own relevance; here: biggest first, then name. */
const rank = (a, b) => (b.size || 0) - (a.size || 0) || a.name.localeCompare(b.name)

export function companySearchResponse(req) {
  const p = req.params
  const all = ALL.filter((c) => orgMatch(c, p)).sort(rank)
  const per = Math.min(100, p.per_page)
  const pages = Math.max(1, Math.ceil(all.length / per))
  const page = Math.min(p.page, pages)
  return {
    breadcrumbs: breadcrumbs(p),
    partial_results_only: false,
    has_join: false,
    disable_eu_prospecting: false,
    partial_results_limit: 10000,
    pagination: { page, per_page: per, total_entries: all.length, total_pages: all.length ? pages : 0 },
    accounts: [],
    organizations: all.slice((page - 1) * per, page * per).map(orgOf),
  }
}

const hasEmailOf = (p) => fnv('e:' + p.id) % 7 !== 0 // Apollo has no email for some people
const obf = (last = '') => (last.length <= 2 ? last[0] + '***' : last.slice(0, 2) + '***' + last.slice(-1))
const ALL_PEOPLE = ALL.flatMap((c) => c.people.map((p) => ({ p, c })))
const pId = new Map(ALL_PEOPLE.map(({ p, c }) => [hex24('p:' + p.id), { p, c }]))
export const apolloPersonId = (p) => hex24('p:' + p.id)
export const personOfId = (id) => pId.get(id)
export const hasEmail = (p) => p.onFile || hasEmailOf(p)
const directPhone = (p) => (p.phone ? 'Yes' : 'Maybe: request direct dial via people/bulk_match')

export function peopleSearchResponse(req) {
  const p = req.params
  const sen = p['person_seniorities[]']
  const kw = (p.q_keywords || '').toLowerCase()
  const all = ALL_PEOPLE.filter(({ p: x, c }) => orgMatch(c, { ...p, q_organization_name: undefined })
    && (!sen || sen.includes(SEN_OF(x.title)))
    && (!kw || (x.name + ' ' + x.title).toLowerCase().includes(kw)))
    .sort((a, b) => rank(a.c, b.c) || a.p.id.localeCompare(b.p.id))
  const per = Math.min(100, p.per_page)
  const page = Math.min(p.page, Math.max(1, Math.ceil(all.length / per)))
  return {
    total_entries: all.length,
    people: all.slice((page - 1) * per, page * per).map(({ p: x, c }) => {
      const [first, ...rest] = x.name.split(' ')
      return {
        id: apolloPersonId(x),
        first_name: first,
        last_name_obfuscated: obf(rest.join(' ')),
        title: x.title,
        last_refreshed_at: iso(1 + (fnv(x.id) % 40)),
        has_email: hasEmailOf(x),
        has_city: true, has_state: true, has_country: true,
        has_direct_phone: directPhone(x),
        organization: { name: c.name, has_industry: !!c.cat, has_phone: true, has_city: !!c.hq, has_state: !!c.hq, has_country: true, has_zip_code: fnv(c.id) % 3 !== 0, has_revenue: c.rev != null, has_employee_count: c.size != null },
      }
    }),
  }
}

/** people/bulk_match: one call, up to 10 people. Phones are not in this response; they come later by webhook. */
export function bulkMatchResponse(list, { reveal_phone_number = false } = {}) {
  const matches = list.map(({ p, c }) => {
    const [first, ...rest] = p.name.split(' ')
    const em = hasEmail(p)
    return {
      id: apolloPersonId(p),
      first_name: first, last_name: rest.join(' '), name: p.name,
      linkedin_url: 'http://www.linkedin.com/in/' + p.name.toLowerCase().replace(/\s+/g, '-') + '-' + hex24(p.id).slice(0, 6),
      title: p.title,
      email_status: em ? 'verified' : 'unavailable',
      photo_url: null, twitter_url: null, github_url: null, facebook_url: null,
      extrapolated_email_confidence: null,
      headline: p.title + ' at ' + c.name,
      email: em ? p.email : null,
      organization_id: apolloOrgId(c),
      match_confidence: 'high',
      employment_history: [{ current: true, organization_id: apolloOrgId(c), organization_name: c.name, title: p.title, start_date: (2018 + (fnv(p.id) % 7)) + '-0' + (1 + (fnv(p.id) % 9)) + '-01', end_date: null }],
      state: STATE[c.hq] || null, city: c.hq || null, country: 'India',
      organization: orgEnriched(c),
      seniority: SEN_OF(p.title),
      departments: /Founder|CEO|COO/.test(p.title) ? ['c_suite'] : ['master_marketing'],
      ...(reveal_phone_number && { phone_enrichment: { request_id: fnv('r:' + p.id), status: 'pending', message: 'Phone enrichment is processing asynchronously.' } }),
    }
  })
  return {
    status: 'success', error_code: null, error_message: null,
    total_requested_enrichments: list.length,
    unique_enriched_records: matches.length,
    missing_records: 0,
    credits_consumed: matches.length, // demographics/email: 1 each. Mobiles are charged when the webhook delivers them.
    ...(reveal_phone_number && { request_id_str: hex24('req:' + list.map((x) => x.p.id).join()) }),
    matches,
  }
}

/* ───────── Calls that spend credits and keep what came back ───────── */
const short = (st, need) => { if (st.credits >= need) return false; toast('Not enough credits', { description: need + ' needed · ' + st.credits + ' left' }); return true }

/** Run one page of company search: 1 credit. New companies land in our DB at search depth (not enriched). */
export function runCompanySearch(st, f, page, per_page) {
  if (short(st, 1)) return null
  const req = companyRequest(f, page, per_page)
  const res = companySearchResponse(req)
  const found = { ind: req.params['organization_industries[]'] || [], rng: req.params['organization_num_employees_ranges[]'] || [], loc: req.params['organization_locations[]'] || [] }
  const ids = res.organizations.map((o) => companyOfOrg(o.id)).filter((c) => apollo.includes(c)).map((c) => c.id)
  st.set((x) => {
    const fd = { ...(x.db.found || {}) }
    ids.forEach((id) => { const o = fd[id] || { ind: [], rng: [], loc: [] }; fd[id] = { ind: [...new Set([...o.ind, ...found.ind])], rng: [...new Set([...o.rng, ...found.rng])], loc: [...new Set([...o.loc, ...found.loc])] } })
    return { credits: x.credits - 1, db: { ...x.db, co: [...new Set([...x.db.co, ...ids])], found: fd } }
  })
  toast.success('Company search · 1 credit', { description: `Page ${res.pagination.page} of ${res.pagination.total_pages || 1} · ${res.organizations.length} of ${res.pagination.total_entries} companies` })
  return { req, res, ids }
}
/** organizations/enrich: 1 credit per company. */
export function enrichCompanies(st, list) {
  const todo = list.filter((c) => apollo.includes(c) && !(st.db.enr || []).includes(c.id))
  if (!todo.length || short(st, todo.length)) return null
  st.set((x) => ({ credits: x.credits - todo.length, db: { ...x.db, co: [...new Set([...x.db.co, ...todo.map((c) => c.id)])], enr: [...new Set([...(x.db.enr || []), ...todo.map((c) => c.id)])] } }))
  toast.success(todo.length === 1 ? todo[0].name + ' enriched' : todo.length + ' companies enriched', { description: todo.length + (todo.length === 1 ? ' credit' : ' credits') + ' · industry, employees, revenue, funding stage' })
  return { organization: orgEnriched(todo[0]), credits_consumed: todo.length }
}
/** People search: free. Results land in our DB with the last name hidden; their companies come in at search depth. */
export function runPeopleSearch(st, f, page, per_page) {
  const req = peopleRequest(f, page, per_page)
  const res = peopleSearchResponse(req)
  const got = res.people.map((x) => personOfId(x.id))
  const pe = got.filter(({ c }) => apollo.includes(c)).map(({ p }) => p.id)
  const co = got.filter(({ c }) => apollo.includes(c)).map(({ c }) => c.id)
  st.set((x) => ({ db: { ...x.db, pe: [...new Set([...x.db.pe, ...pe])], co: [...new Set([...x.db.co, ...co])] } }))
  return { req, res }
}

/** people/bulk_match, batched by 10. 1 credit per person now; with mobile, 8 more per number when (and if) it arrives. */
export function bulkMatch(st, people, { phone = false } = {}) {
  // A person a signal introduced (a new CMO) isn't in people search yet, but bulk_match finds them by name + company.
  const list = people.map((p) => personOfId(apolloPersonId(p)) || (brandOf(p.brand) && { p, c: brandOf(p.brand) })).filter(Boolean)
  const todo = list.filter(({ p }) => !p.onFile && !st.revealed.includes(p.id))
  const mob = phone ? list.filter(({ p }) => !(st.phones || {})[p.id]) : []
  const need = todo.length + mob.length * 8
  if (!todo.length && !mob.length) return null
  if (short(st, need)) return null
  const calls = []
  for (let i = 0; i < list.length; i += 10) calls.push(bulkMatchResponse(list.slice(i, i + 10), { reveal_phone_number: phone }))
  st.set((x) => ({
    credits: x.credits - todo.length,
    revealed: [...new Set([...x.revealed, ...todo.map(({ p }) => p.id)])],
    db: { ...x.db, pe: [...new Set([...x.db.pe, ...list.filter(({ c }) => apollo.includes(c)).map(({ p }) => p.id)])] },
    phones: { ...(x.phones || {}), ...Object.fromEntries(mob.map(({ p }) => [p.id, 'pending'])) },
  }))
  const noMail = todo.filter(({ p }) => !hasEmail(p)).length
  toast.success(todo.length ? (todo.length === 1 ? 'Enriched' : todo.length + ' people enriched') : 'Mobile requested', {
    description: [todo.length && todo.length + (todo.length === 1 ? ' credit' : ' credits'), noMail && noMail + ' without email', calls.length > 1 && calls.length + ' calls of up to 10', mob.length && mob.length + (mob.length === 1 ? ' mobile' : ' mobiles') + ' on the way · 8 credits each if found'].filter(Boolean).join(' · '),
  })
  // Webhook: phone numbers arrive a few seconds later. Charged only for numbers found.
  if (mob.length) {
    setTimeout(() => {
      const hit = mob.filter(({ p }) => p.phone)
      st.set((x) => ({
        credits: x.credits - hit.length * 8,
        phones: { ...(x.phones || {}), ...Object.fromEntries(mob.map(({ p }) => [p.id, p.phone || 'none'])) },
      }))
      toast(hit.length ? (hit.length === 1 ? 'Mobile number arrived' : hit.length + ' mobile numbers arrived') : 'No mobile found', { description: 'Apollo webhook · ' + hit.length * 8 + ' credits' + (mob.length - hit.length ? ' · ' + (mob.length - hit.length) + ' not found, not charged' : '') })
    }, 3200)
  }
  return calls
}
/** Display name: a person we only have from people search shows Apollo's obfuscated last name until enriched. */
export function nameOf(p, st) {
  const c = ALL_PEOPLE.find((x) => x.p.id === p.id)?.c
  if (!c || !apollo.includes(c) || p.onFile || st.revealed.includes(p.id)) return p.name
  const [first, ...rest] = p.name.split(' ')
  return first + ' ' + obf(rest.join(' '))
}
