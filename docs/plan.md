# Plan del proyecto: aplicación de aprendizaje de novato a experto

Estado: **etapa 4 en curso** (DIAG terminada). Las decisiones de la etapa 2 (18-10-2026) y las de la interfaz, MATE y el diseño de módulos (20-10-2026) están aprobadas y resumidas en el §0.

Este documento es el plan de ingeniería. No es una fuente pedagógica:

- **Pedagogía.** Todo lo pedagógico sale de `docs/investigacion.md` (en adelante, «el informe»), y solo de ahí.
- **Ingeniería.** `docs/arnes.md` y `docs/arnes-verificacion.md` orientan cómo se construye el proyecto, pero nunca respaldan una decisión pedagógica.

**Está protegido.** Solo lo cambia el dueño, para que el plan siga siendo el contrato y no se reescriba para encajar con el código. Cuando el dueño aprueba algo nuevo, Claude le prepara una propuesta (un parche en `reports/propuestas/`, §6) y le da los comandos para aplicarla, revisarla y ejecutar `make sumas`.

---

## 0. Decisiones aprobadas

El dueño aprobó el 18-10-2026 todas las decisiones del §14 y todas las propuestas del §15, tal como se proponían. Esta tabla resume las que afectan a la especificación; el detalle de las técnicas está en el §14.

