-- ==========================================
-- SUPABASE RLS SCHEMA & SECURITY POLICIES
-- ==========================================

-- 1. Enable Row Level Security (RLS) on all tables
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

-- 2. Profiles Policies
-- Users can only read and update their own profile row based on auth.uid()
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 3. Estudiantes Policies
DROP POLICY IF EXISTS "Teachers can manage own students" ON estudiantes;
CREATE POLICY "Teachers can manage own students" ON estudiantes
  FOR ALL USING (auth.uid() = docente_id) WITH CHECK (auth.uid() = docente_id);

-- 4. Informes Maternal Policies
DROP POLICY IF EXISTS "Teachers can manage own maternal reports" ON informes_maternal;
CREATE POLICY "Teachers can manage own maternal reports" ON informes_maternal
  FOR ALL USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);

-- 5. Asistencia Policies
DROP POLICY IF EXISTS "Teachers can manage own attendance" ON asistencia;
CREATE POLICY "Teachers can manage own attendance" ON asistencia
  FOR ALL USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);

-- 6. Planificaciones Policies
DROP POLICY IF EXISTS "Teachers can manage own planificaciones" ON planificaciones;
CREATE POLICY "Teachers can manage own planificaciones" ON planificaciones
  FOR ALL USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);

-- 7. Camila Logs Policies
DROP POLICY IF EXISTS "Teachers can manage own camila logs" ON camila_logs;
CREATE POLICY "Teachers can manage own camila logs" ON camila_logs
  FOR ALL USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);

-- 8. PPA Policies
DROP POLICY IF EXISTS "Teachers can manage own ppa" ON ppa;
CREATE POLICY "Teachers can manage own ppa" ON ppa
  FOR ALL USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);

-- 9. Reportes Policies
DROP POLICY IF EXISTS "Teachers can manage own reportes" ON reportes;
CREATE POLICY "Teachers can manage own reportes" ON reportes
  FOR ALL USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);

-- 10. Blacklist & Activation Codes Policies
DROP POLICY IF EXISTS "Anyone can check blacklist" ON blacklist;
CREATE POLICY "Anyone can check blacklist" ON blacklist
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can read activation codes" ON activation_codes;
CREATE POLICY "Users can read activation codes" ON activation_codes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can claim activation codes" ON activation_codes;
CREATE POLICY "Users can claim activation codes" ON activation_codes
  FOR UPDATE USING (status = 'disponible') WITH CHECK (used_by = auth.uid());
