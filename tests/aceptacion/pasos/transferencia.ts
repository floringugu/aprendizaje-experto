import assert from 'node:assert/strict';
import { Given, Then, When } from '@cucumber/cucumber';
import type { EvaluacionFase } from '../../../src/aplicacion/dominio.ts';
import { responderItems } from '../soporte/acciones.ts';
import { esperarCasiIgual, presente } from '../soporte/comprobar.ts';
import type { ItemDePrueba } from '../soporte/contenido.ts';
import { aceptado, mundo } from '../soporte/mundo.ts';
import type { Mundo } from '../soporte/mundo.ts';

// Pasos de la transferencia a casos nuevos (MAST-6.7 a 6.14): los problemas reservados del paso a
// la fase avanzada. Un reservado (`reservado: true`) es un caso que la persona no practica: se le
// presenta una sola vez. Los pasos de los reservados en general (MAST-8) están en reservados-mast.ts.

/**
 * Lo que la evaluación de la fase dice de la transferencia. `EvaluacionFase` aún no lo tiene (lo
 * añade el ticket mast-transferencia), así que se declara aquí por intersección. Está en
 * «Transferencia y exploración (etapa 3)» de docs/areas/MAST.md.
 */
type EvaluacionConTransferencia = EvaluacionFase & {
  /** Acierto sobre todos los problemas reservados respondidos, los viejos y los nuevos (MAST-6.12). */
  readonly aciertoProblemasReservados?: number;
  /** Faltan problemas reservados, por pocos o por haberse gastado todos sin llegar al umbral (MAST-6.9). */
  readonly faltanCasosNuevos?: boolean;
  /** Se ofrece pedir más problemas reservados (MATE-2.10). */
  readonly ofrecePedirMasReservados?: boolean;
};

function evaluacionDeLaFase(): EvaluacionConTransferencia {
  return presente(mundo().evaluacionFase, 'ninguna evaluación de fase');
}

function reservadosSinIntento(actual: Mundo): readonly ItemDePrueba[] {
  return actual
    .contenido()
    .reservados()
    .filter((item) => !actual.intentos.has(item.id));
}

/** Responde en la mezcla los reservados: acierta los `aciertos` primeros y falla el resto. */
function responderReservados(actual: Mundo, peticion: { items: readonly ItemDePrueba[]; aciertos: number }): void {
  responderItems(actual, { ...peticion, contexto: 'intercalado' });
}

// --- La configuración ----------------------------------------------------------------------------

Given('que el umbral de transferencia configurado es del {fraccion}', (fraccion: number) => {
  mundo().establecerParametro('umbral_transferencia', fraccion);
});

Given('que el mínimo de problemas reservados configurado es {int}', (minimo: number) => {
  mundo().establecerParametro('minimo_problemas_reservados', minimo);
});

// --- Los problemas reservados del paso a la fase avanzada (MAST-6) -------------------------------

// Los problemas se reparten por turno entre los objetivos: el primer ítem de cada uno, luego el segundo…
Given(
  'que {ids} tienen {int} ítems de tipo «problema» en categorías intercalables',
  (objetivos: string[], cantidad: number) => {
    const contenido = mundo().contenido();
    objetivos
      .flatMap((objetivo) => contenido.itemsDe(objetivo).map((item, orden) => ({ item, orden })))
      .sort((uno, otro) => uno.orden - otro.orden)
      .slice(0, cantidad)
      .forEach(({ item }) => {
        contenido.cambiarItem(item.id, { tipo: 'problema' });
      });
    contenido.asignarCategoriasIntercalables();
  },
);

Given(
  'que el dominio tiene (además ){int} problemas reservados en categorías con grupo de parecidas(, todos respondidos)',
  (cantidad: number) => {
    mundo().contenido().agregarReservadosIntercalables(cantidad);
  },
);

