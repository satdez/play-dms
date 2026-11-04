import { useEffect, useMemo, useRef, useState } from 'react'
import { Command } from 'cmdk'
import { AnimatePresence, motion, MotionConfig } from 'motion/react'
import {
  Sun, Moon, Search, Bell, Plus, ChevronsUpDown, Check, Inbox, Megaphone, CheckCheck, BookOpen, LayoutGrid, Receipt, Banknote,
  FileSignature, Store, BarChart3, Send, MailOpen, Pin, ChevronRight, Building2,
} from 'lucide-react'
import { useVariantRoot } from '../shared/ui'
import { BrandLogo } from '../shared/brands'
import { Tip, TextMorph, Ticker, SlidePanel, openNewCampaign, EASE, ALT, MOD } from '../shared/motion'
import { ROLES, clients, team, me, fmt } from './data'
import { kbTotal } from '../data'
import { StoreProvider, useStore } from './store'
import { go, Popover, RoleIcon, ExpCtx } from './ui'
import Home from './pages/Home'
import { CampaignList, CampaignPage, PodApprovals } from './pages/Pod'
import { FinCampaigns, FinInvoices, Payments, Requests, Vendors } from './pages/Finance'
import { BdDashboard, Outreach, Proposals, InboundPage } from './pages/Bd'
import Knowledge from './pages/Knowledge'
import Settings, { SETTINGS_FLAT } from './pages/Settings'
import { fmt as baseFmt } from '../data'
import './app.css'
import './pages.css'
import './styles.css'
import './exp.css'
import './settings.css'
import './media.css'
import { Palette, Settings as Gear } from 'lucide-react'
import { PopTuner, PRESETS, TUNE_AXES, normTune, presetOf, applyTune, clearTune, toneSwatch } from './popTune'

