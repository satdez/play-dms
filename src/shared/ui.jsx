import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { Command } from 'cmdk'
import { motion, animate, useReducedMotion } from 'motion/react'
import { toast } from 'sonner'
import {
  LayoutGrid, Megaphone, CheckCheck, PenTool, BarChart3, BookOpen, Plus, ArrowRight, Moon, Building2, Hash,
  Instagram, Youtube, Twitter, Linkedin, Ghost, LayoutDashboard, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { campaigns, clients, initials, statusById } from '../data'
import { Ticker as TickerInline, openNewCampaign } from './motion'

/* ───────── Routing (hash based, zero deps) ───────── */
export function useRoute() {
  const get = () => window.location.hash.slice(1) || '/'
  const [path, setPath] = useState(get)
  useEffect(() => {
    const on = () => setPath(get())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return path
}
export const go = (p) => { if (window.location.hash.slice(1) !== p) window.location.hash = p }

/** Split '/v1/campaigns/WL-1240' → { page: 'campaigns', id: 'WL-1240' } */
export function parseRoute(path) {
  const [, , page = 'dashboard', id] = path.split('/')
  return { page, id }
}

/* ───────── Easing tokens (Emil Kowalski-style) ───────── */
export const ease = {
  out: [0.23, 1, 0.32, 1],        // snappy ease-out for most UI
  inOut: [0.77, 0, 0.175, 1],     // on-screen movement
  drawer: [0.32, 0.72, 0, 1],     // sheets / drawers (iOS-like)
}

/* ───────── Hotkeys ───────── */
export function useHotkeys(map, deps = []) {
  useEffect(() => {
    const on = (e) => {
      const t = e.target
      const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)
      const key = (e.metaKey || e.ctrlKey ? 'mod+' : '') + e.key.toLowerCase()
      const fn = map[key]
      if (!fn) return
      if (window.__gPending) return // second key of a "G then X" sequence belongs to navigation
      if (e.altKey) return
      if (typing && !key.startsWith('mod+') && key !== 'escape') return
      e.preventDefault()
      fn(e)
    }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

/* Numbers: static on load, digits roll only when the value changes. */
export { Ticker } from './motion'

/* ───────── Avatar ───────── */
export function Avatar({ user, size = 20, ring, className = '' }) {
  const hue = user.hue ?? 220
  return (
    <span
      className={'av ' + className}
      title={user.name || user.handle}
      style={{
        width: size, height: size, fontSize: Math.max(8, size * 0.42),
        background: `oklch(0.52 0.12 ${hue})`,
        boxShadow: ring ? `0 0 0 2px ${ring}` : undefined,
      }}
    >
      {initials(user.name || user.handle.replace('@', ''))}
    </span>
  )
}
export function AvatarStack({ users, size = 20, ring = 'var(--bg)' }) {
  return (
    <span className="av-stack">
      {users.map((u) => <Avatar key={u.id} user={u} size={size} ring={ring} />)}
    </span>
  )
}

/* ───────── Tones / status ───────── */
export const toneColor = {
  gray: '#8a8f98', blue: '#4ea7fc', green: '#45b26b', violet: '#9b87f5',
  amber: '#e2b340', orange: '#ef8a3c', muted: '#6b6f76', red: '#eb5757',
}
export function StatusIcon({ status, size = 14 }) {
  const s = statusById[status]
  const color = toneColor[s.tone]
  const order = ['proposal', 'onboarding', 'live', 'posting', 'closing', 'payment', 'closed']
  const p = order.indexOf(status) / (order.length - 1)
  const r = 4.2, C = 2 * Math.PI * r
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" aria-label={s.label} style={{ flex: 'none' }}>
      <circle cx="7" cy="7" r="6" stroke={color} strokeWidth="1.5" strokeDasharray={status === 'proposal' ? '1.4 1.6' : undefined} />
      {status === 'closed' ? (
        <>
          <circle cx="7" cy="7" r="6" fill={color} />
          <path d="M4.5 7.2l1.7 1.6 3.3-3.4" stroke="var(--bg, #000)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : p > 0 ? (
        <circle cx="7" cy="7" r={r / 2} fill="none" stroke={color} strokeWidth={r}
          strokeDasharray={`${(C / 2) * p} ${C}`} transform="rotate(-90 7 7)" />
      ) : null}
    </svg>
  )
}
export function PriorityIcon({ priority, size = 14 }) {
  if (priority === 'urgent') {
    return (
      <svg width={size} height={size} viewBox="0 0 14 14" style={{ flex: 'none' }}><rect x="1" y="1" width="12" height="12" rx="3" fill="#ef8a3c" /><path d="M7 3.8v4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" /><circle cx="7" cy="10.1" r=".95" fill="#fff" /></svg>
    )
  }
  const n = { high: 3, medium: 2, low: 1 }[priority] || 0
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" style={{ flex: 'none' }}>
      {[0, 1, 2].map((i) => (
        <rect key={i} x={2 + i * 4} y={9 - i * 3} width="2.6" height={3 + i * 3} rx=".8" fill="currentColor" opacity={i < n ? 0.9 : 0.25} />
      ))}
    </svg>
  )
}
export function PlatformIcon({ platform, size = 13, ...rest }) {
  const I = { Instagram, YouTube: Youtube, X: Twitter, LinkedIn: Linkedin, Snapchat: Ghost }[platform] || Hash
  return <I size={size} strokeWidth={1.75} {...rest} />
}

/* ───────── Charts ───────── */
function pathFrom(data, w, h, pad = 2) {
  const max = Math.max(...data), min = Math.min(...data)
  const span = max - min || 1
  const step = (w - pad * 2) / (data.length - 1)
  return data.map((v, i) => [pad + i * step, h - pad - ((v - min) / span) * (h - pad * 2)])
}
const smooth = (pts) => pts.reduce((d, [x, y], i, a) => {
  if (i === 0) return `M${x},${y}`
  const [px, py] = a[i - 1]
  const cx = (px + x) / 2
  return d + ` C${cx},${py} ${cx},${y} ${x},${y}`
}, '')

export function Sparkline({ data, width = 80, height = 24, color = 'currentColor', fill = true, strokeWidth = 1.5 }) {
  const id = useMemo(() => 'sg' + Math.random().toString(36).slice(2), [])
  const pts = pathFrom(data, width, height)
  const d = smooth(pts)
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible', display: 'block' }}>
      {fill && (
        <>
          <defs><linearGradient id={id} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".22" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>
          <path d={`${d} L${width - 2},${height} L2,${height} Z`} fill={`url(#${id})`} />
        </>
      )}
      <path d={d} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  )
}

/** Responsive area chart with hover crosshair + tooltip. */
export function AreaChart({ data, labels, height = 180, color = 'currentColor', format = (v) => v, className = '', grid = true }) {
  const wrap = useRef(null)
  const [w, setW] = useState(600)
  const [hover, setHover] = useState(null)
  const id = useMemo(() => 'ag' + Math.random().toString(36).slice(2), [])
  useEffect(() => {
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width))
    ro.observe(wrap.current)
    return () => ro.disconnect()
  }, [])
  const pts = pathFrom(data, w, height, 6)
  const d = smooth(pts)
  const last = useRef(data.length - 1)
  if (hover != null) last.current = hover
  if (last.current >= data.length) last.current = data.length - 1
  const onMove = (e) => {
    const r = wrap.current.getBoundingClientRect()
    const i = Math.round(((e.clientX - r.left - 6) / (r.width - 12)) * (data.length - 1))
    setHover(Math.max(0, Math.min(data.length - 1, i)))
  }
  return (
    <div ref={wrap} className={'chart ' + className} style={{ position: 'relative', height }} onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
      <svg width={w} height={height} style={{ display: 'block', overflow: 'visible' }}>
        <defs><linearGradient id={id} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".18" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>
        {grid && [0.25, 0.5, 0.75].map((g) => <line key={g} x1="0" x2={w} y1={height * g} y2={height * g} stroke="currentColor" strokeOpacity=".07" strokeDasharray="2 4" />)}
        <path d={`${d} L${w - 6},${height} L6,${height} Z`} fill={`url(#${id})`} />
        <path d={d} fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" />
        {/* Crosshair glides between points instead of jumping; fades in/out on enter/leave. */}
        <g className="chart-x" style={{ opacity: hover == null ? 0 : 1, transform: `translateX(${pts[last.current][0]}px)` }}>
          <line x1="0" x2="0" y1="0" y2={height} stroke="currentColor" strokeOpacity=".18" />
        </g>
        <g className="chart-x" style={{ opacity: hover == null ? 0 : 1, transform: `translate(${pts[last.current][0]}px, ${pts[last.current][1]}px)` }}>
          <circle r="4" fill={color} stroke="var(--bg, #000)" strokeWidth="2" />
        </g>
      </svg>
      {labels && (
        <div className="chart-labels">{labels.map((l, i) => <span key={i} className={hover === i ? 'on' : ''}>{l}</span>)}</div>
      )}
      <div className="chart-tip chart-tip-move" style={{ opacity: hover == null ? 0 : 1, transform: `translate(calc(${Math.min(Math.max(pts[last.current][0], 50), w - 50)}px - 50%), calc(${pts[last.current][1] - 12}px - 100%))` }}>
        <span className="chart-tip-l">{labels?.[last.current]}</span>
        <b><TickerInline value={data[last.current]} format={format} /></b>
      </div>
    </div>
  )
}

