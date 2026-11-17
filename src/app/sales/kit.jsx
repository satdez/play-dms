// Prospecting kit: the global filter bar, saved views, sheets, rows and the company dossier.
// Every non-Sources BD layout is built from these, over one shared slice.
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import {
  Search, X, Check, ChevronDown, SlidersHorizontal, Bookmark, Plus, KeyRound, UserCheck, Database, Radar, Pin, PinOff, Megaphone, ArrowUpRight,
  BookOpen, Inbox, CalendarDays, Lock, Sparkle, Trash2, PanelLeft, PanelLeftClose, PanelRight, Info, Building2, User, CornerDownLeft, Layers3, Flame,
} from 'lucide-react'
import { toast } from 'sonner'
import { useStore } from '../store'
import { fmt, me, TODAY, SERVICES } from '../data'
import { Tip, AutoHeight, EASE, DRAWER } from '../../shared/motion'
import { Avatar } from '../../shared/ui'
import { BrandLogo } from '../../shared/brands'
import { Popover, Switch, Svc, Tabs, Seg, go } from '../ui'
import { Sheet } from '../pages/Finance'
import { SIGNAL_KIND, F_EMPTY, repOf, proofFor, adsFor, budgetOf, brandOf } from './data'
import { relOf, stageLabel, isOpen } from './state'
import { Src, Rel, Val, CaseChip, openAddLead } from './ui'
import { TodoBlock } from '../todo/ui'
import {
  FILTERS, filterById, activeCount, describe, run, companyHref, inDb, peopleOf, isKnown, sigsOf, apolloFind, apolloFetch, revealPeople,
  roleOf, FRESH, kbOf, heat, fmtDays, GROUPS, SCOPES, optsOf, facetCounts, quickFind, bdFilters, bdFilterSide, fetchName, companyByName, searchScope,
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
const INLINE = ['funding', 'size', 'cat', 'city', 'kind', 'recency', 'relevance', 'role', 'dept']
const isOn = (v) => (Array.isArray(v) ? v.length > 0 : !!v)
const togOf = (def, f, k) => {
  const v = f[def.id] ?? (def.single ? '' : [])
  return { ...f, [def.id]: def.single ? (v === k ? '' : k) : v.includes(k) ? v.filter((x) => x !== k) : [...v, k] }
}
function FilterChip({ def, f, setF }) {
  const { st } = useProspect()
  const v = f[def.id] ?? (def.single ? '' : [])
  const opts = optsOf(def, st)
  const act = isOn(v)
  const lab = (k) => opts.find((o) => o[0] === k)?.[1] || k
  const val = !act ? null : Array.isArray(v) ? (v.length === 1 ? lab(v[0]) : v.length) : lab(v)
  const [q, setQ] = useState('')
  const list = def.search && q ? opts.filter((o) => o[1].toLowerCase().includes(q.toLowerCase())) : opts
  return (
    <Popover align="left" width={def.search ? 250 : 220} trigger={({ toggle, open }) => (
      <span className={'bdv-fc' + (act ? ' on' : '') + (open ? ' open' : '')}>
        <button className="bdv-fc-b" onClick={toggle}>{def.label}{act ? <b className="num">{val}</b> : <ChevronDown size={12} className="mute" />}</button>
        {act && <button className="bdv-fc-x" aria-label={'Clear ' + def.label} onClick={() => setF({ ...f, [def.id]: def.single ? '' : [] })}><X size={11} /></button>}
      </span>
    )}>
      {(close) => (
        <div className="bdv-pop-l">
          {def.search && <div className="inp bdv-fsrch"><Search size={13} /><input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={'Find ' + def.label.toLowerCase()} aria-label={'Find ' + def.label} /></div>}
          {list.slice(0, 60).map(([k, l]) => {
            const sel = def.single ? v === k : v.includes(k)
            return <button key={k} onClick={() => { setF(togOf(def, f, k)); if (def.single) close() }} aria-pressed={sel}>{def.id === 'co' && <BrandLogo name={l} size={16} />}{l}{sel && <Check size={14} style={{ marginLeft: 'auto' }} />}</button>
          })}
          {!list.length && <div className="mute xs" style={{ padding: '8px 10px' }}>No match</div>}
        </div>
      )}
    </Popover>
  )
}

/* ───────── Search: a scope, then instant results ─────────
   Scope picks what the search looks at. Typing shows the best few companies, people and signals; Enter filters every tab by it;
   a name we don't have can be fetched from Apollo. */
const SCOPE_PH = { all: 'Search companies, people and signals', companies: 'Search companies by name, industry or city', people: 'Search people by name or title, e.g. CMO', signals: 'Search signals, e.g. Series B' }
export function SearchBox({ stacked }) {
  const { st, f, setF } = useProspect()
  const [text, setText] = useState(f.q)
  const [open, setOpen] = useState(false)
  const [hi, setHi] = useState(0)
  const box = useRef(null)
  useEffect(() => { setText(f.q) }, [f.q])
  useEffect(() => {
    if (!open) return
    const out = (e) => { if (!box.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('pointerdown', out)
    return () => document.removeEventListener('pointerdown', out)
  }, [open])
  // A new search looks at the tab you are on; an applied one keeps the scope it was made in.
  const scope = text.trim() && text.trim() === f.q ? f.scope || 'all' : searchScope()
  // Suggestions always cover all three; the tab you are on comes first.
  const hits = useMemo(() => quickFind(st, text, 'all'), [st.signals, st.db, st.revealed, text]) // eslint-disable-line react-hooks/exhaustive-deps
  const groups = {
    companies: hits.companies.map((c) => ({ k: 'c' + c.id, kind: 'company', c, go: () => go(companyHref(c).slice(1)) })),
    people: hits.people.map((p) => ({ k: 'p' + p.id, kind: 'person', p, go: () => { const c = companyByName(p.brand, st); if (c) go(companyHref(c).slice(1)) } })),
    signals: hits.signals.map((g) => ({ k: 'g' + g.id, kind: 'signal', g, go: () => { const c = companyByName(g.brand, st); if (c) go(companyHref(c).slice(1)) } })),
  }
  const order = scope === 'people' ? ['people', 'companies', 'signals'] : scope === 'signals' ? ['signals', 'companies', 'people'] : ['companies', 'people', 'signals']
  const rows = order.flatMap((k) => groups[k])
  const apply = () => { setF({ ...f, q: text.trim(), scope: searchScope() }); setOpen(false) }
  const exact = hits.companies.some((c) => c.name.toLowerCase() === text.trim().toLowerCase())
  const canFetch = text.trim().length > 2 && !exact && (scope === 'all' || scope === 'companies')
  const key = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setHi((i) => Math.min(rows.length, i + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHi((i) => Math.max(0, i - 1)) }
    else if (e.key === 'Enter') { e.preventDefault(); if (open && hi > 0 && rows[hi - 1]) { rows[hi - 1].go(); setOpen(false) } else apply() }
    else if (e.key === 'Escape') { if (open) { e.stopPropagation(); setOpen(false) } else if (text) { setText(''); setF({ ...f, q: '' }) } }
  }
  return (
    <div className={'bdv-sb' + (stacked ? ' stacked' : '')}>
      <div className="bdv-sb-w" ref={box}>
      <div className="inp bdv-sb-in">
        <Search size={14} className="mute" />
        <input value={text} onChange={(e) => { setText(e.target.value); setOpen(true); setHi(0) }} onFocus={() => text && setOpen(true)} onKeyDown={key}
          placeholder={SCOPE_PH[scope]} aria-label={'Search ' + (scope === 'all' ? 'everything' : scope)} aria-expanded={open} role="combobox" />
        {(text || f.q) && <button className="bdv-sb-x" aria-label="Clear search" onClick={() => { setText(''); setF({ ...f, q: '' }) }}><X size={13} /></button>}
      </div>
      {open && text.trim() && (
        <div className="bdv-sb-pop" role="listbox">
          <button className={'bdv-sb-r all' + (hi === 0 ? ' hi' : '')} onMouseEnter={() => setHi(0)} onClick={apply}>
            <Search size={14} className="mute" /><span className="grow ell">Search {scope === 'all' ? 'everything' : SCOPES.find((x) => x[0] === scope)[1].toLowerCase()} for <b>“{text.trim()}”</b></span><CornerDownLeft size={13} className="mute" />
          </button>
          {rows.map((r, i) => (
            <span key={r.k}>
              {r.kind !== rows[i - 1]?.kind && <div className="pop-h">{{ company: 'Companies', person: 'People', signal: 'Signals' }[r.kind]}</div>}
              <button className={'bdv-sb-r' + (hi === i + 1 ? ' hi' : '')} onMouseEnter={() => setHi(i + 1)} onClick={() => { r.go(); setOpen(false) }}>
                {r.kind === 'company' && <><BrandLogo name={r.c.name} size={20} /><span className="grow ell"><b>{r.c.name}</b> <span className="mute">{[r.c.funding, r.c.cat, r.c.hq].filter(Boolean).join(' · ')}</span></span>{!inDb(r.c, st) && <span className="chip">Apollo</span>}</>}
                {r.kind === 'person' && <><Avatar user={{ name: r.p.name, hue: r.p.name.length * 41 }} size={20} /><span className="grow ell"><b>{r.p.name}</b> <span className="mute">{r.p.title} · {r.p.brand}</span></span>{isKnown(r.p, st) ? <span className="mute xs">On file</span> : <Lock size={12} className="mute" />}</>}
                {r.kind === 'signal' && <><Radar size={14} className="mute" /><span className="grow ell">{r.g.title} <span className="mute">· {r.g.brand}</span></span><span className="mute xs">{fmt.agoShort(r.g.at)}</span></>}
              </button>
            </span>
          ))}
          {!rows.length && <div className="mute xs" style={{ padding: '6px 10px 8px' }}>Nothing in our DB</div>}
          {canFetch && (
            <button className="bdv-sb-r" onClick={() => { const c = fetchName(st, text.trim()); if (c) { setOpen(false); go(companyHref(c).slice(1)) } }}>
              <KeyRound size={14} className="mute" /><span className="grow ell">Find <b>{text.trim()}</b> on Apollo</span><span className="mute xs">1 credit</span>
            </button>
          )}
        </div>
      )}
      </div>
    </div>
  )
}

/** Two rows. Top: scoped search, saved views, Clear, credits and the panel switch. Below: the main filters, grouped by what
    they narrow (Company | Signals | People), then More. The chip row never wraps; it scrolls sideways if it must. */
export function FilterBar({ children, inline = true }) {
  const { f, setF, st } = useProspect()
  const narrow = useNarrow()
  const [sheet, setSheet] = useState(false)
  const n = activeCount(f)
  const more = FILTERS.filter((x) => !INLINE.includes(x.id)).filter((x) => isOn(f[x.id])).length
  const groups = GROUPS.map((g) => INLINE.filter((id) => filterById[id].group === g.id)).filter((l) => l.length)
  return (
    <div className="bdv-fbar">
      <div className="bdv-fbar-1">
        <SearchBox />
        {(!inline || narrow) && <button className={'b sm' + (n ? ' on' : '')} onClick={() => setSheet(true)}><SlidersHorizontal size={13} />Filters{n > 0 && <span className="num">{n}</span>}</button>}
        <ViewsMenu />
        {n > 0 && <button className="b sm ghost" onClick={() => setF(F_EMPTY)}>Clear{!narrow && <span className="mute num">{n}</span>}</button>}
        <span className="grow" />
        <span className="m-hide"><Tip label="Apollo credits left"><span className="bdv-credit"><KeyRound size={12} /><span className="num">{st.credits}</span></span></Tip></span>
        {!narrow && <Tip label="Filters in a side panel"><button className="b ghost icon sm" onClick={() => setFilterMode('panel')} aria-label="Filters in a side panel"><PanelLeft size={15} /></button></Tip>}
        {children}
      </div>
      {inline && !narrow && (
        <div className="bdv-fbar-2" role="group" aria-label="Filters">
          {groups.map((ids, i) => (
            <span key={i} className="bdv-fgrp">
              {i > 0 && <i className="bdv-gsep" aria-hidden />}
              {ids.map((id) => <FilterChip key={id} def={filterById[id]} f={f} setF={setF} />)}
            </span>
          ))}
          <i className="bdv-gsep" aria-hidden />
          <button className={'bdv-fc bdv-fc-b' + (more ? ' on' : '')} onClick={() => setSheet(true)}><SlidersHorizontal size={12} />More{more > 0 && <b className="num">{more}</b>}</button>
        </div>
      )}
      <FilterSheet open={sheet} onClose={() => setSheet(false)} />
    </div>
  )
}

/** Switch where filters live; Shell stores it in Settings › Preferences › BD filters. */
export const setFilterMode = (mode) => window.dispatchEvent(new CustomEvent('bd:filters', { detail: { mode } }))

/* ───────── Side panel ─────────
   Search, saved views, then every filter grouped by what it narrows, each option with a live count. */
/** One filter in the panel, drawn for its kind of data:
    one-of (Within, Contact, Owner) → a segmented switch with Any;
    a handful of options → chips with counts, always visible;
    long lists (companies, industries, cities) → search + checkboxes, folded, showing what's picked when folded. */
function Facet({ def, f, setF, counts, st }) {
  const v = f[def.id] ?? (def.single ? '' : [])
  const act = isOn(v)
  const opts = optsOf(def, st)
  const c = counts?.[def.id]
  const name = def.pl || def.label
  const clear = () => setF({ ...f, [def.id]: def.single ? '' : [] })
  const head = (
    <div className="bdv-fq-h">
      <span className="grow">{name}</span>
      {act && <button className="bdv-fq-x" onClick={clear} aria-label={'Clear ' + name}>Clear</button>}
    </div>
  )
  if (def.single && def.seg) {
    return (
      <div className="bdv-fq">
        {head}
        <Seg id={'fq-' + def.id} value={v || ''} onChange={(k) => setF({ ...f, [def.id]: k })} options={[{ value: '', label: 'Any' }, ...opts.map(([k]) => ({ value: k, label: def.seg[k] || k }))]} />
      </div>
    )
  }
  if (!def.search && opts.length <= 8) {
    return (
      <div className="bdv-fq">
        {head}
        <div className="bdv-fq-c">
          {opts.map(([k, l]) => {
            const sel = !!isSel(def, v, k)
            const n = c ? c[k] || 0 : null
            return (
              <button key={k} title={def.id === 'fit' ? l : undefined} className={'bdv-fqc' + (sel ? ' on' : '') + (n === 0 && !sel ? ' zero' : '')} aria-pressed={sel} onClick={() => setF(togOf(def, f, k))}>
                {def.id === 'fit' ? <span className="bdv-fqc-m">{SERVICES[k]?.short || k.toUpperCase()}</span> : null}
                {def.id === 'fit' ? null : l}
                {n != null && <span className="num bdv-fqc-n">{n}</span>}
              </button>
            )
          })}
        </div>
      </div>
    )
  }
  return <FacetList def={def} f={f} setF={setF} c={c} opts={opts} v={v} act={act} name={name} clear={clear} />
}
function FacetList({ def, f, setF, c, opts, v, act, name, clear }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [all, setAll] = useState(false)
  let list = q ? opts.filter((o) => o[1].toLowerCase().includes(q.toLowerCase())) : opts
  if (c && !q) list = [...list].sort((a, b) => (isSel(def, v, b[0]) - isSel(def, v, a[0])) || ((c[b[0]] || 0) - (c[a[0]] || 0)))
  const long = list.length > 6 && !all && !q
  const shown = long ? list.slice(0, 6) : list.slice(0, 80)
  const lab = (k) => opts.find((o) => o[0] === k)?.[1] || k
  const picked = Array.isArray(v) ? v.map(lab) : v ? [lab(v)] : []
  return (
    <div className={'bdv-fq bdv-fql' + (open ? ' open' : '')}>
      <button className="bdv-fql-h" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="bdv-fql-n">{name}</span>
        <span className={'grow ell bdv-fql-v' + (picked.length ? ' set' : '')}>{picked.length ? picked.join(', ') : 'Any'}</span>
        <ChevronDown size={13} className="mute bdv-fx-i" />
      </button>
      {open && (
        <div className="bdv-fx-b">
          <div className="inp bdv-fsrch"><Search size={13} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={'Find ' + name.toLowerCase()} aria-label={'Find ' + name} /></div>
          {shown.map(([k, l]) => {
            const sel = isSel(def, v, k)
            const n = c ? c[k] || 0 : null
            return (
              <button key={k} className={'bdv-fo' + (sel ? ' on' : '') + (n === 0 && !sel ? ' zero' : '')} role="checkbox" aria-checked={!!sel} onClick={() => setF(togOf(def, f, k))}>
                <span className="bdv-ck">{sel ? <Check size={10} strokeWidth={3} /> : null}</span>
                {def.id === 'co' && <BrandLogo name={l} size={16} />}
                <span className="grow ell">{l}</span>
                {n != null && <span className="num bdv-fo-n">{n}</span>}
              </button>
            )
          })}
          {long && <button className="bdv-more" onClick={() => setAll(true)}>Show all {list.length}</button>}
          {!list.length && <div className="mute xs" style={{ padding: '4px 0' }}>No match</div>}
          {act && <button className="bdv-fq-x" style={{ alignSelf: 'flex-start', marginTop: 4 }} onClick={clear}>Clear {name.toLowerCase()}</button>}
        </div>
      )}
    </div>
  )
}
const isSel = (def, v, k) => (def.single ? v === k : v.includes(k)) ? 1 : 0

export function FilterBody({ sheet, onDone }) {
  const { st, f, setF, res } = useProspect()
  const counts = useMemo(() => facetCounts(st, f), [st.signals, st.inbound, st.accounts, st.db, st.revealed, f]) // eslint-disable-line react-hooks/exhaustive-deps
  const [shut, setShut] = useState({})
  const n = activeCount(f)
  const cur = st.views.find((v) => same(v.f, f))
  return (
    <div className={'bdv-fb' + (sheet ? ' in-sheet' : '')}>
      <div className="bdv-fb-h">
        <b className="grow">Filters{n > 0 && <span className="num mute"> {n}</span>}</b>
        {n > 0 && <button className="b sm ghost" onClick={() => setF(F_EMPTY)}>Clear all</button>}
        {!sheet && <Tip label="Filters as a bar"><button className="b ghost icon sm" onClick={() => setFilterMode('bar')} aria-label="Filters as a bar"><PanelLeftClose size={15} /></button></Tip>}
      </div>
      {!sheet && <SearchBox stacked />}
      <div className="bdv-fb-sec">
        <div className="bdv-fb-gh"><span className="grow">Saved views</span><ViewsMenu icon /></div>
        <div className="bdv-fb-views">
          {st.views.map((v) => (
            <button key={v.id} className={'bdv-fv' + (cur?.id === v.id ? ' on' : '')} onClick={() => setF(cur?.id === v.id ? F_EMPTY : v.f)}>
              {cur?.id === v.id ? <Check size={13} /> : <Bookmark size={13} className="mute" />}<span className="grow ell">{v.label}</span>{v.auto && <Tip label="Applies when BD opens"><Sparkle size={11} className="mute" /></Tip>}
            </button>
          ))}
        </div>
      </div>
      {GROUPS.map((g) => {
        const defs = FILTERS.filter((d) => d.group === g.id)
        const on = defs.filter((d) => isOn(f[d.id])).length
        return (
          <div key={g.id} className="bdv-fb-sec">
            <div className="bdv-fb-gh">
              <button className="bdv-fb-gt" onClick={() => setShut((x) => ({ ...x, [g.id]: !x[g.id] }))} aria-expanded={!shut[g.id]}>
                {g.label}{on > 0 && <span className="bdv-fb-gn num">{on}</span>}
              </button>
              <Tip label={g.hint}><span className="bdv-fb-gi" aria-label={g.hint}><Info size={12} /></span></Tip>
              <span className="grow" />
              {on > 0 && <button className="bdv-fq-x" onClick={() => setF({ ...f, ...Object.fromEntries(defs.map((d) => [d.id, d.single ? '' : []])) })}>Clear</button>}
              <button className="bdv-fb-gc" onClick={() => setShut((x) => ({ ...x, [g.id]: !x[g.id] }))} aria-label={(shut[g.id] ? 'Show ' : 'Hide ') + g.label}><ChevronDown size={13} className="mute" style={{ transform: shut[g.id] ? 'rotate(-90deg)' : '' }} /></button>
            </div>
            {!shut[g.id] && <div className="bdv-fb-gb">{defs.map((d) => <Facet key={d.id} def={d} f={f} setF={setF} counts={counts} st={st} />)}</div>}
          </div>
        )
      })}
      <div className="bdv-fb-f">
        <span className="grow mute xs num">{res.signals.length} signals · {res.companies.length} companies · {res.people.length} people</span>
        {sheet && <button className="b ink" onClick={onDone}><Check size={14} />Show</button>}
      </div>
    </div>
  )
}

/** Filters around a layout: the side panel on desktop when chosen, otherwise the bar (or the sheet on phones). */
export function FilterFrame({ children, className = '' }) {
  const narrow = useNarrow()
  const [menu, setMenu] = useState(null) // { x, y } of a right-click on the panel
  const panel = bdFilters() === 'panel' && !narrow
  if (!panel) return children
  const right = bdFilterSide() === 'right'
  return (
    <div className={'bdv-wp ' + className + (right ? ' right' : '')}>
      <aside className="bdv-fp" aria-label="Filters" onContextMenu={(e) => { if (e.target.closest('input, textarea')) return; e.preventDefault(); setMenu({ x: e.clientX, y: e.clientY }) }}><FilterBody /></aside>
      <div className="bdv-wp-m">{children}</div>
      {menu && <PanelMenu at={menu} right={right} onClose={() => setMenu(null)} />}
    </div>
  )
}
/** Right-click on the filter panel: dock it left or right, or go back to the bar. */
function PanelMenu({ at, right, onClose }) {
  const box = useRef(null)
  useEffect(() => {
    const out = (e) => { if (!box.current?.contains(e.target)) onClose() }
    const key = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('pointerdown', out, true); window.addEventListener('keydown', key); window.addEventListener('blur', onClose); window.addEventListener('resize', onClose)
    box.current?.querySelector('button')?.focus({ preventScroll: true })
    return () => { window.removeEventListener('pointerdown', out, true); window.removeEventListener('keydown', key); window.removeEventListener('blur', onClose); window.removeEventListener('resize', onClose) }
  }, [onClose])
  const pick = (detail) => { window.dispatchEvent(new CustomEvent('bd:filters', { detail })); onClose() }
  const x = Math.min(at.x, window.innerWidth - 220), y = Math.min(at.y, window.innerHeight - 150)
  return createPortal(
    <div ref={box} className="pop bdv-ctx" role="menu" aria-label="Filter panel" style={{ left: x, top: y }}>
      <div className="pop-h">Filter panel</div>
      <button role="menuitemradio" aria-checked={!right} onClick={() => pick({ side: 'left' })}><PanelLeft size={14} />Dock on left{!right && <Check size={14} style={{ marginLeft: 'auto' }} />}</button>
      <button role="menuitemradio" aria-checked={right} onClick={() => pick({ side: 'right' })}><PanelRight size={14} />Dock on right{right && <Check size={14} style={{ marginLeft: 'auto' }} />}</button>
      <div className="pop-sep" />
      <button role="menuitem" onClick={() => pick({ mode: 'bar' })}><PanelLeftClose size={14} />Show as a bar</button>
    </div>,
    document.body,
  )
}
/** The top of a layout: the filter bar, or (with the side panel) just the active filters as removable chips. */
export function FilterTop({ children }) {
  const narrow = useNarrow()
  if (bdFilters() !== 'panel' || narrow) return <FilterBar>{children}</FilterBar>
  return <ActiveChips>{children}</ActiveChips>
}
function ActiveChips({ children }) {
  const { st, f, setF } = useProspect()
  const chips = []
  if (f.q) chips.push({ k: 'q', l: (f.scope && f.scope !== 'all' ? SCOPES.find((x) => x[0] === f.scope)[1] + ': ' : '') + '“' + f.q + '”', x: () => setF({ ...f, q: '' }) })
  for (const def of FILTERS) {
    const v = f[def.id]
    if (!isOn(v)) continue
    const opts = optsOf(def, st)
    const lab = (k) => opts.find((o) => o[0] === k)?.[1] || k
    for (const k of Array.isArray(v) ? v : [v]) chips.push({ k: def.id + k, l: def.label + ': ' + lab(k), x: () => setF(togOf(def, f, k)) })
  }
  return (
    <div className="bdv-act">
      {chips.map((c) => <span key={c.k} className="bdv-fc on"><span className="bdv-fc-b">{c.l}</span><button className="bdv-fc-x" aria-label={'Remove ' + c.l} onClick={c.x}><X size={11} /></button></span>)}
      {!chips.length && <span className="mute xs">No filters · showing everything</span>}
      {chips.length > 1 && <button className="b sm ghost" onClick={() => setF(F_EMPTY)}>Clear</button>}
      <span className="grow" />
      <span className="m-hide"><Tip label="Apollo credits left"><span className="bdv-credit"><KeyRound size={12} /><span className="num">{st.credits}</span></span></Tip></span>
      {children}
    </div>
  )
}

/** Every filter, grouped and counted. Bottom sheet on phones, side sheet on desktop. */
export function FilterSheet({ open, onClose }) {
  const narrow = useNarrow()
  const body = <FilterBody sheet onDone={onClose} />
  return narrow ? <BottomSheet open={open} onClose={onClose} tall>{body}</BottomSheet> : <Sheet open={open} onClose={onClose} width={400}>{body}</Sheet>
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
  const narrow = useNarrow()
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
      {(bdFilters() !== 'panel' || narrow) && <button className={'b sm' + (n ? ' on' : '')} onClick={() => setSheet(true)} aria-label="Filters"><SlidersHorizontal size={13} /><span className="m-hide">Filters</span>{n > 0 && <span className="num">{n}</span>}</button>}
      {(bdFilters() !== 'panel' || narrow) && <ViewsMenu icon />}
      {!narrow && bdFilters() !== 'panel' && <Tip label="Filters in a side panel"><button className="b ghost icon sm" onClick={() => setFilterMode('panel')} aria-label="Filters in a side panel"><PanelLeft size={15} /></button></Tip>}
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

/** A moment: click to open the brands that fit, hottest first, each one a step from the pipeline. */
export function MomentRow({ m }) {
  const { st } = useProspect()
  const [open, setOpen] = useState(false)
  const [all, setAll] = useState(false)
  const d = m.at
  const days = Math.round((d - TODAY) / 864e5)
  const brief = new Date(d.getTime() - 14 * 864e5)
  const late = days < 14
  const list = all ? m.brands : m.brands.slice(0, 8)
  return (
    <div className={'bdv-mo-w' + (open ? ' open' : '')}>
      <button className="li bdv-mo" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="bdv-date"><b className="num">{d.getDate()}</b><span>{fmt.date(d).split(' ')[1]}</span></span>
        <span className="grow bdv-co-m">
          <span className="row" style={{ gap: 6 }}><span className="li-t ell">{m.name}</span><span className="chip">{m.region}</span><span className="mute xs">{fmtDays(d)}</span></span>
          <span className="li-s ell">{[...new Set(m.cats)].slice(0, 4).join(' · ')}</span>
        </span>
        <span className="bdv-logos">
          {m.brands.slice(0, 5).map((c) => <BrandLogo key={c.id} name={c.name} size={22} />)}
          {m.brands.length > 5 && <span className="mute xs num">+{m.brands.length - 5}</span>}
        </span>
        <ChevronDown size={15} className="mute bdv-mo-i" />
      </button>
      {open && (
        <div className="bdv-mo-b">
          <div className="bdv-mo-note">
            <CalendarDays size={14} className="mute" />
            <span className="grow">{late ? <>Brief this week: creators need about two weeks, and {m.name} is {fmtDays(d).toLowerCase()}.</> : <>Pitch by <b>{fmt.date(brief)}</b> so creators have two weeks before {m.name}.</>}</span>
            <Src s="AI" />
          </div>
          <div className="bdv-mo-h"><span className="grow">{m.brands.length} {m.brands.length === 1 ? 'brand fits' : 'brands fit'}</span><span className="mute xs">Hottest first</span></div>
          <div className="list">
            {list.map((c) => (
              <div key={c.id} className="li bdv-mo-r">
                <a className="row grow" href={companyHref(c)} style={{ gap: 10, minWidth: 0, color: 'inherit', textDecoration: 'none' }}>
                  <BrandLogo name={c.name} size={24} />
                  <span className="grow bdv-co-m"><span className="li-t ell">{c.name}</span><CoMeta c={c} short /></span>
                </a>
                <Tip label="Heat: recent signals × relevance"><span className="mute xs num bdv-mo-heat"><Flame size={12} />{heat(c, st)}</span></Tip>
                <AddBtn c={c} />
              </div>
            ))}
          </div>
          {m.brands.length > 8 && !all && <button className="bdv-more" style={{ marginLeft: 0 }} onClick={() => setAll(true)}>Show all {m.brands.length}</button>}
        </div>
      )}
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
const coCtx = (c) => ({ links: [{ kind: 'brand', id: c.id, label: c.name, brand: c.name }], keys: new Set(['brand:' + c.id]), brand: c.name, label: c.name })
export { coCtx }
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
      <TodoBlock ctx={coCtx(c)} />
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
