import { describe, expect, it } from 'vitest';
import { textoDelHtml } from '../../src/aplicacion/texto-html.ts';

const UTF8 = 'text/html; charset=utf-8';

/** Los bytes del HTML en UTF-8, como los serviría una página. */
function enUtf8(html: string): Uint8Array {
  return new TextEncoder().encode(html);
}

/** El texto de un HTML en UTF-8: la mayoría de los casos solo cambia el HTML. */
function texto(html: string): string {
  return textoDelHtml(enUtf8(html), UTF8);
}

// «café» en ISO-8859-1: la «é» es un solo byte (0xE9), que en UTF-8 sería un byte suelto inválido.
const CAFE_ISO_8859_1 = Uint8Array.from([0x63, 0x61, 0x66, 0xe9]);

describe('textoDelHtml, regla 1: la codificación', () => {
  it('@MATE-1.1 sin charset se lee como UTF-8', () => {
    expect(textoDelHtml(enUtf8('café'), 'text/html')).toBe('café');
    expect(textoDelHtml(enUtf8('café'), '')).toBe('café');
  });

  it('@MATE-1.1 lee los bytes con el charset del tipo de contenido', () => {
    expect(textoDelHtml(CAFE_ISO_8859_1, 'text/html; charset=ISO-8859-1')).toBe('café');
  });

  it('@MATE-1.1 el charset no distingue mayúsculas y admite comillas', () => {
    expect(textoDelHtml(CAFE_ISO_8859_1, 'text/html; CHARSET=ISO-8859-1')).toBe('café');
    expect(textoDelHtml(CAFE_ISO_8859_1, 'text/html; charset=iso-8859-1')).toBe('café');
    expect(textoDelHtml(CAFE_ISO_8859_1, 'text/html; charset="ISO-8859-1"')).toBe('café');
    expect(textoDelHtml(CAFE_ISO_8859_1, "text/html; charset='iso-8859-1'")).toBe('café');
    expect(textoDelHtml(CAFE_ISO_8859_1, 'text/html; charset = ISO-8859-1; boundary=x')).toBe('café');
  });

  it('@MATE-1.1 un charset que TextDecoder no conoce se lee como UTF-8', () => {
    expect(textoDelHtml(enUtf8('café'), 'text/html; charset=klingon')).toBe('café');
  });

  it('@MATE-1.1 un charset vacío se lee como UTF-8', () => {
    expect(textoDelHtml(enUtf8('café'), 'text/html; charset=')).toBe('café');
  });

  it('@MATE-1.1 sin bytes el texto es vacío', () => {
    expect(textoDelHtml(new Uint8Array(), UTF8)).toBe('');
  });
});

describe('textoDelHtml, regla 2: comentarios, script y style', () => {
  it('@MATE-1.1 quita los comentarios con lo que llevan dentro, también los de varias líneas', () => {
    expect(texto('a<!-- <p>oculto</p> -->b')).toBe('ab');
    expect(texto('<p>uno</p><!--\n varias\n líneas\n--><p>dos</p>')).toBe('uno\ndos');
  });

  it('@MATE-1.1 quita script y style con lo que llevan dentro', () => {
    expect(texto('<p>uno</p><script>var a = "<p>no</p>";</script><p>dos</p>')).toBe('uno\ndos');
    expect(texto('<style>p { color: red; }</style><p>uno</p>')).toBe('uno');
  });

  it('@MATE-1.1 script y style llevan atributos, cualquier combinación de mayúsculas y cierre con espacios', () => {
    expect(texto('a<Script type="text/javascript" src="x.js">alert(1)</SCRIPT >b')).toBe('ab');
    expect(texto('a<STYLE media="print">p{}</Style>b')).toBe('ab');
  });

  it('@MATE-1.1 un script se cierra con su propio nombre, no con el de un style', () => {
    expect(texto('a<script>x</style>y</script>b')).toBe('ab');
  });

  it('@MATE-1.1 un elemento cuyo nombre solo empieza como script no se quita', () => {
    expect(texto('a<scripts>b</scripts>c')).toBe('abc');
  });
});

describe('textoDelHtml, regla 3: los espacios del código', () => {
  it('@MATE-1.1 un tramo de espacios, tabuladores y saltos de línea es un solo espacio', () => {
    expect(texto('<p>uno   \t dos\n\n\r\n  tres</p>')).toBe('uno dos tres');
  });

  it('@MATE-1.1 el espacio duro escrito en el código no se junta con los demás', () => {
    expect(texto('<p>a  b</p>')).toBe('a  b');
  });

  it('@MATE-1.1 los saltos de línea del código no parten el texto', () => {
    expect(texto('<p>una frase\nen dos líneas\ndel código</p>')).toBe('una frase en dos líneas del código');
  });
});