export function Bars({ data, labels, height = 120, color = 'currentColor', format = (v) => v, highlightLast = true }) {
  const [hover, setHover] = useState(null)
  const max = Math.max(...data)
  return (
    <div className="bars" style={{ height, display: 'flex', alignItems: 'flex-end', gap: 4, position: 'relative' }} onMouseLeave={() => setHover(null)}>
      {data.map((v, i) => (
        <div key={i} className="bars-col" onMouseEnter={() => setHover(i)} style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              width: '100%', height: `${(v / max) * 100}%`, transformOrigin: 'bottom', borderRadius: 3, background: color,
              opacity: hover == null ? (highlightLast && i === data.length - 1 ? 1 : 0.35) : hover === i ? 1 : 0.25,
              transition: 'opacity 150ms ease',
            }}
          />
          {labels && <span className="bars-l" style={{ fontSize: 10, opacity: hover === i ? 1 : 0.5 }}>{labels[i]}</span>}
        </div>
      ))}
      {hover != null && <div className="chart-tip" style={{ left: `${((hover + 0.5) / data.length) * 100}%`, top: -8 }}><span className="chart-tip-l">{labels?.[hover]}</span><b>{format(data[hover])}</b></div>}
    </div>
  )
}

/** Thin progress bar */
export function Meter({ value, max = 1, color = 'currentColor', height = 4, track = 'color-mix(in oklab, currentColor 12%, transparent)' }) {
  return (
    <div style={{ height, borderRadius: 99, background: track, overflow: 'hidden', width: '100%' }}>
      <div style={{ height: '100%', width: `${Math.min(100, (value / max) * 100)}%`, background: color, borderRadius: 99, transition: 'width 400ms cubic-bezier(.23,1,.32,1)' }} />
    </div>
  )
}

