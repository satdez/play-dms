// Canvas (variation 3): sticky notes on a dotted board. Drag by the note's top bar; positions persist.
// Phones get a two-column stack of the same notes (no free drag).
import { useEffect, useRef, useState } from 'react'
import { GripHorizontal, Minus, Plus, LayoutGrid, Monitor, Palette, Trash2, Eye, EyeOff } from 'lucide-react'
import { useStore } from '../store'
import { Tip } from '../../shared/motion'
import { Avatar } from '../../shared/ui'
import { BrandLogo } from '../../shared/brands'
import { Popover, Seg } from '../ui'
import { team } from '../data'
import { useNarrow } from '../sales/kit'
import { brandOfItem, colorOf, meId } from './logic'
import { Composer, TodoText, Tick, DueChip, StyleMenu, useGoing } from './ui'

const W = 232, GX = 256, GY = 200
const SWATCH = [null, '#f2bd2f', '#5fcf86', '#c46bf0', '#f0506e', '#7c8cff']
const cell = (i) => [40 + (i % 5) * GX, 60 + Math.floor(i / 5) * GY]
const byOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0)
const readCv = () => { try { return JSON.parse(localStorage.getItem('wldd-todo-cv') || '{}') } catch { return {} } }

export function CanvasPage() {
  const s = useStore()
  const narrow = useNarrow()
  const saved = useRef(readCv()).current
  const [mode, setMode] = useState(saved.mode === 'stack' ? 'stack' : 'board')
  const [zoom, setZoom] = useState(saved.zoom || 1)
  const [grouped, setGrouped] = useState(!!saved.grouped)
  const [showDone, setShowDone] = useState(saved.done ?? true)
  useEffect(() => { try { localStorage.setItem('wldd-todo-cv', JSON.stringify({ mode, zoom, grouped, done: showDone })) } catch {} }, [mode, zoom, grouped, showDone])
  const sc = useRef()
  const items = s.todo.items
  const list = items.filter((t) => showDone || !t.done).sort(byOrder)
  const board = !narrow && mode === 'board'

  // Notes without a spot (seeds, or added from another surface) get the first free cell, once.
  useEffect(() => {
    const free = items.filter((t) => t.x == null)
    if (!free.length) return
    const taken = items.filter((t) => t.x != null).map((t) => [t.x, t.y])
    const p = {}
    let i = 0
    for (const t of [...free].sort(byOrder)) {
      while (taken.some(([x, y]) => Math.abs(x - cell(i)[0]) < W && Math.abs(y - cell(i)[1]) < GY - 40)) i++
      p[t.id] = cell(i); taken.push(cell(i)); i++
    }
    s.todo.placeMany(p)
  }, [items.length]) // eslint-disable-line react-hooks/exhaustive-deps

  // Ctrl + wheel (and trackpad pinch) zooms the board.
  useEffect(() => {
    const el = sc.current
    if (!el || !board) return
    const on = (e) => { if (!e.ctrlKey) return; e.preventDefault(); setZoom((z) => Math.round(Math.min(1.5, Math.max(0.5, z * (e.deltaY < 0 ? 1.08 : 0.93))) * 100) / 100) }
    el.addEventListener('wheel', on, { passive: false })
    return () => el.removeEventListener('wheel', on)
  }, [board])

  /** Group by brand: one column per company, biggest first, packed into the shortest column. */
  const group = () => {
    const g = {}
    list.forEach((t) => { const b = brandOfItem(t) || ''; (g[b] ||= []).push(t) })
    const keys = Object.keys(g).sort((a, b) => (!a) - (!b) || g[b].length - g[a].length || a.localeCompare(b))
    const cols = Array(5).fill(64)
    const p = {}
    const hOf = (t) => document.querySelector(`.td-note[data-id="${t.id}"]`)?.offsetHeight || 130
    keys.forEach((k) => {
      const c = cols.indexOf(Math.min(...cols))
      let y = cols[c] + 34
      g[k].sort((a, b) => (a.due ? +a.due : 9e15) - (b.due ? +b.due : 9e15)).forEach((t) => { p[t.id] = [40 + c * GX, y]; y += hOf(t) + 14 })
      cols[c] = y + 36
    })
    s.todo.placeMany(p)
    setGrouped(true)
  }
  /** A new note lands in the first free spot of what's on screen, so it never hides under another. */
  const extra = () => {
    const el = sc.current
    const vx = el ? el.scrollLeft / zoom : 0, vy = el ? el.scrollTop / zoom : 0
    const cols = el ? Math.max(1, Math.floor(el.clientWidth / zoom / GX)) : 4
    const taken = items.filter((t) => t.x != null)
    for (let i = 0; i < cols * 12; i++) {
      const x = vx + 40 + (i % cols) * GX, y = vy + 40 + Math.floor(i / cols) * GY
      if (!taken.some((t) => Math.abs(t.x - x) < W && Math.abs(t.y - y) < GY - 30)) return { x, y }
    }
    return { x: vx + 40, y: vy + 40 }
  }
  const maxY = Math.max(900, ...list.map((t) => (t.y || 0) + 360))
  const maxX = Math.max(1400, ...list.map((t) => (t.x || 0) + W + 200))
  const heads = grouped && board ? headsOf(list) : []

  return (
    <div className={'td-cvpage' + (board ? ' is-board' : '')}>
      <div className="td-cbar">
        <Composer className="td-cvcomp" placeholder="New note · @ links a company, deal or campaign" extra={board ? extra : undefined} />
        <div className="td-cbar-r">
          {!narrow && <Seg id="td-cv-mode" value={mode} onChange={setMode} options={[{ value: 'board', label: 'Board' }, { value: 'stack', label: 'Stack' }]} />}
          {board && <Tip label="Lay notes out in a column per company"><button className={'b sm' + (grouped ? ' on' : '')} onClick={group}><LayoutGrid size={14} />Group by brand</button></Tip>}
          {board && (
            <span className="td-zoom">
              <Tip label="Zoom out" kbd={'Ctrl+wheel'}><button className="b ghost icon sm" onClick={() => setZoom((z) => Math.max(0.5, Math.round((z - 0.1) * 10) / 10))} aria-label="Zoom out"><Minus size={14} /></button></Tip>
              <button className="b ghost sm num td-zoom-v" onClick={() => setZoom(1)} aria-label="Reset zoom">{Math.round(zoom * 100)}%</button>
              <Tip label="Zoom in"><button className="b ghost icon sm" onClick={() => setZoom((z) => Math.min(1.5, Math.round((z + 0.1) * 10) / 10))} aria-label="Zoom in"><Plus size={14} /></button></Tip>
            </span>
          )}
          <Tip label={showDone ? 'Hide done' : 'Show done'}><button className="b ghost icon sm" onClick={() => setShowDone((x) => !x)} aria-label={showDone ? 'Hide done' : 'Show done'}>{showDone ? <Eye size={14} /> : <EyeOff size={14} />}</button></Tip>
          {narrow && <Tip label="Arrange notes freely on a larger screen"><span className="chip td-arr"><Monitor size={12} />Arrange on desktop</span></Tip>}
          <StyleMenu />
        </div>
      </div>
      {board ? (
        <div className="td-cv" ref={sc}>
          <div className="td-board" style={{ width: maxX * zoom, height: maxY * zoom }}>
            <div className="td-board-in" style={{ width: maxX, height: maxY, transform: `scale(${zoom})` }}>
              {heads.map((h) => <div key={h.k || 'none'} className="td-ghead" style={{ left: h.x, top: h.y }}>{h.k ? <BrandLogo name={h.k} size={18} radius={5} /> : null}<b>{h.k || 'No company'}</b><span className="mute num">{h.n}</span></div>)}
              {list.map((t) => <Note key={t.id} t={t} free zoom={zoom} />)}
            </div>
          </div>
        </div>
      ) : (
        <div className="td-mason">{list.map((t) => <Note key={t.id} t={t} />)}</div>
      )}
    </div>
  )
}

