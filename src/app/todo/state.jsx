// To-do slice: one localStorage-backed list shared by every variation (List and Panel).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { revive } from '../sales/data'
import { TODAY } from '../data'
import { dayAt } from './logic'

const KEY = 'wldd-todo-v1'

/** Variation (Settings › Preferences › To-do style). Shell sets it every render, like the BD layout. */
let STYLE = 'panel'
export const setTodoStyle = (v) => { STYLE = TODO_STYLES.some((x) => x.value === v) ? v : 'panel' }
export const todoStyle = () => STYLE
export const TODO_STYLES = [
  { value: 'list', label: 'List', desc: 'A Notion-style page: Today, Upcoming, Someday, Done.' },
  { value: 'panel', label: 'Panel', desc: 'Always one tap away: a panel on the right of any page.' },
]
export const TODO_HOME = [{ value: 'strip', label: 'Strip' }, { value: 'card', label: 'Card' }, { value: 'off', label: 'Off' }]
/** The To-do page exists only in List. (A saved Canvas or In context choice falls back to Panel.) */
export const hasPage = () => STYLE === 'list'

/* Events: any page can ask for capture or the to-do surface; the shell decides what that means for the variation. */
export const openTodoAdd = (links = []) => window.dispatchEvent(new CustomEvent('todo:add', { detail: { links } }))
export const openTodos = () => window.dispatchEvent(new CustomEvent('todo:open'))
export const setTodoPref = (key, value) => window.dispatchEvent(new CustomEvent('todo:pref', { detail: { key, value } }))

/* ───────── Seeds: real brands, deals and campaigns from the other slices ───────── */
const B = (label, id) => ({ kind: 'brand', id, label, brand: label })
const DL = (id, brand) => ({ kind: 'deal', id, label: brand + ' deal', brand })
const CP = (id, label) => ({ kind: 'campaign', id, label, brand: label.split(' × ')[0] })
const PE = (id, label, brand) => ({ kind: 'person', id, label, brand })
const PH = (digits, person, brand) => ({ kind: 'phone', id: digits, label: '+91 ' + digits.slice(0, 5) + ' ' + digits.slice(5), brand, person })
const T = (id, text, links, due, by, extra = {}) => ({ id, text, links, due, remind: due, by, at: new Date(TODAY.getTime() - 864e5 * (2 + (id.length % 3))), done: false, doneAt: null, pinned: false, ...extra })
function seed() {
  const items = [
    T('t3', 'Chase Unacademy, no reply in 6 days', [DL('d103', 'Unacademy')], dayAt(-1), 'u1'),
    T('t7', 'Lock the creator shortlist for Philips × Sale Countdown', [CP('c8', 'Philips × Sale Countdown')], dayAt(-2), 'u5'),
    T('t1', 'Send Rare Rabbit the Q4 credentials deck', [B('Rare Rabbit', 'rare-rabbit'), DL('d101', 'Rare Rabbit')], dayAt(0, 17), 'u1', { pinned: true }),
    T('t4', 'Prep the Bisleri pitch: flavoured drinks angle', [DL('d115', 'Bisleri')], dayAt(0, 16, 30), 'u1'),
    T('t6', 'Share the mid-campaign report with Netflix', [CP('c1', 'Netflix India × Diwali Drop')], dayAt(0, 15), 'u4'),
    T('t8', 'Check GST on INV/26-27/0515 before paying', [{ kind: 'invoice', id: 'inv1', label: 'INV/26-27/0515', brand: null }], dayAt(0), 'u7'),
    T('t13', 'Call back +91 99876 54321 about the winter menu', [PH('9987654321', { id: 'in1', name: 'Priya Natarajan' }, 'Third Wave Coffee')], dayAt(0, 15), 'u9'),
    T('t2', 'Call Juhi about the womenswear launch', [PE('ct1', 'Juhi Mathur', 'Rare Rabbit'), PH('9820144556', { id: 'ct1', name: 'Juhi Mathur' }, 'Rare Rabbit')], dayAt(1), 'u1'),
    T('t9', 'Ask Dhruv for the Share.Market meme numbers', [PE('ct2', 'Dhruv Pillai', 'PhonePe'), DL('d102', 'PhonePe')], dayAt(2), 'u1'),
    T('t16', 'Get District sign-off on the Always-on Q4 calendar', [CP('c3', 'District × Always-on Q4')], dayAt(2, 12), 'u10'),
    T('t5', 'Licious wants proposal v2 by Friday', [DL('d109', 'Licious')], dayAt(3), 'u3'),
    T('t12', 'Book the Lenskart renewal call', [B('Lenskart', 'lenskart')], dayAt(6, 11), 'u1'),
    T('t10', 'Zepto Café always-on: pitch it as a retainer', [B('Zepto', 'zepto')], null, 'u1'),
    T('t11', 'Why did Mamaearth spend drop 31%?', [B('Mamaearth', 'mamaearth')], null, 'u1'),
    T('t14', 'Intro Spinny to the Neon pod', [DL('d113', 'Spinny')], dayAt(-1), 'u1', { done: true, doneAt: dayAt(-1, 18) }),
    T('t15', 'Send Atomberg the summer fan case studies', [PE('ct5', 'Naina Sood', 'Atomberg')], dayAt(-2), 'u1', { done: true, doneAt: dayAt(-2, 16) }),
  ]
  return { v: 1, items: items.map((t, i) => ({ ...t, order: i })) }
}
const load = () => {
  try { const v = JSON.parse(localStorage.getItem(KEY) || 'null', revive); if (v?.v === 1 && Array.isArray(v.items)) return v } catch {}
  return seed()
}
const uid = () => 't' + Math.random().toString(36).slice(2, 8)

