/** Un intento corregido: de qué ítem es y si lo acertó. */
interface IntentoCorregido {
  readonly item: string;
  readonly correcta: boolean;
}

/**
 * Último intento de cada ítem: `true` si lo acertó. Los intentos llegan en el orden en que se hicieron,
 * así que uno posterior sustituye a los anteriores del mismo ítem.
 */
export function ultimoIntentoPorItem(intentos: readonly IntentoCorregido[]): Map<string, boolean> {
  return new Map(intentos.map((intento) => [intento.item, intento.correcta]));
}

/**
 * Acierto sin ayuda de un conjunto de ítems: la fracción, de 0 a 1, de los ítems cuyo último intento
 * fue correcto (plan §0, «Acierto sin ayuda de un objetivo»).
 * Es `undefined` mientras algún ítem no tenga intento, y también si no hay ítems: sin pruebas no se
 * puede afirmar que la persona domine nada.
 */
export function aciertoSinAyuda(
  items: readonly string[],
  ultimoIntento: ReadonlyMap<string, boolean>,
): number | undefined {
  if (items.length === 0 || items.some((item) => !ultimoIntento.has(item))) {
    return undefined;
  }
  const acertados = items.filter((item) => ultimoIntento.get(item) === true).length;
  return acertados / items.length;
}

/** Lo que se sabe del acierto de un conjunto de ítems. */
export interface MedidaAcierto {
  /** Se omite mientras falte algún ítem por responder. */
  readonly aciertoSinAyuda?: number;
  /** Ítems que aún no tienen ningún intento (@MAST-1.3). */
  readonly itemsSinIntento: number;
}

/** El acierto sin ayuda, si ya se puede medir, y cuántos ítems faltan por responder para medirlo. */
export function medirAcierto(items: readonly string[], ultimoIntento: ReadonlyMap<string, boolean>): MedidaAcierto {
  const itemsSinIntento = items.filter((item) => !ultimoIntento.has(item)).length;
  const acierto = aciertoSinAyuda(items, ultimoIntento);
  // Con `exactOptionalPropertyTypes`, un campo opcional sin valor se omite: no se pone a `undefined`.
  return acierto === undefined ? { itemsSinIntento } : { aciertoSinAyuda: acierto, itemsSinIntento };
}

/** Un acierto igual al umbral ya lo supera (@DIAG-2.2); sin acierto medido, nunca. */
export function llegaAlUmbral(acierto: number | undefined, umbral: number): boolean {
  return acierto !== undefined && acierto >= umbral;
}
