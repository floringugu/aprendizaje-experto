// Reaprendizaje sucesivo dentro de una sesión (RECU-6): el ítem que se falla vuelve en la misma sesión,
// detrás de unos cuantos ítems de otros, hasta acertarlo las veces que pide la configuración. La cola es
// de una sesión: lo que queda en ella al terminarla no pasa a la siguiente (@RECU-6.7).

/** Un ítem que queda por presentar en la sesión; `reintento` si es uno que vuelve tras fallarlo. */
interface ItemPendiente {
  readonly item: string;
  readonly reintento: boolean;
}

/** Lo que queda por presentar de la sesión, en el orden en que se presenta. */
export interface ColaDeSesion {
  readonly pendientes: readonly ItemPendiente[];
  /** Los reintentos acertados de cada ítem en esta sesión, seguidos o no (@RECU-6.10). */
  readonly aciertos: ReadonlyMap<string, number>;
}

/** Salen de `items_entre_intento_y_reintento` y `aciertos_para_cerrar_item_en_sesion`. */
export interface ReglasDeReintento {
  /**
   * Ítems que se presentan, como mínimo, entre un intento y su reintento (@RECU-6.1). Si no quedan
   * tantos, el ítem vuelve cuando se acaban (@RECU-6.6).
   */
  readonly separacion: number;
  /** Reintentos acertados, seguidos o no, con los que el ítem deja de volver en la sesión (@RECU-6.4). */
  readonly aciertosParaCerrar: number;
}

/**
 * Cómo cuenta una respuesta para la cola de la sesión:
 * - `reintento`: la respuesta al ítem que vuelve. Si con ella no llega a los aciertos, vuelve otra vez,
 *   también si la acierta (@RECU-6.4, @RECU-6.5).
 * - `ensena`: el primer intento en una sesión que enseña (práctica, repaso o mezcla). Vuelve si se falla
 *   (@RECU-6.1) y no si se acierta (@RECU-6.2).
 * - `mide`: un intento que solo mide (diagnóstico, prueba de retención, caso reservado). Nunca vuelve
 *   (@RECU-6.8).
 */
export type ClaseDeRespuesta = 'reintento' | 'ensena' | 'mide';

export interface RespuestaEnSesion {
  readonly item: string;
  readonly correcta: boolean;
  readonly clase: ClaseDeRespuesta;
}

/** La cola de una sesión recién iniciada: sus ítems, en orden, y ninguno vuelve todavía. */
export function colaInicial(items: readonly string[]): ColaDeSesion {
  return { pendientes: items.map((item) => ({ item, reintento: false })), aciertos: new Map() };
}

/** Inserta la entrada detrás de los `separacion` primeros, o al final si no quedan tantos (@RECU-6.6). */
function insertarDetras(
  pendientes: readonly ItemPendiente[],
  entrada: ItemPendiente,
  separacion: number,
): readonly ItemPendiente[] {
  return pendientes.toSpliced(Math.min(separacion, pendientes.length), 0, entrada);
}

/** Si el ítem tiene que volver tras esta respuesta: la que enseña y falla, o un reintento que no cierra. */
function tieneQueVolver(respuesta: RespuestaEnSesion, aciertos: number, reglas: ReglasDeReintento): boolean {
  const abierto = respuesta.clase === 'reintento' || (respuesta.clase === 'ensena' && !respuesta.correcta);
  return abierto && aciertos < reglas.aciertosParaCerrar;
}

/**
 * La cola después de una respuesta. La respuesta quita de la cola la entrada que responde: la del ítem
 * que vuelve si es un `reintento`, y la de su primer intento si no. Si esa entrada no está en la cola
 * (el ítem no es de la sesión, ya se respondió, o se responde como reintento sin haberlo fallado), la
 * cola no cambia.
 *
 * Si el ítem tiene que volver, se inserta detrás de los `separacion` primeros que quedan, o al final si
 * no quedan tantos.
 */
export function colaTrasResponder(
  cola: ColaDeSesion,
  respuesta: RespuestaEnSesion,
  reglas: ReglasDeReintento,
): ColaDeSesion {
  const { item, clase } = respuesta;
  const esReintento = clase === 'reintento';
  const posicion = cola.pendientes.findIndex(
    (pendiente) => pendiente.item === item && pendiente.reintento === esReintento,
  );
  if (posicion === -1) {
    return cola;
  }
  const resto = cola.pendientes.toSpliced(posicion, 1);
  // Solo el reintento acertado suma: el primer intento acertado no abre nada que cerrar (@RECU-6.2).
  const aciertos = (cola.aciertos.get(item) ?? 0) + (esReintento && respuesta.correcta ? 1 : 0);
  const pendientes = tieneQueVolver(respuesta, aciertos, reglas)
    ? insertarDetras(resto, { item, reintento: true }, reglas.separacion)
    : resto;
  return { pendientes, aciertos: new Map(cola.aciertos).set(item, aciertos) };
}
