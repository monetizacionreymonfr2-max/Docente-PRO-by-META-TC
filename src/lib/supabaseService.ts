import { supabase } from './supabase';

export interface SupabaseUserProfile {
  id: string;
  email: string;
  is_active: boolean;
  role: 'admin' | 'teacher';
  generations_count: number;
  access_level: 'guest' | 'pro';
  activation_code: string | null;
  expires_at: string | null;
  created_at?: string;
}

export interface SupabaseStudent {
  id?: string;
  nombre: string;
  apellidos?: string;
  grado_seccion: string;
  nivel: 'Primaria' | 'Maternal' | 'Preescolar' | 'Media';
  fecha_nacimiento: string;
  sexo: 'V' | 'H';
  docente_id: string;
  created_at?: string;
}

export interface SupabaseAttendance {
  id: string; // Composite ID date_studentId or UUID
  student_id: string;
  student_name: string;
  date: string;
  estado: 'asistio' | 'falto' | 'justificado' | 'retardo';
  teacher_id: string;
}

export interface SupabasePlanificacion {
  id?: string;
  titulo: string;
  proyecto?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  nivel?: string;
  diagnostico?: string;
  proposito?: string;
  estrategias?: string;
  recursos?: string;
  evaluacion?: string;
  planes_diarios?: any; // jsonb
  teacher_id: string;
  created_at?: string;
}

export interface SupabaseCamilaLog {
  id?: string;
  student_id: string;
  student_name?: string;
  notes: string;
  category: string;
  teacher_id: string;
  created_at?: string;
}

export interface SupabaseMaternalReport {
  id?: string;
  student_id: string;
  student_name: string;
  date?: string;
  alimentacion?: string;
  sueno?: string;
  evacuacion?: string;
  higiene?: string;
  observaciones?: string;
  teacher_id: string;
  created_at?: string;
}

export interface SupabasePPA {
  id?: string;
  student_id: string;
  student_name?: string;
  teacher_id: string;
  objetivos?: string;
  metas?: string;
  diagnostico?: string;
  evaluacion?: string;
  created_at?: string;
}

export interface SupabaseReport {
  id?: string;
  student_id: string;
  student_name: string;
  tipo: string;
  contenido: string;
  teacher_id: string;
  created_at?: string;
}

export interface SupabaseActivationCode {
  id: string;
  status: 'disponible' | 'usado';
  access_level: 'guest' | 'pro';
  used_by: string | null;
  used_by_email: string | null;
  expires_at: string | null;
  created_at?: string;
}

/**
 * UTILS & BRIDGES FOR ALL SUPABASE DATABASE INTERACTION
 */