function headsOf(list) {
  const g = {}
  list.forEach((t) => { if (t.x == null) return; const b = brandOfItem(t) || ''; const h = (g[b] ||= { k: b, x: t.x, y: t.y, n: 0 }); h.x = Math.min(h.x, t.x); h.y = Math.min(h.y, t.y); h.n++ })
  return Object.values(g).map((h) => ({ ...h, y: h.y - 32 }))
}

function Note({ t, free, zoom = 1 }) {
  const going = useGoing(t.id)
  const s = useStore()
  const b = brandOfItem(t)
  const c = t.color || colorOf(b)
  const who = t.by !== meId() && team.find((u) => u.id === t.by)
  // Drag by the top bar. The note follows the pointer directly (no React render per move); the spot saves on release.
  const grip = (e) => {
    if (!free || e.button > 0 || e.target.closest('button,a')) return
    const el = e.currentTarget.closest('.td-note')
    const h = e.currentTarget
    const sx = e.clientX, sy = e.clientY, x0 = t.x ?? 0, y0 = t.y ?? 0
    let nx = x0, ny = y0
    h.setPointerCapture?.(e.pointerId)
    el.classList.add('td-lift')
    const mv = (ev) => { nx = Math.max(0, x0 + (ev.clientX - sx) / zoom); ny = Math.max(0, y0 + (ev.clientY - sy) / zoom); el.style.left = nx + 'px'; el.style.top = ny + 'px' }
    const up = () => {
      h.removeEventListener('pointermove', mv); h.removeEventListener('pointerup', up); h.removeEventListener('pointercancel', up)
      el.classList.remove('td-lift')
      if (nx !== x0 || ny !== y0) s.todo.place(t.id, nx, ny)
    }
    h.addEventListener('pointermove', mv); h.addEventListener('pointerup', up); h.addEventListener('pointercancel', up)
    e.preventDefault()
  }
  return (
    <div className={'td-note' + (t.done ? ' done' : '') + (free ? ' free' : '') + (c ? ' tinted' : '') + (going ? ' td-going' : '')} data-id={t.id} style={{ ...(free ? { left: t.x ?? 0, top: t.y ?? 0 } : null), ...(c ? { '--c': c } : null) }}>
      <div className="td-note-h" onPointerDown={grip}>
        {free && <GripHorizontal size={14} className="td-note-g" />}
        {b ? <><BrandLogo name={b} size={16} radius={4} /><span className="ell td-note-b">{b}</span></> : <span className="td-note-b mute">Note</span>}
        <span className="grow" />
        <Tick t={t} />
      </div>
      <div className="td-note-t"><TodoText t={t} /></div>
      <div className="td-note-f">
        <DueChip t={t} />
        <span className="grow" />
        {who && <Tip label={who.name}><span className="td-by"><Avatar user={who} size={18} /></span></Tip>}
        <Popover width={196} trigger={({ toggle }) => <Tip label="Colour"><button className="b ghost icon sm td-note-a" onClick={toggle} aria-label="Colour"><Palette size={13} /></button></Tip>}>
          {(close) => (
            <div className="td-sw">
              {SWATCH.map((x) => (
                <button key={x || 'auto'} className={'td-sw-i' + ((t.color || null) === x ? ' on' : '')} style={x ? { '--c': x } : null} onClick={() => { s.todo.patch(t.id, { color: x }); close() }} aria-label={x ? 'Colour ' + x : 'Brand colour'}>{!x && <span className="xs">Auto</span>}</button>
              ))}
            </div>
          )}
        </Popover>
        <Tip label="Delete"><button className="b ghost icon sm td-note-a" onClick={() => s.todo.remove(t.id)} aria-label="Delete"><Trash2 size={13} /></button></Tip>
      </div>
    </div>
  )
}
