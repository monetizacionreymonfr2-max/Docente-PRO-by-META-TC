type VariablesSupabase = {
  VITE_SUPABASE_URL?: unknown;
  VITE_SUPABASE_ANON_KEY?: unknown;
};

/** Evita conectarse a una base por defecto si falta la configuración del entorno. */
export function resolverConfigSupabase(entorno: VariablesSupabase): { url: string; clavePublica: string } {
  const url = typeof entorno.VITE_SUPABASE_URL === 'string' ? entorno.VITE_SUPABASE_URL.trim() : '';
  const clavePublica = typeof entorno.VITE_SUPABASE_ANON_KEY === 'string'
    ? entorno.VITE_SUPABASE_ANON_KEY.trim()
    : '';

  if (!url || !clavePublica) {
    throw new Error('Falta configurar VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY.');
  }

  let destino: URL;
  try {
    destino = new URL(url);
  } catch {
    throw new Error('VITE_SUPABASE_URL no es una URL válida.');
  }

  const esLocal = destino.hostname === 'localhost' || destino.hostname === '127.0.0.1';
  if (destino.protocol !== 'https:' && !(esLocal && destino.protocol === 'http:')) {
    throw new Error('VITE_SUPABASE_URL debe utilizar HTTPS (excepto en desarrollo local).');
  }

  return { url, clavePublica };
}
