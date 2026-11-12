/* Settings — personal preferences (You) and workspace administration (Workspace).
   Route: /settings/:section. Section nav is in-page; the top bar owns the title. */
import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { toast } from 'sonner'
import {
  UserRound, SlidersHorizontal, Bell, Keyboard, ShieldCheck, Users, Boxes, KeyRound, CheckCheck, Receipt, Plug, History,
  Search, Plus, MoreHorizontal, Laptop, Smartphone, Check, Lock, LogOut, ArrowRight, Crown, PackageCheck, Archive, UserCog,
  Upload, Info, ChevronRight, Monitor, Sun, Moon, ChevronDown, ChevronsUpDown,
} from 'lucide-react'
import { Tip, ALT, MOD, MOD_SHIFT, EASE, ConfirmButton } from '../../shared/motion'
import { BrandLogo } from '../../shared/brands'
import { Seg, Tabs, Select, Switch, Popover, RoleIcon } from '../ui'
import { team, me, PODS, BRAND, campaigns, fmt, TODAY } from '../data'
import { PopTuner, THEMES, themeActive } from '../popTune'
import { PERSONAS } from '../personas'
import { HOME_LAYOUTS } from './Hub'

/* ───────── sections ───────── */
export const SETTINGS_SECTIONS = [
  { group: 'You', items: [
    { id: 'profile', label: 'Profile', icon: UserRound },
    { id: 'preferences', label: 'Preferences', icon: SlidersHorizontal },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'shortcuts', label: 'Shortcuts', icon: Keyboard },
    { id: 'security', label: 'Security', icon: ShieldCheck },
  ] },
  { group: 'Workspace', items: [
    { id: 'members', label: 'Members', icon: Users },
    { id: 'pods', label: 'Pods', icon: Boxes },
    { id: 'access', label: 'Roles & access', icon: KeyRound },
    { id: 'approvals', label: 'Approvals', icon: CheckCheck },
    { id: 'finance', label: 'Finance', icon: Receipt },
    { id: 'integrations', label: 'Integrations', icon: Plug },
    { id: 'audit', label: 'Audit log', icon: History },
  ] },
]
export const SETTINGS_FLAT = SETTINGS_SECTIONS.flatMap((g) => g.items)

/* ───────── small persisted state ───────── */
function useStored(key, init) {
  const [v, setV] = useState(() => { try { const s = localStorage.getItem('wldd-set-' + key); return s ? JSON.parse(s) : init } catch { return init } })
  const set = (next) => setV((cur) => {
    const val = typeof next === 'function' ? next(cur) : next
    try { localStorage.setItem('wldd-set-' + key, JSON.stringify(val)) } catch {}
    return val
  })
  return [v, set]
}

