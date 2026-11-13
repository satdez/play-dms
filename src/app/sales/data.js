// Sales portal seeds. Real brand names, invented people, emails and numbers.
// Dates are Date objects; the store revives them from localStorage.
import { team, me, TODAY, campaigns as podCampaigns } from '../data'
import { BRAND_DOMAINS } from '../../shared/brands'

const D = 864e5
export const ago = (d, h = 0) => new Date(TODAY.getTime() - d * D - h * 36e5)
export const ahead = (d, h = 0) => new Date(TODAY.getTime() + d * D + h * 36e5)
/** The demo clock. The app's "today" is fixed and fmt.ago reads anything after it as the future,
    so new events stamp a moment just before it and read "just now". Order comes from list order. */
export const now = () => new Date(TODAY.getTime() - 1000)

export const REPS = [me, team[8], team[2], team[7]] // Satish (signed in), Ishaan, Aarav, Zoya
export const repOf = (id) => team.find((u) => u.id === id) || me

/* ───────── Brands (Discover catalogue + accounts) ─────────
   rev = annual revenue in ₹; size = employees. Missing values stay null and show as Unknown. */
const B = (name, cat, hq, size, rev, stage, color, about, competitors) => ({ name, cat, hq, size, rev, stage, color, about, competitors })
const BRANDS = [
  B('Sleepy Owl', 'Beverage', 'Delhi', 180, 950e6, 'Series C', '#1d1d1b', 'Cold brew and coffee D2C, moving into quick commerce.', ['Blue Tokai', 'Third Wave Coffee', 'Starbucks India']),
  B('Ather Energy', 'Mobility', 'Bengaluru', 3200, 17.5e9, 'Public', '#0b7a3b', 'Electric scooters; Rizta family scaling city by city.', ['Ola Electric', 'TVS iQube', 'Bajaj Chetak']),
  B('Mokobara', 'Travel', 'Bengaluru', 260, 1.6e9, 'Series B', '#111111', 'Premium luggage and travel accessories.', ['Uppercase', 'Safari', 'American Tourister']),
  B('The Whole Truth', 'Food', 'Mumbai', 210, 1.2e9, 'Series B', '#f2e7d5', 'Clean-label protein bars and spreads.', ['Yoga Bar', 'RiteBite', 'Super You']),
  B('Tanishq', 'Jewellery', 'Bengaluru', 9000, 4.5e11, 'Public', '#7a1f2b', 'Jewellery brand of the Titan group.', ['Kalyan Jewellers', 'Malabar Gold', 'CaratLane']),
  B('Licious', 'Food', 'Bengaluru', 2400, 6.8e9, 'Series F', '#d0021b', 'Meat and seafood delivery with its own cold chain.', ['FreshToHome', 'Zappfresh', 'Country Delight']),
  B('Cult.fit', 'Fitness', 'Bengaluru', 5200, 9.3e9, 'Series F', '#ff3278', 'Gyms, home workouts and health tracking.', ['Anytime Fitness', 'Gold’s Gym', 'HealthifyMe']),
  B('Snitch', 'Fashion', 'Bengaluru', 650, 2.4e9, 'Series B', '#111111', 'Fast-fashion menswear, online first.', ['Bewakoof', 'The Souled Store', 'Rare Rabbit']),
  B('Blue Tokai', 'Beverage', 'Delhi', 900, 1.9e9, 'Series C', '#1f4fa3', 'Specialty coffee roaster with cafés.', ['Third Wave Coffee', 'Starbucks India', 'Sleepy Owl']),
  B('Duolingo India', 'EdTech', 'Gurugram', 60, null, 'Public (parent)', '#58cc02', 'Language app; India is a top-5 market by users.', ['Unacademy', 'Babbel', 'Cambly']),
  B('Bira 91', 'Beverage', 'Delhi', 700, 7.4e9, 'Series E', '#f6c700', 'Craft beer brand with a loud, young voice.', ['Kingfisher', 'Simba', 'White Owl']),
  B('Wakefit', 'Home', 'Bengaluru', 1800, 10.2e9, 'Pre-IPO', '#5b2d90', 'Mattresses and furniture, D2C.', ['Sleepwell', 'Duroflex', 'The Sleep Company']),
  B('Unacademy', 'EdTech', 'Bengaluru', 2600, 8.9e9, 'Series H', '#08bd80', 'Test-prep platform with live classes.', ['Physics Wallah', 'BYJU’S', 'Vedantu']),
  B('Rare Rabbit', 'Fashion', 'Mumbai', 1400, 6.1e9, 'Bootstrapped', '#1a1a1a', 'Premium menswear, fast-growing offline footprint.', ['Snitch', 'Andamen', 'Bombay Shirt Company']),
  B('Bombay Shaving Company', 'Personal care', 'Delhi', 400, 2.5e9, 'Series D', '#0e3b5c', 'Grooming for men and women.', ['Beardo', 'The Man Company', 'Gillette']),
  B('PhonePe', 'Fintech', 'Bengaluru', 5000, 5.06e10, 'Pre-IPO', '#5f259f', 'Payments, insurance and stock broking.', ['Google Pay', 'Paytm', 'CRED']),
  B('Kotak 811', 'Fintech', 'Mumbai', null, null, 'Bank unit', '#ed1c24', 'Digital savings account from Kotak Mahindra Bank.', ['Jupiter', 'Fi Money', 'IDFC First']),
  B('Urban Company', 'Services', 'Gurugram', 2900, 9.3e9, 'Pre-IPO', '#111111', 'Home services marketplace.', ['Housejoy', 'Pronto', 'Snabbit']),
  B('Nothing India', 'Electronics', 'Delhi', 250, null, 'Series C (parent)', '#d71921', 'Phones and audio with a design-first voice.', ['OnePlus', 'Samsung', 'Motorola']),
  B('Swiggy', 'Food delivery', 'Bengaluru', 5400, 1.52e11, 'Public', '#fc8019', 'Food delivery, Instamart and Dineout.', ['Zomato', 'Zepto', 'Magicpin']),
  B('Meesho', 'E-commerce', 'Bengaluru', 1700, 7.6e10, 'Pre-IPO', '#9f2089', 'Value e-commerce for Bharat.', ['Flipkart Shopsy', 'Amazon', 'Snapdeal']),
  B('Spinny', 'Auto', 'Gurugram', 4100, 3.7e10, 'Series E', '#e2231a', 'Used-car retail with a full-stack promise.', ['Cars24', 'CarDekho', 'Droom']),
  B('Tata Neu', 'E-commerce', 'Mumbai', 1200, null, 'Group unit', '#4c1d95', 'Tata group super-app and loyalty.', ['Flipkart', 'Amazon', 'Paytm']),
  B('Bisleri', 'Beverage', 'Mumbai', 3000, 2.4e10, 'Private', '#0072bc', 'Packaged water, now pushing flavoured drinks.', ['Kinley', 'Aquafina', 'Rail Neer']),
  B('Pilgrim', 'Beauty', 'Mumbai', 520, 3.9e9, 'Series C', '#1f3d2b', 'Skincare built on global beauty secrets.', ['Minimalist', 'Plum', 'Dot & Key']),
  B('Ixigo', 'Travel', 'Gurugram', 550, 9.1e9, 'Public', '#ec5b24', 'Trains, flights and buses for the next billion.', ['MakeMyTrip', 'Cleartrip', 'Yatra']),
  B('Third Wave Coffee', 'Beverage', 'Bengaluru', 1500, 3.1e9, 'Series C', '#1b1b1b', 'Café chain growing past 100 stores.', ['Blue Tokai', 'Starbucks India', 'Barista']),
  B('Plum', 'Beauty', 'Mumbai', 600, 4.0e9, 'Series C', '#7f3c8d', 'Vegan beauty and body care.', ['Mamaearth', 'Minimalist', 'Pilgrim']),
  B('Bewakoof', 'Fashion', 'Mumbai', 800, 2.7e9, 'Acquired', '#fdd835', 'Pop-culture apparel for Gen Z.', ['The Souled Store', 'Snitch', 'Redwolf']),
  B('Atomberg', 'Home', 'Mumbai', 1100, 8.6e9, 'Series C', '#003a70', 'BLDC fans and smart appliances.', ['Havells', 'Crompton', 'Orient']),
  B('Country Delight', 'Food', 'Gurugram', 3500, 1.3e10, 'Series E', '#2e7d32', 'Daily milk and essentials by subscription.', ['Milkbasket', 'Akshayakalpa', 'Licious']),
  B('Ola', 'Mobility', 'Bengaluru', 6000, 2.8e10, 'Private', '#1c1c1c', 'Ride-hailing.', ['Uber India', 'Rapido', 'BluSmart']),
  B('Slice', 'Fintech', 'Bengaluru', 1000, 1.2e9, 'Bank merger', '#6c3cf5', 'Credit and UPI for young India.', ['CRED', 'Jupiter', 'OneCard']),
  B('Zee5', 'OTT', 'Mumbai', 1200, null, 'Group unit', '#8230c6', 'Streaming across Indian languages.', ['SonyLIV', 'JioHotstar', 'Netflix India']),
  // Accounts (existing clients)
  B('Lenskart', 'Eyewear', 'Gurugram', 9000, 6.6e10, 'Public', '#00b9c6', 'Eyewear retail, online and 2,500+ stores.', ['Titan Eye+', 'Specsmakers', 'John Jacobs']),
  B('Zepto', 'Quick commerce', 'Mumbai', 7000, 1.1e11, 'Series G', '#3d0a5f', '10-minute grocery and Zepto Café.', ['Blinkit', 'Swiggy Instamart', 'BigBasket']),
  B('boAt', 'Electronics', 'Delhi', 1300, 3.1e10, 'Pre-IPO', '#e10600', 'Audio and wearables, India’s loudest D2C.', ['Noise', 'JBL', 'OnePlus']),
  B('Mamaearth', 'Beauty', 'Gurugram', 1100, 2.1e10, 'Public', '#00a650', 'Toxin-free beauty under Honasa Consumer.', ['Plum', 'Minimalist', 'WOW Skin Science']),
  B('Nykaa', 'Beauty', 'Mumbai', 4000, 7.9e10, 'Public', '#fc2779', 'Beauty and fashion retail.', ['Purplle', 'Tira', 'Myntra']),
  B('CRED', 'Fintech', 'Bengaluru', 1100, 2.5e10, 'Series F', '#111111', 'Rewards for paying credit cards on time.', ['PhonePe', 'Paytm', 'Slice']),
  B('Myntra', 'Fashion', 'Bengaluru', 5000, 5.4e10, 'Flipkart unit', '#ff3f6c', 'Fashion e-commerce.', ['Ajio', 'Nykaa Fashion', 'Tata Cliq']),
  B('Groww', 'Fintech', 'Bengaluru', 1800, 3.1e10, 'Public', '#00d09c', 'Stocks and mutual funds for first-time investors.', ['Zerodha', 'Upstox', 'Angel One']),
  B('Noise', 'Electronics', 'Gurugram', 800, 1.4e10, 'Series B', '#111111', 'Smartwatches and audio.', ['boAt', 'Fire-Boltt', 'Amazfit']),
  B('Sugar Cosmetics', 'Beauty', 'Mumbai', 1500, 5.1e9, 'Series D', '#111111', 'Bold colour cosmetics.', ['Lakmé', 'Nykaa Cosmetics', 'Swiss Beauty']),
  B('Blinkit', 'Quick commerce', 'Gurugram', 4000, 5.2e10, 'Zomato unit', '#f8cb46', '10-minute delivery, now with Print Store.', ['Zepto', 'Swiggy Instamart', 'BigBasket']),
  B('Dream11', 'Gaming', 'Mumbai', 1000, 6.4e10, 'Series F', '#d4111a', 'Fantasy sports.', ['MPL', 'My11Circle', 'WinZO']),
]
const slug = (n) => n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
export const domainOf = (name) => (BRAND_DOMAINS[name] || slug(name).replace(/-/g, '') + '.com').replace(/^www\./, '')

