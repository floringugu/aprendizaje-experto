import assert from 'node:assert/strict';
import type { Resultado } from '../../../src/aplicacion/resultado.ts';
import type { PeticionEvaluacionExterna } from '../../../src/aplicacion/tareas.ts';
import { llegarAFase } from './acciones.ts';
import { aceptado } from './mundo.ts';
import type { Mundo } from './mundo.ts';
import { MS_POR_DIA, instanteUtc, soloFecha } from './reloj.ts';

// Lo que comparten los pasos de las tareas (TARE) y de la exportación (INST-1.4): practicar una
// tarea y registrar evaluaciones externas.

const HORA_DE_LA_EVALUACION = '09:00:00';
const NIVEL_POR_DEFECTO = 1;
const FECHA_VALIDA = '2026-01-15';
const PERCENTIL_VALIDO = 85;

/** Nivel «1» en todos los criterios de la rúbrica de la tarea, para las evaluaciones que no dicen más. */
function nivelesPorDefecto(actual: Mundo, tarea: string): Readonly<Record<string, number>> {
  const rubrica = actual.contenido().tareas.find((candidata) => candidata.id === tarea)?.rubrica ?? [];
  return Object.fromEntries(rubrica.map((criterio) => [criterio.criterio, NIVEL_POR_DEFECTO]));
}

/** Una evaluación válida y completa de la tarea; los pasos le cambian solo el dato que les importa. */
export function evaluacionValida(actual: Mundo, tarea: string): PeticionEvaluacionExterna {
  return {
    dominio: actual.dominio,
    tarea,
    fecha: FECHA_VALIDA,
    percentil: PERCENTIL_VALIDO,
    aCiegas: true,
    niveles: nivelesPorDefecto(actual, tarea),
  };
}

/** El instante de la mañana del día siguiente a la fecha «AAAA-MM-DD». */
function diaSiguiente(fecha: string): Date {
  return instanteUtc(soloFecha(new Date(instanteUtc(fecha).getTime() + MS_POR_DIA)), HORA_DE_LA_EVALUACION);
}

/**
 * Registra la evaluación como lo haría la persona. La fecha tiene que haber pasado: si el reloj de
 * la prueba aún no ha llegado a ella, se avanza hasta el día siguiente (una fecha futura se
 * rechaza, TARE-2.2).
 */
export function registrarEvaluacion(actual: Mundo, peticion: PeticionEvaluacionExterna): Resultado<null> {
  const esFecha = /^\d{4}-\d{2}-\d{2}$/.test(peticion.fecha);
  if (esFecha && instanteUtc(peticion.fecha).getTime() >= actual.reloj.ahora().getTime()) {
    actual.reloj.fijar(diaSiguiente(peticion.fecha));
  }
  actual.evaluacionRegistrada = peticion;
  const resultado = actual.aplicacion().registrarEvaluacionExterna(peticion);
  actual.ultimoResultado = resultado;
  return resultado;
}

/**
 * La persona llega a la fase avanzada, pide tareas hasta que le toca la indicada y la deja
 * practicada en la aplicación. El contenido tiene que estar completo.
 */
export function practicarTarea(actual: Mundo, tarea: string): void {
  llegarAFase(actual, 'avanzado_experto');
  const app = actual.aplicacion();
  const encontrada = actual.contenido().tareas.some(() => {
    actual.tareaPresentada = aceptado(app.pedirTarea({ dominio: actual.dominio }));
    return actual.tareaPresentada.tarea === tarea;
  });
  assert.ok(encontrada, `La aplicación no presenta ${tarea}`);
}
