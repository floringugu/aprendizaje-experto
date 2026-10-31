# MATE: pendiente

Lo que quedó por hacer en MATE de los relevos antiguos, que iban al final de `docs/areas/MATE.md`: las decisiones B y A del dueño (25-10-2026) y el relevo de etapa 3 del carril `mate-pasos`. Se lee solo para hacerlos, y lo que se haga se borra de aquí.

## Decisiones B y A (carril `mate-limpieza`)

Lo que queda del relevo del carril `mate-limpieza`: las decisiones del dueño, sin implementar. Los relevos de `mate-revision` y de `mate-limpieza` ya están hechos (carril `ci`, 30-10-2026).

**Decisiones del dueño (25-10-2026)**, para la conversación que toque los ficheros de mate-revision:
1. **B:** `mesa-guardada.ts` con las rutas, `codificarJson`/`leerJson`, `leerMesa` y `escribirPar`, y `leerContenido` pasa a ser `contenidoDeFicheros(ficheros)`. A (un solo lector, sin `leerContenido`) queda para cuando PANT construya el servidor y las `Dependencias`.
2. **A:** `dominioValido(dominio): Resultado<string>`, que rechaza con `campo` `dominio`; lo llaman los casos de uso que reciben un dominio. Hay que decidir qué caracteres se admiten (propuesta de la conversación que lo implemente). B (que `Ficheros` rechace las rutas fuera de la carpeta de datos) queda para el adaptador de PANT.
3. **b:** MATE-6.3 pasa a `tareas.feature` en una conversación de fase specs (ruta protegida); MATE se cierra citando 6.1, 6.2, 6.4 y 6.5. No se implementa `pedirTarea` en MATE.

Opciones que se compararon, para dejar constancia en «Interfaces descartadas» al cerrar el área: en el punto 1, A (coste: cambia `Dependencias` y `tests/aceptacion/soporte/mundo.ts:166`); en el punto 2, B (el puerto lanzaría un error en vez de rechazar con `campo`); en el punto 3, a (TARE-1.1, 1.4 y 1.5 pasarían en verde antes de su área).

1. *El aprobado se lee por dos caminos* (`Dependencias.leerContenido`, para las sesiones, y `Ficheros` con `contenido/<d>.json`, para la revisión):
   - **A, un solo lector:** `mesa-guardada.ts` con las rutas, `codificarJson` y `leerJson`, `leerMesa` y `escribirPar`; `enDominio` lee el aprobado por ahí y se quita `leerContenido`. Coste: cambia `Dependencias`, y `tests/aceptacion/soporte/mundo.ts:166` (protegido, propuesta), que ya no podría tener `contenidoEscrito ?? contenidos.get` y escribiría el contenido por `Ficheros`; los tres tests que copian rutas y `codificar` se simplifican.
   - **B, un solo sitio para rutas y bytes:** `mesa-guardada.ts` con lo mismo, y `leerContenido` pasa a ser `contenidoDeFicheros(ficheros)`, que lo da a quien arranca la aplicación. Coste: pequeño, no toca rutas protegidas. El doble camino sigue en `mundo.ts`.
   - Recomendación: B ahora; A cuando PANT construya el servidor y las `Dependencias`.
2. *`dominio` va sin validar dentro de las rutas* (`material-guardado.ts:106-108`, `revision-del-material.ts:184-185`, `material.ts:105-107`: con `../` se escribe fuera de la carpeta):
   - **A, validar al entrar:** `dominioValido(dominio): Resultado<string>`, que rechaza con `campo` `dominio`; lo llaman los casos de uso que reciben un dominio. Coste: hay que decidir qué caracteres se admiten, cada caso de uso gana una llamada, y un caso que se olvide sigue escribiendo fuera.
   - **B, que `Ficheros` rechace las rutas que salgan de la carpeta de datos:** un solo sitio, que protege también las áreas siguientes. Coste: el puerto lanza un error en vez de rechazar con `campo`, y el doble de `Ficheros` de `mundo.ts` (protegido) tendría que imitarlo para poder probarse; el adaptador real aún no existe (PANT).
   - Recomendación: A ahora, y B como defensa cuando exista el adaptador en PANT.
