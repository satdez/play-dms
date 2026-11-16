// Prospecting kit: the global filter bar, saved views, sheets, rows and the company dossier.
// Every non-Sources BD layout is built from these, over one shared slice.
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import {
  Search, X, Check, ChevronDown, SlidersHorizontal, Bookmark, Plus, KeyRound, UserCheck, Database, Radar, Pin, PinOff, Megaphone, ArrowUpRight,
  BookOpen, Inbox, CalendarDays, Lock, Sparkle, Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useStore } from '../store'
import { fmt, me } from '../data'
import { Tip, AutoHeight, EASE, DRAWER } from '../../shared/motion'
import { Avatar } from '../../shared/ui'
import { BrandLogo } from '../../shared/brands'
import { Popover, Switch, Svc, Tabs, go } from '../ui'
import { Sheet } from '../pages/Finance'
import { SIGNAL_KIND, F_EMPTY, repOf, proofFor, adsFor, budgetOf, brandOf } from './data'
import { relOf, stageLabel, isOpen } from './state'
import { Src, Rel, Val, CaseChip, openAddLead } from './ui'
import {
  FILTERS, filterById, activeCount, describe, run, companyHref, inDb, peopleOf, isKnown, sigsOf, apolloFind, apolloFetch, revealPeople,
  roleOf, FRESH, kbOf, heat, fmtDays,
} from './prospect'

/* ───────── Hooks ───────── */
export function useMq(q) {
  const [m, setM] = useState(() => window.matchMedia?.(q).matches ?? false)
  useEffect(() => { const x = window.matchMedia?.(q); if (!x) return; const on = (e) => setM(e.matches); x.addEventListener('change', on); return () => x.removeEventListener('change', on) }, [q])
  return m
}
export const useNarrow = () => useMq('(max-width: 760px)')

/** The global filter and everything it matches. */
export function useProspect() {
  const s = useStore(); const st = s.sales
  const f = st.filter
  const res = useMemo(() => run(st, f), [st.signals, st.inbound, st.accounts, st.deals, st.db, st.revealed, st.contacts, f]) // eslint-disable-line react-hooks/exhaustive-deps
  const setF = (next) => st.set(() => ({ filter: { ...F_EMPTY, ...next } }))
  return { s, st, f, res, setF }
}
const same = (a, b) => JSON.stringify({ ...F_EMPTY, ...a }) === JSON.stringify({ ...F_EMPTY, ...b })

/* ───────── Filter bar ───────── */
const INLINE = ['funding', 'size', 'cat', 'city', 'kind', 'recency', 'rel', 'fit', 'relevance', 'deal']
function FilterChip({ def, f, setF }) {
  const v = f[def.id]
  const act = Array.isArray(v) ? v.length > 0 : !!v
  const lab = (k) => def.opts.find((o) => o[0] === k)?.[1] || k
  const val = !act ? null : Array.isArray(v) ? (v.length === 1 ? lab(v[0]) : v.length) : lab(v)
  const tog = (k) => setF({ ...f, [def.id]: def.single ? (v === k ? '' : k) : v.includes(k) ? v.filter((x) => x !== k) : [...v, k] })
  return (
    <Popover align="left" width={220} trigger={({ toggle, open }) => (
      <span className={'bdv-fc' + (act ? ' on' : '') + (open ? ' open' : '')}>
        <button className="bdv-fc-b" onClick={toggle}>{def.label}{act ? <b className="num">{val}</b> : <ChevronDown size={12} className="mute" />}</button>
        {act && <button className="bdv-fc-x" aria-label={'Clear ' + def.label} onClick={() => setF({ ...f, [def.id]: def.single ? '' : [] })}><X size={11} /></button>}
      </span>
    )}>
      {(close) => (
        <div className="bdv-pop-l">
          {def.opts.map(([k, l]) => {
            const sel = def.single ? v === k : v.includes(k)
            return <button key={k} onClick={() => { tog(k); if (def.single) close() }} aria-pressed={sel}>{l}{sel && <Check size={14} style={{ marginLeft: 'auto' }} />}</button>
          })}
        </div>
      )}
    </Popover>
  )
}

