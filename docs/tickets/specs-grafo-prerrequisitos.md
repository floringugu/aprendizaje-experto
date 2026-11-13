---
fase: specs
area: MATE
depende: [mate-cierre]
toca: [features/material.feature, features/diagnostico.feature, features/dominio.feature, features/instrumentacion.feature, config/peticion-ia.md]
estado: abierto
---
# Los objetivos llevan sus prerrequisitos, aprobados uno a uno, y un fallo señala el que flojea

**Qué:** hoy los objetivos forman una lista en el orden del contenido (dominio.feature, «El objetivo siguiente se abre al dominar el actual»; diagnostico.feature, DIAG-2.1), y la aplicación no sabe de cuáles depende cada uno. Especificar que un objetivo pueda llevar sus prerrequisitos («O4 depende de O1 y de O2»), redactados por la IA desde el material como borrador y aprobados uno a uno por la persona como el resto, cada uno con la cita del material que lo respalda. Con ellos, la ruta respeta las dependencias y, cuando un objetivo se falla, la aplicación enseña cuáles de sus prerrequisitos no están dominados.

**Hecho cuando:** los escenarios fijan el formato de un prerrequisito en el contenido, cómo se redacta y se aprueba, qué pasa con un ciclo o con un prerrequisito que apunta a un objetivo que no existe, cómo cambia el orden de la ruta, qué enseña la aplicación tras un fallo y qué se registra en los CSV; el dominio lo siguen decidiendo solo los aciertos; y `make check-specs` está en verde.

**Leer primero:** features/dominio.feature («No se avanza sin dominar», línea 111); features/diagnostico.feature («El diagnóstico da una ruta personalizada», línea 40); features/material.feature (MATE-2, borradores; «Lo aprobado conserva su fuente, y la fuente no adelanta la respuesta»; revisión una a una); config/peticion-ia.md (G1, «Cita no encontrada»); docs/tickets/specs-troceo-material.md («Sin índice»: el orden de las páginas hace hoy de orden de prerrequisitos).

## De dónde sale la idea

De LearnHarness (github.com/amosblomqvist/learnharness, AGPL-3.0), visto el 13-11-2026. Guarda en ficheros JSONL proposiciones y cadenas de razonamiento (premisas → conclusión), cada una enlazada con la sesión donde nació, y planifica la lección como el árbol de dependencias más pequeño entre lo que la persona sabe y su objetivo.

Se toma la idea, no el código: su licencia obligaría a publicar bajo AGPL lo que derive de él.

## En qué se diferencia de LearnHarness

- **Lo que se guarda.** Su grafo guarda lo que se enseñó, y su documentación dice que no es una evaluación de quien aprende. Aquí el estado de cada objetivo ya lo da el dominio medido (MAST); el grafo solo añade las relaciones entre objetivos.
- **Quién lo escribe.** Allí lo extrae la IA sin revisión. Aquí es un borrador que no entra en una sesión hasta que la persona lo aprueba (MATE, «Un borrador nunca aparece en una sesión»).
- **El grano.** Allí son proposiciones sueltas. Aquí la unidad es el objetivo, que ya existe; bajar a proposiciones multiplicaría lo que hay que revisar.

## Evidencia

`docs/investigacion.md` no trata los grafos de prerrequisitos ni la secuenciación por dependencias. Lo más cercano está en `docs/investigacion-ia-generativa.md` (Chung et al. 2026, Taipei: +0,15 DE con una secuencia adaptativa por dificultad frente a una fija), que mide otra cosa: dificultad, no dependencias.

## Por decidir

- **El respaldo.** O entra etiquetado `@extrapolacion`, o antes se investiga (skill `research`) y se añade al informe en su propio PR. Hasta que el dueño elija, el ticket queda en `[DECISIÓN PENDIENTE]`.
- **Qué hace un prerrequisito no dominado.** O bloquea el objetivo que depende de él (más estricto que hoy, que solo exige el anterior de la lista), o solo se enseña como aviso tras un fallo.
- **El diagnóstico.** Si fallar un objetivo en el diagnóstico permite dar por no dominados los que dependen de él sin preguntarlos, o si se siguen midiendo todos (DIAG-1: «mide con pruebas»).
- **Sin prerrequisitos aprobados.** Si el orden del contenido sigue valiendo como hasta ahora (propuesta: sí).
- **Verlo.** Si la persona ve el grafo dibujado o solo la lista de prerrequisitos de cada objetivo. Dibujarlo es trabajo de PANT, no de este ticket.
