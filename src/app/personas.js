import { team } from '../data'

/** "View as": preview the DMS the way each role sees it (Settings › Preferences).
    Roles decide which workspaces a person can open (HR assigns them; admins and
    cross-functional operators get an allowed-role list to switch between).
    `hide` removes pages that role can't use. Only Admin sees Workspace settings. */
const by = (id) => team.find((u) => u.id === id)
export const PERSONAS = [
  { id: 'admin', label: 'Admin', roles: ['pod', 'finance', 'bd'], person: by('u1') },
  { id: 'pm', label: 'Product manager', roles: ['pod', 'bd'], hide: ['/pod/approvals'], person: by('u8') },
  { id: 'podlead', label: 'Pod lead', roles: ['pod'], person: by('u3') },
  { id: 'pod', label: 'Pod member', roles: ['pod'], hide: ['/pod/approvals'], person: by('u4') },
  { id: 'finance', label: 'Finance', roles: ['finance'], person: by('u7') },
  { id: 'sales', label: 'Sales', roles: ['bd'], person: by('u9') },
]
export const personaOf = (id) => PERSONAS.find((p) => p.id === id) || PERSONAS[0]

/** The persona being previewed. App sets it each render; pages read it (greeting, what they can approve). */
let current = PERSONAS[0]
export const view = () => current
export const setView = (p) => { current = p }
/** Campaign-lead approvals (invoices at the lead stage) — hidden for roles without the Approvals page. */
export const canLeadApprove = () => !current.hide?.includes('/pod/approvals')
