# Creator Portal Module — Summary

The vendor-facing app — vendors see only their own campaigns, work, and invoices.

## Onboarding & Assets
- Signup by phone; OTP and login credentials sent via WhatsApp.
- Vendor indicates their service type at onboarding; no work is possible until Procurement assigns a role.
- Amp/Influencer vendors add assets (profile link + per-deliverable costs); Instagram assets need OTP-based ownership verification, then inventory approval before use.
- Billing changes typically need Finance's approval to take effect.

## Assigned Work
- Link-based vendors see campaigns where their asset is in the plan, the campaign is active, and the assignment is visible to them.
- Misc-service vendors see campaign–service assignments given by Procurement (deliverables + cost), as long as the deadline hasn't passed.

## Submitting Work
- **Links** — submit post URLs against a campaign + asset; duplicates are ignored; submissions start pending, get approved by the team, with performance data fetched in the background.
- **Misc** — submit proof of work against a campaign + service; this immediately creates an invoice that enters two-stage approval (campaign lead, then procurement).
- **My Works** tracks all submissions, filterable by campaign/asset/status, and flags which ones still need an insight screenshot.

## Insight Screenshots
- Required for some link submissions as proof of performance; one active batch per submission, deletable before finalized.
- Can be turned off per vendor for high-volume submitters where it isn't practical.

## Raising Invoices
- **Links** — only approved, not-yet-invoiced submissions are eligible; vendor enters an invoice number and optional attachment; some vendor types are capped (e.g. one per week). Duplicate-invoicing is prevented by filtering out already-invoiced links, including ones processed outside DMS — though that check depends on a script being run and URLs matching exactly.
- **Misc** — invoice created from a campaign–service assignment's submissions; follows the same two-stage approval (lead, then procurement) before Finance.

## Tracking & Notifications
- Invoices list shows status/amount/date for everything; opening one shows full detail including rejection reason if applicable.
- Notifications cover approvals, rejections, and insight-upload reminders (4 days after approval; 12 hours for Instagram Stories).

## Other Notes
- Vendors can raise a billing change request (Finance approves/rejects) and add a secondary phone number for notifications.
- PAN can't be changed once verified — only full re-onboarding allows that; phone numbers can be updated anytime.
- Billing details are verified by the payout provider; Finance approval triggers ledger creation in Tally.
