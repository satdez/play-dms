---
name: wldd-taste
description: Design and motion rules for the WLDD DMS. Use whenever building or changing any screen, component, copy or animation in this repo (src/app). Covers text discipline, layout, tokens, motion and the shared primitives to reuse.
---

# WLDD DMS — taste rules

The product is WLDD's campaign platform (see `DMS-app-context/*.md`): Sales/BD → POD → Inventory/Procurement → Creator Portal → Finance, with HR roles underneath.
Design for **this product's workflows**. Take restraint, density and motion quality from Linear, Vercel, Attio, Notion, Plain, Family and Emil Kowalski. **Never copy another product's layout, chrome or naming.**

## 1. Words: say less
- No subtitles under page titles. No "Here's what's happening" lines. No helper paragraphs explaining the UI.
- Labels are 1–2 words ("Approve", "Pay", "Move to Activation"). Never "Click here to…".
- Explanations, definitions and shortcuts go in a **tooltip** (`<Tip label kbd>`), not on the page.
- Counts sit next to the label as a muted number, never as a sentence ("Invoices 11", not "11 invoices awaiting review").
- Empty states are one bold word plus an icon ("Clear", "Locked"), with at most one short line.
- Don't decorate with emoji, sparkles or "✨ You're all caught up!".
- Don't show fake chrome: no fake URLs, branch names or logs that don't exist in DMS.
- **Never say the same thing twice on one screen.**
  - The top bar owns the page title, with its icon and a live count. Pages don't repeat it as an h1; `.d-head` keeps only the controls.
  - A detail page's crumb shows the record code, not the name the header already shows.
  - Don't repeat a name inside its own row ("Lenskart · Brief received from Lenskart").
  - Use the freed space for information: counts, breakdowns, totals.

## 2. Layout
- One sidebar: logo, **role switcher** (Pod / Finance / Sales, ⌥1–3), the role's pages, and pinned items. Content is on `--surface`; the sidebar sits on `--bg`.
- Page = `.d-page` → `.d-head` (h1 + right-aligned controls) → content. Max width 1120 (1360 for tables).
- Prefer **lists** (`.list > .li`) and **tables** (`.tbl`) with hairline separators over cards. Cards only for metrics and boards.
- One primary (ink) action per view at most.
- Colour is meaning only. WLDD logo colours mark modules (Pod = green, Finance = violet, Sales = yellow, Creators = pink), statuses and charts. Chrome stays neutral.

## 3. Motion (Emil Kowalski / Family)
- **Never animate on page load.** No staggered fade-ups, no count-up numbers, no charts drawing in.
- Animate **state changes** only: approve, move, switch, open, close.
- Ease-out `cubic-bezier(.23,1,.32,1)`, 150–300ms. Sheets and trays use the drawer curve `[.32,.72,0,1]` at ~360ms.
- Never scale from 0; start at ≥0.93. Popovers scale from their trigger's corner (`transformOrigin`).
- Buttons press to `scale(.97)`.
- Keyboard actions are instant. Mouse actions get the morph.
- **Sidebar navigation never animates.** The active item is an instant filled background, like Linear: no sliding pill and no layoutId. A sliding indicator is fine inside a page (segments, tabs), never for app-level navigation.
- Blur at 2px bridges crossfades (`<Swap>`).
- Use delight for rare, high-stakes moments (paying vendors, converting a deal). Use subtle touches for frequent actions.

## 4. Primitives — reuse, don't reinvent
`src/shared/motion.jsx`:
- `Tip`: tooltip with a delay on the first one, instant after that.
- `Ticker`: digits roll when the value changes and stay static on mount.
- `TextMorph`: shared letters persist between labels.
- `ConfirmButton`: the label morphs to the done state, then the action fires.
- `AutoHeight` / `AutoWidth`.
- `SlidePanel`: directional content swap for tabs and segments.
- `Swap`: blur crossfade.
- `NewCampaignTray` / `openNewCampaign()`.

`src/app/ui.jsx`:
- `Seg`, `Tabs` (shared-layout pill or underline)
- `Track`: 6-stage campaign track
- `Chain`: invoice approval chain
- `Popover`, `Switch`, `ClientLogo`, `Svc`

`src/app/pages/Finance.jsx`: `Sheet`, the right drawer.

`src/app/media.jsx`: `MediaGrid` handles every reel, post, story and proof-of-work preview, and includes the viewer. Build items with `postItem()` / `invoiceMedia()`. Don't use the old `Thumb`; it's for the archive only.

`src/shared/brands.jsx`: `BrandLogo`. **Always show the real logo for real companies** (clients, prospects, agencies). When you add a new brand, add its domain to `BRAND_DOMAINS`. Letter marks are only for fictional entities, or as the automatic fallback when a logo fails to load.

## 5. Experiences × styles
There are two independent axes. Both are switched from the Appearance menu (the palette in the sidebar footer, or the avatar in Vercel), from ⌘K, or from the URL (`?exp=attio&style=ink`).
- **Experience** (`html[data-exp]`, `src/app/exp.css`) changes *structure*. Switch it with ⌥E.
  - **linear**: inset panel, view tabs plus a Display button, full-bleed dense grouped rows, j/k/Enter.
  - **vercel**: no sidebar; top scope switcher and tabs, a full-bleed title band, a search toolbar, cards.
  - **attio**: object header, a view bar (view ▾ · Sort · Filter · View settings), a spreadsheet grid with inline-editable cells, footer aggregates, bulk bar, and records that open in a peek panel.
