// "About this view": the ⓘ beside a BD page title. What the page is for, how it works, what feeds it, and which layout it belongs to.
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Info, X, Settings2 } from 'lucide-react'
import { Tip, MOD } from '../../shared/motion'
import { go } from '../ui'
import { Src } from './ui'
import { LAYOUTS, bdFilters } from './prospect'

const FILTER_NOTE = () => (bdFilters() === 'panel'
  ? 'Filters sit in the side panel on the left, grouped by what they narrow, with a live count on every option. Switch to the bar with the icon at the top of the panel.'
  : 'Filters sit in the bar above the results; More holds the rest. The panel icon at the end of the bar moves them into a side panel with counts.')

const GLOBAL = [
  'One global filter drives every tab and layout: company facts (funding, size, industry, city, relationship) apply everywhere; signal filters narrow signals; people filters (seniority, department, contact, movement) narrow people. Each also narrows the companies behind what matched.',
  'In Prospecting, search looks at the tab you are on, and the other tabs follow from it: on People, “CMO” finds the CMOs, and Companies shows where they work. Inbound and Moments, Companies first and Stream search everything.',
  'Typing shows instant matches. Enter filters every tab by the text, picking a row opens that company, and a name we don’t have can be fetched from Apollo for 1 credit.',
  'Saved views keep a filter. Turn on Auto and that view applies whenever BD opens.',
]
const CREDITS = 'Anything already in our DB is free. Reaching Apollo shows the cost first; once fetched, companies and people stay in our DB, so the same search is free next time.'

/** Page by page. `layout` names the layout the page is the home of; `uses` lists the sources behind it. */
export const VIEW_INFO = {
  feed: {
    title: 'Feed', layout: 'sources',
    what: 'The rep’s daily start: market signals that may be sales opportunities, plus what is due today.',
    who: 'Every BD rep, first thing in the morning.',
    how: ['Due shows reminders and follow-ups that need you today.', 'Each signal says why it matters and suggests a pitch angle, with how well we know the brand.', 'Add to pipeline opens one form, pre-filled; a brand someone already owns warns you first.', 'Thumbs up or down teaches the signals engine; Dismiss hides a signal (Undo is in the toast).'],
    uses: ['Signals engine', 'AI', 'DMS'],
  },
  discover: {
    title: 'Discover',
    what: 'A search engine for one company. Type a brand and get everything we know: profile, every signal it has had, people and contacts, deal history, proof from the Case Library, notes, and the Meta ads it is running now.',
    who: 'A rep preparing for a brand, or checking a name someone mentioned.',
    how: ['Known brands open straight away, free.', 'Anything we don’t have shows Unknown, never a guess.', 'A brand we have never seen can be fetched from Apollo for 1 credit, and then it is ours for good.', 'People we have on file are free; anyone else needs a reveal.'],
    uses: ['Apollo', 'Signals engine', 'Case Library', 'DMS', 'AI'],
    credits: true,
  },
  inbound: {
    title: 'Inbound', layout: 'sources',
    what: 'Leads that came to us: emails and the website form.',
    who: 'Reps picking up new interest, and leads checking who owns what.',
    how: ['Claim a lead to own it; everyone sees who owns which lead.', 'Unclaimed leads are counted in the sidebar.', 'Add to pipeline carries the email, budget and summary into the deal.', 'Reject hides a lead (Undo is in the toast).'],
    uses: ['Gmail', 'DMS'],
  },
  accounts: {
    title: 'Accounts',
    what: 'Brands that already work with us: spend over 12 months, services bought, renewal dates and alerts.',
    who: 'Account owners looking for upsell and renewal deals.',
    how: ['Alerts flag a spend drop or a renewal coming up.', 'Each alert can become an upsell or renewal deal in one step.', 'A won deal makes the brand an account here.'],
    uses: ['DMS'],
  },
  contacts: {
    title: 'Contacts', layout: 'sources',
    what: 'People the rep brings in themselves: events, referrals, LinkedIn, cold calls.',
    who: 'Reps logging who they met.',
    how: ['Paste notes or a chat and the form fills in the name, title, brand, email and source.', 'Save keeps the contact; Save and add puts the brand straight into the pipeline.'],
    uses: ['AI', 'LinkedIn'],
  },
  pipeline: {
    title: 'Pipeline',
    what: 'Every deal from New lead to Won or Closed lost, in three views: Kanban, Table and Timeline.',
    who: 'Reps working their deals; leads reviewing the team’s pipeline.',
    how: ['Kanban: drag a card to move it (grip on touch screens), Alt + arrow keys move a focused card. Dropping on Closed lost asks why; on Won offers the hand-off.', 'Table: every deal in one list with next step and due date.', 'Timeline: bars from when a deal was added to its expected close, with today marked.', 'Stale deals (no activity in a week) get a yellow edge; the Stale number filters to them.', 'Open a deal for its page: tabs appear as it moves forward.'],
    uses: ['DMS', 'Gmail', 'Google Calendar'],
  },
  cases: {
    title: 'Case Library',
    what: 'Past WLDD campaigns used as proof in emails, proposals and pitch decks.',
    who: 'Reps building a pitch or a creds deck.',
    how: ['Pick cases and build a short creds deck.', 'Present a single case full screen.', 'Each case shows which open deals use it as proof.'],
    uses: ['Case Library', 'DMS'],
  },
  kb: {
    title: 'Knowledge base',
    what: 'What WLDD knows about each client: notes, history and context shared with the pods.',
    who: 'Anyone preparing for a client conversation.',
    how: ['Search or browse by client.', 'Discover links here when a brand has notes.'],
    uses: ['DMS'],
  },
  prospect: {
    title: 'Prospecting', layout: 'prospect',
    what: 'One page for finding who to sell to: Signals, Companies, People, Inbound and Moments, all under one global filter.',
    who: 'Reps and leads who start from a question like “Series B, 50–200 people, who should we call?”.',
    how: ['Every tab’s count updates as you filter, so one query answers what is happening, which companies and which people.', 'Companies are sorted by matching signals, so the few companies with the most news stand out.', 'People build themselves from signals (a new CMO signal adds that person) and from our DB; pick several and reveal in bulk.', 'Search beyond our DB, at the end of Companies and People, runs the same filter on Apollo.', 'Moments lists upcoming days (Black Friday, Diwali, Pride Month…) with the brands that fit.', 'Reorder the tabs with the arrows icon. The tab you are on is also what search looks at.'],
    filters: true, credits: true,
    uses: ['Signals engine', 'Apollo', 'AI', 'Gmail', 'DMS'],
  },
  companies: {
    title: 'Companies', layout: 'accounts',
    what: 'Account-based prospecting: everything rolls up to the company. A list ranked by heat beside one full company profile.',
    who: 'Reps who sell to accounts, and leads who want to stop two people chasing the same brand.',
    how: ['Heat = recent signals × BD relevance, plus relationship and open inbound. The hottest accounts sit on top.', 'The profile has Signals as a timeline, People, Deals, Proof and Ads, with one Add to pipeline.', 'Signals and people never show loose; they always sit inside their company.', 'On phones the list opens each company full screen.'],
    filters: true, credits: true,
    uses: ['Signals engine', 'Apollo', 'Case Library', 'DMS'],
  },
  stream: {
    title: 'Stream', layout: 'stream',
    what: 'One stream of everything worth acting on, sorted by what to do next: signals, inbound, moments, account alerts and follow-ups.',
    who: 'Reps triaging on their phone between meetings.',
    how: ['Ranked by BD relevance × recency × deal size.', 'Saved views sit as chips at the top; New view saves the current filter.', 'Each card has one main action (Add to pipeline, Claim, Reveal…), plus Snooze and Dismiss.', 'On touch, swipe right for the main action and left to dismiss.', 'Tap a card for the company profile. On desktop the right rail shows credits, what is due and the pipeline.'],
    filters: true, credits: true,
    uses: ['Signals engine', 'Gmail', 'DMS', 'AI'],
  },
}

