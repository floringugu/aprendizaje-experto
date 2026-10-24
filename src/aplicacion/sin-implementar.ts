/**
 * Cuerpo de los casos de uso que todavía no existen (etapa 3). Lanzar un error hace que los
 * escenarios de aceptación fallen en rojo de verdad, en vez de quedar indefinidos o pendientes.
 * Recibe los parámetros de la firma, sin usarlos, para que una firma escrita antes que su cuerpo
 * (etapa 4) compile con `noUnusedParameters`.
 */
export const sinImplementar: (...parametros: readonly unknown[]) => never = () => {
  throw new Error('Sin implementar');
};
