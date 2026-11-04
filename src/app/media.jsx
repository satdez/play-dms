/* Media previews: reels/posts/stories and proof-of-work files, plus a viewer.
   Everything is drawn with CSS (no stock images): each item gets a deterministic cover from its seed. */
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import {
  Play, Pause, Heart, MessageCircle, Eye, Instagram, Youtube, FileText, Images, Smartphone, ChevronLeft, ChevronRight, X,
  ArrowUpRight, Download, Volume2, VolumeX, TrendingUp,
} from 'lucide-react'
import { fmt } from './data'
import { EASE } from '../shared/motion'

const hash = (s) => { let h = 2166136261; for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0 }
const secs = (n) => `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`
const GRAIN = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")"

/* ───────── Item builders ───────── */
const CAPTIONS = ['When the plot twist hits 💀', 'POV: one more episode', 'Rate this out of 10', 'Tag the friend who needs this', 'No thoughts, just vibes', 'This is so me', 'Me explaining the brief to my team', 'Nobody: … Absolutely nobody:']
export function postItem({ id, handle, avatarHue, type = 'reel', views, date, link, i = 0 }) {
  const h = hash(id)
  return {
    id, kind: type, handle, avatarHue, seed: h, hue: h % 360, caption: CAPTIONS[(h + i) % CAPTIONS.length],
    views, likes: Math.round(views * (0.04 + (h % 50) / 1000)), comments: Math.round(views * (0.002 + (h % 7) / 2000)),
    duration: type === 'reel' ? 9 + (h % 50) : type === 'story' ? 15 : null, date, link, platform: 'Instagram',
  }
}
export function invoiceMedia(inv, serviceLabel) {
  const handle = '@' + inv.vendor.name.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 18)
  if (inv.type === 'misc') {
    const h = hash(inv.id)
    return [
      { id: inv.id + '-doc', kind: 'doc', name: 'Proof of work.pdf', pages: 4 + (h % 6), size: (1.2 + (h % 30) / 10).toFixed(1) + ' MB', title: serviceLabel, seed: h, hue: h % 360, date: inv.submitted, handle },
      { id: inv.id + '-photos', kind: 'photos', name: 'Event photos', count: 6 + (h % 14), size: (8 + (h % 40)).toFixed(0) + ' MB', seed: h + 7, hue: (h + 140) % 360, date: inv.submitted, handle },
      { id: inv.id + '-shot', kind: 'shot', name: 'Trend screenshot.png', size: (300 + (h % 600)) + ' KB', seed: h + 3, hue: (h + 260) % 360, date: inv.submitted, handle, tag: '#' + inv.campaign.split('×')[1]?.trim().replace(/\s+/g, '') },
    ]
  }
  return Array.from({ length: Math.min(inv.items, 8) }, (_, i) => postItem({
    id: inv.id + '-' + i, handle, avatarHue: hash(handle) % 360, type: 'reel', i,
    views: 40000 + (hash(inv.id + i) % 900) * 1000, date: inv.submitted, link: 'instagram.com/reel/' + hash(inv.id + i).toString(36),
  }))
}

