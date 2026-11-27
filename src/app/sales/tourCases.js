// Prospecting walkthrough: five personas that drive the real page (fake cursor, real clicks) while a free system voice explains.
// A scenario is an async script over `t`; every helper waits for the page to settle, so the numbers it says are the numbers on screen.

const $$ = (sel, root = document) => [...root.querySelectorAll(sel)]
const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim().toLowerCase()
const byText = (sel, text, { exact = false, root } = {}) => $$(sel, root).find((e) => (exact ? norm(e.textContent) === norm(text) : norm(e.textContent).startsWith(norm(text))))

/** The persona list the controller shows. `label` is the short chip; `who` the tooltip. */
export const CASES = [
  { id: 'funded', label: 'Funded', who: 'Ishaan · brands that just raised and are Series B', run: funded },
  { id: 'cmo', label: 'New CMO', who: 'Aarav · new leaders with a senior contact', run: newCmo },
  { id: 'apollo', label: 'Apollo', who: 'Zoya · Apollo search, pages, enrichment and credits', run: apolloCase },
  { id: 'panel', label: 'Counts', who: 'Karan · side panel with live counts', run: panelCase },
  { id: 'triple', label: 'Three groups', who: 'Riya · Signal, Company and People together, saved as a view', run: triple },
]

async function funded(t) {
  await t.say('Meet Ishaan, from BD. He wants brands that just raised money and are at Series B. That is two conditions, so it is a good way to see how filters combine.')
  await t.chipPick('Signal', ['Funding'])
  await t.say('Signal is a news item. This keeps brands with a funding signal. That is the Signals group.')
  await t.chipPick('Funding', ['Series B'])
  await t.say('Funding is a company fact: the brand is at Series B. That sits in the Company group. A different group.')
  await t.tab('Companies')
  await t.say(`Match any is on. That is the default. A company shows if it fits at least one group. So ${t.n().companies} companies appear.`)
  await t.look(() => $$('.bdv-via').find((v) => v.children.length === 1), 'Companies with one tag fit only one group. A funding signal, or Series B, but not both.')
  await t.look(() => $$('.bdv-via').find((v) => v.children.length === 2), 'Two tags means both. Those are sorted to the top.')
  await t.match('Match all')
  await t.say(`Now Match all. The company must fit every group. Only ${t.n().companies} are left. They raised money and they are Series B. Those are the hot leads.`)
  await t.tab('Signals')
  await t.say(`The other tabs follow. Signals now shows just ${t.n().signals} news items, from those companies.`)
  await t.say('So: any is a wide net, all is a sieve. And inside one chip, several picks are always an or.')
}

async function newCmo(t) {
  await t.say('Aarav sells to new decision makers. A new CMO reviews agencies in the first ninety days. He wants brands with a leadership change, and a senior person to call.')
  await t.chipPick('Signal', ['Leadership'])
  await t.chipPick('Seniority', ['CXO'])
  await t.tab('Companies')
  await t.say(`Seniority is a People filter. That is a third kind of group. Look at Match any: ${t.n().companies} companies. Nearly every brand has a CXO, so any floods the list.`)
  await t.match('Match all')
  await t.say(`Match all fixes it. ${t.n().companies} brands, each with a leadership signal and a CXO we could contact.`)
  await t.tab('People')
  await t.say(`The People tab shows ${t.n().people} people at those brands. Some have a lock. Their contact needs an Apollo reveal. People already on file are free.`)
  const lock = () => byText('.bdv-list .li button', 'Reveal') // a person's row, not the bulk bar
  if (lock()) {
    const before = t.credits()
    await t.click(lock)
    await t.settle(500)
    await t.say(`That reveal cost one credit. ${before} became ${t.credits()}.`)
  }
  await t.say('Credits are the real cost in this tool. Reveal only the people you will actually write to.')
}

