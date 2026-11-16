// Discover for the prospecting layouts: search one company, get everything we know.
// Known: profile, signals, people, deals, proof, notes and Meta ads. Unknown: fetch from Apollo for a credit.
import { useMemo, useState } from 'react'
import { Search as SearchIcon, Database, KeyRound, ArrowRight, Building2, CornerDownLeft, Flame } from 'lucide-react'
import { fmt } from '../data'
import { BrandLogo } from '../../shared/brands'
import { go } from '../ui'
import { apollo, brandOf } from './data'
import { factsFor } from './state'
import { Facts, Src } from './ui'
import { useProspect, CoHead, CoMeta, PinBtn, AddBtn, SignalsTimeline, PeopleList, DealsList, ProofList, AdsList, KbNotes } from './kit'
import { dbCompanies, companyById, inDb, fetchName, heat, sigsOf, peopleOf } from './prospect'

const norm = (t) => t.trim().toLowerCase()

export function CompanySearch({ id }) {
  const { st } = useProspect()
  const [q, setQ] = useState('')
  const [hi, setHi] = useState(0)
  const unknown = id?.startsWith('~') ? decodeURIComponent(id.slice(1)) : null
  const cur = id && !unknown ? companyById(id, st) : null
  const db = useMemo(() => dbCompanies(st), [st.db]) // eslint-disable-line react-hooks/exhaustive-deps
  const t = norm(q)
  const hits = !t ? [] : [
    ...db.filter((c) => norm(c.name).includes(t)).slice(0, 6).map((c) => ({ c, free: true })),
    ...apollo.filter((c) => !inDb(c, st) && norm(c.name).includes(t)).slice(0, 3).map((c) => ({ c, free: false })),
  ]
  const exact = hits.find((h) => norm(h.c.name) === t)
  const opts = [...hits, ...(exact ? [] : t ? [{ look: q.trim() }] : [])]
  const pick = (o) => { setQ(''); setHi(0); go('/bd/discover/' + (o.look ? '~' + encodeURIComponent(o.look) : o.c.id)) }
  const hot = useMemo(() => [...db].map((c) => ({ c, h: heat(c, st) })).sort((a, b) => b.h - a.h).slice(0, 8), [db, st]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="d-page wide bdv-disc">
      <div className="d-head"><h1 className="d-h1">Discover</h1></div>
      <div className="bdv-sbox">
        <div className="inp bdv-sinp">
          <SearchIcon size={16} />
          <input value={q} onChange={(e) => { setQ(e.target.value); setHi(0) }} placeholder="Search a company" aria-label="Search a company"
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setHi((h) => Math.min(h + 1, opts.length - 1)) }
              if (e.key === 'ArrowUp') { e.preventDefault(); setHi((h) => Math.max(h - 1, 0)) }
              if (e.key === 'Enter' && opts[hi]) pick(opts[hi])
            }} />
          <span className="chip"><KeyRound size={12} /><span className="num">{st.credits}</span></span>
        </div>
        {t && (
          <div className="bdv-sug" role="listbox">
            {opts.map((o, i) => (
              <button key={o.look ? 'look' : o.c.id} className={'bdv-sug-r' + (i === hi ? ' on' : '')} onMouseEnter={() => setHi(i)} onClick={() => pick(o)} role="option" aria-selected={i === hi}>
                {o.look ? <span className="bdv-ic"><Building2 size={14} /></span> : <BrandLogo name={o.c.name} size={22} />}
                <span className="grow ell">{o.look ? <>Look up <b>{o.look}</b></> : <><b>{o.c.name}</b> <span className="mute">{o.free ? o.c.cat || '' : ''}</span></>}</span>
                {o.look ? <span className="mute xs">Unknown</span> : o.free ? <span className="chip g">In our DB · free</span> : <span className="chip y"><KeyRound size={11} />Apollo · 1 credit</span>}
                {i === hi && <CornerDownLeft size={13} className="mute" />}
              </button>
            ))}
          </div>
        )}
      </div>
      {cur ? <CompanyPage c={cur} /> : unknown ? <UnknownPage name={unknown} /> : (
        <>
          <div className="group-h"><Flame size={13} />Heating up</div>
          <div className="bdv-hot">{hot.map(({ c, h }) => (
            <a key={c.id} className="bdv-hot-c" href={'#/bd/discover/' + c.id}><BrandLogo name={c.name} size={28} /><span className="grow bdv-co-m"><b className="ell">{c.name}</b><span className="mute xs">{sigsOf(c, st).length} {sigsOf(c, st).length === 1 ? 'signal' : 'signals'} · heat {h}</span></span></a>
          ))}</div>
          {st.pins.length > 0 && (
            <>
              <div className="group-h">Pinned</div>
              <div className="bdv-hot">{st.pins.map((n) => brandOf(n) || db.find((c) => c.name === n)).filter(Boolean).map((c) => (
                <a key={c.id} className="bdv-hot-c" href={'#/bd/discover/' + c.id}><BrandLogo name={c.name} size={28} /><span className="grow bdv-co-m"><b className="ell">{c.name}</b><CoMeta c={c} /></span></a>
              ))}</div>
            </>
          )}
        </>
      )}
    </div>
  )
}