/** Search, filter chips (a sheet on phones), saved views and Clear. One filter for every tab and layout. */
export function FilterBar({ children, inline = true }) {
  const { f, setF, st } = useProspect()
  const narrow = useNarrow()
  const [sheet, setSheet] = useState(false)
  const n = activeCount(f)
  const more = FILTERS.filter((x) => !INLINE.includes(x.id)).filter((x) => (Array.isArray(f[x.id]) ? f[x.id].length : f[x.id])).length
  return (
    <div className="bdv-fbar">
      <div className="inp bdv-q"><Search size={14} /><input value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} placeholder="Search signals, companies, people" aria-label="Search" />{f.q && <button aria-label="Clear search" onClick={() => setF({ ...f, q: '' })}><X size={13} /></button>}</div>
      {inline && !narrow ? (
        <>
          {INLINE.map((id) => <FilterChip key={id} def={filterById[id]} f={f} setF={setF} />)}
          <button className={'bdv-fc bdv-fc-b' + (more ? ' on' : '')} onClick={() => setSheet(true)}><SlidersHorizontal size={12} />More{more > 0 && <b className="num">{more}</b>}</button>
        </>
      ) : (
        <button className={'b sm' + (n ? ' on' : '')} onClick={() => setSheet(true)}><SlidersHorizontal size={13} />Filters{n > 0 && <span className="num">{n}</span>}</button>
      )}
      <ViewsMenu />
      {n > 0 && <button className="b sm ghost" onClick={() => setF(F_EMPTY)}>Clear</button>}
      <span className="bdv-cred m-hide"><Tip label="Apollo credits left"><span className="chip"><KeyRound size={12} /><span className="num">{st.credits}</span></span></Tip></span>
      {children}
      <FilterSheet open={sheet} onClose={() => setSheet(false)} />
    </div>
  )
}

/** Every filter as chip groups. Bottom sheet on phones, side sheet on desktop. */
export function FilterSheet({ open, onClose }) {
  const { f, setF, res } = useProspect()
  const narrow = useNarrow()
  const total = res.signals.length + res.companies.length + res.inbound.length + res.moments.length
  const body = (
    <div className="bdv-fsheet">
      <div className="row"><b className="grow">Filters</b>{activeCount(f) > 0 && <button className="b sm ghost" onClick={() => setF(F_EMPTY)}>Clear</button>}</div>
      {FILTERS.map((def) => {
        const v = f[def.id]
        return (
          <div key={def.id} className="sl-f">
            <span>{def.label}</span>
            <div className="sl-chips">{def.opts.map(([k, l]) => {
              const sel = def.single ? v === k : v.includes(k)
              return <button key={k} className={'chip sl-tog' + (sel ? ' on' : '')} aria-pressed={sel} onClick={() => setF({ ...f, [def.id]: def.single ? (sel ? '' : k) : sel ? v.filter((x) => x !== k) : [...v, k] })}>{l}</button>
            })}</div>
          </div>
        )
      })}
      <div className="bdv-fsheet-a"><button className="b ink" onClick={onClose}><Check size={14} />Show <span className="num">{total}</span></button></div>
    </div>
  )
  return narrow ? <BottomSheet open={open} onClose={onClose}>{body}</BottomSheet> : <Sheet open={open} onClose={onClose} width={420}>{body}</Sheet>
}

/* ───────── Saved views ───────── */
export function saveView(st, label, f) {
  const v = { id: 'v' + Date.now().toString(36), label: label.trim() || describe(f) || 'All', f: { ...F_EMPTY, ...f }, auto: false }
  st.set((x) => ({ views: [...x.views, v] }))
  toast('View saved', { description: v.label })
  return v
}
export const toggleAuto = (st, id) => st.set((x) => ({ views: x.views.map((v) => ({ ...v, auto: v.id === id ? !v.auto : false })) }))
export const dropView = (st, id) => st.set((x) => ({ views: x.views.filter((v) => v.id !== id) }))

