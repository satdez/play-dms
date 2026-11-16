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

/** One brand record with its people. `known`/`moved` say who we already know; `n` how many people Apollo lists. */
function mkBrand(b, i, { known = KNOWN, moved = MOVED, n } = {}) {
  const id = slug(b.name)
  const dom = domainOf(b.name)
  const count = n ? n(i) : 3 + (i % 3 === 0 ? 1 : 0)
  const people = Array.from({ length: count }, (_, k) => {
    const first = FIRST[(i * 5 + k * 7) % FIRST.length], last = LAST[(i * 3 + k * 11) % LAST.length]
    const title = k === 0 ? TITLES[(i + 1) % 3] : TITLES[(i + k * 2) % TITLES.length]
    return {
      id: id + '-' + k, name: `${first} ${last}`, title, brand: b.name,
      email: `${first.toLowerCase()}${k % 2 ? '.' + last.toLowerCase() : ''}@${dom}`,
      phone: k === 0 ? '+91 98' + String(10000000 + ((i * 7919 + k * 104729) % 89999999)).slice(0, 8) : null,
      onFile: (known[b.name] || []).includes(k),
      moved: moved[b.name]?.[1] === k ? moved[b.name][0] : null,
      city: CITY[b.hq] || b.hq,
    }
  })
  return { ...b, id, domain: dom, people, funding: fundOf(b.stage) }
}
/** Funding bucket used by the global filter. */
export const FUNDING = ['Seed', 'Series A', 'Series B', 'C+', 'Public', 'Bootstrapped']
function fundOf(stage = '') {
  if (/^Series [AB]$/.test(stage)) return stage
  if (/^Seed/.test(stage)) return 'Seed'
  if (/Bootstrapped|^Private/.test(stage)) return 'Bootstrapped'
  if (/Public|unit|Acquired|merger/.test(stage)) return 'Public'
  return 'C+'
}
export const brands = BRANDS.map((b, i) => mkBrand(b, i))

/* ───────── More companies in our DB (prospecting) ─────────
   Smaller D2C brands the signals engine picked up. Kept out of `brands` so the Sources Discover table stays as it was. */
const EXTRA_RAW = [
  B('Foxtale', 'Beauty', 'Mumbai', 140, 1.1e9, 'Series B', '#f26b3a', 'Skincare for Gen Z, sunscreen-led.', ['Minimalist', 'Dot & Key', 'Pilgrim']),
  B('Farmley', 'Food', 'Delhi', 160, 2.2e9, 'Series B', '#5b8c2a', 'Healthy snacking: dry fruit, makhana, date bites.', ['Happilo', 'Nutraj', 'Yoga Bar']),
  B('Rage Coffee', 'Beverage', 'Delhi', 110, 7.5e8, 'Series B', '#1c1c1c', 'Plant-based instant coffee, loud packaging.', ['Sleepy Owl', 'Nescafé', 'Blue Tokai']),
  B('Zouk', 'Fashion', 'Mumbai', 150, 9.0e8, 'Series B', '#a4343a', 'Vegan bags and footwear with Indian prints.', ['Hidesign', 'Caprese', 'Mokobara']),
  B('Bombay Shirt Company', 'Fashion', 'Mumbai', 190, 1.4e9, 'Series B', '#20304f', 'Made-to-measure shirts, stores in 12 cities.', ['Rare Rabbit', 'Andamen', 'Snitch']),
  B('Super You', 'Food', 'Mumbai', 70, 3.5e8, 'Series A', '#ff5a1f', 'Protein wafers and chips, celebrity-founded.', ['The Whole Truth', 'Yoga Bar', 'RiteBite']),
  B('Perfora', 'Personal care', 'Gurugram', 80, 4.0e8, 'Series A', '#2bb3a3', 'Oral care: electric brushes and gentle pastes.', ['Colgate', 'Oral-B', 'Bombay Shaving Company']),
  B('Bummer', 'Fashion', 'Bengaluru', 60, 2.0e8, 'Series A', '#ffd23f', 'Loud-print innerwear and loungewear.', ['XYXX', 'Jockey', 'Bewakoof']),
  B('Lahori Zeera', 'Beverage', 'Chandigarh', 180, 3.0e9, 'Series A', '#c8102e', 'Desi soft drinks, zeera and shikanji.', ['Paper Boat', 'Bisleri', 'Coca-Cola']),
  B('Traya', 'Personal care', 'Mumbai', 600, 2.5e9, 'Series B', '#3c2a4d', 'Hair-fall treatment with doctors and diet.', ['Mamaearth', 'Man Matters', 'Bombay Shaving Company']),
  B('Giva', 'Jewellery', 'Bengaluru', 900, 3.2e9, 'Series C', '#1f1f1f', 'Silver and lab-grown diamond jewellery.', ['Tanishq', 'CaratLane', 'Palmonas']),
  B('The Souled Store', 'Fashion', 'Mumbai', 400, 3.6e9, 'Series B', '#d7282f', 'Pop-culture merch and casualwear.', ['Bewakoof', 'Redwolf', 'Snitch']),
]
const KNOWN_X = { Traya: [1], 'The Souled Store': [0], Perfora: [0] }
const MOVED_X = { Foxtale: ['Nykaa', 1], Traya: ['Mamaearth', 0] }
export const extras = EXTRA_RAW.map((b, i) => mkBrand(b, i + 50, { known: KNOWN_X, moved: MOVED_X }))

