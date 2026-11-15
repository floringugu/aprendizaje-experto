# RECU: Práctica de recuperación con feedback correctivo

## Mecanismo

Dominio puro: sin paso de mecanismo. RECU no añade ninguna pantalla, porque `src/interfaz` aún no existe (§17.8, punto 2, sin decidir).

## Interfaces descartadas y por qué

`respuestaMostrada` (D6) no es un fichero nuevo, pero se comparó con otra forma:

- **Elegida:** `respuestaMostrada(esperada): string` en `src/dominio/correccion.ts`, junto a `esCorrecta`. La aplicación compone el feedback con las dos y con el `feedback` del ítem.
- **Descartada:** `corregir(respuesta, esperada): { correcta, respuestaCorrecta }`, una sola llamada que corrige y dice qué se enseña. Motivo: junta la corrección (DIAG-1.2, RECU-3) con lo que ve la persona (RECU-2.1), y un cambio en cómo se elige la respuesta que se enseña tocaría la función que corrige el diagnóstico.
- **Descartada:** el tipo de lista no vacía para `aceptadas` que proponía D6. Motivo: el tipo del contenido llega hasta el soporte de aceptación (`tests/aceptacion/`, protegido), que construye `aceptadas` como `string[]`. En su lugar, un ítem sin respuestas aceptadas da un error claro, como `parametroNumerico` con un parámetro que falta. `declararConfianza` lo calcula antes de tocar el estado, para que el error no deje un intento registrado a medias.

## Deuda pagada

- D6 (643ec19): `respuestaMostrada` en el dominio y fuera el `?? ''` de `respuestas.ts`.

## Mutación

- **Puntuación:** 97,48 % (116 mutantes eliminados, 3 supervivientes). Antes del cierre era 96,64 %: el test «@RECU-3.1 reduce los espacios a uno, pero no los quita» mató el mutante que cambiaba `replace(/\s+/g, ' ')` por `replace(/\s+/g, '')`.
- **Supervivientes aceptados**, los tres equivalentes:
  - `correccion.ts:32`, `toLowerCase()` por `toUpperCase()`: los dos lados de la comparación se normalizan igual, así que corrige lo mismo. Solo cambiaría con letras como «ß», cuya mayúscula es «SS», que el contenido no usa.
  - `acierto.ts:34`, `acierto !== undefined && …` por `true && …`: `undefined >= umbral` ya es `false`. La comprobación está para TypeScript. Es de DIAG.
  - `diagnostico.ts:75`, `item.categoria !== undefined && …` por `true && …`: `intercalables.has(undefined)` ya es `false`. También está para TypeScript y es de DIAG.

## Bloqueos del hook Stop

```text
RECU: 5 paradas del hook Stop en 2 conversaciones, desde 2026-10-22T23:07:13.581Z.
  - Bloqueos: 1 (cobertura-ids 1).
  - Por el entorno: 0.
  - Con el freno (3.º bloqueo seguido o más): 0.
  - Paradas con [DECISIÓN PENDIENTE]: 4.
```

El único bloqueo fue de `cobertura-ids`: los cinco escenarios ya pasaban con el código de DIAG, pero nadie citaba sus IDs.

## Ítem numérico (RECU-5, ticket `recu-impl-item-numerico`, 15-11-2026)

Mini área con RECU ya cerrada. Dominio puro: sin paso de mecanismo.

### Interfaces descartadas y por qué

- **Elegida:** `leerNumero(texto): { valor, resto } | undefined` en `src/dominio/numero-escrito.ts`, aparte de `normalizar`, y `falloNumerico(respuesta, esperada, toleranciaPorDefecto): FalloNumerico | undefined` en `correccion.ts`, que corrige el valor y la unidad por separado y devuelve lo que el feedback pone tal cual. El contenido tiene un solo tipo de ítem con tres respuestas posibles (`RespuestaContenido`).
- **Descartada:** dos tipos de ítem (`ItemContenido` como unión de ítem de texto e ítem numérico). Motivo: al descartar el ítem numérico, TypeScript no estrechaba `item.respuesta`, y el soporte de aceptación (protegido) dejaba de compilar. El diff está en `reports/descartado-union-de-items.diff` del carril; el soporte pregunta ahora por la respuesta (117796f).
- **Descartada:** leer el número dentro de `normalizar`. Motivo: `formato-contenido.ts` usa `normalizar` para decidir si dos opciones son la misma.

### Mutación

- **Puntuación** (`npx stryker run --force`): 97,97 % en total (2202 eliminados, 19 por tiempo, 41 supervivientes, 5 sin cobertura). `correccion.ts` y `numero-escrito.ts`, 100 %; `formato-contenido.ts`, 98,79 % (3 supervivientes y 1 sin cobertura).
- `respuestas.ts` y `presentacion.ts` no entran en la mutación: `corregir` lo cubren los escenarios RECU-2.2 y RECU-5.x, y `presentar`, además, `tests/unidad/presentacion.test.ts`.

### Deuda

- Anotada: D30 a D34, y D2 agravada (`docs/deuda-diseno.md`). Pagado en el mismo PR: `sinEspacios` vive solo en `numero-escrito.ts`.
- Fallo encontrado por la revisión, a un ticket specs (`specs-unidad-que-se-lee`): una unidad que empieza por dígito, coma o punto («1/s») pasa la validación y nadie puede acertar el ítem.

### Pendiente del área

Cuando se cerró esta mini área, `make cerrar-area A=RECU` fallaba solo en los escenarios RECU-6.1 a 6.10, del ticket `recu-reintentos`. Lo que queda de ellos está en «Reaprendizaje sucesivo», más abajo.

## Reaprendizaje sucesivo (RECU-6, ticket `recu-reintentos`, 15-11-2026)

