# Susie's Stories: Quality, Palette, Motion, and Performance Refresh

*   **Author:** Joel-J-Leiva (drafted with Claude Code)
*   **Status:** Implemented (Goldfish findings resolved, see
    `docs/designs/reviews/consolidated_review_report.md`)
*   **Date:** 2026-11-02

--------------------------------------------------------------------------------

## Overview

Susie's Stories is a static portfolio site: 13 HTML pages, one shared script
(`assets/js/main.js`), images, and two resume PDFs. It has no build step, and
the README documents deploying to Vercel. The production host is assumed to be
Vercel. If it is GitHub Pages, everything still works, but `vercel.json` is
ignored.

This refresh changes four things without restructuring the site:

1.  A new color theme: a white base with four Pantone accent colors.
2.  A replacement English resume PDF.
3.  Light, optional motion.
4.  Removal of the main causes of slow loading and lag.

Page layout, copy, page list, and URLs stay the same.

## The Problem

*   **Lag and slow first paint.** Every page loads the Tailwind Play CDN
    (`cdn.tailwindcss.com`). This script downloads about 300 KB of JavaScript,
    then generates CSS in the browser on every visit. Until it finishes, the
    page shows unstyled content. Tailwind documents it as unsuitable for
    production.
*   **Heavy images.** `assets/images` holds 34 camera-size JPEGs totaling about
    40 MB (measured with `du -sh`). Many are over 1 MB. None use
    `loading="lazy"` or declare `width`/`height`, so all of them download at
    once and the layout shifts as they arrive.
*   **Heavy icon font.** The Material Symbols request loads the full variable
    icon font, but the site uses only 10 icons.
*   **Duplicated, drifting theme.** Each page has its own inline
    `tailwind.config`, and the copies disagree. For example,
    `surface-container` is `#efeeea` on some pages and `#f5f3ef` on others.
    Colors are also hard-coded about 600 times as arbitrary classes or inline
    `style` attributes.
*   **Outdated resume.** `assets/resumes/english-resume.pdf` predates the new
    resume (`~/Downloads/Berube, Susan_Resume.pdf`).

Baseline measurements (Lighthouse mobile, `main` branch) are recorded in
`docs/designs/reviews/consolidated_review_report.md` once captured. The
verification phase compares against them.

## Goals

*   **G1, Palette:** White (`#FFFFFF`) is the page and surface color. The
    accents are Pantone Tourmaline 16-4411, Warm Taupe 16-1318, Bridal Rose
    15-1611, and Reseda 15-6414. No retired color appears in any HTML, CSS
    source, or JS file. The retired colors are:
    *   `#7796a2`, `#f7e1e6`, `#fbf9f5`, `#9eb3a2`, `#d9b8c0`, `#1b1c1a`,
        `#191c1e`, `#86D0E2`, `#B6D0E2`, `#f5f3ef`, and `#efeeea`.
    *   Exception: `dark:` variants, which never render.
*   **G2, Accessible text:** All text drawn in a theme color, including any
    opacity modifier, meets WCAG AA contrast (at least 4.5:1) against white.
*   **G3, One theme source:** Colors, fonts, and radii are defined once, in
    `tailwind.config.js`. No page carries an inline Tailwind config.
*   **G4, No runtime CSS compiler:** No page loads `cdn.tailwindcss.com`. All
    pages share one prebuilt, minified stylesheet.
*   **G5, Image weight:**
    *   Total image payload drops at least 80%, from about 40 MB to under
        8 MB.
    *   No image is over 400 KB.
    *   Every `<img>` declares `width` and `height`.
    *   Every image except the first on each page loads lazily.
*   **G6, Motion:**
    *   Below-the-fold blocks fade and rise into view as they scroll in, and
        the nav gains a shadow after scrolling.
    *   The mobile menu opens with a short height transition.
    *   With `prefers-reduced-motion: reduce`, nothing moves.
    *   If `main.js` fails to run, all content is fully visible.
*   **G7, Resume:** The "English Resume" button serves the new PDF.
*   **G8, Measured:** Lighthouse mobile scores on `index.html` and
    `photography.html`:
    *   Performance is at least 90.
    *   Accessibility is at least 95.
    *   CLS is under 0.1.

## Non-Goals

*   No redesign of layouts, type scale, copy, or navigation order.
*   No framework, templating, or partials. The header and footer remain
    duplicated per page.
*   No dark mode. `dark:` classes are left untouched.
*   No change to the Journalism resume or to the displayed name. The new
    resume says "Berube-Leiva", and the owner decides that separately.
    > **Superseded (Addendum A-1):** the owner later asked for the name "Susan Annette Berube-Leiva"; it now appears on the site.
*   No Content-Security-Policy. It is fragile for a hand-edited static site;
    see Alternatives.
*   No change to the reading flow of article pages: articles get no scroll
    reveal.

## Open Questions

*   None blocking. Decided with the owner on 2026-11-02:
    *   The new resume replaces the English resume only.
    *   Tailwind is precompiled to a static CSS file.

## Critical User Journeys (CUJs)

### CUJ 1: First visit on a phone

*   **Given**: A visitor on a mid-range phone opens `index.html`.
*   **When**: The page loads.
*   **Then**:
    *   The page is styled at first paint.
    *   The hero (headline plus headshot) is visible immediately, with no
        fade.
    *   The headshot loads with high priority.
    *   Nothing jumps as images arrive.
    *   Lower sections fade in on scroll.

### CUJ 2: Browsing photography

*   **Given**: A visitor opens `photography.html` at a 375x812 viewport.
*   **When**: They scroll to the bottom.
*   **Then**:
    *   Only photos near the viewport download.
    *   Each photo fades in as it arrives.
    *   Every photo is visible by the time the visitor reaches the bottom.

### CUJ 3: Downloading the resume

*   **Given**: A recruiter is on `about.html`.
*   **When**: They click "English Resume".
*   **Then**: The new resume (Berube-Leiva, Chief of Staff at House of Hearts
    Network) opens.

### CUJ 4: Reduced motion or no JavaScript

*   **Given**: Either the OS "reduce motion" setting is on, or JavaScript is
    disabled or `main.js` fails to load.
