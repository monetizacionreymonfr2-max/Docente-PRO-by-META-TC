/** Sólo funciones de servidor. Verificación independiente para las herramientas opcionales. */
export async function verificarAdministradorCamila(req, fetcher=fetch) {
  const authorization = req.headers?.authorization || '';
  if (typeof authorization !== 'string' || !/^Bearer [^\s]+$/.test(authorization)) {
    return { ok:false, status:401, error:'Sesión requerida' };
  }
  const url=process.env.SUPABASE_URL, anon=process.env.SUPABASE_ANON_KEY;
  if (!url || !anon) return {ok:false,status:503,error:'Autenticación no configurada'};
  const base=url.replace(/\/$/,'');
  const headers={apikey:anon,Authorization:authorization};
  try {
    const response=await fetcher(base+'/auth/v1/user',{headers,signal:AbortSignal.timeout(7000)});
    if (!response.ok) return {ok:false,status:401,error:'Sesión inválida'};
    const user=await response.json();
    if (!user?.id) return {ok:false,status:401,error:'Sesión inválida'};
    const adminEmails=new Set(['monetizacionreymonfr2@gmail.com','tecnomundo235@gmail.com']);
    if (!adminEmails.has(String(user.email||'').trim().toLowerCase())) {
      return {ok:false,status:403,error:'Herramienta exclusiva para administradores de pruebas'};
    }
    // Comprobar además que el perfil pertenece a la sesión existente.
    const profile=await fetcher(base+'/rest/v1/profiles?id=eq.'+encodeURIComponent(user.id)+'&select=id&limit=1',{
      headers,signal:AbortSignal.timeout(7000)
    });
    if (!profile.ok) return {ok:false,status:503,error:'Perfil no disponible'};
    const profiles=await profile.json();
    if (!Array.isArray(profiles)||!profiles.length) return {ok:false,status:403,error:'Perfil inexistente'};
    return {ok:true,userId:user.id};
  } catch {
    return {ok:false,status:503,error:'Servicio de autenticación no disponible'};
  }
}
