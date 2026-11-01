---
fase: specs
area: PLAN
depende: [plan, specs-experimento-releer]
toca: [features/planificador.feature, features/ayuda.feature, features/instrumentacion.feature, config/parametros.json]
estado: abierto
---
# Los parámetros de eficiencia empiezan en la media de la evidencia y se ajustan a la persona con su retención diferida

**Qué:** hoy los parámetros son fijos para todos y valen de media. Especificar que los parámetros de eficiencia empiezan en su valor de `config/parametros.json` (la media de los estudios, como prior) y se ajustan a la persona con el tiempo, a partir de su retención diferida y no del acierto inmediato. Para no confundir causa y selección, el ajuste se apoya en variaciones pequeñas asignadas al azar alrededor del valor actual (bandido con prior), salvo donde ya hay un modelo de memoria por ítem (optimizador de FSRS para los hechos).

**Hecho cuando:** los escenarios fijan qué parámetros se adaptan y cuáles nunca, qué medida se optimiza, cómo se asignan las variaciones, cuántos datos hacen falta para mover un valor y cuánto puede moverse, qué ve la persona y qué se registra; y `make check-specs` está en verde.

**Leer primero:** config/parametros.json (valores, nivel de evidencia y «extrapolacion»); features/planificador.feature (FSRS, SM-2 y «fracción × horizonte»); features/ayuda.feature (ajuste semanal de la ayuda); docs/tickets/specs-experimento-releer.md (asignación al azar y condiciones justas).

## Restricciones

1. **Se optimiza la retención diferida y la transferencia** (pruebas a 1–4 semanas y reservados), nunca el acierto de la sesión ni el tiempo de uso. Optimizar lo inmediato empuja hacia intervalos cortos y práctica por bloques, que rinden más en el momento y se recuerdan peor después (docs/investigacion.md §2.2; Yan, Bjork y Bjork, 2016).
2. **Solo se adaptan parámetros de eficiencia:** intervalos de repaso de problemas, retención objetivo y pesos de FSRS, ritmo de retirada de la ayuda (`pasos_retirados_por_ajuste`). **Nunca los de medida:** `umbral_dominio`, `umbral_paso_a_avanzado`, `umbral_transferencia`, `minimo_problemas_reservados` ni los criterios de experto. Si se adaptaran, la forma más fácil de «progresar» sería bajarlos.
3. **Variaciones al azar, no aprendizaje de lo observado.** Sin asignación al azar, «los ítems con intervalo largo se recuerdan mejor» puede deberse a que los fáciles reciben intervalos largos.
4. **Prior fuerte y límites.** El valor de la evidencia pesa hasta que haya datos suficientes, y cada parámetro tiene un rango permitido. Con un usuario, el ajuste será lento: se asume.
5. **Transparencia.** La persona ve qué parámetros se han movido, desde qué valor, con cuántos datos y por qué.

## Por decidir

- Para los hechos: usar el optimizador de FSRS (comprobar qué ofrece ts-fsrs y con cuántos repasos funciona) frente a fijar los pesos por defecto.
- Tamaño de las variaciones, datos mínimos para mover un valor y rango por parámetro, en `config/parametros.json` como extrapolación del autor.
- Si el ajuste es por dominio o global para la persona.
- Área: lo he puesto en PLAN; puede repartirse con AYUD (ritmo de la ayuda).
