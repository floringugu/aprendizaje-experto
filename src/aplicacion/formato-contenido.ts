// Validación del formato del contenido (plan §0, «Formato del contenido»): lo que se lee de
// `contenido/<dominio>.json` no llega a los casos de uso hasta cumplirlo (D16). Solo depende de la
// normalización de la corrección, para decidir cuándo dos opciones son la misma (MATE-2.5).
import { normalizar } from '../dominio/correccion.ts';
import type { ContenidoValidado } from './contenido.ts';

/** Qué propiedad del formato falta o no es válida, y en qué pieza. */
export interface FalloDeFormato {
  /**
   * La pieza que falla, como la buscaría el autor en el fichero: «el ítem I9», «la tarea T3», «el
   * ejemplo resuelto E1 de O2», «la fuente del ítem I9». Una pieza sin `id` válido se nombra por su
   * posición en la lista, contando desde 1: «el ítem 3», o, si es una corrección, por el `id` de la pieza
   * que sustituye (`falloDeLaPiezaSuelta`). No viene si el fallo está en la raíz.
   */
  readonly pieza?: string;
  /**
   * El nombre de la propiedad que falla, sin ruta: `respuesta`, `feedback`, `pasos`, `rubrica`,
   * `descriptor`, `instruccion`, `opciones`, `diagrama`, `descripcion`… Son los que la aplicación usa para
   * decir qué le falta o qué no vale en una pieza (MATE-2.3, 2.5, 2.7, MATE-4.8), y los que leen los steps
   * de aceptación como `apartadas[].falta`.
   */
  readonly falta: string;
}

type Validacion<T> = { readonly ok: true; readonly valor: T } | { readonly ok: false; readonly fallo: FalloDeFormato };

/**
 * Dónde está el fallo, dicho para la persona: «"instruccion" en el objetivo O4», o solo «"dominio"» si
 * el fallo está en la raíz (la propiedad va entre comillas angulares). Con «en» y no con «de» para
 * no contraer el artículo de `pieza` («de el ítem I7»). Lo usan los rechazos del contenido aprobado y
 * los de una corrección.
 */
export function lugarDelFallo(fallo: FalloDeFormato): string {
  return fallo.pieza === undefined ? `«${fallo.falta}»` : `«${fallo.falta}» en ${fallo.pieza}`;
}

/**
 * Comprueba que `leido` cumple el formato del contenido y devuelve el primer fallo que encuentra:
 * primero `dominio`, después cada objetivo con sus ejemplos resueltos, cada categoría, cada ítem y cada
 * tarea, en el orden del fichero. Si lo cumple, devuelve el mismo objeto, ya tipado y sin copiarlo.
 *
 * Reglas:
 * - Las propiedades obligatorias tienen que estar y ser del tipo que toca, y los textos no pueden estar
 *   vacíos. Si `leido` no es un objeto, el fallo es `dominio`, la primera propiedad del formato.
 * - `pasos`, `rubrica`, `niveles`, `opciones` y `aceptadas` no pueden estar vacías: un ítem de respuesta
 *   escrita sin ninguna aceptada no tendría qué enseñar en el feedback (@RECU-2.1). `correcta` tiene que
 *   ser una de las `opciones`, y `nivel` es un número. Dos `opciones` que solo cambian en espacios o
 *   mayúsculas son la misma opción (MATE-2.5) y el fallo es `opciones`.
 * - `tipo` es `hecho` o `problema`, y `diagnostico` es un booleano.
 * - Una categoría lleva `descripcion`, un texto no vacío (MATE-2.3); se mira antes que `grupo_parecidas`.
 * - `categoria`, `grupo_parecidas`, `fuente` y, en objetivos y ejemplos resueltos, `diagrama` son
 *   opcionales; una propiedad opcional que vale `undefined` cuenta como ausente. Una `fuente` que viene
 *   tiene `documento`, `lugar` y `fragmento`; un `diagrama` que viene empieza por `<svg` y acaba en
 *   `</svg>` (MATE-2.7), y si no, el fallo es `diagrama`.
 * - `objetivos`, `categorias`, `items`, `tareas` y los `ejemplos_resueltos` de un objetivo pueden
 *   estar vacíos.
 * - Las propiedades de más se ignoran: el borrador lleva más que el contenido aprobado.
 */