/* ───────── Apollo (simulated): companies and people we don't have yet ─────────
   Search beyond our DB and Discover fetches move them into our DB for good. */
const APOLLO_RAW = [
  B('Snackible', 'Food', 'Mumbai', 90, 3.0e8, 'Series A', '#e94e1b', 'Baked snacks and healthy namkeen.', []),
  B('Wow! Momo', 'Food', 'Kolkata', 4000, 4.5e9, 'Series D', '#e2001a', 'Momo chain, 600+ outlets.', []),
  B('Chumbak', 'Home', 'Bengaluru', 450, 1.2e9, 'Series C', '#ef4b6c', 'Quirky home décor and accessories.', []),
  B('Mylo', 'Personal care', 'Gurugram', 180, 6.0e8, 'Series B', '#6c3fb4', 'Parenting app and baby care products.', []),
  B('Sirona', 'Personal care', 'Delhi', 120, 4.5e8, 'Series B', '#e84b8a', 'Feminine hygiene, intimate care.', []),
  B('Pee Safe', 'Personal care', 'Gurugram', 150, 5.0e8, 'Series B', '#00a3e0', 'Hygiene and wellness essentials.', []),
  B('Beardo', 'Personal care', 'Ahmedabad', 200, 1.1e9, 'Acquired', '#111111', 'Men’s grooming, beard first.', []),
  B('The Man Company', 'Personal care', 'Gurugram', 170, 1.5e9, 'Series B', '#1b1b1b', 'Premium men’s grooming.', []),
  B('Yoga Bar', 'Food', 'Bengaluru', 300, 1.6e9, 'Acquired', '#f5a623', 'Protein bars and muesli, now ITC.', []),
  B('Epigamia', 'Food', 'Mumbai', 550, 1.8e9, 'Series C', '#d6006e', 'Greek yogurt and dairy snacks.', []),
  B('Paper Boat', 'Beverage', 'Bengaluru', 700, 4.2e9, 'Series D', '#8bc5e6', 'Nostalgic Indian drinks.', []),
  B('Swiss Beauty', 'Beauty', 'Delhi', 380, 2.0e9, 'Bootstrapped', '#111111', 'Affordable colour cosmetics.', []),
  B('Dot & Key', 'Beauty', 'Kolkata', 160, 1.8e9, 'Acquired', '#ff7eb6', 'Fruit-led skincare, a Nykaa brand.', []),
  B('mCaffeine', 'Beauty', 'Mumbai', 190, 1.9e9, 'Series C', '#5a3825', 'Caffeinated personal care.', []),
  B('Neeman’s', 'Fashion', 'Hyderabad', 140, 6.5e8, 'Series B', '#2d4a3e', 'Sustainable everyday footwear.', []),
  B('Uppercase', 'Travel', 'Mumbai', 110, 7.0e8, 'Series B', '#ff6f00', 'Recycled-plastic luggage and backpacks.', []),
  B('Clovia', 'Fashion', 'Gurugram', 600, 2.8e9, 'Acquired', '#e4007c', 'Lingerie and sleepwear.', []),
  B('Libas', 'Fashion', 'Delhi', 350, 5.0e9, 'Series B', '#7a2048', 'Ethnic wear for women.', []),
  B('Suta', 'Fashion', 'Mumbai', 130, 6.0e8, 'Series A', '#b5651d', 'Handwoven sarees and everyday ethnic.', []),
  B('Nua', 'Personal care', 'Mumbai', 95, 4.0e8, 'Series B', '#f04e98', 'Period care by subscription.', []),
  B('BlueStone', 'Jewellery', 'Bengaluru', 2200, 7.7e9, 'Pre-IPO', '#1a3c6e', 'Diamond and gold jewellery.', []),
  B('Kuku FM', 'OTT', 'Mumbai', 400, 1.6e9, 'Series C', '#ff4d4d', 'Audio stories and audiobooks.', []),
  B('Pocket FM', 'OTT', 'Bengaluru', 1100, 1.0e10, 'Series D', '#ff5a36', 'Audio series in Indian languages.', []),
  B('The Ayurveda Co', 'Beauty', 'Delhi', 160, 8.0e8, 'Series B', '#3d6b35', 'Ayurvedic skincare for everyday use.', []),
  B('Boheco', 'Personal care', 'Mumbai', 45, null, 'Seed', '#2f6b3c', 'Hemp-based wellness.', []),
]
export const apollo = APOLLO_RAW.map((b, i) => mkBrand(b, i + 90, { known: {}, moved: {}, n: (k) => 2 + (k % 2) }))

