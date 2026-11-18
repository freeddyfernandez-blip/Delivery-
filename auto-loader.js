(function () {
  'use strict';
  // Carga el módulo Auto comprimido para mantener pequeño el paquete descargado.
  (async function () {
    try {
      const response = await fetch('./auto-module.js.gz');
      if (!response.ok) throw new Error('No se pudo descargar el módulo Auto (' + response.status + ').');
      if (typeof DecompressionStream === 'undefined') throw new Error('Este navegador no admite la descompresión necesaria para cargar Auto.');
      const source = await new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).text();
      const blobUrl = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
      const script = document.createElement('script');
      script.src = blobUrl;
      script.onload = function () { URL.revokeObjectURL(blobUrl); };
      script.onerror = function () { URL.revokeObjectURL(blobUrl); console.error('No se pudo ejecutar el módulo Auto.'); };
      document.head.appendChild(script);
    } catch (error) {
      console.error('Delivery Pro · Auto:', error);
      if (typeof showToast === 'function') showToast('No se pudo cargar Auto. Revisá la conexión y volvé a abrir la app.');
    }
  })();
})();