async function apolloCase(t) {
  await t.say('Zoya is building a list for a new category. Personal care brands, at Series A or Series B, even ones we have never tracked.')
  await t.chipPick('Industry', ['Personal care'])
  await t.chipPick('Funding', ['Series A', 'Series B'])
  await t.say('Two picks in one chip are an or. Series A or Series B.')
  await t.tab('Companies')
  await t.say(`Our own database has ${t.n().companies}. Apollo is a much bigger directory, so let us ask it.`)
  const start = t.credits()
  await t.click(() => byText('.bdv-beyond-b', 'Search Apollo'))
  await t.look(() => $$('.apo-p')[0], 'This is the exact request Apollo receives. Industry goes through, in Apollo’s own words: consumer goods.')
  await t.look(() => $$('.apo-p.skip')[0], 'Funding does not. Apollo has no filter for funding stage, so it cannot narrow by Series A or B.')
  await t.look(() => $$('.apo-req .chip')[0], 'Company search costs one credit per page, and a page holds up to a hundred companies. Not one credit per company.')
  await t.click(() => byText('.apo-go button', 'Search'))
  await t.say(`Apollo found ${t.text('.apo-rh b')} companies. One page, one credit.`)
  await t.look(() => $$('.apo-org .bdv-meta')[2], 'Look at what came back. Name, website, phone, founded year and social links. No industry, no size, no funding. Company search only says who a company is.')
  await t.look(() => $$('.apo-org .chip.g')[0], 'Companies we already have come back too. They sit on the page we paid for.')
  await t.click(() => $$('.apo-org').find((r) => r.innerText.startsWith('Mylo'))?.querySelector('button'))
  await t.say(`Enriching Mylo costs one more credit, and fills in industry, size, revenue and funding. It is Series B, so it joins our list. ${t.n().companies} companies now.`)
  await t.tab('People')
  await t.click(() => byText('.bdv-beyond-b', 'Search Apollo people'))
  await t.click(() => byText('.apo-go button', 'Search'))
  await t.look(() => $$('.apo-pe')[0], 'People search is free. But the last name is hidden, and there is no email or phone. Only flags saying whether Apollo has them.')
  await t.click(() => $$('.apo-pe').find((r) => /Enrich/.test(r.innerText))?.querySelector('button'))
  await t.say('Enriching a person costs one credit, up to ten people per call. A mobile number costs eight more, and arrives a few seconds later.')
  await t.say(`${start - t.credits()} credits spent in total. ${t.credits()} left.`)
  await t.say('This was a demo. I am putting your credits and database back as they were.')
}

async function panelCase(t) {
  await t.say('Karan prefers the side panel. Its advantage is that every option shows how many results it would give, before you click.')
  await t.click(() => document.querySelector('[aria-label="Filters in a side panel"]'))
  await t.settle(500)
  await t.tab('Signals')
  await t.say('Each number is a live count, with all your other filters applied. Zero means a dead end.')
  await t.facet('Type', 'Funding')
  await t.facet('Type', 'Launch')
  await t.say('Funding or launch. Picks inside one filter are an or, and the counts below already reflect it.')
  await t.facet('Relevance', 'High')
  await t.say(`Relevance high narrows it further. Across filters in the same group it is an and. ${t.n().signals} signals, from ${t.n().companies} companies.`)
  await t.facet('Funding', 'Series B')
  await t.say('Now a company fact: Series B. That is a second group, so Match mode matters.')
  await t.tab('Companies')
  await t.say(`On Match any, ${t.n().companies} companies. Series B brands, plus brands with a strong funding or launch signal.`)
  await t.match('Match all')
  await t.say(`On Match all, ${t.n().companies}. Series B, and a high relevance funding or launch signal.`)
  await t.say('The active filters also show as chips on top, so you can remove one and watch the counts move.')
  await t.click(() => document.querySelector('[aria-label="Filters as a bar"]'))
  await t.settle(500)
}

async function triple(t) {
  await t.say('Riya wants a hot list for this week. It uses all three groups at once. Signals, Company, and People.')
  await t.chipPick('Signal', ['Leadership', 'Funding'])
  await t.chipPick('Recency', ['Last week'])
  await t.say('Signal group: leadership or funding news, from the last week.')
  await t.chipPick('Funding', ['Series B'])
  await t.say('Company group: Series B.')
  await t.chipPick('Seniority', ['CXO'])
  await t.say('People group: a CXO. Three groups are set.')
  await t.tab('Companies')
  await t.say(`On Match any, ${t.n().companies} companies. Far too many. Each fits at least one group.`)
  await t.look(() => $$('.bdv-via').find((v) => v.children.length === 3), 'The tags show why. Signal, Company and People. Three tags is the best fit, so those sit on top.')
  await t.match('Match all')
  await t.say(`On Match all, ${t.n().companies}. Only brands that fit all three. That is a list you can work this afternoon.`)
  await t.say('Let me save it as a view.')
  await t.click(() => document.querySelector('.bdv-vbtn'))
  await t.type(() => document.querySelector('[aria-label="View name"]'), 'Hot this week')
  await t.click(() => byText('.bdv-vsave button', 'Save'))
  await t.esc()
  await t.click(() => byText('.bdv-fbar-1 button', 'Clear'))
  await t.say(`Clear empties the filters, but keeps the match mode. ${t.n().companies} companies, everything.`)
  await t.click(() => document.querySelector('.bdv-vbtn'))
  await t.click(() => byText('.bdv-vgo', 'Hot this week'))
  await t.say(`The saved view brings back the filters and Match all together. ${t.n().companies} companies again. One click, every morning.`)
  await t.esc()
}

export { $$, byText, norm }