*   **When**: The visitor browses any page.
*   **Then**:
    *   All content is visible immediately, with no fades or translations.
    *   Hover color changes still work.

### CUJ 5: Keyboard user on mobile width

*   **Given**: The mobile menu is closed.
*   **When**: The user presses Tab.
*   **Then**:
    *   Focus skips the hidden menu links.
    *   Opening the menu sets `aria-expanded="true"`.
    *   Escape or choosing a link closes the menu.

## Technical Plan (Architecture)

### Build pipeline (development-time only)

```text
tailwind.config.js ──┐
src/input.css ───────┼──> tailwindcss v3 CLI (npm run build:css) ──> assets/css/site.css (minified, committed)
*.html, assets/js ───┘        scans these for class names
```

*   **Deployment:** `site.css` is committed, so hosting stays static with no
    build command.
*   **Tailwind version:** Pinned to v3.4.x, because the existing config shape
    is v3.
*   **Stale-CSS guard:** `npm run check:css` rebuilds the file and fails if
    `site.css` changed (`git diff --exit-code`). This catches a class that
    was added to HTML without a rebuild. The README tells editors to run it
    before pushing.
*   **Cache busting:** Pages link `assets/css/site.css?v=N`, matching the
    existing `main.js?v=N` pattern. Bump `N` on every rebuild.

### Color tokens

Each Pantone accent gets two tokens:

*   **The swatch:** for fills, borders, rules, and selection.
*   **A deep shade of the same hue:** for text. The swatches are 2.3 to
    2.8:1 on white, so they cannot carry text.

| Token | Hex | On white | Role |
|---|---|---|---|
| `tourmaline` | `#86A1A9` | 2.7:1 | decorative |
| `tourmaline-deep` | `#4A6670` | 6.1:1 | links, nav, icons |
| `rose` | `#D69FA2` | 2.3:1 | decorative: nav rule, quote bar, selection, button rings |
| `rose-deep` | `#8F4F55` | 6.1:1 | accent text |
| `reseda` | `#A1AD92` | 2.4:1 | decorative: chip fills, dividers |
| `reseda-deep` | `#536048` | 6.7:1 | eyebrow labels, filled buttons (white text) |
| `taupe` | `#AF9483` | 2.8:1 | decorative: outlines, footer rule |
| `taupe-deep` | `#6E5848` | 6.7:1 | secondary and meta text |

**Naming rule:** markup uses the semantic names below. Pantone names appear
in markup only where no semantic name fits, for example `border-rose` or
`text-rose-deep`.

The semantic keys below make up the complete set: the union of all 13 current
inline configs. Each key is given its new value.

| Semantic key | New value |
|---|---|
| `background`, `surface`, `surface-bright`, `surface-container-lowest` | `#FFFFFF` |
| `surface-container-low` | `#F3F6F7` (6% Tourmaline tint: featured bands) |
| `surface-container` | `#F7F2EF` (6% Taupe tint: footer, skill bands) |
| `surface-container-high` | `#ECEEEA` |
| `surface-container-highest`, `surface-variant` | `#E5E8E3` |
| `surface-dim` | `#DCDFDA` |
| `on-surface`, `on-background` | `#1F2422` |
| `on-surface-variant` | `#6E5848` (taupe-deep) |
| `outline` | `#AF9483` (taupe) |
| `outline-variant` | `#E7DFDA` |
| `primary`, `surface-tint` | `#4A6670` (tourmaline-deep) |
| `on-primary`, `on-primary-container`, `on-tertiary`, `on-error` | `#FFFFFF` |
| `primary-container`, `tertiary` | `#536048` (reseda-deep) |
| `secondary`, `secondary-fixed-dim` | `#D69FA2` (rose) |
| `on-secondary`, `on-tertiary-container`, `on-primary-fixed`, `on-secondary-fixed`, `on-tertiary-fixed` | `#1F2422` |
| `secondary-container`, `secondary-fixed` | `#F3E2E3` |
| `on-secondary-container`, `on-secondary-fixed-variant` | `#8F4F55` (rose-deep) |
| `tertiary-container`, `tertiary-fixed-dim` | `#A1AD92` (reseda) |
| `tertiary-fixed` | `#E6EADF` |
| `on-tertiary-fixed-variant` | `#536048` |
| `primary-fixed` | `#DCE6E9` |
| `primary-fixed-dim`, `inverse-primary` | `#86A1A9` (tourmaline) |
| `on-primary-fixed-variant` | `#4A6670` |
| `inverse-surface` | `#2B2F2D` |
| `inverse-on-surface` | `#F3F4F2` |
| `error`, `error-container`, `on-error-container` | unchanged (`#ba1a1a`, `#ffdad6`, `#93000a`) |

`surface-container-high` was missing from three pages' configs. Defining it
makes `hover:bg-surface-container-high` and `border-surface-container-high`
render on those pages. This change is accepted: it is a 3% gray hover and a
hairline border, which the original markup clearly intended.

**Opacity rule (G2):**

*   **Accent text:** No opacity modifier on accent-colored text.
    `text-primary/80` and similar become `text-on-surface/80` (about 8:1).
    Hover and active states keep `text-primary`.
*   **Ink text:** `text-on-surface/NN` is allowed only for NN ≥ 70. Lower
    values become `text-taupe-deep`.

The nav changes from a pink fill to white with a 1px `rose/60` bottom rule.

### Motion

Motion is progressive enhancement owned by `main.js`. No head script is
needed, so a failed script can never hide content.

*   **Opting in:** On load, if reduced motion is off and
    `IntersectionObserver` exists, `main.js` does two things:
    *   It marks every `[data-reveal]` already inside the viewport as
        `.is-visible`, synchronously, so there is no flash.
    *   It adds `motion-ready` to `<html>`.
*   **CSS:** Only `.motion-ready [data-reveal]:not(.is-visible)` is hidden
    (`opacity 0`, `translateY(16px)`). If the script fails, the class never
    appears and nothing is hidden.
*   **What is tagged:** `data-reveal` is written into the markup on
    below-the-fold blocks only, never on the first child of `<main>`. Tall
    containers are never tagged themselves. Their children are tagged
    instead, and those children are cards or photos, each shorter than a
    viewport.
