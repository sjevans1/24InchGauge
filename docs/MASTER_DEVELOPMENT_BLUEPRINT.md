# 24 Inch Gauge — Master Development Blueprint

Version: 0.1  
Prepared: 7 November 2026, Jamaica  
Repository: https://github.com/sjevans1/24InchGauge  
Status: implementation specification; no application has yet been built or deployed.

## 1. Purpose and product outcome

Create a web application that reduces repeated administrative work for lodge officers, gives members appropriate access to their own lodge information, maintains dependable financial records and tracks movable lodge property. Offer the service to other lodges through subscriptions and module entitlements.

The governing design principle is **one authoritative record, with connected workflows**. A ceremony, payment record, membership change or property handover should supply the relevant documents and follow-up tasks. Automation prepares work; authorised officers confirm facts and approve records where required.

Kingston Lodge No. 1933 will be the first pilot. The initial workflow emphasis is English Constitution, while the data model and template system must accommodate Scottish and Irish Constitution lodges. The initial geographic planning area is Jamaica and the Cayman Islands.

The eventual planning envelope is up to approximately 20,000 active users across the service, not 20,000 concurrent sessions. The time window meant by “active” has not been fixed; monthly active users are used only for illustrative cost calculations.

## 2. Confirmed requirements and proposed defaults

The first column below records the user's direction. Implementation choices in the second column are proposed defaults, not claims that every detail has already been approved or implemented.

| Area | Confirmed direction | Proposed implementation default |
| --- | --- | --- |
| Constitutions | Focus on English; provide for all three active constitutions | Versioned constitution profiles and lodge-level settings; validate each profile against supplied forms and procedures before claiming support |
| Users | Every member may log in; officers are the primary users | One account with separately authorised lodge memberships and a lodge switcher |
| Administration | All discussed functions and further related work; reduce duplicate forms | Linked member, meeting, ceremony, document, task and notification records |
| Finances | Comprehensive tracking is desirable; current Treasurer's tools are unknown | Simple officer interface over a balanced ledger, phased financial features and reconciled opening balances |
| Payments | No member payment processing; only the subscribing lodge pays for the software | Lodge dues are recorded from external payments; a separate service-billing module handles subscriptions |
| Complimentary access | No fees initially for the founder and Kingston Lodge No. 1933 | Audited complimentary grant with no payment method required; no automatic conversion into a charge |
| Property | Movable items only | Inventory, photographs, condition, valuation, location and custody history |
| Access | Members see relevant information; Secretary can see all | Lodge-scoped roles plus record-level rules; Secretary has access to all lodge data |
| Existing data | Excel, Word and PDF; four to five years initially | Staged imports, duplicate review, source provenance and reconciliation before publishing records |
| Delivery | Web application | Responsive interface for desktop and mobile, optionally installable on a home screen |
| Communication | In-app, email and/or WhatsApp | In-app first; email when configured; optional WhatsApp integration with separate usage controls |
| Commercial structure | A lodge subscribes and accesses modules to manage membership | One lodge workspace per subscription; member permissions remain separate from module entitlements |
| Cost and scale | Least practical cost, affordable growth; approximately 20,000 active users | Serverless application with monitored database, file and messaging usage; load tests before scale claims |
| Brand and ownership | Repository selected as 24InchGauge | Use “24 Inch Gauge” as working name; commercial entity and licence remain undecided |

Previously discussed Kingston requirements should be configurable defaults: February–January lodge year, August and September recess, attendance recognised when a brother serves in office even if omitted from the separate attendance list, and reporting on ritual work and Past Master engagement. The financial year is a separate setting and must not be assumed to match the lodge year.

## 3. User experience and module boundaries

### 3.1 Member home

A member sees the lodge or lodges to which he has access, relevant upcoming meetings, published summons and minutes, his own dues and recorded payments, invitations/RSVPs, assigned tasks and appropriate notices. Directory visibility is configurable. Other members' arrears, private welfare records and officer-only documents are not part of a general member view.