export const STYLES = [
  { id: 'paper', label: 'Khadi' },
  { id: 'ink', label: 'Kajal' },
  { id: 'pop', label: 'Pop' },
]
/* Experiences change structure (shell, navigation, default layouts, how records open). Styles only change paint. */
export const EXPERIENCES = [
  { id: 'linear', label: 'Linear' },
  { id: 'vercel', label: 'Vercel' },
  { id: 'attio', label: 'Attio' },
]
const swatch = { paper: ['#fafaf9', '#18181b'], ink: ['#08080a', '#5fcf86'], pop: ['#eeefe9', '#f2bd2f'] }
const Swatch = ({ id, tune }) => {
  const sw = id === 'pop' && tune ? toneSwatch(tune) : swatch[id]
  return (
    <span style={{ width: 14, height: 14, borderRadius: 4, background: sw[0], boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.15)', display: 'inline-grid', placeItems: 'center', flex: 'none' }}>
      <span style={{ width: 6, height: 6, borderRadius: 2, background: sw[1] }} />
    </span>
  )
}
/** Tiny wireframe of each experience's shell. */
const ExpGlyph = ({ id }) => (
  <svg width="22" height="16" viewBox="0 0 22 16" fill="none" style={{ flex: 'none' }} aria-hidden>
    <rect x=".5" y=".5" width="21" height="15" rx="3" stroke="currentColor" opacity=".45" />
    {id === 'linear' && <><path d="M6.5 1v14" stroke="currentColor" opacity=".45" /><rect x="8.5" y="3" width="11" height="10" rx="1.5" fill="currentColor" opacity=".18" /><path d="M10 6h8M10 8.5h8M10 11h6" stroke="currentColor" strokeLinecap="round" /></>}
    {id === 'vercel' && <><path d="M1 4.5h20" stroke="currentColor" opacity=".45" /><rect x="3" y="7" width="7.5" height="6" rx="1.2" stroke="currentColor" /><rect x="11.5" y="7" width="7.5" height="6" rx="1.2" stroke="currentColor" /></>}
    {id === 'attio' && <><path d="M6.5 1v14" stroke="currentColor" opacity=".45" /><path d="M6.5 5.5h15M6.5 8.5h15M6.5 11.5h15M11 5.5v10M16 5.5v10" stroke="currentColor" opacity=".8" /></>}
  </svg>
)
const read = (k, d) => { try { return localStorage.getItem(k) || d } catch { return d } }

const ROLE_KEY = 'wldd-role'
/** Black or white text, whichever reads better on a hex background. */
const readableOn = (hex) => {
  const n = parseInt(hex.replace('#', '').padEnd(6, '0').slice(0, 6), 16)
  const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map((c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.4 ? '#141414' : '#ffffff'
}
const PREF_DEFAULTS = { font: 'style', accent: null, density: 'comfortable', motion: 'full', startRole: 'last', confirmApprove: false, numbers: 'indian', date: 'dmy', week: 'mon', tz: 'Asia/Kolkata' }

function useNav(role, s) {
  const inLead = s.invoices.filter((x) => x.stage === 'lead').length
  const inFin = s.invoices.filter((x) => x.stage === 'finance').length
  const sched = s.invoices.filter((x) => x.stage === 'scheduled').length
  return {
    pod: [
      { to: '/home', label: 'Today', icon: Inbox },
      { to: '/pod/campaigns', label: 'Campaigns', icon: Megaphone },
      { to: '/pod/approvals', label: 'Approvals', icon: CheckCheck, n: inLead },
      { to: '/pod/kb', label: 'Knowledge base', icon: BookOpen },
    ],
    finance: [
      { to: '/home', label: 'Today', icon: Inbox },
      { to: '/finance/campaigns', label: 'Campaigns', icon: LayoutGrid },
      { to: '/finance/invoices', label: 'Invoices', icon: Receipt, n: inFin },
      { to: '/finance/payments', label: 'Payments', icon: Banknote, n: sched },
      { to: '/finance/requests', label: 'Requests', icon: FileSignature, n: s.requests.length },
      { to: '/finance/vendors', label: 'Vendors', icon: Store },
    ],
    bd: [
      { to: '/home', label: 'Today', icon: Inbox },
      { to: '/bd/dashboard', label: 'Dashboard', icon: BarChart3 },
      { to: '/bd/outreach', label: 'Outreach', icon: Send },
      { to: '/bd/proposals', label: 'Proposals', icon: FileSignature },
      { to: '/bd/inbound', label: 'Inbound', icon: MailOpen, n: s.inbound.length },
      { to: '/bd/kb', label: 'Knowledge base', icon: BookOpen },
    ],
  }[role]
}

export default function DmsApp({ path }) {
  return <StoreProvider><Shell path={path} /></StoreProvider>
}

function Shell({ path }) {
  // mode = what the person picked (light · dark · system); theme = what's applied
  const [mode, setMode] = useState(() => { const v = read('wldd-theme', 'light'); return ['light', 'dark', 'system'].includes(v) ? v : 'light' })
  const [sysDark, setSysDark] = useState(() => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false)
  useEffect(() => {
    const m = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (!m) return
    const on = (e) => setSysDark(e.matches)
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [])
  const theme = mode === 'system' ? (sysDark ? 'dark' : 'light') : mode
  const setTheme = (t) => setMode(typeof t === 'function' ? t(theme) : t)
  const [prefs, setPrefsRaw] = useState(() => { try { return { ...PREF_DEFAULTS, ...JSON.parse(read('wldd-prefs', '{}')) } } catch { return PREF_DEFAULTS } })
  const setPrefs = (p) => { setPrefsRaw(p); try { localStorage.setItem('wldd-prefs', JSON.stringify(p)) } catch {} }
  const [role, setRole] = useState(() => {
    const m = path.split('/').filter(Boolean)[0]
    if (['pod', 'finance', 'bd'].includes(m)) return m // deep link decides — no switch animation on load
    if (prefs.startRole !== 'last') return prefs.startRole
    try { return localStorage.getItem(ROLE_KEY) || 'pod' } catch { return 'pod' }
  })
  const [cmd, setCmd] = useState(false)
  const qs = new URLSearchParams(location.search)
  const [style, setStyle] = useState(() => { const v = qs.get('style') || read('wldd-style', 'paper'); return swatch[v] ? v : 'paper' })
  const [exp, setExp] = useState(() => { const v = qs.get('exp') || read('wldd-exp', 'linear'); return EXPERIENCES.some((x) => x.id === v) ? v : 'linear' })
  const [tune, setTuneRaw] = useState(() => {
    let saved = {}
    try { saved = JSON.parse(read('wldd-pop', '{}')) } catch {}
    const fromUrl = Object.fromEntries(TUNE_AXES.map((a) => [a.id, qs.get(a.id)]).filter(([, v]) => v))
    return normTune({ ...saved, ...fromUrl })
  })
  const setTune = (t) => { setTuneRaw(normTune(t)); setStyle('pop') }
  useVariantRoot('app', theme)
  useEffect(() => {
    applyTune(tune)
    try { localStorage.setItem('wldd-pop', JSON.stringify(tune)) } catch {}
  }, [tune])
  useEffect(() => () => clearTune(), [])
  baseFmt.intl = prefs.numbers === 'intl' // read at render by fmt.inr
  useEffect(() => {
    const d = document.documentElement.dataset
    d.density = prefs.density; d.motion = prefs.motion
    return () => { delete d.density; delete d.motion }
  }, [prefs.density, prefs.motion])
  // Font override + custom accent. Inline custom properties outrank every style/tone block.
  useEffect(() => {
    const r = document.documentElement
    if (prefs.font && prefs.font !== 'style') r.dataset.font = prefs.font; else delete r.dataset.font
    const props = ['--ink', '--ink-fg', '--cta', '--cta-fg', '--cta-lip', '--hl']
    if (prefs.accent) {
      const fg = readableOn(prefs.accent)
      r.style.setProperty('--ink', prefs.accent); r.style.setProperty('--ink-fg', fg)
      r.style.setProperty('--cta', prefs.accent); r.style.setProperty('--cta-fg', fg); r.style.setProperty('--hl', prefs.accent)
      r.style.setProperty('--cta-lip', `color-mix(in oklab, ${prefs.accent} 72%, #000)`)
    } else props.forEach((p) => r.style.removeProperty(p))
    return () => { delete r.dataset.font; props.forEach((p) => r.style.removeProperty(p)) }
  }, [prefs.font, prefs.accent])
  useEffect(() => {
    document.documentElement.dataset.style = style
    document.documentElement.dataset.exp = exp
    try { localStorage.setItem('wldd-theme', mode); localStorage.setItem(ROLE_KEY, role); localStorage.setItem('wldd-style', style); localStorage.setItem('wldd-exp', exp) } catch {}
  }, [mode, role, style, exp])
  useEffect(() => () => { delete document.documentElement.dataset.style; delete document.documentElement.dataset.exp }, [])
  const look = { exp, setExp, style, setStyle, theme, setTheme, mode, setMode, tune, setTune, prefs, setPrefs, styles: STYLES, exps: EXPERIENCES }

  const parts = path.split('/').filter(Boolean) // e.g. ['pod','campaigns','c1','plan']
  const mod = parts[0] || 'home'
  // URL module wins over stored role, so deep links land in the right workspace.
  useEffect(() => { if (['pod', 'finance', 'bd'].includes(mod) && mod !== role) setRole(mod) }, [mod]) // eslint-disable-line

  // Keyboard: ⌘K, C = new campaign (Pod), ⌥1–3 switch role. Capture so pages never see them.
  useEffect(() => {
    const on = (e) => {
      const t = e.target
      const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setCmd((o) => !o); return }
      if ((e.metaKey || e.ctrlKey) && e.key === ',') { e.preventDefault(); go('/settings'); return }
      if (typing || e.metaKey || e.ctrlKey) return
      if (e.altKey && /^[1-3]$/.test(e.key)) { e.preventDefault(); switchRole(ROLES[+e.key - 1].id); return }
      if (e.altKey && e.code === 'KeyE') { e.preventDefault(); setExp((s) => EXPERIENCES[(EXPERIENCES.findIndex((x) => x.id === s) + 1) % EXPERIENCES.length].id); return }
      if (e.altKey && e.code === 'KeyS') { e.preventDefault(); setStyle((s) => STYLES[(STYLES.findIndex((x) => x.id === s) + 1) % STYLES.length].id); return }
      if (e.altKey && e.code === 'KeyP') { e.preventDefault(); const i = PRESETS.findIndex((p) => p.id === presetOf(tune)?.id); setTune(PRESETS[style === 'pop' ? (i + 1) % PRESETS.length : Math.max(i, 0)].v); return }
      if (e.key === 'f' && exp === 'vercel' && !e.altKey) { e.preventDefault(); setCmd(true); return }
      if (e.key === 'c' && role === 'pod' && !e.altKey) { e.preventDefault(); openNewCampaign() }
    }
    window.addEventListener('keydown', on, true)
    return () => window.removeEventListener('keydown', on, true)
  }) // re-bind each render; cheap and keeps role fresh

  const switchRole = (r) => { if (r === role) return; setRole(r); go('/home') }

  let page = null
  if (mod === 'home') page = <Home role={role} />
  else if (mod === 'pod') {
    if (parts[1] === 'campaigns' && parts[2]) page = <CampaignPage id={parts[2]} tab={parts[3] || 'overview'} />
    else if (parts[1] === 'approvals') page = <PodApprovals />
    else if (parts[1] === 'kb') page = <Knowledge base="/pod/kb" id={parts[2]} />
    else page = <CampaignList />
  } else if (mod === 'finance') {
    page = { invoices: <FinInvoices />, payments: <Payments />, requests: <Requests />, vendors: <Vendors /> }[parts[1]] || <FinCampaigns open={parts[2]} />
  } else if (mod === 'settings') {
    page = <Settings section={parts[1]} look={look} />
  } else if (mod === 'bd') {
    page = { outreach: <Outreach />, proposals: <Proposals />, inbound: <InboundPage />, kb: <Knowledge base="/bd/kb" id={parts[2]} /> }[parts[1]] || <BdDashboard />
  }

  const cmdk = <AppCommand open={cmd} setOpen={setCmd} role={role} switchRole={switchRole} look={look} toggleTheme={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))} />
  const body = <MotionConfig reducedMotion={prefs.motion === 'reduced' ? 'always' : 'user'}><div className="d-scroll" key={mod === 'settings' ? 'settings' : mod + '/' + (parts[1] || '') + '/' + (parts[2] || '')}>{page}</div></MotionConfig>

  if (exp === 'vercel') {
    return (
      <ExpCtx.Provider value={exp}>
        <div className="d vx">
          <VxSidebar role={role} switchRole={switchRole} path={path} setCmd={setCmd} look={look} />
          <main className="vx-main">
            <VxBar parts={parts} role={role} />
            {body}
          </main>
          {cmdk}
        </div>
      </ExpCtx.Provider>
    )
  }
  return (
    <ExpCtx.Provider value={exp}>
      <div className="d">
        <Sidebar role={role} switchRole={switchRole} path={path} look={look} />
        <main className="d-main">
          <TopBar parts={parts} role={role} setCmd={setCmd} />
          {body}
        </main>
        {cmdk}
      </div>
    </ExpCtx.Provider>
  )
}

/* ───────── Appearance: experience · style · theme ───────── */
function Appearance({ look, close }) {
  const { exp, setExp, style, setStyle, theme, setTheme, tune, setTune } = look
  return (
    <>
      <div className="pop-h">Experience</div>
      {EXPERIENCES.map((x, i) => (
        <button key={x.id} onClick={() => { setExp(x.id); close() }}>
          <ExpGlyph id={x.id} /> {x.label}
          <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>{exp === x.id && <Check size={14} />}{i === 0 && <kbd className="k">{ALT}E</kbd>}</span>
        </button>
      ))}
      <div className="pop-sep" />
      <div className="pop-h">Style</div>
      {STYLES.map((x, i) => (
        <button key={x.id} onClick={() => setStyle(x.id)}>
          <Swatch id={x.id} tune={tune} /> {x.label}
          <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>{style === x.id && <Check size={14} />}{i === 0 && <kbd className="k">{ALT}S</kbd>}{x.id === 'pop' && <kbd className="k">{ALT}P</kbd>}</span>
        </button>
      ))}
      {style === 'pop' && <PopTuner tune={tune} setTune={setTune} />}
      <div className="pop-sep" />
      <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
        {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />} {theme === 'light' ? 'Dark' : 'Light'} mode
      </button>
      <button onClick={() => { go('/settings/preferences'); close() }}>
        <Gear size={15} /> All preferences<kbd className="k" style={{ marginLeft: 'auto' }}>{MOD},</kbd>
      </button>
    </>
  )
}

/* ───────── Vercel: flat sidebar (scope · Find · nav) + header bar ───────── */
function VxSidebar({ role, switchRole, path, setCmd, look }) {
  const s = useStore()
  const nav = useNav(role, s)
  const r = ROLES.find((x) => x.id === role)
  const pinned = s.campaigns.filter((c) => c.pinned)
  const active = (to) => path === to || (to !== '/home' && path.startsWith(to)) || (to === '/home' && (path === '/' || path === ''))
  return (
    <aside className="vx-side">
      <Popover align="left" width={232} trigger={({ toggle }) => (
        <button className="vx-scope" onClick={toggle}>
          <img src="/wldd-logo.svg" alt="WLDD" />
          <span className="vx-badge"><RoleIcon role={r.id} size={16} /><TextMorph>{r.label}</TextMorph></span>
          <ChevronsUpDown size={14} className="mute" style={{ marginLeft: 'auto' }} />
        </button>
      )}>
        {(close) => ROLES.map((x, i) => (
          <button key={x.id} onClick={() => { close(); switchRole(x.id) }}>
            <RoleIcon role={x.id} /> {x.label}
            <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>{x.id === role && <Check size={14} />}<kbd className="k">{ALT}{i + 1}</kbd></span>
          </button>
        ))}
      </Popover>
      <button className="vx-find" onClick={() => setCmd(true)}><Search size={15} /><span>Find</span><kbd className="k">F</kbd></button>
      <nav className="vx-nav">
        {nav.map((n) => (
          <a key={n.to} href={'#' + n.to} className={'vx-item' + (active(n.to) ? ' on' : '')}>
            <n.icon size={16} strokeWidth={1.75} />{n.label}
            {n.n ? <span className="vx-n num">{n.n}</span> : null}
          </a>
        ))}
      </nav>
      {role === 'pod' && pinned.length > 0 && (
        <>
          <div className="vx-sec">Pinned</div>
          {pinned.map((c) => (
            <a key={c.id} href={`#/pod/campaigns/${c.id}`} className={'vx-item' + (path.includes(c.id) ? ' on' : '')}>
              <BrandLogo name={c.client} size={16} radius={4} /><span className="ell">{c.client}</span>
            </a>
          ))}
        </>
      )}
      <div className="vx-foot">
        <span className="av" style={{ width: 22, height: 22, fontSize: 9, background: 'oklch(0.62 0.13 340)' }}>SH</span>
        <span className="ell grow">{me.name}</span>
        <Popover align="left" width={264} trigger={({ toggle }) => (
          <Tip label="Appearance" kbd={ALT + 'E'} side="top"><button className="b ghost icon sm" onClick={toggle} aria-label="Appearance"><Palette size={15} /></button></Tip>
        )}>
          {(close) => <Appearance look={look} close={close} />}
        </Popover>
        <Tip label="Settings" kbd={MOD + ','} side="top"><a className={'b ghost icon sm' + (path.startsWith('/settings') ? ' on' : '')} href="#/settings" aria-label="Settings"><Gear size={15} /></a></Tip>
        <Notifications />
      </div>
    </aside>
  )
}

function VxBar({ parts, role }) {
  const meta = usePageMeta(parts, role)
  return (
    <header className="vx-bar">
      <div className="vx-bar-l">{meta.detail && <a href={'#' + meta.to} className="vx-back">← {meta.title}</a>}</div>
      <div className="vx-bar-c ell">{meta.detail ? <span className={meta.plain ? '' : 'mono'}>{meta.detail}</span> : <>{meta.title}{meta.count != null && <span className="mute num" style={{ fontWeight: 400, marginLeft: 8 }}>{meta.count}</span>}</>}</div>
      <div className="vx-bar-r">
        {role === 'pod' && <button className="vx-create" onClick={openNewCampaign}><Plus size={15} /> Create New</button>}
      </div>
    </header>
  )
}

/* ───────── Notifications ───────── */
function Notifications() {
  const [unread, setUnread] = useState(3)
  return (
    <Popover width={320} trigger={({ toggle }) => (
      <Tip label="Notifications"><button className="b ghost icon" onClick={() => { toggle(); setUnread(0) }} aria-label="Notifications" style={{ position: 'relative' }}>
        <Bell size={16} />
        <AnimatePresence>{unread > 0 && <motion.i initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.15 }} style={{ position: 'absolute', top: 7, right: 8, width: 7, height: 7, borderRadius: 9, background: 'var(--pink)', boxShadow: '0 0 0 2px var(--surface)' }} />}</AnimatePresence>
      </button></Tip>
    )}>
      {() => (
        <div style={{ padding: 4 }}>
          {[[team[1], 'shared a report', 'Netflix India × Diwali Drop', '12m'], [team[6], 'flagged GST mismatch', 'INV/26-27/0515', '1h'], [team[3], 'mentioned you', 'District × S5 Launch', '3h'], [team[8], 'converted a proposal', 'Licious', '1d']].map(([u, t, c, a], i) => (
            <div key={i} className="row" style={{ alignItems: 'flex-start', gap: 10, padding: '8px 8px' }}>
              <span className="av" style={{ width: 22, height: 22, fontSize: 9, background: `oklch(0.62 0.13 ${u.hue})` }}>{u.name.split(' ').map((p) => p[0]).join('')}</span>
              <div className="grow"><div><b style={{ fontWeight: 600 }}>{u.short}</b> <span className="fg2">{t}</span></div><div className="mute xs ell">{c}</div></div>
              <span className="mute xs">{a}</span>
            </div>
          ))}
        </div>
      )}
    </Popover>
  )
}

