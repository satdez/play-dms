# DMS — High-Level Overview

DMS is WLDD's campaign management platform, covering the full lifecycle from pitching a client to paying the vendors who deliver the work. Seven modules are documented so far.

## [Sales / BD](sales-bd-module-summary.md) - Business Development Portal
- Consists of  Outreach, Proposals, Inbound Requests, and Knowledge Base
- Owns the top of the funnel: outreach to prospects, proposals, and inbound requests that come in directly.
- Tracks each outreach through Lead status to Proposal, or Disqualified.
- Proposals carry a brief, cost, services offered, and an owner; they move through Mapped To POC → Approved → Converted To Campaign, or Cancelled.
- A Knowledge Base of past clients (industry, campaign count) is used to inform pitching.
- A team dashboard rolls up revenue, conversion rate, and outreach/proposal funnels.
- **Hands off:** a Converted To Campaign proposal becomes an actual campaign, picked up by POD.

## [POD](pod-module-summary.md) - Core Campaign Operations
- Consists of Planner,Tracker, Campaigns, approvals, Knowledge base, Analytics Config
- The core operational unit: campaign creation, planning, execution, tracking, and reporting.
- Campaigns move through 6 stages (Brief → Team Allocation → Pitch Details → Campaign Details → Activation → Campaign Report).
- The **planner** builds the distribution plan (categories, assets, deliverables); plan changes only affect the tracker once the campaign is Approved.
- The **tracker** holds one row per deliverable, fed by links from the team or vendors, plus earned/acquired media.
- The **reports** page exposes a submissions gallery, and (optionally) deeper comment/topic analysis to the client.
- **Hands off:** to Finance (via Tally sync and invoicing), to Inventory (for plan-ready pages), and to Procurement/Creator Portal (for the actual fulfillment work).

## [Inventory](inventory-module-summary.md) - Intagram/Twitter/Redit etc pages Inventory along with costs
- The onboarding engine behind POD's planner — onboards and prices creator/influencer "pages."
- Three-level review chain: Inventory Team (sets internal cost) → Inventory Lead (sets pitching cost) → Inventory Head (final approval).
- Supports **adhoc pages** — added mid-campaign when a needed page isn't in inventory yet, locked to that campaign until fully approved.
- **Cost-variable pages** are priced at their last-approved cost when added to a plan, adjustable later via a Missing Costs page.
- Also includes Scouting Agents (Instagram page discovery) and Content Tags (categorization).
- **Feeds:** approved pages into POD's planner, for use in any campaign.

## [Procurement](procurement-module-summary.md) - Vendor Service and Cost Assignment Portal
- Consists of Role Assignment to Vendors, Camapign Service Assignment to Vendors
- Manages vendors for miscellaneous campaign services — the ones outside the standard asset-based flow (non-Amplification/Influencer/SOLO/Memed).
- Assigns roles to new vendors so they can start working; roles can only be added, never removed.
- Assigns vendors to a campaign's misc services with deliverable counts, cost, and deadlines; can update or remove assignments (subject to invoice-status locks).
- Acts as the **second stage** of misc-service invoice approval — after the campaign lead, before Finance.
- **Feeds:** vendor eligibility into Creator Portal, and approved invoices into Finance's queue.

## [Creator Portal](creator-portal-module-summary.md) - Creator Facing External Portal
- Consists of the Creator Assets, Billing Profiles, Invoicing
- The vendor-facing app — vendors see only their own campaigns, work, and invoices.
- Vendors onboard by phone/OTP, add and verify assets (Instagram ownership verification via OTP), and only unlock the rest of the portal once Procurement assigns them a role.
- Two submission types: **links** (post URLs for Amplification/Influencer work) and **misc** (proof of work for Procurement-assigned services).
- Misc submissions auto-create an invoice that enters the two-stage approval chain immediately; link submissions are invoiced separately once approved.
- Tracks insight-screenshot requirements, invoice status, and notifications (approvals, rejections, screenshot reminders).
- **Feeds:** completed, invoiced work into Finance for payment.