Provide a simple navigation, clear status labels, readable typography, accessible contrast and large mobile touch targets. Switching lodge must change the visible records, permissions and branding together. Always show the active lodge.

### 3.2 Officer workspace

Officers see actions requiring attention: incomplete meeting preparation, pending approvals, unconfirmed attendance, draft minutes, unpaid dues, reconciliation exceptions, overdue mentoring tasks and property returns. Show a preview of the records and documents affected before confirming a consequential action.

| Module | Intended scope |
| --- | --- |
| Membership | Member records, contacts, status, joining/affiliation history, degree history, office and rank history, invitations, emergency contacts |
| Candidates and progression | Enquiry/application tracking, configurable prerequisites, ceremony scheduling, performed-event confirmation, mentor assignment and follow-up |
| Meetings | Calendar, agenda, summons, RSVPs, attendance, visitors, office service, ritual assignments, dining counts and minutes |
| Documents and forms | Versioned templates, field mapping, draft generation, approvals, issued snapshots, document archive and controlled amendments |
| Tasks and mentoring | Assigned actions, due dates, reminders, mentee-module requests and completion evidence |
| Finance | Dues, receipts, arrears, cashbook, fund accounting, budgets, expenses, approvals, bank reconciliation and period/year reports |
| Property | Movable inventory, photographs, condition, value, custody, loans, returns, stocktakes and disposal approvals |
| Engagement | Attendance, work performed by degree/piece, offices, mentoring, committee/charity involvement and Past Master reporting |
| Welfare | Restricted case records, contacts, visits, follow-up and widow/dependant support where the lodge uses these records |
| Communications | In-app notices, email, optional WhatsApp, recipient selection, delivery status and preferences |
| Reports and returns | Operational dashboards, exportable financial and engagement reports, configurable District/Grand Lodge return templates |
| Subscription administration | Lodge plans, entitlements, complimentary grants, invoices, subscription status, renewal and export access |

Full scope is delivered in phases. A visible module must accurately disclose whether it is available, awaiting configuration or planned; unfinished buttons must not imply successful work.

## 4. The connected EA-to-FC workflow

The application must distinguish the planned event, the fact that the ceremony occurred, the approved written record and any externally submitted form.

| Stage | Officer action | Connected behaviour |
| --- | --- | --- |
| Plan | Secretary schedules a passing at a meeting and selects the brother | Check current degree and configured prerequisites; prepare agenda item, draft summons wording, ritual assignments and applicable request/checklist drafts |
| Review | Authorised officer reviews the meeting documents | Display the source fields, constitution/template versions and any missing required data; require deliberate approval to issue |
| Issue | Summons is issued | Save the exact rendered version and recipient snapshot; later changes cannot silently rewrite this version |
| Defer or cancel | Secretary records a change before performance | Keep the brother's degree as EA; update draft work, cancel obsolete pending actions and prepare any required correction notice for review |
| Confirm performed | Secretary records actual performance, date, meeting and participants | Atomically add degree-history event, update current status to FC, record ritual work, create draft minutes content and create applicable mentoring/request tasks |
| Follow through | Mentor/Secretary completes the required follow-up | Pre-fill the approved mentee-module request template; track whether it is draft, approved, sent or acknowledged as applicable |
| Approve minutes | Lodge's configured approval process completes | Preserve approved minutes as a fixed version; retain links to the underlying events |
| Correct | An authorised officer records an error and reason | Preserve the original event; create an audited correction, recalculate affected projections and require review of consequential document changes |

Important details:

