import type {
  CategoriaContenido,
  ContenidoDominio,
  CriterioRubrica,
  EjemploResueltoContenido,
  ItemContenido,
  ObjetivoContenido,
  TareaContenido,
} from '../../../src/aplicacion/contenido.ts';

const OBJETIVOS_POR_DEFECTO = ['O1', 'O2', 'O3'];
const PASOS_POR_DEFECTO = ['P1', 'P2', 'P3'];
const NIVELES_POR_DEFECTO = [0, 1, 2];
const CATEGORIAS_INTERCALABLES = [
  { id: 'C1', descripcion: 'Descripción de C1', grupo_parecidas: 'G1' },
  { id: 'C2', descripcion: 'Descripción de C2', grupo_parecidas: 'G1' },
];

/** Datos mínimos de un ítem; el resto se rellena con valores por defecto. */
type DatosItem = Partial<ItemContenido> & { readonly id: string; readonly objetivo: string };

export function ejemploPorDefecto(id = 'E1', pasos = PASOS_POR_DEFECTO): EjemploResueltoContenido {
  return { id, pasos };
}

/** Rúbrica de un criterio con los niveles 0, 1 y 2 y descriptores inventados. */
export function criterioPorDefecto(criterio: string): CriterioRubrica {
  return {
    criterio,
    niveles: NIVELES_POR_DEFECTO.map((nivel) => ({ nivel, descriptor: `Descriptor del nivel ${String(nivel)}` })),
  };
}

function tareaPorDefecto(id: string): TareaContenido {
  return { id, enunciado: `Enunciado de ${id}`, rubrica: [criterioPorDefecto('Planteamiento')] };
}

/** Respuesta que la aplicación corrige como correcta (o como incorrecta) para este ítem. */
export function respuestaPara(item: ItemContenido, correcta: boolean): string {
  if ('aceptadas' in item.respuesta) {
    return correcta ? (item.respuesta.aceptadas[0] ?? '') : 'respuesta equivocada';
  }
  const acertada = item.respuesta.correcta;
  return correcta ? acertada : (item.respuesta.opciones.find((opcion) => opcion !== acertada) ?? 'z');
}

/**
 * Contenido de un dominio de prueba, tal como lo escribiría el autor en `contenido/<dominio>.json`.
 * Los pasos lo van completando; la aplicación lo lee a través de `leerContenido`.
 */
export class BorradorContenido {
  readonly dominio: string;
  objetivos: readonly ObjetivoContenido[];
  categorias: readonly CategoriaContenido[] = [];
  items: readonly ItemContenido[] = [];
  tareas: readonly TareaContenido[] = [];

  constructor(dominio: string) {
    this.dominio = dominio;
    this.objetivos = [];
    this.fijarObjetivos(OBJETIVOS_POR_DEFECTO);
  }

  fijarObjetivos(ids: readonly string[]): void {
    this.objetivos = ids.map((id) => ({
      id,
      instruccion: `Instrucción de ${id}`,
      ejemplos_resueltos: [ejemploPorDefecto()],
    }));
  }

  fijarEjemplo(objetivo: string, ejemplo: EjemploResueltoContenido): void {
    this.objetivos = this.objetivos.map((actual) =>
      actual.id === objetivo ? { ...actual, ejemplos_resueltos: [ejemplo] } : actual,
    );
  }

  fijarCategorias(categorias: readonly CategoriaContenido[]): void {
    this.categorias = categorias;
  }

  agregarItem(datos: DatosItem): ItemContenido {
    const item: ItemContenido = {
      tipo: 'hecho',
      diagnostico: false,
      enunciado: `Enunciado de ${datos.id}`,
      respuesta: { opciones: ['a', 'b', 'c'], correcta: 'a' },
      feedback: `Feedback de ${datos.id}`,
      ...datos,
    };
    this.items = [...this.items, item];
    return item;
  }

  item(id: string): ItemContenido {
    const encontrado = this.items.find((candidato) => candidato.id === id);
    if (encontrado === undefined) {
      throw new Error(`El contenido de prueba no tiene el ítem ${id}`);
    }
    return encontrado;
  }

  /** Devuelve el ítem si ya existe; si no, lo crea en el objetivo indicado. */
  asegurarItem(id: string, objetivo = 'O1'): ItemContenido {
    return this.items.find((candidato) => candidato.id === id) ?? this.agregarItem({ id, objetivo });
  }

