import { describe, expect, it, vi } from 'vitest';
import type { Dependencias } from '../../src/aplicacion/dependencias.ts';
import { guardarDocumento } from '../../src/aplicacion/material-guardado.ts';
import { pedirMasReservados, redactarBorrador, type BorradorRedactado } from '../../src/aplicacion/material.ts';
import type { PeticionDeRedaccion, RedactorIa } from '../../src/aplicacion/puertos.ts';
import type { Resultado } from '../../src/aplicacion/resultado.ts';
import { ficherosEnMemoria } from './ficheros-en-memoria.ts';
import {
  BYTES_DEL_PDF,
  conPdfEnElMaterial,
  DOCUMENTO,
  DOMINIO,
  entregaCon,
  ficherosQueApuntan,
  itemReservado,
  RUTA_DEL_APROBADO,
  RUTA_DEL_BORRADOR,
  URL_TEMA3,
} from './redaccion-fabricas.ts';
import { categoria, escribirMesa, ids, item, mesaDe, objetivo, tarea } from './revision-fabricas.ts';

// Los casos `redactarBorrador` y `pedirMasReservados`, que comparten cuerpo: el orden de sus rechazos, lo que
// recibe la IA y lo que se escribe con lo que entrega.

type Externos = Pick<Dependencias, 'ficheros' | 'leerIa'>;
type Lanzar = (
  externos: Externos,
  peticion: { dominio: string; documento: string },
) => Promise<Resultado<BorradorRedactado>>;

const PETICION = { dominio: DOMINIO, documento: DOCUMENTO };
// Aprobado: el objetivo O1 y su ítem I1. Pendiente: el ítem I2, también de O1.
const MESA = mesaDe(
  { items: [item('I2')] },
  { objetivos: [objetivo('O1')], items: [item('I1')], categorias: [categoria('C1')], tareas: [tarea('T1')] },
);
// Lo que recibe la IA de ese aprobado (`aprobadoParaLaIa`), a mano: sin el ítem I1, y la categoría sin grupo.
const APROBADO_PARA_LA_IA = {
  objetivos: [{ id: 'O1', instruccion: 'Instrucción de O1' }],
  categorias: [{ id: 'C1', descripcion: 'Descripción de C1' }],
  tareas: [{ id: 'T1', enunciado: 'Enunciado de T1' }],
};
const CASOS: readonly { readonly nombre: string; readonly lanzar: Lanzar }[] = [
  { nombre: 'redactarBorrador', lanzar: redactarBorrador },
  {
    nombre: 'pedirMasReservados',
    lanzar: (externos, peticion) => pedirMasReservados(externos, { ...peticion, objetivo: 'O1' }),
  },
];

/** Una IA de prueba: apunta las peticiones, hace `alRedactar` (cambios mientras tarda) y entrega `entrega`. */
function iaQueEntrega(entrega: unknown, alRedactar: () => void = () => undefined) {
  const peticiones: PeticionDeRedaccion[] = [];
  const ia: RedactorIa = {
    redactar: (peticion) => {
      peticiones.push(peticion);
      alRedactar();
      return Promise.resolve(entrega);
    },
  };
  return { ia, peticiones };
}

/** El material con `apuntes.pdf` y `MESA` guardados; `ficheros` apunta las lecturas y escrituras del caso de uso. */
function entorno(entrega: unknown = {}, alRedactar?: (base: ReturnType<typeof ficherosEnMemoria>) => void) {
  const memoria = ficherosEnMemoria();
  escribirMesa(memoria.ficheros, MESA);
  conPdfEnElMaterial(memoria.ficheros);
  const { ia, peticiones } = iaQueEntrega(entrega, () => alRedactar?.(memoria));
  const leerIa = vi.fn((): RedactorIa | undefined => ia);
  const apuntados = ficherosQueApuntan(memoria.ficheros);
  const externos: Externos = { ficheros: apuntados.ficheros, leerIa };
  // `base` guarda sin apuntar (con él se prepara el material y actúa la IA); `externos` es lo que recibe el caso.
  return { base: memoria, contenidos: memoria.contenidos, ...apuntados, peticiones, externos, leerIa };
}

