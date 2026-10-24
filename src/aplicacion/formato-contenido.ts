// Validación del formato del contenido (plan §0, «Formato del contenido»): lo que se lee de
// `contenido/<dominio>.json` no llega a los casos de uso hasta cumplirlo (D16). Sin dependencias.
import type { ContenidoValidado } from './contenido.ts';

/** Qué propiedad del formato falta o no es válida, y en qué pieza. */
interface FalloDeFormato {
  /**
   * La pieza que falla, como la buscaría el autor en el fichero: «el ítem I9», «la tarea T3», «el
   * ejemplo resuelto E1 de O2», «la fuente del ítem I9». Una pieza sin `id` válido se nombra por su
   * posición en la lista, contando desde 1: «el ítem 3». No viene si el fallo está en la raíz.
   */
  readonly pieza?: string;
  /**
   * El nombre de la propiedad, sin ruta: `respuesta`, `feedback`, `pasos`, `rubrica`, `descriptor`,
   * `instruccion`… Son los que la aplicación usa para decir qué le falta a una pieza (MATE-2.3, MATE-4.8).
   */
  readonly falta: string;
}

type Validacion<T> = { readonly ok: true; readonly valor: T } | { readonly ok: false; readonly fallo: FalloDeFormato };

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
 *   ser una de las `opciones`, y `nivel` es un número.
 * - `tipo` es `hecho` o `problema`, y `diagnostico` es un booleano.
 * - `categoria`, `grupo_parecidas` y `fuente` son opcionales; una propiedad opcional que vale
 *   `undefined` cuenta como ausente. Una `fuente` que viene tiene `documento`, `lugar` y `fragmento`.
 * - `objetivos`, `categorias`, `items`, `tareas` y los `ejemplos_resueltos` de un objetivo pueden
 *   estar vacíos.
 * - Las propiedades de más se ignoran: el borrador lleva más que el contenido aprobado.
 */
export function validarContenido(leido: unknown): Validacion<ContenidoValidado> {
  const fallo = falloDelContenido(leido);
  // El `as` es honesto: `falloDelContenido` ha comprobado todo lo que dice `ContenidoValidado`.
  return fallo === undefined ? { ok: true, valor: leido as ContenidoValidado } : { ok: false, fallo };
}

// Una función por pieza. Cada una devuelve el primer fallo de la pieza, o `undefined` si cumple el
// formato. `posicion` es su índice en la lista, desde 0, para nombrarla cuando no tiene `id` válido.
// No se exportan hasta que MATE las use para validar las piezas del borrador una a una.

function falloDelObjetivo(objetivo: unknown, posicion: number): FalloDeFormato | undefined {
  return falloDeLaPieza(objetivo, nombrarPieza('el objetivo', objetivo, posicion), MOLDE_DEL_OBJETIVO);
}

/** `objetivo` es cómo se nombra el objetivo del ejemplo: su `id` o su posición. */
function falloDelEjemplo(ejemplo: unknown, posicion: number, objetivo: string): FalloDeFormato | undefined {
  const nombre = `${nombrarPieza('el ejemplo resuelto', ejemplo, posicion)} de ${objetivo}`;
  return falloDeLaPieza(ejemplo, nombre, MOLDE_DEL_EJEMPLO);
}

function falloDeLaCategoria(categoria: unknown, posicion: number): FalloDeFormato | undefined {
  return falloDeLaPieza(categoria, nombrarPieza('la categoría', categoria, posicion), MOLDE_DE_LA_CATEGORIA);
}

function falloDelItem(item: unknown, posicion: number): FalloDeFormato | undefined {
  return falloDeLaPieza(item, nombrarPieza('el ítem', item, posicion), MOLDE_DEL_ITEM);
}

function falloDeLaTarea(tarea: unknown, posicion: number): FalloDeFormato | undefined {
  return falloDeLaPieza(tarea, nombrarPieza('la tarea', tarea, posicion), MOLDE_DE_LA_TAREA);
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

type Registro = Readonly<Record<string, unknown>>;
type PiezaConId = Registro & { readonly id: string };

function esRegistro(valor: unknown): valor is Registro {
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

const REGLAS_DE_LAS_OPCIONES: readonly Regla[] = [exigir('opciones', esListaDeTextos), REGLA_DE_LA_CORRECTA];
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

/** «el ítem I9», o, si no tiene `id` válido, su posición contando desde 1: «el ítem 3». */
function nombrarPieza(tipo: string, pieza: unknown, posicion: number): string {
  return `${tipo} ${tieneId(pieza) ? pieza.id : String(posicion + 1)}`;
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
    falloDelEjemplo(ejemplo, posicion, objetivo.id);
  return primerResultado(ejemplos, falloDeUnEjemplo) ?? falloDeLaFuenteOpcional(objetivo, nombre);
}

const MOLDE_DEL_OBJETIVO: Molde = {
  reglas: [exigir('instruccion', esTextoNoVacio)],
  interior: falloDelInteriorDelObjetivo,
};

const MOLDE_DEL_EJEMPLO: Molde = {
  reglas: [exigir('pasos', esListaDeTextos)],
  interior: falloDeLaFuenteOpcional,
};

const MOLDE_DE_LA_CATEGORIA: Molde = {
  reglas: [exigir('grupo_parecidas', opcional(esTextoNoVacio))],
  interior: () => undefined,
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

type FalloDeLaPieza = (pieza: unknown, posicion: number) => FalloDeFormato | undefined;

/** Una lista de la raíz tiene que ser una lista; si lo es, el primer fallo de sus piezas. */
function falloDeLaLista(raiz: Registro, nombre: string, falloDeUnaPieza: FalloDeLaPieza): FalloDeFormato | undefined {
  const lista = raiz[nombre];
  return esLista(lista) ? primerResultado(lista, falloDeUnaPieza) : { falta: nombre };
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
