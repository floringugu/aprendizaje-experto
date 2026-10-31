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

/**
 * Un ítem tal como lo escribe el autor, con el campo `reservado` de MATE-2.8. `ItemContenido` aún no lo
 * tiene (lo añade el ticket mate-reservados), así que se declara aquí por intersección.
 */
export type ItemDePrueba = ItemContenido & { readonly reservado?: boolean };

/** Datos mínimos de un ítem; el resto se rellena con valores por defecto. */
type DatosItem = Partial<ItemDePrueba> & { readonly id: string; readonly objetivo: string };

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
  items: readonly ItemDePrueba[] = [];
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

  agregarItem(datos: DatosItem): ItemDePrueba {
    const item: ItemDePrueba = {
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

  item(id: string): ItemDePrueba {
    const encontrado = this.items.find((candidato) => candidato.id === id);
    if (encontrado === undefined) {
      throw new Error(`El contenido de prueba no tiene el ítem ${id}`);
    }
    return encontrado;
  }

  /** Devuelve el ítem si ya existe; si no, lo crea en el objetivo indicado. */
  asegurarItem(id: string, objetivo = 'O1'): ItemDePrueba {
    return this.items.find((candidato) => candidato.id === id) ?? this.agregarItem({ id, objetivo });
  }

  /** Los ítems del objetivo que la persona practica: los reservados no cuentan (MAST-8). */
  itemsDe(objetivo: string): readonly ItemDePrueba[] {
    return this.items.filter((item) => item.objetivo === objetivo && !this.esReservado(item));
  }

  esReservado(item: ItemDePrueba): boolean {
    return item.reservado === true;
  }

  /** Los reservados del dominio, o solo los del objetivo, en el orden del contenido. */
  reservados(objetivo?: string): readonly ItemDePrueba[] {
    return this.items.filter(
      (item) => this.esReservado(item) && (objetivo === undefined || item.objetivo === objetivo),
    );
  }

  /** Los problemas de categorías con grupo de parecidas que la persona practica, sin los reservados. */
  problemasIntercalables(): readonly ItemDePrueba[] {
    return this.items.filter(
      (item) => item.tipo === 'problema' && this.esIntercalable(item) && !this.esReservado(item),
    );
  }

  cambiarItem(id: string, cambios: Partial<ItemDePrueba>): void {
    this.items = this.items.map((item) => (item.id === id ? { ...item, ...cambios } : item));
  }

  /** Marca el ítem como reservado y, con `cambios`, le cambia el tipo o la categoría. */
  reservar(id: string, cambios: Partial<ItemDePrueba> = {}): void {
    this.cambiarItem(id, { ...cambios, reservado: true });
  }

  /** Le da otro `id` al ítem, para que un escenario pueda usar el suyo en otro objetivo. */
  liberarId(id: string): void {
    this.cambiarItem(id, { id: this.idLibre('I') });
  }

  /** Añade `cantidad` problemas reservados de categorías con grupo de parecidas y los devuelve. */
  agregarReservadosIntercalables(cantidad: number, objetivo = 'O1'): readonly ItemDePrueba[] {
    this.hacerIntercalables(0);
    const agrupadas = this.categorias.filter((categoria) => categoria.grupo_parecidas !== undefined);
    const nuevos: ItemDePrueba[] = [];
    for (let numero = 0; numero < cantidad; numero += 1) {
      const categoria = agrupadas[numero % agrupadas.length]?.id ?? 'C1';
      nuevos.push(this.agregarItem({ id: this.idLibre('R'), objetivo, tipo: 'problema', categoria, reservado: true }));
    }
    return nuevos;
  }

  /** Añade el objetivo al final de la ruta, con el ejemplo resuelto por defecto. */
  agregarObjetivo(id: string): void {
    this.objetivos = [
      ...this.objetivos,
      { id, instruccion: `Instrucción de ${id}`, ejemplos_resueltos: [ejemploPorDefecto()] },
    ];
  }

  /** Añade `cantidad` ítems nuevos al objetivo, con los datos comunes que se indiquen. */
  agregarItems(objetivo: string, cantidad: number, datos: Partial<ItemDePrueba> = {}): void {
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
      if (item.tipo !== 'problema' || this.esIntercalable(item) || this.esReservado(item)) {
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
    const yaSon = (item: ItemDePrueba): boolean => item.tipo === 'problema' && this.esIntercalable(item);
    let faltan = cantidad - this.problemasIntercalables().length;
    this.items = this.items.map((item) => {
      if (faltan <= 0 || yaSon(item) || this.esReservado(item)) {
        return item;
      }
      faltan -= 1;
      return { ...item, tipo: 'problema', categoria: agrupadas[faltan % agrupadas.length]?.id ?? 'C1' };
    });
    this.asegurarProblemas(this.objetivos[0]?.id ?? 'O1', cantidad);
  }

  esIntercalable(item: ItemDePrueba): boolean {
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
