/**
 * pages/admin-fees.js
 */
function renderAdminFees() {
  var el = document.querySelector('.view[data-view="fees"]');
  if (!el) return;
  var classes = DB.all('classes');

  el.innerHTML = `
    <div class="grid grid-12">
      <div class="col-span-4">
        <div class="card mb-2"><div class="card-head"><h3>Create fee structure</h3></div><div class="card-body">
          <form id="feeForm">
            <div class="field"><label>Fee type *</label><input class="input" id="ff-type" placeholder="e.g. Tuition Fee" required></div>
            <div class="field"><label>Amount (&#8377;) *</label><input class="input" type="number" min="0" step="0.01" id="ff-amount" required></div>
            <div class="field"><label>Applicable class</label><select class="input" id="ff-class">
              <option value="">\u2014 All classes \u2014</option>
              ${classes.map(c => `<option value="${c.id}">${DB.classLabel(c)}</option>`).join('')}
            </select></div>
            <div class="field"><label>Due date</label><input class="input" type="date" id="ff-due"></div>
            <div class="field"><label>Academic year</label><input class="input" id="ff-year" value="2025-2026"></div>
            <button type="submit" class="btn btn-primary btn-block">${Icons.html('plus', 'icon-sm')} Create structure</button>
          </form>
        </div></div>
        <button type="button" class="btn btn-secondary btn-block" id="collectFeeBtn">${Icons.html('wallet', 'icon-sm')} Collect a fee payment</button>
      </div>
      <div class="col-span-8">
        <div class="card mb-2"><div class="card-head"><h3>Fee structures</h3></div>
          <div class="table-wrap"><table class="grid">
            <thead><tr><th>Type</th><th>Class</th><th>Amount</th><th>Due date</th></tr></thead>
            <tbody id="feeStructTbody"></tbody>
          </table></div>
        </div>
        <div class="card">
          <div class="card-head"><h3>Recent payments</h3><button type="button" class="btn btn-outline btn-sm" id="feesExportBtn">${Icons.html('download', 'icon-sm')} CSV</button></div>
          <div class="table-wrap"><table class="grid">
            <thead><tr><th>Receipt</th><th>Student</th><th>Amount</th><th>Mode</th><th>Date</th><th></th></tr></thead>
            <tbody id="paymentsTbody"></tbody>
          </table></div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('feeForm').addEventListener('submit', function (e) {
    e.preventDefault();
    DB.insert('feeStructures', {
      feeType: document.getElementById('ff-type').value.trim(),
      amount: Number(document.getElementById('ff-amount').value) || 0,
      classId: document.getElementById('ff-class').value ? Number(document.getElementById('ff-class').value) : null,
      dueDate: document.getElementById('ff-due').value || null,
      academicYear: document.getElementById('ff-year').value.trim()
    });
    UI.toast('Fee structure created.', 'success');
    renderAdminFees();
  });

  document.getElementById('collectFeeBtn').addEventListener('click', openCollectFeeModal);
  document.getElementById('feesExportBtn').addEventListener('click', exportFeesCSV);

  refreshFeeStructTable();
  refreshPaymentsTable();
}

function refreshFeeStructTable() {
  var tbody = document.getElementById('feeStructTbody');
  if (!tbody) return;
  var rows = DB.all('feeStructures');
  tbody.innerHTML = rows.length ? rows.map(function (f) {
    var cls = DB.find('classes', f.classId);
    return `<tr><td class="cell-primary">${UI.escapeHTML(f.feeType)}</td><td>${cls ? DB.classLabel(cls) : 'All classes'}</td>
      <td>${UI.currency(f.amount)}</td><td>${f.dueDate ? UI.dateFmt(f.dueDate) : '\u2014'}</td></tr>`;
  }).join('') : `<tr><td colspan="4"><div class="empty">${Icons.html('fees')}<p>No fee structures yet.</p></div></td></tr>`;
}

function refreshPaymentsTable() {
  var tbody = document.getElementById('paymentsTbody');
  if (!tbody) return;
  var rows = DB.all('payments').sort(function (a, b) { return new Date(b.paymentDate) - new Date(a.paymentDate); }).slice(0, 20);
  tbody.innerHTML = rows.length ? rows.map(function (p) {
    var stu = DB.find('students', p.studentId);
    return `<tr>
      <td class="cell-primary mono">${p.receiptNo}</td>
      <td>${stu ? UI.escapeHTML(stu.name) : '\u2014'}</td>
      <td>${UI.currency(p.amountPaid)}</td>
      <td><span class="chip">${p.paymentMode.toUpperCase()}</span></td>
      <td>${UI.dateFmt(p.paymentDate)}</td>
      <td><button type="button" class="btn btn-icon btn-ghost" data-receipt="${p.id}" title="View receipt">${Icons.html('fileText', 'icon-sm')}</button></td>
    </tr>`;
  }).join('') : `<tr><td colspan="6"><div class="empty">${Icons.html('cash')}<p>No payments recorded yet.</p></div></td></tr>`;

  tbody.querySelectorAll('[data-receipt]').forEach(function (b) {
    b.addEventListener('click', function () { openReceiptModal(b.getAttribute('data-receipt')); });
  });
}

function openCollectFeeModal() {
  var students = DB.query('students', function (s) { return s.status === 'active'; });
  var feeStructures = DB.all('feeStructures');

  var handle = UI.openModal({
    title: 'Collect fee payment',
    body: `
      <div class="field"><label>Student *</label><select class="input" id="cf-student" required>
        <option value="">\u2014 Select student \u2014</option>
        ${students.map(s => `<option value="${s.id}">${UI.escapeHTML(s.name)} (${s.admissionNo})</option>`).join('')}
      </select></div>
      <div class="field"><label>Fee structure *</label><select class="input" id="cf-fee" required>
        <option value="">\u2014 Select fee type \u2014</option>
        ${feeStructures.map(f => `<option value="${f.id}" data-amount="${f.amount}">${UI.escapeHTML(f.feeType)} \u2014 ${UI.currency(f.amount)}</option>`).join('')}
      </select></div>
      <div class="input-row">
        <div class="field"><label>Amount paid (&#8377;) *</label><input class="input" type="number" min="0" step="0.01" id="cf-amount" required></div>
        <div class="field"><label>Payment mode *</label><select class="input" id="cf-mode" required>
          <option value="cash">Cash</option><option value="upi">UPI</option><option value="card">Card</option><option value="online">Online</option>
        </select></div>
      </div>
    `,
    footer: `<button type="button" class="btn btn-outline" data-close>Cancel</button>
             <button type="button" class="btn btn-primary" id="cf-save">${Icons.html('check', 'icon-sm')} Record payment</button>`,
    onOpen: function (elModal) {
      elModal.querySelector('#cf-fee').addEventListener('change', function (e) {
        var opt = e.target.selectedOptions[0];
        if (opt && opt.dataset.amount) document.getElementById('cf-amount').value = opt.dataset.amount;
      });
      elModal.querySelector('#cf-save').addEventListener('click', function () {
        var studentId = document.getElementById('cf-student').value;
        var feeId = document.getElementById('cf-fee').value;
        var amount = Number(document.getElementById('cf-amount').value);
        if (!studentId || !feeId || !amount) { UI.toast('Please fill in all required fields.', 'error'); return; }

        var payment = DB.insert('payments', {
          studentId: Number(studentId), feeStructureId: Number(feeId), amountPaid: amount,
          paymentMode: document.getElementById('cf-mode').value, paymentDate: new Date().toISOString(),
          receiptNo: DB.generateCode('RCPT'), status: 'paid'
        });
        UI.toast('Payment recorded. Receipt ' + payment.receiptNo, 'success');
        handle.close();
        refreshPaymentsTable();
        openReceiptModal(payment.id);
      });
    }
  });
}

function openReceiptModal(paymentId) {
  var p = DB.find('payments', paymentId);
  if (!p) return;
  var student = DB.find('students', p.studentId);
  var fee = DB.find('feeStructures', p.feeStructureId);

  UI.openModal({
    title: 'Fee receipt',
    body: `
      <div class="flex justify-between items-center mb-2">
        <div><h3 style="margin-bottom:.1rem;">${Icons.html('graduation', 'icon-sm')} Meridian School</h3><p class="text-xs text-soft">Official fee payment receipt</p></div>
        <span class="badge badge-paid">${p.status.toUpperCase()}</span>
      </div>
      <table class="grid">
        <tr><td class="text-soft">Receipt No.</td><td class="text-right cell-primary mono">${p.receiptNo}</td></tr>
        <tr><td class="text-soft">Date</td><td class="text-right">${UI.dateTimeFmt(p.paymentDate)}</td></tr>
        <tr><td class="text-soft">Student</td><td class="text-right">${student ? UI.escapeHTML(student.name) : '\u2014'}</td></tr>
        <tr><td class="text-soft">Admission No.</td><td class="text-right mono">${student ? student.admissionNo : '\u2014'}</td></tr>
        <tr><td class="text-soft">Fee type</td><td class="text-right">${fee ? UI.escapeHTML(fee.feeType) : '\u2014'}</td></tr>
        <tr><td class="text-soft">Payment mode</td><td class="text-right">${p.paymentMode.toUpperCase()}</td></tr>
        <tr><td class="cell-primary">Amount paid</td><td class="text-right cell-primary" style="font-size:1.2rem; color:var(--pine);">${UI.currency(p.amountPaid)}</td></tr>
      </table>
      <p class="text-xs text-soft text-center mt-2">This is a system-generated receipt and does not require a signature.</p>
    `,
    footer: `<button type="button" class="btn btn-outline" data-close>Close</button>
             <button type="button" class="btn btn-primary" id="rc-print">${Icons.html('printer', 'icon-sm')} Print / Save as PDF</button>`,
    onOpen: function (elModal) {
      elModal.querySelector('#rc-print').addEventListener('click', function () { printReceipt(p, student, fee); });
    }
  });
}

function printReceipt(p, student, fee) {
  var w = window.open('', '_blank', 'width=480,height=640');
  if (!w) { UI.toast('Please allow pop-ups to print the receipt.', 'error'); return; }
  w.document.write(`
    <html><head><title>Receipt ${p.receiptNo}</title>
    <style>
      body{ font-family: 'IBM Plex Sans', sans-serif; padding:32px; color:#16231F; }
      h1{ font-size:18px; margin-bottom:2px; } p{ color:#4B5B54; font-size:12px; margin-top:0;}
      table{ width:100%; border-collapse:collapse; margin-top:16px; font-size:13px; }
      td{ padding:8px 0; border-bottom:1px solid #E3E4DC; }
      td:last-child{ text-align:right; }
      .total td{ font-weight:700; font-size:16px; border-bottom:none; }
      .foot{ text-align:center; color:#8a9490; font-size:11px; margin-top:24px; }
    </style></head><body>
    <h1>Meridian School</h1><p>Official Fee Payment Receipt</p>
    <table>
      <tr><td>Receipt No.</td><td>${p.receiptNo}</td></tr>
      <tr><td>Date</td><td>${UI.dateTimeFmt(p.paymentDate)}</td></tr>
      <tr><td>Student</td><td>${student ? student.name : '\u2014'}</td></tr>
      <tr><td>Admission No.</td><td>${student ? student.admissionNo : '\u2014'}</td></tr>
      <tr><td>Fee type</td><td>${fee ? fee.feeType : '\u2014'}</td></tr>
      <tr><td>Payment mode</td><td>${p.paymentMode.toUpperCase()}</td></tr>
      <tr class="total"><td>Amount paid</td><td>\u20B9${Number(p.amountPaid).toLocaleString('en-IN')}</td></tr>
    </table>
    <p class="foot">This is a system-generated receipt and does not require a signature.</p>
    </body></html>
  `);
  w.document.close();
  w.focus();
  setTimeout(function () { w.print(); }, 250);
}

function exportFeesCSV() {
  var rows = DB.all('payments').map(function (p) {
    var stu = DB.find('students', p.studentId);
    var fee = DB.find('feeStructures', p.feeStructureId);
    return [p.receiptNo, stu ? stu.admissionNo : '', stu ? stu.name : '', fee ? fee.feeType : '', p.amountPaid, p.paymentMode, UI.dateFmt(p.paymentDate), p.status];
  });
  UI.downloadCSV('fees_report.csv', ['Receipt No', 'Admission No', 'Student', 'Fee Type', 'Amount', 'Mode', 'Date', 'Status'], rows);
  UI.toast('Fees report downloaded.', 'success');
}
