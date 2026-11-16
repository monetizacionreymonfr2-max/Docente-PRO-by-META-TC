-- ==============================================================================
-- DOCENTE PRO - CONFIGURACIÓN DE SEGURIDAD Y POLÍTICAS RLS EN SUPABASE
-- Proyecto: Docente Pro (tmkvodbjjlquvqtmnnwi)
-- ==============================================================================

-- 1. Habilitar RLS (Row Level Security) en todas las tablas del esquema público
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS activation_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS blacklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS estudiantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS informes_maternal ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS asistencia ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS planificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS camila_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ppa ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reportes ENABLE ROW LEVEL SECURITY;

-- 2. Limpiar políticas previas si existieran para evitar duplicados
DROP POLICY IF EXISTS "profiles_access_policy" ON profiles;
DROP POLICY IF EXISTS "activation_codes_access_policy" ON activation_codes;
DROP POLICY IF EXISTS "blacklist_access_policy" ON blacklist;
DROP POLICY IF EXISTS "estudiantes_access_policy" ON estudiantes;
DROP POLICY IF EXISTS "informes_maternal_access_policy" ON informes_maternal;
DROP POLICY IF EXISTS "asistencia_access_policy" ON asistencia;
DROP POLICY IF EXISTS "planificaciones_access_policy" ON planificaciones;
DROP POLICY IF EXISTS "camila_logs_access_policy" ON camila_logs;
DROP POLICY IF EXISTS "ppa_access_policy" ON ppa;
DROP POLICY IF EXISTS "reportes_access_policy" ON reportes;
-- Reejecutar el script no debe dejar políticas permisivas ni duplicadas.
DROP POLICY IF EXISTS profiles_select_self_or_admin ON profiles;
DROP POLICY IF EXISTS profiles_insert_admin ON profiles;
DROP POLICY IF EXISTS profiles_insert_self_unpaid ON profiles;
DROP POLICY IF EXISTS profiles_update_admin ON profiles;
DROP POLICY IF EXISTS profiles_delete_admin ON profiles;
DROP POLICY IF EXISTS activation_codes_select_admin ON activation_codes;
DROP POLICY IF EXISTS activation_codes_insert_admin ON activation_codes;
DROP POLICY IF EXISTS activation_codes_update_admin ON activation_codes;
DROP POLICY IF EXISTS activation_codes_delete_admin ON activation_codes;
DROP POLICY IF EXISTS blacklist_select_self_or_admin ON blacklist;
DROP POLICY IF EXISTS blacklist_insert_admin ON blacklist;
DROP POLICY IF EXISTS blacklist_update_admin ON blacklist;
DROP POLICY IF EXISTS blacklist_delete_admin ON blacklist;

-- 3. Crear Políticas de Seguridad RLS

-- Los permisos sobre planes y licencias se validan con auth.users, no con el cliente.
CREATE SCHEMA IF NOT EXISTS private;
CREATE OR REPLACE FUNCTION private.is_docenty_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $admin$
 SELECT EXISTS(SELECT 1 FROM auth.users u WHERE u.id=(SELECT auth.uid())
  AND lower(u.email) IN ('monetizacionreymonfr2@gmail.com','tecnomundo235@gmail.com'));
$admin$;
REVOKE ALL ON FUNCTION private.is_docenty_admin() FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_docenty_admin() TO authenticated;

-- Las cuentas únicamente pueden leer su perfil. Administración autorizada ve todos.
CREATE POLICY profiles_select_self_or_admin ON profiles FOR SELECT TO authenticated
 USING (id=(SELECT auth.uid())::text OR (SELECT private.is_docenty_admin()));
CREATE POLICY profiles_insert_admin ON profiles FOR INSERT TO authenticated
 WITH CHECK ((SELECT private.is_docenty_admin()));
CREATE POLICY profiles_insert_self_unpaid ON profiles FOR INSERT TO authenticated
 WITH CHECK (
 id=(SELECT auth.uid())::text
 AND lower(email)=lower(coalesce(auth.jwt()->>'email',''))
 AND is_active=false AND role='teacher' AND generations_count=0
 AND access_level='pro' AND plan_type='pro'
 AND activation_code IS NULL AND expires_at IS NULL
 );
CREATE POLICY profiles_update_admin ON profiles FOR UPDATE TO authenticated
 USING ((SELECT private.is_docenty_admin()))
 WITH CHECK ((SELECT private.is_docenty_admin()));
CREATE POLICY profiles_delete_admin ON profiles FOR DELETE TO authenticated
 USING ((SELECT private.is_docenty_admin()));

-- Códigos de venta: solo administración puede crear/ver/editar; canje por RPC segura.
CREATE POLICY activation_codes_select_admin ON activation_codes FOR SELECT TO authenticated
 USING ((SELECT private.is_docenty_admin()));
CREATE POLICY activation_codes_insert_admin ON activation_codes FOR INSERT TO authenticated
 WITH CHECK ((SELECT private.is_docenty_admin()));
CREATE POLICY activation_codes_update_admin ON activation_codes FOR UPDATE TO authenticated
 USING ((SELECT private.is_docenty_admin()))
 WITH CHECK ((SELECT private.is_docenty_admin()));
CREATE POLICY activation_codes_delete_admin ON activation_codes FOR DELETE TO authenticated
 USING ((SELECT private.is_docenty_admin()));

CREATE POLICY blacklist_select_self_or_admin ON blacklist FOR SELECT TO authenticated
 USING (lower(email)=lower(coalesce(auth.jwt()->>'email','')) OR (SELECT private.is_docenty_admin()));