export function useTodoState() {
  const [st, setSt] = useState(load)
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(st)) } catch {} }, [st])
  const ref = useRef(st); ref.current = st
  const setItems = useCallback((fn) => setSt((s) => ({ ...s, items: fn(s.items) })), [])
  const patch = useCallback((id, p) => setItems((l) => l.map((t) => (t.id === id ? { ...t, ...(typeof p === 'function' ? p(t) : p) } : t))), [setItems])

  /** New items go to the top of their section. */
  const add = useCallback((f) => {
    const t = { id: uid(), text: f.text, links: f.links || [], due: f.due || null, remind: f.remind ?? f.due ?? null, by: f.by, at: new Date(TODAY.getTime() - 1000), done: false, doneAt: null, pinned: false, color: f.color || null, x: f.x, y: f.y, order: Math.min(0, ...ref.current.items.map((x) => x.order ?? 0)) - 1 }
    setItems((l) => [t, ...l])
    return t
  }, [setItems])
  /** Tick or untick. Ticking says so with an Undo; unticking is quiet. */
  const toggle = useCallback((id) => {
    const t = ref.current.items.find((x) => x.id === id)
    if (!t) return
    const done = !t.done
    patch(id, { done, doneAt: done ? new Date(TODAY.getTime() - 1000) : null })
    if (done) toast('Done', { description: t.text, action: { label: 'Undo', onClick: () => patch(id, { done: false, doneAt: null }) } })
  }, [patch])
  const remove = useCallback((id) => {
    const l0 = ref.current.items
    const i = l0.findIndex((x) => x.id === id)
    if (i < 0) return
    const gone = l0[i]
    setItems((l) => l.filter((x) => x.id !== id))
    toast('Deleted', { description: gone.text, action: { label: 'Undo', onClick: () => setItems((l) => { const n = [...l]; n.splice(Math.min(i, n.length), 0, gone); return n }) } })
  }, [setItems])
  /** Drop `id` before `beforeId` (null = end) inside the ordered list `ids` of one section. */
  const move = useCallback((id, ids, toIndex) => {
    const list = ids.filter((x) => x !== id)
    const byId = Object.fromEntries(ref.current.items.map((t) => [t.id, t]))
    const prev = byId[list[toIndex - 1]], next = byId[list[toIndex]]
    const o = prev && next ? ((prev.order ?? 0) + (next.order ?? 0)) / 2 : prev ? (prev.order ?? 0) + 1 : next ? (next.order ?? 0) - 1 : 0
    patch(id, { order: o })
  }, [patch])
  const place = useCallback((id, x, y) => patch(id, { x: Math.round(x), y: Math.round(y) }), [patch])
  const placeMany = useCallback((pos) => setItems((l) => l.map((t) => (pos[t.id] ? { ...t, x: pos[t.id][0], y: pos[t.id][1] } : t))), [setItems])
  const reset = useCallback(() => { const f = seed(); setSt(f); try { localStorage.setItem(KEY, JSON.stringify(f)) } catch {} }, [])

  return useMemo(() => ({ items: st.items, add, patch, toggle, remove, move, place, placeMany, reset }), [st, add, patch, toggle, remove, move, place, placeMany, reset])
}