| Decisión | Qué se aprueba | Dónde se aplica |
|---|---|---|
| Prefijos de los IDs (§14.6) | `DIAG`, `PLAN`, `RECU`, `MAST`, `AYUD`, `INTE`, `CALI`, `TARE`, `BUCL`, `HORA` e `INST`. | `features/` (etapa 2) |
| Umbral para retirar la ayuda (§14.11) | Igual al umbral de dominio (0,85), marcado como extrapolación. | Ya está en `config/parametros.json` |
| Percentil de experto (§14.12) | <ul><li>La aplicación no calcula percentiles.</li><li>Registra con su fecha el resultado de un evaluador externo.</li><li>Exige 2 evaluaciones por encima del mínimo (80), separadas al menos 3 meses.</li></ul> | `TARE` (etapa 2) |
| Retención objetivo de FSRS (§15.1) | La que trae la librería por defecto. Se guarda como parámetro nuevo, con `extrapolacion: true` y la nota «el informe no lo trata». | `config/parametros.json` (etapa 2) |
| Respaldo del criterio de dominio (§15.3) | <ul><li>**Mecanismo:** «no avanzar sin dominar» se etiqueta `@evidencia-2.3`. Lo respalda Kulik et al. (1990) a través de la fuente [49], que es el PDF del propio estudio; el (†) solo indica que su DOI no se verificó.</li><li>**Umbral:** el 85 % se etiqueta `@extrapolacion`.</li></ul> | `MAST` (etapa 2) |
| Estimación del tiempo en el diagnóstico (§15.4) | <ul><li>El diagnóstico no muestra ningún plazo.</li><li>Un escenario negativo lo comprueba.</li></ul> | `DIAG` (etapa 2) |
| Intervalo de repaso (§15.5) | <ul><li>Tabla por horizonte con los datos de Cepeda 2008 (§2.2): 20–40 % para 1 semana y 5–10 % para 1 año.</li><li>Sustituye al rango fijo del 10–20 %.</li><li>Dónde se usa se concreta al escribir `PLAN`.</li></ul> | `config/parametros.json` y `PLAN` (etapa 2) |
| Reintroducir la ayuda (§15.2) | <ul><li>Se evalúa en el bucle semanal, con el mismo umbral (0,85).</li><li>Así la ayuda cambia como mucho una vez por semana y no oscila de un ítem a otro.</li><li>No hace falta otro número.</li></ul> | `AYUD` y `BUCL` (etapa 2) |
| Nivel de evidencia nuevo (§14.10) | «Extrapolación del autor», junto a los tres del informe. | `config/parametros.json` |
| FSRS (§14.13) | <ul><li>`ts-fsrs` en `src/infraestructura`, detrás de una interfaz del dominio.</li><li>Su instalación necesita otra aprobación: en la etapa 2 se presentan su licencia, su mantenimiento y su tamaño.</li></ul> | Etapa 2 (evaluación) y etapa 4 |
| Etapa 3 (§14.14) | Casos de uso vacíos en `src/aplicacion/` que lanzan «Sin implementar», en un commit de código aparte del de los steps. | Etapa 3 |
| Plan protegido (§14.15) | `docs/plan.md` entra en `.claude/protegidas.txt`, sin fase que lo desbloquee. | Ya aplicado |
| `npm audit` (§14.18) | Se ignoran por ahora los 2 avisos de `qs` (solo afectan al desarrollo); se revisan cuando salga una versión nueva de Stryker. | — |
| Formato del contenido (etapa 2) | <ul><li>JSON, un fichero por dominio en `contenido/<dominio>.json`, validado por la aplicación y sin dependencias.</li><li>Campos: `dominio`, `objetivos` (en orden de avance, con `instruccion` y `ejemplos_resueltos` con sus `pasos`), `categorias` (con `descripcion`, obligatoria desde el 24-10-2026, y `grupo_parecidas`), `items` (`objetivo`, `categoria`, `tipo` «hecho» o «problema», `diagnostico`, `enunciado`, `respuesta` con `opciones` + `correcta` o con `aceptadas`, y `feedback`) y `tareas` (con `rubrica`: criterios con sus niveles, y cada nivel con su descriptor).</li><li>Las `opciones` de un ítem son distintas después de normalizarlas como la corrección (espacios y mayúsculas); si no, elegir la repetida contaría como acierto (24-10-2026).</li><li>Un objetivo y cada ejemplo resuelto pueden llevar `diagrama` (24-10-2026): un SVG escrito como texto, que empieza por `<svg` y acaba en `</svg>`. La aplicación lo enseña siempre como imagen (`<img>`), así que no ejecuta sus scripts ni carga nada de fuera; un `diagrama` que no es SVG es un error de formato. Viene de la codificación dual (§3: «Diagramas integrados con el texto (no "por estilo")»), prometedora y sin metaanálisis verificado, y el campo es extrapolación. SVG y no Mermaid u otro lenguaje de diagramas porque no añade dependencias.</li><li>La corrección siempre es automática; nunca hay autoevaluación.</li><li>Las tareas no llevan `diagnostico`: las «tareas simples» del diagnóstico son ítems de tipo «problema».</li></ul> | Etapas 3 y 4 |
| Una persona por instalación (etapa 2) | Sin cuentas ni perfiles; varios dominios por instalación. | Toda la aplicación |
| Diagnóstico (etapa 2) | <ul><li>Solo los ítems marcados `diagnostico`, sin ayuda y sin pista del tipo.</li><li>Un objetivo con acierto ≥ umbral de dominio queda dominado y empieza sin ejemplos resueltos.</li><li>Puede situar directamente en «intermedio» o en «avanzado_experto», con la misma métrica que `MAST` (problemas de categorías intercalables sin pista del tipo).</li></ul> | `DIAG` |
| Acierto sin ayuda de un objetivo (etapa 2) | <ul><li>Fracción de sus ítems cuyo último intento fue correcto. Solo se evalúa cuando todos sus ítems tienen un intento.</li><li>Un intento es «sin ayuda» si, mientras se responde, no se ve ningún ejemplo resuelto ni la respuesta, aunque se haya estudiado un ejemplo justo antes (decisión del autor).</li><li>Un objetivo puede dejar de estar dominado si baja del umbral: vuelve a la cola de práctica, pero la fase no retrocede.</li><li>No cuenta el intento de exploración con el que empieza un objetivo nuevo en las fases intermedia y avanzada: el ítem sigue sin intento hasta que se responde otra vez (decisión del autor; 24-10-2026, «Lo que entra del informe»).</li></ul> | `MAST` |
| Fases (etapa 2) | <ul><li>De «novato» a «intermedio» cuando todos los objetivos están dominados.</li><li>De «intermedio» a «avanzado_experto» con un acierto ≥ `umbral_paso_a_avanzado` (0,85, extrapolación) en problemas intercalados sin pista del tipo.</li><li>El nivel experto lo deciden solo las evaluaciones externas.</li></ul> | `MAST`, `TARE` |
| Ayuda adaptativa (etapa 2) | <ul><li>Por objetivo: se alternan ejemplo resuelto y problema.</li><li>En el bucle semanal, con un acierto en problemas ≥ 0,85, se retira un paso más (se ocultan los últimos); por debajo, se devuelve uno; sin intentos, no cambia. Parámetro `pasos_retirados_por_ajuste` = 1 (extrapolación).</li></ul> | `AYUD`, `BUCL` |
| Planificador (etapa 2) | <ul><li>Los hechos los programa FSRS con las calificaciones Again/Good según la corrección; nunca Hard/Easy ni calificación de la persona.</li><li>Los problemas se repasan cada «fracción × horizonte»: la persona elige 1 semana o 1 año y se usa el punto medio del rango de Cepeda (30 % y 7,5 %), sin interpolar.</li><li>SM-2 se implementa con código propio en `src/dominio`, sin dependencias.</li></ul> | `PLAN` |
| ts-fsrs (etapa 2) | <ul><li>Aprobada: MIT, sin dependencias, unos 7,2 kB con gzip, un solo mantenedor activo.</li><li>La versión exacta se fija al instalarla en la etapa 4: la 6.0.x si lleva 2 semanas publicada y, si no, la 5.4.2.</li></ul> | Etapa 4 |
| Recuperación y feedback (etapa 2) | Después de cada respuesta, acierte o falle, se muestran si ha acertado, la respuesta correcta y el `feedback` del autor; nada dirigido a la persona. | `RECU` |
| Calibración (etapa 2) | Confianza 0–100 en cada ítem antes del feedback; el bucle muestra la diferencia media entre confianza y acierto; nunca afecta al progreso. | `CALI`, `BUCL` |
| Evaluación externa (etapa 2) | <ul><li>Se registran la fecha, la tarea, el nivel por criterio de la rúbrica, el percentil que da el evaluador y si fue a ciegas. Cada nivel de la rúbrica lleva un descriptor, que se muestra junto al nivel.</li><li>Para el nivel experto solo cuentan las evaluaciones a ciegas de tareas no practicadas en la aplicación; cada evaluación es de una tarea (el informe habla de una «batería»).</li><li>El resultado se presenta como «cumple la definición operativa», que es una convención propuesta.</li></ul> | `TARE` |
| Bucle semanal (etapa 2) | <ul><li>Se ejecuta en la primera sesión tras 7 días o más, sin bucles atrasados.</li><li>Paso 5: la persona escribe o confirma una intención «si X, entonces Y» y ve el recordatorio de no recortar sueño.</li></ul> | `BUCL` |
| Horas (etapa 2) | Registro manual de fecha y minutos de práctica focalizada; sin metas; nunca miden el progreso. | `HORA` |
| Instrumentación (etapa 2) | Un CSV por tipo de evento, con columnas fijas: `respuestas`, `cambios_ayuda`, `objetivos_dominados`, `cambios_fase`, `evaluaciones_externas` y `horas`. La columna `tras_ejemplo` de `respuestas` indica si la sesión mostró un ejemplo resuelto justo antes del ítem. | `INST` |
| Área `MATE` (20-10-2026) | Prefijo nuevo para el material del dominio y los borradores que redacta una IA (§17.6). | `features/` (fase specs) |
| Orden de la etapa 4 (20-10-2026) | Tras DIAG: RECU → MAST → MATE → PLAN → AYUD → INTE → CALI y HORA → TARE → BUCL → INST. | Etapa 4 |
| Borradores (20-10-2026; ejemplos, 24-10-2026) | <ul><li>Van en un fichero aparte, `contenido/borradores/<dominio>.json`, con el formato del contenido.</li><li>El motor solo lee `contenido/<dominio>.json`, así que un borrador nunca llega a una sesión.</li><li>Los ids no se repiten ni dentro del borrador ni entre los dos ficheros, sea cual sea el tipo de pieza: la revisión nombra cada pieza solo por su id (24-10-2026). En el contenido aprobado escrito a mano no se exige; sus piezas no llevan `fuente`, así que «Ver fuente» no se vuelve ambiguo.</li><li>Los ejemplos resueltos de un objetivo ya aprobado van en `ejemplos_resueltos` de la raíz, cada uno con su `objetivo`; los de un objetivo nuevo, dentro de él (etapa 3).</li></ul> | `MATE` |
| Campo `fuente` (20-10-2026; objetivos y categorías, 24-10-2026) | <ul><li>Opcional en objetivos, categorías, ítems, ejemplos resueltos y tareas. En un objetivo, cita de dónde sale su instrucción; en una categoría, dónde describe el material ese tipo de problema. Se conserva al aprobar, para que «Ver fuente» siga disponible.</li><li>Forma: `{documento, lugar, fragmento}`. `lugar` es la página, la diapositiva o el apartado, y `fragmento`, el texto citado tal cual.</li><li>El contenido escrito a mano no lo lleva.</li></ul> | Formato del contenido, `MATE` |
| Interfaz (20-10-2026) | Solo móvil; tema claro, oscuro o automático; Selawik; movimiento con muelles; vibración con interruptor; emparejamiento por QR (§17). | `src/interfaz/` |
| Inicio de sesión de Claude Code (20-10-2026) | Botón en Ajustes. Corta a los 5 minutos y tiene «Cancelar». La aplicación nunca guarda, registra ni muestra credenciales (§17.6). | `MATE` |
| Diseño de módulos (20-10-2026) | <ul><li>Antes del código de cada fichero nuevo de `src/`: el comentario de su interfaz y sus firmas, y al menos otra interfaz radicalmente distinta (*A Philosophy of Software Design*; `docs/arnes.md`, §6).</li><li>`revisor-codigo` busca además las 14 señales de alarma de Ousterhout y anota la deuda de diseño del código de áreas anteriores.</li><li>Esa deuda vive en `docs/deuda-diseno.md` (protegido). Al abrir cada área, el dueño elige qué partidas se pagan: al menos una o una línea con el porqué. Se pagan antes que el área, en un cambio que solo refactoriza.</li><li>ESLint prohíbe en `src/` una lista de nombres vagos (`id-denylist`).</li></ul> | Etapa 4, §7 y ESLint |
| Enrutador de modelos (24-10-2026) | <ul><li>En la etapa 4, la conversación principal escribe los comentarios de interfaz y las firmas, y encarga los cuerpos y los tests unitarios al subagente `implementador`.</li><li>El modelo de cada encargo lo elige un hook con una regla fija: Haiku si solo toca tests unitarios y como mucho un fichero del dominio, y Sonnet en los demás casos. Reencargar la misma tarea sube de Haiku a Sonnet; después de Sonnet, la hace la conversación principal.</li><li>Los revisores usan siempre el modelo de su cabecera.</li></ul> | Etapa 4, §5 y §7 |
| Especificación de `MATE` (24-10-2026) | <ul><li>**Sin IA no hay borradores:** si no hay ninguna configurada, la aplicación no los redacta y dice que se configura en Ajustes; añadir material y revisar los borradores que ya hay siguen disponibles. El proveedor por defecto se decide en el Mecanismo.</li><li>**Citas:** «tal cual» quiere decir igual salvo los espacios. Cada tramo seguido de espacios, tabuladores y saltos de línea cuenta como uno solo; una palabra, una tilde, una mayúscula o un signo distintos dan «Cita no encontrada». La herramienta que saca el texto se decide en el Mecanismo.</li><li>**URL:** al añadirla se guarda una copia de la página; las citas y «Ver fuente» usan esa copia aunque la página cambie o desaparezca.</li><li>**Corregir:** la pieza corregida sigue pendiente en el borrador y sus marcas se vuelven a calcular. Una corrección que la deja sin el formato del contenido no se guarda.</li><li>**Formato:** las piezas que la IA entrega sin el formato del contenido no entran en el borrador; la aplicación dice cuántas ha apartado y qué les falta.</li><li>En una sesión, «Ver fuente» no aparece hasta que la persona responde; entonces aparece junto al feedback.</li></ul> | `MATE` |
| Texto de un PDF (24-10-2026, §17.8) | <ul><li>`pdftotext -raw -enc UTF-8 - -`, de Poppler: un programa del PC, como LibreOffice, no una dependencia de npm. Separa las páginas con `\f`. Con `-raw` no une la palabra partida con guion a final de línea (MATE-3.4); en su modo por defecto, sí.</li><li>La aplicación lo llama con `node:child_process`, sin puerto: `Dependencias` no crece sin tocar `tests/aceptacion/soporte/mundo.ts`, así que los escenarios usan el `pdftotext` de verdad. Si falta, el material que hay que leer como PDF se rechaza con `falta_poppler`.</li><li>El texto se saca una sola vez, al añadir el documento, y se guarda página a página. Las citas y «Ver fuente» leen ese texto, no el PDF.</li><li>Descartados: código propio (sería una librería de PDF en miniatura) y `pdfjs-dist` (una dependencia de varios MB que da trozos de texto con posiciones, sin saltos de línea).</li></ul> | `MATE` |
| Texto de una página web (etapa 3; 24-10-2026) | <ul><li>Con código propio, sin dependencias: se quitan `script` y `style`, las etiquetas de bloque pasan a saltos de línea y se decodifican las entidades. Se lee con el `charset` del `Content-Type` o, si no lo trae, en UTF-8.</li><li>Una URL es una sola página, con `lugar` `'página web'`. Si la URL sirve un PDF, se trata como un PDF; cualquier otro tipo se rechaza.</li></ul> | `MATE` |
| Proveedor de IA por defecto (24-10-2026, §17.8) | <ul><li>La suscripción de Claude Code, con `claude -p`: el PDF se le pasa por su ruta, solo con la herramienta `Read`, con `--json-schema` del formato del contenido y con `--no-session-persistence`.</li><li>No hay ninguna clave que guardar, y el inicio de sesión ya lo construye MATE-8. A cambio, depende de que la CLI esté instalada y con la sesión iniciada, y gasta del límite de la suscripción.</li><li>Descartados: la API de Claude (hay que guardar una clave y se paga por uso) y un modelo local (lee peor los PDF largos).</li></ul> | `MATE` |
| Material guardado (24-10-2026, §17.8) | <ul><li>En `material/<dominio>/`, en la carpeta de datos, junto a `contenido/`: `indice.json` (el material en el orden en que se añadió, con las rutas de sus ficheros), los originales, los PDF convertidos, las copias de las URL (`web-<n>.html`) y los textos (`<nombre>.texto.json`, una cadena por página).</li><li>Fuera de git: son documentos con derechos de autor y apuntes personales. Dónde está la carpeta de datos se decide con el servidor.</li><li>Un fichero con el mismo nombre que otro ya añadido lo sustituye: las citas apuntan al documento por su nombre.</li></ul> | `MATE` |
| Adaptadores de `MATE` (24-10-2026, §17.8) | <ul><li>Los hace el área que monte el servidor: `Ficheros` en disco, `soffice --headless --convert-to pdf`, `fetch`, `claude -p`, `claude auth login` y `claude auth status --json`, y `setTimeout`.</li><li>Hasta entonces serían código muerto: la única entrada de `knip` en `src/` es `src/interfaz/servidor.ts`, que aún no existe. `MATE` hace `src/dominio` y `src/aplicacion`, que es lo que comprueban los escenarios.</li></ul> | `MATE` y el área del servidor |
| Reglas de `MATE` que la feature no cubre (24-10-2026) | <ul><li>Una pieza que cuelga de un objetivo aún pendiente no se aprueba antes que él, porque el contenido aprobado quedaría con un objetivo que no existe: se rechaza con `objetivo_pendiente`. Igual con un ítem cuya categoría está pendiente: `categoria_pendiente`.</li><li>La petición a la IA lleva los objetivos aprobados, con su id y su instrucción, las categorías aprobadas, con su id, su descripción y su grupo, para que pueda colgar piezas de ellos, y las tareas aprobadas, con su id y su enunciado y en su orden, para que pueda decir dónde va cada tarea nueva.</li><li>Si la IA entrega un id que ya está en el contenido aprobado o en el borrador, la aplicación le da el siguiente libre con el mismo prefijo. Las piezas de la misma entrega que lo citan, como los ítems de un objetivo o de una categoría nuevos o una tarea cuyo `antes_de` es una tarea nueva, cambian con él: si no, dos redacciones que crean «O4» dejarían los ítems de la segunda colgando del O4 de la primera.</li><li>Una corrección que deja un id repetido, como un ejemplo de dentro de un objetivo con el id de otra pieza, se rechaza con `campo` `id`.</li><li>Una corrección que hace colgar un ítem de un objetivo que no está ni en el borrador ni en el aprobado se rechaza con `campo` `objetivo`: el ítem nunca se podría aprobar. Igual con una categoría que no está en ninguno de los dos: `campo` `categoria`.</li><li>Una tarea del borrador puede llevar `antes_de`, con el id de la tarea que va justo detrás, aprobada o del borrador (T4, §17.6); sin él, va al final, como antes. El campo es solo del borrador y no pasa al contenido. Al aprobarla, entra delante de la primera tarea aprobada que se encuentra siguiendo los `antes_de`: si el suyo apunta a una tarea pendiente, se sigue el de esa. Si la cadena se corta antes de llegar a una aprobada, o vuelve a una tarea por la que ya ha pasado, va al final. Así da igual en qué orden se aprueben, y no hace falta rechazar nada.</li><li>Al descartar una tarea, las que llevaban `antes_de` hacia ella pasan a llevar el suyo, o ninguno si ella no lo llevaba: siguen en el mismo sitio de la cadena. Un `antes_de` de la IA que no está ni en el aprobado ni en la entrega se quita. Una corrección con un `antes_de` así, o que apunta a la propia tarea, se rechaza con `campo` `antes_de`.</li><li>«Ver fuente» enseña la página donde está el fragmento y, solo si no aparece, la que dice `lugar`: la IA puede contar las páginas impresas, que en un libro no coinciden con las del PDF.</li></ul> | `MATE` |
| Petición a la IA de `MATE` (24-10-2026) | <ul><li>El texto vive en `config/peticion-ia.md`, protegido con `@specs`: solo cambia en una conversación de especificación, y `revisor-evidencia` lo revisa.</li><li>La aplicación lo lee por `Dependencias` en cada redacción y lo manda tal cual, con el documento, los objetivos aprobados, las categorías aprobadas y las tareas aprobadas. Si falta, la redacción falla con un error claro.</li><li>Cada exigencia empieza por su id. Su origen está en el §17.6, no en el fichero.</li><li>Un test comprueba que el doble de `RedactorIa` recibe el texto sin cambios. Si la IA lo cumple lo juzga el dueño al revisar cada pieza.</li><li>Descartados: una constante en `src/`, que cambiaría en cualquier conversación de la etapa 4, y el adaptador, porque cada proveedor tendría su copia.</li></ul> | `MATE` |
| Categorías en el borrador (24-10-2026) | <ul><li>La IA redacta categorías como una pieza más del borrador: `{id, descripcion, grupo_parecidas?, fuente?}`, con sus marcas. En la revisión van en el grupo sin objetivo, con las tareas.</li><li>Sin ellas la IA no podría poner `categoria` con sentido, y un dominio hecho solo con borradores no llegaría al intercalado ni al paso a avanzado (MAST-6.2), que usan problemas de categorías intercalables.</li><li>El informe respalda el intercalado solo para discriminar categorías o problemas parecidos (§3); que juntar categorías que no se confunden reste es lectura del autor. Por eso la `descripcion` dice cómo reconocer la categoría y `grupo_parecidas` solo junta las que se confunden (C1 y C2, §17.6).</li></ul> | Formato del contenido, `MATE` |
| Comprobación y aprobación de los borradores (24-10-2026) | <ul><li>**Con reglas, sin IA:** las opciones repetidas son un error de formato (fila «Formato del contenido»); un ejemplo resuelto con menos de 2 pasos lleva la marca «Un solo paso»; `diagnostico` se pone a `false` en todo lo que entrega la IA.</li><li>La IA nunca marca `diagnostico`; lo marca el dueño al corregir. Con un solo documento la IA no sabe cuál es el núcleo conceptual del dominio, y un ítem trivial marcado haría que un novato diera el objetivo por dominado y empezara sin ejemplos resueltos.</li><li>**Solo el dueño, al leer cada pieza:** las demás exigencias del §17.6.</li><li>Se propusieron y no se adoptaron otras reglas: listas de palabras (elogios, autoexplicación), feedback igual a la respuesta, descriptores repetidos y grupos de una sola categoría.</li><li>Se quita «Aprobar las N sin marca». Que una pieza no tenga marca solo dice que su cita está en el documento, no que la pieza sea buena. Cada pieza se aprueba una a una; las marcas avisan, pero no impiden aprobar.</li></ul> | `MATE` |
| Cobertura del informe (24-10-2026) | <ul><li>`docs/cobertura-investigacion.md` tiene una fila por cada técnica del §3 del informe y por cada técnica, métrica e instrumento del §4. Cada fila dice qué regla de `features/` la cubre o por qué no.</li><li>Ninguna fila se queda sin decisión: está cubierta o por escribir, no se cubre por una decisión de este plan (deliberado o excluido), o espera a una decisión pendiente (la transferencia a casos nuevos y el feedback de la fase avanzada entre evaluaciones externas).</li><li>Quien cambia una feature o el informe actualiza sus filas en la misma conversación, y `revisor-evidencia` comprueba la tabla (§7).</li><li>El fichero no está protegido. Las razones de «deliberado» y «excluido» viven en este plan, y el revisor comprueba que estén.</li></ul> | `features/` (fase specs) y `revisor-evidencia` |
| Lo que entra del informe (24-10-2026) | <ul><li>**Instrucción explícita** (§4, fase 1: «instrucción explícita» y «evitar: descubrimiento sin guía»): la primera sesión de un objetivo no dominado muestra su instrucción antes de cualquier ejemplo; en la fase novato, también antes de cualquier problema. No se repite en las sesiones siguientes y nunca se ve mientras se responde. Un objetivo dominado en el diagnóstico no la muestra. La regla es extrapolación: el §2.3 la apoya en Kirschner (2006), marcado (†), que no puede sostener una decisión central (§15.6).</li><li>**Fracaso productivo** (§3, §2.3 y §4, fase 2): en las fases intermedia y avanzada, nunca en la de novato, la primera sesión de un objetivo nuevo empieza con uno de sus problemas, sin instrucción ni ejemplo, y justo después viene siempre la instrucción. Ese intento no cuenta para el dominio («Acierto sin ayuda»). El informe lo condiciona al conocimiento previo («no con novatos sin conocimientos activables»); aquí la señal es la fase, porque en las fases intermedia y avanzada todos los objetivos anteriores están dominados. Son extrapolación esa señal, la fase avanzada (el informe lo pone en la intermedia), «un problema» en lugar de 15–30 minutos y aplicarlo a los objetivos que llegan con `MATE`.</li><li>**Autoexplicación** (§3: «prometedor», [verificar]; §4, fase 2): en las fases intermedia y avanzada, tras la instrucción de un objetivo nuevo se pide explicar el porqué con sus palabras. No se corrige ni cuenta para nada, y se registra (decisión del autor). Nunca va sobre un ejemplo resuelto (AYUD-3; Barbieri et al., 2023, §2.2). El sitio exacto y la fase avanzada son extrapolación.</li><li>**Intercalado de un objetivo nuevo** (§3: «después de un aprendizaje inicial por bloques»; §4, fase 1: «evitar el intercalado prematuro»): en la fase intermedia, los problemas de un objetivo aún no dominado se practican por bloques, y se intercalan cuando queda dominado.</li><li>**Orden de la sesión:** en la fase novato, la instrucción y luego los ejemplos y los problemas. En las otras, el problema de exploración, la instrucción con su autoexplicación, y luego los ejemplos y los problemas. La secuencia entera es extrapolación: el §4 avisa de que usar todas las técnicas juntas no suma necesariamente sus efectos, y el §6 trata la «Aditividad».</li><li>**Tareas** (§4, fase 3: «tareas representativas cada vez más difíciles» y «lectura y producción a nivel de investigación o práctica profesional»): las tareas del contenido van de menos a más difícil, y la fase avanzada las presenta en ese orden. Algunas parten de un texto profesional real (un artículo, un caso, un informe) que hay que leer para producir el resultado. Partir de un texto profesional es extrapolación.</li><li>**Diagramas** (codificación dual, §3: prometedor, sin metaanálisis verificado): el `diagrama` del objetivo y de cada ejemplo resuelto se muestra junto al texto, nunca según un «estilo» de la persona. Es extrapolación. El contenido escrito a mano usa el mismo campo, sin imágenes en fichero aparte.</li><li>Lo que se le pide a la IA de `MATE` para las tareas y los diagramas (dónde va cada tarea, las tareas a partir de un texto profesional y el campo `diagrama`) está en el §17.6.</li><li>Los ids, los nombres de los campos y cómo se registran la autoexplicación y el intento de exploración se concretan al escribir las reglas.</li></ul> | `AYUD`, `MAST`, `INTE`, `TARE`, `INST`, formato del contenido y `MATE` (fase specs) |
| Lo que no entra del informe (24-10-2026) | <ul><li>**Ejercicio agudo:** el §3 lo deja como «complemento, no estrategia central», con evidencia «prometedor / discutido», y el §2.1 dice que «no es un acelerador sustancial de la pericia». El §6 avisa del sesgo de publicación y la potencia baja de esos estudios. El §4 no lo pone en ninguna fase ni en el bucle, aunque el §3 lo da para todas las fases.</li><li>**Siesta corta tras sesiones densas:** el §3 la sugiere, pero el §4 solo pide «proteger el sueño», que ya cubre el recordatorio del bucle semanal. La siesta (Leong 2022, marcado (†), §15.6) es evidencia de laboratorio.</li><li>**Producir la respuesta en vez de reconocerla** (efecto de generación): lo decide «No se prefiere la respuesta escrita» (§17.6, I8). El §2.2 añade que su aplicación a materias complejas no está directamente probada.</li><li>**Pendiente del feedback de la fase avanzada entre evaluaciones externas:** la tutoría paso a paso (el §3 pide «tutoría inteligente paso a paso o mentor»; la IA generativa como tutor no se revisó, según el §6, y llevarla aquí es decisión del autor); el feedback de expertos o de resultados reales más allá del evaluador externo; medir las tareas entre evaluaciones; la práctica centrada en los puntos débiles, y el análisis de errores.</li><li>**Pendiente de la transferencia a casos nuevos:** hoy el dominio, el paso a la fase avanzada y la retención se miden con los mismos ítems que se practican.</li><li>Ya tenían su razón en este plan: el intervalo de repaso por horizonte (§15.5), las «tareas simples» del diagnóstico como ítems de tipo «problema» («Formato del contenido»), no estimar el tiempo (§15.4) y no exigir el formato de la evaluación final (§17.6, I7).</li></ul> | — |