/* People: invented names; emails on the brand's domain. */
const FIRST = ['Aditi', 'Karan', 'Shreya', 'Rohit', 'Neha', 'Varun', 'Isha', 'Arnav', 'Tara', 'Siddharth', 'Pallavi', 'Nikhil', 'Ritu', 'Aman', 'Juhi', 'Dhruv', 'Kavya', 'Manish', 'Sonal', 'Yash', 'Gauri', 'Harsh', 'Mitali', 'Parth', 'Rhea', 'Vivek', 'Anjali', 'Kunal', 'Tanvi', 'Rahul', 'Esha', 'Abhay', 'Naina', 'Omkar', 'Lavanya', 'Samar']
const LAST = ['Rao', 'Malik', 'Jain', 'Verma', 'Gupta', 'Sethi', 'Kulkarni', 'Bose', 'Menon', 'Arora', 'Desai', 'Chawla', 'Bhatt', 'Pillai', 'Saxena', 'Kohli', 'Nanda', 'Ghosh', 'Reddy', 'Tandon', 'Bajaj', 'Mathur', 'Shetty', 'Dutta', 'Kapadia', 'Sood', 'Wadhwa', 'Krishnan']
const TITLES = ['CMO', 'Head of Brand', 'Brand Manager', 'Head of Social', 'VP Marketing', 'Growth Lead', 'Category Head', 'Marketing Director', 'Digital Lead']
const CITY = { Delhi: 'Delhi NCR', Gurugram: 'Delhi NCR', Mumbai: 'Mumbai', Bengaluru: 'Bengaluru' }

