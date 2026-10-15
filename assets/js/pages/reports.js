/* ============================================================
   RAZOR CLOUD — Reports & Analytics Page Renderer
   ============================================================ */
(function() {
  function renderReports(container) {
    const DB = window.DB;
    const t = window.t;
    const ic = window.ic;

    let html = `<div class="page-head">
      <div>
        <h1>${t('reports')}</h1>
        <p>The engine streams raw result data; Cloud renders formatted reports. Generate on demand or via cron (command 1500).</p>
      </div>
    </div>`;

    html += `<div class="grid" style="grid-template-columns:1fr 1.6fr;gap:16px">
      <div class="card">
        <div class="card-h"><h3>${t('generateReport')}</h3></div>
        <div class="field">
          <label>Source</label>
          <select id="rp-src">
            ${DB.backtests.filter(b => b.status === 'completed').map(b => `<option value="${b.id}">Backtest · ${b.name}</option>`).join('')}
            ${DB.opts.map(o => `<option value="${o.id}">Optimization · ${o.name}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label>Format</label>
          <div class="seg" id="rp-fmt">
            <button class="on" data-f="PDF">PDF</button>
            <button data-f="Excel">Excel</button>
            <button data-f="JSON">JSON</button>
          </div>
        </div>
        <div class="field">
          <label>Sections</label>
          <div class="tf-row">
            <span class="tf-chip on" onclick="this.classList.toggle('on')">Equity curve</span>
            <span class="tf-chip on" onclick="this.classList.toggle('on')">Trade list</span>
            <span class="tf-chip on" onclick="this.classList.toggle('on')">Metrics</span>
            <span class="tf-chip" onclick="this.classList.toggle('on')">Population</span>
            <span class="tf-chip" onclick="this.classList.toggle('on')">Correlation</span>
          </div>
        </div>
        <button class="btn primary" style="width:100%;justify-content:center" onclick="RZ.genReport()">${ic('file')} Generate (1500)</button>
        <div class="hint mt16">${ic('info')}<div>Hook plugins can transform raw data via <span class="mono">report.before_generate</span> / <span class="mono">report.after_generate</span>.</div></div>
      </div>
      <div class="card">
        <div class="card-h"><h3>Report Library</h3><span class="sub">${window.fmtN(DB.reports.length)} reports</span></div>
        <div class="tbl-wrap">
          <table>
            <thead><tr><th>Name</th><th>${t('format')}</th><th>${t('size')}</th><th>${t('created')}</th><th></th></tr></thead>
            <tbody id="rep-list"></tbody>
          </table>
        </div>
      </div>
    </div>`;

    container.innerHTML = html;

    document.querySelectorAll('#rp-fmt button').forEach(b => {
      b.onclick = () => {
        document.querySelectorAll('#rp-fmt button').forEach(x => x.classList.remove('on'));
        b.classList.add('on');
      };
    });

    renderRepList();
  }

  function renderRepList() {
    const el = document.getElementById('rep-list');
    if (!el) return;
    const ic = window.ic;

    el.innerHTML = window.DB.reports.map(r => `<tr>
      <td><b>${r.name}</b></td>
      <td><span class="chip">${r.fmt}</span></td>
      <td class="mono muted">${r.size}</td>
      <td class="mono muted">${window.ago(r.date)}</td>
      <td class="cell-actions">
        <button class="btn xs ghost" onclick="RZ.dlReport('${r.id}')" title="Download">${ic('download')}</button>
        <button class="btn xs danger" onclick="RZ.delReport('${r.id}')" title="Delete">${ic('trash')}</button>
      </td>
    </tr>`).join('');
  }

  window.RZ = window.RZ || {};
  window.RZ.genReport = function() {
    const fmtBtn = document.querySelector('#rp-fmt .on');
    const fmt = fmtBtn ? fmtBtn.dataset.f : 'PDF';
    const srcEl = document.getElementById('rp-src');
    const src = srcEl && srcEl.selectedOptions[0] ? srcEl.selectedOptions[0].text : 'Analysis';

    window.sendCommand(1500, 'GenerateReport', { format: fmt }, () => {
      const r = {
        id: window.uid(),
        name: src + ' — ' + fmt,
        fmt,
        size: (Math.random() * 2 + 0.2).toFixed(1) + ' MB',
        date: Date.now(),
        src
      };
      window.DB.reports.unshift(r);
      window.saveDB();
      renderRepList();
      window.toast('Report generated', fmt + ' ready to download.', 'ok');
    });
  };

  window.RZ.dlReport = function(id) {
    const r = window.DB.reports.find(x => x.id === id);
    if (!r) return;

    let content = '';
    let mime = 'text/plain';

    if (r.fmt === 'JSON') {
      content = JSON.stringify({
        report: r.name,
        format: r.fmt,
        generated: window.utcStr ? window.utcStr() : new Date().toISOString(),
        note: 'Razor Cloud demo export — raw result payload rendered by Cloud.',
        metrics: { sharpe: 2.14, netProfit: 1842.3, maxDrawdown: 6.8, trades: 312 }
      }, null, 2);
      mime = 'application/json';
    } else if (r.fmt === 'Excel') {
      content = `ID,Symbol,Side,P&L\n1,EURUSD,BUY,96.00\n2,BTCUSDT,SELL,19.20\n3,XAUUSD,BUY,15.00`;
      mime = 'text/csv';
    } else {
      content = `%PDF-1.4\n1 0 obj << /Title (${r.name}) /Author (Razor Cloud Control Plane) >>\nRazor Cloud Report: ${r.name}\nGenerated: ${new Date().toISOString()}\nStatus: Verified\nSharpe: 2.14\nNet Profit: $1,842.30\n%%EOF`;
    }

    const blob = new Blob([content], { type: mime });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = r.name.replace(/[^a-z0-9]/gi, '_') + '.' + (r.fmt === 'Excel' ? 'csv' : r.fmt.toLowerCase());
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.toast('Download started', a.download, 'info');
  };

  window.RZ.delReport = function(id) {
    window.DB.reports = window.DB.reports.filter(x => x.id !== id);
    window.saveDB();
    renderRepList();
    window.toast('Report deleted', '', 'warn');
  };

  window.renderReports = renderReports;
  if (!window.RENDER) window.RENDER = {};
  window.RENDER.reports = () => {
    const c = document.getElementById('content');
    if (c) renderReports(c);
  };
})();
