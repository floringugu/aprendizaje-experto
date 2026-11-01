---
fase: specs
area: RECU
depende: []
toca: [features/recuperacion.feature, features/material.feature, config/peticion-ia.md, config/parametros.json]
estado: abierto
---
# Un ítem numérico se corrige con tolerancia y unidades

**Qué:** la corrección automática solo ignora los espacios al principio y al final (RECU). En física, «9.8 m/s²», «9,8 m/s^2» y «9.81 m/s2» cuentan como respuestas distintas, así que un ítem de respuesta numérica falla aunque la persona acierte. Especificar un tipo de ítem numérico con valor, tolerancia y unidades, corregido por la app.

**Hecho cuando:** los escenarios fijan cómo se escribe un ítem numérico en el contenido, qué separadores decimales se aceptan, cómo se aplica la tolerancia, qué unidades se aceptan y cómo se escriben, qué pasa con una respuesta sin unidades o con unidades equivalentes, y qué dice el feedback en cada caso; y `make check-specs` está en verde.

**Leer primero:** features/recuperacion.feature (regla «La corrección es automática»; «La persona nunca corrige sus propias respuestas»); src/dominio/correccion.ts; config/peticion-ia.md (exigencias de los ítems).

## Por decidir

- **Tolerancia:** ¿relativa (p. ej., 1 %), absoluta o por ítem? Si hay un valor por defecto, va a `config/parametros.json` como extrapolación del autor.
- **Unidades:** ¿solo la unidad del ítem, o también las equivalentes (km/h frente a m/s)? Convertir unidades es bastante más complejo; empezar con una sola unidad por ítem.
- **Cifras significativas y notación científica** («6,67e-11», «6,67·10⁻¹¹»).
- **Feedback:** distinguir «valor correcto, unidad mal» de «valor mal».
- **Respuesta simbólica** (una expresión): fuera de este ticket. Comprobar la equivalencia (p. ej., con SymPy) es otro problema y otra dependencia.