function ViewsMenu({ icon }) {
  const { st, f, setF } = useProspect()
  const [name, setName] = useState('')
  const cur = st.views.find((v) => same(v.f, f))
  return (
    <Popover align="left" width={300} trigger={({ toggle, open }) => (
      icon ? <Tip label="Manage views"><button className={'b sm icon' + (open ? ' on' : '')} onClick={toggle} aria-label="Manage views"><Bookmark size={14} /></button></Tip>
        : <button className={'b sm bdv-vbtn' + (open ? ' on' : '')} onClick={toggle}><Bookmark size={13} /><span className="bdv-vlab">{cur ? cur.label : 'Views'}</span><ChevronDown size={12} className="mute" /></button>
    )}>
      {(close) => (
        <div className="bdv-views">
          <div className="pop-h">Views</div>
          {st.views.map((v) => (
            <div key={v.id} className={'bdv-vrow' + (cur?.id === v.id ? ' on' : '')}>
              <button className="bdv-vgo" onClick={() => { setF(v.f); close() }}>{cur?.id === v.id ? <Check size={13} /> : <Bookmark size={13} className="mute" />}<span className="ell">{v.label}</span></button>
              <Tip label={v.auto ? 'Applies when BD opens' : 'Apply when BD opens'}><span className="bdv-auto"><span className="mute xs">Auto</span><Switch on={v.auto} onChange={() => toggleAuto(st, v.id)} label={'Auto-apply ' + v.label} /></span></Tip>
              <button className="bdv-vx" aria-label={'Delete ' + v.label} onClick={() => dropView(st, v.id)}><X size={12} /></button>
            </div>
          ))}
          <div className="pop-sep" />
          <form className="bdv-vsave" onSubmit={(e) => { e.preventDefault(); saveView(st, name, f); setName('') }}>
            <div className="inp"><input value={name} onChange={(e) => setName(e.target.value)} placeholder={describe(f) || 'Name this view'} aria-label="View name" /></div>
            <button className="b sm" type="submit" disabled={!activeCount(f)}><Plus size={13} />Save</button>
          </form>
        </div>
      )}
    </Popover>
  )
}

/** Stream's sticky strip: one chip per saved view, plus New view and Filters. */
export function ViewStrip() {
  const { st, f, setF } = useProspect()
  const [sheet, setSheet] = useState(false)
  const [naming, setNaming] = useState(false)
  const [name, setName] = useState('')
  const n = activeCount(f)
  return (
    <div className="bdv-strip">
      <div className="bdv-strip-s">
        <button className={'chip sl-tog' + (!n ? ' on' : '')} aria-pressed={!n} onClick={() => setF(F_EMPTY)}>All</button>
        {st.views.map((v) => {
          const sel = same(v.f, f)
          return <button key={v.id} className={'chip sl-tog' + (sel ? ' on' : '')} aria-pressed={sel} onClick={() => setF(sel ? F_EMPTY : v.f)}>{v.auto && <Tip label="Auto-applies when BD opens"><Sparkle size={11} /></Tip>}{v.label}</button>
        })}
        {naming ? (
          <form className="bdv-newv" onSubmit={(e) => { e.preventDefault(); saveView(st, name, f); setName(''); setNaming(false) }}>
            <div className="inp"><input autoFocus value={name} onChange={(e) => setName(e.target.value)} onBlur={() => !name && setNaming(false)} placeholder={describe(f) || 'Name'} aria-label="View name" /></div>
            <button className="b sm ink" type="submit" disabled={!n}>Save</button>
          </form>
        ) : <button className="chip sl-tog bdv-plus" onClick={() => (n ? setNaming(true) : setSheet(true))}><Plus size={12} />New view</button>}
      </div>
      <button className={'b sm' + (n ? ' on' : '')} onClick={() => setSheet(true)} aria-label="Filters"><SlidersHorizontal size={13} /><span className="m-hide">Filters</span>{n > 0 && <span className="num">{n}</span>}</button>
      <ViewsMenu icon />
      <FilterSheet open={sheet} onClose={() => setSheet(false)} />
    </div>
  )
}

/* ───────── Bottom sheet (phones) ───────── */
export function BottomSheet({ open, onClose, children, tall }) {
  useEffect(() => {
    if (!open) return
    const k = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [open, onClose])
  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="sheet-scrim" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} />
          <motion.div className={'bdv-bs' + (tall ? ' tall' : '')} role="dialog" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%', transition: { duration: 0.22, ease: EASE } }} transition={{ duration: 0.36, ease: DRAWER }}
            drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.6 }} dragListener={false} onDragEnd={(_, i) => { if (i.offset.y > 90) onClose() }}>
            <div className="bdv-bs-h"><i /></div>
            <button className="b ghost icon sm sheet-x" onClick={onClose} aria-label="Close"><X size={15} /></button>
            <div className="bdv-bs-b">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}

/* ───────── Small pieces ───────── */
const RELL = { high: 'High', med: 'Medium', low: 'Low' }
export const RelTag = ({ v }) => (v ? <Tip label="BD relevance"><span className={'bdv-rt r-' + v}><i />{RELL[v]}</span></Tip> : null)

