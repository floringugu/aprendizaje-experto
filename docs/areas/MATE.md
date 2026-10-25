# MATE: Material del dominio y borradores

Archivo del área: qué se decidió al implementarla y cómo fue. Se crea en la primera conversación del área copiando esta plantilla a `docs/areas/<ÁREA>.md`, y se completa al cerrarla (docs/plan.md §16, etapa 4).

Si una conversación del área llega al umbral de contexto (docs/plan.md §5, «Relevo»), añade al final de este fichero una sección «## Relevo» con lo que está hecho, lo que falta, el paso siguiente y lo que hay que leer primero, en rangos `fichero:líneas` y no en ficheros enteros, más las búsquedas ya hechas y lo que dieron. La conversación siguiente la lee y la borra.

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
6. **Revisión** (el módulo central, `src/aplicacion/revision.ts`). Lee el borrador y el contenido aprobado, agrupa las piezas pendientes por objetivo y aplica aprobar, descartar y corregir (la aprobación en bloque, `aprobar_sin_marca` y `aprobablesEnBloque`, se quitó el 25-10-2026: MATE-5.5 pide aprobar cada pieza al leerla). Escribe los dos ficheros enteros. Hay una regla que la feature no cubre: una pieza que cuelga de un objetivo aún pendiente (un ítem de O4) no se aprueba antes que su objetivo, porque el contenido aprobado quedaría con un objetivo que no existe. Rechaza con `objetivo_pendiente`. Las dos interfaces posibles están más abajo.
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

Conversación fase `impl`, worktree `mate-revision` (rama `mate-revision`, HEAD b63f35c). No se ha tocado ningún fichero salvo esta sección: la conversación gastó el presupuesto de contexto leyendo y diseñando.

**Hecho:**
- Encargo 1 (MATE-5.5): ya estaba en b63f35c. `git grep aprobablesEnBloque aprobarSinMarca aprobar_sin_marca` solo da `docs/areas/MATE.md:58` (el boceto «A» de «Dos interfaces», que conserva `aprobar_sin_marca` en la `Accion`) y los dos `assert` de `tests/aceptacion/pasos/aprobacion.ts`, que son lo correcto. Falta quitar `aprobar_sin_marca` del boceto (docs, lo hace Claude directamente).
- Lectura completa de `revision.ts`, `mesa.ts`, `revision-del-material.ts`, `citas.ts`, `formato-contenido.ts`, `contenido.ts`, `config/peticion-ia.md`, los steps `revision.ts` y `aprobacion.ts`, y plan §0 (filas «Reglas de MATE que la feature no cubre», «Categorías en el borrador» y «Comprobación y aprobación de los borradores»), que ya fijan todas las reglas de los puntos 2, 3 y 4. Las otras tres conversaciones (mate-formato, mate-pasos, mate-limpieza) siguen en b63f35c; solo mate-limpieza tiene cambios sin commitear (estado.ts, material-guardado.ts, respuestas.ts, texto-html.ts y tests de material, texto-html, texto-pdf y ver-fuente).

**Diseño decidido (nada escrito aún):**
- **Ficheros fuera de mi lista, no tocar:** `contenido.ts` es de mate-formato (`descripcion` de la categoría, `diagrama`). Por eso lo nuevo del borrador va en `mesa.ts`:
  - `TareaDelBorrador extends TareaContenido { antes_de?: string }` y `CategoriaDelBorrador extends CategoriaContenido { fuente?: Fuente }`;
  - `BorradorDominio` pasa a tener `tareas: readonly TareaDelBorrador[]` y `categorias: readonly CategoriaDelBorrador[]` (sigue siendo asignable desde `ContenidoDominio`, así que `idRepetido` y `buscarPieza` siguen usando el aprobado como borrador sin ejemplos aparte);
  - `Pendiente` gana `{ tipo: 'categoria'; pieza: CategoriaDelBorrador }` y `pendientesDelBorrador` las lista después de los ítems y antes de las tareas (así el grupo sin `objetivo`, que lleva categorías y tareas, sigue saliendo el último).
