// .claude/settings.local.json: ajustes de Claude Code de esta máquina, fuera de git.
//
// La fase y el área en curso del checkout se guardan ahí, en env.ARNES_FASE y env.ARNES_AREA. Los
// hooks y los scripts del arnés las leen del fichero en cada llamada (faseYAreaDelCheckout en
// checkout.ts), no del entorno del proceso: así cada checkout (el directorio principal y cada
// worktree de «make abrir») lleva su fase y su área.
//
// Con la fase se guardan el modelo y el esfuerzo con que empieza la conversación («model» y
// «effortLevel»), que dependen de ella (MODELO_POR_FASE en fases.ts).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { MODELO_POR_FASE } from './fases.ts';
import type { Fase } from './fases.ts';

export const RUTA_AJUSTES_LOCALES = '.claude/settings.local.json';

/**
 * Texto de los ajustes con env.ARNES_FASE, env.ARNES_AREA (se quita si no hay área), model y
 * effortLevel cambiados. Conserva todo lo demás: Claude Code también guarda ahí los permisos que
 * el dueño acepta («Allow always»).
 */
export function ajustesConFase(textoAnterior: string | undefined, fase: Fase, area: string | undefined): string {
  const ajustes = objetoJson(textoAnterior);
  const env = Object.entries(objetoOVacio(ajustes['env'], '«env»')).filter(([nombre]) => nombre !== 'ARNES_AREA');
  const { modelo, esfuerzo } = MODELO_POR_FASE[fase];
  const nuevoEnv = {
    ...Object.fromEntries(env),
    ARNES_FASE: fase,
    ...(area === undefined ? {} : { ARNES_AREA: area }),
  };
  const nuevos = { ...ajustes, env: nuevoEnv, model: modelo, effortLevel: esfuerzo };
  return `${JSON.stringify(nuevos, null, 2)}\n`;
}

/** Guarda la fase y el área en los ajustes de `raiz`. */
export function fijarFase(
  raiz: string,
  { fase, area }: { readonly fase: Fase; readonly area: string | undefined },
): void {
  const ruta = path.join(raiz, RUTA_AJUSTES_LOCALES);
  mkdirSync(path.dirname(ruta), { recursive: true });
  writeFileSync(ruta, ajustesConFase(textoSiExiste(ruta), fase, area));
}

/** El objeto «env» de los ajustes de `raiz`: vacío si no hay fichero o no tiene «env». */
export function entornoDeAjustesLocales(raiz: string): Record<string, unknown> {
  return objetoOVacio(objetoJson(textoSiExiste(path.join(raiz, RUTA_AJUSTES_LOCALES)))['env'], '«env»');
}

function textoSiExiste(ruta: string): string | undefined {
  return existsSync(ruta) ? readFileSync(ruta, 'utf8') : undefined;
}

/** Los ajustes del texto del fichero: ninguno si no existe o está vacío. */
function objetoJson(texto: string | undefined): Record<string, unknown> {
  if (texto === undefined || texto.trim() === '') return {};
  return objetoOVacio(JSON.parse(texto) as unknown, 'el fichero');
}

function objetoOVacio(valor: unknown, que: string): Record<string, unknown> {
  if (valor === undefined) return {};
  if (typeof valor !== 'object' || valor === null || Array.isArray(valor)) {
    throw new Error(`${RUTA_AJUSTES_LOCALES}: ${que} debe ser un objeto JSON. Corrígelo a mano y repite.`);
  }
  return valor as Record<string, unknown>;
}