*   **Observer settings:** One observer, with `threshold: 0` and
    `rootMargin: "0px 0px -10% 0px"`. Any element of any height reveals once
    its top edge enters the lower 90% of the viewport. After revealing, it is
    unobserved.
*   **Stagger:** A container marked `data-reveal-stagger` is not hidden
    itself. Each of its direct children gets `data-reveal` in markup. JS sets
    `--reveal-delay` to (index mod 6) × 70ms on each child.
*   **Nav shadow:** A passive scroll listener, throttled with
    `requestAnimationFrame`, toggles `.nav-scrolled` on `<nav>` when the page
    is scrolled more than 8px.
*   **Mobile menu:** The menu uses a grid-rows 0fr→1fr transition, plus
    `visibility` so that closed links leave the tab order and the
    accessibility tree.
    *   This transition animates layout, but only for a small element during
        a user-initiated action. That cost is accepted.
    *   Reveals and hovers animate only `opacity` and `transform`.
*   **Reduced motion:** Only the reveal, menu, and hover-image transitions
    are turned off, and reveal elements are forced visible. Static layout
    transforms, such as the centering of the toast, are untouched.

### Images

A Python/Pillow script, `scripts/optimize_images.py`, does the conversion. It
is a one-off tool, kept for future photo uploads. Python is already on the
owner's machine. For each JPEG it:

*   applies EXIF orientation;
*   resizes to a long edge of at most 1600 px (1200 px for the two
    portraits);
*   encodes WebP, with a size-fallback loop that runs in memory before the
    source is deleted;
*   writes a lowercase-hyphenated filename.

The script records `old → new, width, height` in `scripts/image-manifest.json`.
HTML is then updated from that manifest.

### Fonts

*   **Text fonts are self-hosted** (amended after Lighthouse showed web-font
    swap shift: CLS 0.195 on `photography.html`, 0.059 on `index.html`).
    *   `assets/fonts/` holds latin-subset woff2 files from Google Fonts:
        `inter-latin-var.woff2` (variable, 300–700),
        `noto-serif-latin-var.woff2` (variable, 400–700) and
        `noto-serif-latin-400-italic.woff2`, plus `OFL.txt`.
    *   `@font-face` rules live in `src/input.css` (`@layer base`) with
        `font-display: swap` and the latin `unicode-range`.
    *   Every page preloads the two upright variable files (Inter, Noto
        Serif). The italic is not preloaded: it is above the fold on only a
        few pages.
    *   **Metric-matched fallbacks:** `"Inter Fallback"` (Arial / Arial Bold)
        and `"Noto Serif Fallback"` (Georgia / Georgia Bold / Georgia Italic)
        sit second in every font stack (`tailwind.config.js` and the
        body/heading rules). Their `size-adjust` and ascent/descent/line-gap
        overrides were computed from the font files with fontTools, using the
        Next.js / fontaine method. Regular and bold are matched separately.
*   Google Fonts now serves only Material Symbols, so the
    `fonts.googleapis.com` / `fonts.gstatic.com` preconnects stay.
*   Material Symbols is requested with `icon_names=` for the 11 icons used:
    the 10 in markup today plus `close`. The request uses `display=block` so
    that ligature text never flashes as words.

### Security hardening (light)

*   Add `rel="noopener noreferrer"` to every `target="_blank"` link.
*   Remove the third-party Tailwind script, which reduces the supply-chain
    surface.
*   Add `vercel.json` with static, low-risk headers:
    *   `X-Content-Type-Options: nosniff`
    *   `Referrer-Policy: strict-origin-when-cross-origin`
    *   `X-Frame-Options: DENY`
    *   `Permissions-Policy: camera=(), microphone=(), geolocation=()`
    *   `Strict-Transport-Security: max-age=63072000; includeSubDomains`
        (added in Phase 4 from the SEO audit)
*   Inline `style` attributes are removed for contrast reasons. That keeps a
    future CSP possible.

## Alternatives Considered

### Alternative A: Keep the Tailwind Play CDN

*   **Pros:** No build step.
*   **Cons:** Runtime CSS generation, unstyled flash, about 300 KB of blocking
    JS. This is the main lag source.
*   **Reason for Rejection:** It violates G4 and G8. The owner chose to
    precompile.

### Alternative B: Hand-written CSS, with Tailwind removed

*   **Reason for Rejection:** Every utility class across 13 pages would have
    to be rewritten. That is a refactor, which the owner ruled out.

### Alternative C: Tailwind standalone CLI binary instead of npm

*   **Pros:** No `node_modules` and no `npm audit`.
*   **Cons:** A per-OS binary has to be downloaded and kept current by hand.
    Node is already installed.
*   **Reason for Rejection:** npm gives pinned versions through the lockfile,
    and an audit trail.

### Alternative D: Build CSS on Vercel at deploy time

*   **Pros:** No stale-CSS risk.
*   **Cons:** Breaks GitHub Pages hosting, and adds a deploy dependency.
*   **Reason for Rejection:** `npm run check:css` covers the risk without
    tying the site to one host.

### Alternative E: Use the four Pantone swatches directly for text

*   **Reason for Rejection:** At 2.3 to 2.8:1 they fail WCAG AA. The swatches
    still carry the visual identity through fills and rules.

### Alternative F: `<picture>` with AVIF + WebP + JPEG

*   **Reason for Rejection:** Three files and more markup per image for a
    small gain. WebP alone meets G5.

### Alternative G: Animation library (GSAP / AOS)

*   **Reason for Rejection:** Extra third-party JS works against the
    performance goal. Native code is about 60 lines.

### Alternative H: Strict Content-Security-Policy with an inline-script hash

*   **Reason for Rejection:** A hash ties the policy to byte-identical
    snippets on 13 hand-edited pages. Any edit would silently break the page.
    It also cannot be tested locally, because `vercel.json` is not applied by
    local servers.
*   **Future Improvement:** Revisit once headers are tested on a preview
    deploy.

### Alternative I: Long `Cache-Control` on `/assets`

*   **Reason for Rejection:** The resume keeps a fixed filename and must
    update at once. Vercel's default revalidation, together with the `?v=`
    query on CSS and JS, is enough.

