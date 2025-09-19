# NYC Payroll Explorer

Interactive explorer for the New York City government payroll dataset. The app is written with the Next.js App Router, but it can be exported to a fully static bundle so it can be hosted on GitHub Pages.

## Prerequisites

Install dependencies once:

```bash
npm install
```

## Local Development

```bash
npm run dev
```

The development server runs at http://localhost:3000 and hot-reloads as you edit files in `src`.

## Static Export

The project is configured with `output: "export"`, so a production build is completely static:

```bash
npm run export
```

The static bundle is created in the `out/` directory.

### Exporting Directly To The Repository Root

To publish on GitHub Pages (or any static host that expects `index.html` and accompanying assets at the repository root), run:

```bash
npm run export:root
```

This command runs a production build, automatically selects the correct base path for GitHub Pages (or honours `NEXT_PUBLIC_BASE_PATH` when you set it), and copies the contents of `out/` into the project root. The previous `index.html`, `_next/`, `404.html`, `robots.txt`, and `sitemap.xml` are replaced. Commit the generated files (alongside the `_next/` directory) to the branch that GitHub Pages serves from.

### Serving From A Sub-Path

When the repository is deployed from a project page (for example `https://username.github.io/nyc-payroll-explorer/`), the build and export scripts now infer the base path automatically. If you need to override it, export `NEXT_PUBLIC_BASE_PATH` before running the build:

```bash
export NEXT_PUBLIC_BASE_PATH="/custom-base"
npm run export:root
```

Leave the variable unset for user/organisation pages such as `https://username.github.io/`.

## GitHub Pages Deployment

The repository includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that publishes the static bundle to GitHub Pages whenever `main` is updated or the workflow is triggered manually.

1. In the repository settings, open **Pages** and set the source to **GitHub Actions**.
2. Push to `main` (or trigger the workflow manually under **Actions → Deploy static site to GitHub Pages**).
3. The workflow builds `out/` using `npm run export`, infers the correct base path from the repository name, and deploys the result to the `gh-pages` environment.

If you maintain a fork or want to deploy from a different branch, adjust the workflow triggers accordingly.

## Optional Environment Variables

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_BASE_PATH` | Prefix for assets when hosting under a sub-path (see above). Leave unset when hosting at the domain root. |
| `NEXT_PUBLIC_PAYROLL_API_BASE` | Override the Socrata endpoint for payroll data. Defaults to `https://data.cityofnewyork.us/resource/k397-673e.json`. |
| `NEXT_PUBLIC_JOB_SUMMARY_ENDPOINT` | Optional endpoint that returns `{ summary: string }` for a job title. When omitted the modal shows "Summary unavailable" and no network call is made. |

## Linting

```bash
npm run lint
```

## Notes

- API routes have been removed so the app works as a pure static bundle. All data is fetched directly from the NYC Socrata API at runtime.
- Job summaries are disabled by default in static mode. Provide a custom `NEXT_PUBLIC_JOB_SUMMARY_ENDPOINT` if you have a service that can return summaries.
