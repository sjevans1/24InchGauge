# User journeys and delivery register

Last updated: 16 November 2026 (Jamaica)

This is the living delivery record for 24 Inch Gauge. Update it whenever requirements, implementation or acceptance evidence change. It records the current baseline; it is not an automatic monitoring service. Read alongside [Pilot status](PILOT_STATUS.md) and the [Master blueprint](MASTER_DEVELOPMENT_BLUEPRINT.md).

## Active checkpoint — 16 November 2026

**Development interrupted; new workflows are not deployed.** The execution environment became unavailable during browser OCR testing. The new application source was last observed locally and has not been committed or packaged. Its recovery must be verified when execution resumes. The live pilot remains the previously published calendar/branding build.

Before interruption, TypeScript and **30 automated tests passed** against the local changes. Browser review reached the new document navigation, minutes-version controls and combined-report form. A further actual-report-page merge test was added after that run and has not been executed. The browser OCR test reached “Reading”; no recognition result was observed. These facts do not constitute a completed build, deployment or user acceptance.

| Work | Local progress, not deployed | Remaining verification / limits |
| --- | --- | --- |
| Minutes versions and approval evidence | Saved revisions, quoted evidence from a later regular meeting's current saved minutes, approved/amended/deferred decisions, rejection of stale evidence revisions | Recover source; finish review of correction cases; complete hosted user acceptance. Source minutes need not themselves be approved. |
| Combined review packs | PDF report selection, explicit missing-report reasons, combined PDF, preserved version manifest, private preparation and deliberate member release | Run the newly added actual-report-page test; check final PDFs and hosted uploads. UI currently uses a fixed report order; configurable order remains outstanding. |
| Attendance photographs | Private page uploads, page selection, manual review, exact-name suggestions, attendance history; verification does not perform ceremonies | Browser-local OCR added with self-hosted runtime/model assets, but recognition result not yet verified. Handwriting accuracy remains untested. |
| Correspondence | Private mailing groups, duplicate-address removal, Gmail compose handoff and manual pack-dispatch record | This is not direct Gmail integration. No messages sent. Authorised provider integration, delivery confirmation and controlled sending remain outstanding. |
| Supplied workbooks | Structure and sample values inspected privately; membership/contact sheets, separate mailing lists and historical attendance recognised | No live import. Preserve dated evidence and reconcile conflicts before importing; do not infer degrees, current offices or absences from missing values. |

Resume sequence: recover the local checkout; remove the temporary OCR QA route before packaging; finish OCR and PDF checks; run TypeScript and the full test suite; build; verify no private documents or extracted records are tracked; sync code to GitHub and publish with the existing owner-private audience. Reconcile this register with the recovered source before replacing these checkpoint statuses.

## Governing principle

The application supplements physical lodge proceedings and existing correspondence. It reduces transcription and repeated preparation; it does not replace the attendance book, ceremonies, officers' reports, deliberation or approval in open lodge. A software action records an authorised person's confirmation of what happened; it does not itself confer lodge approval.

The Secretary has confirmed that he has not yet tested the application. Automated checks and developer browser checks are implementation evidence, not user acceptance. No workflow below is marked user-accepted.

## Confirmed Kingston journeys

### J1 — Secretary prepares and circulates a summons

1. Secretary plans the meeting and its agenda using lodge details and current membership records.
2. App prepares the branded summons; Secretary checks wording, date, planned work and recipients.
3. Secretary finalises the exact PDF/version to circulate.
4. Secretary sends correspondence from the lodge's existing Gmail account to the membership's email addresses. Members should be able to receive/read the attachment without logging into the app.
5. App should retain the circulated version, distribution record and any later replacement, without overwriting what was sent.

Current: agenda, branded PDF and immutable issued document exist. Sending from Gmail, recipient review and delivery records do not. Existing Gmail correspondence continues manually until integration is configured and tested. Issued, sent, delivered and read are different facts; the app must not equate them.

Proposed implementation: connect the lodge-owned mailbox through authorised OAuth; prepare a draft and attachment for explicit Secretary review before sending. Review missing/duplicate addresses and recipient privacy. Record provider acknowledgement/failure; retry safely without duplicate sends. The precise recipient addressing policy and any broader mailbox-history access remain to be agreed. No connection or sending is authorised merely by documenting this journey. Keep account identifiers and credentials in private runtime configuration, not source fixtures.

