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
  { nombre: 'Panel de Estudiantes', ruta: '/students', proposito: 'Consulta y administración de información del alumnado.', pasos: ['Abra el menú lateral y toque Panel de Estudiantes.', 'Para registrar un alumno, complete Nombres, Apellidos (opcional), Nivel Educativo, Fecha de Nacimiento y Sexo.', 'Revise los datos y use la opción visible de registro.', 'El alumnado aparecerá en Lista de Estudiantes; también puede consultar el cronograma de cumpleaños. No lea datos de un alumno diferente al solicitado.'], palabras: ['estudiantes','alumnos','matricula','lista de estudiantes'] },
  { nombre: 'Gestor de PPA', ruta: '/ppa', proposito: 'Consultar y trabajar con proyectos pedagógicos de aula.', pasos: ['En el menú lateral seleccione Gestor de PPA.', 'Para preparar uno, elija Nivel Educativo, Grado Oficial y Sección.', 'Seleccione las Áreas Priorizadas y complete Duración Estimada, Tema Central y Diagnóstico o Necesidad.', 'Si dispone de contexto adicional puede colocarlo en Aporte o Contexto Adicional.', 'Genere el proyecto, revise sus datos y utilice PDF / Imprimir si desea una copia.'], palabras: ['ppa','proyecto pedagogico','proyectos de aula','gestor'] },
  { nombre: 'Educación Especial', ruta: '/especial', proposito: 'Herramientas de planificación para la modalidad de educación especial.', pasos: ['Abra Educación Especial desde el menú.', 'Complete Identificación Institucional, Servicio / Modalidad MPPE, institución, año escolar, lapso y responsable.', 'Indique Varones, Hembras, Total Grupo, Condición o Necesidad Educativa y Caracterización Diagnóstica.', 'Si se trata de taller, incluya Especialidad Socioproductiva y Mención Ocupacional.', 'Revise el Proyecto de Aprendizaje y la Matriz Curricular por Áreas con DUA y Ajustes Razonables; use Guardar o Imprimir.'], palabras: ['especial','discapacidad','tel','adaptacion','necesidades educativas'] },
  { nombre: 'Control de Asistencia', ruta: '/attendance', proposito: 'Registro y consulta de la asistencia de estudiantes.', pasos: ['En el menú lateral entre en Control de Asistencia.', 'Seleccione la Fecha y marque los registros de asistencia visibles.', 'Pulse Guardar Asistencia para conservar los cambios.', 'Para estadísticas seleccione Mes a generar y después Imprimir Estadística. Verifique la matrícula antes de imprimir.'], palabras: ['asistencia','attendance','faltas','inasistencias'] },
  { nombre: 'Sección Maternal', ruta: '/maternal', proposito: 'Actividades y planificación para educación maternal.', pasos: ['Abra Sección Maternal desde el menú.', 'Para una rutina, seleccione Alumno (Maternal) e indique Alimentación, Sueño / Descanso, Evacuación / Pañal y Actividad Realizada; use Registrar Rutina.', 'Para una planificación seleccione Formato de Planificación e indique Institución, Sala / Edad Rango, Año Escolar y fechas.', 'Continúe con Diagnóstico Contextualizado, justificación y propósito, adaptados a los niños y niñas.'], palabras: ['maternal','bebes','primera infancia','lactantes'] },
  { nombre: 'Planificador Diario', ruta: '/planner', proposito: 'Preparar y organizar planificaciones de clase.', pasos: ['Seleccione Planificador Diario en el menú lateral.', 'Primero debe existir un PPA disponible: en Proyecto Base (PPA) elija el proyecto.', 'Indique Fecha de la Clase y Tema Específico del Día.', 'Genere el plan y revise el contenido.', 'Use PDF / Imprimir si necesita una copia. Si aparece No hay Proyectos Pedagógicos, vuelva al Gestor de PPA.'], palabras: ['planificador','planificacion diaria','planificar','clases'] },
  { nombre: 'Generador de Boletines', ruta: '/reports', proposito: 'Preparación de boletines e informes escolares.', pasos: ['En el menú lateral abra Generador de Boletines.', 'Si aparece No hay Estudiantes Registrados, primero incorpórelos desde Panel de Estudiantes.', 'Elija Seleccionar Estudiante, Literal o Calificación Final y Palabras clave sobre el rendimiento.', 'Genere la Observación Final, edítela y verifique que corresponda al estudiante.', 'Compruebe Vista Previa del Boletín y después Imprimir Boletín.'], palabras: ['boletin','boletines','reportes','informes'] },
  { nombre: 'IA Camila', ruta: '/camila', proposito: 'Chat de asistencia pedagógica general.', pasos: ['Abra el menú lateral.', 'Toque IA Camila.', 'Escriba la consulta o utilice el control de voz si está habilitado.'], palabras: ['ia camila','asistente','chat','camila general'] },
  { nombre: 'Mi Formato', ruta: '/mi-formato', proposito: 'Subir, consultar y administrar formatos institucionales.', pasos: ['Abra el menú lateral.', 'Toque Mi Formato.', 'Suba el archivo Word o seleccione un formato existente.', 'Revise su estructura y abra Camila Formato para trabajarlo.'], palabras: ['mi formato','formato colegio','subir plantilla','plantilla','docx'], acceso: 'Disponible solo si la función está habilitada para la cuenta.' },
  { nombre: 'Camila Formato', ruta: '/camila-formato', proposito: 'Conversar y editar una copia de un Word con vista previa y Deshacer.', pasos: ['Abra el menú lateral y elija Camila Formato.', 'Abra un formato Word o adjunte un DOCX.', 'Explique a Camila el cambio que necesita; aparecerá en Documento.', 'Revise, use Deshacer si hace falta y descargue el Word.', 'Para conservar la conversación entre visitas, pulse Guardar chat.'], palabras: ['camila formato','word vivo','documento','vista previa','deshacer','guardar chat','llamada'], acceso: 'Funciones de voz y Mi Formato sujetas a habilitación.' },
  { nombre: 'Ganar dinero con docentes', ruta: '/earn-money', proposito: 'Información del programa de recomendación disponible en la plataforma.', pasos: ['Abra Ganar dinero con docentes desde el menú.', 'Lea Modelo de Negocio y Ganancias y Metodología de Trabajo y Control.', 'Revise la Guía Táctica y las condiciones vigentes.', 'Si decide participar, utilice UNIRME AL PROGRAMA y siga las instrucciones que muestra la plataforma.'], palabras: ['ganar dinero','referidos','recomendar','comisiones'] },
  { nombre: 'Panel SaaS Admin', ruta: '/admin', proposito: 'Administración del sistema, no accesible a docentes.', pasos: ['Esta sección aparece únicamente para administradores.', 'Los docentes deben pedir asistencia al equipo de DOCENTY PRO si necesitan una gestión administrativa.'], palabras: ['admin','administrador','panel saas'], acceso: 'Exclusivo de administradores.' },
];
const normalizar = (valor: string) => valor.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
export const GUIA_PLATAFORMA_RESUMIDA = APARTADOS_DOCENTY.map(a => `${a.nombre} → ${a.ruta}: ${a.proposito}`).join('\n');
export const GUIA_PLATAFORMA_DETALLADA = APARTADOS_DOCENTY.map(a => `${a.nombre} (${a.ruta}): ${a.pasos.join(' → ')}`).join('\n');
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