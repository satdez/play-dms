// Deterministic fake data for the WLDD DMS playground.
// Everything is seeded so every variant shows the same world.

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = mulberry32(42)
const pick = (arr) => arr[Math.floor(rand() * arr.length)]
const int = (min, max) => Math.floor(rand() * (max - min + 1)) + min

export const TODAY = new Date('2026-11-03T10:30:00')
const daysAgo = (d, h = 0) => new Date(TODAY.getTime() - d * 864e5 - h * 36e5)
const daysFrom = (d) => new Date(TODAY.getTime() + d * 864e5)

/* ───────────── Team ───────────── */
export const team = [
  { id: 'u1', name: 'Satish Hebbal', short: 'Satish', role: 'Product Design', hue: 340, me: true },
  { id: 'u2', name: 'Kirsten Menezes', short: 'Kirsten', role: 'Analytics Lead', hue: 200 },
  { id: 'u3', name: 'Aarav Shah', short: 'Aarav', role: 'Account Director', hue: 30 },
  { id: 'u4', name: 'Riya Kapoor', short: 'Riya', role: 'Campaign Manager', hue: 280 },
  { id: 'u5', name: 'Kabir Mehta', short: 'Kabir', role: 'Campaign Manager', hue: 150 },
  { id: 'u6', name: 'Ananya Iyer', short: 'Ananya', role: 'Creator Partnerships', hue: 10 },
  { id: 'u7', name: 'Dev Malhotra', short: 'Dev', role: 'Finance', hue: 60 },
  { id: 'u8', name: 'Zoya Khan', short: 'Zoya', role: 'Strategy', hue: 250 },
  { id: 'u9', name: 'Ishaan Rao', short: 'Ishaan', role: 'Business Development', hue: 100 },
  { id: 'u10', name: 'Meera Nair', short: 'Meera', role: 'Content Lead', hue: 320 },
]
export const me = team[0]
const managers = team.slice(2, 6).concat(team[7], team[9])

/* ───────────── Clients (Knowledge Base) ───────────── */
export const industries = ['Music', 'OTT', 'E-commerce', 'Electronics', 'Agency', 'Commute Aggregators', 'Food & Delivery', 'Fintech', 'Beauty', 'Gaming', 'Others']
const clientSeed = [
  ['District', 'Music', 89], ['JioHotstar', 'OTT', 67], ['Amazon', 'E-commerce', 55], ['Audible', 'OTT', 50],
  ['TLF Network', 'Others', 43], ['Netflix India', 'OTT', 39], ['Prime Video', 'OTT', 39], ['Sociohub', 'Agency', 37],
  ['Spotify', 'Music', 35], ['Philips', 'Electronics', 35], ['WMG', 'Music', 34], ['Rapido', 'Commute Aggregators', 32],
  ['Zomato', 'Food & Delivery', 31], ['Swiggy Instamart', 'Food & Delivery', 29], ['boAt', 'Electronics', 27], ['CRED', 'Fintech', 26],
  ['Nykaa', 'Beauty', 24], ['Sony Music India', 'Music', 23], ['Zepto', 'E-commerce', 22], ['Myntra', 'E-commerce', 21],
  ['Saregama', 'Music', 19], ['Krafton India', 'Gaming', 18], ['Mamaearth', 'Beauty', 17], ['Lenskart', 'E-commerce', 16],
  ['Uber India', 'Commute Aggregators', 15], ['Groww', 'Fintech', 14], ['Universal Music', 'Music', 14], ['SonyLIV', 'OTT', 13],
  ['Flipkart', 'E-commerce', 13], ['OnePlus', 'Electronics', 12], ['Dream11', 'Gaming', 11], ['Sugar Cosmetics', 'Beauty', 11],
  ['Zee5', 'OTT', 10], ['Ola', 'Commute Aggregators', 9], ['Noise', 'Electronics', 9], ['Slice', 'Fintech', 8],
  ['T-Series', 'Music', 8], ['Blinkit', 'Food & Delivery', 7], ['Minimalist', 'Beauty', 6], ['Paytm Insider', 'Others', 5],
]
export const clients = clientSeed.map(([name, industry, campaigns], i) => ({
  id: 'c' + (i + 1),
  name,
  industry,
  campaigns,
  spend: campaigns * int(3, 14) * 100000,
  lastCampaign: daysAgo(int(1, 120)),
  owner: pick(managers),
  since: 2019 + (i % 6),
  health: pick(['Strong', 'Strong', 'Steady', 'Steady', 'At risk']),
}))
export const kbTotal = 598
const clientByName = Object.fromEntries(clients.map((c) => [c.name, c]))

