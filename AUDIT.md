# XTREME landing page: baseline audit

Date: 2026-10-04

Scope: direct inspection of the React, TypeScript, CSS, WebGL stage, content data, and local assets. This is a code and presentation-structure audit, not a completed browser/device or security audit. OCR could not run because no LLM provider is configured.

## Findings

1. **High — purchase intent has no purchase destination.** `src/components/Products.tsx:77` sends BUY NOW to `#contact`, which is a footer rather than a checkout or retailer locator. FIND XTREME also points there. Connect a verified retailer/contact destination and label the action accurately.
2. **Medium — inconsistent product size.** `src/components/Hero.tsx:60` says 500 ML; `src/data.ts:19-21` describes 330 ML. Confirm the actual SKU and use one source of truth. The six-pack and case availability also need brand confirmation.
3. **Medium — mobile menu keyboard accessibility.** `src/components/Chrome.tsx:165` hides the menu with clipping and aria-hidden, but its links remain focusable. Opening does not manage focus, trap it, or support Escape. Closed menus need inert/hidden behavior and open menus need a complete keyboard flow.
4. **Medium — no product image when WebGL fails.** `GLCanvas` sets no-webgl after initialization fails; CSS hides the canvas without introducing a static can. Provide the existing product image as an accessible fallback.
5. **Medium — loader has no readiness deadline.** `src/components/Chrome.tsx:51-79` waits for font readiness without a timeout. Slow font requests can prolong the blocking screen. Prefer immediately usable content and bounded enhancement loading.
6. **Medium — legal links are placeholders.** Privacy and Terms in `src/components/Chrome.tsx` both point to `#`. Supply real pages or remove misleading links until they exist.
7. **Medium — incomplete tabs.** Product and community selectors use tab roles without associated tab panels, roving focus, or arrow-key interaction. Implement the tab pattern or use ordinary selection buttons.
8. **Medium — hidden video can continue playing.** `src/components/Closing.tsx` hides the YouTube container when switching to Instagram but leaves its player mounted. Unmount or pause playback on source changes.

## Presentation direction

- Preserve the recognizable midnight blue, gold, red, and hero can; give the can and headline deliberate breathing room.
- Shorten the journey. Energy alone is 330vh and the brand statement is 380vh on desktop, before the other sections. Reduce repetitive slogans and move product information earlier.
- Establish one clear primary action with a real destination, supported by verified product size, pack availability, and brand information.
- Use selected authentic campaign imagery to vary the repeated oversized typography and gradient backgrounds.
- Make mobile composition and a static/reduced-motion experience first-class, then layer in motion.
- Validate desktop/mobile screenshots, keyboard navigation, font failure, WebGL failure, and real-device performance before describing the redesign as complete.

## Baseline verification

- Locked dependencies installed with npm ci.
- TypeScript and production Vite build passed. The Three.js chunk is 487 KB (122 KB gzip); this warrants measured loading/performance work, not an assumed runtime failure.
- Development server runs at http://127.0.0.1:5173/ and returned HTTP 200.
- npm installation reported two dependency advisories (one moderate, one high). Their applicability has not been investigated; no force upgrade was applied.
- No website source changes made before the user's baseline inspection.

## Resolution — 2026-10-04

All eight findings are addressed in the working tree. `npm run build` (type-check + production build) passes.

| # | Finding | What changed |
| --- | --- | --- |
| 1 | Purchase intent had no destination | `PURCHASE` in `src/data.ts` carries the real destination. With no verified shop URL it stays `null`, so the action reads WHERE TO BUY and lands on a footer block that answers it (stockist/bulk enquiry address). Set `PURCHASE.url` and BUY NOW returns automatically. |
| 2 | 500 ML vs 330 ML | `PRODUCT.volume` is the single source; hero and lineup both read it. The figure is still **unconfirmed** — see below. |
| 3 | Mobile menu keyboard access | Closed menu is `inert` (plus `tabIndex={-1}` for older browsers); opening moves focus into it, Tab cycles inside, Escape closes and returns focus to the burger, which now has `aria-controls`. |
| 4 | No product image without WebGL | `GLCanvas` renders a static `can-front.png` with alt text in the stage's layer when `Stage` construction throws. |
| 5 | Loader had no deadline | A hard deadline (3.5 s, 0.8 s under reduced motion) releases the loader regardless of font or GPU readiness. |
| 6 | Placeholder legal links | Privacy and Terms removed from the footer rather than pointing at `#`. |
| 7 | Incomplete tabs | Community tabs are a full tab set (`aria-controls`, labelled panels, roving tabindex, arrow/Home/End keys). The product selector is now a labelled `role="group"` of `aria-pressed` buttons — it is a chooser, not a tab set. |
| 8 | Hidden video kept playing | Each panel mounts only while selected, so switching source unmounts the player. |

### Still needs the brand, not the code

- **The volume.** 330 ML is carried over from the existing data and the pack-artwork comment; the supplied photo is cropped above the declaration. Confirm the SKU, then change `PRODUCT.volume` once.
- **Pack formats.** Six-pack and case availability is still unverified copy in `FLAVOURS`.
- **Purchase destination.** `PURCHASE.url` is `null` until a real shop or stockist page exists; `PURCHASE.email` should be confirmed as a monitored address.
- **Legal pages.** Privacy and Terms need writing before the links come back.

### Not yet verified

No browser automation is available in this environment, so the keyboard flow, the WebGL-failure fallback, the font-failure deadline and desktop/mobile screenshots have been reasoned through and type-checked but **not exercised in a real browser**. The presentation direction (section lengths, mobile composition, campaign imagery) is untouched.

## Reliability and smoothness pass — 2026-10-04

Work beyond the eight findings, aimed at how the page behaves when conditions
are not ideal. Build and type-check pass; the production preview serves.

**Reliability**

- WebGL context loss is handled. Previously a lost context left a frozen or
  empty stage with no recovery; the page now falls back to the static can and
  resumes the 3D stage when the context returns.
- A React error boundary wraps every section and every decorative layer. A
  render error used to blank the whole page; it now costs that one piece.
- Capability gate: `Save-Data` or under 2 GB reported device memory means the
  3D stage never starts, and the static can is used instead.
- Video thumbnails fall back to a second YouTube address, then to the tile's
  own frame and label, rather than showing a broken image.
- Fonts no longer block first paint, and a `<noscript>` block carries the brand
  and the contact address when JavaScript is off.
- `Stage.destroy()` disposes geometries, materials and generated textures.
  `renderer.dispose()` alone was leaving GPU memory allocated on every teardown.

**Smoothness**

- three.js is loaded on demand: initial JS drops from ~230 KB to ~107 KB
  gzipped, and the 487 KB chunk leaves the first-paint path entirely. This is
  the measured-loading work the baseline called for.
- Adaptive quality: the stage smooths real frame time and steps pixel ratio,
  smoke and particles down when frames run long, climbing back only after a
  settled spell. The can is never the thing that gets cut.
- Layout reads are off the scroll path (progress bar, navbar, anchor
  re-measurement), each folded into one read per frame.

The failure model and the frame budget are documented in README.md so the next
person changing this page can see what is meant to happen.

**Still unverified in a browser.** No browser automation is available here, so
the context-loss recovery, the quality stepping under real load, and the
device-gate paths are reasoned through, type-checked and served, but not
exercised against a GPU. They need a pass on real hardware before launch.
