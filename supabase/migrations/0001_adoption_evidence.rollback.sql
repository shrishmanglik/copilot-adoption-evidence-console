-- Local rollback plan. Production execution requires separate provider authority.
drop trigger if exists audit_events_append_only on public.audit_events;
drop function if exists public.reject_audit_mutation();
drop table if exists public.audit_events;
drop table if exists public.approvals;
drop table if exists public.adoption_receipts;
drop table if exists public.blockers;
drop table if exists public.evidence_records;
drop table if exists public.workflow_definitions;
drop table if exists public.customer_accounts;
drop function if exists public.is_org_member(uuid);
drop table if exists public.memberships;
drop table if exists public.organizations;
