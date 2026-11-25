// The to-do surfaces that float over any page: quick add, a detail sheet, and the right-click menu.
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ListChecks } from 'lucide-react'
import { toast } from 'sonner'
import { useStore } from '../store'
import { EASE } from '../../shared/motion'
import { Sheet } from '../pages/Finance'
import { BottomSheet, useNarrow } from '../sales/kit'
import { pageCtx, dueLabel } from './logic'
import { openTodo } from './state'
import { Composer } from './ui'
import { TodoDetail } from './detail'
import { EntityMenu } from './ctx'

export function TodoHost({ path }) {
  const s = useStore()
  const [quick, setQuick] = useState(null) // { links, who }
  const [sheet, setSheet] = useState(null) // a to-do's id
  const ctx = useMemo(() => pageCtx(path, s), [path, s.sales.deals, s.campaigns]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const add = (e) => {
      const links = e.detail?.links?.length ? e.detail.links : null
      setQuick({ links, who: e.detail?.who || null })
    }
    const open = () => { location.hash = '#/todo' }
    const det = (e) => setSheet(e.detail?.id || null)
    window.addEventListener('todo:add', add); window.addEventListener('todo:open', open); window.addEventListener('todo:detail', det)
    return () => { window.removeEventListener('todo:add', add); window.removeEventListener('todo:open', open); window.removeEventListener('todo:detail', det) }
  }, [])
  return (
    <>
      <QuickAdd open={!!quick} onClose={() => setQuick(null)} pre={quick?.links || ctx?.links || []} who={quick?.who} />
      <Sheet open={!!sheet} onClose={() => setSheet(null)} width={520}>{sheet && <TodoDetail id={sheet} />}</Sheet>
      <EntityMenu />
    </>
  )
}

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
