import { expect, it } from 'vitest';
import { EstadoPersona, type Entorno } from '../../src/aplicacion/estado.ts';
import { responderItem } from '../../src/aplicacion/respuestas.ts';
import { AHORA, dependenciasDePrueba } from './dependencias-de-prueba.ts';
import { ficherosEnMemoria } from './ficheros-en-memoria.ts';
import { escribirMesa, item, mesaDe, objetivo } from './revision-fabricas.ts';

const DOMINIO = 'ficticio';

/** Un entorno ya fuera del diagnóstico, con un solo ítem: N1, numérico, de valor 10 y sin unidad. */
function entornoConItemNumerico(): Entorno {
  const { ficheros } = ficherosEnMemoria();
  const numerico = { ...item('N1'), respuesta: { valor: 10 } };
  escribirMesa(ficheros, mesaDe({}, { objetivos: [objetivo('O1')], items: [numerico] }), DOMINIO);
  const dependencias = dependenciasDePrueba(ficheros, () => ({
    umbral_dominio: { valor: 0.85 },
    items_entre_intento_y_reintento: { valor: 3 },
    aciertos_para_cerrar_item_en_sesion: { valor: 1 },
    tolerancia_numerica_relativa: { valor: 0.01 },
  }));
  const entorno: Entorno = { dependencias, persona: new EstadoPersona() };
  entorno.persona.estadoDe(DOMINIO).cambiarFase(AHORA, 'novato');
  return entorno;
}

const reintentar = (entorno: Entorno, respuesta: string) =>
  responderItem(entorno, { dominio: DOMINIO, item: 'N1', contexto: 'reintento', respuesta });

it('@RECU-5.11 @RECU-6.3 el reintento fallado de un ítem numérico dice qué parte falla', () => {
  expect(reintentar(entornoConItemNumerico(), '20')).toMatchObject({
    ok: true,
    valor: { esperandoConfianza: false, feedback: { correcta: false, numerico: { valor: 'distinto', margen: 0.01 } } },
  });
});

it('@RECU-5.1 @RECU-6.3 el reintento de un ítem numérico se corrige con el margen', () => {
  const recogida = reintentar(entornoConItemNumerico(), '10,05');
  expect(recogida).toMatchObject({ ok: true, valor: { esperandoConfianza: false, feedback: { correcta: true } } });
  expect(recogida).not.toHaveProperty('valor.feedback.numerico');
});