---

## 1. Principios y cómo se hacen cumplir

| Principio | Mecanismo que lo vigila |
|---|---|
| 1. Nada que no esté en el informe; si falta algo, se para y se pregunta. | <ul><li>Cada Feature, Rule y Scenario lleva una etiqueta de procedencia, `@evidencia-<sección>` o `@extrapolacion`, y `cobertura-ids` comprueba que la sección existe en el informe.</li><li>El subagente `revisor-evidencia` revisa el contenido.</li><li>Para preguntar, Claude termina su mensaje con la marca `[DECISIÓN PENDIENTE]` (§5).</li></ul> |
| 2. Las extrapolaciones viven en `config/parametros.json`, cada una con su valor, su sección, su nivel de evidencia y la marca `extrapolacion`. | <ul><li>`cobertura-ids` valida el fichero.</li><li>ESLint prohíbe los números sueltos en `src/` (salvo 0 y 1) y obliga a leer los umbrales del fichero de parámetros.</li><li>El fichero está protegido: solo se edita en la fase `specs`.</li></ul> |
| 3. No se implementa nada de la sección «Mitos» (§5 del informe). | `revisor-evidencia` tiene la lista de los 11 mitos, incluidas sus versiones disfrazadas, como las metas de horas o adaptar la enseñanza al «tipo de aprendiz». |
| 4. El progreso se mide solo por el rendimiento observado; la confianza declarada sirve solo para calibrar. | <ul><li>`revisor-evidencia`.</li><li>Escenarios negativos en la etapa 2: declarar mucha confianza no hace avanzar.</li></ul> |
| 5. La aplicación no inventa contenido del dominio. Lo aporta la persona: lo escribe ella o lo extrae una IA de su propio material, siempre citando de dónde sale, y nada entra en la práctica sin que la persona lo apruebe. | <ul><li>`revisor-evidencia` y `revisor-codigo`.</li><li>El dominio de prueba es ficticio y se carga como datos.</li><li>Los borradores viven en un fichero aparte y el motor solo lee el contenido aprobado.</li><li>La aplicación comprueba que cada cita aparece tal cual en su documento; si no, marca la pieza y no deja aprobarla en bloque.</li><li>Un escenario negativo de `MATE` comprueba que un borrador nunca aparece en una sesión.</li></ul> |
| 6. Las reglas se hacen cumplir con hooks, tests e integración continua. | <ul><li>Este documento.</li><li>No hay repositorio remoto, así que la integración continua es local por ahora (§14, decisión 16).</li></ul> |

---

## 2. Stack

He mantenido el stack por defecto que pediste, así que no hay desviaciones que justificar. Todas las versiones están fijadas de forma exacta (sin `^`) y `package-lock.json` va en el repositorio.

| Pieza | Elección | Por qué |
|---|---|---|
| Lenguaje | TypeScript 6.0.3 en modo estricto, ampliado: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noPropertyAccessFromIndexSignature`, `noUnused*`, etc. | Es lo que pediste. Las opciones extra cazan los errores típicos de quien empieza: índices que no existen o campos opcionales mal tratados. |
| Ejecución | Node 26 (tienes la 26.9.0), que ejecuta los `.ts` directamente (*type stripping*, con `erasableSyntaxOnly`). | Sin paso de compilación: lo que lees es lo que se ejecuta, y hay una herramienta menos que aprender. |
| Base de datos | **Propuesta:** `node:sqlite`, que viene con Node y no añade dependencias. | Antes de usarlo en la etapa 4 compruebo su nivel de estabilidad en Node 26. |
| Interfaz web local | **Propuesta:** `node:http` y HTML, CSS y JS sin framework. | No añade dependencias. Si la interfaz crece, lo replanteamos contigo. |
| Tests | Cucumber.js 13.3 (Gherkin en español), Vitest 5.0.5 y Stryker 10. | Es lo que pediste. |
| Sensores | ESLint 10.13 con typescript-eslint 8.71.2 (`strictTypeChecked`), jscpd 5.4.1, knip 6.42 y dependency-cruiser 18.6. | Es lo que pediste. |
| Formato | Prettier 3.9.10. | Lo usa el hook PostToolUse («formatea el fichero editado»). |
| Lectura de `.feature` | `@cucumber/gherkin` y `@cucumber/messages`, que ya venían con Cucumber. | Los usa el script de cobertura de IDs. Están declarados de forma explícita porque los scripts los importan directamente, y knip lo exige. |

Todas son dependencias de desarrollo. La aplicación todavía no tiene dependencias de ejecución.

---

## 3. Estructura del repositorio

```
config/
  parametros.json        extrapolaciones y umbrales, con su sección del informe (protegido, fase specs)
  alcance.json           áreas que aún no se implementan (protegido, solo el dueño)
contenido/
  <dominio>.json         contenido aprobado: lo único que lee el motor
  borradores/            borradores de MATE pendientes de revisar, un fichero por dominio
docs/
  investigacion.md       la única fuente pedagógica (protegido)
  arnes.md, arnes-verificacion.md   guía de ingeniería (protegidos)
  plan.md                este documento (protegido)
  deuda-diseno.md        deuda de diseño pendiente, que se paga al abrir cada área (protegido)
  areas/                 archivo de cada área de la etapa 4: mecanismo, interfaces descartadas,
                         deuda pagada, mutación y bloqueos (plantilla.md)
features/                Gherkin en español (etapa 2; protegido, fase specs)
src/
  dominio/               lógica pura: planificador, criterio de dominio, fases, ayuda, calibración
  aplicacion/            casos de uso; los steps de Cucumber solo hablan con esta capa
  infraestructura/       SQLite, reloj, ficheros; implementa las interfaces del dominio
  interfaz/              interfaz web local (punto de entrada: servidor.ts)
tests/
  aceptacion/            steps de Cucumber (etapa 3; protegido, fase aceptacion)
  unidad/                tests del dominio; cada uno cita el @ID que cubre
  arnes/                 tests del propio arnés (226 tests; protegido)
scripts/arnes/           scripts de make check, del pre-commit y de las sumas (protegido)
.claude/
  settings.json          hooks de Claude Code
  settings.local.json    fase de la próxima conversación, con su modelo y esfuerzo (make fase; fuera de git)
  hooks/                 código de los hooks
  agents/                subagentes revisor-evidencia, revisor-codigo e implementador
  protegidas.txt         rutas protegidas
  sumas.sha256           sumas de las rutas protegidas (las generas tú)
  registro-stop.jsonl    una línea por parada del hook Stop (fuera de git)
  registro-enrutador.jsonl  una línea por encargo al implementador o bloqueo suyo (fuera de git)
  registro-contexto.jsonl   una línea por cada tramo de contexto avisado (relevo; fuera de git)
.githooks/pre-commit     reglas de los commits
.vscode/tasks.json       tareas del dueño: fase de la próxima conversación y sumas (protegido)
CLAUDE.md                reglas de trabajo de Claude, entre ellas las propuestas (protegido)
```

Las carpetas `src/`, `features/`, `tests/aceptacion/` y `tests/unidad/` aún no existen. Se crean en las etapas 2 a 4.

---

## 4. `make check`

Los pasos se ejecutan en este orden. La ejecución se para en el primero que falla y dice cuál ha sido («✗ Falla el paso…»).

| # | Paso (`npm run …`) | Herramienta | Falla si… | Umbral |
|---|---|---|---|---|
| 1 | `tipos` | `tsc --noEmit` | hay cualquier error de tipos | `strict` y las opciones del §2 |
| 2 | `lint` | ESLint, a través de `scripts/arnes/lint.ts`, que añade a cada error una pista de cómo arreglarlo | hay cualquier error | Ver la tabla de abajo |
| 3 | `duplicacion` | jscpd | más del 1 % del código está duplicado | Bloques de al menos 50 tokens y 5 líneas |
| 4 | `codigo-muerto` | knip | hay ficheros, exports o dependencias sin usar | — |
| 5 | `capas` | dependency-cruiser | se rompe una regla de capas (ver abajo) | — |
| 6 | `unidad` | Vitest (`tests/unidad/` y `tests/arnes/`) | falla un test | — |
| 7 | `aceptacion` | Cucumber, en modo `strict` | un escenario falla, está pendiente o tiene pasos sin definir | Excluye las áreas de `config/alcance.json` |
| 8 | `cobertura-ids` | `scripts/arnes/cobertura-ids.ts` | Ver el §8 | — |
| 9 | `integridad` | `scripts/arnes/integridad.ts` | un fichero protegido no coincide con su suma, o el fichero de sumas no coincide con el del último commit | — |

**Reglas de ESLint**

- **Límites:**
  - complejidad ciclomática de 10 por función;
  - 40 líneas por función (sin contar las líneas en blanco ni los comentarios);
  - 3 parámetros por función;
  - 3 niveles de anidamiento;
  - 300 líneas por fichero;
  - 3 callbacks anidados.
- **Reglas de tipos:** `strictTypeChecked` y `stylisticTypeChecked` de typescript-eslint.
- **Sin silenciar nada:**
  - no vale ningún `// eslint-disable` (`noInlineConfig`);
  - no valen los comentarios que apagan otras herramientas: `jscpd:ignore`, `stryker disable`, `istanbul ignore`, `c8 ignore`, `v8 ignore`, ni las etiquetas JSDoc `@public`, `@internal`, `@beta` y `@alpha`, que knip respeta;
  - no valen `@ts-ignore`, `@ts-expect-error` ni `@ts-nocheck`.
- **En `src/`:**
  - no se permiten números sueltos, salvo 0 y 1;
  - los umbrales pedagógicos se leen de `config/parametros.json` y las constantes técnicas (los milisegundos de un día, por ejemplo) van en `src/dominio/unidades.ts`;
  - no se permite `console`;
  - no se permiten los nombres vagos de una lista (`datos`, `info`, `aux`, `tmp`, `objeto`…); la regla compara el nombre exacto, y el resto los señala `revisor-codigo`.
- **En los tests:** no se permite saltarse tests (`.skip`, `.only`, `.todo`, `.fails`, `.skipIf`, `.runIf`), y un step de Cucumber no puede devolver `"pending"` ni `"skipped"`.

En `tests/` no se aplica el límite de longitud por función, porque un `describe` agrupa muchos casos.

**Reglas de capas (dependency-cruiser)**

- `src/dominio` no importa otras capas, ni módulos de Node, ni paquetes de npm.
- `src/aplicacion` no importa ni infraestructura ni interfaz.
- `src/infraestructura` no importa la interfaz.
- `src/` no importa tests, scripts, hooks ni dependencias de desarrollo.
- El arnés (`scripts/`, los hooks y `tests/arnes/`) no importa `src/`.
- Los steps de Cucumber solo importan `src/aplicacion`.
- No se permiten dependencias circulares ni imports que no se puedan resolver.

