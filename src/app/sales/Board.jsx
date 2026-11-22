// Pipeline board: stage columns with pointer drag (mouse, pen and touch), a drop slot that shows where the card lands,
// manual order inside a column, keyboard moves (Alt+← / Alt+→), and a slim Closed lost lane.
// Performance: no per-card layout animation. Cards that shift get one cheap FLIP (Web Animations) per change.
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowRight, Check, Hourglass, Plus, ChevronRight, CalendarClock, GripVertical } from 'lucide-react'
import { toast } from 'sonner'
import { fmt, me, TODAY } from '../data'
import { Tip, ALT } from '../../shared/motion'
import { Avatar } from '../../shared/ui'
import { BrandLogo } from '../../shared/brands'
import { Svc, go } from '../ui'
import { DEAL_STAGES, LOST_REASONS, repOf } from './data'
import { isStale, staleDays, stageLabel } from './state'
import { openAddLead } from './ui'

const OPEN_STAGES = DEAL_STAGES.filter((s) => s.id !== 'lost')
const ORDER = DEAL_STAGES.map((s) => s.id)
const reduced = () => document.documentElement.dataset.motion === 'reduced' || (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false)
const DAY = 864e5

/** Manual order: the saved rank, else the deal's place in the list (new deals sit on top). */
export const rankOf = (d, i) => (typeof d.rank === 'number' ? d.rank : i)
export const SORTS = {
  manual: null,
  value: (a, b) => b.value - a.value,
  due: (a, b) => (a.due ? +a.due : Infinity) - (b.due ? +b.due : Infinity),
  updated: (a, b) => b.updated - a.updated,
}