/* ───────── Cover art ───────── */
function Art({ it, big }) {
  const h = it.hue
  const v = it.photo ? 1 + (it.seed % 3) : it.seed % 4 // photo sets never use the meme layout
  const grain = <i className="art-grain" style={{ backgroundImage: GRAIN }} />
  if (v === 0) {
    // meme-page layout: caption on black, landscape clip in the middle
    return (
      <div className="art" style={{ background: '#0b0b0c' }}>
        <div className="art-meme-t" style={{ fontSize: big ? 22 : undefined }}>{it.caption}</div>
        <div className="art-clip" style={{ background: `radial-gradient(70% 90% at 30% 30%, oklch(0.78 0.12 ${h}) 0%, transparent 60%), radial-gradient(60% 80% at 80% 80%, oklch(0.5 0.15 ${(h + 50) % 360}), transparent 70%), oklch(0.32 0.07 ${(h + 20) % 360})` }}>
          <span className="art-fig" style={{ background: `oklch(0.2 0.03 ${h})` }} />
        </div>
        {grain}
      </div>
    )
  }
  if (v === 1) {
    // stage: spotlight + silhouette
    return (
      <div className="art" style={{ background: `oklch(0.18 0.05 ${h})` }}>
        <i style={{ position: 'absolute', inset: 0, background: `conic-gradient(from 160deg at 50% -10%, transparent 0deg, oklch(0.85 0.12 ${h} / .55) 18deg, transparent 40deg)` }} />
        <i style={{ position: 'absolute', inset: 0, background: `radial-gradient(60% 30% at 50% 100%, oklch(0.6 0.18 ${(h + 40) % 360} / .8), transparent 70%)` }} />
        <span className="art-fig lg" style={{ background: `oklch(0.12 0.02 ${h})` }} />
        {grain}
      </div>
    )
  }
  if (v === 2) {
    // horizon: bands + sun
    return (
      <div className="art" style={{ background: `linear-gradient(180deg, oklch(0.55 0.13 ${(h + 250) % 360}) 0%, oklch(0.78 0.14 ${(h + 30) % 360}) 55%, oklch(0.36 0.08 ${(h + 200) % 360}) 56%, oklch(0.22 0.05 ${(h + 200) % 360}) 100%)` }}>
        <i style={{ position: 'absolute', left: '50%', top: '42%', width: '46%', aspectRatio: 1, translate: '-50% -50%', borderRadius: 99, background: `oklch(0.93 0.09 ${(h + 60) % 360})`, boxShadow: `0 0 60px oklch(0.9 0.12 ${(h + 60) % 360} / .7)` }} />
        <i style={{ position: 'absolute', left: 0, right: 0, top: '56%', bottom: 0, background: `repeating-linear-gradient(180deg, transparent 0 6px, oklch(0.9 0.1 ${(h + 60) % 360} / .12) 6px 7px)` }} />
        {grain}
      </div>
    )
  }
  // bokeh
  const dots = Array.from({ length: 7 }, (_, i) => { const s = hash(it.id + i); return { x: s % 100, y: (s >> 8) % 100, r: 14 + (s % 30), hh: (h + (s % 80)) % 360 } })
  return (
    <div className="art" style={{ background: `linear-gradient(160deg, oklch(0.3 0.08 ${h}), oklch(0.16 0.04 ${(h + 40) % 360}))` }}>
      {dots.map((d, i) => <i key={i} style={{ position: 'absolute', left: d.x + '%', top: d.y + '%', width: d.r + '%', aspectRatio: 1, translate: '-50% -50%', borderRadius: 99, background: `oklch(0.8 0.14 ${d.hh} / .55)`, filter: 'blur(6px)' }} />)}
      {grain}
    </div>
  )
}