--------------------------------------------------------------------------------

## Non-Functional Requirements

*   **Security:**
    *   The light hardening above.
    *   `npm audit` reports 0 vulnerabilities.
    *   The `security-review` skill runs on the branch diff.
*   **Performance:** G5 and G8. `site.css` is at most 40 KB minified.
*   **Rollout and rollback:**
    *   One branch, `site-quality-refresh`, is merged to `main`.
    *   `git revert` of the merge restores the site.
    *   Because there is no long-lived caching, visitors pick up a rollback on
        their next request.

--------------------------------------------------------------------------------

### Additional Resources

*   Mood board: `~/Downloads/susie-website-color-theme.jpeg`.
*   Swatch hex values are the published Pantone TCX sRGB approximations,
    cross-checked against the mood board.

### Future Improvements

*   A static-site generator for the shared header and footer.
*   Responsive `srcset` sizes for the photography grid.
*   A CSP, introduced as Report-Only on a preview deploy first.

--------------------------------------------------------------------------------

## Detailed Implementation Plan

Phases run in order, and each ends with a checkpoint that must pass. Phase 1
has two workstreams that run in parallel; they touch disjoint files. All later
phases run one at a time, because they edit the same HTML files.

| Phase | Workstream | Files |
|---|---|---|
| 1 | WS-A palette + build | config, CSS, all HTML (head, color classes, inline styles) |
| 1 | WS-B1 image conversion | `scripts/`, `assets/images/` only |
| 2 | WS-B2 image tags | `<img>` tags in HTML |
| 3 | WS-C motion, JS, a11y, resume, meta | `main.js`, `src/input.css` motion section, HTML, `vercel.json`, resume |
| 4 | Verification | none (fixes go back to the owning workstream) |

### Phase 1, WS-A: Build pipeline and palette

#### A1. `package.json` (Create)

*   **Package:** `"name": "susies-stories"`, `"private": true`.
*   **devDependencies:** `"tailwindcss": "~3.4.17"`, with no plugins (there
    are no form or container-query classes).
*   **Scripts:**
    *   `build:css`:
        `tailwindcss -c tailwind.config.js -i src/input.css -o assets/css/site.css --minify`
    *   `watch:css`: the same with `--watch`.
    *   `check:css`:
        `npm run build:css && git diff --exit-code -- assets/css/site.css`
*   **Lockfile:** Commit `package-lock.json`.

#### A2. `tailwind.config.js` (Create)

*   `content: ["./*.html", "./assets/js/**/*.js"]`
*   `darkMode: "class"`
*   `theme.extend.colors`: every key in both Technical Plan tables, with
    exactly those hex values. Pantone tokens are flat keys
    (`tourmaline`, `tourmaline-deep`, and so on).
*   `borderRadius`: `{DEFAULT: "0.125rem", lg: "0.25rem", xl: "0.5rem", full: "0.75rem"}`
*   `fontFamily`:
    `{headline: ["Noto Serif","serif"], display: ["Noto Serif","serif"], body: ["Inter","sans-serif"], label: ["Inter","sans-serif"]}`
    > **Superseded (Addendum B):** each stack now has a metric-matched fallback second, e.g. `["Noto Serif","Noto Serif Fallback","serif"]`.

The borderRadius values are identical in all configs. Article pages lacked
the override, which makes their toast change from a pill to 0.75rem. That
change is accepted: it matches the other 6 pages.

#### A3. `src/input.css` (Create)

Its contents, in order:

1.  **Stamp:** a `/*! … */` comment as line 1, so `--minify` keeps it.
2.  **Directives:** `@tailwind base; @tailwind components; @tailwind utilities;`
3.  **`@layer base`:**
    *   `html, body { overflow-x: clip; }`
    *   `body { background:#fff; color: theme('colors.on-surface'); font-family: Inter, sans-serif; }`
        > **Superseded (Addendum B):** body and heading rules use `theme('fontFamily.body')` and `theme('fontFamily.headline')`, after the `@font-face` rules.
    *   `h1, h2, h3, .serif { font-family: 'Noto Serif', serif; }`
    *   `.material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }`
    *   `:focus-visible { outline: 2px solid theme('colors.tourmaline-deep'); outline-offset: 3px; }`
4.  **`@layer components`:**
    *   `.masonry-grid`, copied from `photography.html` as is.
    *   An empty block headed `/* MOTION (WS-C) */`.

Existing `selection:` body classes stay, and no `::selection` rule is added.

#### A4. `assets/css/site.css` (Create, generated)

The output of `npm run build:css`, committed. It is rebuilt at the end of
every phase.

#### A5. All 13 HTML pages (Modify)

*   **Head:**
    *   Delete the `cdn.tailwindcss.com` script, the
        `<script id="tailwind-config">` block, and the inline `<style>`
        block.
    *   Insert `<link rel="stylesheet" href="assets/css/site.css?v=1">`
        after the font links.
*   **Class rewrites** (case-insensitive, every occurrence, light-mode
    classes only, with `dark:` variants untouched):
    *   `[#7796a2]/NN` → `on-surface/80` for text, for example
        `text-[#7796a2]/80` → `text-on-surface/80`.
    *   `[#7796a2]` with no opacity modifier → `primary`. This covers
        `text-`, `border-`, `hover:text-`, and `decoration-` prefixes.
    *   `text-primary/NN` (already tokenized) → `text-on-surface/80`.
    *   `bg-[#f7e1e6]` → `bg-white`.
    *   `from-[#f7e1e6]` → `from-rose`.
    *   `text-[#1b1c1a]` and `text-[#191c1e]` → `text-on-surface`.
    *   `text-[#1b1c1a]/NN` → `text-taupe-deep`.
    *   Any `text-on-surface/NN` with NN < 70 → `text-taupe-deep`.
*   **Nav:** Add `border-b border-rose/60` to `<nav>`.
*   **Inline link colors:** Every `style="color: #86D0E2"` and
    `style="color: #B6D0E2"` gets the same treatment:
    *   Delete the attribute.
    *   Add `text-primary underline decoration-rose underline-offset-2 hover:decoration-primary`
        to the element's `class`, creating the attribute if needed.