- Scheduling a passing never advances the member's degree.
- A draft may refresh from changed facts, but manual edits must be preserved or shown in a reviewable comparison. Do not overwrite edited paragraphs without warning.
- Issued summons and approved minutes keep their historical wording. Future documents use the appropriate effective-date information.
- Confirmation must be an explicit action by an authorised officer. Approval of minutes is a separate status; a later correction must reconcile the event and written record.
- The exact timing and contents of a mentee-module request depend on the lodge's actual form and process. Do not assume it must always be sent after the ceremony.
- Retrying a confirmation, processing a job twice or receiving duplicate requests must not create duplicate degree changes, tasks or notices.
- A record held by another lodge is not silently updated. Cross-lodge degree evidence requires an explicit, authorised verification process.
- Historical imports use an import workflow and do not send retrospective notices.

The same pattern extends to initiation, raising, affiliation, resignation, death, installation, an externally received payment and a property handover. These events have distinct permissions and must not be collapsed into one generic “status change.”

## 5. Constitution profiles and configurable forms

Use an explicit profile for constitution, jurisdiction/district, lodge terminology, offices, meeting calendar, document templates, return templates and applicable procedural checks. Save the profile/template version used for each issued document or significant event.

English is the initial validated profile. Scottish and Irish are first-class configuration targets, with test fixtures and separately validated templates before release. Do not hard-code an unverified waiting period, degree prerequisite, ballot rule, governing-body return or approval threshold. Administrators may configure approved local requirements; changes to sensitive workflow rules are audited.

Candidate, EA, FC and MM are useful initial Craft concepts. Degree, rank, office held and membership status must be separate fields/history streams. Honorary, resigned, deceased or suspended statuses must not be inferred from arrears alone.

Chapters and other Orders are future extensions unless explicitly added to the release scope. Accommodating three Craft constitutions does not by itself constitute support for every Order.

## 6. Access model and officer handover

Access is the intersection of account authentication, current lodge membership, active office/delegation, module entitlement and record permissions. Enforce it on every server request, export, file download and background job. Hiding a menu is not an access control.

| Role | Default access | Boundary |
| --- | --- | --- |
| Member | Own profile/statement, permitted directory fields, published lodge documents, relevant meetings and personal tasks | No access to others' private financial or welfare records |
| Secretary | All records within the lodge, including finance and welfare; administrative coordination and reports | Does not obtain access to other lodges, erase audit history or bypass posting/approval controls |
| Assistant Secretary | Explicitly delegated administrative functions | Time-limited/delegated access; no automatic full Secretary scope |
| Treasurer | Lodge finances, dues, receipts, budgets and relevant member details | No automatic welfare access; spending approvals follow policy |
| Worshipful Master | Oversight, configured reports and approval responsibilities | Detailed access follows an explicit lodge policy |
| Mentor | Assigned mentees, progression and mentoring actions | No general member financial/welfare access |
| Director of Ceremonies | Ceremony plans, ritual assignments, competence/work history | No financial or welfare access by default |
| Almoner | Welfare cases and relevant contacts | Confidential within authorised roles, including Secretary as requested |
| Property officer | Inventory and custody operations | No general financial access beyond asset information |
| Auditor | Time-limited read/export access to financial evidence | Cannot post or edit transactions |
| Platform operator | Subscription, service health and tenant administration metadata | No routine access to lodge content; any support access is explicit, time-limited and logged |

Except for the user-confirmed Secretary scope and member privacy principle, detailed role mappings are defaults to review during the pilot.

An individual can hold more than one role. Office assignments have effective start/end dates and history. Handover grants the successor's permissions and ends the predecessor's authority at the agreed time; it must not transfer a shared password. Revocation applies to active sessions and queued sensitive jobs.

Broad Secretary visibility is distinct from authority to approve the Secretary's own expense, change approved financial entries, or rewrite minutes. Those controls remain enforceable even for a user who can read all lodge records.

## 7. Finance: lodge records and service billing

### 7.1 Lodge finance

The app records payments received elsewhere; it does not collect a brother's dues, hold funds, request banking credentials or initiate a transfer from the lodge's bank account.

