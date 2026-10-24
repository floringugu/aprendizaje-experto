# MATE: Material del dominio y borradores

Archivo del área: qué se decidió al implementarla y cómo fue. Se crea en la primera conversación del área copiando esta plantilla a `docs/areas/<ÁREA>.md`, y se completa al cerrarla (docs/plan.md §16, etapa 4).

Si una conversación del área llega al umbral de contexto (docs/plan.md §5, «Relevo»), añade al final de este fichero una sección «## Relevo» con lo que está hecho, lo que falta, el paso siguiente y los ficheros que hay que leer primero. La conversación siguiente la lee y la borra.

## Mecanismo

**Aprobado por el dueño el 24-10-2026:** las cuatro decisiones de §17.8 como se recomiendan, la interfaz A y las reglas que la feature no cubre (`objetivo_pendiente`, objetivos aprobados en la petición a la IA, ids repetidos los cambia la aplicación, «Ver fuente» busca primero por el fragmento).

### Cómo funciona por dentro

Todo lo que se guarda pasa por el puerto `Ficheros`, con rutas relativas a la carpeta de datos. Lo que sigue usa `material/<dominio>/` (decisión 3, más abajo).

1. **Añadir material** (`anadirMaterial`, asíncrono). El tipo se saca de la extensión del nombre: `.pdf`, `.pptx` y `.docx`; cualquier otra rechaza con `tipo_no_admitido`. Un PPTX o un DOCX pide antes `libreOffice.instalado()` y, si no está, rechaza con `falta_libreoffice`. Se guardan el original y, si lo hay, el PDF convertido. De ese PDF se saca el texto una sola vez, página a página, y se guarda como JSON (`["texto de la página 1", …]`). Las citas y «Ver fuente» leen ese JSON y no vuelven a abrir el PDF: por eso pueden ser síncronas.
2. **URL.** `web.descargar(url)` da los bytes y el `Content-Type`. Se guarda la copia tal cual (MATE-1.5: después da igual que la página cambie o desaparezca). Si es HTML, el texto se saca con código propio (decisión de la etapa 3): fuera `script` y `style`, las etiquetas de bloque pasan a saltos de línea y se decodifican las entidades. Se usa el `charset` del `Content-Type` y, si no hay, UTF-8. Si es `application/pdf`, se trata como un PDF. Cualquier otro tipo, o una URL que no se puede descargar, se rechaza. El texto de una URL es una sola «página», con `lugar` `'página web'`.
3. **Índice.** `material/<dominio>/indice.json` lista el material en el orden en que se añadió, cada entrada con su nombre o su URL y las rutas de sus ficheros. `listarMaterial` lo lee. El puerto `Ficheros` no sabe listar carpetas, así que el índice hace falta. Si se añade otra vez un fichero con el mismo nombre, sustituye al anterior: las citas apuntan al documento por su nombre.
4. **Redactar** (`redactarBorrador`, asíncrono). Si `leerIa()` da `undefined`, rechaza con `sin_ia` (MATE-2.4). Si hay IA, se le pasan el PDF del documento y, ampliando la petición del puerto, los objetivos aprobados con su id y su instrucción, para que pueda colgar ítems de O1. El doble de prueba sigue valiendo: un campo de más en la petición no rompe su firma. Con lo que devuelve la IA:
   - cada pieza se valida con el formato del contenido (`formato-contenido.ts`); las que no lo cumplen se apartan con la propiedad que les falta (MATE-2.3);
   - si un id ya está en el contenido aprobado o en el borrador, la aplicación le da el siguiente libre con el mismo prefijo (MATE-2.2), y no se lo confía a la IA;
   - las piezas válidas se añaden al borrador que ya había, sin sustituirlo. Un ejemplo de un objetivo aprobado va a `ejemplos_resueltos` de la raíz, con `objetivo`; uno de un objetivo nuevo, dentro de él.
5. **Marcas** (dominio puro, `src/dominio/citas.ts`). Nunca se guardan: se calculan cada vez que se abre la revisión a partir del borrador y de los textos guardados. Así MATE-4.7 sale solo. Las reglas:
   - `sin_fuente`: la pieza no trae `fuente`;
   - `cita_no_encontrada`: el documento no está en el material, o el fragmento no aparece en su texto. Para compararlos, cada tramo de espacios, tabuladores y saltos de línea cuenta como un solo espacio, en el fragmento y en el texto, y nada más se normaliza;
   - las páginas se unen con un salto de línea, así que una cita que cruza de una página a otra se encuentra.
