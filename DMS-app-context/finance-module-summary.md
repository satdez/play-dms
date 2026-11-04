# Finance Module — Summary

Finance is where money actually moves: vendors raise invoices from their portal, and Finance approves/rejects invoices and billing requests, disables invoicing, and pays vendors — all from the portal.

## Dashboard
- Main entry point — view campaigns and act without opening each one.
- Mark PO, mark payment, mark invoice, mark agreement, push campaign to Tally.
- Clicking a campaign opens its cost details. 

## Campaign List & Details
- List shows agreement/PO/invoice/payment flags per campaign — these just record status, they don't trigger anything.
- Once payment is marked received, those flags lock.
- Details page shows cost breakdown per service (deliverables, pitching cost, internal cost, and internal cost excluding vendor/creator payouts), plus a submissions table tied to invoices, and a link to the tracker.

## Send to Tally
- On campaign approval, a cost-center record is created and a unique Tally key is assigned.
- Cost categories are pulled live from Tally, not stored locally.
- Once a category is confirmed, the request is queued; a separate integration service creates/updates the cost center in Tally and reports back success or failure.

## Payments
- Approved invoices show here, default filtered to payment-scheduled.
- Payments are made by date range — taxable amount and GST amount are paid separately, deliberately gated behind date filters.
- Finance can also cancel, hold, or reschedule a payment.
- Payments run through a payout provider; its outcome (success/failed/rejected/reversed) updates the transaction and invoice status. Success creates a Tally payment voucher and notifies the vendor on WhatsApp.

## Invoices
- List supports inline approve, reject, or reschedule (only if unpaid).
- Details view adds filters and shows every submission tied to that invoice.
- Rejection notifies the vendor with a reason; approval schedules payment and notifies the vendor.

## Requests
- Vendor billing requests: new onboarding or a change to existing billing details (PAN, bank, GST, MSME).
- Approval checks for PAN conflicts, updates the vendor, updates their Tally ledger, sets up a payout beneficiary, and notifies them. Rejection stores a comment and notifies them.

## Vendors
- List of all onboarded vendors with a Tally key; searchable by vendor or asset. 
- Vendor details cover profile, approved assets and pricing, submission history tied to invoices, billing request history, pricing history, and a toggle to enable/disable invoicing.

## Roles
- **FINANCE** — full access across dashboard, campaigns, invoices, payments, Tally, vendors, and requests.
- **FINANCE:EXEC_2** — campaigns, invoices, requests, vendor and payment details.
- **FINANCE:EXEC_3** — campaigns/push to Tally and vendor details only.
- **FINANCE:EXEC_1** — invoices, vendor details, and payment details.
