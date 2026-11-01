import type { Preferencias } from './preferencias.ts';
import type { Resultado } from './resultado.ts';

// La puerta entre el servidor y la aplicación (PANT-1.2): sin dispositivo emparejado no se ve nada.

export type NombreDePantalla = 'hoy' | 'practica' | 'ajustes';

/**
 * Lo que la pantalla muestra, como datos y no como HTML (el HTML lo arma `src/interfaz/render/`). Los datos
 * de `hoy` y `practica` los fija el ticket `pant`.
 */
export type ModeloDePantalla =
  | { readonly pantalla: 'hoy' }
  | { readonly pantalla: 'practica' }
  | { readonly pantalla: 'ajustes'; readonly preferencias: Preferencias };

interface PeticionPantalla {
  /** El token que dio `emparejar`; sin él, o con uno que no está emparejado, se rechaza. */
  readonly dispositivo?: string | undefined;
  readonly pantalla: NombreDePantalla;
}

export interface CasosDePantallas {
  /** Sin dispositivo emparejado rechaza sin devolver nada del progreso (PANT-1.2, PANT-1.4, PANT-1.5). */
  abrirPantalla(peticion: PeticionPantalla): Resultado<ModeloDePantalla>;
}
