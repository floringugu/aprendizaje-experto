---
fase: aceptacion
area: RECU
depende: [recu-reintentos]
toca: [tests/aceptacion/pasos/reintentos.ts, config/alcance.json, docs/areas/RECU.md, docs/tickets/noche-lote-traido-a-mano.md, docs/tickets/noche-marca-citada.md]
estado: hecho
---
# Los pasos de RECU-6.4, 6.7 y 6.10 reciben el ítem que nombran

**Qué:** tres pasos de `tests/aceptacion/pasos/reintentos.ts` declaran `{item}` en la expresión y su función no recibe parámetros (líneas 172, 176 y 218): «acierta {item} en su primer reintento», «acierta {item} en su primer reintento, falla en el segundo y acierta en el tercero» y «la aplicación la deja terminar sin pedirle que acierte {item} antes». Cucumber los rechaza con «function has 0 arguments, should have 1», así que RECU-6.4 (las dos filas), RECU-6.7 y RECU-6.10 fallan aunque la aplicación ya hace lo que piden (ticket `recu-reintentos`). Hay que darles el parámetro y usarlo (por ejemplo, comprobar que es el ítem fallado) y sacar los tres escenarios de `escenarios_en_rojo.RECU`.

**Hecho cuando:** RECU-6.4, 6.7 y 6.10 pasan con `npx cucumber-js --profile area --tags "@RECU-6"`, salen de `escenarios_en_rojo.RECU` en `config/alcance.json` y `make check` da verde. Si la rama ya tiene el ítem numérico de `main` (RECU-2.2, 4.2 y 5.x fuera de `escenarios_en_rojo`), también `make cerrar-area A=RECU`.

**Leer primero:** `tests/aceptacion/pasos/reintentos.ts:160-222`; `features/recuperacion.feature` (RECU-6.4, RECU-6.7 y RECU-6.10); la sección «Estrechamiento» de `docs/tickets/recu-reintentos.md`.

## Detalle

- Comprobado el 15-11-2026 en una copia del carril `recu-reintentos` fuera del repositorio: con `(_item: string) =>` en las tres funciones pasan los 20 escenarios de RECU-6.
- Sale del ticket `recu-reintentos` (impl), que no puede tocar `tests/aceptacion/` (plan §6, rutas por fase).
