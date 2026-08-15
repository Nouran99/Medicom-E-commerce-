# Medicom Egypt

> A bilingual healthcare e-commerce portfolio project for the Egyptian market, built to demonstrate an accessible product experience, secure API foundations, and a deployable Supabase-backed architecture.

![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=nodedotjs&logoColor=white) ![Hono](https://img.shields.io/badge/Hono-4.x-E36002?logo=hono&logoColor=white) ![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&logoColor=white) ![Railway](https://img.shields.io/badge/Railway-ready-0B0D0E?logo=railway&logoColor=white)

## Overview

**Medicom Egypt** is a full-stack concept for browsing healthcare products, managing a cart, handling prescription-sensitive products, and operating an Arabic/English storefront. It is intentionally presented as a **portfolio case study**, not as an operational pharmacy or payment service. The goal is to communicate product thinking, web engineering, data modeling, and deployment readiness with transparency about what is demonstrable today.

The repository contains a built-in **demo mode** that loads a curated bilingual catalog and browser-local cart. Reviewers can explore the main experience without credentials, a live database, or a mock account. When a Supabase project is ready, the application can use live data through environment configuration.

| Area | What it demonstrates |
| --- | --- |
| **Customer experience** | Bilingual Arabic RTL and English storefronts, category browsing, search, product cards, and a demo cart. |
| **Backend design** | Hono routes, validated imports, access middleware, OTP-oriented authentication, and a health endpoint. |
| **Data design** | Supabase/PostgreSQL migrations for products, orders, inventory, prescriptions, suppliers, and notifications. |
| **Operations** | Environment-driven configuration, Railway service configuration, strict TypeScript validation, and API tests. |

## Portfolio Highlights

> **Demo mode is intentionally transparent.** It uses curated local data and browser-local cart state. It does not claim that a real payment, prescription review, or authentication operation occurred.

| Highlight | Implementation |
| --- | --- |
| **No-setup demonstration** | `DEMO_MODE=true` serves six curated products and bilingual categories without a database connection. |
| **Railway-compatible runtime** | A Node server listens on Railway’s injected `PORT`, serves Hono routes and public assets, and exposes `/api/health`. |
| **Live-data pathway** | Setting `DEMO_MODE=false` with Supabase credentials activates the persistent product and operational APIs. |
| **Security-oriented foundations** | OTPs use cryptographic randomness, CORS is explicitly allowlisted, and spreadsheet imports validate rows before upsert. |
| **Quality baseline** | `npm run build` performs strict TypeScript validation, and the demo API is covered by unit tests. |

## Architecture

```text
Browser
  ├── Bilingual storefront and operational views
  └── Hono API client
          │
          ▼
Hono on Node.js
  ├── Customer, admin, product, inventory, import, order, and auth routes
  ├── Curated demo catalog fallback
  └── /api/health deployment check
          │
          ├── Demo mode: in-memory catalog + browser-local cart
          └── Live mode: Supabase PostgreSQL and configured integrations

Railway
  └── npm ci → npm run build → npm start
```

## Quick Start

The project requires **Node.js 20 or later**.

```bash
npm install
cp .env.example .env
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The environment template enables demo mode by default, so you can inspect the main catalog without credentials.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Node/Hono server with file watching. |
| `npm run typecheck` | Run strict TypeScript validation. |
| `npm test` | Run unit tests for the demo product API. |
| `npm run check` | Run type checks and tests together. |
| `npm run build` | Run Railway build-time validation. |
| `npm start` | Start the production server. |

## Environment Configuration

Copy `.env.example` to `.env` and keep actual secrets out of version control.

| Variable | Demo mode | Live mode | Purpose |
| --- | --- | --- | --- |
| `DEMO_MODE` | `true` | `false` | Selects the curated portfolio demo or the Supabase data path. |
| `SUPABASE_URL` | Optional | Required | Supabase project URL. |
| `SUPABASE_ANON_KEY` | Optional | Required | Public Supabase client key. |
| `SUPABASE_SERVICE_KEY` | Optional | Required | Server-only service-role key; never expose it in browser code. |
| `JWT_SECRET` | Optional | Required | High-entropy secret used for customer sessions. |
| `ALLOWED_ORIGINS` | Recommended | Required | Comma-separated origins permitted to call the API cross-origin. |
| `TWILIO_*`, `FAWRY_*` | Optional | Integration-dependent | Credentials for messaging and payment workflows. |

## Connect Supabase

Create a Supabase project, then apply the SQL files under `migrations/` in sequence. Populate `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_KEY` locally and in Railway. Switch `DEMO_MODE` to `false` only after migrations and initial data are available.

Supabase’s PostgreSQL platform and access APIs are the persistent data layer for live mode. Store its service-role key only in server-side environment variables and follow the official API-key guidance.[1]

## Deploy to Railway

`railway.json` defines the build command, server startup command, health path, and retry policy.

1. Create a Railway project from this GitHub repository.
2. Add the required values from `.env.example` in Railway **Variables**.
3. For a public portfolio link, retain `DEMO_MODE=true`; for live data, configure Supabase first and set it to `false`.
4. Set `ALLOWED_ORIGINS` to your Railway domain and any selected custom domain.
5. Deploy and request `https://<your-domain>/api/health`. A healthy instance returns the service name, release version, timestamp, environment, and active mode.

Railway provides an application port at runtime. The server consumes `PORT`, so it must not be hard-coded. Railway’s configuration-as-code reference describes the configuration format used by this repository.[2]

## Project Structure

```text
src/
├── server.ts                 # Railway/Node HTTP entry point and environment bindings
├── index.tsx                 # Hono application, route mounting, storefront shell
├── lib/
│   ├── demo-catalog.ts       # Credential-free catalog for portfolio review
│   └── supabase.ts           # Supabase client construction and runtime bindings
├── middleware/
│   └── auth.ts               # JWT and role-based access control
├── routes/                   # Customer, admin, inventory, import, payment, and API routes
├── services/
│   └── auth.service.ts       # OTP and session logic
└── utils/
    └── excel-import.ts       # Excel parsing and validation utilities

public/static/js/app.js       # Localization, safe dynamic rendering, and demo-cart interactions
migrations/                   # Supabase PostgreSQL schema and seed evolution
railway.json                  # Railway build/start/health-check configuration
.env.example                  # Safe configuration template
tests/                        # Demo API tests
```

## Design Notes

The project distinguishes clearly between a **reviewable demo** and **live operations**. This avoids presenting simulated commercial activity as real. It also keeps database credentials outside the client bundle, only enables cross-origin API calls for configured origins, and validates bulk-import fields before attempting a database mutation.

| Decision | Reasoning |
| --- | --- |
| **Separate demo and live modes** | A hiring reviewer can run the project instantly, while access to real data remains explicit and controlled. |
| **Server-only service key** | Administrative Supabase credentials must not enter client JavaScript. |
| **Cryptographic OTP generation** | Authentication codes require a security-appropriate random source. |
| **Validated imports** | Product rows receive schema checks, producing actionable row-level errors before upsert. |

## Scope and Next Steps

The repository presents a strong product and engineering portfolio piece. Before any real medical-commerce operation, complete the compliance, security, and operational work that is intentionally outside the demo: pharmaceutical and legal review, payment-provider certification, verified Row Level Security policies, durable distributed rate limiting, full notification delivery, end-to-end tests, real inventory reconciliation, and monitoring.

## License

A license is not yet included. Add one before making the repository broadly reusable.

## References

[1]: https://supabase.com/docs/guides/api/api-keys "Supabase API Keys"
[2]: https://docs.railway.com/reference/config-as-code "Railway Configuration as Code"
