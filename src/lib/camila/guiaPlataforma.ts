/**
 * Mapa verificado con las rutas de App.tsx y el menú de Layout.tsx.
 * Una guía no es una acción: Camila orienta sin fingir que ha pulsado botones.
 */
export interface ApartadoDocenty {
  nombre: string;
  ruta: string;
  proposito: string;
  pasos: string[];
  palabras: string[];
  acceso?: string;
}
export const APARTADOS_DOCENTY: ApartadoDocenty[] = [
  { nombre: 'Inicio', ruta: '/home', proposito: 'Pantalla inicial y acceso a las funciones principales.', pasos: ['Abra el menú lateral de DOCENTY PRO.', 'Toque Inicio para volver al panel principal.'], palabras: ['inicio','principal','home','panel inicial'] },
  { nombre: 'Panel de Estudiantes', ruta: '/students', proposito: 'Consulta y administración de información del alumnado.', pasos: ['Abra el menú lateral.', 'Toque Panel de Estudiantes.', 'Seleccione el registro o la función disponible; confirme antes de editar datos personales.'], palabras: ['estudiantes','alumnos','matricula','lista de estudiantes'] },
  { nombre: 'Gestor de PPA', ruta: '/ppa', proposito: 'Consultar y trabajar con proyectos pedagógicos de aula.', pasos: ['Abra el menú lateral.', 'Seleccione Gestor de PPA.', 'Abra el proyecto que desea revisar o utilice las opciones de creación disponibles.'], palabras: ['ppa','proyecto pedagogico','proyectos de aula','gestor'] },
  { nombre: 'Educación Especial', ruta: '/especial', proposito: 'Herramientas de planificación para la modalidad de educación especial.', pasos: ['Abra el menú lateral.', 'Toque Educación Especial.', 'Elija el trabajo y la modalidad que correspondan al grupo atendido.'], palabras: ['especial','discapacidad','tel','adaptacion','necesidades educativas'] },
  { nombre: 'Control de Asistencia', ruta: '/attendance', proposito: 'Registro y consulta de la asistencia de estudiantes.', pasos: ['Abra el menú lateral.', 'Toque Control de Asistencia.', 'Seleccione el grupo y la fecha según los controles visibles antes de registrar.'], palabras: ['asistencia','attendance','faltas','inasistencias'] },
  { nombre: 'Sección Maternal', ruta: '/maternal', proposito: 'Actividades y planificación para educación maternal.', pasos: ['Abra el menú lateral.', 'Toque Sección Maternal.', 'Indique la edad del grupo y el propósito para recibir orientación pedagógica.'], palabras: ['maternal','bebes','primera infancia','lactantes'] },
  { nombre: 'Planificador Diario', ruta: '/planner', proposito: 'Preparar y organizar planificaciones de clase.', pasos: ['Abra el menú lateral.', 'Toque Planificador Diario.', 'Indique grado, área y fecha; use el formulario o las opciones que se muestren.'], palabras: ['planificador','planificacion diaria','planificar','clases'] },
  { nombre: 'Generador de Boletines', ruta: '/reports', proposito: 'Preparación de boletines e informes escolares.', pasos: ['Abra el menú lateral.', 'Toque Generador de Boletines.', 'Revise el tipo de informe y los datos antes de generar o descargar.'], palabras: ['boletin','boletines','reportes','informes'] },
  { nombre: 'IA Camila', ruta: '/camila', proposito: 'Chat de asistencia pedagógica general.', pasos: ['Abra el menú lateral.', 'Toque IA Camila.', 'Escriba la consulta o utilice el control de voz si está habilitado.'], palabras: ['ia camila','asistente','chat','camila general'] },
  { nombre: 'Mi Formato', ruta: '/mi-formato', proposito: 'Subir, consultar y administrar formatos institucionales.', pasos: ['Abra el menú lateral.', 'Toque Mi Formato.', 'Suba el archivo Word o seleccione un formato existente.', 'Revise su estructura y abra Camila Formato para trabajarlo.'], palabras: ['mi formato','formato colegio','subir plantilla','plantilla','docx'], acceso: 'Disponible solo si la función está habilitada para la cuenta.' },
  { nombre: 'Camila Formato', ruta: '/camila-formato', proposito: 'Conversar y editar una copia de un Word con vista previa y Deshacer.', pasos: ['Abra el menú lateral y elija Camila Formato.', 'Abra un formato Word o adjunte un DOCX.', 'Explique a Camila el cambio que necesita; aparecerá en Documento.', 'Revise, use Deshacer si hace falta y descargue el Word.', 'Para conservar la conversación entre visitas, pulse Guardar chat.'], palabras: ['camila formato','word vivo','documento','vista previa','deshacer','guardar chat','llamada'], acceso: 'Funciones de voz y Mi Formato sujetas a habilitación.' },
  { nombre: 'Ganar dinero con docentes', ruta: '/earn-money', proposito: 'Información del programa de recomendación disponible en la plataforma.', pasos: ['Abra el menú lateral.', 'Toque Ganar dinero con docentes.', 'Revise las condiciones que allí se muestran.'], palabras: ['ganar dinero','referidos','recomendar','comisiones'] },
  { nombre: 'Panel SaaS Admin', ruta: '/admin', proposito: 'Administración del sistema, no accesible a docentes.', pasos: ['Esta sección aparece únicamente para administradores.', 'Los docentes deben pedir asistencia al equipo de DOCENTY PRO si necesitan una gestión administrativa.'], palabras: ['admin','administrador','panel saas'], acceso: 'Exclusivo de administradores.' },
];
const normalizar = (valor: string) => valor.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
export const GUIA_PLATAFORMA_RESUMIDA = APARTADOS_DOCENTY.map(a => `${a.nombre} → ${a.ruta}: ${a.proposito}`).join('\n');
export function consultarGuiaPlataforma(consulta: string): string {
  const q = normalizar(consulta).slice(0, 180);
  if (!q || /^(menu|secciones|apartados|opciones|plataforma|que (puedes|haces))$/.test(q)) {
    return 'Menú lateral de DOCENTY PRO:\n' + GUIA_PLATAFORMA_RESUMIDA;
  }
  const resultados = APARTADOS_DOCENTY.map(a => {
    const nombre = normalizar(a.nombre);
    const palabras = a.palabras.map(normalizar);
    let puntuacion = q.includes(nombre) ? 10 : 0;
    for (const palabra of palabras) if (q.includes(palabra)) puntuacion += 4 + Math.min(palabra.length / 10, 2);
    return { a, puntuacion };
  }).filter(i => i.puntuacion > 0).sort((a,b) => b.puntuacion - a.puntuacion);
  if (!resultados.length) return 'No encontré una sección con ese nombre en el menú actual. Pregunte qué tarea quiere realizar y sugiera revisar el menú lateral; no invente controles.';
  return resultados.slice(0, 2).map(({a}) => [
    `Apartado: ${a.nombre}`, `Ruta: ${a.ruta}`, `Función: ${a.proposito}`,
    'Pasos:', ...a.pasos.map((paso, i) => `${i+1}. ${paso}`),
    a.acceso ? `Acceso: ${a.acceso}` : '',
    'No asegure haber abierto pantallas ni modificado registros. Si los botones visibles difieren, solicite una captura sin datos personales.',
  ].filter(Boolean).join('\n')).join('\n---\n');
}