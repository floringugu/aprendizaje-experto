---
fase: specs
area: RECU
depende: []
toca: [features/recuperacion.feature, config/peticion-ia.md, config/parametros.json, config/alcance.json, docs/plan.md, docs/cobertura-investigacion.md]
estado: hecho
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

## Lo que se decidió (02-11-2026)

Todo es extrapolación del autor: el informe no trata las respuestas numéricas. Los escenarios son RECU-5.1 a RECU-5.13, más RECU-4.2 y un cambio en RECU-2.2, y están en `escenarios_en_rojo.RECU`.

- **Contenido:** `respuesta` lleva `valor` (número), `unidades` (opcional, lista con la que se enseña primero) y `tolerancia` (opcional). Sin `unidades`, el ítem se responde solo con un número.
- **Tolerancia:** relativa, por ítem; sin ella vale `tolerancia_numerica_relativa`, el 1 %. Con valor 0 solo vale 0.
- **Separadores:** punto y coma son decimales; no hay separador de miles, así que «1.000,5» no se entiende como número. Notación científica con «e» o con «·10^n», «×10ⁿ».
- **Unidades:** una de las del contenido, sin distinguir espacios y distinguiendo mayúsculas. No se convierte: «100000 Pa» no vale por «kPa». Sin unidad, la respuesta es incorrecta aunque el valor valga.
- **Feedback:** el de RECU-2.1 más qué parte falla (valor, unidad que falta, sobra o no es la esperada, o que no se entiende como número) y, si falla el valor, el margen que se acepta. El cambio en RECU-2.2 lo permite.
- **Fuera:** cifras significativas, conversión de unidades y respuestas simbólicas.

## Lo que queda aparte

- `features/material.feature` ya no es de este ticket: los escenarios de MATE que rechazan un ítem numérico mal formado en el borrador (MATE-2.3) pasan a `specs-item-numerico-borrador`, que espera a `mate-cierre` para no cambiar MATE mientras se cierra.
- `recu-aceptacion-item-numerico` y `recu-impl-item-numerico` llevan los 15 escenarios de RECU por aceptación e impl.
- Si dos carriles de RECU añaden la regla RECU-5 o piden «Cada área tiene una sola mini área a la vez» en `alcance.json`, el segundo en fusionar renumera sus IDs y junta las listas.