**Variantes por fase**

| Objetivo | Fase | Pasos |
|---|---|---|
| `make check` | impl (por defecto) | Los 9 de la tabla |
| `make check-specs` | specs (etapa 2) | Del 1 al 6, `specs` (valida `features/`, sus frases vagas y los parámetros; §8) e `integridad` |
| `make check-aceptacion` | aceptacion (etapa 3) | Del 1 al 6, `specs`, `estado-aceptacion` (todos los escenarios en alcance deben fallar en rojo: ni pasar, ni quedar pendientes, ni tener pasos sin definir) e `integridad` |
| `make check-implementador` | impl, la del subagente `implementador` (§7) | Del 1 al 6 salvo `codigo-muerto`: cuando devuelve su encargo, la aplicación aún no usa las funciones nuevas del dominio. El resto lo exige después el hook Stop a la conversación principal |

Fuera de `make check` hay cinco objetivos más:

- `make mutacion` (§9);
- `make sumas` (§6), que solo puedes ejecutar tú;
- `make fase F=<fase>` (§6), que también es solo tuyo: fija la fase de la próxima conversación;
- `make bloqueos A=<ÁREA>` (§5), que resume las paradas del hook Stop de un área para su archivo;
- `make formatear`.

`make fase` y `make sumas` también se lanzan desde VS Code, con las tareas de `.vscode/tasks.json` (Ctrl+Shift+P → «Tasks: Run Task»).

---

## 5. Hooks de Claude Code

