document.addEventListener('DOMContentLoaded', function () {
  const startButton = document.getElementById('startButton');

  startButton.addEventListener('click', function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const activeTab = tabs[0];

      // Enviar un mensaje al script de contenido (content.js)
      chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        function: startContentScript,
        args: [activeTab.url, true]
      });
    });
  });

  const startSinglePageButton = document.getElementById('startSinglePageButton');

  startSinglePageButton.addEventListener('click', function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const activeTab = tabs[0];

      // Enviar un mensaje al script de contenido (content.js)
      chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        function: startContentScript,
        args: [activeTab.url, false]
      });
    });
  });
});





function startContentScript(currentTab, todas_las_paginas) {
  // Este código se ejecutará en el contexto de la pestaña activa
  // Realiza el scraping aquí y devuelve los resultados


  // Selecciona el elemento por su clase
  var element = document.querySelector('.nav_descrip');
  if (element) {
    // Extrae el texto del elemento
    var text = element.innerText;

    // Utiliza una expresión regular para encontrar números en el texto
    var numbers = text.match(/\d+/g);

    // El último número en el arreglo será el valor que buscas 


    var resultados_por_pagina = parseInt(numbers[numbers.length - 2]);
    var total = parseInt(numbers[numbers.length - 1]);

    console.log('Hay un total de ' + total + ' elementos en páginas de ' + resultados_por_pagina);

    codigo = document.body.innerHTML;
    chrome.runtime.sendMessage({ action: 'scrapedData', codigo, total, resultados_por_pagina, todas_las_paginas });
  }
  else {
    alert('Resultados no encontrados. Revise https://github.com/Rafav/PrensaHistorica/blob/main/README.md para las funcionalidades.');
  }

}

