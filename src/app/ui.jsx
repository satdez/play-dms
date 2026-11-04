import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { Check, ChevronDown, Megaphone, Wallet, Handshake } from 'lucide-react'
import { SERVICES, STAGES, STAGE_FULL, MISC_CHAIN, LINK_CHAIN, CHAIN_LABEL, BRAND, ROLES } from './data'
const ROLES_BY_ID = Object.fromEntries(ROLES.map((r) => [r.id, r]))
import { Tip, EASE } from '../shared/motion'
import { industryHue } from '../shared/state'
import { BrandLogo } from '../shared/brands'

export const go = (p) => { if (window.location.hash.slice(1) !== p) window.location.hash = p }

/** Segmented control. Mouse changes glide; the pill is shared via layoutId. */
export function Seg({ id, value, onChange, options }) {
  return (
    <div className="seg" role="tablist">
      {options.map((o) => (
        <button key={o.value} role="tab" aria-selected={value === o.value} className={value === o.value ? 'on' : ''} onClick={() => onChange(o.value)}>
          {value === o.value && <motion.span layoutId={'seg-' + id} className="seg-bg" transition={{ type: 'spring', duration: 0.28, bounce: 0 }} />}
          <span>{o.label}{o.count != null && <span className="c num">{o.count}</span>}</span>
        </button>
      ))}
    </div>
  )
}

export function Tabs({ id, value, onChange, options }) {
  return (
    <div className="tabs" role="tablist">
      {options.map((o) => (
        <button key={o.value} className={value === o.value ? 'on' : ''} onClick={() => onChange(o.value)}>
          {o.label}{o.count != null && <span className="mute num xs">{o.count}</span>}
          {value === o.value && <motion.span layoutId={'tabs-' + id} className="tabs-u" transition={{ type: 'spring', duration: 0.3, bounce: 0 }} />}
        </button>
      ))}
    </div>
  )
}

export const Svc = ({ list }) => (
  <span className="svc">{list.map((s) => <Tip key={s} label={SERVICES[s].label}><span className="svc-c">{SERVICES[s].short}</span></Tip>)}</span>
)

/** Compact 6-stage track for list rows. */
export function Track({ stage }) {
  return (
    <Tip label={stage === 6 ? 'Complete' : STAGE_FULL[stage]}>
      <span className={'track' + (stage === 6 ? ' done' : '')}>
        {STAGES.map((_, i) => <i key={i} className={i < stage ? 'done' : i === stage ? 'cur' : ''} />)}
      </span>
    </Tip>
  )
}

/** Approval chain dots: lead → procurement → finance → scheduled → paid */
export function Chain({ inv }) {
  const steps = inv.type === 'misc' ? MISC_CHAIN : LINK_CHAIN
  const at = inv.stage === 'rejected' ? -1 : steps.indexOf(inv.stage)
  return (
    <Tip label={CHAIN_LABEL[inv.stage]}>
      <span className="chain">
        {steps.map((s, i) => (
          <span key={s} className="chain-s">
            {i > 0 && <span className={'chain-l' + (i <= at ? ' done' : '')} />}
            <span className={'chain-n ' + (inv.stage === 'rejected' && i === 0 ? 'rej' : s === 'paid' && inv.stage === 'paid' ? 'paid' : i < at ? 'done' : i === at ? 'cur' : '')}><i /></span>
          </span>
        ))}
      </span>
    </Tip>
  )
}

export function ClientLogo({ name, industry, size }) {
  return <BrandLogo name={name} size={size === 'lg' ? 40 : 24} hue={industryHue[industry]} />
}

/** Popover anchored to its trigger, scaling from the trigger's corner.
    Portalled + fixed so scroll containers (tables, boards) never clip it.
    Flips upward when there isn't room below; origin follows the side. */
