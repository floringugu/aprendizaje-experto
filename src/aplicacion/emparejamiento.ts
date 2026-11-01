import type { Resultado } from './resultado.ts';

// Emparejar un móvil con el servidor (PANT-1). El servidor no usa HTTPS: la clave de un solo uso solo
// evita que otro dispositivo de la wifi de casa vea o cambie el progreso.

/** Lo que muestra el PC para que el móvil lo lea con la cámara. */
interface Emparejamiento {
  /** `<dirección>/entrar?clave=<clave>`, con la dirección de `Dependencias.direccion` (PANT-1.1). */
  readonly texto: string;
}

/** Un dispositivo emparejado: con su token entra sin repetir la clave (PANT-1.3). */
export interface DispositivoEmparejado {
  readonly dispositivo: string;
}

export interface CasosDeEmparejamiento {
  /**
   * Genera una clave de 128 bits y devuelve el texto del QR. Solo hay una clave viva: la nueva sustituye a la
   * anterior.
   */
  abrirEmparejamiento(): Emparejamiento;
  /**
   * Gasta la clave y devuelve el token del dispositivo, que se guarda en `dispositivos.json` (solo su hash,
   * y el emparejamiento sobrevive a un reinicio). Rechaza una clave que no es la viva o que ya se gastó
   * (PANT-1.4, PANT-1.5).
   */
  emparejar(peticion: { readonly clave: string }): Resultado<DispositivoEmparejado>;
}