Use integer minor units for money, an explicit currency and balanced postings underneath a straightforward cashbook interface. Start the pilot with JMD. Allow a lodge to select its base currency; do not automatically combine JMD, KYD, GBP or USD totals. Foreign-currency conversion and accounting policy require a later explicit design if needed.

Scope includes:

- Annual and other dues assessments, due dates, member balances, partial payments, arrears, credit adjustments and approved waivers.
- Recorded cash, cheque and bank-transfer receipts with evidence, reference, payer, receiver and allocation to assessments.
- Separate bank/cash accounts and funds, with transfers recorded correctly rather than counted as new income.
- Budget categories, expenses, supporting receipts, approval status and recorded payment.
- Bank-statement imports, matching suggestions, unresolved exceptions and explicit reconciliation sign-off.
- Cashbook, income/expenditure, budget comparison, arrears, fund balances, trial balance and year-end report exports appropriate to the agreed accounting basis.
- Period closing; posted entries corrected through linked reversals/adjustments instead of deletion.

The Treasurer must confirm the chart of accounts, financial year, accounting basis, fund structure, approval rules and opening balances before production financial migration. This does not block development of the ledger structure and synthetic examples.

### 7.2 Software subscriptions

A subscribing lodge buys access to modules. A member does not buy an individual subscription. Each workspace has a plan, entitlements, billing contact and subscription state; no membership limit or price is assumed yet.

The founder's pilot access and Kingston Lodge begin under an explicit complimentary grant. Store the reason, authorised grantor, start date, optional review date and included modules. No card is needed. A null end date means “until reviewed,” not a promise of a lifetime contract. A grant cannot silently convert to a billable subscription or charge without the lodge taking an explicit subscription action.

For future paid lodges, use a supported hosted payment-provider checkout/portal with verified webhook signatures and idempotent events. Choose a provider only after confirming the selling entity's country, merchant eligibility, settlement currency and recurring-payment support. Do not assume any specific provider is available to the eventual business.

Trial, active, complimentary, past-due, grace, read-only and cancelled states need defined behaviour. Subscription expiry must not delete records. Permit authorised access to account status and a reasonable data-export process. Prices, grace periods, retention periods and module packages remain configurable commercial decisions.

## 8. Movable-property register

Each item records asset number, description/category, photos, acquisition/provenance, current condition, valuation type/date/currency, location, custodian and supporting documents. Historical values and custody movements are retained.

Support issue, receipt acknowledgement, expected return, return, condition change, maintenance note, annual stocktake, loss and authorised disposal. Identify outstanding items during officer handover. A custodian sees the items assigned to him, with broader access granted to relevant officers and Secretary.

Building management, leases, hall rentals and booking revenue are outside the confirmed scope. Do not expand into those features through generic “property” screens.

## 9. Imports and historical records

Start with four to five years of Excel, Word and PDF material. Preserve source files in private storage and keep provenance for each imported record: file, sheet/page where available, batch, import date, operator and validation status.

Import lifecycle: upload → classify → map/extract → validate → preview → resolve exceptions → approve → publish → reconcile.

| Source | Import treatment |
| --- | --- |
| Excel/CSV | Map columns; validate dates, amounts, lodge/member references and duplicates; preview all changes |
| Word | Archive original; map structured content or extract proposed meeting/member facts for officer review |
| Text PDF | Archive original; extract proposed information with page references; require validation |
| Scanned PDF | OCR only when required and approved for the data source; review low-confidence values |

Do not match members by name alone. Consider lodge membership number, name variants, dates and authorised matching evidence; ambiguous matches go to a review queue. Preserve diacritics and historical name changes.

Historical financial entries require a reconciled strategy: full transaction import or opening balances plus source archives. Never import both as live amounts and double-count them. Store observed facts separately from inferred data. Imported ceremony history must not trigger current invitations, mentoring requests or financial notices without deliberate selection.

