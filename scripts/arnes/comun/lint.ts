// ESLint con una pista de «cómo arreglarlo» debajo de cada problema.
import { ESLint } from 'eslint';
import { pistaPara } from './pistas-lint.ts';

export const OBJETIVOS_POR_DEFECTO = ['src', 'tests', 'scripts', '.claude/hooks'];

export interface ResultadoLint {
  readonly texto: string;
  readonly hayProblemas: boolean;
}

export async function lintear(raiz: string, objetivos: readonly string[]): Promise<ResultadoLint> {
  const eslint = new ESLint({ cwd: raiz, errorOnUnmatchedPattern: false, warnIgnored: false });
  const resultados = await eslint.lintFiles([...objetivos]);
  const bloques = resultados.flatMap((resultado) =>
    resultado.messages.map((mensaje) => {
      const lugar = `${resultado.filePath}:${String(mensaje.line)}:${String(mensaje.column)}`;
      const regla = mensaje.ruleId ?? 'sintaxis';
      return `${lugar}  [${regla}] ${mensaje.message}\n    → Cómo arreglarlo: ${pistaPara(mensaje.ruleId)}`;
    }),
  );
  return { texto: bloques.join('\n'), hayProblemas: bloques.length > 0 };
}