/** Base enrichment every signal gets. */
export function Enrich({ g, pitch = true }) {
  return (
    <div className="bdv-en">
      <div className="bdv-en-r">
        <span className="bdv-en-i ell">{g.intent || <Val v={null} />}</span>
        {g.fit?.length > 0 && <Svc list={g.fit} />}
        <RelTag v={g.relevance} />
        {g.dealSize ? <Tip label="Likely deal size"><span className="num bdv-en-d">≈ {fmt.inr(g.dealSize)}</span></Tip> : null}
        <Src s="AI" />
      </div>
      {pitch && g.pitch && <div className="bdv-pitch">“{g.pitch}”</div>}
    </div>
  )
}
export const facts = (c) => [c.funding, c.size != null ? c.size.toLocaleString('en-IN') + ' people' : null, c.hq, c.cat]
export function CoMeta({ c, short }) {
  const l = short ? [c.funding, c.size != null ? c.size.toLocaleString('en-IN') : null, c.hq] : facts(c)
  return <span className="bdv-meta">{l.map((v, i) => <span key={i}>{v ?? <span className="sl-unk">Unknown</span>}</span>)}</span>
}
export const FreshTag = ({ id }) => (FRESH.has(id) ? <span className="chip g bdv-new"><Database size={11} />New · saved to DB</span> : null)

export function PinBtn({ c }) {
  const s = useStore(); const st = s.sales
  const pinned = st.pins.includes(c.name)
  return (
    <Tip label={pinned ? 'Unpin' : 'Pin to sidebar'}>
      <button className={'b ghost icon sm' + (pinned ? ' on' : '')} aria-pressed={pinned} aria-label={pinned ? 'Unpin' : 'Pin'} onClick={(e) => { e.preventDefault(); e.stopPropagation(); st.set((x) => ({ pins: pinned ? x.pins.filter((n) => n !== c.name) : [...x.pins, c.name] })) }}>
        {pinned ? <PinOff size={14} /> : <Pin size={14} />}
      </button>
    </Tip>
  )
}

/** Add a signal's company to the pipeline: the same form, duplicate check included. */
export function addSignal(g) {
  const b = brandOf(g.brand)
  const p = b?.people.find((x) => x.moved) || b?.people.find((x) => x.onFile)
  openAddLead({ brand: g.brand, source: 'Daily Feed', note: g.title + '. ' + (g.angle || ''), value: g.dealSize ? String(Math.round(g.dealSize / 1e5)) : undefined, services: g.fit, contact: p ? { name: p.name, title: p.title, email: p.email } : undefined, ref: { kind: 'signal', id: g.id } })
}
export function addCompany(c, st) {
  const ppl = peopleOf(c, st)
  const p = ppl.find((x) => x.moved && isKnown(x, st)) || ppl.find((x) => isKnown(x, st))
  const g = sigsOf(c, st)[0]
  openAddLead({ brand: c.name, source: 'Discover', note: g ? g.title + '. ' + (g.angle || '') : undefined, contact: p ? { name: p.name, title: p.title, email: p.email } : undefined })
}
export function AddBtn({ c, g, label = 'Add to pipeline', sm = true, ink }) {
  const s = useStore(); const st = s.sales
  const deal = st.deals.find((d) => d.brand === c.name && d.stage !== 'lost')
  if (g?.status === 'added' && g.deal) return <a className={'b' + (sm ? ' sm' : '')} href={'#/bd/pipeline/' + g.deal}><Check size={13} />In pipeline</a>
  return <button className={'b' + (sm ? ' sm' : '') + (ink ? ' ink' : '')} onClick={(e) => { e.stopPropagation(); g ? addSignal(g) : addCompany(c, st) }}><Plus size={13} />{deal && !g ? 'Add again' : label}</button>
}

/** Quiet per-signal add inside a company: the page already has one primary Add. */
function SigAdd({ g }) {
  if (g.status === 'added' && g.deal) return <Tip label="In pipeline"><a className="b ghost icon sm" href={'#/bd/pipeline/' + g.deal} aria-label="In pipeline"><Check size={14} /></a></Tip>
  return <Tip label="Add to pipeline with this signal"><button className="b ghost icon sm" aria-label="Add to pipeline with this signal" onClick={() => addSignal(g)}><Plus size={14} /></button></Tip>
}

/* ───────── Rows ───────── */
export function SigRow({ g, showCo = true }) {
  const c = brandOf(g.brand) || { name: g.brand, id: '' }
  return (
    <article className="bdv-sig">
      {showCo && <a href={companyHref(c)} className="bdv-sig-l" aria-label={g.brand}><BrandLogo name={g.brand} size={32} /></a>}
      <div className="grow bdv-sig-b">
        <div className="row bdv-sig-h">
          {showCo && <a href={companyHref(c)} className="bdv-co"><b>{g.brand}</b></a>}
          <span className="chip">{SIGNAL_KIND[g.kind]}</span><span className="mute xs">{fmt.ago(g.at)}</span>
          <span className="grow" />
          {g.born && <Tip label={g.born.name + ' · ' + g.born.title + ' joined People'}><span className="chip bdv-born"><UserCheck size={11} />{g.born.title}</span></Tip>}
        </div>
        <div className="bdv-sig-t">{g.title}</div>
        <Enrich g={g} />
      </div>
      <div className="bdv-sig-a"><AddBtn c={c} g={g} /></div>
    </article>
  )
}