/* ───────── Command menu (⌘K) — themed per variant via html[data-variant] ───────── */
const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid, k: 'G D' },
  { id: 'campaigns', label: 'Campaigns', icon: Megaphone, k: 'G C' },
  { id: 'approvals', label: 'Approvals', icon: CheckCheck, k: 'G A' },
  { id: 'sketchboards', label: 'Sketchboards', icon: PenTool, k: 'G S' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, k: 'G R' },
  { id: 'knowledge', label: 'Knowledge base', icon: BookOpen, k: 'G K' },
]
export { navItems }

export function CommandMenu({ open, setOpen, base, onToggleTheme }) {
  const [q, setQ] = useState('')
  useEffect(() => { if (!open) setQ('') }, [open])
  const run = (fn) => () => { setOpen(false); fn() }
  return (
    <Command.Dialog open={open} onOpenChange={setOpen} label="Command menu" className="cmdk" overlayClassName="cmdk-overlay" contentClassName="cmdk-content" loop>
      <Command.Input value={q} onValueChange={setQ} placeholder="Search campaigns, clients, or type a command…" />
      <Command.List>
        <Command.Empty>No results for “{q}”</Command.Empty>
        <Command.Group heading="Actions">
          <Command.Item onSelect={run(openNewCampaign)}><Plus size={15} /> New campaign <kbd>C</kbd></Command.Item>
          {onToggleTheme && <Command.Item onSelect={run(onToggleTheme)}><Moon size={15} /> Toggle theme</Command.Item>}
        </Command.Group>
        <Command.Group heading="Go to">
          {navItems.map((n) => (
            <Command.Item key={n.id} value={'go ' + n.label} onSelect={run(() => go(`${base}/${n.id}`))}><n.icon size={15} /> {n.label} <kbd>{n.k}</kbd></Command.Item>
          ))}
        </Command.Group>
        <Command.Group heading="Campaigns">
          {campaigns.slice(0, q ? 42 : 6).map((c) => (
            <Command.Item key={c.id} value={c.id + ' ' + c.name + ' ' + c.client} onSelect={run(() => go(`${base}/campaigns/${c.id}`))}>
              <StatusIcon status={c.status} /> <span className="cmdk-t">{c.name}</span> <span className="cmdk-meta">{c.client}</span>
            </Command.Item>
          ))}
        </Command.Group>
        {q && (
          <Command.Group heading="Clients">
            {clients.map((c) => (
              <Command.Item key={c.id} value={'client ' + c.name + ' ' + c.industry} onSelect={run(() => go(`${base}/knowledge/${c.id}`))}>
                <Building2 size={15} /> <span className="cmdk-t">{c.name}</span> <span className="cmdk-meta">{c.industry} · {c.campaigns} campaigns</span>
              </Command.Item>
            ))}
          </Command.Group>
        )}
        <Command.Group heading="Switch variant">
          {VARIANTS.map((v) => (
            <Command.Item key={v.id} value={'variant ' + v.name + ' ' + v.ref} onSelect={run(() => go('/' + v.id))}>
              <ArrowRight size={15} /> {v.n} · {v.name} <span className="cmdk-meta">{v.ref}</span>
            </Command.Item>
          ))}
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  )
}

