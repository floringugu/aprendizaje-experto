import { describe, expect, it } from 'vitest';
import type { Dependencias } from '../../src/aplicacion/dependencias.ts';
import { EstadoDominio, EstadoPersona, type Entorno, type IntentoNuevo } from '../../src/aplicacion/estado.ts';
import { guardarDocumento } from '../../src/aplicacion/material-guardado.ts';
import type { Mesa } from '../../src/aplicacion/mesa.ts';
import type { Ficheros } from '../../src/aplicacion/puertos.ts';
import { declararConfianza, presentarItem, responderItem } from '../../src/aplicacion/respuestas.ts';
import type { Resultado } from '../../src/aplicacion/resultado.ts';
import { verFuente, type FuenteAbierta } from '../../src/aplicacion/revision-del-material.ts';
import { ficherosEnMemoria } from './ficheros-en-memoria.ts';
import { FUENTE_BUENA, FUENTE_MALA, ejemplo, item, mesaDe, objetivo, tarea } from './revision-fabricas.ts';

const DOMINIO = 'ficticio';
const AHORA = new Date('2026-01-01T00:00:00Z');
const UMBRAL = 0.85;
const TEXTO_DE_LA_PAGINA = 'Esta página dice buena.';

const codificar = (valor: unknown): Uint8Array => new TextEncoder().encode(JSON.stringify(valor, null, '  '));

/** Un ítem del diagnóstico: es el único que `presentarItem` acepta mientras el diagnóstico está pendiente. */
const itemDelDiagnostico = (id: string, fuente?: typeof FUENTE_BUENA) => ({ ...item(id, fuente), diagnostico: true });

/**
 * Lo aprobado: I7 con fuente buena (del diagnóstico), I1 escrito a mano (sin fuente) e I3 con una cita que no
 * está en el material. Lo del borrador: una pieza de cada tipo con fuente buena, un ejemplo aparte, y un
 * ítem sin fuente y otro con cita no encontrada.
 */
const MESA: Mesa = mesaDe(
  {
    objetivos: [objetivo('O2', [ejemplo('E1', FUENTE_BUENA)], FUENTE_BUENA)],
    ejemplos_resueltos: [{ ...ejemplo('E2', FUENTE_BUENA), objetivo: 'O1' }],
    items: [item('I9', FUENTE_BUENA), item('I10'), item('I11', FUENTE_MALA)],
    tareas: [tarea('T1', FUENTE_BUENA)],
  },
  {
    objetivos: [objetivo('O1', [], FUENTE_BUENA)],
    items: [itemDelDiagnostico('I7', FUENTE_BUENA), item('I1'), item('I3', FUENTE_MALA)],
  },
);

/** El material con tres páginas: solo la segunda dice «buena», que es el fragmento de FUENTE_BUENA. */
function guardarApuntes(ficheros: Ficheros): void {
  const paginas = ['Antes de la cita.', TEXTO_DE_LA_PAGINA, 'Después de la cita.'];
  guardarDocumento(ficheros, DOMINIO, { nombre: 'apuntes.pdf', bytes: new Uint8Array(), paginas });
}

const noSeUsa = (): never => {
  throw new Error('Este caso de uso no usa este puerto');
};

/** Las dependencias de la aplicación: solo los ficheros y lo que leen las sesiones hacen algo; el resto es relleno. */
function dependenciasDe(ficheros: Ficheros, contenido: unknown): Dependencias {
  return {
    reloj: { ahora: () => AHORA },
    leerParametros: () => ({ umbral_dominio: { valor: UMBRAL } }),
    leerContenido: () => contenido,
    planificadorFsrs: { programar: noSeUsa, recalcular: noSeUsa },
    ficheros,
    leerIa: () => undefined,
    libreOffice: { instalado: () => Promise.resolve(false), convertirAPdf: noSeUsa },
    web: { descargar: () => Promise.resolve(undefined) },
    claudeCode: { iniciarSesion: noSeUsa, estado: () => Promise.resolve({ iniciada: false }) },
    temporizador: { programar: () => () => undefined },
  };
}

