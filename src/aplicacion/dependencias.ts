import type {
  ClaudeCode,
  Ficheros,
  LibreOffice,
  ParametrosJson,
  PlanificadorFsrs,
  RedactorIa,
  Reloj,
  Temporizador,
  Web,
} from './puertos.ts';

/**
 * Todo lo que la aplicación necesita del exterior. Lo aporta quien la arranca: el servidor, con el
 * reloj real y los ficheros de la carpeta de datos (`contenido/` entre ellos); los escenarios de
 * aceptación, con un reloj y un FSRS de prueba. Los casos de uso no leen ficheros ni llaman a `new Date()` por su cuenta.
 */
export interface Dependencias {
  readonly reloj: Reloj;
  /** Se llama en cada evaluación: un cambio en `config/parametros.json` se nota enseguida. */
  readonly leerParametros: () => ParametrosJson;
  /**
   * La dirección del servidor tal como la ve el móvil, sin barra final, por ejemplo `http://192.168.1.20:3000`.
   * El texto del QR es `<direccion>/entrar?clave=<clave>` (PANT-1.1).
   */
  readonly direccion: string;
  readonly planificadorFsrs: PlanificadorFsrs;
  readonly ficheros: Ficheros;
  /** La IA configurada en Ajustes, o `undefined` si no hay ninguna (MATE-2.4). Se lee en cada uso. */
  readonly leerIa: () => RedactorIa | undefined;
  readonly libreOffice: LibreOffice;
  readonly web: Web;
  readonly claudeCode: ClaudeCode;
  readonly temporizador: Temporizador;
}