const jsonDe = (bytes: Uint8Array | undefined): unknown => JSON.parse(new TextDecoder().decode(bytes));

describe.each(CASOS)('$nombre: los rechazos, por orden', ({ lanzar }) => {
  it('un dominio que no pasa dominioValido se rechaza antes de llamar a leerIa, y sin leer ni escribir nada (regla que la feature no cubre)', async () => {
    const { externos, leerIa, lecturas, escrituras } = entorno();

    const resultado = await lanzar(externos, { ...PETICION, dominio: '../etc' });

    expect(resultado).toMatchObject({ ok: false, campo: 'dominio' });
    expect(leerIa).not.toHaveBeenCalled();
    expect([lecturas, escrituras]).toStrictEqual([[], []]);
  });

  it('@MATE-2.4 sin IA rechaza con «sin_ia», sin leer ningún fichero ni escribir nada', async () => {
    const { externos, leerIa, lecturas, escrituras } = entorno();
    leerIa.mockReturnValue(undefined);

    const resultado = await lanzar(externos, PETICION);

    expect(resultado).toMatchObject({ ok: false, causa: 'sin_ia' });
    expect(resultado.ok ? '' : resultado.motivo).toContain('Ajustes');
    expect([lecturas, escrituras]).toStrictEqual([[], []]);
  });

  it('una mesa con un id repetido rechaza como leerMesa, antes de mirar el documento, y no llama a la IA (regla que la feature no cubre)', async () => {
    const { base, externos, peticiones, escrituras } = entorno();
    escribirMesa(base.ficheros, mesaDe({ items: [item('I1')] }, { objetivos: [objetivo('O1')], items: [item('I1')] }));

    const resultado = await lanzar(externos, { ...PETICION, documento: 'tema9.pdf' });

    expect(resultado).toMatchObject({ ok: false, causa: 'id_repetido' });
    expect(resultado.ok ? '' : resultado.motivo).toContain('«I1»');
    expect([peticiones, escrituras]).toStrictEqual([[], []]);
  });

  it('un dominio sin contenido aprobado rechaza como leerMesa y no escribe nada (regla que la feature no cubre)', async () => {
    const { contenidos, externos, peticiones, escrituras } = entorno();
    contenidos.delete(RUTA_DEL_APROBADO);

    const resultado = await lanzar(externos, PETICION);

    expect(resultado).toStrictEqual({ ok: false, motivo: `No existe el dominio «${DOMINIO}».` });
    expect([peticiones, escrituras]).toStrictEqual([[], []]);
  });

  it('un documento que no está en el material rechaza con «documento_no_encontrado» y no escribe nada (regla que la feature no cubre)', async () => {
    const { externos, peticiones, escrituras } = entorno();

    const resultado = await lanzar(externos, { ...PETICION, documento: 'tema9.pdf' });

    expect(resultado).toMatchObject({ ok: false, causa: 'documento_no_encontrado' });
    expect([peticiones, escrituras]).toStrictEqual([[], []]);
  });

  it('un documento cuyo PDF ya no está en los ficheros rechaza con «documento_no_encontrado» (regla que la feature no cubre)', async () => {
    const { contenidos, externos, peticiones, escrituras } = entorno();
    contenidos.delete(`material/${DOMINIO}/originales/${DOCUMENTO}`);

    const resultado = await lanzar(externos, PETICION);

    expect(resultado).toMatchObject({ ok: false, causa: 'documento_no_encontrado' });
    expect([peticiones, escrituras]).toStrictEqual([[], []]);
  });

  it('@MATE-1.5 una URL guardada como página web rechaza con «documento_sin_pdf» y no escribe nada', async () => {
    const { base, externos, peticiones, escrituras } = entorno();
    guardarDocumento(base.ficheros, DOMINIO, { url: URL_TEMA3, copia: BYTES_DEL_PDF, formato: 'html', paginas: ['t'] });

    const resultado = await lanzar(externos, { ...PETICION, documento: URL_TEMA3 });

    expect(resultado).toMatchObject({ ok: false, causa: 'documento_sin_pdf' });
    expect([peticiones, escrituras]).toStrictEqual([[], []]);
  });

  it('si la IA rechaza la promesa, el rechazo se propaga y no se escribe nada (regla que la feature no cubre)', async () => {
    const { externos, escrituras, leerIa } = entorno();
    leerIa.mockReturnValue({ redactar: () => Promise.reject(new Error('Sin sesión de Claude Code')) });

    await expect(lanzar(externos, PETICION)).rejects.toThrow('Sin sesión de Claude Code');
    expect(escrituras).toStrictEqual([]);
  });
});

