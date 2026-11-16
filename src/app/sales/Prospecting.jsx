// Layout 2 · Prospecting: one global filter over Signals, Companies, People, Inbound and Moments.
import { useState } from 'react'
import { ArrowUp, ArrowDown, ArrowUpDown, Check } from 'lucide-react'
import { Popover, Tabs } from '../ui'
import { Src } from './ui'
import { useProspect, FilterTop, FilterFrame, SigRow, CoRow, PersonRow, InboundRow, MomentRow, BeyondRow, BulkBar } from './kit'
import { isKnown } from './prospect'

const TABS = { signals: 'Signals', companies: 'Companies', people: 'People', inbound: 'Inbound', moments: 'Moments' }
const ORDER0 = Object.keys(TABS)
const readOrder = () => { try { const o = JSON.parse(localStorage.getItem('wldd-bdv-tabs') || 'null'); if (Array.isArray(o) && o.length === ORDER0.length && ORDER0.every((k) => o.includes(k))) return o } catch {} return ORDER0 }
const readTab = () => { try { return localStorage.getItem('wldd-bdv-tab') || 'signals' } catch { return 'signals' } }

/** Reorder the entity tabs; kept per browser. */
function Arrange({ order, setOrder }) {
  const move = (i, d) => { const o = [...order]; const [x] = o.splice(i, 1); o.splice(i + d, 0, x); setOrder(o) }
  return (
    <Popover width={220} trigger={({ toggle, open }) => (
      <button className={'b ghost icon sm' + (open ? ' on' : '')} onClick={toggle} aria-label="Arrange tabs"><ArrowUpDown size={14} /></button>
    )}>
      {() => (
        <div className="bdv-arr">
          <div className="pop-h">Tab order</div>
          {order.map((k, i) => (
            <div key={k} className="bdv-arr-r">
              <span className="grow">{TABS[k]}</span>
              <button className="b ghost icon sm" disabled={i === 0} onClick={() => move(i, -1)} aria-label={'Move ' + TABS[k] + ' up'}><ArrowUp size={13} /></button>
              <button className="b ghost icon sm" disabled={i === order.length - 1} onClick={() => move(i, 1)} aria-label={'Move ' + TABS[k] + ' down'}><ArrowDown size={13} /></button>
            </div>
          ))}
        </div>
      )}
    </Popover>
  )
}

export function Prospect() {
  const { st, res } = useProspect()
  const [order, setOrderRaw] = useState(readOrder)
  const [tab, setTabRaw] = useState(readTab)
  const [pick, setPick] = useState([])
  const setOrder = (o) => { setOrderRaw(o); try { localStorage.setItem('wldd-bdv-tabs', JSON.stringify(o)) } catch {} }
  const setTab = (t) => { setTabRaw(t); try { localStorage.setItem('wldd-bdv-tab', t) } catch {} }
  const n = { signals: res.signals.length, companies: res.companies.length, people: res.people.length, inbound: res.inbound.length, moments: res.moments.length }
  const max = Math.max(1, ...res.companies.map((x) => x.sigs.length))
  const locked = res.people.filter((p) => !isKnown(p, st))
  const tog = (p) => setPick((l) => (l.includes(p.id) ? l.filter((x) => x !== p.id) : [...l, p.id]))
  return (
    <FilterFrame>
    <div className="d-page wide bdv-page">
      <div className="d-head"><h1 className="d-h1">Prospecting</h1></div>
      <FilterTop />
      <div className="bdv-tabrow">
        <Tabs id="bdv-pt" value={tab} onChange={setTab} options={order.map((k) => ({ value: k, label: TABS[k], count: n[k] }))} />
        <Arrange order={order} setOrder={setOrder} />
      </div>
      {tab === 'signals' && (
        <div className="bdv-list">
          {res.signals.map((g) => <SigRow key={g.id} g={g} />)}
          {!res.signals.length && <Empty />}
        </div>
      )}
      {tab === 'companies' && (
        <div className="list bdv-list">
          <div className="bdv-lh"><span className="grow">Sorted by matching signals</span><Src s="Signals engine" /></div>
          {res.companies.map(({ c, sigs }) => <CoRow key={c.id} c={c} n={sigs.length} max={max} />)}
          {!res.companies.length && <Empty />}
          <BeyondRow kind="companies" />
        </div>
      )}
      {tab === 'people' && (
        <div className="bdv-list">
          <BulkBar pick={pick} all={locked} setPick={setPick} />
          <div className="list">{res.people.map((p) => <PersonRow key={p.id} p={p} picked={pick.includes(p.id)} onPick={tog} />)}</div>
          {!res.people.length && <Empty />}
          <BeyondRow kind="people" />
        </div>
      )}
      {tab === 'inbound' && (
        <div className="list bdv-list">
          {res.inbound.map((x) => <InboundRow key={x.id} x={x} />)}
          {!res.inbound.length && <Empty />}
        </div>
      )}
      {tab === 'moments' && (
        <div className="list bdv-list">
          {res.moments.map((m) => <MomentRow key={m.id} m={m} />)}
          {!res.moments.length && <Empty />}
        </div>
      )}
    </div>
    </FilterFrame>
  )
}
export const Empty = () => <div className="empty"><Check size={18} /><b>No matches</b></div>
