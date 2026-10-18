import assert from 'node:assert/strict';
import { Given, Then, When } from '@cucumber/cucumber';
import type { DataTable } from '@cucumber/cucumber';
import { dominarObjetivo, problemasIntercalables, responder, retirarPasos } from '../soporte/acciones.ts';
import { presente } from '../soporte/comprobar.ts';
import { criterioPorDefecto, respuestaPara } from '../soporte/contenido.ts';
import { exportar, exportarTexto, filasDelDominio, leerCsv, ultimaFila } from '../soporte/csv.ts';
import { aceptado, mundo } from '../soporte/mundo.ts';
import type { Mundo } from '../soporte/mundo.ts';
import { instanteUtc, soloFecha } from '../soporte/reloj.ts';

// Pasos de la instrumentación y la exportación CSV (INST). Los seis ficheros llevan coma como
// separador, una fila de cabecera y fechas ISO 8601.

const MS_POR_SEGUNDO = 1000;
const DIAS_HASTA_EL_REPASO = 8;
const HORA_DE_RESPONDER = '09:00:00';
const ITEM_DE_PRUEBA = 'I1';
const OBJETIVO_DE_PRUEBA = 'O1';
const FICHEROS_EXPORTABLES = [
  'respuestas.csv',
  'cambios_ayuda.csv',
  'objetivos_dominados.csv',
  'cambios_fase.csv',
  'evaluaciones_externas.csv',
  'horas.csv',
];

// --- Cabeceras (INST-1.1) --------------------------------------------------------------------------

When('la persona exporta {fichero}', (fichero: string) => {
  exportarTexto(mundo(), fichero);
});

When('exporta {fichero}', (fichero: string) => {
  exportarTexto(mundo(), fichero);
});

function csvExportado(): ReturnType<typeof leerCsv> {
  return leerCsv(presente(mundo().csv, 'el CSV exportado'));
}

Then('su cabecera es {texto}', (columnas: string) => {
  assert.equal(csvExportado().cabecera.join(','), columnas);
});

// --- Una respuesta con su acierto, su latencia y su confianza (INST-1.2) ---------------------------

// Primero se le presenta el ítem; la latencia se mide desde ese instante hasta que responde.
Given(
  'que el {instante} se le presenta a la persona el ítem {item} de {objetivo} en una sesión de práctica',
  (instante: Date, item: string, objetivo: string) => {
    const actual = mundo();
    actual.contenido().asegurarItem(item, objetivo);
    actual.preparar(() => {
      actual.reloj.fijar(instante);
      actual.presentado = aceptado(
        actual.aplicacion().presentarItem({ dominio: actual.dominio, item, contexto: 'practica' }),
      );
    });
  },
);

// Los pasos se retiraron semanas antes de la presentación, así que van al principio de la cola: el
// reloj solo avanza. Ya en el instante de la presentación, la persona estudia el ejemplo y se le
// presenta de nuevo el ítem.
Given(
  'que {objetivo} tiene {int} paso(s) retirado(s) y la sesión le mostró antes un ejemplo resuelto',
  (objetivo: string, pasos: number) => {
    const actual = mundo();
    actual.prepararAntes(() => {
      retirarPasos(actual, objetivo, pasos);
    });
    actual.preparar(() => {
      const item = presente(actual.presentado, 'el ítem presentado').id;
      const ejemplo = presente(
        actual.contenido().objetivos.find((o) => o.id === objetivo)?.ejemplos_resueltos[0],
        'un ejemplo',
      );
      const app = actual.aplicacion();
      aceptado(app.estudiarEjemplo({ dominio: actual.dominio, objetivo, ejemplo: ejemplo.id }));
      actual.presentado = aceptado(app.presentarItem({ dominio: actual.dominio, item, contexto: 'practica' }));
    });
  },
);