export function validarContenido(leido: unknown): Validacion<ContenidoValidado> {
  const fallo = falloDelContenido(leido);
  // El `as` es honesto: `falloDelContenido` ha comprobado todo lo que dice `ContenidoValidado`.
  return fallo === undefined ? { ok: true, valor: leido as ContenidoValidado } : { ok: false, fallo };
}

/**
 * Las piezas que se revisan una a una en el borrador (MATE-2.3, MATE-4). Las categorías también: la IA las
 * redacta como una pieza más (plan §0, «Categorías en el borrador»).
 */
export type TipoDePieza = 'objetivo' | 'ejemplo' | 'item' | 'categoria' | 'tarea';

/**
 * El primer fallo de una pieza suelta del borrador, o `undefined` si cumple el formato, con las mismas
 * reglas que `validarContenido`: un objetivo con los ejemplos que lleva dentro, y cada pieza con su
 * fuente si la trae. Sirve para apartar las piezas que entrega la IA (MATE-2.3) y para rechazar una
 * corrección (MATE-4.8). Las propiedades de más se ignoran, como el `objetivo` de un ejemplo que va
 * aparte.
 *
 * Si la pieza no trae `id` válido, se nombra con `id`, el de la pieza a la que sustituye una corrección:
 * «el ítem I7» (regla que la feature no cubre, aprobada por el dueño el 30-10-2026). Sin `id`, como la
 * primera de su lista: «el ítem 1». Una pieza con `id` válido se nombra siempre por el suyo.
 */
export function falloDeLaPiezaSuelta(tipo: TipoDePieza, pieza: unknown, id?: string): FalloDeFormato | undefined {
  // Sin `id` de la corrección, la pieza se nombra como la primera de su lista.
  const sinId = id ?? porPosicion(0);
  switch (tipo) {
    case 'objetivo':
      return falloDelObjetivo(pieza, sinId);
    case 'ejemplo':
      return falloDelEjemplo(pieza, sinId, nombreDelObjetivoDelEjemplo(pieza));
    case 'item':
      return falloDelItem(pieza, sinId);
    case 'categoria':
      return falloDeLaCategoria(pieza, sinId);
    case 'tarea':
      return falloDeLaTarea(pieza, sinId);
  }
}

/**
 * Un ejemplo que va aparte lleva el `objetivo` del que cuelga; uno que aún está dentro de su objetivo no
 * lo lleva, y entonces solo se sabe que es de «su objetivo».
 */
function nombreDelObjetivoDelEjemplo(ejemplo: unknown): string {
  const objetivo = esRegistro(ejemplo) ? ejemplo['objetivo'] : undefined;
  return esTextoNoVacio(objetivo) ? objetivo : 'su objetivo';
}

// Una función por pieza. Cada una devuelve el primer fallo de la pieza, o `undefined` si cumple el
// formato. `sinId` es cómo se nombra la pieza cuando no tiene `id` válido: su posición en la lista
// (`porPosicion`) o el `id` de la pieza a la que sustituye una corrección. Es un texto y no un número
// para que cada función tenga un solo artículo («el ítem», «la tarea») y no una versión por cada caso.

/** Cómo se nombra una pieza sin `id` válido por su índice en la lista, que cuenta desde 0: «3». */
function porPosicion(indice: number): string {
  return String(indice + 1);
}

function falloDelObjetivo(objetivo: unknown, sinId: string): FalloDeFormato | undefined {
  return falloDeLaPieza(objetivo, nombrarPieza('el objetivo', objetivo, sinId), MOLDE_DEL_OBJETIVO);
}

/** `objetivo` es cómo se nombra el objetivo del ejemplo: su `id` o su posición. */
function falloDelEjemplo(ejemplo: unknown, sinId: string, objetivo: string): FalloDeFormato | undefined {
  const nombre = `${nombrarPieza('el ejemplo resuelto', ejemplo, sinId)} de ${objetivo}`;
  return falloDeLaPieza(ejemplo, nombre, MOLDE_DEL_EJEMPLO);
}

function falloDeLaCategoria(categoria: unknown, sinId: string): FalloDeFormato | undefined {
  return falloDeLaPieza(categoria, nombrarPieza('la categoría', categoria, sinId), MOLDE_DE_LA_CATEGORIA);
}

function falloDelItem(item: unknown, sinId: string): FalloDeFormato | undefined {
  return falloDeLaPieza(item, nombrarPieza('el ítem', item, sinId), MOLDE_DEL_ITEM);
}