/* ───────────── Campaigns ───────────── */
export const statuses = [
  { id: 'proposal', label: 'Proposal', tone: 'gray' },
  { id: 'onboarding', label: 'Onboarding', tone: 'blue' },
  { id: 'live', label: 'Live', tone: 'green' },
  { id: 'posting', label: 'Posting', tone: 'violet' },
  { id: 'closing', label: 'Closing', tone: 'amber' },
  { id: 'payment', label: 'Awaiting payment', tone: 'orange' },
  { id: 'closed', label: 'Closed', tone: 'muted' },
]
export const statusById = Object.fromEntries(statuses.map((s) => [s.id, s]))
export const campaignTypes = ['Meme marketing', 'Influencer', 'UGC', 'Music promotion', 'Product launch', 'Always-on', 'Event']

const campaignSeed = [
  ['Stranger Things S5 — Meme Blitz', 'Netflix India', 'Meme marketing', 'live'],
  ['Prime Day Creator Push', 'Amazon', 'Influencer', 'posting'],
  ['Coldplay Ahmedabad Hype Wave', 'District', 'Event', 'closing'],
  ['Audible Originals: Sherlock Retold', 'Audible', 'Influencer', 'live'],
  ['Panchayat S4 Watch-along', 'Prime Video', 'Meme marketing', 'payment'],
  ['IPL on JioHotstar — Match Day Memes', 'JioHotstar', 'Always-on', 'live'],
  ['Wrapped 2026 Creator Takeover', 'Spotify', 'Music promotion', 'onboarding'],
  ['Philips OneBlade Face+Body', 'Philips', 'Product launch', 'posting'],
  ['Diljit Dosanjh “Aura” Release', 'WMG', 'Music promotion', 'live'],
  ['Rapido Bike Taxi — Monsoon Rides', 'Rapido', 'UGC', 'closed'],
  ['Zomato Gold Relaunch', 'Zomato', 'Product launch', 'proposal'],
  ['Instamart 10-min Diwali', 'Swiggy Instamart', 'Meme marketing', 'closing'],
  ['boAt Airdopes Prime Launch', 'boAt', 'Product launch', 'live'],
  ['CRED Bounty Season', 'CRED', 'Influencer', 'proposal'],
  ['Nykaa Pink Friday Haul', 'Nykaa', 'UGC', 'onboarding'],
  ['Arijit Live — Mumbai', 'Sony Music India', 'Music promotion', 'posting'],
  ['Zepto Café Late-night', 'Zepto', 'Meme marketing', 'live'],
  ['Myntra EORS Countdown', 'Myntra', 'Influencer', 'payment'],
  ['Saregama Carvaan Retro Reels', 'Saregama', 'Music promotion', 'closed'],
  ['BGMI 2026 Season Drop', 'Krafton India', 'Event', 'live'],
  ['Mamaearth Onion Hair Stories', 'Mamaearth', 'UGC', 'closing'],
  ['Lenskart Blu Zero Week', 'Lenskart', 'Influencer', 'proposal'],
  ['Uber Moto Office Commute', 'Uber India', 'UGC', 'onboarding'],
  ['Groww Mutual Funds 101', 'Groww', 'Always-on', 'live'],
  ['The Family Man S3 Rewatch', 'Prime Video', 'Meme marketing', 'proposal'],
  ['TLF Network: Hostel Diaries', 'TLF Network', 'Always-on', 'posting'],
  ['Squid Game Finale Night', 'Netflix India', 'Event', 'closed'],
  ['Sociohub × Swiggy Creator Pool', 'Sociohub', 'Influencer', 'live'],
  ['District Movie Tickets — Weekend', 'District', 'Always-on', 'live'],
  ['Universal: AP Dhillon Tour', 'Universal Music', 'Music promotion', 'onboarding'],
  ['SonyLIV Scam 2010 Teasers', 'SonyLIV', 'Meme marketing', 'payment'],
  ['Flipkart Big Billion Unboxings', 'Flipkart', 'UGC', 'closed'],
  ['OnePlus 14 Camera Challenge', 'OnePlus', 'Product launch', 'posting'],
  ['Dream11 World Cup Fantasy', 'Dream11', 'Event', 'closing'],
  ['Sugar Matte As Hell Relaunch', 'Sugar Cosmetics', 'Influencer', 'live'],
  ['Zee5 Originals Binge Bingo', 'Zee5', 'Meme marketing', 'proposal'],
  ['JioHotstar Bigg Boss 20', 'JioHotstar', 'Always-on', 'live'],
  ['Audible Hindi Thrillers', 'Audible', 'Influencer', 'closed'],
  ['Noise Luna Ring 2', 'Noise', 'Product launch', 'onboarding'],
  ['Blinkit Print Store', 'Blinkit', 'UGC', 'live'],
  ['Spotify Pickle Playlists', 'Spotify', 'Music promotion', 'closed'],
  ['Amazon miniTV Shorts', 'Amazon', 'Meme marketing', 'posting'],
]
const platformsAll = ['Instagram', 'YouTube', 'X', 'LinkedIn', 'Snapchat']
export const campaigns = campaignSeed.map(([name, client, type, status], i) => {
  const creators = int(6, 64)
  const deliverables = creators * int(1, 4)
  const delivered = status === 'proposal' || status === 'onboarding' ? int(0, 3)
    : status === 'closed' || status === 'payment' ? deliverables
    : Math.floor(deliverables * (0.25 + rand() * 0.7))
  const views = delivered * int(40, 900) * 1000
  const start = daysAgo(int(-10, 70))
  const end = new Date(start.getTime() + int(10, 45) * 864e5)
  return {
    id: 'WL-' + (1240 + i),
    name,
    client,
    clientId: clientByName[client]?.id,
    industry: clientByName[client]?.industry,
    type,
    status,
    owner: managers[i % managers.length],
    collaborators: [team[(i + 3) % 10], team[(i + 6) % 10]].filter((u) => !u.me),
    budget: int(4, 90) * 100000,
    spent: 0,
    creators,
    deliverables,
    delivered,
    views,
    likes: Math.floor(views * (0.03 + rand() * 0.05)),
    comments: Math.floor(views * (0.001 + rand() * 0.004)),
    er: +(2 + rand() * 7).toFixed(1),
    platforms: platformsAll.filter(() => rand() > 0.45).slice(0, 3).concat(['Instagram']).filter((v, k, a) => a.indexOf(v) === k),
    start,
    end,
    updated: daysAgo(0, int(0, 70)),
    starred: [0, 2, 5, 8].includes(i),
    trend: Array.from({ length: 14 }, (_, k) => Math.max(2, Math.round(20 + Math.sin(k / 2 + i) * 12 + rand() * 18 + k * (status === 'live' ? 3 : 1)))),
    priority: pick(['urgent', 'high', 'medium', 'medium', 'low']),
    brief: pick([
      'Drive conversation around launch week through 30+ meme pages and 10 mid-tier creators. Keep tone irreverent but brand-safe.',
      'Seed the release with tier-2 creators first, then hero creators on day 3. Track saves and shares over likes.',
      'Always-on calendar: 4 posts/week across meme pages, monthly creator integrations, weekly performance read-out.',
      'UGC-led: 40 nano creators unboxing on day 1, stitched into a hero edit for paid amplification.',
      'Tie into cultural moment; reactive posts within 2 hours of episode drops. Approvals via fast lane.',
    ]),
  }
})
campaigns.forEach((c) => (c.spent = Math.round(c.budget * Math.min(1, c.delivered / Math.max(1, c.deliverables)) * (0.8 + rand() * 0.2))))
export const campaignById = Object.fromEntries(campaigns.map((c) => [c.id, c]))
export const activeCampaigns = campaigns.filter((c) => ['live', 'posting', 'onboarding'].includes(c.status))