export function Popover({ trigger, children, align = 'right', width, side: forced, className = '' }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState(null)
  const ref = useRef(null)
  const popRef = useRef(null)
  const place = () => {
    const r = ref.current.getBoundingClientRect()
    const side = forced || (window.innerHeight - r.bottom < 300 && r.top > 300 ? 'top' : 'bottom')
    const p = { side }
    if (side === 'top') p.bottom = window.innerHeight - r.top + 6
    else p.top = r.bottom + 6
    if (align === 'left') p.left = Math.max(8, r.left)
    else p.right = Math.max(8, window.innerWidth - r.right)
    return p
  }
  const toggle = () => { if (!open && ref.current) setPos(place()); setOpen((o) => !o) }
  useEffect(() => {
    if (!open) return
    // Clicks inside this popover, or inside one opened from it (later in the DOM), keep it open.
    const inside = (t) => {
      if (ref.current?.contains(t) || popRef.current?.contains(t)) return true
      const pops = [...document.querySelectorAll('.pop')]
      return pops.slice(pops.indexOf(popRef.current) + 1).some((p) => p.contains(t))
    }
    const on = (e) => { if (!inside(e.target)) setOpen(false) }
    const key = (e) => { if (e.key === 'Escape') setOpen(false) }
    const scroll = (e) => { if (!inside(e.target)) setOpen(false) }
    document.addEventListener('mousedown', on); window.addEventListener('keydown', key)
    window.addEventListener('scroll', scroll, true); window.addEventListener('resize', scroll)
    return () => {
      document.removeEventListener('mousedown', on); window.removeEventListener('keydown', key)
      window.removeEventListener('scroll', scroll, true); window.removeEventListener('resize', scroll)
    }
  }, [open])
  return (
    <span ref={ref} style={{ position: 'relative', display: 'inline-flex' }}>
      {trigger({ open, toggle })}
      {createPortal(
        <AnimatePresence>
          {open && pos && (
            <motion.div ref={popRef} className={'pop ' + className} onClick={(e) => e.stopPropagation()}
              style={{ position: 'fixed', top: pos.top, bottom: pos.bottom, left: pos.left, right: pos.right, width, transformOrigin: `${pos.side === 'top' ? 'bottom' : 'top'} ${align}` }}
              initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.1 } }} transition={{ duration: 0.15, ease: EASE }}>
              {children(() => setOpen(false))}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </span>
  )
}

/** Small dropdown select built on Popover. */
export function Select({ value, options, onChange, align = 'right', width = 180, disabled }) {
  const cur = options.find((o) => o.id === value) || options[0]
  return (
    <Popover align={align} width={width} trigger={({ toggle, open }) => (
      <button className={'b sm sel-b' + (open ? ' on' : '')} onClick={(e) => { e.stopPropagation(); toggle() }} disabled={disabled}>
        {cur.icon && <cur.icon size={13} />}{cur.label}<ChevronDown size={13} className="mute" />
      </button>
    )}>
      {(close) => options.map((o) => (
        <button key={o.id} onClick={() => { onChange(o.id); close() }}>
          {o.icon && <o.icon size={14} />}{o.label}{value === o.id && <Check size={14} style={{ marginLeft: 'auto' }} />}
        </button>
      ))}
    </Popover>
  )
}

/** Which product experience the shell is in: linear · vercel · attio */
export const ExpCtx = createContext('linear')
export const useExp = () => useContext(ExpCtx)

export const Switch = ({ on, onChange, label }) => (
  <button role="switch" aria-checked={on} aria-label={label} className={'sw' + (on ? ' on' : '')} onClick={(e) => { e.stopPropagation(); onChange(!on) }}><i /></button>
)

export const ModuleDot = ({ color, size = 8 }) => <span style={{ width: size, height: size, borderRadius: 3, background: color, flex: 'none', display: 'inline-block' }} />

/** Workspace mark: role-coloured glyph on a soft tile of the same colour. */
const ROLE_ICON = { pod: Megaphone, finance: Wallet, bd: Handshake }
export const RoleIcon = ({ role, size = 18 }) => {
  const r = ROLES_BY_ID[role]
  const I = ROLE_ICON[role]
  return (
    <span className="role-ic" style={{ '--rc': r.color, width: size, height: size }}>
      <I size={Math.round(size * 0.62)} strokeWidth={2.25} />
    </span>
  )
}

export { BRAND }
