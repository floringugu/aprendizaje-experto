---
fase: specs
area: MATE
depende: [mate-cierre, specs-paginas-sin-texto]
toca: [features/material.feature, config/peticion-ia.md, config/parametros.json]
estado: abierto
---
# Un documento largo se redacta por trozos de páginas, en orden y por tandas

**Qué:** hoy la petición a la IA recibe el documento entero (config/peticion-ia.md). Con un libro de cientos de páginas eso puede no caber en el contexto, degrada la calidad y deja una cobertura superficial, y la revisión de golpe de cientos de piezas no se hace bien. Especificar que la app parte el PDF cada N páginas, sin depender de un índice, redacta los borradores trozo a trozo en el orden de las páginas y pide el siguiente trozo por tandas, para que la revisión se reparta.

**Hecho cuando:** los escenarios fijan cómo se parte el documento, qué recibe la IA en cada trozo, cuándo se redacta el siguiente y que el orden de los objetivos nuevos sigue el de las páginas; N está en `config/parametros.json` con su nivel de evidencia; y `make check-specs` está en verde.

**Leer primero:** config/peticion-ia.md (cabecera: qué recibe la IA; G1 y G2); features/material.feature (MATE-2, borradores; MATE-3, «Cita no encontrada»; revisión una a una); features/dominio.feature («El objetivo siguiente se abre al dominar el actual»).

## Decisiones de partida (extrapolación del autor)

- **Corta la app, no la persona.** El PDF ya se lee página a página (texto-pdf.ts parte por `\f`).
- **Sin índice.** El orden de las páginas da el orden de los objetivos: en un libro, el de los capítulos suele respetar los prerrequisitos.
- **N se mide, no se supone (plan §1, principio 7).** Ningún número de páginas garantiza que no alucine; la protección es G1 con la marca «Cita no encontrada». N sale de probar varios tamaños con material real y comparar, por tamaño, la tasa de «Cita no encontrada» y la de piezas descartadas en la revisión. Hasta tener el dato, el ticket queda en `[DECISIÓN PENDIENTE]` para el valor.

## Por decidir

- **Solapamiento.** Una o dos páginas del trozo anterior para no partir una sección por la mitad, además de los objetivos aprobados que ya recibe (G2).
- **Cuándo se redacta el siguiente trozo.** ¿A petición de la persona, o al dominar los objetivos del trozo actual (generación justo a tiempo)?
- **Ejercicios del documento.** Si el trozo trae ejercicios, ¿se pide a la IA que los use como ítems y reservados en vez de inventar? Son citables y los revisó el autor del libro.
- **Diagnóstico por trozo.** Con un libro entero, la persona no sabe qué ítems marcar para el diagnóstico (la IA nunca los marca, MATE-2). ¿Diagnóstico al empezar cada trozo o capítulo, en vez de uno del dominio entero? Toca DIAG: si se decide, va en un ticket aparte.
