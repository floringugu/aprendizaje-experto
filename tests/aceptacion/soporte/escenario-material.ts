import assert from 'node:assert/strict';
import type { CasosDeClaudeCode } from '../../../src/aplicacion/claude-code.ts';
import type {
  ContenidoDominio,
  EjemploResueltoContenido,
  Fuente,
  ItemContenido,
  ObjetivoContenido,
  TareaContenido,
} from '../../../src/aplicacion/contenido.ts';
import type { BorradorDominio, CasosDeMaterial, EjemploDeObjetivoAprobado } from '../../../src/aplicacion/material.ts';
import type { Aplicacion } from '../../../src/aplicacion/aplicacion.ts';
import type { Resultado } from '../../../src/aplicacion/resultado.ts';
import { BorradorContenido, criterioPorDefecto, ejemploPorDefecto } from './contenido.ts';
import type { Externos } from './externos.ts';

// Estado y utilidades de los escenarios de MATE: el borrador que ya estaba en el disco, el PDF de los
// apuntes y lo que la persona vio en la revisión, en «Ver fuente» y en Ajustes.

type Aceptado<T> = Extract<T, { readonly ok: true }> extends { readonly valor: infer V } ? V : never;
export type Revision = Aceptado<ReturnType<CasosDeMaterial['abrirRevision']>>;
export type FuenteAbierta = Aceptado<ReturnType<CasosDeMaterial['verFuente']>>;
export type BorradorRedactado = Aceptado<Awaited<ReturnType<CasosDeMaterial['redactarBorrador']>>>;
export type InicioSesionEnCurso = Aceptado<Awaited<ReturnType<CasosDeClaudeCode['consultarInicioSesion']>>>;
export type Pieza = ObjetivoContenido | EjemploResueltoContenido | ItemContenido | TareaContenido;

/**
 * Lo que usan estas utilidades del mundo del escenario. Se declara aquí en vez de importar `Mundo`
 * porque mundo.ts importa este fichero, y las capas no admiten ciclos.
 */
interface Escenario {
  readonly dominio: string;
  readonly externos: Externos;
  readonly material: EscenarioMaterial;
  aplicacion(): Aplicacion;
  preparar(accion: () => void): void;
}

export const APUNTES = 'apuntes.pdf';
/** La página de los apuntes que citan los escenarios; las demás son de relleno. */
export const PAGINA_CITADA = 12;

/** Lo que se ve del material en los escenarios de MATE, entre el «Dado», el «Cuando» y el «Entonces». */
export class EscenarioMaterial {
  /** La frase de la página citada que dice el «Dado» de los antecedentes. */
  frase = '';
  /** Cómo se escribe esa frase en el PDF, línea a línea (MATE-3.3, MATE-3.4). */
  lineasDeLaFrase: readonly string[] = [];
  /** Lo que tenía contenido/borradores/<dominio>.json antes de que la persona hiciera nada. */
  readonly borrador: BorradorContenido;
  /** Los ejemplos resueltos del borrador para objetivos ya aprobados, que van aparte. */
  ejemplosSueltos: readonly EjemploDeObjetivoAprobado[] = [];
  /** La frase que decía la página web cuando la persona la añadió (MATE-1.5). */
  fraseWeb = '';
  /** El último material que intentó añadir la persona, aceptado o no. */
  ultimoMaterial = '';
  /** Lo que respondió la aplicación al pedirle un borrador (MATE-2). */
  redaccion: Resultado<BorradorRedactado> | undefined;
  revision: Revision | undefined;
  fuenteAbierta: FuenteAbierta | undefined;
  inicioSesion: InicioSesionEnCurso | undefined;
  /** Los ids que se le presentaron a la persona en la última sesión, o las tareas que pidió (MATE-6). */
  vistos: readonly string[] = [];
  /** El código o el token que no debe aparecer en ningún sitio (MATE-8.6, MATE-8.7). */
  secreto = '';
  /** Lo que escribió el proceso en la consola mientras se capturaba (MATE-8.6, MATE-8.7). */
  readonly consola: string[] = [];
  private borradorEnCola = false;

