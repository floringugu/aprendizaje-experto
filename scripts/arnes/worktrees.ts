// make abrir N=<nombre> F=<fase> [A=<ÁREA>] | make integrar N=<nombre> | make retirar N=<nombre>
// Solo los ejecuta el dueño, desde el directorio principal (docs/plan.md §6). La lógica está en
// comun/worktrees.ts.
import { spawnSync } from 'node:child_process';
import { esFase, FASES } from './comun/fases.ts';
import { RAIZ } from './comun/raiz.ts';
import { motivoSiNoEsElDueno } from './comun/solo-dueno.ts';
import { abrirWorktree, integrarWorktree, retirarWorktree } from './comun/worktrees.ts';
import type { Resultado } from './comun/worktrees.ts';

function abrirEditor(directorio: string): void {
  const code = spawnSync('code', ['-n', directorio], { stdio: 'ignore' });
  if (code.status !== 0) console.error(`No he podido abrir VS Code: ábrelo con «code -n ${directorio}».`);
}

function comprobar(directorio: string): boolean {
  return spawnSync('make', ['-C', directorio, 'check'], { stdio: 'inherit' }).status === 0;
}

function ejecutar(
  orden: string,
  nombre: string,
  { fase, area }: { fase: string; area: string | undefined },
): Resultado {
  if (orden === 'integrar') return integrarWorktree(RAIZ, nombre, comprobar);
  if (orden === 'retirar') return retirarWorktree(RAIZ, nombre);
  if (!esFase(fase))
    return {
      ok: false,
      mensajes: [`Uso: make abrir N=<nombre> F=<fase> [A=<ÁREA>], con una de estas fases: ${FASES.join(', ')}.`],
    };
  return abrirWorktree(RAIZ, { nombre, fase, area }, abrirEditor);
}

function principal(): number {
  const [orden = '', nombre = '', fase = '', area] = process.argv.slice(2);
  const noEsElDueno = motivoSiNoEsElDueno(`make ${orden}`);
  if (noEsElDueno !== undefined) {
    console.error(noEsElDueno);
    return 1;
  }
  if (nombre === '') {
    console.error(`Uso: make ${orden} N=<nombre> ...`);
    return 1;
  }
  const resultado = ejecutar(orden, nombre, { fase, area: area === '' ? undefined : area });
  for (const mensaje of resultado.mensajes) (resultado.ok ? console.log : console.error)(mensaje);
  return resultado.ok ? 0 : 1;
}

process.exitCode = principal();
