// Domain data for the WLDD DMS — modelled on DMS-app-context/*.md
import { clients as baseClients, creators, team, me, fmt, TODAY } from '../data'
export { fmt, team, me, creators, TODAY }

function mulberry32(a) {
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}
const rand = mulberry32(7)
const pick = (a) => a[Math.floor(rand() * a.length)]
const int = (a, b) => Math.floor(rand() * (b - a + 1)) + a
const daysAgo = (d, h = 0) => new Date(TODAY.getTime() - d * 864e5 - h * 36e5)
const daysFrom = (d) => new Date(TODAY.getTime() + d * 864e5)

export const clients = baseClients

/* WLDD brand colours double as module colours. */
export const BRAND = { green: '#5fcf86', violet: '#c46bf0', pink: '#f0506e', yellow: '#f2bd2f' }

export const ROLES = [
  { id: 'pod', label: 'Pod', color: BRAND.green },
  { id: 'finance', label: 'Finance', color: BRAND.violet },
  { id: 'bd', label: 'Sales', color: BRAND.yellow },
]

/* ───────── Services ───────── */
export const SERVICES = {
  amp: { label: 'Amplification', short: 'AMP', planned: true },
  inf: { label: 'Influencers', short: 'INF', planned: true },
  solo: { label: 'SOLO', short: 'SOLO', planned: true },
  memd: { label: "Meme'd", short: 'MEMD', planned: true },
  orm: { label: 'ORM', short: 'ORM' },
  aca: { label: 'Advanced Analytics', short: 'ACA' },
  tt: { label: 'Twitter Trend', short: 'TT' },
  cc: { label: 'Content Creation', short: 'CC' },
  off: { label: 'Offline Activity', short: 'OFF' },
}

/* ───────── POD ───────── */
export const STAGES = ['Brief', 'Team', 'Pitch', 'Details', 'Activation', 'Report']
export const STAGE_FULL = ['Brief', 'Team Allocation', 'Pitch Details', 'Campaign Details', 'Activation', 'Campaign Report']
export const PODS = ['Kulfi', 'Neon', 'Masala']

