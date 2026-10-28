-- DOCENTY PRO: historial y memoria optativa de Camila.
-- Preparada para una base de pruebas; NO ejecutar en producción sin aprobación.
-- Nunca guardar archivos Word, tokens ni claves en estas tablas.

create table if not exists public.camila_conversaciones (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  titulo text not null check (char_length(titulo) between 1 and 120),
  mensajes jsonb not null default '[]'::jsonb
    check (jsonb_typeof(mensajes) = 'array' and jsonb_array_length(mensajes) <= 150),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists camila_conversaciones_docente_fecha_idx
  on public.camila_conversaciones (teacher_id, updated_at desc);

create table if not exists public.camila_memorias (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  titulo text not null check (char_length(titulo) between 1 and 120),
  contenido text not null check (char_length(contenido) between 1 and 1500),
  -- Solo se inserta después de la confirmación específica del docente.
  consentido_en timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists camila_memorias_docente_fecha_idx
  on public.camila_memorias (teacher_id, updated_at desc);

alter table public.camila_conversaciones enable row level security;
alter table public.camila_memorias enable row level security;

-- Supabase puede otorgar permisos amplios por defecto en public.
-- Retirarlos de PUBLIC, anon y authenticated antes de conceder solo lo necesario.
revoke all on public.camila_conversaciones from public, anon, authenticated;
revoke all on public.camila_memorias from public, anon, authenticated;
grant select, insert, update, delete on public.camila_conversaciones to authenticated;
grant select, insert, update, delete on public.camila_memorias to authenticated;

create policy "Camila conversaciones: consultar propias"
  on public.camila_conversaciones for select to authenticated
  using ((select auth.uid()) = teacher_id);
create policy "Camila conversaciones: crear propias"
  on public.camila_conversaciones for insert to authenticated
  with check ((select auth.uid()) = teacher_id);
create policy "Camila conversaciones: editar propias"
  on public.camila_conversaciones for update to authenticated
  using ((select auth.uid()) = teacher_id)
  with check ((select auth.uid()) = teacher_id);
create policy "Camila conversaciones: borrar propias"
  on public.camila_conversaciones for delete to authenticated
  using ((select auth.uid()) = teacher_id);

create policy "Camila memorias: consultar propias"
  on public.camila_memorias for select to authenticated
  using ((select auth.uid()) = teacher_id);
create policy "Camila memorias: crear propias"
  on public.camila_memorias for insert to authenticated
  with check ((select auth.uid()) = teacher_id);
create policy "Camila memorias: editar propias"
  on public.camila_memorias for update to authenticated
  using ((select auth.uid()) = teacher_id)
  with check ((select auth.uid()) = teacher_id);
create policy "Camila memorias: borrar propias"
  on public.camila_memorias for delete to authenticated
  using ((select auth.uid()) = teacher_id);