/* ───────── Sidebar ───────── */
function Sidebar({ role, switchRole, path, look }) {
  const { theme, setTheme } = look
  const s = useStore()
  const nav = useNav(role, s)
  const r = ROLES.find((x) => x.id === role)
  const idx = ROLES.findIndex((x) => x.id === role)
  const pinned = s.campaigns.filter((c) => c.pinned)
  const active = (to) => path === to || (to !== '/home' && path.startsWith(to)) || (to === '/home' && (path === '/' || path === ''))
  return (
    <aside className="d-side">
      <div className="d-brand">
        <a href="#/home" aria-label="WLDD home"><img src="/wldd-logo.svg" alt="WLDD" /></a>
        <Tip label={theme === 'light' ? 'Dark' : 'Light'}>
          <button className="b ghost icon sm" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} aria-label="Toggle theme">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span key={theme} initial={{ opacity: 0, rotate: -60, scale: 0.7 }} animate={{ opacity: 1, rotate: 0, scale: 1 }} exit={{ opacity: 0, rotate: 60, scale: 0.7 }} transition={{ duration: 0.22, ease: EASE }} style={{ display: 'grid' }}>
                {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
              </motion.span>
            </AnimatePresence>
          </button>
        </Tip>
      </div>

      <Popover align="left" width={216} trigger={({ toggle }) => (
        <button className="d-role press" onClick={toggle}>
          <RoleIcon role={r.id} />
          <TextMorph>{r.label}</TextMorph>
          <span className="d-role-k"><ChevronsUpDown size={13} /></span>
        </button>
      )}>
        {(close) => (
          <>
            <div className="pop-h">Switch workspace</div>
            {ROLES.map((x, i) => (
              <button key={x.id} onClick={() => { close(); switchRole(x.id) }}>
                <RoleIcon role={x.id} /> {x.label}
                <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {x.id === role && <Check size={14} />}<kbd className="k">{ALT}{i + 1}</kbd>
                </span>
              </button>
            ))}
          </>
        )}
      </Popover>

      <SlidePanel k={role} index={idx} className="d-nav-wrap">
        <nav className="d-nav">
          {nav.map((n) => {
            const on = active(n.to)
            return (
              <a key={n.to} href={'#' + n.to} className={'d-item' + (on ? ' on' : '')} title={n.label}>
                <n.icon size={16} strokeWidth={1.75} /> {n.label}
                {n.n ? <span className="n num"><Ticker value={n.n} /></span> : null}
              </a>
            )
          })}
        </nav>
        {role === 'pod' && (
          <>
            <div className="d-sec">Pinned</div>
            {pinned.map((c) => (
              <a key={c.id} href={`#/pod/campaigns/${c.id}`} className={'d-item d-pin' + (path.includes(c.id) ? ' on' : '')}>
                <BrandLogo name={c.client} size={16} radius={4} /><span className="ell">{c.client}</span>
              </a>
            ))}
          </>
        )}
      </SlidePanel>

      <div className="d-side-f">
        <span className="av" style={{ width: 24, height: 24, fontSize: 10, background: 'oklch(0.62 0.13 340)' }}>SH</span>
        <span className="ell grow" style={{ fontWeight: 500 }}>{me.name}</span>
        <Popover align="left" width={264} trigger={({ toggle }) => (
          <Tip label="Appearance" kbd={ALT + 'E'} side="top"><button className="b ghost icon sm" onClick={toggle} aria-label="Appearance"><Palette size={15} /></button></Tip>
        )}>
          {(close) => <Appearance look={look} close={close} />}
        </Popover>
        <Tip label="Settings" kbd={MOD + ','} side="top"><a className={'b ghost icon sm' + (path.startsWith('/settings') ? ' on' : '')} href="#/settings" aria-label="Settings"><Gear size={15} /></a></Tip>
      </div>
    </aside>
  )
}