export const SupabaseService = {
  // --- BLACKLIST & SECURITY ---
  async isEmailBanned(email: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('blacklist')
        .select('email')
        .eq('email', email.trim().toLowerCase())
        .maybeSingle();
      if (error) return false;
      return !!data;
    } catch {
      return false;
    }
  },

  async banEmail(email: string, bannedBy: string): Promise<void> {
    const cleanMail = email.trim().toLowerCase();
    const res = await fetch('/api/admin/blacklist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanMail, bannedBy })
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to ban email');
    }
  },

  async unbanEmail(email: string): Promise<void> {
    const res = await fetch(`/api/admin/blacklist/${encodeURIComponent(email.trim().toLowerCase())}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to unban email');
    }
  },

  async getBlacklist(): Promise<any[]> {
    const res = await fetch('/api/admin/blacklist');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch blacklist');
    return (data || []).map((b: any) => ({
      id: b.email,
      email: b.email,
      bannedBy: b.banned_by,
      createdAt: b.created_at ? { toDate: () => new Date(b.created_at) } : null
    }));
  },

  // --- USER PROFILES ---
  async getUserProfile(uid: string, email?: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .maybeSingle();
    
    if (error) {
      console.warn("Error retrieving profile from Supabase by ID:", error);
      return null;
    }
    
    if (data) {
      return {
        email: data.email,
        isActive: data.is_active,
        role: data.role,
        generationsCount: data.generations_count || 0,
        access_level: data.access_level,
        activationCode: data.activation_code,
        expiresAt: data.expires_at,
        createdAt: data.created_at
      };
    }

    // Self-healing check: If not found by ID, but we have an email,
    // look for a profile with the same email (which might belong to an old session/auth ID)
    if (email) {
      const cleanEmail = email.trim().toLowerCase();
      try {
        const { data: sameEmailProfile, error: emailError } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', cleanEmail)
          .maybeSingle();

        if (sameEmailProfile && !emailError && sameEmailProfile.id !== uid) {
          // We found a profile with the same email but a different ID!
          // Adopt it to migrate all their active status and data to the new UID!
          const adopted = await this.adoptProfile(sameEmailProfile.id, uid, cleanEmail);
          if (adopted) return adopted;
        }
      } catch (err) {
        console.warn("Error checking for profile by email during self-healing:", err);
      }
    }

    return null;
  },

  async adoptProfile(oldUid: string, newUid: string, email: string): Promise<any | null> {
    try {
      console.log(`[Self-Healing] Adopting profile: migrating from old ID ${oldUid} to new ID ${newUid} for email ${email}`);

      // 1. Get the old profile data
      const { data: oldProfile, error: getErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', oldUid)
        .maybeSingle();

      if (getErr || !oldProfile) return null;

      // 2. Create the new profile with the old profile's data
      const { error: insertErr } = await supabase.from('profiles').insert({
        id: newUid,
        email: email.trim().toLowerCase(),
        is_active: oldProfile.is_active,
        role: oldProfile.role || 'teacher',
        generations_count: oldProfile.generations_count || 0,
        access_level: oldProfile.access_level || 'pro',
        activation_code: oldProfile.activation_code || null,
        expires_at: oldProfile.expires_at || null,
        created_at: oldProfile.created_at || new Date().toISOString()
      });

      if (insertErr) {
        console.error("[Self-Healing] Failed to insert new adopted profile:", insertErr);
        // If it failed because a profile already exists for newUid, we'll just update it
        await supabase.from('profiles').update({
          is_active: oldProfile.is_active,
          access_level: oldProfile.access_level,
          activation_code: oldProfile.activation_code,
          expires_at: oldProfile.expires_at
        }).eq('id', newUid);
      }

      // 3. Migrate related data in other tables from oldUid to newUid
      const tablesToMigrate = [
        { name: 'estudiantes', col: 'docente_id' },
        { name: 'informes_maternal', col: 'teacher_id' },
        { name: 'asistencia', col: 'teacher_id' },
        { name: 'planificaciones', col: 'teacher_id' },
        { name: 'ppa', col: 'teacher_id' },
        { name: 'reportes', col: 'teacher_id' },
        { name: 'camila_logs', col: 'teacher_id' }
      ];

      for (const t of tablesToMigrate) {
        try {
          const { error: migrationError } = await supabase
            .from(t.name)
            .update({ [t.col]: newUid })
            .eq(t.col, oldUid);
          
          if (migrationError) {
            console.warn(`[Self-Healing] Table ${t.name} migration partial or failed:`, migrationError.message);
          } else {
            console.log(`[Self-Healing] Migrated table ${t.name} successfully`);
          }
        } catch (e) {
          console.warn(`[Self-Healing] Error migrating table ${t.name}:`, e);
        }
      }

      // 4. Delete the old profile row to keep the database clean
      const { error: deleteErr } = await supabase.from('profiles').delete().eq('id', oldUid);
      if (deleteErr) {
        console.warn("[Self-Healing] Failed to delete old profile row:", deleteErr);
      }

      // 5. Return the newly created/updated profile
      return await this.getUserProfile(newUid);
    } catch (err) {
      console.error("[Self-Healing] Error in adoptProfile:", err);
      return null;
    }
  },

  async createUserProfile(uid: string, profile: any): Promise<void> {
    const payload = {
      id: uid,
      email: (profile.email || '').trim().toLowerCase(),
      is_active: profile.isActive ?? false,
      role: profile.role || 'teacher',
      generations_count: profile.generationsCount || 0,
      access_level: profile.access_level || 'pro',
      activation_code: profile.activationCode || null,
      expires_at: profile.expiresAt || null,
      created_at: new Date().toISOString()
    };
    
    // Use insert instead of upsert to prevent overwriting active profiles!
    const { error } = await supabase.from('profiles').insert(payload);
    if (error) {
      // If it's a unique key violation (profile already exists), we can safely ignore it
      if (error.code === '23505' || error.message?.includes('duplicate key') || error.message?.includes('already exists')) {
        console.log("[Profiles] Profile already exists, skipping creation to preserve status.");
        return;
      }
      throw error;
    }
  },

  async incrementGenerationsCount(uid: string, inc: number = 1): Promise<void> {
    // Correct way in Supabase: select current value then update, or use rpc function increment_generation
    const { data, error: fetchErr } = await supabase.from('profiles').select('generations_count').eq('id', uid).maybeSingle();
    if (fetchErr) return;
    const current = data?.generations_count || 0;
    await supabase.from('profiles').update({ generations_count: current + inc }).eq('id', uid);
  },

  async updateProfileRole(uid: string, role: 'admin' | 'teacher'): Promise<void> {
    const res = await fetch(`/api/admin/users/${uid}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to update role');
    }
  },

  async updateProfileActive(uid: string, is_active: boolean): Promise<void> {
    const res = await fetch(`/api/admin/users/${uid}/active`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: is_active })
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to update active status');
    }
  },

  async updateProfileAccessLevel(uid: string, access_level: 'guest' | 'pro'): Promise<void> {
    const res = await fetch(`/api/admin/users/${uid}/access`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_level })
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to update access level');
    }
  },

  async updateProfileSubscription(uid: string, days: number, expiresAtStr?: string, codeId?: string, userEmail?: string): Promise<any> {
    const res = await fetch(`/api/admin/users/${uid}/subscription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ days, expiresAtStr, codeId, userEmail })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update subscription');
    return data.newExpiresAtISO;
  },

  async setExactSubscription(params: {
    uid?: string;
    email?: string;
    codeId?: string;
    daysToAdd?: number;
    monthsToAdd?: number;
    exactDaysFromNow?: number;
    exactDateISO?: string;
    isLifetime?: boolean;
    currentExpiresAtStr?: string;
  }): Promise<{ newExpiresAtISO: string; daysRemaining: number }> {
    const uid = params.uid || 'global';
    const res = await fetch(`/api/admin/users/${uid}/subscription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to set exact subscription');
    return data;
  },

  async grantLifetimeAccess(uid: string, codeId?: string, userEmail?: string): Promise<any> {
    const res = await fetch(`/api/admin/users/${uid}/subscription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isLifetime: true, codeId, userEmail })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to grant lifetime access');
    return data.newExpiresAtISO;
  },

  async deleteUserProfile(uid: string): Promise<void> {
    const res = await fetch(`/api/admin/users/${uid}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to delete user profile');
    }
  },

  async getUsersProfiles(): Promise<any[]> {
    const res = await fetch('/api/admin/users');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch users profiles');
    return (data || []).map((d: any) => ({
      id: d.id,
      email: d.email,
      isActive: d.is_active,
      role: d.role,
      generationsCount: d.generations_count || 0,
      access_level: d.access_level,
      activationCode: d.activation_code,
      expiresAt: d.expires_at,
      createdAt: d.created_at
    }));
  },

  // --- ACTIVATION CODES ---
  async getActivationCodes(): Promise<any[]> {
    const res = await fetch('/api/admin/codes');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch activation codes');
    return (data || []).map((c: any) => ({
      id: c.id,
      code: c.id,
      status: c.status,
      access_level: c.access_level,
      usedBy: c.used_by,
      usedByEmail: c.used_by_email,
      expiresAt: c.expires_at,
      createdAt: c.created_at
    }));
  },

  async generateCode(codeId: string, level: 'guest' | 'pro'): Promise<void> {
    const res = await fetch('/api/admin/codes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codeId, level })
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to generate code');
    }
  },

  async deleteCode(codeId: string): Promise<void> {
    const res = await fetch(`/api/admin/codes/${encodeURIComponent(codeId)}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to delete code');
    }
  },

  async claimActivationCode(codeId: string, userId: string, userEmail: string): Promise<{ success: boolean; message: string }> {
    try {
      // 1. Fetch activation code
      const { data: code, error: codeError } = await supabase
        .from('activation_codes')
        .select('*')
        .eq('id', codeId.trim().toUpperCase())
        .maybeSingle();

      if (codeError) throw codeError;
      if (!code) {
        return { success: false, message: 'El código ingresado no existe.' };
      }

      if (code.status !== 'disponible') {
        return { success: false, message: 'Este código ya ha sido utilizado.' };
      }

      const expires = new Date();
      if (code.access_level === 'pro') {
        expires.setDate(expires.getDate() + 30); // 30 days
      } else {
        expires.setDate(expires.getDate() + 15); // 15 days
      }

      const expiresISO = expires.toISOString();

      // Update code
      const { error: updateCodeErr } = await supabase.from('activation_codes').update({
        status: 'usado',
        used_by: userId,
        used_by_email: userEmail.trim().toLowerCase(),
        expires_at: expiresISO
      }).eq('id', code.id);

      if (updateCodeErr) throw updateCodeErr;

      // Update profile or insert if it doesn't exist to avoid 0-row updates when a profile row is missing
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      let profileError;
      if (existingProfile) {
        const { error } = await supabase.from('profiles').update({
          is_active: true,
          access_level: code.access_level,
          activation_code: code.id,
          expires_at: expiresISO
        }).eq('id', userId);
        profileError = error;
      } else {
        const { error } = await supabase.from('profiles').insert({
          id: userId,
          email: userEmail.trim().toLowerCase(),
          is_active: true,
          role: 'teacher',
          generations_count: 0,
          access_level: code.access_level,
          activation_code: code.id,
          expires_at: expiresISO,
          created_at: new Date().toISOString()
        });
        profileError = error;
      }

      if (profileError) throw profileError;

      return { success: true, message: `¡Activado exitosamente! Tienes acceso nivel: ${code.access_level.toUpperCase()}` };
    } catch (err: any) {
      return { success: false, message: `Error al canjear código: ${err?.message || err}` };
    }
  },

  // --- ESTUDIANTES ---
  async getEstudiantes(teacherId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('estudiantes')
      .select('*')
      .eq('docente_id', teacherId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(c => ({
      id: c.id,
      nombre: c.nombre,
      apellidos: c.apellidos || '',
      gradoSeccion: c.grado_seccion,
      nivel: c.nivel,
      fechaNacimiento: c.fecha_nacimiento,
      sexo: c.sexo,
      createdAt: c.created_at
    }));
  },

  async addEstudiante(student: Omit<SupabaseStudent, 'docente_id'>, teacherId: string): Promise<string> {
    const id = crypto.randomUUID();
    const { error } = await supabase.from('estudiantes').insert({
      id,
      nombre: student.nombre,
      apellidos: student.apellidos || '',
      grado_seccion: student.grado_seccion,
      nivel: student.nivel,
      fecha_nacimiento: student.fecha_nacimiento,
      sexo: student.sexo,
      docente_id: teacherId,
      created_at: new Date().toISOString()
    });
    if (error) throw error;
    return id;
  },

  async updateEstudiante(id: string, student: Partial<SupabaseStudent>): Promise<void> {
    const payload: any = {};
    if (student.nombre !== undefined) payload.nombre = student.nombre;
    if (student.apellidos !== undefined) payload.apellidos = student.apellidos;
    if (student.grado_seccion !== undefined) payload.grado_seccion = student.grado_seccion;
    if (student.nivel !== undefined) payload.nivel = student.nivel;
    if (student.fecha_nacimiento !== undefined) payload.fecha_nacimiento = student.fecha_nacimiento;
    if (student.sexo !== undefined) payload.sexo = student.sexo;

    const { error } = await supabase.from('estudiantes').update(payload).eq('id', id);
    if (error) throw error;
  },

  async deleteEstudiante(id: string): Promise<void> {
    const { error } = await supabase.from('estudiantes').delete().eq('id', id);
    if (error) throw error;
  },

  // --- MATERNAL ---
  async getMaternalReports(teacherId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('informes_maternal')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(r => ({
      id: r.id,
      studentId: r.student_id,
      studentName: r.student_name,
      date: r.date,
      alimentacion: r.alimentacion,
      sueno: r.sueno,
      evacuacion: r.evacuacion,
      higiene: r.higiene,
      observaciones: r.observaciones,
      createdAt: r.created_at
    }));
  },

  async addMaternalReport(report: any, teacherId: string): Promise<string> {
    const id = crypto.randomUUID();
    const { error } = await supabase.from('informes_maternal').insert({
      id,
      student_id: report.studentId,
      student_name: report.studentName,
      date: report.date,
      alimentacion: report.alimentacion,
      sueno: report.sueno,
      evacuacion: report.evacuacion,
      higiene: report.higiene,
      observaciones: report.observaciones,
      teacher_id: teacherId,
      created_at: new Date().toISOString()
    });
    if (error) throw error;
    return id;
  },

  async updateMaternalReport(id: string, report: any): Promise<void> {
    const { error } = await supabase.from('informes_maternal').update({
      alimentacion: report.alimentacion,
      sueno: report.sueno,
      evacuacion: report.evacuacion,
      higiene: report.higiene,
      observaciones: report.observaciones,
      date: report.date
    }).eq('id', id);
    if (error) throw error;
  },

  async deleteMaternalReport(id: string): Promise<void> {
    const { error } = await supabase.from('informes_maternal').delete().eq('id', id);
    if (error) throw error;
  },

  // --- ASISTENCIA ---
  async getAsistencia(teacherId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('asistencia')
      .select('*')
      .eq('teacher_id', teacherId);

    if (error) throw error;
    return (data || []).map(a => ({
      id: a.id,
      studentId: a.student_id,
      studentName: a.student_name,
      date: a.date,
      estado: a.estado,
    }));
  },

  async setAsistencia(record: SupabaseAttendance): Promise<void> {
    const { error } = await supabase.from('asistencia').upsert({
      id: record.id,
      student_id: record.student_id,
      student_name: record.student_name,
      date: record.date,
      estado: record.estado,
      teacher_id: record.teacher_id,
      created_at: new Date().toISOString()
    });
    if (error) throw error;
  },

  // --- PLANIFICACION / PLANNER ---
  async getPlanificaciones(teacherId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('planificaciones')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(p => ({
      id: p.id,
      titulo: p.titulo,
      proyecto: p.proyecto || '',
      fechaInicio: p.fecha_inicio || '',
      fechaFin: p.fecha_fin || '',
      nivel: p.nivel || '',
      diagnostico: p.diagnostico || '',
      proposito: p.proposito || '',
      estrategias: p.estrategias || '',
      recursos: p.recursos || '',
      evaluacion: p.evaluacion || '',
      planesDiarios: p.planes_diarios || [],
      createdAt: p.created_at
    }));
  },

  async addPlanificacion(planner: any, teacherId: string): Promise<string> {
    const id = crypto.randomUUID();
    const { error } = await supabase.from('planificaciones').insert({
      id,
      titulo: planner.titulo,
      proyecto: planner.proyecto || '',
      fecha_inicio: planner.fechaInicio || '',
      fecha_fin: planner.fechaFin || '',
      nivel: planner.nivel || '',
      diagnostico: planner.diagnostico || '',
      proposito: planner.proposito || '',
      estrategias: planner.estrategias || '',
      recursos: planner.recursos || '',
      evaluacion: planner.evaluacion || '',
      planes_diarios: planner.planesDiarios || [],
      teacher_id: teacherId,
      created_at: new Date().toISOString()
    });
    if (error) throw error;
    return id;
  },

  async updatePlanificacion(id: string, planner: any): Promise<void> {
    const { error } = await supabase.from('planificaciones').update({
      titulo: planner.titulo,
      proyecto: planner.proyecto || '',
      fecha_inicio: planner.fechaInicio || '',
      fecha_fin: planner.fechaFin || '',
      nivel: planner.nivel || '',
      diagnostico: planner.diagnostico || '',
      proposito: planner.proposito || '',
      estrategias: planner.estrategias || '',
      recursos: planner.recursos || '',
      evaluacion: planner.evaluacion || '',
      planes_diarios: planner.planesDiarios || []
    }).eq('id', id);
    if (error) throw error;
  },

  async deletePlanificacion(id: string): Promise<void> {
    const { error } = await supabase.from('planificaciones').delete().eq('id', id);
    if (error) throw error;
  },

  // --- CAMILA (LOGS) ---
  async getCamilaLogs(teacherId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('camila_logs')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(l => ({
      id: l.id,
      studentId: l.student_id,
      studentName: l.student_name || '',
      notes: l.notes,
      category: l.category,
      createdAt: l.created_at
    }));
  },

  async addCamilaLog(log: any, teacherId: string): Promise<string> {
    const id = crypto.randomUUID();
    const { error } = await supabase.from('camila_logs').insert({
      id,
      student_id: log.studentId,
      student_name: log.studentName || '',
      notes: log.notes,
      category: log.category,
      teacher_id: teacherId,
      created_at: new Date().toISOString()
    });
    if (error) throw error;
    return id;
  },

  // --- PPA ---
  async getPPALogs(teacherId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('ppa')
      .select('*')
      .eq('teacher_id', teacherId);

    if (error) return [];
    return data.map(p => ({
      id: p.id,
      studentId: p.student_id,
      studentName: p.student_name || '',
      teacherId: p.teacher_id,
      objetivos: p.objetivos || '',
      metas: p.metas || '',
      diagnostico: p.diagnostico || '',
      evaluacion: p.evaluacion || ''
    }));
  },

  async setPPA(record: SupabasePPA): Promise<void> {
    const { error } = await supabase.from('ppa').upsert({
      id: record.id || `${record.teacher_id}_${record.student_id}`,
      student_id: record.student_id,
      student_name: record.student_name || '',
      teacher_id: record.teacher_id,
      objetivos: record.objetivos || '',
      metas: record.metas || '',
      diagnostico: record.diagnostico || '',
      evaluacion: record.evaluacion || '',
      created_at: new Date().toISOString()
    });
    if (error) throw error;
  },

  // --- REPORTES ---
  async getReportes(teacherId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('reportes')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false });

    if (error) return [];
    return data.map(r => ({
      id: r.id,
      studentId: r.student_id,
      studentName: r.student_name,
      tipo: r.tipo,
      contenido: r.contenido,
      createdAt: r.created_at
    }));
  },

  async addReporte(report: SupabaseReport): Promise<string> {
    const id = report.id || crypto.randomUUID();
    const { error } = await supabase.from('reportes').insert({
      id,
      student_id: report.student_id,
      student_name: report.student_name,
      tipo: report.tipo,
      contenido: report.contenido,
      teacher_id: report.teacher_id,
      created_at: new Date().toISOString()
    });
    if (error) throw error;
    return id;
  },

  async deleteReporte(id: string): Promise<void> {
    const { error } = await supabase.from('reportes').delete().eq('id', id);
    if (error) throw error;
  }
};
