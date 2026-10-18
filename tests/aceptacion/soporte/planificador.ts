import type {
  CalificacionFsrs,
  EntradaFsrs,
  PlanificadorFsrs,
  RecalculoFsrs,
  SalidaFsrs,
} from '../../../src/aplicacion/puertos.ts';
import { MS_POR_DIA } from './reloj.ts';

/**
 * Intervalo, en días, que calcula el FSRS de prueba. No imita a FSRS: solo es una función conocida
 * de la calificación y la retención objetivo, para que los escenarios comprueben que la aplicación
 * se la pide al planificador y usa lo que devuelve (PLAN-1).
 */
export function fechaDeRepasoDePrueba(calificacion: CalificacionFsrs, retencion: number, ahora: Date): Date {
  const diasBase = calificacion === 'Again' ? 1 : 10;
  return new Date(ahora.getTime() + diasBase * retencion * MS_POR_DIA);
}

/** FSRS de prueba que además anota todo lo que recibe. */
export class PlanificadorFsrsDePrueba implements PlanificadorFsrs {
  readonly programaciones: EntradaFsrs[] = [];
  readonly recalculos: RecalculoFsrs[] = [];

  programar(entrada: EntradaFsrs): SalidaFsrs {
    this.programaciones.push(entrada);
    return {
      tarjeta: { repasos: this.programaciones.length },
      proximoRepaso: fechaDeRepasoDePrueba(entrada.calificacion, entrada.retencionObjetivo, entrada.ahora),
    };
  }

  recalcular(entrada: RecalculoFsrs): SalidaFsrs {
    this.recalculos.push(entrada);
    return {
      tarjeta: entrada.tarjeta,
      proximoRepaso: fechaDeRepasoDePrueba('Good', entrada.retencionObjetivo, entrada.ahora),
    };
  }
}
