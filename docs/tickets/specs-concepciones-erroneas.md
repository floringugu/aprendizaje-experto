---
fase: specs
area: MATE
depende: [mate-cierre]
toca: [features/material.feature, features/recuperacion.feature, features/instrumentacion.feature, config/peticion-ia.md]
estado: abierto
---
# Cada opción incorrecta lleva la concepción errónea que la hace atractiva, y la app la sigue entre ítems

**Qué:** hoy un fallo es binario. Especificar que cada opción incorrecta de un ítem pueda llevar la concepción errónea que representa (p. ej., «hace falta una fuerza para mantener el movimiento»), redactada por la IA desde el material y aprobada por la persona como el resto. Elegir esa opción da un feedback que refuta esa idea concreta, y la app cuenta cuántas veces aparece cada concepción en ítems distintos.

**Hecho cuando:** los escenarios fijan el formato de la concepción en el contenido, qué feedback da, cómo se cuenta entre ítems y objetivos, qué se registra en los CSV y que la concepción no cambia el dominio (lo deciden los aciertos); y `make check-specs` está en verde.

**Leer primero:** config/peticion-ia.md (exigencias de ítems y opciones); features/recuperacion.feature («El feedback no habla de la persona»); features/material.feature (MATE-2, borradores, y revisión una a una); docs/tickets/specs-tutor-socratico.md (usa los mismos «errores típicos»).

## Evidencia

Hake (American Journal of Physics; 6.542 estudiantes, 62 cursos): ganancia normalizada en comprensión conceptual de 0,48 ± 0,14 con enseñanza interactiva frente a 0,23 ± 0,04 con la tradicional, medida con el Force Concept Inventory y el Mechanics Diagnostic, construidos con distractores que son errores típicos. Límites: encuesta de cursos autoseleccionados, no un ensayo aleatorizado; mide métodos de enseñanza, no una app. Que etiquetar distractores en una app mejore el aprendizaje es extrapolación del autor.

## Por decidir

- Si la concepción es un catálogo por dominio (aprobado una vez y reutilizado por id) o un texto libre por opción. El catálogo permite seguirla entre ítems; el texto libre no.
- Si se enseña en la calibración visual (specs-calibracion-visual): «esta idea aparece en 5 de tus fallos».
- Si una concepción repetida adelanta el repaso de los ítems que la contienen.
- Ítems de respuesta escrita o numérica: solo pueden llevar concepciones si se especifican respuestas incorrectas esperadas.
