# Free-Trial Hero — coded rebuild

A from-scratch, dependency-free rebuild of the `shopify.com/free-trial` hero. The live page renders
its animated photo-mosaic background as an autoplay **`<video>`** (webm 496 KB / mp4 1.5 MB) behind a
**204 KB WebP poster** — and that poster is the page's **LCP element**, so the largest paint waits on
one big asset to download.

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
| **Desktop** LCP (cable) | 0.88 s | **0.33 s** | **−63%** |
| **Mobile** LCP (Slow 4G, 4× CPU) | 3.36 s 🟠 | **1.38 s** 🟢 | **−59%** |
| Mobile FCP | ~2.6 s | **0.27 s** | |
| Hero payload | ~700 KB (webm + poster) | **436 KB** (12 KB HTML + 424 KB tiles, mostly lazy) | |

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
  `scrollR`) and slightly different durations for an organic shear. A tiny inline script fills each half
  with a mix of portrait/landscape tiles from a shuffled deck (no near repeats); the first few
  above-the-fold tiles are `fetchpriority="high"`, the rest `loading="lazy"`.
- **Content** — white intro card ("Your business starts with Shopify" + offer), rich-black CTA card with
  "Start for free" + email input, Shopify logo. Copy/spec taken from Figma (`Inter Medium 44px` headline).
- **Accessibility** — `prefers-reduced-motion` freezes the drift to a static mosaic.
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
