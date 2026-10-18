import assert from 'node:assert/strict';
import { Given, Then, When } from '@cucumber/cucumber';
import type { DataTable } from '@cucumber/cucumber';
import type { CodigoAviso, MotivoDescarte, NivelExperto } from '../../../src/aplicacion/tareas.ts';
import { presente } from '../soporte/comprobar.ts';
import { evaluacionValida, practicarTarea, registrarEvaluacion } from '../soporte/evaluaciones.ts';
import { aceptado, mundo } from '../soporte/mundo.ts';
import { instanteUtc } from '../soporte/reloj.ts';
import type { EvaluadaExterna } from '../soporte/tipos-de-parametro.ts';

// Pasos del nivel experto (TARE-3): lo deciden las evaluaciones externas válidas, nunca las horas
// ni dominar los objetivos.

const HORA_DE_PRACTICA = '09:00:00';
const AVISO_CONVENCION: CodigoAviso = 'definicion_es_convencion_no_estandar';
const AVISO_DECIDEN_EVALUACIONES: CodigoAviso = 'nivel_experto_lo_deciden_evaluaciones_externas';
const MOTIVO_TAREA_PRACTICADA: MotivoDescarte = 'tarea_practicada';

function nivelActual(): NivelExperto {
  return presente(mundo().nivel, 'el nivel de la persona');
}

function evaluarNivel(): void {
  const actual = mundo();
  actual.nivel = aceptado(actual.listo().evaluarNivelExperto({ dominio: actual.dominio }));
}

/** Deja en cola el registro de una evaluación válida de la tarea con la fecha y el percentil dados. */
function registrarValida(peticion: { tarea: string; fecha: string; percentil: number }): void {
  const actual = mundo();
  actual.preparar(() => {
    aceptado(registrarEvaluacion(actual, { ...evaluacionValida(actual, peticion.tarea), ...peticion }));
  });
}

// --- Estado de partida -------------------------------------------------------------------------------

Given('que la persona practicó {tarea} en la aplicación el {fecha}', (tarea: string, fecha: string) => {
  const actual = mundo();
  actual.preparar(() => {
    actual.reloj.fijar(instanteUtc(fecha, HORA_DE_PRACTICA));
    practicarTarea(actual, tarea);
  });
});

Given('estas evaluaciones externas, a ciegas y de tareas no practicadas:', (tabla: DataTable) => {
  tabla.hashes().forEach((fila) => {
    registrarValida({ tarea: fila['tarea'] ?? '', fecha: fila['fecha'] ?? '', percentil: Number(fila['percentil']) });
  });
});

Given(
  'una evaluación externa válida de {tarea} del {fecha} con el percentil {int}',
  (tarea: string, fecha: string, percentil: number) => {
    registrarValida({ tarea, fecha, percentil });
  },
);

Given('otra evaluación externa de {evaluada}, {ocultacion}', (evaluada: EvaluadaExterna, aCiegas: boolean) => {
  const actual = mundo();
  actual.preparar(() => {
    aceptado(registrarEvaluacion(actual, { ...evaluacionValida(actual, evaluada.tarea), ...evaluada, aCiegas }));
  });
});

Given(
  'que {tarea} se evalúa a ciegas el {fecha} con el percentil {int}',
  (tarea: string, fecha: string, percentil: number) => {
    registrarValida({ tarea, fecha, percentil });
  },
);

Given('que no tiene ninguna evaluación externa', () => {
  // Es el estado de partida: todavía no se ha registrado ninguna.
});

// --- Consultar el nivel ------------------------------------------------------------------------------

When('la aplicación evalúa el nivel experto', evaluarNivel);

When('consulta su nivel', evaluarNivel);

Then(
  'la aplicación indica que el rendimiento en el dominio {texto} cumple la definición operativa de nivel experto',
  (dominio: string) => {
    assert.equal(mundo().dominio, dominio);
    assert.equal(nivelActual().cumpleDefinicionOperativa, true);
  },
);

Then('aclara que esa definición es una convención propuesta, no un estándar validado', () => {
  assert.ok(nivelActual().avisos.includes(AVISO_CONVENCION));
});

Then('la persona no alcanza el nivel experto', () => {
  assert.equal(nivelActual().cumpleDefinicionOperativa, false);
});

Then('esa evaluación no cuenta para el nivel experto, porque {tarea} no es un caso nuevo', (tarea: string) => {
  const nivel = nivelActual();
  assert.equal(nivel.cumpleDefinicionOperativa, false);
  assert.deepEqual(
    nivel.descartadas.filter((descartada) => descartada.tarea === tarea),
    [{ tarea, motivo: MOTIVO_TAREA_PRACTICADA }],
  );
});

// DOMI: dominar todos los objetivos no da el nivel experto.
Then('no figura como experta', () => {
  assert.equal(nivelActual().cumpleDefinicionOperativa, false);
});

Then('la aplicación indica que el nivel experto lo deciden las evaluaciones externas', () => {
  assert.ok(nivelActual().avisos.includes(AVISO_DECIDEN_EVALUACIONES));
});
