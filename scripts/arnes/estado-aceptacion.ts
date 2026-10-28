// make check-aceptacion (etapa 3): los escenarios del área en curso deben fallar en rojo y los de
// las áreas cerradas, seguir en verde.
//
// En la etapa 3 los steps del área en curso existen pero su aplicación no. Cada escenario debe
// tener todos sus pasos definidos y fallar de verdad: ni pendiente, ni saltado, ni en verde.
// Un escenario en verde sin aplicación indica un Then que no comprueba nada.
// Las áreas cerradas ya tienen aplicación: su regresión sigue en verde. Lo mismo vale para los
// escenarios que un área reabierta no lista en `escenarios_en_rojo` (config/alcance.json).
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { areaDe, escenariosEnRojo, leerAlcance } from './comun/alcance.ts';
import type { Alcance } from './comun/alcance.ts';
import { enRojoSinEscenario, esperadoEnCurso, problemasDeEscenario } from './comun/estado-escenarios.ts';
import { pasosPorEscenario, RUTA_MENSAJES_CUCUMBER } from './comun/estados-cucumber.ts';
import { idDe, leerFeatures } from './comun/gherkin.ts';
import { RAIZ } from './comun/raiz.ts';

function principal(): number {
  const alcance = leerAlcance(RAIZ);
  if (alcance.enCurso === undefined) {
    console.error('La fase aceptacion necesita un área en curso: make fase F=aceptacion A=<ÁREA>.');
    return 1;
  }
  const rutaMensajes = path.join(RAIZ, RUTA_MENSAJES_CUCUMBER);
  rmSync(rutaMensajes, { force: true });
  const cucumber = spawnSync('npx', ['--no-install', 'cucumber-js', '--profile', 'area'], {
    cwd: RAIZ,
    encoding: 'utf8',
  });
  if (!existsSync(rutaMensajes)) {
    console.error(`Cucumber no ha llegado a ejecutar los escenarios:\n${cucumber.stdout}${cucumber.stderr}`);
    return 1;
  }
  const ids = escenariosEnAlcance(alcance, escenariosEnRojo(RAIZ, alcance.enCurso));
  const pasos = pasosPorEscenario(readFileSync(rutaMensajes, 'utf8'), new Set(ids.keys()));
  const problemas = [
    ...enRojoSinEscenario(escenariosEnRojo(RAIZ, alcance.enCurso), new Set(ids.keys())),
    ...[...ids].flatMap(([id, esperado]) => problemasDeEscenario(id, pasos.get(id), esperado)),
  ];
  if (problemas.length === 0) {
    const enRojo = [...ids.values()].filter((esperado) => esperado === 'rojo').length;
    console.log(
      `Los ${String(enRojo)} escenarios en rojo de ${alcance.enCurso} fallan, con todos sus pasos definidos; ` +
        `los ${String(ids.size - enRojo)} que ya estaban implementados siguen en verde.`,
    );
    return 0;
  }
  console.error(`Etapa 3 incompleta:\n${problemas.map((problema) => `  - ${problema}`).join('\n')}`);
  return 1;
}

/** Los escenarios del área en curso (rojo, salvo los ya implementados de un área reabierta) y los de las cerradas (verde). */
function escenariosEnAlcance(alcance: Alcance, enRojo: readonly string[] | undefined): Map<string, 'rojo' | 'verde'> {
  const ids = leerFeatures(RAIZ).elementos.flatMap((elemento) =>
    elemento.tipo === 'Scenario' ? (idDe(elemento) ?? []) : [],
  );
  const esperados = ids.flatMap((id): [string, 'rojo' | 'verde'][] => {
    if (areaDe(id) === alcance.enCurso) return [[id, esperadoEnCurso(id, enRojo)]];
    return alcance.cerradas.includes(areaDe(id)) ? [[id, 'verde']] : [];
  });
  return new Map(esperados);
}

process.exitCode = principal();
