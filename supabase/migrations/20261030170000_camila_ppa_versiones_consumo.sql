-- DOCENTY PRO / Mi Formato - etapa de seguridad, versiones y métricas.
-- MIGRACIÓN PREPARADA, NO APLICAR en Supabase compartido con producción
-- hasta validar RLS en una base de pruebas aislada.
-- No almacenar contraseñas, API keys, archivos binarios ni datos de estudiantes.
create table if not exists public.camila_ppa_versiones (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  conversacion_id uuid references public.camila_conversaciones(id) on delete set null,
  nombre text not null check (char_length(nombre) between 1 and 150),
  version integer not null check (version between 1 and 500),
  ruta_storage text not null check (char_length(ruta_storage) between 1 and 500),
  estado text not null default 'borrador'
    check (estado in ('borrador','aprobado','descartado')),
  -- JSON validado del PPA; solo se persiste por decisión explícita del docente.
  ppa_json jsonb,
  consentimiento_documento_en timestamptz not null,
  created_at timestamptz not null default now(),
  unique (teacher_id, conversacion_id, version)
);
create index if not exists camila_ppa_versiones_docente
  on public.camila_ppa_versiones (teacher_id, created_at desc);
alter table public.camila_ppa_versiones enable row level security;
revoke all on public.camila_ppa_versiones from public, anon, authenticated;
grant select, insert, update, delete on public.camila_ppa_versiones to authenticated;
create policy "Camila versiones: leer propias" on public.camila_ppa_versiones
  for select to authenticated using ((select auth.uid()) = teacher_id);
create policy "Camila versiones: guardar propias con permiso" on public.camila_ppa_versiones
  for insert to authenticated with check (
    (select auth.uid()) = teacher_id AND
    ruta_storage like (select auth.uid())::text || '/%' AND
    consentimiento_documento_en IS NOT NULL);
create policy "Camila versiones: editar propias" on public.camila_ppa_versiones
  for update to authenticated using ((select auth.uid()) = teacher_id)
  with check ((select auth.uid()) = teacher_id AND ruta_storage like (select auth.uid())::text || '/%');
create policy "Camila versiones: borrar propias" on public.camila_ppa_versiones
  for delete to authenticated using ((select auth.uid()) = teacher_id);

-- Métricas técnicas sin texto de conversación, sin documentos, sin nombres.
-- Solo service_role inserta. El docente puede consultar su consumo.
create table if not exists public.camila_consumo_tokens (
  id bigint generated always as identity primary key,
  teacher_id uuid not null references auth.users(id) on delete cascade,
  modelo text not null check (char_length(modelo) between 1 and 100),
  modo text not null check (modo in ('chat','formato','ppa_bloque','ppa_completo')),
  input_tokens integer not null default 0 check (input_tokens >= 0),
  output_tokens integer not null default 0 check (output_tokens >= 0),
  cache_read_tokens integer not null default 0 check (cache_read_tokens >= 0),
  cache_creation_tokens integer not null default 0 check (cache_creation_tokens >= 0),
  created_at timestamptz not null default now()
);
create index if not exists camila_consumo_docente_fecha
  on public.camila_consumo_tokens (teacher_id, created_at desc);
alter table public.camila_consumo_tokens enable row level security;
revoke all on public.camila_consumo_tokens from public, anon, authenticated;
grant select on public.camila_consumo_tokens to authenticated;
create policy "Camila consumo: ver solamente el propio" on public.camila_consumo_tokens
  for select to authenticated using ((select auth.uid()) = teacher_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('camila-documentos','camila-documentos',false,10485760,
  array['application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do nothing;
create policy "Camila documentos: subir propios" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'camila-documentos' AND
    (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Camila documentos: leer propios" on storage.objects
  for select to authenticated using (
    bucket_id = 'camila-documentos' AND
    (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Camila documentos: borrar propios" on storage.objects
  for delete to authenticated using (
    bucket_id = 'camila-documentos' AND
    (storage.foldername(name))[1] = (select auth.uid())::text);