/* ───────── File covers ───────── */
function DocCover({ it }) {
  return (
    <div className="fc fc-doc">
      <div className="fc-page">
        <b style={{ background: `oklch(0.62 0.15 ${it.hue})` }} />
        <i style={{ width: '70%' }} /><i /><i style={{ width: '85%' }} /><i style={{ width: '60%' }} />
        <div className="fc-chart">{[40, 65, 50, 82, 58, 90].map((v, k) => <span key={k} style={{ height: v + '%', background: `oklch(0.7 0.12 ${it.hue} / ${0.45 + k * 0.08})` }} />)}</div>
        <i /><i style={{ width: '75%' }} />
      </div>
      <span className="fc-badge">PDF</span>
    </div>
  )
}
function PhotosCover({ it }) {
  return (
    <div className="fc fc-photos">
      {[2, 1, 0].map((k) => (
        <div key={k} className={'fc-ph p' + k}><Art it={{ ...it, photo: true, id: it.id + k, seed: it.seed + k + 1, hue: (it.hue + k * 40) % 360 }} /></div>
      ))}
      <span className="fc-count"><Images size={11} />{it.count}</span>
    </div>
  )
}
function ShotCover({ it, big }) {
  const rows = [it.tag || '#Trending', '#IPLFinal', '#MondayMood', '#DiwaliSale', '#NewMusicFriday']
  return (
    <div className="fc fc-shot">
      <div className="fc-phone" style={big ? { width: 300 } : undefined}>
        <div className="fc-ph-h"><TrendingUp size={big ? 14 : 9} /> Trending in India</div>
        {rows.map((r, k) => (
          <div key={k} className={'fc-trow' + (k === 0 ? ' hit' : '')} style={k === 0 ? { '--hl': `oklch(0.7 0.16 ${it.hue})` } : undefined}>
            <span className="mute">{k + 1}</span><b className="ell">{r}</b><span className="mute">{fmt.compact(48000 - k * 7300 + (it.seed % 900) * 10)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ───────── Tiles ───────── */
const PlatformIcon = ({ p, size = 12 }) => (p === 'YouTube' ? <Youtube size={size} /> : <Instagram size={size} />)
const Av = ({ hue, size = 16, handle }) => <span className="mt-av" style={{ width: size, height: size, background: `oklch(0.72 0.12 ${hue})`, fontSize: size * 0.48 }}>{handle?.[1]?.toUpperCase()}</span>

function PostTile({ it, onOpen }) {
  const ratio = '3 / 4' // grid crop, like a profile grid; the viewer shows the true ratio
  return (
    <button className="mt" onClick={onOpen} aria-label={'Open ' + it.kind + ' by ' + it.handle}>
      <div className="mt-media" style={{ aspectRatio: ratio, '--dur': (it.duration || 6) + 's' }}>
        <Art it={it} />
        <span className="mt-top">
          <span className="mt-chip"><PlatformIcon p={it.platform} size={11} />{it.kind === 'reel' ? 'Reel' : it.kind === 'story' ? 'Story' : 'Post'}</span>
          {it.duration && <span className="mt-chip num">{secs(it.duration)}</span>}
        </span>
        {it.kind !== 'post' && <span className="mt-play"><Play size={16} fill="currentColor" /></span>}
        <span className="mt-bot num">{it.kind === 'post' ? <Eye size={11} /> : <Play size={10} fill="currentColor" />}{fmt.compact(it.views)}</span>
        {it.duration && <span className="mt-prog"><i /></span>}
      </div>
      <div className="mt-cap">
        <span className="row" style={{ gap: 6, minWidth: 0 }}><Av hue={it.avatarHue} handle={it.handle} /><span className="ell mt-h">{it.handle}</span></span>
        <span className="mt-meta num"><Heart size={11} />{fmt.compact(it.likes)}<MessageCircle size={11} />{fmt.compact(it.comments)}</span>
      </div>
    </button>
  )
}
function FileTile({ it, onOpen }) {
  const Icon = { doc: FileText, photos: Images, shot: Smartphone }[it.kind]
  return (
    <button className="mt" onClick={onOpen} aria-label={'Open ' + it.name}>
      <div className="mt-media file" style={{ aspectRatio: '4 / 5' }}>
        {it.kind === 'doc' && <DocCover it={it} />}
        {it.kind === 'photos' && <PhotosCover it={it} />}
        {it.kind === 'shot' && <ShotCover it={it} />}
      </div>
      <div className="mt-cap">
        <span className="row" style={{ gap: 6, minWidth: 0 }}><Icon size={13} className="mute" style={{ flex: 'none' }} /><span className="ell mt-h">{it.name}</span></span>
        <span className="mt-meta num">{it.kind === 'doc' ? it.pages + ' pages' : it.kind === 'photos' ? it.count + ' photos' : 'PNG'} · {it.size}</span>
      </div>
    </button>
  )
}

/** Grid of media with a built-in viewer. */
export function MediaGrid({ items, size = 'md' }) {
  const [open, setOpen] = useState(null)
  const files = items[0] && ['doc', 'photos', 'shot'].includes(items[0].kind)
  return (
    <>
      <div className={'mg ' + size + (files ? ' files' : '')}>
        {items.map((it, i) => files ? <FileTile key={it.id} it={it} onOpen={() => setOpen(i)} /> : <PostTile key={it.id} it={it} onOpen={() => setOpen(i)} />)}
      </div>
      <MediaViewer items={items} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />
    </>
  )
}

/* ───────── Viewer ───────── */
function Player({ it }) {
  const [playing, setPlaying] = useState(true)
  const [muted, setMuted] = useState(true)
  return (
    <div className="mv-player" style={{ '--dur': (it.duration || 15) + 's' }}>
      <Art it={it} big />
      <button className="mv-tap" onClick={() => setPlaying((p) => !p)} aria-label={playing ? 'Pause' : 'Play'} />
      <AnimatePresence>
        {!playing && <motion.span className="mv-bigplay" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.16, ease: EASE }}><Play size={26} fill="currentColor" /></motion.span>}
      </AnimatePresence>
      <div className="mv-ctrl">
        <button onClick={() => setPlaying((p) => !p)} aria-label={playing ? 'Pause' : 'Play'}>{playing ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}</button>
        <span className="mv-track"><i key={it.id} style={{ animationPlayState: playing ? 'running' : 'paused' }} /></span>
        <span className="num xs">{secs(it.duration || 15)}</span>
        <button onClick={() => setMuted((m) => !m)} aria-label={muted ? 'Unmute' : 'Mute'}>{muted ? <VolumeX size={15} /> : <Volume2 size={15} />}</button>
      </div>
    </div>
  )
}
function Stage({ it }) {
  if (it.kind === 'doc') return <div className="mv-doc"><DocCover it={it} /></div>
  if (it.kind === 'shot') return <div className="mv-shot"><ShotCover it={it} big /></div>
  if (it.kind === 'photos') {
    return (
      <div className="mv-photos">
        {Array.from({ length: Math.min(it.count, 9) }, (_, k) => (
          <div key={k} className="mv-photo"><Art it={{ ...it, photo: true, id: it.id + 'p' + k, seed: it.seed + k * 3 + 1, hue: (it.hue + k * 23) % 360 }} /></div>
        ))}
      </div>
    )
  }
  if (it.kind === 'post') return <div className="mv-post"><Art it={it} big /></div>
  return <Player it={it} />
}
function Side({ it }) {
  const file = ['doc', 'photos', 'shot'].includes(it.kind)
  return (
    <aside className="mv-side">
      <div className="row" style={{ gap: 10 }}>
        {file ? <span className="mv-fi">{it.kind === 'doc' ? <FileText size={16} /> : it.kind === 'photos' ? <Images size={16} /> : <Smartphone size={16} />}</span> : <Av hue={it.avatarHue} size={32} handle={it.handle} />}
        <div className="grow" style={{ minWidth: 0 }}>
          <div className="ell" style={{ fontWeight: 600 }}>{file ? it.name : it.handle}</div>
          <div className="mute xs row" style={{ gap: 4 }}>{file ? <>{it.handle}</> : <><PlatformIcon p={it.platform} size={11} />{it.platform}</>} · {fmt.date(it.date)}</div>
        </div>
      </div>
      {!file && <p className="mv-caption">{it.caption}</p>}
      <div className="mv-stats">
        {file ? (
          <>
            <div><span>{it.kind === 'doc' ? 'Pages' : it.kind === 'photos' ? 'Photos' : 'Format'}</span><b className="num">{it.kind === 'doc' ? it.pages : it.kind === 'photos' ? it.count : 'PNG'}</b></div>
            <div><span>Size</span><b className="num">{it.size}</b></div>
          </>
        ) : (
          <>
            <div><span><Eye size={12} /> Views</span><b className="num">{fmt.compact(it.views)}</b></div>
            <div><span><Heart size={12} /> Likes</span><b className="num">{fmt.compact(it.likes)}</b></div>
            <div><span><MessageCircle size={12} /> Comments</span><b className="num">{fmt.compact(it.comments)}</b></div>
            <div><span>Engagement</span><b className="num">{(((it.likes + it.comments) / it.views) * 100).toFixed(1)}%</b></div>
          </>
        )}
      </div>
      <div className="mv-actions">
        {file
          ? <button className="b ink" onClick={() => {}}><Download size={14} /> Download</button>
          : <a className="b ink" href={'https://' + it.link} target="_blank" rel="noreferrer"><ArrowUpRight size={14} /> Open post</a>}
      </div>
    </aside>
  )
}
export function MediaViewer({ items, index, onIndex, onClose }) {
  const open = index != null
  const [dir, setDir] = useState(1)
  const go = (d) => { if (index == null) return; const n = (index + d + items.length) % items.length; setDir(d); onIndex(n) }
  useEffect(() => {
    if (!open) return
    const on = (e) => {
      if (e.key === 'Escape') { e.stopImmediatePropagation(); e.preventDefault(); onClose() }
      else if (e.key === 'ArrowRight') { e.stopImmediatePropagation(); go(1) }
      else if (e.key === 'ArrowLeft') { e.stopImmediatePropagation(); go(-1) }
    }
    window.addEventListener('keydown', on, true)
    return () => window.removeEventListener('keydown', on, true)
  })
  const it = open ? items[index] : null
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="mv" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
          <div className="mv-scrim" onClick={onClose} />
          <motion.div className="mv-box" initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.97, opacity: 0 }} transition={{ duration: 0.22, ease: EASE }}>
            <div className="mv-stage">
              <AnimatePresence mode="popLayout" initial={false} custom={dir}>
                <motion.div key={it.id} className="mv-slide" custom={dir}
                  initial={{ x: dir * 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: dir * -40, opacity: 0 }} transition={{ duration: 0.22, ease: EASE }}>
                  <Stage it={it} />
                </motion.div>
              </AnimatePresence>
              {items.length > 1 && (
                <>
                  <button className="mv-nav l" onClick={() => go(-1)} aria-label="Previous (←)"><ChevronLeft size={18} /></button>
                  <button className="mv-nav r" onClick={() => go(1)} aria-label="Next (→)"><ChevronRight size={18} /></button>
                </>
              )}
            </div>
            <Side it={it} />
            <div className="mv-top">
              <span className="num">{index + 1} / {items.length}</span>
              <button className="mv-x" onClick={onClose} aria-label="Close"><X size={16} /></button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
