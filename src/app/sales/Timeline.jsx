// Pipeline · Timeline: each deal as a bar from created to expected close, across weeks, with today marked.
import { useMemo } from 'react'
import { fmt, TODAY } from '../data'
import { Tip } from '../../shared/motion'
import { BrandLogo } from '../../shared/brands'
import { go } from '../ui'
import { stageIx } from './data'
import { stageLabel } from './state'

const D = 864e5
/** Days still to go, from the stage a deal is in. */
const REMAIN = { new: 35, brief: 28, negotiation: 18, pitch: 10 }
export function closeOf(d) {
  if (d.stage === 'won' || d.stage === 'lost') return d.updated
  return new Date(Math.max(TODAY.getTime() + REMAIN[d.stage] * D, d.created.getTime() + 7 * D))
}
const monday = (t) => { const d = new Date(t); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d }

export function DealTimeline({ deals }) {
  const rows = useMemo(() => deals.map((d) => ({ d, a: d.created, b: closeOf(d) }))
    .sort((x, y) => (x.d.stage === 'lost') - (y.d.stage === 'lost') || stageIx(y.d.stage) - stageIx(x.d.stage) || x.b - y.b), [deals])
  if (!rows.length) return <div className="empty"><b>No deals</b></div>
  const start = monday(Math.min(...rows.map((r) => r.a.getTime())))
  const end = new Date(monday(Math.max(...rows.map((r) => r.b.getTime()))).getTime() + 7 * D)
  const span = end - start
  const weeks = Array.from({ length: Math.round(span / (7 * D)) }, (_, i) => new Date(start.getTime() + i * 7 * D))
  const pct = (t) => ((t - start) / span) * 100
  const today = pct(TODAY)
  const step = weeks.length > 14 ? 2 : 1
  return (
    <div className="bdv-tlv" style={{ '--today': today + '%' }}>
      <div className="bdv-tlv-h">
        <span className="bdv-tlv-n" />
        <div className="bdv-tlv-s">
          {weeks.map((w, i) => i % step === 0 && <span key={i} className={'bdv-tlv-w' + (i % 2 ? ' odd' : '')} style={{ left: pct(w) + '%' }}>{fmt.date(w)}</span>)}
          <span className="bdv-tlv-today" style={{ left: today + '%' }}>Today</span>
        </div>
      </div>
      {rows.map(({ d, a, b }) => (
        <button key={d.id} className="bdv-tlv-r" data-ent={JSON.stringify({ kind: 'deal', id: d.id, label: d.brand + ' deal', brand: d.brand })} onClick={() => go('/bd/pipeline/' + d.id)}>
          <span className="bdv-tlv-n"><BrandLogo name={d.brand} size={18} /><span className="ell">{d.brand}</span><span className="mute num xs">{fmt.inr(d.value)}</span></span>
          <span className="bdv-tlv-s">
            {weeks.map((w, i) => <i key={i} className="bdv-tlv-g" style={{ left: pct(w) + '%' }} />)}
            <i className="bdv-tlv-t" />
            <span className={'bdv-tlv-bar s-' + d.stage} style={{ left: pct(a) + '%', width: Math.max(1.2, pct(b) - pct(a)) + '%' }}>
              <Tip label={`${stageLabel(d.stage)} · ${fmt.date(a)} → ${fmt.date(b)}${d.stage === 'won' || d.stage === 'lost' ? '' : ' expected'}`}><span className="bdv-tlv-fill ell">{stageLabel(d.stage)}</span></Tip>
            </span>
          </span>
        </button>
      ))}
    </div>
  )
}