export const brandByName = Object.fromEntries([...brands, ...extras, ...apollo].map((b) => [b.name.toLowerCase(), b]))
export const brandOf = (name) => (name ? brandByName[String(name).toLowerCase()] : null)
export const brandById = (id) => brands.find((b) => b.id === id) || extras.find((b) => b.id === id) || apollo.find((b) => b.id === id)

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
const signals0 = [
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
/* Base enrichment for every signal: intent, service fit, BD relevance, likely deal size, a pitch line, and who to talk to.
   `born` is a person the signal itself introduced (a new CMO): it lands in People on its own. */
const E = (intent, fit, relevance, dealSize, pitch, peopleIds = [], born = null) => ({ intent, fit, relevance, dealSize, pitch, peopleIds, born })
const ENRICH = {
  g1: E('Awareness for city launches', ['inf', 'amp'], 'high', 45e5, 'Rizta: one creator per new city, live in 10 days.', ['ather-energy-0']),
  g2: E('Brand push after funding', ['memd', 'amp'], 'high', 30e5, 'Own the 11pm craving before Diwali.', ['sleepy-owl-0', 'sleepy-owl-1']),
  g3: E('Agency review under a new CMO', ['inf', 'amp'], 'high', 28e5, 'Myntra EORS, now for luggage.', ['mokobara-0']),
  g4: E('Quick festive wins', ['memd', 'inf'], 'med', 38e5, null, [], { name: 'Ritika Bhandari', title: 'Head of Brand' }),
  g5: E('Visibility in quick commerce', ['memd', 'amp'], 'med', 18e5, 'Late-night snack memes, Zepto Café style.', ['the-whole-truth-0']),
  g6: E('Retention; renewal at risk', ['memd', 'inf'], 'high', 60e5, 'Blu Zero sequel before the renewal call.', ['lenskart-0']),
  g7: E('More drops, more creators', ['inf', 'amp'], 'high', 24e5, 'A meme for every weekly drop.', ['snitch-0']),
  g8: E('Local launches in tier-2', ['inf', 'solo'], 'med', 32e5, null, ['cult-fit-0', 'cult-fit-2']),
  g9: E('Always-on café openings', ['inf', 'amp'], 'med', 20e5, 'One opening, one creator, every week.', ['blue-tokai-0']),
  g10: E('Building in-house social', ['memd', 'tt'], 'low', 25e5, null, ['duolingo-india-0']),
  g11: E('Warm path to a first brief', ['memd', 'inf'], 'high', 15e5, 'Instamart Diwali playbook for café launches.', ['third-wave-coffee-1']),
  g12: E('Seasonal launch window', ['memd', 'amp'], 'med', 22e5, null, ['bira-91-0']),
  g13: E('Brand recall before IPO', ['memd', 'amp'], 'med', 28e5, null, ['wakefit-0']),
}
const SX = (id, brand, kind, title, at, why, angle, rel, en) => ({ ...S(id, brand, kind, title, at, why, angle, rel), ...en })
const COLD = { kind: 'cold' }
const signalsNew = [
  SX('g14', 'Foxtale', 'funding', 'Raised ₹150Cr Series B', ago(2, 3), 'Series B skincare brands double creator spend within two quarters.', 'Sunscreen memes for the Gen Z shelf.', { kind: 'moved', note: 'Ex-Nykaa contact is now Head of Brand' }, E('Scale brand after funding', ['inf', 'memd', 'amp'], 'high', 35e5, 'Make SPF the meme of the winter.', ['foxtale-0', 'foxtale-1'])),
  SX('g15', 'Foxtale', 'leadership', 'Hires a Head of Brand from Nykaa', ago(4), 'She ran Pink Friday with us; first 90 days decide the agency roster.', 'Lead with Pink Friday numbers.', { kind: 'moved', note: 'Worked with us at Nykaa' }, E('New brand head, roster review', ['inf', 'amp'], 'high', 30e5, 'Pink Friday, now for Foxtale.', ['foxtale-1'])),
  SX('g16', 'Foxtale', 'launch', 'Sunscreen range goes to Blinkit and Zepto', ago(6), 'Quick commerce shelves reward impulse; memes drive the impulse.', 'Zepto Café late-night playbook.', COLD, E('Visibility in quick commerce', ['memd', 'amp'], 'med', 18e5, null, ['foxtale-0'])),
  SX('g17', 'Foxtale', 'hiring', 'Hiring 6 roles in social and creator marketing', ago(9), 'A growing in-house team still outsources scale.', 'Offer the creator bench, not the strategy.', COLD, E('Build creator programme', ['inf', 'cc'], 'med', 20e5, null, ['foxtale-2'])),
  SX('g18', 'Foxtale', 'expansion', 'Enters the Middle East through Noon', ago(12), 'New market, no local voice yet.', 'Gulf Indian-diaspora creators.', COLD, E('Launch in a new market', ['inf'], 'low', 15e5, null)),
  SX('g19', 'Farmley', 'funding', 'Raised ₹80Cr Series B', ago(1, 4), 'Snacking brands put new money into festive gifting.', 'Diwali gifting memes plus creator unboxings.', COLD, E('Festive push after funding', ['inf', 'memd'], 'high', 26e5, 'Make makhana the Diwali flex.', ['farmley-0'])),
  SX('g20', 'Farmley', 'launch', 'Makhana range launches for Diwali gifting', ago(3, 2), 'Five days to Diwali; gifting decisions happen on Instagram.', 'Unboxing relay with 30 nano creators.', COLD, E('Gifting window', ['inf', 'amp'], 'high', 18e5, null, ['farmley-1'])),
  SX('g21', 'Farmley', 'leadership', 'New CMO joins from Paper Boat', ago(7), 'New CMOs reset agencies; Paper Boat ran meme-led nostalgia.', 'Nostalgia memes for dry fruit.', COLD, E('Agency review under a new CMO', ['memd', 'amp'], 'high', 30e5, 'Nostalgia, but for snacks.', [], { name: 'Harsh Vardhan', title: 'CMO' })),
  SX('g22', 'Farmley', 'expansion', 'Opens 3 warehouses in the south', ago(11), 'Faster delivery in the south; awareness lags supply.', 'Tamil and Kannada meme pages.', COLD, E('Regional awareness', ['memd'], 'low', 12e5, null)),
  SX('g23', 'Sleepy Owl', 'launch', 'Ready-to-drink cans in 8 cities', ago(4, 6), 'RTD launches need trial at scale in week one.', 'Late-night can drops with campus creators.', COLD, E('Trial for a new format', ['inf', 'amp'], 'high', 22e5, 'A can for every 11pm.', ['sleepy-owl-0'])),
  SX('g24', 'Sleepy Owl', 'hiring', 'Hiring a brand partnerships lead', ago(8), 'The partnerships lead will own agency relationships.', 'Get in before the hire lands.', COLD, E('Agency roster forming', ['inf'], 'med', 15e5, null, ['sleepy-owl-2'])),
  SX('g25', 'Sleepy Owl', 'spend', 'Meta ad spend up 3× in October', ago(10), 'Paid is scaling; organic and creator layers usually follow.', 'Creator layer on top of paid.', COLD, E('Paid scaling, organic gap', ['amp', 'cc'], 'med', 20e5, null)),
  SX('g26', 'Snitch', 'expansion', 'Opens 10 stores in tier-2 cities', ago(5), 'Store openings need local footfall fast.', 'City creator pods for each opening.', COLD, E('Footfall for new stores', ['inf', 'solo'], 'med', 18e5, null, ['snitch-1'])),
  SX('g27', 'Snitch', 'leadership', 'New VP Marketing from Myntra', ago(9), 'He bought EORS from us; a warm intro.', 'EORS countdown, menswear cut.', { kind: 'moved', note: 'Worked with us at Myntra' }, E('Warm path through Myntra', ['inf', 'amp'], 'high', 32e5, 'EORS, now for Snitch drops.', [], { name: 'Aman Kohli', title: 'VP Marketing', moved: 'Myntra' })),
  SX('g28', 'Snitch', 'spend', 'Running 40+ Meta ads for the winter drop', ago(2, 8), 'Heavy paid with thin organic; creators lower their CAC.', 'Creator cuts of their best ads.', COLD, E('Lower CAC with creators', ['cc', 'amp'], 'med', 20e5, null)),
  SX('g29', 'Rage Coffee', 'funding', 'Raised ₹60Cr Series B', ago(6, 2), 'Coffee D2C after funding: quick commerce and campus.', 'Campus meme pages.', COLD, E('Brand push after funding', ['memd', 'inf'], 'high', 22e5, 'Loud coffee deserves loud memes.', ['rage-coffee-0'])),
  SX('g30', 'Rage Coffee', 'launch', 'Instant sachets launch in quick commerce', ago(8), 'Sachets are impulse buys; visibility is everything.', 'Exam-season memes.', COLD, E('Visibility in quick commerce', ['memd', 'amp'], 'med', 14e5, null)),
  SX('g31', 'Rage Coffee', 'leadership', 'Appoints a marketing director', ago(13), 'A new director sets the 2027 plan in December.', 'Get on the 2027 plan.', COLD, E('2027 planning', ['memd'], 'med', 18e5, null, [], { name: 'Kavya Sethi', title: 'Marketing Director' })),
  SX('g32', 'Zouk', 'expansion', 'Opens a flagship store in Bengaluru', ago(5, 5), 'Flagship launches want a city-wide moment.', 'Bengaluru creator walk-in day.', COLD, E('City launch moment', ['inf', 'off'], 'med', 12e5, null, ['zouk-0'])),
  SX('g33', 'Zouk', 'funding', 'Series B extension of ₹40Cr', ago(11), 'Extension rounds fund marketing, not hiring.', 'Print-led memes.', COLD, E('Marketing after funding', ['memd', 'inf'], 'med', 16e5, null, ['zouk-1'])),
  SX('g34', 'Bombay Shirt Company', 'launch', 'Launches a womenswear line', ago(3, 7), 'A new audience needs new voices.', 'Women creators who style menswear.', COLD, E('New audience launch', ['inf', 'amp'], 'high', 20e5, 'Shirts, borrowed and owned.', ['bombay-shirt-company-0'])),
  SX('g35', 'Bombay Shirt Company', 'hiring', 'Hiring a head of social', ago(10), 'Until the hire lands, agencies fill the gap.', 'Interim always-on.', COLD, E('Interim social cover', ['memd', 'tt'], 'low', 10e5, null)),
  SX('g36', 'Super You', 'funding', 'Raised ₹30Cr Series A', ago(2, 1), 'Celebrity-founded brands still need creator proof.', 'Gym creators with protein wafers.', COLD, E('Brand push after funding', ['inf'], 'med', 12e5, null, ['super-you-0'])),
  SX('g37', 'Perfora', 'launch', 'Electric toothbrush 2.0 launch', ago(7, 3), 'Gadget launches live on unboxings.', 'boAt Airdopes playbook.', { kind: 'known', note: 'One contact on file' }, E('Launch reach', ['inf', 'amp'], 'med', 14e5, null, ['perfora-0'])),
  SX('g38', 'Traya', 'leadership', 'New CMO joins from Mamaearth', ago(1, 9), 'He knows our onion-hair work first hand.', 'Mamaearth onion stories, for hair fall.', { kind: 'moved', note: 'Their new CMO worked with us at Mamaearth' }, E('Warm path through Mamaearth', ['inf', 'cc'], 'high', 40e5, 'Onion stories, now for Traya.', ['traya-0'])),
  SX('g39', 'Lahori Zeera', 'expansion', 'Enters Maharashtra and Gujarat', ago(6, 8), 'A desi drink in new states needs local humour.', 'Marathi and Gujarati meme pages.', COLD, E('Regional launch', ['memd'], 'med', 24e5, null, ['lahori-zeera-0'])),
  SX('g40', 'Mokobara', 'launch', 'Launches a kids luggage line', ago(8, 4), 'Holiday travel season is the window.', 'Parent creators for winter breaks.', { kind: 'moved', note: 'Their new CMO worked with us at Myntra' }, E('Seasonal launch', ['inf'], 'med', 15e5, null, ['mokobara-1'])),
  SX('g41', 'Giva', 'funding', 'Raised ₹530Cr Series C', ago(12), 'Jewellery D2C heads into wedding season with cash.', 'Wedding-season creators.', COLD, E('Wedding season push', ['inf', 'amp'], 'high', 45e5, 'Silver for every sangeet.', ['giva-0'])),
  SX('g42', 'The Souled Store', 'launch', 'Drops Pushpa 2 merch', ago(13, 2), 'Movie merch rides the release week.', 'Fan-page memes on release day.', { kind: 'known', note: 'One contact on file' }, E('Release-week reach', ['memd', 'tt'], 'med', 12e5, null, ['the-souled-store-0'])),
]
const signals = [...signals0.map((g) => ({ ...g, ...ENRICH[g.id] })), ...signalsNew]

/* ───────── Upcoming moments: festivals and days that open briefs ───────── */
const MO = (id, name, date, cats, region) => ({ id, name, at: new Date(date + 'T09:00:00'), cats, region })
export const moments = [
  MO('m-diwali', 'Diwali', '2026-11-08', ['Jewellery', 'Home', 'Food', 'Beverage', 'Fashion', 'Beauty', 'E-commerce', 'Electronics', 'Personal care'], 'India'),
  MO('m-1111', 'Singles Day 11.11', '2026-11-11', ['E-commerce', 'Fashion', 'Beauty', 'Electronics'], 'Global'),
  MO('m-kids', 'Children’s Day', '2026-11-14', ['EdTech', 'Food', 'Travel'], 'India'),
  MO('m-wed', 'Wedding season', '2026-11-20', ['Jewellery', 'Fashion', 'Beauty', 'Travel'], 'India'),
  MO('m-bf', 'Black Friday', '2026-11-27', ['E-commerce', 'Fashion', 'Electronics', 'Beauty', 'Travel', 'Home'], 'Global'),
  MO('m-xmas', 'Christmas', '2026-12-25', ['Food', 'Beverage', 'Fashion', 'E-commerce', 'Home'], 'Global'),
  MO('m-ny', 'New Year', '2027-01-01', ['Beverage', 'Food', 'Travel', 'Fitness', 'Food delivery', 'Quick commerce'], 'Global'),
  MO('m-rday', 'Republic Day sales', '2027-01-26', ['E-commerce', 'Electronics', 'Auto', 'Fashion'], 'India'),
  MO('m-val', 'Valentine’s Day', '2027-02-14', ['Jewellery', 'Beauty', 'Fashion', 'Food', 'Travel', 'Personal care'], 'Global'),
  MO('m-wd', 'Women’s Day', '2027-03-08', ['Beauty', 'Fintech', 'Fashion', 'Personal care', 'Mobility'], 'Global'),
  MO('m-ipl', 'IPL opening', '2027-03-19', ['Gaming', 'Beverage', 'Food delivery', 'Quick commerce', 'Fintech', 'Electronics', 'OTT'], 'India'),
  MO('m-holi', 'Holi', '2027-03-22', ['Beverage', 'Beauty', 'Personal care', 'Food', 'Quick commerce'], 'India'),
  MO('m-pride', 'Pride Month', '2027-06-01', ['Fashion', 'Beauty', 'OTT', 'Personal care'], 'Global'),
  MO('m-books', 'Book Lovers Day', '2027-08-09', ['EdTech', 'OTT'], 'Niche'),
  MO('m-rakhi', 'Raksha Bandhan', '2027-08-17', ['Jewellery', 'Food', 'E-commerce', 'Fashion'], 'India'),
  MO('m-coffee', 'World Coffee Day', '2027-10-01', ['Beverage'], 'Niche'),
  MO('m-hallo', 'Halloween', '2027-10-31', ['Food', 'Beverage', 'OTT', 'Fashion', 'Gaming'], 'Global'),
]

/* ───────── Meta Ads brand watch (simulated) ─────────
   2–4 live ads for most brands we know; some have none on record, which shows as Unknown. */
const AD_FMT = ['Reel', 'Carousel', 'Image', 'Video']
const AD_HEAD = {
  Beauty: ['Glow that lasts all day', 'Your winter skin fix', 'Dermat-tested, Gen Z-approved', 'Buy 2, get 1 on bestsellers'],
  Fashion: ['The winter drop is live', 'New in: knitwear', 'Sale ends Sunday', 'Built for every day'],
  Food: ['Snack smarter this Diwali', 'Gift boxes, delivered in 10 minutes', 'Protein you’ll actually crave', '20% off your first order'],
  Beverage: ['Your 11pm fix', 'Cold, fast, everywhere', 'New flavour, same kick', 'Stock up for the weekend'],
  'Personal care': ['Results in 8 weeks', 'Doctor-backed care', 'Gentle on you, hard on germs', 'Free consult today'],
  Jewellery: ['Wedding-season edit', 'Silver for every sangeet', 'Lab-grown, lifetime shine', 'Gifts under ₹2,999'],
}
const AD_DEF = ['Diwali offers are live', 'Download the app', 'New launch: see what’s new', 'Limited-time deal']
const hash = (t) => [...t].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)
export function adsFor(b) {
  if (!b) return null
  const h = hash(b.name)
  if (h % 6 === 0) return null // nothing on record
  const heads = AD_HEAD[b.cat] || AD_DEF
  return Array.from({ length: 2 + (h % 3) }, (_, k) => ({
    id: b.id + '-ad' + k, format: AD_FMT[(h + k) % 4], headline: heads[(h + k) % heads.length], started: ago(2 + ((h >> (k + 2)) % 26)),
    platforms: ['Instagram', 'Facebook', 'Messenger', 'Audience Network'].slice(0, 1 + ((h >> k) % 3)),
  }))
}

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