*   **Other inline `style` attributes:** If any remain, convert them to
    equivalent utilities.

**Checkpoint A:** run these checks in order.

1.  **Retired colors:**
    `grep -inE "#(7796a2|f7e1e6|fbf9f5|9eb3a2|d9b8c0|1b1c1a|191c1e|86D0E2|B6D0E2|f5f3ef|efeeea)" *.html src/input.css`
    returns only matches inside `dark:` classes.
2.  **Inline styles:** `grep -c 'style="' *.html` returns 0 for every page.
3.  **CDN and configs:** `grep -l "cdn.tailwindcss\|tailwind.config" *.html`
    returns nothing.
4.  **Build:** `npm run build:css` succeeds, and `site.css` is at most
    40 KB.
5.  **Screenshots:** Run headless Chrome
    (`chrome --headless=new --screenshot --window-size=1280,2400`) for
    `index`, `about`, `photography`, `written-works`, `achievements`, and
    one article. Compare against the same shots of `main`, captured into
    the scratchpad.
    *   Layout, spacing, and type must match. Only colors may differ.
    *   Any element that lost its styling is a failure.

### Phase 1, WS-B1: Image conversion

#### B1. `scripts/optimize_images.py` (Create)

*   **Interface:** `python scripts/optimize_images.py [root=assets/images]`.
    It requires Pillow.
*   **Input:** Collect `*.jpg|*.jpeg` files under the root, matching case
    (`.JPG` and `.JPEG` count), recursively.
*   **Per file:**
    1.  **Normalize:** Open, apply `ImageOps.exif_transpose`, and convert to
        RGB.
    2.  **Size:** Set the max edge to 1200 if the stem is `susans-headshot`
        or `susie-pic`, and 1600 otherwise. Downscale with LANCZOS if the
        image is larger.
    3.  **Encode:** Encode WebP in memory at `quality=80, method=6`.
        *   If the result is over 400 KB, re-encode from the in-memory
            resized image at q72.
        *   If it is still over 400 KB, multiply the max edge by 0.85 and
            repeat from q72, until it fits or the edge reaches 900.
    4.  **Name:** Lowercase the stem, replace every non-`[a-z0-9]` run
        with `-`, strip leading and trailing `-`, and add `.webp`. If that
        name already exists in this run, append `-2`, `-3`, and so on.
    5.  **Write:** Write the file, then delete the source only after the
        write succeeds.
*   **Manifest:** Merge entries into `scripts/image-manifest.json`, loading
    the existing file if present. Each entry is
    `{"old": "assets/images/…/Photography 1.jpg", "new": "assets/images/…/photography-1.webp", "w": 1600, "h": 1067, "bytes": n}`.
    A rerun is idempotent: there are no JPEGs left, and the manifest is
    preserved.
*   **Output:** Print totals before and after.

#### B2. `assets/images/**` (Modify)

The originals are replaced by WebP files.

**Checkpoint B1:**

*   No `.jpg` or `.jpeg` files remain under `assets/images`.
*   The total is under 8 MB.
*   The largest file is at most 400 KB.
*   The manifest has 34 entries.

### Phase 2, WS-B2: Image tags

#### B3. All HTML pages with `<img>` (Modify)

Use a one-off script in the scratchpad (not committed) that reads
`scripts/image-manifest.json` and edits every `<img>` in `*.html`:

*   **Path:** Replace `src` with the manifest's `new` value, matching on
    exact path.
*   **Dimensions:** Add `width="{w}" height="{h}"`.
*   **Decoding:** Add `decoding="async"`.
*   **Loading:** The first `<img>` in document order gets
    `fetchpriority="high"`. Every other `<img>` gets `loading="lazy"`.
*   **Cleanup:** Delete every `data-alt` attribute. All 11 are template
    placeholders that do not describe the actual photos.
*   **Missing `alt`:** If an `<img>` has no `alt`:
    *   On `about.html`, set `alt="Portrait of Susie Berube"`.
        > **Superseded (Addendum A-2):** every alt now comes from `scripts/image-catalog.json`.
    *   On article pages, use the text of the nearest following
        `<figcaption>` or caption paragraph if there is one.
    *   Otherwise use `alt="Photo for the article: {page <h1> text}"`.
*   **Other references:** Also rewrite any old image path in CSS or JS
    (grep `assets/images` across `assets/js` and `src`).

**Checkpoint B2:**

*   Every local `src` and `href` in `*.html` resolves to an existing file,
    checked by script.
*   No `src` contains a space.
*   Every `<img>` has `width`, `height`, and `alt`.
*   Exactly one `fetchpriority="high"` per page that has images.

### Phase 3, WS-C: Motion, JS, accessibility, resume, meta, headers

#### C1. `src/input.css` MOTION block (Modify)

All of this goes in `@layer components`, so Tailwind utilities such as
`md:hidden` still win.

```css
.motion-ready [data-reveal]:not(.is-visible){opacity:0;transform:translateY(16px)}
[data-reveal]{transition:opacity .6s cubic-bezier(.2,.7,.2,1),transform .6s cubic-bezier(.2,.7,.2,1);transition-delay:var(--reveal-delay,0ms)}
nav{transition:box-shadow .3s ease}
nav.nav-scrolled{box-shadow:0 6px 24px -12px rgb(31 36 34 / .18)}
.mobile-menu{display:grid;grid-template-rows:0fr;visibility:hidden;transition:grid-template-rows .3s ease,visibility 0s linear .3s}
.mobile-menu.is-open{grid-template-rows:1fr;visibility:visible;transition:grid-template-rows .3s ease}
.mobile-menu-inner{overflow:hidden;min-height:0}
@media (prefers-reduced-motion: reduce){
  [data-reveal]{opacity:1!important;transform:none!important;transition:none!important}
  .mobile-menu,.mobile-menu.is-open{transition:none}
  .group img{transition:none!important;transform:none!important}
}
```

This is pseudocode for the rules. The implementer may format it.

#### C2. `assets/js/main.js` (Modify)

The existing behavior is preserved. Changes:

*   **Toast:**
    *   Classes `bg-[#191c1e] text-[#fbf9f5]` become
        `bg-on-surface text-white`.
    *   Add `role="status" aria-live="polite"`.
    *   Create it empty, and set `textContent = "Email copied!"` inside
        `showToast()`. Clear it when it hides, so the text is announced
        each time.