Given(
  'que el dominio tiene además {int} problemas reservados en categorías con grupo de parecidas, todos respondidos y acertados',
  (cantidad: number) => {
    const actual = mundo();
    const nuevos = actual.contenido().agregarReservadosIntercalables(cantidad);
    actual.preparar(() => {
      responderReservados(actual, { items: nuevos, aciertos: cantidad });
    });
  },
);

Given('que el dominio no tiene ningún problema reservado en categorías con grupo de parecidas', () => {
  const actual = mundo();
  actual.contenido().hacerIntercalables(0);
  assert.deepEqual(actual.contenido().reservados(), [], 'El contenido ya tiene reservados');
});

Given('que la persona acertó {int} de ellos', (aciertos: number) => {
  const actual = mundo();
  actual.preparar(() => {
    responderReservados(actual, { items: reservadosSinIntento(actual), aciertos });
  });
});

Given('que la persona acertó {int} de ellos y nunca ha respondido el décimo', (aciertos: number) => {
  const actual = mundo();
  actual.preparar(() => {
    responderReservados(actual, { items: reservadosSinIntento(actual).slice(0, aciertos), aciertos });
  });
});

Given('que en su último intento intercalado acertó los {int}', (cantidad: number) => {
  const actual = mundo();
  actual.preparar(() => {
    const problemas = actual.contenido().problemasIntercalables();
    assert.equal(problemas.length, cantidad, `El dominio no tiene ${String(cantidad)} problemas intercalables`);
    responderItems(actual, { items: problemas, aciertos: cantidad, contexto: 'intercalado' });
  });
});

Given('que la aplicación le indicó que faltan casos nuevos para medir la transferencia', () => {
  const actual = mundo();
  actual.preparar(() => {
    actual.evaluacionFase = aceptado(actual.aplicacion().evaluarFase({ dominio: actual.dominio }));
    assert.equal(evaluacionDeLaFase().faltanCasosNuevos, true, 'La aplicación no avisó de que faltan casos nuevos');
  });
});

When('se aprueban {int} problemas reservados nuevos en categorías con grupo de parecidas', (cantidad: number) => {
  const actual = mundo();
  actual.listo();
  actual.contenido().agregarReservadosIntercalables(cantidad);
});

When('la persona los responde y acierta los {int}', (cantidad: number) => {
  const actual = mundo();
  actual.listo();
  const nuevos = reservadosSinIntento(actual);
  assert.equal(
    nuevos.length,
    cantidad,
    `Hay ${String(nuevos.length)} reservados por responder y no ${String(cantidad)}`,
  );
  responderReservados(actual, { items: nuevos, aciertos: cantidad });
});

Then('la aplicación indica que faltan casos nuevos para medir la transferencia', () => {
  assert.equal(evaluacionDeLaFase().faltanCasosNuevos, true, 'La aplicación no avisa de que faltan casos nuevos');
});

Then('ofrece pedir más problemas reservados', () => {
  assert.equal(evaluacionDeLaFase().ofrecePedirMasReservados, true, 'La aplicación no ofrece pedir más reservados');
});

// Con problemas reservados en el dominio, solo se llega a la fase avanzada midiendo la transferencia:
// la evaluación tiene que dar el acierto en ellos. Sin esto, contarlos como problemas normales pasaría.
Then('la fase es {texto}', (fase: string) => {
  const evaluacion = evaluacionDeLaFase();
  assert.equal(evaluacion.fase, fase);
  if (fase === 'avanzado_experto' && mundo().contenido().reservados().length > 0) {
    assert.notEqual(evaluacion.aciertoProblemasReservados, undefined, 'La evaluación no mide la transferencia');
  }
});

Then(
  'la fase es {texto}, porque acertó {int} de {int} problemas reservados',
  (fase: string, aciertos: number, total: number) => {
    const evaluacion = evaluacionDeLaFase();
    assert.equal(evaluacion.fase, fase);
    esperarCasiIgual(evaluacion.aciertoProblemasReservados, aciertos / total, 'Acierto en los problemas reservados');
  },
);
