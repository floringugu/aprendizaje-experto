---
fase: aceptacion
area: INST
depende: []
toca: [tests/aceptacion/pasos/instrumentacion.ts, tests/aceptacion/pasos/instrumentacion-registros.ts, tests/aceptacion/pasos/instrumentacion-semanas.ts, tests/aceptacion/pasos/calibracion.ts, tests/aceptacion/pasos/configuracion.ts, tests/aceptacion/soporte/calibracion.ts, tests/aceptacion/soporte/instrumentacion.ts, config/alcance.json]
estado: abierto
---
# Pasos de los registros nuevos y de la comparación por semanas en INST

**Qué:** los pasos de los 20 escenarios de INST que hoy no tienen todos los suyos: uno de INST-1.3, los de INST-1.5 a 1.15 (las filas que specs añadió a los CSV: evaluaciones externas por criterio, autoexplicaciones, textos con comas, respuestas y estudio del experimento, siluetas, tarjetas enseñadas y tarjetas abiertas), los de INST-3.1 a 3.7 (la diferencia entre confianza y acierto, por semanas, antes y después de la primera pantalla) y los de INST-4.1. Son 67 pasos distintos. Va en un solo ticket porque `make check-aceptacion` no admite un escenario del área en curso con pasos sin definir. Los pasos van en ficheros por regla y el soporte nuevo, en `tests/aceptacion/soporte/instrumentacion.ts`, no en `contenido.ts`, `acciones.ts` ni `mundo.ts`. INST-2.2 pasa hoy sin que INST esté implementada: el ticket mira por qué. Si es porque la aplicación ya lo hace, queda fuera de `escenarios_en_rojo.INST`; si su «Entonces» no comprueba nada, se corrige.

**Hecho cuando:** `make check-aceptacion` da verde en el carril (fase aceptacion, área INST): ninguno de los 26 escenarios de INST tiene pasos sin definir, `escenarios_en_rojo.INST` de `config/alcance.json` lista justo los que fallan de verdad, y los que quedan fuera pasan.

**Leer primero:** `features/instrumentacion.feature:51` (INST-1.3), `:80-183` (INST-1.5 a 1.15), `:206` (regla INST-3) y `:288` (regla INST-4); `tests/aceptacion/pasos/instrumentacion.ts` y `tests/aceptacion/soporte/csv.ts`; `tests/aceptacion/pasos/calibracion.ts` y `configuracion.ts`; el plan §6, «Pendientes de un área cerrada», para `escenarios_en_rojo`.

## Detalle

- Comparte 7 pasos con las siluetas y las tarjetas de CALI: «que el mínimo de ítems de las pantallas de calibración configurado es N», «que la persona hizo desde el último bucle la prueba de retención de X de la semana N», «que el ítem X de X tiene una tarjeta «…»», «la persona abre la tarjeta de X», «respuestas.csv no gana ninguna fila», «que esa prueba incluye N ítems con una confianza de al menos el N % en su último intento anterior» y «que X tiene datos suficientes para su silueta». Van en `tests/aceptacion/pasos/calibracion.ts`, `configuracion.ts` y `tests/aceptacion/soporte/calibracion.ts`, que `cali-pasos` también tiene en `toca`: el que llegue segundo los encuentra definidos y no los repite (dos definiciones del mismo paso dejan el escenario ambiguo).
- Conviene abrirlo después de `cali-pasos`: reutiliza su soporte de siluetas, tarjetas y experimento en vez de escribir una versión mínima.
