import { createContext, useContext, useState, useCallback } from 'react'
import { useSalesState } from './sales/state'
import { toast } from 'sonner'
import { campaigns as seedCampaigns, invoices as seedInvoices, proposals as seedProposals, outreach as seedOutreach, billingRequests as seedRequests, vendors as seedVendors, MISC_CHAIN, LINK_CHAIN, TODAY, fmt } from './data'

const Ctx = createContext(null)
export const useStore = () => useContext(Ctx)

export function StoreProvider({ children }) {
  const [campaigns, setCampaigns] = useState(seedCampaigns)
  const [invoices, setInvoices] = useState(seedInvoices)
  const [proposals, setProposals] = useState(seedProposals)
  const [outreach, setOutreach] = useState(seedOutreach)
  const sales = useSalesState() // Sales portal slice, saved in localStorage
  const [requests, setRequests] = useState(seedRequests)
  const [vendors, setVendors] = useState(seedVendors)

  const patchCampaign = useCallback((id, patch) => setCampaigns((l) => l.map((c) => (c.id === id ? { ...c, ...(typeof patch === 'function' ? patch(c) : patch) } : c))), [])

  /** Move an invoice one step along its chain (or reject). Undo restores the previous stage. */
  const advanceInvoice = useCallback((id, verdict = 'approve', quiet = false) => {
    setInvoices((list) => {
      const inv = list.find((x) => x.id === id)
      if (!inv) return list
      const chain = inv.type === 'misc' ? MISC_CHAIN : LINK_CHAIN
      const prev = inv.stage
      const next = verdict === 'reject' ? 'rejected' : chain[Math.min(chain.indexOf(inv.stage) + 1, chain.length - 1)]
      const scheduledFor = next === 'scheduled' ? new Date(TODAY.getTime() + 3 * 864e5) : inv.scheduledFor
      if (!quiet) {
        setTimeout(() => {
          const verb = verdict === 'reject' ? 'Rejected' : next === 'scheduled' ? 'Scheduled' : next === 'paid' ? 'Paid' : 'Approved'
          toast(verb + ' · ' + inv.vendor.name, {
            description: fmt.inrFull(inv.amount),
            action: { label: 'Undo', onClick: () => setInvoices((l) => l.map((x) => (x.id === id ? { ...x, stage: prev } : x))) },
          })
        }, 0)
      }
      return list.map((x) => (x.id === id ? { ...x, stage: next, scheduledFor } : x))
    })
  }, [])

  const value = {
    campaigns, setCampaigns, patchCampaign,
    invoices, setInvoices, advanceInvoice,
    proposals, setProposals, outreach, setOutreach, sales,
    inbound: sales.inbound.filter((x) => x.status === 'open'), // open inbound leads, read by Home and the chat
    requests, setRequests, vendors, setVendors,
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