### J2 — Physical attendance book to verified attendance

1. Brethren sign the physical attendance book on the night.
2. Secretary uploads one or several page photographs against that specific meeting.
3. App proposes extracted names and membership matches, preserving page references and uncertain/unmatched entries.
4. Secretary checks against the images, resolves handwriting, duplicate pages/names and visitor matches, and confirms the attendance list. Manual entry remains available if extraction fails.
5. Verified attendance feeds minutes and attendance/engagement reports. Confirmed service in office can count as presence even when omitted from the separate roster; an advance appointment does not count.

Current: manually supplied attendance is recorded during meeting confirmation. There is no meeting-linked attendance-photo ingestion, handwriting extraction or reconciliation interface. Existing property photo uploads are not attendance support.

Proposed safeguards: extraction is a suggestion, never authoritative. Photograph upload alone must not mark presence, confirm a ceremony, advance a degree or approve minutes. Separate attendance verification from confirmation of ceremonies actually performed. Preserve source images privately and support audited corrections. Choose any OCR provider only after evaluating handwriting accuracy, cost and handling of lodge data.

### J3 — Draft minutes and officers' reports become one review pack

1. Secretary prepares draft minutes after the meeting, reusing confirmed facts while editing the narrative.
2. Almoner, Treasurer and Charity Steward supply their reports through their existing working process. Secretary can upload their files; direct officer submission is a future convenience, not a prerequisite.
3. Secretary selects the reports intended for member circulation, verifies meeting/period and versions, and orders them with the minutes.
4. App combines draft minutes and the three relevant reports into one PDF. Proposed default order: minutes, Almoner, Treasurer, Charity Steward; Secretary can change it.
5. Secretary previews every page and circulates the pack through the lodge mailbox for review, clearly identified as awaiting lodge approval.
6. Suggestions/amendments can arrive through existing correspondence or discussion. Secretary records revisions without changing the previously circulated pack. Recirculation creates a new version when needed.

Current: editable draft minutes and individual PDF generation exist; private general file archive exists. There is no structured officer-report collection, PDF merging, versioned review-pack issuance or circulation register. The existing issued-Minutes operation requires Approved status, so it cannot serve as the required pre-approval circulation workflow.

Proposed implementation: accept PDF reports first, validate/preview files and handle missing, encrypted, malformed or oversized reports visibly. Record explicit omissions rather than silently treating an incomplete pack as complete. Word-to-PDF conversion is a separately tracked enhancement. Retain source versions and the assembled PDF. The circulation manifest identifies exactly which minutes/report versions were attached. Do not automatically distribute private welfare case notes; only deliberately selected circulation reports belong in the pack.

### J4 — Minutes are approved in open lodge at the next meeting

1. Members receive the review pack before the next meeting.
2. In the next open lodge meeting, the lodge considers the previous minutes and any corrections.
3. The app learns the outcome through the minutes of the current regular meeting. The Secretary uploads or saves those minutes and verifies the passage recording approval, approval with amendments, or deferral of the previous regular meeting's minutes. Do not infer approval from the meeting date, agenda, upload alone or a standalone checkbox.
4. App records the meeting whose minutes were considered, the later approving meeting/date, the exact approved text/version, outcome, amendments and who recorded the decision. Proposer/seconder fields depend on confirmed local practice and are not assumed mandatory.
5. Preserve the source meeting, exact source-minutes version and quoted passage alongside the previous minutes version to which the decision applies. The current source minutes need not themselves be approved; otherwise the workflow would create a circular dependency.
6. Approved minutes are locked as a historical version. Later corrections use an explicit linked record rather than silently replacing history. A newer version of the source minutes requires review of any affected decision.

Current: Draft/Approved status and an explicit approval confirmation exist, and approved text cannot be edited. However, the action is not linked to a subsequent open-lodge meeting and lacks circulation, amendment and deferral states. Its approval button is not evidence that the required physical approval occurred.