/* Who we already know (on file), and who moved from a client of ours. Keys are brand names. */
const KNOWN = { 'Ather Energy': [0], Mokobara: [0], Licious: [1], 'Cult.fit': [0, 2], 'Rare Rabbit': [1], PhonePe: [0], Lenskart: [0, 1], Zepto: [0, 1], boAt: [0], Mamaearth: [0], Nykaa: [0], CRED: [0], Myntra: [0, 1], Groww: [0], Noise: [0], 'Sugar Cosmetics': [0], Blinkit: [0], Dream11: [0], 'Urban Company': [1], Bisleri: [0], Spinny: [1], 'Tata Neu': [0], 'Nothing India': [0], Swiggy: [0], Meesho: [0], 'Bira 91': [0], Ixigo: [0], Wakefit: [0], 'Bombay Shaving Company': [0], 'Kotak 811': [1] }
const MOVED = { 'Ather Energy': ['Zepto', 0], Mokobara: ['Myntra', 0], 'Third Wave Coffee': ['Swiggy Instamart', 1], Spinny: ['CRED', 1] }

export const brands = BRANDS.map((b, i) => {
  const id = slug(b.name)
  const dom = domainOf(b.name)
  const people = Array.from({ length: 3 + (i % 3 === 0 ? 1 : 0) }, (_, k) => {
    const first = FIRST[(i * 5 + k * 7) % FIRST.length], last = LAST[(i * 3 + k * 11) % LAST.length]
    const title = k === 0 ? TITLES[(i + 1) % 3] : TITLES[(i + k * 2) % TITLES.length]
    return {
      id: id + '-' + k, name: `${first} ${last}`, title, brand: b.name,
      email: `${first.toLowerCase()}${k % 2 ? '.' + last.toLowerCase() : ''}@${dom}`,
      phone: k === 0 ? '+91 98' + String(10000000 + ((i * 7919 + k * 104729) % 89999999)).slice(0, 8) : null,
      onFile: (KNOWN[b.name] || []).includes(k),
      moved: MOVED[b.name]?.[1] === k ? MOVED[b.name][0] : null,
      city: CITY[b.hq] || b.hq,
    }
  })
  return { ...b, id, domain: dom, people }
})
export const brandByName = Object.fromEntries(brands.map((b) => [b.name.toLowerCase(), b]))
export const brandOf = (name) => (name ? brandByName[String(name).toLowerCase()] : null)
export const brandById = (id) => brands.find((b) => b.id === id)

