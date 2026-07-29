/**
 * pages/admin-timetable.js
 */
var _ttClassId = '';
var PERIODS = [1, 2, 3, 4, 5];

function renderAdminTimetable() {
  var el = document.querySelector('.view[data-view="timetable"]');
  if (!el) return;
  var classes = DB.all('classes');

  el.innerHTML = `
    <div class="card mb-2"><div class="card-body">
      <div class="field mb-0" style="max-width:280px;"><label>Select class</label>
        <select class="input" id="ttClassSelect">
          <option value="">\u2014 Select a class \u2014</option>
          ${classes.map(c => `<option value="${c.id}">${DB.classLabel(c)}</option>`).join('')}
        </select>
      </div>
    </div></div>
    <div id="ttGridWrap"></div>
  `;

  document.getElementById('ttClassSelect').addEventListener('change', function (e) {
    _ttClassId = e.target.value;
    renderTimetableGrid();
  });
  renderTimetableGrid();
}

function renderTimetableGrid() {
  var wrap = document.getElementById('ttGridWrap');
  if (!wrap) return;
  if (!_ttClassId) {
    wrap.innerHTML = `<div class="card"><div class="empty">${Icons.html('timetable')}<p>Select a class above to view or edit its timetable.</p></div></div>`;
    return;
  }

  var entries = DB.query('timetable', function (t) { return String(t.classId) === String(_ttClassId); });
  var grid = {};
  entries.forEach(function (e) { grid[e.day + '-' + e.period] = e; });

  wrap.innerHTML = `
    <div class="card">
      <div class="card-head"><h3>Weekly timetable</h3><span class="text-xs text-soft">Click a cell to assign or edit it</span></div>
      <div class="table-wrap"><table class="grid" style="text-align:center;">
        <thead><tr><th>Period</th>${DB.DAYS.map(d => `<th>${d}</th>`).join('')}</tr></thead>
        <tbody>
          ${PERIODS.map(function (p) {
            return `<tr><td class="cell-primary">${p}</td>${DB.DAYS.map(function (d) {
              var slot = grid[d + '-' + p];
              if (slot) {
                var subj = DB.find('subjects', slot.subjectId);
                var teacher = DB.find('teachers', slot.teacherId);
                return `<td><div class="timetable-cell clickable" data-day="${d}" data-period="${p}" style="cursor:pointer;">
                  <div class="chip" style="width:100%; justify-content:center;">${subj ? UI.escapeHTML(subj.name) : 'Free'}</div>
                  <div class="text-xs text-soft mt-1">${teacher ? UI.escapeHTML(teacher.name) : ''}</div>
                </div></td>`;
              }
              return `<td><span class="clickable text-soft" data-day="${d}" data-period="${p}" style="cursor:pointer;">+ add</span></td>`;
            }).join('')}</tr>`;
          }).join('')}
        </tbody>
      </table></div>
    </div>
  `;

  wrap.querySelectorAll('[data-day]').forEach(function (cell) {
    cell.addEventListener('click', function () {
      openTimetableSlotModal(cell.getAttribute('data-day'), Number(cell.getAttribute('data-period')));
    });
  });
}

function openTimetableSlotModal(day, period) {
  var existing = DB.query('timetable', function (t) { return String(t.classId) === String(_ttClassId) && t.day === day && t.period === period; })[0];
  var subjects = DB.all('subjects');
  var teachers = DB.all('teachers');

  var handle = UI.openModal({
    title: day + ' \u00b7 Period ' + period,
    body: `
      <div class="field"><label>Subject</label><select class="input" id="tt-subject">
        <option value="">\u2014 Free period \u2014</option>
        ${subjects.map(s => `<option value="${s.id}" ${existing && existing.subjectId === s.id ? 'selected' : ''}>${UI.escapeHTML(s.name)}</option>`).join('')}
      </select></div>
      <div class="field"><label>Teacher</label><select class="input" id="tt-teacher">
        <option value="">\u2014 None \u2014</option>
        ${teachers.map(t => `<option value="${t.id}" ${existing && existing.teacherId === t.id ? 'selected' : ''}>${UI.escapeHTML(t.name)}</option>`).join('')}
      </select></div>
      <div class="input-row">
        <div class="field"><label>Start time</label><input class="input" type="time" id="tt-start" value="${existing ? existing.startTime || '' : ''}"></div>
        <div class="field"><label>End time</label><input class="input" type="time" id="tt-end" value="${existing ? existing.endTime || '' : ''}"></div>
      </div>
    `,
    footer: `${existing ? `<button type="button" class="btn btn-danger" id="tt-clear">${Icons.html('trash', 'icon-sm')} Clear slot</button>` : ''}
             <button type="button" class="btn btn-outline" data-close>Cancel</button>
             <button type="button" class="btn btn-primary" id="tt-save">${Icons.html('check', 'icon-sm')} Save</button>`,
    onOpen: function (elModal, close) {
      elModal.querySelector('#tt-save').addEventListener('click', function () {
        var patch = {
          subjectId: document.getElementById('tt-subject').value ? Number(document.getElementById('tt-subject').value) : null,
          teacherId: document.getElementById('tt-teacher').value ? Number(document.getElementById('tt-teacher').value) : null,
          startTime: document.getElementById('tt-start').value,
          endTime: document.getElementById('tt-end').value
        };
        if (existing) {
          DB.update('timetable', existing.id, patch);
        } else {
          patch.classId = Number(_ttClassId);
          patch.day = day;
          patch.period = period;
          DB.insert('timetable', patch);
        }
        UI.toast('Timetable slot saved.', 'success');
        close();
        renderTimetableGrid();
      });
      var clearBtn = elModal.querySelector('#tt-clear');
      if (clearBtn) {
        clearBtn.addEventListener('click', function () {
          DB.remove('timetable', existing.id);
          UI.toast('Slot cleared.', 'info');
          close();
          renderTimetableGrid();
        });
      }
    }
  });
}
