import { useMemo, useState } from 'react'
import { Search, Check, ArrowUp, ArrowDown, ListFilter } from 'lucide-react'
import { useStore } from '../store'
import { clients, industries, fmt } from '../data'
import { kbTotal } from '../../data'
import { useSort } from '../../shared/state'
import { Avatar } from '../../shared/ui'
import { Ticker } from '../../shared/motion'
import { ClientLogo, Popover, Track, go } from '../ui'
import { Sheet } from './Finance'

export default function Knowledge({ base, id }) {
  const s = useStore()
  const [q, setQ] = useState('')
  const [ind, setInd] = useState(null)
  const rows = useMemo(() => clients.filter((c) => (!ind || c.industry === ind) && c.name.toLowerCase().includes(q.toLowerCase())), [q, ind])
  const [sorted, sort, toggle] = useSort(rows, { key: 'campaigns', dir: 'desc' })
  const cur = clients.find((c) => c.id === id)
  const history = cur ? s.campaigns.filter((c) => c.client === cur.name) : []
  const Th = ({ k, children, r }) => (
    <th className={r ? 'r' : ''}><button className={'th-b' + (sort.key === k ? ' on' : '')} onClick={() => toggle(k)}>{children}{sort.key === k && (sort.dir === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />)}</button></th>
  )
  return (
    <div className="d-page">
      <div className="d-head">
        <h1 className="d-h1">Knowledge base <span className="mute num" style={{ fontWeight: 500 }}>{kbTotal}</span></h1>
        <div className="inp" style={{ width: 240 }}><Search size={14} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search clients" /></div>
        <Popover width={220} trigger={({ toggle: t }) => <button className="b" onClick={t}><ListFilter size={14} />{ind || 'Industry'}</button>}>
          {(close) => [null, ...industries].map((i) => <button key={i || 'all'} onClick={() => { setInd(i); close() }}>{i || 'All industries'}{ind === i && <Check size={14} style={{ marginLeft: 'auto' }} />}</button>)}
        </Popover>
      </div>
      <table className="tbl">
        <thead><tr><Th k="name">Client</Th><Th k="industry">Industry</Th><Th k="campaigns" r>Campaigns</Th><Th k="spend" r>Billing</Th><Th k="lastCampaign">Last</Th><th>Owner</th></tr></thead>
        <tbody>
          {sorted.map((c) => (
            <tr key={c.id} className="click" onClick={() => go(`${base}/${c.id}`)}>
              <td><span className="row"><ClientLogo name={c.name} industry={c.industry} /><b style={{ fontWeight: 500 }}>{c.name}</b></span></td>
              <td className="fg2">{c.industry}</td>
              <td className="r num">{c.campaigns}</td>
              <td className="r num fg2">{fmt.inr(c.spend)}</td>
              <td className="fg2">{fmt.ago(c.lastCampaign)}</td>
              <td><Avatar user={c.owner} size={20} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <Sheet open={!!cur} onClose={() => go(base)} width={480}>
        {cur && (
          <div className="inv-d">
            <ClientLogo name={cur.name} industry={cur.industry} size="lg" />
            <h2 className="d-h1" style={{ marginTop: 12 }}>{cur.name}</h2>
            <div className="mute">{cur.industry} · since {cur.since}</div>
            <div className="metrics" style={{ marginTop: 20, gridTemplateColumns: '1fr 1fr' }}>
              <div className="metric"><span className="metric-l">Campaigns</span><span className="metric-v num"><Ticker value={cur.campaigns} /></span></div>
              <div className="metric"><span className="metric-l">Billing</span><span className="metric-v num">{fmt.inr(cur.spend)}</span></div>
            </div>
            <div className="group-h">Recent</div>
            <div className="list">
              {history.length ? history.map((c) => (
                <a key={c.id} href={`#/pod/campaigns/${c.id}`} className="li"><span className="grow ell li-t">{c.activity}</span><Track stage={c.stage} /><span className="mute xs num">{fmt.inr(c.budget)}</span></a>
              )) : <div className="mute" style={{ padding: '8px 0' }}>{cur.campaigns} past campaigns archived</div>}
            </div>
          </div>
        )}
      </Sheet>
    </div>
  )
}
