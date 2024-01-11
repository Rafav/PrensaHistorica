// background.js

const url_base_descarga = "https://prensahistorica.mcu.es/es/";


function descargarPDFS(bodyHtml) {

  // Expresión regular para encontrar enlaces que contienen 'PDF' junto con otros caracteres
  let regex = /<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>\s*(.*PDF.*)\s*<\/a>/g;
  let hrefs = [];
  let match;

  // Busca coincidencias con la expresión regular
  while ((match = regex.exec(bodyHtml)) !== null) {
    // Añade el href a la lista
    hrefs.push(match[1]);
    let url_pdf = url_base_descarga + match[1];
    console.log('Descargo pdf ' + url_pdf);
    chrome.downloads.download({ url: url_pdf });

  }
}


function descargarJPG(bodyHtml) {

  // Expresión regular para encontrar enlaces que comiencen con 'img'
  let regex = /<a\s+id="img\d+"\s+href="([^"]+)"[^>]*>([^<]+)<\/a>/g;
  let match;

  // Busca coincidencias con la expresión regular
  while ((match = regex.exec(bodyHtml)) !== null) {
    // Extrae el href del enlace actual
    let href = match[1];
    // Extrae el texto del enlace actual
    let linkText = match[2].trim();

    // Utiliza una expresión regular para extraer el valor de 'path'
    let pathMatch = href.match(/path=(\d+)/);
    let pathValue = pathMatch ? pathMatch[1] : null;

    // Utiliza una expresión regular para extraer el número de página
    let pageNumberMatch = linkText.match(/Página (\d+)/);
    let pageNumber = pageNumberMatch ? pageNumberMatch[1] : null;

    // Si ambos, pathValue y pageNumber, están presentes, construye el nuevo enlace
    if (pathValue && pageNumber) {
      let newUrl = `https://prensahistorica.mcu.es/es/catalogo_imagenes/iniciar_descarga.do?interno=S&posicion=${pageNumber}&path=${pathValue}&formato=Imagen%20JPG&tipoDescarga=seleccion&rango=actual`;
      console.log('Bajo el JPG ' + newUrl);
      chrome.downloads.download({ url: newUrl });

    }
  }
}



function descargarObjetosDigitales(urlObjetosDigitales, path) {

  console.log('Descargamos objetos '+urlObjetosDigitales);
  fetch(url_base_descarga + urlObjetosDigitales)
    .then(response => response.text())  // Convertir la respuesta en texto
    .then(texto => {
      // Usa una expresión regular para encontrar solo el primer número dentro de un <span> con la clase "nav_descrip"
      let regex = /<span class="nav_descrip">\s*(\d+)\s+de\s+\d+\s*<\/span>/;
      let match = texto.match(regex);

      if (match) {
        let primerNumero = match[1];

        console.log("Primer número:", primerNumero);

        //descargamos la primera imagen
        let newUrl = `https://prensahistorica.mcu.es/es/catalogo_imagenes/iniciar_descarga.do?interno=S&posicion=${primerNumero}&path=${path}&formato=Imagen%20JPG&tipoDescarga=seleccion&rango=actual`;
        console.log('El primer objeto digital es ' + newUrl);
        chrome.downloads.download({ url: newUrl });

        //Buscamos más ocurrencias.

        let regex = /<a href='([^']+posicion=(\d+)&amp;[^']+)'/g;

        let hrefs = [];
        let matchSiguiente;

        // Busca coincidencias con la expresión regular
        while ((matchSiguiente = regex.exec(texto)) !== null) {
          // Añade el href a la lista, reemplazando '&amp;' por '&' para corregir la codificación HTML
          hrefs.push(matchSiguiente[1].replace(/&amp;/g, '&'));
          hrefs.push(matchSiguiente[2].replace(/&amp;/g, '&'));

          newUrl = `https://prensahistorica.mcu.es/es/catalogo_imagenes/iniciar_descarga.do?interno=S&posicion=${matchSiguiente[2]}&path=${path}&formato=Imagen%20JPG&tipoDescarga=seleccion&rango=actual`;

          chrome.downloads.download({ url: newUrl });
        }

        console.log(hrefs); // Imprime los hrefs encontrados


      } else {
        console.log("No se encontró el número en el formato esperado o el elemento no coincide.");
      }



    })

}


function localizaObjetosDigitales(bodyHtml) {
  console.log('localizamos objetos');

  // Expresión regular para encontrar enlaces con el texto 'Objetos digitales' (permitiendo espacios en blanco)
  //let regex = /<a\s+[^>]*href="([^"]+)"[^>]*>\s*Objetos digitales\s*<\/a>/g;
  
  let regex = /<a\s+[^>]*href="([^"]+)"[^>]*>\s*(Objetos digitales|Copia en JPEG)\s*<\/a>/g; 
  let hrefs = [];
  let paths = [];
  let match;

  // Busca coincidencias con la expresión regular
  while ((match = regex.exec(bodyHtml)) !== null) {
    // Añade el href a la lista
    hrefs.push(match[1]);

    // Extrae el valor de 'path'
    let pathMatch = match[1].match(/path=(\d+)/);
    let pathValue = pathMatch ? pathMatch[1] : null;

    // Añade el pathValue a la lista de paths
    if (pathValue) {
      paths.push(pathValue);
      let url_limpia = match[1].replace(/&amp;/g, '&');
      descargarObjetosDigitales(url_limpia, pathValue);
    }
  }

  console.log("hrefs:", hrefs);
  console.log("paths:", paths);
}


