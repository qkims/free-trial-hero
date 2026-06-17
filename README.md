# Free-Trial Hero — coded rebuild + signup-focused exploration

A from-scratch, dependency-free rebuild of the `shopify.com/free-trial` hero, plus a set of
signup-focused layout explorations. The live page renders its animated photo-mosaic background as an
autoplay **`<video>`** (webm 496 KB / mp4 1.5 MB) behind a **204 KB WebP poster** — and that poster is
the page's **LCP element**, so the largest paint waits on one big asset to download.

## Exploration harness (open `index.html`)

`index.html` is a **review harness**: a tab rail (Control + four variants) with a **Desktop / Mobile**
toggle, each variant rendered live in an iframe. The goal across all of them is to pull focus to the
signup while letting the merchant imagery tell a stronger story — and keep LCP low.

| Tab | Signup placement | Imagery role | Mobile LCP | Desktop LCP |
|---|---|---|---|---|
| **Control** | Centered card | Full-bleed drifting mosaic | 2.48 s 🟢 | 0.44 s |
| **V1 · Left signup** | Left column | Mosaic fills right two-thirds, fades into white | 2.20 s 🟢 | 0.40 s |
| **V2 · Center calm** | Centered | Same mosaic, muted/blurred/slowed bed | 2.46 s 🟢 | 0.40 s |
| **V3 · Right + story** | Right column | Curated floating collage (4 real photos) | **1.23 s** 🟢 | 0.24 s |
| **V4 · Editorial** | Top-left, brand-forward | Deep gradient + a single thin drifting tile rail | **0.89 s** 🟢 | 0.30 s |

All five sit in the "good" band (mobile ≤ 2.5 s). The lighter the imagery commitment, the faster the
paint: **V3** (a handful of curated tiles) and **V4** (gradient + one thin rail) are dramatically
quicker than the full-mosaic layouts because far less image bandwidth competes during first paint.
Numbers are lab/emulated medians (Slow 4G + 4× CPU for mobile, cable for desktop) via the same harness
used for the baseline. Shared engine lives in `lib/` (`mosaic.css`, `ui.css`, `mosaic.js`); each
variant is a slim standalone HTML so its LCP is measured in isolation.

---

## Control: the coded rebuild

This version recreates the look of the live video — a **+18°-tilted wall of large rounded product
tiles** (uniform height, a mix of portrait `239:314` and landscape `539:314` cards, ~20 px gaps) where
**each row scrolls horizontally and adjacent rows scroll in opposite directions** (row 1 →, row 2 ←,
row 3 →, …), so the wall shears as it moves — using **pure HTML/CSS** and a handful of tiny optimized
images, so no single large asset gates the paint. The tilt angle was measured off the rendered video
frame (~18°, mostly a flat 2D rotation) and the tile set is curated to match the live content mix
(lifestyle / people / apparel / workspaces, with a few product shots).

## Result (lab, emulated — same harness for baseline and rebuild)

| | Live page (`<video>`) | This rebuild | Δ |
|---|---|---|---|
| **Desktop** LCP (cable) | 0.88 s | **0.37 s** | **−58%** |
| **Mobile** LCP (Slow 4G, 4× CPU) | 3.36 s 🟠 | **1.77 s** 🟢 | **−47%** |
| Mobile FCP | ~2.6 s | **0.27 s** | |
| Hero payload | ~700 KB (webm + poster) | **~490 KB** (13 KB HTML + 424 KB tiles mostly lazy + 54 KB logo WebM) | |

Mobile crosses from the "poor" band into **"good"** (≤ 2.5 s). Numbers are lab/emulated (not CrUX field
data); FCP/LCP measured with the puppeteer + CDP throttling harness used for the baseline.

## How it works

- **`index.html`** — single self-contained file. Critical CSS inlined; system font stack (no web-font
  round-trip); the drift is pure CSS `@keyframes`, zero render-blocking JS.
- **Mosaic** — a clip box rotated **+18°** (matching the live video; oversized so the tilt still covers
  the hero corners) holds a static, centered vertical stack of rows. Each row is its own horizontal
  marquee: a `.lane` built from two **identical** halves that loops on `translateX(-50%)` — seamless
  because every card carries a trailing `margin-right` (not flex `gap`), so one half is exactly `n·(card+gap)`
  and `-50%` lands precisely one half over. Adjacent rows use opposite-direction keyframes (`scrollL` /
  `scrollR`) at a slow ~80–106 s sweep with per-row phase offsets for an organic shear. Each row spans
  the full clip width with its lane left-anchored and each half wider than the clip, so the two-halves
  loop is genuinely gap-free. A tiny inline script fills each half with a mix of portrait/landscape tiles
  from a shuffled deck (no near repeats); the first few above-the-fold tiles are `fetchpriority="high"`,
  the rest `loading="lazy"`.
- **Scrim** — a flat low-opacity dark tint over the whole mosaic, plus a soft darker pool behind the
  center and an edge vignette, so the white intro card and CTA read as the prominent element.
- **Content** — white intro card ("Your business starts with Shopify" + offer), rich-black CTA card with
  "Start for free" + email input. Copy/spec taken from Figma (`Inter Medium 44px` headline).
- **Logo** — an animated end-card video with transparency, played once on load then held. To keep the
  alpha channel cross-browser it ships in two codecs — **VP9 WebM** (`assets/logo.webm`, 54 KB, for
  Chrome/Firefox/Edge) and **HEVC MP4** (`assets/logo.mp4`, ~250 KB, for Safari) — with a transparent
  **PNG** (`assets/logo-fallback.png`) for anything that plays neither. A `drop-shadow` keeps the white
  wordmark legible over light tiles.
- **Accessibility** — `prefers-reduced-motion` freezes the row scroll to a static mosaic.
- **Editing aid** — tiles are scaled so ~4 rows fill the hero, and each card shows its source
  number (`assets/tile-NN.webp`) as a small corner badge so specific tiles can be swapped. The
  badges are on by default; press **`n`** to toggle them off.
- **`assets/tile-*.webp`** — 30 real Shopify product/UI tiles pulled from the Figma design, resized to
  ~440 px and encoded WebP q72 (8–24 KB each).

## Run / benchmark

```bash
python3 -m http.server 8731          # then open http://localhost:8731/index.html
node /tmp/lcptest/bench_local.js     # desktop + mobile LCP medians (throttled)
```
Press **`p`** on the page to toggle the live LCP readout (bottom-right).

## Caveats

- Tiles are a curated 30-image subset (the real hero uses ~86); the grid repeats them — collage variety
  is close, not pixel-identical.
- The animation is a faithful **CSS recreation** of the +18° diagonal drift, not a frame-exact copy of the
  rendered 3D camera move (the live video has a touch of perspective; this is a flat 2D rotation).
