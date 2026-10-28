// make abrir N=<carril> F=<fase> A=<ÁREA> | make retirar N=<carril> | make rama
// abrir y retirar solo los ejecuta el dueño, y actúan sobre los carriles de la carpeta principal desde
// cualquier checkout. rama la ejecuta la conversación de un carril, en su carril, cuando GitHub ha
// fusionado el PR de su rama (docs/plan.md §6). La lógica está en comun/worktrees.ts.
import { carpetaPrincipal } from './comun/checkout.ts';
import { esFase, FASES } from './comun/fases.ts';
import { RAIZ } from './comun/raiz.ts';
import { motivoSiNoEsElDueno } from './comun/solo-dueno.ts';
import { abrirWorktree, pasarALaRamaSiguiente, retirarWorktree } from './comun/worktrees.ts';
import type { Resultado } from './comun/worktrees.ts';

function falla(mensaje: string): Resultado {
  return { ok: false, mensajes: [mensaje] };
}

function delDueno(orden: string, nombre: string, { fase, area }: { fase: string; area: string }): Resultado {
  const noEsElDueno = motivoSiNoEsElDueno(`make ${orden}`);
  if (noEsElDueno !== undefined) return falla(noEsElDueno);
  if (nombre === '') return falla(`Uso: make ${orden} N=<carril> ...`);
  const principal = carpetaPrincipal(RAIZ);
  if (orden === 'retirar') return retirarWorktree(principal, nombre);
  if (!esFase(fase)) {
    return falla(`Uso: make abrir N=<carril> F=<fase> A=<ÁREA>, con una de estas fases: ${FASES.join(', ')}.`);
  }
  return abrirWorktree(principal, { nombre, fase, area: area === '' ? undefined : area });
}

function principal(): number {
  const [orden = '', nombre = '', fase = '', area = ''] = process.argv.slice(2);
  const resultado = orden === 'rama' ? pasarALaRamaSiguiente(RAIZ) : delDueno(orden, nombre, { fase, area });
  for (const mensaje of resultado.mensajes) (resultado.ok ? console.log : console.error)(mensaje);
  return resultado.ok ? 0 : 1;
}

process.exitCode = principal();
