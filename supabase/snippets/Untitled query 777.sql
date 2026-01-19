-- Allow everyone to insert & read files in dev
create policy "dev_public_profile_pic"
on storage.objects
for all
to public
using (bucket_id = 'profile_pic')
with check (bucket_id = 'profile_pic');

create policy "dev_public_qrs"
on storage.objects
for all
to public
using (bucket_id = 'qrs')
with check (bucket_id = 'qrs');
