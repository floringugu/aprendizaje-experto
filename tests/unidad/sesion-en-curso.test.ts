import { describe, expect, it, vi } from 'vitest';
import type { Dependencias } from '../../src/aplicacion/dependencias.ts';
import { EstadoPersona, type Entorno, type SesionEnCurso } from '../../src/aplicacion/estado.ts';
import { exportarCsv } from '../../src/aplicacion/csv.ts';
import { iniciarSesion } from '../../src/aplicacion/practica.ts';
import type { ParametrosJson } from '../../src/aplicacion/puertos.ts';
import { declararConfianza, responderItem } from '../../src/aplicacion/respuestas.ts';
import type { Resultado } from '../../src/aplicacion/resultado.ts';
import { consultarSesion, sesionTrasElIntento, terminarSesion } from '../../src/aplicacion/sesion-en-curso.ts';
import type { ContextoRespuesta, Sesion } from '../../src/aplicacion/sesiones.ts';
import { colaInicial } from '../../src/dominio/reintentos.ts';
import { ficherosEnMemoria } from './ficheros-en-memoria.ts';
import { ejemplo, escribirMesa, item, mesaDe, objetivo } from './revision-fabricas.ts';

const DOMINIO = 'ficticio';
const AHORA = new Date('2026-01-01T00:00:00Z');
const SIN_SESION = { ok: false, motivo: 'No hay ninguna sesión en curso.' };
const MOTIVO_DIAGNOSTICO = { ok: false, motivo: 'Primero hay que terminar el diagnóstico.' };

/** Los valores de config/parametros.json que usan las sesiones: separación 3 y un acierto para cerrar. */
const PARAMETROS: ParametrosJson = {
  umbral_dominio: { valor: 0.85 },
  items_entre_intento_y_reintento: { valor: 3 },
  aciertos_para_cerrar_item_en_sesion: { valor: 1 },
};

/** I1 a I6, todos con opciones «a» (correcta) y «b»; solo I1 e I2 son del diagnóstico. */
const ITEMS = ['I1', 'I2', 'I3', 'I4', 'I5', 'I6'].map((id) => ({ ...item(id), diagnostico: id <= 'I2' }));

const sinUso = (): never => {
  throw new Error('Este test no usa este puerto');
};

/** Un entorno con el dominio guardado y los parámetros que devuelva `leer` en cada llamada. */
function crearEntorno(leer: () => ParametrosJson = () => PARAMETROS): Entorno {
  const { ficheros } = ficherosEnMemoria();
  escribirMesa(ficheros, mesaDe({}, { objetivos: [objetivo('O1', [ejemplo('E1')])], items: ITEMS }), DOMINIO);
  const dependencias: Dependencias = {
    ficheros,
    reloj: { ahora: () => AHORA },
    leerParametros: leer,
    direccion: 'http://192.168.1.20:3000',
    planificadorFsrs: { programar: sinUso, recalcular: sinUso },
    leerIa: () => undefined,
    libreOffice: { instalado: () => Promise.resolve(false), convertirAPdf: sinUso },
    web: { descargar: () => Promise.resolve(undefined) },
    claudeCode: { iniciarSesion: sinUso, estado: () => Promise.resolve({ iniciada: false }) },
    temporizador: { programar: () => () => undefined },
  };
  return { dependencias, persona: new EstadoPersona() };
}

/** Un entorno con el diagnóstico ya terminado: ahí se practica. */
function entornoDePractica(leer?: () => ParametrosJson): Entorno {
  const entorno = crearEntorno(leer);
  entorno.persona.estadoDe(DOMINIO).cambiarFase(AHORA, 'novato');
  return entorno;
}

function aceptado<T>(resultado: Resultado<T>): T {
  if (!resultado.ok) throw new Error(`Se esperaba éxito y fue un rechazo: ${resultado.motivo}`);
  return resultado.valor;
}

