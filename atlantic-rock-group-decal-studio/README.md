# Atlantic Rock Group Decal Studio

A responsive, browser-based decal designer for creating custom vehicle lettering and artwork, previewing approximate physical dimensions, downloading artwork, and preparing a quote handoff.

## Requirements

- Node.js 20 or newer
- npm

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. To check types or make a production build:

```bash
npm run typecheck
npm run build
npm run preview
```

The production site is written to `dist/`.

## Configuration

Edit `src/config.ts` to change the official website and quotation destination. Replace `QUOTE_URL` with the final URL of Atlantic Rock Group's quotation form before launch. Until that URL is available, quote preparation stays in the browser and the app clearly states that nothing has been submitted.

The app does not require a backend or account. Designs are stored in the visitor's browser using local storage. Upload size/type and design dimension limits are also in `src/config.ts`.

## Push this project to GitHub

1. Create an empty repository on GitHub (do not initialize it with a README if you plan to push this folder as-is).
2. Unzip this download and open a terminal in the extracted project folder.
3. Run:

```bash
git init
git add .
git commit -m "Add Atlantic Rock Group Decal Studio"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

Replace `YOUR-USERNAME` and `YOUR-REPOSITORY` with the GitHub account and repository name. GitHub will prompt you to authenticate if needed.

## Publish on Cloudflare Pages

1. Push the project to GitHub using the steps above.
2. In Cloudflare, create a Pages project and connect the GitHub repository.
3. Set the build command to `npm run build` and the build output directory to `dist`. Leave the project root as `/`.
4. Deploy, then copy the public URL Cloudflare provides.
5. In Elementor, open the Button widget, paste the public app URL into its Link field, and update the WordPress page.

The included `public/_redirects` file keeps the `/quote` route working when opened directly or refreshed.

## Customer flow and artwork limitations

Customers can design without an account, download SVG and PNG artwork and a text summary, then prepare their details for a quote. The quote page opens the configured external destination; it does not claim that anything has been sent.

All files and on-canvas designs are previews. Live text is not outlined, and raster artwork is not vector cut data. Atlantic Rock Group must confirm final dimensions, vinyl availability, and production readiness.