/** Not in our DB: Apollo has the name, nothing else until we fetch. */
function FetchCard({ name, onDone }) {
  const { st } = useProspect()
  return (
    <div className="bdv-fetch">
      <Database size={16} className="mute" />
      <div className="grow"><b>Not in our DB</b><div className="mute xs">Fetch once, free after · {st.credits} credits left</div></div>
      <button className="b ink" onClick={() => { const c = fetchName(st, name); if (c) onDone?.(c) }}><KeyRound size={14} />Fetch from Apollo · 1 credit</button>
    </div>
  )
}

function UnknownPage({ name }) {
  const facts = [['Category'], ['HQ'], ['Funding'], ['Employees'], ['Revenue'], ['Signals'], ['People'], ['Meta ads']]
  return (
    <div className="bdv-cp">
      <div className="bdv-head"><span className="bdv-ic lg"><Building2 size={20} /></span><div className="grow"><h2 className="d-h1 bdv-h2">{name}</h2><span className="sl-unk">Unknown</span></div></div>
      <FetchCard name={name} onDone={(c) => go('/bd/discover/' + c.id)} />
      <div className="sl-facts c2" style={{ marginTop: 16 }}>{facts.map(([k]) => <div key={k} className="sl-fact"><span className="sl-fk">{k}</span><span className="sl-fv"><span className="sl-unk">Unknown</span></span><span /></div>)}</div>
    </div>
  )
}

function CompanyPage({ c }) {
  const { st } = useProspect()
  const db = inDb(c, st)
  const nS = sigsOf(c, st).length, nP = peopleOf(c, st).length, nD = st.deals.filter((d) => d.brand === c.name).length
  if (!db) {
    return (
      <div className="bdv-cp">
        <div className="bdv-head"><BrandLogo name={c.name} size={40} /><div className="grow"><h2 className="d-h1 bdv-h2">{c.name}</h2><span className="chip"><Database size={11} />Apollo</span></div></div>
        <FetchCard name={c.name} />
        <div className="sl-facts c2" style={{ marginTop: 16 }}>{['Category', 'HQ', 'Funding', 'Employees', 'Revenue', 'People'].map((k) => <div key={k} className="sl-fact"><span className="sl-fk">{k}</span><span className="sl-fv"><span className="sl-unk">Unknown</span></span><Src s="Apollo" /></div>)}</div>
      </div>
    )
  }
  const facts = [{ k: 'Funding', v: c.funding, src: 'Apollo' }, ...factsFor(c.name, st)]
  return (
    <div className="bdv-cp">
      <CoHead c={c} size={44} meta={false}><PinBtn c={c} /><AddBtn c={c} ink sm={false} /></CoHead>
      {c.about ? <p className="fg2 bdv-about">{c.about} <Src s="Apollo" /></p> : <p className="bdv-about"><span className="sl-unk">Unknown</span></p>}
      <div className="bdv-cp-g">
        <div className="bdv-cp-m">
          <Sec title="Signals" n={nS} src="Signals engine"><SignalsTimeline c={c} /></Sec>
          <Sec title="People" n={nP} src="Apollo · Gmail"><PeopleList c={c} /></Sec>
          <Sec title="Deals" n={nD} src="DMS"><DealsList c={c} /></Sec>
        </div>
        <div className="bdv-cp-s">
          <Sec title="Profile"><Facts facts={facts} cols={1} /></Sec>
          <Sec title="Meta Ads brand watch"><AdsList c={c} /></Sec>
          <Sec title="Proof" src="Case Library"><ProofList c={c} /></Sec>
          <Sec title="Notes" src="DMS"><KbNotes c={c} /></Sec>
        </div>
      </div>
    </div>
  )
}
const Sec = ({ title, n, src, children }) => (
  <section className="bdv-sec">
    <div className="group-h">{title}{n != null && <span className="mute num">{n}</span>}<span className="grow" />{src && <Src s={src} />}</div>
    {children}
  </section>
)