const activities = ['Diwali Drop', 'S5 Launch', 'Always-on Q4', 'Tour Hype', 'Launch Week', 'Match Day', 'Wrapped', 'Sale Countdown', 'App Push', 'Season Finale', 'Festive Edit', 'New Album', 'Store Opening', 'Creator Week']
const camSeed = [
  ['Netflix India', 4], ['Amazon', 5], ['District', 4], ['Audible', 3], ['Prime Video', 6], ['JioHotstar', 4], ['Spotify', 2],
  ['Philips', 4], ['WMG', 5], ['Rapido', 6], ['Zomato', 0], ['Swiggy Instamart', 4], ['boAt', 3], ['CRED', 1],
  ['Nykaa', 2], ['Sony Music India', 4], ['Zepto', 4], ['Myntra', 5], ['Krafton India', 3], ['Mamaearth', 1],
  ['Lenskart', 0], ['Groww', 4], ['Universal Music', 2], ['SonyLIV', 5], ['Flipkart', 6], ['OnePlus', 3], ['Dream11', 4], ['Saregama', 6],
]
const serviceSets = [['amp', 'memd'], ['inf', 'amp'], ['amp'], ['inf', 'solo'], ['memd', 'tt'], ['amp', 'orm'], ['inf'], ['amp', 'memd', 'cc'], ['amp', 'aca'], ['off', 'inf']]
const briefs = [
  'Own the conversation in launch week. Meme pages lead, mid-tier creators follow on day 3. Tone: irreverent, brand-safe.',
  'Seed with tier-2 pages first, hero creators after the drop. We optimise for saves and shares, not likes.',
  'Always-on calendar — four posts a week across meme pages, one creator integration a month.',
  'Reactive within two hours of each episode drop. Fast-lane approvals with the client.',
  '40 nano creators unboxing on day one, cut into a hero edit for paid amplification.',
]
export const campaigns = camSeed.map(([client, stage], i) => {
  const c = baseClients.find((x) => x.name === client)
  const services = serviceSets[i % serviceSets.length]
  const budget = int(6, 80) * 100000
  const planCost = Math.round(budget * (0.55 + rand() * 0.3))
  const deliverables = int(18, 160)
  const live = stage >= 5 ? (stage === 6 ? deliverables : Math.floor(deliverables * (0.6 + rand() * 0.35))) : stage === 4 ? Math.floor(deliverables * rand() * 0.5) : 0
  const lead = team[2 + (i % 6)]
  return {
    id: 'c' + (i + 1),
    code: 'WL-' + (2401 + i),
    client, clientId: c?.id, industry: c?.industry,
    activity: activities[i % activities.length],
    name: `${client} × ${activities[i % activities.length]}`,
    stage, // 0..5, 6 = complete
    services,
    pod: PODS[i % 3],
    lead,
    team: [lead, team[(i + 4) % 10], team[(i + 7) % 10]].filter((u, k, a) => !u.me && a.findIndex((x) => x.id === u.id) === k),
    budget, planCost, internal: Math.round(planCost * 0.72),
    deliverables, live,
    views: live * int(60, 700) * 1000,
    planApproved: stage >= 4,
    vendorVisible: stage >= 4 && rand() > 0.3,
    deepReport: rand() > 0.5,
    start: daysAgo(int(-6, 50)),
    updated: daysAgo(0, int(1, 90)),
    brief: briefs[i % briefs.length],
    flags: { agreement: stage >= 2, po: stage >= 3, invoice: stage >= 5, payment: stage === 6 },
    tally: stage >= 3 ? pick(['synced', 'synced', 'synced', 'queued', 'failed']) : stage >= 2 ? 'none' : 'none',
    tallyKey: stage >= 3 ? 'TK-' + (8800 + i * 7) : null,
    pinned: [0, 2, 5].includes(i),
    trend: Array.from({ length: 14 }, (_, k) => Math.max(1, Math.round(10 + Math.sin(k / 2 + i) * 6 + rand() * 9 + k * (stage >= 4 ? 2 : 0.3)))),
  }
})
// Planned end date — deterministic so the seeded data above stays stable.
campaigns.forEach((c, i) => { c.end = new Date(c.start.getTime() + (21 + ((i * 17) % 46)) * 864e5) })
export const campaignById = Object.fromEntries(campaigns.map((c) => [c.id, c]))

/* Plan: categories of inventory pages with per-deliverable cost */
const categoriesFor = (c) => {
  const cats = []
  if (c.services.includes('memd') || c.services.includes('amp')) cats.push('Meme pages · Tier 1', 'Meme pages · Tier 2')
  if (c.services.includes('inf')) cats.push('Influencers · Lifestyle')
  if (c.services.includes('solo')) cats.push('SOLO creators')
  if (!cats.length) cats.push('Meme pages · Tier 1')
  return cats
}
export function planFor(c) {
  const r = mulberry32(c.id.length * 97 + Number(c.id.slice(1)) * 13)
  let k = Number(c.id.slice(1)) * 5
  return categoriesFor(c).map((name, ci) => ({
    id: c.id + '-cat' + ci,
    name,
    pages: Array.from({ length: 3 + Math.floor(r() * 4) }, () => {
      const cr = creators[k++ % creators.length]
      const base = Math.max(1500, Math.round((cr.followers * (0.015 + r() * 0.02)) / 500) * 500)
      return {
        id: c.id + '-' + cr.id,
        page: cr,
        cost: { reel: base, post: Math.round(base * 0.6 / 100) * 100, story: Math.round(base * 0.3 / 100) * 100 },
        qty: { reel: Math.floor(r() * 3), post: Math.floor(r() * 2) + (r() > 0.5 ? 1 : 0), story: Math.floor(r() * 3) },
        adhoc: r() > 0.88,
      }
    }),
  }))
}