/* ───────── layout primitives ───────── */
const Group = ({ title, aside, children, flush }) => (
  <section className="st-g">
    {(title || aside) && <div className="st-gh"><span>{title}</span>{aside && <span className="st-gh-r">{aside}</span>}</div>}
    <div className={'card st-card' + (flush ? ' flush' : '')}>{children}</div>
  </section>
)
const Row = ({ label, tip, children, stack }) => (
  <div className={'st-row' + (stack ? ' stack' : '')}>
    <div className="st-l">
      {label}
      {tip && <Tip label={tip}><span className="st-i"><Info size={13} /></span></Tip>}
    </div>
    <div className="st-c">{children}</div>
  </div>
)
const Field = ({ value, onCommit, width = 260, prefix, mono, type = 'text', locked }) => {
  const [v, setV] = useState(value)
  return (
    <label className={'inp st-inp' + (locked ? ' locked' : '')} style={{ width }}>
      {prefix && <span className="mute">{prefix}</span>}
      <input type={type} value={v} readOnly={locked} className={mono ? 'mono' : ''} onChange={(e) => setV(e.target.value)}
        onBlur={() => { if (v !== value) onCommit?.(v) }} onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }} />
      {locked && <Lock size={12} />}
    </label>
  )
}
const Ck = ({ on, onChange, locked, label }) => (
  <button role="checkbox" aria-checked={on} aria-label={label} className={'ck' + (on ? ' on' : '') + (locked ? ' locked' : '')} onClick={() => !locked && onChange(!on)}>
    {on && <Check size={11} strokeWidth={3} />}
  </button>
)
const Av = ({ u, size = 24 }) => (
  <span className="av" style={{ width: size, height: size, fontSize: Math.round(size * 0.4), background: `oklch(0.52 0.12 ${u.hue})` }}>
    {u.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
  </span>
)
const saved = (what) => toast(what + ' saved')

/* ───────── access roles (HR) ───────── */
const ACCESS = [
  { id: 'admin', label: 'Admin', icon: Crown },
  { id: 'pod', label: 'Pod', module: true },
  { id: 'finance', label: 'Finance', module: true },
  { id: 'bd', label: 'Sales', module: true },
  { id: 'procurement', label: 'Procurement', icon: PackageCheck },
  { id: 'inventory', label: 'Inventory', icon: Archive },
  { id: 'hr', label: 'HR', icon: UserCog },
]
const ACCESS_BY = Object.fromEntries(ACCESS.map((a) => [a.id, a]))
const AccessChip = ({ id }) => {
  const a = ACCESS_BY[id]
  return (
    <span className="chip st-acc">
      {a.module ? <RoleIcon role={id} size={14} /> : <a.icon size={12} />}{a.label}
    </span>
  )
}

/* ───────── members (fake but plausible) ───────── */
const EXTRA = [
  ['Tanvi Desai', 'Campaign Manager'], ['Rohan Pillai', 'Finance'], ['Sana Qureshi', 'Procurement'], ['Arjun Bhatia', 'Inventory'],
  ['Neha Joshi', 'People Ops'], ['Vikram Sethi', 'Business Development'], ['Ira Banerjee', 'Campaign Manager'], ['Kunal Ahuja', 'Creator Partnerships'],
  ['Pooja Reddy', 'Finance'], ['Aditya Kulkarni', 'Strategy'], ['Mira Chawla', 'Content Lead'], ['Yash Agarwal', 'Business Development'],
  ['Nikhil Verma', 'Campaign Manager'], ['Shreya Menon', 'Inventory'], ['Farhan Ali', 'Campaign Manager'], ['Divya Srinivasan', 'Procurement'],
  ['Kabir Grewal', 'Analytics'], ['Anika Sood', 'Campaign Manager'],
]
const accessFor = (title, i) => {
  if (/Finance/.test(title)) return ['finance']
  if (/Business/.test(title)) return ['bd']
  if (/Procurement/.test(title)) return ['procurement']
  if (/Inventory/.test(title)) return ['inventory']
  if (/People/.test(title)) return ['hr']
  if (/Design/.test(title)) return ['admin', 'pod', 'finance', 'bd']
  if (/Director/.test(title)) return ['pod', 'bd']
  if (/Analytics/.test(title)) return ['pod', 'finance']
  return i % 4 === 0 ? ['pod', 'procurement'] : ['pod']
}
const SEED_MEMBERS = [...team.map((t) => [t.name, t.role, t.hue]), ...EXTRA.map(([n, r], i) => [n, r, (i * 47 + 20) % 360])].map(([name, title, hue], i) => {
  const access = accessFor(title, i)
  return {
    id: 'm' + i, name, title, hue,
    email: name.toLowerCase().split(' ').join('.') + '@wldd.in',
    access,
    pod: access.includes('pod') ? PODS[i % 3] : null,
    status: i === 25 ? 'deactivated' : i === 27 ? 'invited' : 'active',
    seen: new Date(TODAY.getTime() - ((i * 7919) % 200) * 3600e3),
    me: i === 0,
  }
})

/* ═════════════════════ page ═════════════════════ */
export default function Settings({ section, look }) {
  const sections = look.persona.id === 'admin' ? SETTINGS_SECTIONS : SETTINGS_SECTIONS.slice(0, 1) // Workspace settings are admin-only
  const cur = sections.some((g) => g.items.some((s) => s.id === section)) ? section : 'profile'
  const [members, setMembers] = useStored('members-v1', null)
  const list = useMemo(() => (members || SEED_MEMBERS).map((m) => ({ ...m, seen: new Date(m.seen) })), [members])
  const setList = (fn) => setMembers(fn(list))
  const wide = ['members', 'access', 'notifications', 'audit'].includes(cur)
  const body = {
    profile: <Profile members={list} look={look} />,
    preferences: <Preferences look={look} />,
    notifications: <Notifications />,
    shortcuts: <Shortcuts />,
    security: <Security />,
    members: <Members list={list} setList={setList} />,
    pods: <Pods list={list} setList={setList} />,
    access: <Access list={list} />,
    approvals: <Approvals />,
    finance: <FinanceSettings />,
    integrations: <Integrations />,
    audit: <Audit />,
  }[cur]
  const curItem = SETTINGS_FLAT.find((x) => x.id === cur) || SETTINGS_FLAT[0]
  return (
    <div className="st">
      <div className="st-pick-w">
      <Popover align="left" width={Math.min(320, window.innerWidth - 32)} className="st-pick-pop" trigger={({ toggle }) => (
        <button className="st-pick press" onClick={toggle}><curItem.icon size={16} /><span className="grow">{curItem.label}</span><ChevronsUpDown size={14} className="mute" /></button>
      )}>
        {(close) => sections.map((g) => (
          <div key={g.group}>
            <div className="pop-h">{g.group}</div>
            {g.items.map((s) => (
              <button key={s.id} onClick={() => { close(); location.hash = '#/settings/' + s.id }}>
                <s.icon size={15} />{s.label}{cur === s.id && <Check size={14} style={{ marginLeft: 'auto' }} />}
              </button>
            ))}
          </div>
        ))}
      </Popover>
      </div>
      <nav className="st-nav" aria-label="Settings">
        {sections.map((g) => (
          <div key={g.group} className="st-nav-g">
            <div className="st-nav-h">{g.group}</div>
            {g.items.map((s) => (
              <a key={s.id} href={'#/settings/' + s.id} className={'d-item' + (cur === s.id ? ' on' : '')}>
                <s.icon size={15} />{s.label}
                {s.id === 'members' && <span className="n num">{list.filter((m) => m.status === 'active').length}</span>}
              </a>
            ))}
          </div>
        ))}
      </nav>
      <div className={'st-body' + (wide ? ' wide' : '')}>{body}</div>
    </div>
  )
}

/* ───────── Profile ───────── */
/** Access chip → the View-as persona it previews. Procurement, Inventory and HR have no workspace here yet. */
const ACCESS_VIEW = { admin: 'admin', pod: 'pod', finance: 'finance', bd: 'sales' }

function Profile({ members, look }) {
  const m = members.find((x) => x.me) || members[0]
  const [p, setP] = useStored('profile', { name: me.name, display: me.short, phone: '+91 98450 21734', title: me.role })
  const commit = (k) => (v) => { setP({ ...p, [k]: v }); saved('Profile') }
  return (
    <>
      <Group>
        <div className="st-hero">
          <span className="av" style={{ width: 56, height: 56, fontSize: 20, background: `oklch(0.52 0.12 ${me.hue})` }}>SH</span>
          <div className="grow">
            <div className="st-hero-n">{p.name}</div>
            <div className="mute">{p.title}</div>
          </div>
          <button className="b sm"><Upload size={13} /> Photo</button>
        </div>
      </Group>
      <Group title="Details">
        <Row label="Full name"><Field value={p.name} onCommit={commit('name')} /></Row>
        <Row label="Display name" tip="Shown in mentions, approvals and comments"><Field value={p.display} onCommit={commit('display')} /></Row>
        <Row label="Title"><Field value={p.title} onCommit={commit('title')} /></Row>
        <Row label="Phone"><Field value={p.phone} onCommit={commit('phone')} /></Row>
        <Row label="Email" tip="Synced from Zoho People"><Field value={m.email} locked /></Row>
      </Group>
      <Group title="Team">
        <Row label="Pod" tip="Changed by HR"><span className="chip">{m.pod || '—'}</span></Row>
        <Row label="Access" tip="Changed by HR · click one to preview the DMS as that role">
          <span className="st-chips">
            {m.access.map((a) => {
              const v = ACCESS_VIEW[a]
              if (!v) return <AccessChip key={a} id={a} />
              const on = look.prefs.viewAs === v
              return (
                <button key={a} className={'chip st-acc st-acc-b' + (on ? ' on' : '')} aria-pressed={on} onClick={() => look.setPrefs({ ...look.prefs, viewAs: v })}>
                  {ACCESS_BY[a].module ? <RoleIcon role={a} size={14} /> : <Crown size={12} />}{ACCESS_BY[a].label}
                </button>
              )
            })}
          </span>
        </Row>
        <Row label="Joined"><span className="fg2 num">12 Mar 2023</span></Row>
      </Group>
    </>
  )
}

/* ───────── Preferences (wired to the shell) ───────── */
const TZ = [
  { id: 'Asia/Kolkata', label: 'India · IST' }, { id: 'Asia/Dubai', label: 'Dubai · GST' },
  { id: 'Europe/London', label: 'London · GMT' }, { id: 'America/New_York', label: 'New York · ET' },
]
const FONTS = [
  { id: 'style', label: 'Theme default' },
  { id: 'inter', label: 'Inter', ff: "'Inter'" },
  { id: 'geist', label: 'Geist', ff: "'Geist'" },
  { id: 'plex', label: 'IBM Plex Sans', ff: "'IBM Plex Sans'" },
  { id: 'manrope', label: 'Manrope', ff: "'Manrope'" },
  { id: 'bricolage', label: 'Bricolage', ff: "'Bricolage Grotesque'" },
  { id: 'system', label: 'System', ff: 'system-ui' },
]
function FontSelect({ value, onChange }) {
  const cur = FONTS.find((f) => f.id === value) || FONTS[0]
  return (
    <Popover width={220} trigger={({ toggle, open }) => (
      <button className={'b sm sel-b st-font-b' + (open ? ' on' : '')} onClick={toggle} style={{ fontFamily: cur.ff }}>{cur.label}<ChevronDown size={13} className="mute" /></button>
    )}>
      {(close) => FONTS.map((f, i) => (
        <span key={f.id} style={{ display: 'contents' }}>
          {i === 1 && <div className="pop-sep" />}
          <button onClick={() => { onChange(f.id); close() }} style={{ fontFamily: f.ff }}>
            {f.label}{value === f.id && <Check size={14} style={{ marginLeft: 'auto' }} />}
          </button>
        </span>
      ))}
    </Popover>
  )
}
const MODES = [['light', 'Light', Sun], ['dark', 'Dark', Moon], ['system', 'System', Monitor]]
const SIDEBARS = [{ value: 'panel', label: 'Panel' }, { value: 'rail', label: 'Rail' }, { value: 'icons', label: 'Icons' }, { value: 'stack', label: 'Stacked' }]
const ACCENTS = ['#f2bd2f', '#2fa866', '#8e4fd0', '#d6395e', '#2f5fd0', '#e0621b', '#0e8a85', '#18181b']

function Preferences({ look }) {
  const { theme, mode, setMode, exp, setExp, style, setStyle, tune, setTune, prefs, setPrefs, exps } = look
  const set = (k) => (v) => setPrefs({ ...prefs, [k]: v })
  const [tab, setTab] = useState('themes')
  const pickTheme = (t) => {
    if (prefs.accent) setPrefs({ ...prefs, accent: null }) // a theme brings its own accent
    if (t.style === 'pop') setTune({ ...tune, tone: t.tone }); else setStyle(t.style)
  }
  return (
    <>
      <Group title="Preview">
        <Row label="View as" tip="See the DMS the way each role sees it: their workspaces, pages and settings"><Select value={prefs.viewAs} onChange={set('viewAs')} options={PERSONAS} width={200} /></Row>
      </Group>

      <Group title="Appearance">
        <Row label="Font" tip="Theme default follows the theme's own type"><FontSelect value={prefs.font} onChange={set('font')} /></Row>
        <Row label="Mode" stack>
          <div className="st-modes">
            {MODES.map(([id, label, I]) => (
              <button key={id} className={'st-mode' + (mode === id ? ' on' : '')} onClick={() => setMode(id)} aria-pressed={mode === id}><I size={15} />{label}</button>
            ))}
          </div>
        </Row>
        <Row label="Experience" tip={'Shell and navigation model · ' + ALT + 'E'}><Seg id="st-exp" value={exp} onChange={setExp} options={exps.map((x) => ({ value: x.id, label: x.label }))} /></Row>
        <Row label="Home" tip={'Stack: dashboard over chat · Split: chat with a KPI column · Focus: chat first · Dock: dashboard with a chat panel · ' + ALT + 'H'}><Seg id="st-home" value={prefs.home} onChange={set('home')} options={HOME_LAYOUTS} /></Row>
        {exp !== 'vercel' && <Row label="Sidebar" tip="Panel · Rail: workspaces on a rail · Icons: collapsed · Stacked: every workspace in one list"><Seg id="st-sidebar" value={prefs.sidebar} onChange={set('sidebar')} options={SIDEBARS} /></Row>}
        <Row label="Density"><Seg id="st-density" value={prefs.density} onChange={set('density')} options={[{ value: 'comfortable', label: 'Comfortable' }, { value: 'compact', label: 'Compact' }]} /></Row>
        <Row label="Motion" tip="Reduced turns off slides, morphs and springs"><Seg id="st-motion" value={prefs.motion} onChange={set('motion')} options={[{ value: 'full', label: 'Full' }, { value: 'reduced', label: 'Reduced' }]} /></Row>
      </Group>

      <section className="st-g">
        <div className="st-gh"><Tabs id="st-theme-tab" value={tab} onChange={setTab} options={[{ value: 'themes', label: 'Themes' }, { value: 'custom', label: 'Custom' }]} /></div>
        {tab === 'themes' ? (
          <div className="st-gallery">
            {THEMES.map((g) => (
              <div key={g.group}>
                <div className="st-tg-h">{g.group}</div>
                <div className="st-themes">
                  {g.items.map((t) => {
                    const on = !prefs.accent && themeActive(t, style, tune)
                    const sw = t.sw[theme]
                    return (
                      <button key={t.id} className={'st-theme' + (on ? ' on' : '')} onClick={() => pickTheme(t)} aria-pressed={on}>
                        <span className="st-orb" style={{ '--a': sw[0], '--b': sw[1] }} />
                        <span className="ell">{t.label}</span>
                        {on && <Check size={14} className="st-theme-ck" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card st-card">
            <Row label="Accent" tip="Primary buttons, toggles and highlights">
              <span className="st-accents">
                {ACCENTS.map((c) => (
                  <button key={c} className={'st-acc-sw' + (prefs.accent === c ? ' on' : '')} style={{ background: c }} onClick={() => set('accent')(c)} aria-label={'Accent ' + c} />
                ))}
                <Tip label="Any colour">
                  <label className={'st-acc-sw pick' + (prefs.accent && !ACCENTS.includes(prefs.accent) ? ' on' : '')} style={prefs.accent && !ACCENTS.includes(prefs.accent) ? { background: prefs.accent } : undefined}>
                    <input type="color" value={prefs.accent || '#f2bd2f'} onChange={(e) => set('accent')(e.target.value)} aria-label="Pick accent" />
                    {!(prefs.accent && !ACCENTS.includes(prefs.accent)) && <Plus size={12} />}
                  </label>
                </Tip>
                {prefs.accent && <button className="b ghost sm" onClick={() => set('accent')(null)}>Reset</button>}
              </span>
            </Row>
            <Row label="Mixer" tip="A colour tone (switches to Pop), plus type and corners, which work in every style." stack>
              <PopTuner tune={tune} setTune={setTune} />
            </Row>
          </div>
        )}
      </section>

      <Group title="Workspace">
        <Row label="Open on" tip="Workspace shown when DMS starts">
          <Select value={prefs.startRole} onChange={set('startRole')} options={[{ id: 'last', label: 'Last used' }, { id: 'pod', label: 'Pod' }, { id: 'finance', label: 'Finance' }, { id: 'bd', label: 'Sales' }]} />
        </Row>
        <Row label="Confirm before approving" tip="Ask once more before an approval moves money"><Switch on={prefs.confirmApprove} onChange={set('confirmApprove')} label="Confirm before approving" /></Row>
      </Group>
      <Group title="Region">
        <Row label="Amounts" tip="Lakh · ₹3.1L    Million · ₹310K">
          <Seg id="st-num" value={prefs.numbers} onChange={set('numbers')} options={[{ value: 'indian', label: '₹ Lakh · Cr' }, { value: 'intl', label: '₹ K · M' }]} />
        </Row>
        <Row label="Dates"><Select value={prefs.date} onChange={set('date')} options={[{ id: 'dmy', label: '4 Nov 2026' }, { id: 'iso', label: '2026-11-04' }, { id: 'mdy', label: 'Nov 4, 2026' }]} /></Row>
        <Row label="Week starts"><Seg id="st-week" value={prefs.week} onChange={set('week')} options={[{ value: 'mon', label: 'Monday' }, { value: 'sun', label: 'Sunday' }]} /></Row>
        <Row label="Time zone"><Select value={prefs.tz} onChange={set('tz')} options={TZ} width={200} /></Row>
      </Group>
    </>
  )
}

/* ───────── Notifications ───────── */
const CHANNELS = [{ id: 'app', label: 'In-app' }, { id: 'email', label: 'Email' }, { id: 'slack', label: 'Slack' }, { id: 'wa', label: 'WhatsApp' }]
const EVENTS = [
  { group: 'Campaigns', role: 'pod', items: [
    ['stage', 'Stage moved', 'app slack'], ['mention', 'Mentioned', 'app email slack'], ['deliv', 'Deliverable submitted', 'app'], ['shot', 'Insight screenshot overdue', 'app slack'],
  ] },
  { group: 'Invoices & payments', role: 'finance', items: [
    ['needs', 'Needs my approval', 'app email slack'], ['rej', 'Invoice rejected', 'app email'], ['sched', 'Payment scheduled', 'app'], ['paid', 'Payment released', 'app email'],
  ] },
  { group: 'Sales', role: 'bd', items: [
    ['lead', 'New inbound lead', 'app slack wa'], ['viewed', 'Proposal opened', 'app'], ['won', 'Deal converted', 'app email slack'],
  ] },
  { group: 'People', items: [
    ['podadd', 'Added to a pod', 'app email'], ['access', 'Access changed', 'app email'],
  ] },
]
const seedNotif = Object.fromEntries(EVENTS.flatMap((g) => g.items.map(([id, , on]) => [id, Object.fromEntries(CHANNELS.map((c) => [c.id, on.includes(c.id)]))])))
function Notifications() {
  const [n, setN] = useStored('notif', seedNotif)
  const [d, setD] = useStored('notif-delivery', { push: true, digest: true, digestAt: '09:30', quiet: true, quietRange: '21-08' })
  const toggle = (ev, ch) => (v) => setN({ ...n, [ev]: { ...n[ev], [ch]: v } })
  return (
    <>
      <Group title="Delivery">
        <Row label="Desktop push"><Switch on={d.push} onChange={(v) => setD({ ...d, push: v })} label="Desktop push" /></Row>
        <Row label="Daily digest" tip="One email with everything waiting on you">
          {d.digest && <Select value={d.digestAt} onChange={(v) => setD({ ...d, digestAt: v })} options={['08:00', '09:30', '11:00', '18:00'].map((t) => ({ id: t, label: t }))} width={120} />}
          <Switch on={d.digest} onChange={(v) => setD({ ...d, digest: v })} label="Daily digest" />
        </Row>
        <Row label="Quiet hours" tip="Only payment failures get through">
          {d.quiet && <Select value={d.quietRange} onChange={(v) => setD({ ...d, quietRange: v })} options={[{ id: '20-08', label: '20:00 – 08:00' }, { id: '21-08', label: '21:00 – 08:00' }, { id: '22-07', label: '22:00 – 07:00' }]} width={160} />}
          <Switch on={d.quiet} onChange={(v) => setD({ ...d, quiet: v })} label="Quiet hours" />
        </Row>
      </Group>
      <Group title="Events" flush>
        <table className="tbl st-mx">
          <thead>
            <tr>
              <th />
              {CHANNELS.map((c) => (
                <th key={c.id} className="c">
                  <span className="st-colh">{c.label}</span>
                </th>
              ))}
            </tr>
          </thead>
          {EVENTS.map((g) => (
            <tbody key={g.group}>
              <tr className="st-mx-g"><td colSpan={5}>{g.role && <RoleIcon role={g.role} size={16} />}{g.group}</td></tr>
              {g.items.map(([id, label]) => (
                <tr key={id}>
                  <td>{label}</td>
                  {CHANNELS.map((c) => (
                    <td key={c.id} className="c">
                      {c.id === 'app'
                        ? <Tip label="Always on"><span><Ck on locked label={label + ' in-app'} /></span></Tip>
                        : <Ck on={n[id][c.id]} onChange={toggle(id, c.id)} label={label + ' ' + c.label} />}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </Group>
    </>
  )
}

/* ───────── Shortcuts ───────── */
const K = ({ k }) => <span className="st-keys">{k.split(' ').map((x, i) => <kbd key={i} className="k">{x}</kbd>)}</span>
function Shortcuts() {
  const groups = [
    ['General', [['Search and commands', MOD + 'K'], ['Settings', MOD + ','], ['Collapse sidebar', MOD + 'B'], ['Home', ALT + '0'], ['Switch to Pod', ALT + '1'], ['Switch to Finance', ALT + '2'], ['Switch to Sales', ALT + '3']]],
    ['Look', [['Cycle Home layout', ALT + 'H'], ['Cycle experience', ALT + 'E'], ['Cycle style', ALT + 'S'], ['Cycle Pop presets', ALT + 'P']]],
    ['Lists & boards', [['New campaign', 'C'], ['List ⇄ board', MOD_SHIFT + 'B'], ['Next / previous row', 'J K'], ['Open row', 'Enter'], ['Close panel', 'Esc']]],
    ['Vercel experience', [['Find', 'F']]],
  ]
  return groups.map(([g, items]) => (
    <Group key={g} title={g}>
      {items.map(([l, k]) => <Row key={l} label={l}><K k={k} /></Row>)}
    </Group>
  ))
}

/* ───────── Security ───────── */
const SESSIONS = [
  { id: 's1', device: 'Chrome · Windows', icon: Laptop, place: 'Bengaluru', seen: 'Now', current: true },
  { id: 's2', device: 'Safari · iPhone 15', icon: Smartphone, place: 'Bengaluru', seen: '2h ago' },
  { id: 's3', device: 'Edge · Windows', icon: Monitor, place: 'Mumbai', seen: '3d ago' },
  { id: 's4', device: 'Chrome · MacBook Air', icon: Laptop, place: 'Pune', seen: '12d ago' },
]
function Security() {
  const [twoStep, setTwoStep] = useStored('2fa', true)
  const [sessions, setSessions] = useState(SESSIONS)
  const others = sessions.filter((s) => !s.current)
  return (
    <>
      <Group title="Sign-in">
        <Row label="Method"><span className="row"><BrandLogo name="Google Workspace" size={18} radius={4} /><span className="fg2">Google Workspace</span><span className="chip">SSO</span></span></Row>
        <Row label="Two-step verification" tip="Required for Finance and Admin access"><Switch on={twoStep} onChange={(v) => { setTwoStep(v); toast(v ? 'Two-step on' : 'Two-step off') }} label="Two-step verification" /></Row>
      </Group>
      <Group title="Sessions" aside={others.length > 0 && <button className="b sm ghost" onClick={() => { setSessions(sessions.filter((s) => s.current)); toast('Signed out of ' + others.length + ' sessions') }}><LogOut size={13} /> Sign out others</button>}>
        <AnimatePresence initial={false}>
          {sessions.map((s) => (
            <motion.div key={s.id} className="st-row" exit={{ height: 0, minHeight: 0, opacity: 0, paddingTop: 0, paddingBottom: 0 }} transition={{ duration: 0.22, ease: EASE }} style={{ overflow: 'hidden' }}>
              <div className="st-l row" style={{ gap: 12 }}>
                <span className="st-dev"><s.icon size={15} /></span>
                <div className="grow"><div>{s.device}</div><div className="mute xs">{s.place} · {s.seen}</div></div>
              </div>
              <div className="st-c">{s.current ? <span className="chip g">This device</span> : <button className="b sm" onClick={() => setSessions((l) => l.filter((x) => x.id !== s.id))}>Revoke</button>}</div>
            </motion.div>
          ))}
        </AnimatePresence>
      </Group>
    </>
  )
}

/* ───────── Members ───────── */
function Members({ list, setList }) {
  const [q, setQ] = useState('')
  const [tab, setTab] = useState('active')
  const counts = { active: list.filter((m) => m.status === 'active').length, invited: list.filter((m) => m.status === 'invited').length, deactivated: list.filter((m) => m.status === 'deactivated').length }
  const shown = list.filter((m) => m.status === tab && (!q || (m.name + m.email + m.title).toLowerCase().includes(q.toLowerCase())))
  const patch = (id, p) => setList((l) => l.map((m) => (m.id === id ? { ...m, ...p } : m)))
  const setStatus = (m, status) => {
    const prev = m.status
    patch(m.id, { status })
    toast((status === 'deactivated' ? 'Deactivated · ' : 'Reactivated · ') + m.name, { action: { label: 'Undo', onClick: () => patch(m.id, { status: prev }) } })
  }
  return (
    <>
      <div className="st-bar">
        <Seg id="st-mem" value={tab} onChange={setTab} options={[{ value: 'active', label: 'Active', count: counts.active }, { value: 'invited', label: 'Invited', count: counts.invited }, { value: 'deactivated', label: 'Deactivated', count: counts.deactivated }]} />
        <label className="inp" style={{ width: 220, marginLeft: 'auto' }}><Search size={14} /><input placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} /></label>
        <Invite onInvite={(m) => { setList((l) => [...l, m]); setTab('invited'); toast('Invite sent · ' + m.email) }} />
      </div>
      <div className="card st-card flush">
        <table className="tbl st-tbl">
          <thead><tr><th>Name</th><th>Access</th><th>Pod</th><th className="r">Last seen</th><th style={{ width: 44 }} /></tr></thead>
          <tbody>
            {shown.map((m) => (
              <tr key={m.id}>
                <td>
                  <span className="row" style={{ gap: 10 }}>
                    <Av u={m} size={26} />
                    <span className="st-who"><span className="ell"><b>{m.name}</b>{m.me && <span className="mute"> · you</span>}</span><span className="mute xs ell">{m.email}</span></span>
                  </span>
                </td>
                <td><span className="st-chips">{m.access.map((a) => <AccessChip key={a} id={a} />)}</span></td>
                <td className="fg2">{m.pod || <span className="mute">—</span>}</td>
                <td className="r mute num">{m.status === 'invited' ? 'Pending' : fmt.ago(m.seen)}</td>
                <td className="r"><MemberMenu m={m} patch={patch} setStatus={setStatus} /></td>
              </tr>
            ))}
            {!shown.length && <tr><td colSpan={5} className="st-empty"><Users size={16} /> None</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  )
}
function MemberMenu({ m, patch, setStatus }) {
  if (m.me) return null
  const toggle = (a) => patch(m.id, { access: m.access.includes(a) ? m.access.filter((x) => x !== a) : [...m.access, a] })
  return (
    <Popover width={220} trigger={({ toggle: t }) => <button className="b ghost icon sm" onClick={t} aria-label={'Manage ' + m.name}><MoreHorizontal size={15} /></button>}>
      {(close) => (
        <>
          <div className="pop-h">Access</div>
          {ACCESS.map((a) => (
            <button key={a.id} onClick={() => toggle(a.id)}>
              {a.module ? <RoleIcon role={a.id} size={16} /> : <a.icon size={14} />}{a.label}
              {m.access.includes(a.id) && <Check size={14} style={{ marginLeft: 'auto' }} />}
            </button>
          ))}
          <div className="pop-sep" />
          <div className="pop-h">Pod</div>
          {[...PODS, null].map((p) => (
            <button key={p || 'none'} onClick={() => patch(m.id, { pod: p })}>{p || 'No pod'}{m.pod === p && <Check size={14} style={{ marginLeft: 'auto' }} />}</button>
          ))}
          <div className="pop-sep" />
          {m.status === 'deactivated'
            ? <button onClick={() => { setStatus(m, 'active'); close() }}>Reactivate</button>
            : <Tip label="Blocks sign-in and clears pod leadership"><button className="st-danger" onClick={() => { setStatus(m, 'deactivated'); close() }}>{m.status === 'invited' ? 'Revoke invite' : 'Deactivate'}</button></Tip>}
        </>
      )}
    </Popover>
  )
}
function Invite({ onInvite }) {
  const [email, setEmail] = useState('')
  const [access, setAccess] = useState(['pod'])
  const [pod, setPod] = useState(PODS[0])
  const ok = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)
  return (
    <Popover width={300} trigger={({ toggle }) => <Tip label="Most people arrive automatically from Zoho"><button className="b ink" onClick={toggle}><Plus size={15} /> Invite</button></Tip>}>
      {(close) => (
        <div className="st-inv">
          <label className="inp"><input autoFocus placeholder="name@wldd.in" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <div className="st-chips wrap">
            {ACCESS.filter((a) => a.id !== 'admin').map((a) => (
              <button key={a.id} className={'st-tog' + (access.includes(a.id) ? ' on' : '')} onClick={() => setAccess(access.includes(a.id) ? access.filter((x) => x !== a.id) : [...access, a.id])}>{a.label}</button>
            ))}
          </div>
          {access.includes('pod') && <Seg id="st-inv-pod" value={pod} onChange={setPod} options={PODS.map((p) => ({ value: p, label: p }))} />}
          <button className="b ink" disabled={!ok || !access.length} onClick={() => {
            const name = email.split('@')[0].split(/[._]/).map((s) => s[0]?.toUpperCase() + s.slice(1)).join(' ')
            onInvite({ id: 'm' + Date.now(), name, title: '—', hue: (email.length * 37) % 360, email, access, pod: access.includes('pod') ? pod : null, status: 'invited', seen: TODAY.toISOString() })
            setEmail(''); close()
          }}>Send invite <ArrowRight size={14} /></button>
        </div>
      )}
    </Popover>
  )
}

/* ───────── Pods ───────── */
function Pods({ list, setList }) {
  const [leads, setLeads] = useStored('pod-leads', { Kulfi: 'm3', Neon: 'm4', Masala: 'm2' })
  const [open, setOpen] = useState(null)
  return (
    <Group flush>
      {PODS.map((p) => {
        const mem = list.filter((m) => m.pod === p && m.status === 'active')
        const live = campaigns.filter((c) => c.pod === p && c.stage < 5).length
        const lead = list.find((m) => m.id === leads[p])
        const isOpen = open === p
        return (
          <div key={p} className="st-pod">
            <div className="st-row click" onClick={() => setOpen(isOpen ? null : p)}>
              <div className="st-l row" style={{ gap: 12 }}>
                <ChevronRight size={14} className="mute st-chev" style={{ transform: isOpen ? 'rotate(90deg)' : 'none' }} />
                <span className="st-podmark">{p[0]}</span>
                <b className="st-pod-n">{p}</b>
                <span className="av-stack">{mem.slice(0, 5).map((m) => <Av key={m.id} u={m} size={20} />)}</span>
                <span className="mute num xs">{mem.length}</span>
              </div>
              <div className="st-c" onClick={(e) => e.stopPropagation()}>
                <Tip label="Live campaigns"><span className="chip num">{live} live</span></Tip>
                <Select value={leads[p]} width={220} onChange={(v) => { setLeads({ ...leads, [p]: v }); toast(p + ' lead · ' + list.find((m) => m.id === v).name) }}
                  options={list.filter((m) => m.access.includes('pod') && m.status === 'active').map((m) => ({ id: m.id, label: m.name }))} />
              </div>
            </div>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.24, ease: EASE }} style={{ overflow: 'hidden' }}>
                  <div className="st-podm">
                    {mem.map((m) => (
                      <div key={m.id} className="row st-podm-r">
                        <Av u={m} size={22} /><span className="grow ell">{m.name}{m.id === lead?.id && <span className="chip g" style={{ marginLeft: 8 }}>Lead</span>}</span>
                        <span className="mute xs">{m.title}</span>
                        {m.id !== lead?.id && <button className="b ghost sm" onClick={() => { setList((l) => l.map((x) => (x.id === m.id ? { ...x, pod: null } : x))); toast(m.name + ' removed from ' + p) }}>Remove</button>}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </Group>
  )
}

/* ───────── Roles & access ───────── */
const CAPS = [
  { group: 'Campaigns', items: [['View campaigns', 'admin pod finance bd'], ['Create campaigns', 'admin pod bd'], ['Edit plan & tracker', 'admin pod'], ['Approve deliverables', 'admin pod']] },
  { group: 'Money', items: [['Approve invoices', 'admin pod finance'], ['Schedule payments', 'admin finance'], ['Release payments', 'admin finance'], ['Edit vendor bank details', 'admin finance procurement']] },
  { group: 'Sales', items: [['Outreach & leads', 'admin bd'], ['Send proposals', 'admin bd'], ['Convert deals', 'admin bd']] },
  { group: 'Vendors & inventory', items: [['Assign vendor roles', 'admin procurement'], ['Assign misc services', 'admin procurement pod'], ['Approve assets', 'admin inventory'], ['Merge pages', 'admin inventory']] },
  { group: 'People', items: [['Invite & deactivate', 'admin hr'], ['Change access', 'admin hr']] },
]
const seedCaps = Object.fromEntries(CAPS.flatMap((g) => g.items.map(([l, r]) => [l, r.split(' ')])))
function Access({ list }) {
  const [caps, setCaps] = useStored('caps', seedCaps)
  const count = (r) => list.filter((m) => m.status === 'active' && m.access.includes(r)).length
  const toggle = (cap, r) => setCaps({ ...caps, [cap]: caps[cap].includes(r) ? caps[cap].filter((x) => x !== r) : [...caps[cap], r] })
  return (
    <Group flush>
      <table className="tbl st-mx">
        <thead>
          <tr>
            <th />
            {ACCESS.map((a) => (
              <th key={a.id} className="c">
                <span className="st-colh v">{a.module ? <RoleIcon role={a.id} size={16} /> : <span className="st-ai"><a.icon size={12} /></span>}{a.label}<span className="mute num">{count(a.id)}</span></span>
              </th>
            ))}
          </tr>
        </thead>
        {CAPS.map((g) => (
          <tbody key={g.group}>
            <tr className="st-mx-g"><td colSpan={ACCESS.length + 1}>{g.group}</td></tr>
            {g.items.map(([cap]) => (
              <tr key={cap}>
                <td>{cap}</td>
                {ACCESS.map((a) => (
                  <td key={a.id} className="c">
                    {a.id === 'admin'
                      ? <Tip label="Admin always has access"><span><Ck on locked label={cap + ' admin'} /></span></Tip>
                      : <Ck on={caps[cap].includes(a.id)} onChange={() => toggle(cap, a.id)} label={cap + ' ' + a.label} />}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </Group>
  )
}

/* ───────── Approvals ───────── */
const ChainView = ({ steps }) => (
  <span className="st-chain">
    {steps.map((s, i) => (
      <span key={s} className="row" style={{ gap: 6 }}>
        <span className={'st-step' + (i === steps.length - 1 ? ' end' : '')}>{s}</span>
        {i < steps.length - 1 && <ChevronRight size={12} className="mute" />}
      </span>
    ))}
  </span>
)
function Approvals() {
  const [a, setA] = useStored('approvals', { auto: '5000', second: '200000', remind: '24', escalate: true, escalateAfter: '3', reason: true, shots: '7', locks: true })
  const set = (k) => (v) => setA({ ...a, [k]: v })
  return (
    <>
      <Group title="Chains">
        <Row label="Misc invoices" stack><ChainView steps={['Campaign lead', 'Procurement', 'Finance', 'Scheduled', 'Paid']} /></Row>
        <Row label="Link invoices" stack><ChainView steps={['Finance', 'Scheduled', 'Paid']} /></Row>
      </Group>
      <Group title="Rules">
        <Row label="Auto-approve below" tip="Misc invoices under this skip the campaign lead"><Field value={a.auto} prefix="₹" width={150} onCommit={(v) => { set('auto')(v); saved('Rule') }} /></Row>
        <Row label="Second approver above" tip="Finance head signs off on anything larger"><Field value={a.second} prefix="₹" width={150} onCommit={(v) => { set('second')(v); saved('Rule') }} /></Row>
        <Row label="Remind approver after"><Select value={a.remind} onChange={set('remind')} width={140} options={[['12', '12 hours'], ['24', '24 hours'], ['48', '48 hours']].map(([id, label]) => ({ id, label }))} /></Row>
        <Row label="Escalate to pod lead">
          {a.escalate && <Select value={a.escalateAfter} onChange={set('escalateAfter')} width={130} options={[['2', 'After 2 days'], ['3', 'After 3 days'], ['5', 'After 5 days']].map(([id, label]) => ({ id, label }))} />}
          <Switch on={a.escalate} onChange={set('escalate')} label="Escalate" />
        </Row>
        <Row label="Rejections need a reason"><Switch on={a.reason} onChange={set('reason')} label="Rejections need a reason" /></Row>
        <Row label="Lock assignments once invoiced" tip="Procurement can't edit or remove a service after its invoice exists"><Switch on={a.locks} onChange={set('locks')} label="Lock assignments" /></Row>
      </Group>
      <Group title="Creators">
        <Row label="Insight screenshot due" tip="Creators get reminders until it's uploaded">
          <Select value={a.shots} onChange={set('shots')} width={170} options={[['3', '3 days after post'], ['7', '7 days after post'], ['14', '14 days after post']].map(([id, label]) => ({ id, label }))} />
        </Row>
      </Group>
    </>
  )
}

/* ───────── Finance ───────── */
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
function FinanceSettings() {
  const [f, setF] = useStored('finance', { runs: ['Tue', 'Fri'], cutoff: '14:00', tds: '194c2', gst: '18', prefix: 'WLDD/26-27/', fy: 'apr', tally: true })
  const set = (k) => (v) => setF({ ...f, [k]: v })
  const tdsOpts = [{ id: '194c1', label: '1% · 194C individual' }, { id: '194c2', label: '2% · 194C company' }, { id: '194j', label: '10% · 194J professional' }]
  return (
    <>
      <Group title="Payment runs">
        <Row label="Run on">
          <span className="st-days">
            {DAYS.map((d) => <button key={d} className={'st-tog' + (f.runs.includes(d) ? ' on' : '')} onClick={() => set('runs')(f.runs.includes(d) ? f.runs.filter((x) => x !== d) : DAYS.filter((x) => x === d || f.runs.includes(x)))}>{d}</button>)}
          </span>
        </Row>
        <Row label="Cut-off" tip="Invoices approved after this roll to the next run"><Select value={f.cutoff} onChange={set('cutoff')} width={110} options={['11:00', '14:00', '17:00'].map((t) => ({ id: t, label: t }))} /></Row>
        <Row label="Payout account">
          <span className="row"><BrandLogo name="RazorpayX" size={18} radius={4} /><span className="fg2">HDFC</span><span className="mono mute">••4821</span></span>
          <button className="b sm">Change</button>
        </Row>
      </Group>
      <Group title="Tax">
        <Row label="Default TDS" tip="Applied when a vendor has no override"><Select value={f.tds} onChange={set('tds')} width={220} options={tdsOpts} /></Row>
        <Row label="GST"><Seg id="st-gst" value={f.gst} onChange={set('gst')} options={['5', '12', '18'].map((x) => ({ value: x, label: x + '%' }))} /></Row>
        <Row label="Financial year"><Select value={f.fy} onChange={set('fy')} width={140} options={[{ id: 'apr', label: 'April – March' }, { id: 'jan', label: 'January – December' }]} /></Row>
      </Group>
      <Group title="Invoices">
        <Row label="Number format"><Field value={f.prefix} mono width={170} onCommit={(v) => { set('prefix')(v); saved('Format') }} /><span className="mono mute st-prev">{f.prefix}0412</span></Row>
        <Row label="Sync to Tally" tip="Paid invoices post as vouchers, hourly">
          {f.tally && <span className="mute xs">Synced 18m ago</span>}
          <Switch on={f.tally} onChange={set('tally')} label="Sync to Tally" />
        </Row>
      </Group>
    </>
  )
}

/* ───────── Integrations ───────── */
const INTEGRATIONS = [
  { id: 'zoho', name: 'Zoho People', meta: 'Onboards new joiners', on: true },
  { id: 'gws', name: 'Google Workspace', meta: 'Sign-in', on: true, locked: true },
  { id: 'slack', name: 'Slack', meta: '#dms-approvals', on: true },
  { id: 'drive', name: 'Google Drive', meta: 'Briefs & reports', on: true },
  { id: 'ig', name: 'Instagram', meta: 'Asset verification', on: true },
  { id: 'rzp', name: 'RazorpayX', meta: 'Vendor payouts', on: true },
  { id: 'tally', name: 'Tally Prime', meta: 'Accounting', on: true },
  { id: 'wa', name: 'WhatsApp Business', meta: 'Creator reminders', on: false },
  { id: 'yt', name: 'YouTube', meta: 'Post insights', on: false },
  { id: 'gmail', name: 'Gmail', meta: 'Outreach tracking', on: false },
]
function Integrations() {
  const [on, setOn] = useStored('integrations', Object.fromEntries(INTEGRATIONS.map((i) => [i.id, i.on])))
  const set = (id, v, name) => { setOn({ ...on, [id]: v }); toast((v ? 'Connected · ' : 'Disconnected · ') + name, v ? undefined : { action: { label: 'Undo', onClick: () => setOn((o) => ({ ...o, [id]: true })) } }) }
  return (
    <Group flush>
      {INTEGRATIONS.map((i) => (
        <div key={i.id} className="st-row">
          <div className="st-l row" style={{ gap: 12 }}>
            <BrandLogo name={i.name} size={28} radius={7} />
            <div className="grow"><div><b className="st-b">{i.name}</b></div><div className="mute xs">{i.meta}</div></div>
          </div>
          <div className="st-c">
            {on[i.id] ? (
              <>
                <span className="chip g">Connected</span>
                {i.locked ? <Tip label="Required for sign-in"><span className="st-i"><Lock size={13} /></span></Tip> : (
                  <Popover width={180} trigger={({ toggle }) => <button className="b ghost icon sm" onClick={toggle} aria-label={'Manage ' + i.name}><MoreHorizontal size={15} /></button>}>
                    {(close) => <><button onClick={close}>Configure</button><div className="pop-sep" /><button className="st-danger" onClick={() => { set(i.id, false, i.name); close() }}>Disconnect</button></>}
                  </Popover>
                )}
              </>
            ) : (
              <ConfirmButton className="b sm" label="Connect" doneLabel="Connected" onDone={() => set(i.id, true, i.name)} icon={<Plug size={13} />} />
            )}
          </div>
        </div>
      ))}
    </Group>
  )
}

/* ───────── Audit log ───────── */
const AUDIT = (() => {
  const who = team
  const rows = [
    ['money', 6, 'approved', 'INV-0412 · Pagal Memes LLP', 312700],
    ['money', 6, 'scheduled', '11 payments for Fri', 1840500],
    ['access', 0, 'gave Finance access to', 'Rohan Pillai'],
    ['people', 0, 'invited', 'anika.sood@wldd.in'],
    ['money', 3, 'rejected', 'INV-0398 · Kulfi Collective', 97350],
    ['settings', 0, 'changed auto-approve to', '₹5,000'],
    ['people', 2, 'moved', 'Kabir Mehta to Neon'],
    ['money', 6, 'released', '9 payments', 1265000],
    ['access', 0, 'removed Sales access from', 'Dev Malhotra'],
    ['settings', 6, 'turned on', 'Tally sync'],
    ['people', 0, 'deactivated', 'Kabir Grewal'],
    ['money', 4, 'approved', 'INV-0388 · Meme Chakra', 54000],
    ['settings', 0, 'connected', 'RazorpayX'],
    ['access', 0, 'made', 'Kirsten Menezes an Admin'],
    ['money', 6, 'approved', 'INV-0371 · Sarcastic Hub', 185850],
    ['people', 3, 'made', 'Aarav Shah lead of Kulfi'],
    ['settings', 6, 'changed payment runs to', 'Tue, Fri'],
    ['money', 5, 'rejected', 'INV-0366 · Daily Dose', 41200],
  ]
  return rows.map(([kind, u, verb, obj, amt], i) => ({ id: 'a' + i, kind, u: who[u], verb, obj, amt, at: new Date(TODAY.getTime() - (i * i * 1.7 + i * 2 + 0.3) * 3600e3) }))
})()
function Audit() {
  const [k, setK] = useState('all')
  const rows = AUDIT.filter((r) => k === 'all' || r.kind === k)
  const n = (x) => AUDIT.filter((r) => r.kind === x).length
  return (
    <>
      <div className="st-bar">
        <Seg id="st-audit" value={k} onChange={setK} options={[{ value: 'all', label: 'All', count: AUDIT.length }, { value: 'money', label: 'Money', count: n('money') }, { value: 'access', label: 'Access', count: n('access') }, { value: 'people', label: 'People', count: n('people') }, { value: 'settings', label: 'Settings', count: n('settings') }]} />
        <button className="b" style={{ marginLeft: 'auto' }} onClick={() => toast('Export started · CSV')}>Export</button>
      </div>
      <div className="card st-card flush">
        {rows.map((r) => (
          <div key={r.id} className="st-row st-log">
            <div className="st-l row" style={{ gap: 10 }}>
              <Av u={r.u} size={22} />
              <span className="ell"><b className="st-b">{r.u.short}</b> <span className="fg2">{r.verb}</span> {r.obj}</span>
            </div>
            <div className="st-c">
              {r.amt && <span className="num fg2">{fmt.inr(r.amt)}</span>}
              <Tip label={r.at.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}><span className="mute num xs st-when">{fmt.ago(r.at)}</span></Tip>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