// No usa `responder` porque este vuelve a presentar el ítem y la latencia saldría 0.
When(
  'la persona responde correctamente {decimal} segundos después y declara una confianza del {int} %',
  (segundos: number, confianza: number) => {
    const actual = mundo();
    const app = actual.listo();
    const item = presente(actual.presentado, 'el ítem presentado').id;
    actual.reloj.avanzarMs(Math.round(segundos * MS_POR_SEGUNDO));
    const peticion = { dominio: actual.dominio, item, contexto: 'practica' } as const;
    const respuesta = respuestaPara(actual.contenido().item(item), true);
    aceptado(app.responderItem({ ...peticion, respuesta }));
    actual.feedback = aceptado(app.declararConfianza({ dominio: actual.dominio, item, confianza }));
  },
);

Then('respuestas.csv tiene la fila {texto}', (fila: string) => {
  const lineas = exportarTexto(mundo(), 'respuestas.csv').split('\n');
  assert.ok(lineas.includes(fila), `respuestas.csv no tiene la fila «${fila}»:\n${lineas.join('\n')}`);
});

// --- El contexto de cada respuesta (INST-1.3) ------------------------------------------------------

/** Cómo se llega a responder un ítem en cada contexto; cada función deja respondido un ítem. */
const RESPONDER_EN: Readonly<Record<string, (actual: Mundo) => void>> = {
  diagnostico: (actual) => {
    actual.contenido().agregarItem({ id: ITEM_DE_PRUEBA, objetivo: OBJETIVO_DE_PRUEBA, diagnostico: true });
    aceptado(actual.listo().abrirDominio({ dominio: actual.dominio }));
    responder(actual, { item: ITEM_DE_PRUEBA, correcta: true, contexto: 'diagnostico' });
  },
  practica: (actual) => {
    actual.contenido().asegurarItem(ITEM_DE_PRUEBA);
    responder(actual, { item: ITEM_DE_PRUEBA, correcta: true, contexto: 'practica' });
  },
  repaso: (actual) => {
    actual.contenido().asegurarItem(ITEM_DE_PRUEBA);
    responder(actual, { item: ITEM_DE_PRUEBA, correcta: true, contexto: 'practica' });
    actual.reloj.avanzarDias(DIAS_HASTA_EL_REPASO);
    responder(actual, { item: ITEM_DE_PRUEBA, correcta: true, contexto: 'repaso' });
  },
  intercalado: (actual) => {
    actual.contenido().asegurarItemsPorObjetivo(1);
    actual.contenido().hacerIntercalables(1);
    const problema = presente(problemasIntercalables(actual)[0], 'un problema intercalable');
    responder(actual, { item: problema.id, correcta: true, contexto: 'intercalado' });
  },
  retencion: (actual) => {
    actual.contenido().asegurarItemsPorObjetivo(1);
    dominarObjetivo(actual, OBJETIVO_DE_PRUEBA);
    actual.reloj.avanzarDias(DIAS_HASTA_EL_REPASO);
    const item = presente(actual.contenido().itemsDe(OBJETIVO_DE_PRUEBA)[0], 'un ítem de O1');
    responder(actual, { item: item.id, correcta: true, contexto: 'retencion' });
  },
};

/** «en una sesión de práctica» → el contexto que le toca, por la frase del escenario. */
const CONTEXTO_DE_CADA_FRASE: readonly (readonly [string, string])[] = [
  ['en el diagnóstico', 'diagnostico'],
  ['en una sesión de práctica', 'practica'],
  ['en un repaso programado', 'repaso'],
  ['en una sesión intercalada', 'intercalado'],
  ['en una prueba de retención', 'retencion'],
];

When(/^la persona responde un ítem (en .+)$/, (donde: string) => {
  const actual = mundo();
  const contexto = presente(
    CONTEXTO_DE_CADA_FRASE.find(([frase]) => frase === donde)?.[1],
    `un contexto para «${donde}»`,
  );
  // Antes del diagnóstico no hay diagnóstico previo: lo hace el propio escenario.
  actual.diagnosticoPrevio = contexto !== 'diagnostico';
  actual.listo();
  presente(RESPONDER_EN[contexto], `cómo responder ${donde}`)(actual);
});

function comprobarContexto(contexto: string): void {
  assert.equal(ultimaFila(mundo(), 'respuestas.csv')['contexto'], contexto);
}

Then('su fila en respuestas.csv tiene el contexto {texto}', comprobarContexto);

Then('el resultado queda registrado en respuestas.csv con el contexto {texto}', comprobarContexto);

