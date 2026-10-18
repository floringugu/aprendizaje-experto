import { Given } from '@cucumber/cucumber';
import type { DataTable } from '@cucumber/cucumber';
import type { CategoriaContenido } from '../../../src/aplicacion/contenido.ts';
import { aFase, llegarAFase } from '../soporte/acciones.ts';
import { mundo } from '../soporte/mundo.ts';
import { instanteUtc } from '../soporte/reloj.ts';

// Pasos que montan el dominio de prueba: su contenido, la persona y el reloj.

Given('el dominio de prueba {texto} con los objetivos {ids}, en ese orden', (nombre: string, objetivos: string[]) => {
  mundo().dominio = nombre;
  mundo().contenido().fijarObjetivos(objetivos);
});

Given('el dominio de prueba {texto} con las tareas {ids}, en ese orden', (nombre: string, tareas: string[]) => {
  mundo().dominio = nombre;
  mundo().contenido().fijarTareas(tareas);
});

Given('el dominio de prueba {texto} con estas categorías:', (nombre: string, tabla: DataTable) => {
  mundo().dominio = nombre;
  const categorias = tabla.hashes().map((fila): CategoriaContenido => {
    const grupo = fila['grupo de parecidas'] ?? '';
    return grupo === '' ? { id: fila['categoría'] ?? '' } : { id: fila['categoría'] ?? '', grupo_parecidas: grupo };
  });
  mundo().contenido().fijarCategorias(categorias);
});

Given('que cada objetivo tiene {int} ítems', (cantidad: number) => {
  mundo().contenido().asegurarItemsPorObjetivo(cantidad);
});

Given(
  'que cada objetivo tiene {int} ítems de diagnóstico: {int} de tipo «hecho» y {int} de tipo «problema»',
  (total: number, hechos: number, problemas: number) => {
    if (total !== hechos + problemas) {
      throw new Error(`${String(total)} ítems no son ${String(hechos)} hechos y ${String(problemas)} problemas`);
    }
    const contenido = mundo().contenido();
    contenido.objetivos.forEach((objetivo) => {
      contenido.agregarItems(objetivo.id, hechos, { tipo: 'hecho', diagnostico: true });
      contenido.agregarItems(objetivo.id, problemas, { tipo: 'problema', diagnostico: true });
    });
  },
);

Given('que todos los ítems de tipo «problema» son de categorías intercalables', () => {
  mundo().contenido().asignarCategoriasIntercalables();
});

Given('que el dominio tiene {int} ítems de tipo «problema» en categorías intercalables', (cantidad: number) => {
  mundo().contenido().hacerIntercalables(cantidad);
});

Given('que hoy es {fecha}', (fecha: string) => {
  mundo().reloj.fijar(instanteUtc(fecha, '09:00:00'));
});

// La persona llega a su fase por el camino de verdad (diagnóstico, dominar objetivos…). Se prepara
// en cola porque el contenido y la configuración de los pasos siguientes tienen que estar ya puestos.
function ponerEnFase(textoFase: string): void {
  const actual = mundo();
  const fase = aFase(textoFase);
  actual.preparar(() => {
    llegarAFase(actual, fase);
  });
}

Given('que la persona está en la fase {texto}', ponerEnFase);
Given('que la persona está en la fase {texto} con O1 como objetivo actual', ponerEnFase);
Given('que la persona está en la fase {texto} con O1 sin dominar', ponerEnFase);
