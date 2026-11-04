# HR Module — Summary

HR manages the employee lifecycle in DMS: onboarding, roles, pod/cohort structure, and offboarding — mostly automated via Zoho, with the HR portal covering the rest.

## Onboarding
- Two sources: automatic via a Zoho webhook (when someone's added in Zoho with a DMS role), or manual creation through the HR portal.
- Both create an auth account, an operational user record, and assign a role; the user is marked active.
- Zoho onboarding also attempts pod/cohort mapping and notifies Slack with the outcome; if the user already exists, they're simply re-activated, so retries are safe.
- Manual creation via HR skips pod/cohort assignment — that's a separate step.

## Activation & Deactivation
- Deactivation (via Zoho or HR) marks the user inactive and blocks login.
- If the user was a pod or cohort lead, that leadership is cleared and Slack alerts HR to assign a replacement.
- Reactivation (HR-only) removes the block and restores access immediately.

## Roles
- Roles control which portal(s) a user can access (e.g. Pod, Inventory, Sales, Finance, HR, and more granular ones like Inventory Lead/Team).
- HR can change any employee's role and basic profile info from the portal; this does **not** touch pod/cohort assignment.
- Some users can be enabled for role switching — manually configured, with a specific allowed-role list — letting them switch roles within a session (Sales + Pod, for example) without changing their stored role. Typically used for admins and cross-functional operators.

## Pods & Cohorts
- Pods are the primary team unit (lead + members, can contain cohorts); cohorts are smaller groupings that must belong to a pod and have their own lead.
- These structures exist only in DMS — never synced back to Zoho.
- Assigning a user to a pod doesn't auto-assign a cohort — they stay cohort-less until assigned.
- Assigning to a cohort may inherit the cohort's pod if the user has none, and the first user assigned can become the cohort's lead if it doesn't have one yet.
- Removing a user from a pod/cohort only updates DMS.
- Transfers are just remove-then-reassign, with no strict rules enforced — HR can restructure teams freely.

## Visibility & Discovery
- Multiple user views exist: employees only, full user list (admin), and an operational view showing active users with pod/cohort data. Pod and cohort views show their members and metadata. Deactivated users are excluded everywhere automatically.
- The HR UI's assignment dropdowns are backed by dedicated lookups: pod candidates, cohort candidates, new/unassigned members, and users eligible to become pod leads.

## Notifications
Slack alerts fire for onboarding, pod/cohort mapping results, and deactivation, so operations can react quickly.
