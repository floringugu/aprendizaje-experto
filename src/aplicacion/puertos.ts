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
