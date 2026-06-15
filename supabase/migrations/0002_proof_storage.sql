-- Private bucket for proof images. public = false means objects are never
-- directly accessible; clients must mint short-lived signed URLs to view them.
insert into storage.buckets (id, name, public)
values ('proofs', 'proofs', false)
on conflict (id) do nothing;

-- Proof object keys are laid out as: private/<family_id>/<task_id>/<file>.jpg
-- so (storage.foldername(name))[2] is the owning family id.

-- Family members may read proof objects belonging to their own family.
create policy "family reads proof objects"
on storage.objects for select
to authenticated
using (
  bucket_id = 'proofs'
  and (storage.foldername(name))[2] = public.current_family_id()::text
);

-- Children may upload proof objects into their own family's prefix.
create policy "children upload proof objects"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'proofs'
  and (storage.foldername(name))[2] = public.current_family_id()::text
  and exists (
    select 1 from public.user_profiles
    where auth_user_id = auth.uid() and role = 'child'
  )
);

-- Allow re-upload (upsert) of an existing proof object by the same family.
create policy "family updates proof objects"
on storage.objects for update
to authenticated
using (
  bucket_id = 'proofs'
  and (storage.foldername(name))[2] = public.current_family_id()::text
)
with check (
  bucket_id = 'proofs'
  and (storage.foldername(name))[2] = public.current_family_id()::text
);