describe('pedirMasReservados: el objetivo', () => {
  const pedir = (externos: Externos, objetivoPedido: string, documento = DOCUMENTO) =>
    pedirMasReservados(externos, { ...PETICION, documento, objetivo: objetivoPedido });

  it('@MATE-2.10 un objetivo que no está ni en lo aprobado ni en el borrador rechaza, antes de leer el documento', async () => {
    const { externos, lecturas, peticiones, escrituras } = entorno();

    // «tema9.pdf» tampoco existe: si se mirase el documento antes, el rechazo sería otro.
    const resultado = await pedir(externos, 'O9', 'tema9.pdf');

    expect(resultado).toMatchObject({ ok: false, causa: 'objetivo_no_encontrado' });
    expect(resultado.ok ? '' : resultado.motivo).toContain('«O9»');
    expect(lecturas.filter((ruta) => ruta.startsWith('material/'))).toStrictEqual([]);
    expect([peticiones, escrituras]).toStrictEqual([[], []]);
  });

  it('@MATE-2.10 un objetivo que solo está en el borrador se encuentra, y sus ítems pendientes van a la IA', async () => {
    const { base, externos, peticiones } = entorno();
    escribirMesa(
      base.ficheros,
      mesaDe({ objetivos: [objetivo('O2')], items: [item('I5', undefined, 'O2')] }, { items: [] }),
    );

    const resultado = await pedir(externos, 'O2');

    expect(resultado.ok).toBe(true);
    expect(peticiones[0]?.reservadosDe).toStrictEqual({ objetivo: 'O2', enunciados: ['Enunciado de I5'] });
  });

  it('redactarBorrador no pide objetivo: con un contenido sin objetivos, la redacción sigue adelante (regla que la feature no cubre)', async () => {
    const { base, externos, peticiones } = entorno();
    escribirMesa(base.ficheros, mesaDe({}, {}));

    expect((await redactarBorrador(externos, PETICION)).ok).toBe(true);
    expect(peticiones).toHaveLength(1);
  });
});

describe('lo que recibe la IA', () => {
  it('@MATE-2.1 con redactarBorrador: el documento, sus bytes y lo aprobado, y sin «reservadosDe»', async () => {
    const { externos, peticiones, leerIa } = entorno();

    await redactarBorrador(externos, PETICION);

    expect(leerIa).toHaveBeenCalledTimes(1);
    expect(peticiones).toStrictEqual([{ documento: DOCUMENTO, pdf: BYTES_DEL_PDF, aprobado: APROBADO_PARA_LA_IA }]);
    expect(peticiones[0]).not.toHaveProperty('reservadosDe');
  });

  it('@MATE-2.10 con pedirMasReservados: lo mismo y, en «reservadosDe», el objetivo y los enunciados de sus ítems', async () => {
    const { externos, peticiones } = entorno();

    await pedirMasReservados(externos, { ...PETICION, objetivo: 'O1' });

    expect(peticiones).toStrictEqual([
      {
        documento: DOCUMENTO,
        pdf: BYTES_DEL_PDF,
        aprobado: APROBADO_PARA_LA_IA,
        reservadosDe: { objetivo: 'O1', enunciados: ['Enunciado de I1', 'Enunciado de I2'] },
      },
    ]);
  });

  it('@MATE-1.5 de una URL que sirve un PDF, el documento es la URL y el PDF es la copia descargada', async () => {
    const { base, externos, peticiones } = entorno();
    const copia = new Uint8Array([7, 7]);
    guardarDocumento(base.ficheros, DOMINIO, { url: URL_TEMA3, copia, formato: 'pdf', paginas: ['t'] });

    await redactarBorrador(externos, { ...PETICION, documento: URL_TEMA3 });

    expect(peticiones[0]).toMatchObject({ documento: URL_TEMA3, pdf: copia });
  });
});