/** The ⓘ button beside the page title. */
export function ViewInfo({ sec }) {
  const [open, setOpen] = useState(false)
  const info = VIEW_INFO[sec]
  if (!info) return null
  return (
    <>
      <Tip label="About this view"><button className="bdv-ib" onClick={() => setOpen(true)} aria-label={'About ' + info.title}><Info size={14} /></button></Tip>
      {open && <InfoDialog info={info} onClose={() => setOpen(false)} />}
    </>
  )
}

function InfoDialog({ info, onClose }) {
  useEffect(() => { const k = (e) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k) }, [onClose])
  const lay = LAYOUTS.find((x) => x.value === info.layout)
  return createPortal(
    <div className="bdv-iw" onClick={onClose}>
      <div className="bdv-id" role="dialog" aria-modal="true" aria-label={'About ' + info.title} tabIndex={-1} ref={(el) => el?.focus({ preventScroll: true })} onClick={(e) => e.stopPropagation()}>
        <div className="bdv-id-h">
          <div className="grow"><div className="mute xs">About this view</div><h2>{info.title}</h2></div>
          <button className="b ghost icon sm" onClick={onClose} aria-label="Close"><X size={15} /></button>
        </div>
        <div className="bdv-id-b">
        <p className="bdv-id-lead">{info.what}</p>
        <div className="bdv-id-s"><h3>Who it’s for</h3><p>{info.who}</p></div>
        <div className="bdv-id-s"><h3>How it works</h3><ul>{info.how.map((x) => <li key={x}>{x}</li>)}</ul></div>
        {info.filters && (
          <div className="bdv-id-s"><h3>Filters and search</h3><ul>{GLOBAL.map((x) => <li key={x}>{x}</li>)}<li>{FILTER_NOTE()}</li></ul></div>
        )}
        {info.credits && <div className="bdv-id-s"><h3>Apollo credits</h3><p>{CREDITS}</p></div>}
        <div className="bdv-id-s"><h3>Where the data comes from</h3><div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>{info.uses.map((u) => <Src key={u} s={u} />)}</div><p className="mute xs" style={{ marginTop: 8 }}>Every fact shows its source. Anything unknown is marked Unknown, never guessed.</p></div>
        </div>
        <div className="bdv-id-f">
          <span className="grow mute xs">{lay ? <>Part of the <b>{lay.label}</b> BD layout · {lay.desc}</> : 'Shared by every BD layout'} · Search anything with {MOD}K</span>
          <button className="b sm" onClick={() => { onClose(); go('/settings/preferences') }}><Settings2 size={13} />BD layout</button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