/* ───────── Top bar ───────── */
const LABEL = { home: 'Today', pod: 'Pod', finance: 'Finance', bd: 'Sales', campaigns: 'Campaigns', approvals: 'Approvals', kb: 'Knowledge base', invoices: 'Invoices', payments: 'Payments', requests: 'Requests', vendors: 'Vendors', outreach: 'Outreach', proposals: 'Proposals', inbound: 'Inbound', dashboard: 'Dashboard' }
/** The page title lives here only — pages don't repeat it. Icon + live count make the space useful. */
function usePageMeta(parts, role) {
  const s = useStore()
  const nav = useNav(role, s)
  if (parts[0] === 'settings') {
    const sec = SETTINGS_FLAT.find((x) => x.id === parts[1]) || SETTINGS_FLAT[0]
    return { title: 'Settings', icon: Gear, to: '/settings', detail: sec.label, plain: true }
  }
  const home = !parts.length || parts[0] === 'home'
  const sec = home ? 'home' : parts[1] || (parts[0] === 'bd' ? 'dashboard' : 'campaigns')
  const to = home ? '/home' : `/${parts[0]}/${sec}`
  const item = nav.find((n) => n.to === to)
  const count = {
    campaigns: s.campaigns.length, kb: kbTotal, invoices: s.invoices.length, payments: s.invoices.filter((x) => x.stage === 'scheduled').length,
    requests: s.requests.length, vendors: s.vendors.length, outreach: s.outreach.length, proposals: s.proposals.length, inbound: s.inbound.length,
    approvals: s.invoices.filter((x) => x.stage === 'lead').length,
  }[sec]
  const c = parts[2] && s.campaigns.find((x) => x.id === parts[2])
  return { title: LABEL[sec], icon: item?.icon, to, count, detail: c ? c.code : null }
}

