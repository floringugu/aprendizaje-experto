// make check-aceptacion (etapa 3): todos los escenarios en alcance deben fallar en rojo.
//
// En la etapa 3 los steps existen pero la aplicación no. Cada escenario debe tener todos
// sus pasos definidos y fallar de verdad: ni pendiente, ni saltado, ni en verde.
// Un escenario en verde sin aplicación indica un Then que no comprueba nada.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { areaDe, leerAreasFueraDeAlcance } from './comun/alcance.ts';
import { pasosPorEscenario, RUTA_MENSAJES_CUCUMBER } from './comun/estados-cucumber.ts';
import { idDe, leerFeatures } from './comun/gherkin.ts';
import { RAIZ } from './comun/raiz.ts';

const PROBLEMAS_POR_ESTADO: Readonly<Record<string, string>> = {
  UNDEFINED: 'tiene pasos sin definir',
  AMBIGUOUS: 'tiene pasos que encajan con varias definiciones',
  PENDING: 'tiene pasos pendientes',
};

function principal(): number {
  const rutaMensajes = path.join(RAIZ, RUTA_MENSAJES_CUCUMBER);
  rmSync(rutaMensajes, { force: true });
  const cucumber = spawnSync('npx', ['--no-install', 'cucumber-js'], { cwd: RAIZ, encoding: 'utf8' });
  if (!existsSync(rutaMensajes)) {
    console.error(`Cucumber no ha llegado a ejecutar los escenarios:\n${cucumber.stdout}${cucumber.stderr}`);
    return 1;
  }
  const idsEnAlcance = escenariosEnAlcance();
  const pasos = pasosPorEscenario(readFileSync(rutaMensajes, 'utf8'), idsEnAlcance);
  const problemas = [...idsEnAlcance].flatMap((id) => problemasDeEscenario(id, pasos.get(id)));
  if (problemas.length === 0) {
    console.log(
      `Los ${String(idsEnAlcance.size)} escenarios en alcance fallan en rojo, con todos sus pasos definidos.`,
    );
    return 0;
  }
  console.error(`Etapa 3 incompleta:\n${problemas.map((problema) => `  - ${problema}`).join('\n')}`);
  return 1;
}

function escenariosEnAlcance(): Set<string> {
  const fuera = leerAreasFueraDeAlcance(RAIZ);
  const ids = leerFeatures(RAIZ).elementos.flatMap((elemento) =>
    elemento.tipo === 'Scenario' ? (idDe(elemento) ?? []) : [],
  );
  return new Set(ids.filter((id) => !fuera.includes(areaDe(id))));
}

function problemasDeEscenario(id: string, pasos: readonly string[] | undefined): string[] {
  if (pasos === undefined) return [`@${id} no se ha ejecutado.`];
  const problemas = Object.entries(PROBLEMAS_POR_ESTADO)
    .filter(([estado]) => pasos.includes(estado))
    .map(([, problema]) => `@${id} ${problema}.`);
  if (!pasos.includes('FAILED')) {
    problemas.push(`@${id} no falla: algún Then debe comprobar un estado observable que la aplicación aún no produce.`);
  }
  return problemas;
}

process.exitCode = principal();
