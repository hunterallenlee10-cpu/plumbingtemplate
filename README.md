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

### 7. Entrance

The first visit of a session opens with the brand mark drawing itself on a
paper curtain that lifts to reveal the hero: headline readable in about a
second, everything settled by two. The header (and the phone number) is
never held, scrolling is never locked, and any scroll ends the sequence
immediately. On a slow connection the page simply appears. Set
`intro: false` in `js/config.js` to skip the curtain; the hero's
line-by-line reveal still plays.

---

## The motion language

Every animation on the page, CSS or GSAP, speaks one vocabulary (tokens at
the top of `css/main.css`):

- **Easing** — entrances use expo-out (`--ease-out`,
  `cubic-bezier(0.16, 1, 0.3, 1)`); hover states settle with a slight
  overshoot (`--ease-back`); scroll-scrubbed motion is linear so the reader
  drives it.
- **Timing** — micro-interactions 150–300 ms, entrances 600–1000 ms, and
  nothing all at once: reveal targets inside a `[data-reveal-group]` arrive
  60 ms apart (`--stagger`, capped at five slots), eyebrow → headline lines
  → copy → actions. Phones get shorter, smaller entrances.
- **Signature moves** — masked line-by-line headline reveals (the hero's
  lines are split at runtime so every visual line gets its own mask; the
  masks carry ink room so Fraunces descenders are never clipped), images
  that settle from a 1.2× over-zoom as their curtain mask lifts, a
  first-visit curtain, magnetic CTAs that release with one soft overshoot,
  two-layer button labels, direction-aware service previews, a service-area
  map that draws itself in.
- **Restraint** — velocity lean only on the work imagery and only for a
  mouse; review cards rise without tilting; the stat counters count up once
  and always land on the real number; reduced motion turns all of it off
  and shows the finished page.

`js/intro.js` owns the entrance (curtain + hero sequence); the `<head>`
bootstrap in `index.html` marks JS support before first paint so nothing
flashes, and holds the hero until the sequence plays.

## The hero animation

`js/hero.js` drives a pinned, scrub-linked GSAP timeline over four
photographic stages (`assets/photo/hero-*.webp`) with an SVG diagnostic
overlay aligned on top:

- **Camera** — a wrapper div; the `cam(fx, fy, scale)` helper computes the
  transform that centers any photo point at any zoom, with separate desktop
  and mobile framings in the `F` object. Swap the stage photos and re-anchor
  the overlay coordinates (one `viewBox` space: 1280x768) to rebrand the
  sequence.
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
css/effects.css     scroll-choreography layer (gauge, marquee, cursor…)
js/config.js        ← business configuration (start here)
js/intro.js         entrance: first-visit curtain + hero load-in
js/hero.js          hero scroll choreography
js/scrollfx.js      site-wide scroll choreography (see below)
js/main.js          nav, staggered reveals, counters, carousel, form, microinteractions
js/vendor/          gsap.min.js, ScrollTrigger.min.js, lenis.min.js
assets/fonts/       Fraunces + Hanken Grotesk (woff2, variable)
assets/img/         SVG illustration plates (swappable)
assets/photo/       hero stage photography + dusk CTA (webp; src/ originals)
```

## The scroll choreography

Beyond the hero, `js/scrollfx.js` carries the same cinematic language
through the rest of the page (all GSAP ScrollTrigger, no new dependencies):

- **Page water gauge** — a sight-glass line on the left edge fills with the
  overall scroll position, a droplet riding the waterline (desktop).
- **Statement** — the brand promise pins and illuminates word by word as
  scroll pours through it.
- **Service marquee** — an endless strip of services whose speed and
  direction react to scroll velocity.
- **Stat counters** — count up once as the band arrives, 70 ms apart, and
  always land exactly on the configured value.
- **Process pipeline** — on desktop the four steps pin and travel
  horizontally while the pipe fills with water alongside.
- **Parallax system** — annotate any element with `data-parallax="0.2"`
  (whole-element drift) or any clipped image with `data-parallax-img`
  (interior drift) and it joins the depth pass.
- **Velocity skew** — the work imagery leans into a fast mouse scroll and
  settles (desktop only, only while on screen).
- **Footer reveal, CTA push-in, review card dealing, water-drop cursor.**

`js/scrollfx.js` loads before `js/main.js` and claims the counters and the
process pipe via `sfx-*` classes on `<html>`; under reduced motion or
without JavaScript, `main.js`'s IntersectionObserver reveals and static
fallbacks take over untouched. Mark any container `data-reveal-group` and
its `data-reveal*` children arrive one stagger step apart.

## Accessibility & performance

- Semantic landmarks, one `h1` (it stays in the accessibility tree while
  the hero story scrubs), labeled forms, keyboard-operable menu, accordion
  and carousel, visible focus states, skip link. In-page links move focus
  to their section and update the hash even under smooth scrolling; the
  header never hides while keyboard focus is inside it.
- `prefers-reduced-motion` honored everywhere (static hero, no scroll FX).
- The hero photo is painted from the first frame (the entrance fades a
  veil above it), so Largest Contentful Paint is not delayed by the
  choreography; the diagnostic overlay fades per group as compositor
  layers; ambient loops pause off screen.
- ~900 KB total page weight (fonts, JS, art and all four hero photographs
  included), no external requests, no layout shift: images carry explicit
  dimensions. Hero transitions are compositor-only (transform/opacity).

## License

Template code: use freely in client projects. Fraunces and Hanken Grotesk are
licensed under the SIL Open Font License.