CREATE POLICY blacklist_insert_admin ON blacklist FOR INSERT TO authenticated
 WITH CHECK ((SELECT private.is_docenty_admin()));
CREATE POLICY blacklist_update_admin ON blacklist FOR UPDATE TO authenticated
 USING ((SELECT private.is_docenty_admin()))
 WITH CHECK ((SELECT private.is_docenty_admin()));
CREATE POLICY blacklist_delete_admin ON blacklist FOR DELETE TO authenticated
 USING ((SELECT private.is_docenty_admin()));

-- Tabla ESTUDIANTES: Gestión de estudiantes por los docentes
CREATE POLICY "estudiantes_access_policy" ON estudiantes
    FOR ALL
    TO authenticated
    USING (docente_id = (SELECT auth.uid())::text)
    WITH CHECK (docente_id = (SELECT auth.uid())::text);

-- Tabla INFORMES_MATERNAL: Informes diarios y seguimiento maternal
CREATE POLICY "informes_maternal_access_policy" ON informes_maternal
    FOR ALL
    TO authenticated
    USING (teacher_id = (SELECT auth.uid())::text)
    WITH CHECK (teacher_id = (SELECT auth.uid())::text);

-- Tabla ASISTENCIA: Registro diario de asistencia estudiantil
CREATE POLICY "asistencia_access_policy" ON asistencia
    FOR ALL
    TO authenticated
    USING (teacher_id = (SELECT auth.uid())::text)
    WITH CHECK (teacher_id = (SELECT auth.uid())::text);

-- Tabla PLANIFICACIONES: Unidades didácticas y planes diarios
CREATE POLICY "planificaciones_access_policy" ON planificaciones
    FOR ALL
    TO authenticated
    USING (teacher_id = (SELECT auth.uid())::text)
    WITH CHECK (teacher_id = (SELECT auth.uid())::text);

-- Tabla CAMILA_LOGS: Registro de observaciones de Camila
CREATE POLICY "camila_logs_access_policy" ON camila_logs
    FOR ALL
    TO authenticated
    USING (teacher_id = (SELECT auth.uid())::text)
    WITH CHECK (teacher_id = (SELECT auth.uid())::text);

-- Tabla PPA: Proyectos Pedagógicos de Aula
CREATE POLICY "ppa_access_policy" ON ppa
    FOR ALL
    TO authenticated
    USING (teacher_id = (SELECT auth.uid())::text)
    WITH CHECK (teacher_id = (SELECT auth.uid())::text);

-- Tabla REPORTES: Boletines y reportes académicos generados
CREATE POLICY "reportes_access_policy" ON reportes
    FOR ALL
    TO authenticated
    USING (teacher_id = (SELECT auth.uid())::text)
    WITH CHECK (teacher_id = (SELECT auth.uid())::text);

-- ==============================================================================
-- TABLA FORMATOS_DOCENTE: Almacenamiento de formatos escolares por docente
-- ==============================================================================
CREATE TABLE IF NOT EXISTS formatos_docente (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL,
    nombre TEXT NOT NULL,
    tipo_documento TEXT NOT NULL,
    archivo_original_nombre TEXT,
    archivo_mime_type TEXT,
    tamano_bytes BIGINT DEFAULT 0,
    estructura JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE formatos_docente ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "formatos_docente_select_policy" ON formatos_docente;
DROP POLICY IF EXISTS "formatos_docente_insert_policy" ON formatos_docente;
DROP POLICY IF EXISTS "formatos_docente_update_policy" ON formatos_docente;
DROP POLICY IF EXISTS "formatos_docente_delete_policy" ON formatos_docente;

CREATE POLICY "formatos_docente_select_policy" ON formatos_docente
    FOR SELECT
    TO authenticated
    USING (auth.uid() = teacher_id);

CREATE POLICY "formatos_docente_insert_policy" ON formatos_docente
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "formatos_docente_update_policy" ON formatos_docente
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = teacher_id)
    WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "formatos_docente_delete_policy" ON formatos_docente
    FOR DELETE
    TO authenticated
    USING (auth.uid() = teacher_id);

-- Columnas adicionales para Copia Exacta de Word (.docx)
ALTER TABLE formatos_docente ADD COLUMN IF NOT EXISTS archivo_path TEXT;
ALTER TABLE formatos_docente ADD COLUMN IF NOT EXISTS plantilla JSONB;
ALTER TABLE formatos_docente ADD COLUMN IF NOT EXISTS modo TEXT DEFAULT 'reconstruir';

-- ==============================================================================
-- BUCKET DE SUPABASE STORAGE (Para archivos .docx originales)
-- ==============================================================================
-- Puedes crear el bucket privado 'formatos-originales' desde el panel de Supabase Storage:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('formatos-originales', 'formatos-originales', false) ON CONFLICT DO NOTHING;
--
-- Políticas de seguridad para el Storage de formatos originales:
-- CREATE POLICY "Docentes pueden subir sus formatos originales"
-- ON storage.objects FOR INSERT TO authenticated
-- WITH CHECK (bucket_id = 'formatos-originales' AND (storage.foldername(name))[1] = auth.uid()::text);
--
-- CREATE POLICY "Docentes pueden ver sus formatos originales"
-- ON storage.objects FOR SELECT TO authenticated
-- USING (bucket_id = 'formatos-originales' AND (storage.foldername(name))[1] = auth.uid()::text);

