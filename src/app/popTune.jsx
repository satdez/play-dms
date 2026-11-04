/* Pop is a tunable style: four independent axes, written to html[data-pop-*].
   Presets are named combinations; THEMES is the colour gallery shown in Settings › Preferences.
   Ids stay stable (saved in localStorage); labels are the Indian names people see. */
import { useState } from 'react'
import { Link2, Check } from 'lucide-react'
import { Tip } from '../shared/motion'

/* tone id → label + swatches [bg, accent] for light and dark */
export const TONES = [
  { id: 'sand', label: 'Haldi', light: ['#eeefe9', '#f2bd2f'], dark: ['#1d1f27', '#f2bd2f'] },
  { id: 'sage', label: 'Tulsi', light: ['#e8ece6', '#1f7a4a'], dark: ['#121815', '#5fcf86'] },
  { id: 'haze', label: 'Baingani', light: ['#ecebf2', '#6d3fd0'], dark: ['#15141c', '#b994ef'] },
  { id: 'clay', label: 'Gulabi', light: ['#f2ece8', '#d6395e'], dark: ['#1b1513', '#f07c97'] },
  { id: 'slate', label: 'Neel', light: ['#eceef2', '#2f5fd0'], dark: ['#12151b', '#7aa2ff'] },
  { id: 'dune', label: 'Kesar', light: ['#f3eee6', '#e0621b'], dark: ['#1a1612', '#ff8a4c'] },
  { id: 'lagoon', label: 'Mor', light: ['#e7eeee', '#0e8a85'], dark: ['#101818', '#3cc8c0'] },
  { id: 'mono', label: 'Koyla', light: ['#efefef', '#111111'], dark: ['#111111', '#ededed'] },
  { id: 'jam', label: 'Jamun', light: ['#3a1f4d', '#f2bd2f'], dark: ['#1f1029', '#f2bd2f'] },
  { id: 'hc', label: 'Ujala', light: ['#ffffff', '#000000'], dark: ['#000000', '#ffffff'] },
  { id: 'safe', label: 'Drishti', light: ['#f6f6f4', '#1f6fd1'], dark: ['#121316', '#6ea8ff'] },
]
const TONE_BY = Object.fromEntries(TONES.map((t) => [t.id, t]))

export const TUNE_AXES = [
  { id: 'tone', label: 'Tone', opts: TONES.map((t) => ({ id: t.id, label: t.label, sw: t.light })) },
  { id: 'btn', label: 'Buttons', opts: [
    { id: 'lip', label: 'Lip' }, { id: 'flat', label: 'Flat' }, { id: 'soft', label: 'Soft' }, { id: 'pill', label: 'Pill' },
  ] },
  { id: 'font', label: 'Type', opts: [
    { id: 'plex', label: 'Plex', ff: "'IBM Plex Sans'" },
    { id: 'geist', label: 'Geist', ff: "'Geist'" },
    { id: 'manrope', label: 'Manrope', ff: "'Manrope'" },
    { id: 'bricolage', label: 'Bricolage', ff: "'Bricolage Grotesque'" },
  ] },
  { id: 'corner', label: 'Corners', opts: [
    { id: '4', label: '4px' }, { id: '6', label: '6px' }, { id: '10', label: '10px' }, { id: '14', label: '14px' },
  ] },
]

export const PRESETS = [
  { id: 'sand', label: 'Haldi', v: { tone: 'sand', btn: 'lip', font: 'plex', corner: '6' } },
  { id: 'sage', label: 'Tulsi', v: { tone: 'sage', btn: 'flat', font: 'geist', corner: '4' } },
  { id: 'haze', label: 'Baingani', v: { tone: 'haze', btn: 'soft', font: 'manrope', corner: '10' } },
  { id: 'clay', label: 'Gulabi', v: { tone: 'clay', btn: 'pill', font: 'bricolage', corner: '14' } },
  { id: 'jam', label: 'Jamun', v: { tone: 'jam', btn: 'lip', font: 'geist', corner: '10' } },
]