/** Los ficheros de la mesa, con el material guardado, y un entorno sin ningún dominio abierto. */
function preparar(mesa: Mesa = MESA, conMaterial = true) {
  const { ficheros, contenidos } = ficherosEnMemoria();
  ficheros.escribir(`contenido/borradores/${DOMINIO}.json`, codificar(mesa.borrador));
  ficheros.escribir(`contenido/${DOMINIO}.json`, codificar(mesa.aprobado));
  if (conMaterial) guardarApuntes(ficheros);
  const entorno: Entorno = { dependencias: dependenciasDe(ficheros, mesa.aprobado), persona: new EstadoPersona() };
  return { entorno, contenidos };
}

const ver = (entorno: Entorno, pieza: string): Resultado<FuenteAbierta> =>
  verFuente(entorno, { dominio: DOMINIO, pieza });

/** Un rechazo con esa causa y un motivo que contiene ese texto. */
const rechazo = (causa: string, motivo: string) => ({
  ok: false,
  causa,
  motivo: expect.stringContaining(motivo) as unknown,
});

const HOJA = { documento: 'apuntes.pdf', lugar: 'página 12', fragmento: 'buena', texto: TEXTO_DE_LA_PAGINA };
const ANTES_DE_RESPONDER = rechazo('antes_de_responder', '«I7»');

describe('verFuente: la hoja', () => {
  it('@MATE-4.3 da la fuente con el texto de la página citada, y no el de las demás', () => {
    expect(ver(preparar().entorno, 'I9')).toStrictEqual({ ok: true, valor: HOJA });
  });

  it.each(['O2', 'E1', 'E2', 'I9', 'T1'])('@MATE-4.3 abre la fuente de %s, una pieza del borrador', (pieza) => {
    expect(ver(preparar().entorno, pieza)).toStrictEqual({ ok: true, valor: HOJA });
  });

  it.each(['O1', 'I7'])('@MATE-7.2 abre la fuente de %s, una pieza aprobada que no está en curso', (pieza) => {
    expect(ver(preparar().entorno, pieza)).toStrictEqual({ ok: true, valor: HOJA });
  });

  it('@MATE-4.3 solo da los campos de la fuente y el texto, aunque el borrador traiga más (regla que la feature no cubre)', () => {
    const conDeMas = { ...FUENTE_BUENA, nota: 'de la IA' };
    const { entorno } = preparar(mesaDe({ items: [item('I9', conDeMas)] }, MESA.aprobado));
    expect(ver(entorno, 'I9')).toStrictEqual({ ok: true, valor: HOJA });
  });

  it('@MATE-4.3 abrir la fuente no escribe nada y no abre el dominio (regla que la feature no cubre)', () => {
    const { entorno, contenidos } = preparar();
    const antes = [...contenidos];
    ver(entorno, 'I9');
    ver(entorno, 'I10');
    ver(entorno, 'I99');
    expect([...contenidos]).toStrictEqual(antes);
    expect(entorno.persona.todosLosDominios.has(DOMINIO)).toBe(false);
  });
});

