/* ===================================================================
   js/ui.js · SOLO PRESENTACIÓN
   Conecta la barra lateral nueva con los controles que ya existen.
   No calcula nada: no toca el modelo, el solver, los escenarios,
   el modo reto ni la escena 3D. Todo lo que hace es:
     1. activar la pestaña correspondiente (reenviando el clic al .tab real),
     2. desplazar la vista hasta la sección pedida,
     3. abrir y cerrar el menú lateral en pantallas pequeñas,
     4. reenviar el botón "Simular semana" del banner al botón #play original.
   =================================================================== */
(function(){
  'use strict';

  var navItems = Array.prototype.slice.call(document.querySelectorAll('.nav-item'));
  var tabs     = Array.prototype.slice.call(document.querySelectorAll('.tab'));
  var body     = document.body;

  function marcar(item){
    navItems.forEach(function(x){ x.classList.toggle('on', x === item); });
  }
  function cerrarMenu(){ body.classList.remove('nav-open'); }

  /* ---------- 1 · barra lateral ---------- */
  navItems.forEach(function(item){
    item.addEventListener('click', function(){
      marcar(item);

      // reenvía el clic a la pestaña real: el manejador de js/app.js es el que manda
      var pane = item.dataset.pane;
      if (pane){
        var tab = document.querySelector('.tab[data-p="' + pane + '"]');
        if (tab && tab.getAttribute('aria-selected') !== 'true') tab.click();
      }

      var sel  = item.dataset.target;
      var dest = sel ? document.querySelector(sel) : null;
      if (dest){
        var modo = (sel === '#banner' || sel === '#stage') ? 'start' : 'nearest';
        // espera un frame: la pestaña recién abierta ya tiene altura
        requestAnimationFrame(function(){
          dest.scrollIntoView({ behavior:'smooth', block:modo });
        });
      }
      cerrarMenu();
    });
  });

  /* si el usuario usa las pestañas directamente, la barra lateral se sincroniza */
  tabs.forEach(function(tab){
    tab.addEventListener('click', function(){
      var item = navItems.filter(function(x){ return x.dataset.pane === tab.dataset.p; })[0];
      if (item) marcar(item);
    });
  });

  /* ---------- 2 · menú compacto en móvil ---------- */
  var btnMenu = document.getElementById('btnMenu');
  var sbClose = document.getElementById('sbClose');
  if (btnMenu) btnMenu.addEventListener('click', function(){ body.classList.toggle('nav-open'); });
  if (sbClose) sbClose.addEventListener('click', cerrarMenu);
  document.addEventListener('click', function(e){
    if (!body.classList.contains('nav-open')) return;
    if (e.target.closest && (e.target.closest('.sidebar') || e.target.closest('#btnMenu'))) return;
    cerrarMenu();
  });
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape') cerrarMenu();
  });

  /* ---------- 3 · botón del banner ---------- */
  var btnSim = document.getElementById('btnSimular');
  var play   = document.getElementById('play');
  if (btnSim && play){
    // no duplica la simulación: reenvía el clic al botón original
    btnSim.addEventListener('click', function(){ play.click(); });
    // y copia su estado para que las dos etiquetas digan lo mismo
    var espejo = function(){
      var corriendo = play.textContent.indexOf('Detener') >= 0;
      btnSim.innerHTML = corriendo ? '■ Detener simulación' : '▶ Simular semana';
    };
    espejo();
    if (window.MutationObserver){
      new MutationObserver(espejo).observe(play, { childList:true, characterData:true, subtree:true });
    }
  }
})();
