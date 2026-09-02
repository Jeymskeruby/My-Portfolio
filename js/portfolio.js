/* ============================================================================
   Portfolio interactions — vanilla, no dependencies, one <script defer>.
   Footer year · mobile menu · scroll-spy nav · reveal-on-scroll.
   ============================================================================ */
(function () {
  'use strict';

  /* ---- footer year ---- */
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  /* ---- mobile menu ---- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('nav');
  if (toggle && nav) {
    var setOpen = function (open) {
      nav.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    toggle.addEventListener('click', function () {
      setOpen(!nav.classList.contains('open'));
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setOpen(false);
    });
    window.matchMedia('(min-width:721px)').addEventListener('change', function (e) {
      if (e.matches) setOpen(false);
    });
  }

  /* ---- scroll-spy: mark the nav link for the section in view ---- */
  var sections = Array.prototype.slice.call(document.querySelectorAll('main section[id], header#top'));
  var navLinks = {};
  Array.prototype.forEach.call(document.querySelectorAll('#nav a[href^="#"]'), function (a) {
    navLinks[a.getAttribute('href').slice(1)] = a;
  });
  if (sections.length && 'IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = entry.target.id;
        Object.keys(navLinks).forEach(function (k) {
          navLinks[k].toggleAttribute('aria-current', k === id);
          if (k === id) navLinks[k].setAttribute('aria-current', 'true');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---- reveal on scroll ---- */
  var reveals = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
  var reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('in'); });
  } else {
    var ro = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    reveals.forEach(function (el) { ro.observe(el); });
  }
})();