/* Tracker: one row per deliverable */
export function trackerFor(c, plan = planFor(c)) {
  const rows = []
  const r = mulberry32(Number(c.id.slice(1)) * 31)
  plan.forEach((cat) => cat.pages.forEach((p) => ['reel', 'post', 'story'].forEach((t) => {
    for (let n = 0; n < p.qty[t]; n++) {
      const roll = r()
      const status = c.stage >= 5 ? (roll > 0.12 ? 'live' : 'review') : c.stage === 4 ? (roll > 0.6 ? 'live' : roll > 0.35 ? 'review' : 'missing') : 'missing'
      rows.push({
        id: `${p.id}-${t}-${n}`, page: p.page, type: t, category: cat.name,
        source: status === 'missing' ? null : roll > 0.5 ? 'vendor' : 'team',
        link: status === 'missing' ? null : `instagram.com/p/${Math.floor(r() * 1e10).toString(36)}`,
        status, views: status === 'live' ? Math.round(p.page.followers * (0.2 + r() * 0.9)) : 0,
        submitted: daysAgo(Math.floor(r() * 6), Math.floor(r() * 20)),
      })
    }
  })))
  return rows
}

/* ───────── Invoices — link (creator) and misc (vendor) ─────────
   misc chain: lead → procurement → finance → scheduled → paid
   link chain: finance → scheduled → paid                                  */
const vendorNames = ['Meme Chat Pvt Ltd', 'Pagal Memes LLP', 'Kulfi Collective', 'Dank Desi Media', 'Hostel Diaries Network', 'Creator Ka Adda', 'Filmy Gyaan Studios', 'Chai Sutta Memes', 'Pixel Pundits', 'Trendsetters OOH', 'Hashtag Hive', 'Loud Mouth ORM']
export const vendors = vendorNames.map((name, i) => ({
  id: 'v' + i, name,
  kind: i < 9 ? 'Creator' : 'Vendor',
  role: i < 9 ? pick(['Amplification creator', 'Amplification bulk', 'Influencer']) : ['Offline activity', 'Twitter Trend', 'ORM'][i - 9],
  assets: i < 9 ? int(1, 14) : 0,
  tallyKey: 'TL-' + (3100 + i * 11),
  invoicing: i !== 6,
  pan: 'ABCPK' + (1200 + i * 37) + 'F',
  paid: int(4, 60) * 50000,
  city: pick(['Mumbai', 'Delhi', 'Bengaluru', 'Pune', 'Jaipur']),
}))
const miscServices = ['orm', 'tt', 'cc', 'off', 'aca']
export const invoices = Array.from({ length: 28 }, (_, i) => {
  const c = campaigns[(i * 5 + 2) % campaigns.length]
  const misc = i % 3 === 0
  const v = misc ? vendors[9 + (Math.floor(i / 3) % 3)] : vendors[i % 9]
  const taxable = int(8, 120) * 2500
  const stagesMisc = ['lead', 'lead', 'procurement', 'finance', 'finance', 'scheduled', 'paid']
  const stagesLink = ['finance', 'finance', 'finance', 'scheduled', 'scheduled', 'paid', 'rejected']
  const stage = misc ? stagesMisc[i % stagesMisc.length] : stagesLink[i % stagesLink.length]
  return {
    id: 'inv' + i,
    no: 'INV/26-27/' + String(512 + i * 3).padStart(4, '0'),
    vendor: v, campaignId: c.id, campaign: c.name,
    type: misc ? 'misc' : 'link',
    service: misc ? miscServices[i % miscServices.length] : pick(['amp', 'memd', 'inf']),
    items: misc ? 1 : int(2, 18),
    taxable, gst: Math.round(taxable * 0.18), amount: Math.round(taxable * 1.18),
    submitted: daysAgo(int(0, 14), int(0, 20)),
    scheduledFor: stage === 'scheduled' ? daysFrom(int(0, 9)) : null,
    stage,
  }
})
export const MISC_CHAIN = ['lead', 'procurement', 'finance', 'scheduled', 'paid']
export const LINK_CHAIN = ['finance', 'scheduled', 'paid']
export const CHAIN_LABEL = { lead: 'Campaign lead', procurement: 'Procurement', finance: 'Finance', scheduled: 'Scheduled', paid: 'Paid', rejected: 'Rejected' }

