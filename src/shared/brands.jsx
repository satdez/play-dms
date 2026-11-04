import { useState } from 'react'

/* Real brands → their primary domain. Logos load from the brand's own favicon/touch icon
   via Google's favicon service. Unknown names (fictional vendors) fall back to a letter mark. */
export const BRAND_DOMAINS = {
  // Clients
  District: 'district.in', JioHotstar: 'jiohotstar.com', Amazon: 'amazon.in', Audible: 'audible.in',
  'Netflix India': 'netflix.com', 'Prime Video': 'primevideo.com', Spotify: 'spotify.com', Philips: 'philips.co.in',
  WMG: 'wmg.com', Rapido: 'rapido.bike', Zomato: 'zomato.com', 'Swiggy Instamart': 'swiggy.com', boAt: 'boat-lifestyle.com',
  CRED: 'cred.club', Nykaa: 'nykaa.com', 'Sony Music India': 'sonymusic.com', Zepto: 'zeptonow.com', Myntra: 'myntra.com',
  Saregama: 'saregama.com', 'Krafton India': 'krafton.com', Mamaearth: 'mamaearth.in', Lenskart: 'lenskart.com',
  'Uber India': 'uber.com', Groww: 'groww.in', 'Universal Music': 'universalmusic.com', SonyLIV: 'sonyliv.com',
  Flipkart: 'flipkart.com', OnePlus: 'oneplus.in', Dream11: 'dream11.com', 'Sugar Cosmetics': 'sugarcosmetics.com',
  Zee5: 'zee5.com', Ola: 'olacabs.com', Noise: 'gonoise.com', Slice: 'sliceit.com', 'T-Series': 'tseries.com',
  Blinkit: 'blinkit.com', Minimalist: 'beminimalist.co', 'Paytm Insider': 'insider.in',
  // Sales prospects
  Bisleri: 'bisleri.com', Tanishq: 'tanishq.co.in', 'Bira 91': 'bira91.com', Licious: 'licious.in', 'Boat Lifestyle': 'boat-lifestyle.com',
  Ixigo: 'ixigo.com', 'Cult.fit': 'cult.fit', 'Nothing India': 'nothing.tech', Pilgrim: 'discoverpilgrim.com', Snitch: 'snitch.co.in',
  Wakefit: 'wakefit.co', 'The Whole Truth': 'thewholetruthfoods.com', 'Rare Rabbit': 'thehouseofrare.com', 'Swiggy Dineout': 'swiggy.com',
  PhonePe: 'phonepe.com', 'Urban Company': 'urbancompany.com', Mokobara: 'mokobara.com', 'Sleepy Owl': 'sleepyowl.co',
  'Blue Tokai': 'bluetokaicoffee.com', 'Kotak 811': 'kotak.com', Unacademy: 'unacademy.com', Dunzo: 'dunzo.com',
  'Ather Energy': 'atherenergy.com', 'Duolingo India': 'duolingo.com',
  // Integrations
  'Zoho People': 'zoho.com', 'Google Workspace': 'workspace.google.com', Slack: 'slack.com', 'Google Drive': 'drive.google.com',
  Instagram: 'instagram.com', RazorpayX: 'razorpay.com', 'Tally Prime': 'tallysolutions.com', 'WhatsApp Business': 'whatsapp.com',
  YouTube: 'youtube.com', Gmail: 'mail.google.com',
  // Agencies
  'Dentsu Creative': 'dentsu.com', Ogilvy: 'ogilvy.com', 'Lowe Lintas': 'mullenlowelintas.in', WATConsult: 'watconsult.com', Schbang: 'schbang.com',
}

export const logoUrl = (name) => {
  const d = BRAND_DOMAINS[name]
  return d ? `https://www.google.com/s2/favicons?domain=${d}&sz=128` : null
}

/** Brand logo tile. Real logo when known, letter mark otherwise (or if the image fails). */
export function BrandLogo({ name, size = 24, radius, hue, className = '' }) {
  const [failed, setFailed] = useState(false)
  const url = logoUrl(name)
  const r = radius ?? Math.round(size * 0.29)
  const style = { width: size, height: size, borderRadius: r, flex: 'none' }
  if (url && !failed) {
    return (
      <span className={'brand-logo ' + className} style={style}>
        <img src={url} alt="" loading="lazy" decoding="async" onError={() => setFailed(true)} draggable={false} />
      </span>
    )
  }
  const h = hue ?? (name.charCodeAt(0) * 37 + name.length * 13) % 360
  return <span className={'logo ' + className} style={{ ...style, background: `oklch(0.6 0.12 ${h})`, fontSize: Math.round(size * 0.44) }}>{name[0]}</span>
}
