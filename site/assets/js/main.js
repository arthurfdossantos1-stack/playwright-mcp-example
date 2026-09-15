/* =========================================================================
   Eletro Power 380 — interações da interface
   Sem dependências. Tudo degrada bem sem JavaScript.
   ========================================================================= */
(function () {
  'use strict';

  var reduced = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------ Header ao rolar ---- */
  var header = document.getElementById('header');

  function onScroll() {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 8);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ----------------------------------------------------- Menu mobile --- */
  var burger = document.getElementById('burger');
  var panel = document.getElementById('mobile-nav');

  function setMenu(open) {
    if (!burger || !panel) return;
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fechar menu de navegação' : 'Abrir menu de navegação');
    document.body.classList.toggle('no-scroll', open);

    if (open) {
      panel.hidden = false;
      // força um frame antes da transição de opacidade
      requestAnimationFrame(function () { panel.classList.add('is-open'); });
    } else {
      panel.classList.remove('is-open');
      window.setTimeout(function () {
        if (burger.getAttribute('aria-expanded') === 'false') panel.hidden = true;
      }, reduced ? 0 : 280);
    }
  }

  if (burger && panel) {
    burger.addEventListener('click', function () {
      setMenu(burger.getAttribute('aria-expanded') !== 'true');
    });

    panel.addEventListener('click', function (event) {
      if (event.target.closest('a')) setMenu(false);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') {
        setMenu(false);
        burger.focus();
      }
    });

    // O painel é exclusivo do mobile: fecha ao voltar para o desktop.
    var wide = window.matchMedia('(min-width: 961px)');
    var onChange = function (event) { if (event.matches) setMenu(false); };
    if (wide.addEventListener) wide.addEventListener('change', onChange);
    else if (wide.addListener) wide.addListener(onChange);
  }

  /* ------------------------------------------------ Revelar ao rolar --- */
  var targets = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));

  function showAll() {
    targets.forEach(function (el) { el.classList.add('is-visible'); });
  }

  if (reduced || !('IntersectionObserver' in window)) {
    showAll();
  } else {
    // Escalona irmãos adjacentes para um encadeamento discreto.
    targets.forEach(function (el) {
      var siblings = Array.prototype.filter.call(
        el.parentElement.children,
        function (child) { return targets.indexOf(child) > -1; }
      );
      var index = Math.max(0, siblings.indexOf(el));
      if (index > 0) el.style.transitionDelay = Math.min(index, 5) * 70 + 'ms';
    });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

    targets.forEach(function (el) { observer.observe(el); });

    // Rede de segurança: nada fica invisível se o observer não disparar.
    window.setTimeout(showAll, 4000);
  }

  /* --------------------------------------- Seção ativa na navegação ---- */
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav__link'));
  var sections = links
    .map(function (link) { return document.querySelector(link.getAttribute('href')); })
    .filter(Boolean);

  if (sections.length && 'IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (link) {
          link.classList.toggle('is-active', link.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    sections.forEach(function (section) { spy.observe(section); });
  }

  /* ------------------------------------------------ Ano do copyright --- */
  var year = document.getElementById('ano');
  if (year) year.textContent = String(new Date().getFullYear());
})();
