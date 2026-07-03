# YeboBank Brand Kit

## Vision

YeboBank is an open-source Bitcoin savings bank for Kenya. Every design decision should communicate **financial confidence**, **community trust**, and **technological clarity** — without feeling foreign, corporate, or inaccessible.

---

## Typography

### Font Stack

| Role    | Font            | Variable         | Fallback       |
|---------|-----------------|------------------|----------------|
| Display | **Syne**        | `--font-display` | sans-serif     |
| Body    | **DM Sans**     | `--font-body`    | sans-serif     |
| Mono    | **JetBrains Mono** | `--font-mono` | monospace      |

All fonts load via `next/font/google` with `display: swap` — zero layout shift.

### Why These Fonts

- **Syne** — Geometric display with distinctive wide letterforms and high personality. Each weight feels intentional and premium. Used for headings, brand name, kickers, and UI labels where hierarchy matters.
- **DM Sans** — Optical-size designed grotesque. Exceptional clarity at 14–18px body copy. Its soft geometry is approachable while staying professional.
- **JetBrains Mono** — Developer-grade monospace used for sats, Lightning addresses, hashes, and numeric data. Communicates technical precision without coldness.

### Size Scale (LearnUI guidelines)

| Token          | Size              | Usage                                     |
|----------------|-------------------|-------------------------------------------|
| Hero H1        | `clamp(44px, 5.6vw, 72px)` | Landing hero headline              |
| Section H2     | `clamp(28px, 3.2vw, 40px)` | Feature section headings           |
| Page title     | `22–26px`         | App page titles (`page-title`)            |
| Lead body      | `18px`            | First paragraph of section copy           |
| Body           | `15–16px`         | All body copy, card text                  |
| Kicker / label | `13–14px`         | Section kickers, stat labels, nav items   |
| Micro          | `10–12px`         | Timestamps, footnotes, monospace readouts |

### Weight Conventions

- `800` — Hero numerals only (sat counter, inflation comparison)
- `700` — H1, brand logotype, bold stats
- `600` — H2, section kickers, button labels, nav links
- `500` — Body emphasis, card titles, stat labels
- `400` — Body copy, descriptions, tooltips

### Letter-spacing

- Display headings: `letter-spacing: -0.03em` (tight)
- Body: default (`0`)
- Mono data: `letter-spacing: -0.02em` to `0.01em`
- All-caps labels: `letter-spacing: 0.06em` to `0.1em`

---

## Color Palette

### Brand Colors

| Name            | Hex / rgba token          | CSS variable       | Usage                              |
|-----------------|---------------------------|--------------------|------------------------------------|
| Forest Deep     | `#030C07`                 | `--ink`            | Primary dark background            |
| Forest Mid      | `#11A65B`                 | `--emerald-deep`   | Primary action, success states     |
| Lime accent     | `#96C244`                 | `--lime`           | Secondary accent, live indicators  |
| Gold            | `#C49020`                 | `--gold`           | CTA buttons, premium tier, Bitcoin |
| Gold soft       | `#E0A820`                 | `--gold-soft`      | Hover states, lighter gold         |
| Gold text       | `#A87800`                 | `--gold-text`      | Gold on light backgrounds          |
| Terra           | `#8C4A28`                 | `--terra`          | Warning, earth tones               |

### Neutral Scale

| Token       | Dark mode         | Light mode        | Usage                     |
|-------------|-------------------|-------------------|---------------------------|
| `--text`    | `#F0EDE6`         | `#1A2419`         | Primary text              |
| `--muted`   | `rgba(240,237,230,.72)` | `rgba(26,36,25,.72)` | Secondary text     |
| `--soft`    | `rgba(240,237,230,.45)` | `rgba(26,36,25,.45)` | Tertiary text      |
| `--surface` | `rgba(255,255,255,.04)` | `rgba(255,255,255,.82)` | Card surfaces   |
| `--border`  | `rgba(255,255,255,.09)` | `rgba(26,36,25,.14)` | Borders, dividers  |

### Usage Rules

- Use **gold** for primary CTAs only — one gold button per viewport.
- Use **emerald** for success, savings growth, and confirmation states.
- Use **lime** for live data, indicators, and secondary highlights.
- Never place gold text on lime backgrounds (contrast fails).
- Dark sections use `rgba` overlays, never opaque fills — maintain depth.

---

## Spacing Scale

Base unit: `4px`.

| Token  | Value | Usage                              |
|--------|-------|------------------------------------|
| `xs`   | 4px   | Icon padding, micro gaps           |
| `sm`   | 8px   | Inline element gaps                |
| `md`   | 16px  | Default padding, card insets       |
| `lg`   | 24px  | Section sub-gaps, form rows        |
| `xl`   | 40px  | Between major elements             |
| `2xl`  | 64px  | Section padding (top/bottom)       |
| `3xl`  | 104px | Desktop two-column layout gaps     |

Sections use `padding: 104px 0` on desktop, `64px 0` on tablet, `48px 0` on mobile.

