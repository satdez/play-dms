// Sales portal pages: Feed, Discover, Inbound, Accounts, Contacts, Pipeline, Case Library.
import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  Search, X, ThumbsUp, ThumbsDown, ArrowRight, ArrowUpRight, Hourglass, Mail, Globe, Check, Bookmark, Plus, KeyRound, UserCheck,
  ClipboardPaste, Wand2, Presentation, LayoutGrid, List as ListIcon, CalendarDays, TrendingDown, RefreshCw, Sparkle, Ban, Clock,
} from 'lucide-react'
import { toast } from 'sonner'
import { useStore } from '../store'
import { fmt, SERVICES, me } from '../data'
import { ConfirmButton, Tip, AutoHeight, Swap, SlidePanel, Ticker, EASE } from '../../shared/motion'
import { Avatar, AreaChart } from '../../shared/ui'
import { BrandLogo } from '../../shared/brands'
import { Seg, Svc, Select, Track, go } from '../ui'
import { Sheet } from '../pages/Finance'
import { brands, brandById, brandOf, budgetOf, repOf, REPS, cases, caseById, DEAL_STAGES, SIGNAL_KIND, now, ago } from './data'
import { relOf, factsFor, parseNotes, isOpen, isStale, staleDays, stageLabel, RELL } from './state'
import { Src, Rel, Val, Facts, CaseChip, openAddLead, dueOf, DeckViewer, credsDeck } from './ui'

const mine = (x) => x.owner === me.id
const SrcRow = ({ children }) => <span className="sl-srcrow">{children}</span>

/* ═════════ Daily Feed (home) ═════════ */
export function Feed() {
  const s = useStore(); const st = s.sales
  const [kind, setKind] = useState('all')
  const live = st.signals.filter((x) => x.status !== 'dismissed')
  const list = kind === 'dismissed' ? st.signals.filter((x) => x.status === 'dismissed') : live.filter((x) => kind === 'all' || x.kind === kind)
  const kinds = [...new Set(live.map((x) => x.kind))]
  const due = dueOf(st).filter((d) => d.deal.owner === me.id)
  const patch = (id, p) => st.set((x) => ({ signals: x.signals.map((g) => (g.id === id ? { ...g, ...p } : g)) }))
  const rate = (g, r) => { patch(g.id, { rating: g.rating === r ? null : r }); if (g.rating !== r) toast(r === 'up' ? 'More like this' : 'Fewer like this', { description: SIGNAL_KIND[g.kind] + ' signals · feed updated' }) }
  const add = (g) => {
    const b = brandOf(g.brand)
    const p = b?.people.find((x) => x.moved) || b?.people.find((x) => x.onFile)
    openAddLead({ brand: g.brand, source: 'Daily Feed', note: g.title + '. ' + g.angle, contact: p ? { name: p.name, title: p.title, email: p.email } : undefined, ref: { kind: 'signal', id: g.id } })
  }
  return (
    <div className="d-page sl-feed">
      <div className="d-head">
        <h1 className="d-h1">Feed</h1>
        <Seg id="feed" value={kind} onChange={setKind} options={[{ value: 'all', label: 'All', count: live.length }, ...kinds.map((k) => ({ value: k, label: SIGNAL_KIND[k], count: live.filter((x) => x.kind === k).length })), { value: 'dismissed', label: 'Dismissed', count: st.signals.length - live.length }]} />
      </div>
      {due.length > 0 && kind === 'all' && (
        <>
          <div className="group-h">Due <span className="mute num">{due.length}</span></div>
          <div className="list sl-due">
            {due.map((d) => (
              <a key={d.id} href={'#' + d.to} className="li">
                <BrandLogo name={d.deal.brand} size={22} />
                <span className="grow ell"><span className="li-t">{d.text}</span> <span className="mute">· {d.deal.brand}</span></span>
                <span className="chip">{d.kind === 'follow' ? <Clock size={12} /> : <CalendarDays size={12} />}{d.kind === 'follow' ? 'Follow-up' : fmt.ago(d.at)}</span>
                <ArrowUpRight size={14} className="mute" />
              </a>
            ))}
          </div>
        </>
      )}
      <div className="group-h">Signals <span className="mute num">{list.length}</span><span className="grow" /><Src s="Signals engine" /></div>
      <div className="sl-sigs">
        <AnimatePresence initial={false}>
          {list.map((g) => (
            <motion.article key={g.id} layout="position" className="sl-sig" exit={{ opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0, transition: { duration: 0.22, ease: EASE } }}>
              <BrandLogo name={g.brand} size={36} />
              <div className="grow sl-sig-b">
                <div className="row sl-sig-h">
                  <b>{g.brand}</b><span className="chip">{SIGNAL_KIND[g.kind]}</span><span className="mute xs">{fmt.ago(g.at)}</span>
                  <span className="grow" /><Rel rel={g.rel} />
                </div>
                <div className="sl-sig-t">{g.title}</div>
                <dl className="sl-sig-d">
                  <dt>Why it matters</dt><dd>{g.why}</dd>
                  <dt>Pitch angle</dt><dd>{g.angle} <Src s="AI" /></dd>
                </dl>
                <div className="row sl-sig-a">
                  <Tip label="Useful"><button className={'b ghost icon sm' + (g.rating === 'up' ? ' on' : '')} aria-pressed={g.rating === 'up'} onClick={() => rate(g, 'up')} aria-label="Useful"><ThumbsUp size={14} /></button></Tip>
                  <Tip label="Not useful"><button className={'b ghost icon sm' + (g.rating === 'down' ? ' on' : '')} aria-pressed={g.rating === 'down'} onClick={() => rate(g, 'down')} aria-label="Not useful"><ThumbsDown size={14} /></button></Tip>
                  <span className="grow" />
                  {g.status === 'dismissed' ? <button className="b sm" onClick={() => patch(g.id, { status: 'new' })}>Restore</button>
                    : g.status === 'added' ? <a className="b sm" href={'#/bd/pipeline/' + g.deal}><Check size={13} />In pipeline</a> : (
                      <>
                        <button className="b sm ghost" onClick={() => { patch(g.id, { status: 'dismissed' }); toast('Dismissed · ' + g.brand, { action: { label: 'Undo', onClick: () => patch(g.id, { status: 'new' }) } }) }}><X size={13} />Dismiss</button>
                        <button className="b sm" onClick={() => add(g)}><Plus size={13} />Add to pipeline</button>
                      </>
                    )}
                </div>
              </div>
            </motion.article>
          ))}
        </AnimatePresence>
        {!list.length && <div className="empty"><Check size={18} /><b>Clear</b></div>}
      </div>
    </div>
  )
}