6. **Revisión** (el módulo central, `src/aplicacion/revision.ts`). Lee el borrador y el contenido aprobado, agrupa las piezas pendientes por objetivo y aplica aprobar, aprobar en bloque, descartar y corregir. Escribe los dos ficheros enteros. Hay una regla que la feature no cubre: una pieza que cuelga de un objetivo aún pendiente (un ítem de O4) no se aprueba antes que su objetivo, porque el contenido aprobado quedaría con un objetivo que no existe. Rechaza con `objetivo_pendiente`. Las dos interfaces posibles están más abajo.
   - **Ids únicos y corregir (24-10-2026).** Ningún id se repite dentro del borrador ni entre el borrador y el aprobado, sea cual sea el tipo de pieza; el aprobado escrito a mano no se comprueba. `idRepetido(mesa)` da el primero que se repite, y los casos de uso lo comprueban al leer la mesa. Una corrección que deja un id repetido rechaza con `campo` `id`. Decidido por el dueño en la misma fecha: un ítem corregido que pasa a colgar de un objetivo que no está ni en el borrador ni en el aprobado rechaza con `campo` `objetivo`, porque nunca se podría aprobar.
7. **Ver fuente.** Busca la primera página que contiene el fragmento, con la misma normalización, y la hoja trae el texto entero de esa página; si la cita cruza de una página a otra, trae todas las que abarca, para que una pieza sin marca siempre se pueda abrir. Si no aparece en ninguna, usa la página que dice `lugar` («página 12», «diapositiva 3»), si es un número válido. Si tampoco, rechaza con `cita_no_encontrada`. Se busca por el fragmento antes que por `lugar` porque la IA puede contar las páginas impresas, y en un libro no coinciden con las del PDF. Lo mismo vale para lo aprobado, y en una sesión solo después de responder (MATE-7.1).
8. **Deshacer.** Antes de cada acción de la revisión se guarda en memoria, por dominio, lo que había en los dos ficheros; deshacer los vuelve a escribir. Es un único hueco, así que solo se deshace la última acción (MATE-4.10). No sobrevive a reiniciar el servidor, y no hace falta.
9. **Inicio de sesión de Claude Code** (`src/aplicacion/inicio-sesion.ts`). Es un estado en memoria (en marcha, enlace, pide código) con el proceso y la cancelación del temporizador. De cada evento `salida` solo se saca la primera URL `https://` y el texto se tira (MATE-8.7). El código que escribe la persona va a `proceso.enviar` y no se guarda en ningún sitio (MATE-8.6). Al lanzarlo se programan 5 minutos con `Temporizador`; al vencer, o con «Cancelar», se llama a `cortar()`. Ajustes solo devuelve `estado().iniciada`.

### Decisiones que pide §17.8

1. **Texto de un PDF. Recomiendo `pdftotext -raw -enc UTF-8 - -`, de Poppler.** Es un programa del PC, como LibreOffice, y ya está instalado (26.01). Recibe el PDF por la entrada estándar, separa las páginas con `\f`, y con `-raw` deja el guion de «tam-»/«bién» (MATE-3.4; lo he comprobado con `pdfDePrueba`). En su modo por defecto los junta. El precio es que la aplicación lo llama con `node:child_process`, sin puerto: `Dependencias` no puede crecer sin tocar `tests/aceptacion/soporte/mundo.ts`, que está protegido. Así, los escenarios usan el `pdftotext` de verdad. Si falta, añadir un PDF rechaza con `falta_poppler`, una causa nueva.
   - *Descartado, código propio:* los PDF reales usan flujos comprimidos, fuentes CID con mapas `ToUnicode` y tablas de objetos comprimidas. Sería una librería de PDF en miniatura, y solo la probaría el PDF sencillo de los escenarios.
   - *Descartado, `pdfjs-dist`:* es una dependencia nueva, de varios MB, y da trozos de texto con posiciones, así que los saltos de línea habría que reconstruirlos a mano.