---

## Border Radius

| Token     | Value   | Usage                              |
|-----------|---------|------------------------------------|
| `--r-sm`  | `8px`   | Tags, chips, small inputs          |
| `--r-md`  | `14px`  | Cards, modal surfaces              |
| `--r-lg`  | `22px`  | Feature panels, large containers   |
| `--r-pill`| `999px` | Buttons, badges, pill chips        |

---

## Component Patterns

### Buttons

- **Primary (Gold):** `background: var(--gold)`, round pill `border-radius: 999px`, padding `14px 26px`, font `--font-display 600 15px`. Hover: scale 1.03, slight glow.
- **Ghost on dark:** transparent + border `rgba(255,255,255,.2)`, white text. Hover: border gold.
- **Ghost on light:** border `var(--border)`, text `var(--text)`. Hover: border emerald.
- **Danger/destructive:** `--terra` background, white text.

### Cards

Surface: `rgba(255,255,255,.04)` on dark, `rgba(255,255,255,.82)` on light.  
Border: `1px solid rgba(255,255,255,.09)` on dark, `1px solid var(--border)` on light.  
Border-radius: `--r-md` (14px).  
Padding: `20px 22px` standard, `28px 30px` feature cards.

### Section Layout

Every landing section uses the `.sec` + `.wrap` pattern:
- `.sec` — full-width section with top/bottom padding
- `.wrap` — centered content container, `max-width: 1220px`
- Two-column layouts use CSS Grid: `grid-template-columns: 1fr 480px` (visual left, copy right) or `1fr 1fr`

### Kicker

Small all-caps label above section headings. Displays icon + text with gap. Color matches section accent (gold for Lightning, emerald/lime for Savings/Agents).

```
.kicker { font-family: --font-mono; font-size: 13px; font-weight: 500; 
          letter-spacing: 0.06em; text-transform: uppercase; }
```

### Agent Map

All 47 Kenya county boundaries from geoBoundaries ADM1 data in a `440 × 557.7` equirectangular SVG viewBox. Counties are tappable, show per-county agent count in a readout bar. `Find agents near me` uses browser geolocation + haversine ranking to highlight nearest hub city.

---

## Iconography

Library: **Tabler Icons** (`@tabler/icons-webfont`, v3.7.0).  
Use `ti-*` class names for all icons — they match the brand's clean line style.  
Size: 16–18px inline, 20–24px in buttons, 28–32px in feature cards.

---

## Illustration Style

Feature sections use **SVG illustrations built inline**:
- Savings: combination vault dial with gold locking bolts
- M-Pesa: stylized phone with STK push screen
- Chama: lotus petal ring with member bubbles
- Agents: real Kenya county map with agent dot pings
- Lightning: animated golden bolt SVG with arc-particle canvas

Illustration palette always stays within the brand color system. No raster images in sections — SVG only for crisp rendering at all DPRs.

---

## Motion

- Page reveals: `opacity 0 → 1`, `translateY 24px → 0`, `transition: 0.6s ease-out`
- Reveal delay classes: `.d1` 0.1s, `.d2` 0.2s, `.d3` 0.3s
- Count-up animation: cubic easing over 1.4s (sats counter, vault counter)
- Pulse rings: 2.4s infinite scale + fade (agent dots)
- Bolt breathe: 2.4s infinite drop-shadow oscillation
- Interactive hover states: 0.2–0.3s transitions only
- `prefers-reduced-motion`: all count animations skip to final value; pulse rings stop

---

## Tone of Voice

**Principle:** Direct, honest, warm. YeboBank speaks like a knowledgeable neighbour, not a bank.

- Use **active voice** and short sentences.
- Avoid jargon unless you explain it immediately (sats = satoshis = fractions of Bitcoin).
- Acknowledge the real problem (inflation eats your savings) without being preachy.
- Reference real Kenyan life: chai, matatu, M-Pesa, chama, duka, mwakala.
- Financial promises are always qualified: "~5.2% APY" not "guaranteed returns."
- Celebrate the community: "local agents," "your chama," "your neighbourhood."

**Things we never say:**
- "Revolutionary" / "disruptive" / "paradigm shift"
- "HODL" or crypto Twitter slang
- "Cutting-edge blockchain technology"
- Absolute return guarantees

---

## Brand Name Usage

- **YeboBank** — one word, camel case, always.
- Never: Yebo Bank, yebobank, YEBOBANK, Yebo-Bank.
- In URLs and code: `yebobank` (all lowercase, no separator).
- Tagline: **"Save in Bitcoin. Spend in shillings."**

---

## Themes

YeboBank supports both dark (default) and light themes via `data-theme` on `<html>`.  
Theme persists to `localStorage` as `yebo-theme`.  
A script in `<head>` applies the theme before first paint to prevent flash.

Dark theme colors communicate depth and digital precision.  
Light theme colors use ivory/cream backgrounds with deep forest greens for the same warmth in daylight.
