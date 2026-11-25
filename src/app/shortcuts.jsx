// Every keyboard shortcut in one place: the ? panel and Settings › Shortcuts both read SHORTCUTS.
import { useEffect, useRef, useState } from 'react'
import { Search, Keyboard } from 'lucide-react'
import { ALT, MOD, MOD_SHIFT } from '../shared/motion'
import { Sheet } from './pages/Finance'

/** [group, [[label, keys]]]. Keys are space-separated: each word is one key cap ("J K" = J or K). */
export const SHORTCUTS = () => [
  ['General', [
    ['Search and commands', MOD + 'K'], ['Keyboard shortcuts', '?'], ['Settings', MOD + ','], ['Collapse sidebar', MOD + 'B'],
    ['Ask WLDD (when docked)', MOD + 'J'], ['Home', ALT + '0'], ['Switch to Pod', ALT + '1'], ['Switch to Finance', ALT + '2'], ['Switch to BD', ALT + '3'],
  ]],
  ['To-do', [
    ['Add a to-do', 'T'], ['To-do on anything', 'Right-click'], ['Next / previous to-do', 'J K'], ['Tick the selected to-do', 'X'], ['Open the selected to-do', 'Enter'],
  ]],
  ['Tagging with @', [
    ['Tag anything', '@'], ['Companies', '@c:'], ['Signals', '@s:'], ['People', '@p:'], ['Colleagues', '@m:'], ['Deals', '@d:'], ['Campaigns', '@k:'], ['Invoices', '@i:'], ['Creators', '@v:'],
    ['Move through results', '↑ ↓'], ['Pick', 'Enter Tab'], ['Close the list', 'Esc'],
  ]],
  ['Lists & boards', [
    ['New campaign (Pod)', 'C'], ['List ⇄ board', MOD_SHIFT + 'B'], ['Next / previous row', 'J K'], ['Open row', 'Enter'], ['Close panel', 'Esc'],
  ]],
  ['BD search', [
    ['Apply the search to every tab', 'Enter'], ['Move through suggestions', '↑ ↓'], ['Close suggestions, then clear', 'Esc'],
  ]],
  ['Look', [
    ['Cycle Home layout', ALT + 'H'], ['Cycle experience', ALT + 'E'], ['Cycle style', ALT + 'S'], ['Cycle Pop presets', ALT + 'P'],
  ]],
  ['Vercel experience', [['Find', 'F']]],
]

export const Keys = ({ k }) => <span className="sc-keys">{k.split(' ').map((x, i) => <kbd key={i} className="k">{x}</kbd>)}</span>

export const openShortcuts = () => window.dispatchEvent(new Event('shortcuts:open'))

/** The ? panel: every shortcut, grouped, with a filter. Opens from ?, ⌘K or Settings. */
export function ShortcutsPanel() {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const inp = useRef(null)
  useEffect(() => {
    const show = () => setOpen((o) => !o)
    const key = (e) => {
      if (e.key !== '?' || e.metaKey || e.ctrlKey || e.altKey) return
      const t = e.target
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      e.preventDefault(); show()
    }
    window.addEventListener('shortcuts:open', show); window.addEventListener('keydown', key)
    return () => { window.removeEventListener('shortcuts:open', show); window.removeEventListener('keydown', key) }
  }, [])
  useEffect(() => { if (open) { setQ(''); setTimeout(() => inp.current?.focus({ preventScroll: true }), 60) } }, [open])
  const lo = q.trim().toLowerCase()
  const groups = SHORTCUTS().map(([g, items]) => [g, lo ? items.filter(([l, k]) => (g + ' ' + l + ' ' + k).toLowerCase().includes(lo)) : items]).filter(([, items]) => items.length)
  return (
    <Sheet open={open} onClose={() => setOpen(false)} width={420}>
      <div className="sc">
        <div className="sc-h"><Keyboard size={16} className="mute" /><b className="grow">Shortcuts</b></div>
        <label className="inp sc-q"><Search size={14} /><input ref={inp} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter" aria-label="Filter shortcuts" /></label>
        <div className="sc-b">
          {groups.map(([g, items]) => (
            <section key={g} className="sc-g">
              <div className="sc-gh">{g}</div>
              {items.map(([l, k]) => <div key={l} className="sc-r"><span className="grow">{l}</span><Keys k={k} /></div>)}
            </section>
          ))}
          {!groups.length && <div className="mute sc-none">No match</div>}
        </div>
      </div>
    </Sheet>
  )
}
