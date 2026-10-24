# MATE: Material del dominio y borradores

Archivo del área: qué se decidió al implementarla y cómo fue. Se crea en la primera conversación del área copiando esta plantilla a `docs/areas/<ÁREA>.md`, y se completa al cerrarla (docs/plan.md §16, etapa 4).

Si una conversación del área llega al umbral de contexto (docs/plan.md §5, «Relevo»), añade al final de este fichero una sección «## Relevo» con lo que está hecho, lo que falta, el paso siguiente y los ficheros que hay que leer primero. La conversación siguiente la lee y la borra.

## Mecanismo

Solo en las áreas con arquitectura: MATE, PLAN (ts-fsrs) y las que añaden pantallas nuevas. En las demás, escribe «Dominio puro: sin paso de mecanismo».

Cómo funciona por dentro, en prosa: qué datos entran, qué módulo hace qué, qué queda guardado y dónde. Es el texto que el dueño aprobó antes de escribir `src/`.

## Interfaces descartadas y por qué

Las dos interfaces que se compararon («diseñarlo dos veces»): cuál se eligió, cuál se descartó y la razón.

- **Elegida:** …
- **Descartada:** … Motivo: …

## Deuda pagada

Partidas de `docs/deuda-diseno.md` que se pagaron en esta área, con el commit que las cierra. Si no se pagó ninguna, «Ninguna».

## Mutación

Puntuación de `make mutacion` al cerrar el área, y los mutantes supervivientes que se aceptaron con su motivo.

- **Puntuación:** … %
- **Supervivientes aceptados:** …

## Bloqueos del hook Stop

Salida de `make bloqueos A=<ÁREA>` al cerrar el área, y una frase sobre el bloqueo que más costó, si lo hubo.

```text
…
```

## Relevo

**Hecho.** Las etapas 2 y 3 de MATE están commiteadas (`f94f8c8`, `da95ef0`, `bd7972c`, `495f471`, `ca31c89`). Los casos de uso de `src/aplicacion/material.ts` y `src/aplicacion/claude-code.ts` lanzan «Sin implementar», y MATE vuelve a estar fuera de `config/alcance.json`.

**Falta.** Toda la etapa 4 (docs/plan.md §16): meter MATE en alcance, elegir la deuda que se paga, el paso «Mecanismo» y el código.

**Paso siguiente.** El paso 1 de la etapa 4: la propuesta que saca MATE de `areas_fuera_de_alcance` y las partidas de `docs/deuda-diseno.md` que se proponen pagar.

**Leer primero:**

- `features/material.feature`;
- `src/aplicacion/material.ts`, `src/aplicacion/claude-code.ts` y `src/aplicacion/puertos.ts`;
- `tests/aceptacion/soporte/externos.ts`, `tests/aceptacion/soporte/claude-code.ts` y `tests/aceptacion/soporte/escenario-material.ts`.

**Lo que fijan los steps** (y el mecanismo debe respetar):

- Las marcas y las causas de rechazo son códigos en snake_case: `sin_fuente`, `cita_no_encontrada`, `falta_libreoffice`, `tipo_no_admitido`. Una corrección rechazada dice qué falta en `campo`.
- En el borrador, los ejemplos resueltos de objetivos ya aprobados van en una lista aparte, `ejemplos_resueltos`, en la raíz y con `objetivo`. Los de objetivos nuevos van dentro de su objetivo.
- El puerto `ClaudeCode.iniciarSesion(alRecibir)` devuelve `{ enviar, cortar }` y emite los eventos `salida`, `pide_codigo` y `terminado`. El corte de los 5 minutos usa el puerto `Temporizador` (MATE-8.3). Ajustes solo devuelve `{ sesionClaudeCode }` (MATE-8.5).
- «Ver fuente» es un único caso de uso, `verFuente`, para el borrador y para lo aprobado. En una URL, el `lugar` de la fuente es `'página web'`, y la hoja sale de la copia guardada al añadirla (MATE-1.5).
- La extracción del texto es síncrona; la web, la IA y el inicio de sesión son asíncronos.

**Hallazgos:**

- **pdftotext y MATE-3.4.** En su modo por defecto, y también con `-nodiag`, junta «tam-»/«bién» en «también». Con `-raw` y con `-layout` el guion se queda. El escenario espera la palabra entera.
- **Todos los escenarios de MATE fallan en los antecedentes**, porque `anadirMaterial` lanza «Sin implementar». Los pasos de detrás no se han ejecutado nunca: algún fallo dentro de un paso puede salir al implementar.
- **MATE-6.3** depende de `pedirTarea`. Las sesiones de repaso y de retención (MATE-6.1) aún no están implementadas en ningún área.

**Decisiones sin registrar.** Aprobadas en la etapa 3 y aún no escritas en docs/plan.md §0 ni §17.8; van en «Mecanismo»:

- el texto de un HTML se saca con código propio, sin dependencia;
- el formato del borrador descrito arriba.
