import { aceptar, rechazarElCampo, type Resultado } from './resultado.ts';

// De 1 a 64 caracteres; el primero, letra o número, para que ni `-x` ni `_x` parezcan una opción o un fichero oculto.
const DOMINIO_ADMITIDO = /^[a-z0-9][a-z0-9_-]{0,63}$/;

const MOTIVO_DOMINIO_NO_ADMITIDO =
  'El nombre del dominio solo puede llevar letras minúsculas sin tilde, números, «_» y «-», y empezar por una letra o un número.';

/**
 * El dominio de una petición, tal cual, si se puede poner en una ruta: va dentro de `contenido/<dominio>.json`
 * y de `material/<dominio>/`. Lo llaman, antes de leer o escribir nada, todos los casos de uso que reciben
 * un dominio; los de las sesiones, a través de `enDominio`.
 *
 * Admite de 1 a 64 letras minúsculas sin tilde, números, `_` y `-`, empezando por una letra o un número.
 * Sin punto ni barras, el dominio no sale de su carpeta (`../`); sin mayúsculas ni tildes, dos dominios
 * distintos no acaban en el mismo fichero en un sistema de ficheros que no distingue mayúsculas o que
 * normaliza Unicode. Cualquier otro rechaza con `campo` `dominio`.
 */
export function dominioValido(dominio: string): Resultado<string> {
  return DOMINIO_ADMITIDO.test(dominio) ? aceptar(dominio) : rechazarElCampo('dominio', MOTIVO_DOMINIO_NO_ADMITIDO);
}