- **`formato-contenido.ts`:** solo `TipoDePieza` gana `'categoria'` (y su comentario) y `falloDeLaPiezaSuelta` el `case 'categoria': return falloDeLaCategoria(pieza, 0)`, que no compila sin él. La validación de `descripcion` y la de la `fuente` de una categoría (`MOLDE_DE_LA_CATEGORIA.interior` es `() => undefined`, debería ser `falloDeLaFuenteOpcional`) son de mate-formato: decírselo al dueño.
- **`citas.ts`:** `type MarcaDeCita = 'sin_fuente' | 'cita_no_encontrada'`, `Marca = MarcaDeCita | 'un_solo_paso'` y `Marcador` devuelve `MarcaDeCita | undefined`. En `revision.ts`, `piezaPendiente` calcula `marcas` como la de la cita (si hay) seguida de `un_solo_paso` cuando la pieza es un `ejemplo` con `pasos.length < 2` (de 0 a 2 marcas; el filtro `un_solo_paso` sale solo, porque `FiltroRevision` usa `Marca`).
- **`antes_de` (MATE-4.11), en `revision.ts`:**
  - aprobar una tarea: se quita `antes_de`; se sigue la cadena desde el suyo con un conjunto de ids visitados (empieza con la propia tarea); la primera id que esté entre las tareas aprobadas es el destino, y la tarea entra delante de ella; si la cadena llega a una tarea sin `antes_de`, a un id desconocido o a uno ya visitado, va al final;
  - descartar una tarea: las del borrador con `antes_de` igual a su id pasan a llevar el `antes_de` de ella, o ninguno;
  - corregir una tarea: si `corregida.antes_de` no es `undefined` y es el id de la propia tarea, o no es el id de ninguna tarea del borrador ni del aprobado, rechaza con `campo` `antes_de`. Orden de comprobaciones: formato, `id`, referencias (`objetivo`, `categoria`, `antes_de`) y ids repetidos.
- **Categorías, en `revision.ts`:**
  - `colgadoDe` da `undefined`; `cambiarPieza` y `entrarEnElAprobado` ganan el caso `categoria` (al aprobar conserva la `fuente`);
  - aprobar un ítem cuya `categoria` es una categoría del borrador (pendiente) rechaza con `causa` `categoria_pendiente`, después de `objetivo_pendiente`; una categoría que no está en ninguna parte no bloquea (solo se rechaza al corregir);
  - corregir un ítem con `categoria` presente que no está ni en `borrador.categorias` ni en `aprobado.categorias` rechaza con `campo` `categoria`, tras el de `objetivo`.
- **Hueco que hay que contar al dueño ([DECISIÓN PENDIENTE]):** al descartar una categoría, los ítems pendientes que la nombran se quedan con un `categoria` colgando y ya no se pueden corregir sin cambiarla (la corrección la rechaza con `campo` `categoria`). Opciones: dejar los ítems tal cual (lo que haría el código si no se decide nada), quitarles `categoria` al descartar, o que la corrección solo rechace una categoría que cambia. La feature no lo cubre.
- **Punto 5, sin cambiar:** propuesta para el dueño con [DECISIÓN PENDIENTE]. `falloDeLaPiezaSuelta` nombra la pieza «el ítem 1» cuando la corrección no es un objeto o no tiene `id` válido. Propongo que `corregirPieza` use el `id` de la pieza que corrige: pasar el nombre desde `revision.ts` (`falloDeLaPiezaSuelta(tipo, pieza, nombre?)`, que nombra con `nombrarPieza` y la posición solo si no viene) para que el motivo sea «falta o no es válido «id» en el ítem I7», con un test del motivo. Es una firma pública de `formato-contenido.ts` y el cambio roza a mate-formato.