const peticion = { dominio: DOMINIO } as const;
const consultar = (entorno: Entorno) => consultarSesion(entorno, peticion);
const practicar = (entorno: Entorno) => iniciarSesion(entorno, { ...peticion, tipo: 'practica', objetivo: 'O1' });
const registro = (entorno: Entorno) => entorno.persona.estadoDe(DOMINIO).registro;

/** Lo que queda por presentar, en orden: el ítem que vuelve lleva ↺ detrás. */
function pendientes(entorno: Entorno): string[] {
  return aceptado(consultar(entorno)).elementos.flatMap((elemento) => {
    if (elemento.tipo === 'ejemplo') return [];
    return [elemento.reintento === true ? `${elemento.item.id}↺` : elemento.item.id];
  });
}

/** Una respuesta: el ítem, el contexto en que se responde y si acierta. */
type Respuesta = readonly [id: string, contexto: ContextoRespuesta, correcta: boolean];

/** La persona responde el ítem con «a» (acierta) o «b» (falla). Un reintento no pide confianza; el resto, sí. */
function responder(entorno: Entorno, [id, contexto, correcta]: Respuesta) {
  const respuesta = correcta ? 'a' : 'b';
  const recogida = aceptado(responderItem(entorno, { ...peticion, item: id, contexto, respuesta }));
  if (recogida.esperandoConfianza) {
    aceptado(declararConfianza(entorno, { ...peticion, item: id, confianza: 3 }));
  }
  return recogida;
}

describe('sin sesión en curso', () => {
  const CASOS_SIN_SESION = [
    ['consultarSesion', consultarSesion],
    ['terminarSesion', terminarSesion],
  ] as const;

  it.each(CASOS_SIN_SESION)('@RECU-6.7 %s rechaza si no se ha iniciado ninguna', (_nombre, caso) => {
    expect(caso(entornoDePractica(), peticion)).toMatchObject(SIN_SESION);
  });

  it.each(CASOS_SIN_SESION)('@RECU-6.7 %s rechaza el dominio que no es válido', (_nombre, caso) => {
    expect(caso(entornoDePractica(), { dominio: '../fuera' })).toMatchObject({ ok: false, campo: 'dominio' });
  });

  it('@RECU-6.7 terminar la sesión la olvida, aunque queden ítems por volver', () => {
    const entorno = entornoDePractica();
    practicar(entorno);
    responder(entorno, ['I1', 'practica', false]);
    expect(terminarSesion(entorno, peticion)).toStrictEqual({ ok: true, valor: null });
    expect(consultar(entorno)).toMatchObject(SIN_SESION);
    expect(terminarSesion(entorno, peticion)).toMatchObject(SIN_SESION);
  });

  it('@RECU-6.7 un ítem que se responde como reintento sin sesión se registra y no crea ninguna', () => {
    const entorno = entornoDePractica();
    const recogida = responder(entorno, ['I1', 'reintento', false]);
    expect(recogida).toMatchObject({ esperandoConfianza: false, feedback: { correcta: false } });
    expect(registro(entorno).intentos).toHaveLength(1);
    expect(consultar(entorno)).toMatchObject(SIN_SESION);
  });
});

describe('el diagnóstico pendiente', () => {
  it('@RECU-6.8 la sesión en curso es el diagnóstico: solo sus ítems, y ninguno vuelve', () => {
    const entorno = crearEntorno();
    expect(aceptado(consultar(entorno))).toMatchObject({ tipo: 'diagnostico', intercalada: false });
    expect(pendientes(entorno)).toStrictEqual(['I1', 'I2']);
  });

  it('@RECU-6.8 un ítem del diagnóstico respondido y fallado no sale ni vuelve', () => {
    const entorno = crearEntorno();
    responder(entorno, ['I1', 'diagnostico', false]);
    expect(pendientes(entorno)).toStrictEqual(['I2']);
  });

  it('@RECU-6.7 no se deja: terminarSesion rechaza y el diagnóstico sigue ahí', () => {
    const entorno = crearEntorno();
    expect(terminarSesion(entorno, peticion)).toMatchObject(MOTIVO_DIAGNOSTICO);
    expect(pendientes(entorno)).toStrictEqual(['I1', 'I2']);
  });
});