export const billingRequests = [
  { id: 'br1', vendor: vendors[2], kind: 'Change', field: 'Bank account', from: 'HDFC ••4410', to: 'ICICI ••9021', at: daysAgo(0, 3) },
  { id: 'br2', vendor: { name: 'Bombay Tales Media', city: 'Mumbai' }, kind: 'Onboarding', field: 'New vendor', from: null, to: 'PAN, GST, bank', at: daysAgo(0, 6) },
  { id: 'br3', vendor: vendors[5], kind: 'Change', field: 'GST', from: '27ABCPK1385F1Z2', to: '27ABCPK1385F1Z9', at: daysAgo(1) },
  { id: 'br4', vendor: vendors[7], kind: 'Change', field: 'MSME', from: 'Not registered', to: 'UDYAM-MH-19-0021', at: daysAgo(2) },
  { id: 'br5', vendor: { name: 'Delhi Dank Hub', city: 'Delhi' }, kind: 'Onboarding', field: 'New vendor', from: null, to: 'PAN, bank', at: daysAgo(3) },
]
export const TALLY_CATEGORIES = ['Digital Marketing — Amplification', 'Digital Marketing — Influencer', 'Production', 'Events & Offline', 'Analytics Services']

/* ───────── Sales / BD ───────── */
const brands = ['Bisleri', 'Tanishq', 'Bira 91', 'Licious', 'Boat Lifestyle', 'Ixigo', 'Cult.fit', 'Nothing India', 'Pilgrim', 'Snitch', 'Wakefit', 'The Whole Truth', 'Rare Rabbit', 'Swiggy Dineout', 'PhonePe', 'Urban Company', 'Mokobara', 'Sleepy Owl', 'Blue Tokai', 'Kotak 811', 'Unacademy', 'Dunzo', 'Ather Energy', 'Duolingo India']
const agencies = ['Dentsu Creative', 'Ogilvy', 'Lowe Lintas', 'WATConsult', 'Schbang']
const pocNames = ['Aditi Rao', 'Karan Malik', 'Shreya Jain', 'Rohit Verma', 'Neha Gupta', 'Varun Sethi', 'Isha Kulkarni', 'Arnav Bose', 'Tara Menon', 'Sid Arora']
const bdTeam = [team[8], team[2], team[7]]
export const outreach = Array.from({ length: 26 }, (_, i) => {
  const agency = i % 6 === 5
  return {
    id: 'o' + i,
    brand: agency ? agencies[i % agencies.length] : brands[i % brands.length],
    kind: agency ? 'Agency' : 'Brand',
    poc: { name: pocNames[i % pocNames.length], role: pick(['Brand Manager', 'Marketing Lead', 'Head of Social', 'CMO', 'Media Planner']) },
    source: pick(['LinkedIn', 'Referral', 'Event', 'Cold email', 'Inbound']),
    status: i % 7 === 0 ? 'disqualified' : i % 3 === 0 ? 'proposal' : 'lead',
    owner: bdTeam[i % 3],
    touched: daysAgo(int(0, 20), int(0, 10)),
    value: int(5, 60) * 100000,
  }
})
export const PROPOSAL_STATUS = [
  { id: 'mapped', label: 'Mapped to POC' },
  { id: 'approved', label: 'Approved' },
  { id: 'converted', label: 'Converted' },
  { id: 'cancelled', label: 'Cancelled' },
]
export const proposals = Array.from({ length: 16 }, (_, i) => ({
  id: 'p' + i,
  brand: brands[(i * 3 + 1) % brands.length],
  services: [['amp', 'memd'], ['inf'], ['amp', 'inf', 'cc'], ['orm'], ['memd', 'tt'], ['solo', 'inf'], ['off']][i % 7],
  billing: int(6, 90) * 100000,
  pitch: daysFrom(int(-12, 14)),
  owner: bdTeam[i % 3],
  status: ['mapped', 'mapped', 'approved', 'mapped', 'converted', 'approved', 'cancelled', 'mapped'][i % 8],
  brief: briefs[i % briefs.length],
  source: pick(['Outreach', 'Inbound', 'Referral']),
}))
export const inbound = [
  { id: 'in1', name: 'Priya Natarajan', company: 'Sleepy Owl', source: 'email', budget: 1500000, at: daysAgo(0, 2), summary: 'Wants a meme-led launch for a new cold brew flavour, Jan release, Tier-1 cities.', body: 'Hi team,\n\nWe loved what you did for Zepto Café. We’re launching a new cold brew flavour in January and want a meme-first push across Mumbai, Delhi and Bengaluru. Budget is roughly ₹15L including creators.\n\nCould we get on a call this week?\n\nPriya\nBrand Lead, Sleepy Owl' },
  { id: 'in2', name: 'Rahul Dsouza', company: 'Ather Energy', source: 'web', budget: 4000000, at: daysAgo(0, 7), summary: 'Rizta launch in Pune & Bengaluru — influencer + offline test rides.' },
  { id: 'in3', name: 'Megha Kapoor', company: 'Pilgrim', source: 'email', budget: 800000, at: daysAgo(1), summary: 'Always-on skincare memes, 3-month retainer.', body: 'Hello,\n\nLooking for an always-on meme partner for Q1. Three months to start, ₹8L total. Can you share case studies in beauty?\n\nThanks,\nMegha' },
  { id: 'in4', name: 'Anuj Batra', company: 'Mokobara', source: 'web', budget: 1200000, at: daysAgo(2), summary: 'Travel season campaign, UGC + amplification.' },
  { id: 'in5', name: 'Sana Sheikh', company: 'Duolingo India', source: 'email', budget: 2500000, at: daysAgo(3), summary: 'Unhinged-owl energy, Hindi meme pages, Twitter trend.', body: 'Hey WLDD!\n\nWe want the owl to go viral in Hindi meme culture. Thinking meme pages + a Twitter trend on launch day. ~₹25L.\n\nSana' },
  { id: 'in6', name: 'Kunal Shah', company: 'Unknown Startup', source: 'web', budget: 150000, at: daysAgo(4), summary: 'Small budget, app install push.' },
]
export const bdMonthly = {
  closed: { value: 21_400_000, series: [8, 11, 9, 13, 12, 15, 14, 17, 16, 19, 18, 21.4].map((v) => v * 1e6) },
  pipeline: { value: 48_900_000, series: [30, 31, 35, 33, 38, 40, 39, 42, 44, 45, 47, 48.9].map((v) => v * 1e6) },
  conversion: { value: 31, series: [22, 24, 23, 26, 25, 27, 28, 27, 29, 30, 30, 31] },
}