## 10. Documents, notifications and reports

Documents use authoritative data plus versioned templates, with controlled narrative sections. Provide preview, missing-field validation and clear draft/issued/approved labels. Support printable PDF and editable Word where the template requires it; structured reports should also export to CSV/Excel.

Reports use historical effective dates where needed and disclose coverage gaps. Attendance deduplicates explicit presence and actual service in office; an advance appointment alone is not proof of presence. Track visitors separately. Ritual-work reports include degree, piece, performer, meeting and date. Past Master engagement reports distinguish attendance, mentoring, committees, charity and other contributions.

Notifications use a durable outbox linked to the source event. In-app notifications are the default. Email requires a configured, authenticated sender. WhatsApp is optional and must use a supported business integration if automated; a manual share action is not represented as automated delivery. Provider setup, consent/opt-in requirements and current message pricing must be checked when the provider is selected.

Before sending, recheck recipient membership, permission and preferences. Notifications outside the app should normally link to an authenticated record rather than expose arrears or welfare details. Delivery jobs support retry, failure visibility and deduplication; uncertain external delivery should not be labelled successfully delivered.

No AI model is required for routine workflow updates or document merges. Optional extraction or drafting assistance can be considered later, with officer review and separate usage budgets. It cannot become the authority for membership status, financial totals or procedural rules.

## 11. Proposed technical architecture

### 11.1 Low-cost starting design

Use one modular application with a responsive TypeScript frontend, a server-side API and durable background work. Avoid independent microservices for each module at the outset.

Proposed deployment components:

| Component | Proposed role |
| --- | --- |
| Cloudflare static assets and Workers | Frontend delivery and authenticated application API |
| Cloudflare D1 | Relational operational records, permissions, workflow events, ledger and outbox |
| Cloudflare R2 | Private source files, photographs and generated document versions |
| Scheduled worker; queue when justified | Durable outbox dispatch and controlled batch processing |
| Established authentication library/provider | Sessions, invitations, account verification/recovery and officer MFA; validated against the deployment runtime |
| Email and later optional WhatsApp provider | Outbound messages through interchangeable adapters |
| Subscription-provider adapter | Hosted checkout and verified subscription-status events once merchant selection is settled |

Authentication implementation is a prerequisite, not a reason to create custom password hashing or a homemade identity system. Evaluate the chosen maintained library/provider for D1/Worker compatibility, recovery, MFA, abuse controls and licence before pinning versions. Better Auth's documented Drizzle adapter is one candidate, not an approved or integrated dependency [S6].

### 11.2 Tenant boundaries and persistence

Start with a shared schema for the pilot, with explicit `lodge_id` on tenant records, tenant-scoped indexes and composite foreign keys. Route every tenant operation through an authenticated lodge context; never trust a browser-supplied lodge ID by itself. D1 access does not supply PostgreSQL-style row-level policies, so application enforcement and adversarial tests are mandatory.

Include a tenant-placement abstraction so a measured future need can move selected lodges to another database shard. That migration requires tooling and verification; it is not an automatic benefit of using a serverless database. Keep all records required for one atomic workflow within one database.

Core entities:

| Group | Entities |
| --- | --- |
| Identity and configuration | User, Lodge, Membership, ConstitutionProfileVersion, RoleAssignment, Invitation, Subscription, ModuleEntitlement |
| Administration | MemberProfile, MembershipStatusEvent, DegreeEvent, OfficeHistory, Meeting, AgendaItem, Ceremony, Attendance, RitualAssignment |
| Workflow and documents | WorkflowEvent, Task, MentorAssignment, FormRequest, TemplateVersion, DocumentVersion, Approval, DeliveryOutbox |
| Finance | Account, Fund, FinancialPeriod, Assessment, Receipt, Allocation, Journal, JournalLine, Expense, Budget, BankImport, Reconciliation |
| Property and welfare | Asset, AssetPhoto, Valuation, CustodyEvent, Stocktake, WelfareCase, WelfareAction |
| Evidence and operations | SourceFile, ImportBatch, ImportException, AuditEvent, Notification, SupportAccessGrant |

