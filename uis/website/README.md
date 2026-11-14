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

## Syllabus Lead Form

The landing page and information request follow [`milestones-1-context.md`](../../milestones-1-context.md). The form is for e-commerce companies looking to outsource logistics, not consumers tracking parcels or returning an individual order.

| Field name | Type | Required | Contract |
| --- | --- | --- | --- |
| `companyName` | text | Yes | At least 2 characters |
| `contactPerson` | text | Yes | At least two words (first and last name) |
| `corporateEmail` | email | Yes | Valid email with a domain |
| `phone` | tel | Yes | `+` country code followed by a phone number |
| `website` | url | No | If provided, valid `http://` or `https://` URL |
| `country` | select | Yes | United States, Spain, Both, or Other |
| `productType` | select | Yes | Fashion, Electronics, Cosmetics, Food, or Other |
| `monthlyVolume` | select | Yes | 0-100, 101-500, 501-2000, 2000+, or Not sure |
| `services` | checkboxes | Yes | One or more: Warehousing, Last mile, Reverse logistics |
| `current3pl` | radio | Yes | Yes, No, or Evaluating options |
| `comments` | textarea | No | Maximum 500 characters with visible counter |
| `privacyPolicy` | checkbox | Yes | Must be accepted to submit |

Field-level error copy, values, and constraints are in `validation.js` and its unit tests. Validation runs on blur/change, then during input for fields already visited, and on every submit. Errors appear inline and in a focused summary. For a valid lead with `monthlyVolume` set to `0-100`, the exact syllabus warning appears and the user must explicitly confirm before simulated submission. The success message matches the syllabus and links to `comercial@trackflow.com`. No details are transmitted or stored.

## TypeScript Data Utilities

The warehouse and carrier utilities follow [the TrackFlow briefing](../../BRIEFINGcontext.md). They are independent of the public website's inquiry form: no page changes, backend, persistence, browser globals, or Node-only APIs are required. Import the source through Vite in browser code or use `tsx` during development. TypeScript targets ES2022 and does not migrate the existing JavaScript pages.

Run from the repository root:

```sh
npm --prefix uis/website run typecheck
npm --prefix uis/website run demo
```

The demo validates the briefing's sample literal objects before processing them, prints reports and edge-case examples, and includes an inventory movement. Its comparison matrix contains one row per carrier in `carrierNames` order; each row is `[score, costUSD]`. Expected results include inventory value **16975**, average shipment distance **320**, and UPS selected at **30.89** with score **76.4**. This is a demonstration, not an automated utility test suite.

### Modules

| Source | Responsibility |
| --- | --- |
| [src/types/models.ts](src/types/models.ts) | Product, Shipment, Carrier, InventoryMovement, supporting interfaces, literal unions, and result types |
| [src/utils/collections.ts](src/utils/collections.ts) | Warehouse/category/low-stock filters and stock/reliability sorting |
| [src/utils/search.ts](src/utils/search.ts) | Linear SKU/ID searches and ascending-weight binary search |
| [src/utils/transformations.ts](src/utils/transformations.ts) | Shipping costs, carrier scoring/selection, category counts, inventory value, average distance, status groups, carrier usage, and lightest/heaviest products |
| [src/utils/validations.ts](src/utils/validations.ts) | Product, shipment, and carrier business validation |
| [src/index.ts](src/index.ts) | Public named exports for all types and utilities |
| [src/demo.ts](src/demo.ts) | Executable typed examples with the briefing's sample data |

For example, from a TypeScript module at the website root:

```ts
import { calculateTotalInventoryValue, validateProduct } from './src/index.js';
import type { Product } from './src/index.js';

export function validatedInventoryValue(products: Product[]): number {
	const errors = products.flatMap((product) => validateProduct(product).errors);

	if (errors.length > 0) {
		throw new Error(errors.join('\n'));
	}

	return calculateTotalInventoryValue(products);
}
```

### Contracts And Boundaries

- Processing functions expect valid, typed entities and arrays; validate external data before calling them. Validators return `{ valid, errors }`, collect field errors, and defensively reject malformed runtime records. Their typed signatures and boolean results are not parsers or TypeScript type guards for arbitrary JSON. Convert serialized dates to valid `Date` instances first.
- Required fields, enum values, finite numbers, booleans, nested objects, and valid dates are checked alongside the briefing's numeric bounds. No integer-only quantities, future-date bans, or extra status/stock consistency rules are imposed.
- Filtering and sorting return new arrays without modifying input objects. Groups contain the original shipment objects in fresh arrays; results are not deep copies.
- SKU lookup is case-insensitive; shipment IDs are exact matches. Both use linear search and return the first match or `null`.
- Binary search requires products already sorted by ascending `weightKg`. It uses exact numeric equality, returns any matching index for duplicates, and returns `-1` for absence or a non-finite target. It neither sorts nor verifies sortedness, preserving logarithmic search complexity.
- Empty arrays produce `[]` for collection operations and rankings, `0` for sums/averages, and `null` for product extrema or carrier selection. Category counts and status groups always contain every defined key, even when empty.
- Shipping calculations apply the priority multiplier to base, total shipment weight, and distance costs. Monetary results, averages, and scores are rounded to two decimals only at the end; returned numbers do not retain trailing zero formatting.
- Carrier suitability follows the briefing's score threshold of **50**, then lowest rounded shipping cost. Equal costs keep the first input carrier. Unsupported countries, priorities, weight, and fragility reduce scores but do not independently exclude carriers. Thus UPS wins the sample despite not operating in Spain; this is not a guarantee of operational eligibility.
- Carrier usage ignores only `null` carrier assignments, counts across all statuses, and sorts by descending count, then lexicographic carrier name. Non-finite or non-positive `topN` yields `[]`; fractional limits are truncated. Product weight extrema keep the first input product on ties.

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

For milestone submission, include the Public Codespaces URL and a Lighthouse or PageSpeed screenshot with performance at least 80 in the PR description. Identify the main files under `uis/website/` and include test results. Keep both `CONTEXT.md` and `milestones-1-context.md` unchanged, and push the implementation to your own repository before submitting its URL.

### Latest Verification

On 2026-10-05, the syllabus-aligned production build passed 5 validation tests and 14 browser tests. Browser checks cover all three pages at 375px, 768px, and 1440px, automated accessibility, exact syllabus validation copy, the low-volume warning and confirmation, and the Organization schema.

A local mobile Lighthouse audit of `http://127.0.0.1:4173/` scored Performance **88**, Accessibility **100**, Best Practices **100**, and SEO **100**. These are measured results for that run, not guaranteed future scores. See the [score screenshot](../../docs/trackflow-lighthouse-mobile.png); HTML and JSON reports are generated locally in the ignored `test-results/` directory. The Codespaces forwarded URL still required authentication during verification; change port visibility to Public before external evaluation.

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