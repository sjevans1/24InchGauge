# 24 Inch Gauge

A proposed subscription web application for lodge administration, member access, financial record keeping and movable-property management.

The product starts with English Constitution workflows and is designed to accommodate Scottish and Irish Constitution lodges. Kingston Lodge No. 1933 is the initial pilot. Each lodge has its own records, permissions and module entitlements.

## Project status

**Requirements and development blueprint: prepared. Application implementation and deployment: not started.**

The repository currently contains the product specification and delivery plan. It is not a working application, and no hosting service, paid subscription, email delivery or payment collection has been activated.

Read the [Master Development Blueprint](docs/MASTER_DEVELOPMENT_BLUEPRINT.md) for confirmed requirements, proposed architecture, workflows, access rules, cost assumptions, milestones and acceptance criteria.

## Product principles

- Record an event once, then prepare the related records, documents and tasks.
- Distinguish a planned ceremony from a ceremony confirmed as performed.
- Preserve issued documents and approved records; corrections create an auditable amendment.
- Give each member access appropriate to the lodge, office and individual record.
- Give the Secretary access to all records of the lodge, without bypassing financial or document controls.
- Charge subscribing lodges for the service; record members' lodge payments without processing them.
- Start the founder's pilot access and Kingston Lodge subscription as complimentary, without collecting payment details.
- Keep hosting economical and scale against measured workload.

## Next implementation milestone

M1: authenticated users, separate lodge workspaces, dated office permissions, constitution configuration, membership directory and complimentary subscription entitlements. The first connected workflow then takes a scheduled ceremony through confirmation, degree history, draft minutes and mentoring follow-up.

## Source and operational data

This repository is for application source, generic templates, documentation and synthetic test fixtures. Lodge membership lists, private documents, credentials and financial records belong in private application storage and must not be committed here.

The working product name is **24 Inch Gauge**. Commercial ownership, licence terms, subscription prices and merchant-provider selection remain to be settled; the blueprint does not grant a commercial licence or claim endorsement by a governing body.
