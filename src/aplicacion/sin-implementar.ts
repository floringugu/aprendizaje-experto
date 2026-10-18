/**
 * Cuerpo de los casos de uso que todavía no existen (etapa 3). Lanzar un error hace que los
 * escenarios de aceptación fallen en rojo de verdad, en vez de quedar indefinidos o pendientes.
 */
export function sinImplementar(): never {
  throw new Error('Sin implementar');
}