/** Budget estimate worked out from revenue: marketing share by category, then the creator/social slice. */
const MKT = { Beauty: 0.14, Fashion: 0.1, Beverage: 0.12, Food: 0.08, 'Personal care': 0.13, EdTech: 0.18, Fintech: 0.09, Electronics: 0.08, Travel: 0.07, Mobility: 0.05, Jewellery: 0.04, Home: 0.07, Fitness: 0.09, Services: 0.08, 'Food delivery': 0.06, 'E-commerce': 0.06, Auto: 0.04, Eyewear: 0.08, 'Quick commerce': 0.05, Gaming: 0.12, OTT: 0.15 }
export function budgetOf(b) {
  if (!b?.rev) return null
  const mkt = MKT[b.cat] ?? 0.07
  const social = b.rev > 5e10 ? 0.06 : 0.1 // bigger brands spend a smaller slice on creators
  const annual = b.rev * mkt * social
  const wallet = 0.1 // share a single creator agency can usually win
  return { rev: b.rev, mkt, social, wallet, annual: Math.round(annual / 1e5) * 1e5, ours: Math.round((annual * wallet) / 1e5) * 1e5 }
}

/* ───────── Case Library ─────────
   Past campaigns used as proof. `campaignId` links to the Pod record where one exists. */
const podIdFor = (client) => podCampaigns.find((c) => c.client === client)?.id || null
const C = (id, client, title, cats, svc, views, er, creators, budget, result, quote, year) => ({ id, client, title, cats, services: svc, views, er, creators, budget, result, quote, year, campaignId: podIdFor(client) })
export const cases = [
  C('k1', 'Zepto', 'Café late-night meme blitz', ['Quick commerce', 'Food', 'Beverage', 'Food delivery'], ['memd', 'amp'], 84e6, 6.8, 42, 32e5, 'Café orders after 11pm up 2.3× in launch week', 'The memes did what three TV spots couldn’t.', 2026),
  C('k2', 'Rapido', 'Monsoon rides UGC', ['Mobility', 'Auto', 'Services'], ['inf', 'amp'], 41e6, 5.1, 60, 24e5, '1.8L app installs attributed in 3 weeks', 'Real riders, real rain. It felt like ours.', 2025),
  C('k3', 'Prime Video', 'Panchayat S4 watch-along', ['OTT', 'EdTech', 'Gaming'], ['memd', 'tt'], 126e6, 7.9, 55, 45e5, '#Panchayat4 trended for 19 hours on launch day', null, 2025),
  C('k4', 'Flipkart', 'Big Billion unboxings', ['E-commerce', 'Electronics', 'Fashion'], ['inf', 'cc'], 98e6, 4.6, 120, 78e5, '40 nano creators, 1 hero edit, 3.1× paid ROAS', 'Fastest creator ramp we have run.', 2025),
  C('k5', 'Saregama', 'Carvaan retro reels', ['Electronics', 'Home', 'Jewellery'], ['inf', 'solo'], 22e6, 8.4, 18, 9e5, 'Sold out the festive batch two weeks early', null, 2024),
  C('k6', 'boAt', 'Airdopes Prime launch', ['Electronics', 'Personal care'], ['amp', 'memd', 'cc'], 67e6, 6.2, 38, 36e5, 'Launch-day sell-out on Amazon in 6 hours', 'Loud, fast, on brand.', 2026),
  C('k7', 'Mamaearth', 'Onion hair stories', ['Beauty', 'Personal care'], ['inf', 'cc'], 39e6, 5.8, 80, 28e5, 'Search for “onion shampoo” up 64% in month one', null, 2025),
  C('k8', 'Myntra', 'EORS countdown', ['Fashion', 'E-commerce'], ['inf', 'amp'], 112e6, 4.9, 95, 62e5, 'Wishlists up 41% in the 5 days before sale', 'They owned the countdown.', 2026),
  C('k9', 'CRED', 'Bounty season', ['Fintech'], ['memd', 'tt', 'amp'], 54e6, 7.2, 30, 41e5, 'Bounty opt-ins 2.6× the previous season', null, 2025),
  C('k10', 'Netflix India', 'Stranger Things S5 meme blitz', ['OTT', 'Gaming', 'EdTech'], ['memd', 'amp'], 143e6, 8.8, 64, 58e5, 'Most-shared Netflix India post of the year', 'WLDD speaks internet better than anyone.', 2026),
  C('k11', 'Groww', 'Mutual funds 101, always-on', ['Fintech', 'EdTech'], ['amp', 'aca'], 47e6, 5.5, 24, 34e5, 'SIP sign-ups from social up 38% over 6 months', null, 2026),
]
export const caseById = (id) => cases.find((c) => c.id === id)
/** Best proof for a brand: same category first, then the biggest results. */
export function proofFor(brandName, n = 2) {
  const b = brandOf(brandName)
  const scored = cases.map((c) => ({ c, s: (b && c.cats.includes(b.cat) ? 10 : 0) + c.er + c.views / 5e7 }))
  return scored.sort((x, y) => y.s - x.s).slice(0, n).map((x) => x.c)
}