*   **Mobile menu:**
    *   On click, toggle `.is-open` on `#mobileMenu`.
    *   Set `aria-expanded` on the button.
    *   Set the button's `textContent` to `close` or `menu`.
    *   Keydown Escape closes the menu (when open) and returns focus to
        the button.
    *   Clicking any `a` inside the menu closes it.
*   **Reveal:**
    *   **Setup:** Read
        `reduce = matchMedia('(prefers-reduced-motion: reduce)').matches`.
        If `!reduce && 'IntersectionObserver' in window`, continue:
        1.  For each `[data-reveal-stagger]`, loop over its direct children
            with index `i` and set `style.setProperty('--reveal-delay', (i % 6) * 70 + 'ms')`.
        2.  For each `[data-reveal]` whose `getBoundingClientRect().top < innerHeight`,
            add `is-visible`.
        3.  Add `motion-ready` to `document.documentElement`.
        4.  Observe the rest with `{threshold: 0, rootMargin: '0px 0px -10% 0px'}`.
            When an entry is intersecting, add `is-visible` and unobserve it.
    *   **Fallback:** Otherwise do nothing. Content stays visible.
*   **Nav shadow:** On a passive scroll listener with an rAF guard,
    `nav.classList.toggle('nav-scrolled', scrollY > 8)`. Run it once on
    load.

Setting `--reveal-delay` from JS is a CSSOM property write, not an inline
`style` attribute in the HTML source.

#### C3. All 13 HTML pages (Modify)

*   **Head:**
    *   **Preconnect:** Add
        `<link rel="preconnect" href="https://fonts.googleapis.com">` and
        `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`
        only where they are absent.
    *   **Icon font:** Replace the Material Symbols link with:
        `https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&icon_names=arrow_back,arrow_downward,arrow_forward,auto_stories,camera,close,download,edit_note,layers,mail,menu&display=block`
    *   **Meta description:** Add `<meta name="description" content="…">`
        with the text from the table below.
*   **Script:** `<script src="assets/js/main.js?v=3"></script>` becomes
    `<script src="assets/js/main.js?v=4" defer></script>`.
    > **Superseded (Addendum B):** now `main.js?v=6`.
*   **Copy-email control:** `#copyMailBtn` becomes a `<button type="button">`
    on the 3 pages where it is a `<span>` (written-works, achievements, and
    organizations).
    *   Keep its classes and drop `data-icon`.
    *   On all 13 pages, add `aria-label="Copy email address"`.
*   **Mobile menu:**
    *   On `#mobileMenuBtn`, add `type="button" aria-controls="mobileMenu" aria-expanded="false"`.
    *   Replace the `#mobileMenu` element with this structure, keeping the
        links and their classes unchanged:

        ```html
        <div id="mobileMenu" class="mobile-menu md:hidden bg-white dark:bg-stone-900/95">
          <div class="mobile-menu-inner">
            <div class="flex flex-col px-8 pt-2 pb-6 gap-4 border-b border-rose/60">…links…</div>
          </div>
        </div>
        ```

*   **Links:** Add `rel="noopener noreferrer"` to every `target="_blank"`
    link.
*   **Hero CTA spacing (`index.html`):** The "View Portfolio" button and the
    "Read my latest paper" link touch. Wrap both in
    `<div class="mt-10 flex flex-wrap items-center gap-6">`.
*   **Reveal markup:** Never tag the first child of `<main>`. Add attributes
    as follows:

    | Page | Markup |
    |---|---|
    | `index.html` | `data-reveal` on sections 2 (featured works), 3 (quote), and 4 (photo highlights). |
    | `about.html` | `data-reveal` on every `main > section` after the first. If a section is taller than 1.5 viewports at 375px wide, tag its direct children instead. |
    | `written-works.html` | `data-reveal` on section headings after the first. `data-reveal-stagger` on the card grid, with `data-reveal` on each card. |
    | `achievements.html`, `organizations.html` | `data-reveal-stagger` on the list or grid container that holds the entries, with `data-reveal` on each entry. |
    | `photography.html` | `data-reveal-stagger` on `.masonry-grid`, with `data-reveal` on each photo item. |
    | Article pages | No reveal markup. |

*   **Meta descriptions:**

    | Page | `content` |
    |---|---|
    | `index.html` | Portfolio of Susan "Susie" Berube: journalism, essays, and photography by a Kean University English and Journalism student. |
    | `about.html` | About Susan Berube: background, skills, and resumes for writing and journalism work. |
    | `photography.html` | Photography by Susan Berube. |
    | `written-works.html` | Published articles and essays by Susan Berube, including features for The Tower at Kean University. |
    | `achievements.html` | Awards, honors, and academic achievements of Susan Berube. |
    | `organizations.html` | Organizations Susan Berube is involved with at Kean University and in her community. |
    > **Superseded (Addendum A-1):** these descriptions now say "Susan Berube-Leiva" (and "Susan \"Susie\" Berube-Leiva" on index).
    | Each article page | The first sentence of the article body, cut to at most 155 characters at a word boundary. |

#### C4. `assets/resumes/english-resume.pdf` (Replace)

Copy `~/Downloads/Berube, Susan_Resume.pdf` byte-for-byte over this file.
Verify the copy with `cmp`.

#### C5. `vercel.json` (Create)

`{"$schema":"https://openapi.vercel.sh/vercel.json","headers":[{"source":"/(.*)","headers":[…the four headers from the Technical Plan…]}]}`

There is no cache rule and no CSP.

#### C6. `README.md` (Modify)

*   **"Running Locally" section:** Replace the paragraph at line 19 with
    these steps:
    1.  Run `npm install` once.
    2.  After editing classes, run `npm run build:css`.
    3.  Bump `?v=` on the stylesheet link.
    4.  Run `npm run check:css` before pushing.
*   **Theme:** Document the palette tokens and the naming rule.
*   **Images:** Document `scripts/optimize_images.py` for new photos.

**Checkpoint C:**

*   `node --check assets/js/main.js` passes, and `npm run build:css`
    succeeds.