function Crumb({ meta }) {
  const I = meta.icon
  return (
    <div className="d-crumb">
      {meta.detail ? (
        <>
          <a href={'#' + meta.to} className="row" style={{ gap: 8 }}>{I && <I size={15} />}{meta.title}</a>
          <ChevronRight size={13} className="mute" />
          <span className={'cur' + (meta.plain ? '' : ' mono')}>{meta.detail}</span>
        </>
      ) : (
        <span className="cur row" style={{ gap: 8 }}>{I && <I size={15} className="mute" />}{meta.title}{meta.count != null && <span className="mute num" style={{ fontWeight: 400 }}>{meta.count}</span>}</span>
      )}
    </div>
  )
}

function TopBar({ parts, role, setCmd }) {
  const meta = usePageMeta(parts, role)
  return (
    <header className="d-top">
      <Crumb meta={meta} />
      <div className="d-top-r">
        <Tip label="Search" kbd={MOD + 'K'}><button className="b ghost icon" onClick={() => setCmd(true)} aria-label="Search"><Search size={16} /></button></Tip>
        <Notifications />
        {role === 'pod' && parts[0] !== 'settings' && <Tip label="New campaign" kbd="C"><button className="b ink" onClick={openNewCampaign} style={{ marginLeft: 6 }}><Plus size={15} /> New</button></Tip>}
      </div>
    </header>
  )
}