describe('verFuente: los rechazos', () => {
  it('@MATE-4.3 una pieza que no está en la mesa rechaza con pieza_no_encontrada', () => {
    expect(ver(preparar().entorno, 'I99')).toMatchObject(rechazo('pieza_no_encontrada', '«I99»'));
  });

  it('@MATE-7.3 una pieza sin fuente rechaza con sin_fuente, en el borrador y en el aprobado', () => {
    const { entorno } = preparar();
    expect(ver(entorno, 'I10')).toMatchObject(rechazo('sin_fuente', '«I10»'));
    expect(ver(entorno, 'I1')).toMatchObject(rechazo('sin_fuente', '«I1»'));
  });

  it.each(['I11', 'I3'])(
    '@MATE-4.3 %s, con una cita que no está en el material, rechaza con cita_no_encontrada',
    (pieza) => {
      expect(ver(preparar().entorno, pieza)).toMatchObject(rechazo('cita_no_encontrada', `«${pieza}»`));
    },
  );

  it('@MATE-4.3 si el documento no está en el material, rechaza con cita_no_encontrada (regla que la feature no cubre)', () => {
    expect(ver(preparar(MESA, false).entorno, 'I9')).toMatchObject({ ok: false, causa: 'cita_no_encontrada' });
  });

  it('@MATE-7.1 un ítem aprobado en curso rechaza con antes_de_responder', () => {
    const { entorno } = preparar();
    entorno.persona.estadoDe(DOMINIO).marcarPresentado('I7');
    expect(ver(entorno, 'I7')).toMatchObject(ANTES_DE_RESPONDER);
  });

  it('@MATE-7.2 el ítem aprobado se abre en cuanto se registra su intento, y solo ese ítem', () => {
    const { entorno } = preparar();
    const estado = entorno.persona.estadoDe(DOMINIO);
    estado.marcarPresentado('I7');
    estado.marcarPresentado('I3');
    estado.registrarIntento(intento('I7'));
    expect(ver(entorno, 'I7')).toStrictEqual({ ok: true, valor: HOJA });
    expect(ver(entorno, 'I3')).toMatchObject(rechazo('antes_de_responder', '«I3»'));
  });

  it('@MATE-7.1 un ítem del borrador en curso se abre: las sesiones solo presentan lo aprobado (regla que la feature no cubre)', () => {
    const { entorno } = preparar();
    entorno.persona.estadoDe(DOMINIO).marcarPresentado('I9');
    expect(ver(entorno, 'I9')).toStrictEqual({ ok: true, valor: HOJA });
  });

  it('@MATE-7.1 solo cuenta el ítem en curso del dominio pedido (regla que la feature no cubre)', () => {
    const { entorno } = preparar();
    entorno.persona.estadoDe('otro').marcarPresentado('I7');
    expect(ver(entorno, 'I7')).toStrictEqual({ ok: true, valor: HOJA });
  });

  it('@MATE-7.1 solo se cierra la fuente de un ítem, no la de otro tipo de pieza con ese id (regla que la feature no cubre)', () => {
    const { entorno } = preparar();
    entorno.persona.estadoDe(DOMINIO).marcarPresentado('O1');
    expect(ver(entorno, 'O1')).toStrictEqual({ ok: true, valor: HOJA });
  });

  it('@MATE-7.1 el orden de los rechazos: antes_de_responder va antes que sin_fuente y que cita_no_encontrada', () => {
    const { entorno } = preparar();
    const estado = entorno.persona.estadoDe(DOMINIO);
    estado.marcarPresentado('I1');
    estado.marcarPresentado('I3');
    expect(ver(entorno, 'I1')).toMatchObject({ ok: false, causa: 'antes_de_responder' });
    expect(ver(entorno, 'I3')).toMatchObject({ ok: false, causa: 'antes_de_responder' });
  });

  it('@MATE-7.1 un ítem en curso que no está en la mesa rechaza con pieza_no_encontrada (regla que la feature no cubre)', () => {
    const { entorno } = preparar();
    entorno.persona.estadoDe(DOMINIO).marcarPresentado('I99');
    expect(ver(entorno, 'I99')).toMatchObject({ ok: false, causa: 'pieza_no_encontrada' });
  });
});

describe('verFuente: la mesa no se puede leer', () => {
  it('@MATE-4.3 sin contenido aprobado rechaza como la revisión, sin causa (regla que la feature no cubre)', () => {
    const { entorno, contenidos } = preparar();
    contenidos.delete(`contenido/${DOMINIO}.json`);
    const rechazado = ver(entorno, 'I9');
    expect(rechazado).toMatchObject({
      ok: false,
      motivo: expect.stringContaining('No existe el dominio «ficticio»') as unknown,
    });
    expect(rechazado).not.toHaveProperty('causa');
  });

  it('@MATE-4.3 con un id repetido entre el borrador y el aprobado rechaza con id_repetido (regla que la feature no cubre)', () => {
    const { entorno } = preparar(mesaDe({ items: [item('I9', FUENTE_BUENA)] }, { items: [item('I9', FUENTE_BUENA)] }));
    expect(ver(entorno, 'I9')).toMatchObject(rechazo('id_repetido', '«I9»'));
  });
});

