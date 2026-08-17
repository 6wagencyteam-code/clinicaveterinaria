/* ==========================================================================
   Calendario de vacunas
   Calcula el plan de vacunas de una mascota a partir de su especie y fecha
   de nacimiento. Todo ocurre en el navegador: no se envía ningún dato.
   El último cálculo se guarda en el navegador del visitante para que al
   volver vea de inmediato el estado de su mascota.
   ========================================================================== */

(function () {
  'use strict';

  var STORAGE_KEY = 'vetPetProfile';
  var DAY = 86400000;
  var OVERDUE_DAYS = 90;

  function parseDateInput(value) {
    if (!value) return null;
    var parts = value.split('-');
    if (parts.length !== 3) return null;
    var date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return isNaN(date.getTime()) ? null : date;
  }

  function startOfToday() {
    var now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  function addDays(date, days) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
  }

  function addYears(date, years) {
    return new Date(date.getFullYear() + years, date.getMonth(), date.getDate());
  }

  function formatDate(date, locale) {
    try {
      return date.toLocaleDateString(locale || 'es-CL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch (e) {
      return date.toISOString().slice(0, 10);
    }
  }

  /* Describe la edad de la mascota en palabras */
  function describeAge(birth, today, texts) {
    var months =
      (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
    if (today.getDate() < birth.getDate()) months -= 1;

    if (months < 0) return texts.ageUnborn;
    if (months < 1) {
      var weeks = Math.floor((today - birth) / (DAY * 7));
      return weeks <= 1 ? texts.ageNewborn : weeks + ' ' + texts.ageWeeks;
    }
    if (months < 24) {
      return months + ' ' + (months === 1 ? texts.ageMonth : texts.ageMonths);
    }
    var years = Math.floor(months / 12);
    return years + ' ' + (years === 1 ? texts.ageYear : texts.ageYears);
  }

  /*
   * Calcula la próxima fecha de una vacuna.
   * - once:      una sola vez, a las X semanas de vida
   * - annual:    primera dosis a las X semanas y luego cada año
   * - quarterly: primera dosis a las X semanas y luego cada 3 meses
   */
  function nextDueDate(vaccine, birth, today) {
    var first = addDays(birth, vaccine.weeks * 7);

    if (vaccine.recurrence === 'once') return { date: first, isRepeat: false };

    if (first >= today) return { date: first, isRepeat: false };

    /*
     * Sólo avanzamos a la siguiente repetición cuando la anterior ya lleva más
     * de OVERDUE_DAYS de atraso. Así, un refuerzo vencido hace pocas semanas se
     * muestra como pendiente en vez de saltar al año siguiente.
     */
    var limit = addDays(today, -OVERDUE_DAYS);

    if (vaccine.recurrence === 'annual') {
      var candidate = first;
      var guard = 0;
      while (candidate < limit && guard < 60) {
        candidate = addYears(candidate, 1);
        guard += 1;
      }
      return { date: candidate, isRepeat: candidate > first };
    }

    if (vaccine.recurrence === 'quarterly') {
      var quarters = Math.ceil((limit - first) / (DAY * 91));
      if (quarters < 0) quarters = 0;
      return { date: addDays(first, quarters * 91), isRepeat: quarters > 0 };
    }

    return { date: first, isRepeat: false };
  }

  /*
   * Una vacuna con más de OVERDUE_DAYS de atraso se considera ya aplicada.
   * Dentro de esa ventana se muestra como pendiente.
   */
  function classify(dueDate, today) {
    var diffDays = Math.round((dueDate - today) / DAY);
    if (diffDays < -OVERDUE_DAYS) return 'done';
    if (diffDays <= 14) return 'due';
    if (diffDays <= 60) return 'soon';
    return 'future';
  }

  function init(root) {
    var dataEl = root.querySelector('[data-vet-vaccines-data]');
    if (!dataEl) return;

    var config;
    try {
      config = JSON.parse(dataEl.textContent);
    } catch (e) {
      return;
    }

    var form = root.querySelector('[data-vet-vaccines-form]');
    var results = root.querySelector('[data-vet-vaccines-results]');
    var summary = root.querySelector('[data-vet-vaccines-summary]');
    var list = root.querySelector('[data-vet-vaccines-list]');
    var nameInput = root.querySelector('[data-vet-pet-name]');
    var speciesInput = root.querySelector('[data-vet-pet-species]');
    var birthInput = root.querySelector('[data-vet-pet-birth]');

    if (!form || !results || !list || !speciesInput || !birthInput) return;

    var texts = config.texts || {};
    var stateLabels = config.states || {};

    function render(petName, species, birth) {
      var today = startOfToday();

      if (birth > today) {
        summary.innerHTML = texts.futureDateError || '';
        list.innerHTML = '';
        results.hidden = false;
        return;
      }

      var applicable = config.vaccines.filter(function (vaccine) {
        return vaccine.species === 'both' || vaccine.species === species;
      });

      var rows = applicable
        .map(function (vaccine) {
          var due = nextDueDate(vaccine, birth, today);
          return {
            vaccine: vaccine,
            date: due.date,
            isRepeat: due.isRepeat,
            state: classify(due.date, today),
          };
        })
        .sort(function (a, b) {
          return a.date - b.date;
        });

      /* Resumen */
      var displayName = petName || texts.defaultPetName || '';
      var age = describeAge(birth, today, texts);
      var pending = rows.filter(function (row) {
        return row.state === 'due';
      });

      var summaryHtml =
        '<strong>' + escapeHtml(displayName) + '</strong> ' + (texts.summaryAge || '') + ' ' + age + '.';

      if (pending.length) {
        summaryHtml +=
          ' ' +
          (pending.length === 1 ? texts.summaryOneDue : texts.summaryManyDue || '').replace(
            '[[count]]',
            pending.length
          );
      } else {
        summaryHtml += ' ' + (texts.summaryNoneDue || '');
      }

      summary.innerHTML = summaryHtml;

      /* Listado */
      list.innerHTML = rows
        .map(function (row) {
          var stateLabel = stateLabels[row.state] || '';
          var meta = formatDate(row.date, config.locale);
          if (row.isRepeat && texts.repeatSuffix) {
            meta += ' · ' + texts.repeatSuffix;
          }
          if (row.vaccine.note) {
            meta += ' · ' + row.vaccine.note;
          }

          return (
            '<li class="vet-vaccine vet-vaccine--' +
            row.state +
            '">' +
            '<span class="vet-vaccine__dot" aria-hidden="true"></span>' +
            '<div>' +
            '<p class="vet-vaccine__name">' +
            escapeHtml(row.vaccine.name) +
            '</p>' +
            '<p class="vet-vaccine__meta">' +
            escapeHtml(meta) +
            '</p>' +
            '</div>' +
            '<span class="vet-vaccine__state">' +
            escapeHtml(stateLabel) +
            '</span>' +
            '</li>'
          );
        })
        .join('');

      results.hidden = false;
    }

    function escapeHtml(value) {
      return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
        return {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        }[char];
      });
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      var birth = parseDateInput(birthInput.value);
      if (!birth || !speciesInput.value) return;

      var petName = nameInput ? nameInput.value.trim() : '';

      render(petName, speciesInput.value, birth);

      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ name: petName, species: speciesInput.value, birth: birthInput.value })
        );
      } catch (e) {
        /* El navegador puede bloquear el almacenamiento; no es crítico. */
      }

      results.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });

    /* Recupera la última mascota consultada */
    try {
      var saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (saved && saved.species && saved.birth) {
        if (nameInput) nameInput.value = saved.name || '';
        speciesInput.value = saved.species;
        birthInput.value = saved.birth;

        var savedBirth = parseDateInput(saved.birth);
        if (savedBirth) render(saved.name, saved.species, savedBirth);
      }
    } catch (e) {
      /* Sin datos guardados: se muestra el formulario vacío. */
    }
  }

  function start() {
    document.querySelectorAll('[data-vet-vaccines]').forEach(init);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  /* Permite que la sección se recargue dentro del editor de temas */
  document.addEventListener('shopify:section:load', function (event) {
    var root = event.target.querySelector('[data-vet-vaccines]');
    if (root) init(root);
  });
})();