2. **Proveedor de IA por defecto. Recomiendo la suscripción de Claude Code**, con `claude -p`:
   - el PDF se le pasa por su ruta, solo con la herramienta `Read`, con `--json-schema` del formato del contenido y con `--no-session-persistence`;
   - MATE-8 ya construye su inicio de sesión, y no hay ninguna clave que guardar, cosa que la aplicación nunca hace.
   - *Contras:* depende de que la CLI esté instalada y con la sesión iniciada, y gasta del límite de la suscripción.
   - *Descartados:* la API de Claude necesita guardar una clave y se paga por uso; un modelo local lee peor los PDF largos.
3. **Dónde se guarda el material. Recomiendo `material/<dominio>/` en la carpeta de datos, junto a `contenido/`**, con `indice.json`, los originales, los PDF convertidos, las copias de las URL (`web-<n>.html`) y los textos (`<nombre>.texto.json`). Debe quedar fuera de git: son documentos con derechos de autor y apuntes personales. Dónde está la carpeta de datos se decide con el servidor.
4. **Infraestructura. Recomiendo dejar los adaptadores para el área que monte el servidor:** `Ficheros` en disco, `soffice --headless --convert-to pdf`, `fetch`, `claude -p`, `claude auth login` / `claude auth status --json` y `setTimeout`. `knip` solo tiene como entrada `src/interfaz/servidor.ts`, que aún no existe, así que hasta entonces serían código muerto. Esta área haría `src/dominio` y `src/aplicacion`, que es lo que comprueban los escenarios.

### Dos interfaces para la revisión

**A. Una sola entrada: acciones sobre la pareja borrador–aprobado.**

```ts
/** Lo que la revisión lee y escribe de un dominio. */
interface Mesa {
  readonly borrador: BorradorDominio;
  readonly aprobado: ContenidoDominio;
}

type Accion =
  | { readonly tipo: 'aprobar'; readonly pieza: string }
  | { readonly tipo: 'aprobar_sin_marca' }
  | { readonly tipo: 'descartar'; readonly pieza: string }
  | { readonly tipo: 'corregir'; readonly pieza: string; readonly corregida: unknown };

/**
 * Aplica la acción y devuelve la mesa nueva, sin tocar la de entrada. Rechaza con
 * `pieza_no_encontrada`, `objetivo_pendiente` o, al corregir, el `campo` que falta.
 */
function aplicar(mesa: Mesa, accion: Accion, marcas: Marcador): Resultado<Mesa>;

/** Las piezas pendientes por objetivo, con sus marcas, filtradas. */
function revisar(mesa: Mesa, marcas: Marcador, filtro: FiltroRevision): Revision;
```

Cada caso de uso lee los dos ficheros, llama a `aplicar`, guarda la mesa anterior en el hueco de deshacer y escribe la nueva.

- *A favor:* todo lo que sabe cómo se mueve cada tipo de pieza está en un sitio: el objetivo con sus ejemplos, el ejemplo suelto que entra en un objetivo aprobado, el ítem, la tarea. Deshacer es igual para todas las acciones, porque solo hay una entrada. Se prueba con datos, sin ficheros.
- *En contra:* `aplicar` lleva dentro un `switch` sobre la acción, y cada acción reescribe los dos ficheros enteros (son pequeños).

**B. Primitivas sobre piezas, que compone cada caso de uso.**

```ts
interface PiezaLocalizada {
  readonly tipo: 'objetivo' | 'ejemplo' | 'item' | 'tarea';
  readonly pieza: Pieza;
  /** De qué objetivo cuelga, si cuelga de alguno. */
  readonly objetivo?: string;
}

function localizar(borrador: BorradorDominio, id: string): PiezaLocalizada | undefined;
function quitar(borrador: BorradorDominio, id: string): BorradorDominio;
function poner(contenido: ContenidoDominio, localizada: PiezaLocalizada): ContenidoDominio;
function sustituir(borrador: BorradorDominio, id: string, pieza: Pieza): BorradorDominio;
```

Así, aprobar es `localizar` + `quitar` + `poner`; descartar, `quitar`; corregir, validar + `sustituir`; aprobar en bloque, un bucle de aprobar.

- *A favor:* son funciones pequeñas y generales, y `redactarBorrador` reutilizaría `poner` para meter en el borrador las piezas de la IA.
- *En contra:* lo que sabe cómo se mueve una pieza queda partido entre `localizar` y `poner`. Los cuatro casos de uso repiten la secuencia leer → componer → guardar para deshacer → escribir, y en uno puede olvidarse lo de deshacer. Hay más interfaz para la misma funcionalidad: es menos profunda.