  constructor(dominio: string) {
    this.borrador = new BorradorContenido(dominio);
    this.borrador.fijarObjetivos([]);
  }

  /** El borrador del «Dado», con el formato de contenido/borradores/<dominio>.json. */
  borradorInicial(): BorradorDominio {
    const contenido = this.borrador.toContenido();
    return this.ejemplosSueltos.length === 0 ? contenido : { ...contenido, ejemplos_resueltos: this.ejemplosSueltos };
  }

  /** Añade un ítem pendiente al borrador del «Dado» y lo deja en el disco antes de que la persona haga nada. */
  agregarAlBorrador(actual: Escenario, item: ItemContenido): void {
    this.borrador.agregarItem(item);
    this.dejarBorrador(actual);
  }

  /** Una pieza del borrador del «Dado», tal como estaba antes de que la persona hiciera nada. */
  piezaInicial(id: string): Pieza {
    return pieza(this.borradorInicial(), id);
  }

  /**
   * Deja el borrador del «Dado» en el disco antes de que la persona haga nada. Se pone en cola una sola
   * vez y se escribe al final de la preparación, con todo lo que hayan añadido los «Dado».
   */
  dejarBorrador(actual: Escenario): void {
    if (this.borradorEnCola) {
      return;
    }
    this.borradorEnCola = true;
    actual.preparar(() => {
      actual.externos.ficheros.dejar(rutaDelBorrador(actual), JSON.stringify(this.borradorInicial(), null, 2));
    });
  }

  /** Las páginas de los apuntes: once de relleno y la citada, con la frase partida como diga el escenario. */
  paginasDeLosApuntes(): string[][] {
    const relleno = Array.from({ length: PAGINA_CITADA - 1 }, (_, posicion) => {
      const numero = String(posicion + 1);
      return [`Página ${numero}.`, `Texto de relleno de la página ${numero}.`];
    });
    const citada = [
      `Página ${String(PAGINA_CITADA)}.`,
      'Esta página trata de una regla del dominio.',
      ...this.lineasDeLaFrase,
      'Después viene la regla R3.',
    ];
    return [...relleno, citada];
  }
}

export function rutaDelBorrador(actual: Escenario): string {
  return `contenido/borradores/${actual.dominio}.json`;
}

export function rutaDelContenido(actual: Escenario): string {
  return `contenido/${actual.dominio}.json`;
}

/** contenido/borradores/<dominio>.json tal como está ahora; si no existe, un borrador vacío. */
export function borradorEnDisco(actual: Escenario): BorradorDominio {
  const leido = actual.externos.ficheros.leerJson(rutaDelBorrador(actual));
  return leido === undefined
    ? { dominio: actual.dominio, objetivos: [], categorias: [], items: [], tareas: [] }
    : (leido as BorradorDominio);
}

/** contenido/<dominio>.json tal como está ahora (el de los «Dado», si la aplicación no lo ha escrito). */
export function aprobadoEnDisco(actual: Escenario): ContenidoDominio {
  return actual.externos.ficheros.leerJson(rutaDelContenido(actual)) as ContenidoDominio;
}

/** Todas las piezas, también los ejemplos de dentro de los objetivos y los que van aparte. */
export function piezasDe(contenido: BorradorDominio): readonly Pieza[] {
  return [
    ...contenido.objetivos.flatMap((objetivo) => [objetivo, ...objetivo.ejemplos_resueltos]),
    ...(contenido.ejemplos_resueltos ?? []),
    ...contenido.items,
    ...contenido.tareas,
  ];
}

export function idsDe(contenido: BorradorDominio): readonly string[] {
  return piezasDe(contenido).map((encontrada) => encontrada.id);
}

export function pieza(contenido: BorradorDominio, id: string): Pieza {
  const encontrada = piezasDe(contenido).find((candidata) => candidata.id === id);
  assert.ok(encontrada !== undefined, `No hay ninguna pieza ${id}`);
  return encontrada;
}

/** Cada tramo seguido de espacios, tabuladores y saltos de línea, como un solo espacio (MATE-3). */
export function unEspacio(texto: string): string {
  return texto.replace(/\s+/g, ' ').trim();
}