describe('textoDelHtml, regla 4: las etiquetas', () => {
  const BLOQUES = [
    'p',
    'div',
    'br',
    'hr',
    'li',
    'ul',
    'ol',
    'dl',
    'dt',
    'dd',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'table',
    'caption',
    'tr',
    'td',
    'th',
    'title',
    'section',
    'article',
    'header',
    'footer',
    'nav',
    'aside',
    'main',
    'blockquote',
    'pre',
    'figure',
    'figcaption',
  ];

  it.each(BLOQUES)('@MATE-1.1 <%s> al abrirse y al cerrarse es un salto de línea', (etiqueta) => {
    expect(texto(`uno<${etiqueta}>dos</${etiqueta}>tres`)).toBe('uno\ndos\ntres');
  });

  it('@MATE-3.3 las celdas de una tabla no se pegan: cada una va en su línea', () => {
    expect(texto('<table><tr><th>Paso</th><th>Orden</th></tr><tr><td>P1</td><td>antes</td></tr></table>')).toBe(
      'Paso\nOrden\nP1\nantes',
    );
  });

  it('@MATE-1.1 las etiquetas de bloque llevan atributos, mayúsculas y barra de cierre', () => {
    expect(texto('uno<BR/>dos<br />tres<P class="a" id=\'b\'>cuatro</P>cinco')).toBe('uno\ndos\ntres\ncuatro\ncinco');
    expect(texto('uno<H2 CLASS="x">dos</H2>')).toBe('uno\ndos');
  });

  it('@MATE-1.1 las demás etiquetas desaparecen sin dejar espacio', () => {
    expect(texto('<b>ho</b>la')).toBe('hola');
    expect(texto('<p>un <em>buen</em><span class="x"> ejemplo</span> de <a href="/u?a=1&b=2">enlace</a></p>')).toBe(
      'un buen ejemplo de enlace',
    );
  });

  it('@MATE-1.1 una etiqueta cuyo nombre solo empieza como uno de bloque no parte la línea', () => {
    expect(texto('uno<param name="x">dos<br2>tres<pre2>cuatro')).toBe('unodostrescuatro');
  });

  it('@MATE-1.1 el tipo de documento y las instrucciones de proceso se quitan', () => {
    expect(texto('<!DOCTYPE html><?xml version="1.0"?><p>uno</p>')).toBe('uno');
  });

  it('@MATE-1.1 una «<» que no abre una etiqueta es texto', () => {
    expect(texto('<p>2 < 3 y 5 > 4</p>')).toBe('2 < 3 y 5 > 4');
  });
});

