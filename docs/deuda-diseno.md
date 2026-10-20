# Deuda de diseño

Problemas de diseño del código que siguen sin arreglar. Los anota `revisor-codigo` al cerrar cada área de la etapa 4, en la sección «Deuda de diseño» de su informe, y el dueño pega aquí las filas. Por qué se trabaja así está en el §6 de `docs/arnes.md`.

**Cómo se paga** (`docs/plan.md`, etapa 4):

- Al abrir cada área, el dueño elige qué partidas se pagan con ella: al menos una o, si no, una línea que diga por qué ninguna. Como referencia del esfuerzo, Ousterhout propone dedicar a mejorar el diseño en torno al 10-20 % del tiempo.
- Se pagan antes que el área, en un cambio que solo refactoriza, para no mezclar el diseño con el comportamiento nuevo.
- Una partida pagada sale de la tabla; el historial queda en git. Los ids (D1, D2…) no se reutilizan.

**Tamaño:** pequeña (uno o dos ficheros) o grande (varios módulos, o una interfaz que usan otras capas).

## Pendientes

| Id | Anotada en | Señal de alarma | Dónde (fichero:línea) | Problema | Propuesta | Tamaño |
|---|---|---|---|---|---|---|
| D1 | DIAG | Fuga de información | `src/aplicacion/estado.ts:22-31`; escrituras en `respuestas.ts:72,89-90` y `diagnostico.ts:67-76` | `EstadoDominio` expone campos mutables que modifican tres módulos, así que la forma del estado y sus invariantes (fase, dominados, pasos retirados) están repartidas. | Meter las operaciones en el módulo del estado (`registrarIntento`, `cerrarDiagnostico`…) y no dar acceso directo a los campos. | grande |
| D2 | DIAG | Repetición | `src/dominio/correccion.ts:2` y `src/aplicacion/contenido.ts:7`; `src/dominio/diagnostico.ts:26` y `src/aplicacion/dominio.ts:39` | `RespuestaEsperada` es idéntica a `RespuestaContenido`, y `ConclusionDiagnostico` casi igual a `ResultadoDiagnostico`: cada tipo está escrito en dos capas. | Exportar los tipos del dominio y reutilizarlos en la aplicación, que ya depende de él. | grande |
| D3 | DIAG | Fuga de información | `src/aplicacion/practica.ts:19-26` y `src/dominio/diagnostico.ts:129-131` | Qué pasos de un ejemplo se ven está partido: el dominio decide cuántos se retiran y la aplicación cuáles se muestran, con supuestos distintos (el ejemplo más largo frente al primero). | Una sola función del dominio que dé los pasos visibles de un ejemplo. | pequeña |
| D4 | DIAG | Código no obvio | `src/aplicacion/sesiones.ts:57-87`; `respuestas.ts:15-18`; `practica.ts:10-11` | Las peticiones son tipos anónimos dentro de la interfaz, y otros módulos los recuperan con `Parameters<Casos['x']>[0]`; en cambio, `PeticionDominio` y `PeticionObjetivo` tienen nombre. | Dar un nombre exportado a cada petición, como `PeticionDominio`, y quitar los `Parameters<…>`. | grande |
| D5 | DIAG | Fuga de información | `src/aplicacion/puertos.ts:14`; `parametros.ts:4`; `diagnostico.ts:61-62` | El puerto devuelve la forma del fichero (`{ valor: unknown }` por parámetro), y la aplicación tiene que saber leerla y validarla. | Dar al puerto una consulta tipada por parámetro y esconder el formato del fichero en la infraestructura. | grande |
| D6 | DIAG | Caso especial evitable | `src/aplicacion/respuestas.ts:91`; `src/dominio/correccion.ts:6` | `?? ''` trata una lista de respuestas aceptadas vacía, que no debería poder existir, y «la primera es la que se enseña» es un convenio implícito. | Exponer `respuestaMostrada(esperada)` en el dominio, con un tipo de lista no vacía. | pequeña |
| D7 | DIAG | Mezcla de código general y específico | `src/dominio/diagnostico.ts:35,44`; `src/aplicacion/progreso.ts:2` | `objetivosPendientes` (la ruta) e `intercalarPorTurnos` (genérica) viven en el módulo del diagnóstico, y `progreso.ts` las importa de ahí. | Moverlas a módulos propios del dominio. | pequeña |
| D8 | DIAG | Fuga de información | `src/aplicacion/resultado.ts:15-18`; `src/aplicacion/practica.ts:51` | `motivo` es una frase en español escrita en la aplicación, mientras que los avisos de `tareas.ts` son códigos que resuelve el catálogo de textos. | Devolver códigos de motivo y que la interfaz ponga la frase desde el catálogo. | grande |

## Por área

Una línea por área: qué partidas paga o por qué no paga ninguna.

- DIAG: ninguna; la lista empezó después de cerrarla.