/* ───────── ⌘K ───────── */
function AppCommand({ open, setOpen, role, switchRole, toggleTheme, look }) {
  const s = useStore()
  const [q, setQ] = useState('')
  useEffect(() => { if (!open) setQ('') }, [open])
  const run = (fn) => () => { setOpen(false); fn() }
  const nav = useNav(role, s)
  return (
    <Command.Dialog open={open} onOpenChange={setOpen} label="Search" className="cmdk" overlayClassName="cmdk-overlay" contentClassName="cmdk-content" loop>
      <Command.Input value={q} onValueChange={setQ} placeholder="Search or jump to…" />
      <Command.List>
        <Command.Empty>Nothing found</Command.Empty>
        {!q && (
          <Command.Group heading="Go to">
            {nav.map((n) => <Command.Item key={n.to} value={'go ' + n.label} onSelect={run(() => go(n.to))}><n.icon size={15} /> {n.label}</Command.Item>)}
          </Command.Group>
        )}
        <Command.Group heading="Campaigns">
          {s.campaigns.slice(0, q ? 40 : 5).map((c) => (
            <Command.Item key={c.id} value={c.name + ' ' + c.code} onSelect={run(() => go(`/pod/campaigns/${c.id}`))}><Megaphone size={15} /> <span className="cmdk-t">{c.name}</span><span className="cmdk-meta">{c.code}</span></Command.Item>
          ))}
        </Command.Group>
        {q && (
          <Command.Group heading="Clients">
            {clients.map((c) => <Command.Item key={c.id} value={'client ' + c.name} onSelect={run(() => go(`/${role === 'bd' ? 'bd' : 'pod'}/kb/${c.id}`))}><Building2 size={15} /> {c.name}<span className="cmdk-meta">{c.campaigns}</span></Command.Item>)}
          </Command.Group>
        )}
        <Command.Group heading="Actions">
          <Command.Item onSelect={run(openNewCampaign)}><Plus size={15} /> New campaign</Command.Item>
          {ROLES.filter((r) => r.id !== role).map((r) => <Command.Item key={r.id} value={'switch ' + r.label} onSelect={run(() => switchRole(r.id))}><RoleIcon role={r.id} size={16} /> Switch to {r.label}</Command.Item>)}
          <Command.Item onSelect={run(toggleTheme)}><Moon size={15} /> Toggle theme</Command.Item>
        </Command.Group>
        <Command.Group heading="Settings">
          {SETTINGS_FLAT.map((x) => <Command.Item key={x.id} value={'settings ' + x.label} onSelect={run(() => go('/settings/' + x.id))}><x.icon size={15} /> {x.label}<span className="cmdk-meta">Settings</span></Command.Item>)}
        </Command.Group>
        <Command.Group heading="Experience">
          {EXPERIENCES.map((x) => <Command.Item key={x.id} value={'experience ' + x.label} onSelect={run(() => look.setExp(x.id))}><ExpGlyph id={x.id} /> {x.label}{look.exp === x.id && <Check size={14} style={{ marginLeft: 'auto' }} />}</Command.Item>)}
        </Command.Group>
        <Command.Group heading="Style">
          {STYLES.map((x) => <Command.Item key={x.id} value={'style ' + x.label} onSelect={run(() => look.setStyle(x.id))}><Swatch id={x.id} tune={look.tune} /> {x.label}</Command.Item>)}
          {PRESETS.map((p) => <Command.Item key={p.id} value={'pop ' + p.label} onSelect={run(() => look.setTune(p.v))}><Swatch id="pop" tune={p.v} /> Pop · {p.label}{look.style === 'pop' && presetOf(look.tune)?.id === p.id && <Check size={14} style={{ marginLeft: 'auto' }} />}</Command.Item>)}
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  )
}