function falloDeLaTarea(tarea: unknown, sinId: string): FalloDeFormato | undefined {
  return falloDeLaPieza(tarea, nombrarPieza('la tarea', tarea, sinId), MOLDE_DE_LA_TAREA);
}

/** `pieza` es el nombre de la pieza que cita la fuente: «el ítem I9». */
function falloDeLaFuente(fuente: unknown, pieza: string): FalloDeFormato | undefined {
  if (!esRegistro(fuente)) {
    return { pieza, falta: 'fuente' };
  }
  const falta = primeraFalta(fuente, REGLAS_DE_LA_FUENTE);
  return falta === undefined ? undefined : { pieza: `la fuente ${deLaPieza(pieza)}`, falta };
}

// --- Lo que comparten las piezas ---

/** Un objeto JSON cualquiera, del que aún no se sabe qué propiedades trae. */
export type Registro = Readonly<Record<string, unknown>>;
type PiezaConId = Registro & { readonly id: string };

/** Si `valor` es un objeto JSON (no `null` ni un array): lo que puede ser una pieza o una fuente. */
export function esRegistro(valor: unknown): valor is Registro {
  // Un array también es un objeto para JavaScript, pero aquí no vale como pieza.
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function esLista(valor: unknown): valor is readonly unknown[] {
  return Array.isArray(valor);
}

function esListaNoVacia(valor: unknown): valor is readonly unknown[] {
  return esLista(valor) && valor.length > 0;
}

function esTextoNoVacio(valor: unknown): valor is string {
  return typeof valor === 'string' && valor !== '';
}

function esListaDeTextos(valor: unknown): boolean {
  return esListaNoVacia(valor) && valor.every(esTextoNoVacio);
}

function esBooleano(valor: unknown): boolean {
  return typeof valor === 'boolean';
}

// `Number.isFinite` no convierte nada: un texto como «1» no es un número.
function esNumero(valor: unknown): boolean {
  return Number.isFinite(valor);
}

function esTipoDeItem(valor: unknown): boolean {
  return valor === 'hecho' || valor === 'problema';
}

/**
 * Si `valor` es el diagrama de un objetivo o de un ejemplo resuelto (MATE-2.7): un texto que empieza por
 * `<svg` y acaba en `</svg>`, tal cual, sin recortar espacios ni saltos de línea. Solo mira los extremos:
 * no comprueba que el SVG esté bien formado ni que dibuje algo, porque se enseña como imagen y un SVG
 * roto no ejecuta nada. Un texto vacío o que no es un texto no vale.
 */
function esDiagramaSvg(valor: unknown): boolean {
  // `startsWith` y `endsWith` distinguen mayúsculas y no recortan nada: un espacio delante ya invalida.
  return typeof valor === 'string' && valor.startsWith('<svg') && valor.endsWith('</svg>');
}

/** Hace opcional una comprobación: una propiedad ausente, o que vale `undefined`, la cumple. */
function opcional(cumple: (valor: unknown) => boolean): (valor: unknown) => boolean {
  return (valor) => valor === undefined || cumple(valor);
}

/**
 * Recorre la lista en orden y devuelve el primer resultado que no es `undefined`. Sirve igual para
 * encontrar el primer fallo de una lista de piezas que la primera propiedad que falta de una pieza.
 */
function primerResultado<Elemento, Resultado>(
  lista: readonly Elemento[],
  comprobar: (elemento: Elemento, posicion: number) => Resultado | undefined,
): Resultado | undefined {
  for (const [posicion, elemento] of lista.entries()) {
    const resultado = comprobar(elemento, posicion);
    if (resultado !== undefined) {
      return resultado;
    }
  }
  return undefined;
}

// --- Reglas: cada una mira una propiedad de la pieza y devuelve su nombre si no se cumple ---

type Regla = (pieza: Registro) => string | undefined;

function exigir(nombre: string, cumple: (valor: unknown) => boolean): Regla {
  return (pieza) => (cumple(pieza[nombre]) ? undefined : nombre);
}

/** La primera regla que no se cumple, en el orden en que se dan. */
function primeraFalta(pieza: Registro, reglas: readonly Regla[]): string | undefined {
  return primerResultado(reglas, (regla) => regla(pieza));
}

const REGLAS_DE_LA_FUENTE: readonly Regla[] = ['documento', 'lugar', 'fragmento'].map((nombre) =>
  exigir(nombre, esTextoNoVacio),
);

// `correcta` se mira después de `opciones`, así que aquí `opciones` ya es una lista de textos.
const REGLA_DE_LA_CORRECTA: Regla = (respuesta) => {
  const opciones = respuesta['opciones'];
  return esLista(opciones) && opciones.includes(respuesta['correcta']) ? undefined : 'correcta';
};

/**
 * Las opciones son distintas entre sí una vez normalizadas como lo hace la corrección (MATE-2.5): dos que
 * solo cambian en los espacios o las mayúsculas cuentan como repetidas, porque elegir una u otra sería lo
 * mismo para `esCorrecta`. Falla en `opciones`. Se mira después de `opciones` y antes de `correcta`, así
 * que aquí `opciones` ya es una lista de textos no vacíos.
 */
const REGLA_DE_LAS_OPCIONES_DISTINTAS: Regla = (respuesta) => {
  const opciones = respuesta['opciones'];
  // `opciones` llega como `unknown`: el `filter` deja solo los textos (todos, si la regla anterior pasó).
  const normalizadas = (esLista(opciones) ? opciones : [])
    .filter((opcion) => typeof opcion === 'string')
    .map(normalizar);
  // Un `Set` descarta los duplicados: si queda con menos elementos, había dos opciones iguales.
  return new Set(normalizadas).size === normalizadas.length ? undefined : 'opciones';
};

const REGLAS_DE_LAS_OPCIONES: readonly Regla[] = [
  exigir('opciones', esListaDeTextos),
  REGLA_DE_LAS_OPCIONES_DISTINTAS,
  REGLA_DE_LA_CORRECTA,
];
const REGLAS_DE_LAS_ACEPTADAS: readonly Regla[] = [exigir('aceptadas', esListaDeTextos)];

/**
 * La respuesta lleva `opciones`, `aceptadas` o las dos. Se comprueba cada grupo que viene, porque
 * `esCorrecta` da prioridad a `aceptadas` si están las dos y una lista vacía ahí volvería a colarse.
 */
function faltaDeLaRespuesta(item: Registro): string | undefined {
  const respuesta = item['respuesta'];
  if (!esRegistro(respuesta)) {
    return 'respuesta';
  }
  const reglas = [
    ...(respuesta['opciones'] === undefined ? [] : REGLAS_DE_LAS_OPCIONES),
    ...(respuesta['aceptadas'] === undefined ? [] : REGLAS_DE_LAS_ACEPTADAS),
  ];
  return reglas.length === 0 ? 'respuesta' : primeraFalta(respuesta, reglas);
}

const REGLAS_DEL_NIVEL: readonly Regla[] = [exigir('nivel', esNumero), exigir('descriptor', esTextoNoVacio)];

function faltaDelNivel(nivel: unknown): string | undefined {
  return esRegistro(nivel) ? primeraFalta(nivel, REGLAS_DEL_NIVEL) : 'niveles';
}

function faltaDelCriterio(criterio: unknown): string | undefined {
  if (!esRegistro(criterio)) {
    return 'rubrica';
  }
  if (!esTextoNoVacio(criterio['criterio'])) {
    return 'criterio';
  }
  const niveles = criterio['niveles'];
  return esListaNoVacia(niveles) ? primerResultado(niveles, faltaDelNivel) : 'niveles';
}

/** La rúbrica es una lista no vacía de criterios, cada uno con su lista no vacía de niveles. */
function faltaDeLaRubrica(tarea: Registro): string | undefined {
  const rubrica = tarea['rubrica'];
  return esListaNoVacia(rubrica) ? primerResultado(rubrica, faltaDelCriterio) : 'rubrica';
}

// --- Piezas: nombre, reglas propias y lo que se mira dentro una vez cumplidas ---

/** Lo que se mira dentro de una pieza con `id` cuando sus reglas se cumplen: su fuente, sus hijas. */
type Interior = (pieza: PiezaConId, nombre: string) => FalloDeFormato | undefined;

interface Molde {
  readonly reglas: readonly Regla[];
  readonly interior: Interior;
}

function tieneId(pieza: unknown): pieza is PiezaConId {
  return esRegistro(pieza) && esTextoNoVacio(pieza['id']);
}

/** «el ítem I9», o, si no tiene `id` válido, `sinId`: «el ítem 3» o «el ítem I7». */
function nombrarPieza(tipo: string, pieza: unknown, sinId: string): string {
  return `${tipo} ${tieneId(pieza) ? pieza.id : sinId}`;
}

/** Sin `id` válido falla en `id`; con él, sus reglas y después su interior, en ese orden. */
function falloDeLaPieza(pieza: unknown, nombre: string, molde: Molde): FalloDeFormato | undefined {
  if (!tieneId(pieza)) {
    return { pieza: nombre, falta: 'id' };
  }
  const falta = primeraFalta(pieza, molde.reglas);
  return falta === undefined ? molde.interior(pieza, nombre) : { pieza: nombre, falta };
}

/** «de» + «el» se contrae: «del ítem I9»; con los demás artículos no: «de la tarea T3». */
function deLaPieza(pieza: string): string {
  return pieza.startsWith('el ') ? pieza.replace(/^el /, 'del ') : `de ${pieza}`;
}

function falloDeLaFuenteOpcional(pieza: PiezaConId, nombre: string): FalloDeFormato | undefined {
  const fuente = pieza['fuente'];
  return fuente === undefined ? undefined : falloDeLaFuente(fuente, nombre);
}

function falloDelInteriorDelObjetivo(objetivo: PiezaConId, nombre: string): FalloDeFormato | undefined {
  const ejemplos = objetivo['ejemplos_resueltos'];
  if (!esLista(ejemplos)) {
    return { pieza: nombre, falta: 'ejemplos_resueltos' };
  }
  const falloDeUnEjemplo = (ejemplo: unknown, posicion: number): FalloDeFormato | undefined =>
    falloDelEjemplo(ejemplo, porPosicion(posicion), objetivo.id);
  return primerResultado(ejemplos, falloDeUnEjemplo) ?? falloDeLaFuenteOpcional(objetivo, nombre);
}

const MOLDE_DEL_OBJETIVO: Molde = {
  reglas: [exigir('instruccion', esTextoNoVacio), exigir('diagrama', opcional(esDiagramaSvg))],
  interior: falloDelInteriorDelObjetivo,
};

const MOLDE_DEL_EJEMPLO: Molde = {
  reglas: [exigir('pasos', esListaDeTextos), exigir('diagrama', opcional(esDiagramaSvg))],
  interior: falloDeLaFuenteOpcional,
};

const MOLDE_DE_LA_CATEGORIA: Molde = {
  reglas: [exigir('descripcion', esTextoNoVacio), exigir('grupo_parecidas', opcional(esTextoNoVacio))],
  interior: falloDeLaFuenteOpcional,
};

// El orden de las reglas es el de las propiedades en contenido.ts.
const MOLDE_DEL_ITEM: Molde = {
  reglas: [
    exigir('objetivo', esTextoNoVacio),
    exigir('categoria', opcional(esTextoNoVacio)),
    exigir('tipo', esTipoDeItem),
    exigir('diagnostico', esBooleano),
    exigir('enunciado', esTextoNoVacio),
    faltaDeLaRespuesta,
    exigir('feedback', esTextoNoVacio),
  ],
  interior: falloDeLaFuenteOpcional,
};

const MOLDE_DE_LA_TAREA: Molde = {
  reglas: [exigir('enunciado', esTextoNoVacio), faltaDeLaRubrica],
  interior: falloDeLaFuenteOpcional,
};

// --- La raíz del fichero ---

type FalloDeLaPieza = (pieza: unknown, sinId: string) => FalloDeFormato | undefined;

/** Una lista de la raíz tiene que ser una lista; si lo es, el primer fallo de sus piezas, nombradas por posición. */
function falloDeLaLista(raiz: Registro, nombre: string, falloDeUnaPieza: FalloDeLaPieza): FalloDeFormato | undefined {
  const lista = raiz[nombre];
  const falloDeLaDePosicion = (pieza: unknown, posicion: number): FalloDeFormato | undefined =>
    falloDeUnaPieza(pieza, porPosicion(posicion));
  return esLista(lista) ? primerResultado(lista, falloDeLaDePosicion) : { falta: nombre };
}

function falloDelContenido(leido: unknown): FalloDeFormato | undefined {
  if (!esRegistro(leido) || !esTextoNoVacio(leido['dominio'])) {
    return { falta: 'dominio' };
  }
  return (
    falloDeLaLista(leido, 'objetivos', falloDelObjetivo) ??
    falloDeLaLista(leido, 'categorias', falloDeLaCategoria) ??
    falloDeLaLista(leido, 'items', falloDelItem) ??
    falloDeLaLista(leido, 'tareas', falloDeLaTarea)
  );
}
