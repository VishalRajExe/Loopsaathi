# Design — LoopSaathi

**Direction:** a calm, minimal service interface with short copy and clear next actions. Mobile-first for residents and collectors; use inlined geometric SVG illustrations for hero tiles, waste and status diagrams; lucide-react for small controls. No stock imagery, emoji or decorative claims.

## Tokens (define in `app\frontend\tailwind.config.js` / CSS variables)

| Token | Value | Use |
|---|---|---|
| `bg` / `surface` | `#FAFAF7` / `#FFFFFF` | Warm page / cards |
| `border` / `ink` / `muted` | `#E5E7E0` / `#1C2420` / `#5F6B64` | Dividers / primary / secondary text |
| `brand` / `brand-dark` / `brand-soft` | `#1F6B4A` / `#17513A` / `#E4F1EA` | Action, hover, selected surface |
| `error` | `#B3261E` | Error text and outline with explanation |

| Stream badge | Background / text | Status badge | Background / text |
|---|---|---|---|
| `WET` | `#E4F1EA` / `#17513A` | `REQUESTED` | `#E8EAE6` / `#44504A` |
| `DRY` | `#E3EEF9` / `#1D4E89` | `ACCEPTED` | `#E3EEF9` / `#1D4E89` |
| `SANITARY` | `#FDF1D8` / `#8A5A00` | `COLLECTED` | `#FDF1D8` / `#8A5A00` |
| `SPECIAL_CARE` | `#FBE4E1` / `#9B2C1F` | `DELIVERED` | `#E4F1EA` / `#17513A` |
| `E_WASTE` | `#EDE6F8` / `#5B3A9E` | **Demo data** | `#FFF8E6` / `#8A5A00`, dashed `#B7791F` border |

Always show the stream/status text, not color alone. `UNVERIFIED` is a literal label on every fictional partner card; never style it as an official seal.

## Type, shape and motion

- **Manrope Variable** for headings/numbers and **Inter Variable** for body/UI, installed from `@fontsource-variable/manrope` and `@fontsource-variable/inter`; both work without a network request. H1 28/34 (24/30 mobile), H2 20/28, body 16/24, helper 14/20, caption 12/16. Collector action labels ≥16 px; dashboard numerals 32/36 tabular.
- Four-pixel spacing scale; 16 px phone / 24 px desktop page padding, centered max width ~960 px. Cards: radius 16–20 px (`rounded-2xl`), 1 px border, soft shadow and generous whitespace. Subtle brand-tinted gradient on hero cards only.
- Primary green and secondary outlined buttons ≥44 px high; collector's next action ≥56 px and full-width on phones. Inputs ≥44 px with visible labels, keyboard focus ring and inline errors. Hover/press transitions 150–250 ms and reduced-motion support.
- Desktop top navigation; phone bottom tab bar with icons **and** labels. Header has compact logo and sliding Household/Collector view switcher; role switching does not claim to log in.

## Six screens and key interactions

| Route | Experience |
|---|---|
| `/` Home | Headline ≤6 words, one short subline, four illustrated action tiles (Scan, Request, E-waste, Impact), small computed impact strip labelled when seeded data contributes. |
| `/guide` Waste Guide | Search/chip suggestions plus click/drop/mobile-camera image upload and preview; loading skeleton; result card with tentative item/stream, one-line curated instruction, confidence if real, **“Suggested — please confirm”**. Actions: Looks right, Change stream, Request pickup (prefills). Offline/uncertain AI → manual choice. |
| `/request` Request + My requests | Stream chips, bounded kg stepper, locality select, slot control; submit shows copyable ID and four-dot timeline. My requests shows saved records after refresh. |
| `/collector` Collector | All/Wet/Dry/E-waste filters, readable cards with estimate, locality and slot. One large context action: Accept → Collected (actual-kg sheet) → Deliver (eligible destination sheet) → Done; badges expose Demo data/UNVERIFIED. |
| `/ewaste` E-waste | Simple device chips/illustration, one-line dedicated-route notice, fictional drop-point card and request CTA prefilled with `E_WASTE`; battery gets its own special-care guidance. |
| `/impact` Impact | Three distinct groups **Requested (estimated)** → **Collected (confirmed)** → **Delivered**, completion ring and simple SVG/CSS bars for compost/biogas/recycler/e-waste, e-waste count, recent activity, refresh and visible demo-data note. |

Provide skeletons while loading, short toast + inline error/retry after actions, and one-action empty states. Do not imply a submitted photo was recognized if the model failed. Uploaded preview needs descriptive alt text. Maintain WCAG-style text contrast ≥4.5:1, touch targets ≥44 px, visible keyboard focus, semantic form labels, announced status/errors and optional animation that respects reduced motion. Copy is friendly and factual: **estimated**, **confirmed**, **suggested**, **Demo data**, **UNVERIFIED**; no fabricated environmental benefits.