*   No `main.js?v=3` remains.
*   Every `target="_blank"` has `rel`.
*   The new resume matches the source PDF (`cmp`).

### Phase 4: Verification (Program manager)

*   **Static:** Checkpoints A, B1, B2, and C are re-run on the final tree.
    `npm run check:css` exits 0.
*   **Behavior:** Run a headless browser script (Playwright via `npx`, or
    Chrome DevTools Protocol) at 375x812 on every page. It checks:
    1.  After scrolling to the bottom in 300px steps, every `[data-reveal]`
        has a computed opacity of 1.
    2.  With `reducedMotion: 'reduce'`, every `[data-reveal]` has opacity 1
        on load.
    3.  With JavaScript disabled, every `[data-reveal]` has opacity 1.
    4.  The menu button toggles `aria-expanded`. Escape closes the menu,
        and a closed menu's links are not focusable (computed
        `visibility: hidden`).
    5.  `nav.nav-scrolled` is present after `scrollTo(0, 50)`.
*   **Lighthouse:** Run
    `npx lighthouse http://localhost:8090/{index,photography}.html --form-factor=mobile --only-categories=performance,accessibility,best-practices,seo --chrome-flags="--headless=new"`
    against `python -m http.server 8090`. Compare against the baseline and
    check G8.
*   **Design:** Run Hallmark
    `node <hallmark>/scripts/sloplint.mjs . --genre editorial --scope app`.
    FAIL count must drop from the baseline of 506. Fix any new FAILs.
    `--render` runs if a browser is available.
*   **Security:**
    *   `npm audit` reports 0 vulnerabilities.
    *   The `security-review` skill runs on the branch diff.
    *   A secret grep finds nothing.
*   **Drift:** Run the EGM drift report against this document.

## Phase 4 Amendments (as built)

These changes came out of the Phase 4 checks. They are part of the shipped
design.

*   **Favicon:** `assets/favicon.svg` (an "S" monogram, tourmaline-deep on
    a rose tint), linked on all 13 pages. It fixes a `/favicon.ico` 404 the
    render test caught.
*   **SEO (claude-seo technical audit):**
    *   The six non-article pages get unique `<title>`s (`<Page> | Susie's
        Stories`).
    *   `robots.txt` (allow all) is added.
    *   HSTS is added to `vercel.json`.
    *   Truncated article meta descriptions end with "…".
    *   Deferred until the production domain is known: canonicals,
        `sitemap.xml`, Open Graph and JSON-LD.
        > **Superseded (Addendum A-1):** done once the domain `susie-website.vercel.app` was known.
*   **Hallmark sloplint fixes:**
    *   `font-['Noto_Serif']` becomes `font-headline` everywhere, including
        the mobile menu links. It is the same font.
    *   `transition-all` is replaced with named properties:
        *   `transition-colors` for links and cards
        *   `transition-transform` for hover-zoom images
        *   `transition-[gap]` for the arrow link
        *   `transition-[transform,opacity]` for the toast
    *   The nav shadow color uses `theme('colors.on-surface / 18%')`.
    *   Line 1 of `src/input.css` is the Hallmark critique stamp. The site
        build comment is now on line 2.
*   **Contrast:** `text-on-surface-variant/60` ("Coming Soon",
    `written-works.html`) becomes `text-taupe-deep`. **Opacity rule
    addendum:** no `/NN` modifier below 70 on any text token.
*   **Cache-bust:** `site.css?v=3` (bumped once per rebuild in this branch).
    > **Superseded (Addendum B):** current values are `site.css?v=6` and `main.js?v=6`.
*   **Toast:** the fallback copy shows the toast only when `execCommand`
    succeeds.
*   **Image script:** collision checks also consider files already on disk,
    so a future upload cannot overwrite an existing WebP.
*   **`check:css`:** it only becomes effective once `site.css` is committed,
    because `git diff` ignores untracked files.

## Addendum A (2026-11-02): Name, Domain, Image Catalog, Tagged Gallery

The owner asked for this after the main work shipped. It is a scoped add-on,
so it went through a design addendum and the full verification suite instead
of a separate EGM review cycle.

### A-1. Owner name and production domain (done)

*   **Name:** the site identity reads "Susan Annette Berube-Leiva" in the
    hero, titles, meta descriptions and JSON-LD.
    *   Article bylines ("By: Susan Berube") are left as they were
        published.
*   **Domain:** `https://susie-website.vercel.app`. Every page gets:
    *   a `rel="canonical"` link;
    *   Open Graph tags: type, site_name, title, description, url, image;
    *   `twitter:card`.
*   **Social image:** article pages use their cover image. All other pages
    use the headshot.
*   **Structured data:** `index.html` gets `Person` JSON-LD.
*   **Crawling files:** `sitemap.xml` lists all 13 URLs, and `robots.txt`
    points to it.

### A-2. Image catalog

*   **Source of truth:** `scripts/image-catalog.json` maps each image path
    to `{alt, tags}`.
*   **How it was written:** a reviewer looked at each image and wrote the
    entry from what is actually visible.
*   **Tag vocabulary:** portrait, people, cityscape, landscape,
    architecture, nature, animals, event, still-life, street, document,
    graphic. The `animals` tag was added after review, because no other tag
    fit the cat photo.
*   **Tag order:** each image has 1–2 tags, and the first is its primary
    tag.
*   **In the HTML:** every `<img>` `alt` is set from the catalog.
*   **Photo placement:** the reviewer flagged the two "Local Sites"
    article photos as possibly swapped. Checking the HTML showed each
    photo closes its own section (museum after "Recreation", cafe after
    "Food and Beverage"), so the placement was kept.

### A-3. Tagged photography gallery (`photography.html`)

*   **Order:** photo items in `.masonry-grid` are grouped by primary tag, so
    the default view is organized. Groups are ordered by size, largest
    first, and items keep their original order within each group.
*   **Item markup:**
    *   Each item gets `data-tags="<space-separated tags>"`.
    *   Each item shows a small caption chip naming its primary tag.