describe('la entrega de la IA se incorpora y se escribe', () => {
  it('@MATE-2.1 solo se escribe el borrador: el aprobado no cambia, y se aceptan las piezas apartadas', async () => {
    const entrega = entregaCon({ items: [item('I3'), { ...item('I4'), feedback: '' }] });
    const { contenidos, externos, escrituras } = entorno(entrega);
    const aprobadoAntes = contenidos.get(RUTA_DEL_APROBADO);

    const resultado = await redactarBorrador(externos, PETICION);

    expect(resultado).toStrictEqual({ ok: true, valor: { apartadas: [{ falta: 'feedback' }] } });
    expect(escrituras).toStrictEqual([RUTA_DEL_BORRADOR]);
    expect(contenidos.get(RUTA_DEL_APROBADO)).toStrictEqual(aprobadoAntes);
    // El borrador: lo que ya había (I2) y la pieza que entró (I3); la de feedback vacío, apartada, no está.
    expect(jsonDe(contenidos.get(RUTA_DEL_BORRADOR))).toStrictEqual({
      dominio: DOMINIO,
      objetivos: [],
      categorias: [],
      items: [item('I2'), item('I3')],
      tareas: [],
    });
  });

  it('@MATE-2.11 con pedirMasReservados: solo entran los ítems reservados del objetivo, y los demás se apartan', async () => {
    const entrega = entregaCon({
      items: [itemReservado('I3'), item('I4'), itemReservado('I5', 'O2')],
      categorias: [categoria('C9')],
    });
    const { contenidos, externos } = entorno(entrega);

    const resultado = await pedirMasReservados(externos, { ...PETICION, objetivo: 'O1' });

    expect(resultado).toStrictEqual({
      ok: true,
      valor: { apartadas: [{ falta: 'reservado' }, { falta: 'objetivo' }] },
    });
    const borrador = jsonDe(contenidos.get(RUTA_DEL_BORRADOR)) as { items: { id: string }[]; categorias: unknown[] };
    expect(ids(borrador.items)).toStrictEqual(['I2', 'I3']);
    expect(borrador.categorias).toStrictEqual([]);
  });

  it('@MATE-2.2 la entrega se incorpora en la mesa leída después de la IA, no en la de antes', async () => {
    // Mientras la IA tarda, la persona aprueba a mano I2: sale del borrador y entra en el aprobado.
    const aprobadaAMano = () => mesaDe({}, { objetivos: [objetivo('O1')], items: [item('I1'), item('I2')] });
    const { contenidos, externos, escrituras } = entorno(entregaCon({ items: [item('I2')] }), ({ ficheros }) => {
      escribirMesa(ficheros, aprobadaAMano());
    });

    const resultado = await redactarBorrador(externos, PETICION);

    expect(resultado.ok).toBe(true);
    // Con la mesa de antes, I2 volvería al borrador junto al nuevo; con la de después, solo está el nuevo (I3).
    const borrador = jsonDe(contenidos.get(RUTA_DEL_BORRADOR)) as { items: { id: string }[] };
    expect(ids(borrador.items)).toStrictEqual(['I3']);
    expect(escrituras).toStrictEqual([RUTA_DEL_BORRADOR]);
    expect(jsonDe(contenidos.get(RUTA_DEL_APROBADO))).toStrictEqual({ ...aprobadaAMano().aprobado, dominio: DOMINIO });
  });

  it('si la mesa nueva no se puede leer, rechaza como leerMesa y no escribe nada (regla que la feature no cubre)', async () => {
    const repetida = () => mesaDe({ items: [item('I1')] }, { objetivos: [objetivo('O1')], items: [item('I1')] });
    const { externos, escrituras } = entorno(entregaCon({ items: [item('I3')] }), ({ ficheros }) => {
      escribirMesa(ficheros, repetida());
    });

    const resultado = await redactarBorrador(externos, PETICION);

    expect(resultado).toMatchObject({ ok: false, causa: 'id_repetido' });
    expect(escrituras).toStrictEqual([]);
  });
});