Use composite references to prevent a record from linking to another lodge's member, meeting, journal or asset. Global identity must not become a publicly browsable cross-lodge membership directory. Store dates of ceremony, date of entry and source separately.

### 11.3 Transactions and asynchronous work

Persist the core event, resulting state, audit event and outbox entry atomically. Cloudflare documents D1 batches as transactional with rollback on statement failure [S3]. Validate state and expected revision inside the write boundary, using constraints/guard statements so a conflict aborts the entire operation. A pre-read followed by unrelated writes is not sufficient.

Add tenant-scoped idempotency keys. Use optimistic concurrency to reject stale edits with a clear review flow. Background workers claim work, retry safely and record failures. They regenerate only permitted drafts, not issued/approved document snapshots.

Store files under private, unguessable object keys, with authorisation for upload/download and audited evidence links. Database restoration alone does not restore the exact object set; recovery must account for both records and files.

### 11.4 Operational requirements

Use HTTPS, server-side permission checks, protected cookies, CSRF/origin validation, safe input handling, login rate limits and officer MFA. Uploads need size/type validation and isolation. Do not log passwords, tokens, complete document text or unnecessary personal data.

Backups, restore testing, audit export, data retention, monitoring and access revocation are launch requirements. Define where data may be stored and obtain applicable jurisdiction-specific privacy review before live member/welfare data is used. This document does not assert legal compliance.

Keep operational data and credentials out of the public source repository. Use synthetic fixtures for demos and CI. Provider secrets must be deployed through secret management; no `.env` or service credentials belong in Git.

## 12. Cost and scaling plan

Provider facts checked on 7 November 2026; USD, excluding tax. These are infrastructure references, not subscription prices or a commitment to purchase services.

| Service | Published starting allowance or price | Implication |
| --- | --- | --- |
| Workers paid | Minimum $5/month; 10 million requests and 30 million CPU-ms included; overages $0.30/million requests and $0.02/million CPU-ms [S1] | A small shared platform base rather than a server per lodge |
| D1 paid | 25 billion rows read, 50 million rows written and 5 GB storage included; excess reads $0.001/million, writes $1/million and storage $0.75/GB-month [S2] | Indexing, query shape and storage matter more than registered member count alone |
| R2 Standard | 10 GB-month, 1 million Class A and 10 million Class B operations free monthly; additional storage $0.015/GB-month, operations charged separately [S4] | Compress photographs and retain source documents deliberately |
| Managed Postgres alternative | Supabase Pro starts at $25/month, with 100,000 MAU included; compute upgrades and other usage can add cost [S5] | A fallback if the database/authentication trade-offs justify a higher base; this is not a per-user capacity guarantee |

The Workers and D1 allowances above form part of the platform bill; do not add another $5 as a separate D1 base charge. Existing workloads in the same provider account consume shared allowances. Email, WhatsApp, domain registration, payment fees, backups, additional job infrastructure and support are not included in the examples below.

Illustrative workload arithmetic, assuming relevant allowances are otherwise unused:

| Scenario | Explicit assumption | Worker subtotal before other services |
| --- | --- | --- |
| Small pilot | At or below 10 million API requests and 30 million CPU-ms/month | $5/month |
| 20,000 monthly active users, moderate use | 10 sessions/user/month × 30 API requests/session = 6 million requests; average 5 CPU-ms/request = 30 million CPU-ms | $5/month |
| 20,000 monthly active users, heavier use | 20 sessions/user/month × 50 API requests/session = 20 million requests; average 10 CPU-ms/request = 200 million CPU-ms | $5 + $3 request overage + $3.40 CPU overage = $11.40/month |