  itemsDe(objetivo: string): readonly ItemContenido[] {
    return this.items.filter((item) => item.objetivo === objetivo);
  }

  /** Añade `cantidad` ítems nuevos al objetivo, con los datos comunes que se indiquen. */
  agregarItems(objetivo: string, cantidad: number, datos: Partial<ItemContenido> = {}): void {
    for (let numero = 0; numero < cantidad; numero += 1) {
      this.agregarItem({ ...datos, id: this.idLibre('I'), objetivo });
    }
  }

  /** Reparte los problemas que no tienen categoría de un grupo de parecidas entre las que lo tienen. */
  asignarCategoriasIntercalables(): void {
    this.hacerIntercalables(0);
    const agrupadas = this.categorias.filter((categoria) => categoria.grupo_parecidas !== undefined);
    let siguiente = 0;
    this.items = this.items.map((item) => {
      if (item.tipo !== 'problema' || this.esIntercalable(item)) {
        return item;
      }
      siguiente += 1;
      return { ...item, categoria: agrupadas[siguiente % agrupadas.length]?.id ?? 'C1' };
    });
  }

  /** Añade ítems de tipo «hecho» a los objetivos que tengan menos de `minimo`. */
  asegurarItemsPorObjetivo(minimo: number): void {
    for (const objetivo of this.objetivos) {
      for (let numero = this.itemsDe(objetivo.id).length; numero < minimo; numero += 1) {
        this.agregarItem({ id: this.idLibre('I'), objetivo: objetivo.id });
      }
    }
  }

  /** Deja al objetivo con al menos `minimo` ítems de tipo «problema». */
  asegurarProblemas(objetivo: string, minimo: number): void {
    const existentes = this.itemsDe(objetivo).filter((item) => item.tipo === 'problema').length;
    for (let numero = existentes; numero < minimo; numero += 1) {
      this.agregarItem({ id: this.idLibre('Q'), objetivo, tipo: 'problema' });
    }
  }

  /** Deja el dominio con al menos `cantidad` problemas de categorías del mismo grupo de parecidas. */
  hacerIntercalables(cantidad: number): void {
    if (!this.categorias.some((categoria) => categoria.grupo_parecidas !== undefined)) {
      this.categorias = [...this.categorias, ...CATEGORIAS_INTERCALABLES];
    }
    const agrupadas = this.categorias.filter((categoria) => categoria.grupo_parecidas !== undefined);
    const yaSon = (item: ItemContenido): boolean => item.tipo === 'problema' && this.esIntercalable(item);
    let faltan = cantidad - this.items.filter(yaSon).length;
    this.items = this.items.map((item) => {
      if (faltan <= 0 || yaSon(item)) {
        return item;
      }
      faltan -= 1;
      return { ...item, tipo: 'problema', categoria: agrupadas[faltan % agrupadas.length]?.id ?? 'C1' };
    });
    this.asegurarProblemas(this.objetivos[0]?.id ?? 'O1', cantidad);
  }

  esIntercalable(item: ItemContenido): boolean {
    const categoria = this.categorias.find((candidata) => candidata.id === item.categoria);
    return categoria?.grupo_parecidas !== undefined;
  }

  fijarTareas(ids: readonly string[]): void {
    this.tareas = ids.map(tareaPorDefecto);
  }

  /** Añade la tarea con su rúbrica por defecto si el contenido todavía no la tiene. */
  asegurarTarea(id: string): void {
    if (!this.tareas.some((tarea) => tarea.id === id)) {
      this.tareas = [...this.tareas, tareaPorDefecto(id)];
    }
  }

  fijarRubrica(tarea: string, rubrica: readonly CriterioRubrica[]): void {
    this.tareas = this.tareas.map((actual) => (actual.id === tarea ? { ...actual, rubrica } : actual));
  }

  toContenido(): ContenidoDominio {
    return {
      dominio: this.dominio,
      objetivos: this.objetivos,
      categorias: this.categorias,
      items: this.items,
      tareas: this.tareas,
    };
  }

  private idLibre(prefijo: string): string {
    let numero = this.items.length + 1;
    while (this.items.some((item) => item.id === `${prefijo}${String(numero)}`)) {
      numero += 1;
    }
    return `${prefijo}${String(numero)}`;
  }
}