export function Board({ st, deals, sort = 'manual' }) {
  const boardRef = useRef(null)
  const drag = useRef(null)
  const snapRef = useRef(() => {}) // records card positions just before a move (FLIP)
  const [hover, setHover] = useState(null) // { id, col, index, h }
  const hoverRef = useRef(hover); hoverRef.current = hover
  const [landing, setLanding] = useState(null)
  const [lostOpen, setLostOpen] = useState(() => { try { return localStorage.getItem('wldd-pipe-lost') === '1' } catch { return false } })
  const [ask, setAsk] = useState(null) // deal id waiting for a lost reason
  const toggleLost = () => setLostOpen((v) => { try { localStorage.setItem('wldd-pipe-lost', v ? '0' : '1') } catch {} return !v })

  // Columns: index in the full list gives the default rank, so the store order still matters.
  const cols = useMemo(() => {
    const idx = new Map(st.deals.map((d, i) => [d.id, i]))
    const by = Object.fromEntries(ORDER.map((k) => [k, []]))
    for (const d of deals) by[d.stage]?.push(d)
    const cmp = SORTS[sort] || ((a, b) => rankOf(a, idx.get(a.id)) - rankOf(b, idx.get(b.id)))
    for (const k of ORDER) by[k].sort(cmp)
    return by
  }, [deals, st.deals, sort])

  /* ───── commit a move ───── */
  const commit = useCallback((id, col, index) => {
    const d = st.deals.find((x) => x.id === id)
    if (!d) return
    const list = cols[col].filter((x) => x.id !== id)
    const idx = new Map(st.deals.map((x, i) => [x.id, i]))
    const r = (x) => rankOf(x, idx.get(x.id))
    const prev = list[index - 1], next = list[index]
    const rank = sort !== 'manual' ? d.rank : prev && next ? (r(prev) + r(next)) / 2 : prev ? r(prev) + 1 : next ? r(next) - 1 : 0
    if (d.stage !== col) {
      st.moveDeal(id, col)
      if (col === 'lost') setAsk(id)
      else if (col === 'won') toast.success(d.brand + ' won', { description: 'Hand it to a delivery pod', action: { label: 'Hand off', onClick: () => go('/bd/pipeline/' + id + '/handoff') } })
      else toast(d.brand + ' → ' + stageLabel(col), { action: { label: 'Undo', onClick: () => st.moveDeal(id, d.stage, 'Moved back to ' + stageLabel(d.stage)) } })
    }
    if (rank !== d.rank) st.patchDeal(id, { rank }, true)
  }, [st, cols, sort])

  /* ───── keyboard: Alt+←/→ moves a focused card one stage ───── */
  const keyMove = useCallback((d, dir) => {
    const i = ORDER.indexOf(d.stage)
    const to = ORDER[Math.max(0, Math.min(ORDER.length - 1, i + dir))]
    if (to === d.stage) return
    snapRef.current()
    commit(d.id, to, 0)
    requestAnimationFrame(() => boardRef.current?.querySelector(`[data-card="${d.id}"]`)?.focus())
  }, [commit])

  /* ───── pointer drag ───── */
  const onPointerDown = useCallback((e, d) => {
    if (e.button !== 0 || e.target.closest('a,button,input')) return
    const card = e.currentTarget
    const touch = e.pointerType !== 'mouse'
    // Touch drags from the grip (touch-action: none) so the rest of the card still scrolls and taps.
    if (touch && !e.target.closest('[data-grip]')) return
    if (touch) e.preventDefault()
    drag.current = { id: d.id, d, card, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, started: false, touch, timer: 0 }
    const move = (ev) => {
      const g = drag.current; if (!g) return
      g.x = ev.clientX; g.y = ev.clientY
      const far = Math.hypot(g.x - g.x0, g.y - g.y0)
      if (!g.started) {
        if (far > (g.touch ? 2 : 4)) start()
        return
      }
      place()
    }
    const blockScroll = (ev) => { if (drag.current?.started) ev.preventDefault() }
    const up = () => { const g = drag.current; cleanup(); if (g?.started) { drop(g); setTimeout(() => { if (drag.current === g) drag.current = null }, 0) } }
    const esc = (ev) => { if (ev.key === 'Escape' && drag.current?.started) { const g = drag.current; cleanup(); g.ghost?.remove(); setHover(null) } }
    function cleanup() {
      const g = drag.current
      clearTimeout(g?.timer); cancelAnimationFrame(g?.raf || 0)
      document.removeEventListener('pointermove', move)
      document.removeEventListener('pointerup', up)
      document.removeEventListener('pointercancel', up)
      document.removeEventListener('touchmove', blockScroll)
      document.removeEventListener('keydown', esc, true)
      document.documentElement.classList.remove('sl-dragging')
      if (g?.started) g.suppressClick = true
      drag.current = g?.started ? g : null
    }
    function start() {
      const g = drag.current; if (!g || g.started) return
      g.started = true
      const r = g.card.getBoundingClientRect()
      g.ox = g.x - r.left; g.oy = g.y - r.top; g.w = r.width; g.h = r.height
      const ghost = g.card.cloneNode(true)
      ghost.removeAttribute('data-card'); ghost.classList.add('sl-ghost')
      Object.assign(ghost.style, { width: r.width + 'px', height: r.height + 'px', left: '0px', top: '0px', transform: `translate3d(${r.left}px,${r.top}px,0)` })
      document.body.appendChild(ghost)
      g.ghost = ghost
      if (!reduced()) ghost.animate([{ transform: `translate3d(${r.left}px,${r.top}px,0)` }, { transform: `translate3d(${r.left}px,${r.top}px,0) rotate(1.5deg) scale(1.02)` }], { duration: 140, easing: 'cubic-bezier(.23,1,.32,1)', fill: 'forwards' }).finished.then((a) => a?.commitStyles?.()).catch(() => {})
      document.documentElement.classList.add('sl-dragging')
      if (g.touch) navigator.vibrate?.(8)
      const col = g.d.stage, index = cols[col].findIndex((x) => x.id === g.id)
      snapRef.current()
      setHover({ id: g.id, col, index, h: r.height })
      tick()
    }
    function place() {
      const g = drag.current; if (!g?.ghost) return
      g.ghost.getAnimations().forEach((a) => a.cancel())
      g.ghost.style.transform = `translate3d(${g.x - g.ox}px,${g.y - g.oy}px,0) rotate(1.5deg) scale(1.02)`
      const colEls = boardRef.current ? [...boardRef.current.querySelectorAll('[data-col]')] : []
      let colEl = colEls.find((c) => { const r = c.getBoundingClientRect(); return g.x >= r.left && g.x <= r.right })
      if (!colEl) { // past the edges: nearest column
        colEl = colEls.reduce((best, c) => { const r = c.getBoundingClientRect(); const dist = Math.min(Math.abs(g.x - r.left), Math.abs(g.x - r.right)); return !best || dist < best.dist ? { c, dist } : best }, null)?.c
      }
      if (!colEl) return
      const col = colEl.dataset.col
      const cards = [...colEl.querySelectorAll('[data-card]')].filter((c) => c.dataset.card !== g.id)
      let index = cards.length
      for (let i = 0; i < cards.length; i++) { const r = cards[i].getBoundingClientRect(); if (g.y < r.top + r.height / 2) { index = i; break } }
      const h = hoverRef.current
      if (h && h.col === col && h.index === index) return
      snapRef.current()
      hoverRef.current = { id: g.id, col, index, h: g.h }
      setHover(hoverRef.current)
    }
    function tick() { // edge auto-scroll: the board sideways, the column body up and down
      const g = drag.current; if (!g?.started) return
      const b = boardRef.current
      if (b) {
        const r = b.getBoundingClientRect(), E = 56
        if (g.x < r.left + E) b.scrollLeft -= Math.ceil((r.left + E - g.x) / 4)
        else if (g.x > r.right - E) b.scrollLeft += Math.ceil((g.x - (r.right - E)) / 4)
        const body = document.elementFromPoint(g.x, g.y)?.closest?.('.sl-colb')
        if (body) { const br = body.getBoundingClientRect(); if (g.y < br.top + E) body.scrollTop -= Math.ceil((br.top + E - g.y) / 4); else if (g.y > br.bottom - E) body.scrollTop += Math.ceil((g.y - (br.bottom - E)) / 4) }
        place()
      }
      g.raf = requestAnimationFrame(tick)
    }
    document.addEventListener('pointermove', move)
    document.addEventListener('pointerup', up)
    document.addEventListener('pointercancel', up)
    document.addEventListener('touchmove', blockScroll, { passive: false })
    document.addEventListener('keydown', esc, true)
  }, [cols]) // eslint-disable-line react-hooks/exhaustive-deps

  // Drop: commit, then glide the ghost onto the card's new spot.
  const drop = (g) => {
    const h = hoverRef.current
    setHover(null)
    if (!h) { g.ghost?.remove(); return }
    snapRef.current()
    setLanding(g.id)
    commit(g.id, h.col, h.index)
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const el = boardRef.current?.querySelector(`[data-card="${g.id}"]`)
      const ghost = g.ghost
      const done = () => { ghost?.remove(); setLanding(null) }
      if (!el || !ghost || reduced()) return done()
      el.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
      const r = el.getBoundingClientRect()
      ghost.animate([{ transform: ghost.style.transform }, { transform: `translate3d(${r.left}px,${r.top}px,0)` }], { duration: 180, easing: 'cubic-bezier(.23,1,.32,1)', fill: 'forwards' }).finished.then(done, done)
    }))
  }
  // A click right after a drag is the drop, not "open".
  const onClick = useCallback((d) => {
    if (drag.current?.suppressClick) { drag.current = null; return }
    go('/bd/pipeline/' + d.id)
  }, [])

  /* ───── FLIP: cards that shift glide instead of jumping ─────
     Armed only around a drag step, a drop or a keyboard move, so ordinary renders never force a layout. */
  const flipFrom = useRef(null)
  const measure = () => {
    const b = boardRef.current; if (!b) return null
    // Board content space, so page, board and column scrolling never read as movement.
    const m = new Map(), br = b.getBoundingClientRect()
    b.querySelectorAll('.sl-colb').forEach((body) => {
      const cr = body.getBoundingClientRect()
      body.querySelectorAll('[data-card]').forEach((el) => { const r = el.getBoundingClientRect(); m.set(el.dataset.card, { left: r.left - br.left + b.scrollLeft, top: r.top - cr.top + body.scrollTop }) })
    })
    return m
  }
  snapRef.current = () => { if (!reduced()) flipFrom.current = measure() }
  useLayoutEffect(() => {
    const prev = flipFrom.current; if (!prev) return
    flipFrom.current = null
    const b = boardRef.current, next = measure()
    next?.forEach((r, k) => {
      const p = prev.get(k)
      if (!p || k === landing) return
      const dx = p.left - r.left, dy = p.top - r.top
      if ((dx || dy) && Math.abs(dx) < 600) b.querySelector(`[data-card="${k}"]`)?.animate([{ transform: `translate(${dx}px,${dy}px)` }, { transform: 'none' }], { duration: 170, easing: 'cubic-bezier(.23,1,.32,1)' })
    })
  })

  /* ───── Sideways navigation ─────
     Standard scrolling: the wheel goes up and down (a column, else the page); Shift+wheel or a sideways swipe goes across.
     Sideways input is applied to the board directly, so a column under the pointer can't swallow it. Empty space can be dragged. */
  useEffect(() => {
    const b = boardRef.current; if (!b) return
    const wheel = (e) => {
      if (e.ctrlKey) return
      const dx = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.shiftKey ? e.deltaY : 0
      if (!dx) return // vertical stays native
      e.preventDefault()
      b.scrollLeft += dx
    }
    let pan = null
    const down = (e) => {
      if (e.button !== 0 || e.pointerType !== 'mouse' || e.target.closest('[data-card],button,a,input')) return
      // The native scrollbar owns its own drag; panning there too would cancel it out.
      const r = b.getBoundingClientRect()
      if (e.clientY >= r.top + b.clientTop + b.clientHeight) return
      pan = { x: e.clientX, left: b.scrollLeft, moved: false }
    }
    const move = (e) => {
      if (!pan) return
      const dx = e.clientX - pan.x
      if (!pan.moved && Math.abs(dx) < 4) return
      pan.moved = true
      b.classList.add('panning')
      b.scrollLeft = pan.left - dx
    }
    const up = () => { pan = null; b.classList.remove('panning') }
    // The board fills the panel down to the bottom, so the page doesn't scroll on top of the columns.
    const fit = () => {
      const sc = b.closest('.d-scroll'); if (!sc || window.matchMedia('(max-width: 760px)').matches) { b.style.removeProperty('--colmax'); return }
      const top = b.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop
      const h = sc.clientHeight - top - 40 /* column header */ - 40 /* board padding, scrollbar, breathing room */
      b.style.setProperty('--colmax', Math.max(280, Math.floor(h)) + 'px')
    }
    fit()
    const ro = new ResizeObserver(fit); ro.observe(b); if (b.closest('.d-scroll')) ro.observe(b.closest('.d-scroll'))
    b.addEventListener('wheel', wheel, { passive: false })
    b.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => { ro.disconnect(); b.removeEventListener('wheel', wheel); b.removeEventListener('pointerdown', down); window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up) }
  }, [])
  const stageCols = lostOpen ? DEAL_STAGES : OPEN_STAGES
  return (
    <div className="sl-boardw">
      <div className={'sl-board2' + (lostOpen ? ' lost-open' : '')} ref={boardRef}>
        {stageCols.map((sg) => (
          <Column key={sg.id} sg={sg} list={cols[sg.id]} hover={hover} landing={landing} onPointerDown={onPointerDown} onClick={onClick} keyMove={keyMove}
            onCollapse={sg.id === 'lost' ? toggleLost : null} />
        ))}
        {!lostOpen && (
          <button className={'sl-lostlane' + (hover?.col === 'lost' ? ' over' : '')} data-col="lost" onClick={toggleLost} aria-label={'Show Closed lost, ' + cols.lost.length}>
            <span className="sl-lostlane-n num">{cols.lost.length}</span>
            <span className="sl-lostlane-t">Closed lost</span>
            {hover?.col === 'lost' && <span className="sl-lostlane-drop">Drop to close</span>}
          </button>
        )}
      </div>
      {ask && <LostReason d={st.deals.find((x) => x.id === ask)} onPick={(reason) => { st.patchDeal(ask, (x) => ({ lost: { ...x.lost, reason }, history: [...x.history, { at: new Date(), text: 'Lost reason · ' + reason, kind: 'lost', by: me.id }] }), true); setAsk(null) }} onClose={() => setAsk(null)} />}
    </div>
  )
}

