import type { ContenidoDominio } from '../../../src/aplicacion/contenido.ts';
import type {
  Ficheros,
  LibreOffice,
  PaginaDescargada,
  RedactorIa,
  Temporizador,
  Web,
} from '../../../src/aplicacion/puertos.ts';
import { ClaudeCodeDePrueba } from './claude-code.ts';
import { pdfDePrueba } from './pdf.ts';
import type { RelojDePrueba } from './reloj.ts';

// Dobles de lo que la aplicación usa fuera de sí misma en MATE: los ficheros, LibreOffice, la web, la
// IA, el temporizador y Claude Code. Los escenarios los configuran y miran lo que recibieron.

/** `contenido/ficticio.json` → ficticio; el resto de rutas (los borradores, el material) no coinciden. */
const RUTA_DEL_CONTENIDO = /^contenido\/([^/]+)\.json$/;

export function aBytes(texto: string): Uint8Array {
  return new TextEncoder().encode(texto);
}

export function aTexto(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

/**
 * Ficheros en memoria. Mientras la aplicación no escriba `contenido/<dominio>.json`, leerlo da el
 * contenido aprobado que preparan los pasos: es el que el autor tendría en el disco.
 */
export class FicherosDePrueba implements Ficheros {
  /** Todo lo que ha escrito la aplicación, en orden, aunque después lo haya sustituido (MATE-8.6). */
  readonly escritos: { readonly ruta: string; readonly bytes: Uint8Array }[] = [];
  private readonly ficheros = new Map<string, Uint8Array>();
  private readonly contenidoAprobado: (dominio: string) => ContenidoDominio | undefined;

  constructor(contenidoAprobado: (dominio: string) => ContenidoDominio | undefined) {
    this.contenidoAprobado = contenidoAprobado;
  }

  leer(ruta: string): Uint8Array | undefined {
    const guardado = this.ficheros.get(ruta);
    if (guardado !== undefined) {
      return guardado;
    }
    const dominio = RUTA_DEL_CONTENIDO.exec(ruta)?.[1];
    const aprobado = dominio === undefined ? undefined : this.contenidoAprobado(dominio);
    return aprobado === undefined ? undefined : aBytes(JSON.stringify(aprobado, null, 2));
  }

  escribir(ruta: string, bytes: Uint8Array): void {
    this.ficheros.set(ruta, bytes);
    this.escritos.push({ ruta, bytes });
  }

  /** Un fichero que ya estaba antes de que la persona hiciera nada (un borrador de la IA, por ejemplo). */
  dejar(ruta: string, texto: string): void {
    this.ficheros.set(ruta, aBytes(texto));
  }

  /** El JSON de la ruta ya interpretado, o `undefined` si el fichero no existe. */
  leerJson(ruta: string): unknown {
    const bytes = this.leer(ruta);
    return bytes === undefined ? undefined : JSON.parse(aTexto(bytes));
  }

  /** El contenido aprobado, solo si la aplicación ha escrito ya su fichero. */
  contenidoEscrito(dominio: string): ContenidoDominio | undefined {
    const bytes = this.ficheros.get(`contenido/${dominio}.json`);
    return bytes === undefined ? undefined : (JSON.parse(aTexto(bytes)) as ContenidoDominio);
  }
}

/** LibreOffice: convierte cualquier PPTX o DOCX en un PDF de una página que dice de qué fichero sale. */
export class LibreOfficeDePrueba implements LibreOffice {
  estaInstalado = true;
  readonly conversiones: { readonly nombre: string; readonly pdf: Uint8Array }[] = [];

  instalado(): Promise<boolean> {
    return Promise.resolve(this.estaInstalado);
  }

  convertirAPdf(nombre: string): Promise<Uint8Array> {
    if (!this.estaInstalado) {
      return Promise.reject(new Error('LibreOffice no está instalado'));
    }
    const pdf = pdfDePrueba([[`Contenido de ${nombre}`]]);
    this.conversiones.push({ nombre, pdf });
    return Promise.resolve(pdf);
  }
}

/** La web: cada URL da la página que haya puesto el escenario, o nada si no existe. */
export class WebDePrueba implements Web {
  private readonly paginas = new Map<string, PaginaDescargada>();

  /** Publica en la URL una página HTML con un único párrafo. */
  publicar(url: string, parrafo: string): void {
    const html = `<html><head><title>Tema 3</title></head><body><p>${parrafo}</p></body></html>`;
    this.paginas.set(url, { tipoContenido: 'text/html; charset=utf-8', bytes: aBytes(html) });
  }

  retirar(url: string): void {
    this.paginas.delete(url);
  }

  existe(url: string): boolean {
    return this.paginas.has(url);
  }

  descargar(url: string): Promise<PaginaDescargada | undefined> {
    return Promise.resolve(this.paginas.get(url));
  }
}

/**
 * Lo que la aplicación le pide a la IA. `reservadosDe` solo viene al pedir más reservados de un objetivo
 * (MATE-2.10): el objetivo y los enunciados de los ítems que ya tiene.
 */
export interface PeticionALaIa {
  readonly documento: string;
  readonly pdf: Uint8Array;
  readonly reservadosDe?: { readonly objetivo: string; readonly enunciados: readonly string[] };
}

/** La IA: entrega el borrador que haya preparado el escenario y anota qué le pidieron. */
export class IaDePrueba implements RedactorIa {
  respuesta: unknown = {};
  readonly documentosPedidos: string[] = [];
  readonly peticiones: PeticionALaIa[] = [];

  redactar(peticion: PeticionALaIa): Promise<unknown> {
    this.documentosPedidos.push(peticion.documento);
    this.peticiones.push(peticion);
    return Promise.resolve(this.respuesta);
  }
}

interface Programada {
  readonly vence: number;
  readonly accion: () => void;
  cancelada: boolean;
}

/** Temporizador atado al reloj de prueba: solo vence lo programado cuando un paso hace pasar el tiempo. */
export class TemporizadorDePrueba implements Temporizador {
  private programadas: Programada[] = [];
  private readonly reloj: RelojDePrueba;

  constructor(reloj: RelojDePrueba) {
    this.reloj = reloj;
  }

  programar(milisegundos: number, accion: () => void): () => void {
    const programada: Programada = { vence: this.reloj.ahora().getTime() + milisegundos, accion, cancelada: false };
    this.programadas.push(programada);
    return () => {
      programada.cancelada = true;
    };
  }

  /** Avanza el reloj y ejecuta, por orden de vencimiento, lo que haya vencido y no se haya cancelado. */
  avanzar(milisegundos: number): void {
    this.reloj.avanzarMs(milisegundos);
    const ahora = this.reloj.ahora().getTime();
    const vencidas = this.programadas.filter((programada) => programada.vence <= ahora);
    this.programadas = this.programadas.filter((programada) => programada.vence > ahora);
    vencidas
      .sort((una, otra) => una.vence - otra.vence)
      .filter((programada) => !programada.cancelada)
      .forEach((programada) => {
        programada.accion();
      });
  }
}

/** Todos los dobles de un escenario. La IA está configurada salvo que el escenario diga lo contrario. */
export class Externos {
  readonly ficheros: FicherosDePrueba;
  readonly libreOffice = new LibreOfficeDePrueba();
  readonly web = new WebDePrueba();
  readonly ia = new IaDePrueba();
  iaConfigurada = true;
  readonly temporizador: TemporizadorDePrueba;
  readonly claudeCode = new ClaudeCodeDePrueba();

  constructor(reloj: RelojDePrueba, contenidoAprobado: (dominio: string) => ContenidoDominio | undefined) {
    this.ficheros = new FicherosDePrueba(contenidoAprobado);
    this.temporizador = new TemporizadorDePrueba(reloj);
  }

  leerIa(): RedactorIa | undefined {
    return this.iaConfigurada ? this.ia : undefined;
  }
}