## [Finance](finance-module-summary.md) - Financial Operations Portal
- Consists of Campaigns, Billing Profile Requests, Vendors, Invoices, Payments
- Where money actually moves — the terminal module for every campaign and vendor invoice.
- Sends approved campaigns to Tally for cost-center creation, using categories pulled live from Tally.
- Reviews and approves/rejects/reschedules invoices (both link-based and misc), with a dedicated Payments page for scheduling and executing payouts.
- Payouts run through a third-party provider; a webhook reports success/failure back and, on success, creates a Tally payment voucher and notifies the vendor.
- Reviews vendor billing requests (onboarding and billing changes) and can enable/disable a vendor's ability to invoice.
- **Terminal point:** nothing hands off further — this is where campaigns and vendors get paid.

## [HR](hr-module-summary.md) - Role Assignment Portal
- Consists of Users and PODS for role assignment to various functions on DMS
- Manages the people underneath every other module — onboarding, roles, pod/cohort team structure, and deactivation/reactivation.
- Onboarding is mostly automated via a Zoho webhook integration; manual creation through the HR portal is the fallback.
- Deactivating a user blocks their login and clears any pod/cohort leadership they held; reactivation restores access immediately.
- Roles determine which portal(s)/functionality a user can access; pod/cohort structure exists only in DMS (not synced to Zoho).
- **Cross-cutting:** every user acting in Sales/BD, POD, Inventory, Procurement, Creator Portal, or Finance exists in the system because HR (or the Zoho integration) provisioned them.

## System Flow (End-to-End)

The four stages below trace one continuous path through DMS — from a person being provisioned, through a vendor being onboarded, through a campaign running end-to-end, to that vendor actually getting paid.

### 1. Employee Onboarding / Offboarding
- An employee onboarded on Zoho automatically creates a user in DMS.
- Roles for that user are then assigned via the HR Portal.
- An employee offboarded on Zoho is automatically marked deleted in the database and banned in the auth system (Supabase).

### 2. Creator (Vendor) Onboarding - External to DMS
- A creator signs up, completing signup takes them into Creator Onboarding.
- From there they submit a **billing request** to Finance:
  - If Finance approves it, the request becomes a Billing Request that syncs to **Tally** — updating the vendor's existing ledger if they're already in Tally, or creating a new one if not.
  - If Finance rejects it, it goes back to Creator Onboarding to be resubmitted.
- In parallel, a **procurement request** goes to Procurement, who assign the vendor a role (creator, or a vendor type like content creation/Twitter Trend) — this produces an **Approved Vendor**.
- If the vendor is a creator, the next onboarding step is adding assets/profile:
  - Those assets are sent to **Inventory** for approval.
  - Inventory reviews the cost and approves the asset — if the page already exists in inventory, the team gets the option to merge it to avoid duplicates.
  - Inventory can also add a page directly themselves; pages added this way aren't mapped to an internal vendor.
  - Once approved, assets become visible to the Campaign team inside the planner.

### 3. Campaign Flow
- Pod creates a Campaign, which moves toward **Campaign Approved**.
- If the campaign includes Amplification, a **Campaign/Distribution Plan** is prepared — the Campaign team adds profiles and sets deliverables (and can set/change costs for cost-variable pages here).
- If the campaign has other services (WhatsApp, Offline, etc.), those go through **Plan Other Services** instead — Procurement adds vendors and sets their costs/deliverables.
- Once approved, the plan generates the **Campaign Tracker**, which holds all the post links; Pod approves submissions, adding them to the tracker.
- From the tracker, the content and execution team is assigned, moving the campaign through **Campaign Execution** to **Campaign Completed**.
- Once visible to them, the assigned (amplification) Creator submits their link, and Pod reviews it; the Creator can then raise an invoice for approved links. A non-creator vendor raises their invoice separately, attaching proof of work, once their work is done.

### 4. Finance, Tally Sync & Vendor Payments
- Once a campaign is approved, it becomes available on the Finance portal; Finance reviews it and pushes it to Tally.
- Any invoice created (from a Creator or a vendor) becomes visible to the Finance team, who review, approve, and schedule its payment for a date.
- Approved invoices, once successfully pushed to Tally, appear on the **Payments** page as Vendor Payments; Finance reviews scheduled payments and pays them from there.
- Paying a vendor initiates a transaction with the payout provider (**Cashfree**), which sends the transaction status back.
- Once that transaction completes successfully, a **payment voucher** is added to Tally, closing the loop.
