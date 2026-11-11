/* Agile charts.
 *
 * Reads the endpoint from the #ea-chart-data JSON island, fetches the series,
 * and draws them with the Chart.js build vendored alongside this file.
 *
 * Chart.js is shipped by this plugin rather than borrowed from another plugin's
 * asset directory or from a Chart global some other plugin put on the page:
 * either would be a runtime dependency nothing declares.
 *
 * Chart.js v4 option shapes throughout.
 */
(function () {
  'use strict';

  function readConfig() {
    var island = document.getElementById('ea-chart-data');
    if (!island) { return null; }
    try { return JSON.parse(island.textContent); } catch (e) { return null; }
  }

  function message(text) {
    var box = document.getElementById('ea-chart-message');
    if (!box) { return; }
    box.textContent = text || '';
    box.style.display = text ? 'block' : 'none';
  }

  function draw(canvas, config, payload) {
    var stacked = !!payload.stacked;
    var chart = new Chart(canvas.getContext('2d'), {
      type: payload.type || config.type || 'line',
      data: { labels: payload.labels, datasets: payload.datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          title: { display: !!payload.title, text: payload.title },
          legend: { position: 'bottom' },
          tooltip: { enabled: true }
        },
        scales: {
          x: { stacked: stacked },
          y: {
            stacked: stacked,
            beginAtZero: true,
            title: { display: !!payload.y_title, text: payload.y_title }
          }
        }
      }
    });

    var root = document.documentElement;
    if (!root.hasAttribute('data-mui-theme')) { return; }

    function updateTheme() {
      var dark = root.getAttribute('data-mui-theme') === 'dark';
      var styles = getComputedStyle(document.body);
      var text = dark ? styles.getPropertyValue('--mui-text-2').trim() : Chart.defaults.color;
      var line = dark ? styles.getPropertyValue('--mui-border-strong').trim() : Chart.defaults.borderColor;
      chart.options.color = text;
      chart.options.plugins.legend.labels.color = text;
      chart.options.plugins.title.color = text;
      Object.keys(chart.scales).forEach(function (axis) {
        var scale = chart.options.scales[axis];
        scale.grid.color = line;
        scale.border.color = line;
        scale.ticks.color = text;
        scale.title.color = text;
      });
      chart.update('none');
    }

    updateTheme();
    new MutationObserver(updateTheme).observe(root, { attributeFilter: ['data-mui-theme'] });
  }

  function init() {
    var config = readConfig();
    var canvas = document.getElementById('ea-chart');
    if (!config || !canvas) { return; }

    fetch(config.url, {
      credentials: 'same-origin',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        /* text/javascript, not application/json: a .json request is an API
         * request to Redmine and would ignore the session cookie. */
        'Accept': 'text/javascript'
      }
    }).then(function (response) {
      return response.json().then(function (payload) {
        if (!response.ok || payload.error) {
          message(payload.error || 'Error');
          canvas.style.display = 'none';
          return;
        }
        message('');
        draw(canvas, config, payload);
      });
    }).catch(function () {
      message('Error');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
