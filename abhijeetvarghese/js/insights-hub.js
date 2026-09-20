/* Insights v11 — executive report controls, native-scroll orientation and restrained reveals. */
(function () {
  'use strict';

  var report = document.querySelector('[data-insights-report]');
  if (!report) return;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var tabs = Array.prototype.slice.call(report.querySelectorAll('[data-decision][role="tab"]'));
  var panels = Array.prototype.slice.call(report.querySelectorAll('.ibr-lenses__panels [role="tabpanel"]'));

  function setDecision(tab, moveFocus) {
    var key = tab.getAttribute('data-decision');
    tabs.forEach(function (item) {
      var selected = item === tab;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
    });
    panels.forEach(function (panel) {
      panel.hidden = panel.id !== 'brief-panel-' + key;
    });
    if (moveFocus) tab.focus();
  }

  tabs.forEach(function (tab, index) {
    tab.addEventListener('click', function () { setDecision(tab, false); });
    tab.addEventListener('keydown', function (event) {
      var next = null;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      if (next !== null) {
        event.preventDefault();
        setDecision(tabs[next], true);
      }
    });
  });

  var revealItems = Array.prototype.slice.call(report.querySelectorAll('[data-ibr-reveal]'));
  if ('IntersectionObserver' in window && !reduceMotion) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-inview');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.01 });
    revealItems.forEach(function (item) { revealObserver.observe(item); });
  } else {
    revealItems.forEach(function (item) { item.classList.add('is-inview'); });
  }

  var rail = report.querySelector('.ibr-rail');
  var railLinks = Array.prototype.slice.call(report.querySelectorAll('.ibr-rail a'));
  function activateRail(id) {
    railLinks.forEach(function (link) {
      var active = link.getAttribute('href') === '#' + id;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }

  if ('IntersectionObserver' in window) {
    var essayScope = report.querySelector('.ibr-essays');
    if (rail && essayScope) {
      new IntersectionObserver(function (entries) {
        rail.classList.toggle('is-visible', entries[0].isIntersecting);
      }, { rootMargin: '-10% 0px -12% 0px', threshold: 0 }).observe(essayScope);
    }
    var essayObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && entry.intersectionRatio > 0.22) activateRail(entry.target.id);
      });
    }, { rootMargin: '-20% 0px -35% 0px', threshold: [0.24, 0.55] });
    Array.prototype.slice.call(report.querySelectorAll('article[data-insight]')).forEach(function (essay) {
      essayObserver.observe(essay);
    });
  }
}());