describe('textoDelHtml, regla 5: las entidades', () => {
  it('@MATE-1.1 decodifica las entidades numéricas, decimales y hexadecimales', () => {
    expect(texto('<p>&#233; &#xE9; &#XE9; &#x1F600; &#65;</p>')).toBe('é é é 😀 A');
  });

  const CON_NOMBRE: readonly (readonly [string, string])[] = [
    ['amp', '&'],
    ['lt', '<'],
    ['gt', '>'],
    ['quot', '"'],
    ['apos', "'"],
    ['nbsp', ' '],
    ['aacute', 'á'],
    ['eacute', 'é'],
    ['iacute', 'í'],
    ['oacute', 'ó'],
    ['uacute', 'ú'],
    ['Aacute', 'Á'],
    ['Eacute', 'É'],
    ['Iacute', 'Í'],
    ['Oacute', 'Ó'],
    ['Uacute', 'Ú'],
    ['auml', 'ä'],
    ['euml', 'ë'],
    ['iuml', 'ï'],
    ['ouml', 'ö'],
    ['uuml', 'ü'],
    ['Auml', 'Ä'],
    ['Euml', 'Ë'],
    ['Iuml', 'Ï'],
    ['Ouml', 'Ö'],
    ['Uuml', 'Ü'],
    ['ntilde', 'ñ'],
    ['Ntilde', 'Ñ'],
    ['iquest', '¿'],
    ['iexcl', '¡'],
    ['laquo', '«'],
    ['raquo', '»'],
    ['ordm', 'º'],
    ['ordf', 'ª'],
    ['ndash', '–'],
    ['mdash', '—'],
    ['lsquo', '‘'],
    ['rsquo', '’'],
    ['ldquo', '“'],
    ['rdquo', '”'],
    ['hellip', '…'],
    ['middot', '·'],
    ['euro', '€'],
  ];

  it.each(CON_NOMBRE)('@MATE-1.1 &%s; es «%s»', (nombre, caracter) => {
    // Entre dos letras, para que `trim` no quite el espacio duro de &nbsp; y se vea que se ha decodificado.
    expect(texto(`<p>a&${nombre};b</p>`)).toBe(`a${caracter}b`);
  });

  it('@MATE-1.1 las entidades se decodifican después de quitar las etiquetas: &lt;p&gt; queda como texto', () => {
    expect(texto('<p>&lt;p&gt;hola&lt;/p&gt;</p>')).toBe('<p>hola</p>');
  });

  it('@MATE-1.1 se decodifica una sola vez: &amp;lt; da &lt;', () => {
    expect(texto('<p>&amp;lt; &amp;#233;</p>')).toBe('&lt; &#233;');
  });

  it('@MATE-1.1 una entidad desconocida se queda tal cual', () => {
    expect(texto('<p>a &foo; b &#12a; c &#x; d</p>')).toBe('a &foo; b &#12a; c &#x; d');
  });

  it('@MATE-1.1 los nombres de entidad distinguen mayúsculas y no heredan las propiedades de un objeto', () => {
    expect(texto('<p>&AMP; &Ntilde; &NTILDE; &constructor; &toString;</p>')).toBe(
      '&AMP; Ñ &NTILDE; &constructor; &toString;',
    );
  });

  it('@MATE-1.1 sin el «;» final no es una entidad', () => {
    expect(texto('<p>AT&T y &amp y &#233</p>')).toBe('AT&T y &amp y &#233');
  });

  it('@MATE-1.1 un número que no es un carácter se queda tal cual', () => {
    // 0x110000 es el primero que pasa del último carácter de Unicode; 0xD800 es un sustituto suelto.
    expect(texto('<p>&#1114112; &#x110000; &#xD800; &#99999999999999999999999999;</p>')).toBe(
      '&#1114112; &#x110000; &#xD800; &#99999999999999999999999999;',
    );
  });

  it('@MATE-1.1 el último carácter de Unicode sí lo es', () => {
    expect(texto('<p>a&#x10FFFF;b</p>')).toBe('a\u{10FFFF}b');
  });
});

describe('textoDelHtml, regla 6: las líneas', () => {
  it('@MATE-1.1 cada línea sin espacios al principio ni al final', () => {
    expect(texto('<p>  uno  </p><div> dos <b>tres</b> </div>')).toBe('uno\ndos tres');
  });

  it('@MATE-1.1 las líneas vacías no salen', () => {
    expect(texto('<p>uno</p> <p></p>\n<br><br>\n<p> </p><p>dos</p>')).toBe('uno\ndos');
    expect(texto('<div><div><p>uno</p></div></div>')).toBe('uno');
  });

  it('@MATE-1.1 una línea que solo trae un espacio duro tampoco sale', () => {
    expect(texto('<p>uno</p><p>&nbsp;</p><p>&#160;</p><p>dos</p>')).toBe('uno\ndos');
  });

  it('@MATE-1.1 un salto de línea escrito como entidad parte la línea', () => {
    expect(texto('<p>uno&#10;dos</p>')).toBe('uno\ndos');
  });

  it('@MATE-1.1 una página sin etiquetas es una sola línea', () => {
    expect(texto('solo texto')).toBe('solo texto');
  });
});

describe('textoDelHtml, la página que sirve el doble de los escenarios', () => {
  const PAGINA =
    '<html><head><title>Tema 3</title></head><body><p>El paso P1 va antes que el paso P2.</p></body></html>';

  it('@MATE-1.1 da el título y el párrafo, cada uno en su línea', () => {
    expect(texto(PAGINA)).toBe('Tema 3\nEl paso P1 va antes que el paso P2.');
  });

  it('@MATE-1.5 la frase de una cita sale entera en una línea de la copia', () => {
    expect(texto(PAGINA).split('\n')).toContain('El paso P1 va antes que el paso P2.');
  });

  it('@MATE-1.5 la página cambiada da otro texto, y el de la copia sigue siendo el de antes', () => {
    const copia = texto(PAGINA);
    const cambiada = texto(PAGINA.replace('P1 va antes que el paso P2', 'P2 va antes que el paso P1'));
    expect(cambiada).toBe('Tema 3\nEl paso P2 va antes que el paso P1.');
    expect(copia).toBe('Tema 3\nEl paso P1 va antes que el paso P2.');
  });
});
