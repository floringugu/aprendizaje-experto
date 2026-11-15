---
fase: aceptacion
area: CALI
depende: []
toca: [tests/aceptacion/pasos/calibracion.ts, tests/aceptacion/pasos/calibracion-siluetas.ts, tests/aceptacion/pasos/calibracion-tarjetas.ts, tests/aceptacion/pasos/experimento*.ts, tests/aceptacion/pasos/configuracion.ts, tests/aceptacion/soporte/calibracion.ts, tests/aceptacion/soporte/experimento.ts, src/aplicacion/bucle.ts, src/aplicacion/experimento.ts, src/aplicacion/aplicacion.ts, config/alcance.json]
estado: abierto
---
# Pasos de las siluetas, las tarjetas y el experimento de releer en CALI

**Qué:** los pasos de los 73 escenarios de CALI que hoy no tienen todos los suyos: CALI-1.4 y 3.2, 4.1 a 4.10 (las siluetas), 5.1 a 5.10 y 6.1 a 6.4 (las tarjetas de la prueba de retención y la pantalla única de cada bucle) y 7.1 a 13.5 (el experimento de releer frente a recuperar). Son 202 pasos distintos. Va en un solo ticket porque `make check-aceptacion` no admite un escenario del área en curso con pasos sin definir: un ticket con parte de CALI no podría hacer push. Los pasos van en ficheros por regla y el soporte nuevo, en `tests/aceptacion/soporte/calibracion.ts` y `experimento.ts`, no en `contenido.ts`, `acciones.ts` ni `mundo.ts`. Las firmas nuevas de `src/` entran sin cuerpo: lo que el bucle devuelve de la calibración (`ResultadoBucle`, en `src/aplicacion/bucle.ts`) y los casos de uso del experimento, enchufados con `sinImplementar` en `src/aplicacion/aplicacion.ts`. CALI-1.1, 1.3 y 3.1 pasan hoy sin que CALI esté implementada: el ticket mira por qué. Si es porque la aplicación ya lo hace, quedan fuera de `escenarios_en_rojo.CALI`; si su «Entonces» no comprueba nada, se corrige.

**Hecho cuando:** `make check-aceptacion` da verde en el carril (fase aceptacion, área CALI): ninguno de los 83 escenarios de CALI tiene pasos sin definir, `escenarios_en_rojo.CALI` de `config/alcance.json` lista justo los que fallan de verdad, y los que quedan fuera pasan.

**Leer primero:** `features/calibracion.feature:57` (CALI-1.4), `:145` (CALI-3.2), `:156` (regla CALI-4), `:280` (CALI-5), `:400` (CALI-6) y `:459` a `:880` (reglas CALI-7 a 13, el experimento); `tests/aceptacion/pasos/calibracion.ts`; `tests/aceptacion/pasos/reintentos.ts` (CALI-1.4 usa sus pasos); `tests/aceptacion/pasos/configuracion.ts`; `src/aplicacion/bucle.ts` y `src/aplicacion/aplicacion.ts:39-100`; el plan §6, «Pendientes de un área cerrada», para `escenarios_en_rojo`.

## Detalle

- INST comparte 7 pasos con las siluetas y las tarjetas («que el mínimo de ítems de las pantallas de calibración configurado es N», «la persona abre la tarjeta de X», «respuestas.csv no gana ninguna fila», «que X tiene datos suficientes para su silueta»…), y BUCL-2.5 y 2.6 usan los datos de CALI-4 y CALI-5. Van en `tests/aceptacion/pasos/calibracion.ts`, `configuracion.ts` y `tests/aceptacion/soporte/calibracion.ts`, que `inst-pasos` y `bucl-pasos` también tienen en `toca`: el que llegue segundo los encuentra definidos y no los repite.
- Es el ticket de pasos más grande, con mucho: no cabe en una conversación. El carril conserva los commits entre relevos y el push espera al final, con todo CALI definido. Un orden que deja cada relevo en un punto limpio: siluetas (CALI-4), tarjetas (CALI-5, 6 y 3.2), y el experimento regla a regla (CALI-7 a 13).
- No es apto para la noche desatendida.