/* ───────────── Creators ───────────── */
const handleA = ['meme', 'desi', 'bombay', 'delhi', 'chai', 'filmy', 'dank', 'bolly', 'tech', 'vibe', 'pixel', 'sarcastic', 'indian', 'bakchod', 'hostel', 'office', 'pune', 'blr', 'ghanta', 'cinema']
const handleB = ['wala', 'gram', 'hub', 'memes', 'diaries', 'central', 'tales', 'talks', 'official', 'co', 'adda', 'nation', 'files', 'junction', 'squad']
const firstNames = ['Aditi', 'Rohan', 'Sana', 'Vikram', 'Tanya', 'Arjun', 'Nisha', 'Kunal', 'Pooja', 'Rahul', 'Ira', 'Varun', 'Sneha', 'Manav', 'Kavya', 'Yash', 'Ritika', 'Neel', 'Simran', 'Om']
export const creators = Array.from({ length: 140 }, (_, i) => {
  const page = rand() > 0.45
  const followers = page ? int(80, 4200) * 1000 : int(12, 900) * 1000
  return {
    id: 'cr' + i,
    handle: '@' + pick(handleA) + (rand() > 0.5 ? '.' : '_') + pick(handleB) + (rand() > 0.8 ? int(1, 99) : ''),
    name: page ? null : pick(firstNames) + ' ' + pick(['S.', 'K.', 'M.', 'R.', 'P.', 'D.']),
    kind: page ? 'Meme page' : 'Creator',
    platform: pick(['Instagram', 'Instagram', 'Instagram', 'YouTube', 'X']),
    followers,
    er: +(1.5 + rand() * 8).toFixed(1),
    rate: Math.round(followers * (0.02 + rand() * 0.06) / 100) * 100,
    city: pick(['Mumbai', 'Delhi', 'Bengaluru', 'Pune', 'Hyderabad', 'Kolkata', 'Jaipur', 'Chennai', 'Indore', 'Lucknow']),
    hue: int(0, 360),
  }
})