/** El fragmento se ve dentro del texto entero de la página citada, y no de otra (MATE-4.3, MATE-7.2). */
export function comprobarHoja(actual: Escenario, hoja: FuenteAbierta, fragmento: string): void {
  assert.equal(hoja.documento, APUNTES);
  assert.equal(hoja.fragmento, fragmento);
  const pagina = actual.material.paginasDeLosApuntes()[PAGINA_CITADA - 1] ?? [];
  assert.ok(unEspacio(hoja.texto).includes(unEspacio(pagina.join('\n'))), 'La hoja no trae el texto de la página');
  assert.ok(!hoja.texto.includes(`Página ${String(PAGINA_CITADA - 1)}.`), 'La hoja trae texto de otra página');
}

/** La fuente con la que el borrador del «Dado» cita la página de los apuntes. */
export function fuenteDeLosApuntes(fragmento: string): Fuente {
  return { documento: APUNTES, lugar: `página ${String(PAGINA_CITADA)}`, fragmento };
}

/** Un ítem con los valores por defecto del contenido de prueba y, si se indica, su fuente. */
export function itemDePrueba(id: string, objetivo: string, fuente?: Fuente): ItemContenido {
  const item = new BorradorContenido('').agregarItem({ id, objetivo });
  return fuente === undefined ? item : { ...item, fuente };
}

/** Los ids de las piezas que se ven en la revisión, de todos los grupos. */
export function idsDeLaRevision(revision: Revision): readonly string[] {
  return revision.grupos.flatMap((grupo) => grupo.piezas.map((pendiente) => pendiente.id));
}

/** Una pieza de contenido/borradores/<dominio>.json tal como está ahora, o `undefined` si no está. */
export function piezaEnElBorrador(actual: Escenario, id: string): Pieza | undefined {
  return piezasDe(borradorEnDisco(actual)).find((candidata) => candidata.id === id);
}

/** Un ítem de contenido/<dominio>.json tal como está ahora, o `undefined` si no está. */
export function itemAprobado(actual: Escenario, id: string): ItemContenido | undefined {
  return aprobadoEnDisco(actual).items.find((candidato) => candidato.id === id);
}

/** El valor tal como queda al guardarlo en JSON (sin las propiedades `undefined`), para compararlo con el disco. */
export function comoEnDisco(valor: unknown): unknown {
  return JSON.parse(JSON.stringify(valor));
}

/** Copia del objeto sin una de sus propiedades: una pieza a la que le falta algo (MATE-2.3, MATE-4.8). */
export function sinPropiedad(objeto: object, propiedad: string): object {
  return Object.fromEntries(Object.entries(objeto).filter(([clave]) => clave !== propiedad));
}

/** Los nombres de los ficheros y las URL del material del dominio. */
export function listaDeMaterial(actual: Escenario, dominio = actual.dominio): readonly string[] {
  const lista = actual.aplicacion().listarMaterial({ dominio });
  assert.ok(lista.ok, 'La aplicación no da la lista de material');
  return lista.valor;
}

/** Un objetivo nuevo con un ejemplo resuelto dentro, los dos con su fuente. */
export function objetivoDePrueba(id: string, fuente: Fuente): ObjetivoContenido {
  return {
    id,
    instruccion: `Instrucción de ${id}`,
    ejemplos_resueltos: [{ ...ejemploPorDefecto(`E${id.slice(1)}`), fuente }],
    fuente,
  };
}

/** Un ejemplo resuelto para un objetivo ya aprobado, que en el borrador va aparte. */
export function ejemploDePrueba(id: string, objetivo: string, fuente: Fuente): EjemploDeObjetivoAprobado {
  return { ...ejemploPorDefecto(id), objetivo, fuente };
}

/** Una tarea con la rúbrica por defecto y su fuente. */
export function tareaDePrueba(id: string, fuente: Fuente): TareaContenido {
  return { id, enunciado: `Enunciado de ${id}`, rubrica: [criterioPorDefecto('Planteamiento')], fuente };
}
