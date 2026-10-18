import assert from 'node:assert/strict';
import { Given, Then, When, defineParameterType } from '@cucumber/cucumber';
import type { DataTable } from '@cucumber/cucumber';
import type { NivelRubrica } from '../../../src/aplicacion/contenido.ts';
import type {
  CriterioEvaluado,
  PeticionEvaluacionExterna,
  TareaListada,
  TareaPresentada,
} from '../../../src/aplicacion/tareas.ts';
import { presente } from '../soporte/comprobar.ts';
import { filasDelDominio, ultimaFila } from '../soporte/csv.ts';
import { evaluacionValida, practicarTarea, registrarEvaluacion } from '../soporte/evaluaciones.ts';
import { aceptado, mundo } from '../soporte/mundo.ts';
import type { Mundo } from '../soporte/mundo.ts';
import { MS_POR_DIA, soloFecha } from '../soporte/reloj.ts';
import type { EvaluadaExterna } from '../soporte/tipos-de-parametro.ts';

// Pasos de las tareas representativas y de la evaluación externa (TARE-1 y TARE-2). La aplicación
// no puntúa las tareas ni calcula percentiles: guarda lo que da el evaluador.

const PERCENTIL_POR_DEFECTO = 50;

function tareaActual(): TareaPresentada {
  mundo().listo();
  return presente(mundo().tareaPresentada, 'la tarea presentada');
}

// --- Contenido: la rúbrica de la tarea --------------------------------------------------------------

Given(
  'que la rúbrica de {tarea} tiene el criterio {texto} con estos niveles:',
  (tarea: string, criterio: string, tabla: DataTable) => {
    const niveles = tabla
      .hashes()
      .map((fila): NivelRubrica => ({ nivel: Number(fila['nivel']), descriptor: fila['descriptor'] ?? '' }));
    mundo().contenido().fijarRubrica(tarea, [{ criterio, niveles }]);
  },
);

// --- Practicar tareas (TARE-1) ----------------------------------------------------------------------

When('pide una tarea de práctica', () => {
  const actual = mundo();
  actual.tareaPresentada = aceptado(actual.listo().pedirTarea({ dominio: actual.dominio }));
});

Then('se le presenta {tarea} con su enunciado y su rúbrica', (tarea: string) => {
  const esperada = presente(
    mundo()
      .contenido()
      .tareas.find((candidata) => candidata.id === tarea),
    tarea,
  );
  const presentada = tareaActual();
  assert.equal(presentada.tarea, tarea);
  assert.equal(presentada.enunciado, esperada.enunciado);
  assert.deepEqual(presentada.rubrica, esperada.rubrica);
});

Then('{tarea} queda marcada como practicada', (tarea: string) => {
  const actual = mundo();
  const tareas: readonly TareaListada[] = aceptado(actual.listo().consultarTareas({ dominio: actual.dominio }));
  assert.equal(
    presente(
      tareas.find((candidata) => candidata.tarea === tarea),
      tarea,
    ).practicada,
    true,
  );
});

Given('que la persona ha hecho la tarea {tarea}', (tarea: string) => {
  const actual = mundo();
  actual.preparar(() => {
    practicarTarea(actual, tarea);
  });
});

Then('la aplicación no le asigna ninguna puntuación', () => {
  assert.doesNotMatch(JSON.stringify(tareaActual()), /puntu|nota|score/i);
});

Then('no le pide que puntúe su propio trabajo', () => {
  assert.equal(tareaActual().pideAutoevaluacion, false);
});

// El evaluador da el nivel de cada criterio; la fecha y el percentil no importan en este escenario.
Given('que el evaluador ha puntuado {tarea} con {niveles}', (tarea: string, niveles: Record<string, number>) => {
  const actual = mundo();
  actual.preparar(() => {
    practicarTarea(actual, tarea);
    aceptado(
      registrarEvaluacion(actual, { ...evaluacionValida(actual, tarea), percentil: PERCENTIL_POR_DEFECTO, niveles }),
    );
  });
});

When('la persona consulta la evaluación de {tarea}', (tarea: string) => {
  const actual = mundo();
  actual.evaluacionTarea = aceptado(actual.listo().consultarEvaluacionTarea({ dominio: actual.dominio, tarea }));
});

function criterioVisto(criterio: string): CriterioEvaluado {
  const evaluacion = presente(mundo().evaluacionTarea, 'la evaluación de la tarea');
  return presente(
    evaluacion.criterios.find((candidato) => candidato.criterio === criterio),
    `el criterio ${criterio}`,
  );
}

Then(
  've en el criterio {texto} el nivel {texto}, con el descriptor {texto}',
  (criterio: string, nivel: string, descriptor: string) => {
    const visto = criterioVisto(criterio);
    assert.equal(visto.nivel, Number(nivel));
    assert.equal(visto.descriptorNivel, descriptor);
  },
);

Then('ve el descriptor del nivel más alto, {texto}', (descriptor: string) => {
  const criterios = presente(mundo().evaluacionTarea, 'la evaluación de la tarea').criterios;
  assert.ok(criterios.length > 0, 'La evaluación no tiene ningún criterio');
  assert.deepEqual([...new Set(criterios.map((criterio) => criterio.descriptorNivelMaximo))], [descriptor]);
});