function bajaPagina(bodyHtml) {

    descargarPDFS(bodyHtml);
    descargarJPG(bodyHtml);
    localizaObjetosDigitales(bodyHtml);

}


function url_paginas_calendario(bodyHtml) {
  let regex = /(publicaciones\/listar_numeros\.do\?[^"]+posicion=)/g;
  let match;
  let url_paginador;

  // Busca coincidencias con la expresión regular
  match = regex.exec(bodyHtml);
  if (match) {
    url_paginador = url_base_descarga + (match[1].replace(/&amp;/g, '&'));
    console.log('CALENDARIO ' + url_paginador);
  }
  else {
    console.log('No se encontró paginador de CALENDARIO');
  }

  return url_paginador;

}


function url_paginas_resultados(bodyHtml) {


  let regex = /general_ocr=on\&amp\;id=(\d*)/;
  let match;
  let url_paginador;

  match = bodyHtml.match(regex);

  if (match) {
    let primerId = match[1]; // Captura el primer valor de 'id'
    url_paginador = 'https://prensahistorica.mcu.es/es/consulta/resultados_ocr.do?general_ocr=on&id=' + primerId + '&tipoResultados=PAG&posicion=';
    console.log('RESULTADOS ' + url_paginador);
  }
  else {
    console.log('No se encontró paginador de RESULTADOS');
  }
  return url_paginador;
}


function url_paginas_resultados_filtrados(bodyHtml) {

  let regex = /general_ocr=on\&amp\;id=(\d*)/;
  let match;
  let url_paginador;

  //BUSCO POR RESULTADOS DE BUSQUEDA PERO FILTRADOS - RESTRINGIDOS- EJEMPLO: https://prensahistorica.mcu.es/es/consulta/resultados_busqueda_restringida.do?idOrigen=20265&tipoResultados=PAG&descrip_pertenece=El+Cant%C3%A1brico+%3A+diario+de+la+ma%C3%B1ana&id=20281&posicion=51

  regex = /(consulta\/resultados_busqueda_restringida\.do\?[^"]+posicion=)/g;
  urls = [];
  match;

  // Busca coincidencias con la expresión regular
  match = regex.exec(bodyHtml);
  if (match) {
    url_paginador = url_base_descarga + (match[1].replace(/&amp;/g, '&'));
    console.log('RESULTADOS RESTRINGIDOS ' + url_paginador);
  }
  else {
    console.log('No se encontró paginador de RESULTADOS RESTRINGIDOS');
  }
  return url_paginador;
}

function bajarPaginas(bodyHtml, total, resultados_por_pagina, todas_las_paginas) {

  let url_paginador;
  url_paginador = url_paginas_calendario(bodyHtml) || url_paginas_resultados(bodyHtml) || url_paginas_resultados_filtrados(bodyHtml) || null;
  console.log('El paginador devuelve   ' + url_paginador);
  console.log('Todas las páginas tiene el valor de   ' + todas_las_paginas);


  if (url_paginador && todas_las_paginas) {
    //generamos la url de las sucesivas páginas  

    //if (parseInt(total, 10) > parseInt(resultados_por_pagina, 10)) {
      console.log('Bajamos la página 1 y siguientes');
      //Bajamos de la página 1 en adelante, la primera siempre se descarga

      let pagina_actual = 1;
      let total_paginas = Math.ceil(total / resultados_por_pagina);

      while (pagina_actual <= total_paginas) {

        console.log('Bajamos la página ' + pagina_actual);
        //generamos la URL

        let posicion = (pagina_actual - 1) * resultados_por_pagina + 1;
        let pagina_siguiente = url_paginador + posicion;

        console.log('Pagina descarga ' + pagina_siguiente);
        //procesamos

        fetch(pagina_siguiente)
          .then(response => response.text())  // Convertir la respuesta en texto
          .then(texto => {
            let texto_sin_ampersand = texto.replace(/&amp;/g, '&');
            bajaPagina(texto_sin_ampersand);
          });

        //actualizamos iterador , pagina_actual
        pagina_actual++;

      }
   // }
  }
  else {

    //Bajamos la primera página  en dos casos
    //CASO 1: el usuario solo quiere la página actual
    //CASO 2: el usuario quiere todas las páginas pero solo hay 1


    console.log('Bajamos solo la página actual');
    bajaPagina(bodyHtml.replace(/&amp;/g, '&'));

  }

}



chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === 'scrapedData') {


    bajarPaginas(request.codigo, request.total, request.resultados_por_pagina, request.todas_las_paginas);

  }
});

