export interface AprendizajeEsperadoItem {
  texto: string;
  oficial: boolean;
  nota?: string;
}

export interface ContenidoItem {
  id: string;
  contenido: string;
  oficial: boolean;
  notaEditorial?: string;
  aprendizajesEsperados: AprendizajeEsperadoItem[];
}

export interface ComponenteCurricular {
  nombre: string;
  contenidos: ContenidoItem[];
}

export type GradoPrimaria = '1' | '2' | '3' | '4' | '5' | '6';

export type AreaCurricular = 
  | 'Prácticas del Lenguaje' 
  | 'Matemáticas' 
  | 'Ciencias Naturales' 
  | 'Identidad';

export interface AreaData {
  nombre: AreaCurricular;
  grados: Record<GradoPrimaria, Record<string, ContenidoItem[]>>;
  perfilEgresado: string[];
}