3. *MATE-6.3:* el step llama a `pedirTarea`, que es `sinImplementar` (`aplicacion.ts:71`) y pertenece a TARE-1.1, después de MATE en el orden y hoy fuera de alcance. Lanza «Sin implementar», y `make cerrar-area A=MATE` exige la aceptación del área en verde. Opciones:
   - **a)** implementar `pedirTarea` en MATE: TARE-1.1, 1.4 y 1.5 pasarían en verde antes de su área, el mismo problema que la etapa 3 de «estado-aceptacion»;
   - **b)** pasar el escenario 6.3 a `tareas.feature` (fase specs, ruta protegida) y cerrar MATE citando 6.1, 6.2, 6.4 y 6.5. Es lo que recomiendo.
   - No he vuelto a ejecutar MATE-6.1: la nota de «Hallazgos» sobre repasos y retención puede estar desfasada.

**Paso siguiente:** una conversación de fase impl de MATE implementa B y A.

**Leer primero:** estas decisiones, `reports/revisor-codigo-MATE.md` (está en el directorio principal, no en los worktrees; `reports/` no se versiona), `docs/deuda-diseno.md` (D22) y `features/material.feature` (MATE-6).

## Relevo de etapa 3 (carril `mate-pasos`)

Etapa 3 de MATE en el worktree `/home/florin/aprendizaje-experto-mate-pasos` (rama `mate-pasos`). Solo se toca `tests/aceptacion/`, `docs/areas/MATE.md` y este fichero. La conversación siguiente tiene que ser de fase aceptacion, área MATE (ya fijadas en `.claude/settings.local.json`), abierta sobre ese worktree. Léelo y borra esta sección al acabar.

**Hecho**
- Lectura completa de lo necesario y firma aprobada por el dueño en «### Reservados (etapa 3)», con las cuatro respuestas recomendadas: `pedirMasReservados({ dominio, objetivo, documento })` (operación aparte, causas `sin_ia` y `objetivo_no_encontrado`, salida `BorradorRedactado`); `avisos` en la raíz de `Revision` (`categoria_sin_reservado { objetivo, categoria }` y `pocos_reservados { hay, hacen_falta }`); una categoría con grupo solo lleva aviso si tiene problemas en el objetivo; en el pedido, un ítem de otro objetivo se aparta con `falta: 'objetivo'` y lo que no es ítem se ignora.
- `tests/aceptacion/soporte/externos.ts`: `IaDePrueba` guarda cada petición en `peticiones` (nuevo tipo `PeticionALaIa`, con `reservadosDe?: { objetivo, enunciados }`). Sin pasar tipos ni lint todavía.

