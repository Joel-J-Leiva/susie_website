# Susie's Portfolio Website

A static frontend portfolio website showcasing written works, photography, and professional resumes. 

## 📂 Project Structure

- `index.html` — Homepage
- `about.html` — About Me section & Resume downloads
- `photography.html` — Photography showcase
- `written-works.html` — Published articles and excerpts
- `assets/`
  - `images/` — Contains portraits and media
  - `js/` — Shared Javascript (clipboard/email logic)
  - `resumes/` — PDF CV files
  - `written_works/` — PDF article source files

## 🚀 Running Locally

Because this project is a purely static website using plain HTML, CSS, and Tailwind via CDN, you do not need to install `npm` modules or run a specific builder. 

Simply open `index.html` in any modern web browser (Chrome, Safari, Firefox). 

## 🌍 Deploying to Vercel

This repository is optimized for **Vercel** and **GitHub Pages**. 
To deploy on Vercel:

1. Push this repository to GitHub.
2. Log into [Vercel](https://vercel.com).
3. Click **Add New Project** and select your GitHub repository.
4. Leave all build settings (Framework Preset, Build Command, Output Directory) to their default empty values (`Other`).
5. Click **Deploy**.

## 📝 Updating Content

- **Resumes:** To update the resumes, drop the unified naming format (e.g. `english-resume.pdf`) directly into `assets/resumes/`, replacing the old file.
- **Images:** Add your image to `assets/images/` and update the `src` attribute within the target HTML file. Use lowercase file names with no spaces for deployment safety.
