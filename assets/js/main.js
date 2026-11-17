/* Hazlo Fácil con Montse — lógica del cuestionario (vanilla JS, sin dependencias) */
(function () {
  'use strict';

  /* =====================================================================
     TODO CONFIG
     - El enlace de Cal.com se define en index.html (a#btnReservar, atributo href).
     - webhookUrl: OPCIONAL. Si pones aquí una URL (Make, Zapier, n8n, formulario propio…)
       se enviará un POST JSON con las 4 respuestas al llegar a la pantalla final.
       Vacío = las respuestas NO se guardan ni se envían a ningún sitio.
       Si lo activas, añade la información correspondiente en la política de privacidad.
     ===================================================================== */
  var CONFIG = {
    webhookUrl: ''
  };

  var form = document.getElementById('cuestionarioForm');
  if (!form) return;

  var steps = Array.prototype.slice.call(form.querySelectorAll('.cuestionario-step'));
  var status = document.getElementById('cuestionarioEstado');
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var current = 0;
  var timer = null;
  var sent = false;

  function show(index, moveFocus) {
    current = Math.max(0, Math.min(steps.length - 1, index));
    steps.forEach(function (step, i) {
      var active = i === current;
      step.hidden = !active;
      step.classList.toggle('activo', active);
    });
    var heading = steps[current].querySelector('h2');
    // El foco ya anuncia cada pregunta; la región live solo avisa del final
    if (status && moveFocus && current === steps.length - 1) status.textContent = 'Test completado';
    if (moveFocus && heading) heading.focus({ preventScroll: true });
    if (current === steps.length - 1) submitAnswers();
  }

  function next() { if (current < steps.length - 1) show(current + 1, true); }
  function prev() { clearTimeout(timer); if (current > 0) show(current - 1, true); }

  function submitAnswers() {
    if (sent || !CONFIG.webhookUrl) return;
    sent = true;
    var data = {};
    new FormData(form).forEach(function (value, key) { data[key] = value; });
    try {
      fetch(CONFIG.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        keepalive: true
      }).catch(function () { sent = false; });
    } catch (e) { sent = false; }
  }

  // Opciones: auto-avance (click también se dispara al volver a elegir la misma opción)
  form.addEventListener('click', function (e) {
    var t = e.target;
    // Auto-avance solo con ratón/táctil (detail>0). Con teclado, las flechas no saltan: se avanza con Intro.
    if (t.matches('input[type="radio"]')) {
      if (e.detail > 0) {
        clearTimeout(timer);
        timer = setTimeout(next, reducedMotion ? 0 : 300);
      }
    } else if (t.closest('[data-continuar]')) {
      next();
    } else if (t.closest('[data-volver]')) {
      prev();
    }
  });

  form.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.matches('input[type="radio"]') && e.target.checked) {
      e.preventDefault();
      next();
    }
  });

  // Enter en el textarea no envía el formulario; el envío nativo queda bloqueado
  form.addEventListener('submit', function (e) { e.preventDefault(); });

  show(0, false);
})();