export function CoRow({ c, n, max, onOpen, sel, showHeat }) {
  const s = useStore(); const st = s.sales
  const h = showHeat ? heat(c, st) : null
  const Tag = onOpen ? 'button' : 'a'
  return (
    <Tag className={'li bdv-co-r' + (sel ? ' sel' : '')} {...(onOpen ? { onClick: () => onOpen(c) } : { href: companyHref(c) })}>
      <BrandLogo name={c.name} size={28} />
      <span className="grow bdv-co-m">
        <span className="row" style={{ gap: 6 }}><span className="li-t ell">{c.name}</span><FreshTag id={c.id} /></span>
        <CoMeta c={c} short />
      </span>
      {showHeat ? (
        <Tip label={'Heat ' + h + ' · recent signals, relevance, relationship'}><span className="bdv-heat"><span className="bdv-bar"><i style={{ width: h + '%' }} /></span><span className="num">{h}</span></span></Tip>
      ) : (
        <Tip label={n + (n === 1 ? ' matching signal' : ' matching signals')}><span className="bdv-heat"><span className="bdv-bar"><i style={{ width: (max ? (n / max) * 100 : 0) + '%' }} /></span><span className="num">{n}</span></span></Tip>
      )}
      <span className="m-hide"><Rel rel={relOf(c.name, st)} compact /></span>
    </Tag>
  )
}

export function PersonRow({ p, picked, onPick }) {
  const s = useStore(); const st = s.sales
  const known = isKnown(p, st)
  const c = brandOf(p.brand) || { name: p.brand, id: '' }
  return (
    <div className={'li bdv-p' + (picked ? ' sel' : '')}>
      {onPick && (known ? <span className="bdv-ck-s" /> : <button className={'sl-ck' + (picked ? ' on' : '')} role="checkbox" aria-checked={!!picked} aria-label={'Pick ' + p.name} onClick={() => onPick(p)}>{picked && <Check size={11} strokeWidth={3} />}</button>)}
      <Avatar user={{ name: p.name, hue: p.name.length * 37 }} size={28} />
      <span className="grow bdv-co-m">
        <span className="row" style={{ gap: 6 }}><span className="li-t ell">{p.name}</span><FreshTag id={p.id} /></span>
        <span className="li-s ell">{p.title} · <a href={companyHref(c)} className="bdv-co">{p.brand}</a>{known && <span className="mono"> · {p.email}</span>}</span>
      </span>
      {p.born && <Tip label="Joined People from a signal"><span className="chip bdv-born m-hide"><Radar size={11} />Signal</span></Tip>}
      {p.moved && <Tip label={'Worked with us at ' + p.moved}><span className="chip y m-hide">Ex-{p.moved}</span></Tip>}
      {known ? <span className="chip g"><UserCheck size={12} />{p.onFile ? 'On file' : 'Revealed'}</span>
        : <Tip label="Reveal on Apollo · 1 credit"><button className="b sm" onClick={() => revealPeople(st, [p])}><Lock size={12} />Reveal</button></Tip>}
      {known && <Tip label="Add to pipeline"><button className="b sm icon" aria-label="Add to pipeline" onClick={() => openAddLead({ brand: p.brand, source: 'Discover', contact: { name: p.name, title: p.title, email: p.email } })}><Plus size={14} /></button></Tip>}
    </div>
  )
}

export function InboundRow({ x }) {
  const s = useStore(); const st = s.sales
  const c = brandOf(x.company) || { name: x.company, id: '' }
  const add = () => { if (!x.owner) st.claim(x.id); openAddLead({ brand: x.company, source: 'Inbound', value: String(x.budget / 1e5), contact: { name: x.name, title: '', email: x.email }, note: x.summary, ref: { kind: 'inbound', id: x.id } }) }
  return (
    <div className="li bdv-inb">
      <a href={companyHref(c)}><BrandLogo name={x.company} size={28} /></a>
      <span className="grow bdv-co-m">
        <span className="row" style={{ gap: 6 }}><a href={companyHref(c)} className="li-t ell bdv-co">{x.company}</a><span className="mute xs">{x.name} · {fmt.agoShort(x.at)}</span></span>
        <span className="li-s ell">{x.summary}</span>
      </span>
      <span className="num fw5 m-hide">{fmt.inr(x.budget)}</span>
      {x.owner ? <Tip label={'Owned by ' + repOf(x.owner).short}><span><Avatar user={repOf(x.owner)} size={20} /></span></Tip>
        : <button className="b sm" onClick={() => { st.claim(x.id); toast('Claimed · ' + x.company) }}><UserCheck size={13} />Claim</button>}
      {(!x.owner || x.owner === me.id) && <Tip label="Add to pipeline"><button className="b sm icon" aria-label="Add to pipeline" onClick={add}><Plus size={14} /></button></Tip>}
    </div>
  )
}

