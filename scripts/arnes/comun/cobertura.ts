// Informe de cobertura de IDs: cada @ID de features/, dónde se cita y si pasa.
import { areaDe } from './alcance.ts';
import type { Cita } from './citas.ts';
import { peorEstado } from './estados-cucumber.ts';
import type { Estado } from './estados-cucumber.ts';
import { idDe, procedenciaDe } from './gherkin.ts';
import type { ElementoGherkin, TipoElemento } from './gherkin.ts';

interface FilaCobertura {
  readonly id: string;
  readonly tipo: TipoElemento;
  readonly procedencia: string;
  readonly citas: readonly Cita[];
  readonly estado: string;
}

export interface InformeCobertura {
  readonly filas: readonly FilaCobertura[];
  readonly errores: readonly string[];
}

export interface DatosCobertura {
  readonly elementos: readonly ElementoGherkin[];
  readonly citas: readonly Cita[];
  readonly estados: ReadonlyMap<string, Estado>;
  readonly areasFueraDeAlcance: readonly string[];
}

const FUERA_DE_ALCANCE = 'FUERA_DE_ALCANCE';

interface ElementoConId {
  readonly elemento: ElementoGherkin;
  readonly id: string;
}

export function construirInforme(datos: DatosCobertura): InformeCobertura {
  const conId = datos.elementos.flatMap((elemento): ElementoConId[] => {
    const id = idDe(elemento);
    return id === undefined ? [] : [{ elemento, id }];
  });
  const filas = conId.map((actual) => ({
    id: actual.id,
    tipo: actual.elemento.tipo,
    procedencia: procedenciaDe(actual.elemento),
    citas: datos.citas.filter((cita) => cita.id === actual.id),
    estado: estadoDeFila(actual, conId, datos),
  }));
  const idsConocidos = new Set(conId.map(({ id }) => id));
  return { filas, errores: [...erroresDeCitas(datos.citas, idsConocidos), ...filas.flatMap(erroresDeEscenario)] };
}

function estadoDeFila(actual: ElementoConId, conId: readonly ElementoConId[], datos: DatosCobertura): string {
  const { id } = actual;
  const tipo = actual.elemento.tipo;
  if (datos.areasFueraDeAlcance.includes(areaDe(id))) return FUERA_DE_ALCANCE;
  if (tipo === 'Scenario') return datos.estados.get(id) ?? 'NO_EJECUTADO';
  // Un Feature o una Rule agregan el peor estado de sus escenarios.
  const prefijo = tipo === 'Feature' ? `${id}-` : `${id}.`;
  const escenarios = conId.filter(({ elemento, id: otro }) => elemento.tipo === 'Scenario' && otro.startsWith(prefijo));
  if (escenarios.length === 0) return 'SIN_ESCENARIOS';
  return peorEstado(escenarios.map(({ id: otro }) => datos.estados.get(otro) ?? 'UNKNOWN'));
}

function erroresDeCitas(citas: readonly Cita[], idsConocidos: ReadonlySet<string>): string[] {
  return citas
    .filter((cita) => !idsConocidos.has(cita.id))
    .map((cita) => `${cita.fichero}:${String(cita.linea)} cita @${cita.id}, que no existe en features/.`);
}

function erroresDeEscenario(fila: FilaCobertura): string[] {
  if (fila.tipo !== 'Scenario' || fila.estado === FUERA_DE_ALCANCE) return [];
  const errores: string[] = [];
  if (fila.estado !== 'PASSED') errores.push(`@${fila.id} no pasa (estado: ${fila.estado}).`);
  if (!fila.citas.some((cita) => cita.zona === 'codigo' || cita.zona === 'unidad')) {
    errores.push(`@${fila.id} no tiene implementación: nadie lo cita en src/ ni en tests/unidad/.`);
  }
  return errores;
}

export function formatearInforme(informe: InformeCobertura): string {
  const cabecera = ['ID', 'TIPO', 'PROCEDENCIA', 'ESTADO', 'CITAS'];
  const filas = informe.filas.map((fila) => [
    fila.id,
    fila.tipo,
    fila.procedencia,
    fila.estado,
    describirCitas(fila.citas),
  ]);
  const anchos = cabecera.map((titulo, columna) =>
    Math.max(titulo.length, ...filas.map((fila) => (fila[columna] ?? '').length)),
  );
  const linea = (celdas: readonly string[]): string =>
    celdas
      .map((celda, columna) => celda.padEnd(anchos[columna] ?? 0))
      .join('  ')
      .trimEnd();
  return [linea(cabecera), ...filas.map(linea)].join('\n');
}

function describirCitas(citas: readonly Cita[]): string {
  if (citas.length === 0) return '—';
  return citas.map((cita) => `${cita.fichero}:${String(cita.linea)}`).join(', ');
}