/* ───────── Activity ───────── */
export const activity = [
  { id: 'a1', who: team[3], text: 'approved 12 links', ctx: campaigns[0].name, at: daysAgo(0, 0.3) },
  { id: 'a2', who: team[6], text: 'paid 4 invoices', ctx: '₹3.8L via Cashfree', at: daysAgo(0, 1.2) },
  { id: 'a3', who: team[8], text: 'converted a proposal', ctx: 'Licious × Diwali', at: daysAgo(0, 2) },
  { id: 'a4', who: team[4], text: 'moved to Activation', ctx: campaigns[5].name, at: daysAgo(0, 3) },
  { id: 'a5', who: team[2], text: 'added 6 adhoc pages', ctx: campaigns[8].name, at: daysAgo(0, 5) },
  { id: 'a6', who: team[1], text: 'published a deep report', ctx: campaigns[4].name, at: daysAgo(0, 8) },
  { id: 'a7', who: team[5], text: 'approved plan with client', ctx: campaigns[11].name, at: daysAgo(1) },
]
export const monthly = {
  views: { value: 182_400_000, series: [88, 94, 81, 102, 118, 109, 124, 141, 133, 160, 150, 182].map((v) => v * 1e6) },
  posts: { value: 1284, series: [740, 810, 690, 880, 940, 910, 1010, 1120, 1060, 1190, 1188, 1284] },
  billing: { value: 38_600_000, series: [21, 24, 19, 26, 29, 27, 30, 33, 31, 35, 34, 38.6].map((v) => v * 1e6) },
}
export const MONTHS = ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov']
export { industries } from '../data'
