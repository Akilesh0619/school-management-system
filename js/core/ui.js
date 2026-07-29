/**
 * ui.js
 * Shared UI engine used by every role page: a tiny hash router that swaps
 * between <section class="view"> blocks, a modal/toast/confirm system,
 * dark mode, formatting helpers, CSV export, and hand-rolled SVG charts
 * (no Chart.js — everything here is plain SVG built from data).
 */
var UI = (function () {

  // -----------------------------------------------------------------------
  // Router — reads location.hash, shows the matching .view section, marks
  // the matching sidebar link active, updates the topbar title, and calls
  // that view's render() callback (so data is refreshed every visit).
  // -----------------------------------------------------------------------
  var routes = {};
  var defaultView = null;

  function registerView(name, config) {
    routes[name] = config || {};
    if (!defaultView) defaultView = name;
  }

  function parseHash() {
    var raw = window.location.hash.replace(/^#/, '');
    var parts = raw.split('/');
    return { view: parts[0] || defaultView, params: parts.slice(1) };
  }

  function navigateTo() {
    var parsed = parseHash();
    var name = routes[parsed.view] ? parsed.view : defaultView;
    if (!name) return;
    var config = routes[name] || {};

    document.querySelectorAll('.view').forEach(function (el) { el.classList.remove('active'); });
    var target = document.querySelector('.view[data-view="' + name + '"]');
    if (target) target.classList.add('active');

    document.querySelectorAll('.nav-link[data-view]').forEach(function (el) {
      el.classList.toggle('active', el.getAttribute('data-view') === name);
    });

    var titleEl = document.getElementById('topbarTitle');
    var subEl = document.getElementById('topbarSub');
    if (titleEl && config.title) titleEl.textContent = config.title;
    if (subEl) subEl.textContent = config.subtitle || '';

    closeSidebarMobile();
    if (typeof config.render === 'function') config.render(parsed.params);
  }

  function initRouter(first) {
    defaultView = first || defaultView;
    document.querySelectorAll('[data-view]').forEach(function (el) {
      if (el.tagName === 'A' || el.classList.contains('nav-link')) {
        el.addEventListener('click', function (e) {
          if (el.tagName !== 'A') { e.preventDefault(); window.location.hash = '#' + el.getAttribute('data-view'); }
        });
      }
    });
    window.addEventListener('hashchange', navigateTo);
    navigateTo();
  }

  function go(hash) { window.location.hash = hash; }
  function refresh() { navigateTo(); }

  // -----------------------------------------------------------------------
  // Sidebar (mobile) + theme toggle
  // -----------------------------------------------------------------------
  function initChrome() {
    var toggle = document.querySelector('.menu-toggle');
    var sidebar = document.querySelector('.sidebar');
    var scrim = document.querySelector('.sidebar-scrim');
    if (toggle && sidebar) {
      toggle.addEventListener('click', function () {
        sidebar.classList.toggle('open');
        if (scrim) scrim.classList.toggle('show');
      });
    }
    if (scrim) scrim.addEventListener('click', closeSidebarMobile);

    var themeBtn = document.getElementById('themeToggle');
    var saved = localStorage.getItem('sms_theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    updateThemeIcon(saved);
    if (themeBtn) {
      themeBtn.addEventListener('click', function () {
        var cur = document.documentElement.getAttribute('data-theme');
        var next = cur === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('sms_theme', next);
        updateThemeIcon(next);
      });
    }
  }

  function updateThemeIcon(theme) {
    var el = document.getElementById('themeIcon');
    if (!el) return;
    el.outerHTML = Icons.html(theme === 'dark' ? 'sun' : 'moon', 'icon');
  }

  function closeSidebarMobile() {
    var sidebar = document.querySelector('.sidebar');
    var scrim = document.querySelector('.sidebar-scrim');
    if (sidebar) sidebar.classList.remove('open');
    if (scrim) scrim.classList.remove('show');
  }

  // -----------------------------------------------------------------------
  // Modal
  // -----------------------------------------------------------------------
  function ensureRoots() {
    if (!document.getElementById('modalRoot')) {
      var m = document.createElement('div');
      m.id = 'modalRoot';
      document.body.appendChild(m);
    }
    if (!document.getElementById('toastRoot')) {
      var t = document.createElement('div');
      t.id = 'toastRoot';
      t.className = 'toast-stack';
      document.body.appendChild(t);
    }
  }

  function openModal(opts) {
    ensureRoots();
    opts = opts || {};
    var root = document.getElementById('modalRoot');
    var backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.innerHTML =
      '<div class="modal ' + (opts.size === 'lg' ? 'modal-lg' : '') + '">' +
      '<div class="modal-head"><h3>' + (opts.title || '') + '</h3>' +
      '<button type="button" class="modal-close" data-close>' + Icons.html('x') + '</button></div>' +
      '<div class="modal-body">' + (opts.body || '') + '</div>' +
      (opts.footer ? '<div class="modal-foot">' + opts.footer + '</div>' : '') +
      '</div>';
    root.appendChild(backdrop);
    requestAnimationFrame(function () { backdrop.classList.add('show'); });

    function close() {
      backdrop.classList.remove('show');
      setTimeout(function () { backdrop.remove(); }, 180);
      document.removeEventListener('keydown', escHandler);
    }
    function escHandler(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', escHandler);
    backdrop.addEventListener('click', function (e) { if (e.target === backdrop) close(); });
    backdrop.querySelectorAll('[data-close]').forEach(function (el) { el.addEventListener('click', close); });

    if (typeof opts.onOpen === 'function') opts.onOpen(backdrop, close);
    return { el: backdrop, close: close };
  }

  function confirmDialog(message, opts) {
    opts = opts || {};
    return new Promise(function (resolve) {
      var handle = openModal({
        title: opts.title || 'Please confirm',
        body: '<p style="margin:0;">' + message + '</p>',
        footer:
          '<button type="button" class="btn btn-outline" data-cancel>Cancel</button>' +
          '<button type="button" class="btn ' + (opts.danger ? 'btn-danger-solid' : 'btn-primary') + '" data-confirm>' +
          (opts.confirmLabel || 'Confirm') + '</button>',
        onOpen: function (el, close) {
          el.querySelector('[data-cancel]').addEventListener('click', function () { close(); resolve(false); });
          el.querySelector('[data-confirm]').addEventListener('click', function () { close(); resolve(true); });
        }
      });
    });
  }

  // -----------------------------------------------------------------------
  // Toast
  // -----------------------------------------------------------------------
  function toast(message, type) {
    ensureRoots();
    var root = document.getElementById('toastRoot');
    var el = document.createElement('div');
    el.className = 'toast ' + (type || 'success');
    var iconName = type === 'error' ? 'alert' : type === 'info' ? 'info' : 'checkCircle';
    el.innerHTML = Icons.html(iconName, 'icon') + '<div>' + message + '</div>';
    root.appendChild(el);
    setTimeout(function () {
      el.style.transition = 'opacity .25s, transform .25s';
      el.style.opacity = '0';
      el.style.transform = 'translateX(12px)';
      setTimeout(function () { el.remove(); }, 260);
    }, 3200);
  }

  // -----------------------------------------------------------------------
  // Formatting helpers
  // -----------------------------------------------------------------------
  function currency(n) {
    n = Number(n) || 0;
    return '\u20B9' + n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  }
  function dateFmt(iso) {
    if (!iso) return '\u2014';
    var d = new Date(iso);
    if (isNaN(d)) return iso;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  function dateTimeFmt(iso) {
    if (!iso) return '\u2014';
    var d = new Date(iso);
    if (isNaN(d)) return iso;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ', ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }
  function initials(name) {
    if (!name) return '?';
    var parts = name.trim().split(/\s+/);
    var s = parts[0][0] || '';
    if (parts.length > 1) s += parts[parts.length - 1][0];
    return s.toUpperCase();
  }
  function avatarHTML(name, photo, sizeClass) {
    sizeClass = sizeClass || 'avatar-sm';
    if (photo) {
      return '<img class="avatar ' + sizeClass + '" src="' + photo + '" alt="' + escapeHTML(name) + '">';
    }
    return '<div class="avatar ' + sizeClass + '">' + initials(name) + '</div>';
  }
  function escapeHTML(str) {
    if (str == null) return '';
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function statusBadge(status) {
    var map = {
      present: 'badge-present', absent: 'badge-absent', late: 'badge-late', leave: 'badge-leave',
      active: 'badge-active', inactive: 'badge-inactive', paid: 'badge-paid', pending: 'badge-pending'
    };
    var cls = map[status] || 'badge-inactive';
    return '<span class="badge ' + cls + '">' + capitalize(status) + '</span>';
  }
  function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

  // -----------------------------------------------------------------------
  // CSV export — fully client-side via Blob download
  // -----------------------------------------------------------------------
  function downloadCSV(filename, headers, rows) {
    var esc = function (v) {
      v = v == null ? '' : String(v);
      if (/[",\n]/.test(v)) v = '"' + v.replace(/"/g, '""') + '"';
      return v;
    };
    var lines = [headers.map(esc).join(',')].concat(rows.map(function (r) { return r.map(esc).join(','); }));
    var blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  // -----------------------------------------------------------------------
  // Pagination helper
  // -----------------------------------------------------------------------
  function paginate(items, page, perPage) {
    perPage = perPage || 8;
    var totalPages = Math.max(1, Math.ceil(items.length / perPage));
    page = Math.min(Math.max(1, page || 1), totalPages);
    var start = (page - 1) * perPage;
    return { items: items.slice(start, start + perPage), page: page, totalPages: totalPages, total: items.length };
  }

  function pagerHTML(page, totalPages) {
    if (totalPages <= 1) return '';
    var html = '<div class="pager" data-pager>';
    html += '<button type="button" data-page="' + Math.max(1, page - 1) + '" ' + (page === 1 ? 'disabled' : '') + '>' + Icons.html('chevronLeft', 'icon-sm') + '</button>';
    for (var i = 1; i <= totalPages; i++) {
      html += '<button type="button" class="' + (i === page ? 'active' : '') + '" data-page="' + i + '">' + i + '</button>';
    }
    html += '<button type="button" data-page="' + Math.min(totalPages, page + 1) + '" ' + (page === totalPages ? 'disabled' : '') + '>' + Icons.html('chevronRight', 'icon-sm') + '</button>';
    html += '</div>';
    return html;
  }

  function wirePager(container, onChange) {
    var pager = container.querySelector('[data-pager]');
    if (!pager) return;
    pager.querySelectorAll('button[data-page]').forEach(function (btn) {
      btn.addEventListener('click', function () { onChange(Number(btn.getAttribute('data-page'))); });
    });
  }

  // -----------------------------------------------------------------------
  // Charts — hand-rolled SVG, no external library
  // -----------------------------------------------------------------------
  var PALETTE = ['#2F6F5E', '#B4842A', '#3E7CA6', '#8A5FBF', '#C1584C', '#5EA88A'];

  function lineChart(container, opts) {
    var labels = opts.labels, data = opts.data;
    var w = 480, h = 220, padL = 34, padR = 14, padT = 16, padB = 30;
    var innerW = w - padL - padR, innerH = h - padT - padB;
    var max = opts.max != null ? opts.max : Math.max.apply(null, data.concat([1]));
    var color = opts.color || 'var(--pine)';
    var n = data.length;
    var stepX = n > 1 ? innerW / (n - 1) : 0;

    var pts = data.map(function (v, i) {
      var x = padL + i * stepX;
      var y = padT + innerH - (v / max) * innerH;
      return [x, y];
    });

    var linePath = pts.map(function (p, i) { return (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ');
    var areaPath = linePath + ' L' + pts[n - 1][0].toFixed(1) + ',' + (padT + innerH) + ' L' + pts[0][0].toFixed(1) + ',' + (padT + innerH) + ' Z';

    var grid = '';
    [0, 0.5, 1].forEach(function (f) {
      var y = padT + innerH * (1 - f);
      grid += '<line x1="' + padL + '" y1="' + y.toFixed(1) + '" x2="' + (w - padR) + '" y2="' + y.toFixed(1) + '" stroke="var(--border)" stroke-width="1"/>';
      grid += '<text x="' + (padL - 8) + '" y="' + (y + 3).toFixed(1) + '" text-anchor="end" font-size="9" fill="var(--ink-soft)">' + Math.round(max * f) + '</text>';
    });

    var dots = pts.map(function (p, i) {
      return '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="3.2" fill="' + color + '" stroke="var(--surface)" stroke-width="1.5"><title>' + labels[i] + ': ' + data[i] + '</title></circle>';
    }).join('');

    var xLabels = pts.map(function (p, i) {
      return '<text x="' + p[0].toFixed(1) + '" y="' + (h - 8) + '" text-anchor="middle" font-size="9.5" fill="var(--ink-soft)">' + labels[i] + '</text>';
    }).join('');

    var svg = '<svg viewBox="0 0 ' + w + ' ' + h + '">' + grid +
      '<path d="' + areaPath + '" fill="' + color + '" opacity="0.12" stroke="none"/>' +
      '<path d="' + linePath + '" fill="none" stroke="' + color + '" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>' +
      dots + xLabels + '</svg>';
    container.innerHTML = svg;
  }

  function barChart(container, opts) {
    var labels = opts.labels, data = opts.data;
    var w = 480, h = 220, padL = 40, padR = 14, padT = 22, padB = 30;
    var innerW = w - padL - padR, innerH = h - padT - padB;
    var max = opts.max != null ? opts.max : Math.max.apply(null, data.concat([1])) * 1.15;
    var color = opts.color || 'var(--pine)';
    var n = data.length;
    var slot = innerW / n;
    var barW = slot * 0.5;

    var grid = '';
    [0, 0.5, 1].forEach(function (f) {
      var y = padT + innerH * (1 - f);
      grid += '<line x1="' + padL + '" y1="' + y.toFixed(1) + '" x2="' + (w - padR) + '" y2="' + y.toFixed(1) + '" stroke="var(--border)" stroke-width="1"/>';
    });

    var bars = data.map(function (v, i) {
      var barH = max > 0 ? (v / max) * innerH : 0;
      var x = padL + i * slot + (slot - barW) / 2;
      var y = padT + innerH - barH;
      var valueLabel = opts.valueFormat ? opts.valueFormat(v) : v;
      return '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + barW.toFixed(1) + '" height="' + Math.max(barH, 1).toFixed(1) + '" rx="4" fill="' + color + '"><title>' + labels[i] + ': ' + valueLabel + '</title></rect>' +
        '<text x="' + (x + barW / 2).toFixed(1) + '" y="' + (h - 8) + '" text-anchor="middle" font-size="9.5" fill="var(--ink-soft)">' + labels[i] + '</text>';
    }).join('');

    var svg = '<svg viewBox="0 0 ' + w + ' ' + h + '">' + grid + bars + '</svg>';
    container.innerHTML = svg;
  }

  function donutChart(container, segments, opts) {
    opts = opts || {};
    var total = segments.reduce(function (s, x) { return s + x.value; }, 0) || 1;
    var r = 68, cx = 100, cy = 100, sw = 24;
    var circumference = 2 * Math.PI * r;
    var offset = 0;
    var circles = segments.map(function (seg, i) {
      var frac = seg.value / total;
      var len = frac * circumference;
      var color = seg.color || PALETTE[i % PALETTE.length];
      var dasharray = len.toFixed(2) + ' ' + (circumference - len).toFixed(2);
      var dashoffset = (-offset).toFixed(2);
      offset += len;
      return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + color + '" stroke-width="' + sw + '" stroke-dasharray="' + dasharray + '" stroke-dashoffset="' + dashoffset + '"><title>' + seg.label + ': ' + seg.value + '</title></circle>';
    }).join('');

    var svg = '<svg viewBox="0 0 200 200"><g transform="rotate(-90 100 100)">' + circles + '</g>' +
      '<text x="100" y="97" text-anchor="middle" font-family="var(--font-display)" font-size="26" font-weight="700" fill="var(--ink)">' + total + '</text>' +
      '<text x="100" y="116" text-anchor="middle" font-size="10" fill="var(--ink-soft)">' + (opts.centerLabel || 'total') + '</text>' +
      '</svg>';

    var legend = '<div class="chart-legend">' + segments.map(function (seg, i) {
      var color = seg.color || PALETTE[i % PALETTE.length];
      return '<span><i style="background:' + color + '"></i>' + seg.label + ' (' + seg.value + ')</span>';
    }).join('') + '</div>';

    container.innerHTML = svg + legend;
  }

  return {
    registerView: registerView, initRouter: initRouter, go: go, refresh: refresh,
    initChrome: initChrome, closeSidebarMobile: closeSidebarMobile,
    openModal: openModal, confirmDialog: confirmDialog, toast: toast,
    currency: currency, dateFmt: dateFmt, dateTimeFmt: dateTimeFmt,
    initials: initials, avatarHTML: avatarHTML, escapeHTML: escapeHTML,
    statusBadge: statusBadge, capitalize: capitalize,
    downloadCSV: downloadCSV, paginate: paginate, pagerHTML: pagerHTML, wirePager: wirePager,
    lineChart: lineChart, barChart: barChart, donutChart: donutChart, PALETTE: PALETTE
  };
})();
