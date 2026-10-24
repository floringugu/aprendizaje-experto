// La ruta de un dominio: los objetivos que la persona tiene que dominar, en el orden del contenido.

/** Objetivos que quedan por dominar, en el orden del contenido: son la ruta (@DIAG-2.1). */
export function objetivosPendientes(objetivos: readonly string[], dominados: ReadonlySet<string>): readonly string[] {
  return objetivos.filter((objetivo) => !dominados.has(objetivo));
}

/** «cerrado»: aún no se puede practicar. «abierto»: se practica. «dominado»: llegó al umbral. */
export type EstadoEnRuta = 'cerrado' | 'abierto' | 'dominado';

interface HistorialDeDominio {
  /** Los objetivos dominados ahora. */
  readonly dominados: ReadonlySet<string>;
  /** Los que han estado dominados alguna vez, incluidos los de ahora. */
  readonly dominadosAlgunaVez: ReadonlySet<string>;
}

export interface RecorridoDeRuta {
  readonly estados: ReadonlyMap<string, EstadoEnRuta>;
  /** El objetivo que toca practicar; se omite cuando todos están dominados. */
  readonly actual?: string;
}

/**
 * Recorre los objetivos en orden. Están abiertos todos hasta el primero que nunca se ha dominado,
 * incluido: uno se abre al dominar el anterior (@MAST-2.1) y no antes (@MAST-2.2). Perder el dominio
 * no vuelve a cerrar nada: el objetivo perdido vuelve a la cola de práctica y los siguientes siguen
 * abiertos (@MAST-4.1, @MAST-6.3).
 *
 * El objetivo actual es el último abierto: el más avanzado que la persona aún no domina. Es decisión
 * del autor: el informe pide no avanzar sin dominar, pero no dice qué toca cuando se pierde un dominio.
 */
export function recorrerRuta(objetivos: readonly string[], historial: HistorialDeDominio): RecorridoDeRuta {
  const estados = new Map<string, EstadoEnRuta>();
  let quedaAbierto = true;
  objetivos.forEach((objetivo) => {
    if (historial.dominados.has(objetivo)) {
      estados.set(objetivo, 'dominado');
    } else {
      estados.set(objetivo, quedaAbierto ? 'abierto' : 'cerrado');
    }
    if (!historial.dominadosAlgunaVez.has(objetivo)) {
      quedaAbierto = false;
    }
  });
  const actual = objetivos.findLast((objetivo) => estados.get(objetivo) === 'abierto');
  return actual === undefined ? { estados } : { estados, actual };
}