// --- Registrar evaluaciones externas (TARE-2) -------------------------------------------------------

/** Lo que cambia respecto de una evaluación válida, y el dato que la aplicación debe señalar. */
interface Problema {
  readonly cambio: (actual: Mundo) => Partial<PeticionEvaluacionExterna>;
  /** Propiedad de la petición que la aplicación debe señalar en `campo` para que la persona sepa qué corregir. */
  readonly campo: keyof PeticionEvaluacionExterna;
}

const PROBLEMAS: Readonly<Record<string, Problema>> = {
  'la fecha vacía': { cambio: () => ({ fecha: '' }), campo: 'fecha' },
  'una fecha futura': {
    cambio: (actual) => ({ fecha: soloFecha(new Date(actual.reloj.ahora().getTime() + MS_POR_DIA)) }),
    campo: 'fecha',
  },
  'el percentil 101': { cambio: () => ({ percentil: 101 }), campo: 'percentil' },
  'el percentil -1': { cambio: () => ({ percentil: -1 }), campo: 'percentil' },
  'el nivel «3» en «Planteamiento», que no está en la rúbrica': {
    cambio: () => ({ niveles: { Planteamiento: 3 } }),
    campo: 'niveles',
  },
  'sin indicar si fue a ciegas': { cambio: () => ({ aCiegas: undefined }), campo: 'aCiegas' },
};

defineParameterType({
  name: 'problema',
  regexp: new RegExp(Object.keys(PROBLEMAS).join('|')),
  transformer: (frase: string) => presente(PROBLEMAS[frase], `el problema «${frase}»`),
});

/** Una fila «fecha | percentil | a ciegas | <criterio>…» como evaluación; las demás columnas son criterios. */
function evaluacionDeLaTabla(actual: Mundo, tarea: string, fila: Record<string, string>): PeticionEvaluacionExterna {
  const { fecha = '', percentil = '', 'a ciegas': ciegas = '', ...criterios } = fila;
  return {
    dominio: actual.dominio,
    tarea,
    fecha,
    percentil: Number(percentil),
    aCiegas: ciegas === '' ? undefined : ciegas === 'sí',
    niveles: Object.fromEntries(Object.entries(criterios).map(([criterio, nivel]) => [criterio, Number(nivel)])),
  };
}

When('la persona registra una evaluación externa de {tarea} con estos datos:', (tarea: string, tabla: DataTable) => {
  const actual = mundo();
  actual.listo();
  registrarEvaluacion(actual, evaluacionDeLaTabla(actual, tarea, presente(tabla.hashes()[0], 'una fila de datos')));
});

When('la persona registra una evaluación externa de {tarea} con {problema}', (tarea: string, problema: Problema) => {
  const actual = mundo();
  actual.listo();
  actual.problemaRegistrado = problema.campo;
  registrarEvaluacion(actual, { ...evaluacionValida(actual, tarea), ...problema.cambio(actual) });
});

// INST-1.4: la misma operación, descrita en una frase.
When(
  'la persona registra una evaluación externa de {evaluada}, {niveles}',
  (evaluada: EvaluadaExterna, niveles: Record<string, number>) => {
    const actual = mundo();
    actual.listo();
    registrarEvaluacion(actual, { ...evaluacionValida(actual, evaluada.tarea), ...evaluada, niveles });
  },
);

function evaluacionIntentada(): PeticionEvaluacionExterna {
  return presente(mundo().evaluacionRegistrada, 'ninguna evaluación registrada');
}

Then('la evaluación queda guardada', () => {
  const actual = mundo();
  const guardada = evaluacionIntentada();
  assert.equal(presente(actual.ultimoResultado, 'el resultado de registrar').ok, true);
  const vista = aceptado(
    actual.aplicacion().consultarEvaluacionTarea({ dominio: actual.dominio, tarea: guardada.tarea }),
  );
  assert.deepEqual(
    Object.fromEntries(vista.criterios.map((criterio) => [criterio.criterio, criterio.nivel])),
    guardada.niveles,
  );
});

Then('queda registrada en evaluaciones_externas.csv', () => {
  const guardada = evaluacionIntentada();
  const fila = ultimaFila(mundo(), 'evaluaciones_externas.csv');
  assert.deepEqual(
    [fila['fecha'], fila['tarea'], fila['percentil'], fila['a_ciegas']],
    [guardada.fecha, guardada.tarea, String(guardada.percentil), String(guardada.aCiegas)],
  );
});

Then('la aplicación la rechaza e indica qué dato falta o no es válido', () => {
  const actual = mundo();
  const resultado = presente(actual.ultimoResultado, 'el resultado de registrar');
  assert.ok(!resultado.ok, 'La aplicación aceptó una evaluación que debía rechazar');
  // Se comprueba `campo` y no el texto de `motivo`, que sale del catálogo de textos y puede cambiar.
  assert.equal(resultado.campo, presente(actual.problemaRegistrado, 'el dato con problema'));
  assert.deepEqual(filasDelDominio(actual, 'evaluaciones_externas.csv'), []);
});