/* ═════════ Discover ═════════ */
const CATS = [...new Set(brands.map((b) => b.cat))].sort()
const CITIES = [...new Set(brands.map((b) => b.hq))].sort()
const SIZES = { all: [0, Infinity], small: [0, 5e9], mid: [5e9, 5e10], large: [5e10, Infinity] }
const F0 = { cat: 'all', city: 'all', rel: 'all', size: 'all' }
export function Discover({ id }) {
  const s = useStore(); const st = s.sales
  const [q, setQ] = useState('')
  const [f, setF] = useState(F0)
  const rows = brands.filter((b) => {
    const r = relOf(b.name, st).kind
    const [lo, hi] = SIZES[f.size]
    const t = q.toLowerCase()
    return (f.cat === 'all' || b.cat === f.cat) && (f.city === 'all' || b.hq === f.city) && (f.rel === 'all' || (f.rel === 'warm' ? r === 'moved' || r === 'known' : r === f.rel))
      && (f.size === 'all' || (b.rev && b.rev >= lo && b.rev < hi)) && (!t || (b.name + ' ' + b.cat + ' ' + b.people.map((p) => p.name).join(' ')).toLowerCase().includes(t))
  })
  const people = q.length > 1 ? brands.flatMap((b) => b.people).filter((p) => (p.name + ' ' + p.title).toLowerCase().includes(q.toLowerCase())).slice(0, 6) : []
  const save = () => {
    const label = [f.cat !== 'all' && f.cat, f.city !== 'all' && f.city, f.rel !== 'all' && f.rel, f.size !== 'all' && f.size, q && '“' + q + '”'].filter(Boolean).join(' · ') || 'All brands'
    st.set((x) => ({ saved: [...x.saved, { id: 'ss' + Date.now(), label, q, f }] }))
    toast('Search saved', { description: label })
  }
  const cur = id && brandById(id)
  const opt = (l, all) => [{ id: 'all', label: all }, ...l.map((x) => ({ id: x, label: x }))]
  return (
    <div className="d-page wide sl-disc">
      <div className="d-head">
        <h1 className="d-h1">Discover</h1>
        <div className="inp" style={{ width: 260 }}><Search size={14} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Brands or people" /></div>
        <span className="chip m-hide"><KeyRound size={12} /><span className="num">{st.credits}</span> credits</span>
        <Src s="Apollo" />
      </div>
      <div className="sl-filters">
        <Select align="left" value={f.cat} onChange={(v) => setF({ ...f, cat: v })} options={opt(CATS, 'Any industry')} />
        <Select align="left" value={f.city} onChange={(v) => setF({ ...f, city: v })} options={opt(CITIES, 'Any city')} />
        <Select align="left" value={f.size} onChange={(v) => setF({ ...f, size: v })} options={[{ id: 'all', label: 'Any size' }, { id: 'small', label: 'Under ₹500Cr' }, { id: 'mid', label: '₹500Cr–5,000Cr' }, { id: 'large', label: 'Over ₹5,000Cr' }]} />
        <Seg id="drel" value={f.rel} onChange={(v) => setF({ ...f, rel: v })} options={[{ value: 'all', label: 'All' }, { value: 'client', label: 'Clients' }, { value: 'warm', label: 'Warm' }, { value: 'cold', label: 'Cold' }]} />
        <span className="grow" />
        <button className="b sm ghost" onClick={save}><Bookmark size={13} />Save search</button>
      </div>
      <div className="sl-saved">
        {st.saved.map((x) => (
          <span key={x.id} className="chip sl-sv">
            <button onClick={() => { setF(x.f); setQ(x.q) }}><Bookmark size={11} />{x.label}</button>
            <button aria-label="Remove" onClick={() => st.set((y) => ({ saved: y.saved.filter((z) => z.id !== x.id) }))}><X size={11} /></button>
          </span>
        ))}
      </div>
      {people.length > 0 && (
        <>
          <div className="group-h">People <span className="mute num">{people.length}</span></div>
          <div className="list">{people.map((p) => (
            <a key={p.id} className="li" href={'#/bd/discover/' + brandOf(p.brand).id}>
              <Avatar user={{ name: p.name, hue: p.name.length * 37 }} size={24} />
              <span className="grow ell"><span className="li-t">{p.name}</span> <span className="mute">· {p.title}</span></span>
              <BrandLogo name={p.brand} size={18} /><span className="fg2 m-hide">{p.brand}</span>
            </a>
          ))}</div>
        </>
      )}
      <div className="group-h">Brands <span className="mute num">{rows.length}</span></div>
      <table className="tbl sl-tbl">
        <thead><tr><th>Brand</th><th>Industry</th><th>HQ</th><th className="r">Revenue</th><th className="r">Creator budget</th><th>Relationship</th></tr></thead>
        <tbody>
          {rows.map((b) => (
            <tr key={b.id} className="click" onClick={() => go('/bd/discover/' + b.id)}>
              <td><span className="row"><BrandLogo name={b.name} size={22} /><b style={{ fontWeight: 500 }}>{b.name}</b></span></td>
              <td className="fg2">{b.cat}</td>
              <td className="fg2">{b.hq}</td>
              <td className="r num"><Val v={b.rev && fmt.inr(b.rev)} /></td>
              <td className="r num"><Val v={budgetOf(b) && fmt.inr(budgetOf(b).annual)} /></td>
              <td><Rel rel={relOf(b.name, st)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && <div className="empty"><Search size={18} /><b>No matches</b></div>}
      <Sheet open={!!cur} onClose={() => go('/bd/discover')} width={640}>{cur && <BrandProfile b={cur} />}</Sheet>
    </div>
  )
}

function BrandProfile({ b }) {
  const s = useStore(); const st = s.sales
  const [tab, setTab] = useState('overview')
  const [pick, setPick] = useState(null)
  const bud = budgetOf(b)
  const rel = relOf(b.name, st)
  const tabs = ['overview', 'people', 'budget']
  return (
    <div className="sl-prof">
      <div className="row" style={{ gap: 12 }}>
        <BrandLogo name={b.name} size={40} />
        <div className="grow"><h2 className="d-h1" style={{ fontSize: 20 }}>{b.name}</h2><div className="mute xs">{b.domain} · {b.hq}</div></div>
      </div>
      <div className="row" style={{ marginTop: 12, flexWrap: 'wrap' }}><Rel rel={rel} />{rel.note && <span className="mute xs">{rel.note}</span>}<span className="grow" /><span className="chip"><KeyRound size={12} /><span className="num">{st.credits}</span> credits</span></div>
      <div style={{ marginTop: 16 }}><Seg id="prof" value={tab} onChange={setTab} options={[{ value: 'overview', label: 'Overview' }, { value: 'people', label: 'People', count: b.people.length }, { value: 'budget', label: 'Budget' }]} /></div>
      <SlidePanel k={tab} index={tabs.indexOf(tab)} style={{ marginTop: 16 }}>
        {tab === 'overview' && (
          <>
            <p className="fg2" style={{ margin: '0 0 14px' }}>{b.about} <Src s="Apollo" /></p>
            <Facts facts={factsFor(b.name, st)} cols={1} />
          </>
        )}
        {tab === 'people' && (
          <div className="list">
            {b.people.map((p) => <Person key={p.id} p={p} open={pick === p.id} onOpen={() => setPick(pick === p.id ? null : p.id)} />)}
          </div>
        )}
        {tab === 'budget' && (bud ? (
          <div className="sl-bud">
            <div className="sl-bud-r"><span>Revenue</span><b className="num">{fmt.inr(bud.rev)}</b><Src s="Apollo" /></div>
            <div className="sl-bud-r"><span>× Marketing share, {b.cat}</span><b className="num">{Math.round(bud.mkt * 100)}%</b><Src s="AI" /></div>
            <div className="sl-bud-r"><span>× Creator and social slice</span><b className="num">{Math.round(bud.social * 100)}%</b><Src s="AI" /></div>
            <div className="sl-bud-r tot"><span>Creator budget, a year</span><b className="num">{fmt.inr(bud.annual)}</b></div>
            <div className="sl-bud-r"><span>× Share one agency wins</span><b className="num">{Math.round(bud.wallet * 100)}%</b><Src s="AI" /></div>
            <div className="sl-bud-r tot"><span>Our deal size</span><b className="num">{fmt.inr(bud.ours)}</b></div>
          </div>
        ) : <div className="empty"><b>Unknown</b><span>Revenue not on Apollo</span></div>)}
      </SlidePanel>
      <div className="inv-actions">
        <button className="b ink" onClick={() => openAddLead({ brand: b.name, source: 'Discover' })}><Plus size={14} />Add to pipeline</button>
      </div>
    </div>
  )
}

/** "Do we already know this person?" Yes: free. No: reveal on Apollo for a credit. */
function Person({ p, open, onOpen }) {
  const s = useStore(); const st = s.sales
  const known = p.onFile
  const revealed = known || st.revealed.includes(p.id)
  const [busy, setBusy] = useState(false)
  const reveal = () => {
    if (st.credits < 1) return toast('Out of credits')
    setBusy(true)
    setTimeout(() => { st.set((x) => ({ revealed: [...x.revealed, p.id], credits: x.credits - 1 })); setBusy(false); toast('Contact revealed', { description: p.name + ' · 1 Apollo credit' }) }, 700)
  }
  return (
    <div className={'sl-person' + (open ? ' open' : '')}>
      <button className="li" onClick={onOpen} aria-expanded={open}>
        <Avatar user={{ name: p.name, hue: p.name.length * 37 }} size={26} />
        <span className="grow" style={{ minWidth: 0, textAlign: 'left' }}><span className="li-t ell" style={{ display: 'block' }}>{p.name}</span><span className="li-s ell" style={{ display: 'block' }}>{p.title} · {p.city}</span></span>
        {p.moved && <Tip label={'Worked with us at ' + p.moved}><span className="chip y">Ex-{p.moved}</span></Tip>}
        {known ? <span className="chip g"><UserCheck size={12} />On file</span> : revealed ? <span className="chip">Revealed</span> : null}
      </button>
      <AutoHeight>
        {open && (
          <div className="sl-know">
            <div className="sl-know-q">Do we already know {p.name.split(' ')[0]}?</div>
            {revealed ? (
              <div className="sl-know-a">
                <div className="row"><b>{known ? 'Yes · contact free, already on file' : 'Revealed'}</b><Src s={known ? 'Gmail' : 'Apollo'} /></div>
                <div className="mono fg2" style={{ marginTop: 6 }}>{p.email}{p.phone && <> · {p.phone}</>}</div>
              </div>
            ) : (
              <div className="sl-know-a">
                <div className="row"><b>No · not on file</b></div>
                <div className="row" style={{ marginTop: 8 }}>
                  <button className="b sm" disabled={busy} onClick={reveal}><KeyRound size={13} />{busy ? 'Revealing…' : 'Reveal contact'}</button>
                  <Src s="Apollo" /><span className="mute xs">1 credit</span>
                </div>
              </div>
            )}
            <div className="row" style={{ marginTop: 10, justifyContent: 'flex-end' }}>
              <button className={'b sm ink' + (revealed ? '' : ' dis')} disabled={!revealed} onClick={() => openAddLead({ brand: p.brand, source: 'Discover', contact: { name: p.name, title: p.title, email: p.email } })}><Plus size={13} />Add to pipeline</button>
            </div>
          </div>
        )}
      </AutoHeight>
    </div>
  )
}

/* ═════════ Inbound ═════════ */
export function Inbound() {
  const s = useStore(); const st = s.sales
  const [f, setF] = useState('all')
  const [sel, setSel] = useState(null)
  const [showEmail, setShowEmail] = useState(true)
  const open = st.inbound.filter((x) => x.status === 'open')
  const pass = (x) => f === 'all' || (f === 'unclaimed' ? !x.owner : f === 'mine' ? x.owner === me.id : x.owner && x.owner !== me.id)
  const list = open.filter(pass)
  const cur = list.find((x) => x.id === sel) || list[0]
  const reject = (x) => { st.set((y) => ({ inbound: y.inbound.map((z) => (z.id === x.id ? { ...z, status: 'rejected' } : z)) })); toast('Rejected · ' + x.company, { action: { label: 'Undo', onClick: () => st.set((y) => ({ inbound: y.inbound.map((z) => (z.id === x.id ? { ...z, status: 'open' } : z)) })) } }) }
  const add = (x) => { if (!x.owner) st.claim(x.id); openAddLead({ brand: x.company, source: 'Inbound', value: String(x.budget / 1e5), contact: { name: x.name, title: '', email: x.email }, note: x.summary, ref: { kind: 'inbound', id: x.id } }) }
  return (
    <div className="split sl-inb">
      <div className="split-l">
        <div style={{ padding: '10px 0 8px' }}><Seg id="inb" value={f} onChange={setF} options={[{ value: 'all', label: 'All', count: open.length }, { value: 'unclaimed', label: 'Unclaimed', count: open.filter((x) => !x.owner).length }, { value: 'mine', label: 'Mine', count: open.filter((x) => x.owner === me.id).length }, { value: 'team', label: 'Team', count: open.filter((x) => x.owner && x.owner !== me.id).length }]} /></div>
        <div className="list">
          <AnimatePresence initial={false}>
            {list.map((r) => (
              <motion.button key={r.id} layout="position" className={'li inv-li' + (r.id === cur?.id ? ' sel' : '')} onClick={() => setSel(r.id)} exit={{ opacity: 0, height: 0, minHeight: 0, transition: { duration: 0.2, ease: EASE } }}>
                <div className="grow">
                  <div className="row"><BrandLogo name={r.company} size={20} /><span className="li-t ell grow">{r.company}</span>{r.owner ? <Tip label={'Owned by ' + repOf(r.owner).short}><span><Avatar user={repOf(r.owner)} size={18} /></span></Tip> : <span className="chip y">Unclaimed</span>}<span className="mute xs">{fmt.agoShort(r.at)}</span></div>
                  <div className="li-s ell">{r.summary}</div>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
          {!list.length && <div className="empty"><Check size={18} /><b>Clear</b></div>}
        </div>
      </div>
      <div className="split-r">
        {cur && (
          <Swap k={cur.id}>
            <div className="inv-d">
              <div className="row" style={{ alignItems: 'flex-start' }}>
                <div className="grow">
                  <div className="mute xs row" style={{ gap: 6 }}>{cur.source === 'email' ? <Mail size={12} /> : <Globe size={12} />}{cur.name} · <span className="mono">{cur.email}</span><Src s={cur.source === 'email' ? 'Gmail' : 'DMS'} /></div>
                  <h2 className="d-h1 row" style={{ marginTop: 6, gap: 12 }}><BrandLogo name={cur.company} size={32} />{cur.company}</h2>
                </div>
                <div className="metric-v num">{fmt.inr(cur.budget)}</div>
              </div>
              <div className="sl-owner">
                <span className="mute">Owner</span>
                {cur.owner ? <span className="row"><Avatar user={repOf(cur.owner)} size={20} /><b style={{ fontWeight: 500 }}>{cur.owner === me.id ? 'You' : repOf(cur.owner).name}</b></span> : <span className="chip y">Unclaimed</span>}
                <span className="grow" />
                {!cur.owner && <ConfirmButton className="b sm" label="Claim" doneLabel="Yours" icon={<UserCheck size={13} />} onDone={() => { st.claim(cur.id); toast('Claimed · ' + cur.company) }} />}
              </div>
              <p className="brief" style={{ marginTop: 16 }}>{cur.summary}</p>
              {cur.body && <pre className="email">{cur.body}</pre>}
              {!cur.body && <div className="mute xs" style={{ marginTop: 10 }}>Web form · no message</div>}
              <div className="inv-actions">
                <button className="b" onClick={() => reject(cur)}><Ban size={14} />Reject</button>
                {cur.owner && cur.owner !== me.id
                  ? <Tip label={'Owned by ' + repOf(cur.owner).short}><button className="b ink dis" disabled>Add to pipeline</button></Tip>
                  : <button className="b ink" onClick={() => add(cur)}><Plus size={14} />Add to pipeline</button>}
              </div>
            </div>
          </Swap>
        )}
      </div>
    </div>
  )
}

/* ═════════ Accounts ═════════ */
export function Accounts({ id }) {
  const s = useStore(); const st = s.sales
  const [f, setF] = useState('all')
  const rows = st.accounts.filter((a) => f === 'all' || (f === 'alerts' ? a.alerts.length : a.owner === me.id))
  const total = st.accounts.reduce((t, a) => t + a.spend, 0)
  const opps = st.accounts.flatMap((a) => a.opps.filter((o) => !o.deal))
  const cur = id && st.accounts.find((a) => a.id === id)
  return (
    <div className="d-page wide">
      <div className="d-head">
        <h1 className="d-h1">Accounts</h1>
        <Seg id="acc" value={f} onChange={setF} options={[{ value: 'all', label: 'All', count: st.accounts.length }, { value: 'alerts', label: 'Alerts', count: st.accounts.filter((a) => a.alerts.length).length }, { value: 'mine', label: 'Mine', count: st.accounts.filter(mine).length }]} />
      </div>
      <div className="metrics sl-m4">
        <div className="metric"><span className="metric-l">Spend, 12 months</span><span className="metric-v num"><Ticker value={total} format={(n) => fmt.inr(Math.round(n))} /></span></div>
        <div className="metric"><span className="metric-l">Alerts</span><span className="metric-v num"><Ticker value={st.accounts.reduce((t, a) => t + a.alerts.length, 0)} /></span></div>
        <div className="metric"><span className="metric-l">Upsell and renewal</span><span className="metric-v num"><Ticker value={opps.reduce((t, o) => t + o.value, 0)} format={(n) => fmt.inr(Math.round(n))} /></span></div>
      </div>
      <table className="tbl sl-tbl" style={{ marginTop: 16 }}>
        <thead><tr><th>Account</th><th>Owner</th><th className="r">Spend</th><th className="r">vs last year</th><th>Services</th><th>Renewal</th><th>Alerts</th></tr></thead>
        <tbody>
          {rows.map((a) => {
            const dlt = a.prev ? Math.round(((a.spend - a.prev) / a.prev) * 100) : null
            return (
              <tr key={a.id} className="click" onClick={() => go('/bd/accounts/' + a.id)}>
                <td><span className="row"><BrandLogo name={a.brand} size={22} /><b style={{ fontWeight: 500 }}>{a.brand}</b>{a.fresh && <span className="chip g">New</span>}</span></td>
                <td><Avatar user={repOf(a.owner)} size={20} /></td>
                <td className="r num">{fmt.inr(a.spend)}</td>
                <td className={'r num ' + (dlt < 0 ? 'sl-down' : 'fg2')}>{dlt == null ? '—' : (dlt > 0 ? '+' : '') + dlt + '%'}</td>
                <td><Svc list={a.services} /></td>
                <td className="fg2">{fmt.date(a.renewal)}</td>
                <td><span className="row" style={{ gap: 4 }}>{a.alerts.map((x) => <span key={x.text} className={'chip ' + (x.kind === 'drop' ? 'p' : 'y')}>{x.kind === 'drop' ? <TrendingDown size={12} /> : <RefreshCw size={12} />}{x.text}</span>)}</span></td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <Sheet open={!!cur} onClose={() => go('/bd/accounts')} width={600}>{cur && <AccountSheet a={cur} />}</Sheet>
    </div>
  )
}
function AccountSheet({ a }) {
  const s = useStore()
  const series = useMemo(() => Array.from({ length: 12 }, (_, i) => Math.round((a.prev + ((a.spend - a.prev) * i) / 11) / 12 * (0.75 + ((i * 7) % 5) / 10))), [a])
  const camps = s.campaigns.filter((c) => c.client === a.brand)
  return (
    <div className="inv-d">
      <div className="row" style={{ gap: 12 }}><BrandLogo name={a.brand} size={40} /><div className="grow"><h2 className="d-h1" style={{ fontSize: 20 }}>{a.brand}</h2><div className="mute xs">Client since {a.since} · {repOf(a.owner).name}</div></div></div>
      <div className="kv-grid" style={{ marginTop: 20 }}>
        <div><span>Spend, 12 months</span><span className="num">{fmt.inr(a.spend)}</span></div>
        <div><span>Year before</span><span className="num">{a.prev ? fmt.inr(a.prev) : '—'}</span></div>
        <div><span>Last campaign</span><span>{fmt.ago(a.last)}</span></div>
        <div><span>Renewal</span><span>{fmt.date(a.renewal)}</span></div>
      </div>
      <div style={{ marginTop: 16, color: 'var(--fg)' }}><AreaChart data={series} labels={['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov']} height={120} color="var(--yellow)" format={fmt.inr} grid={false} /></div>
      <div className="group-h">Services bought</div>
      <Svc list={a.services} />
      {a.alerts.length > 0 && <><div className="group-h">Alerts</div><div className="row" style={{ flexWrap: 'wrap' }}>{a.alerts.map((x) => <span key={x.text} className={'chip ' + (x.kind === 'drop' ? 'p' : 'y')}>{x.text}</span>)}<Src s="DMS" /></div></>}
      <div className="group-h">Upsell and renewal <Src s="AI" /></div>
      <div className="list">
        {a.opps.map((o) => (
          <div key={o.id} className="li sl-opp">
            <span className={'chip ' + (o.kind === 'renewal' ? 'y' : 'g')}>{o.kind === 'renewal' ? 'Renewal' : 'Upsell'}</span>
            <div className="grow" style={{ padding: '10px 0' }}><div className="li-t">{o.title}</div><div className="li-s">{o.why}</div></div>
            <span className="num fw5">{fmt.inr(o.value)}</span>
            {o.deal ? <a className="b sm" href={'#/bd/pipeline/' + o.deal}><Check size={13} />In pipeline</a>
              : <button className="b sm" onClick={() => openAddLead({ brand: a.brand, source: 'Accounts', value: String(o.value / 1e5), services: a.services, note: o.title + '. ' + o.why, next: o.kind === 'renewal' ? 'Book the renewal call' : 'Send the upsell idea', ref: { kind: 'opp', id: o.id } })}><Plus size={13} />Add to pipeline</button>}
          </div>
        ))}
        {!a.opps.length && <div className="mute" style={{ padding: '8px 0' }}>None spotted</div>}
      </div>
      {camps.length > 0 && (
        <>
          <div className="group-h">Campaigns <span className="mute num">{camps.length}</span></div>
          <div className="list">{camps.map((c) => <a key={c.id} className="li" href={'#/pod/campaigns/' + c.id}><span className="grow ell">{c.name}</span><Track stage={c.stage} /><span className="num fg2">{fmt.inr(c.budget)}</span></a>)}</div>
        </>
      )}
    </div>
  )
}

/* ═════════ Own contacts ═════════ */
const CSRC = ['Event', 'Referral', 'LinkedIn', 'Cold call']
const EXAMPLE = `[10:42] Juhi: hey! great meeting you at the D2C summit yesterday
[10:43] Juhi: looping in my colleague Tanvi Saxena, she's Head of Brand at Blue Tokai, tanvi.saxena@bluetokaicoffee.com
[10:44] Juhi: they're opening 100 cafés next year, budget around ₹25L`
export function Contacts() {
  const s = useStore(); const st = s.sales
  const [f, setF] = useState('all')
  const [compose, setCompose] = useState(false)
  const [paste, setPaste] = useState('')
  const [form, setForm] = useState(null)
  const [busy, setBusy] = useState(false)
  const list = st.contacts.filter((c) => f === 'all' || c.source === f)
  const fill = () => {
    setBusy(true)
    setTimeout(() => {
      const p = parseNotes(paste)
      setForm({ name: p.name, title: p.title, brand: p.brand, email: p.email, source: p.source || 'Event', value: p.value, note: paste.split('\n').map((l) => l.replace(/^\[[^\]]+\]\s*\w+:\s*/, '')).join(' ').slice(0, 160) })
      setBusy(false)
    }, 600)
  }
  const save = (toPipe) => {
    const c = { id: 'ct' + Date.now(), name: form.name, title: form.title, brand: form.brand, email: form.email, source: form.source, note: form.note, at: now() }
    st.set((x) => ({ contacts: [c, ...x.contacts] }))
    setCompose(false); setPaste(''); setForm(null)
    if (toPipe) openAddLead({ brand: c.brand, source: 'Own contacts', value: form.value || undefined, contact: { name: c.name, title: c.title, email: c.email }, note: c.source + ' · ' + c.note, ref: { kind: 'contact', id: c.id } })
    else toast('Contact saved · ' + c.name)
  }
  const setK = (k) => (e) => setForm((x) => ({ ...x, [k]: e.target.value }))
  return (
    <div className="d-page">
      <div className="d-head">
        <h1 className="d-h1">Contacts</h1>
        <Seg id="ctc" value={f} onChange={setF} options={[{ value: 'all', label: 'All', count: st.contacts.length }, ...CSRC.map((x) => ({ value: x, label: x, count: st.contacts.filter((c) => c.source === x).length }))]} />
        <button className="b ink" onClick={() => setCompose((v) => !v)}><Plus size={15} /><span className="m-hide">Add contact</span></button>
      </div>
      <AutoHeight>
        {compose && (
          <div className="card sl-paste">
            <div className="row"><ClipboardPaste size={14} className="mute" /><b className="grow">Paste notes or a chat</b><Src s="AI" /></div>
            <div className="inp sl-ta" style={{ marginTop: 10 }}><textarea rows={4} value={paste} onChange={(e) => setPaste(e.target.value)} placeholder="Notes from an event, a LinkedIn chat, a WhatsApp forward…" aria-label="Paste notes" /></div>
            <div className="row" style={{ marginTop: 10 }}>
              <button className="b sm ghost" onClick={() => setPaste(EXAMPLE)}>Try an example</button>
              <span className="grow" />
              <button className="b sm" disabled={!paste.trim() || busy} onClick={fill}><Wand2 size={13} />{busy ? 'Reading…' : 'Fill in'}</button>
            </div>
            <AutoHeight>
              {form && (
                <div className="sl-filled">
                  <div className="sl-grid2">
                    {[['name', 'Name'], ['title', 'Title'], ['brand', 'Brand'], ['email', 'Email']].map(([k, l]) => (
                      <label key={k} className="sl-f"><span>{l}{form[k] && <Src s="AI" tip={false} />}</span><div className="inp">{k === 'brand' && form.brand && <BrandLogo name={form.brand} size={16} radius={4} />}<input value={form[k]} onChange={setK(k)} placeholder={form[k] ? '' : 'Unknown'} /></div></label>
                    ))}
                  </div>
                  <div className="sl-f"><span>How you met</span><div className="sl-chips">{CSRC.map((x) => <button key={x} className={'chip sl-tog' + (form.source === x ? ' on' : '')} aria-pressed={form.source === x} onClick={() => setForm((y) => ({ ...y, source: x }))}>{x}</button>)}</div></div>
                  <div className="row" style={{ justifyContent: 'flex-end', marginTop: 12 }}>
                    <button className="b" disabled={!form.name} onClick={() => save(false)}>Save contact</button>
                    <button className="b ink" disabled={!form.name || !form.brand} onClick={() => save(true)}><Plus size={14} />Add to pipeline</button>
                  </div>
                </div>
              )}
            </AutoHeight>
          </div>
        )}
      </AutoHeight>
      <div className="list" style={{ marginTop: 16 }}>
        <AnimatePresence initial={false}>
          {list.map((c) => (
            <motion.div key={c.id} layout="position" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: EASE }} className="li sl-ct">
              <Avatar user={{ name: c.name, hue: c.name.length * 41 }} size={28} />
              <div className="grow" style={{ padding: '10px 0', minWidth: 0 }}>
                <div className="row"><span className="li-t ell">{c.name}</span><span className="mute ell">{c.title}</span></div>
                <div className="li-s ell">{c.note}</div>
              </div>
              <span className="row m-hide" style={{ gap: 6 }}><BrandLogo name={c.brand} size={18} /><span className="fg2">{c.brand}</span></span>
              <span className="chip m-hide">{c.source}</span>
              {c.deal ? <a className="b sm" href={'#/bd/pipeline/' + c.deal}><Check size={13} /><span className="m-hide">In pipeline</span></a>
                : <Tip label="Add to pipeline"><button className="b sm icon" onClick={() => openAddLead({ brand: c.brand, source: 'Own contacts', contact: { name: c.name, title: c.title, email: c.email }, note: c.note, ref: { kind: 'contact', id: c.id } })} aria-label="Add to pipeline"><Plus size={14} /></button></Tip>}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

/* ═════════ Pipeline ═════════ */
export function Pipeline() {
  const s = useStore(); const st = s.sales
  const [view, setView] = useState(() => { try { return localStorage.getItem('wldd-pipe-view') || 'board' } catch { return 'board' } })
  const [who, setWho] = useState('all')
  const [stale, setStale] = useState(false)
  const [q, setQ] = useState('')
  const [drag, setDrag] = useState(null)
  const [over, setOver] = useState(null)
  const setV = (v) => { setView(v); try { localStorage.setItem('wldd-pipe-view', v) } catch {} }
  const deals = st.deals.filter((d) => (who === 'all' || (who === 'mine' ? d.owner === me.id : d.owner === who)) && (!stale || isStale(d)) && (!q || (d.brand + ' ' + (d.contact?.name || '')).toLowerCase().includes(q.toLowerCase())))
  const mineAll = st.deals.filter((d) => d.owner === me.id)
  const sent = mineAll.filter((d) => d.outreach?.sentAt), replied = sent.filter((d) => d.outreach.reply)
  const won = mineAll.filter((d) => d.stage === 'won').length, lost = mineAll.filter((d) => d.stage === 'lost').length
  const reply = sent.length ? Math.round((replied.length / sent.length) * 100) : 0
  const close = won + lost ? Math.round((won / (won + lost)) * 100) : 0
  const open = st.deals.filter(isOpen)
  const drop = (stage) => { if (drag) { const d = st.deals.find((x) => x.id === drag); if (d && d.stage !== stage) { st.moveDeal(drag, stage); toast(d.brand + ' → ' + stageLabel(stage), stage === 'lost' ? { action: { label: 'Add reason', onClick: () => go('/bd/pipeline/' + drag + '/lost') } } : undefined) } } setDrag(null); setOver(null) }
  return (
    <div className="d-page wide sl-pipe">
      <div className="d-head">
        <h1 className="d-h1">Pipeline</h1>
        <div className="inp" style={{ width: 200 }}><Search size={14} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Brand or contact" /></div>
        <button className="b ink" onClick={() => openAddLead({ source: 'Discover' })}><Plus size={15} /><span className="m-hide">Add lead</span></button>
      </div>
      <div className="metrics sl-m4">
        <div className="metric"><span className="metric-l">Open</span><span className="metric-v num"><Ticker value={open.reduce((t, d) => t + d.value, 0)} format={(n) => fmt.inr(Math.round(n))} /></span></div>
        <div className="metric"><Tip label={`Your intro emails with a reply · ${replied.length} of ${sent.length}`}><span className="metric-l">Reply rate</span></Tip><span className="metric-v num"><Ticker value={reply} format={(n) => Math.round(n) + '%'} /></span></div>
        <div className="metric"><Tip label={`Your closed deals that were won · ${won} of ${won + lost}`}><span className="metric-l">Close rate</span></Tip><span className="metric-v num"><Ticker value={close} format={(n) => Math.round(n) + '%'} /></span></div>
        <div className="metric"><span className="metric-l">Stale</span><span className="metric-v num"><Ticker value={open.filter(isStale).length} /></span></div>
      </div>
      <div className="sl-filters" style={{ marginTop: 16 }}>
        <Seg id="pview" value={view} onChange={setV} options={[{ value: 'board', label: <span className="row" style={{ gap: 5 }}><LayoutGrid size={13} />Board</span> }, { value: 'list', label: <span className="row" style={{ gap: 5 }}><ListIcon size={13} />List</span> }]} />
        <Select align="left" value={who} onChange={setWho} options={[{ id: 'all', label: 'Everyone' }, { id: 'mine', label: 'Mine' }, ...REPS.slice(1).map((u) => ({ id: u.id, label: u.short }))]} />
        <button className={'b sm' + (stale ? ' on' : '')} aria-pressed={stale} onClick={() => setStale((v) => !v)}><Hourglass size={13} />Stale only</button>
      </div>
      <SlidePanel k={view} index={view === 'board' ? 0 : 1} style={{ marginTop: 14 }}>
        {view === 'board' ? (
          <div className="sl-board">
            {DEAL_STAGES.map((sg) => {
              const col = deals.filter((d) => d.stage === sg.id)
              return (
                <div key={sg.id} className={'board-col' + (over === sg.id ? ' over' : '') + (sg.id === 'lost' ? ' sl-lostcol' : '')} onDragOver={(e) => { e.preventDefault(); setOver(sg.id) }} onDragLeave={() => setOver(null)} onDrop={() => drop(sg.id)}>
                  <div className="board-h">{sg.n > 0 && <span className="sl-sn">{sg.n}</span>}{sg.label}<span className="mute num">{col.length}</span><span className="grow" /><span className="mute num xs">{fmt.inr(col.reduce((t, d) => t + d.value, 0))}</span></div>
                  <AnimatePresence initial={false}>
                    {col.map((d) => (
                      <motion.div key={d.id} layout layoutId={'deal-' + d.id} transition={{ duration: 0.25, ease: EASE }}>
                        <DealCard d={d} dragging={drag === d.id} onDragStart={() => setDrag(d.id)} onDragEnd={() => { setDrag(null); setOver(null) }} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        ) : (
          <table className="tbl sl-tbl">
            <thead><tr><th>Brand</th><th>Stage</th><th className="r">Value</th><th>Owner</th><th>Next step</th><th>Due</th><th>Updated</th></tr></thead>
            <tbody>
              {deals.map((d) => (
                <tr key={d.id} className="click" onClick={() => go('/bd/pipeline/' + d.id)}>
                  <td><span className="row"><BrandLogo name={d.brand} size={22} /><b style={{ fontWeight: 500 }}>{d.brand}</b>{isStale(d) && <span className="chip y"><Hourglass size={11} />{staleDays(d)}d</span>}</span></td>
                  <td><StageTag id={d.stage} /></td>
                  <td className="r num">{fmt.inr(d.value)}</td>
                  <td><Avatar user={repOf(d.owner)} size={20} /></td>
                  <td className="fg2 ell" style={{ maxWidth: 240 }}>{d.next || '—'}</td>
                  <td className="fg2">{d.due ? fmt.ago(d.due) : '—'}</td>
                  <td className="fg2">{fmt.ago(d.updated)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </SlidePanel>
    </div>
  )
}
export function StageTag({ id }) {
  const sg = DEAL_STAGES.find((x) => x.id === id)
  return <span className={'sl-stag s-' + id}><i />{sg.label}</span>
}
function DealCard({ d, dragging, onDragStart, onDragEnd }) {
  const stale = isStale(d)
  return (
    <div className={'pcard sl-card' + (dragging ? ' dragging' : '')} draggable onDragStart={onDragStart} onDragEnd={onDragEnd} onClick={() => go('/bd/pipeline/' + d.id)} role="link" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') go('/bd/pipeline/' + d.id) }}>
      <div className="row"><BrandLogo name={d.brand} size={22} /><b className="grow ell" style={{ fontWeight: 600 }}>{d.brand}</b><Tip label={repOf(d.owner).name}><span><Avatar user={repOf(d.owner)} size={18} /></span></Tip></div>
      <div className="row" style={{ justifyContent: 'space-between' }}><Svc list={d.services.slice(0, 3)} /><span className="num fg2">{fmt.inr(d.value)}</span></div>
      {d.stage === 'lost' ? <div className="mute xs ell">{d.lost?.reason || 'No reason yet'}</div>
        : d.stage === 'won' ? <div className="xs row fg2" style={{ gap: 5 }}><Check size={12} />{d.won?.pod ? 'With ' + d.won.pod : 'Hand off to a pod'}</div>
        : <div className="xs row fg2 sl-next" style={{ gap: 5 }}><ArrowRight size={12} className="mute" /><span className="ell grow">{d.next}</span>{stale && <Tip label={'No activity in ' + staleDays(d) + ' days'}><span className="chip y sl-stale"><Hourglass size={11} />{staleDays(d)}d</span></Tip>}</div>}
    </div>
  )
}

/* ═════════ Case Library ═════════ */
export function Cases({ id }) {
  const s = useStore(); const st = s.sales
  const [sel, setSel] = useState([])
  const [creds, setCreds] = useState(false)
  const [q, setQ] = useState('')
  const rows = cases.filter((c) => !q || (c.client + c.title + c.cats.join(' ')).toLowerCase().includes(q.toLowerCase()))
  const cur = id && caseById(id)
  const tog = (cid) => setSel((l) => (l.includes(cid) ? l.filter((x) => x !== cid) : [...l, cid]))
  return (
    <div className="d-page wide">
      <div className="d-head">
        <h1 className="d-h1">Case Library</h1>
        <div className="inp" style={{ width: 220 }}><Search size={14} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Client or category" /></div>
        <button className={'b ink' + (sel.length ? '' : ' dis')} disabled={!sel.length} onClick={() => setCreds(true)}><Presentation size={15} />Creds deck{sel.length > 0 && <span className="num">{sel.length}</span>}</button>
      </div>
      <table className="tbl sl-tbl">
        <thead><tr><th style={{ width: 28 }} /><th>Campaign</th><th>Services</th><th className="r">Views</th><th className="r">ER</th><th>Result</th><th>Used in</th></tr></thead>
        <tbody>
          {rows.map((c) => {
            const used = st.deals.filter((d) => d.proof.includes(c.id) && isOpen(d)).length
            return (
              <tr key={c.id} className="click" onClick={() => go('/bd/cases/' + c.id)}>
                <td onClick={(e) => { e.stopPropagation(); tog(c.id) }}><span className={'sl-ck' + (sel.includes(c.id) ? ' on' : '')} role="checkbox" aria-checked={sel.includes(c.id)} aria-label={'Pick ' + c.client}>{sel.includes(c.id) && <Check size={11} strokeWidth={3} />}</span></td>
                <td><span className="row"><BrandLogo name={c.client} size={22} /><span><b style={{ fontWeight: 500 }}>{c.client}</b> <span className="mute">· {c.title}</span></span></span></td>
                <td><Svc list={c.services} /></td>
                <td className="r num">{fmt.compact(c.views)}</td>
                <td className="r num">{c.er}%</td>
                <td className="fg2 ell" style={{ maxWidth: 320 }}>{c.result}</td>
                <td className="mute num">{used || '—'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <Sheet open={!!cur} onClose={() => go('/bd/cases')} width={620}>{cur && <CaseSheet c={cur} />}</Sheet>
      <Sheet open={creds} onClose={() => setCreds(false)} width={760}>
        {creds && (
          <div>
            <h2 className="d-h1" style={{ fontSize: 20, marginBottom: 14 }}>Creds deck <span className="mute num" style={{ fontWeight: 400 }}>{sel.length}</span></h2>
            <DeckViewer deck={credsDeck(sel)} file="WLDD creds" />
          </div>
        )}
      </Sheet>
    </div>
  )
}
function CaseSheet({ c }) {
  const s = useStore()
  const used = s.sales.deals.filter((d) => d.proof.includes(c.id))
  const [show, setShow] = useState(false)
  return (
    <div className="inv-d">
      <div className="row" style={{ gap: 12 }}><BrandLogo name={c.client} size={40} /><div className="grow"><h2 className="d-h1" style={{ fontSize: 20 }}>{c.client}</h2><div className="mute xs">{c.title} · {c.year}</div></div><Src s="Case Library" /></div>
      <div className="kv-grid" style={{ marginTop: 20 }}>
        <div><span>Views</span><span className="num">{fmt.compact(c.views)}</span></div>
        <div><span>Engagement</span><span className="num">{c.er}%</span></div>
        <div><span>Creators</span><span className="num">{c.creators}</span></div>
        <div><span>Budget</span><span className="num">{fmt.inr(c.budget)}</span></div>
      </div>
      <p className="brief" style={{ marginTop: 18 }}>{c.result}</p>
      {c.quote && <blockquote className="sl-quote">“{c.quote}”</blockquote>}
      <div className="row" style={{ marginTop: 12, flexWrap: 'wrap' }}><Svc list={c.services} />{c.cats.slice(0, 3).map((x) => <span key={x} className="chip">{x}</span>)}</div>
      {used.length > 0 && <><div className="group-h">Used as proof <span className="mute num">{used.length}</span></div><div className="list">{used.map((d) => <a key={d.id} className="li" href={'#/bd/pipeline/' + d.id}><BrandLogo name={d.brand} size={20} /><span className="grow ell">{d.brand}</span><StageTag id={d.stage} /></a>)}</div></>}
      <AutoHeight>{show && <div style={{ paddingTop: 16 }}><DeckViewer deck={credsDeck([c.id])} file={c.client + ' case'} /></div>}</AutoHeight>
      <div className="inv-actions">
        {c.campaignId && <a className="b" href={'#/pod/campaigns/' + c.campaignId}>Campaign<ArrowUpRight size={13} /></a>}
        <button className="b ink" onClick={() => setShow((v) => !v)}><Presentation size={14} />{show ? 'Hide slides' : 'Present case'}</button>
      </div>
    </div>
  )
}
