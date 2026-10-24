// Qué rutas protegidas difieren del último commit (scripts/arnes/integridad.ts).
import { estadoConHead, ficherosDeHead } from './git.ts';
import { entradaQueBloquea, ficherosVigilados } from './protegidas.ts';
import type { EntradaProtegida, Fase } from './protegidas.ts';

const QUE_PASA = {
  cambiado: 'ha cambiado respecto al último commit',
  nuevo: 'es nuevo y no está en el último commit',
  borrado: 'está en el último commit pero ya no existe',
} as const;

/**
 * Una línea por cada fichero protegido que la fase no desbloquea y no es igual que en HEAD:
 * cambiado, borrado o nuevo (también sin seguimiento). Requiere que haya commits.
 */
export function problemasDeIntegridad(raiz: string, entradas: readonly EntradaProtegida[], fase: Fase): string[] {
  // Un fichero borrado con «git rm» ya no lo lista git ls-files: se piden también los de HEAD.
  const deHead = ficherosDeHead(raiz).filter((ruta) => entradaQueBloquea(ruta, entradas, fase) !== undefined);
  const rutas = [...new Set([...ficherosVigilados(raiz, entradas, fase), ...deHead])].sort();
  return [...estadoConHead(raiz, rutas)].flatMap(([ruta, estado]) =>
    estado === 'igual' || estado === 'ausente' ? [] : [`${ruta}: ${QUE_PASA[estado]}`],
  );
}
