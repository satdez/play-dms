// The to-do surfaces that float over any page: the Panel (with its widths and the detail), quick add, a detail sheet, and the right-click menu.
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ListChecks, X, ChevronDown, PanelRight, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useStore } from '../store'
import { EASE, DRAWER, Tip } from '../../shared/motion'
import { BrandLogo } from '../../shared/brands'
import { Popover } from '../ui'
import { Sheet } from '../pages/Finance'
import { BottomSheet, useNarrow } from '../sales/kit'
import { pageCtx, linkedTo, bucketOf, dueLabel, top } from './logic'
import { todoStyle, todoWidth, isDocked, TODO_WIDTHS, setTodoPref, openTodos, openTodo } from './state'
import { Composer, TodoRow, StyleMenu } from './ui'
import { TodoDetail } from './detail'
import { EntityMenu } from './ctx'

const byDue = (a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || (a.due ? +a.due : 9e15) - (b.due ? +b.due : 9e15) || (a.order ?? 0) - (b.order ?? 0)

function useVw() {
  const [w, setW] = useState(() => window.innerWidth)
  useEffect(() => { const on = () => setW(window.innerWidth); window.addEventListener('resize', on); return () => window.removeEventListener('resize', on) }, [])
  return w
}

export function TodoHost({ path }) {
  const s = useStore()
  const [panel, setPanel] = useState(null) // { links, who, n, open } — links null = this page's record; open = a to-do's id
  const [quick, setQuick] = useState(null) // { links, who }
  const [sheet, setSheet] = useState(null) // a to-do's id, when the style has no panel
  const ctx = useMemo(() => pageCtx(path, s), [path, s.sales.deals, s.campaigns]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const add = (e) => {
      const links = e.detail?.links?.length ? e.detail.links : null
      const who = e.detail?.who || null
      if (todoStyle() === 'panel') setPanel((p) => ({ links, who, n: (p?.n || 0) + 1, open: null }))
      else setQuick({ links, who })
    }
    const open = () => {
      if (todoStyle() === 'panel') setPanel((p) => (p ? null : { links: null, n: 0, open: null }))
      else location.hash = '#/todo'
    }
    const det = (e) => {
      const id = e.detail?.id
      // Clicking the open to-do again closes it (beside the list there's no back button).
      if (todoStyle() === 'panel') setPanel((p) => ({ links: null, n: 0, ...p, open: p?.open === id && window.innerWidth * +todoWidth() / 100 >= 620 ? null : id }))
      else setSheet(id)
    }
    window.addEventListener('todo:add', add); window.addEventListener('todo:open', open); window.addEventListener('todo:detail', det)
    return () => { window.removeEventListener('todo:add', add); window.removeEventListener('todo:open', open); window.removeEventListener('todo:detail', det) }
  }, [])
  const style = todoStyle()
  useEffect(() => { setPanel(null); setSheet(null) }, [style])
  return (
    <>
      <Panel open={!!panel && style === 'panel'} onClose={() => setPanel(null)} pre={panel?.links} who={panel?.who} focusKey={panel?.n} ctx={ctx}
        detail={panel?.open || null} setDetail={(id) => setPanel((p) => (p ? { ...p, open: id } : p))} />
      <QuickAdd open={!!quick} onClose={() => setQuick(null)} pre={quick?.links || ctx?.links || []} who={quick?.who} />
      <Sheet open={!!sheet} onClose={() => setSheet(null)} width={520}>{sheet && <TodoDetail id={sheet} />}</Sheet>
      <EntityMenu />
    </>
  )
}

/* ───────── Panel: 30 / 40 / 50 / 60% of the window ─────────
   30 and 40 float over the page (a peek; the scrim closes it). 50 and 60 dock: the page shrinks beside it and stays usable.
   Drag the inner edge to resize; it snaps to the nearest width on release. Double-click the edge steps to the next width.
   Phones: a full-screen sheet. */