**Recomendación: A.**

### Datos de partida (etapa 3)

**Lo que fijan los steps** (y el mecanismo debe respetar):

- Las marcas y las causas de rechazo son códigos en snake_case: `sin_fuente`, `cita_no_encontrada`, `falta_libreoffice`, `tipo_no_admitido`. Una corrección rechazada dice qué falta en `campo`.
- En el borrador, los ejemplos resueltos de objetivos ya aprobados van en una lista aparte, `ejemplos_resueltos`, en la raíz y con `objetivo`. Los de objetivos nuevos van dentro de su objetivo.
- El puerto `ClaudeCode.iniciarSesion(alRecibir)` devuelve `{ enviar, cortar }` y emite los eventos `salida`, `pide_codigo` y `terminado`. El corte de los 5 minutos usa el puerto `Temporizador` (MATE-8.3). Ajustes solo devuelve `{ sesionClaudeCode }` (MATE-8.5).
- «Ver fuente» es un único caso de uso, `verFuente`, para el borrador y para lo aprobado. En una URL, el `lugar` de la fuente es `'página web'`, y la hoja sale de la copia guardada al añadirla (MATE-1.5).
- La extracción del texto es síncrona; la web, la IA y el inicio de sesión son asíncronos.

**Hallazgos:**

- **pdftotext y MATE-3.4.** En su modo por defecto, y también con `-nodiag`, junta «tam-»/«bién» en «también». Con `-raw` y con `-layout` el guion se queda. El escenario espera la palabra entera.
- **Todos los escenarios de MATE fallan en los antecedentes**, porque `anadirMaterial` lanza «Sin implementar». Los pasos de detrás no se han ejecutado nunca: algún fallo dentro de un paso puede salir al implementar.
- **MATE-6.3** depende de `pedirTarea`. Las sesiones de repaso y de retención (MATE-6.1) aún no están implementadas en ningún área.

**Decisiones sin registrar.** Aprobadas en la etapa 3 y aún no escritas en docs/plan.md §0 ni §17.8; van en «Mecanismo»:

- el texto de un HTML se saca con código propio, sin dependencia;
- el formato del borrador descrito arriba.

## Interfaces descartadas y por qué

Las dos interfaces que se compararon («diseñarlo dos veces»): cuál se eligió, cuál se descartó y la razón.

**Validación del contenido** (D16, `src/aplicacion/formato-contenido.ts`):

- **Elegida:** funciones que devuelven el primer fallo, con la pieza y la propiedad.
- **Descartada:** un esquema declarativo y un intérprete genérico. Motivo: sería una librería de validación en miniatura, y el formato quedaría escrito dos veces, en los tipos y en el esquema, sin que el compilador los ate.

**Mecanismo del área:**

- **Elegida:** A, una sola entrada `aplicar(mesa, accion)` sobre la pareja borrador–aprobado.
- **Descartada:** B, primitivas `localizar`, `quitar`, `poner` y `sustituir` que compone cada caso de uso. Motivo: parte entre dos funciones cómo se mueve cada tipo de pieza, y cada caso de uso repite la secuencia que guarda el estado para deshacer.

**Citas** (`src/dominio/citas.ts`):

- **Elegida:** `marcadorDelMaterial(textos)` devuelve el `Marcador` que recibe la revisión, y `contextoDeLaCita(cita, textos)` da el texto de «Ver fuente». Las reglas (sin fuente, documento ausente, fragmento que no aparece, página de `lugar`) y la normalización de los espacios quedan dentro, y el marcador normaliza cada documento una sola vez.
- **Descartada:** un documento indexado, `documentoCitable(paginas)`, con `buscar(fragmento)` que da las páginas donde está. Motivo: es más general, pero deja fuera, en `revision.ts` y en `material.ts`, qué cuenta como marca y cuándo se usa `lugar`, y las dos tendrían que tratar igual el documento que no está en el material.

**Texto de un PDF** (`src/aplicacion/texto-pdf.ts`):

- **Elegida:** una sola función, `textoDelPdf(pdf)`, que da las páginas o rechaza con `falta_poppler` o `pdf_ilegible`.
- **Descartada:** un objeto `Poppler` con `instalado()` y `extraer(pdf)`, como el puerto `LibreOffice`. Motivo: sin puerto no se puede sustituir en los escenarios, así que imitar su forma no aporta nada. Además, serían dos procesos donde basta uno, y quien llama tendría que acordarse de preguntar antes.