/* ───────── Daily Feed signals ───────── */
const S = (id, brand, kind, title, at, why, angle, rel) => ({ id, brand, kind, title, at, why, angle, rel, rating: null, status: 'new' })
export const SIGNAL_KIND = { funding: 'Funding', launch: 'Launch', leadership: 'Leadership', expansion: 'Expansion', hiring: 'Hiring', spend: 'Spend' }
const signals = [
  S('g1', 'Ather Energy', 'launch', 'Rizta rolls out in 12 new cities', ago(0, 2), 'New cities need local awareness fast; launches are when creator budgets open.', 'City-by-city creator relay, Rapido proof for mobility.', { kind: 'moved', note: 'Ex-Zepto contact is now Head of Brand' }),
  S('g2', 'Sleepy Owl', 'funding', 'Raised ₹120Cr Series C', ago(0, 5), 'Fresh money usually goes to brand and distribution in the next two quarters.', 'Own late-night cravings, Zepto Café proof.', { kind: 'cold' }),
  S('g3', 'Mokobara', 'leadership', 'New CMO joins from Myntra', ago(0, 7), 'A new CMO reviews agencies in the first 90 days.', 'Lead with the Myntra EORS case they already know.', { kind: 'moved', note: 'Their new CMO worked with us at Myntra' }),
  S('g4', 'Licious', 'leadership', 'Appoints a new Head of Brand', ago(0, 9), 'New brand heads look for quick wins before festive.', 'Festive meat-and-meme calendar.', { kind: 'known', note: 'One contact on file' }),
  S('g5', 'The Whole Truth', 'launch', 'Protein bars enter quick commerce', ago(1), 'Quick commerce launches live or die in the first 3 weeks of visibility.', 'Pair with Zepto Café-style late-night snacking memes.', { kind: 'cold' }),
  S('g6', 'Lenskart', 'spend', 'Spend with us down 32% this quarter', ago(1, 3), 'Our largest eyewear account is cooling; renewal is in 5 weeks.', 'Bring a Blu Zero sequel before the renewal call.', { kind: 'client' }),
  S('g7', 'Snitch', 'funding', 'Raised ₹110Cr Series B', ago(1, 6), 'Menswear D2C after funding: more drops, more creators.', 'Weekly drop memes; Myntra EORS proof.', { kind: 'cold' }),
  S('g8', 'Cult.fit', 'expansion', 'Opening 40 gyms in tier-2 cities', ago(2), 'Tier-2 openings need hyperlocal creators, our strongest bench.', 'Local gym-bro creator pods per city.', { kind: 'known', note: 'Two contacts on file' }),
  S('g9', 'Blue Tokai', 'expansion', '100 new cafés planned for 2027', ago(2, 4), 'Café openings repeat every week: an always-on brief.', 'Always-on opening calendar.', { kind: 'cold' }),
  S('g10', 'Duolingo India', 'hiring', 'Hiring an India social lead', ago(3), 'They are building in-house social; agencies get briefed alongside.', 'Hindi meme pages for the owl.', { kind: 'cold' }),
  S('g11', 'Third Wave Coffee', 'leadership', 'New marketing head from Swiggy Instamart', ago(3, 5), 'Former client contact; warm path to a first brief.', 'Instamart Diwali playbook for café launches.', { kind: 'moved', note: 'Ex-Instamart contact is now marketing head' }),
  S('g12', 'Bira 91', 'launch', 'New summer variant announced', ago(4), 'Seasonal launch with a short window.', 'Summer meme takeover; Netflix-scale reach.', { kind: 'known', note: 'One contact on file' }),
  S('g13', 'Wakefit', 'funding', 'Files for IPO', ago(5), 'Pre-IPO brands invest in brand recall.', 'Sleep memes, always-on.', { kind: 'known', note: 'One contact on file' }),
]

/* ───────── Inbound (Gmail + web form) ───────── */
const inbound = [
  { id: 'in1', name: 'Priya Natarajan', email: 'priya@thirdwavecoffee.in', company: 'Third Wave Coffee', source: 'email', budget: 1500000, at: ago(0, 2), owner: null, status: 'open', summary: 'Meme-led launch for a winter menu, Tier-1 cities.', body: 'Hi team,\n\nWe loved what you did for Zepto Café. We’re launching a winter menu in December and want a meme-first push across Mumbai, Delhi and Bengaluru. Budget is roughly ₹15L including creators.\n\nCould we get on a call this week?\n\nPriya\nBrand Lead, Third Wave Coffee' },
  { id: 'in2', name: 'Rahul Dsouza', email: 'rahul.dsouza@plumgoodness.com', company: 'Plum', source: 'web', budget: 2200000, at: ago(0, 6), owner: null, status: 'open', summary: 'Body care launch, influencer seeding + amplification.' },
  { id: 'in3', name: 'Megha Kapoor', email: 'megha@discoverpilgrim.com', company: 'Pilgrim', source: 'email', budget: 800000, at: ago(1), owner: 'u9', status: 'open', summary: 'Always-on skincare memes, 3-month retainer.', body: 'Hello,\n\nLooking for an always-on meme partner for Q1. Three months to start, ₹8L total. Can you share case studies in beauty?\n\nThanks,\nMegha' },
  { id: 'in4', name: 'Anuj Batra', email: 'anuj.batra@ixigo.com', company: 'Ixigo', source: 'web', budget: 1200000, at: ago(1, 5), owner: 'u3', status: 'open', summary: 'Winter travel sale, UGC + amplification.' },
  { id: 'in5', name: 'Sana Sheikh', email: 'sana@duolingo.com', company: 'Duolingo India', source: 'email', budget: 2500000, at: ago(2), owner: null, status: 'open', summary: 'Unhinged-owl energy, Hindi meme pages, X trend.', body: 'Hey WLDD!\n\nWe want the owl to go viral in Hindi meme culture. Thinking meme pages + a trend on launch day. ~₹25L.\n\nSana' },
  { id: 'in6', name: 'Farhan Ali', email: 'farhan@bewakoof.com', company: 'Bewakoof', source: 'email', budget: 900000, at: ago(2, 6), owner: null, status: 'open', summary: 'Anime merch drop, Gen Z creators.', body: 'Hi,\n\nWe have an anime collab dropping on 1 Dec. Want 20–30 Gen Z creators and some meme pages. Budget ₹9L.\n\nFarhan' },
  { id: 'in7', name: 'Ritika Sharma', email: 'ritika.sharma@atomberg.com', company: 'Atomberg', source: 'web', budget: 3000000, at: ago(3), owner: 'u1', status: 'open', summary: 'Summer fan pre-launch, regional creators in the south.' },
  { id: 'in8', name: 'Vikram Joshi', email: 'vikram@countrydelight.in', company: 'Country Delight', source: 'email', budget: 1800000, at: ago(4), owner: null, status: 'open', summary: 'New city launches, mom creators + local pages.', body: 'Hello WLDD,\n\nWe are entering Pune and Hyderabad next month. Looking for local mom creators and city pages. Around ₹18L.\n\nRegards,\nVikram' },
]

