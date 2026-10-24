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

**Hecho.**

- `revision.ts` revisado. Las decisiones del implementador se quedan: el ejemplo de dentro de un objetivo pendiente da `objetivo_pendiente`; el ejemplo aprobado se reconstruye con `id`, `pasos` y `fuente` (son todos los campos de `EjemploResueltoContenido`); `ejemplos_resueltos` de la raíz no se crea vacío.
- Mutación de `revision.ts`: 90,52 % → 283 muertos, 19 vivos y 4 sin cobertura, tras los seis tests nuevos (MATE-1 del implementador). Los vivos que quedan son equivalentes o textos de `motivo`: 172, 331 y 401 (tipos que no pueden llegar ahí); 218 y 277 (ramas inalcanzables si no hay ids repetidos); 296 y 334 (`dentro` sobra si los ids del borrador no están en el aprobado); 374 (`fuente: undefined`); 382 (`esRegistro`: el validador ya rechaza lo que no es un objeto); 409 y los textos de 244, 317 y 399. Sin commitear.
- Los tests de la revisión están partidos en `tests/unidad/revision.test.ts` (`revisar`), `revision-aplicar.test.ts` (`aplicar`) y `revision-fabricas.ts` (fábricas comunes). Sin commitear.
- **Alcance de los ids únicos, decidido por el dueño (24-10-2026): el borrador.** Ningún id se repite dentro del borrador ni entre el borrador y el aprobado, sea cual sea el tipo de pieza. El aprobado escrito a mano no se comprueba: el contenido de prueba repite `E1` en O1–O3, y sus piezas no llevan `fuente`. La propuesta del plan está en `reports/propuestas/2026-10-24-ids-unicos-borrador.patch` (filas «Borradores» y «Reglas de `MATE` que la feature no cubre»), pendiente de que el dueño la aplique.

**Falta.**

1. La regla de los ids en `revision.ts`: `export function idRepetido(mesa: Mesa): string | undefined`, el primer id repetido dentro del borrador o que también está en el aprobado. Los casos de uso de `material.ts` la comprueban al leer la mesa. En `aplicar`, `corregir` rechaza con `campo` `id` si la mesa resultante tiene un id repetido (un objetivo corregido con un ejemplo dentro que choca). Añadir al comentario de `aplicar` que la mesa de entrada no repite ids. Encargo al implementador (Sonnet, toca `src/aplicacion/`).
2. Sin decidir, para preguntar al dueño: `corregir` deja cambiar el `objetivo` de un ítem por uno que no existe ni en el borrador ni en el aprobado, y entonces la pieza da `objetivo_pendiente` para siempre. Propuesta: rechazar con `campo` `objetivo`.
3. `src/aplicacion/inicio-sesion.ts`. Firma y comentario ya escritos (abajo); falta encargar el cuerpo y los tests, y cablearlo en `aplicacion.ts` con `...crearInicioSesion(dependencias.claudeCode, dependencias.temporizador)` en lugar de los cinco `sinImplementar` de Claude Code. En `src/dominio/unidades.ts`: `export const MS_PARA_INICIAR_SESION = 5 * SEGUNDOS_POR_MINUTO * MS_POR_SEGUNDO;` con el comentario «El inicio de sesión de Claude Code se corta solo a los 5 minutos (MATE-8.3).».
4. Los casos de uso de `material.ts` (revisión con deshacer, `verFuente`, `anadirMaterial`, `redactarBorrador`), como en el relevo anterior.

**Firma de `inicio-sesion.ts`** (cópiala tal cual al crear el fichero):

```ts
import type { CasosDeClaudeCode } from './claude-code.ts';
import type { ClaudeCode, Temporizador } from './puertos.ts';

/**
 * Los casos de uso del inicio de sesión de Claude Code desde Ajustes (MATE-8), con el estado del
 * inicio en curso en memoria: si está en marcha, el enlace y si pide un código. Cada llamada es un
 * estado nuevo; la aplicación crea uno por persona.
 *
 * - `iniciarSesionClaudeCode` lanza `claudeCode.iniciarSesion` y programa con `temporizador` el corte
 *   a los `MS_PARA_INICIAR_SESION` (@MATE-8.3). Si ya había uno en marcha, lo corta antes y cancela su
 *   corte programado: solo hay un inicio en curso, y los eventos de un proceso que ya no es el actual
 *   se ignoran.
 * - De cada evento `salida` solo se saca la primera URL `https://`, sin la puntuación que la cierra
 *   (`.`, `,`, `;`, `:`, `)`, `»`…); el resto del texto se tira sin guardarlo ni escribirlo en ningún
 *   sitio (@MATE-8.7). El enlace es el de la primera salida que trae uno; las siguientes no lo cambian.
 *   `pide_codigo` muestra la casilla del código (@MATE-8.1). `terminado`, con o sin éxito, deja el
 *   inicio parado y cancela el corte programado.
 * - `consultarInicioSesion` da `{ enMarcha, enlace, pideCodigo }`; sin un inicio en marcha,
 *   `{ enMarcha: false, pideCodigo: false }`, sin enlace.
 * - `enviarCodigo` pasa el código a `proceso.enviar` tal cual, sin guardarlo (@MATE-8.2, @MATE-8.6).
 *   Rechaza si no hay un inicio en marcha, y con `campo` `codigo` si el código está vacío o solo tiene
 *   espacios.
 * - `cancelarInicioSesion` corta el proceso y cancela el corte programado (@MATE-8.4). Sin un inicio en
 *   marcha no hace nada y acepta.
 * - Al cortarse, por «Cancelar» o a los 5 minutos, el inicio queda parado: `enMarcha` es `false`.
 * - `consultarAjustes` devuelve solo `{ sesionClaudeCode }`, con `iniciada` de `claudeCode.estado()`; la
 *   cuenta no sale de aquí (@MATE-8.5).
 */
export function crearInicioSesion(claudeCode: ClaudeCode, temporizador: Temporizador): CasosDeClaudeCode
```

**Nota sobre `make check`.** El paso «aceptacion» falla también en HEAD (75 escenarios, los de MATE sin implementar); los pasos estáticos pasan.

**Paso siguiente.** Comprueba que el dueño aplicó la propuesta de los ids. Luego escribe `idRepetido` (punto 1) y encárgalo; pregunta el punto 2; después, `inicio-sesion.ts`.

**Leer primero:**

- este relevo y «Mecanismo»;
- el comentario de `aplicar` en `src/aplicacion/revision.ts`;
- `src/aplicacion/claude-code.ts`, `src/aplicacion/aplicacion.ts` y `tests/aceptacion/soporte/claude-code.ts`.
