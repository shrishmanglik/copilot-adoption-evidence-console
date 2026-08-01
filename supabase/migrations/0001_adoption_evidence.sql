-- Production persistence contract. The public demo does not connect to Supabase.
-- Every table below enables RLS and carries an explicit tenant policy.

create extension if not exists pgcrypto;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.memberships (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('adoption_lead','product','engineering','customer_success','privacy_reviewer','marketing_reviewer','viewer')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create or replace function public.is_org_member(target_organization_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.memberships m where m.organization_id = target_organization_id and m.user_id = auth.uid()) $$;

create or replace function public.has_org_role(target_organization_id uuid, allowed_roles text[])
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.memberships m where m.organization_id = target_organization_id and m.user_id = auth.uid() and m.role = any(allowed_roles)) $$;

create or replace function public.is_org_user(target_organization_id uuid, target_user_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.memberships m where m.organization_id = target_organization_id and m.user_id = target_user_id) $$;

create table public.customer_accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  external_reference text,
  display_label text not null,
  segment text not null,
  sensitivity text not null default 'restricted',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, external_reference)
);

create table public.workflow_definitions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  account_id uuid not null references public.customer_accounts(id) on delete cascade,
  name text not null,
  owner_user_id uuid references auth.users(id),
  product_version text not null,
  repeat_rule_periods integer not null check (repeat_rule_periods >= 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.evidence_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  workflow_id uuid not null references public.workflow_definitions(id) on delete cascade,
  source_kind text not null,
  source_version text not null,
  observed_at timestamptz not null,
  payload jsonb not null,
  sensitivity text not null default 'restricted',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.blockers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  workflow_id uuid not null references public.workflow_definitions(id) on delete cascade,
  category text not null,
  severity text not null check (severity in ('LOW','MEDIUM','HIGH','CRITICAL')),
  state text not null,
  owner_user_id uuid references auth.users(id),
  closure_condition text not null,
  due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.adoption_receipts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  workflow_id uuid not null references public.workflow_definitions(id) on delete cascade,
  ruleset_version text not null,
  state text not null,
  reasons jsonb not null,
  held_fields jsonb not null,
  source_record_ids jsonb not null,
  evaluated_at timestamptz not null,
  created_by uuid not null references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now()
);

create table public.approvals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  subject_type text not null,
  subject_id uuid not null,
  approval_type text not null check (approval_type in ('CUSTOMER','METRIC','PRIVACY','WORDING','PUBLICATION')),
  state text not null check (state in ('APPROVED','REJECTED','WITHDRAWN')),
  requested_by_user_id uuid not null references auth.users(id),
  approver_user_id uuid not null references auth.users(id),
  wording_scope text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  check (requested_by_user_id <> approver_user_id)
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_user_id uuid references auth.users(id),
  event_type text not null,
  subject_type text not null,
  subject_id uuid not null,
  event_payload jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.organizations enable row level security;
alter table public.memberships enable row level security;
alter table public.customer_accounts enable row level security;
alter table public.workflow_definitions enable row level security;
alter table public.evidence_records enable row level security;
alter table public.blockers enable row level security;
alter table public.adoption_receipts enable row level security;
alter table public.approvals enable row level security;
alter table public.audit_events enable row level security;

create policy organizations_member_select on public.organizations for select using (public.is_org_member(id));
create policy memberships_self_select on public.memberships for select using (user_id = auth.uid());
create policy accounts_member_select on public.customer_accounts for select using (public.is_org_member(organization_id));
create policy accounts_operator_insert on public.customer_accounts for insert with check (public.has_org_role(organization_id, array['adoption_lead','product','customer_success']));
create policy accounts_operator_update on public.customer_accounts for update using (public.has_org_role(organization_id, array['adoption_lead','product','customer_success'])) with check (public.has_org_role(organization_id, array['adoption_lead','product','customer_success']));
create policy accounts_lead_delete on public.customer_accounts for delete using (public.has_org_role(organization_id, array['adoption_lead']));

create policy workflows_member_select on public.workflow_definitions for select using (public.is_org_member(organization_id));
create policy workflows_operator_insert on public.workflow_definitions for insert with check (public.has_org_role(organization_id, array['adoption_lead','product']));
create policy workflows_operator_update on public.workflow_definitions for update using (public.has_org_role(organization_id, array['adoption_lead','product'])) with check (public.has_org_role(organization_id, array['adoption_lead','product']));
create policy workflows_lead_delete on public.workflow_definitions for delete using (public.has_org_role(organization_id, array['adoption_lead']));

create policy evidence_member_select on public.evidence_records for select using (public.is_org_member(organization_id));
create policy evidence_operator_insert on public.evidence_records for insert with check (created_by = auth.uid() and public.has_org_role(organization_id, array['adoption_lead','product','engineering','customer_success']));

create policy blockers_member_select on public.blockers for select using (public.is_org_member(organization_id));
create policy blockers_operator_insert on public.blockers for insert with check (public.has_org_role(organization_id, array['adoption_lead','product','engineering','customer_success']));
create policy blockers_operator_update on public.blockers for update using (public.has_org_role(organization_id, array['adoption_lead','product','engineering','customer_success'])) with check (public.has_org_role(organization_id, array['adoption_lead','product','engineering','customer_success']));
create policy blockers_lead_delete on public.blockers for delete using (public.has_org_role(organization_id, array['adoption_lead']));

create policy receipts_member_select on public.adoption_receipts for select using (public.is_org_member(organization_id));
create policy receipts_lead_insert on public.adoption_receipts for insert with check (created_by = auth.uid() and public.has_org_role(organization_id, array['adoption_lead']));

create policy approvals_member_select on public.approvals for select using (public.is_org_member(organization_id));
create policy approvals_separated_insert on public.approvals for insert with check (
  approver_user_id = auth.uid()
  and requested_by_user_id <> auth.uid()
  and public.is_org_user(organization_id, requested_by_user_id)
  and (
    (approval_type = 'CUSTOMER' and public.has_org_role(organization_id, array['customer_success']))
    or (approval_type = 'METRIC' and public.has_org_role(organization_id, array['product']))
    or (approval_type = 'PRIVACY' and public.has_org_role(organization_id, array['privacy_reviewer']))
    or (approval_type = 'WORDING' and public.has_org_role(organization_id, array['marketing_reviewer']))
    or (approval_type = 'PUBLICATION' and public.has_org_role(organization_id, array['marketing_reviewer']))
  )
);

create policy audit_operator_insert on public.audit_events for insert with check (actor_user_id = auth.uid() and public.has_org_role(organization_id, array['adoption_lead','product','engineering','customer_success','privacy_reviewer','marketing_reviewer']));
create policy audit_member_select on public.audit_events for select using (public.is_org_member(organization_id));

create or replace function public.reject_immutable_mutation()
returns trigger language plpgsql as $$ begin raise exception 'evidence, receipts, approvals, and audit events are append-only'; end; $$;
create trigger evidence_records_append_only before update or delete on public.evidence_records
for each row execute function public.reject_immutable_mutation();
create trigger adoption_receipts_append_only before update or delete on public.adoption_receipts
for each row execute function public.reject_immutable_mutation();
create trigger approvals_append_only before update or delete on public.approvals
for each row execute function public.reject_immutable_mutation();
create trigger audit_events_append_only before update or delete on public.audit_events
for each row execute function public.reject_immutable_mutation();
