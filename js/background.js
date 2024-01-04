// background.js

const url_base_descarga = "https://prensahistorica.mcu.es/es/";
const elementosPorPagina = 50;


function descargarPDFS(bodyHtml) {

  // Expresión regular para encontrar enlaces que contienen 'PDF' junto con otros caracteres
  var regex = /<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>\s*(.*PDF.*)\s*<\/a>/g;
  var hrefs = [];
  var match;

  // Busca coincidencias con la expresión regular
  while ((match = regex.exec(bodyHtml)) !== null) {
    // Añade el href a la lista
    hrefs.push(match[1]);
    var url_pdf = url_base_descarga + match[1];
    console.log('Descargo pdf ' + url_pdf);
    chrome.downloads.download({ url: url_pdf });
  }
}


function descargarJPG(bodyHtml) {

  // Expresión regular para encontrar enlaces que comiencen con 'img'
  var regex = /<a\s+id="img\d+"\s+href="([^"]+)"[^>]*>([^<]+)<\/a>/g;
  var match;

  // Busca coincidencias con la expresión regular
  while ((match = regex.exec(bodyHtml)) !== null) {
    // Extrae el href del enlace actual
    var href = match[1];
    // Extrae el texto del enlace actual
    var linkText = match[2].trim();

    // Utiliza una expresión regular para extraer el valor de 'path'
    var pathMatch = href.match(/path=(\d+)/);
    var pathValue = pathMatch ? pathMatch[1] : null;

    // Utiliza una expresión regular para extraer el número de página
    var pageNumberMatch = linkText.match(/Página (\d+)/);
    var pageNumber = pageNumberMatch ? pageNumberMatch[1] : null;

    // Si ambos, pathValue y pageNumber, están presentes, construye el nuevo enlace
    if (pathValue && pageNumber) {
      var newUrl = `https://prensahistorica.mcu.es/es/catalogo_imagenes/iniciar_descarga.do?interno=S&posicion=${pageNumber}&path=${pathValue}&formato=Imagen%20JPG&tipoDescarga=seleccion&rango=actual`;
      console.log('Bajo el JPG ' + newUrl);
      chrome.downloads.download({ url: newUrl });

    }
  }
}



function descargarObjetosDigitales(urlObjetosDigitales, path) {

  fetch(url_base_descarga + urlObjetosDigitales)
    .then(response => response.text())  // Convertir la respuesta en texto
    .then(texto => {
      // Usa una expresión regular para encontrar solo el primer número dentro de un <span> con la clase "nav_descrip"
      var regex = /<span class="nav_descrip">\s*(\d+)\s+de\s+\d+\s*<\/span>/;
      var match = texto.match(regex);

      if (match) {
        var primerNumero = match[1];

        console.log("Primer número:", primerNumero);

        var regex = /<a href='([^']+posicion=(\d+)&amp;[^']+)'/g;

        var hrefs = [];
        var matchSiguiente;

        // Busca coincidencias con la expresión regular
        while ((matchSiguiente = regex.exec(texto)) !== null) {
          // Añade el href a la lista, reemplazando '&amp;' por '&' para corregir la codificación HTML
          hrefs.push(matchSiguiente[1].replace(/&amp;/g, '&'));
          hrefs.push(matchSiguiente[2].replace(/&amp;/g, '&'));

          var newUrl = `https://prensahistorica.mcu.es/es/catalogo_imagenes/iniciar_descarga.do?interno=S&posicion=${matchSiguiente[2]}&path=${path}&formato=Imagen%20JPG&tipoDescarga=seleccion&rango=actual`;

          chrome.downloads.download({ url: newUrl });
        }

        console.log(hrefs); // Imprime los hrefs encontrados


      } else {
        console.log("No se encontró el número en el formato esperado o el elemento no coincide.");
      }

      //descargamos la primera imagen
      var newUrl = `https://prensahistorica.mcu.es/es/catalogo_imagenes/iniciar_descarga.do?interno=S&posicion=${primerNumero}&path=${path}&formato=Imagen%20JPG&tipoDescarga=seleccion&rango=actual`;
      //console.log(newUrl);
      chrome.downloads.download({ url: newUrl });

    })

}


function localizaObjetosDigitales(bodyHtml) {


  // Expresión regular para encontrar enlaces con el texto 'Objetos digitales' (permitiendo espacios en blanco)
  var regex = /<a\s+[^>]*href="([^"]+)"[^>]*>\s*Objetos digitales\s*<\/a>/g;
  var hrefs = [];
  var paths = [];
  var match;

  // Busca coincidencias con la expresión regular
  while ((match = regex.exec(bodyHtml)) !== null) {
    // Añade el href a la lista
    hrefs.push(match[1]);

    // Extrae el valor de 'path'
    var pathMatch = match[1].match(/path=(\d+)/);
    var pathValue = pathMatch ? pathMatch[1] : null;

    // Añade el pathValue a la lista de paths
    if (pathValue) {
      paths.push(pathValue);
      var url_limpia = match[1].replace(/&amp;/g, '&');
      descargarObjetosDigitales(url_limpia, pathValue);
    }
  }

  //console.log("hrefs:", hrefs);
  //console.log("paths:", paths);
}


function bajaPagina(bodyHtml) {

  descargarPDFS(bodyHtml);
  descargarJPG(bodyHtml);
  localizaObjetosDigitales(bodyHtml);

}

function bajarPaginas(bodyHtml, total) {

  //bajamos la primera página
  console.log('Bajamos la primera página');
  bajaPagina(bodyHtml);


  //generamos la url de las páginas siguientes 
  if (total > elementosPorPagina) {

    // Expresión regular para encontrar enlaces y capturar el valor del primer match del campo 'id'
    var regex = /general_ocr=on\&amp\;id=(\d*)/;
    var match = bodyHtml.match(regex);

    if (match) {
      var primerId = match[1]; // Captura el primer valor de 'id'

      //console.log("Primer ID encontrado:", primerId);

      //Bajamos de la página 2 en adelante, la primera siempre se descarga

      var pagina_actual = 2;
      var total_paginas = Math.round(total / elementosPorPagina);

      while (pagina_actual <= total_paginas) {

        console.log('Bajamos la página ' + pagina_actual);
        //generamos la URL

        var posicion = (pagina_actual - 1) * elementosPorPagina + 1;
        var newUrl = `https://prensahistorica.mcu.es/es/consulta/resultados_ocr.do?general_ocr=on&id=${primerId}&tipoResultados=PAG&posicion=${posicion}`;

        console.log(newUrl);
        //procesamos
        fetch(newUrl)
          .then(response => response.text())  // Convertir la respuesta en texto
          .then(texto => {
            var texto_sin_ampersand = texto.replace(/&amp;/g, '&');
            bajaPagina(texto_sin_ampersand);
          });
        //actualizamos iterador , pagina_actual
        pagina_actual++;

      }

    } else {
      console.log("No se encontró un ID en el formato esperado.");
    }
  }
}


chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === 'scrapedData') {

    bajarPaginas(request.codigo, request.total);

  }
});

