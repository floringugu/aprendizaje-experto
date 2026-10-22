// make check, paso «cobertura-ids»: lista cada @ID de features/, dónde se cita y si pasa.
//
// Falla si:
//   - un Feature, Rule o Scenario no tiene un ID válido o no dice su procedencia;
//   - un paso Entonces usa una frase vaga («correctamente», «funciona»…; comun/frases-vagas.ts);
//   - config/parametros.json tiene un parámetro sin sección, nivel de evidencia o marca de extrapolación;
//   - un escenario en alcance no pasa en Cucumber o nadie lo cita en src/ ni en tests/unidad/;
//   - el código o los tests citan un ID que no existe en features/.
//
// Con --solo-specs solo valida features/ y los parámetros (etapas 2 y 3: aún no hay código).
// Lee el resultado de Cucumber de reports/cucumber.ndjson: ejecútalo después de «make aceptacion».
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { leerAreasFueraDeAlcance } from './comun/alcance.ts';
import { buscarCitas } from './comun/citas.ts';
import { construirInforme, formatearInforme } from './comun/cobertura.ts';
import { estadosPorEscenario, RUTA_MENSAJES_CUCUMBER } from './comun/estados-cucumber.ts';
import { leerFrasesVagas } from './comun/frases-vagas.ts';
import { idDe, leerFeatures, validarElementos } from './comun/gherkin.ts';
import type { LecturaFeatures } from './comun/gherkin.ts';
import { leerSeccionesDelInforme } from './comun/informe.ts';
import { leerParametros, validarParametros } from './comun/parametros.ts';
import { RAIZ } from './comun/raiz.ts';

function principal(): number {
  const lectura = leerFeatures(RAIZ);
  const problemasSpecs = problemasDeEspecificacion(lectura);
  if (problemasSpecs.length > 0) {
    console.error(`Las especificaciones tienen problemas:\n${problemasSpecs.map((p) => `  - ${p}`).join('\n')}`);
    return 1;
  }
  if (process.argv.includes('--solo-specs')) {
    const escenarios = lectura.elementos.filter((elemento) => elemento.tipo === 'Scenario').length;
    console.log(
      `Especificaciones válidas: ${String(escenarios)} escenarios con ID y procedencia; parámetros completos.`,
    );
    return 0;
  }
  return informarCobertura(lectura);
}

function problemasDeEspecificacion(lectura: LecturaFeatures): string[] {
  const secciones = leerSeccionesDelInforme(RAIZ);
  const problemasFeatures = [
    ...lectura.problemas,
    ...validarElementos(lectura.elementos, secciones),
    ...leerFrasesVagas(RAIZ),
  ].map((problema) => `${problema.fichero}:${String(problema.linea)} ${problema.mensaje}`);
  return [...problemasFeatures, ...validarParametros(leerParametros(RAIZ), secciones)];
}

function informarCobertura(lectura: LecturaFeatures): number {
  const idsDeEscenario = new Set(
    lectura.elementos.flatMap((elemento) => (elemento.tipo === 'Scenario' ? (idDe(elemento) ?? []) : [])),
  );
  const rutaMensajes = path.join(RAIZ, RUTA_MENSAJES_CUCUMBER);
  const ndjson = existsSync(rutaMensajes) ? readFileSync(rutaMensajes, 'utf8') : '';
  const informe = construirInforme({
    elementos: lectura.elementos,
    citas: buscarCitas(RAIZ),
    estados: estadosPorEscenario(ndjson, idsDeEscenario),
    areasFueraDeAlcance: leerAreasFueraDeAlcance(RAIZ),
  });
  console.log(informe.filas.length === 0 ? 'Aún no hay features con ID.' : formatearInforme(informe));
  if (informe.errores.length === 0) return 0;
  console.error(`\nCobertura de IDs incompleta:\n${informe.errores.map((error) => `  - ${error}`).join('\n')}`);
  return 1;
}

process.exitCode = principal();