**Texto de un HTML** (`src/aplicacion/texto-html.ts`):

- **Elegida:** `textoDelHtml(bytes, tipoContenido)`, que decodifica, quita etiquetas y entidades y da el texto línea a línea.
- **Descartada:** un analizador que da un árbol de nodos (`analizarHtml(texto)`) y una función que saca su texto. Motivo: es un HTML en miniatura, con más interfaz, y aquí solo hace falta el texto.

**Material guardado** (`src/aplicacion/material-guardado.ts`):

- **Elegida:** funciones sobre `(ficheros, dominio)`: `guardarDocumento`, `documentosDelMaterial` y `textosDelMaterial`. Las rutas y el índice no salen del módulo.
- **Descartada:** una clase `MaterialGuardado` que carga el índice en memoria y lo escribe con un `guardar()` explícito. Motivo: quien la usa tiene que acordarse de llamar a `guardar()`, y con dos personas en la misma carpeta de datos el índice en memoria quedaría viejo.

## Deuda pagada

Partidas de `docs/deuda-diseno.md` que se pagaron en esta área, con el commit que las cierra. Si no se pagó ninguna, «Ninguna».

- **D16** y **D17**, en el commit «refactor: validate domain content when it is read (D16, D17)». El contenido se valida en `enDominio`, que rechaza la petición si no cumple el formato; `respuestaMostrada` ya no lanza, y `respuestasAceptadas` deja de exportarse.

## Mutación

Puntuación de `make mutacion` al cerrar el área, y los mutantes supervivientes que se aceptaron con su motivo.

- **Puntuación:** … %
- **Supervivientes aceptados:** …

## Bloqueos del hook Stop

Salida de `make bloqueos A=<ÁREA>` al cerrar el área, y una frase sobre el bloqueo que más costó, si lo hubo.

```text
…
```


## Relevo

**Hecho:**
- MATE-12, en 017131c: `lugarDelFallo` compartida, `esRegistro` en un solo sitio, `escribirMesa` y `codificar` en `revision-fabricas.ts`, `rechazado` exige motivo, tests para los huecos de mutación de `revision.ts` y `revision-del-material.ts`.
- MATE-13 y MATE-14, sin commitear: `verFuente` busca la pieza con `piezaDeVerFuente` (lee primero el aprobado); `inicio-sesion.ts` ya no es una clase, sino `Inicios` y funciones de módulo. Los `proceso?.enviar` y `proceso?.cortar()` son supervivientes equivalentes: `proceso` solo falta dentro de `iniciarSesion`.
- `make check-implementador` en verde, con 811 tests.
- e20d15e y 39748d9 (fase specs) decidieron el hueco 1: `redactarBorrador` ya no espera a la especificación, espera a la aceptación. Añadieron la categoría como pieza, `diagnostico` a `false`, opciones repetidas como error de formato, la marca «Un solo paso», `diagrama` (SVG como texto) y `antes_de` en las tareas, y quitaron «Aprobar las N sin marca».
- **Conversación en fase `aceptacion` (la del punto 1): solo leyó. No hay ningún cambio sin commitear de ella**, salvo este relevo. Quedaron decididos los pasos de abajo.

