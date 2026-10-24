// Puertos: lo que la aplicación necesita del exterior. Los implementa infraestructura (o, en los
// escenarios de aceptación, un doble de prueba). Todas las fechas se interpretan en UTC.

/** Reloj de la aplicación. Nadie más llama a `new Date()`: así los escenarios controlan el tiempo. */
export interface Reloj {
  ahora(): Date;
}

/**
 * Contenido de `config/parametros.json`: cada parámetro con su `valor` (además lleva sección,
 * nivel de evidencia y nota, que la aplicación no usa). Se lee en cada evaluación, sin guardarlo,
 * para que un cambio en la configuración se note enseguida.
 */
export type ParametrosJson = Readonly<Record<string, { readonly valor: unknown }>>;

export type CalificacionFsrs = 'Again' | 'Hard' | 'Good' | 'Easy';

export interface EntradaFsrs {
  /** Estado de FSRS para el ítem; `undefined` la primera vez. La aplicación no lo interpreta. */
  readonly tarjeta: unknown;
  readonly calificacion: CalificacionFsrs;
  readonly retencionObjetivo: number;
  readonly ahora: Date;
}

export interface RecalculoFsrs {
  readonly tarjeta: unknown;
  readonly retencionObjetivo: number;
  readonly ahora: Date;
}

export interface SalidaFsrs {
  readonly tarjeta: unknown;
  readonly proximoRepaso: Date;
}

/** FSRS detrás de una interfaz (plan §14, decisión 13): en producción lo implementa `ts-fsrs`. */
export interface PlanificadorFsrs {
  /** Programa el siguiente repaso de un hecho tras una respuesta. */
  programar(entrada: EntradaFsrs): SalidaFsrs;
  /** Recalcula la fecha de un repaso pendiente con la configuración actual (paso 4 del bucle). */
  recalcular(entrada: RecalculoFsrs): SalidaFsrs;
}

/**
 * Los ficheros de la aplicación, por ruta relativa a la carpeta de datos (`contenido/ficticio.json`,
 * `contenido/borradores/ficticio.json`…). Dónde guarda el material es cosa de la aplicación (plan §17.8.3).
 */
export interface Ficheros {
  /** El contenido del fichero, o `undefined` si no existe. */
  leer(ruta: string): Uint8Array | undefined;
  /** Crea el fichero o lo sustituye entero. */
  escribir(ruta: string, bytes: Uint8Array): void;
}

/** La IA que redacta borradores a partir del material (MATE-2). La aplicación nunca la usa en una sesión. */
export interface RedactorIa {
  /**
   * Redacta piezas con el formato del contenido, cada una con su `fuente`. Devuelve el JSON tal como lo
   * entrega la IA, sin validar: la aplicación aparta las piezas que no cumplen el formato (MATE-2.3).
   */
  redactar(peticion: { readonly documento: string; readonly pdf: Uint8Array }): Promise<unknown>;
}

/** LibreOffice, instalado en el PC: es un programa aparte, no una dependencia de npm (MATE-1.2). */
export interface LibreOffice {
  instalado(): Promise<boolean>;
  /** Convierte un PPTX o un DOCX a PDF. */
  convertirAPdf(nombre: string, bytes: Uint8Array): Promise<Uint8Array>;
}

export interface PaginaDescargada {
  /** La cabecera `Content-Type` tal cual (por ejemplo, `text/html; charset=utf-8`). */
  readonly tipoContenido: string;
  readonly bytes: Uint8Array;
}

export interface Web {
  /** La página de la URL, o `undefined` si no se puede descargar (ya no existe, no hay red…). */
  descargar(url: string): Promise<PaginaDescargada | undefined>;
}

/**
 * Lo que pasa en el proceso de inicio de sesión de Claude Code del PC. `salida` es lo que escribe el
 * proceso, en bruto: puede llevar credenciales, así que la aplicación solo saca de ahí el enlace (MATE-8.7).
 */
export type EventoInicioSesion =
  | { readonly tipo: 'salida'; readonly texto: string }
  | { readonly tipo: 'pide_codigo' }
  | { readonly tipo: 'terminado'; readonly exito: boolean };

export interface ProcesoInicioSesion {
  /** Le pasa al proceso el código que la persona escribe en el móvil (MATE-8.2). */
  enviar(codigo: string): void;
  /** Corta el proceso: al pulsar «Cancelar» o a los 5 minutos (MATE-8.3, MATE-8.4). */
  cortar(): void;
}

/** Claude Code, instalado en el PC. Solo se usa para iniciar sesión y saber si hay una iniciada. */
export interface ClaudeCode {
  /** Lanza el inicio de sesión; `alRecibir` recibe cada evento del proceso, en orden. */
  iniciarSesion(alRecibir: (evento: EventoInicioSesion) => void): ProcesoInicioSesion;
  /** Si hay una sesión iniciada. La cuenta no sale nunca de la aplicación (MATE-8.5). */
  estado(): Promise<{ readonly iniciada: boolean; readonly cuenta?: string }>;
}

/** Temporizador de la aplicación, para que los escenarios controlen la espera de los 5 minutos (MATE-8.3). */
export interface Temporizador {
  /** Ejecuta `accion` cuando pasen `milisegundos`. Devuelve la función que la cancela. */
  programar(milisegundos: number, accion: () => void): () => void;
}
