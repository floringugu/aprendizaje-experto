---
fase: specs
area: RECU
depende: []
toca: [features/recuperacion.feature, features/dominio.feature, features/calibracion.feature, config/parametros.json]
estado: abierto
---
# Un ítem fallado vuelve en la misma sesión hasta acertarlo (reaprendizaje sucesivo)

**Qué:** la spec espacia los repasos y exige un criterio de dominio, pero no tiene ninguna regla para volver a un ítem fallado dentro de la misma sesión. Especificar el reaprendizaje sucesivo: en cada sesión, un ítem fallado vuelve más tarde en esa sesión hasta que se acierta (criterio por sesión), y las sesiones siguen espaciadas como hoy.

**Hecho cuando:** los escenarios fijan cuándo vuelve un ítem fallado dentro de la sesión, cuál es el criterio (cuántos aciertos), qué pasa si la sesión termina sin llegar a él, y cómo cuentan esos intentos para el dominio, la calibración y el planificador; y `make check-specs` está en verde.

**Leer primero:** features/recuperacion.feature; features/dominio.feature («Cuenta el último intento de cada ítem»); features/planificador.feature (FSRS y «fracción × horizonte»); features/calibracion.feature (qué intentos entran).

## Evidencia

Rawson, Dunlosky y Sciartelli (2013), en dos experimentos en un curso real de introducción a la psicología: el reaprendizaje sucesivo subió la nota del examen en torno a una letra (de C a B) frente al reestudio espaciado y a la línea base; tres sesiones espaciadas dieron más beneficio que una, y el efecto se dio en estudiantes de rendimiento alto y bajo (resumen de retrievalpractice.org; no se leyó el artículo original). Los parámetros concretos (aciertos por sesión, separación dentro de la sesión) son extrapolación del autor.

## Por decidir

- **Criterio:** un acierto por sesión o más, en `config/parametros.json`.
- **Separación dentro de la sesión:** cuántos ítems pasan antes de que vuelva el fallado; volver justo después mide memoria de trabajo, no recuperación.
- **Dominio:** el criterio cuenta el último intento. Si el reintento acertado en la misma sesión cuenta como último intento, un objetivo se daría por dominado justo después de ver la respuesta. Propuesta: para el dominio cuenta el primer intento de cada sesión; los reintentos solo cuentan para el criterio de la sesión.
- **Calibración:** si los reintentos declaran confianza y entran en ella, o no.
- **Planificador:** FSRS recibe el resultado del primer intento de la sesión, no el del reintento.
