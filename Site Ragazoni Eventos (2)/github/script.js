/* ============================================================
   RAGAZONI EVENTOS — interactions v2
   ============================================================ */
(function () {
  'use strict';

  /* ---- year ---- */
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  /* ---- nav scrolled + hide on scroll down ---- */
  var nav = document.getElementById('nav');
  var lastY = 0;
  function onScroll() {
    var y = window.scrollY;
    if (y > 40) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
    if (y > 120) {
      if (y > lastY) nav.classList.add('nav-hidden');
      else nav.classList.remove('nav-hidden');
    } else {
      nav.classList.remove('nav-hidden');
    }
    lastY = y;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---- mobile menu ---- */
  var burger = document.getElementById('burger');
  var menu = document.getElementById('mobileMenu');
  function closeMenu() { burger.classList.remove('open'); menu.classList.remove('open'); document.body.style.overflow = ''; }
  burger.addEventListener('click', function () {
    var open = burger.classList.toggle('open');
    menu.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) nav.classList.remove('nav-hidden');
  });
  menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeMenu); });

  /* ---- hero entrance ---- */
  var hero = document.querySelector('.hero');
  if (hero) requestAnimationFrame(function () { setTimeout(function () { hero.classList.add('ready'); }, 120); });

  /* ---- scroll reveal ---- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
  document.querySelectorAll('[data-reveal]').forEach(function (el) { io.observe(el); });

  /* ---- depoimentos carousel ---- */
  var track = document.getElementById('depoTrack');
  if (track) {
    var slides = track.children.length;
    var dotsWrap = document.getElementById('depoDots');
    var idx = 0, timer;

    for (var i = 0; i < slides; i++) {
      var b = document.createElement('button');
      b.setAttribute('aria-label', 'Depoimento ' + (i + 1));
      (function (n) { b.addEventListener('click', function () { go(n, true); }); })(i);
      dotsWrap.appendChild(b);
    }
    var dots = dotsWrap.children;

    function render() {
      track.style.transform = 'translateX(-' + (idx * 100) + '%)';
      for (var k = 0; k < dots.length; k++) dots[k].classList.toggle('active', k === idx);
    }
    function go(n, user) {
      idx = (n + slides) % slides;
      render();
      if (user) restart();
    }
    function next() { go(idx + 1); }
    function start() { timer = setInterval(next, 6500); }
    function restart() { clearInterval(timer); start(); }

    document.getElementById('depoNext').addEventListener('click', function () { go(idx + 1, true); });
    document.getElementById('depoPrev').addEventListener('click', function () { go(idx - 1, true); });

    /* drag / swipe */
    var sx = 0, dragging = false;
    track.addEventListener('pointerdown', function (e) { dragging = true; sx = e.clientX; clearInterval(timer); });
    window.addEventListener('pointerup', function (e) {
      if (!dragging) return;
      dragging = false;
      var dx = e.clientX - sx;
      if (Math.abs(dx) > 50) go(idx + (dx < 0 ? 1 : -1), true);
      else start();
    });

    render();
    start();
  }

  /* ---- contact form -> WhatsApp ---- */
  var WHATS = '5519997309596';
  var form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      ['nome', 'whats'].forEach(function (id) {
        var f = document.getElementById(id);
        if (!f.value.trim()) { f.classList.add('err'); ok = false; }
        else f.classList.remove('err');
      });
      if (!ok) return;

      var nome    = document.getElementById('nome').value.trim();
      var tipo    = document.getElementById('tipo').value.trim();
      var cidade  = document.getElementById('cidade').value.trim();
      var whats   = document.getElementById('whats').value.trim();
      var msg     = document.getElementById('msg').value.trim();

      var text = 'Olá, Ragazoni Eventos! Sou ' + nome + '.'
        + (tipo    ? '\n\nData prevista: ' + tipo   : '')
        + (cidade  ? '\nOnde moramos: '   + cidade  : '')
        + '\nMeu WhatsApp: ' + whats
        + (msg     ? '\n\nSobre o casamento: ' + msg : '')
        + '\n\nGostaria de saber as próximas etapas. 🥂';

      window.open('https://wa.me/' + WHATS + '?text=' + encodeURIComponent(text), '_blank');
    });
    ['nome', 'whats'].forEach(function (id) {
      document.getElementById(id).addEventListener('input', function () { this.classList.remove('err'); });
    });
  }

  /* ---- Depoimentos dinâmicos via Google Sheets ---- */
  var SHEETS_CSV = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTbpwobLJPRQxibgMI9Qj_kQUlTDk3xEFGw7BeEwBLo5rswsHv1-IJDfv1qy8etjlW-tB61-4JnFslj/pub?gid=1562763669&single=true&output=csv';

  function parseCSV(text) {
    var rows = [];
    var lines = text.split('\n');
    lines.forEach(function(line) {
      if (!line.trim()) return;
      var row = [], inQ = false, field = '';
      for (var i = 0; i < line.length; i++) {
        var c = line[i];
        if (c === '"') { inQ = !inQ; }
        else if (c === ',' && !inQ) { row.push(field.trim().replace(/^"|"$/g,'')); field = ''; }
        else { field += c; }
      }
      row.push(field.trim().replace(/^"|"$/g,''));
      rows.push(row);
    });
    return rows;
  }

  function colIdx(headers, kw) {
    var k = kw.toLowerCase();
    for (var i = 0; i < headers.length; i++) {
      if (headers[i].toLowerCase().indexOf(k) !== -1) return i;
    }
    return -1;
  }

  fetch(SHEETS_CSV)
    .then(function(r) { return r.text(); })
    .then(function(text) {
      var rows = parseCSV(text);
      if (rows.length < 2) return;
      var h = rows[0].map(function(x){ return x.replace(/\uFEFF/g,''); });
      var iName    = colIdx(h, 'nome');
      var iDepo    = colIdx(h, 'experiência') !== -1 ? colIdx(h, 'experiência') : colIdx(h, 'depoimento');
      var iEvento  = colIdx(h, 'evento') !== -1 ? colIdx(h, 'evento') : colIdx(h, 'data e');
      var iPublish = colIdx(h, 'publicar');
      if (iPublish === -1) return; // coluna Publicar não existe ainda

      var approved = rows.slice(1).filter(function(r) {
        return r[iPublish] && r[iPublish].toLowerCase().trim() === 'sim';
      });
      if (approved.length === 0) return; // mantém depoimentos estáticos

      var grid = document.querySelector('.depo-grid');
      if (!grid) return;
      grid.innerHTML = '';
      approved.forEach(function(r, idx) {
        var nome   = iName   >= 0 && r[iName]   ? r[iName]   : 'Cliente Ragazoni';
        var texto  = iDepo   >= 0 && r[iDepo]   ? r[iDepo]   : '';
        var evento = iEvento >= 0 && r[iEvento] ? r[iEvento] : '';
        if (!texto) return;
        var isLast = (idx === approved.length - 1) && (approved.length % 2 !== 0);
        var card = document.createElement('blockquote');
        card.className = 'depo-card';
        if (isLast) card.style.gridColumn = 'span 2';
        card.innerHTML = '<p>\u201C' + texto.replace(/</g,'&lt;') + '\u201D</p>'
          + '<footer><strong>' + nome.replace(/</g,'&lt;') + '</strong>'
          + (evento ? '<span>' + evento.replace(/</g,'&lt;') + '</span>' : '')
          + '</footer>';
        grid.appendChild(card);
      });
    })
    .catch(function() { /* sem conexão — mantém estáticos */ });

  /* ---- Instagram feed setup notice ---- */
  var beholdEl = document.querySelector('behold-widget');
  var setupEl  = document.getElementById('instaSetup');
  if (beholdEl && setupEl) {
    var feedId = beholdEl.getAttribute('feed-id');
    if (!feedId || feedId === 'SEU_FEED_ID_AQUI' || feedId === '') {
      setupEl.classList.add('visible');
    } else {
      /* Hide setup after widget renders */
      setTimeout(function () {
        if (!beholdEl.shadowRoot || !beholdEl.shadowRoot.querySelector('img')) {
          setupEl.classList.add('visible');
        }
      }, 4000);
    }
  }

  /* ---- light parallax on hero figure ---- */
  var fig = document.querySelector('.hero-figure');
  if (fig && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.addEventListener('scroll', function () {
      var sc = window.scrollY;
      if (sc < window.innerHeight) fig.style.transform = 'translateY(' + (sc * 0.055) + 'px)';
    }, { passive: true });
  }
})();
