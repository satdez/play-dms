// New campaign, desktop: a centred composer you can drive from the keyboard.
// One column anchored near the top, so it grows down and never jumps. Type to filter, ↑↓ to move,
// ↵ to pick; Esc (or ⌫ on an empty field) steps back. Choices stack up in the header as crumbs,
// and each crumb jumps back to its step. Opened by a shortcut it appears instantly.
// Phones keep the bottom tray (NewCampaignTray in motion.jsx).
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { X, Check, ChevronRight, CornerDownLeft, Laugh, Users, Smartphone, Music, Rocket, Infinity as Always, CalendarDays } from 'lucide-react'
import { toast } from 'sonner'
import { clients, campaignTypes, fmt } from '../data'
import { BrandLogo } from './brands'
import { EASE, TextMorph, isPhone } from './motion'

const TYPE_ICON = { 'Meme marketing': Laugh, Influencer: Users, UGC: Smartphone, 'Music promotion': Music, 'Product launch': Rocket, 'Always-on': Always, Event: CalendarDays }
const BUDGETS = [500000, 1000000, 2500000, 5000000]
const HINT = ['Client', 'Type', 'Budget', 'Review']

export function NewCampaignDialog() {
  const [open, setOpen] = useState(false)
  const [instant, setInstant] = useState(false)
  const [step, setStep] = useState(0)
  const [client, setClient] = useState(null)
  const [type, setType] = useState(null)
  const [budget, setBudget] = useState(1000000)
  const [q, setQ] = useState('')
  const [hi, setHi] = useState(0)
  const [done, setDone] = useState(false)
  const field = useRef(null)
  const cta = useRef(null)
  const listEl = useRef(null)
  const back = useRef(null) // focus returns here on close

  useEffect(() => {
    const on = (e) => {
      if (isPhone()) return
      back.current = document.activeElement
      setInstant(!!e.detail?.key)
      setStep(0); setClient(null); setType(null); setBudget(1000000); setQ(''); setHi(0); setDone(false)
      setOpen(true)
    }
    window.addEventListener('dms:new-campaign', on)
    return () => window.removeEventListener('dms:new-campaign', on)
  }, [])
  const close = useCallback(() => { setOpen(false); setTimeout(() => back.current?.focus?.(), 0) }, [])
  const go = (n) => { setStep(n); setQ(''); setHi(0) }

  const needle = q.trim().toLowerCase()
  const list = step === 0 ? clients.filter((c) => c.name.toLowerCase().includes(needle) || c.industry.toLowerCase().includes(needle))
    : step === 1 ? campaignTypes.filter((t) => t.toLowerCase().includes(needle)) : []
  const pick = (i) => {
    const x = list[i]
    if (x == null) return
    if (step === 0) { setClient(x); go(type ? 3 : 1) } // changing the client from review goes straight back to review
    else { setType(x); go(2) }
  }
  const create = () => {
    if (done) return
    setDone(true)
    setTimeout(() => { close(); toast.success(client.name + ' · ' + type, { description: fmt.inr(budget) }) }, 650)
  }

  // focus follows the step (autoFocus on each step's field), so the first keystroke after C is never lost
  useEffect(() => { listEl.current?.querySelector('[data-hi]')?.scrollIntoView({ block: 'nearest' }) }, [hi, step])

  const onKey = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); if (!done) step > 0 ? go(step - 1) : close(); return }
    if (done) return
    if (step < 2 && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault()
      const n = list.length
      if (n) setHi((h) => (h + (e.key === 'ArrowDown' ? 1 : -1) + n) % n)
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      if (step < 2) pick(hi)
      else if (step === 2) { if (budget > 0) go(3) }
      else create()
      return
    }
    if (e.key === 'Backspace' && step > 0 && step < 3 && !q && (step !== 2 || !budget)) { e.preventDefault(); go(step - 1) }
  }
  // Esc must beat page-level handlers while this is open
  const keyRef = useRef(onKey)
  keyRef.current = onKey
  useEffect(() => {
    if (!open) return
    const on = (e) => { if (e.key === 'Escape') keyRef.current(e) }
    window.addEventListener('keydown', on, true)
    return () => window.removeEventListener('keydown', on, true)
  }, [open])

  const t = instant ? { duration: 0 } : { duration: 0.18, ease: EASE }
  const out = { duration: instant ? 0 : 0.12, ease: EASE }
  const TypeIc = type && TYPE_ICON[type]
  const crumbs = [
    client && { s: 0, el: <><BrandLogo name={client.name} size={16} radius={5} />{client.name}</> },
    type && step > 1 && { s: 1, el: <>{TypeIc && <TypeIc size={14} />}{type}</> },
    step > 2 && { s: 2, el: fmt.inr(budget) },
  ].filter(Boolean)

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div key="ncd" className="ncd-layer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: out }} transition={t}>
          <div className="ncd-scrim" onClick={close} />
          <motion.div className="ncd" role="dialog" aria-modal="true" aria-label="New campaign" onKeyDown={onKey}
            initial={{ scale: 0.97, y: -6 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.98, transition: out }} transition={t}>
            <div className="ncd-h">
              <span className="ncd-t">New campaign</span>
              {crumbs.map((c) => (
                <span key={c.s} className="ncd-cw">
                  <ChevronRight size={13} className="ncd-sep" />
                  <button className="ncd-crumb" onClick={() => go(c.s)} disabled={done}>{c.el}</button>
                </span>
              ))}
              <button className="ncd-x" onClick={close} aria-label="Close"><X size={15} /></button>
            </div>

            {step < 2 && (
              <>
                <input ref={field} autoFocus className="ncd-in" value={q} placeholder={HINT[step]} aria-label={HINT[step]}
                  onChange={(e) => { setQ(e.target.value); setHi(0) }} spellCheck={false} autoComplete="off" />
                <div className="ncd-list" ref={listEl} role="listbox" aria-label={HINT[step]}>
                  {list.length === 0 && <div className="ncd-empty">No match</div>}
                  {step === 0 && list.map((c, i) => (
                    <button key={c.id} tabIndex={-1} role="option" aria-selected={i === hi} data-hi={i === hi || undefined}
                      className={'ncd-o' + (i === hi ? ' hi' : '')} onMouseMove={() => i !== hi && setHi(i)} onClick={() => pick(i)}>
                      <BrandLogo name={c.name} size={20} radius={6} />
                      <span className="ncd-o-n ell">{c.name}</span>
                      <span className="ncd-o-m">{c.industry}</span>
                      {client?.id === c.id && <Check size={14} className="ncd-o-c" />}
                    </button>
                  ))}
                  {step === 1 && list.map((x, i) => {
                    const I = TYPE_ICON[x]
                    return (
                      <button key={x} tabIndex={-1} role="option" aria-selected={i === hi} data-hi={i === hi || undefined}
                        className={'ncd-o' + (i === hi ? ' hi' : '')} onMouseMove={() => i !== hi && setHi(i)} onClick={() => pick(i)}>
                        <span className="ncd-o-i">{I && <I size={15} />}</span>
                        <span className="ncd-o-n">{x}</span>
                        {type === x && <Check size={14} className="ncd-o-c" />}
                      </button>
                    )
                  })}
                </div>
              </>
            )}

            {step === 2 && (
              <div className="ncd-budget">
                <label className="ncd-amt">
                  <span className="ncd-cur">₹</span>
                  <input ref={field} autoFocus inputMode="numeric" aria-label="Budget" placeholder="0" value={budget ? budget.toLocaleString('en-IN') : ''}
                    onChange={(e) => setBudget(Number(e.target.value.replace(/\D/g, '').slice(0, 10)) || 0)} />
                </label>
                <div className="ncd-row">
                  <div className="ncd-chips">
                    {BUDGETS.map((v) => <button key={v} className={'ncd-chip' + (budget === v ? ' on' : '')} onClick={() => { setBudget(v); field.current?.focus() }}>{fmt.inr(v)}</button>)}
                  </div>
                  <button className="ncd-go" disabled={!budget} onClick={() => go(3)}>Continue<CornerDownLeft size={13} /></button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="ncd-review">
                <div className="ncd-sum">
                  <BrandLogo name={client.name} size={40} radius={12} />
                  <div className="ncd-sum-t"><b className="ell">{client.name}</b><span>{type}</span></div>
                  <b className="ncd-sum-a num">{fmt.inr(budget)}</b>
                </div>
                <div className="ncd-row end">
                  <button ref={cta} autoFocus className={'ncd-go' + (done ? ' is-done' : '')} onClick={create}>
                    <AnimatePresence mode="popLayout" initial={false}>
                      {done && <motion.span key="c" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2, ease: EASE }} style={{ display: 'grid' }}><Check size={15} strokeWidth={2.5} /></motion.span>}
                    </AnimatePresence>
                    <TextMorph>{done ? 'Created' : 'Create campaign'}</TextMorph>
                    {!done && <CornerDownLeft size={13} />}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