export function MomentRow({ m }) {
  const d = m.at
  return (
    <div className="li bdv-mo">
      <span className="bdv-date"><b className="num">{d.getDate()}</b><span>{fmt.date(d).split(' ')[1]}</span></span>
      <span className="grow bdv-co-m">
        <span className="row" style={{ gap: 6 }}><span className="li-t ell">{m.name}</span><span className="chip">{m.region}</span><span className="mute xs">{fmtDays(d)}</span></span>
        <span className="li-s ell">{[...new Set(m.cats)].slice(0, 4).join(' · ')}</span>
      </span>
      <span className="bdv-logos">
        {m.brands.slice(0, 5).map((c) => <Tip key={c.id} label={c.name}><a href={companyHref(c)}><BrandLogo name={c.name} size={22} /></a></Tip>)}
        {m.brands.length > 5 && <span className="mute xs num">+{m.brands.length - 5}</span>}
      </span>
    </div>
  )
}

/** End-of-list row: the same filter, run on Apollo. Cost first; what comes back stays in our DB. */
export function BeyondRow({ kind, list }) {
  const { st, f } = useProspect()
  const found = apolloFind(f, st, kind)
  const [ask, setAsk] = useState(false)
  const [done, setDone] = useState(null)
  const [got, setGot] = useState([])
  const n = found.length
  const noun = kind === 'companies' ? (n === 1 ? 'company' : 'companies') : n === 1 ? 'person' : 'people'
  const go_ = () => {
    if (!n) { setDone(0); setAsk(false); return }
    const r = apolloFetch(st, kind === 'companies' ? { companies: found } : { people: found })
    if (r > 0) { setDone(r); setAsk(false); setGot(found) }
  }
  return (
    <div className="bdv-beyond">
      <AutoHeight>
        {!ask ? (
          <button className="li bdv-beyond-b" onClick={() => { setDone(null); setAsk(true) }}>
            <span className="bdv-ic"><Database size={14} /></span>
            <span className="grow"><span className="li-t">Search beyond our DB</span>{done != null && <span className="mute xs"> · {done ? done + ' saved' : 'nothing new'}</span>}</span>
            {n ? <span className="chip y"><KeyRound size={11} />Apollo · <span className="num">{n}</span> {n === 1 ? 'credit' : 'credits'}</span> : <span className="chip g">In our DB · free</span>}
          </button>
        ) : (
          <div className="bdv-beyond-q">
            <div className="grow">
              <b>{n ? `${n} new ${noun} on Apollo` : 'Nothing new on Apollo'}</b>
              <div className="mute xs">{n ? `${n} ${n === 1 ? 'credit' : 'credits'} · ${st.credits} left · saved to our DB for good` : 'Everything that matches is already in our DB · free'}{describe(f) && ' · ' + describe(f)}</div>
            </div>
            <button className="b sm" onClick={() => setAsk(false)}>Cancel</button>
            <button className="b sm ink" onClick={go_}>{n ? <><KeyRound size={13} />Spend {n}</> : 'Done'}</button>
          </div>
        )}
      </AutoHeight>
      {list && got.length > 0 && <div className="list">{got.map((c) => <CoRow key={c.id} c={c} n={0} max={1} />)}</div>}
    </div>
  )
}