function Column({ sg, list, hover, landing, onPointerDown, onClick, keyMove, onCollapse }) {
  const dragging = hover?.id
  const shown = dragging ? list.filter((d) => d.id !== dragging) : list
  const here = hover && hover.col === sg.id
  const total = list.reduce((t, d) => t + d.value, 0)
  const items = shown.map((d) => <Card key={d.id} d={d} hidden={landing === d.id} onPointerDown={onPointerDown} onClick={onClick} keyMove={keyMove} />)
  if (here) items.splice(Math.min(hover.index, items.length), 0, <div key="__slot" className="sl-slot" style={{ height: hover.h }} aria-hidden />)
  return (
    <section className={'sl-col s-' + sg.id + (here ? ' over' : '')} data-col={sg.id} aria-label={sg.label}>
      <header className="sl-colh">
        <i className="sl-cold" />
        <span className="sl-colt">{sg.label}</span>
        <span className="mute num">{list.length}</span>
        <span className="grow" />
        <span className="mute num xs">{fmt.inr(total)}</span>
        {sg.id === 'new' && <Tip label="Add lead"><button className="b ghost icon sm sl-coladd" onClick={() => openAddLead({ source: 'Own contacts' })} aria-label="Add lead"><Plus size={14} /></button></Tip>}
        {onCollapse && <Tip label="Hide"><button className="b ghost icon sm" onClick={onCollapse} aria-label="Hide Closed lost"><ChevronRight size={14} /></button></Tip>}
      </header>
      <div className="sl-colb">
        {items}
        {!items.length && <div className="sl-colempty">{sg.id === 'won' ? 'Drop a signed deal' : 'Nothing here'}</div>}
      </div>
    </section>
  )
}