/** Un intento cualquiera del ítem, para registrarlo. */
function intento(id: string): IntentoNuevo {
  return { fecha: AHORA, contexto: 'practica', item: id, objetivo: 'O1', correcta: true, confianza: 3 };
}

describe('EstadoDominio: los ítems en curso', () => {
  it('@MATE-7.1 un ítem está en curso desde que se marca presentado, y solo él', () => {
    const estado = new EstadoDominio();
    expect(estado.enCurso('I7')).toBe(false);
    estado.marcarPresentado('I7');
    expect(estado.enCurso('I7')).toBe(true);
    expect(estado.enCurso('I8')).toBe(false);
  });

  it('@MATE-7.1 sigue en curso después de responder y antes de declarar la confianza', () => {
    const estado = new EstadoDominio();
    estado.marcarPresentado('I7');
    estado.guardarRespuesta('I7', { fecha: AHORA, contexto: 'practica', respuesta: 'a' });
    expect(estado.enCurso('I7')).toBe(true);
  });

  it('@MATE-7.2 registrar el intento de un ítem lo saca de en curso y deja los demás', () => {
    const estado = new EstadoDominio();
    estado.marcarPresentado('I7');
    estado.marcarPresentado('I8');
    estado.registrarIntento(intento('I7'));
    expect(estado.enCurso('I7')).toBe(false);
    expect(estado.enCurso('I8')).toBe(true);
  });

  it('@MATE-7.2 un ítem vuelve a estar en curso si se presenta otra vez después de su intento', () => {
    const estado = new EstadoDominio();
    estado.marcarPresentado('I7');
    estado.registrarIntento(intento('I7'));
    estado.marcarPresentado('I7');
    expect(estado.enCurso('I7')).toBe(true);
  });

  it('@MATE-7.1 cerrar el diagnóstico deja todos los ítems fuera de en curso (regla que la feature no cubre)', () => {
    const estado = new EstadoDominio();
    estado.marcarPresentado('I7');
    estado.marcarPresentado('I8');
    estado.cerrarDiagnostico({ fecha: AHORA, fase: 'novato', dominados: new Map(), pasosRetirados: new Map() });
    expect([estado.enCurso('I7'), estado.enCurso('I8')]).toStrictEqual([false, false]);
  });
});

describe('presentarItem y el ítem en curso', () => {
  const peticion = { dominio: DOMINIO, item: 'I7', contexto: 'diagnostico' } as const;

  it('@MATE-7.1 el ítem que se presenta queda en curso', () => {
    const { entorno } = preparar();
    expect(presentarItem(entorno, peticion).ok).toBe(true);
    expect(entorno.persona.estadoDe(DOMINIO).enCurso('I7')).toBe(true);
  });

  it.each([
    { nombre: 'no existe', peticion: { ...peticion, item: 'I99' } },
    { nombre: 'no es del diagnóstico', peticion: { ...peticion, item: 'I1' } },
    { nombre: 'se pide fuera del diagnóstico, que sigue pendiente', peticion: { ...peticion, contexto: 'practica' } },
  ] as const)('@MATE-7.1 un ítem que $nombre se rechaza y no queda en curso', ({ peticion: pedida }) => {
    const { entorno } = preparar();
    expect(presentarItem(entorno, pedida).ok).toBe(false);
    expect(entorno.persona.estadoDe(DOMINIO).enCurso(pedida.item)).toBe(false);
  });

  it('@MATE-7.2 la fuente se abre cuando la persona ve el feedback, no antes', () => {
    const { entorno } = preparar();
    const declaracion = { dominio: DOMINIO, item: 'I7', confianza: 3 };
    presentarItem(entorno, peticion);
    expect(ver(entorno, 'I7')).toMatchObject(ANTES_DE_RESPONDER);
    responderItem(entorno, { ...peticion, respuesta: 'a' });
    expect(ver(entorno, 'I7')).toMatchObject(ANTES_DE_RESPONDER);
    expect(declararConfianza(entorno, declaracion).ok).toBe(true);
    expect(ver(entorno, 'I7')).toStrictEqual({ ok: true, valor: HOJA });
  });
});
