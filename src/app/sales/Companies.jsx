// Layout 3 · Companies first: everything rolls up to the company. A heat-ranked list beside one dossier.
import { ChevronLeft, Building2, Flame } from 'lucide-react'
import { go } from '../ui'
import { useProspect, useNarrow, FilterBar, CoRow, BeyondRow, Dossier } from './kit'
import { companyById } from './prospect'

export function CompaniesFirst({ id }) {
  const { st, res } = useProspect()
  const narrow = useNarrow()
  const list = [...res.companies].sort((a, b) => b.heat - a.heat || b.sigs.length - a.sigs.length)
  const picked = id && companyById(id, st)
  const cur = picked || (!narrow ? list[0]?.c : null)
  const open = (c) => go('/bd/companies/' + c.id)
  return (
    <div className={'bdv-mf' + (picked ? ' has-cur' : '')}>
      <div className="bdv-mf-top"><div className="d-head"><h1 className="d-h1">Companies</h1></div><FilterBar /></div>
      <div className="bdv-mf-g">
        <div className="bdv-mf-l">
          <div className="bdv-lh"><Flame size={13} /><span className="grow">Heat</span><span className="mute num">{list.length}</span></div>
          <div className="list">{list.map(({ c }) => <CoRow key={c.id} c={c} showHeat onOpen={open} sel={cur?.id === c.id} />)}</div>
          {!list.length && <div className="empty"><Building2 size={18} /><b>No matches</b></div>}
          <BeyondRow kind="companies" />
        </div>
        <div className="bdv-mf-r">
          {cur ? (
            <Dossier c={cur} back={narrow && <button className="b sm ghost bdv-back" onClick={() => go('/bd/companies')}><ChevronLeft size={15} />Companies</button>} />
          ) : <div className="empty"><Building2 size={18} /><b>Pick a company</b></div>}
        </div>
      </div>
    </div>
  )
}
