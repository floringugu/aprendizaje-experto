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
| D7 | DIAG | Mezcla de código general y específico | `src/dominio/diagnostico.ts:35,44`; `src/aplicacion/progreso.ts:2` | `objetivosPendientes` (la ruta) e `intercalarPorTurnos` (genérica) viven en el módulo del diagnóstico, y `progreso.ts` las importa de ahí. | Moverlas a módulos propios del dominio. | pequeña |
| D8 | DIAG | Fuga de información | `src/aplicacion/resultado.ts:15-18`; `src/aplicacion/practica.ts:51` | `motivo` es una frase en español escrita en la aplicación, mientras que los avisos de `tareas.ts` son códigos que resuelve el catálogo de textos. | Devolver códigos de motivo y que la interfaz ponga la frase desde el catálogo. | grande |
| D9 | RECU | Fuga de información | `src/aplicacion/respuestas.ts:33-39`; `practica.ts:46-47`; `diagnostico.ts:43,87`; `estado.ts:84-85` | La regla «hasta terminar el diagnóstico no se hace nada más» (DIAG-1.1) la comprueba cada caso de uso por su cuenta, con `diagnosticoPendiente` y su propia frase, y `estado.ts` guarda frases de rechazo que no son conocimiento del estado. | Una sola función que diga si una acción está permitida en la fase actual y, si no, por qué. Va con D1 y D8. | grande |
| D10 | RECU | Fuga de información | `src/dominio/diagnostico.ts:53,59,72,75`; `src/aplicacion/contenido.ts:4,36` | El nombre del campo del fichero (`grupo_parecidas`) y el literal `'problema'` llegan hasta el dominio, y `ItemClasificado.tipo` es un `string` suelto aunque `TipoItem` ya existe. Es una variante de D2. | Que la aplicación traduzca a tipos del dominio: `tipo` con valores fijos y un booleano `intercalable`. | pequeña |
| D11 | RECU | Repetición | `src/aplicacion/diagnostico.ts:32,57`; `practica.ts:34`; `progreso.ts:24` | «Los ítems de un objetivo» (`items.filter((item) => item.objetivo === …)`) está escrito cuatro veces. | Una función `itemsDelObjetivo(items, objetivo)` junto al contenido. | pequeña |
| D12 | RECU | Caso especial evitable | `src/aplicacion/practica.ts:53` | `pasosRetirados.get(…) ?? 0` trata un caso que no se da: la práctica solo se abre con el diagnóstico terminado, y al terminarlo se fijan los pasos retirados de todos los objetivos. | Que el estado ofrezca `pasosRetiradosDe(objetivo)` y esconda el valor por defecto. Va con D1. | pequeña |
| D13 | RECU | Código especulativo | `src/aplicacion/sesiones.ts:15-16,27`; `practica.ts:25,56`; `diagnostico.ts:35` | Ningún código rellena `ItemPresentado.objetivo` ni `categoria`, e `instruccionesAutoexplicacion: []` e `intercalada: false` son fijos: parecen preparados para INTE-3.1 y AYUD-3.1. | Revisarlos al abrir INTE y AYUD, y quitarlos si no hacen falta. | pequeña |
| D14 | RECU | Nombre difícil de elegir | `src/aplicacion/respuestas.ts:86-100`; `sesiones.ts:82-87` | `declararConfianza` corrige, registra el intento y devuelve el feedback, pero ignora `confianza`: ni la valida ni la guarda. Con `responderItem` forma una pareja que no se entiende por separado. Es esperable mientras CALI e INST estén sin implementar. | Al implementar CALI, validar la confianza antes de tocar el estado, guardarla en el intento y revisar el nombre del caso de uso. | grande |
| D15 | RECU | Código no obvio | `src/aplicacion/respuestas.ts:70,77`; `sesiones.ts:81` | `responderItem` devuelve `{ esperandoConfianza: true }`, un valor fijo que no informa de nada, mientras que `elegirHorizonte`, en un caso parecido, devuelve `Resultado<null>`. | Devolver `Resultado<null>` en los dos. Lo usan los steps de aceptación. | grande |
| D16 | RECU | Caso especial evitable | `src/dominio/correccion.ts:19-22`; `src/aplicacion/estado.ts:72` | Lo que queda de D6: un ítem de respuesta escrita sin respuestas aceptadas sigue siendo representable, y el error salta tarde, al dar el feedback. | Validar el contenido al leerlo, con un error que diga qué ítem falla; así `respuestaMostrada` ya no necesita lanzar. | pequeña |
| D17 | RECU | Interfaz superficial | `src/dominio/correccion.ts:6`; `tests/unidad/correccion.test.ts:54-59` | `respuestasAceptadas` es un detalle de `esCorrecta` que solo se exporta para un test, y ese test repite la implementación. | Quitar el `export` y el test; `esCorrecta` ya se prueba con los dos tipos de respuesta. | pequeña |
| D18 | RECU | Fuga de información | `src/aplicacion/presentacion.ts:5`; `sesiones.ts:18` | Las acciones de un ítem son `string` sueltos, así que el valor `'responder'` solo lo comprueba el step de aceptación. | Un tipo `AccionDeItem = 'responder'` en `sesiones.ts` para el campo `acciones`. | pequeña |

## Por área

Una línea por área: qué partidas paga o por qué no paga ninguna.

- DIAG: ninguna; la lista empezó después de cerrarla.
- RECU: D6.