/* ───────── Dossier sections ───────── */
export function SignalsTimeline({ c }) {
  const s = useStore(); const st = s.sales
  const sigs = sigsOf(c, st)
  const inb = st.inbound.filter((x) => x.company === c.name)
  const items = [...sigs.map((g) => ({ at: g.at, g })), ...inb.map((x) => ({ at: x.at, x }))].sort((a, b) => b.at - a.at)
  if (!items.length) return <div className="empty"><Radar size={18} /><b>No signals</b></div>
  return (
    <div className="bdv-tl">
      {items.map((it) => it.g ? (
        <div key={it.g.id} className="bdv-tl-i">
          <span className="bdv-tl-d mute xs">{fmt.agoShort(it.at)}</span><i className="bdv-tl-dot" />
          <div className="grow bdv-sig-b">
            <div className="row bdv-sig-h"><span className="chip">{SIGNAL_KIND[it.g.kind]}</span><b className="bdv-tl-t grow">{it.g.title}</b><SigAdd g={it.g} /></div>
            <Enrich g={it.g} />
          </div>
        </div>
      ) : (
        <div key={it.x.id} className="bdv-tl-i">
          <span className="bdv-tl-d mute xs">{fmt.agoShort(it.at)}</span><i className="bdv-tl-dot in" />
          <div className="grow">
            <div className="row bdv-sig-h"><span className="chip y"><Inbox size={11} />Inbound</span><b className="bdv-tl-t">{it.x.summary}</b></div>
            <div className="mute xs" style={{ marginTop: 4 }}>{it.x.name} · {fmt.inr(it.x.budget)} · {it.x.owner ? repOf(it.x.owner).short : 'Unclaimed'}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function PeopleList({ c }) {
  const s = useStore(); const st = s.sales
  const ppl = peopleOf(c, st)
  const [pick, setPick] = useState([])
  const locked = ppl.filter((p) => !isKnown(p, st))
  const tog = (p) => setPick((l) => (l.includes(p.id) ? l.filter((x) => x !== p.id) : [...l, p.id]))
  if (!ppl.length) return <div className="empty"><UserCheck size={18} /><b>Unknown</b><span>No people on record</span></div>
  return (
    <>
      <BulkBar pick={pick} all={locked} setPick={setPick} />
      <div className="list">{ppl.map((p) => <PersonRow key={p.id} p={p} picked={pick.includes(p.id)} onPick={tog} />)}</div>
    </>
  )
}
/** Bulk reveal with the credit estimate up front. */
export function BulkBar({ pick, all, setPick }) {
  const s = useStore(); const st = s.sales
  if (!all.length) return null
  const list = all.filter((p) => pick.includes(p.id))
  return (
    <div className="bdv-bulk">
      <button className="b sm ghost" onClick={() => setPick(list.length === all.length ? [] : all.map((p) => p.id))}>{list.length === all.length ? 'Clear' : 'Select locked'} <span className="num mute">{all.length}</span></button>
      <span className="grow" />
      {list.length > 0 && <span className="mute xs num">{list.length} × 1 credit · {st.credits} left</span>}
      <button className={'b sm' + (list.length ? ' ink' : ' dis')} disabled={!list.length} onClick={() => { revealPeople(st, list); setPick([]) }}><KeyRound size={13} />Reveal{list.length > 0 && <span className="num">{list.length}</span>}</button>
    </div>
  )
}

export function DealsList({ c }) {
  const s = useStore(); const st = s.sales
  const ds = st.deals.filter((d) => d.brand === c.name)
  if (!ds.length) return <div className="empty"><b>No deals</b><span>Never in the pipeline</span></div>
  return (
    <div className="list">{ds.map((d) => (
      <a key={d.id} className="li" href={'#/bd/pipeline/' + d.id}>
        <span className={'sl-stag s-' + d.stage}><i />{stageLabel(d.stage)}</span>
        <span className="grow ell fg2">{d.next || (d.lost ? 'Lost · ' + (d.lost.reason || '') : '—')}</span>
        <span className="num fw5">{fmt.inr(d.value)}</span>
        <Avatar user={repOf(d.owner)} size={20} />
        <span className="mute xs m-hide">{fmt.agoShort(d.updated)}</span>
      </a>
    ))}</div>
  )
}

export function ProofList({ c }) {
  const list = proofFor(c.name, 3)
  return (
    <div className="list">{list.map((k) => (
      <a key={k.id} className="li bdv-proof" href={'#/bd/cases/' + k.id}>
        <BrandLogo name={k.client} size={24} />
        <span className="grow bdv-co-m"><span className="li-t ell">{k.client} · {k.title}</span><span className="li-s ell">{k.result}</span></span>
        <span className="num mute m-hide">{fmt.compact(k.views)}</span>
        {k.cats.includes(c.cat) && <span className="chip g">{c.cat}</span>}
      </a>
    ))}</div>
  )
}

/** Meta Ads brand watch (simulated): ads the brand is running now. */
export function AdsList({ c }) {
  const s = useStore(); const st = s.sales
  const ads = inDb(c, st) && !c.stub ? adsFor(c) : null
  if (!ads) return <div className="bdv-ads-e"><Megaphone size={15} className="mute" /><span className="sl-unk">Unknown</span><span className="mute xs">No ads on record</span><span className="grow" /><Src s="Meta Ads" /></div>
  return (
    <div className="bdv-ads">
      <div className="row bdv-ads-h"><b>{ads.length} live</b><span className="mute xs">Meta Ad Library</span><span className="grow" /><Src s="Meta Ads" /></div>
      <div className="bdv-ads-g">{ads.map((a) => (
        <div key={a.id} className="bdv-ad">
          <div className="row" style={{ gap: 6 }}><span className="chip">{a.format}</span><span className="mute xs">since {fmt.date(a.started)}</span></div>
          <div className="bdv-ad-t">{a.headline}</div>
          <div className="mute xs">{a.platforms.join(' · ')}</div>
        </div>
      ))}</div>
    </div>
  )
}

export function KbNotes({ c }) {
  const s = useStore(); const st = s.sales
  const kb = kbOf(c)
  const acct = st.accounts.find((a) => a.brand === c.name)
  const notes = st.contacts.filter((x) => x.brand === c.name)
  if (!kb && !acct && !notes.length) return <div className="bdv-ads-e"><BookOpen size={15} className="mute" /><span className="sl-unk">Unknown</span><span className="mute xs">No notes</span></div>
  return (
    <div className="list">
      {kb && <a className="li" href={'#/bd/kb/' + kb.id}><BookOpen size={15} className="mute" /><span className="grow">Knowledge base</span><span className="mute num">{kb.campaigns} campaigns</span><ArrowUpRight size={13} className="mute" /></a>}
      {acct && <a className="li" href={'#/bd/accounts/' + acct.id}><Inbox size={15} className="mute" /><span className="grow ell">Client since {acct.since} · {fmt.inr(acct.spend)} a year</span><Avatar user={repOf(acct.owner)} size={18} /></a>}
      {notes.map((n) => <div key={n.id} className="li"><CalendarDays size={15} className="mute" /><span className="grow ell">{n.note}</span><span className="mute xs">{n.name} · {n.source}</span></div>)}
    </div>
  )
}

/* ───────── Company header + dossier tabs ───────── */
export function CoHead({ c, children, size = 40, meta = true }) {
  const s = useStore(); const st = s.sales
  const db = inDb(c, st)
  return (
    <div className="bdv-head">
      <BrandLogo name={c.name} size={size} />
      <div className="grow bdv-co-m">
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}><h2 className="d-h1 bdv-h2">{c.name}</h2>{db ? <span className="chip g"><Database size={11} />In our DB</span> : <span className="chip"><Database size={11} />Apollo</span>}<FreshTag id={c.id} /></div>
        {meta && <CoMeta c={c} />}
      </div>
      {children}
    </div>
  )
}

const DTABS = ['signals', 'people', 'deals', 'proof', 'ads']
export function Dossier({ c, back }) {
  const s = useStore(); const st = s.sales
  const [tab, setTab] = useState('signals')
  useEffect(() => setTab('signals'), [c.id])
  const n = { signals: sigsOf(c, st).length + st.inbound.filter((x) => x.company === c.name).length, people: peopleOf(c, st).length, deals: st.deals.filter((d) => d.brand === c.name).length, proof: null, ads: adsFor(c)?.length ?? null }
  const h = heat(c, st)
  const bud = budgetOf(c)
  return (
    <div className="bdv-dos">
      {back}
      <CoHead c={c}>
        <PinBtn c={c} />
      </CoHead>
      <div className="bdv-dos-k">
        <div><span>Heat</span><b className="num">{h}</b></div>
        <div><span>Relationship</span><Rel rel={relOf(c.name, st)} /></div>
        <div><span>Creator budget</span><b className="num"><Val v={bud && fmt.inr(bud.annual)} /></b></div>
        <div className="bdv-dos-a"><AddBtn c={c} ink sm={false} /></div>
      </div>
      <Tabs id="bdv-dos" value={tab} onChange={setTab} options={DTABS.map((k) => ({ value: k, label: { signals: 'Signals', people: 'People', deals: 'Deals', proof: 'Proof', ads: 'Ads' }[k], count: n[k] }))} />
      <div className="bdv-dos-b">
        {tab === 'signals' && <SignalsTimeline c={c} />}
        {tab === 'people' && <PeopleList c={c} />}
        {tab === 'deals' && <DealsList c={c} />}
        {tab === 'proof' && <ProofList c={c} />}
        {tab === 'ads' && <AdsList c={c} />}
      </div>
    </div>
  )
}
export { isOpen }
