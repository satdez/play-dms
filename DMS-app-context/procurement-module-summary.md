# Procurement Module — Summary

Procurement manages vendors for miscellaneous (non-amplification, non-influencer, non-SOLO, non-Memed) campaign services: assigning roles, assigning vendors to services with cost/deliverables, and acting as the second approval step for misc-service invoices before Finance.

## Vendor Dashboard & Onboarding
- Lists vendors as unassigned, assigned, or all — unassigned vendors are the priority.
- New vendors onboard with a service type and optional profile links (for amp/influencer vendors).
- A vendor can't add assets, complete billing, or work until procurement assigns them a role.
- Roles can only be added, never removed; a vendor can't hold both "amplification bulk" and "amplification creator" at once.

## Campaign Services (Misc)
- A list view shows every campaign with at least one misc service — vendor counts, deliverables, and internal cost, filterable/sortable.
- Opening a campaign shows each misc service and its assigned vendors (deliverables, cost, deadline, visibility, invoice status).
- Procurement can assign multiple vendors to a service, each with their own deliverable count and cost.
- Updating deliverables/cost can be blocked if the vendor has a pending or non-rejected invoice for that service.
- Removing a vendor is blocked unless their only invoice for that service was rejected.
- New misc services can be added to a campaign's plan at any time.

## Two-Stage Invoice Approval
- A misc-service invoice goes: **campaign lead approves → procurement approves → Finance gives final approval and pays.**
- Procurement only sees invoices already cleared by the campaign lead and waiting on them; the same approvals view is shared with campaign leads, just showing each role's own queue.
- Procurement can approve (moves the invoice into Finance's queue) or reject (vendor is notified, with a reason).

## Access
All procurement actions — dashboard, campaign services, and invoice approval — require the VENDOR:ROLE:ADMIN role.