describe('la sesión en curso: lo que queda por presentar', () => {
  it('@RECU-6.1 una sesión recién iniciada tiene todo por presentar, con su ejemplo delante', () => {
    const entorno = entornoDePractica();
    const iniciada = aceptado(practicar(entorno));
    expect(iniciada.elementos[0]?.tipo).toBe('ejemplo');
    expect(consultar(entorno)).toStrictEqual({ ok: true, valor: iniciada });
  });

  it('@RECU-6.1 el ítem fallado vuelve marcado, y los ejemplos y los demás ítems siguen tal cual', () => {
    const entorno = entornoDePractica();
    const iniciada = aceptado(practicar(entorno));
    responder(entorno, ['I1', 'practica', false]);
    const porId = (id: string) => iniciada.elementos.filter((e) => e.tipo === 'item' && e.item.id === id);
    expect(aceptado(consultar(entorno))).toStrictEqual({
      tipo: 'practica',
      intercalada: false,
      elementos: [
        iniciada.elementos[0],
        ...porId('I2'),
        ...porId('I3'),
        ...porId('I4'),
        { ...porId('I1')[0], reintento: true },
        ...porId('I5'),
        ...porId('I6'),
      ],
    });
  });

  it('@RECU-6.2 el ítem acertado deja de estar pendiente y no vuelve', () => {
    const entorno = entornoDePractica();
    practicar(entorno);
    responder(entorno, ['I1', 'practica', true]);
    expect(pendientes(entorno)).toStrictEqual(['I2', 'I3', 'I4', 'I5', 'I6']);
  });

  it('@RECU-6.5 el reintento fallado vuelve y el acertado cierra el ítem', () => {
    const entorno = entornoDePractica();
    practicar(entorno);
    responder(entorno, ['I1', 'practica', false]);
    responder(entorno, ['I1', 'reintento', false]);
    expect(pendientes(entorno)).toStrictEqual(['I2', 'I3', 'I4', 'I1↺', 'I5', 'I6']);
    responder(entorno, ['I1', 'reintento', true]);
    expect(pendientes(entorno)).toStrictEqual(['I2', 'I3', 'I4', 'I5', 'I6']);
  });

  it('@RECU-6.9 cada intento lee la configuración de ese momento', () => {
    let parametros = PARAMETROS;
    const entorno = entornoDePractica(() => parametros);
    practicar(entorno);
    responder(entorno, ['I1', 'practica', false]);
    parametros = { ...PARAMETROS, items_entre_intento_y_reintento: { valor: 1 } };
    responder(entorno, ['I2', 'practica', false]);
    expect(pendientes(entorno)).toStrictEqual(['I3', 'I2↺', 'I4', 'I1↺', 'I5', 'I6']);
  });

  it('@RECU-6.7 un reintento de un ítem que no volvía se registra y la sesión sigue igual', () => {
    const entorno = entornoDePractica();
    practicar(entorno);
    responder(entorno, ['I1', 'reintento', false]);
    expect(registro(entorno).intentos).toHaveLength(1);
    expect(pendientes(entorno)).toStrictEqual(['I1', 'I2', 'I3', 'I4', 'I5', 'I6']);
  });

  it('@RECU-6.7 al iniciar otra sesión, lo que quedaba por volver de la anterior no pasa a la nueva', () => {
    const entorno = entornoDePractica();
    practicar(entorno);
    responder(entorno, ['I1', 'practica', false]);
    const nueva = aceptado(practicar(entorno));
    expect(pendientes(entorno)).toStrictEqual(['I1', 'I2', 'I3', 'I4', 'I5', 'I6']);
    expect(aceptado(consultar(entorno))).toStrictEqual(nueva);
  });

  it('@RECU-6.7 una sesión que se rechaza no cambia la que estaba en curso', () => {
    const entorno = entornoDePractica();
    practicar(entorno);
    responder(entorno, ['I1', 'practica', false]);
    expect(iniciarSesion(entorno, { ...peticion, tipo: 'practica', objetivo: 'O9' }).ok).toBe(false);
    expect(pendientes(entorno)).toStrictEqual(['I2', 'I3', 'I4', 'I1↺', 'I5', 'I6']);
  });

  it('@RECU-6.1 una entrada de la cola que no es de la sesión no sale (regla que la feature no cubre)', () => {
    const entorno = entornoDePractica();
    const sesion = aceptado(practicar(entorno));
    const cola = colaInicial(['I9', 'I1']);
    entorno.persona.estadoDe(DOMINIO).cambiarSesion({ sesion, cola });
    expect(pendientes(entorno)).toStrictEqual(['I1']);
  });

  it('@RECU-6.7 el repaso que se inicia pasa a ser la sesión en curso', () => {
    const entorno = entornoDePractica();
    practicar(entorno);
    responder(entorno, ['I1', 'practica', true]);
    responder(entorno, ['I2', 'practica', false]);
    const repaso = aceptado(iniciarSesion(entorno, { ...peticion, tipo: 'repaso' }));
    expect(repaso.tipo).toBe('repaso');
    expect(aceptado(consultar(entorno))).toStrictEqual(repaso);
  });
});

