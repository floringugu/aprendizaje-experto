---
fase: impl
area: PLAN
depende: []
toca: [.claude/hooks/anotar-parada.ts, scripts/arnes/comun/relevo.ts, scripts/arnes/comun/registro-stop.ts, tests/arnes/, CLAUDE.md, docs/plan.md]
estado: abierto
---
# El hook Stop solo acepta `[RELEVO]` si el relevo está escrito, y lo archiva con su commit

**Qué:** al aceptar `[RELEVO]`, el hook Stop comprueba que `reports/relevo.md` existe en el checkout de la conversación, lo copia a `reports/relevos/<carril>-<sello>.md` de la carpeta principal y anota en el registro el commit en el que quedó el checkout. Hoy acepta la marca sin mirar si el fichero existe, y el relevo se pierde cuando la conversación siguiente lo borra. Es un cambio del arnés: el área PLAN solo le da nombre a la rama.

**Hecho cuando:** hay tests en `tests/arnes/` para los tres casos (con fichero, la línea del registro lleva `commit` y la copia está en la carpeta principal; sin fichero, la parada no se anota como relevo; desde un carril, la copia va a la carpeta principal y no al carril); el plan §5, «Relevo», y `CLAUDE.md` dicen lo construido, y `make check` da verde.

**Leer primero:** `.claude/hooks/anotar-parada.ts` (la condición de `MARCA_RELEVO`); `scripts/arnes/comun/relevo.ts` (`RUTA_DEL_RELEVO`, `avisoDeRelevoPasado`); `scripts/arnes/comun/registro-stop.ts` (`ParadaStop`, `RESULTADOS`); `scripts/arnes/comun/checkout.ts` (`carpetaPrincipal`); `scripts/arnes/comun/git.ts` (`hayCambiosSinCommitear`); `tests/arnes/relevo.test.ts` y `tests/arnes/registro-stop.test.ts`; `docs/plan.md` §5, «Relevo» y «Stop: `anotar-parada.ts`» (búscalos con Grep).

## Motivo (principio 7)

Es una petición del dueño del 15-11-2026, al contrastar con el repositorio el documento de traspaso «AI Factory» (fase A, punto 2; era `docs/ai-factory/contexto.md`, borrado el 15-11-2026: `git show 65ce3da:docs/ai-factory/contexto.md`). No hay dato de un relevo perdido ni de un `[RELEVO]` aceptado sin fichero. El plan §5 tiene que decirlo así, como hace el §6 con los tickets («Lo que motiva el cambio es, sobre todo, tu petición»).

## Detalle

- **Sin fichero, la marca no cuenta,** igual que por debajo del umbral: la parada se anota como `con-cambios` o `sin-cambios`, y el aviso al dueño dice que falta `reports/relevo.md`. La conversación no ha pasado el relevo, así que puede seguir editando para escribirlo. El hook sigue sin bloquear.
- **La copia va a la carpeta principal** (`carpetaPrincipal`), porque el `reports/` de un carril se borra con él. Lleva una cabecera con la fecha, la sesión, el carril, los tokens, el commit (`git rev-parse HEAD`) y si había cambios sin commitear (`hayCambiosSinCommitear`). `reports/` está fuera de git.
- **La línea del registro** gana un campo opcional `commit` (`ParadaStop`).
- **Sin `make check` en el relevo:** el documento lo pedía, pero la comprobación se quitó del hook Stop el 31-10-2026 y la exige el hook del push.
- **No cambia** quién lee y borra `reports/relevo.md`: la conversación siguiente, como dice `CLAUDE.md`.

## Solape

Comparte `tests/arnes/`, `CLAUDE.md` y `docs/plan.md` con `noche-lote` y con `noche-usuario-y-tapa`: no pueden tener carril a la vez, y `make tickets` lo dice. Orden previsto: `noche-lote`, después este y después `noche-usuario-y-tapa`.