**Falta**
1. Tipos por intersección en `soporte/escenario-material.ts`: `ItemConReservado` (`reservado?: boolean`), `RevisionConAvisos` (`avisos?`), `AvisoDeReservados` y la operación `pedirMasReservados`, que se busca en tiempo de ejecución y falla con «la aplicación aún no tiene pedirMasReservados». Un campo `reservadosDe` en `EscenarioMaterial` para el «Dado que la persona pidió más problemas reservados de O1» (2.11): el «Dado» solo anota el objetivo y el «Cuando» hace la petición con lo que entrega la IA.
2. Un fichero nuevo `pasos/reservados.ts` con los pasos que salen de `ARNES_AREA=MATE npx cucumber-js --profile area --tags @MATE --dry-run` (12 escenarios sin definir: 2.8, 2.9, 2.10, 2.11, 3.6 ×3, 3.7 ×3 y 4.12 ×2). Frases literales que ya vimos: «ha apartado 1 pieza porque su «reservado» no es verdadero ni falso» y «porque no es reservado» (los dos con `falta: 'reservado'`, usando `comprobarApartadas` de `pasos/redaccion-rechazos.ts`, que hay que exportar); «el mínimo de problemas reservados configurado es 5» con `establecerParametro('minimo_problemas_reservados', 5)`; «C1 es de un grupo de parecidas y C5 no tiene grupo» con `contenido().fijarCategorias`; problemas reservados aprobados y pendientes con `itemDePrueba` más `reservado`. Para 3.6 y 3.7 los «Entonces» leen `revision.avisos` con `presente(...)`, así los escenarios «no ve ningún aviso» también fallan hoy, y traducen el texto del aviso a datos con una expresión regular (en «bajo O1», el `objetivo` del aviso; el aviso de mínimo no tiene objetivo, así que «no ve ningún aviso de problemas reservados» bajo O1 solo mira los de categoría).
3. **Decisión que quedó sin preguntar (4.12):** los pasos «I7 tiene la marca «Reservado»» y «no tiene la marca «Reservado»» ya los define `pasos/revision.ts` con `MARCAS`, que no tiene «Reservado». Hoy fallarían por «no hay la marca», y nunca podrían pasar. Hay que decidir dónde ve la persona el «Reservado» en lo que devuelve `abrirRevision`: lo que propongo es un `reservado?: boolean` en cada pieza de `grupos[].piezas` (`PiezaPendiente`), que no es una marca (las marcas las pone la aplicación y el filtro de marcas no cambia). Si se acepta, `revision.ts` debe tratar «Reservado» aparte de `MARCAS`, y los pasos de «quita/pone «Reservado» en I7 y guarda la corrección» llaman a `corregirPieza` con `{ ...inicial, reservado: false | true }`; hay que escribir esta decisión en «### Reservados (etapa 3)» y pararse con [DECISIÓN PENDIENTE] antes de escribir esos pasos.
4. Comprobar que cada escenario falla de verdad (ni pendiente, ni saltado, ni en verde): `ARNES_AREA=MATE npx cucumber-js --profile area --tags @MATE` y mirar el resultado de los 12.
5. `escenarios_en_rojo`: ejecutar la aceptación del área y apuntar los IDs de MATE que fallan (los 12 de arriba más los que ya tenían steps pero no aplicación; el dueño cree que son 2.1, 2.3, 2.5, 2.6, 2.7, 3.5, 4.11 y 5.5, hay que comprobarlo). Preparar la propuesta (plan §6, clon en el scratchpad, parche en `reports/propuestas/`) que añade `"escenarios_en_rojo": {"MATE": [...]}` a `config/alcance.json`. Con ella aplicada, `make check-aceptacion` tiene que dar verde.
6. Pasar tipos, lint, duplicación, código muerto y capas sobre `tests/aceptacion/` (`npm run --silent <paso>`), y dar al dueño el bloque `sh` para commitear en el worktree y para integrar desde el directorio principal: `make integrar N=mate-pasos` y `make retirar N=mate-pasos`.
7. Arreglar el paso «que contenido\/borradores\/ficticio.json tiene la tarea {tarea}, pendiente, sin {texto}» de `tests/aceptacion/pasos/aprobacion.ts:180`: el callback recibe un parámetro y la frase tiene dos, y Cucumber da «function has 1 arguments, should have 2». Por eso falla un escenario de MATE-4.11 (lo vio el carril `ci`, fase impl, el 30-10-2026).

**Leer primero:** esta sección y «### Reservados (etapa 3)», en `docs/areas/MATE.md`; `features/material.feature` (las reglas MATE-2 y MATE-3, y 4.12); `tests/aceptacion/pasos/redaccion-rechazos.ts`, `revision.ts` y `aprobacion.ts`; `tests/aceptacion/soporte/escenario-material.ts`, `externos.ts` y `contenido.ts`; `config/alcance.json`.
