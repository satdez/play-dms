import { useEffect, useMemo, useRef, useState } from 'react'
import { Command } from 'cmdk'
import { AnimatePresence, motion, MotionConfig } from 'motion/react'
import {
  Sun, Moon, Search, Bell, Plus, ChevronsUpDown, Check, Inbox, Megaphone, CheckCheck, BookOpen, LayoutGrid, Receipt, Banknote,
  FileSignature, Store, BarChart3, Send, MailOpen, Pin, ChevronRight, Building2, Eye, X, PanelLeftClose, PanelLeftOpen, House,
} from 'lucide-react'
import { useVariantRoot } from '../shared/ui'
import { BrandLogo } from '../shared/brands'
import { Tip, TextMorph, Ticker, SlidePanel, openNewCampaign, EASE, ALT, MOD } from '../shared/motion'
import { ROLES, clients, team, me, fmt } from './data'
import { PERSONAS, personaOf, setView } from './personas'
import { kbTotal } from '../data'
import { StoreProvider, useStore } from './store'
import { go, Popover, RoleIcon, ROLE_ICON, ExpCtx } from './ui'
import Home from './pages/Home'
import Hub, { HOME_LAYOUTS } from './pages/Hub'
import { Wldd } from '../loaders/Wldd'
import { CampaignList, CampaignPage, PodApprovals } from './pages/Pod'
import { FinCampaigns, FinInvoices, Payments, Requests, Vendors } from './pages/Finance'
import { BdDashboard, Outreach, Proposals, InboundPage } from './pages/Bd'
import Knowledge from './pages/Knowledge'
import Settings, { SETTINGS_FLAT, SETTINGS_SECTIONS } from './pages/Settings'
import { fmt as baseFmt } from '../data'
import './app.css'
import './pages.css'
import './styles.css'
import './exp.css'
import './settings.css'
import './media.css'
import './mobile.css'
import { Palette, Settings as Gear, Menu as MenuIcon } from 'lucide-react'
import { PopTuner, PRESETS, TUNE_AXES, normTune, presetOf, applyTune, clearTune, toneSwatch, Orb } from './popTune'

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
  { id: 'velin', label: 'Velin' },
]
/** Velin is Linear's structure with the main panel flush, not inset. Everything structural reads it as Linear. */
const shellOf = (exp) => (exp === 'velin' ? 'linear' : exp)
const swatch = { paper: ['#fafaf9', '#18181b'], ink: ['#08080a', '#5fcf86'], pop: ['#eeefe9', '#f2bd2f'] }
const Swatch = ({ id, tune, on }) => {
  const dark = document.documentElement.dataset.theme === 'dark'
  const sw = id === 'pop' && tune ? toneSwatch(tune, dark) : swatch[id]
  return <Orb sw={sw} size={16} on={on} />
}
/** Tiny wireframe of each experience's shell. */
const ExpGlyph = ({ id }) => (
  <svg width="22" height="16" viewBox="0 0 22 16" fill="none" style={{ flex: 'none' }} aria-hidden>
    <rect x=".5" y=".5" width="21" height="15" rx="3" stroke="currentColor" opacity=".45" />
    {id === 'velin' && <><path d="M6.5 1v14" stroke="currentColor" opacity=".45" /><path d="M6.5 1h15v14h-15z" fill="currentColor" opacity=".18" /><path d="M9 5h9M9 7.5h9M9 10h6" stroke="currentColor" strokeLinecap="round" /></>}
    {id === 'linear' && <><path d="M6.5 1v14" stroke="currentColor" opacity=".45" /><rect x="8.5" y="3" width="11" height="10" rx="1.5" fill="currentColor" opacity=".18" /><path d="M10 6h8M10 8.5h8M10 11h6" stroke="currentColor" strokeLinecap="round" /></>}
    {id === 'vercel' && <><path d="M1 4.5h20" stroke="currentColor" opacity=".45" /><rect x="3" y="7" width="7.5" height="6" rx="1.2" stroke="currentColor" /><rect x="11.5" y="7" width="7.5" height="6" rx="1.2" stroke="currentColor" /></>}
    {id === 'attio' && <><path d="M6.5 1v14" stroke="currentColor" opacity=".45" /><path d="M6.5 5.5h15M6.5 8.5h15M6.5 11.5h15M11 5.5v10M16 5.5v10" stroke="currentColor" opacity=".8" /></>}
  </svg>
)
/** Tiny wireframe of each Home layout, drawn like ExpGlyph: frame at .45, structure at full ink. */
const HomeGlyph = ({ id }) => (
  <svg width="22" height="16" viewBox="0 0 22 16" fill="none" style={{ flex: 'none' }} aria-hidden>
    <rect x=".5" y=".5" width="21" height="15" rx="3" stroke="currentColor" opacity=".45" />
    {id === 'stack' && <><rect x="3" y="3" width="4.5" height="3.5" rx=".8" fill="currentColor" opacity=".35" /><rect x="8.75" y="3" width="4.5" height="3.5" rx=".8" fill="currentColor" opacity=".35" /><rect x="14.5" y="3" width="4.5" height="3.5" rx=".8" fill="currentColor" opacity=".35" /><rect x="3.5" y="10" width="15" height="3" rx="1.5" stroke="currentColor" /></>}
    {id === 'split' && <><path d="M15.5 1v14" stroke="currentColor" opacity=".45" /><path d="M17.5 4h2M17.5 6.5h2M17.5 9h2" stroke="currentColor" strokeLinecap="round" opacity=".6" /><rect x="3" y="10" width="10.5" height="3" rx="1.5" stroke="currentColor" /></>}
    {id === 'focus' && <><path d="M8 4.5h6" stroke="currentColor" strokeLinecap="round" /><rect x="4.5" y="6.5" width="13" height="3" rx="1.5" stroke="currentColor" /><path d="M6 12h2.5M9.75 12h2.5M13.5 12h2.5" stroke="currentColor" strokeLinecap="round" opacity=".5" /></>}
    {id === 'dock' && <><path d="M14 1v14" stroke="currentColor" opacity=".45" /><rect x="3" y="3" width="4" height="4" rx=".8" fill="currentColor" opacity=".35" /><rect x="8" y="3" width="4" height="4" rx=".8" fill="currentColor" opacity=".35" /><rect x="3" y="8.5" width="4" height="4" rx=".8" fill="currentColor" opacity=".35" /><rect x="8" y="8.5" width="4" height="4" rx=".8" fill="currentColor" opacity=".35" /><rect x="15.5" y="11" width="4.5" height="2" rx="1" stroke="currentColor" /></>}
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
const PREF_DEFAULTS = { font: 'style', accent: null, density: 'comfortable', motion: 'full', sidebar: 'stack', home: 'stack', viewAs: 'admin', collapsed: false, startRole: 'last', confirmApprove: false, numbers: 'indian', date: 'dmy', week: 'mon', tz: 'Asia/Kolkata' }

/** The persona being previewed (Settings › View as). Shell sets it every render, before any child reads it. */
let VIEW = PERSONAS[0]
/** Workspaces the current persona can open, in ⌥1–3 order. */
const seen = () => ROLES.filter((r) => VIEW.roles.includes(r.id))

function useNav(role, s) {
  return navFor(role, s).filter((n) => !VIEW.hide?.includes(n.to))
}
function navFor(role, s) {
  const inLead = s.invoices.filter((x) => x.stage === 'lead').length
  const inFin = s.invoices.filter((x) => x.stage === 'finance').length
  const sched = s.invoices.filter((x) => x.stage === 'scheduled').length
  return {
    pod: [
      { to: '/home', label: 'Inbox', icon: Inbox },
      { to: '/pod/campaigns', label: 'Campaigns', icon: Megaphone },
      { to: '/pod/approvals', label: 'Approvals', icon: CheckCheck, n: inLead },
      { to: '/pod/kb', label: 'Knowledge base', icon: BookOpen },
    ],
    finance: [
      { to: '/home', label: 'Inbox', icon: Inbox },
      { to: '/finance/campaigns', label: 'Campaigns', icon: LayoutGrid },
      { to: '/finance/invoices', label: 'Invoices', icon: Receipt, n: inFin },
      { to: '/finance/payments', label: 'Payments', icon: Banknote, n: sched },
      { to: '/finance/requests', label: 'Requests', icon: FileSignature, n: s.requests.length },
      { to: '/finance/vendors', label: 'Vendors', icon: Store },
    ],
    bd: [
      { to: '/home', label: 'Inbox', icon: Inbox },
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
  VIEW = personaOf(prefs.viewAs); setView(VIEW)
  const [role, setRole] = useState(() => {
    const m = path.split('/').filter(Boolean)[0]
    if (['pod', 'finance', 'bd'].includes(m)) return m // deep link decides — no switch animation on load
    if (prefs.startRole !== 'last') return prefs.startRole
    try { return localStorage.getItem(ROLE_KEY) || 'pod' } catch { return 'pod' }
  })
  const [cmd, setCmd] = useState(false)
  const [navOpen, setNavOpen] = useState(false) // phone drawer
  const qs = new URLSearchParams(location.search)
  const [style, setStyle] = useState(() => { const v = qs.get('style') || read('wldd-style', 'paper'); return swatch[v] ? v : 'paper' })
  const [exp, setExp] = useState(() => { const v = qs.get('exp') || read('wldd-exp', 'velin'); return EXPERIENCES.some((x) => x.id === v) ? v : 'velin' })
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
    document.documentElement.dataset.exp = shellOf(exp)
    document.documentElement.dataset.shell = exp
    try { localStorage.setItem('wldd-theme', mode); localStorage.setItem(ROLE_KEY, role); localStorage.setItem('wldd-style', style); localStorage.setItem('wldd-exp', exp) } catch {}
  }, [mode, role, style, exp])
  useEffect(() => () => { delete document.documentElement.dataset.style; delete document.documentElement.dataset.exp; delete document.documentElement.dataset.shell }, [])
  const look = { persona: VIEW, exp, setExp, style, setStyle, theme, setTheme, mode, setMode, tune, setTune, prefs, setPrefs, styles: STYLES, exps: EXPERIENCES }

  const parts = path.split('/').filter(Boolean) // e.g. ['pod','campaigns','c1','plan']
  const mod = parts[0] || 'home'
  // URL module wins over stored role, so deep links land in the right workspace.
  useEffect(() => { if (['pod', 'finance', 'bd'].includes(mod) && mod !== role && VIEW.roles.includes(mod)) setRole(mod) }, [mod]) // eslint-disable-line
  // View as: keep the person inside what their role can open.
  useEffect(() => {
    if (!VIEW.roles.includes(role)) setRole(VIEW.roles[0])
    const blocked = (['pod', 'finance', 'bd'].includes(mod) && !VIEW.roles.includes(mod)) || VIEW.hide?.some((h) => path.startsWith(h))
      || (mod === 'settings' && VIEW.id !== 'admin' && SETTINGS_SECTIONS[1].items.some((x) => x.id === parts[1]))
    if (blocked) go(mod === 'settings' ? '/settings/preferences' : '/home')
  }, [prefs.viewAs, path]) // eslint-disable-line

  // Keyboard: ⌘K, C = new campaign (Pod), ⌥1–3 switch role. Capture so pages never see them.
  useEffect(() => {
    const on = (e) => {
      const t = e.target
      const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setCmd((o) => !o); return }
      if ((e.metaKey || e.ctrlKey) && e.key === ',') { e.preventDefault(); go('/settings'); return }
      // ⌘B / Ctrl+B collapses the sidebar (list ⇄ board moved to ⇧⌘B). Instant: keyboard actions never animate.
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'b' && exp !== 'vercel') { e.preventDefault(); setPrefs({ ...prefs, collapsed: !prefs.collapsed }); return }
      if (typing || e.metaKey || e.ctrlKey) return
      if (e.altKey && e.key === '0') { e.preventDefault(); go('/hub'); return }
      if (e.altKey && /^[1-3]$/.test(e.key)) { e.preventDefault(); const t = seen()[+e.key - 1]; if (t) switchRole(t.id); return }
      if (e.altKey && e.code === 'KeyH') { e.preventDefault(); const i = HOME_LAYOUTS.findIndex((x) => x.value === prefs.home); setPrefs({ ...prefs, home: HOME_LAYOUTS[(i + 1) % HOME_LAYOUTS.length].value }); go('/hub'); return }
      if (e.altKey && e.code === 'KeyE') { e.preventDefault(); setExp((s) => EXPERIENCES[(EXPERIENCES.findIndex((x) => x.id === s) + 1) % EXPERIENCES.length].id); return }
      if (e.altKey && e.code === 'KeyS') { e.preventDefault(); setStyle((s) => STYLES[(STYLES.findIndex((x) => x.id === s) + 1) % STYLES.length].id); return }
      if (e.altKey && e.code === 'KeyP') { e.preventDefault(); const i = PRESETS.findIndex((p) => p.id === presetOf(tune)?.id); setTune(PRESETS[style === 'pop' ? (i + 1) % PRESETS.length : Math.max(i, 0)].v); return }
      if (e.key === 'f' && exp === 'vercel' && !e.altKey) { e.preventDefault(); setCmd(true); return }
      if (e.key === 'c' && role === 'pod' && !e.altKey) { e.preventDefault(); openNewCampaign('key') }
    }
    window.addEventListener('keydown', on, true)
    return () => window.removeEventListener('keydown', on, true)
  }) // re-bind each render; cheap and keeps role fresh

  useEffect(() => { setNavOpen(false) }, [path])
  useEffect(() => {
    if (!navOpen) return
    const k = (e) => { if (e.key === 'Escape') setNavOpen(false) }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [navOpen])
  // Phones: split views stack list over detail, so picking a row brings its detail into view.
  useEffect(() => {
    const on = (e) => {
      if (window.innerWidth > 760 || !e.target.closest?.('.split-l .li')) return
      setTimeout(() => document.querySelector('.split-r')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60)
    }
    document.addEventListener('click', on)
    return () => document.removeEventListener('click', on)
  }, [])
  const scrim = <div className={'m-scrim' + (navOpen ? ' on' : '')} onClick={() => setNavOpen(false)} aria-hidden />

  const switchRole = (r) => { if (r === role) return; setRole(r); go('/home') }

  let page = null
  if (mod === 'hub') page = <Hub layout={prefs.home} />
  else if (mod === 'home') page = <Home role={role} />
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
          <VxSidebar role={role} switchRole={switchRole} path={path} setCmd={setCmd} look={look} open={navOpen} />
          {scrim}
          <main className="vx-main">
            <VxBar parts={parts} role={role} openNav={() => setNavOpen(true)} look={look} />
            {body}
          </main>
          {cmdk}
        </div>
      </ExpCtx.Provider>
    )
  }
  return (
    <ExpCtx.Provider value={shellOf(exp)}>
      <div className={'d' + (prefs.collapsed && prefs.sidebar === 'icons' ? ' no-side' : '')}>
        <Sidebar role={role} switchRole={switchRole} path={path} look={look} open={navOpen} />
        {scrim}
        <main className="d-main">
          <TopBar parts={parts} role={role} setCmd={setCmd} openNav={() => setNavOpen(true)} look={look} />
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
      <div className="pop-h">Home</div>
      {HOME_LAYOUTS.map((x, i) => (
        <button key={x.value} onClick={() => { look.setPrefs({ ...look.prefs, home: x.value }); go('/hub'); close() }}>
          <HomeGlyph id={x.value} /> {x.label}
          <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>{look.prefs.home === x.value && <Check size={14} />}{i === 0 && <kbd className="k">{ALT}H</kbd>}</span>
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
function VxSidebar({ role, switchRole, path, setCmd, look, open }) {
  const s = useStore()
  const nav = useNav(role, s)
  const r = ROLES.find((x) => x.id === role)
  const pinned = s.campaigns.filter((c) => c.pinned)
  const active = (to) => path === to || (to !== '/home' && path.startsWith(to)) || (to === '/home' && (path === '/' || path === ''))
  return (
    <aside className={'vx-side' + (open ? ' open' : '')}>
      <Popover align="left" width={232} trigger={({ toggle }) => (
        <button className="vx-scope" onClick={toggle}>
          <Mark />
          <span className="vx-badge"><RoleIcon role={r.id} size={16} /><TextMorph>{r.label}</TextMorph></span>
          <ChevronsUpDown size={14} className="mute" style={{ marginLeft: 'auto' }} />
        </button>
      )}>
        {(close) => seen().map((x, i) => (
          <button key={x.id} onClick={() => { close(); switchRole(x.id) }}>
            <RoleIcon role={x.id} size={22} /> {x.label}
            <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>{x.id === role && <Check size={14} />}<kbd className="k">{ALT}{i + 1}</kbd></span>
          </button>
        ))}
      </Popover>
      <button className="vx-find" onClick={() => setCmd(true)}><Search size={15} /><span>Find</span><kbd className="k">F</kbd></button>
      <nav className="vx-nav">
        <a href="#/hub" className={'vx-item' + (onHub(path) ? ' on' : '')}><House size={16} strokeWidth={1.75} />Home</a>
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
        <Avatar size={22} />
        <span className="ell grow">{VIEW.person.name}</span>
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

/** Shown while previewing another role; one click back to Admin. */
function ViewingAs({ look }) {
  if (look.persona.id === 'admin') return null
  return (
    <Tip label={'Viewing as ' + look.persona.person.name + ' · back to Admin'}>
      <button className="b sm vw-chip" onClick={() => look.setPrefs({ ...look.prefs, viewAs: 'admin' })}><Eye size={13} /><span className="m-hide">{look.persona.label}</span><X size={12} className="mute" /></button>
    </Tip>
  )
}

function VxBar({ parts, role, openNav, look }) {
  const meta = usePageMeta(parts, role)
  return (
    <header className="vx-bar">
      <div className="vx-bar-l"><button className="b ghost icon m-menu" onClick={openNav} aria-label="Menu"><MenuIcon size={18} /></button>{meta.detail && <a href={'#' + meta.to} className="vx-back">← {meta.title}</a>}</div>
      <div className="vx-bar-c ell">{meta.detail ? <span className={meta.plain ? '' : 'mono'}>{meta.detail}</span> : <>{meta.title}{meta.count != null && <span className="mute num" style={{ fontWeight: 400, marginLeft: 8 }}>{meta.count}</span>}</>}</div>
      <div className="vx-bar-r">
        <ViewingAs look={look} />
        {role === 'pod' && parts[0] !== 'hub' && <button className="vx-create" onClick={() => openNewCampaign()}><Plus size={15} /><span className="m-hide">Create New</span></button>}
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

/* ───────── Sidebar ─────────
   Four shapes, picked in Settings › Preferences (prefs.sidebar). Same nav data, same footer controls.
   panel   — logo, workspace switcher, pages
   rail    — workspace rail on the left, the workspace's pages beside it
   icons   — 56px column, labels in tooltips (full labels again in the phone drawer)
   stack   — every workspace in one list; the current one open, the others show their pending total (default)
   Navigation itself never animates: the active item is an instant fill. */
function CollapseBtn({ look, side }) {
  const c = look.prefs.collapsed
  return (
    <Tip label={c ? 'Expand sidebar' : 'Collapse sidebar'} kbd={MOD + 'B'} side={side}>
      <button className="b ghost icon sm sb-col" onClick={() => look.setPrefs({ ...look.prefs, collapsed: !c })} aria-label={c ? 'Expand sidebar' : 'Collapse sidebar'}>
        {c ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
      </button>
    </Tip>
  )
}

function ThemeToggle({ look, side }) {
  const { theme, setTheme } = look
  return (
    <Tip label={theme === 'light' ? 'Dark' : 'Light'} side={side}>
      <button className="b ghost icon sm" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} aria-label="Toggle theme">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span key={theme} initial={{ opacity: 0, rotate: -60, scale: 0.7 }} animate={{ opacity: 1, rotate: 0, scale: 1 }} exit={{ opacity: 0, rotate: 60, scale: 0.7 }} transition={{ duration: 0.22, ease: EASE }} style={{ display: 'grid' }}>
            {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
          </motion.span>
        </AnimatePresence>
      </button>
    </Tip>
  )
}

function RoleMenu({ role, switchRole, close }) {
  return (
    <>
      <div className="pop-h">Switch workspace</div>
      {seen().map((x, i) => (
        <button key={x.id} onClick={() => { close(); switchRole(x.id) }}>
          <RoleIcon role={x.id} size={22} /> {x.label}
          <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            {x.id === role && <Check size={14} />}<kbd className="k">{ALT}{i + 1}</kbd>
          </span>
        </button>
      ))}
    </>
  )
}

const initials = (n) => n.split(' ').map((p) => p[0]).join('').slice(0, 2)
const Avatar = ({ size = 24 }) => <span className="av" style={{ width: size, height: size, fontSize: size > 22 ? 10 : 9, background: `oklch(0.62 0.13 ${VIEW.person.hue})` }}>{initials(VIEW.person.name)}</span>

function AppearanceBtn({ look, side = 'top' }) {
  return (
    <Popover align="left" width={264} trigger={({ toggle }) => (
      <Tip label="Appearance" kbd={ALT + 'E'} side={side}><button className="b ghost icon sm" onClick={toggle} aria-label="Appearance"><Palette size={15} /></button></Tip>
    )}>
      {(close) => <Appearance look={look} close={close} />}
    </Popover>
  )
}
const SettingsBtn = ({ path, side = 'top' }) => (
  <Tip label="Settings" kbd={MOD + ','} side={side}><a className={'b ghost icon sm' + (path.startsWith('/settings') ? ' on' : '')} href="#/settings" aria-label="Settings"><Gear size={15} /></a></Tip>
)

/** Pages of one workspace. `tips` puts the label in a tooltip for the icon-only column. */
function NavItems({ nav, active, tips }) {
  return nav.map((n) => {
    const on = active(n.to)
    const a = (
      <a key={n.to} href={'#' + n.to} className={'d-item' + (on ? ' on' : '')} title={tips ? undefined : n.label} aria-label={tips ? n.label : undefined}>
        <n.icon size={16} strokeWidth={1.75} /> <span className="d-lbl">{n.label}</span>
        {n.n ? <span className="n num"><Ticker value={n.n} /></span> : null}
      </a>
    )
    return tips ? <Tip key={n.to} label={n.n ? `${n.label} · ${n.n}` : n.label} side="right">{a}</Tip> : a
  })
}

function Pinned({ pinned, path, tips }) {
  if (!pinned.length) return null
  return (
    <>
      <div className="d-sec">Pinned</div>
      {pinned.map((c) => {
        const a = (
          <a key={c.id} href={`#/pod/campaigns/${c.id}`} className={'d-item d-pin' + (path.includes(c.id) ? ' on' : '')} aria-label={tips ? c.client : undefined}>
            <BrandLogo name={c.client} size={16} radius={4} /><span className="ell d-lbl">{c.client}</span>
          </a>
        )
        return tips ? <Tip key={c.id} label={c.client} side="right">{a}</Tip> : a
      })}
    </>
  )
}

/** ≤960px the sidebar is a drawer, so collapsing doesn't apply there. */
function useNarrow() {
  const q = '(max-width: 960px)'
  const [n, setN] = useState(() => window.matchMedia?.(q).matches ?? false)
  useEffect(() => { const m = window.matchMedia?.(q); if (!m) return; const on = (e) => setN(e.matches); m.addEventListener('change', on); return () => m.removeEventListener('change', on) }, [])
  return n
}

/** Collapsed (⌘B) = the slim Icons column; collapsing the Icons shape itself hides the sidebar (the top bar brings it back). */
function Sidebar(props) {
  const kind = props.look.prefs.sidebar
  const narrow = useNarrow()
  if (props.look.prefs.collapsed && !narrow) return kind === 'icons' ? null : <IconSidebar {...props} />
  if (kind === 'rail') return <RailSidebar {...props} />
  if (kind === 'icons') return <IconSidebar {...props} />
  if (kind === 'stack') return <StackSidebar {...props} />
  return <PanelSidebar {...props} />
}

function useSide(role, path) {
  const s = useStore()
  return {
    s,
    nav: useNav(role, s),
    r: ROLES.find((x) => x.id === role),
    idx: seen().findIndex((x) => x.id === role),
    pinned: s.campaigns.filter((c) => c.pinned),
    active: (to) => path === to || (to !== '/home' && path.startsWith(to)) || (to === '/home' && (path === '/' || path === '')),
  }
}

/** Home sits beside the workspaces for everyone: KPIs from every workspace the person can open, plus chat. */
const HUB = { id: 'hub', label: 'Home', color: 'var(--fg)', icon: House }
const onHub = (path) => path === '/hub'
const HubIcon = ({ size = 22 }) => <span className="role-ic hub-ic" style={{ width: size, height: size }}><House size={Math.round(size * 0.62)} strokeWidth={2.25} /></span>
function HubItem({ path, tips }) {
  const a = <a href="#/hub" className={'d-item d-hub' + (onHub(path) ? ' on' : '')} aria-label={tips ? 'Home' : undefined}><House size={16} strokeWidth={1.75} /> <span className="d-lbl">Home</span></a>
  return <Tip label="Home" kbd={ALT + '0'} side="right">{a}</Tip>
}

function PanelSidebar({ role, switchRole, path, look, open }) {
  const { nav, r, idx, pinned, active } = useSide(role, path)
  return (
    <aside className={'d-side' + (open ? ' open' : '')}>
      <div className="d-brand">
        <a href="#/hub" aria-label="WLDD home"><Mark /></a>
        <span className="sb-tools"><ThemeToggle look={look} /><CollapseBtn look={look} /></span>
      </div>

      <nav className="d-nav d-hubnav"><HubItem path={path} /></nav>

      {seen().length > 1 ? (
        <Popover align="left" width={216} match trigger={({ toggle }) => (
          <button className="d-role press" onClick={toggle}>
            <RoleIcon role={r.id} size={22} />
            <TextMorph>{r.label}</TextMorph>
            <span className="d-role-k"><ChevronsUpDown size={13} /></span>
          </button>
        )}>
          {(close) => <RoleMenu role={role} switchRole={switchRole} close={close} />}
        </Popover>
      ) : (
        <div className="d-role"><RoleIcon role={r.id} size={22} />{r.label}</div> /* one workspace: nothing to switch */
      )}

      <SlidePanel k={role} index={idx} className="d-nav-wrap">
        <nav className="d-nav"><NavItems nav={nav} active={active} /></nav>
        {role === 'pod' && <Pinned pinned={pinned} path={path} />}
      </SlidePanel>

      <div className="d-side-f">
        <Avatar />
        <span className="ell grow" style={{ fontWeight: 500 }}>{VIEW.person.name}</span>
        <AppearanceBtn look={look} />
        <SettingsBtn path={path} />
      </div>
    </aside>
  )
}

/** A workspace on the rail: line icon + short label; the open one sits on a filled tile in its module colour. */
function WsButton({ x, i, on, due, onClick }) {
  const I = x.icon || ROLE_ICON[x.id]
  return (
    <Tip label={x.label} kbd={ALT + i} side="right">
      <button className={'sb-ws' + (on ? ' on' : '')} style={{ '--rc': x.color }} onClick={onClick} aria-label={x.label} aria-current={on || undefined}>
        <span className="sb-ws-t"><I size={18} strokeWidth={on ? 2 : 1.75} />{due > 0 && !on && <i className="sb-due" />}</span>
        <span className="sb-ws-l">{x.label}</span>
      </button>
    </Tip>
  )
}

/** Workspaces live on the rail, one click each; the panel only lists the current workspace's pages. */
function RailSidebar({ role, switchRole, path, look, open }) {
  const { s, nav, r, idx, pinned, active } = useSide(role, path)
  return (
    <aside className={'d-side sb-rail' + (open ? ' open' : '')}>
      <div className="sb-railcol">
        <a href="#/hub" className="sb-mark" aria-label="WLDD home"><Mark /></a>
        <WsButton x={HUB} i={0} on={onHub(path)} onClick={() => go('/hub')} />
        {seen().map((x, i) => {
          const due = pendingOf(x.id, s)
          return (
            <WsButton key={x.id} x={x} i={i + 1} on={x.id === role && !onHub(path)} due={due} onClick={() => switchRole(x.id)} />
          )
        })}
        <div className="sb-railf">
          <AppearanceBtn look={look} side="right" />
          <SettingsBtn path={path} side="right" />
          <Tip label={VIEW.person.name} side="right"><span className="sb-av"><Avatar size={24} /></span></Tip>
        </div>
      </div>
      <div className="sb-panel">
        <div className="sb-ph">
          <span className="sb-pt"><TextMorph>{r.label}</TextMorph></span>
          <span className="sb-tools"><ThemeToggle look={look} /><CollapseBtn look={look} /></span>
        </div>
        <SlidePanel k={role} index={idx} className="d-nav-wrap">
          <nav className="d-nav"><NavItems nav={nav} active={active} /></nav>
          {role === 'pod' && <Pinned pinned={pinned} path={path} />}
        </SlidePanel>
      </div>
    </aside>
  )
}

/** One slim column, top to bottom: logo · workspaces · pages · pinned · controls.
    Workspaces are one click each (like the rail); every label lives in a tooltip, a dot marks a live count.
    In the phone drawer the page labels come back (mobile.css). */
function IconSidebar({ role, switchRole, path, look, open }) {
  const { s, nav, pinned, active } = useSide(role, path)
  return (
    <aside className={'d-side sb-icons' + (open ? ' open' : '')}>
      <a href="#/hub" className="sb-mark" aria-label="WLDD home"><Mark /></a>
      <div className="sb-wsrow">
        <WsButton x={HUB} i={0} on={onHub(path)} onClick={() => go('/hub')} />
        {seen().map((x, i) => {
          const due = pendingOf(x.id, s)
          return (
            <WsButton key={x.id} x={x} i={i + 1} on={x.id === role && !onHub(path)} due={due} onClick={() => switchRole(x.id)} />
          )
        })}
      </div>
      <i className="sb-hr" />
      <nav className="d-nav"><NavItems nav={nav} active={active} tips /></nav>
      {role === 'pod' && pinned.length > 0 && (
        <>
          <i className="sb-hr" />
          {pinned.map((c) => (
            <Tip key={c.id} label={c.client} side="right">
              <a href={`#/pod/campaigns/${c.id}`} className={'d-item d-pin' + (path.includes(c.id) ? ' on' : '')} aria-label={c.client}>
                <BrandLogo name={c.client} size={18} radius={5} /><span className="ell d-lbl">{c.client}</span>
              </a>
            </Tip>
          ))}
        </>
      )}
      <div className="sb-railf">
        <CollapseBtn look={look} side="right" />
        <ThemeToggle look={look} side="right" />
        <AppearanceBtn look={look} side="right" />
        <SettingsBtn path={path} side="right" />
        <Tip label={VIEW.person.name} side="right"><span className="sb-av"><Avatar size={24} /></span></Tip>
      </div>
    </aside>
  )
}

/** Every workspace at once: handoffs are visible without switching. Opening another workspace switches to it. */
/** The WLDD wordmark, drawn in code. At rest it is the logo; on hover the letters press into their shadows. */
function Mark() {
  const [on, setOn] = useState(false)
  return <span className="wl-logo" onMouseEnter={() => setOn(true)} onMouseLeave={() => setOn(false)}><Wldd mode="press" done={!on} size={30} label="WLDD" /></span>
}

function StackSidebar({ role, switchRole, path, look, open }) {
  const { s, nav, pinned, active } = useSide(role, path)
  return (
    <aside className={'d-side sb-stack' + (open ? ' open' : '')}>
      <div className="d-brand">
        <a href="#/hub" aria-label="WLDD home"><Mark /></a>
        <span className="sb-tools"><ThemeToggle look={look} /><CollapseBtn look={look} /></span>
      </div>
      {/* Middle scrolls; brand and footer stay put. */}
      <div className="sb-scroll">
        <nav className="d-nav">
          <div className={'sb-ws-g sb-hub' + (onHub(path) ? ' on' : '')} style={{ '--rc': 'var(--fg)' }}>
            <Tip label="Home" kbd={ALT + '0'} side="right">
              <a href="#/hub" className="sb-wsh" aria-current={onHub(path) || undefined}><HubIcon size={24} /> <span className="grow ell">Home</span></a>
            </Tip>
          </div>
          {seen().map((x, i) => {
            const on = x.id === role
            const due = pendingOf(x.id, s)
            return (
              /* On Home the last workspace stays open (no jump) but steps back: one "you are here" at a time. */
              <div key={x.id} className={'sb-ws-g' + (on ? ' on' : '') + (on && onHub(path) ? ' rest' : '')} style={{ '--rc': x.color }}>
                <Tip label={on ? x.label : 'Switch to ' + x.label} kbd={ALT + (i + 1)} side="right">
                  <button className="sb-wsh" onClick={() => switchRole(x.id)} aria-expanded={on}>
                    <RoleIcon role={x.id} size={24} /> <span className="grow ell">{x.label}</span>
                    {!on && due > 0 && <span className="n num">{due}</span>}
                  </button>
                </Tip>
                {on && <div className="sb-sub"><div className="sb-tree"><NavItems nav={nav} active={active} /></div></div>}
              </div>
            )
          })}
        </nav>
        {/* One shared Pinned list, outside any workspace: it stays put when you switch. */}
        {VIEW.roles.includes('pod') && <div className="sb-pins"><Pinned pinned={pinned} path={path} /></div>}
      </div>
      <div className="d-side-f">
        <Avatar />
        <span className="ell grow" style={{ fontWeight: 500 }}>{VIEW.person.name}</span>
        <AppearanceBtn look={look} />
        <SettingsBtn path={path} />
      </div>
    </aside>
  )
}

/** Sum of a workspace's live counts (approvals, invoices, payments, inbound…). */
const pendingOf = (role, s) => navFor(role, s).filter((n) => !VIEW.hide?.includes(n.to)).reduce((t, n) => t + (n.n || 0), 0)

/* ───────── Top bar ───────── */
const LABEL = { home: 'Inbox', pod: 'Pod', finance: 'Finance', bd: 'Sales', campaigns: 'Campaigns', approvals: 'Approvals', kb: 'Knowledge base', invoices: 'Invoices', payments: 'Payments', requests: 'Requests', vendors: 'Vendors', outreach: 'Outreach', proposals: 'Proposals', inbound: 'Inbound', dashboard: 'Dashboard' }
/** The page title lives here only — pages don't repeat it. Icon + live count make the space useful. */
function usePageMeta(parts, role) {
  const s = useStore()
  const nav = useNav(role, s)
  if (parts[0] === 'settings') {
    const sec = SETTINGS_FLAT.find((x) => x.id === parts[1]) || SETTINGS_FLAT[0]
    return { title: 'Settings', icon: Gear, to: '/settings', detail: sec.label, plain: true }
  }
  if (parts[0] === 'hub') return { title: 'Home', icon: House, to: '/hub' }
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

function TopBar({ parts, role, setCmd, openNav, look }) {
  const meta = usePageMeta(parts, role)
  const hidden = look.prefs.collapsed && look.prefs.sidebar === 'icons'
  return (
    <header className="d-top">
      {hidden && <Tip label="Show sidebar" kbd={MOD + 'B'}><button className="b ghost icon sb-show" onClick={() => look.setPrefs({ ...look.prefs, collapsed: false })} aria-label="Show sidebar"><PanelLeftOpen size={16} /></button></Tip>}
      <button className="b ghost icon m-menu" onClick={openNav} aria-label="Menu"><MenuIcon size={18} /></button>
      <Crumb meta={meta} />
      <div className="d-top-r">
        <ViewingAs look={look} />
        <Tip label="Search" kbd={MOD + 'K'}><button className="b ghost icon" onClick={() => setCmd(true)} aria-label="Search"><Search size={16} /></button></Tip>
        <Notifications />
        {role === 'pod' && parts[0] !== 'settings' && parts[0] !== 'hub' && <Tip label="New campaign" kbd="C"><button className="b ink" onClick={() => openNewCampaign()} style={{ marginLeft: 6 }}><Plus size={15} /><span className="m-hide">New</span></button></Tip>}
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
            <Command.Item value="go home" onSelect={run(() => go('/hub'))}><House size={15} /> Home<kbd className="k" style={{ marginLeft: 'auto' }}>{ALT}0</kbd></Command.Item>
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
          <Command.Item onSelect={run(() => openNewCampaign('key'))}><Plus size={15} /> New campaign</Command.Item>
          {seen().filter((r) => r.id !== role).map((r) => <Command.Item key={r.id} value={'switch ' + r.label} onSelect={run(() => switchRole(r.id))}><RoleIcon role={r.id} size={20} /> Switch to {r.label}</Command.Item>)}
          <Command.Item onSelect={run(toggleTheme)}><Moon size={15} /> Toggle theme</Command.Item>
        </Command.Group>
        <Command.Group heading="Settings">
          {(VIEW.id === 'admin' ? SETTINGS_FLAT : SETTINGS_SECTIONS[0].items).map((x) => <Command.Item key={x.id} value={'settings ' + x.label} onSelect={run(() => go('/settings/' + x.id))}><x.icon size={15} /> {x.label}<span className="cmdk-meta">Settings</span></Command.Item>)}
        </Command.Group>
        <Command.Group heading="Home layout">
          {HOME_LAYOUTS.map((x) => <Command.Item key={x.value} value={'home layout ' + x.label} onSelect={run(() => { look.setPrefs({ ...look.prefs, home: x.value }); go('/hub') })}><HomeGlyph id={x.value} /> {x.label}{look.prefs.home === x.value && <Check size={14} style={{ marginLeft: 'auto' }} />}</Command.Item>)}
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