Mini área con RECU ya cerrada. Sin pantalla: `src/interfaz` aún no existe.

### Cómo funciona

- **La cola, en el dominio** (`src/dominio/reintentos.ts`): `colaInicial` y `colaTrasResponder` dicen qué queda por presentar de la sesión y qué ítems vuelven. Un ítem fallado en una sesión que enseña vuelve detrás de `separacion` ítems, o al final si no quedan tantos, hasta acertar `aciertosParaCerrar` reintentos, seguidos o no. No lee la configuración ni el estado.
- **La sesión en curso, en `EstadoDominio`** (`sesionEnCurso` y `cambiarSesion` de `estado.ts`): `iniciarSesion` la sustituye con la sesión que acepta, cada intento que cuenta la hace avanzar y `terminarSesion` la olvida. Lo que quedaba por volver no pasa a la siguiente (@RECU-6.7). Mientras el diagnóstico está pendiente, `consultarSesion` da lo que queda de él (`loQueQuedaDelDiagnostico`), calculado con lo registrado.
- **La clase, por el contexto registrado** (`CLASE_POR_CONTEXTO` en `src/aplicacion/sesion-en-curso.ts`): `reintento`; `ensena` para la práctica, el repaso y la mezcla; `mide` para el diagnóstico, la retención y la transferencia; y nada para la exploración, las prepreguntas y los experimentos, que no cambian la cola.
- **El reintento se corrige en `responderItem`**, sin pedir confianza: el intento se registra sin ella (`confianza?` en `IntentoNuevo` y vacía en el CSV) y el feedback sale con la respuesta (`RespuestaRecogida`). `corregirYRegistrar` es lo común con `declararConfianza`, y calcula la sesión que queda antes de tocar el estado, para que un parámetro que falte no deje el intento registrado a medias.

### Interfaces descartadas y por qué

- **Descartada:** rechazar el reintento de un ítem al que no le toca volver. Motivo: `reintentar` de `tests/aceptacion/soporte/acciones.ts:77-89`, que usan MAST-1.8 y 4.2 y PLAN-1.5, 2.3 y 3.4, responde con el contexto `reintento` sin sesión. Ese intento se registra y no cambia la sesión.
- **Descartada:** guardar el diagnóstico como sesión en curso. Motivo: obligaría a leer los parámetros del reintento en el diagnóstico, y el entorno de `tests/unidad/ver-fuente.test.ts:63` solo da `umbral_dominio`. Lo que queda del diagnóstico se calcula con lo registrado.
- **Descartada:** decidir si un ítem vuelve por el tipo de sesión. Motivo: el reservado de una mezcla (registrado como `transferencia`) y la exploración y las prepreguntas dentro de una práctica no deben volver, y el tipo de la sesión no los distingue.

### Mutación

- **Puntuación** (`npx stryker run --force`): 97,74 % en total (2153 eliminados, 13 por tiempo, 45 supervivientes, 5 sin cobertura). `reintentos.ts`, 100 % (52 eliminados); `sesion-en-curso.ts`, 96,20 % (76 eliminados, 3 supervivientes).
- **Supervivientes aceptados**, los tres equivalentes: `sesion-en-curso.ts:31-33`, `'mide'` por `""` en `diagnostico`, `retencion` y `transferencia`. `colaTrasResponder` solo distingue `reintento` y `ensena`, así que cualquier otra clase cuenta como `mide`.
- `respuestas.ts`, `estado.ts`, `practica.ts`, `diagnostico.ts`, `csv.ts` y `aplicacion.ts` no entran en la mutación: los cubren los escenarios de RECU-6 y, la sesión en curso, `tests/unidad/sesion-en-curso.test.ts`.

### Deuda

- No paga ninguna: es comportamiento nuevo con el área cerrada.
- Anotada (`docs/deuda-diseno.md`): D36 (qué hace cada contexto, repartido en tres sitios), D37 (lo que queda por presentar, en dos representaciones) y D38 (el rechazo sin sesión en curso). D9, D14 y D21 crecen con copias nuevas, y D15 queda para revisar si se retira, porque `responderItem` ya devuelve un valor que informa.
- Arreglado en el mismo PR, tras la revisión: `ElementoSesion` se declara una sola vez, en `sesiones.ts`; `RespuestaACorregir` extiende `RespuestaPendiente`; fuera una rama muerta de `loQueQuedaDelDiagnostico`; y el comentario de `consultarSesion` ya no dice que una sesión sin elementos ha terminado, porque los ejemplos siguen ahí.

### Pendiente del área

- RECU-6.4, 6.7 y 6.10 siguen en `escenarios_en_rojo.RECU`: tres pasos de `tests/aceptacion/pasos/reintentos.ts` no reciben el `{item}` que declaran, y Cucumber los rechaza antes de llegar a la aplicación. El arreglo es de la fase aceptacion: ticket `recu-pasos-reintentos-aridad`. Con el arreglo, en una copia fuera del repositorio, pasan los 20 escenarios de RECU-6.
- `make cerrar-area A=RECU` falla solo en esos tres escenarios (4 ejemplos de 246), por la aridad de los pasos. RECU-6 se hizo de noche en `lote/1`, que no tenía el ítem numérico; el carril `traer-lote-recu` lo trajo a `main` el 15-11-2026 con cherry-pick. En la unión, `corregirYRegistrar` corrige con `corregir`: un reintento de un ítem numérico usa el margen y su feedback dice qué parte falla (`tests/unidad/reintento-numerico.test.ts`).
- Los ejemplos de la sesión siguen delante en `consultarSesion` hasta que la persona pueda estudiarlos (`estudiarEjemplo`, AYUD).