describe('el reintento y la confianza', () => {
  it('@RECU-6.3 el reintento da el feedback con la respuesta, sin pedir la confianza', () => {
    const entorno = entornoDePractica();
    practicar(entorno);
    responder(entorno, ['I1', 'practica', false]);
    const recogida = aceptado(
      responderItem(entorno, { ...peticion, item: 'I1', contexto: 'reintento', respuesta: 'a' }),
    );
    const feedback = { correcta: true, respuestaCorrecta: 'a', explicacion: 'Feedback' };
    expect(recogida).toStrictEqual({ esperandoConfianza: false, feedback });
  });

  it('@RECU-6.3 el intento del reintento se registra sin confianza, y en respuestas.csv queda vacía', () => {
    const entorno = entornoDePractica();
    responder(entorno, ['I1', 'practica', true]);
    responder(entorno, ['I2', 'reintento', false]);
    const [primero, segundo] = registro(entorno).intentos;
    expect(primero).toMatchObject({ contexto: 'practica', confianza: 3 });
    expect(segundo).toMatchObject({ contexto: 'reintento', item: 'I2', correcta: false });
    expect(segundo).not.toHaveProperty('confianza');
    const [cabecera, ...filas] = aceptado(exportarCsv(entorno, { fichero: 'respuestas.csv' }))
      .trim()
      .split('\n')
      .map((linea) => linea.split(','));
    const columna = cabecera?.indexOf('confianza') ?? -1;
    expect(filas.map((fila) => fila[columna])).toStrictEqual(['3', '']);
  });

  it('@RECU-6.3 lo que no es un reintento sigue esperando la confianza: hasta declararla no se registra nada', () => {
    const entorno = entornoDePractica();
    practicar(entorno);
    const recogida = aceptado(
      responderItem(entorno, { ...peticion, item: 'I1', contexto: 'practica', respuesta: 'b' }),
    );
    expect(recogida).toStrictEqual({ esperandoConfianza: true });
    expect(registro(entorno).intentos).toHaveLength(0);
    expect(pendientes(entorno)).toStrictEqual(['I1', 'I2', 'I3', 'I4', 'I5', 'I6']);
    aceptado(declararConfianza(entorno, { ...peticion, item: 'I1', confianza: 2 }));
    expect(pendientes(entorno)).toStrictEqual(['I2', 'I3', 'I4', 'I1↺', 'I5', 'I6']);
  });

  it('@RECU-6.3 un reintento durante el diagnóstico pendiente se rechaza y no registra nada', () => {
    const entorno = crearEntorno();
    const recogida = responderItem(entorno, { ...peticion, item: 'I1', contexto: 'reintento', respuesta: 'a' });
    expect(recogida).toMatchObject(MOTIVO_DIAGNOSTICO);
    expect(registro(entorno).intentos).toHaveLength(0);
  });

  it('@RECU-6.9 si falta un parámetro del reintento, el intento no queda registrado', () => {
    const faltaUno: ParametrosJson = { umbral_dominio: { valor: 0.85 }, items_entre_intento_y_reintento: { valor: 3 } };
    const entorno = entornoDePractica(() => faltaUno);
    practicar(entorno);
    expect(() => responder(entorno, ['I1', 'practica', false])).toThrow('aciertos_para_cerrar_item_en_sesion');
    expect(registro(entorno).intentos).toHaveLength(0);
    expect(entorno.persona.estadoDe(DOMINIO).respuestaPendiente('I1')).toBeDefined();
  });
});

