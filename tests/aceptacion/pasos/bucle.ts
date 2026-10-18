import assert from 'node:assert/strict';
import { Given, Then, When } from '@cucumber/cucumber';
import type { DataTable } from '@cucumber/cucumber';
import type { ClavePaso } from '../../../src/aplicacion/bucle.ts';
import {
  cerrarBucleSemanal,
  ejecutarBucleSemanal,
  progresoCompleto,
  responder,
  responderProblemasDeLaSemana,
  siguienteRepaso,
} from '../soporte/acciones.ts';
import { esperarCasiIgual, presente } from '../soporte/comprobar.ts';
import { aceptado, mundo } from '../soporte/mundo.ts';
import type { Mundo } from '../soporte/mundo.ts';
import { fechaDeRepasoDePrueba } from '../soporte/planificador.ts';
import { MS_POR_DIA, instanteUtc } from '../soporte/reloj.ts';

// Pasos del bucle semanal de retroalimentación (BUCL).

const HORA_DE_ABRIR_SESION = '09:00:00';
/** Algo más que la periodicidad, para que al preparar un bucle ya toque el siguiente. */
const DIAS_HASTA_EL_SIGUIENTE_BUCLE = 8;
/** Distinta de la que trae `config/parametros.json`, para ver que el recálculo usa la actual (BUCL-2.3). */
const RETENCION_DE_COMPROBACION = 0.8;
const INTENCION_NUEVA = 'si son las 8:00 y estoy en casa, hago 5 preguntas de recuperación';

/** Cada paso del bucle con el principio de su descripción en la tabla de BUCL-2.1. */
const PASOS_EN_ORDEN: readonly (readonly [string, ClavePaso])[] = [
  ['resultados de las pruebas', 'resultados'],
  ['calibración', 'calibracion'],
  ['ajuste de la ayuda', 'ajuste_ayuda'],
  ['repasos reprogramados', 'repasos'],
  ['revisión del plan', 'revision_plan'],
];

function bucleActual(): NonNullable<Mundo['bucle']> {
  return presente(mundo().bucle, 'el resultado del bucle semanal');
}

function ejecutarElBucle(): void {
  const actual = mundo();
  actual.listo();
  ejecutarBucleSemanal(actual);
}

/** Abre una sesión en esa fecha. La preparación pendiente se ejecuta antes de mover el reloj. */
function abrirSesionEl(fecha: string): void {
  const actual = mundo();
  actual.listo();
  actual.reloj.fijar(instanteUtc(fecha, HORA_DE_ABRIR_SESION));
  actual.aperturaSesion = aceptado(actual.aplicacion().abrirSesion({ dominio: actual.dominio }));
}

function comprobarBuclesEjecutados(esperados: number): void {
  assert.equal(presente(mundo().aperturaSesion, 'la apertura de la sesión').bucles, esperados);
}

/** Progreso y repasos de la persona en un texto, para comparar antes y después (BUCL-3.4). */
function fotoDelProgreso(actual: Mundo): string {
  const repasos = aceptado(actual.aplicacion().consultarRepasos({ dominio: actual.dominio }));
  return JSON.stringify({ progreso: progresoCompleto(actual), repasos });
}

/** Una persona que deja escrita su intención de implementación en un bucle y espera al siguiente. */
function dejarIntencion(actual: Mundo, texto: string): void {
  cerrarBucleSemanal(actual, texto);
  actual.reloj.avanzarDias(DIAS_HASTA_EL_SIGUIENTE_BUCLE);
}

// --- BUCL-1: cuándo se ejecuta ---------------------------------------------------------------------

Given('que el último bucle semanal se ejecutó el {fecha}', (fecha: string) => {
  const actual = mundo();
  actual.preparar(() => {
    actual.reloj.fijar(instanteUtc(fecha, HORA_DE_ABRIR_SESION));
    ejecutarBucleSemanal(actual);
  });
});

// El diagnóstico se hace al preparar la persona, así que el reloj se mueve ya, no en la cola.
Given('que la persona terminó el diagnóstico el {fecha} y nunca ha ejecutado el bucle', (fecha: string) => {
  mundo().reloj.fijar(instanteUtc(fecha, HORA_DE_ABRIR_SESION));
});

When('la persona abre una sesión el {fecha}', abrirSesionEl);

Then('el bucle semanal no se ejecuta', () => {
  comprobarBuclesEjecutados(0);
});

Then('el bucle semanal se ejecuta una vez', () => {
  comprobarBuclesEjecutados(1);
});

Then('el bucle semanal se ejecuta', () => {
  comprobarBuclesEjecutados(1);
});

Then('se ejecuta un solo bucle semanal', () => {
  comprobarBuclesEjecutados(1);
});

Then('el siguiente bucle no se ejecuta antes del {fecha}', (fecha: string) => {
  const actual = mundo();
  const proximo = presente(actual.aperturaSesion, 'la apertura de la sesión').proximoBucle;
  assert.ok(proximo.getTime() >= instanteUtc(fecha).getTime(), `El siguiente bucle es el ${proximo.toISOString()}`);
  // La víspera de esa fecha todavía no toca: se comprueba abriendo otra sesión.
  abrirSesionEl(new Date(instanteUtc(fecha).getTime() - MS_POR_DIA).toISOString().slice(0, 10));
  comprobarBuclesEjecutados(0);
});

// --- BUCL-2: los cinco pasos -----------------------------------------------------------------------

When('se ejecuta el bucle semanal', ejecutarElBucle);

