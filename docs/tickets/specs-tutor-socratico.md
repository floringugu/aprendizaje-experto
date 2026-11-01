---
fase: specs
area: MATE
depende: [mate-cierre, specs-variantes-items]
toca: [features/material.feature, features/ayuda.feature, features/instrumentacion.feature, config/peticion-ia.md, config/parametros.json]
estado: abierto
---
# Un canal para preguntar sobre un ítem, con un tutor socrático acotado al contenido aprobado

**Qué:** hoy quien no entiende un concepto no puede preguntar: la IA nunca interviene en las sesiones (material.feature, cabecera) y la ayuda solo cambia en el bucle semanal. Especificar un canal de preguntas sobre el ítem respondido que guíe con preguntas en vez de dar la respuesta, con las mitigaciones de Bastani et al. (2025) en el prompt: solución, pistas y errores típicos del contenido aprobado, más el fragmento de la fuente. Cambia una decisión escrita de MATE, por eso es specs.

**Hecho cuando:** los escenarios fijan cuándo se abre el canal, qué recibe el modelo, cuándo cede la explicación, qué se registra y qué no cuenta para el dominio, y `make check-specs` está en verde.

**Leer primero:** docs/investigacion-ia-generativa.md §1 y §2.2 (Bastani, Kestin, efecto muleta) y §2.4 (diagnóstico de errores); docs/investigacion.md §3 (inversión de la pericia, fracaso productivo) y §4 (Fase 1: «evitar descubrimiento sin guía»); features/ayuda.feature (ajuste semanal, intento de exploración).

## Restricciones que salen de la evidencia

- Solo después de responder, declarar la confianza y ver el feedback; nunca durante la recuperación.
- Anclado en el contenido aprobado; lo que no esté en él lleva «No está en tu material».
- No cuenta para el dominio ni para la calibración.
- Se registra en un CSV: ítem, turnos, si cedió y por qué, y el acierto posterior en ese ítem y en sus reservados.

## Hipótesis del dueño

El efecto muleta viene de recibir la respuesta demasiado pronto, así que el tutor no cede hasta que la persona llega a una reflexión adecuada. Es extrapolación del autor: en Bastani, el tutor que no daba la respuesta anuló el daño (−0,004, nulo) pero no produjo ganancia. Se comprueba con el CSV del canal.

## Decisiones del dueño (01-11-2026; extrapolación del autor)

1. **La reflexión se juzga contra la solución aprobada, con criterios explícitos.** No con el juicio libre del modelo: los LLM detectan mal el primer paso erróneo y son indulgentes (investigacion-ia-generativa.md §2.1.2, §2.4). Los criterios salen del contenido aprobado del ítem (pasos de la solución, errores típicos) y la persona los aprueba como el resto de piezas.
2. **El modo depende de la fase.** Novato: el tutor explica o reintroduce el ejemplo resuelto del objetivo, sin modo socrático (inversión de la pericia; investigacion.md §4, Fase 1: «evitar descubrimiento sin guía»). Intermedio: modo socrático. Avanzado: por decidir.
3. **Salida obligatoria.** Tras N turnos sin cumplir los criterios, el tutor cede con la explicación completa, porque el fracaso productivo exige instrucción explícita después (investigacion.md §3). N va a `config/parametros.json` como extrapolación del autor.

## Sin vía de escape (01-11-2026)

Lo que distingue este tutor de los modos de estudio existentes (p. ej., el de ChatGPT, lanzado el 29-07-2025, que se desactiva con un clic y no ha publicado datos de aprendizaje):

- **No hay forma de pedir la respuesta directa** dentro del canal: ni botón, ni ajuste, ni modo alternativo. La única salida es la obligatoria tras N turnos, que da la explicación completa.
- **Ceder deja huella:** el siguiente intento del ítem cuenta como «con ayuda» (ver «Pendiente de decidir»).
- **Fuera de la app no se puede impedir nada:** la persona puede ir a un chat sin restricciones. Por eso se mide el abandono.

## Medición (para que el resultado sirva más allá de una persona)

- El efecto se mide **sin el tutor delante y con retraso**: acierto en el ítem y en sus reservados en las pruebas de retención a 1 y 4 semanas, no durante la conversación.
- El canal se registra en un CSV: ítem, turnos, si cedió, criterios cumplidos y acierto diferido.
- Para comparar con y sin tutor dentro de la persona, se reutiliza la asignación al azar de specs-experimento-releer.
- Un uso personal no es un estudio. Si la app se publica, el protocolo (asignación al azar, prueba diferida sin IA, corrección a ciegas) debe quedar documentado para que un grupo de investigación pueda hacer un ensayo con potencia suficiente (≈175 por grupo para d = 0,3, α = 0,05 y potencia del 80 %), preregistrado y con revisión ética.

## Pendiente de decidir

- Cómo se escriben los criterios de un ítem: ¿campo nuevo del contenido, redactado por la IA en el borrador y aprobado por la persona?
- El valor de N y si ceder cuenta como «con ayuda» en el siguiente intento del ítem.
- Qué hace el tutor en la fase avanzada, donde se practica con tareas y rúbrica.
- Abandono: si el canal frustra, la persona puede irse a un chat sin restricciones fuera de la app y la subcontratación pasa igual. Qué se mide en el CSV para verlo (turnos, salidas sin ceder).