*   **Filter bar:**
    *   It sits above the grid as
        `<div class="gallery-filters" role="group" aria-label="Filter photos by subject" hidden>`.
        > **Superseded (Addendum B):** the bar ships without `hidden`, to avoid a layout shift.
    *   It holds one `<button type="button" aria-pressed>` for "All", plus
        one per tag present, each labeled with its count (for example,
        "Portrait 4").
        > **Superseded (Addendum B):** see Addendum B for the button order and counting rules.
    *   It renders from first paint, so it causes no layout shift. Without
        JavaScript a `<noscript><style>` in the page `<head>` hides it, and
        every photo stays visible.
*   **Filtering (`main.js`):**
    *   Clicking a button sets `aria-pressed` and toggles `hidden` on items
        whose `data-tags` lack that tag.
    *   It writes `#tag=<tag>` to the URL with
        `history.replaceState`, and reads that value on load so a filter
        can be shared.
    *   An item that is shown again but not yet revealed is still observed,
        so it fades in normally.
*   **Accent mapping (chips and the active filter):** each tag gets one of
    the four Pantone accents as the chip fill, with ink text (`on-surface`)
    for contrast.

    | Accent | Tags |
    |---|---|
    | rose | portrait, people |
    | tourmaline | cityscape, street, architecture |
    | reseda | landscape, nature, animals |
    | taupe | event, still-life, document, graphic |

    *   The active button uses the same accent at full strength, with
        `aria-pressed="true"` and an underline, so the state does not
        depend on color alone.
*   **Verification:** the behavior test adds these checks:
    *   Filtering by each tag shows only matching items.
    *   "All" restores every item.
    *   `#tag=` restores the filter on load.
    *   With JavaScript off, all 15 photos are visible and the bar is
        hidden.

## Addendum B (2026-11-03): As Built

This section records how Addendum A and the font fix were finally built, as
the second drift check asked. It is the authoritative reference for these
details.

### Gallery (`photography.html`, `main.js`)

*   **Grouping:** items are grouped by primary tag. Groups go largest first,
    and ties are broken alphabetically. Within a group, items keep the order
    they had on the original page.
*   **Filter buttons:**
    *   "All" comes first. The rest are ordered by count, largest first,
        with ties alphabetical.
    *   A count includes every photo that carries the tag, not just its
        primary group. Today's labels: All 15, Landscape 6, Architecture 3,
        People 3, Still life 3, Event 2, Nature 2, Animals 1, Cityscape 1,
        Portrait 1.
    *   `still-life` is labeled "Still life".
*   **Fills:**

    | Element | Fill |
    |---|---|
    | Chip | `bg-<accent>/30` |
    | Inactive button | `bg-<accent>/20`, `/40` on hover |
    | Active button | full accent plus an underline on the label |
    | "All" | no accent: an outline ring when inactive, `bg-surface-dim` when pressed |

    The lowest ink contrast across all of these is 5.54:1.
*   **No layout shift:** the bar renders from first paint and carries no
    `hidden` attribute. A `<noscript><style>` in `photography.html`'s
    `<head>` hides the bar when JavaScript is off; every photo stays
    visible either way.
*   **Hash handling:**
    *   The hash must match `/^#tag=([a-z-]+)$/` and name a tag that has a
        button. Anything else shows All.
    *   A `hashchange` listener re-applies the filter.
    *   Clicking "All" removes the hash with `history.replaceState` instead
        of writing `#tag=all`.
*   **Filtered-out items:** they use the `hidden` attribute, and
    `.masonry-grid > [hidden]{display:none}` makes it beat the display
    utilities.
*   **Reveal integration:**
    *   `initGalleryFilter()` runs before `initReveal()`.
    *   Reveal skips elements with no box (`getClientRects().length === 0`)
        when it marks on-screen items, and keeps observing them. A photo
        hidden by a `#tag=` link therefore fades in normally when shown.

### Fonts

*   **Faces in `src/input.css`:** 8 `@font-face` rules in `@layer base`:
    *   3 web fonts: Inter variable 300–700, Noto Serif variable 400–700,
        and Noto Serif 400 italic.
    *   5 metric-matched fallbacks:

        | Fallback | Local font | Weights |
        |---|---|---|
        | Inter Fallback | Arial | 300–500 |
        | Inter Fallback | Arial Bold | 600–700 |
        | Noto Serif Fallback | Georgia | 300–500 |
        | Noto Serif Fallback | Georgia Bold | 600–800 |
        | Noto Serif Fallback | Georgia Italic | italic |

*   **Stacks:** `tailwind.config.js` stacks list each fallback second.
*   **Preloads:** the two upright variable files are preloaded on every page.
*   **Result:** CLS is 0.001 on index and photography, down from 0.059 and
    0.195.

### Merge with `origin/main` (2026-11-03)

Two commits had landed on `origin/main` after this branch started
(`336d3cc`, `dfc201c`). They were merged into the branch, with these
resolutions:

*   **Dropped:** `assets/js/tailwind-config.js` and `assets/css/styles.css`.
    They still used the Play CDN, and `site.css` supersedes them.
*   **Titles:** the refresh's titles are kept over "Susie's Stories |
    Portfolio".
*   **Tulip icon:** adopted, replacing the "S" monogram:
    *   It lives at `assets/images/favicon.svg`.
    *   It is recolored to the Reseda stem and the Bridal Rose flower.
    *   It is the favicon, and a nav logo beside "Susie's Stories" on all
        13 pages. The remote had the logo on 11 pages.
    *   The logo has `alt=""`, because the link text already names the
        site.
*   **Mail icon on phones:** the remote hid it on phones on
    `written-works.html` only. The refresh rebuilt that header, so the
    phone-width header was rechecked instead.
*   **Visible text:** a text comparison found no copy, image or link that
    the refresh lost.

### Cache-bust values

`site.css?v=6`, `main.js?v=6`.

### Name scope

*   **Full name:** "Susan Annette Berube-Leiva" is used everywhere the site
    names her: the index hero and `<title>`, every meta and Open Graph
    description, the Person JSON-LD, and the portrait alts. The owner made
    this decision on 2026-11-03.
*   **Short titles:** the other page titles carry no name ("About Susie |
    Susie's Stories" and similar).
*   **Unchanged:** article bylines keep the published "Susan Berube".

--------------------------------------------------------------------------------

*Drafted with EGM*
