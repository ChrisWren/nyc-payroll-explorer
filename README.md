# NYC Payroll Explorer

Interactive explorer for the New York City government payroll dataset. The app is written with the Next.js App Router and includes a streaming API endpoint for OpenAI-powered job summaries.

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

## Optional Environment Variables

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_BASE_PATH` | Prefix for assets when hosting under a sub-path. Leave unset when hosting at the domain root. |
| `NEXT_PUBLIC_PAYROLL_API_BASE` | Override the Socrata endpoint for payroll data. Defaults to `https://data.cityofnewyork.us/resource/k397-673e.json`. |
| `NEXT_PUBLIC_JOB_SUMMARY_ENDPOINT` | Override the default `/api/job-summary` endpoint. Set to an empty string to disable summaries. |
| `OPENAI_API_KEY` | Required to enable the built-in `/api/job-summary` proxy. Retrieved from the OpenAI dashboard. |
| `OPENAI_MODEL` | Optional override for the OpenAI model (defaults to `gpt-4o-mini`). |
| `OPENAI_MAX_TOKENS` | Optional override for the maximum tokens returned by the OpenAI API (defaults to `400`). |

## Linting

```bash
npm run lint
```

## Notes

- The `/api/job-summary` route streams responses from OpenAI. Provide `OPENAI_API_KEY` (and optionally `OPENAI_MODEL`) to activate it.
- Set `NEXT_PUBLIC_JOB_SUMMARY_ENDPOINT=""` if you want to disable the summary request entirely.
