// make abrir N=<carril> [F=<fase> A=<ÁREA>] [FORZAR=1] | make retirar N=<carril> | make rama
// Con ticket (docs/tickets/<carril>.md en origin/main), make abrir saca de él la fase y el área.
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

interface Argumentos {
  readonly fase: string;
  readonly area: string;
  readonly forzar: string;
}

function delDueno(orden: string, nombre: string, { fase, area, forzar }: Argumentos): Resultado {
  const noEsElDueno = motivoSiNoEsElDueno(`make ${orden}`);
  if (noEsElDueno !== undefined) return falla(noEsElDueno);
  if (nombre === '') return falla(`Uso: make ${orden} N=<carril> ...`);
  const principal = carpetaPrincipal(RAIZ);
  if (orden === 'retirar') return retirarWorktree(principal, nombre);
  if (fase !== '' && !esFase(fase)) {
    return falla(
      `Uso: make abrir N=<carril> [F=<fase> A=<ÁREA>] [FORZAR=1], con una de estas fases: ${FASES.join(', ')}.`,
    );
  }
  return abrirWorktree(principal, {
    nombre,
    fase: fase === '' ? undefined : fase,
    area: area === '' ? undefined : area,
    forzar: forzar === '1',
  });
}

function principal(): number {
  const [orden = '', nombre = '', fase = '', area = '', forzar = ''] = process.argv.slice(2);
  const resultado = orden === 'rama' ? pasarALaRamaSiguiente(RAIZ) : delDueno(orden, nombre, { fase, area, forzar });
  for (const mensaje of resultado.mensajes) (resultado.ok ? console.log : console.error)(mensaje);
  return resultado.ok ? 0 : 1;
}

process.exitCode = principal();