const Card = memo(function Card({ d, hidden, onPointerDown, onClick, keyMove }) {
  const stale = isStale(d)
  const rep = repOf(d.owner)
  const due = d.due && d.stage !== 'won' && d.stage !== 'lost' ? Math.floor((+d.due - +startOfToday()) / DAY) : null
  return (
    <div className={'pcard sl-card2' + (stale ? ' stale' : '') + (hidden ? ' landing' : '')} data-card={d.id} data-ent={JSON.stringify({ kind: 'deal', id: d.id, label: d.brand + ' deal', brand: d.brand })} role="link" tabIndex={0}
      aria-label={`${d.brand}, ${fmt.inr(d.value)}, ${stageLabel(d.stage)}. ${ALT}Left or Right moves stage`}
      onPointerDown={(e) => onPointerDown(e, d)} onClick={() => onClick(d)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') go('/bd/pipeline/' + d.id)
        else if (e.altKey && e.key === 'ArrowRight') { e.preventDefault(); keyMove(d, 1) }
        else if (e.altKey && e.key === 'ArrowLeft') { e.preventDefault(); keyMove(d, -1) }
      }}>
      <div className="row sl-c-h">
        <BrandLogo name={d.brand} size={24} />
        <b className="grow ell">{d.brand}</b>
        <span className="num sl-c-v">{fmt.inr(d.value)}</span>
        <span className="sl-grip" data-grip aria-hidden><GripVertical size={14} /></span>
      </div>
      {d.contact?.name && <div className="sl-c-p ell">{d.contact.name}{d.contact.title ? <span className="mute"> · {d.contact.title}</span> : null}</div>}
      {d.stage === 'lost' ? <div className="sl-c-n mute ell">{d.lost?.reason || 'No reason yet'}</div>
        : d.stage === 'won' ? <div className="sl-c-n row"><Check size={12} className="mute" /><span className="ell">{d.won?.pod ? 'With ' + d.won.pod + ' pod' : 'Hand off to a pod'}</span></div>
        : (
          <div className="sl-c-n row">
            <ArrowRight size={12} className="mute" /><span className="ell grow">{d.next}</span>
            {due != null && <span className={'sl-cdue' + (due < 0 ? ' late' : due === 0 ? ' today' : '')}><CalendarClock size={11} />{due < 0 ? -due + 'd late' : due === 0 ? 'Today' : due === 1 ? 'Tmrw' : due + 'd'}</span>}
          </div>
        )}
      <div className="row sl-c-f">
        <Svc list={d.services.slice(0, 2)} />
        {stale && <Tip label={'No activity in ' + staleDays(d) + ' days'}><span className="chip y sl-stale"><Hourglass size={11} />{staleDays(d)}d</span></Tip>}
        <span className="grow" />
        <Tip label={d.owner === me.id ? 'You' : rep.name}><span><Avatar user={rep} size={18} /></span></Tip>
      </div>
    </div>
  )
})

let _sod = null
function startOfToday() { if (!_sod) { const t = new Date(TODAY); t.setHours(0, 0, 0, 0); _sod = t } return _sod } // the demo's fixed "today", same clock as fmt.ago

function LostReason({ d, onPick, onClose }) {
  useEffect(() => { const k = (e) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k) }, [onClose])
  if (!d) return null
  return createPortal(
    <div className="sl-lr-wrap" onClick={onClose}>
      <div className="sl-lr" role="dialog" aria-label={'Why was ' + d.brand + ' lost?'} onClick={(e) => e.stopPropagation()}>
        <div className="row" style={{ gap: 10 }}><BrandLogo name={d.brand} size={28} /><div className="grow"><b>Why was {d.brand} lost?</b><div className="mute xs">Recorded on the deal. You can revive it later.</div></div></div>
        <div className="sl-chips" style={{ marginTop: 14 }}>{LOST_REASONS.map((r, i) => <button key={r} className="chip sl-tog" autoFocus={i === 0} onClick={() => onPick(r)}>{r}</button>)}</div>
        <div className="row" style={{ marginTop: 14, justifyContent: 'flex-end' }}><button className="b sm ghost" onClick={onClose}>Later</button></div>
      </div>
    </div>,
    document.body,
  )
}
