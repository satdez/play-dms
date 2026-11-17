// The to-do surfaces that float over any page: the Panel (variation 2), quick add, and the All to-dos sheet (In context).
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ListChecks, X, ChevronDown, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useStore } from '../store'
import { EASE, DRAWER, Tip } from '../../shared/motion'
import { BrandLogo } from '../../shared/brands'
import { go } from '../ui'
import { Sheet } from '../pages/Finance'
import { BottomSheet, useNarrow } from '../sales/kit'
import { pageCtx, linkedTo, bucketOf, dueLabel, brandOfItem } from './logic'
import { todoStyle, openTodos, openTodoAdd } from './state'
import { Composer, TodoRow, StyleMenu } from './ui'

const byDue = (a, b) => (a.due ? +a.due : 9e15) - (b.due ? +b.due : 9e15) || (a.order ?? 0) - (b.order ?? 0)

export function TodoHost({ path }) {
  const s = useStore()
  const [panel, setPanel] = useState(null) // { links, n } — links null = this page's record
  const [quick, setQuick] = useState(null) // { links }
  const ctx = useMemo(() => pageCtx(path, s), [path, s.sales.deals, s.campaigns]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const add = (e) => {
      const links = e.detail?.links?.length ? e.detail.links : null
      if (todoStyle() === 'panel') setPanel((p) => ({ links, n: (p?.n || 0) + 1 }))
      else setQuick({ links })
    }
    const open = () => {
      const v = todoStyle()
      if (v === 'panel') setPanel((p) => (p ? null : { links: null, n: 0 }))
      else go('/todo')
    }
    window.addEventListener('todo:add', add); window.addEventListener('todo:open', open)
    return () => { window.removeEventListener('todo:add', add); window.removeEventListener('todo:open', open) }
  }, [])
  const style = todoStyle()
  useEffect(() => { setPanel(null) }, [style])
  return (
    <>
      <Panel open={!!panel && style === 'panel'} onClose={() => setPanel(null)} pre={panel?.links} focusKey={panel?.n} ctx={ctx} />
      <QuickAdd open={!!quick} onClose={() => setQuick(null)} pre={quick?.links || ctx?.links || []} />
    </>
  )
}

/* ───────── Panel: a right-hand panel on any page; full-screen sheet on phones ───────── */
function Panel({ open, onClose, pre, focusKey, ctx }) {
  const narrow = useNarrow()
  useEffect(() => {
    if (!open) return
    const k = (e) => { if (e.key === 'Escape' && !e.defaultPrevented) onClose() }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [open, onClose])
  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="td-scrim" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} />
          <motion.aside className="td-panel" role="dialog" aria-label="To-do"
            initial={narrow ? { y: '100%' } : { x: '100%' }} animate={narrow ? { y: 0 } : { x: 0 }}
            exit={{ ...(narrow ? { y: '100%' } : { x: '100%' }), transition: { duration: 0.2, ease: EASE } }} transition={{ duration: 0.32, ease: DRAWER }}>
            <PanelBody onClose={onClose} pre={pre} focusKey={focusKey} ctx={ctx} />
          </motion.aside>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}

function PanelBody({ onClose, pre, focusKey, ctx }) {
  const s = useStore()
  const [showDone, setShowDone] = useState(false)
  const items = s.todo.items
  const here = ctx ? items.filter((t) => !t.done && linkedTo(t, ctx)).sort(byDue) : []
  const rest = items.filter((t) => !here.includes(t))
  const today = rest.filter((t) => ['overdue', 'today'].includes(bucketOf(t))).sort(byDue)
  const later = rest.filter((t) => bucketOf(t) === 'upcoming').sort(byDue)
  const nodate = rest.filter((t) => bucketOf(t) === 'someday')
  const done = items.filter((t) => t.done).sort((a, b) => b.doneAt - a.doneAt)
  return (
    <>
      <div className="td-panel-hd">
        <ListChecks size={16} className="mute" />
        <b className="grow">To-do</b>
        <StyleMenu />
        <button className="b ghost icon sm" onClick={onClose} aria-label="Close"><X size={15} /></button>
      </div>
      <div className="td-panel-b">
        {ctx && (
          <section className="td-psec td-here">
            <div className="td-psec-h">{ctx.logo && <BrandLogo name={ctx.logo} size={16} radius={4} />}<span className="ell">This page · {ctx.label}</span><span className="mute num">{here.length}</span></div>
            <div className="td-rows">{here.map((t) => <TodoRow key={t.id} t={t} edit />)}</div>
            {!here.length && <div className="td-none mute xs">None yet</div>}
          </section>
        )}
        <Sec title="Today" list={today} />
        <Sec title="Upcoming" list={later} />
        {nodate.length > 0 && <Sec title="No date" list={nodate} />}
        <section className="td-psec">
          <button className="td-psec-h td-fold" onClick={() => setShowDone((x) => !x)} aria-expanded={showDone}>
            <span>Done</span><span className="mute num">{done.length}</span><ChevronDown size={14} className={'mute td-chev' + (showDone ? ' on' : '')} />
          </button>
          {showDone && <div className="td-rows">{done.slice(0, 12).map((t) => <TodoRow key={t.id} t={t} />)}</div>}
        </section>
      </div>
      <div className="td-panel-f">
        <Composer key={focusKey} up pre={pre || ctx?.links || []} autoFocus={focusKey > 0 || !window.matchMedia('(pointer: coarse)').matches} placeholder={ctx ? 'Add a to-do for ' + ctx.label : 'Add a to-do'} onEscape={onClose} />
      </div>
    </>
  )
}

const Sec = ({ title, list }) => (
  <section className="td-psec">
    <div className="td-psec-h"><span className="ell">{title}</span><span className="mute num">{list.length}</span></div>
    <div className="td-rows">{list.map((t) => <TodoRow key={t.id} t={t} edit />)}</div>
  </section>
)

/* ───────── Quick add: a small dialog on desktop, a bottom sheet on phones ───────── */
function QuickAdd({ open, onClose, pre }) {
  const narrow = useNarrow()
  useEffect(() => { if (open && narrow) toast.dismiss() }, [open, narrow]) // a toast would sit on the sheet's input
  const added = (t) => {
    onClose()
    toast('To-do added', { description: t.text + (t.due ? ' · ' + dueLabel(t.due) : ''), action: { label: 'View', onClick: openTodos } })
  }
  useEffect(() => {
    if (!open || narrow) return
    const k = (e) => { if (e.key === 'Escape' && !e.defaultPrevented) onClose() }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [open, narrow, onClose])
  const body = <div className="td-qa-b"><div className="td-qa-h"><ListChecks size={15} className="mute" /><b>New to-do</b></div><Composer pre={pre} autoFocus onAdded={added} onEscape={onClose} placeholder="Send @Rare Rabbit the deck tomorrow" /></div>
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

/* ───────── In context: every to-do, grouped by company ───────── */
