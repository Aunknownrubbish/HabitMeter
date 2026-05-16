# HabitMeter / 寻栖

HabitMeter is a living-location decision tool for comparing rental or residential candidates. It turns an address into a practical judgment: commute pressure, nearby facilities, accessibility, strengths, weaknesses, and multi-candidate comparison.

## Product Positioning

Most rental decisions are made with scattered information: map searches, commute checks, notes, screenshots, and personal memory. HabitMeter brings those signals into one workflow so a user can answer a simpler question:

> Is this place actually suitable for my daily life?

The product currently focuses on three jobs:

- Analyze one candidate address with a 3km living circle.
- Estimate commute pressure between a home address and a work/school address.
- Save and compare multiple candidates with different preference modes.

## Core Features

- Address A/B workflow: candidate home address plus optional commute destination.
- AMap-based map display and address search.
- 3km POI analysis for convenience stores, metro stations, bus stops, hospitals, and parks.
- Commute analysis for driving, transit, walking, and riding.
- Living score model with total score, level, dimension breakdown, strengths, and weaknesses.
- Commute recommendation banner with warnings.
- Local candidate list stored in the current browser.
- Multi-candidate comparison with overall winner, dimension winners, and preference-weighted ranking.
- Copyable comparison report for sharing or decision notes.

## Product Documentation

- [Product case study](docs/product-case-study.md): problem framing, user scenario, product decisions, and roadmap.
- [Demo script](docs/demo-script.md): 3-minute and 5-minute walkthroughs for presenting the product.
- [Version story](docs/version-story.md): how the project evolved from MVP to P0/P1/P2 and Showcase.
- [P1 product summary](docs/P1-product-enhancement-summary.md): living score, conclusion card, POI summary, and commute recommendation.
- [P2 comparison summary](docs/P2-candidate-comparison-summary.md): candidate list, comparison, preference modes, and report copy.

## Showcase Highlights

- Turns scattered map, POI, and commute data into a structured living decision.
- Separates raw score from preference-weighted ranking, so different user priorities can be represented without rewriting the base model.
- Uses localStorage for lightweight candidate comparison, keeping the core comparison workflow usable without login.
- Documents the product evolution clearly: MVP → stability → judgment → comparison → public showcase.

## Screenshots

Screenshots are planned for the Showcase polish stage.

Recommended screenshot set:

- Initial search state.
- Living conclusion card.
- Commute recommendation.
- POI accessibility panel.
- Candidate list.
- Multi-candidate comparison table.
- Preference mode switching.
- Copyable comparison report.

## Tech Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- AMap JavaScript API and Web Service APIs
- NextAuth credentials login
- Prisma with SQLite for local development
- localStorage for candidate comparison data

## Version Story

- `v1.0.0`: runnable MVP with map, search, POI, commute, auth, and saved locations.
- `v1.0.1`: P0 stability and security pass, including type fixes, server-side AMap route proxy, env validation, and error states.
- `v1.1.0`: P1 product upgrade with living score, conclusion card, POI accessibility summary, commute recommendation, and clearer information architecture.
- `v1.2.0`: P2 comparison upgrade with local candidate list, multi-candidate comparison, preference modes, and copyable report.
- Showcase phase: public repository preparation, product case study, demo script, and deployment readiness.

## Local Development

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

Fill in the required values:

```bash
NEXT_PUBLIC_AMAP_KEY=...
NEXT_PUBLIC_AMAP_SECRET=...
AMAP_WEB_KEY=...
AUTH_SECRET=...
DATABASE_URL="file:./dev.db"
```

Prepare the local database if needed:

```bash
npx prisma generate
npx prisma db push
```

Run the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

## Environment Variables

| Variable | Used by | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_AMAP_KEY` | Browser map SDK | Public by design, required for map loading. |
| `NEXT_PUBLIC_AMAP_SECRET` | Browser map SDK security config | Public by design, required by AMap JS security configuration. |
| `AMAP_WEB_KEY` | Server route proxy APIs | Must stay server-side. Do not expose with `NEXT_PUBLIC_`. |
| `AUTH_SECRET` | NextAuth | Required for authentication sessions. |
| `DATABASE_URL` | Prisma | Local default can be `file:./dev.db`. |

## Data Storage Notes

- Saved locations use the Prisma database and login flow.
- Candidate comparison data is intentionally stored in the current browser through localStorage.
- The current candidate system is designed for lightweight demo and personal decision workflows, not account-level cloud sync.

## Public Release Notes

Do not commit real `.env` files, local SQLite databases, `.next`, `node_modules`, or local AI/IDE configuration. Use `.env.example` as the public reference for required configuration.

## Current Limitations

- Candidate comparison data is stored only in the current browser.
- SQLite is suitable for local development but should be replaced before production multi-instance deployment.
- Route results are displayed as text but are not yet drawn as map polylines.
- The scoring model is a first version and has not been calibrated with large-scale user feedback.

## Roadmap

- Showcase-3: deployment guide and Vercel readiness.
- Showcase-4: demo polish and final showcase verification.
- P3: account-level candidate sync, production database migration, and route visualization.
