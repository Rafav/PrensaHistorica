// background.js

const url_base_descarga = "https://prensahistorica.mcu.es/es/";


const elementosPorPagina = 10;


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
    chrome.downloads.download({ url: url_pdf });
  }

  console.log("Enlaces PDF encontrados:", hrefs);

}


function descargarJPG(bodyHtml) {

  // Expresión regular para encontrar enlaces que comiencen con 'img'
  var regex = /<a\s+id="img\d+"\s+href="([^"]+)"[^>]*>([^<]+)<\/a>/g;
  var newUrls = [];
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
      newUrls.push(newUrl);
      chrome.downloads.download({ url: newUrl });

    }
  }

  console.log(newUrls);

}




function descargarObjetosDigitales(urlObjetosDigitales, path) {

  /*
    fetch(url_base_descarga+urlObjetosDigitales, {
      method: 'GET', // o 'POST' según sea necesario
      redirect: 'manual' // Esto evita que el navegador siga la redirección automáticamente
    })
      .then(response => {
        if (response.type === 'opaqueredirect') {
          // La respuesta es una redirección; captura la URL de redirección
          let redirectedUrl = response.url;
          console.log('URL de redirección:', redirectedUrl);
          // Aquí puedes realizar acciones adicionales con la URL de redirección
        } else {
          // Manejo normal de la respuesta
          return response.text(); // o response.json() según el tipo de respuesta
        }
      })
      .then(data => {
        // Haz algo con los datos (si no es una redirección)
        console.log(data);
      })
      .catch(error => {
        console.error('Error en la petición fetch:', error);
      });
  
  
  
    */


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
      
    chrome.downloads.download({ url: newUrl});
}

console.log(hrefs); // Imprime los hrefs encontrados
      

      } else {
        console.log("No se encontró el número en el formato esperado o el elemento no coincide.");
      }

      //descargamos la primera imagen
      var newUrl = `https://prensahistorica.mcu.es/es/catalogo_imagenes/iniciar_descarga.do?interno=S&posicion=${primerNumero}&path=${path}&formato=Imagen%20JPG&tipoDescarga=seleccion&rango=actual`;
      console.log(newUrl);
      chrome.downloads.download({ url: newUrl });

    })

}



/*
// Expresión regular para encontrar enlaces con 'id' que comienza con 'img' y que contienen 'Página -'
var regex = /<a\s+id="img\d+"\s+href="([^"]+)"[^>]*>\s*Página -\s*<\/a>/g;
var newUrls = [];
var match;

// Busca coincidencias con la expresión regular
while ((match = regex.exec(bodyHtml)) !== null) {
  // Extrae el href del enlace actual
  var href = match[1];
  console.log(href);

  // Utiliza una expresión regular para extraer el valor de 'path'
  var pathMatch = href.match(/path=(\d+)/);
  var pathValue = pathMatch ? pathMatch[1] : null;

  // Si pathValue está presente, construye el nuevo enlace
  // No se extrae el número de página ya que el texto es 'Página -'
  if (pathValue) {
    //hay que seguir el enlace para obtener la posicion en el documento    
    //fetch(url_base_descarga+href,{
    fetch('https://prensahistorica.mcu.es/es/catalogo_imagenes/grupo.do?path=735193&texto_busqueda=travesedo', {
      redirect: "follow"
    })
      .then(response => response.text())  // Convertir la respuesta en texto
      .then(texto => {
        console.log(texto);
        console.log(href);
      })
  }
}

console.log(newUrls);
}

*/





function localizaObjetosDigitales(bodyHtml) {

  // Expresión regular para encontrar enlaces con el texto 'Objetos digitales', permitiendo espacios antes y después

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

  console.log("hrefs:", hrefs);
  console.log("paths:", paths);
}


function bajarPagina(url_pagina, numero_pagina) {
  //generamos la url de la página correspondiente


  const url = new URL(url_pagina);
  var iteracion = numero_pagina * elementosPorPagina;

  // Modificar el valor del parámetro 's' que sirve de paginador
  url.searchParams.set('s', iteracion);

  // Devolver la URL modificada
  console.log(numero_pagina * elementosPorPagina);

  console.log('Bajamos ' + url.toString());

  fetch(url.toString())
    .then(response => response.text())  // Convertir la respuesta en texto
    .then(texto => {
      // Usamos una expresión regular para encontrar todos los enlaces que contienen 'pdf'
      const regex = /href="([^"]+\.pdf)/g;
      let enlaces = [];
      let match;

      while ((match = regex.exec(texto)) !== null) {
        enlaces.push(match[1]);
        let url_pdf = url_base_descarga + match[1];
        console.log(url_pdf);
        chrome.downloads.download({ url: url_pdf });
      }
      console.log("Enlaces PDF encontrados:", enlaces);
    })
    .catch(error => {
      console.error("Error al obtener la página:", error);
    });

}


chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === 'scrapedData') {

    descargarPDFS(request.codigo);
    descargarJPG(request.codigo);
    localizaObjetosDigitales(request.codigo);
    //bajamos pagina a pagina

    //bajarPagina(request.currentTab, paginaActual);
    //paginaActual++;
  }
});