describe('sesionTrasElIntento', () => {
  const sesion: Sesion = { tipo: 'practica', intercalada: false, elementos: [] };
  const enCurso: SesionEnCurso = { sesion, cola: colaInicial(['I1', 'I2']) };
  const intento = (contexto: ContextoRespuesta, correcta: boolean) => ({ item: 'I1', contexto, correcta });
  const NO_CUENTAN: ContextoRespuesta[] = ['exploracion', 'prepregunta', 'experimento_estudio', 'experimento_prueba'];

  it('@RECU-6.7 sin sesión en curso no cambia nada ni lee los parámetros', () => {
    const leer = vi.fn(() => PARAMETROS);
    expect(sesionTrasElIntento(crearEntorno(leer), undefined, intento('practica', false))).toBeUndefined();
    expect(leer).not.toHaveBeenCalled();
  });

  it.each(NO_CUENTAN)('@RECU-6.1 un intento de %s no cuenta: ni cambia la sesión ni lee los parámetros', (contexto) => {
    const leer = vi.fn(() => PARAMETROS);
    expect(sesionTrasElIntento(crearEntorno(leer), enCurso, intento(contexto, false))).toBe(enCurso);
    expect(leer).not.toHaveBeenCalled();
  });

  it.each<ContextoRespuesta>(['practica', 'repaso', 'intercalado'])(
    '@RECU-6.1 el fallo de un intento de %s enseña: el ítem vuelve',
    (contexto) => {
      const nueva = sesionTrasElIntento(crearEntorno(), enCurso, intento(contexto, false));
      expect(nueva?.cola.pendientes).toStrictEqual([
        { item: 'I2', reintento: false },
        { item: 'I1', reintento: true },
      ]);
      expect(nueva?.sesion).toBe(sesion);
    },
  );

  it.each<ContextoRespuesta>(['diagnostico', 'retencion', 'transferencia'])(
    '@RECU-6.8 el fallo de un intento de %s solo mide: el ítem no vuelve',
    (contexto) => {
      const nueva = sesionTrasElIntento(crearEntorno(), enCurso, intento(contexto, false));
      expect(nueva?.cola.pendientes).toStrictEqual([{ item: 'I2', reintento: false }]);
    },
  );

  it('@RECU-6.4 el reintento acertado cierra el ítem con la configuración actual', () => {
    const volviendo: SesionEnCurso = {
      sesion,
      cola: { ...enCurso.cola, pendientes: [{ item: 'I1', reintento: true }] },
    };
    const nueva = sesionTrasElIntento(crearEntorno(), volviendo, intento('reintento', true));
    expect(nueva?.cola.pendientes).toStrictEqual([]);
    expect(nueva?.cola.aciertos.get('I1')).toBe(1);
  });
});
