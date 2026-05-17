# wasl-web

Standalone marketing website for `waslhq.com` focused on **WASL** as a unified gateway and iPaaS platform.

## What this module includes

- Main landing page: `src/index.html`
- Public docs pages: `src/docs/`
- Enterprise campaign variant: `src/enterprise.html`
- Product positioning for unified gateway, FlowJS iPaaS runtime, gateway plugins, Studio, Portal, and AI governance
- Waitlist capture integration hooks
- Analytics and ad-pixel integration hooks
- Static deploy configs for Vercel, Netlify, and Cloudflare Pages

## Run locally

```bash
npm --prefix wasl-web run dev
```

Open `http://localhost:4173`.

## Build

```bash
npm --prefix wasl-web run build
```

Output goes to `wasl-web/dist/`.

## Preview built site

```bash
npm --prefix wasl-web run start
```

## Configure waitlist + analytics

Edit `src/config.js`:

- `waitlist.endpoint`: API endpoint to receive leads
- `waitlist.fieldMap`: map payload field names for your backend
- `analytics.ga4MeasurementId`: GA4 measurement ID
- `analytics.gtmId`: reserved for GTM usage
- `pixels.linkedinPartnerId`: LinkedIn Insight Tag partner ID
- `pixels.googleAdsId`: Google Ads conversion ID
- `links.github/docs/roadmap`: Open-source credibility links

If `waitlist.endpoint` is empty, form submission uses local success mode (no network call).

## A/B / campaign usage

- Main page: `/`
- Docs: `/docs/`
- Enterprise page: `/enterprise`
- Inline A/B variant on main page: `/?variant=enterprise`

Use paid traffic to point to `/enterprise` while organic and branded traffic uses `/`.

## Deploy

- GitHub Pages: this repo uses `.github/workflows/deploy-pages.yml`. In repository settings, set
  **Settings → Pages → Build and deployment → Source** to **GitHub Actions**. If Pages is set to
  "Deploy from a branch" at repository root, GitHub will show this README instead of the website.
- Vercel: uses `vercel.json`
- Netlify: uses `netlify.toml`
- Cloudflare Pages/Workers: uses `wrangler.toml`

Recommended domain mapping:
- Primary: `waslhq.com`
- Optional campaign: `enterprise.waslhq.com` -> `/enterprise`
