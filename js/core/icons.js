/**
 * icons.js
 * A small, hand-drawn line-icon set (24x24, stroke-based) so the project
 * has zero icon-font/library dependency. Plain global script (no ES module
 * import/export) so everything still works when the HTML files are opened
 * directly from disk via file:// — some browsers block module scripts
 * there.
 *
 * Usage:  Icons.html('dashboard', 'icon-lg')  -> returns an <svg> string
 */
var Icons = (function () {
  var PATHS = {
    dashboard: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
    students: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5"/><circle cx="17.5" cy="8.5" r="2.4"/><path d="M15.7 14.8c2.6.3 4.3 2.2 4.3 5.2"/>',
    teacher: '<rect x="4" y="4" width="16" height="12" rx="2"/><path d="M8 20h8M12 16v4"/><path d="M8 9l3 2 5-3.5"/>',
    classes: '<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/>',
    subject: '<path d="M4 5.2C4 4 5 3.4 6 3.7l5 1.5v14L6 17.7c-1-.3-2-.1-2 .8z"/><path d="M20 5.2C20 4 19 3.4 18 3.7l-5 1.5v14l5-1.5c1-.3 2-.1 2 .8z"/>',
    attendance: '<rect x="3.5" y="4.5" width="17" height="16" rx="2"/><path d="M3.5 9.5h17"/><path d="M8 3v3M16 3v3"/><path d="M8.5 14l2 2 4-4.5"/>',
    marks: '<circle cx="12" cy="8.5" r="5.2"/><path d="M9 13l-1.5 7 4.5-2.5 4.5 2.5-1.5-7"/>',
    timetable: '<rect x="3.5" y="4.5" width="17" height="16" rx="2"/><path d="M3.5 9.5h17M9 4.5v5M15 4.5v5"/><path d="M7.5 13.5h3M7.5 16.5h5.5M14.5 13.5h2"/>',
    fees: '<rect x="3" y="6" width="18" height="12.5" rx="2"/><path d="M3 10h18"/><circle cx="7" cy="14.5" r="1.1" fill="currentColor" stroke="none"/><path d="M14 14.5h4"/>',
    wallet: '<path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H17a2 2 0 0 1 2 2v1"/><rect x="3" y="7.5" width="18" height="12" rx="2"/><path d="M15.5 13a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"/>',
    notice: '<path d="M4 10.5v3a1 1 0 0 0 1 1h1.3L10 18v-11l-3.7 3.5H5a1 1 0 0 0-1 1z"/><path d="M13 8.2c1.6.7 1.6 6 0 6.7M16 6c2.8 1.3 2.8 10.8 0 12.1"/>',
    reports: '<path d="M5 20V10M12 20V4M19 20v-7"/><path d="M3 20h18"/>',
    profile: '<circle cx="12" cy="8" r="3.6"/><path d="M4.5 20c0-4 3.4-6.5 7.5-6.5s7.5 2.5 7.5 6.5"/>',
    lock: '<rect x="5" y="10.5" width="14" height="9.5" rx="2"/><path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7"/><circle cx="12" cy="15" r="1.4" fill="currentColor" stroke="none"/>',
    logout: '<path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3"/><path d="M15 16l4-4-4-4"/><path d="M19 12H9"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-4.6-4.6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    edit: '<path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3z"/><path d="M14 6.5l3.5 3.5"/>',
    trash: '<path d="M4.5 7h15"/><path d="M9.5 7V5a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 5v2"/><path d="M6.5 7l1 12.5A2 2 0 0 0 9.5 21.5h5a2 2 0 0 0 2-2L17.5 7"/><path d="M10.2 11v6M13.8 11v6"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    checkCircle: '<circle cx="12" cy="12" r="8.5"/><path d="M8.3 12.3l2.6 2.6 4.8-5.4"/>',
    alert: '<path d="M12 3.5L21.5 20h-19L12 3.5z"/><path d="M12 10v4"/><circle cx="12" cy="16.6" r="0.15" fill="currentColor" stroke="none"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5"/><circle cx="12" cy="8" r="0.15" fill="currentColor" stroke="none"/>',
    chevronLeft: '<path d="M14.5 5.5l-6.5 6.5 6.5 6.5"/>',
    chevronRight: '<path d="M9.5 5.5l6.5 6.5-6.5 6.5"/>',
    chevronDown: '<path d="M5.5 9.5l6.5 6.5 6.5-6.5"/>',
    menu: '<path d="M4 6.5h16M4 12h16M4 17.5h16"/>',
    moon: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4 6.8 6.8 0 0 0 20 14.5z"/>',
    sun: '<circle cx="12" cy="12" r="4.2"/><path d="M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/>',
    download: '<path d="M12 3.5v11.5"/><path d="M7.5 11l4.5 4.5L16.5 11"/><path d="M4.5 18h15"/>',
    printer: '<rect x="5" y="8.5" width="14" height="8" rx="1.5"/><path d="M7 8.5V4.5h10v4"/><path d="M7 16.5v3h10v-3"/><circle cx="16" cy="11.2" r="0.15" fill="currentColor" stroke="none"/>',
    mail: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M4 7l8 6 8-6"/>',
    phone: '<path d="M6.5 3.5h3l1.3 4.5-2.3 1.6a12 12 0 0 0 5.9 5.9l1.6-2.3 4.5 1.3v3a1.7 1.7 0 0 1-1.9 1.7A16 16 0 0 1 4.8 5.4a1.7 1.7 0 0 1 1.7-1.9z"/>',
    pin: '<path d="M12 21.5S5 14.8 5 9.8a7 7 0 0 1 14 0c0 5-7 11.7-7 11.7z"/><circle cx="12" cy="9.8" r="2.4"/>',
    droplet: '<path d="M12 3.5s6 7 6 11a6 6 0 1 1-12 0c0-4 6-11 6-11z"/>',
    calendar: '<rect x="3.5" y="4.5" width="17" height="16" rx="2"/><path d="M3.5 9.5h17M8 3v3M16 3v3"/>',
    camera: '<path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2L9 5h6l1.5 2h2A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5z"/><circle cx="12" cy="12.5" r="3.4"/>',
    filter: '<path d="M4 5h16l-6 7.5V19l-4 2v-8.5z"/>',
    refresh: '<path d="M4 12a8 8 0 0 1 14-5.2M20 12a8 8 0 0 1-14 5.2"/><path d="M18 3.5v3.6h-3.6M6 20.5v-3.6h3.6"/>',
    arrowLeft: '<path d="M19 12H5"/><path d="M11 6l-6 6 6 6"/>',
    arrowRight: '<path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>',
    fileText: '<path d="M7 3.5h7l4 4v13h-11z"/><path d="M14 3.5v4h4"/><path d="M9 13h6M9 16.5h6"/>',
    family: '<circle cx="7" cy="8" r="2.6"/><circle cx="17" cy="8" r="2.6"/><path d="M2.5 19.5c0-3 2-5 4.5-5s4.5 2 4.5 5M12.5 19.5c0-3 2-5 4.5-5s4.5 2 4.5 5"/>',
    star: '<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.2 5.9-.8z"/>',
    idCard: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="11" r="2"/><path d="M5.5 16c.4-1.8 1.6-2.7 3-2.7s2.6.9 3 2.7"/><path d="M14.5 9.5h4M14.5 12.5h4M14.5 15.5h2.5"/>',
    upload: '<path d="M12 15.5V4"/><path d="M7.5 8.5L12 4l4.5 4.5"/><path d="M4.5 18h15"/>',
    building: '<rect x="4" y="3.5" width="10" height="17" rx="1"/><path d="M14 9h6v11.5h-6"/><path d="M7 7.2h1.2M10.8 7.2H12M7 10.6h1.2M10.8 10.6H12M7 14h1.2M10.8 14H12M17 13h1.5M17 16.5h1.5"/>',
    briefcase: '<rect x="3" y="7.5" width="18" height="12" rx="2"/><path d="M8.5 7.5V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v1.5"/><path d="M3 12.5h18"/>',
    graduation: '<path d="M2.5 9.5L12 5l9.5 4.5L12 14z"/><path d="M6.5 11.7v4.3c0 1.4 2.5 2.5 5.5 2.5s5.5-1.1 5.5-2.5v-4.3"/><path d="M21.5 9.5v5.5"/>',
    barChart: '<path d="M5 20V10M12 20V4M19 20v-7"/><path d="M3 20h18"/>',
    layers: '<path d="M12 3.5l8.5 4.5L12 12.5 3.5 8z"/><path d="M3.5 12.5L12 17l8.5-4.5M3.5 16.5L12 21l8.5-4.5"/>',
    cash: '<rect x="2.5" y="6.5" width="19" height="11" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M6 9v0M18 15v0"/>'
  };

  function raw(name) {
    return PATHS[name] || PATHS.info;
  }

  function html(name, extraClass) {
    var cls = 'icon' + (extraClass ? ' ' + extraClass : '');
    return '<svg class="' + cls + '" viewBox="0 0 24 24">' + raw(name) + '</svg>';
  }

  // Swaps every <span data-icon="name" data-icon-class="icon-lg"></span>
  // placeholder in the DOM for real inline SVG. Static HTML files use these
  // placeholders instead of hand-written <svg> markup so every page draws
  // from the same single icon source of truth.
  function hydrate(root) {
    (root || document).querySelectorAll('[data-icon]').forEach(function (el) {
      el.outerHTML = html(el.getAttribute('data-icon'), el.getAttribute('data-icon-class') || '');
    });
  }

  return { html: html, raw: raw, hydrate: hydrate, PATHS: PATHS };
})();
