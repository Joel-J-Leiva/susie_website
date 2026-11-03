# Consolidated Goldfish Review: site-quality-refresh.md

*   **Date:** 2026-11-02
*   **Target:** `docs/designs/site-quality-refresh.md`
*   **Reviewers:** Each ran in a fresh, isolated context, in parallel:
    *   `egm-zoom-out`: full file
    *   `egm-design`: FeatureRange, against the feature-spec standard
    *   `egm-implementation-readiness`: DetailedRange
    *   `egm-codebase-details`: DetailedRange, checked against the repo
*   **Mode:** consolidated, abridged. Stage 6 (comprehension) and the
    structural and style passes were skipped because this is a small static
    site. The four reviewers above cover zoom-out, design, readiness, and
    codebase accuracy.
*   **Raw totals:**
    *   5 Blocker
    *   about 27 Major
    *   about 25 Nit
    *   Many findings overlapped. After deduplication, 24 action items
        remain (below).
*   **Outcome:** All Blocker and Major items are resolved in the design doc.
    Three items were contested with a stated reason (marked CONTEST).

## Action items and resolution

| # | Pri | Finding (sources) | Resolution |
|---|---|---|---|
| 1 | 🔴 | Light-blue link colors are inline `style` attrs, so a class rewrite cannot reach them. Mapping to `tourmaline` (2.7:1) also fails G2. (ZO-F2, DC-3, IR-1, CD-B2) | **FIX.** Delete the attrs. Links use `text-primary` (6.1:1) with a rose underline. Checkpoint A greps for zero `style="`. |
| 2 | 🔴 | Token values incomplete, and configs conflict (`surface-container`, `outline-variant`). (IR-2, CD-B1) | **FIX.** Full table covering all 50 keys in the union of the configs. `surface-container-high` newly rendering on 3 pages is accepted and documented. |
| 3 | 🔴 | Tall sections never reach threshold 0.12 and stay hidden. (DC-1) | **FIX.** `threshold: 0`. Tall containers are never tagged; their children are. A scroll-to-bottom test at 375x812 is added. |
| 4 | 🔴 | If `main.js` fails, everything stays hidden because of the head `js-motion` class. (DC-2) | **FIX.** Head snippet removed. `main.js` adds `motion-ready` itself, so a failure hides nothing. A no-JS test is added. |
| 5 | 🔴 | Mobile menu under-specified: layer, outer padding, focusable hidden links. (IR-5, CD-B3, ZO-F7, DC-8) | **FIX.** Exact markup and CSS given. Rules go in `@layer components`. Padding moves to the inner wrapper. `visibility:hidden` is set when closed. Escape and link click close the menu. |
| 6 | 🟡 | Auto-tagging `main > section` hides the hero and LCP, causes a flash, and misses 10 of 13 pages. (ZO-F1, IR-3, DC-7, CD-M1, CD-M2) | **FIX.** Explicit `data-reveal` markup per page. The first child of `<main>` is never tagged. In-viewport elements are marked visible before `motion-ready` is added. |
| 7 | 🟡 | Stagger semantics undefined. (IR-4, CD-M3) | **FIX.** The container is not hidden, children get `data-reveal`, and the delay is (i mod 6) × 70ms. Containers are named per page. |
| 8 | 🟡 | Opacity modifiers on accent text (`text-primary/80`) fall to about 3.9:1. (DC-4) | **FIX.** Opacity rule added: accent text is solid only. `/80` maps to `on-surface/80`. Ink below `/70` maps to `taupe-deep`. |
| 9 | 🟡 | CSP with inline hash is fragile and out of scope. (ZO-F3, ZO-F6, IR-9, CD-M6, DC-13) | **FIX.** CSP dropped and moved to Future Improvements and Alternative H. `vercel.json` keeps only four static headers. |
| 10 | 🟡 | `/assets` max-age makes the CSS and resume stale. (ZO-F3, IR-8, DC-5, CD-M7) | **FIX.** No cache rule. `site.css?v=N` added. Rollback text updated. |
| 11 | 🟡 | Committed `site.css` can go stale silently. (DC-6) | **FIX.** `npm run check:css` added and documented. Standalone CLI and Vercel-build options added as Alternatives C and D. |
| 12 | 🟡 | Parallel WS-B/WS-C editing the same files. (ZO-F4) | **FIX.** Phases are sequential after Phase 1. Phase 1 pairs A (HTML) with B1 (images only), which touch disjoint files. |
| 13 | 🟡 | Reduced-motion rule would break the toast's static transforms. (IR-6, DC-8) | **FIX.** Exact scoped CSS: only reveal, menu, and hover-image transitions are affected. |
| 14 | 🟡 | Toast in `main.js` uses retired colors, and the live region never announces. (IR-7, CD-M5, DC-11) | **FIX.** Toast moves to `bg-on-surface text-white`, and its text is set when shown. G1 and the grep now cover JS and CSS. |
| 15 | 🟡 | Image pipeline contradictions: fallback after deletion, manifest only on stdout, slug collisions, rewrite method unstated. (IR-10, CD-M8) | **FIX.** The fallback loop runs in memory before deletion. The manifest file is merged and committed. Collision suffixes added. A manifest-driven rewrite script is specified. |
| 16 | 🟡 | `alt` and `data-alt` handling undecided, and some images have no `alt`. (IR-14, CD-M9) | **FIX.** All 11 `data-alt` are deleted, because they are template placeholders that don't match the photos. Rules are set for missing `alt`. |
| 17 | 🟡 | `#copyMailBtn` is a `<span>` on 3 pages. (CD-M4) | **FIX.** Converted to `<button type="button">` with an `aria-label`. |
| 18 | 🟡 | Body base rules differ per page and would carry the retired cream. (CD-M11) | **FIX.** The final base rules are spelled out in A3. |
| 19 | 🟡 | Screenshot diff vs `main` can't isolate lost classes once colors change. (CD-M12) | **PARTIAL.** Reviewers compare layout, spacing, and type, with only colors allowed to differ. A two-build pixel diff was judged not worth it for 13 pages (CONTEST, see below). |
| 20 | 🟡 | No per-phase checkpoints or behavior tests. (CD-M13, IR-16) | **FIX.** Checkpoints A, B1, B2, and C added. Phase 4 adds behavior tests and the exact Lighthouse command. |
| 21 | 🟡 | Meta description text left to the implementer, and two pages have no intro. (CD-M10, IR-16) | **FIX.** Exact text per page, plus a deterministic rule for articles. |
| 22 | 🟡 | G8 has no baseline. (DC-7) | **FIX.** Baseline Lighthouse run against `main`, with results appended below. |
| 23 | 🟢 | Nits: icon count, 34 images not 40, plugins, `#a0c0cd` only in `dark:`, CSS size mismatch, preconnect duplicates, `display=block`, card-hover sentence, README wording. (ZO-F5, DC-9 to DC-12, IR-11 to IR-15, CD-N1 to CD-N8) | **FIX.** All corrected. The card-hover lift item is dropped. |
| 24 | 🟢 | Python and Node toolchains both needed; meta and sloplint are outside the goals. (ZO-F9, ZO-F10) | **CONTEST.** Python is already installed, and the image script is optional for future uploads. Meta descriptions and sloplint come from the owner's standing workflow (CLAUDE.md requires Hallmark and SEO checks). |

## Contested items

*   **#19, two-build pixel diff:**
    *   Building an old-palette CSS first only to diff it doubles WS-A's work.
    *   Tailwind v3 CLI generates every class the Play CDN did, including
        arbitrary values. Missing-style risk is therefore limited to config
        keys, and item #2 now defines them all.
    *   Visual layout review plus the Hallmark render check covers the rest.
*   **#24:** See the table.
*   **ZO-F5 (motion numbers in the architecture section):** The numbers stay.
    The readiness reviewers asked for exact values, and the Zero-Decision
    Rule wins over altitude in a plan this small.

## Baseline (main branch, Lighthouse 13.6 mobile)

| Page | Perf | A11y | Best Pr. | SEO | LCP | CLS | TBT | Transfer |
|---|---|---|---|---|---|---|---|---|
| index.html | 43 | 95 | 96 | 91 | 27.4 s | 0.025 | 1,670 ms | 4,978 KB |
| photography.html | 78 | 95 | 96 | 91 | 3.0 s | 0.036 | 230 ms | 21,923 KB |

Hallmark sloplint baseline (`--genre editorial --scope app`): 506 FAIL,
13 REFLEX, 99 WARN.
