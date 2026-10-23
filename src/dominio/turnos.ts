// Mezcla de listas por turnos. Es general: no sabe de ítems ni de objetivos.

/**
 * Mezcla los grupos por turnos: el primero de cada grupo, después el segundo de cada uno, y así hasta
 * agotarlos. Con un grupo por objetivo, dos ítems seguidos casi nunca son del mismo objetivo, así que
 * el orden no da pista del tipo de problema (@DIAG-1.3).
 */
export function intercalarPorTurnos<T>(grupos: readonly (readonly T[])[]): T[] {
  const turnos = Math.max(0, ...grupos.map((grupo) => grupo.length));
  return Array.from({ length: turnos }, (_, turno) => turno).flatMap((turno) =>
    grupos.flatMap((grupo) => grupo.slice(turno, turno + 1)),
  );
}
