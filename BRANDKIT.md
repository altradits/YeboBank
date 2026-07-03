# YeboBank Brand Kit

**Version 2.0 · The single source of truth for how YeboBank looks, moves, speaks, and behaves.**

This document serves everyone who touches the brand: designers, developers, marketers, founders,
sales teams, agents, and community contributors. If a decision about YeboBank's presentation isn't
covered here, propose an addition — don't invent a one-off.

Framework references: [Material Design 3](https://m3.material.io/) (type roles, motion tokens,
state layers, theming), [Material 1](https://m1.material.io/#) (ink-and-paper depth metaphor),
and [Google Design](https://design.google/) (clarity-first product storytelling). We borrow their
*systems*, never their look — YeboBank is Kenyan, warm, and forest-and-gold, not Google-blue.

---

## 1. Brand Foundations

### Vision

YeboBank is an open-source Bitcoin savings bank for Kenya. Every design decision should
communicate **financial confidence**, **community trust**, and **technological clarity** —
without feeling foreign, corporate, or inaccessible.

### Mission

Give low-income earners a way to pool capital, grow savings, and protect their money from
inflation — through cash agents they already know, chamas they already run, and rails
(M-Pesa, Lightning) they already use.

### Brand personality

| Trait          | Means                                        | Never means                    |
|----------------|----------------------------------------------|--------------------------------|
| Trustworthy    | Qualified promises, visible math, receipts   | Stiff, legalistic, cold        |
| Neighbourly    | Speaks like a knowledgeable friend           | Slang-heavy, unprofessional    |
| Precise        | Mono digits, exact sats, live rates          | Jargon walls, dev-speak        |
| Grounded       | Kenyan references, earth-tone palette        | Safari clichés, poverty tropes |
| Quietly modern | Motion with purpose, dark-first UI           | Flashy, neon, crypto-bro       |

### Who uses this kit

- **Designers** — §3–§9 (color, type, shape, motion, components)
- **Developers** — §10 (implementation tokens), plus every table's CSS variables
- **Marketers & sales** — §11–§12 (voice, messaging, boilerplates)
- **Founders & partners** — §1, §12 (story, one-liners, brand protection)

---

## 2. Brand Name & Logo

- **YeboBank** — one word, camel case, always. Never: Yebo Bank, yebobank (prose), YEBOBANK, Yebo-Bank.
- In URLs and code: `yebobank` (all lowercase, no separator).
- Logotype: display font (Syne 800), the interior **B** rendered in Gold — `Ye`**`B`**`o` — as in the app's ATM card.
- Logomark: the `LogoMark` component (Y-bolt). Minimum size 20px; clear space = the height of the mark on all sides.
- Tagline: **"Save in Bitcoin. Spend in shillings."** Second-line variant for agents:
  *"Cash in and out, down the street."*

**Don'ts:** don't recolor the mark outside brand colors, stretch it, place it on lime, or add drop shadows.

---

## 3. Color

### 3.1 Brand palette

| Name         | Hex        | CSS variable     | M3 role equivalent        | Usage                                    |
|--------------|------------|------------------|---------------------------|------------------------------------------|
| Forest Deep  | `#030C07`  | `--ink`          | surface (dark)            | Primary dark background                   |
| Forest Mid   | `#11A65B`  | `--emerald-deep` | primary                   | Primary actions, success, growth          |
| Lime         | `#96C244`  | `--lime`         | secondary                 | Live indicators, secondary highlights     |
| Gold         | `#C49020`  | `--gold`         | tertiary                  | CTAs, premium tier, Bitcoin               |
| Gold Soft    | `#E0A820`  | `--gold-soft`    | tertiary-container        | Hover states, lighter gold                |
| Gold Text    | `#A87800`  | `--gold-text`    | on-tertiary-container     | Gold on light backgrounds                 |
| Terra        | `#8C4A28`  | `--terra`        | error/warning             | Warnings, destructive, earth tones        |

### 3.2 Neutral scale

| Token       | Dark mode                 | Light mode                | Usage               |
|-------------|---------------------------|---------------------------|---------------------|
| `--text`    | `#F0EDE6`                 | `#1A2419`                 | Primary text        |
| `--muted`   | `rgba(240,237,230,.72)`   | `rgba(26,36,25,.72)`      | Secondary text      |
| `--soft`    | `rgba(240,237,230,.45)`   | `rgba(26,36,25,.45)`      | Tertiary text       |
| `--surface` | `rgba(255,255,255,.04)`   | `rgba(255,255,255,.82)`   | Card surfaces       |
| `--border`  | `rgba(255,255,255,.09)`   | `rgba(26,36,25,.14)`      | Borders, dividers   |

### 3.3 State layers (M3 pattern)

Interactive surfaces communicate state with a translucent overlay of the content color —
never by swapping to an unrelated color:

| State    | Overlay opacity | Example                                        |
|----------|-----------------|------------------------------------------------|
| Hover    | 8%              | `rgba(255,255,255,.08)` on dark card actions   |
| Focus    | 12% + 2px ring  | Ring color = the component's accent            |
| Pressed  | 12%             | Combine with `scale(0.98)` where tactile       |
| Dragged  | 16%             | Reserved for future reorder interactions       |
| Disabled | content at 38%  | Never remove the element; dim it               |

### 3.4 Usage rules

- **Gold** for primary CTAs only — one gold button per viewport.
- **Emerald** for success, savings growth, and confirmation states.
- **Lime** for live data, indicators, and secondary highlights — never for text on gold, never gold text on lime (contrast fails).
- Dark sections use `rgba` overlays, never opaque fills — maintain depth.
- Money-in is always emerald; money-out is neutral or terra, never red-alarm.

### 3.5 Accessibility

- Body text ≥ 4.5:1 contrast against its background; large display text ≥ 3:1.
- Interactive targets ≥ 44×44px on touch.
- Color never carries meaning alone: pair with icon or label (credit ✓ + emerald, debit ✕ + neutral).

---

## 4. Typography

### 4.1 Font stack

| Role    | Font               | Variable         | Fallback   |
|---------|--------------------|------------------|------------|
| Display | **Syne**           | `--font-display` | sans-serif |
| Body    | **DM Sans**        | `--font-body`    | sans-serif |
| Mono    | **JetBrains Mono** | `--font-mono`    | monospace  |

All fonts load via `next/font/google` with `display: swap` — zero layout shift.

**Why these fonts:** Syne's wide geometric letterforms give headings intentional, premium
personality. DM Sans is an optical-size grotesque with exceptional 14–18px clarity — approachable
but professional. JetBrains Mono renders sats, Lightning addresses, and rates with technical
precision (and tabular digits, so balances don't jitter).

### 4.2 Type scale (M3 role naming)

Mapped to Material 3's display/headline/title/body/label roles so any designer or dev familiar
with Material can navigate instantly:

| M3 role        | YeboBank token | Size                        | Font    | Weight  | Usage                          |
|----------------|----------------|-----------------------------|---------|---------|--------------------------------|
| Display Large  | Hero H1        | `clamp(44px, 5.6vw, 72px)`  | Syne    | 700     | Landing hero headline          |
| Headline Large | Section H2     | `clamp(28px, 3.2vw, 40px)`  | Syne    | 600–700 | Feature section headings       |
| Headline Small | Page title     | 22–26px                     | Syne    | 600     | App page titles                |
| Title Medium   | Card title     | 16–17px                     | Syne    | 600     | Card headings, modal titles    |
| Body Large     | Lead           | 18px                        | DM Sans | 400     | First paragraph of sections    |
| Body Medium    | Body           | 15–16px                     | DM Sans | 400     | All body copy, card text       |
| Label Large    | Button         | 15px                        | Syne    | 600     | Button labels                  |
| Label Medium   | Kicker         | 13–14px                     | Mono    | 500     | Kickers, stat labels, nav      |
| Label Small    | Micro          | 10–12px                     | Mono    | 400–500 | Timestamps, footnotes, readouts|

### 4.3 Weight & spacing conventions

- `800` hero numerals only (sat counter, inflation comparison) · `700` H1, logotype, bold stats ·
  `600` H2, kickers, buttons, nav · `500` emphasis, card titles · `400` body.
- Display headings `letter-spacing: -0.03em`; body default; mono data `-0.02em to 0.01em`;
  all-caps labels `0.06em–0.1em`.
- Numbers that change (balances, rates) always in mono — layout never shifts.

---

## 5. Shape & Space

### 5.1 Spacing scale — base unit 4px

| Token | Value | Usage                                      |
|-------|-------|--------------------------------------------|
| `xs`  | 4px   | Icon padding, micro gaps                   |
| `sm`  | 8px   | Inline element gaps                        |
| `md`  | 16px  | Default padding, card insets               |
| `lg`  | 24px  | Section sub-gaps, form rows                |
| `xl`  | 40px  | Between major elements                     |
| `2xl` | 64px  | Section padding (tablet)                   |
| `3xl` | 104px | Section padding (desktop), two-column gaps |

### 5.2 Shape scale (border radius)

| Token      | Value  | M3 equivalent | Usage                            |
|------------|--------|---------------|----------------------------------|
| `--r-sm`   | 8px    | small         | Tags, chips, small inputs        |
| `--r-md`   | 14px   | medium        | Cards, modal surfaces            |
| `--r-lg`   | 22px   | large         | Feature panels, large containers |
| `--r-pill` | 999px  | full          | Buttons, badges, pill chips      |

Rule of thumb: the bigger the surface, the bigger the radius. Never mix radii on sibling elements.

### 5.3 Elevation & depth (Material 1 heritage)

YeboBank's dark theme expresses elevation the M1 "ink on paper" way — higher surfaces are
*lighter overlays*, not bigger shadows:

| Level | Surface treatment                      | Example                    |
|-------|----------------------------------------|----------------------------|
| 0     | `--ink` background                     | Page background            |
| 1     | `rgba(255,255,255,.04)` + border       | Cards                      |
| 2     | `rgba(255,255,255,.07)`                | Hovered action tiles       |
| 3     | Solid dark + `box-shadow` + color glow | ATM card, modals, tooltips |

Light theme inverts to soft shadows on ivory. Shadows never exceed `0 14px 44px rgba(0,0,0,.55)`.

---

## 6. Motion

Adapted from [M3 motion](https://m3.material.io/styles/motion/overview/how-it-works): motion is
for *comprehension* — showing where things come from and go — never decoration.

### 6.1 Easing tokens

| Token                | Curve                            | Use                                 |
|----------------------|----------------------------------|-------------------------------------|
| Emphasized (default) | `cubic-bezier(0.2, 0, 0, 1)`    | Reveals, modals, anything on-screen |
| Standard             | `ease-out`                       | Hover states, small transitions     |
| Exit                 | `ease-in` (accelerate)           | Elements leaving the screen         |

### 6.2 Duration tokens

| Token  | Value     | Use                                        |
|--------|-----------|--------------------------------------------|
| short  | 150–200ms | Hover, focus, state layers                 |
| medium | 300–400ms | Modals, dropdowns, chips                   |
| long   | 500–700ms | Section reveals, page-level transitions    |
| count  | 1400ms    | Count-up numerals (cubic easing)           |

### 6.3 House patterns

- Page reveals: `opacity 0→1`, `translateY 24px→0`, `0.6s ease-out`; stagger with `.d1/.d2/.d3` (+0.1s each).
- Transition patterns (M3): **fade-through** for tab/filter swaps; **container transform** for
  card→detail (the card visually becomes the page); **shared-axis Y** for step flows (deposit → PIN → done).
- Pulse rings 2.4–2.8s infinite (agent map); bolt breathe 2.4s drop-shadow oscillation.
- `prefers-reduced-motion`: count-ups jump to final value; pulses and parallax stop; reveals become plain fades.

---

## 7. Components

### 7.1 Buttons

| Variant            | Recipe                                                                  |
|--------------------|-------------------------------------------------------------------------|
| Primary (Gold)     | `--gold` bg, pill radius, `14px 26px` padding, Syne 600 15px. Hover: scale 1.03 + glow |
| Primary (Emerald)  | Same geometry, `--emerald-deep` bg — in-app confirmations               |
| Ghost on dark      | Transparent + `rgba(255,255,255,.2)` border, white text. Hover: gold border |
| Ghost on light     | `--border` border, `--text` text. Hover: emerald border                 |
| Destructive        | `--terra` bg, white text — always paired with a confirm step            |

**Button groups** (per [M3 button groups](https://m3.material.io/components/button-groups/overview)):
related choices render as a connected segmented control (`.seg`) — single-select, one option
always active, used for KES/sats, M-Pesa/Lightning, time ranges. Independent actions get
separate buttons with 8–12px gaps; never more than one gold button per group.

### 7.2 Cards

Surface/border per §5.3 level 1. Radius `--r-md`. Padding `20px 22px` (standard), `28px 30px`
(feature). A card is one idea: one stat, one action, one entity.

### 7.3 Inputs & forms

`.input` — filled style, `--r-sm`+ radius, border `--border`, focus ring per §3.3. Labels above,
never placeholder-only. Amounts: `inputMode="decimal"`, mono rendering, live ↕ conversion line
underneath (KES ↔ sats always visible).

### 7.4 Modals

One purpose per modal, 2–3 fields max (see QuickActionModal). Overlay `rgba(12,36,24,.55)` dark /
`rgba(0,0,0,.75)` in dark theme. Close via ×, overlay tap, and Esc. Actions row: primary right,
ghost cancel left (`.modal-actions` is row-reversed).

### 7.5 Navigation

Sidebar (desktop) groups: Wallet / Grow / Account, with role-gated Mlinzi Console. Bottom nav
(≤900px): max 6 items, icons + 9px labels. Everyday money actions (deposit/withdraw/send/lock)
are **inline quick actions, not routes** — no button on a dashboard leads outside that dashboard.

### 7.6 Chips, badges, tooltips

Pills (`--r-pill`), mono labels. Status badges: emerald=confirmed, gold=pending, terra=failed.
Tooltips: dark solid surface + 1px accent ring (see `.kenya-tip`), never browser-default.

### 7.7 Signature components

- **ATM card** — the brand centerpiece: forest-to-gold gradient (`#050A06 → #0A2016 → #1C1200`),
  gold chip, mono balance with KES/sats toggle, glow orbs. Variants: dashboard / full / compact.
- **Agent map** — all 47 Kenya county boundaries (geoBoundaries ADM1) in a `440 × 557.7` SVG.
  Counties tappable with per-county agent counts; "Find agents near me" uses geolocation +
  haversine ranking. City hubs pulse.
- **WhatsApp bar** — conversation belongs to WhatsApp (`#25D366` accent allowed here only);
  money actions stay in YeboBank.

---

## 8. Iconography

Library: **Tabler Icons** (`@tabler/icons-webfont` v3.7.0), `ti-*` classes — clean 2px line style
matching the brand. Sizes: 16–18px inline · 20–24px buttons · 28–32px feature cards.
Icons always accompany, never replace, labels in navigation and buttons (except bottom nav +
label). One icon per concept, reused everywhere (deposit is always `ti-arrow-down`).

---

## 9. Illustration & Data Viz

Feature sections use **inline SVG only** (crisp at all DPRs, themeable):
Savings = vault dial with gold bolts · M-Pesa = phone with STK screen · Chama = lotus petal ring ·
Agents = real Kenya county map · Lightning = golden bolt + arc particles.

Charts: minimal — one accent series color, hairline grid, mono axis labels, no 3D, no legends
when one series. Growth is emerald/lime; deposits gold. Value vs contributed uses two weights
of the same hue family, never two clashing hues.

---

## 10. Theming (implementation)

Per [material-web theming](https://github.com/material-components/material-web/blob/main/docs/theming/README.md),
every themable decision is a CSS custom property — components read tokens, never hex:

- Themes switch via `data-theme` on `<html>`; persisted to `localStorage` as `yebo-theme`;
  a `<head>` script applies it before first paint (no flash).
- Dark (default) = depth and digital precision; light = ivory/cream + deep forest, same warmth.
- Adding a themed style: define both `:root` and `[data-theme="light"]` values in `globals.css`;
  never hardcode a hex in a component (exceptions: ATM card face and WhatsApp green, which are
  invariant across themes).
- New colors enter this document *before* they enter the codebase.

---

## 11. Voice & Tone

**Principle:** direct, honest, warm. YeboBank speaks like a knowledgeable neighbour, not a bank.

- Active voice, short sentences. Explain jargon immediately (sats = satoshis = fractions of Bitcoin).
- Acknowledge the real problem (inflation eats savings) without being preachy.
- Reference real Kenyan life: chai, matatu, M-Pesa, chama, duka, mwakala. Light Swahili greetings
  (Habari, Karibu) in-app are welcome; full sentences stay in the user's chosen language.
- Financial promises always qualified: "~5.2% APY", "projections, not guarantees."
- Celebrate community: "local agents," "your chama," "your neighbourhood."

**Never say:** "revolutionary / disruptive / paradigm shift" · "HODL" or crypto-Twitter slang ·
"cutting-edge blockchain technology" · absolute return guarantees · fear-based inflation panic.

**Microcopy patterns:** buttons are verbs ("Lock savings", not "Submit") · errors say what to do
next, never blame ("Couldn't get your location — tap your county instead") · success confirms the
consequence ("Locked 50,000 sats for 5 years. Interest starts accruing now.").

---

## 12. Messaging for Marketing, Sales & Founders

**One-liner:** YeboBank turns everyday shillings into Bitcoin-backed savings — through the shop
down the street.

**Boilerplate (short):** YeboBank is an open-source Bitcoin savings bank for Kenya. Save in
Bitcoin, spend in shillings: top up with M-Pesa or cash at a local agent, lock savings that
outpace inflation, pool capital with your chama, and invest alongside a trusted fund steward.

**Pillars — proof:**

| Pillar                    | Proof point                                                  |
|---------------------------|--------------------------------------------------------------|
| Protection from inflation | Savings held in sats; KES value shown live                   |
| Community capital         | Chamas with votes, shared locks, transparent stakes          |
| Cash-first accessibility  | Agent network across all 47 counties; no smartphone needed   |
| Honest yield              | "~5.2% APY from real yield" — always qualified               |

**Compliance line (mandatory near any investment claim):** *Friends & family pilot — figures are
projections, not guarantees. Not a public offer. Pending CBK regulatory approval.*

---

## 13. Governance

- This file (`BRANDKIT.md`) is the source of truth; the codebase implements it.
- Changes ship as PRs that update **both** the kit and the code in the same change.
- Version bumps: minor for additions, major for token changes (colors, fonts, radii).
- When in doubt: calmer, warmer, fewer elements. If a design needs a new color to work,
  the design is wrong.