/* ───────────── Submissions / screenshots ───────────── */
const formats = ['Reel', 'Story', 'Static post', 'Carousel', 'Short', 'Tweet', 'Video']
const live = campaigns.filter((c) => ['live', 'posting', 'closing'].includes(c.status))
export const submissions = Array.from({ length: 36 }, (_, i) => {
  const c = live[i % live.length]
  const cr = creators[(i * 7) % creators.length]
  return {
    id: 'SUB-' + (8800 + i),
    campaignId: c.id,
    campaign: c.name,
    client: c.client,
    creator: cr,
    format: pick(formats),
    kind: i % 3 === 0 ? 'screenshot' : 'content',
    submitted: daysAgo(0, i * 2 + int(0, 3)),
    caption: pick([
      'When the episode ends on a cliffhanger and you have work at 9 am 💀',
      'POV: you said “just one more episode” 4 hours ago',
      'Mom: we have Coldplay at home. Coldplay at home:',
      'This sound is living in my head rent-free #ad',
      'Unboxing the thing everyone is talking about — honest review',
      'Rate this fit out of 10 (the sale ends tonight)',
      'Tag the friend who always orders at 2 am',
      'Not me rewatching the trailer 14 times',
    ]),
    views: int(8, 980) * 1000,
    status: 'pending',
    hue: int(0, 360),
  }
})

/* ───────────── Invoices (Approvals) ───────────── */
const vendors = ['Meme Chat Pvt Ltd', 'Pagal Memes LLP', 'Social Kida Media', 'Wondrlab Talent', 'Kulfi Collective', 'Dank Desi Media', 'Bollywood Bubble Pages', 'Hostel Diaries Network', 'Creator Ka Adda', 'Filmy Gyaan Studios', 'Chai Sutta Memes', 'Pixel Pundits']
const services = ['Meme pages · static posts', 'Reels · creator integration', 'Story set · 3 frames', 'YouTube integration · 60s', 'Carousel · 6 slides', 'Twitter threads', 'UGC unboxing videos']
export const invoices = Array.from({ length: 24 }, (_, i) => {
  const c = campaigns[(i * 5 + 1) % campaigns.length]
  const subs = int(2, 28)
  return {
    id: 'inv' + i,
    no: 'INV/26-27/' + String(412 + i * 3).padStart(4, '0'),
    vendor: vendors[i % vendors.length],
    campaignId: c.id,
    campaign: c.name,
    client: c.client,
    service: pick(services),
    submissions: subs,
    approvedSubs: int(0, subs),
    amount: subs * int(6, 45) * 1000,
    date: daysAgo(int(0, 18), int(0, 12)),
    due: daysFrom(int(-4, 21)),
    status: 'pending',
    gst: true,
  }
})

/* ───────────── Pending actions (dashboard) ───────────── */
export const pending = {
  campaigns: campaigns.filter((c) => c.status === 'proposal'),
  closings: campaigns.filter((c) => c.status === 'closing'),
  payments: campaigns.filter((c) => c.status === 'payment'),
  screenshots: submissions.filter((s) => s.kind === 'screenshot'),
  approvals: invoices,
  submissions: submissions.filter((s) => s.kind === 'content'),
}