When('llega al paso 5 del bucle semanal', ejecutarElBucle);

Then('la persona ve, en este orden, los pasos:', (tabla: DataTable) => {
  const filas = tabla.hashes();
  assert.deepEqual(
    filas.map((fila) => fila['paso']),
    ['1', '2', '3', '4', '5'],
  );
  const esperados = filas.map(
    (fila) => PASOS_EN_ORDEN.find(([inicio]) => (fila['contenido'] ?? '').startsWith(inicio))?.[1],
  );
  assert.deepEqual(bucleActual().pasos, esperados);
});

Given(
  'que en la última semana la persona acertó {int} de 20 intentos sin ayuda de {objetivo}',
  (aciertos: number, objetivo: string) => {
    const actual = mundo();
    actual.preparar(() => {
      responderProblemasDeLaSemana(actual, objetivo, aciertos);
    });
  },
);

Then('el paso 1 muestra un acierto sin ayuda del {fraccion} en {objetivo}', (fraccion: number, objetivo: string) => {
  const medido = bucleActual().resultados.aciertoSinAyudaPorObjetivo[objetivo];
  esperarCasiIgual(medido, fraccion, `acierto sin ayuda de ${objetivo} en el paso 1`);
});

Then('no le pregunta a la persona cómo cree que va', () => {
  assert.equal(bucleActual().resultados.pideAutoevaluacion, false);
});

// Sin repasos pendientes no hay nada que recalcular: el paso deja uno y cambia la retención objetivo.
Then('las fechas de repaso pendientes se recalculan con FSRS y la configuración actual', () => {
  const actual = mundo();
  actual.contenido().asegurarItemsPorObjetivo(1);
  const item = presente(actual.contenido().itemsDe('O1')[0], 'un ítem de O1');
  responder(actual, { item: item.id, correcta: true });
  actual.establecerParametro('retencion_objetivo_fsrs', RETENCION_DE_COMPROBACION);
  ejecutarBucleSemanal(actual);
  const recalculo = presente(actual.planificador.recalculos.at(-1), 'ninguna llamada de recálculo a FSRS');
  assert.equal(recalculo.retencionObjetivo, RETENCION_DE_COMPROBACION);
  const esperada = fechaDeRepasoDePrueba('Good', RETENCION_DE_COMPROBACION, actual.reloj.ahora());
  assert.equal(siguienteRepaso(actual, item.id).getTime(), esperada.getTime());
});

Then('el paso 4 muestra cuántos repasos tocan en los próximos 7 días, los de la periodicidad configurada', () => {
  const actual = mundo();
  const { ventanaDias, cantidad } = bucleActual().repasos;
  assert.equal(ventanaDias, actual.parametros['periodicidad_bucle_dias']?.valor);
  const limite = actual.reloj.ahora().getTime() + ventanaDias * MS_POR_DIA;
  const repasos = aceptado(actual.aplicacion().consultarRepasos({ dominio: actual.dominio }));
  assert.equal(cantidad, repasos.filter((repaso) => repaso.fecha.getTime() <= limite).length);
});

// --- BUCL-3: revisión del plan ---------------------------------------------------------------------

Given('que la persona no tiene ninguna intención de implementación', () => {
  // Es el estado de partida: todavía no ha escrito ninguna.
});

Given('que la intención de la semana anterior es {texto}', (texto: string) => {
  const actual = mundo();
  actual.intencionAnterior = texto;
  actual.preparar(() => {
    dejarIntencion(actual, texto);
  });
});

Given('que la persona cambia su intención de implementación en el paso 5', () => {
  mundo().intencion = { accion: 'nueva', texto: INTENCION_NUEVA };
});

When('termina el bucle semanal', () => {
  const actual = mundo();
  ejecutarElBucle();
  actual.fotoDelProgreso = fotoDelProgreso(actual);
  const intencion = presente(actual.intencion, 'la intención escrita en el paso 5');
  aceptado(actual.aplicacion().terminarBucle({ dominio: actual.dominio, intencion }));
});

Then('se le pide una intención con la forma {texto}', (forma: string) => {
  const { revisionPlan } = bucleActual();
  assert.equal(revisionPlan.pideIntencion, true);
  assert.equal(revisionPlan.formatoIntencion, forma);
  assert.equal(revisionPlan.puedeConfirmarAnterior, false, 'No hay intención anterior que confirmar');
});

Then('no puede terminar el bucle sin escribirla', () => {
  const resultado = mundo().aplicacion().terminarBucle({ dominio: mundo().dominio });
  assert.equal(resultado.ok, false);
});

Then('puede confirmarla sin cambios o escribir otra', () => {
  const actual = mundo();
  const { revisionPlan } = bucleActual();
  assert.equal(revisionPlan.intencionAnterior, actual.intencionAnterior);
  assert.equal(revisionPlan.puedeConfirmarAnterior, true);
  assert.equal(revisionPlan.pideIntencion, true, 'Tiene que poder escribir otra');
  aceptado(actual.aplicacion().terminarBucle({ dominio: actual.dominio, intencion: { accion: 'confirmar_anterior' } }));
});

Then('ve el recordatorio de no recortar sueño para estudiar', () => {
  assert.equal(bucleActual().revisionPlan.recordatorioSueno, true);
});

Then('sus objetivos dominados, su fase, sus pasos retirados y sus fechas de repaso no cambian por ello', () => {
  const actual = mundo();
  assert.equal(fotoDelProgreso(actual), presente(actual.fotoDelProgreso, 'el progreso antes de terminar el bucle'));
});
