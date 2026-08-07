# ClearFlow — Premium Plumbing Website Template

A conversion-focused, single-page website template for high-end plumbing
companies. The centerpiece is a scroll-driven architectural cutaway of a home:
as visitors scroll, the site finds a leak, diagnoses it, repairs it, and
restores water to every fixture — **Problem → Diagnosis → Repair → Restored**.

Built with zero build tooling: semantic HTML, hand-written CSS, vanilla JS,
and GSAP ScrollTrigger (vendored). Fonts are self-hosted. Everything runs from
any static host — or by simply opening `index.html`.

---

## Quick start

```bash
# any static server works
python3 -m http.server 8080
# or
npx serve .
```

Then open http://localhost:8080.

---

## Customizing for a client

### 1. Business details — `js/config.js`

One file drives the company name, phone, email, address, service areas,
hours, license, statistics and the form endpoint. Values are injected into
every element marked `data-bind` at runtime.

> **SEO note:** the same values exist as static text in `index.html` so the
> page is fully indexable without JavaScript. When rebranding, search
> `index.html` for `EDIT:` comments and update those spots too (title, meta
> description, JSON-LD schema, and the visible fallback text).

### 2. Brand colors — `css/main.css`

All colors live in the `:root` design-token block at the top of
`css/main.css`:

| Token | Role |
|---|---|
| `--ink` | primary dark (backgrounds, buttons, headlines) |
| `--paper` | warm off-white base |
| `--water` / `--water-light` | meaningful accent: water, links, active states |
| `--brass` | warm accent: stars, ticks, fittings |
| `--slate` / `--slate-2` | secondary text |

### 3. Typography

Self-hosted variable fonts in `assets/fonts/`:
**Fraunces** (display serif) and **Hanken Grotesk** (sans; an italic Fraunces
is available from `@fontsource-variable/fraunces` if you ever need it). Swap the
`@font-face` rules and the `--font-display` / `--font-sans` tokens to rebrand.

### 4. Imagery — `assets/img/`

All imagery ships as brand-matched SVG illustration plates so the template
looks finished out of the box. Each `<img>` keeps the same aspect ratio when
you swap in real photography (JPG/WebP recommended):

| File | Used in | Ratio |
|---|---|---|
| `plate-intro.svg` | Company intro | 4:5 |
| `plate-work-*.svg` | Recent Work grid + service previews | 3:2, 3:4 |
| `plate-svc-*.svg` | Services index previews | 4:3 |
| `plate-cta.svg` | Final CTA background | 21:9 |

### 5. Services, projects, testimonials, areas

Service areas, statistics and footer social links render from `js/config.js`.
Services, projects and testimonials live directly in `index.html` (searchable
via `EDIT:` comments) so the markup stays crawlable. The abstract map's town
labels are hand-placed SVG — search `data-map-markers` in `index.html` and
keep them in sync with `serviceAreas`.

### 6. Contact form

Set `formEndpoint` in `js/config.js` to your handler (Formspree, Basin,
Netlify Forms, custom endpoint — anything accepting a POST). Left empty, the
form demos its success state without sending.

---

## The hero animation

`js/hero.js` drives a pinned, scrub-linked GSAP timeline over the inline SVG
in `index.html`:

- **Camera** — stage framing is done by tweening the SVG `viewBox`, so every
  zoom stays vector-crisp. Framings live in the `CAM` object (desktop and
  purpose-built mobile variants).
- **Stages** — timeline positions are unit-based (0–100). Stage windows:
  problem ≈ 4–18, diagnosis ≈ 18–46, repair ≈ 46–70, restored ≈ 70–100.
- **Ambient loops** (drips, warning pulses, leak glow) are gated by scroll
  progress so nothing animates off-screen.
- **Reduced motion / no JS** — falls back to a static "restored" cutaway with
  all content visible (`hero--static`).

Adjust the total scroll length via the `end: "+=4400"` (desktop) and
`"+=3400"` (mobile) values.

---

## Structure

```
index.html          all sections, inline hero SVG, JSON-LD schema
css/main.css        design tokens · base · components · sections
css/hero.css        hero layout + scene styles
js/config.js        ← business configuration (start here)
js/hero.js          hero scroll choreography
js/main.js          nav, reveals, counters, carousel, form, microinteractions
js/vendor/          gsap.min.js, ScrollTrigger.min.js (3.12.5)
assets/fonts/       Fraunces + Hanken Grotesk (woff2, variable)
assets/img/         SVG illustration plates (swappable)
```

## Accessibility & performance

- Semantic landmarks, one `h1`, labeled forms, keyboard-operable menu,
  accordion and carousel, visible focus states, skip link.
- `prefers-reduced-motion` honored everywhere (static hero, no scroll FX).
- ~350 KB total page weight (fonts + JS + art included), no external
  requests, no layout shift: images carry explicit dimensions.

## License

Template code: use freely in client projects. Fraunces and Hanken Grotesk are
licensed under the SIL Open Font License.