**Falta, en este orden:**
1. **Conversación en fase `aceptacion`** (nueva, con el relevo anterior ya leído: no hace falta releer `aprobacion.ts` ni `revision.ts` enteros, mira los que cita cada punto). Los 11 escenarios sin steps salen de `npx cucumber-js --tags @MATE --dry-run`.
   - **Regla para todos los steps nuevos.** Ni `CategoriaContenido` (sin `descripcion` ni `fuente`), ni `TareaContenido` (sin `antes_de`), ni `ObjetivoContenido` (sin `diagrama`), ni `Marca` (sin `un_solo_paso`) tienen todavía los campos nuevos, y `tests/aceptacion/` está protegido en `impl`. Por eso los steps no deben depender de ellos, o cuando la fase `impl` los añada el lint (`no-duplicate-type-constituents`) o `tsc` obligarán a tocar los steps. Usa tipos locales por intersección (`CategoriaContenido & { readonly fuente?: Fuente }`, nunca una unión con el literal nuevo), `Object.assign({}, tarea, { antes_de })` (sin exceso de propiedades) y `Record<string, string>` para las marcas.
   - **2.1 y 2.3, fila «una categoría»:**
     - `tipos-de-parametro.ts`: añadir «una categoría» a `pieza_redactada`, «una categoría sin descripción» a `pieza_incompleta` y «la descripción» (→ `descripcion`) a `falta` y a `PROPIEDAD_QUE_FALTA`;
     - `redaccion.ts`: una categoría `{ id: 'C4', descripcion, fuente }` en `piezaRedactada`, `borrador.categorias` en `piezasDelTipo` y una sin `descripcion` en `piezaIncompleta`;
     - `escenario-material.ts`: `...contenido.categorias` en `piezasDe` (así «ninguna otra pieza» también cuenta categorías) y la categoría en el tipo `Pieza`.
   - **`redaccion.ts` está en 188 líneas y el límite es 300:** mueve `entregaDeLaIa` y `redactar` a `soporte/` y pon 2.5, 2.6 y 2.7 en `pasos/redaccion-rechazos.ts`.
     - 2.5: `When` literal «…entrega un borrador con un ítem de O1 completo y un ítem de O1 con las opciones {textos}»: I8 completo e I9 con esas opciones y `correcta` la primera. `Then` «tiene el ítem de O1 completo y ninguna otra pieza» (`idsDe` igual a `['I8']`) y «ha apartado {int} pieza porque tiene dos opciones iguales» (`apartadas` igual a `[{ falta: 'opciones' }]`).
     - 2.6: I8 con `diagnostico: true`; el `Then` busca I8 en el borrador del disco y comprueba `diagnostico === false`.
     - 2.7: `When` «…completo y {pieza_redactada} cuyo diagrama es {texto}» con el `diagrama` puesto en el objetivo O4 o en el ejemplo E9; el `Then` de «ese ítem de O1 y ninguna otra pieza» ya existe; nuevo «ha apartado {int} pieza porque su diagrama no es SVG» (`apartadas` igual a `[{ falta: 'diagrama' }]`).
     - **Decisión de interfaz que documentar:** `apartadas[].falta` nombra la propiedad que falla (`descripcion`, `opciones`, `diagrama`), como `FalloDeFormato.falta`.
   - **3.5 (marca «Un solo paso»), en `revision.ts` de los steps:**
     - `Given` «…tiene el ejemplo resuelto {item} de {objetivo}, con {int} paso(s) y la fuente {fuente}» (los pasos `P1…Pn`; el ejemplo va en `material.ejemplosSueltos`, para un objetivo aprobado, con `dejarBorrador`);
     - añadir `'Un solo paso': 'un_solo_paso'` a `MARCAS`, que pasa a `Record<string, string>`, y `marcasDe` devuelve `readonly string[]`. Los `Then` «tiene la marca» y «no tiene ninguna marca» ya existen. **El identificador `un_solo_paso` es lo que tendrá que devolver el marcador.**
   - **4.11 (`antes_de`), en `aprobacion.ts` de los steps (176 líneas; al quitar los de 5.x quedan unas 145):**
     - `Given` «que contenido\/ficticio.json tiene las tareas {ids}, en ese orden» → `mundo().contenido().fijarTareas(ids)`;
     - `Given` «…borradores\/ficticio.json tiene la tarea {tarea}, pendiente, que va antes de {tarea}» y «…, pendiente, sin {texto}» (el texto es «antes de»): `material.borrador.tareas` con `tareaDePrueba('T3', fuenteDeLosApuntes(material.frase))` y, en el primero, `antes_de`; después `material.dejarBorrador(actual)`;
     - `Then` «contenido\/ficticio.json tiene las tareas {ids}, en ese orden» → `aprobadoEnDisco(mundo()).tareas.map((t) => t.id)`.
   - **5.5:** `Then` «la revisión no ofrece aprobar ninguna pieza en bloque»: la revisión abierta no tiene `aprobablesEnBloque` y `aplicacion()` no tiene `aprobarSinMarca` (`'x' in objeto`). Hoy falla en rojo, que es lo que toca.
   - **Quitar los steps de 5.1, 5.2 y 5.4** (`aprobacion.ts`, desde «MATE-5: solo las piezas sin marca…»): «ofrece «Aprobar las {int} sin marca»», «pulsa «Aprobar las…»», «tiene {ids}, cada uno con su fuente» y «sigue teniendo {ids}, pendientes». Ningún `.feature` los usa ya. El `Given` «que la persona ha aprobado {ids}» se queda, lo usa 4.9.
   - **Casos de uso vacíos: seguramente ninguno.** Los once escenarios usan `redactarBorrador`, `abrirRevision` y `aprobarPieza`, que existen. Si al escribirlos aparece uno, va en un commit de código aparte (plan §14.14).
   - **Cierre:** `npx cucumber-js --tags @MATE --dry-run` sin indefinidos; `make check-aceptacion` en verde; commit solo de `tests/aceptacion/`. No commitear `features/ayuda.feature` ni `docs/cobertura-investigacion.md`.
