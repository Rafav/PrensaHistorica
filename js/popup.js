document.addEventListener('DOMContentLoaded', function () {
  const startButton = document.getElementById('startButton');

  startButton.addEventListener('click', function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const activeTab = tabs[0];

      // Enviar un mensaje al script de contenido (content.js)
      chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        function: startContentScript,
        args: [activeTab.url]
      });
    });
  });
});

function startContentScript(currentTab) {
  // Este código se ejecutará en el contexto de la pestaña activa
  // Realiza el scraping aquí y devuelve los resultados


  // Selecciona el elemento por su clase
  var element = document.querySelector('.nav_descrip');

  // Extrae el texto del elemento
  var text = element.innerText;

  // Utiliza una expresión regular para encontrar números en el texto
  var numbers = text.match(/\d+/g);

  // El último número en el arreglo será el valor que buscas (300 en este caso)
  var total = numbers[numbers.length - 1];

  console.log('Descargamos un total de '+total+' elementos');

  codigo = document.body.innerHTML;
  chrome.runtime.sendMessage({ action: 'scrapedData', codigo, total });


}

