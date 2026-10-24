// .claude/settings.local.json: ajustes de Claude Code de esta máquina, fuera de git.
//
// La fase de la próxima conversación se guarda ahí, en env.ARNES_FASE, y el área en curso en
// env.ARNES_AREA. Claude Code pasa las variables de «env» a los hooks al abrir cada conversación,
// igual que si se hubiera lanzado con «ARNES_FASE=… claude» desde un terminal. Así cada fase se
// abre desde VS Code, y cada worktree (make abrir) lleva su fase y su área.
//
// Con la fase se guardan el modelo y el esfuerzo con que empieza la conversación («model» y
// «effortLevel»), que dependen de ella (MODELO_POR_FASE en fases.ts).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { MODELO_POR_FASE } from './fases.ts';
import type { Fase } from './protegidas.ts';

export const RUTA_AJUSTES_LOCALES = '.claude/settings.local.json';

/**
 * Texto de los ajustes con env.ARNES_FASE, env.ARNES_AREA (se quita si no hay área), model y
 * effortLevel cambiados. Conserva todo lo demás: Claude Code también guarda ahí los permisos que
 * el dueño acepta («Allow always»).
 */
export function ajustesConFase(textoAnterior: string | undefined, fase: Fase, area: string | undefined): string {
  const ajustes = textoAnterior === undefined || textoAnterior.trim() === '' ? {} : objetoJson(textoAnterior);
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

/**
 * Guarda la fase y el área en los ajustes de `raiz`. Si `raiz` aún no tiene ajustes, parte de los
 * de `copiarDe`: un worktree nuevo hereda los permisos que el dueño ya aceptó.
 */
export function fijarFase(
  raiz: string,
  { fase, area }: { readonly fase: Fase; readonly area: string | undefined },
  copiarDe?: string,
): void {
  const ruta = path.join(raiz, RUTA_AJUSTES_LOCALES);
  const origen = existsSync(ruta) || copiarDe === undefined ? ruta : path.join(copiarDe, RUTA_AJUSTES_LOCALES);
  const anterior = existsSync(origen) ? readFileSync(origen, 'utf8') : undefined;
  mkdirSync(path.dirname(ruta), { recursive: true });
  writeFileSync(ruta, ajustesConFase(anterior, fase, area));
}

function objetoJson(texto: string): Record<string, unknown> {
  return objetoOVacio(JSON.parse(texto) as unknown, 'el fichero');
}

function objetoOVacio(valor: unknown, que: string): Record<string, unknown> {
  if (valor === undefined) return {};
  if (typeof valor !== 'object' || valor === null || Array.isArray(valor)) {
    throw new Error(`${RUTA_AJUSTES_LOCALES}: ${que} debe ser un objeto JSON. Corrígelo a mano y repite.`);
  }
  return valor as Record<string, unknown>;
}