/* Saved views: a name plus a global filter. One may auto-apply when the portal opens. */
export const F_EMPTY = { q: '', scope: 'all', co: [], funding: [], size: [], cat: [], city: [], kind: [], recency: '', rel: [], fit: [], relevance: [], deal: [], role: [], dept: [], contact: '', pflag: [], types: [], owner: '' }
const V = (id, label, f, auto = false) => ({ id, label, f: { ...F_EMPTY, ...f }, auto })
const views = [
  V('v1', 'Fresh · 14 days', { recency: '14d' }, true),
  V('v2', 'Funded D2C', { kind: ['funding'], funding: ['Series A', 'Series B', 'C+'] }),
  V('v3', 'New CMOs', { kind: ['leadership'], role: ['CXO', 'Head'] }),
  V('v4', 'Unclaimed inbound', { types: ['inbound'], owner: 'unclaimed' }),
  V('v5', 'Moments this month', { types: ['moment'], recency: '30d' }),
  V('v6', 'My accounts at risk', { types: ['alert'], owner: 'mine' }),
]

export const seed = () => ({
  v: 2,
  signals: signals.map((x) => ({ ...x })),
  inbound: inbound.map((x) => ({ ...x })),
  accounts: accounts.map((x) => ({ ...x })),
  contacts: contacts.map((x) => ({ ...x })),
  deals: JSON.parse(JSON.stringify(deals), revive),
  notifs: notifs.map((x) => ({ ...x })),
  saved: savedSearches.map((x) => ({ ...x })),
  revealed: [],
  credits: 48,
  // Prospecting (all four BD layouts share these)
  views: views.map((x) => ({ ...x, f: { ...x.f } })),
  db: { co: [], pe: [], stubs: [] }, // what Apollo fetches moved into our DB: company ids, person ids, unknown-name stubs
  pins: [], // pinned company names
  hidden: [], // stream cards dismissed or snoozed: { id, until }
})
/** JSON reviver: ISO strings back to Dates. */
export function revive(_, v) { return typeof v === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d/.test(v) ? new Date(v) : v }