/* ───────────── Monthly stats ───────────── */
export const months = ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov']
export const monthly = {
  executed: { value: 47, delta: 12.4, series: [28, 31, 26, 34, 38, 33, 36, 41, 39, 44, 42, 47] },
  postings: { value: 1284, delta: 8.1, series: [740, 810, 690, 880, 940, 910, 1010, 1120, 1060, 1190, 1188, 1284] },
  views: { value: 182_400_000, delta: 21.7, series: [88, 94, 81, 102, 118, 109, 124, 141, 133, 160, 150, 182].map((v) => v * 1e6) },
  likes: { value: 9_840_000, delta: -3.2, series: [6.1, 6.6, 5.9, 7.2, 8.4, 7.9, 8.8, 9.9, 9.4, 10.6, 10.2, 9.84].map((v) => v * 1e6) },
  comments: { value: 412_000, delta: 5.6, series: [260, 281, 240, 300, 334, 318, 352, 371, 360, 398, 390, 412].map((v) => v * 1e3) },
}
export const revenue = { value: 38_600_000, delta: 14.2, series: [21, 24, 19, 26, 29, 27, 30, 33, 31, 35, 34, 38.6].map((v) => v * 1e6) }

/* ───────────── Sketchboards ───────────── */
export const sketchboards = [
  { id: 'sb1', title: 'Netflix Q1 pitch — tentpole calendar', client: 'Netflix India', cards: 34, updated: daysAgo(0, 2), owner: team[0], tags: ['Pitch', 'Calendar'], palette: [350, 10, 30] },
  { id: 'sb2', title: 'Spotify Wrapped meme formats', client: 'Spotify', cards: 21, updated: daysAgo(1), owner: team[9], tags: ['Formats'], palette: [140, 160, 120] },
  { id: 'sb3', title: 'District × Coldplay — post-show recap', client: 'District', cards: 48, updated: daysAgo(2), owner: team[3], tags: ['Recap', 'Insights'], palette: [270, 300, 230] },
  { id: 'sb4', title: 'Audience map: Tier-2 Gen Z', client: null, cards: 17, updated: daysAgo(3), owner: team[7], tags: ['Research'], palette: [200, 220, 180] },
  { id: 'sb5', title: 'Prime Video — Panchayat creator list', client: 'Prime Video', cards: 62, updated: daysAgo(4), owner: team[4], tags: ['Creators'], palette: [195, 210, 40] },
  { id: 'sb6', title: 'boAt launch: hook bank', client: 'boAt', cards: 29, updated: daysAgo(6), owner: team[0], tags: ['Hooks', 'Copy'], palette: [0, 20, 340] },
  { id: 'sb7', title: 'Philips grooming — moodboard', client: 'Philips', cards: 40, updated: daysAgo(8), owner: team[5], tags: ['Moodboard'], palette: [210, 190, 230] },
  { id: 'sb8', title: 'JioHotstar IPL reactive playbook', client: 'JioHotstar', cards: 55, updated: daysAgo(9), owner: team[2], tags: ['Playbook'], palette: [260, 280, 30] },
  { id: 'sb9', title: 'Zepto late-night content pillars', client: 'Zepto', cards: 13, updated: daysAgo(12), owner: team[9], tags: ['Strategy'], palette: [290, 270, 50] },
  { id: 'sb10', title: 'CRED tone-of-voice explorations', client: 'CRED', cards: 24, updated: daysAgo(15), owner: team[7], tags: ['Copy'], palette: [0, 0, 40] },
  { id: 'sb11', title: 'Music launches — what worked in 2026', client: null, cards: 71, updated: daysAgo(20), owner: team[1], tags: ['Insights', 'Music'], palette: [160, 330, 50] },
  { id: 'sb12', title: 'Nykaa Pink Friday UGC brief', client: 'Nykaa', cards: 19, updated: daysAgo(26), owner: team[3], tags: ['Brief'], palette: [330, 350, 310] },
]

