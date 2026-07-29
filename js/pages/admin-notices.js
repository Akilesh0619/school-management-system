/**
 * pages/admin-notices.js
 */
function renderAdminNotices() {
  var el = document.querySelector('.view[data-view="notices"]');
  if (!el) return;

  el.innerHTML = `
    <div class="grid grid-12">
      <div class="col-span-4">
        <div class="card"><div class="card-head"><h3>Post new notice</h3></div><div class="card-body">
          <form id="noticeForm">
            <div class="field"><label>Title *</label><input class="input" id="nf-title" required></div>
            <div class="field"><label>Content *</label><textarea class="input" id="nf-content" rows="5" required></textarea></div>
            <div class="field"><label>Visible to</label><select class="input" id="nf-target">
              <option value="all">Everyone</option>
              <option value="teacher">Teachers only</option>
              <option value="student">Students only</option>
              <option value="parent">Parents only</option>
            </select></div>
            <button type="submit" class="btn btn-primary btn-block">${Icons.html('notice', 'icon-sm')} Post notice</button>
          </form>
        </div></div>
      </div>
      <div class="col-span-8">
        <div class="card"><div class="card-head"><h3>All notices</h3></div><div class="card-body" id="noticesList"></div></div>
      </div>
    </div>
  `;

  document.getElementById('noticeForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var user = Auth.currentUser();
    DB.insert('notices', {
      title: document.getElementById('nf-title').value.trim(),
      content: document.getElementById('nf-content').value.trim(),
      postedBy: user.id,
      targetRole: document.getElementById('nf-target').value,
      createdAt: new Date().toISOString()
    });
    UI.toast('Notice posted.', 'success');
    renderAdminNotices();
  });

  refreshNoticesList();
}

function refreshNoticesList() {
  var list = document.getElementById('noticesList');
  if (!list) return;
  var notices = DB.all('notices').sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });

  list.innerHTML = notices.length ? notices.map(function (n) {
    var author = DB.find('users', n.postedBy);
    return `<div class="flex justify-between mb-2 pb-2" style="border-bottom:1px solid var(--border-soft); align-items:flex-start;">
      <div class="flex gap-2" style="align-items:flex-start;">
        <div class="stat-icon pine" style="width:38px;height:38px;">${Icons.html('notice', 'icon-sm')}</div>
        <div>
          <div style="font-weight:600;">${UI.escapeHTML(n.title)}</div>
          <p class="text-sm" style="margin:.2rem 0;">${UI.escapeHTML(n.content)}</p>
          <span class="chip">${UI.capitalize(n.targetRole)}</span>
          <span class="text-xs text-soft" style="margin-left:.4rem;">${UI.dateTimeFmt(n.createdAt)} &middot; by ${author ? Auth.displayName(author) : 'Admin'}</span>
        </div>
      </div>
      <button type="button" class="btn btn-icon btn-ghost" data-del-notice="${n.id}">${Icons.html('trash', 'icon-sm')}</button>
    </div>`;
  }).join('') : `<div class="empty">${Icons.html('notice')}<p>No notices posted yet.</p></div>`;

  list.querySelectorAll('[data-del-notice]').forEach(function (b) {
    b.addEventListener('click', function () {
      var id = b.getAttribute('data-del-notice');
      UI.confirmDialog('Delete this notice?', { danger: true, confirmLabel: 'Delete' }).then(function (ok) {
        if (!ok) return;
        DB.deleteNotice(id);
        UI.toast('Notice deleted.', 'info');
        refreshNoticesList();
      });
    });
  });
}