These examples are calculations, not measured application costs. Authentication, PDF rendering, imports and background work may use materially more CPU. A roughly $5–$25/month core-infrastructure planning envelope is reasonable to investigate for a small pilot, but it is neither a spending authorisation nor a guaranteed total bill. Set an actual operating budget before buying or enabling services.

Workers can scale request handling, but an individual D1 database has finite throughput and a 10 GB paid-plan size limit. Queries run serially within each database; the bottleneck depends on query duration and workload [S7]. Assess the database before promising support for 20,000 users. Moving to managed Postgres may simplify some transaction/security needs, but its base compute is not automatically unlimited either.

Cost controls: compress/resize photos, paginate lists, use selective indexes, avoid chatty polling, batch imports, cache only non-sensitive material safely, cap uploads, provide per-lodge usage reporting and set spend alerts. Optional messaging and extraction must have quotas. Alerts are not a hard guarantee against usage charges.

Load-test a representative data set with 20,000 synthetic members, increasing concurrent sessions through 25, 100 and 250 while simulating login, dashboard, documents and meeting-day writes. These are test targets, not a forecast of simultaneous users. Measure response percentiles, errors, queue delay, query rows and write contention. Tune or shard based on evidence.

## 13. Delivery sequence and acceptance gates

| Milestone | Deliverables | Acceptance gate |
| --- | --- | --- |
| M0 — Specification | This blueprint, requirement traceability, workflow and access model, source repository | Confirmed requirements separated from defaults; implementation status honest |
| M1 — Core workspace | Authentication, lodge setup/switching, roles/offices, constitution settings, member directory, complimentary entitlements and audit history | Cross-lodge and record-level access tests; revocation works; no fees required for pilot |
| M2 — Connected administration | Meetings, attendance, ceremonies, degree history, template/document versions, tasks and mentoring form drafts | Complete EA-to-FC scenario, cancellation, retries and correction without rewriting issued records |
| M3 — Finances and property | Ledger, dues, external-payment records, expenses, accounts/funds, reconciliation, asset custody and reporting | Financial totals reconcile; posting/approvals enforced; custody history retained |
| M4 — Migration and communication | Excel/Word/PDF archive and staged imports, notification outbox, email, optional WhatsApp adapter, engagement reports and return templates | Four-to-five-year sample migration reconciles; no unintended historical messages; document/form accuracy reviewed |
| M5 — Pilot and commercial readiness | Officer/member usability, restore rehearsal, monitoring, performance, subscription provider and operational handover | Real-user pilot sign-off; payment eligibility/setup settled before paid activation; load and restore evidence retained |

Stages can overlap where dependencies allow, but later feature breadth must not substitute for proven tenant isolation, data consistency or accurate financial totals. No launch date has been committed.

The first integrated demonstration should use synthetic data to show a Secretary planning and confirming a passing; a member seeing his resulting permitted information; a mentor receiving the correct task; an issued summons remaining unchanged; and a second lodge being unable to access any of those records.

## 14. Required acceptance scenarios