/* Colour gallery. A theme sets style (+ tone for Pop); buttons, type and corners stay as tuned. */
const T = (id) => ({ id, label: TONE_BY[id].label, style: 'pop', tone: id, sw: TONE_BY[id] })
export const THEMES = [
  { group: 'Classic', items: [
    { id: 'paper', label: 'Khadi', style: 'paper', sw: { light: ['#fafaf9', '#18181b'], dark: ['#0f0f10', '#ececee'] } },
    { id: 'ink', label: 'Kajal', style: 'ink', sw: { light: ['#08080a', '#5fcf86'], dark: ['#08080a', '#5fcf86'] } },
  ] },
  { group: 'WLDD colours', items: ['sand', 'sage', 'haze', 'clay'].map(T) },
  { group: 'Fresh', items: ['slate', 'dune', 'lagoon', 'mono'].map(T) },
  { group: 'Best of both', items: [T('jam')] },
  { group: 'Vision assistive', items: ['hc', 'safe'].map(T) },
]
export const themeActive = (t, style, tune) => t.style === style && (style !== 'pop' || tune.tone === t.tone)

export const normTune = (t) => Object.fromEntries(TUNE_AXES.map((a) => [a.id, a.opts.some((o) => o.id === t?.[a.id]) ? t[a.id] : PRESETS[0].v[a.id]]))
export const presetOf = (t) => PRESETS.find((p) => TUNE_AXES.every((a) => p.v[a.id] === t[a.id]))
export const toneSwatch = (t) => TONE_BY[t.tone].light

export function applyTune(t) {
  const d = document.documentElement.dataset
  d.popTone = t.tone; d.popBtn = t.btn; d.popFont = t.font; d.popCorner = t.corner
}
export function clearTune() {
  const d = document.documentElement.dataset
  delete d.popTone; delete d.popBtn; delete d.popFont; delete d.popCorner
}

const Glyph = ({ axis, o }) => {
  if (axis === 'tone') return <span className="pt-sw" style={{ background: o.sw[0] }}><i style={{ background: o.sw[1] }} /></span>
  if (axis === 'font') return <span className="pt-aa" style={{ fontFamily: o.ff }}>Aa</span>
  if (axis === 'corner') return <span className="pt-cr" style={{ borderTopLeftRadius: +o.id }} />
  return <span className={'pt-bt ' + o.id} />
}

/** Mix-and-match panel. `axes` limits which rows show (Settings hides tone/type, which have their own pickers). */
export function PopTuner({ tune, setTune, axes, presets = true }) {
  const [copied, setCopied] = useState(false)
  const cur = presetOf(tune)
  const copy = () => {
    const u = new URL(location.href)
    u.searchParams.set('style', 'pop')
    TUNE_AXES.forEach((a) => u.searchParams.set(a.id, tune[a.id]))
    navigator.clipboard?.writeText(u.toString())
    setCopied(true); setTimeout(() => setCopied(false), 1400)
  }
  return (
    <div className="pt">
      {presets && (
        <div className="pt-presets">
          {PRESETS.map((p) => {
            const sw = toneSwatch(p.v)
            return (
              <button key={p.id} className={'pt-preset' + (cur?.id === p.id ? ' on' : '')} onClick={() => setTune(p.v)}>
                <span className="pt-sw lg" style={{ background: sw[0] }}><i style={{ background: sw[1] }} /></span>{p.label}
              </button>
            )
          })}
        </div>
      )}
      {TUNE_AXES.filter((a) => !axes || axes.includes(a.id)).map((a) => (
        <div key={a.id} className="pt-row">
          <span className="pt-l">{a.label}</span>
          <div className={'pt-opts' + (a.id === 'tone' ? ' many' : '')}>
            {a.opts.map((o) => (
              <Tip key={o.id} label={o.label}>
                <button className={'pt-o' + (tune[a.id] === o.id ? ' on' : '')} aria-label={a.label + ' ' + o.label} onClick={() => setTune({ ...tune, [a.id]: o.id })}>
                  <Glyph axis={a.id} o={o} />
                </button>
              </Tip>
            ))}
          </div>
        </div>
      ))}
      <div className="pt-foot">
        <span className="mono mute ell">{cur ? cur.label : 'Custom'}</span>
        <Tip label="Copy link to this mix"><button className="pt-copy" onClick={copy} aria-label="Copy link">{copied ? <Check size={13} /> : <Link2 size={13} />}</button></Tip>
      </div>
    </div>
  )
}
