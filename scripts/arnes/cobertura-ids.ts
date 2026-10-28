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
// «En alcance» son las áreas cerradas; con --con-area-en-curso, también el área en curso del
// checkout, que es lo que exige make cerrar-area.
// Lee el resultado de Cucumber de reports/cucumber.ndjson: ejecútalo después de «npm run aceptacion»
// (o de «npm run aceptacion-area», con --con-area-en-curso).
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { areaDe, areasEnAlcance, leerAlcance } from './comun/alcance.ts';
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
  return informarCobertura(lectura, process.argv.includes('--con-area-en-curso'));
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

function informarCobertura(lectura: LecturaFeatures, conAreaEnCurso: boolean): number {
  const idsDeEscenario = new Set(
    lectura.elementos.flatMap((elemento) => (elemento.tipo === 'Scenario' ? (idDe(elemento) ?? []) : [])),
  );
  const alcance = leerAlcance(RAIZ);
  const sinArea = conAreaEnCurso ? problemaDelAreaEnCurso(alcance.enCurso, idsDeEscenario) : undefined;
  if (sinArea !== undefined) {
    console.error(sinArea);
    return 1;
  }
  const rutaMensajes = path.join(RAIZ, RUTA_MENSAJES_CUCUMBER);
  const ndjson = existsSync(rutaMensajes) ? readFileSync(rutaMensajes, 'utf8') : '';
  const informe = construirInforme({
    elementos: lectura.elementos,
    citas: buscarCitas(RAIZ),
    estados: estadosPorEscenario(ndjson, idsDeEscenario),
    areasEnAlcance: areasEnAlcance(alcance, conAreaEnCurso),
  });
  console.log(informe.filas.length === 0 ? 'Aún no hay features con ID.' : formatearInforme(informe));
  if (informe.errores.length === 0) return 0;
  console.error(`\nCobertura de IDs incompleta:\n${informe.errores.map((error) => `  - ${error}`).join('\n')}`);
  return 1;
}

/** make cerrar-area exige un área en curso con escenarios: sin ellos, el verde no comprobaría nada. */
function problemaDelAreaEnCurso(area: string | undefined, idsDeEscenario: ReadonlySet<string>): string | undefined {
  if (area === undefined) return 'Este checkout no tiene área en curso: usa make cerrar-area A=<ÁREA>.';
  if (![...idsDeEscenario].some((id) => areaDe(id) === area))
    return `El área ${area} no tiene escenarios en features/.`;
  return undefined;
}

process.exitCode = principal();
