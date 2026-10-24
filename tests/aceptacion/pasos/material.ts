import assert from 'node:assert/strict';
import { BeforeStep, Given, Then, When } from '@cucumber/cucumber';
import { PickleStepType } from '@cucumber/messages';
import { presente } from '../soporte/comprobar.ts';
import { APUNTES, PAGINA_CITADA, listaDeMaterial, unEspacio } from '../soporte/escenario-material.ts';
import { aBytes } from '../soporte/externos.ts';
import { aceptado, mundo } from '../soporte/mundo.ts';
import type { Mundo } from '../soporte/mundo.ts';
import { pdfDePrueba } from '../soporte/pdf.ts';
import type { PaginaCitada } from '../soporte/tipos-de-parametro.ts';

// Pasos del material del dominio (antecedentes y MATE-1).

const URL = /^https?:\/\//;
/** Lo que dice una página web que añade la persona sin que el escenario diga nada de ella (MATE-1.1). */
const PAGINA_WEB_POR_DEFECTO = 'El tema 3 trata de los pasos P1 y P2.';
const PAGINA_WEB_CAMBIADA = 'Esta página ahora trata de otra cosa.';

// Lo que hacen los «Dado» de MATE con la aplicación espera a lo externo (añadir material), así que la
// preparación se ejecuta aquí, antes del primer paso que no es un «Dado».
BeforeStep({ tags: '@MATE' }, async ({ pickleStep }) => {
  if (pickleStep.type !== PickleStepType.CONTEXT) {
    await mundo().listoAsincrono();
  }
});

// --- Antecedentes ----------------------------------------------------------------------------------

Given('que el material de {texto} incluye {pagina_citada}', (dominio: string, citada: PaginaCitada) => {
  const actual = mundo();
  // Los apuntes de prueba siempre son estos: los pasos de MATE-3 solo cambian cómo se parte la frase.
  assert.equal(citada.documento, APUNTES);
  assert.equal(citada.pagina, PAGINA_CITADA);
  actual.material.frase = citada.frase;
  actual.material.lineasDeLaFrase = [citada.frase];
  actual.prepararAsincrono(async () => {
    const pdf = pdfDePrueba(actual.material.paginasDeLosApuntes());
    aceptado(await actual.aplicacion().anadirMaterial({ dominio, nombre: APUNTES, bytes: pdf }));
  });
});

// --- MATE-1: el material se añade en PDF, PPTX, DOCX o URL ---------------------------------------

/** Lo que manda el móvil al añadir el material: la URL, o el fichero con unos bytes de su tipo. */
function peticionDeMaterial(actual: Mundo, dominio: string, material: string) {
  if (URL.test(material)) {
    if (!actual.externos.web.existe(material)) {
      actual.externos.web.publicar(material, PAGINA_WEB_POR_DEFECTO);
    }
    return { dominio, url: material };
  }
  const bytes = material.endsWith('.pdf')
    ? pdfDePrueba([[`Contenido de ${material}`]])
    : aBytes(`Contenido de ${material}`);
  return { dominio, nombre: material, bytes };
}

/** La aplicación rechazó el último material por `causa` y no lo puso en la lista (MATE-1.3, MATE-1.4). */
function comprobarNoAnadido(causa: string): void {
  const actual = mundo();
  const resultado = presente(actual.ultimoResultado, 'ninguna respuesta al añadir el material');
  assert.ok(!resultado.ok, 'La aplicación añadió el material');
  assert.equal(resultado.causa, causa);
  assert.ok(!listaDeMaterial(actual).includes(actual.material.ultimoMaterial), 'El material está en la lista');
}

Given('que LibreOffice está instalado en el PC', () => {
  mundo().externos.libreOffice.estaInstalado = true;
});

Given('que LibreOffice no está instalado en el PC', () => {
  mundo().externos.libreOffice.estaInstalado = false;
});

When('la persona añade {texto} al material de {texto}', async (material: string, dominio: string) => {
  const actual = mundo();
  actual.material.ultimoMaterial = material;
  const peticion = peticionDeMaterial(actual, dominio, material);
  actual.ultimoResultado = await actual.aplicacion().anadirMaterial(peticion);
});

Then('{texto} aparece en la lista de material de {texto}', (material: string, dominio: string) => {
  const actual = mundo();
  aceptado(presente(actual.ultimoResultado, 'ninguna respuesta al añadir el material'));
  assert.ok(listaDeMaterial(actual, dominio).includes(material), `${material} no está en la lista de material`);
});

Then('la aplicación guarda una versión en PDF de {texto}, convertida con LibreOffice', (fichero: string) => {
  const { libreOffice, ficheros } = mundo().externos;
  const conversion = presente(
    libreOffice.conversiones.find((candidata) => candidata.nombre === fichero),
    `ninguna conversión de ${fichero} con LibreOffice`,
  );
  const pdf = Buffer.from(conversion.pdf);
  assert.ok(
    ficheros.escritos.some((escrito) => Buffer.from(escrito.bytes).equals(pdf)),
    'La aplicación no ha guardado el PDF que devolvió LibreOffice',
  );
});

Then('la aplicación no lo añade e indica que para los PPTX y los DOCX hay que instalar LibreOffice en el PC', () => {
  comprobarNoAnadido('falta_libreoffice');
});

Then('la aplicación no lo añade e indica que admite PDF, PPTX, DOCX y URL', () => {
  comprobarNoAnadido('tipo_no_admitido');
});

Given('que la persona añadió {texto} cuando la página decía {texto}', (url: string, frase: string) => {
  const actual = mundo();
  actual.material.ultimoMaterial = url;
  actual.material.fraseWeb = frase;
  actual.prepararAsincrono(async () => {
    actual.externos.web.publicar(url, frase);
    aceptado(await actual.aplicacion().anadirMaterial({ dominio: actual.dominio, url }));
  });
});

Given('que después la página ya no dice esa frase', () => {
  const actual = mundo();
  actual.preparar(() => {
    actual.externos.web.publicar(actual.material.ultimoMaterial, PAGINA_WEB_CAMBIADA);
  });
});

Given('que después la página ya no existe', () => {
  const actual = mundo();
  actual.preparar(() => {
    actual.externos.web.retirar(actual.material.ultimoMaterial);
  });
});

Then('«Ver fuente» de {item} muestra la frase dentro de la copia que se guardó al añadir la página', (item: string) => {
  const actual = mundo();
  const hoja = aceptado(actual.aplicacion().verFuente({ dominio: actual.dominio, pieza: item }));
  assert.equal(hoja.documento, actual.material.ultimoMaterial);
  assert.equal(hoja.fragmento, actual.material.fraseWeb);
  assert.ok(unEspacio(hoja.texto).includes(actual.material.fraseWeb), 'La hoja no trae la frase de la copia');
});
