// Hook PostToolUse (Edit, Write, MultiEdit): formatea con Prettier el fichero editado y lo
// pasa por ESLint. Si ESLint encuentra problemas, se los devuelve a Claude para que los arregle.
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import * as prettier from 'prettier';
import { campo, campoTexto, ejecutarHook, leerEntradaHook, responder } from '../../scripts/arnes/comun/entrada-hook.ts';
import { lintear } from '../../scripts/arnes/comun/lint.ts';
import { RAIZ } from '../../scripts/arnes/comun/raiz.ts';

const EXTENSIONES_CON_LINT = ['.ts', '.js'];

async function formatear(rutaAbsoluta: string): Promise<void> {
  const info = await prettier.getFileInfo(rutaAbsoluta, { ignorePath: path.join(RAIZ, '.prettierignore') });
  if (info.ignored || info.inferredParser === null) return;
  const original = await readFile(rutaAbsoluta, 'utf8');
  const opciones = (await prettier.resolveConfig(rutaAbsoluta)) ?? {};
  const formateado = await prettier.format(original, { ...opciones, filepath: rutaAbsoluta });
  if (formateado !== original) await writeFile(rutaAbsoluta, formateado);
}

ejecutarHook('formatear-y-lintear', async () => {
  const entrada = await leerEntradaHook();
  const ruta = campoTexto(campo(entrada, 'tool_input'), 'file_path');
  if (ruta === undefined) return;
  const absoluta = path.resolve(RAIZ, ruta);
  const relativa = path.relative(RAIZ, absoluta);
  if (relativa.startsWith('..') || path.isAbsolute(relativa)) return;
  await formatear(absoluta);
  if (!EXTENSIONES_CON_LINT.includes(path.extname(absoluta))) return;
  const resultado = await lintear(RAIZ, [absoluta]);
  if (!resultado.hayProblemas) return;
  responder({ decision: 'block', reason: `ESLint ha encontrado problemas en ${relativa}:\n${resultado.texto}` });
});