const MIN = 360
function Panel({ open, onClose, pre, who, focusKey, ctx, detail, setDetail }) {
  const narrow = useNarrow()
  const vw = useVw()
  const wide = vw > 960
  const pref = todoWidth()
  const [drag, setDrag] = useState(null)
  const px = Math.min(vw, drag ?? Math.max(MIN, Math.round((vw * +pref) / 100)))
  const docked = wide && isDocked(pref)
  useEffect(() => {
    if (!open) return
    // Esc closes the open to-do first when it sits beside the list, then the panel.
    const k = (e) => { if (e.key === 'Escape' && !e.defaultPrevented && !e.target.closest?.('input, textarea')) { if (detail && wide && px >= 620) setDetail(null); else onClose() } }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [open, onClose, detail, wide, px, setDetail])
  // Docked: the app shell gives up the panel's width.
  useEffect(() => {
    const h = document.documentElement
    if (open && docked) { h.style.setProperty('--td-dock', px + 'px'); h.dataset.tdDock = '' }
    else delete h.dataset.tdDock
  }, [open, docked, px])
  useEffect(() => () => { delete document.documentElement.dataset.tdDock }, [])
  useEffect(() => { if (drag != null) document.documentElement.dataset.tdDrag = ''; else delete document.documentElement.dataset.tdDrag }, [drag])

  const snap = (w) => TODO_WIDTHS.reduce((b, x) => (Math.abs((vw * +x.value) / 100 - w) < Math.abs((vw * +b.value) / 100 - w) ? x : b)).value
  const step = (d) => { const i = TODO_WIDTHS.findIndex((x) => x.value === pref); setTodoPref('todoWidth', TODO_WIDTHS[(i + d + TODO_WIDTHS.length) % TODO_WIDTHS.length].value) }
  const dragRef = useRef(null)
  const rsz = {
    onPointerDown: (e) => { if (e.button > 0) return; e.currentTarget.setPointerCapture?.(e.pointerId); dragRef.current = { x0: e.clientX, w0: px }; setDrag(px); e.preventDefault() },
    onPointerMove: (e) => { const d = dragRef.current; if (d) setDrag(Math.max(MIN, Math.min(vw * 0.72, d.w0 + (d.x0 - e.clientX)))) },
    onPointerUp: () => { if (!dragRef.current) return; const w = drag; dragRef.current = null; setDrag(null); if (w != null) setTodoPref('todoWidth', snap(w)) },
    onPointerCancel: () => { dragRef.current = null; setDrag(null) },
    onDoubleClick: () => step(1),
    onKeyDown: (e) => { if (e.key === 'ArrowLeft') { e.preventDefault(); if (pref !== '60') step(1) } if (e.key === 'ArrowRight') { e.preventDefault(); if (pref !== '30') step(-1) } },
  }
  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {!docked && <motion.div key="scrim" className="td-scrim" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} />}
          <motion.aside key="panel" className={'td-panel' + (docked ? ' docked' : '') + (drag != null ? ' dragging' : '')} role="dialog" aria-label="To-do" style={narrow ? undefined : { width: px }}
            initial={narrow ? { y: '100%' } : { x: '100%' }} animate={narrow ? { y: 0 } : { x: 0 }}
            exit={{ ...(narrow ? { y: '100%' } : { x: '100%' }), transition: { duration: 0.2, ease: EASE } }} transition={{ duration: 0.32, ease: DRAWER }}>
            {wide && (
              <div className="td-rsz" role="separator" aria-orientation="vertical" aria-label="Resize the to-do panel" aria-valuenow={+pref} aria-valuemin={30} aria-valuemax={60} tabIndex={0} {...rsz}>
                {drag != null && <span className="td-rsz-v num">{snap(drag)}%</span>}
              </div>
            )}
            <PanelBody onClose={onClose} pre={pre} who={who} focusKey={focusKey} ctx={ctx} detail={detail} setDetail={setDetail} split={wide && px >= 620} narrow={narrow} wide={wide} />
          </motion.aside>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}

/** Width picker: four splits, each drawn as page | panel. */
function WidthMenu() {
  const cur = todoWidth()
  return (
    <Popover width={236} trigger={({ toggle, open }) => (
      <Tip label="Panel width"><button className={'b ghost sm td-wbtn' + (open ? ' on' : '')} onClick={toggle} aria-label="Panel width"><PanelRight size={14} /><span className="num">{cur}%</span></button></Tip>
    )}>
      {(close) => (
        <>
          <div className="pop-h">Width</div>
          {TODO_WIDTHS.map((x) => (
            <button key={x.value} className="td-wopt" onClick={() => { close(); setTodoPref('todoWidth', x.value) }}>
              <span className={'td-wpic' + (isDocked(x.value) ? ' dock' : '')} aria-hidden><i style={{ flex: 100 - x.value }} /><b style={{ flex: +x.value }} /></span>
              <span className="grow"><span className="num">{100 - x.value}/{x.value}</span><span className="mute xs td-wopt-d">{x.desc}</span></span>
              {cur === x.value && <Check size={14} />}
            </button>
          ))}
        </>
      )}
    </Popover>
  )
}

