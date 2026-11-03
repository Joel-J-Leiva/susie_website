# Susie's Portfolio Website

A static frontend portfolio website showcasing written works, photography, and professional resumes. 

## 📂 Project Structure

- `index.html` — Homepage
- `about.html` — About Me section & Resume downloads
- `photography.html` — Photography showcase
- `written-works.html` — Published articles and excerpts
- `achievements.html` — Awards and honor societies
- `organizations.html` — Organizations and roles
- `article-*.html` — Individual article pages
- `assets/`
  - `css/site.css` — Prebuilt, minified stylesheet (generated, committed)
  - `fonts/` — Self-hosted Inter and Noto Serif (woff2, latin subset) + `OFL.txt` license
  - `images/` — Contains portraits and media (WebP) plus `favicon.svg`, the tulip site icon also used as the nav logo
  - `js/main.js` — Shared JavaScript (email copy, mobile menu, gallery filter, scroll reveal, nav shadow)
  - `resumes/` — PDF CV files
- `src/input.css` — Stylesheet source (Tailwind directives, base styles, motion)
- `tailwind.config.js` — The single source of theme colors, fonts, and radii
- `scripts/optimize_images.py` — Converts new JPEG photos to WebP
- `scripts/image-catalog.json` — Alt text and subject tags for every image
- `sitemap.xml`, `robots.txt` — Search engine discovery for https://susie-website.vercel.app
- `vercel.json` — Security headers for Vercel

## 🚀 Running Locally

The site is plain HTML with a precompiled Tailwind stylesheet, so there is nothing to build to view it: open `index.html` in any modern browser, or serve the folder (for example `python -m http.server`).

To change styles or Tailwind classes:

1. Run `npm install` once.
2. After editing classes in any HTML or JS file (or `src/input.css` / `tailwind.config.js`), run `npm run build:css`. This regenerates `assets/css/site.css`.
3. Bump the `?v=` number on the stylesheet link (`assets/css/site.css?v=N`) in every HTML page so browsers fetch the new file. Do the same for `assets/js/main.js?v=N` when you change the script.
4. Run `npm run check:css` before pushing. It rebuilds the CSS and fails if the committed `site.css` is out of date.

## 🎨 Theme

All colors, fonts, and radii live in `tailwind.config.js`. Pages never carry their own Tailwind config.

The palette is white (`#FFFFFF`) plus four Pantone accents. Each accent has a **swatch** for fills, borders, and rules, and a **deep** shade of the same hue for text (the swatches are too light to meet WCAG AA contrast as text):

| Token | Hex | Use |
|---|---|---|
| `tourmaline` | `#86A1A9` | Decorative only |
| `tourmaline-deep` | `#4A6670` | Links, nav, icons (`primary`) |
| `rose` | `#D69FA2` | Decorative: nav rule, quote bars, selection (`secondary`) |
| `rose-deep` | `#8F4F55` | Accent text |
| `reseda` | `#A1AD92` | Decorative: chips, dividers |
| `reseda-deep` | `#536048` | Eyebrow labels, filled buttons with white text (`tertiary`) |
| `taupe` | `#AF9483` | Decorative: outlines, footer rule (`outline`) |
| `taupe-deep` | `#6E5848` | Secondary and meta text (`on-surface-variant`) |

Naming rule:

- Use the semantic names in markup (`text-primary`, `bg-surface-container-low`, `text-on-surface`, `border-outline-variant`, ...).
- Use a Pantone name only where no semantic name fits, for example `border-rose` or `text-rose-deep`.
- Never put an opacity modifier on accent-colored text (no `text-primary/80`). Ink text (`text-on-surface/NN`) may use opacity only for NN of 70 or more; otherwise use `text-taupe-deep`.

## ✨ Motion

Motion is progressive enhancement in `assets/js/main.js`; if the script fails, all content stays visible.

- Add `data-reveal` to a below-the-fold block to fade it in on scroll. Never tag the first block on a page, and tag the children of very tall containers rather than the container itself.
- Add `data-reveal-stagger` to a grid or list (and `data-reveal` to each child) to stagger the children.
- With the OS "reduce motion" setting on, nothing animates.

## 🌍 Deploying to Vercel

This repository is optimized for **Vercel** and **GitHub Pages**. 
To deploy on Vercel:

1. Push this repository to GitHub.
2. Log into [Vercel](https://vercel.com).
3. Click **Add New Project** and select your GitHub repository.
4. Leave all build settings (Framework Preset, Build Command, Output Directory) to their default empty values (`Other`). `site.css` is committed, so no build step is needed.
5. Click **Deploy**.

`vercel.json` adds a few security headers (`X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`, `Strict-Transport-Security`). GitHub Pages ignores it.

## 📝 Updating Content

- **Resumes:** To update the resumes, drop the unified naming format (e.g. `english-resume.pdf`) directly into `assets/resumes/`, replacing the old file.
- **Images:** Put new JPEG photos in `assets/images/` (or a subfolder), then run `python scripts/optimize_images.py` (requires Pillow: `pip install Pillow`). It converts each JPEG to a size-capped WebP with a lowercase, hyphenated name, deletes the original, and records the new file's width and height in `scripts/image-manifest.json`. In the HTML, point `src` at the `.webp` file and add `width`, `height`, `decoding="async"`, and `loading="lazy"` (except for the first image on a page).
- **External links:** Any link with `target="_blank"` must also have `rel="noopener noreferrer"`.

## 🏷️ Image catalog & gallery tags

`scripts/image-catalog.json` is the source of truth for every image's `alt` text and subject tags. It maps each image path to `{ "alt": "...", "tags": [...] }`. Every `<img>` `alt` on the site must match its catalog entry (HTML-escaped). Each image has one or two tags, and the first is its **primary** tag.

Tag vocabulary: `portrait`, `people`, `cityscape`, `street`, `landscape`, `architecture`, `nature`, `animals`, `event`, `still-life`, `document`, `graphic`.

On `photography.html`, each tag maps to a Pantone accent. The caption chip uses a light tint (`bg-<accent>/30`), and the active filter button uses the full swatch with an underline. Text is always ink (`text-on-surface`):

| Accent | Tags |
|---|---|
| `rose` | portrait, people |
| `tourmaline` | cityscape, street, architecture |
| `reseda` | landscape, nature, animals |
| `taupe` | event, still-life, document, graphic |

The gallery is grouped by primary tag, with the largest group first and ties ordered alphabetically. The filter bar above it has one button per tag present, labeled with its count. Buttons are ordered by count (largest first, ties alphabetical); a count includes every photo carrying that tag, not just its primary group. The bar renders from first paint; a `<noscript>` style hides it when JavaScript is off, and every photo stays visible. A filter can be shared as `photography.html#tag=<tag>`.

To add a new photo:

1. Put the JPEG in `assets/images/photography/` and run `python scripts/optimize_images.py`.
2. Add an entry for the new `.webp` path to `scripts/image-catalog.json`, with an `alt` that describes what is visible and one or two tags (primary first).
3. In `photography.html`, copy an existing `.masonry-grid` item into its primary tag's group. Set `src`, `alt`, `width`, `height`, `data-tags` (space-separated), and the chip's text and `bg-<accent>/30` class. If a group's size changes its position in the order, move the group. Then update the filter button counts, and add a button if the tag is new.
4. Run `npm run build:css` if you used a class that is not already on the site, and bump the `?v=` numbers.
