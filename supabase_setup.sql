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

-- 3. Crear Políticas de Seguridad RLS

-- Tabla PROFILES: Acceso para perfiles de usuario y administradores
CREATE POLICY "profiles_access_policy" ON profiles
    FOR ALL
    TO authenticated, anon
    USING (true)
    WITH CHECK (true);

-- Tabla ACTIVATION_CODES: Verificación y canje de códigos de activación
CREATE POLICY "activation_codes_access_policy" ON activation_codes
    FOR ALL
    TO authenticated, anon
    USING (true)
    WITH CHECK (true);

-- Tabla BLACKLIST: Verificación de correos bloqueados y gestión admin
CREATE POLICY "blacklist_access_policy" ON blacklist
    FOR ALL
    TO authenticated, anon
    USING (true)
    WITH CHECK (true);

-- Tabla ESTUDIANTES: Gestión de estudiantes por los docentes
CREATE POLICY "estudiantes_access_policy" ON estudiantes
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Tabla INFORMES_MATERNAL: Informes diarios y seguimiento maternal
CREATE POLICY "informes_maternal_access_policy" ON informes_maternal
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Tabla ASISTENCIA: Registro diario de asistencia estudiantil
CREATE POLICY "asistencia_access_policy" ON asistencia
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Tabla PLANIFICACIONES: Unidades didácticas y planes diarios
CREATE POLICY "planificaciones_access_policy" ON planificaciones
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Tabla CAMILA_LOGS: Registro de observaciones de Camila
CREATE POLICY "camila_logs_access_policy" ON camila_logs
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Tabla PPA: Proyectos Pedagógicos de Aula
CREATE POLICY "ppa_access_policy" ON ppa
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Tabla REPORTES: Boletines y reportes académicos generados
CREATE POLICY "reportes_access_policy" ON reportes
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

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