Target model (proposed): Draft → Circulated for review → Revised when necessary → Approval recorded in open lodge. Deferral keeps approval pending. Circulation version, document issuance status and approval status must be separate. Approval of minutes does not automatically approve or alter an attached financial or officers' report. Historical imports must distinguish the original approval date from the date entered into the application.

### J5 — Members and officers continue their existing work

Members receive summonses and review packs by email; optional app access exposes relevant lodge information and permitted records. Officers continue their physical and professional responsibilities, submitting reports for reuse. Secretary coordinates and records the workflow. A degree changes only after the Secretary confirms the ceremony was actually performed, independently of the later approval of minutes. Treasurer verifies financial records; a report upload does not post ledger transactions.

## Delivery register

Status vocabulary: **Implemented / not user-accepted**, **Partial**, **Not built**, **In development / not deployed**, **Pending decision**, **Accepted**. The table below describes the deployed baseline; the active checkpoint above records unpublished development. Accepted requires dated user acceptance evidence. Test failures or blockers must be recorded explicitly; a feature name alone is not evidence of completion.

| ID | Work item | Current status | Remaining work / completion evidence |
| --- | --- | --- | --- |
| W01 | Lodge identity and calendar | Implemented / not user-accepted | Kingston first Wednesday, 19:00, September/October recess, February Installation; verify with Secretary in app. |
| W02 | Summons preparation | Implemented / not user-accepted | Review a real proposed summons for content, layout and recipient-ready PDF. |
| W03 | Gmail correspondence and distribution | Not built | Authorised lodge mailbox, recipient review, versioned attachments, explicit send, failure/retry and distribution audit; controlled test recipients before membership mailing. |
| W04 | Attendance book photo ingestion | Not built | Multi-page meeting uploads, extraction proposals, matching, duplicates, visitors, manual review, source references, confirmation and corrections. |
| W05 | Attendance and actual ceremony recording | Partial | Manual attendance/ceremony confirmation exists; separate evidence review and correct omitted office-service attendance; validate physical-meeting scenario. |
| W06 | Minutes drafting and revision | Partial | Editing exists before approval; add preserved circulated versions, amendments and comparison history. |
| W07 | Officer reports and one-PDF review pack | Not built | Meeting-linked reports, inclusion checks, ordering, merge, page preview, version manifest and clearly unapproved minutes. |
| W08 | Approval recorded at subsequent open lodge | Partial | Existing approval flag is insufficient; add linked approving meeting, decision, amended version, deferral and audited post-approval corrections. |
| W09 | Member/Secretary/Treasurer/Master journeys | Partial | Roles exist; real signed-in account tests remain. Hosting is owner-private: lodge invitations alone do not admit other users through the outer site gate. Do not widen access without authorization. |
| W10 | Mentoring and officer reporting | Partial | Generic follow-up tasks exist; formal mentee requests, ritual-work, attendance and Past Master engagement reports remain. |
| W11 | Financial administration | Partial | Ledger exists; opening balances, bank reconciliation, budgets, arrears statements, period controls and Treasurer acceptance remain. |
| W12 | Movable property | Implemented / not user-accepted | Basic register/custody/photos exist; loans, returns and stocktakes remain. |
| W13 | Historical migration | Partial | CSV membership import and private archive exist; reviewed extraction/reconciliation of 4–5 years of documents and financial/attendance data remain. |
| W14 | Reliability and recovery | Partial | Durable storage exists; file-inclusive backup, tested restore, retention, monitoring, security and load/cost validation remain. Complete recovery controls before broad historical import. |
| W15 | Other lodges and subscriptions | Partial | Separate workspaces/constitution labels exist; procedural validation, customer onboarding, entitlements and lodge billing remain. Kingston stays complimentary; no member payment processing. |
| W16 | Other communications | Not built | In-app inbox/reminders and optional WhatsApp; Gmail correspondence takes priority for Kingston. |
| W17 | Non-PDF officer report conversion | Pending decision | Preserve upload/manual conversion option; determine Word/Excel conversion need and acceptance criteria before calling it supported. |

## Scope and decision log

