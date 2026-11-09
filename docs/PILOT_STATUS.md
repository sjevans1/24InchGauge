# Pilot status and acceptance

Updated: 9 November 2026 (Jamaica).

This is the first operational pilot of 24 Inch Gauge. It implements selected foundations across the blueprint's milestones; it does not claim that all M1–M5 acceptance gates or commercial-launch requirements are complete.

## Implemented versus remaining

| Area               | Implemented in this pilot                                                                                                                | Still to deliver                                                                                                                                        |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lodge workspace    | Isolated lodge records, switching, creation, Secretary/Master/Treasurer/member roles, invitations, expiry, revocation, activity log      | Independent customer authentication, officer MFA policy, granular permission administration, broader office/role history                                |
| Membership         | Profiles, current office/status/degree, CSV review/import/export, confirmed degree events and audited reversal                           | Application pipeline, affiliations, full status/office/rank history, emergency contacts, detailed Past Master engagement                                |
| Meetings           | Agendas, scheduling, cancellation, actual attendance, performed ceremonies, draft minutes, approval and issued PDF                       | Visitors, RSVP/dining counts, meeting-specific officer assignments, ritual-piece assignments, structured engagement and attendance reports              |
| Connected work     | A performed next-degree ceremony changes membership and creates its event, draft minutes text and mentoring follow-up in one transaction | Formal mentee-module request forms, prerequisites, mentor assignment/completion evidence, downstream reconciliation of amendments                       |
| Documents          | Logo, colour, two layouts, editable wording, reorderable sections, live preview, paginated PDFs, preserved issued snapshots              | Full template version administration, approved-document amendments, automatic constitutional wording/rule profiles, additional return templates         |
| Finance            | Integer-minor-unit balanced ledger, dues assessments/receipts, expenses, funds, reversible corrections and CSV export                    | Reconciled opening balances, bank reconciliation, budgets, approvals, period locking, annual statements, receivable ageing and fund controls            |
| Property           | Photograph, condition, value, custody/location and update history                                                                        | Loans and returns, disposal approvals, scheduled stocktakes and related reports                                                                         |
| Historical records | CSV member import; private PDF/DOCX/XLSX original archive                                                                                | Parsing/extraction of legacy workbooks/documents, field mapping, import provenance per row/page, attendance/financial migration and reconciliation      |
| Communication      | Assigned tasks and on-screen invitations/status feedback                                                                                 | Notification inbox, reminders, email/WhatsApp dispatch, consent/preferences, delivery tracking                                                          |
| Commercial service | Separate tenant workspaces, complimentary pilot designation, no fees or member payments                                                  | Plan catalog, module entitlement enforcement, audited complimentary grants, paid checkout, webhooks and subscription lifecycle                          |
| Operations         | Schema migrations, durable D1/R2 records, source control, JSON/CSV metadata exports                                                      | Complete file-inclusive backups, tested restore, monitoring, retention policy, stronger upload validation, load testing and operational security review |

English, Scottish and Irish are selectable identity settings. This is not a claim of verified procedural compliance across constitutions. Kingston's February–January lodge year and August/September recess are in the blueprint but are not yet reporting/calendar rules in the application.

## Start the pilot

1. Open the private application using the authorized owner's ChatGPT account.
2. Choose **Create your workspace**. Use **Sample workspace** to try workflows with fictional records; use **My lodge** for an empty lodge. The two choices create separate workspaces.
3. Set lodge identity and upload a crest in **Lodge settings → Branding**. No existing template is needed.
4. Add members or use the CSV template. Never import the sample template row as a real brother.
5. Plan a meeting, add its agenda and scheduled ceremony, preview its PDF, then issue the summons when ready.
6. After the meeting, confirm actual attendance and the ceremony performed. Review generated draft minutes and mentoring tasks. Save complete minutes, record the lodge's approval, then issue the approved PDF.
7. Record external receipts/expenses and property details as needed.

The pilot's hosting access is owner-private. A lodge invitation does not grant access through the outer site access policy, and it sends no email. Other officers must first be explicitly admitted to the pilot site, then accept their lodge invitation using the matching sign-in email. No additional audience is granted by deployment.

## Verification

- TypeScript check passes.
- 22 automated tests pass. They cover authentication/origin checks, tenant isolation, role expiry/revocation, concurrent update rollback, ceremony confirmation/idempotency, degree corrections, financial balancing/reversal, import atomicity, restricted member projections, property history, invitation binding, issued-PDF immutability, minutes approval, PDF pagination and CSV formula neutralization.
- Tests execute the real migration and SQL against Node's SQLite adapter; R2 object storage is simulated in memory. They are not a hosted multi-user acceptance test.
- The production Worker build succeeds. Native deployment status separately establishes whether that artifact is live.
- Browser QA exercised the read-only tour on a desktop and at a 390-pixel mobile width: navigation, document layout, live branding changes and member-entry dialog. The mobile check is a responsive-width browser test, not a physical iPhone/Safari certification.
- A generated summons was rendered and visually inspected. Embedded DejaVu fonts prevent substitution/spacing problems. Long agendas and unbroken words paginate in the automated test.
- Hosted sign-in, actual multi-user sessions, real file uploads, recovery and load/cost performance still need pilot acceptance with authorized accounts. No real lodge data was used in testing.

## Important implementation limits

The server currently loads all typed records for the selected lodge before projecting the permitted response. Records are stored by tenant and entity in D1, with JSON payloads and transactional revision checks. Pagination, normalized reporting tables/indexes, bounded archival reads and workload testing should precede larger rollouts. Do not infer a 20,000-user capacity guarantee from serverless hosting.

Activity display/export includes the most recent 500 audit actions, while the database retains earlier entries. The JSON export contains records and file metadata; original object bytes must be downloaded separately. It is not a complete restorable backup.

Image uploads are converted to PNG and limited by size, signature and dimensions. Archived Office/PDF files receive basic file-type/signature checks and are downloaded as attachments; content extraction, malware scanning and deep ZIP validation are not implemented. PDF fonts cover Latin, common punctuation and selected Greek/Cyrillic characters; unsupported glyphs are shown as `?`.

Ledger posting is a record-keeping function, not payment processing or a complete accounting close. Configure the true opening balances and accounting procedures in the subsequent finance milestone before treating this as the lodge's sole accounting system.

## Next development order

1. Complete owner/officer acceptance with separate accounts, real sample crest/document uploads and the Kingston secretary's full meeting workflow.
2. Add full backup/restore and operational controls before historical migration.
3. Implement structured ritual/attendance/engagement records, lodge-year/recess rules, document amendments and mentee-module requests.
4. Complete financial opening balances, reconciliation, approvals, reporting and staged historical imports.
5. Validate the three constitution profiles; add communications and the commercial subscription lifecycle after provider and pricing decisions.
6. Measure representative tenant workloads, optimize queries/storage and establish monitoring and recovery objectives before a wider rollout.