/* ───────────── CAS dashboards ───────────── */
export const casDashboards = [
  { id: 'cas1', client: 'Netflix India', title: 'Netflix — Always-on Q4', widgets: 14, viewers: 9, refreshed: daysAgo(0, 1), kpi: '41.2M views', locked: false },
  { id: 'cas2', client: 'JioHotstar', title: 'IPL 2026 Season Report', widgets: 22, viewers: 14, refreshed: daysAgo(0, 3), kpi: '96.8M views', locked: false },
  { id: 'cas3', client: 'District', title: 'District Live Events', widgets: 11, viewers: 6, refreshed: daysAgo(1), kpi: '18.4M views', locked: true },
  { id: 'cas4', client: 'Amazon', title: 'Prime Day 2026', widgets: 17, viewers: 11, refreshed: daysAgo(2), kpi: '33.1M views', locked: false },
  { id: 'cas5', client: 'Spotify', title: 'Spotify Music Launches', widgets: 9, viewers: 4, refreshed: daysAgo(3), kpi: '12.9M views', locked: true },
  { id: 'cas6', client: 'Philips', title: 'Philips Grooming H2', widgets: 12, viewers: 5, refreshed: daysAgo(5), kpi: '7.6M views', locked: false },
]

/* ───────────── Activity & notifications ───────────── */
const verbs = [
  (c, u) => `${u.short} moved ${c.name} to ${statusById[c.status].label}`,
  (c, u) => `${u.short} approved 6 submissions on ${c.name}`,
  (c, u) => `${u.short} uploaded the final report for ${c.name}`,
  (c, u) => `${u.short} added 12 creators to ${c.name}`,
  (c, u) => `${u.short} commented on ${c.name}`,
  (c, u) => `${u.short} raised a PO for ${c.name}`,
]
export const activity = Array.from({ length: 28 }, (_, i) => {
  const c = campaigns[(i * 3) % campaigns.length]
  const u = team[(i % 9) + 1]
  return { id: 'a' + i, user: u, campaign: c, text: verbs[i % verbs.length](c, u), at: daysAgo(0, i * 1.7 + 0.2) }
})
export const notifications = [
  { id: 'n1', user: team[1], text: 'shared “IPL 2026 Season Report” with you', at: daysAgo(0, 0.4), unread: true },
  { id: 'n2', user: team[6], text: 'flagged INV/26-27/0415 — GST number mismatch', at: daysAgo(0, 1.2), unread: true },
  { id: 'n3', user: team[3], text: 'mentioned you in Stranger Things S5 — Meme Blitz', at: daysAgo(0, 3), unread: true },
  { id: 'n4', user: team[4], text: 'requested review on Prime Day Creator Push deck', at: daysAgo(0, 6), unread: false },
  { id: 'n5', user: team[8], text: 'added Zomato Gold Relaunch as a proposal', at: daysAgo(1), unread: false },
  { id: 'n6', user: team[2], text: 'closed Rapido Bike Taxi — Monsoon Rides', at: daysAgo(2), unread: false },
]

/* ───────────── Formatting helpers ───────────── */
export const fmt = {
  compact(n) {
    if (n >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, '') + 'B'
    if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M'
    if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K'
    return String(n)
  },
  num: (n) => n.toLocaleString('en-IN'),
  intl: false, // Settings > Preferences > Amounts
  inr(n) {
    if (fmt.intl) {
      if (n >= 1e9) return '₹' + (n / 1e9).toFixed(2).replace(/\.?0+$/, '') + 'B'
      if (n >= 1e6) return '₹' + (n / 1e6).toFixed(2).replace(/\.?0+$/, '') + 'M'
      if (n >= 1e4) return '₹' + (n / 1e3).toFixed(0) + 'K'
      return '₹' + n.toLocaleString('en-US')
    }
    if (n >= 1e7) return '₹' + (n / 1e7).toFixed(2).replace(/\.?0+$/, '') + 'Cr'
    if (n >= 1e5) return '₹' + (n / 1e5).toFixed(1).replace(/\.0$/, '') + 'L'
    return '₹' + n.toLocaleString('en-IN')
  },
  inrFull: (n) => '₹' + n.toLocaleString(fmt.intl ? 'en-US' : 'en-IN'),
  date: (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
  dateLong: (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
  ago(d) {
    const s = (TODAY - d) / 1000
    if (s < 0) { const days = Math.ceil(-s / 86400); return `in ${days}d` }
    if (s < 60) return 'just now'
    if (s < 3600) return Math.floor(s / 60) + 'm ago'
    if (s < 86400) return Math.floor(s / 3600) + 'h ago'
    if (s < 86400 * 30) return Math.floor(s / 86400) + 'd ago'
    return Math.floor(s / 86400 / 30) + 'mo ago'
  },
  agoShort(d) { return fmt.ago(d).replace(' ago', '') },
  pct: (n) => (n > 0 ? '+' : '') + n.toFixed(1) + '%',
}
export const initials = (name) => name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
