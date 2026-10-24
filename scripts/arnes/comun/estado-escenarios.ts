// Qué se espera de un escenario en la etapa 3 (make check-aceptacion) y en qué falla.
// Los pasos de cada escenario salen de estados-cucumber.ts.

/** rojo: el área en curso, con steps pero sin aplicación; verde: un área cerrada, que sigue pasando. */
export type EstadoEsperado = 'rojo' | 'verde';

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
    problemas.push(`@${id} es de un área cerrada y ya no pasa: es una regresión.`);
  }
  return problemas;
}