/* ───────── Accounts (existing clients) ───────── */
const A = (brand, owner, spend, prev, services, last, renewal, alerts, opps) => ({ id: slug(brand), brand, owner, spend, prev, services, last, renewal, alerts, opps, since: 2021 + (brand.length % 4) })
const accounts = [
  A('Lenskart', 'u1', 42e5, 62e5, ['inf', 'amp'], ago(38), ahead(34), [{ kind: 'drop', text: 'Spend down 32%' }, { kind: 'renewal', text: 'Renewal in 34 days' }], [{ id: 'o1', kind: 'renewal', title: 'Annual renewal', value: 60e5, why: 'Retainer ends 7 Dec; lock it before Q4 planning.' }, { id: 'o2', kind: 'upsell', title: 'Blu Zero sequel with memes', value: 18e5, why: 'They only buy influencers; meme pages beat it for Zepto.' }]),
  A('Zepto', 'u1', 1.45e7, 1.2e7, ['memd', 'amp', 'inf'], ago(6), ahead(120), [], [{ id: 'o3', kind: 'upsell', title: 'Zepto Café always-on', value: 32e5, why: 'Café drops weekly; move from campaigns to a retainer.' }]),
  A('boAt', 'u9', 88e5, 81e5, ['amp', 'memd', 'cc'], ago(12), ahead(64), [], [{ id: 'o4', kind: 'upsell', title: 'Analytics add-on', value: 6e5, why: 'They ask for weekly reads; Advanced Analytics fits.' }]),
  A('Mamaearth', 'u1', 36e5, 52e5, ['inf', 'cc'], ago(54), ahead(21), [{ kind: 'drop', text: 'Spend down 31%' }, { kind: 'renewal', text: 'Renewal in 21 days' }], [{ id: 'o5', kind: 'renewal', title: 'Renewal · H1 2027', value: 40e5, why: 'Renewal due; spend dipped after a brand-team change.' }]),
  A('Nykaa', 'u3', 1.12e7, 1.05e7, ['inf', 'amp'], ago(9), ahead(150), [], [{ id: 'o6', kind: 'upsell', title: 'Pink Friday meme layer', value: 14e5, why: 'Influencer-only today; memes for sale-day reach.' }]),
  A('CRED', 'u8', 72e5, 69e5, ['memd', 'tt', 'amp'], ago(18), ahead(90), [], []),
  A('Myntra', 'u1', 1.9e7, 1.7e7, ['inf', 'amp'], ago(4), ahead(200), [], [{ id: 'o7', kind: 'upsell', title: 'EORS SOLO creators', value: 22e5, why: 'SOLO creators lifted Flipkart; same audience.' }]),
  A('Groww', 'u9', 52e5, 49e5, ['amp', 'aca'], ago(22), ahead(48), [{ kind: 'renewal', text: 'Renewal in 48 days' }], [{ id: 'o8', kind: 'renewal', title: 'Always-on renewal', value: 56e5, why: 'Six-month always-on wraps in December.' }]),
  A('Noise', 'u3', 21e5, 34e5, ['amp'], ago(71), ahead(12), [{ kind: 'drop', text: 'Spend down 38%' }, { kind: 'renewal', text: 'Renewal in 12 days' }], [{ id: 'o9', kind: 'renewal', title: 'Luna Ring 2 launch', value: 25e5, why: 'Launch in January; win it before renewal lapses.' }]),
  A('Sugar Cosmetics', 'u1', 29e5, 27e5, ['inf'], ago(30), ahead(75), [], [{ id: 'o10', kind: 'upsell', title: 'Meme pages for Matte As Hell', value: 9e5, why: 'Beauty memes did 5.8% ER for Mamaearth.' }]),
  A('Blinkit', 'u8', 64e5, 58e5, ['inf', 'cc'], ago(15), ahead(110), [], []),
  A('Dream11', 'u1', 81e5, 1.02e7, ['memd', 'amp'], ago(44), ahead(26), [{ kind: 'drop', text: 'Spend down 21%' }, { kind: 'renewal', text: 'Renewal in 26 days' }], [{ id: 'o11', kind: 'renewal', title: 'IPL 2027 season', value: 90e5, why: 'IPL brief lands in January; renew early.' }]),
]

