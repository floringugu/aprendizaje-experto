---
fase: aceptacion
area: MATE
depende: []
toca: [tests/aceptacion/pasos/reservados.ts, tests/aceptacion/pasos/redaccion-rechazos.ts, tests/aceptacion/pasos/revision.ts, tests/aceptacion/pasos/aprobacion.ts, tests/aceptacion/pasos/borradores-en-sesiones.ts, tests/aceptacion/soporte/escenario-material.ts, config/alcance.json, docs/areas/MATE.md]
estado: hecho
---
# Pasos de los reservados de MATE (MATE-2.8 a 2.11, 3.6, 3.7 y 4.12)

**Qué:** los pasos de los 12 escenarios de reservados, que hoy no tienen ninguno; el arreglo del paso de `tests/aceptacion/pasos/aprobacion.ts:180`, y `escenarios_en_rojo` de MATE en `config/alcance.json`. Antes de los pasos de 4.12 hay una decisión del dueño (punto 3 de «Falta»). Es el relevo de etapa 3 del carril `mate-pasos`, que estaba en `docs/areas/MATE-pendiente.md`.

**Hecho cuando:** los 12 escenarios fallan de verdad (ni pendientes, ni saltados, ni en verde), `escenarios_en_rojo` lista los IDs de MATE que fallan y `make check-aceptacion` da verde.

**Leer primero:** este ticket; «### Reservados (etapa 3)», en `docs/areas/MATE.md`; `features/material.feature` (las reglas MATE-2 y MATE-3, y 4.12); `tests/aceptacion/pasos/redaccion-rechazos.ts`, `revision.ts` y `aprobacion.ts`; `tests/aceptacion/soporte/escenario-material.ts`, `externos.ts` y `contenido.ts`; `config/alcance.json`.

## Hecho en la etapa 3

- La firma, aprobada por el dueño en «### Reservados (etapa 3)», con las cuatro respuestas recomendadas: `pedirMasReservados({ dominio, objetivo, documento })` (operación aparte, causas `sin_ia` y `objetivo_no_encontrado`, salida `BorradorRedactado`); `avisos` en la raíz de `Revision` (`categoria_sin_reservado { objetivo, categoria }` y `pocos_reservados { hay, hacen_falta }`); una categoría con grupo solo lleva aviso si tiene problemas en el objetivo; en el pedido, un ítem de otro objetivo se aparta con `falta: 'objetivo'` y lo que no es ítem se ignora.
- `IaDePrueba` guarda cada petición en `peticiones` (tipo `PeticionALaIa`, con `reservadosDe?: { objetivo, enunciados }`). Ya está en main: `tests/aceptacion/soporte/externos.ts:118-131`.

## Falta

1. Tipos por intersección en `soporte/escenario-material.ts`: `ItemConReservado` (`reservado?: boolean`), `RevisionConAvisos` (`avisos?`), `AvisoDeReservados` y la operación `pedirMasReservados`, que se busca en tiempo de ejecución y falla con «la aplicación aún no tiene pedirMasReservados». Un campo `reservadosDe` en `EscenarioMaterial` para el «Dado que la persona pidió más problemas reservados de O1» (2.11): el «Dado» solo anota el objetivo, y el «Cuando» hace la petición con lo que entrega la IA.
2. Un fichero nuevo, `pasos/reservados.ts`, con los pasos que salen de `ARNES_AREA=MATE npx cucumber-js --profile area --tags @MATE --dry-run` (12 escenarios sin definir: 2.8, 2.9, 2.10, 2.11, 3.6 ×3, 3.7 ×3 y 4.12 ×2). Frases que ya se vieron:
   - «ha apartado 1 pieza porque su «reservado» no es verdadero ni falso» y «porque no es reservado», los dos con `falta: 'reservado'`, usando `comprobarApartadas` de `pasos/redaccion-rechazos.ts`, que hay que exportar;
   - «el mínimo de problemas reservados configurado es 5», con `establecerParametro('minimo_problemas_reservados', 5)`;
   - «C1 es de un grupo de parecidas y C5 no tiene grupo», con `contenido().fijarCategorias`;
   - problemas reservados aprobados y pendientes, con `itemDePrueba` más `reservado`.

   Para 3.6 y 3.7, los «Entonces» leen `revision.avisos` con `presente(...)`, así que los escenarios «no ve ningún aviso» también fallan hoy, y traducen el texto del aviso a datos con una expresión regular («bajo O1» es el `objetivo` del aviso). El aviso del mínimo no tiene objetivo, así que «no ve ningún aviso de problemas reservados» bajo O1 solo mira los de categoría.
3. **[DECISIÓN PENDIENTE] (4.12), antes de escribir sus pasos.** Los pasos «I7 tiene la marca «Reservado»» y «no tiene la marca «Reservado»» ya los define `pasos/revision.ts` con `MARCAS`, que no tiene «Reservado»: hoy fallarían por «no hay la marca» y nunca podrían pasar. Hay que decidir dónde ve la persona el «Reservado» en lo que devuelve `abrirRevision`. La propuesta: un `reservado?: boolean` en cada pieza de `grupos[].piezas` (`PiezaPendiente`), que no es una marca (las marcas las pone la aplicación, y el filtro de marcas no cambia). Si se acepta, `revision.ts` trata «Reservado» aparte de `MARCAS`, y los pasos de «quita/pone «Reservado» en I7 y guarda la corrección» llaman a `corregirPieza` con `{ ...inicial, reservado: false | true }`. La decisión se escribe en «### Reservados (etapa 3)».
4. Comprobar que cada escenario falla de verdad, ni pendiente, ni saltado, ni en verde: `ARNES_AREA=MATE npx cucumber-js --profile area --tags @MATE`, mirando el resultado de los 12.
5. `escenarios_en_rojo`: ejecutar la aceptación del área y apuntar los IDs de MATE que fallan, los 12 de arriba más los que ya tenían pasos y no aplicación. El dueño cree que estos son 2.1, 2.3, 2.5, 2.6, 2.7, 3.5, 4.11 y 5.5: hay que comprobarlo. Va en `config/alcance.json` en el mismo PR, como `"escenarios_en_rojo": {"MATE": [...]}`.
6. Arreglar el paso «que contenido\/borradores\/ficticio.json tiene la tarea {tarea}, pendiente, sin {texto}» de `tests/aceptacion/pasos/aprobacion.ts:180`: la frase tiene dos parámetros y el callback uno, y Cucumber da «function has 1 arguments, should have 2». Por eso falla un escenario de MATE-4.11 (lo vio el carril `ci`, fase impl, el 30-10-2026).
7. El comentario de `tests/aceptacion/pasos/borradores-en-sesiones.ts:35` nombra MATE-6.3, que pasa a `features/tareas.feature` con el ticket `mate-tarea-a-tare`. Cámbialo por una descripción sin ID, que no caduca sea cual sea el orden de los dos tickets.