1. A valid account cannot access another lodge's records by changing a URL, API parameter, export request or file identifier.
2. A member cannot inspect another member's statement or confidential welfare information. The Secretary can access every record category in his own lodge.
3. Office expiry revokes authority on active sessions. Delegations do not outlive their authorised scope.
4. Scheduling a passing leaves degree as EA. Cancellation creates no FC event. Confirming performance creates exactly one FC event and expected linked drafts/tasks.
5. Two concurrent confirmations cannot create competing degree histories; a failed transaction leaves no partial state or orphan outbox entry.
6. Issued summons and approved minutes retain their original content after later profile, template or degree changes. Amendments are explicit and linked.
7. An edited draft displays a conflict/review step when refreshed from changed source facts.
8. A recorded external payment updates the correct member/fund without initiating a bank/card payment. Partial payments and transfers reconcile correctly.
9. Unbalanced journals cannot be posted; posted entries cannot be silently edited/deleted; period controls and authorised reversals work.
10. A complimentary lodge needs no payment method and is not converted to a paid subscription through a retry, expiry job or unrelated webhook.
11. Module access and subscription changes are enforced on server endpoints; a failed subscription does not destroy historical data or prevent the defined export process.
12. Asset issue and return preserve custodian, time and condition history; a different lodge cannot receive a linked custody record accidentally.
13. Historical imports detect duplicates and ambiguous names, show source evidence, reconcile totals and avoid live workflow notifications by default.
14. Attendance deduplicates explicit attendance and confirmed service in office; planned office assignments do not count as attendance.
15. Constitution-specific templates preserve their versions; no Scottish or Irish profile is labelled validated until its acceptance examples pass.
16. Background retries do not duplicate internal events; external-delivery ambiguity is surfaced for reconciliation.
17. Backup restoration recovers tenant records and their file references; the application checks for missing objects and permissions before reopening access.
18. Mobile layouts work on iPhone Safari and Android browsers; critical forms remain usable with a keyboard and clear validation.
19. Performance testing records measured capacity and cost drivers; no “20,000 users supported” claim is based only on account counts or provider allowances.

## 15. Inputs needed during implementation

No further broad questionnaire is needed to begin the core workspace. The following inputs are needed at the named gates:

| Input | Needed for | Can work proceed before receipt? |
| --- | --- | --- |
| Blank/redacted summons, agenda and minutes examples | Accurate M2 templates | Yes, using clearly marked generic drafts |
| Actual mentee-module request form and its timing/approval route | M2 mentoring workflow | Yes, keeping the form adapter unvalidated |
| Equivalent Scottish and Irish forms/procedures | Validated support for those profiles | Yes, build shared configurable structure first |
| Treasurer's current records and agreed financial structure | Production finance setup and opening-balance migration | Yes, use synthetic balanced examples |
| Redacted representative Excel/Word/PDF samples | Import mapping and reconciliation | Yes, build import staging and validation framework |
| Business owner/entity, subscription prices and merchant details | Paid subscription activation | Yes, use complimentary entitlement path and provider abstraction |
| Approved sender/domain and provider credentials | Actual outbound email/WhatsApp | Yes, use in-app notifications and a non-sending development outbox |
| Hosting budget/account choice and data-storage requirements | Production provisioning | Yes, keep local and test configuration separate from live deployment |

Avoid putting member data, original private documents or credentials in GitHub issues or this public repository. Template examples used for development should be blank or redacted.

## 16. Sources and interpretation

The Working Tools was reviewed as a feature benchmark. This is an independent product specification, not a copy of its source, forms or design and not a claim of affiliation. Its published feature list covers members, meetings, finances and assets [S8].

- **S1:** [Cloudflare Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), checked 7 November 2026.
- **S2:** [Cloudflare D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/), checked 7 November 2026.
- **S3:** [Cloudflare D1 database API and batch transactions](https://developers.cloudflare.com/d1/worker-api/d1-database/), checked 7 November 2026.
- **S4:** [Cloudflare R2 pricing](https://developers.cloudflare.com/r2/pricing/), checked 7 November 2026.
- **S5:** [Supabase pricing](https://supabase.com/pricing), checked 7 November 2026.
- **S6:** [Better Auth Drizzle adapter](https://better-auth.com/docs/adapters/drizzle), checked 7 November 2026.
- **S7:** [Cloudflare D1 limits and concurrency](https://developers.cloudflare.com/d1/platform/limits/), checked 7 November 2026.
- **S8:** [The Working Tools features](https://www.theworkingtools.co.uk/features), reviewed 7 November 2026.

Product requirements come from the project discussion. Workflow design, architecture choice, workload scenarios, acceptance gates and implementation defaults are recommendations derived for this project. Provider facts are time-sensitive and must be rechecked before purchasing or deployment.