/* ───────── Own contacts ───────── */
const contacts = [
  { id: 'ct1', name: 'Juhi Mathur', title: 'Brand Manager', brand: 'Rare Rabbit', email: 'juhi.mathur@thehouseofrare.com', source: 'Event', note: 'Met at Goafest; launching womenswear in spring.', at: ago(3) },
  { id: 'ct2', name: 'Dhruv Pillai', title: 'Head of Social', brand: 'PhonePe', email: 'dhruv@phonepe.com', source: 'Referral', note: 'Referred by Kirsten; wants Share.Market memes.', at: ago(6) },
  { id: 'ct3', name: 'Gauri Desai', title: 'Growth Lead', brand: 'Meesho', email: 'gauri.desai@meesho.com', source: 'LinkedIn', note: 'Replied to a post about the Flipkart case.', at: ago(9) },
  { id: 'ct4', name: 'Omkar Shetty', title: 'Marketing Director', brand: 'Bisleri', email: 'omkar@bisleri.com', source: 'Cold call', note: 'Open to a flavoured-drinks pitch in Q1.', at: ago(14) },
  { id: 'ct5', name: 'Naina Sood', title: 'CMO', brand: 'Atomberg', email: 'naina.sood@atomberg.com', source: 'Event', note: 'Spoke at a D2C summit; summer fans.', at: ago(20) },
]

/* ───────── Pipeline ───────── */
export const DEAL_STAGES = [
  { id: 'new', label: 'New lead', n: 1 },
  { id: 'brief', label: 'Brief', n: 2 },
  { id: 'negotiation', label: 'Negotiation', n: 3 },
  { id: 'pitch', label: 'Pitch', n: 4 },
  { id: 'won', label: 'Won', n: 5 },
  { id: 'lost', label: 'Closed lost', n: 0 },
]
export const stageIx = (id) => ['new', 'brief', 'negotiation', 'pitch', 'won'].indexOf(id)
export const LOST_REASONS = ['Budget', 'Timing', 'Went with another agency', 'No response', 'Scope mismatch', 'In-house team']
export const PODS = ['Kulfi', 'Neon', 'Masala']
const NEXT = { new: 'Send intro email', brief: 'Schedule the discovery call', negotiation: 'Send proposal v2', pitch: 'Book the pitch call', won: 'Hand off to a pod', lost: '' }

/** Build one seeded deal; earlier-stage work is filled in so every tab has content. */
function deal(i, brand, stage, owner, value, source, updatedDays, extra = {}) {
  const b = brandOf(brand)
  const p = b?.people.find((x) => x.onFile) || b?.people[0]
  const ix = stageIx(stage)
  const reached = (s) => (stage === 'lost' ? stageIx(extra.lostAt || 'new') : ix) >= stageIx(s)
  const created = ago(updatedDays + 6 + (i % 9) * 3)
  const history = [{ at: created, text: 'Added from ' + source, kind: 'add', by: owner }]
  const d = {
    id: 'd' + (101 + i), code: 'DL-' + (1101 + i), brand, owner, value, source, stage, created, updated: ago(updatedDays, i % 5),
    contact: p ? { name: p.name, title: p.title, email: p.email } : null,
    services: extra.services || [['amp', 'memd'], ['inf', 'amp'], ['memd', 'tt'], ['inf', 'cc']][i % 4],
    next: extra.next ?? NEXT[stage], due: extra.due ?? (stage === 'won' || stage === 'lost' ? null : ahead((i % 4) - 1)),
    reminders: [], history, proof: proofFor(brand).map((c) => c.id),
    outreach: null, brief: null, call: null, notes: null, scope: null, proposal: null, pitch: null, won: null, lost: null,
  }
  if (reached('brief')) {
    d.outreach = { subject: `${brand} × WLDD`, body: '', sentAt: ago(updatedDays + 5), reply: { at: ago(updatedDays + 4), from: p?.name, text: 'Sounds interesting. Can we talk Thursday?', next: 'Book a call for Thursday' }, callBooked: true }
    history.push({ at: d.outreach.sentAt, text: 'Intro email sent', kind: 'mail', by: owner }, { at: d.outreach.reply.at, text: 'Reply from ' + p?.name, kind: 'reply' })
  }
  if (reached('negotiation')) {
    d.call = { at: ago(updatedDays + 3), done: true }
    d.notes = true
    d.scope = { need: 'Launch reach in metros', services: d.services, budget: value, timeline: '6 weeks from brief' }
    history.push({ at: ago(updatedDays + 3), text: 'Discovery call done', kind: 'call', by: owner })
  }
  if (reached('pitch')) {
    d.proposal = { versions: [{ v: 1, at: ago(updatedDays + 2), note: 'First cut' }], status: 'sent', sentAt: ago(updatedDays + 2), turnaround: 30 + (i % 3) * 14 }
    history.push({ at: ago(updatedDays + 2), text: 'Proposal v1 sent', kind: 'mail', by: owner })
  }
  if (reached('won')) {
    d.pitch = { deck: true, call: { at: ago(updatedDays + 1), done: true }, notes: true, presented: true, shared: 'link' }
    history.push({ at: ago(updatedDays + 1), text: 'Pitch presented', kind: 'call', by: owner })
  }
  if (stage === 'won') {
    d.won = { value, services: d.services, pod: extra.pod || null, campaignId: null, note: '' }
    history.push({ at: ago(updatedDays), text: 'Won at ' + (value / 1e5).toFixed(1).replace(/\.0$/, '') + 'L', kind: 'won', by: owner })
  }
  if (stage === 'lost') {
    d.lost = { reason: extra.reason, note: extra.lostNote || '', revive: null, at: ago(updatedDays), from: extra.lostAt || 'new' }
    history.push({ at: ago(updatedDays), text: 'Closed lost · ' + extra.reason, kind: 'lost', by: owner })
  }
  return d
}
const deals = [
  deal(0, 'Rare Rabbit', 'new', 'u1', 18e5, 'Own contacts', 1),
  deal(1, 'PhonePe', 'new', 'u1', 35e5, 'Own contacts', 2),
  deal(2, 'Unacademy', 'new', 'u1', 22e5, 'Discover', 12),
  deal(3, 'Bombay Shaving Company', 'new', 'u9', 14e5, 'Daily Feed', 3),
  deal(4, 'Kotak 811', 'new', 'u8', 26e5, 'Discover', 4),
  deal(5, 'Urban Company', 'brief', 'u1', 40e5, 'Inbound', 2),
  deal(6, 'Ather Energy', 'brief', 'u8', 45e5, 'Daily Feed', 3),
  deal(7, 'Wakefit', 'brief', 'u1', 28e5, 'Daily Feed', 10),
  deal(8, 'Licious', 'negotiation', 'u3', 38e5, 'Daily Feed', 1),
  deal(9, 'Nothing India', 'negotiation', 'u1', 30e5, 'Discover', 4),
  deal(10, 'Swiggy', 'negotiation', 'u9', 85e5, 'Accounts', 2),
  deal(11, 'Meesho', 'negotiation', 'u1', 55e5, 'Own contacts', 9),
  deal(12, 'Spinny', 'pitch', 'u1', 48e5, 'Discover', 1),
  deal(13, 'Tata Neu', 'pitch', 'u3', 70e5, 'Discover', 3),
  deal(14, 'Bisleri', 'pitch', 'u1', 32e5, 'Own contacts', 11),
  deal(15, 'Bira 91', 'won', 'u1', 42e5, 'Daily Feed', 6, { pod: 'Neon' }),
  deal(16, 'Cult.fit', 'won', 'u9', 36e5, 'Inbound', 9, { pod: 'Kulfi' }),
  deal(17, 'Ola', 'lost', 'u1', 30e5, 'Discover', 8, { reason: 'Budget', lostAt: 'negotiation', lostNote: 'Budget moved to performance for Q4.' }),
  deal(18, 'Slice', 'lost', 'u8', 20e5, 'Daily Feed', 16, { reason: 'Went with another agency', lostAt: 'pitch' }),
  deal(19, 'Zee5', 'lost', 'u1', 24e5, 'Inbound', 21, { reason: 'No response', lostAt: 'new' }),
]
// Some deals carry reminders so the bell and deal pages have something on the calendar.
deals[0].reminders.push({ id: 'r1', text: 'Send intro email', at: ahead(0, 3), done: false })
deals[2].reminders.push({ id: 'r2', text: 'Follow up, no reply in 6 days', at: ago(1), done: false })
deals[7].reminders.push({ id: 'r3', text: 'Chase discovery call slot', at: ahead(1), done: false })
deals[12].reminders.push({ id: 'r4', text: 'Pitch rehearsal', at: ahead(2), done: false })
deals[14].reminders.push({ id: 'r5', text: 'Bisleri pitch call', at: ahead(0, 6), done: false })
// One outreach waiting on a reply, so "follow-ups due" has a real row.
deals[2].outreach = { subject: 'Unacademy × WLDD', body: '', sentAt: ago(6), reply: null, callBooked: false }
deals[2].history.push({ at: ago(6), text: 'Intro email sent', kind: 'mail', by: 'u1' })