2. **Tú, en fase `impl`:**
   - renombrar `presentados`/`marcarPresentado` (estado.ts) a `itemsEnCurso`/`marcarEnCurso`;
   - arreglar los `@MATE-3.3` de `texto-pdf.test.ts` y `texto-html.test.ts:130` y los `@MATE-1.1` de `texto-html.test.ts` y `material.test.ts:245` (ver `reports/revisor-codigo-MATE.md`);
   - quitar las listas copiadas en el comentario de `textoDelHtml`;
   - pasar el test de `lugarDelFallo` a su sitio: está en `revision-aplicar.test.ts` porque `formato-contenido.test.ts` está en 299 de 300 líneas, así que hay que partirlo o abrir un fichero nuevo;
   - decidir si el motivo de una corrección que no es un objeto debe nombrar la pieza corregida y no «el ítem 1», como hace `falloDeLaPiezaSuelta`;
   - `material-guardado.ts` no pasa `prettier --check`, ya en HEAD.
3. **`Tarea: MATE-11` y los cambios de e20d15e y 39748d9:**
   - `redactarBorrador` siguiendo `config/peticion-ia.md`;
   - las categorías como pieza del borrador (`descripcion`, `fuente`, `categoria_pendiente`, `campo` `categoria`);
   - la marca «Un solo paso» (`un_solo_paso`);
   - `diagnostico` a `false`;
   - las opciones repetidas como error de formato;
   - quitar `aprobar_sin_marca` y `aprobablesEnBloque`.
   Con eso también se decide la validación de `leerBorrador`.
   Y los de 39748d9, cada uno en su encargo antes de `redactarBorrador`:
   - `diagrama` en el formato: opcional en objetivos y ejemplos, empieza por `<svg` y acaba en `</svg>`; si no, error de formato (MATE-2.7);
   - `antes_de` en `revision.ts`: al aprobar, la tarea entra delante de la primera aprobada siguiendo la cadena, o al final si se corta o da la vuelta (MATE-4.11); al descartar, las que apuntaban a ella heredan su `antes_de`; una corrección con un `antes_de` desconocido o propio se rechaza con `campo` `antes_de`; el campo no pasa al contenido;
   - en `redactarBorrador`, además: la petición lleva las tareas aprobadas en orden, un `antes_de` desconocido se quita y el renombrado de ids alcanza a los `antes_de`.
4. **Para el dueño, con [DECISIÓN PENDIENTE]:**
   - el aprobado se lee por dos caminos;
   - `dominio` va sin validar dentro de las rutas;
   - las partidas de `docs/deuda-diseno.md` (todo en `reports/revisor-codigo-MATE.md`).
   - Además, MATE-6.3.
5. **Cierre:**
   - `make mutacion` y Stryker de aplicación otra vez;
   - en «Supervivientes aceptados», los dos `proceso?.` de `inicio-sesion.ts`;
   - completar «Mutación», «Deuda pagada» y «Bloqueos»;
   - citar MATE-6.2, 6.4 y 6.5.

**Paso siguiente:** el punto 1, en una conversación nueva en fase `aceptacion` (el dueño la elige antes de abrirla).

**Leer primero:**
- este relevo y `git status`;
- `git show e20d15e 39748d9 -- features/material.feature` (los docs/plan.md ya están resumidos arriba);
- `tests/aceptacion/pasos/redaccion.ts`, `aprobacion.ts` y `revision.ts`, y `tests/aceptacion/soporte/escenario-material.ts` y `tipos-de-parametro.ts`.
