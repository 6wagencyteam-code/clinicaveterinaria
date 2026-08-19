/* ==========================================================================
   Calendario de vacunas
   Calcula el plan de una mascota a partir de su especie y fecha de
   nacimiento. Todo ocurre en el navegador: ningún dato sale del teléfono.
   ========================================================================== */

(() => {
  'use strict';

  const KEY = 'sixw.pet';
  const DAY = 86400000;
  const OVERDUE_DAYS = 90; // pasado ese atraso, damos la vacuna por puesta

  const parseDate = (value) => {
    if (!value) return null;
    const [y, m, d] = value.split('-').map(Number);
    if (!y || !m || !d) return null;
    const date = new Date(y, m - 1, d);
    return isNaN(date) ? null : date;
  };

  const today = () => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  };

  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const addYears = (d, n) => new Date(d.getFullYear() + n, d.getMonth(), d.getDate());

  const formatDate = (date, locale) => {
    try {
      return date.toLocaleDateString(locale || 'es-CL', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return date.toISOString().slice(0, 10);
    }
  };

  const escapeHtml = (v) =>
    String(v ?? '').replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* Edad en palabras */
  const describeAge = (birth, now, t) => {
    let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    if (now.getDate() < birth.getDate()) months -= 1;

    if (months < 0) return t.unborn;
    if (months < 1) {
      const weeks = Math.floor((now - birth) / (DAY * 7));
      return weeks <= 1 ? t.newborn : `${weeks} ${t.weeks}`;
    }
    if (months < 24) return `${months} ${months === 1 ? t.month : t.months}`;
    const years = Math.floor(months / 12);
    return `${years} ${years === 1 ? t.year : t.years}`;
  };

  /*
   * Próxima fecha de una vacuna.
   * Sólo saltamos a la siguiente repetición cuando la anterior lleva más de
   * OVERDUE_DAYS de atraso; así un refuerzo vencido hace poco aparece como
   * pendiente en vez de esconderse hasta el año siguiente.
   */
  const nextDue = (vaccine, birth, now) => {
    const first = addDays(birth, vaccine.weeks * 7);
    if (vaccine.recurrence === 'once' || first >= now) return { date: first, repeat: false };

    const limit = addDays(now, -OVERDUE_DAYS);

    if (vaccine.recurrence === 'annual') {
      let date = first;
      let guard = 0;
      while (date < limit && guard++ < 60) date = addYears(date, 1);
      return { date, repeat: date > first };
    }

    if (vaccine.recurrence === 'quarterly') {
      const quarters = Math.max(0, Math.ceil((limit - first) / (DAY * 91)));
      return { date: addDays(first, quarters * 91), repeat: quarters > 0 };
    }

    return { date: first, repeat: false };
  };

  const classify = (date, now) => {
    const days = Math.round((date - now) / DAY);
    if (days < -OVERDUE_DAYS) return 'done';
    if (days <= 14) return 'due';
    if (days <= 60) return 'soon';
    return 'future';
  };

  const init = (root) => {
    const dataEl = root.querySelector('[data-vaccines-data]');
    if (!dataEl) return;

    let config;
    try { config = JSON.parse(dataEl.textContent); } catch { return; }

    const form = root.querySelector('form');
    const results = root.querySelector('[data-results]');
    const summary = root.querySelector('[data-summary]');
    const list = root.querySelector('[data-list]');
    const nameInput = root.querySelector('[data-pet-name]');
    const speciesInput = root.querySelector('[data-pet-species]');
    const birthInput = root.querySelector('[data-pet-birth]');
    if (!form || !results || !list) return;

    const t = config.texts;

    const render = (petName, species, birth) => {
      const now = today();

      if (birth > now) {
        summary.textContent = t.futureError;
        list.innerHTML = '';
        results.hidden = false;
        return;
      }

      const rows = config.vaccines
        .filter((v) => v.species === 'both' || v.species === species)
        .map((v) => {
          const due = nextDue(v, birth, now);
          return { v, ...due, state: classify(due.date, now) };
        })
        .sort((a, b) => a.date - b.date);

      const due = rows.filter((r) => r.state === 'due');
      const name = petName || t.defaultName;

      let text = `<strong>${escapeHtml(name)}</strong> ${t.ageIs} ${describeAge(birth, now, t)}.`;
      text += ' ' + (due.length === 0
        ? t.noneDue
        : due.length === 1 ? t.oneDue : t.manyDue.replace('[[count]]', due.length));
      summary.innerHTML = text;

      list.innerHTML = rows.map((r) => {
        let meta = formatDate(r.date, config.locale);
        if (r.repeat && t.booster) meta += ` · ${t.booster}`;
        if (r.v.note) meta += ` · ${r.v.note}`;
        return `<li class="vx vx--${r.state}">
            <span class="vx__dot" aria-hidden="true"></span>
            <div>
              <p class="vx__name">${escapeHtml(r.v.name)}</p>
              <p class="vx__meta">${escapeHtml(meta)}</p>
            </div>
            <span class="vx__state">${escapeHtml(config.states[r.state])}</span>
          </li>`;
      }).join('');

      results.hidden = false;
    };

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const birth = parseDate(birthInput.value);
      if (!birth || !speciesInput.value) return;

      const name = nameInput ? nameInput.value.trim() : '';
      render(name, speciesInput.value, birth);

      try {
        localStorage.setItem(KEY, JSON.stringify({ name, species: speciesInput.value, birth: birthInput.value }));
      } catch { /* el navegador puede bloquear el almacenamiento */ }

      results.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });

    /* Recupera la última mascota consultada */
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (saved?.species && saved?.birth) {
        if (nameInput) nameInput.value = saved.name || '';
        speciesInput.value = saved.species;
        birthInput.value = saved.birth;
        const birth = parseDate(saved.birth);
        if (birth) render(saved.name, saved.species, birth);
      }
    } catch { /* sin datos guardados */ }
  };

  const start = () => document.querySelectorAll('[data-vaccines]').forEach(init);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  document.addEventListener('shopify:section:load', start);
})();
