import type { ContenidoDominio, EjemploResueltoContenido } from './contenido.ts';
import type { PeticionDominio } from './peticiones.ts';
import type { Resultado } from './resultado.ts';

// Material del dominio y borradores que redacta una IA (MATE, plan §17.6). Nada de lo que está en el
// borrador llega a una sesión: las sesiones solo leen `contenido/<dominio>.json` (MATE-6).

/** Un ejemplo resuelto del borrador para un objetivo que ya está aprobado: va aparte, con su objetivo. */
export interface EjemploDeObjetivoAprobado extends EjemploResueltoContenido {
  readonly objetivo: string;
}

/**
 * `contenido/borradores/<dominio>.json`: el formato del contenido, con las piezas pendientes de revisar.
 * Los ejemplos de un objetivo nuevo van dentro de él; los de un objetivo ya aprobado, en `ejemplos_resueltos`.
 */
export interface BorradorDominio extends ContenidoDominio {
  readonly ejemplos_resueltos?: readonly EjemploDeObjetivoAprobado[];
}

/** Material que añade la persona: un fichero (PDF, PPTX o DOCX) o una URL (MATE-1.1). */
type PeticionMaterial =
  | { readonly dominio: string; readonly nombre: string; readonly bytes: Uint8Array }
  | { readonly dominio: string; readonly url: string };

/** Marcas que pone la aplicación, no la IA (MATE-3): «No está en tu material» y «Cita no encontrada». */
type Marca = 'sin_fuente' | 'cita_no_encontrada';

/** Filtros de la revisión (MATE-4.2): todas las pendientes, o solo las que llevan una marca. */
type FiltroRevision = 'pendientes' | Marca;

interface PiezaPendiente {
  readonly id: string;
  readonly tipo: 'objetivo' | 'ejemplo' | 'item' | 'tarea';
  readonly marcas: readonly Marca[];
}

interface GrupoRevision {
  /** Objetivo del que cuelgan las piezas; ausente en las que no cuelgan de ninguno, como las tareas. */
  readonly objetivo?: string;
  readonly piezas: readonly PiezaPendiente[];
}

/** La pantalla «Revisión del material»: las piezas pendientes, agrupadas por objetivo (MATE-4.1). */
interface Revision {
  readonly grupos: readonly GrupoRevision[];
  /** Las piezas sin marca, que son las que se aprueban en bloque; 0 si no hay ninguna (MATE-5). */
  readonly aprobablesEnBloque: number;
}

/** La hoja de «Ver fuente»: el fragmento dentro del texto de su lugar (MATE-4.3). */
interface FuenteAbierta {
  readonly documento: string;
  readonly lugar: string;
  readonly fragmento: string;
  /** El texto entero del lugar citado (la página, la diapositiva o el apartado). */
  readonly texto: string;
}

/** Lo que la aplicación hizo con el borrador que entregó la IA (MATE-2.3). */
interface BorradorRedactado {
  /** Una por pieza apartada: la propiedad del formato del contenido que le falta (`feedback`, `pasos`…). */
  readonly apartadas: readonly { readonly falta: string }[];
}

interface PeticionPieza {
  readonly dominio: string;
  readonly pieza: string;
}

export interface CasosDeMaterial {
  /**
   * Añade un fichero o una URL al material. PPTX y DOCX se guardan también en PDF, convertidos con
   * LibreOffice; de una URL se guarda una copia (MATE-1). Rechaza con `causa` `falta_libreoffice` o
   * `tipo_no_admitido`.
   */
  anadirMaterial(peticion: PeticionMaterial): Promise<Resultado<null>>;
  /** El material del dominio: los nombres de los ficheros y las URL, tal como se añadieron. */
  listarMaterial(peticion: PeticionDominio): Resultado<readonly string[]>;
  /** La IA configurada redacta piezas a partir de un documento del material (MATE-2). Sin IA, `causa` `sin_ia`. */
  redactarBorrador(peticion: { readonly dominio: string; readonly documento: string }): Promise<Resultado<BorradorRedactado>>;
  abrirRevision(peticion: { readonly dominio: string; readonly filtro?: FiltroRevision }): Resultado<Revision>;
  /**
   * «Ver fuente» de una pieza del borrador o de un ítem aprobado. En una sesión, solo después de que la
   * persona responda (MATE-7.1); sin fuente, se rechaza (MATE-7.3).
   */
  verFuente(peticion: PeticionPieza): Resultado<FuenteAbierta>;
  /** Pasa la pieza del borrador al contenido aprobado, con su fuente (MATE-4.4). */
  aprobarPieza(peticion: PeticionPieza): Resultado<null>;
  /** «Aprobar las N sin marca»: las marcadas siguen pendientes (MATE-5.2). */
  aprobarSinMarca(peticion: PeticionDominio): Resultado<null>;
  descartarPieza(peticion: PeticionPieza): Resultado<null>;
  /**
   * Sustituye la pieza por la corregida, que sigue pendiente (MATE-4.6). Si no cumple el formato del
   * contenido, no la guarda y rechaza con el `campo` que falta (MATE-4.8).
   */
  corregirPieza(peticion: PeticionPieza & { readonly corregida: unknown }): Resultado<null>;
  /** Deshace la última aprobación, descarte o corrección (MATE-4.9, MATE-4.10). */
  deshacer(peticion: PeticionDominio): Resultado<null>;
}