Están en `.claude/settings.json`:

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "hooks": {
    "SessionStart": [
      {
        "hooks": [{ "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/anunciar-fase.ts\"", "timeout": 30 }]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit|NotebookEdit|Bash",
        "hooks": [{ "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/proteger-rutas.ts\"", "timeout": 30 }]
      },
      {
        "matcher": "Bash",
        "hooks": [{ "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/vigilar-huellas.ts\"", "timeout": 30 }]
      },
      {
        "matcher": "Agent",
        "hooks": [{ "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/enrutar-modelo.ts\"", "timeout": 30 }]
      },
      {
        "matcher": "Read",
        "hooks": [{ "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/indice-markdown.ts\"", "timeout": 30 }]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit",
        "hooks": [{ "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/formatear-y-lintear.ts\"", "timeout": 120 }]
      },
      {
        "matcher": "Bash",
        "hooks": [{ "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/vigilar-huellas.ts\"", "timeout": 30 }]
      },
      {
        "matcher": "*",
        "hooks": [{ "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/vigilar-contexto.ts\"", "timeout": 30 }]
      }
    ],
    "PostToolUseFailure": [
      {
        "matcher": "Bash",
        "hooks": [{ "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/vigilar-huellas.ts\"", "timeout": 30 }]
      }
    ],
    "Stop": [
      {
        "hooks": [{ "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/exigir-check.ts\"", "timeout": 600 }]
      }
    ],
    "SubagentStop": [
      {
        "matcher": "implementador",
        "hooks": [{ "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/exigir-check-implementador.ts\"", "timeout": 600 }]
      }
    ],
    "ConfigChange": [
      {
        "matcher": "user_settings|project_settings|local_settings",
        "hooks": [{ "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/bloquear-config.ts\"", "timeout": 30 }]
      }
    ]
  }
}
```

### SessionStart: `anunciar-fase.ts`

Al empezar cada conversación (y al reanudarla, limpiarla o compactarla), dice en qué fase está:

- **A ti**, con un aviso de una línea: la fase con su modelo y su esfuerzo (§6), la comprobación que exigirá el hook Stop, las áreas en alcance y las que tienen un relevo pendiente. Así compruebas que la fase que elegiste con `make fase` ha llegado a los hooks. Si la conversación usa otro modelo que el de la fase, el aviso lo dice y te recuerda `/model`; si Claude Code no envía el modelo, no hay aviso.
- **A Claude**, como contexto: además, para qué sirve la fase y qué rutas protegidas desbloquea. Si hay un relevo pendiente, que lea la sección «## Relevo» del área antes de nada y la borre.

### PreToolUse: `proteger-rutas.ts`

**En Edit, Write, MultiEdit y NotebookEdit,** resuelve la ruta real del fichero (siguiendo los enlaces simbólicos, también a directorios, y los `..`) y la bloquea si cae en:

- una ruta de `.claude/protegidas.txt`, salvo que la fase la desbloquee;
- `.git/`;
- `~/.claude/`, salvo la memoria de un proyecto y los planes del modo plan (`~/.claude/plans/`).

**En Bash,** no busca las rutas protegidas en el texto del comando: un comando puede nombrarlas para leerlas (`cat`, `grep`, `git diff`…). Lo que cambie en ellas lo deshace `vigilar-huellas.ts`. Solo bloquea el comando si:

- **Nombra `~/.claude/`** (como `~`, `$HOME`, `${HOME}` o la ruta absoluta), salvo `projects/` y `plans/`.
- **Intenta saltarse el arnés:**
  - `git commit --no-verify` o `-n`;
  - cambiar `core.hooksPath`;
  - tocar la variable `CLAUDECODE` (`env -u`, `env -i`, `CLAUDECODE=`);
  - fijar `ARNES_FASE`;
  - `disableAllHooks`;
  - aplicar un parche (`git apply`, `git am`, `patch`): las propuestas las aplicas tú (§6);
  - instalar o quitar dependencias (`npm|pnpm|yarn install/i/add/remove/update…`);
  - nombrar `.git/`, donde están los hooks de git y las copias de las huellas.

El mensaje de bloqueo de una ruta protegida le recuerda a Claude cómo se cambia: con una propuesta y tus comandos, nunca pidiéndote que la edites a mano.

### PreToolUse, PostToolUse y PostToolUseFailure en Bash: `vigilar-huellas.ts`

Vigila los comandos Bash por su efecto, no por su texto (`scripts/arnes/comun/huellas.ts`):

1. **Antes del comando** guarda la huella (sha256) de cada fichero protegido que la fase no desbloquea, más `.claude/sumas.sha256` y `.claude/settings.local.json`. Guarda también una copia de cada contenido en `.git/arnes-huellas/copias/`, con la suma como nombre: un contenido ya copiado no se vuelve a copiar.
2. **Después del comando**, haya acabado bien (PostToolUse) o con error (PostToolUseFailure), vuelve a calcular las huellas y deshace lo que haya cambiado:
   - un fichero cambiado o borrado vuelve a ser la copia de antes del comando;
   - un fichero nuevo dentro de un directorio protegido se quita.
3. **La versión que dejó el comando** se aparta en `reports/huellas/<fecha y hora UTC>-<id del comando>/`, con la misma ruta. Se avisa a ti (`systemMessage`) y a Claude (`additionalContext`), y a Claude se le recuerda cómo se cambia una ruta protegida: con una propuesta.

Restaura desde la copia, no desde git: un `git add` o un `git checkout` del comando no cambia lo que se restaura.

En `.claude/settings.local.json` solo cuenta lo que toca al arnés: `env` (la fase), `hooks` y `disableAllHooks`. Claude Code guarda ahí los permisos que aceptas con «Allow always», a veces mientras corre un comando, y esos se quedan.

Cada hook tarda unos 100 ms.

### PreToolUse en Agent: `enrutar-modelo.ts`

Elige el modelo de cada subagente con una regla fija (`scripts/arnes/comun/enrutador.ts`), en vez de dejar que lo elija Claude:

- **`implementador`:** lee las líneas `Tarea:` y `Ficheros:` del encargo (§7) y fija el modelo:
  - Haiku, si el encargo solo toca `tests/unidad/` y como mucho un fichero de `src/dominio/`: funciones puras con la interfaz ya escrita;
  - Sonnet, en los demás casos (`src/aplicacion/` o varios ficheros del dominio).

  Si la misma conversación vuelve a encargar la misma tarea, es que el encargo anterior no salió bien, y sube un escalón: de Haiku a Sonnet. Después de Sonnet no hay más: el encargo se bloquea, y Claude hace la tarea él mismo o para con `[DECISIÓN PENDIENTE]`. También se bloquea un encargo fuera de la fase impl, sin las dos líneas o con rutas fuera de `src/` y `tests/unidad/`.
- **`revisor-codigo` y `revisor-evidencia`:** les quita el modelo y el esfuerzo que pase Claude, para que valgan los de su cabecera.
- **Los demás subagentes,** si Claude no les da modelo: Haiku a los de búsqueda (`Explore` y `claude-code-guide`) y Sonnet al resto (`general-purpose`, `Plan`…). Así ningún subagente hereda Opus de la conversación sin que lo veas: el aviso dice qué modelo le ha tocado. Si Claude pasa un modelo, se respeta. Los forks (`subagent_type: "fork"`) siguen con el de la conversación, porque comparten su contexto.

Cada encargo al implementador queda en `.claude/registro-enrutador.jsonl` (fuera de git): la conversación, la tarea, el modelo y los ficheros. De ahí sale la escalera.

### PreToolUse en Read: `indice-markdown.ts`

Un Markdown largo leído entero llena el contexto de golpe, y cada llamada siguiente lo vuelve a pagar. Si Claude intenta leer entero un `.md` del repositorio de más de 200 líneas (sin `limit`, o con uno mayor de 200), el hook bloquea la lectura y le devuelve el índice de encabezados con el rango de líneas de cada sección (`scripts/arnes/comun/indice-markdown.ts`). Con él, Claude busca con Grep o lee solo la sección que necesita, con `offset` y `limit`. Cubre `docs/plan.md`, `docs/investigacion.md`, `docs/arnes.md`, `docs/arnes-verificacion.md` y cualquier otro que crezca. Los encabezados dentro de un bloque de código no cuentan.

### PostToolUse: `formatear-y-lintear.ts`

Formatea con Prettier el fichero que se acaba de editar y le pasa ESLint. Si hay errores, se los devuelve a Claude con la pista de cómo arreglarlos.

### PostToolUse en todas las herramientas: `vigilar-contexto.ts` (relevo)

En cada llamada, el modelo vuelve a leer el contexto entero de la conversación, así que una conversación larga encarece cada paso. En vez de compactar, el trabajo se pasa a una conversación nueva (`scripts/arnes/comun/relevo.ts`):

1. Después de cada herramienta, el hook lee del transcript de Claude Code el tamaño del contexto de la última llamada: los tokens de entrada más los de la caché.
2. Al pasar de **120 k tokens**, te avisa a ti y le pide a Claude que acabe el paso en curso sin empezar otro, apunte el estado al final de `docs/areas/<ÁREA>.md` en una sección «## Relevo» (qué está hecho, qué falta, el paso siguiente y los ficheros que hay que leer primero) y termine con `[RELEVO]`. Si la conversación no trabaja en un área, el relevo va en su mensaje final. El aviso se repite cada 20 k tokens más.
3. Abres una conversación nueva. El aviso de inicio te dice qué área tiene el relevo, y Claude lee la sección y la borra.

Los subagentes no cuentan: tienen su propio contexto. El último tramo avisado de cada conversación queda en `.claude/registro-contexto.jsonl` (fuera de git), para no repetir el aviso en cada herramienta.

### Stop: `exigir-check.ts`

Ejecuta la comprobación de la fase (`check`, `check-specs` o `check-aceptacion`). Si falla, no deja a Claude terminar el turno y le pasa las últimas 150 líneas de la salida.

Hay una excepción: si el último mensaje de Claude contiene `[DECISIÓN PENDIENTE]`, puede parar para preguntarte. Entonces ves el aviso «la comprobación no se ha ejecutado».

El mensaje del bloqueo cambia según el fallo (`scripts/arnes/comun/freno-stop.ts`):

- **Error del entorno.** Si la salida contiene `EADDRINUSE` (puerto ocupado), `EACCES` (permisos), `ENOSPC` (disco lleno o límite de ficheros vigilados) o «command not found», le dice que no es su código: que no lo toque, te dé el comando que lo arreglaría y pare con `[DECISIÓN PENDIENTE]`.
- **Falla `integridad`.** Las sumas son tuyas: para y te da los comandos.
- **Freno.** En el tercer bloqueo seguido del mismo paso en la misma conversación, le pide que deje de probar arreglos y escriba en una frase el mecanismo exacto del fallo. Si la causa está en la especificación, el arnés o el entorno, para con `[DECISIÓN PENDIENTE]`.
- **Cualquier otro fallo:** que arregle la causa, no la comprobación.

**Espera.** Si quedan subagentes trabajando en segundo plano, como el implementador, no comprueba nada, porque vería sus ficheros a medio escribir; ves el aviso «Claude espera a N subagente(s)». Claude Code despierta a Claude cuando terminan, y el hook se ejecuta de nuevo al parar. Las esperas no se anotan en el registro.

**Relevo.** Si el último mensaje de Claude contiene `[RELEVO]` y el contexto pasa de 120 k tokens, Claude para sin la comprobación y ves el aviso «Claude ha parado con [RELEVO]». Por debajo del umbral, la marca no cuenta: el hook sigue como siempre y, si bloquea, le explica a Claude por qué no ha podido parar.

**Sin cambios.** Si el árbol de trabajo no difiere del último commit (`git status` no muestra nada), no hay trabajo que comprobar: la conversación ha sido una consulta, o ya has commiteado lo que había. Claude para sin ejecutar make y ves el aviso «Sin cambios respecto al último commit». Exigirle la comprobación lo empujaría a trabajar en una etapa que nadie le ha pedido. Estas paradas tampoco se anotan.

Cada parada queda en `.claude/registro-stop.jsonl` (fuera de git): la conversación (`session_id`), la fase, el resultado, el paso que falla y las áreas fuera de alcance en ese momento. De ahí salen la cuenta del freno y `make bloqueos A=<ÁREA>`, que resume las paradas de la fase impl mientras el área estaba en curso.

### SubagentStop: `exigir-check-implementador.ts`

Solo para el subagente `implementador`. Ejecuta `make check-implementador` y, si falla, no le deja devolver el encargo y le pasa las últimas 150 líneas de la salida (`scripts/arnes/comun/freno-stop.ts`):

- Si su último mensaje contiene `[DECISIÓN PENDIENTE]`, lo devuelve sin comprobar, y decide la conversación principal.
- Si el fallo es del entorno, le dice que no toque nada y lo devuelva con `[DECISIÓN PENDIENTE]`.
- En el segundo bloqueo, le pide que escriba en una frase el mecanismo del fallo. Al tercer fallo lo deja devolver el encargo en rojo (ves el aviso), y la conversación principal lo reencarga, con un modelo más capaz, o lo termina ella.

Cada bloqueo queda en `.claude/registro-enrutador.jsonl`.

### ConfigChange: `bloquear-config.ts`

Impide que se cambie la configuración de Claude Code (la del usuario, la del proyecto o la local) durante la conversación, para que nadie pueda desactivar los hooks en caliente. Por eso `make fase` solo afecta a las conversaciones que abras después.

**Si un hook falla** por un error propio, lo trata como un bloqueo (código de salida 2); nunca deja pasar.

---

## 6. Rutas protegidas, fases y sumas

**Rutas** (`.claude/protegidas.txt`):

- los cinco documentos de `docs/`, incluidos este plan y la deuda de diseño;
- `features/` (fase `specs`);
- `config/parametros.json` (fase `specs`);
- `config/alcance.json`;
- `tests/aceptacion/` (fase `aceptacion`);
- la configuración de todas las herramientas (ESLint, jscpd, knip, dependency-cruiser, Stryker, Cucumber, Vitest, TypeScript, Prettier), además de `.gitignore`, `package.json`, `package-lock.json` y `Makefile`;
- el arnés: `.githooks/`, `scripts/arnes/`, `tests/arnes/`, `.claude/`, `.vscode/tasks.json` y `CLAUDE.md`.

**Fases.** Las eliges tú antes de abrir la conversación; Claude no puede cambiarlas:

1. En VS Code, Ctrl+Shift+P → «Tasks: Run Task» → «Arnés: fase de la próxima conversación», y eliges la fase. Desde un terminal es lo mismo: `make fase F=specs`.
2. La fase se guarda en `.claude/settings.local.json` (`env.ARNES_FASE`), que está fuera de git. Claude Code pasa esa variable a los hooks. Con ella se guardan el modelo y el esfuerzo con que empieza la conversación (`model` y `effortLevel`): Sonnet con esfuerzo `high` en specs y aceptacion, que escriben specs y steps, y Opus con esfuerzo `xhigh` en impl, donde están el «Mecanismo» y el diseño (`MODELO_POR_FASE` en `scripts/arnes/comun/fases.ts`). Puedes cambiarlos durante la conversación con `/model` y `/effort`.
3. Abres una conversación nueva de Claude Code. El aviso de `anunciar-fase.ts` te confirma la fase al empezar. Las conversaciones que ya estaban abiertas siguen en la suya.

| Fase | Desbloquea | Comprobación en Stop |
|---|---|---|
| impl (por defecto) | — | `make check` |
| specs | `features/` y `config/parametros.json` | `make check-specs` |
| aceptacion | `tests/aceptacion/` | `make check-aceptacion` |

Al terminar una etapa 2 o 3, vuelve a `impl` antes de abrir la siguiente conversación.

**Sumas**

- `.claude/sumas.sha256` tiene el formato de `sha256sum` y una línea por cada fichero protegido; en un directorio protegido cuenta cada fichero que git no ignora.
- El paso `integridad` falla si un fichero ha cambiado o falta, si hay un fichero protegido nuevo sin suma, o si el propio fichero de sumas difiere del último commit.
- En las fases `specs` y `aceptacion` no se vigila lo que esa fase desbloquea.

**Cómo actualizas las sumas.** Como dijiste, «Solo yo actualizo las sumas»:

1. Aplicas una propuesta que cambia un fichero protegido, o revisas lo que ha escrito Claude en una fase.
2. Desde tu terminal o la tarea «Arnés: actualizar sumas», no desde Claude Code, ejecutas `make sumas`. El script se niega a ejecutarse si detecta Claude Code (`CLAUDECODE`) o si no hay un terminal interactivo. Te muestra qué ha cambiado.
3. Commiteas el cambio y las sumas juntos. El pre-commit comprueba que coinciden.

**Propuestas.** Regla dura (`CLAUDE.md`): cuando hay que cambiar algo que Claude no puede tocar (una ruta protegida, las sumas, la fase, un commit), Claude no te pide que lo edites a mano. Te da los comandos exactos, listos para copiar. Si el cambio es de ficheros protegidos:

1. Claude clona el repositorio fuera de él (en su directorio temporal), hace allí los cambios y comprueba lo que pueda.
2. Guarda el parche en `reports/propuestas/<AAAA-MM-DD>-<tema>.patch` (fuera de git) y para con `[DECISIÓN PENDIENTE]`.
3. Tú lo aplicas. `--3way` deja los cambios preparados («Cambios preparados» en el panel de control de código fuente de VS Code), y ahí los revisas:

   ```sh
   git apply --3way reports/propuestas/<AAAA-MM-DD>-<tema>.patch
   ```

4. Si te convence, actualizas las sumas, commiteas con el mensaje que te propone Claude y compruebas. `make check` va después del commit porque `integridad` compara las sumas con las del último commit:

   ```sh
   make sumas
   git add .claude/sumas.sha256
   git commit -m "<mensaje que propone Claude>"
   make check
   ```

5. Si no te convence, lo deshaces. Antes del commit:

   ```sh
   git apply -R --index reports/propuestas/<AAAA-MM-DD>-<tema>.patch
   git restore --source=HEAD --staged --worktree .claude/sumas.sha256
   ```

   Después del commit: `git revert --no-edit HEAD`.

Claude no puede aplicar el parche él mismo: la guardia bloquea `git apply`, `git am` y `patch` (§5).

---

## 7. Subagentes

Hay tres. Los dos revisores son de solo lectura: solo tienen Read, Grep y Glob. Usan Sonnet con esfuerzo alto (`effort: high`), porque su trabajo es leer mucho y razonar sobre lo que no ven las herramientas. El tercero, el implementador, escribe código.

**`revisor-evidencia`**

- **Qué revisa:** `features/`, `config/parametros.json`, `config/peticion-ia.md`, los textos y valores por defecto de `src/` y, en la dirección contraria, la tabla de cobertura del informe (`docs/cobertura-investigacion.md`, §0).
- **Cómo:** lee el informe entero, en tramos de 200 líneas porque el hook de los Markdown largos también vigila a los subagentes, y cita la sección y la frase exacta. Nunca cita `docs/arnes*.md` como evidencia.
- **Qué señala:**
  - afirmaciones sin respaldo;
  - extrapolaciones sin marcar;
  - etiquetas de procedencia equivocadas;
  - rastros de cualquiera de los 11 mitos;
  - progreso medido por autoevaluación;
  - promesas prohibidas;
  - decisiones centrales apoyadas en citas (†) o [verificar];
  - combinaciones desaconsejadas: ejemplos resueltos con autoexplicación (Barbieri), e intercalado fuera de sus límites;
  - huecos de cobertura: una recomendación del informe sin fila o sin decisión, un id que no existe o no hace lo que dice la fila, o una exclusión sin su razón en el plan;
  - filas de la tabla de cobertura que se han quedado desactualizadas.
- **Qué entrega:** un veredicto y una tabla con la gravedad (grave, media o leve), dónde está el problema, qué dice el texto, qué dice el informe y una propuesta. Si el informe no trata algo, lo dice así. Ante un hueco de cobertura no propone la regla: la decide el dueño.

**`revisor-codigo`**

- **Qué señala:** duplicación que jscpd no ve, modularidad, simplicidad, código muerto o especulativo, sobreingeniería, tests débiles, valores escritos a mano y las 14 señales de alarma de *A Philosophy of Software Design* (`docs/arnes.md`, §6). Pregunta además si un error o un caso especial podría no existir, si quien llama hace un trabajo que el módulo debería esconder y si alguna división solo existe para cumplir los límites de ESLint.
- **Contexto que tiene en cuenta:** las cuatro capas, que el dueño está aprendiendo TypeScript y la deuda ya anotada en `docs/deuda-diseno.md`.
- **Qué entrega:** una tabla con prioridad alta, media o baja para el código del área y, al final, la deuda de diseño del código de áreas anteriores, con su señal de alarma, dónde está, una propuesta y su tamaño. Sin comentarios de estilo y sin proponer dependencias nuevas.

**`implementador`**

- **Qué hace:** escribe los cuerpos y los tests unitarios de un encargo cuyo diseño ya ha decidido la conversación principal: el comentario de la interfaz y las firmas. No cambia las firmas, no toca ficheros fuera del encargo ni rutas protegidas, y no puede lanzar otros subagentes.
- **Herramientas:** Read, Grep, Glob, Edit, Write y Bash, sin Agent. Los hooks de la conversación principal también vigilan las suyas.
- **Encargo:** el prompt lleva estas dos líneas, con las que el hook `enrutar-modelo.ts` elige el modelo (§5):

  ```text
  Tarea: MAST-3
  Ficheros: src/dominio/criterio-dominio.ts, tests/unidad/criterio-dominio.test.ts
  ```

  Cada tarea nueva lleva un número nuevo; repetir uno es reencargar esa tarea, y sube el modelo. Un encargo cada vez: la conversación principal espera a que termine antes de tocar sus ficheros.
- **Modelo:** Haiku o Sonnet, según la regla del §5; nunca lo elige Claude. La conversación principal sigue con el modelo con el que la abriste (el de la fase, §6), y los demás subagentes van a Haiku o a Sonnet si Claude no les da modelo (§5).
- **Qué entrega:** «VERDE» o «ROJO», los ficheros que ha tocado y sus dudas. Lo devuelve con `make check-implementador` en verde, o en rojo tras dos bloqueos del hook SubagentStop (§5).

**Cuándo se ejecutan:**

- `revisor-evidencia`, al final de la etapa 2;
- los dos revisores, al cerrar cada área de la etapa 4;
- el implementador, en cada encargo de los pasos 3 y 4 de la etapa 4.

---

## 8. Script de cobertura de IDs (`cobertura-ids`)

**Forma de los IDs:**

| Elemento | ID |
|---|---|
| Característica (Feature) | `@MAST` |
| Regla (Rule) | `@MAST-1` |
| Escenario o esquema (Scenario, Scenario Outline) | `@MAST-1.1` |

Las normas:

- cada elemento lleva exactamente un ID;
- el ID sigue la jerarquía de su padre;
- no hay IDs repetidos.

**Procedencia.** Cada elemento lleva `@evidencia-<sección>` o `@extrapolacion`. La sección tiene que existir en el informe: 2.1 a 2.6, 3, 4, 5 o 6.

**Citas.** El código cita un escenario escribiendo su ID (`@MAST-1.1`) en un comentario o en el nombre de un test:

- **Cuentan como implementación:** las citas en `src/` y en `tests/unidad/`.
- **No cuentan:** las citas en `tests/aceptacion/`.

**Falla si…**

- un escenario en alcance no pasa en Cucumber; lo lee de `reports/cucumber.ndjson`, un Scenario Outline toma el peor estado de sus ejemplos y los reintentos se ignoran;
- un escenario en alcance no tiene implementación;
- el código o los tests citan un ID que no existe;
- `config/parametros.json` no es válido: falta la sección, el nivel de evidencia o la marca `extrapolacion`, o hay un campo desconocido;
- un paso de resultado (`Entonces`, y los `Y` o `Pero` que lo siguen) usa una frase vaga: «correctamente», «funciona», «como se espera», «adecuado», «sin errores», «rápido», «etc.», «y/o», «los datos»… La lista, con el porqué de cada una, está en `scripts/arnes/comun/frases-vagas.ts`. Los `Dado` y los `Cuando` no se miran, porque ahí la misma palabra describe la situación, no lo que se comprueba. Esta norma también la aplica el paso `specs`.

**Qué muestra:** una tabla con las columnas `ID | TIPO | PROCEDENCIA | ESTADO | CITAS`.

**`config/alcance.json`**

- `areas_fuera_de_alcance` lista los prefijos que aún no se implementan, por ejemplo `["AYUD", "INTE"]`.
- Cucumber los excluye por etiqueta y la tabla los marca como `FUERA_DE_ALCANCE`.
- Así `make check` puede estar en verde mientras se avanza área por área en la etapa 4.
- Solo lo cambias tú.

---

## 9. Mutation testing (`make mutacion`)

- **Qué hace:** ejecuta Stryker 10 con Vitest sobre `src/dominio/**`, de forma incremental. El informe sale en `reports/mutacion/index.html`.
- **Umbrales:**
  - alto, 80 %;
  - bajo, 60 %;
  - **falla por debajo del 60 %**.
- **Por qué no está en `make check`:** es lento.

---

## 10. Pre-commit (`.githooks/pre-commit`)

Se activa con `npm ci`: el script `prepare` ejecuta `git config core.hooksPath .githooks`. Rechaza el commit si:

1. **Mezcla especificación y código.** Especificación es `features/`, `tests/aceptacion/` y `config/`; código es `src/` y `tests/unidad/`. El resto (docs, arnés) puede ir con cualquiera de los dos.
2. **Claude Code intenta commitear un fichero protegido** (lo detecta por la variable `CLAUDECODE`).
3. **Un fichero protegido no coincide con las sumas** que van en el mismo commit, o faltan las sumas.

---

## 11. Defensa en profundidad y límites honestos

**Capas, de la primera a la última:**

1. **Guardia textual de Bash.** Bloquea los atajos para saltarse el arnés, también aplicar un parche (las propuestas las aplicas tú), y los comandos que nombran `.git/` o `~/.claude/`.
2. **Huellas de Bash.** Lo que un comando cambie en las rutas protegidas vuelve a como estaba al acabar el comando, sin depender de cómo esté escrito.
3. **Guardia de ficheros.** Resuelve la ruta real, así que los enlaces simbólicos y los `..` no sirven para colarse.
4. **Sumas sha256** de todo lo protegido, en cada `make check`.
5. **Comparación del fichero de sumas con el último commit.** Recalcular las sumas no basta para ocultar un cambio.
6. **`make sumas` se niega a ejecutarse** dentro de Claude Code o sin un terminal interactivo.
7. **Pre-commit:** separa la especificación del código, comprueba la autoría de los ficheros protegidos y comprueba las sumas.
8. **ConfigChange:** los hooks no se cambian en caliente.
9. **Tu revisión del diff antes de cada commit.**

**Límites que conviene conocer:**

- **La guardia de Bash es textual.** Un comando ofuscado (una ruta construida por partes, en base64 o en variables) puede llegar a `.git/` o a `~/.claude/`, también a las copias de las huellas. Por eso existen las capas 4, 5, 8 y 9: lo que no se bloquea, se detecta. Las rutas protegidas del repositorio ya no dependen del texto: las vigilan las huellas.
- **Las huellas deshacen, no impiden.** Mientras dura el comando, el cambio existe, y el propio comando puede usarlo: por ejemplo, relajar `eslint.config.js` y pasar el lint en la misma línea. Por eso el hook Stop ejecuta `make check` cuando todo ya está restaurado, y lo que el comando deje fuera de las rutas protegidas lo ve tu revisión.
- **Las huellas no ven los comandos en segundo plano ni los cancelados.** Un comando en segundo plano sigue trabajando después de PostToolUse, y uno cancelado no dispara ningún hook Post. Lo que cambien lo detectan integridad, en el hook Stop (capa 4), y tu revisión.
- **Si cambias una ruta protegida mientras corre un comando de Claude**, por ejemplo al aplicar una propuesta, las huellas también deshacen tu cambio. No se pierde: queda en `reports/huellas/` y el aviso te lo dice. Aplica las propuestas cuando Claude haya parado.
- **Las copias de las huellas crecen** en `.git/arnes-huellas/copias/`: una por cada contenido distinto de un fichero protegido. Puedes borrar la carpeta cuando ninguna conversación esté ejecutando comandos.
- **`npx <paquete>` puede descargar y ejecutar un paquete** que no está en el lockfile. No cambia `package.json`, pero se ejecuta.
- **La comprobación del terminal de `make sumas` se puede engañar** simulando uno (por ejemplo, con `script`). Si ocurriera, la capa 5 lo detectaría, porque las sumas ya no coincidirían con el último commit, y también tu revisión.
- **ConfigChange también te bloquea a ti** si cambias la configuración con `/config` durante una conversación. Edita la configuración fuera de Claude Code y abre una conversación nueva. `make fase` también cambia la configuración local, así que las conversaciones abiertas pueden mostrarte ese bloqueo: es lo esperado, y siguen en su fase.
- **La fase vive en un fichero local** (`.claude/settings.local.json`), fuera de git y de las sumas. Claude no puede editarlo con Edit o Write, porque está dentro de `.claude/`, y si un comando Bash le cambia la fase, los hooks o `disableAllHooks`, las huellas lo deshacen; tú sí puedes. Si lo cambias a mano, el aviso de `anunciar-fase.ts` te muestra la fase con la que empieza cada conversación. El modelo y el esfuerzo que guarda ahí `make fase` no los vigilan las huellas: si cambian, lo ves en ese mismo aviso.
- **Los errores del entorno se reconocen por el texto** de la salida. Un test que imprima `EACCES` a propósito daría un falso aviso; solo le pide a Claude que pare y pregunte.
- **El freno cuenta bloqueos seguidos del mismo paso.** Si Claude alterna dos pasos que fallan, la racha empieza de cero cada vez. Lo verás en `make bloqueos`.
- **Los hooks solo vigilan a Claude Code.** A ti no te frenan, a propósito.
- **Los revisores son un LLM:** su informe orienta, pero no demuestra nada.
- **El implementador puede tocar ficheros fuera de su encargo.** La línea `Ficheros:` elige el modelo y rechaza las rutas fuera de `src/` y `tests/unidad/`, pero no limita lo que edita después. Lo frenan sus instrucciones, `make check` en la conversación principal y tu revisión del diff.
- **La escalera depende de las etiquetas.** Si Claude reencarga una tarea con otro número, vuelve a empezar en Haiku. Lo verás en `.claude/registro-enrutador.jsonl`.
- **Un implementador cada vez es una instrucción**, no un bloqueo. Dos a la vez podrían pisarse los ficheros, y la comprobación de uno vería los cambios a medias del otro.
- **Claude podría escribir código con otro subagente** (`general-purpose`, por ejemplo). Va a Sonnet si Claude no le da modelo, pero si se lo da, el enrutador lo respeta. Lo frenan CLAUDE.md y tu revisión.
- **`make bloqueos` no cuenta los bloqueos del implementador:** están en `.claude/registro-enrutador.jsonl`.
- **Un árbol limpio deja parar sin comprobar.** Si Claude commiteara su propio trabajo en rojo, el hook Stop lo dejaría parar. Lo frenan sus instrucciones (no commitea si no se lo pides), el `make check` que ejecutas después de cada commit y tu revisión.
- **El índice de Markdown solo vigila Read.** `cat docs/plan.md` en Bash lee el fichero entero; lo frena la regla de CLAUDE.md. Tampoco cubre los `.md` de fuera del repositorio, como el clon de una propuesta.
- **El relevo depende del transcript de Claude Code.** El tamaño sale de su campo `usage`, que puede ir una llamada por detrás y cuyo formato no es una interfaz estable. Si cambia, no hay aviso y `[RELEVO]` no deja parar: el hook Stop exige la comprobación como siempre. Como la marca solo vale por encima del umbral, tampoco sirve para saltarse la comprobación en una conversación corta.
- **El relevo es una instrucción.** Claude podría seguir trabajando después del aviso; lo ves tú, porque el aviso se repite cada 20 k tokens.
- **Que pasen los tests no demuestra eficacia pedagógica.** Lo dirá el README de la etapa 5.

---

## 12. Prueba del bloqueo

**1. Invocación directa del hook** con el JSON que envía Claude Code:

- **Edit sobre `docs/investigacion.md`** → la respuesta es `permissionDecision: "deny"`, con el motivo:

  > «docs/investigacion.md» está protegida (regla «docs/investigacion.md» de .claude/protegidas.txt). Si hay que cambiarla, prepara una propuesta (CLAUDE.md, «Propuestas»): edítala en un clon fuera del repositorio, guarda el parche en reports/propuestas/, dale al dueño los comandos exactos para aplicarlo y para con [DECISIÓN PENDIENTE]. No le pidas que la edite a mano.

- **Bash `echo PRUEBA >> docs/investigacion.md`** → `proteger-rutas.ts` lo deja pasar. `vigilar-huellas.ts` guarda las huellas antes y, al acabar el comando, devuelve el informe a como estaba, aparta la versión del comando en `reports/huellas/` y responde:

  > El comando ha tocado rutas protegidas (.claude/protegidas.txt):
  >
  > - docs/investigacion.md: lo cambió el comando y ha vuelto a como estaba.
  >
  > La versión que dejó el comando está en reports/huellas/2026-10-24T10-15-30Z-toolu_…/.

  A Claude le añade cómo se cambia una ruta protegida (…prepara una propuesta…).

- **Bash `cat ~/.claude/settings.json`** → la respuesta es `deny`: «No se puede tocar ~/.claude/…».

- **Write sobre `src/dominio/criterio.ts`** → no hay respuesta, es decir, el hook lo permite.

**2. Sesión real de Claude Code**

- **Cómo:** sesión no interactiva (`claude -p`, Claude Code 2.1.302, modelo Haiku) en este repositorio, a la que se pidió añadir una línea «PRUEBA» al final del informe.
- **Read:** permitido.
- **Edit:** `PreToolUse:Edit hook error: «docs/investigacion.md» está protegida…`.
- **Bash:** `PreToolUse:Bash hook error: El comando menciona la ruta protegida «docs/investigacion.md»…`. Era la guardia textual de entonces, anterior a las huellas.
- **Final:** el modelo informó de los dos bloqueos, no buscó otra vía y terminó con `[DECISIÓN PENDIENTE]`. El hook Stop mostró: «Claude ha parado con [DECISIÓN PENDIENTE]: espera tu decisión. La comprobación no se ha ejecutado.».
- **Después:** `sha256sum -c` sobre el informe devolvió «La suma coincide».

**3. Tests automáticos.** `tests/arnes/guardia.test.ts` repite estos casos, y más (enlaces simbólicos, `..`, `.git/`, `~/.claude/`, `--no-verify`, `env -u CLAUDECODE`, `npm install`…), en cada `make check`. `tests/arnes/huellas.test.ts` hace lo mismo con las huellas: ficheros cambiados, borrados y creados, un fichero cambiado por un enlace simbólico, los permisos de los ajustes locales y un cambio de fase.

---

## 13. Primeros pasos para ti

1. `cd ~/aprendizaje-experto && npm ci`. Instala las dependencias y activa el pre-commit.
2. Revisa los ficheros. Todo es nuevo.
3. **Desde tu terminal:** `make sumas`.
4. `make check`. Debe quedar todo en verde, con el aviso de que aún no hay commits.
5. Commitea todo junto. Está permitido porque todavía no hay código en `src/`: `git add -A && git commit -m "chore: arnés de desarrollo (etapa 1)"`.
6. `make check` otra vez. Ahora también compara las sumas con el último commit.
7. Para la etapa 2, elige la fase `specs` con la tarea de VS Code (§6) y abre una conversación nueva.

---

## 14. Decisiones técnicas

Todas aprobadas por el dueño el 18-10-2026, tal como se proponen en la tabla.

| # | Decisión | Lo aprobado | Alternativa y por qué no |
|---|---|---|---|
| 1 | Límites de ESLint | Complejidad 10, 40 líneas por función, 3 parámetros, 3 niveles de anidamiento, 300 líneas por fichero, 3 callbacks anidados. | Límites más laxos: el código del LLM tiende a funciones largas, y estos límites lo obligan a partirlas en piezas que puedas leer. |
| 2 | jscpd | 1 % de duplicación, bloques de 50 tokens y 5 líneas. | 0 %: daría falsos positivos en estructuras repetidas legítimas. |
| 3 | Stryker | Umbrales 80 / 60, falla por debajo del 60 %. | Más alto al principio: frenaría sin ayudar; se puede subir cuando el dominio esté estable. |
| 4 | Capas de `src/` | <ul><li>Las 4 capas del §3.</li><li>`src/dominio/unidades.ts` como único sitio para constantes técnicas.</li></ul> | Menos capas: se perdería la separación entre lo que se puede probar sin base de datos y lo que no. |
| 5 | Entrada de la interfaz | `src/interfaz/servidor.ts`, declarada en knip. | — |
| 6 | Prefijos de los IDs | <ul><li>`DIAG`: diagnóstico.</li><li>`PLAN`: planificador de repasos.</li><li>`RECU`: recuperación con feedback.</li><li>`MAST`: criterio de dominio.</li><li>`AYUD`: ayuda adaptativa y su retirada.</li><li>`INTE`: intercalado.</li><li>`CALI`: calibración.</li><li>`TARE`: tareas representativas.</li><li>`BUCL`: bucle semanal.</li><li>`HORA`: registro de horas.</li><li>`INST`: instrumentación y exportación a CSV.</li><li>`MATE`: material del dominio y borradores redactados por IA.</li></ul> | IDs numéricos sin prefijo: son menos legibles en el código. |
| 7 | `config/alcance.json` | Para avanzar área por área, como describe el §8. | — |
| 8 | Marca `[DECISIÓN PENDIENTE]` | Que Claude pueda parar para preguntarte sin pasar `make check`, y que tú lo veas. | Sin la marca, Claude no podría preguntarte con el check en rojo, y se vería empujado a decidir por su cuenta. |
| 9 | Matcher de ConfigChange | La configuración del usuario, la del proyecto y la local. | Incluir también skills y políticas: sería innecesario. |
| 10 | Nivel de evidencia nuevo | «Extrapolación del autor», junto a los tres del informe (bien establecido, prometedor y especulativo). | Usar solo los tres del informe: la secuencia de fases, el 85 % y los percentiles no encajan en ninguno, porque el informe los llama extrapolación (§4). |
| 11 | `umbral_retirada_ayuda` | Igual al umbral de dominio (0,85), marcado como extrapolación. Es mi lectura de «reducción de la guía cuando el rendimiento sin ayuda supera el umbral» (§4, fase 2). | Un número distinto: el informe no da ninguno. |
| 12 | Uso de `percentil_experto` (80–90) | <ul><li>La aplicación no calcula percentiles, porque no tiene una muestra de profesionales.</li><li>Guarda el percentil que da el evaluador externo en cada evaluación fechada y lo compara con el mínimo configurado (80).</li><li>Se exigen 2 evaluaciones separadas al menos 3 meses (§4).</li></ul> | Estimar el percentil dentro de la aplicación: el informe no da forma de hacerlo. |
| 13 | FSRS | <ul><li>Usar `ts-fsrs` en `src/infraestructura`, detrás de una interfaz definida en el dominio.</li><li>En la etapa 2 evalúo su licencia, su mantenimiento y su tamaño, y te los presento antes de instalarlo.</li></ul> | Escribir FSRS desde cero: lo descartaste tú. |
| 14 | Enfoque de la etapa 3 | <ul><li>Crear en `src/aplicacion/` los casos de uso como funciones vacías que lanzan «Sin implementar».</li><li>Los steps las importan de forma estática, así que los escenarios fallan en rojo de verdad (FAILED, no indefinidos), los tipos se comprueban y las reglas de capas y de knip siguen funcionando.</li><li>Van en un commit de código aparte del de los steps (regla del pre-commit).</li></ul> | Un contrato tipado en `tests/aceptacion/` con import dinámico: tipado más débil, y knip y dependency-cruiser no siguen los imports dinámicos. |
| 15 | Proteger `docs/plan.md` | Está en `protegidas.txt`, para que el plan no se reescriba para encajar con el código. | Dejarlo libre: más cómodo, pero el plan perdería su papel de contrato. |
| 16 | Integración continua | <ul><li>No hay repositorio remoto. Mientras tanto, la integración continua son el hook Stop, el pre-commit y tu `make check` antes de cada commit.</li><li>Si subes el repositorio a un servidor, un job que ejecute `npm ci && make check && make mutacion`.</li></ul> | Ejecutar `make check` entero en el pre-commit: haría lentos los commits y chocaría con la etapa 3, en la que todo está en rojo a propósito. |
| 17 | Base de datos e interfaz | `node:sqlite` y `node:http`, como en el §2. | — |
| 18 | `npm audit` | <ul><li>Hay 2 avisos moderados de `qs` (≤ 6.15.3, denegación de servicio), que llega a través de `typed-rest-client`, una dependencia de `@stryker-mutator/core`.</li><li>Solo afecta al desarrollo, no a la aplicación.</li><li>Se ignoran por ahora y se revisan cuando salga una versión nueva de Stryker. `npm audit fix` cambiaría `package-lock.json`, que está protegido, así que lo haría el dueño.</li></ul> | — |

---

## 15. Preguntas sobre el informe

Resueltas el 18-10-2026: el dueño aprobó cada propuesta (la opción b en la 5, y [49] como respaldo en la 3). El resumen está en el §0.

1. **Retención objetivo de FSRS.** FSRS necesita un objetivo de retención (por ejemplo, 0,9), pero el informe no da ninguno. El informe solo pide «un SRS (FSRS o SM-2) para hechos» (§4) y advierte que no hay ensayos independientes de FSRS (§2.5 y §6).

   **Propuesta:** usar el valor por defecto de la librería, como parámetro con `extrapolacion: true` y la nota «el informe no lo trata».

2. **Cuándo se reintroduce la ayuda.** El §4 dice «si cae, reintroducirla», sin número.

   **Propuesta:** evaluarlo en el bucle semanal con el mismo umbral, de modo que solo cambie una vez por semana y no oscile de un ítem a otro. Así no hace falta otro número.

3. **El respaldo del criterio de dominio.**
   - El mastery learning en general se apoya en Kulik et al. (1990): 0,52 DE, con la fuente [49]. Pero su referencia en la bibliografía está marcada con (†).
   - El umbral del 85 % viene del §3 (80–90 %, sin cita propia) y del §4, que lo declara extrapolación.

   **Propuesta:**
   - el mecanismo («no avanzar sin dominar») se etiqueta `@evidencia-2.3`, con la fuente [49];
   - el umbral se etiqueta `@extrapolacion`.

   ¿Te vale [49] como respaldo, o prefieres marcar todo el mecanismo como extrapolación?

4. **La estimación del tiempo en la fase 0.**
   - El §4 pide «una estimación honesta del tiempo» como resultado del diagnóstico.
   - Pero el mismo §4 lista «cualquier estimación de "tiempo hasta la pericia"» entre lo no probado.
   - Y tu encargo prohíbe prometer plazos.

   **Propuesta:** el diagnóstico devuelve la ruta sin ninguna estimación de tiempo, y un escenario negativo lo comprueba.

5. **El intervalo de repaso del 10–20 % frente a la no linealidad de Cepeda.**
   - El §3 dice «intervalo ≈ 10–20 % del horizonte».
   - El §2.2 dice que el óptimo es del 20–40 % para 1 semana y del 5–10 % para 1 año, y que la regla «es empírica y no lineal».
   - Si FSRS programa los hechos, este parámetro solo serviría para lo que FSRS no cubre: las tareas representativas y las pruebas de retención diferida.

   **Opciones:**
   - **a)** mantener el rango fijo del 10–20 %;
   - **b)** usar una tabla por horizonte con los dos puntos de Cepeda 2008.

   **Recomendación:** b), más fiel al informe, y te pregunto dónde se usa al escribir `PLAN` en la etapa 2.

6. **Citas que no apoyarán ninguna decisión central.**
   - **Marcadas (†):**
     - Adesope 2017, Bertsch 2007, Black y Wiliam 1998, Cepeda 2006, Chase y Simon 1973, Chi 1981;
     - Cohen 1982, Credé 2017, Dignath 2008, Dunlosky 2013, Ericsson 1993, Gollwitzer y Sheeran 2006;
     - Gruber 2014, Hattie y Timperley 2007, Howard 2021, Kalyuga 2003, Kingston y Nash 2011, Kirschner 2006;
     - Kluger y DeNisi 1996, Kraft 2023, Kruger y Dunning 1999, Kulik 1990, Lally 2010, Leong 2022;
     - Macnamara y Burgoyne 2023, Melby-Lervåg 2013 y 2016, Pan y Rickard 2018, Pashler 2008, Rayner 2016;
     - Rowland 2014, Simons 2016, Sisk 2018, Wood y Neal 2007, Yeager 2019.
   - **Marcadas [verificar]:**
     - los detalles de Cepeda 2006 (§2.2);
     - la «utilidad moderada» de Dunlosky (§2.2 y §3);
     - las cifras de Dignath (§2.5);
     - Gignac y Zajenkowski (§2.5).
   - **Las decisiones centrales se apoyan en citas sin esas marcas:**
     - la inversión de la pericia, en Tetzlaff 2025;
     - el intercalado, en Brunmair y Richter 2019;
     - los ejemplos resueltos, en Barbieri 2023;
     - el espaciado, en Cepeda 2008;
     - la recuperación, en Yang 2021.

---

## 16. Etapas 2 a 5

Cada etapa, y cada área de la etapa 4, empieza en una conversación nueva de Claude Code en VS Code. Antes de abrirla eliges su fase con la tarea «Arnés: fase de la próxima conversación» (§6), y el aviso del principio te la confirma. Lo que Claude no puede hacer (aplicar una propuesta, actualizar las sumas, cambiar la fase, commitear) te lo deja en comandos exactos, listos para copiar.

### Etapa 2: especificación

Conversación nueva en la fase `specs`.

- **Features.** Una feature por área, en `features/<área>.feature`:
  - en español (`# language: es`);
  - con IDs estables y procedencia en cada elemento;
  - con límites, casos negativos y `Esquema del escenario`.
- **Umbrales.** Los escenarios no repiten los umbrales a mano: los fijan en el `Dado` («Dado que el umbral de dominio configurado es del 85 %»), y un escenario comprueba que la aplicación los lee de `config/parametros.json`.
- **Áreas:**
  - **DIAG:** diagnóstico con prueba de recuperación y tareas simples, ruta personalizada y ninguna estimación de tiempo.
  - **PLAN:** FSRS, con SM-2 como alternativa.
  - **RECU:** recuperación con feedback correctivo.
  - **MAST:** criterio de dominio sobre el acierto sin ayuda.
  - **AYUD:** ayuda adaptativa con retirada progresiva; nunca ejemplos resueltos combinados con autoexplicación por defecto (Barbieri 2023).
  - **INTE:** intercalado solo en la fase intermedia y solo entre categorías parecidas.
  - **CALI:** calibración de 0 a 100 %.
  - **TARE:** tareas representativas con rúbrica y evaluación externa fechada.
  - **BUCL:** bucle semanal.
  - **HORA:** registro de horas focalizadas, sin metas de horas.
  - **INST:** eventos de instrumentación y exportación a CSV.
- **FSRS.** Evaluaré `ts-fsrs` (licencia, estado y tamaño) y te lo presentaré.
- **Formato del contenido.** Te propondré cómo es el contenido que aporta el autor, porque las features lo describen.
- **Revisión.** Ejecuto `revisor-evidencia` y adjunto su informe.
- **Cierre.** `make check-specs` en verde. **PARA.**

### Etapa 3: steps de aceptación

Conversación nueva en la fase `aceptacion`.

- **Steps.** En `tests/aceptacion/`, contra `src/aplicacion` y con las funciones vacías de la decisión 14.
- **Estado.** Todo en rojo, sin skip, pending ni xfail. `make check-aceptacion` en verde.
- **Commits.** Dos, que haces tú con los comandos que te doy: los steps y las funciones vacías por separado.
- **Cierre.** **PARA.**

### Etapa 4: implementación

Una conversación nueva en la fase `impl` por cada área. El MVP es DIAG, PLAN, RECU y MAST, con un dominio ficticio pequeño. Tras DIAG, el orden es RECU → MAST → MATE → PLAN → AYUD → INTE → CALI y HORA → TARE → BUCL → INST.

`MATE` aún no tiene feature. Antes de implementarla pasa por una sesión de etapa 2 (su feature) y otra de etapa 3 (sus steps):

- Sus elementos llevan `@extrapolacion`, porque el informe no trata de dónde sale el contenido, salvo los que se apoyen en una sección concreta.
- Desde que exista su feature hasta que toque implementarla, `MATE` está en `areas_fuera_de_alcance`.
- En la etapa 3, `estado-aceptacion` exige que todo lo que está en alcance falle en rojo, pero DIAG, RECU y MAST ya pasan. Durante esa conversación, `config/alcance.json` deja en alcance solo `MATE`.

Para cada área:

1. Abro su archivo, `docs/areas/<ÁREA>.md`, copiando `docs/areas/plantilla.md`. Te preparo la propuesta que saca el área de `config/alcance.json` (§6) y te propongo qué partidas de `docs/deuda-diseno.md` se pagan con ella: al menos una o, si no, una línea que diga por qué ninguna. Tú aplicas la propuesta y eliges. Pago las partidas primero, sin comportamiento nuevo y con `make check` en verde, y paro para que las commitees aparte (`refactor: …`), con los comandos que te doy.
2. **Mecanismo.** Solo en las áreas con arquitectura: MATE, PLAN (`ts-fsrs`) y las que añaden una pantalla nueva a la interfaz. Antes de escribir nada en `src/`:
   - explico en prosa cómo funcionará por dentro: qué datos entran, qué módulo hace qué y qué queda guardado;
   - esbozo dos interfaces radicalmente distintas para su módulo central, con sus pros y contras;
   - lo dejo en la sección «Mecanismo» del archivo del área y paro con `[DECISIÓN PENDIENTE]` hasta que lo apruebes.

   Las áreas de dominio puro se saltan este paso y lo dicen en su archivo.
3. Escribo el comentario de la interfaz y las firmas de `src/dominio`, y encargo los cuerpos y sus tests unitarios, que citan el `@ID`, al subagente `implementador` (§7). Si lo devuelve en rojo, lo reencargo con la misma etiqueta, que sube el modelo, o lo termino yo.
4. Hago lo mismo con la aplicación y la infraestructura necesarias.
5. Dejo `make check` en verde.
6. Ejecuto los dos revisores, `make mutacion` y `make bloqueos A=<ÁREA>`.
7. Completo el archivo del área: mecanismo, interfaces descartadas y por qué, deuda pagada, puntuación de mutación y bloqueos del hook Stop.
8. Te doy un resumen breve, con la propuesta para `docs/deuda-diseno.md` (las partidas nuevas del revisor, las pagadas y la línea del área) y los comandos para aplicarla y commitear el área.

Antes del código de cada fichero nuevo de `src/`, de cualquier capa (`docs/arnes.md`, §6, y skill `codebase-design`):

- escribo el comentario de su interfaz y sus firmas; si el comentario sale largo, la abstracción es mala y la cambio antes de seguir;
- esbozo al menos otra interfaz radicalmente distinta, solo con sus métodos principales, y me quedo con la más profunda;
- anoto la descartada y por qué en el archivo del área.

Sin dependencias nuevas sin tu aprobación. Si un escenario o un parámetro parece mal, paro y te preparo una propuesta (§6) que solo toque la especificación, para que la commitees aparte.

### Etapa 5: README

El README explicará:

- qué tiene respaldo en el informe;
- qué es extrapolación configurable;
- qué no se debe prometer: ni tiempo hasta la pericia ni eficacia (§2.6 y §6 del informe).

---

## 17. Interfaz y material

Aprobado el 20-10-2026, con la maqueta de las pantallas Hoy, Sesión de práctica y Revisión del material en modo claro y oscuro: https://claude.ai/artifact/KP2bHeFvWSabDSKHpVaDK7

### 17.1 Forma

- **Solo móvil.** En el PC se ven las mismas pantallas, en una columna centrada del ancho de un móvil. No hay diseño de escritorio.
- **Servidor.** `src/interfaz/servidor.ts` (`node:http`) corre en el PC y el móvil entra por la wifi de casa. HTML, CSS y JS sin framework (§2 y decisión 17).
- **Estilo.** Limpio y fácil de entender de un vistazo, como una app de iPhone, con el aire Frutiger Aero de principios de los 2000 (Windows Vista): cristal, brillos suaves y degradados de cielo.
- **Tema.** En Ajustes: automático (sigue al sistema; es el valor por defecto), claro u oscuro. Los colores son variables CSS, con un juego para cada modo.
- **Accesibilidad:**
  - contraste del texto de al menos 4,5:1;
  - zonas táctiles de al menos 44 px;
  - respeta «reducir movimiento», «reducir transparencia» y «más contraste» del sistema.

### 17.2 Tipografía

- **Selawik**, de Microsoft, con licencia SIL OFL 1.1 y el nombre «Selawik» reservado. Pesos 350, 400, 600 y 700.
- La sirve el propio servidor, sin CDN. Se descarga del repositorio oficial al empezar la interfaz y su `LICENSE.txt` va junto a los ficheros de la fuente.
- No se recorta ni se modifica: por el nombre reservado, una versión modificada no podría llamarse Selawik.
- **Respaldo:** Segoe UI, Roboto y `system-ui`. Selawik no tiene los signos −, → y ≈, que salen de la fuente de respaldo (Roboto en Android).

### 17.3 Movimiento

- **Al pulsar,** el control encoge a 0,97 y vuelve con un muelle.
- **Las hojas** (por ejemplo, «Ver fuente») se arrastran con el dedo y se pueden interrumpir a mitad de animación:
  - el arrastre empieza tras 10 px;
  - hacia arriba hay resistencia elástica (factor 0,55);
  - al soltar, se proyecta dónde acabaría con la velocidad de los últimos 100 ms (deceleración 0,998). Si pasa de la mitad, se cierra (amortiguamiento 0,8, respuesta 0,3 s); si no, vuelve a su sitio;
  - al tocar el velo, «Cerrar» o Escape, se cierra con amortiguamiento 1 y respuesta 0,35 s, y el foco vuelve al botón que la abrió.
- **El feedback** aparece con una transición breve.
- **Con «reducir movimiento»,** fundidos cortos en lugar de muelles.

### 17.4 Vibración

- Un toque de 15 ms (`navigator.vibrate`) al pulsar «Comprobar», y en la revisión al aprobar o descartar.
- Es el mismo toque si se acierta que si se falla: la vibración no adelanta el resultado ni funciona como elogio (RECU-2).
- Interruptor «Vibración» en Ajustes, encendido por defecto.
- Si el navegador no admite la vibración, no pasa nada.

### 17.5 Emparejamiento por QR

- El PC muestra un QR con la dirección del servidor y una clave de un solo uso. El móvil lo escanea con la cámara y queda emparejado.
- Sin emparejar, nadie más en la wifi puede entrar.
- **Límite:** sin HTTPS, el tráfico va sin cifrar por la wifi de casa. Basta para un uso personal en casa; el servidor no se abre fuera de ella.

### 17.6 MATE: material y borradores

Es para uso personal.

- **Material:** PDF, PPTX, DOCX y URL.
  - PPTX y DOCX se convierten a PDF con LibreOffice, instalado en el PC (es un programa aparte, no una dependencia de npm).
  - Las fuentes de NotebookLM entran como ficheros o como URL.
- **Borradores.** Una IA lee el material y redacta objetivos, categorías, ejemplos resueltos, ítems y tareas con rúbrica, en el formato del contenido, cada pieza con su `fuente` y siguiendo `config/peticion-ia.md` (abajo, «Lo que se pide a la IA»). Puede ser la API de Claude, la suscripción de Claude Code (la de por defecto, §0) o un modelo local.
- **Marcas.** Las pone la aplicación, no la IA:
  - «No está en tu material»: la pieza no trae fuente;
  - «Cita no encontrada»: el fragmento no aparece tal cual en el documento;
  - «Un solo paso»: un ejemplo resuelto con menos de 2 pasos.

  Solo comprueban lo que se ve sin leer la pieza; no miden su calidad.
- **Revisión** (pantalla «Revisión del material»), por objetivo:
  - filtros: Pendientes, No está en tu material y Cita no encontrada;
  - «Ver fuente» abre una hoja con el fragmento en su contexto;
  - cada pieza se aprueba, se corrige o se descarta, y lo último se puede deshacer;
  - cada pieza se aprueba una a una, también las que no tienen marca;
  - el `diagrama` de un objetivo o de un ejemplo se ve como imagen, junto a su texto;
  - una tarea con `antes_de` dice delante de cuál va («Va antes de T3»).
- **Al aprobar,** la pieza pasa de `contenido/borradores/<dominio>.json` a `contenido/<dominio>.json`, con su `fuente`. Al descartarla, sale del borrador.
- **Inicio de sesión de Claude Code.** Un botón en Ajustes lanza el inicio de sesión en el PC y muestra en el móvil lo que pida (el enlace y, si hace falta, la casilla para el código).
  - Corta a los 5 minutos y tiene «Cancelar».
  - La aplicación nunca guarda, registra ni muestra credenciales: solo dice si hay una sesión iniciada.

#### Lo que se pide a la IA

El texto de la petición está en `config/peticion-ia.md`, y cada exigencia empieza por su id. Esta tabla dice de dónde sale cada una. Las citas son de `docs/investigacion.md`.

| Id | Pieza | Exigencia | Origen |
|---|---|---|---|
| G1 | Todas | No afirma nada que no esté en el fragmento citado o en su contexto. | Decisión del autor: «La aplicación no inventa contenido» (preámbulo de `features/material.feature`). El informe no trata de dónde sale el contenido. |
| G2 | Ejemplo resuelto e ítem | Cuelgan de un objetivo aprobado si encajan; se crea uno nuevo solo si ninguno sirve. | Decisión del autor: la petición lleva los objetivos aprobados para que el borrador no los repita. El informe no lo trata. |
| G3 | Objetivo y ejemplo resuelto | `diagrama` opcional, en SVG: muestra lo mismo que su texto y nada que no diga el fragmento citado, redibuja la figura del documento si la hay y no se pone pensando en personas «visuales». | Extrapolación. §3, codificación dual: «Combinar palabras y representaciones visuales», nivel «Prometedor» y tamaño del efecto «No verificado aquí»; cómo aplicarla: «Diagramas integrados con el texto (no "por estilo")». §2.2: «No verifiqué un metaanálisis específico». §2.6: los estilos de aprendizaje, «Sin respaldo». Del informe salen solo «integrados con el texto» y «no por estilo». Son lectura del autor que muestre lo mismo que su texto y que redibuje la figura del documento; que la IA dibuje el diagrama, en vez de pedirle la figura a la persona, es decisión del autor. |
| O1 | Objetivo | La `instruccion` enseña directamente lo que hay que saber o hacer; no propone descubrirlo. | Respaldada para novatos. §4, Fase 1: «instrucción explícita» y «Evitar: descubrimiento sin guía». |
| C1 | Categoría | La `descripcion` dice qué rasgos del problema indican la regla o el procedimiento de la categoría y, si tiene grupo, cómo distinguirla de las demás del grupo. | Extrapolación. §2.2, intercalado: «Funciona cuando hay que **discriminar** entre categorías o tipos de problema parecidos». §2.3: «los expertos en física clasifican los problemas por principios profundos y los novatos por rasgos superficiales». |
| C2 | Categoría | `grupo_parecidas` solo junta categorías cuyos problemas se parecen y se confunden. | Respaldada en lo de parecidos. §3, intercalado: «Solo para discriminar categorías o problemas parecidos». Que además se confundan, y que juntar las que no se confunden reste, es lectura del autor. |
| E1 | Ejemplo resuelto | Todos los pasos hasta la respuesta, uno por elemento de `pasos`: el planteamiento en el primero y la respuesta en el último. | Respaldada en matemáticas (Barbieri et al., 2023); en otros dominios, extrapolación (§4). §3, ejemplos resueltos: «Estudiar soluciones paso a paso» y «retirar pasos a medida que sube el rendimiento». Que la respuesta vaya en el último sale del orden de retirada, una extrapolación ya aprobada (preámbulo de `features/ayuda.feature`). El mínimo de 2 pasos es decisión del autor (MATE-3). |
| E2 | Ejemplo resuelto | Correcto, sin errores que haya que encontrar. | Respaldada en matemáticas; en otros dominios, extrapolación (§4). §2.2: «Los ejemplos correctos solos rindieron más que los incorrectos o la combinación». |
| E3 | Ejemplo resuelto | No pide autoexplicaciones. | Respaldada en matemáticas; en otros dominios, extrapolación (§4). §2.2: «añadir instrucciones de autoexplicación **redujo** el beneficio». §4: «interacción negativa entre ejemplos resueltos y autoexplicación». |
| E4 | Ejemplo resuelto | Resuelve un problema del mismo tipo que los problemas de su objetivo. | §3, ejemplos resueltos: «Alternar ejemplo y problema» (respaldada). Exigir el mismo tipo es una lectura del autor. |
| I1 | Ítem | El `feedback` dice por qué la respuesta correcta lo es y, en un problema, qué regla o qué paso lleva a ella. Sin elogios, notas ni nada sobre la persona; sirve igual a quien acierta y a quien falla. | Respaldada en lo esencial; que sirva igual a quien acierta es lectura del autor, porque el feedback se enseña siempre (§0). §2.2: «El feedback rico en información sobre la tarea funciona mucho mejor que los elogios o las notas» y «más de un tercio de las intervenciones lo **empeoraron**, sobre todo cuando el feedback desplaza la atención hacia el yo». §3: «evitar el elogio personal y las notas sin información». |
| I2 | Ítem | Con opciones, ninguna incorrecta se puede descartar sin saber la materia. Los errores frecuentes que nombre el material se pueden usar, pero no se exigen. | Extrapolación. §3, práctica de recuperación: «Recordar sin mirar»; un ítem que se resuelve descartando lo absurdo no obliga a recordar. El informe no trata los distractores. |
| I3 | Ítem | `tipo` «hecho» para el vocabulario y los hechos nucleares; «problema» para aplicar una regla o un procedimiento. | Respaldada. §4, Fase 1: «espaciado con SRS para el vocabulario y los hechos nucleares». §3: «algoritmo SRS para hechos». |
| I4 | Ítem | `diagnostico` va siempre a `false`; lo marca el dueño (§0, «Comprobación y aprobación de los borradores»). | Decisión del autor. §4, Fase 0: «prueba de recuperación del núcleo conceptual del dominio»; con un solo documento, la IA no sabe cuál es. |
| I5 | Ítem | En un problema, el enunciado no nombra la regla ni la categoría que hay que aplicar. | Extrapolación. §4, Fase 2 mide el rendimiento en «problemas mezclados sin pista del tipo», y §2.2 dice que el intercalado funciona cuando hay que «**discriminar**». Se exige a todo problema, también en la fase de novato, porque el enunciado no cambia cuando el ítem pasa a practicarse intercalado. |
| I6 | Ítem | `categoria` es una aprobada si su descripción encaja; si ninguna sirve, una nueva del mismo borrador, que la persona revisa como pieza (§0, «Categorías en el borrador»). | Decisión del autor. Ver C1 y C2. |
| I7 | Ítem | **Descartada:** coincidir en formato con la evaluación final. | §2.2: «coincidir en formato con el examen final también ayuda (g = 0,531 frente a 0,399)». La aplicación no sabe qué formato tiene esa evaluación. |
| I8 | Ítem | No se prefiere la respuesta escrita. Con respuesta escrita, `aceptadas` lleva todas las formas correctas, con y sin tilde si las dos valen. | Decisión del autor: la corrección es automática y distingue las tildes. El efecto de generación (§3: «Producir la respuesta en vez de leerla») no compara recordar con reconocer. |
| T1 | Tarea | Representativa: lo que se hace en la práctica real del dominio, no un ejercicio de clase. | §3, práctica deliberada (correlacional): «Tareas representativas». §4, definición operativa de «nivel experto», que el informe marca como extrapolación del autor: «tareas representativas de D». «No un ejercicio de clase» es glosa del autor. |
| T2 | Tarea | Criterios que se pueden observar en el trabajo entregado, para que otra persona los aplique mirando solo el trabajo. | §4, definición operativa (extrapolación del autor): «evaluadas a ciegas por jueces expertos o mediante criterios objetivos». §4, instrumentos: «rúbricas de tareas representativas con jueces ciegos». |
| T3 | Tarea | Cada descriptor dice qué se ve en el trabajo en ese nivel, no un adjetivo. | Extrapolación desde el feedback. §3: «evitar el elogio personal y las notas sin información». El descriptor se enseña junto al nivel (§0, «Evaluación externa»). |
| T4 | Tarea | De menos a más difícil: `antes_de` lleva el id de la tarea que va justo detrás (§0, «Reglas de `MATE` que la feature no cubre»). | Extrapolación. §4, Fase 3: «tareas representativas cada vez más difíciles»; el §4 marca como extrapolación «La secuencia completa de fases como sistema». Que lo diga la IA, en vez de ordenar el dueño las tareas a mano, es decisión del autor: el formato no lleva la dificultad, y una tarea más fácil que llega con material nuevo iría al final. |
| T5 | Tarea | Si el documento es un texto profesional real (un artículo, un caso o un informe), puede proponer tareas que obliguen a leerlo para producir el resultado; el enunciado nombra el documento. No se exige. | Extrapolación. §4, Fase 3: «lectura y producción a nivel de investigación o práctica profesional». Partir de un texto del material es lectura del autor. |

### 17.7 Reglas de las pantallas

Las fijan las features. Se recuerdan aquí porque son fáciles de romper al diseñar:

- Nunca se ve la respuesta antes de responder, ni hay un botón de «ya me lo sé» (RECU-1.1 y RECU-1.2).
- Tras responder, acierte o falle, se muestran si ha acertado, la respuesta correcta y el `feedback` del autor, sin elogios (RECU-2).
- La aplicación nunca pregunta si la persona cree que ha acertado: nunca hay autoevaluación (§0, formato del contenido).
- La confianza (0–100 %) se declara antes del feedback (CALI-1.1). El deslizador empieza vacío, para no sugerir un valor, y la confianza nunca se muestra como progreso.
- No se muestra ningún plazo ni fecha de fin (§15.4).
- En la sesión intercalada no se ven ni el objetivo ni la categoría del ítem.
- `revisor-evidencia` revisa los textos de la interfaz.

### 17.8 Por decidir

Se deciden con el dueño antes de escribir el código, con opciones y una recomendación:

1. Cómo se genera el QR: con código propio o con una dependencia, presentada con su licencia y su tamaño.
2. Cómo se escribe el código que corre en el navegador (JS o TS) y cómo entra en el lint, en knip y en las reglas de capas.
3. Dónde se guardan los ajustes (tema y vibración).

Lo que se decidió el 24-10-2026 en el Mecanismo de `MATE` (el texto de un PDF, el proveedor de IA por defecto y dónde se guarda el material) está en el §0.
