export type TipoDocumentoFormato =
  | 'PPA'
  | 'planificacion_diaria'
  | 'planificacion_semanal'
  | 'planificacion_mensual';

export interface FormatoEncabezado {
  institucion?: string;
  docente?: string;
  grado?: string;
  seccion?: string;
  anoEscolar?: string;
  tituloDocumento?: string;
  subtitulo?: string;
}

export interface FormatoSeccion {
  id: string;
  titulo: string; // Título EXACTO como aparece en el formato
  tipo: 'campo' | 'parrafo' | 'tabla' | 'lista';
  columnas?: string[]; // Columnas exactas si es tipo tabla
  filasSugeridas?: number;
  instruccion?: string;
}

export interface FormatoEstilo {
  colorPrincipal: string; // Código hexadecimal, ej: #1e3a8a
  colorSecundario?: string; // Color para encabezados de tabla o fondos
  fuente?: string; // Familia tipográfica
  bordes?: string; // solido, fino, cuadricula
  piePagina?: string;
}

export interface FormatoEstructura {
  tipoDocumento: TipoDocumentoFormato;
  orientacion: 'vertical' | 'horizontal';
  encabezado: FormatoEncabezado;
  secciones: FormatoSeccion[];
  estilo: FormatoEstilo;
  resumenPedagogico?: string;
}

export interface FormatoDocente {
  id: string;
  teacherId: string;
  nombre: string;
  tipoDocumento: TipoDocumentoFormato;
  archivoOriginalNombre: string;
  archivoMimeType: string;
  tamanoBytes: number;
  estructura: FormatoEstructura;
  createdAt: string;
  updatedAt: string;
}

export interface SeccionGenerada {
  seccionId: string;
  titulo: string;
  tipo: 'campo' | 'parrafo' | 'tabla' | 'lista';
  contenidoTexto?: string;
  contenidoTabla?: string[][]; // Matriz de filas y celdas
  contenidoLista?: string[];
}

export interface DocumentoGeneradoFormato {
  id: string;
  formatoId: string;
  formatoNombre: string;
  teacherId: string;
  tipoDocumento: TipoDocumentoFormato;
  tituloProyecto: string;
  datosGenerales: Record<string, string>;
  estructura: FormatoEstructura;
  secciones: SeccionGenerada[];
  createdAt: string;
}
