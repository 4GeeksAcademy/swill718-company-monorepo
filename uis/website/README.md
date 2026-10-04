# TrackFlow Public Website

TrackFlow's first public touchpoint: a responsive company website and a separate, locally validated logistics inquiry form. Built with semantic HTML, JavaScript, Vite, Tailwind CSS 4, self-hosted Manrope, and Lucide icons. No UI framework, runtime CSS CDN, analytics, or backend is required.

## Run in Codespaces or Locally

Requires Node.js 22.12+ (Node 24 recommended) and npm. Run these commands from the repository root:

```sh
npm ci --prefix uis/website
npx --prefix uis/website vite uis/website --host 0.0.0.0 --port 3000 --strictPort
```

The command binds to `0.0.0.0`, as required for Codespaces port forwarding. Open port 3000 from the Ports panel. To allow external evaluation, set its visibility to **Public** and copy the forwarded URL. Do not use real personal information in this preview. The `--strictPort` option reports a conflict rather than silently choosing a different port.

```sh
npm --prefix uis/website run build
npm --prefix uis/website run preview -- --port 4173
```

The production output is in `dist/`. Deploy this directory to a static host. Pages: `/`, `/application.html`, and `/privacy.html`.

## Form Contract and Assumptions

The repository's `CONTEXT.md` defines services and operating countries, but does **not** prescribe application fields, entity IDs, or field validation rules. This implementation assumes a B2B logistics inquiry, not a job application or recipient parcel lookup. It does not invent warehouse IDs, policies, delivery guarantees, street addresses, or contact email addresses.

| Name | Meaning | Validation |
| --- | --- | --- |
| `fullName` | Contact's full name | Required, trimmed, 2-100 characters; supports international names |
| `email` | Contact email | Required, email format, maximum 254 characters |
| `phone` | Contact phone | Optional; 7-15 digits, optional leading `+`, spaces, periods, parentheses, or hyphens |
| `company` | Company / brand name | Required, trimmed, 2-120 characters |
| `country` | Operating market | Required; `US` (United States) or `ES` (Spain) |
| `monthlyShipments` | Estimated monthly shipment volume | Required integer, 1-1,000,000; an inquiry-form limit, not a stated company capacity |
| `services` | Requested logistics services | At least one of `fulfillment`, `last-mile`, `returns` |
| `startDate` | Preferred start date | Optional valid date from today through 2099-12-31, using the browser's local date |
| `message` | Additional logistics context | Optional, maximum 2,000 trimmed characters |
| `consent` | Permission to contact about this inquiry | Required checkbox |

Service-specific links preselect the relevant checkbox. Validation runs on blur/change, while typing after a field has been visited, and for every field on submit. Errors use descriptive text, `aria-invalid`, linked descriptions, a focused error summary, and a polite announcement region. Clear resets entries, errors, counters, consent, and selections. Success is explicitly simulated: no network submission, database, cookies, or browser storage. JavaScript-disabled submission is blocked with an explanatory notice.

## Checks

Run from the repository root:

```sh
npm --prefix uis/website test
npx --prefix uis/website playwright install chromium
npm --prefix uis/website run build
npm --prefix uis/website run test:browser
```

For an existing system Chromium, set `CHROMIUM_PATH=/path/to/chromium`. Browser tests use the production build on port 4173 and capture screenshots in ignored `test-results/` folders. They cover mobile (375px), tablet (768px), desktop (1440px), local assets, runtime errors, WCAG 2.2 AA automated axe checks, keyboard navigation, invalid inputs, live correction, reset, successful simulation, service preselection, local links, and Organization JSON-LD.

Automated accessibility checks do not certify full compliance. Before public release, also review screen-reader behavior, zoom/reflow, and keyboard operation manually. Run Lighthouse against the production preview or public Codespaces URL; target performance 80 or better. If PageSpeed Insights cannot access Codespaces, use local Lighthouse and retain its report.

For milestone submission, include the Public Codespaces URL and a Lighthouse or PageSpeed screenshot with performance at least 80 in the PR description. Identify the main files under `uis/website/`, note the form assumptions above, and include test results. Confirm `CONTEXT.md` is unchanged and push the implementation to your own repository before submitting its URL.

### Latest Verification

On 2026-10-04, the production build passed 4 validation tests and 14 browser tests. The latter cover all three pages at 375px, 768px, and 1440px, automated accessibility checks, and native invalid-date state handling.

A local mobile Lighthouse audit of `http://127.0.0.1:4173/` scored Performance **86**, Accessibility **100**, Best Practices **100**, and SEO **100**. These are measured results for that run, not guaranteed future scores. See the [score screenshot](../../docs/trackflow-lighthouse-mobile.png); HTML and JSON reports are generated locally in the ignored `test-results/` directory. The Codespaces forwarded URL still required authentication during verification; change port visibility to Public before external evaluation.

## Publication Checklist

- Confirm the inquiry fields and limits with TrackFlow before connecting a backend.
- Provide verified business contact information and the real production privacy notice before collecting personal data.
- Add the real deployment URL as canonical/`og:url`, Organization `url`/`logo`, absolute social image URL, and a sitemap. No fictional domain is included in this preview.
- Keep server-side validation when adding submission; client validation is not a security boundary.
- Configure hosting HTTPS and appropriate response security headers.
- Forward the preview port as Public for external evaluation and record Lighthouse results.

## Photography

Locally served illustrative stock photography, not representations of TrackFlow's actual facilities:

- Warehouse: [Unsplash photo 1586528116311-ad8dd3c8310d](https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d), [Unsplash license](https://unsplash.com/license). Resized to 1600px WebP.
- Warehouse team: [Pexels photo 4481259](https://www.pexels.com/photo/4481259/), [Pexels license](https://www.pexels.com/license). Resized to 1000px JPEG.

City panels communicate the documented warehouse locations without implying unverified facility photographs. The conflicting executive names in the brief are intentionally not repeated on the public website.