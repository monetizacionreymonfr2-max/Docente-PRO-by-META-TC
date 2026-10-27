-- Preparación para lanzamiento de Mi Formato.
-- NO aplicar hasta autorizar el cambio en el proyecto Supabase compartido con producción.
-- Solo permite a cada docente gestionar sus propios Word originales.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'formatos-originales',
  'formatos-originales',
  false,
  10485760,
  array['application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
on conflict (id) do nothing;

create policy "Docenty formatos: subir Word propio"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'formatos-originales'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Docenty formatos: descargar Word propio"
on storage.objects for select to authenticated
using (
  bucket_id = 'formatos-originales'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Docenty formatos: eliminar Word propio"
on storage.objects for delete to authenticated
using (
  bucket_id = 'formatos-originales'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