function PanelBody({ onClose, pre, who, focusKey, ctx, detail, setDetail, split, wide }) {
  const s = useStore()
  const [showDone, setShowDone] = useState(false)
  const items = s.todo.items.filter(top)
  const here = ctx ? items.filter((t) => !t.done && linkedTo(t, ctx)).sort(byDue) : []
  const rest = items.filter((t) => !here.includes(t))
  const today = rest.filter((t) => ['overdue', 'today'].includes(bucketOf(t))).sort(byDue)
  const later = rest.filter((t) => bucketOf(t) === 'upcoming').sort(byDue)
  const nodate = rest.filter((t) => bucketOf(t) === 'someday')
  const done = items.filter((t) => t.done).sort((a, b) => b.doneAt - a.doneAt)
  const showList = split || !detail
  const row = (t) => <TodoRow key={t.id} t={t} edit sel={t.id === detail} />
  return (
    <>
      <div className="td-panel-hd">
        <ListChecks size={16} className="mute" />
        <b className="grow">To-do</b>
        {wide && <WidthMenu />}
        <StyleMenu />
        <button className="b ghost icon sm" onClick={onClose} aria-label="Close"><X size={15} /></button>
      </div>
      <div className={'td-panel-main' + (split && detail ? ' split' : '')}>
        {showList && (
          <div className="td-panel-col">
            <div className="td-panel-b">
              {ctx && (
                <section className="td-psec td-here">
                  <div className="td-psec-h">{ctx.logo && <BrandLogo name={ctx.logo} size={16} radius={4} />}<span className="ell">This page · {ctx.label}</span><span className="mute num">{here.length}</span></div>
                  <div className="td-rows">{here.map(row)}</div>
                  {!here.length && <div className="td-none mute xs">None yet</div>}
                </section>
              )}
              <Sec title="Today" list={today} row={row} />
              <Sec title="Upcoming" list={later} row={row} />
              {nodate.length > 0 && <Sec title="No date" list={nodate} row={row} />}
              <section className="td-psec">
                <button className="td-psec-h td-fold" onClick={() => setShowDone((x) => !x)} aria-expanded={showDone}>
                  <span>Done</span><span className="mute num">{done.length}</span><ChevronDown size={14} className={'mute td-chev' + (showDone ? ' on' : '')} />
                </button>
                {showDone && <div className="td-rows">{done.slice(0, 12).map(row)}</div>}
              </section>
            </div>
            <div className="td-panel-f">
              <Composer key={focusKey} up pre={pre || ctx?.links || []} assign={who || null} autoFocus={!detail && (focusKey > 0 || !window.matchMedia('(pointer: coarse)').matches)} placeholder={ctx ? 'Add a to-do for ' + ctx.label : 'Add a to-do'} onEscape={onClose} />
            </div>
          </div>
        )}
        {detail && (
          <div className="td-panel-dt" key={split ? 'split' : detail}>
            <TodoDetail id={detail} onBack={split ? undefined : () => setDetail(null)} onClose={split ? () => setDetail(null) : undefined} />
          </div>
        )}
      </div>
    </>
  )
}

const Sec = ({ title, list, row }) => (
  <section className="td-psec">
    <div className="td-psec-h"><span className="ell">{title}</span><span className="mute num">{list.length}</span></div>
    <div className="td-rows">{list.map(row)}</div>
  </section>
)

/* ───────── Quick add: a small dialog on desktop, a bottom sheet on phones ───────── */
function QuickAdd({ open, onClose, pre, who }) {
  const narrow = useNarrow()
  useEffect(() => { if (open && narrow) toast.dismiss() }, [open, narrow]) // a toast would sit on the sheet's input
  const added = (t) => {
    onClose()
    toast('To-do added', { description: t.text + (t.due ? ' · ' + dueLabel(t.due) : ''), action: { label: 'Open', onClick: () => openTodo(t.id) } })
  }
  useEffect(() => {
    if (!open || narrow) return
    const k = (e) => { if (e.key === 'Escape' && !e.defaultPrevented) onClose() }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [open, narrow, onClose])
  const body = <div className="td-qa-b"><div className="td-qa-h"><ListChecks size={15} className="mute" /><b>New to-do</b></div><Composer pre={pre} assign={who || null} autoFocus onAdded={added} onEscape={onClose} placeholder="Send @Rare Rabbit the deck from mon to fri" /></div>
  if (narrow) return <BottomSheet open={open} onClose={onClose}>{body}</BottomSheet>
  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="td-scrim dim" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} />
          <motion.div className="td-qa" role="dialog" aria-label="New to-do" initial={{ opacity: 0, scale: 0.96, y: -6 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.12 } }} transition={{ duration: 0.2, ease: EASE }}>
            {body}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}
