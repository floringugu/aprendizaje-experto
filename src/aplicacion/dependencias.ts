import type { ContenidoDominio } from './contenido.ts';
import type { ParametrosJson, PlanificadorFsrs, Reloj } from './puertos.ts';

/**
 * Todo lo que la aplicación necesita del exterior. Lo aporta quien la arranca: el servidor, con el
 * reloj real y los ficheros de `config/` y `contenido/`; los escenarios de aceptación, con un reloj
 * y un FSRS de prueba. Los casos de uso no leen ficheros ni llaman a `new Date()` por su cuenta.
 */
export interface Dependencias {
  readonly reloj: Reloj;
  /** Se llama en cada evaluación: un cambio en `config/parametros.json` se nota enseguida. */
  readonly leerParametros: () => ParametrosJson;
  /** Contenido del dominio, o `undefined` si no existe. También se lee en cada uso. */
  readonly leerContenido: (dominio: string) => ContenidoDominio | undefined;
  readonly planificadorFsrs: PlanificadorFsrs;
}
