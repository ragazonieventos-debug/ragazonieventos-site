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

  /* ---- Depoimentos: data/depoimentos.json + formulário (Publicar = sim) ---- */
  var SHEETS_CSV = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTbpwobLJPRQxibgMI9Qj_kQUlTDk3xEFGw7BeEwBLo5rswsHv1-IJDfv1qy8etjlW-tB61-4JnFslj/pub?gid=1562763669&single=true&output=csv';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // CSV com suporte a quebras de linha e aspas dentro das respostas
  function parseCSV(text) {
    var rows = [], row = [], field = '', inQ = false;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (inQ) {
        if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
        else if (c === '"') inQ = false;
        else field += c;
      } else if (c === '"') inQ = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(field); field = '';
        if (row.join('').trim()) rows.push(row);
        row = [];
      } else field += c;
    }
    row.push(field);
    if (row.join('').trim()) rows.push(row);
    return rows;
  }

  function colIdx(headers, kw) {
    var k = kw.toLowerCase();
    for (var i = 0; i < headers.length; i++) {
      if (headers[i].toLowerCase().indexOf(k) !== -1) return i;
    }
    return -1;
  }

  function depoimentosDoFormulario() {
    return fetch(SHEETS_CSV)
      .then(function (r) { return r.ok ? r.text() : ''; })
      .then(function (text) {
        var rows = parseCSV(text || '');
        if (rows.length < 2) return [];
        var h = rows[0].map(function (x) { return x.replace(/﻿/g, ''); });
        var iName = colIdx(h, 'nome');
        var iDepo = colIdx(h, 'experiência') !== -1 ? colIdx(h, 'experiência') : colIdx(h, 'depoimento');
        var iEvento = colIdx(h, 'evento') !== -1 ? colIdx(h, 'evento') : colIdx(h, 'data e');
        var iPublish = colIdx(h, 'publicar');
        if (iPublish === -1) return [];
        return rows.slice(1)
          .filter(function (r) { return (r[iPublish] || '').toLowerCase().trim() === 'sim' && (r[iDepo] || '').trim(); })
          .map(function (r) {
            return { nome: (r[iName] || '').trim() || 'Cliente Ragazoni', texto: r[iDepo].trim(), evento: (r[iEvento] || '').trim() };
          });
      })
      .catch(function () { return []; });
  }

  (function () {
    var grid = document.getElementById('depoGrid');
    if (!grid) return;
    function json(url) {
      return fetch(url + '?_=' + Date.now())
        .then(function (r) { return r.ok ? r.json() : null; })
        .catch(function () { return null; });
    }
    function estrelas(n) {
      n = Math.max(0, Math.min(5, Math.round(n || 0)));
      return '<span class="stars" aria-label="' + n + ' de 5 estrelas">' + '★'.repeat(n) + '<i>' + '★'.repeat(5 - n) + '</i></span>';
    }
    Promise.all([json('data/avaliacoes-google.json'), json('data/depoimentos.json'), depoimentosDoFormulario()]).then(function (res) {
      var g = res[0] || {};
      var badge = document.getElementById('googleBadge');
      if (badge && g.nota && g.total) {
        badge.href = g.link_perfil || g.link_avaliar || '#';
        badge.innerHTML = '<b>G</b>' + estrelas(g.nota) + '<strong>' + String(g.nota).replace('.', ',') + '</strong> no Google · ' + g.total + ' avaliações';
        badge.hidden = false;
      }
      var doGoogle = (g.avaliacoes || []).filter(function (a) { return a && a.texto && (a.estrelas || 5) >= 4; })
        .map(function (a) { return { nome: a.nome, evento: a.evento || 'Avaliação no Google', texto: a.texto, estrelas: a.estrelas || 5, google: true }; });
      var vistos = {};
      var lista = doGoogle.concat(res[1] || [], res[2] || []).filter(function (d) {
        var chave = (d.texto || '').toLowerCase().replace(/W+/g, '').slice(0, 60);
        if (!chave || vistos[chave]) return false;
        vistos[chave] = true;
        return true;
      });
      grid.innerHTML = lista.map(function (d) {
        return '<blockquote class="depo-card' + (d.google ? ' depo-google' : '') + '">'
          + (d.google ? '<div class="depo-google-top">' + estrelas(d.estrelas) + '<span>Google</span></div>' : '')
          + '<p>' + esc(d.texto) + '</p>'
          + '<footer><strong>' + esc(d.nome) + '</strong>'
          + (d.evento ? '<span>' + esc(d.evento) + '</span>' : '') + '</footer></blockquote>';
      }).join('');
    });
  })();

  /* ---- Álbum de fotos misturadas: data/album.json ---- */
  (function () {
    var sec = document.getElementById('album');
    var grid = document.getElementById('albumGrid');
    var mais = document.getElementById('albumMore');
    var lb = document.getElementById('albumLightbox');
    if (!sec || !grid || !lb) return;
    var lbImg = document.getElementById('lbImg');
    var lbCap = document.getElementById('lbCaption');
    var POR_VEZ = 12;
    var fotos = [], idx = 0, mostradas = 0;

    function mostrar() {
      var f = fotos[idx];
      lbImg.src = f.src;
      lbImg.alt = f.alt || 'Ragazoni Eventos';
      lbCap.textContent = (f.legenda ? f.legenda + '  ·  ' : '') + (idx + 1) + ' / ' + fotos.length;
    }
    function abrir(i) { idx = i; mostrar(); lb.classList.add('open'); document.body.style.overflow = 'hidden'; }
    function fechar() { lb.classList.remove('open'); document.body.style.overflow = ''; }
    function passo(n) { idx = (idx + n + fotos.length) % fotos.length; mostrar(); }

    document.getElementById('lbClose').addEventListener('click', fechar);
    document.getElementById('lbPrev').addEventListener('click', function () { passo(-1); });
    document.getElementById('lbNext').addEventListener('click', function () { passo(1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) fechar(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') fechar();
      if (e.key === 'ArrowLeft') passo(-1);
      if (e.key === 'ArrowRight') passo(1);
    });
    var x0 = null;
    lb.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) passo(dx < 0 ? 1 : -1);
      x0 = null;
    });

    function renderMais() {
      fotos.slice(mostradas, mostradas + POR_VEZ).forEach(function (f, k) {
        var i = mostradas + k;
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'album-item';
        b.setAttribute('aria-label', 'Ampliar foto ' + (i + 1));
        b.innerHTML = '<img src="' + esc(f.src) + '" alt="' + esc(f.alt || 'Ragazoni Eventos') + '" loading="lazy" />';
        b.addEventListener('click', function () { abrir(i); });
        grid.appendChild(b);
      });
      mostradas = Math.min(fotos.length, mostradas + POR_VEZ);
      if (mais) mais.hidden = mostradas >= fotos.length;
    }
    if (mais) mais.addEventListener('click', renderMais);

    fetch('data/album.json?_=' + Date.now())
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (lista) {
        fotos = (lista || []).filter(function (f) { return f && f.src; });
        if (!fotos.length) return;
        // ordem diferente a cada visita
        for (var i = fotos.length - 1; i > 0; i--) {
          var j = Math.floor(Math.random() * (i + 1));
          var tmp = fotos[i]; fotos[i] = fotos[j]; fotos[j] = tmp;
        }
        renderMais();
        sec.hidden = false;
        document.querySelectorAll('[data-album-nav]').forEach(function (a) { a.hidden = false; });
      })
      .catch(function () { /* sem álbum: seção continua oculta */ });
  })();

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