- **Style** (`html[data-style]`, `src/app/styles.css`) changes *paint*: paper (base), ink, or pop (warm sand/slate, 1px hairlines, a 2px pressable lip under controls; yellow only on the primary action, never on whole rows or the nav). Switch it with ⌥S.
  - **Pop is tunable** (`src/app/popTune.jsx`, `html[data-pop-tone|btn|font|corner]`): tone (sand/sage/haze/clay, each owns one logo colour as its CTA), buttons (lip/flat/soft/pill), type (plex/geist/manrope/bricolage), corners (4/6/10/14). Presets Sand/Sage/Haze/Clay = named combos; ⌥P cycles them; URL `?style=pop&tone=…&btn=…&font=…&corner=…`. In Pop CSS use `var(--pr|--pr-s|--pr-l)` for radii and `var(--hl)` for accents, never hard values.
- **View engine** (`src/app/views.jsx`):
  - Five layouts: list, board (drag to change stage, pod or lead), table, timeline and grid.
  - Display popover: grouping, ordering, show completed, timeline zoom, property chips. ⌘B flips list ⇄ board.
  - Each experience has its own defaults, persisted per experience.
  - Use this engine for any new record collection rather than writing bespoke lists.
- A new component must look right in every experience × style combination.
- Use tokens and existing classes (`.b`, `.card`, `.seg`, `.chip`, `.li`, `.tbl`) so the styles can restyle it. Don't add one-off inline colours or radii.

## 5a. Settings
- `src/app/pages/Settings.jsx` at `#/settings/:section` (gear in the sidebar footer, MOD+, , ⌘K). Sections: You (profile, preferences, notifications, shortcuts, security) and Workspace (members, pods, roles & access, approvals, finance, integrations, audit log).
- Build with `Group` → `Row` (label + optional info tip → control on the right). Use `Field` (saves on blur), `Ck` for matrices and `useStored` for persistence. Don't write per-section layouts.
- Preferences are real. `look.prefs` drives `html[data-density]`, `html[data-motion]` (plus `MotionConfig`), `fmt.intl` for amounts, and the start workspace.
- Any new shortcut goes in the Shortcuts section too. Label it with `ALT`/`MOD` from `shared/motion`, never hard-coded ⌥/⌘.

## 5a+. Themes
- Settings › Preferences has Font (overrides any style through `html[data-font]`), Mode (Light/Dark/System), a **Themes** gallery and a **Custom** tab (accent swatches or any colour, plus the Pop mixer).
- Themes come from `THEMES` in `popTune.jsx`. Each one sets a style, plus a tone for Pop. Choosing a theme clears any custom accent.
- **Theme names are Indian words** (Satish asked for this): Khadi, Kajal, Haldi, Tulsi, Baingani, Gulabi, Neel, Kesar, Mor, Koyla, Jamun, Ujala (high contrast), Drishti (colour-blind safe). Ids stay English (`sand`, `jam`, …) because they're saved in localStorage. Name new themes in the same spirit.
- Jamun is the "Slack × PostHog" theme. A plum sidebar frames warm paper, with lip controls and a yellow primary. It re-scopes tokens on `.d-side`/`.vx-side` through `--side`. A coloured sidebar needs exactly that pattern: re-scope the tokens, don't write one-off colours.
- A custom accent is written as inline custom properties on `<html>` (`--ink`, `--cta`, `--hl`, …), so it outranks every tone.

## 5b. Details
- **One layer per element.** A chip is either a soft fill (`color-mix(fg 6%)`) or a ring, never both, and never a ringed thing inside a ringed thing. The segmented track is a fill; its pill is a raised surface in light mode and a lighter fill in dark mode.
- `Tip` wraps its child in `span.tipw`. Never style with descendant selectors like `.x span`; give the inner element a class (e.g. `.svc-c`).
- Prefer a dot plus text (`.pod-tag`) over a filled pill for categorical values in dense rows.

## 5c. Mobile
- All phone/tablet rules live in `src/app/mobile.css`, behind `max-width` queries. **Desktop (>960px) must stay pixel-identical**, so never add an unscoped rule there.
- ≤960: the sidebar (`.d-side` / `.vx-side`) becomes a left drawer. `.m-menu` in the top bar opens it, `.m-scrim` closes it, and it also closes on route change or Esc. It's the same component, not a second nav.
- ≤760:
  - Tables scroll sideways inside themselves.
  - `.vli` rows keep only stage, logo, name and budget.
  - Segments, tabs and view bars become scroll strips.
  - Boards swipe column by column.
  - `.split` stacks the list over the detail, and tapping a row scrolls to the detail.
  - Sheets go near full-screen.
  - Create buttons go icon-only via `.m-hide`.
- New components: give flex text columns `.grow` (shrinks via `min-width:0`), and add a mobile.css rule if a row has more than about 3 trailing columns.

## 6. Tokens
`src/app/app.css` holds everything as CSS variables on `html[data-variant='app']`, with a dark mode. Never hard-code colours in components; use `var(--fg|--muted|--line|--green|…)`.
