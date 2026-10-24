// .claude/settings.local.json: ajustes de Claude Code de esta máquina, fuera de git.
//
// La fase de la próxima conversación se guarda ahí, en env.ARNES_FASE. Claude Code pasa las
// variables de «env» a los hooks al abrir cada conversación, igual que si se hubiera lanzado
// con «ARNES_FASE=… claude» desde un terminal. Así cada fase se abre desde VS Code.
//
// Con la fase se guardan el modelo y el esfuerzo con que empieza la conversación («model» y
// «effortLevel»), que dependen de ella (MODELO_POR_FASE en fases.ts).
import { MODELO_POR_FASE } from './fases.ts';
import type { Fase } from './protegidas.ts';

export const RUTA_AJUSTES_LOCALES = '.claude/settings.local.json';

/**
 * Texto de los ajustes con env.ARNES_FASE, model y effortLevel cambiados. Conserva todo lo demás:
 * Claude Code también guarda ahí los permisos que el dueño acepta («Allow always»).
 */
export function ajustesConFase(textoAnterior: string | undefined, fase: Fase): string {
  const ajustes = textoAnterior === undefined || textoAnterior.trim() === '' ? {} : objetoJson(textoAnterior);
  const env = objetoOVacio(ajustes['env'], '«env»');
  const { modelo, esfuerzo } = MODELO_POR_FASE[fase];
  const nuevos = { ...ajustes, env: { ...env, ARNES_FASE: fase }, model: modelo, effortLevel: esfuerzo };
  return `${JSON.stringify(nuevos, null, 2)}\n`;
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
