// Qué se espera de un escenario en la etapa 3 (make check-aceptacion) y en qué falla.
// Los pasos de cada escenario salen de estados-cucumber.ts.

/** rojo: el área en curso, con steps pero sin aplicación; verde: un área cerrada o un escenario ya implementado de un área reabierta, que sigue pasando. */
export type EstadoEsperado = 'rojo' | 'verde';

/**
 * Qué se espera de un escenario del área en curso: rojo, salvo que el área esté reabierta
 * (`enRojo` es la lista de config/alcance.json) y el escenario no esté en ella: entonces ya pasaba.
 */
export function esperadoEnCurso(id: string, enRojo: readonly string[] | undefined): EstadoEsperado {
  return enRojo === undefined || enRojo.includes(id) ? 'rojo' : 'verde';
}

/** Los IDs de `enRojo` que no son escenarios de features/: una errata dejaría un escenario sin vigilar. */
export function enRojoSinEscenario(enRojo: readonly string[] | undefined, ids: ReadonlySet<string>): string[] {
  return (enRojo ?? []).filter((id) => !ids.has(id)).map((id) => `@${id} figura en escenarios_en_rojo y no existe.`);
}

const PROBLEMAS_POR_ESTADO: Readonly<Record<string, string>> = {
  UNDEFINED: 'tiene pasos sin definir',
  AMBIGUOUS: 'tiene pasos que encajan con varias definiciones',
  PENDING: 'tiene pasos pendientes',
};

export function problemasDeEscenario(
  id: string,
  pasos: readonly string[] | undefined,
  esperado: EstadoEsperado,
): string[] {
  if (pasos === undefined) return [`@${id} no se ha ejecutado.`];
  const problemas = Object.entries(PROBLEMAS_POR_ESTADO)
    .filter(([estado]) => pasos.includes(estado))
    .map(([, problema]) => `@${id} ${problema}.`);
  const falla = pasos.includes('FAILED');
  if (esperado === 'rojo' && !falla) {
    problemas.push(`@${id} no falla: algún Then debe comprobar un estado observable que la aplicación aún no produce.`);
  }
  if (esperado === 'verde' && (falla || pasos.includes('SKIPPED'))) {
    problemas.push(`@${id} ya pasaba (área cerrada o reabierta) y ya no pasa: es una regresión.`);
  }
  return problemas;
}
