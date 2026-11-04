import { useMemo, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Heart, MessageCircle, Play, Image as ImageIcon, Layers } from 'lucide-react'
import { invoices as invoiceSeed, submissions as subSeed, campaigns as campaignSeed, fmt } from '../data'

export const industryHue = {
  Music: 150, OTT: 25, 'E-commerce': 185, Electronics: 5, Agency: 165, 'Commute Aggregators': 345,
  'Food & Delivery': 45, Fintech: 265, Beauty: 320, Gaming: 285, Others: 215,
}

/** Approve / reject queue with undo. Works for invoices or submissions. */
export function useQueue(seed, noun = 'Invoice', label = (x) => x.no || x.id) {
  const [items, setItems] = useState(seed)
  const [done, setDone] = useState([])
  const act = useCallback((id, verdict) => {
    let removed
    setItems((list) => {
      const idx = list.findIndex((x) => x.id === id)
      if (idx === -1) return list
      removed = { item: list[idx], idx }
      return list.filter((x) => x.id !== id)
    })
    setTimeout(() => {
      if (!removed) return
      const r = removed
      setDone((d) => [{ ...r.item, verdict }, ...d])
      const msg = verdict === 'approved' ? `${noun} approved` : `${noun} rejected`
      ;(verdict === 'approved' ? toast.success : toast)(msg, {
        description: label(r.item),
        action: {
          label: 'Undo',
          onClick: () => {
            setItems((list) => { const n = [...list]; n.splice(Math.min(r.idx, n.length), 0, r.item); return n })
            setDone((d) => d.filter((x) => x.id !== r.item.id))
          },
        },
      })
    }, 0)
  }, [noun, label])
  return { items, done, approve: (id) => act(id, 'approved'), reject: (id) => act(id, 'rejected') }
}
export const useInvoices = () => useQueue(invoiceSeed, 'Invoice', (x) => `${x.no} · ${x.vendor} · ${fmt.inr(x.amount)}`)
export const useSubmissions = () => useQueue(subSeed, 'Submission', (x) => `${x.creator.handle} · ${x.campaign}`)

export function useStars() {
  const [stars, setStars] = useState(() => new Set(campaignSeed.filter((c) => c.starred).map((c) => c.id)))
  const toggle = (id) => setStars((s) => {
    const n = new Set(s)
    if (n.has(id)) { n.delete(id); toast('Removed from favourites') } else { n.add(id); toast('Added to favourites') }
    return n
  })
  return [stars, toggle]
}

export function useSort(rows, initial = { key: null, dir: 'desc' }) {
  const [sort, setSort] = useState(initial)
  const sorted = useMemo(() => {
    if (!sort.key) return rows
    const m = sort.dir === 'asc' ? 1 : -1
    return [...rows].sort((a, b) => {
      const x = a[sort.key], y = b[sort.key]
      if (x instanceof Date) return (x - y) * m
      if (typeof x === 'number') return (x - y) * m
      return String(x).localeCompare(String(y)) * m
    })
  }, [rows, sort])
  const toggle = (key) => setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' }))
  return [sorted, sort, toggle]
}

/** Fake social post thumbnail rendered purely with CSS. */
export function Thumb({ s, ratio = '4 / 5', radius = 8, showMeta = true }) {
  const h = s.hue
  const FormatIcon = { Reel: Play, Short: Play, Video: Play, Carousel: Layers }[s.format] || ImageIcon
  return (
    <div className="thumb" style={{
      aspectRatio: ratio, borderRadius: radius, position: 'relative', overflow: 'hidden', color: '#fff',
      background: `radial-gradient(120% 80% at 20% 10%, oklch(0.72 0.14 ${h}) 0%, transparent 60%), radial-gradient(90% 70% at 90% 90%, oklch(0.55 0.16 ${(h + 60) % 360}) 0%, transparent 60%), oklch(0.3 0.06 ${(h + 30) % 360})`,
    }}>
      <div style={{ position: 'absolute', top: 8, left: 8, right: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, fontWeight: 500 }}>
        <span style={{ width: 16, height: 16, borderRadius: 99, background: `oklch(0.8 0.1 ${s.creator.hue})`, border: '1.5px solid rgba(255,255,255,.8)' }} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textShadow: '0 1px 2px rgba(0,0,0,.3)' }}>{s.creator.handle}</span>
        <FormatIcon size={12} style={{ marginLeft: 'auto', flex: 'none' }} />
      </div>
      <div style={{ position: 'absolute', inset: '30% 14% auto', fontSize: 11.5, fontWeight: 600, lineHeight: 1.25, textShadow: '0 1px 8px rgba(0,0,0,.35)', textWrap: 'balance' }}>
        {s.caption}
      </div>
      {showMeta && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '18px 8px 7px', display: 'flex', gap: 10, fontSize: 10.5, background: 'linear-gradient(transparent, rgba(0,0,0,.45))' }}>
          <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center' }}><Play size={10} fill="#fff" /> {fmt.compact(s.views)}</span>
          <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center' }}><Heart size={10} /> {fmt.compact(Math.round(s.views * 0.06))}</span>
          <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center' }}><MessageCircle size={10} /> {fmt.compact(Math.round(s.views * 0.003))}</span>
        </div>
      )}
    </div>
  )
}

/** Abstract sketchboard cover: floating sticky notes in the board's palette. */
export function BoardCover({ board, height = 120, dark = false }) {
  const [a, b, c] = board.palette
  const seed = board.id.charCodeAt(2) || 1
  const notes = Array.from({ length: 7 }, (_, i) => ({
    x: ((seed * (i + 3) * 37) % 80) + 2, y: ((seed * (i + 1) * 53) % 60) + 6,
    w: 16 + ((i * 7 + seed) % 14), h: 18 + ((i * 11 + seed) % 16), r: (((i * 13 + seed) % 9) - 4), hue: [a, b, c][i % 3],
  }))
  return (
    <div style={{ height, position: 'relative', overflow: 'hidden', background: dark ? `oklch(0.2 0.02 ${a})` : `oklch(0.96 0.015 ${a})`,
      backgroundImage: `radial-gradient(${dark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.08)'} 1px, transparent 1px)`, backgroundSize: '12px 12px' }}>
      {notes.map((n, i) => (
        <span key={i} style={{
          position: 'absolute', left: n.x + '%', top: n.y + '%', width: n.w + '%', height: n.h + '%', rotate: n.r + 'deg', borderRadius: 3,
          background: dark ? `oklch(0.42 0.09 ${n.hue})` : `oklch(0.88 0.08 ${n.hue})`, boxShadow: '0 2px 6px rgba(0,0,0,.12)',
        }} />
      ))}
    </div>
  )
}

export function greeting() {
  const h = 10 // pinned to TODAY (10:30)
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}
