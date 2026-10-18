import assert from 'node:assert/strict';
import { Given, Then, When } from '@cucumber/cucumber';
import type { ConsultaHoras } from '../../../src/aplicacion/horas.ts';
import { progresoCompleto, progresoDe } from '../soporte/acciones.ts';
import { presente } from '../soporte/comprobar.ts';
import { filasDelDominio, ultimaFila } from '../soporte/csv.ts';
import { aceptado, mundo } from '../soporte/mundo.ts';
import type { Mundo } from '../soporte/mundo.ts';
import { MS_POR_DIA, soloFecha } from '../soporte/reloj.ts';

// Pasos del registro de horas de práctica focalizada (HORA). Las horas se registran a mano y nunca
// son una meta ni una medida del progreso.

const MINUTOS_POR_HORA = 60;
const MINUTOS_POR_DIA = 1440;
const MS_POR_HORA = 60 * 60 * 1000;
const MINUTOS_DE_UNA_SESION = 30;
/** Lo que no debe aparecer en la pantalla de horas: metas, horas que faltan y la cifra de las 10.000 horas. */
const PALABRAS_PROHIBIDAS = /meta|falta|restante|10\.?000/i;

function registrarMinutos(fecha: string, minutos: number): void {
  const actual = mundo();
  actual.registroDeHoras = actual.listo().registrarHoras({ dominio: actual.dominio, fecha, minutos });
}

function consultarRegistro(): void {
  const actual = mundo();
  actual.consultaHoras = aceptado(actual.listo().consultarHoras({ dominio: actual.dominio }));
}

function consultaActual(): ConsultaHoras {
  return presente(mundo().consultaHoras, 'la consulta del registro de horas');
}

function registroActual(): NonNullable<Mundo['registroDeHoras']> {
  return presente(mundo().registroDeHoras, 'el resultado de registrar horas');
}

/** Pasos retirados de cada objetivo, en un texto para compararlos antes y después. */
function pasosRetirados(actual: Mundo): string {
  return JSON.stringify(progresoCompleto(actual).objetivos.map((o) => [o.objetivo, o.pasosRetirados]));
}

/** Registra las horas en días ya pasados, como máximo 24 h por día, empezando por hoy. */
function registrarHorasEnDiasPasados(actual: Mundo, horas: number): void {
  const app = actual.listo();
  const hoy = actual.reloj.ahora().getTime();
  let pendientes = horas * MINUTOS_POR_HORA;
  for (let dia = 0; pendientes > 0; dia += 1) {
    const minutos = Math.min(pendientes, MINUTOS_POR_DIA);
    const fecha = soloFecha(new Date(hoy - dia * MS_POR_DIA));
    aceptado(app.registrarHoras({ dominio: actual.dominio, fecha, minutos }));
    pendientes -= minutos;
  }
}

// --- Registrar horas (HORA-1) ----------------------------------------------------------------------

When('la persona registra {int} minutos de práctica focalizada el {fecha}', (minutos: number, fecha: string) => {
  registrarMinutos(fecha, minutos);
});

Then('el registro queda guardado con la fecha {fecha} y {int} minutos', (fecha: string, minutos: number) => {
  const actual = mundo();
  assert.deepEqual(aceptado(registroActual()), { fecha, minutos });
  assert.deepEqual(aceptado(actual.aplicacion().consultarHoras({ dominio: actual.dominio })).registros, [
    { fecha, minutos },
  ]);
});

Then('queda registrado en horas.csv', () => {
  const guardado = aceptado(registroActual());
  const fila = ultimaFila(mundo(), 'horas.csv');
  assert.equal(fila['fecha'], guardado.fecha);
  assert.equal(fila['minutos'], String(guardado.minutos));
});

Then('el registro se guarda', () => {
  assert.equal(registroActual().ok, true);
});

// Un registro rechazado no deja nada guardado, ni en la pantalla ni en horas.csv.
Then('el registro se rechaza', () => {
  const actual = mundo();
  assert.equal(registroActual().ok, false);
  assert.deepEqual(aceptado(actual.aplicacion().consultarHoras({ dominio: actual.dominio })).registros, []);
  assert.deepEqual(filasDelDominio(actual, 'horas.csv'), []);
});

Given('que la persona ha tenido la aplicación abierta {int} horas sin registrar minutos', (horas: number) => {
  const actual = mundo();
  actual.preparar(() => {
    actual.reloj.avanzarMs(horas * MS_POR_HORA);
  });
});

When('consulta su registro de horas', consultarRegistro);

When('la persona consulta su registro de horas', consultarRegistro);

Then('el registro no tiene ninguna entrada', () => {
  assert.deepEqual(consultaActual().registros, []);
  assert.deepEqual(filasDelDominio(mundo(), 'horas.csv'), []);
});

// --- Las horas no son una meta (HORA-2) ------------------------------------------------------------

// La persona aún no ha registrado nada: se registra una sesión y se mira cómo la enseña la pantalla.
Then('ve sus registros con fecha y minutos', () => {
  const actual = mundo();
  const hoy = soloFecha(actual.reloj.ahora());
  registrarMinutos(hoy, MINUTOS_DE_UNA_SESION);
  consultarRegistro();
  assert.deepEqual(consultaActual().registros, [{ fecha: hoy, minutos: MINUTOS_DE_UNA_SESION }]);
});

Then('no hay ninguna opción para fijar una meta de horas', () => {
  assert.deepEqual(
    consultaActual().acciones.filter((accion) => PALABRAS_PROHIBIDAS.test(accion) || /fijar|objetivo/i.test(accion)),
    [],
  );
});

Then('no ve cuántas horas le faltan para ninguna cifra ni ninguna mención a las 10.000 horas', () => {
  assert.doesNotMatch(JSON.stringify(consultaActual()), PALABRAS_PROHIBIDAS);
});

// --- Las horas no miden el progreso (HORA-3) -------------------------------------------------------

Given('que la persona ha registrado {int} horas de práctica focalizada', (horas: number) => {
  const actual = mundo();
  actual.preparar(() => {
    registrarHorasEnDiasPasados(actual, horas);
  });
});

When('registra {int} horas de práctica focalizada', (horas: number) => {
  const actual = mundo();
  actual.listo();
  actual.fotoDelProgreso = pasosRetirados(actual);
  registrarHorasEnDiasPasados(actual, horas);
});

Then('{objetivo} sigue sin dominar', (objetivo: string) => {
  assert.notEqual(progresoDe(mundo(), objetivo).estado, 'dominado');
});

Then('los pasos retirados de {objetivo} no cambian', (objetivo: string) => {
  const antes = presente(mundo().fotoDelProgreso, 'los pasos retirados de antes');
  assert.equal(pasosRetirados(mundo()), antes, `Han cambiado los pasos retirados (${objetivo})`);
});