Then('el intento queda registrado en respuestas.csv con el contexto {texto}', comprobarContexto);

// --- Una evaluación externa, una fila por criterio (INST-1.4) --------------------------------------

Given('que la rúbrica de {tarea} tiene los criterios {textos}', (tarea: string, criterios: string[]) => {
  const contenido = mundo().contenido();
  contenido.asegurarTarea(tarea);
  contenido.fijarRubrica(tarea, criterios.map(criterioPorDefecto));
});

Then('evaluaciones_externas.csv tiene estas filas:', (tabla: DataTable) => {
  assert.deepEqual(filasDelDominio(mundo(), 'evaluaciones_externas.csv'), tabla.hashes());
});

// --- La exportación es completa y ordenada (INST-2) ------------------------------------------------

Given('que la persona no ha registrado ninguna hora', () => {
  // Es el estado de partida: todavía no ha registrado ninguna.
});

Then('el fichero tiene solo la fila de cabecera', () => {
  const csv = csvExportado();
  assert.ok(csv.cabecera.length > 0, 'El fichero no tiene ni siquiera la cabecera');
  assert.deepEqual(csv.filas, []);
});

function responderEnElDominio(dominio: string, fecha: string): void {
  const actual = mundo();
  actual.contenido(dominio).asegurarItem(ITEM_DE_PRUEBA);
  actual.preparar(() => {
    actual.reloj.fijar(instanteUtc(fecha, HORA_DE_RESPONDER));
    responder(actual, { item: ITEM_DE_PRUEBA, correcta: true, dominio });
  });
}

Given('que la persona respondió un ítem del dominio {texto} el {fecha}', responderEnElDominio);

Given('respondió un ítem del dominio {texto} el {fecha}', responderEnElDominio);

function comprobarFilaDeDatos(posicion: number, fecha: string, dominio: string): void {
  const fila = presente(
    exportar(mundo(), 'respuestas.csv').filas[posicion],
    `la fila de datos ${String(posicion + 1)}`,
  );
  assert.ok(fila['fecha']?.startsWith(fecha), `La fila ${String(posicion + 1)} es del ${fila['fecha'] ?? ''}`);
  assert.equal(fila['dominio'], dominio);
}

Then('la primera fila de datos es la del {fecha}, del dominio {texto}', (fecha: string, dominio: string) => {
  comprobarFilaDeDatos(0, fecha, dominio);
});

Then('la segunda es la del {fecha}, del dominio {texto}', (fecha: string, dominio: string) => {
  comprobarFilaDeDatos(1, fecha, dominio);
});

When('la persona abre la exportación', () => {
  mundo().exportaciones = aceptado(mundo().listo().listarExportaciones());
});

// «a.csv, b.csv y c.csv» → los tres nombres
Then(/^puede descargar (.+)$/, (lista: string) => {
  assert.deepEqual(
    presente(mundo().exportaciones, 'la lista de exportaciones').toSorted(),
    FICHEROS_EXPORTABLES.toSorted(),
  );
  assert.deepEqual(lista.split(/, | y /).toSorted(), FICHEROS_EXPORTABLES.toSorted());
});

// --- Los cambios de estado quedan registrados (AYUD, MAST) -----------------------------------------

Then('el cambio queda registrado en {fichero}', (fichero: string) => {
  const actual = mundo();
  const fila = ultimaFila(actual, fichero);
  assert.ok(fila['fecha']?.startsWith(soloFecha(actual.reloj.ahora())), `El último cambio de ${fichero} no es de hoy`);
});

Then('no se registra ningún cambio en {fichero}', (fichero: string) => {
  const actual = mundo();
  const hoy = soloFecha(actual.reloj.ahora());
  assert.deepEqual(
    filasDelDominio(actual, fichero).filter((fila) => fila['fecha']?.startsWith(hoy)),
    [],
  );
});

Then('la fase pasa de {texto} a {texto}', (anterior: string, nueva: string) => {
  const fila = ultimaFila(mundo(), 'cambios_fase.csv');
  assert.deepEqual([fila['fase_anterior'], fila['fase_nueva']], [anterior, nueva]);
});