const notifs = [
  { id: 'n1', kind: 'reply', text: 'Reply from Licious', ctx: 'Asked for proposal v2 by Friday', to: '/bd/pipeline/d109', at: ago(0, 1), read: false },
  { id: 'n2', kind: 'reminder', text: 'Bisleri pitch call', ctx: 'Today, 4:30 pm', to: '/bd/pipeline/d115', at: ago(0, 2), read: false },
  { id: 'n3', kind: 'follow', text: 'Follow up with Unacademy', ctx: 'No reply in 6 days', to: '/bd/pipeline/d103', at: ago(0, 4), read: false },
  { id: 'n4', kind: 'account', text: 'Noise renewal in 12 days', ctx: 'Spend down 38%', to: '/bd/accounts/noise', at: ago(1), read: true },
  { id: 'n5', kind: 'deal', text: 'Aarav moved Tata Neu to Pitch', ctx: '₹70L', to: '/bd/pipeline/d114', at: ago(1, 4), read: true },
  { id: 'n6', kind: 'deal', text: 'Ishaan won Cult.fit', ctx: 'Handed to Kulfi', to: '/bd/pipeline/d117', at: ago(2), read: true },
]

const savedSearches = [
  { id: 'ss1', label: 'Beauty · Mumbai', q: '', f: { cat: 'Beauty', city: 'Mumbai', rel: 'all', size: 'all' } },
  { id: 'ss2', label: 'Funded D2C, warm', q: '', f: { cat: 'all', city: 'all', rel: 'warm', size: 'mid' } },
]

export const seed = () => ({
  v: 1,
  signals: signals.map((x) => ({ ...x })),
  inbound: inbound.map((x) => ({ ...x })),
  accounts: accounts.map((x) => ({ ...x })),
  contacts: contacts.map((x) => ({ ...x })),
  deals: JSON.parse(JSON.stringify(deals), revive),
  notifs: notifs.map((x) => ({ ...x })),
  saved: savedSearches.map((x) => ({ ...x })),
  revealed: [],
  credits: 48,
})
/** JSON reviver: ISO strings back to Dates. */
export function revive(_, v) { return typeof v === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d/.test(v) ? new Date(v) : v }
