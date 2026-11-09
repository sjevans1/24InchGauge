# 24 Inch Gauge

A working pilot for lodge administration: membership, connected meeting workflows, branded documents, financial records and movable-property tracking. Kingston Lodge No. 1933 is the founding use case. Each lodge has its own workspace and access permissions, with English, Scottish and Irish constitution settings.

## Current release

**Pilot implementation, 9 November 2026.** The application is implemented and tested; the broader commercial roadmap remains in progress. See [Pilot status and acceptance](docs/PILOT_STATUS.md) for precise coverage and limitations, and the [Master Development Blueprint](docs/MASTER_DEVELOPMENT_BLUEPRINT.md) for the full intended product.

The pilot includes:

- Sign-in through the hosting platform; separate lodge workspaces, switching, email-bound invitations, role expiry/revocation and server-side authorization.
- Secretary, Master, Treasurer and member views. Members see their own financial and personal records, assigned tasks, the lodge directory and issued documents.
- Membership register, CSV import with preview and atomic duplicate checks, CSV export and degree history.
- Meeting agendas and scheduled ceremonies. Confirming actual performance updates degree history, draft minutes and mentoring follow-up together. Scheduling alone never advances a brother.
- Lodge logo upload, colour, greeting, footer, traditional/compact layouts and section order. No existing summons template is needed.
- Draft PDF generation and immutable issued summons/approved-minutes PDFs. Subsequent branding or meeting edits do not rewrite issued files.
- Balanced financial journal for assessments, receipts and expenses, named funds, dues balances and reversing entries. No member payment collection.
- Movable-property photographs, condition, value, location, custody history and task management.
- Private source-file archive for PDF, DOCX and XLSX; activity history and record exports.

All initial pilot workspaces are complimentary. Paid subscriptions, module entitlements and email/WhatsApp delivery are **not activated**. The application does not send messages or collect funds.

## Run locally

Use Node.js 24 (the tests use `node:sqlite`) and pnpm 11.25.0. Install with the repository's pinned package manager:

```bash
pnpm install --frozen-lockfile
pnpm run typecheck
pnpm test
pnpm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_next_talisman.sql
pnpm run dev
```

The managed development environment uses its own preview launcher. A clean portable checkout uses the starter's loopback-only simulated identity for local development; that simulation is excluded from the hosted Worker. Anonymous local viewing is a clearly marked read-only tour. Sign in locally using the on-screen link, then create either an empty lodge or an explicitly fictional sample workspace. Local storage is separate from hosted data.

The hosted pilot uses the Sites platform's trusted sign-in headers. **Do not expose the raw Worker directly to the Internet with client-supplied identity headers.** Moving to independent hosting requires a verified authentication gateway or an authentication adapter first.

## Architecture

React and TypeScript on Vinext, deployed as a Cloudflare Worker. D1 stores lodge configuration, access, typed entity records and audit metadata; R2 stores private uploads and generated PDFs. Server mutations are validated with Zod. D1 batch transactions enforce revision and authorization guards so concurrent or stale updates roll back together.

- `app/`: responsive officer/member interface and API route adapters.
- `lib/domain.ts`: validated business actions and role restrictions.
- `lib/api.ts`: identity, tenant checks, invitations, files and PDF issuance.
- `lib/store.ts`: tenant-scoped SQL and transactional revision guards.
- `lib/model.ts`: data types and role-specific response projections.
- `lib/pdf.ts`: paginated PDFs with embedded fonts; font notices in `assets/fonts/`.
- `db/schema.ts`, `drizzle/`: schema-only migrations.
- `tests/workflows.test.ts`: 22 workflow and access tests using real SQLite and an in-memory R2 adapter.

No AI service, messaging provider or payment API is required for the implemented workflows. The current aggregate-per-lodge read model is suitable for pilot evaluation; performance at 20,000 active users has not been demonstrated.

## Source and operational data

This repository contains source, generic templates, synthetic fixtures and documentation. Private member lists, credentials, lodge documents and real financial records belong in application storage and must never be committed. The built-in sample names and transactions are fictional.

The working product name is **24 Inch Gauge**. Commercial ownership, licensing terms, prices and merchant-provider selection remain to be settled. Third-party notices remain with their components; the blueprint does not claim endorsement by any governing body. Public research sources and their limits are recorded in the [Public Template Source Register](docs/PUBLIC_TEMPLATE_SOURCE_REGISTER.md).
