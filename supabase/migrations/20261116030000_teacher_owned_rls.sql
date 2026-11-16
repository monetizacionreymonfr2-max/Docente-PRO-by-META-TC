-- DOCENTY PRO - Aislamiento de datos pedagógicos por docente
-- Se aplican permisos de propiedad del registro en siete tablas.
-- Los registros con IDs antiguos quedan intactos y aislados hasta verificar su propietario.
-- Sin excepciones de administración para consultar información de estudiantes.
-- Supabase service_role continúa pudiendo operar para mantenimiento autorizado.

ALTER TABLE IF EXISTS public.estudiantes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "estudiantes_access_policy" ON public.estudiantes;
CREATE POLICY "estudiantes_access_policy" ON public.estudiantes
  FOR ALL TO authenticated
  USING (docente_id = (SELECT auth.uid())::text)
  WITH CHECK (docente_id = (SELECT auth.uid())::text);
CREATE INDEX IF NOT EXISTS idx_estudiantes_owner_rls ON public.estudiantes (docente_id);

ALTER TABLE IF EXISTS public.asistencia ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "asistencia_access_policy" ON public.asistencia;
CREATE POLICY "asistencia_access_policy" ON public.asistencia
  FOR ALL TO authenticated
  USING (teacher_id = (SELECT auth.uid())::text)
  WITH CHECK (teacher_id = (SELECT auth.uid())::text);
CREATE INDEX IF NOT EXISTS idx_asistencia_owner_rls ON public.asistencia (teacher_id);

ALTER TABLE IF EXISTS public.planificaciones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "planificaciones_access_policy" ON public.planificaciones;
CREATE POLICY "planificaciones_access_policy" ON public.planificaciones
  FOR ALL TO authenticated
  USING (teacher_id = (SELECT auth.uid())::text)
  WITH CHECK (teacher_id = (SELECT auth.uid())::text);
CREATE INDEX IF NOT EXISTS idx_planificaciones_owner_rls ON public.planificaciones (teacher_id);

ALTER TABLE IF EXISTS public.ppa ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ppa_access_policy" ON public.ppa;
CREATE POLICY "ppa_access_policy" ON public.ppa
  FOR ALL TO authenticated
  USING (teacher_id = (SELECT auth.uid())::text)
  WITH CHECK (teacher_id = (SELECT auth.uid())::text);
CREATE INDEX IF NOT EXISTS idx_ppa_owner_rls ON public.ppa (teacher_id);

ALTER TABLE IF EXISTS public.reportes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reportes_access_policy" ON public.reportes;
CREATE POLICY "reportes_access_policy" ON public.reportes
  FOR ALL TO authenticated
  USING (teacher_id = (SELECT auth.uid())::text)
  WITH CHECK (teacher_id = (SELECT auth.uid())::text);
CREATE INDEX IF NOT EXISTS idx_reportes_owner_rls ON public.reportes (teacher_id);

ALTER TABLE IF EXISTS public.camila_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "camila_logs_access_policy" ON public.camila_logs;
CREATE POLICY "camila_logs_access_policy" ON public.camila_logs
  FOR ALL TO authenticated
  USING (teacher_id = (SELECT auth.uid())::text)
  WITH CHECK (teacher_id = (SELECT auth.uid())::text);
CREATE INDEX IF NOT EXISTS idx_camila_logs_owner_rls ON public.camila_logs (teacher_id);

ALTER TABLE IF EXISTS public.informes_maternal ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "informes_maternal_access_policy" ON public.informes_maternal;
CREATE POLICY "informes_maternal_access_policy" ON public.informes_maternal
  FOR ALL TO authenticated
  USING (teacher_id = (SELECT auth.uid())::text)
  WITH CHECK (teacher_id = (SELECT auth.uid())::text);
CREATE INDEX IF NOT EXISTS idx_informes_maternal_owner_rls ON public.informes_maternal (teacher_id);