/* ───────── Variants registry + dock ───────── */
export const VARIANTS = [
  { id: 'v1', n: '01', name: 'Graphite', ref: 'Linear', desc: 'Dark, keyboard-first, inverted-L chrome. Dense grouped lists, peek panels, J/K navigation.' },
  { id: 'v2', n: '02', name: 'Mono', ref: 'Vercel · Geist', desc: 'Pure black & white, top tabs with a sliding indicator, deployment-style campaign feed.' },
  { id: 'v3', n: '03', name: 'Records', ref: 'Attio · Folk', desc: 'Light CRM. Spreadsheet-grade tables, record pages, attribute chips, side-sheet details.' },
  { id: 'v4', n: '04', name: 'Paper', ref: 'Notion · Obsidian', desc: 'Warm, document-first. Every campaign is a page with properties; table ⇄ board views.' },
  { id: 'v5', n: '05', name: 'Signal', ref: 'Plain · Polar · Resend', desc: 'Inbox-driven ops. Triage approvals in a split view, metrics with soft gradient glow.' },
]

/** Compact, draggable switcher. Hover to expand; Alt+1…5 jumps between variants on the same page. */
export function VariantDock({ current }) {
  const [hover, setHover] = useState(false)
  const [pinned, setPinned] = useState(false)
  const open = hover || pinned
  const switchTo = (id) => go('/' + id + '/' + (window.location.hash.split('/')[2] || 'dashboard'))
  useEffect(() => {
    const on = (e) => { if (e.altKey && /^[1-5]$/.test(e.key)) { e.preventDefault(); switchTo(VARIANTS[+e.key - 1].id) } }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [])
  const shown = open ? VARIANTS : VARIANTS.filter((v) => v.id === current)
  return (
    <motion.div className="dock" drag dragMomentum={false} onHoverStart={() => setHover(true)} onHoverEnd={() => setHover(false)}
      initial={{ y: -12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4, ease: ease.out, delay: 0.3 }} title="Drag to move · Alt+1…5 to switch">
      <button className="dock-home" onClick={() => go('/archive')} title="All variants"><LayoutDashboard size={14} /></button>
      {shown.map((v) => (
        <motion.button layout="position" key={v.id} className={'dock-btn' + (current === v.id ? ' on' : '')} onClick={() => switchTo(v.id)} title={`${v.name} — ${v.ref} (Alt+${v.n.slice(1)})`}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
          {current === v.id && <motion.span layoutId="dock-pill" className="dock-pill" transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }} />}
          <span className="dock-n">{v.n}</span>
          <span className="dock-name">{v.name}</span>
        </motion.button>
      ))}
      <button className="dock-toggle" onClick={() => setPinned((p) => !p)} title={pinned ? 'Unpin' : 'Keep open'}>{pinned ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}</button>
    </motion.div>
  )
}

/** Sets html[data-variant] so portaled UI (cmdk, sonner) inherits the right theme. */
export function useVariantRoot(id, theme) {
  useEffect(() => {
    document.documentElement.dataset.variant = id
    document.documentElement.dataset.theme = theme
  }, [id, theme])
}

/** Shared hook to wire ⌘K + "g x" navigation sequences. */
export function useGlobalNav(base, setCmd) {
  const pendingG = useRef(false)
  const timer = useRef()
  const map = { d: 'dashboard', c: 'campaigns', a: 'approvals', s: 'sketchboards', r: 'analytics', k: 'knowledge' }
  const onKey = useCallback((e) => {
    const t = e.target
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setCmd((o) => !o); return }
    if (e.metaKey || e.ctrlKey || e.altKey) return
    if (pendingG.current) {
      pendingG.current = false
      window.__gPending = false
      if (map[e.key]) { e.stopPropagation(); e.preventDefault(); go(`${base}/${map[e.key]}`) }
      return
    }
    if (e.key === 'c' && !e.shiftKey) { e.preventDefault(); openNewCampaign(); return }
    if (e.key === 'g') {
      pendingG.current = true
      window.__gPending = true
      clearTimeout(timer.current)
      timer.current = setTimeout(() => { pendingG.current = false; window.__gPending = false }, 800)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base])
  // Capture phase: runs before page-level hotkeys, so "G then A" never also triggers "A".
  useEffect(() => { window.addEventListener('keydown', onKey, true); return () => window.removeEventListener('keydown', onKey, true) }, [onKey])
}