| Date | ID | Change | Effect |
| --- | --- | --- | --- |
| 9 Nov 2026 | D01 | Kingston schedule corrected to September/October recess; first Wednesday; February Installation | Implemented in the calendar and documented; replaces earlier August/September assumption. |
| 16 Nov 2026 | D02 | App supplements physical proceedings and correspondence | Governs all workflows; no implication that app approval replaces open-lodge approval. |
| 16 Nov 2026 | D03 | Existing lodge Gmail mailbox is the primary correspondence channel | Refines planned email scope and raises it in implementation priority; no mailbox connection or messages sent. |
| 16 Nov 2026 | D04 | Attendance book photo(s) as a meeting input | Newly explicit scope: reviewed handwriting extraction and reconciliation, not automatic attendance confirmation. |
| 16 Nov 2026 | D05 | Draft minutes plus Almoner/Treasurer/Charity Steward reports circulated as one PDF | Newly explicit scope: report collection, merge, circulation versions and pre-approval distribution. |
| 16 Nov 2026 | D06 | Minutes can be amended and are approved in the next open lodge | Refines approval scope; existing approval flag does not satisfy this journey. Preserve actual outcomes including deferral. |
| 16 Nov 2026 | D08 | Approval is evidenced through the current regular meeting's minutes | Capture the exact source revision and passage; do not require approval of those source minutes or infer approval from an agenda. |
| 16 Nov 2026 | D09 | Private membership/attendance and dated district workbooks supplied | Review and reconcile before import; retain source dates and keep real records outside GitHub and public test fixtures. |
| 16 Nov 2026 | D07 | Maintain a continuously updated scope/progress record | This register is the primary status index. Update with each development or acceptance session; retain dated changes and links to evidence. |

## Source-data reconciliation notes — 16 November 2026

The privately supplied Kingston workbook includes membership/contact information, general-member and committee email lists, attendance sheets labelled 2024, 2025 and 2026, and an attendance summary. Some attendance sheets mark August/September as holidays, conflicting with the user-confirmed current September/October rule. Retain the historical source labels and flag the discrepancy; do not rewrite historical meetings to match today's schedule. Sample summary values exceed 100%, so the count/denominator and period must be reconciled before treating the summary as authoritative. Spreadsheet blanks are not automatically absences.

The district reference includes a main heading dated May 6, 2025 and another section labelled 2023. Preserve section-specific dates. These are dated references for development, not proof of current officers, contact details or access rights. Use synthetic fixtures in public source control. Neither workbook nor its private records has been imported into the live app or committed to GitHub.

## Next delivery sequence

First complete the recovery and verification steps in the active checkpoint. The original delivery sequence remains:

1. Implement W06–W08 together: review-pack creation, circulation versions, amendments and approval recorded at the subsequent meeting. Allow manual Gmail sending with honestly recorded manual dispatch while W03 is pending.
2. Implement W04–W05: attendance photographs, reviewed extraction/matching and physical-meeting confirmation.
3. Implement W03: lodge-owned Gmail integration and controlled send tests; preserve review before sending. Provider permissions and user-authorized connection are required for live use.
4. Run the complete Kingston journey with authorised accounts: summons → physical attendance and ceremony → draft combined pack → suggested corrections → next open-lodge decision. Include deferral, duplicate photos, uncertain handwriting, missing reports and failed/duplicate-send protection. Record Secretary acceptance or specific failures per ID.
5. Continue recovery, finance, reports, historical migration and commercial readiness; do not confuse these pending milestones with the current pilot.

## Evidence and update discipline

Baseline inspected: GitHub main `41bd6cd15f8ed8e461846d418321596cf54a2278`. Last implementation verification: 26 automated tests, TypeScript, production build and developer desktop calendar/branding review. Earlier responsive-width checks are not physical iPhone/Safari certification. No new runtime verification or user acceptance is claimed for this documentation update.

For every subsequent work session: update the relevant W IDs, add newly requested scope and its priority impact, link code/test/deployment evidence, record decisions and blockers, and distinguish implemented, deployed and user-accepted. Keep completed items rather than deleting history. Do not mark manual workarounds as implemented automation. The app does not yet expose this delivery register as an in-app project-management screen.

Privacy: do not commit original summonses, attendance photos, officers' reports, minutes, member addresses, mailbox credentials or extracted private records. GitHub holds product specifications, code and the authorised isolated crest. Operational source documents remain private tenant data.
