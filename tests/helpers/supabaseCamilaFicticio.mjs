// Cliente PostgREST mínimo y enteramente en memoria para pruebas de Camila.
// Imita el filtrado RLS por auth.uid(), pero NO reemplaza una prueba en Postgres.
export function crearSupabaseCamilaFicticio() {
  const tablas = { camila_conversaciones: [], camila_memorias: [] };
  let siguienteId = 1;

  const clientePara = (usuarioId, { esquemaDisponible = true } = {}) => ({
    from(tabla) {
      if (!Object.hasOwn(tablas, tabla)) throw new Error('Tabla de prueba desconocida');
      let accion = 'select';
      let valores = null;
      let campos = '*';
      let devolverFilas = true;
      let filtros = [];
      let ordenarPor = null;
      let ascendente = true;
      let maximo = Infinity;

      const consulta = {
        select(columnas) {
          campos = columnas;
          devolverFilas = true;
          return consulta;
        },
        insert(datos) {
          accion = 'insert'; valores = datos; devolverFilas = false;
          return consulta;
        },
        update(datos) {
          accion = 'update'; valores = datos; devolverFilas = false;
          return consulta;
        },
        delete() {
          accion = 'delete'; devolverFilas = false;
          return consulta;
        },
        eq(campo, valor) {
          filtros.push([campo, valor]);
          return consulta;
        },
        order(campo, opciones = {}) {
          ordenarPor = campo;
          ascendente = opciones.ascending !== false;
          return consulta;
        },
        limit(cantidad) {
          maximo = cantidad;
          return consulta;
        },
        single() {
          return Promise.resolve(ejecutar(true));
        },
        then(resolver, rechazar) {
          return Promise.resolve().then(() => ejecutar(false)).then(resolver, rechazar);
        },
      };

      function ejecutar(unico) {
        if (!esquemaDisponible) {
          return { data: null, error: { code: '42P01', message: `relation ${tabla} does not exist` } };
        }
        const filas = tablas[tabla];
        const autorizadas = filas.filter((fila) =>
          fila.teacher_id === usuarioId && filtros.every(([campo, valor]) => fila[campo] === valor));
        let resultado = autorizadas;

        if (accion === 'insert') {
          if (valores.teacher_id !== usuarioId) {
            return { data: null, error: { code: '42501', message: 'RLS: acceso denegado' } };
          }
          const ahora = new Date().toISOString();
          const fila = { id: `00000000-0000-4000-8000-${String(siguienteId++).padStart(12, '0')}`,
            created_at: ahora, updated_at: ahora, ...structuredClone(valores) };
          filas.push(fila);
          resultado = [fila];
        } else if (accion === 'update') {
          for (const fila of autorizadas) Object.assign(fila, structuredClone(valores));
        } else if (accion === 'delete') {
          for (const fila of autorizadas) filas.splice(filas.indexOf(fila), 1);
        }

        if (!devolverFilas) return { data: null, error: null };
        if (ordenarPor) {
          resultado = [...resultado].sort((a, b) =>
            (String(a[ordenarPor]).localeCompare(String(b[ordenarPor]))) * (ascendente ? 1 : -1));
        }
        const proyectar = (fila) => campos === '*' ? structuredClone(fila) :
          Object.fromEntries(campos.split(',').map((campo) => [campo, structuredClone(fila[campo])]));
        const datos = resultado.slice(0, maximo).map(proyectar);
        if (unico) return datos.length === 1 ? { data: datos[0], error: null } :
          { data: null, error: { code: 'PGRST116', message: '0 rows' } };
        return { data: datos, error: null };
      }

      return consulta;
    },
  });

  return { clientePara };
}
