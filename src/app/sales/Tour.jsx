// Floating walkthrough controller for Prospecting: pick one of five cases, a fake cursor drives the real page,
// the Kokoro "Heart" voice (af_heart, pre-rendered clips in public/tour-voice) narrates.
import { useEffect, useRef, useState } from 'react'
import { Presentation, Play, Pause, Square, Volume2, VolumeX, X, SkipForward, GripVertical, Check } from 'lucide-react'
import { Popover, Seg } from '../ui'
import { Tip } from '../../shared/motion'
import { F_EMPTY, seed } from './data'
import { clipUrl } from './tourVoice'
import { FRESH, bdFilters } from './prospect'
import { setFilterMode } from './kit'
import { CASES, $$, byText, norm } from './tourCases'
import './tourStyle.css'

const LS_SPEED = 'wldd-tour-speed'
const read = (k, d) => { try { return localStorage.getItem(k) || d } catch { return d } }
const save = (k, v) => { try { localStorage.setItem(k, v) } catch {} }
const STOP = { stop: true }
const halted = (a) => { try { a?.pause() } catch {} }
let seedBase = null // credits, database and reveals as they ship: the numbers the narration was recorded against

export function Tour({ st, res, setF }) {
  const [open, setOpen] = useState(false)
  const [cur, setCur] = useState(null) // case id
  const [state, setState] = useState('idle') // idle · playing · paused · done
  const [cap, setCap] = useState('')
  const [speed, setSpeedRaw] = useState(() => +read(LS_SPEED, '1') || 1)
  const [muted, setMuted] = useState(false)
  const setSpeed = (v) => { setSpeedRaw(v); save(LS_SPEED, String(v)) }

  // Everything the script reads is held in a ref, so a long run always sees the latest page state.
  const live = useRef({})
  live.current = { st, res, setF, speed, muted }
  const job = useRef({ id: 0, paused: false })
  const audio = useRef(null) // the clip being played
  const cursor = useRef(null)
  const ring = useRef(null)

  /* ───────── primitives ───────── */
  const alive = (id) => job.current.id === id
  const tick = async (id, ms) => {
    let left = ms / live.current.speed
    while (left > 0) {
      if (!alive(id)) throw STOP
      const step = Math.min(left, 60)
      await new Promise((r) => setTimeout(r, step))
      if (!job.current.paused) left -= step
    }
    if (!alive(id)) throw STOP
  }
  const waitFor = async (id, get, ms = 2500) => {
    const t0 = Date.now()
    for (;;) {
      const el = get()
      if (el) return el
      if (Date.now() - t0 > ms) return null
      await tick(id, 50 * live.current.speed)
    }
  }

  /** Narration is one pre-rendered clip per sentence, in the Kokoro "Heart" voice. No browser voices, ever:
      a sentence without a clip (or with the voice off) just holds its caption for as long as reading it takes. */
  const speak = async (id, text) => {
    const parts = text.split(/(?<=[.?!])\s+/)
    for (let i = 0; i < parts.length; i++) {
      if (!alive(id)) throw STOP
      await speakOne(id, parts[i])
      if (i < parts.length - 1) await tick(id, 170) // clips are trimmed tight, so breathe between sentences
    }
  }
  const speakOne = (id, text) => new Promise((resolve) => {
    const { muted: mu, speed: sp } = live.current
    const guess = (text.length * 62) / sp + 500
    const silent = () => tick(id, guess * sp).then(resolve, resolve)
    if (mu) { silent(); return }
    // Try the clip directly; a missing clip (or a blocked play) just holds the caption instead.
    const a = new Audio(clipUrl(text))
    a.playbackRate = sp
    audio.current = a
    let done = false
    const fin = () => { if (!done) { done = true; clearTimeout(guard); resolve() } }
    const miss = () => { if (!done) { done = true; clearTimeout(guard); silent() } }
    const guard = setTimeout(fin, guess * 3 + 8000)
    a.onended = fin; a.onerror = miss
    a.play().catch(miss)
    if (job.current.paused) a.pause()
  })

  const moveCursor = async (id, x, y, instant) => {
    const c = cursor.current
    if (!c) return
    const [px, py] = c._p || [x, y]
    const d = Math.hypot(x - px, y - py)
    const ms = instant ? 0 : Math.max(380, Math.min(1100, d * 1.15)) / live.current.speed
    c.style.transitionDuration = ms + 'ms'
    c.style.transform = `translate(${x}px, ${y}px)`
    c._p = [x, y]
    await tick(id, ms * live.current.speed + 80)
  }
  const showRing = (el) => {
    const r = ring.current
    if (!r || !el) return
    const b = el.getBoundingClientRect()
    Object.assign(r.style, { opacity: 1, left: b.left - 4 + 'px', top: b.top - 4 + 'px', width: b.width + 8 + 'px', height: b.height + 8 + 'px' })
  }
  const hideRing = () => { if (ring.current) ring.current.style.opacity = 0 }
  const pointAt = async (id, el, ringIt = true) => {
    el.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    const b0 = el.getBoundingClientRect()
    if (b0.top < 90 || b0.bottom > innerHeight - 120) { el.scrollIntoView({ block: 'center' }); await tick(id, 220) }
    hideRing()
    const b = el.getBoundingClientRect()
    await moveCursor(id, b.left + Math.min(b.width * 0.55, b.width - 8), b.top + b.height / 2)
    if (ringIt) showRing(el)
  }
  const press = async (id) => {
    const c = cursor.current
    c?.classList.add('press'); await tick(id, 150); c?.classList.remove('press')
  }

  /** Wait until the page has finished reacting: results and state unchanged for a moment. Narration reads numbers right after. */
  const quiet = async (id, ms = 380) => {
    let { res: r0, st: s0 } = live.current
    let since = Date.now()
    const t0 = since
    while (Date.now() - since < ms && Date.now() - t0 < 3500) {
      await tick(id, 60 * live.current.speed)
      const { res: r1, st: s1 } = live.current
      if (r1 !== r0 || s1 !== s0) { r0 = r1; s0 = s1; since = Date.now() }
    }
  }

  /* ───────── the script API ───────── */
  const api = (id) => {
    const t = {
      n: () => { const r = live.current.res; return { signals: r.signals.length, companies: r.companies.length, people: r.people.length } },
      credits: () => live.current.st.credits,
      text: (sel) => document.querySelector(sel)?.textContent.replace(/\s+/g, ' ').trim() || '',
      settle: () => quiet(id),
      async say(text) {
        if (!alive(id)) throw STOP
        setCap(text)
        await speak(id, text)
        await tick(id, 260)
      },
      async click(get) {
        const el = await waitFor(id, get)
        if (!el) return
        await pointAt(id, el)
        await tick(id, 120)
        await press(id)
        el.click()
        hideRing()
        await quiet(id)
      },
      /** Move the cursor to something and say a line about it, without clicking. */
      async look(get, text) {
        const el = await waitFor(id, get, 1200)
        if (el) await pointAt(id, el)
        await t.say(text)
        hideRing()
      },
      async esc() {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
        await tick(id, 260)
      },
      async chipPick(label, opts) {
        await t.click(() => byText('.bdv-fbar-2 .bdv-fc-b', label))
        for (const o of opts) {
          await t.click(() => byText('.pop .bdv-pop-l button', o, { exact: true }))
          await tick(id, 140)
        }
        if (document.querySelector('.pop .bdv-pop-l')) await t.esc()
        await tick(id, 350)
      },
      match: (label) => t.click(() => byText('.bdv-match .seg button', label)),
      tab: (label) => t.click(() => byText('.bdv-tabrow .tabs button', label)),
      async facet(name, opt) {
        await t.click(() => {
          const box = $$('.bdv-fp .bdv-fq').find((q) => norm(q.querySelector('.bdv-fq-h .grow')?.textContent) === norm(name))
          return box && byText('.bdv-fqc', opt, { root: box })
        })
      },
      async type(get, text) {
        const el = await waitFor(id, get)
        if (!el) return
        await pointAt(id, el)
        await press(id)
        el.focus()
        const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
        for (let i = 1; i <= text.length; i++) {
          set.call(el, text.slice(0, i)); el.dispatchEvent(new Event('input', { bubbles: true }))
          await tick(id, 70)
        }
        await tick(id, 250)
      },
    }
    return t
  }

  /* ───────── run, pause, stop ───────── */
  const snapRef = useRef(null)
  /** Put credits, the database, reveals, saved views and the filter placement back. A finished tour keeps its filters on screen. */
  const restore = (keepFilter) => {
    const s = snapRef.current
    if (!s) return
    snapRef.current = null
    const { st: cur, setF: sf } = live.current
    cur.set(() => ({ credits: s.credits, db: s.db, revealed: s.revealed, views: s.views, phones: s.phones }))
    FRESH.clear()
    if (!keepFilter) sf({ match: 'any' })
    if (bdFilters() !== s.mode) setFilterMode(s.mode)
  }
  const halt = () => {
    job.current.id++; job.current.paused = false
    halted(audio.current)
    audio.current = null
    cursor.current && (cursor.current.style.opacity = 0)
    hideRing()
  }
  const stop = () => { halt(); restore(); setState('idle'); setCap('') }
  useEffect(() => () => { job.current.id++; halted(audio.current) }, [])

  const play = async (caseId) => {
    if (innerWidth <= 760) { setCur(caseId); setCap('The tour needs a wider window.'); return }
    // Switching mid-run: the page state is not yet restored in `live`, so keep the first snapshot.
    const s = live.current.st
    const base = snapRef.current || { credits: s.credits, db: s.db, revealed: s.revealed, views: s.views, phones: s.phones || {}, mode: bdFilters() }
    halt(); restore()
    snapRef.current = base
    // Narration is recorded against the shipped data, so run on it (restored when the tour ends).
    seedBase ||= (({ credits, db }) => ({ credits, db }))(seed())
    live.current.st.set(() => ({ credits: seedBase.credits, db: seedBase.db, revealed: [], phones: {} }))
    const sc = CASES.find((c) => c.id === caseId)
    const id = ++job.current.id
    setCur(caseId); setState('playing'); setCap('')
    try {
      // Start clean: bar filters, nothing selected, Match any, Signals tab.
      if (bdFilters() !== 'bar') { setFilterMode('bar'); await tick(id, 500) }
      live.current.setF({ ...F_EMPTY, match: 'any' })
      const c = cursor.current
      c.style.opacity = 1
      c._p = null
      await moveCursor(id, innerWidth / 2, innerHeight - 140, true)
      await tick(id, 300)
      const t = api(id)
      await t.tab('Signals')
      await sc.run(t)
      await tick(id, 600)
      setState('done'); setCap('')
      cursor.current.style.opacity = 0; hideRing()
      restore(true)
    } catch (e) {
      if (e !== STOP) { console.error(e); setCap('Something on the page moved. Try again.'); setState('idle'); halt(); restore() }
    }
  }
  const pause = () => {
    if (state === 'playing') { job.current.paused = true; halted(audio.current); setState('paused') }
    else if (state === 'paused') { job.current.paused = false; audio.current?.play().catch(() => {}); setState('playing') }
  }
  const next = () => { const i = CASES.findIndex((c) => c.id === cur); play(CASES[(i + 1) % CASES.length].id) }
  const running = state === 'playing' || state === 'paused'
  const sc = CASES.find((c) => c.id === cur)

  /* Floating: drag the grip, the caption, any empty part of the bar, or the closed Tour button. Kept inside the window; remembered. */
  const [pos, setPos] = useState(() => { try { const p = JSON.parse(read('wldd-tour-pos', 'null')); return p && isFinite(p.x) && isFinite(p.y) ? p : { x: 0, y: 0 } } catch { return { x: 0, y: 0 } } })
  const setPos0 = (p) => { setPos(p); save('wldd-tour-pos', JSON.stringify(p)) }
  const [dragging, setDragging] = useState(false)
  const dock = useRef(null)
  const moved = useRef(false)
  const onDown = (e) => {
    if (e.button !== 0 || (e.target.closest('button, input, select, a') && !e.target.closest('.tour-fab'))) return
    const box = dock.current.getBoundingClientRect()
    const x0 = e.clientX, y0 = e.clientY, p0 = pos
    let last = p0
    moved.current = false
    const move = (ev) => {
      const dx = Math.max(8 - box.left, Math.min(innerWidth - 8 - box.right, ev.clientX - x0))
      const dy = Math.max(8 - box.top, Math.min(innerHeight - 8 - box.bottom, ev.clientY - y0))
      if (!moved.current && Math.hypot(ev.clientX - x0, ev.clientY - y0) < 4) return
      if (!moved.current) { moved.current = true; setDragging(true) }
      last = { x: Math.round(p0.x + dx), y: Math.round(p0.y + dy) }
      setPos(last)
    }
    const up = () => {
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up)
      setDragging(false)
      if (moved.current) { save('wldd-tour-pos', JSON.stringify(last)); setTimeout(() => { moved.current = false }, 0) }
    }
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up)
  }

  return (
    <>
      <div ref={ring} className="tour-ring" aria-hidden />
      <svg ref={cursor} className="tour-cursor" width="22" height="26" viewBox="0 0 22 26" aria-hidden>
        <path d="M3 2l15 12.2-6.4 1.2 3.7 7.6-3.2 1.5-3.7-7.6L3 21.5z" />
      </svg>
      <div ref={dock} className={'tour-dock' + (dragging ? ' drag' : '')} style={{ transform: `translate(calc(-50% + ${pos.x}px), ${pos.y}px)` }} onPointerDown={onDown}>
      {!open ? (
        <Tip label="Guided tour · drag to move">
          <button className="tour-fab b" onClick={() => { if (!moved.current) setOpen(true) }} aria-label="Guided tour"><Presentation size={15} />Tour</button>
        </Tip>
      ) : (
        <div className="tour" role="region" aria-label="Guided tour">
          {cap && <p className="tour-cap" aria-live="polite">{cap}</p>}
          <div className="tour-row">
            <Tip label="Drag to move · double-click to reset"><span className="tour-grip" onDoubleClick={() => setPos0({ x: 0, y: 0 })} aria-hidden><GripVertical size={14} /></span></Tip>
            <div className="tour-cases" role="group" aria-label="Cases">
              {CASES.map((c, i) => (
                <Tip key={c.id} label={c.who}>
                  <button className={'tour-case' + (cur === c.id ? ' on' : '')} onClick={() => play(c.id)} aria-pressed={cur === c.id}><span className="num">{i + 1}</span>{c.label}</button>
                </Tip>
              ))}
            </div>
            <i className="tour-sep" aria-hidden />
            <Tip label={state === 'paused' ? 'Resume' : 'Pause'}><button className="b ghost icon sm" disabled={!running} onClick={pause} aria-label={state === 'paused' ? 'Resume' : 'Pause'}>{state === 'paused' ? <Play size={15} /> : <Pause size={15} />}</button></Tip>
            <Tip label="Next case"><button className="b ghost icon sm" disabled={!sc} onClick={next} aria-label="Next case"><SkipForward size={15} /></button></Tip>
            <Tip label="Stop"><button className="b ghost icon sm" disabled={!running && !cap} onClick={stop} aria-label="Stop"><Square size={14} /></button></Tip>
            <i className="tour-sep" aria-hidden />
            <Popover align="right" width={280} side="top" trigger={({ toggle, open: o }) => (
              <Tip label="Voice and speed"><button className={'b ghost icon sm' + (o ? ' on' : '')} onClick={toggle} aria-label="Voice and speed">{muted ? <VolumeX size={15} /> : <Volume2 size={15} />}</button></Tip>
            )}>
              {() => (
                <div className="tour-vo">
                  <div className="pop-h">Speed</div>
                  <div className="tour-vo-s"><Seg id="tour-sp" value={speed} onChange={setSpeed} options={[{ value: 0.85, label: '0.85×' }, { value: 1, label: '1×' }, { value: 1.2, label: '1.2×' }, { value: 1.4, label: '1.4×' }]} /></div>
                  <div className="pop-h">Voice</div>
                  <button className={!muted ? 'on' : ''} onClick={() => setMuted(false)}><span className="grow">Heart</span>{!muted && <Check size={14} />}</button>
                  <button className={muted ? 'on' : ''} onClick={() => setMuted(true)}><span className="grow">Captions only</span>{muted && <Check size={14} />}</button>
                </div>
              )}
            </Popover>
            <Tip label="Close"><button className="b ghost icon sm" onClick={() => { stop(); setOpen(false) }} aria-label="Close tour"><X size={15} /></button></Tip>
          </div>
        </div>
      )}
      </div>
    </>
  )
}