**Falta, en este orden (un encargo cada vez al `implementador`, con los ficheros que puede tocar):**
1. Quitar `aprobar_sin_marca` del boceto de `docs/areas/MATE.md:58` (Claude).
2. MATE-3.5, `un_solo_paso`: `citas.ts` (tipos), `revision.ts` (`piezaPendiente`), tests `revision.test.ts`, `revision-fabricas.ts`, `citas.test.ts` si hace falta. Steps: `tests/aceptacion/pasos/revision.ts` ya tiene la marca en `MARCAS`.
3. Categorías como pieza (punto 4): `mesa.ts`, `revision.ts`, `formato-contenido.ts` (las dos líneas de arriba), tests `mesa.test.ts`, `revision*.test.ts`, `revision-fabricas.ts`. Hacerlo antes que `antes_de` porque ambos tocan `Pendiente`.
4. `antes_de` (MATE-4.11): `mesa.ts` (`TareaDelBorrador`), `revision.ts`, tests `revision-aplicar.test.ts` y `revision-fabricas.ts`. Comprobar a mano el orden con las cadenas T3→T4→T1 aprobando en los dos órdenes, y T3→T4→T3.
5. `make check` en verde; no tocar el test de `lugarDelFallo` de `revision-aplicar.test.ts` (se lo lleva mate-formato).
6. Deuda de diseño en `docs/deuda-diseno.md` (fase impl, sin propuesta): `fuente` de la categoría y `antes_de` viven en `mesa.ts` y no en `contenido.ts` hasta que se integre mate-formato (mover entonces `CategoriaDelBorrador.fuente` a `CategoriaContenido`, y ojo: si `descripcion` pasa a ser obligatoria, el fixture de categoría de `revision-fabricas.ts` necesita ponerla).
7. Al acabar: bloque `sh` para el dueño con `git add -A`, el commit (en inglés) y, desde el directorio principal, `make integrar N=mate-revision` y `make retirar N=mate-revision`; más el punto 5 y el hueco de «descartar una categoría» con [DECISIÓN PENDIENTE].

**Leer primero:** este relevo; `src/aplicacion/revision.ts` y `mesa.ts` (bajo 360 y 120 líneas, enteros); plan §0, fila «Reglas de `MATE` que la feature no cubre» (con `git grep -n "Reglas de .MATE. que la feature" -- docs/plan.md`); `features/material.feature` (MATE-3.5, 4.11 y 5.5) y `tests/aceptacion/pasos/aprobacion.ts` y `revision.ts`.
Conversación `mate-limpieza` (fase impl, 25-10-2026). Tocó solo `estado.ts`, `respuestas.ts`, `texto-html.ts`, `material-guardado.ts`, tres tests de `tests/unidad/`, `deuda-diseno.md` y este fichero.

**Hecho (sin commitear; `make check` en verde):**
- `presentados` y `marcarPresentado` de `estado.ts` son `itemsEnCurso` y `marcarEnCurso`, con sus usos en `respuestas.ts` y `ver-fuente.test.ts`. `enCurso(item)` se queda con su nombre: lo llama `revision-del-material.ts:178`, que es de mate-revision.
- Las citas `@MATE-3.3` de `texto-pdf.test.ts` y `texto-html.test.ts`, y las `@MATE-1.1` de `texto-html.test.ts` y `material.test.ts:245`, ahora dicen «(regla que la feature no cubre)».
- El comentario de `textoDelHtml` ya no copia las listas de etiquetas y entidades (están junto a `ETIQUETAS_DE_BLOQUE` y `ENTIDADES_CON_NOMBRE`), ni cita MATE-3.3.
- `material-guardado.ts` pasa `prettier --check`.
- `docs/deuda-diseno.md`: D9 con sus líneas (`estado.ts:261-267`), ampliaciones de D2, D4, D8 y D21, y D22 nueva (`causa` y `campo` sin catálogo). Las líneas del informe estaban desfasadas y se comprobaron en HEAD b63f35c:
  - D21: los cinco ternarios están ahora en `inicio-sesion.ts:151`, `material.ts:121`, `material-guardado.ts:134` y `revision.ts:131,275`; además hay dos más, `revision.ts:206` y `presentacion.ts:17`.
  - D4: `FiltroRevision` y `FuenteAbierta` ya se exportan (`revision.ts:19`, `revision-del-material.ts:22`), pero los steps siguen sacándolos con `Parameters` y `ReturnType`.

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

**Paso siguiente:** el dueño commitea y decide los tres puntos (bloque en el mensaje final); una conversación nueva implementa lo decidido en los ficheros de mate-revision.

**Leer primero:** este relevo, `reports/revisor-codigo-MATE.md` (está en el directorio principal, no en los worktrees; `reports/` no se versiona), `docs/deuda-diseno.md` (D22) y `features/material.feature` (MATE-6).
