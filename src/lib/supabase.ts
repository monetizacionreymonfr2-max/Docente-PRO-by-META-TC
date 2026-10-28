import { createClient } from '@supabase/supabase-js';
import { resolverConfigSupabase } from './supabaseConfig';

// El entorno de desarrollo o despliegue debe indicar explícitamente su base.
const { url: SUPABASE_URL, clavePublica: SUPABASE_ANON_KEY } = resolverConfigSupabase((import.meta as any).env);

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

/**
 * Diagnostic utility to verify connection with Supabase
 */
export async function testSupabaseConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const { data, error } = await supabase.from('blacklist').select('count', { count: 'exact', head: true });
    if (error) {
      // If table doesn't exist, SQL schema is missing but connection parameters are verified
      if (error.code === 'PGRST116' || error.message.includes('relation "blacklist" does not exist')) {
        return { 
          success: true, 
          message: '¡Conexión exitosa a Supabase! Las credenciales son válidas, pero necesitas crear las tablas con el script SQL provisto.' 
        };
      }
      return { success: false, message: `Error de Supabase: ${error.message} (Código: ${error.code})` };
    }
    return { success: true, message: '¡Conexión exitosa a Supabase! Base de datos sincronizada y en funcionamiento.' };
  } catch (err: any) {
    return { success: false, message: `Fallo de red o inicialización: ${err?.message || err}` };
  }
}
