---
fase: specs
area: CALI
depende: []
toca: [features/calibracion.feature, features/bucle.feature, config/parametros.json, docs/cobertura-investigacion.md]
estado: hecho
---
# La calibración se enseña con tus ítems, por objetivo y con el paso del tiempo, no con tres números sueltos

**Qué:** hoy el bucle semanal enseña tres números agregados (confianza media, acierto y diferencia, CALI-2.1) y mezcla práctica y reservados en uno (CALI-2.4). Especificar dos pantallas que traduzcan esos datos a algo concreto: (1) «silueta y relleno», por objetivo: tu confianza media como contorno discontinuo y tu acierto sin ayuda como relleno; y (2) «tus tarjetas un mes después»: los ítems que diste por seguros, uno a uno, y cuáles sigues acertando en la prueba de retención. La confianza sigue sin afectar al progreso (CALI-3).

**Hecho cuando:** los escenarios fijan los datos de cada pantalla, el mínimo de ítems para enseñarlas, cuándo aparecen, que practicados y reservados se separan, y que la pantalla enseña lo que digan los datos aunque contradiga la idea de que recuperar es mejor; y `make check-specs` está en verde.

**Leer primero:** features/calibracion.feature (CALI-2.1, CALI-2.4, CALI-3.1); features/bucle.feature (paso 2 del bucle); docs/investigacion.md §2.5 (juicios de aprendizaje y fluidez).

## Evidencia (extrapolación del autor: ningún estudio prueba estas pantallas)

Ninguna de estas fuentes está en `docs/investigacion.md` y no las he verificado: no pasan a ninguna feature ni a ningún parámetro. De `docs/investigacion.md` solo se usa la §2.5, que además avisa de que parte del patrón de desajuste puede ser regresión a la media.

- **Visualización de alineamiento.** En la metasíntesis de modelos abiertos del estudiante (Robles Mucho et al., 2026, Frontiers in Education, 26 estudios), enseñar a la vez lo que el estudiante cree y lo que el modelo mide mejoró la precisión de sus juicios de confianza, sobre todo en los de peor rendimiento (Al-Shanfari et al., 2020). Dos tercios corrigieron su autoevaluación tras verlo. Límites: estudios cortos, mayoría STEM, resultados de aprendizaje mixtos.
- **Frecuencias, no porcentajes.** Las frecuencias naturales («6 de 12») se entienden mejor que los porcentajes (Cochrane CD006776, 35 estudios, SMD 0,69 en pruebas diagnósticas). Aquí cada unidad es un ítem real de la persona.
- **Simple.** Las matrices de iconos ayudan sobre todo a quien tiene alta alfabetización gráfica (Okan et al., 2012).
- **Atractivo no es eficaz.** Una revisión de 38 estudios de paneles de analítica del aprendizaje (arXiv 2312.15042) no encontró mejora del rendimiento; sí más participación. Por eso las reglas de abajo.

## Pantallas

1. **Silueta y relleno, por objetivo.** Contorno discontinuo = confianza media en los ítems del objetivo; relleno = acierto sin ayuda. Se ven los tres casos: bien calibrado, sobreconfianza (el hueco vacío dentro de la silueta) e infraconfianza (el relleno sobresale). Practicados y reservados por separado: el hueco en reservados es la ilusión de transferencia.
2. **Tus tarjetas un mes después.** Los ítems respondidos con confianza alta en el estudio, dibujados uno a uno, y cuáles se aciertan en la prueba de retención a 4 semanas («siguen en pie 6 de 12»). Cada tarjeta se puede abrir para ver el ítem.

## Reglas

- **Los datos mandan sobre el relato.** No hay textos escritos de antemano que digan que recuperar es mejor: la pantalla enseña lo que digan los datos de la persona.
- **Mínimo de ítems** antes de enseñar una comparación, en `config/parametros.json` como extrapolación del autor. Por debajo, la pantalla dice que aún no hay datos suficientes.
- **Una revelación por sesión**, no un panel con todo.
- **La tarea, no la persona:** «estas tarjetas», no «fallas».
- **La confianza no cambia el progreso** (CALI-3.1 sigue igual).

## Decidido en la conversación de specs (extrapolación del autor, sin evidencia propia)

- **Confianza alta:** 80 %, en `confianza_alta_minima` (CALI-5.2, CALI-5.3). Cuenta la confianza del último intento antes de la prueba (CALI-5.4).
- **Dónde salen:** solo en el paso 2 del bucle semanal, nunca fuera de él (BUCL-2.5, BUCL-2.6), y una pantalla por bucle: si hay tarjetas, esas; las siluetas esperan (CALI-6.1).
- **Mínimo:** 5 ítems, en `minimo_items_calibracion_visual`, por objetivo y por grupo (CALI-4.5, CALI-4.6). Bajo el mínimo, la silueta dice «Aún no hay datos suficientes: 4 de 5 ítems»; las tarjetas no se enseñan y el paso 2 enseña las siluetas (CALI-5.7).
- **Tarjetas:** solo de la prueba de retención de la última semana configurada (CALI-5.8), de un objetivo por bucle y una sola vez (CALI-5.9). Los reservados no tienen tarjeta (CALI-5.5).
- **Silueta:** sobre el último intento de cada ítem, como el acierto sin ayuda de MAST, no sobre la última semana de CALI-2.1 (CALI-4). Sin margen de «bien calibrado»: la frase enseña la diferencia en puntos y «coinciden» solo si son iguales (CALI-4.2).
- **Registro para medir si las pantallas cambian algo:** pasa a un ticket nuevo, `specs-registro-calibracion`, porque toca `features/instrumentacion.feature`, fuera del `toca` de este.
