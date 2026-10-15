/* ============================================================
   RAZOR CLOUD — Scheduling & Cron Page Renderer
   ============================================================ */
(function() {
  function renderScheduling(container) {
    const t = window.t;
    const ic = window.ic;

    let html = `<div class="page-head">
      <div>
        <h1>${t('scheduling')}</h1>
        <p>Cloud owns all scheduling. Cron jobs persist in the engine's SQLite and fire configured commands; one-off schedules use in-memory timers.</p>
      </div>
    </div>`;

    html += `<div class="tabs">
      <div class="tab active" data-tab="cron" onclick="RZ.tab(this,'sch')">Cron Jobs</div>
      <div class="tab" data-tab="sched" onclick="RZ.tab(this,'sch')">One-off Schedules</div>
    </div>`;

    html += `<div class="tab-panel active" data-panel="cron">
      <div class="card">
        <div class="card-h">
          <h3>Cron Jobs</h3>
          <button class="btn primary sm" onclick="RZ.openCron()">${ic('plus')} ${t('newCronJob')}</button>
        </div>
        <div class="tbl-wrap">
          <table>
            <thead><tr><th>${t('description')}</th><th>${t('expression')}</th><th>${t('command')}</th><th>${t('nextRun')}</th><th>${t('enabled')}</th><th></th></tr></thead>
            <tbody id="cron-list"></tbody>
          </table>
        </div>
      </div>
    </div>`;

    html += `<div class="tab-panel" data-panel="sched">
      <div class="card">
        <div class="card-h">
          <h3>One-off Schedules</h3>
          <button class="btn primary sm" onclick="RZ.openSched()">${ic('plus')} ${t('newSchedule')}</button>
        </div>
        <div class="tbl-wrap">
          <table>
            <thead><tr><th>${t('description')}</th><th>${t('scheduledTime')}</th><th>${t('command')}</th><th>${t('repeat')}</th><th></th></tr></thead>
            <tbody id="sched-list"></tbody>
          </table>
        </div>
      </div>
    </div>`;

    container.innerHTML = html;
    renderCronList();
    renderSchedList();
  }

  function renderCronList() {
    const el = document.getElementById('cron-list');
    if (!el) return;
    const CMDS = window.CMDS;
    el.innerHTML = window.DB.crons.map(c => {
      const cmd = CMDS.find(x => x.id === c.cmd);
      return `<tr>
        <td><b>${c.desc}</b><div class="cell-mono">${c.id}</div></td>
        <td class="mono">${c.expr}</td>
        <td><span class="chip">${cmd ? cmd.t : c.cmd}</span></td>
        <td class="mono muted">${c.next}</td>
        <td><div class="toggle ${c.enabled ? 'on' : ''}" onclick="RZ.toggleCron('${c.id}')"></div></td>
        <td class="cell-actions"><button class="btn xs danger" onclick="RZ.delCron('${c.id}')">${window.ic('trash')}</button></td>
      </tr>`;
    }).join('');
  }

  function renderSchedList() {
    const el = document.getElementById('sched-list');
    if (!el) return;
    const CMDS = window.CMDS;
    el.innerHTML = window.DB.schedules.map(s => {
      const cmd = CMDS.find(x => x.id === s.cmd);
      return `<tr>
        <td><b>${s.desc}</b><div class="cell-mono">${s.id}</div></td>
        <td class="mono">${s.time}</td>
        <td><span class="chip">${cmd ? cmd.t : s.cmd}</span></td>
        <td>${s.repeat ? '<span class="badge info">repeat</span>' : '<span class="badge muted">once</span>'}</td>
        <td class="cell-actions"><button class="btn xs danger" onclick="RZ.delSched('${s.id}')">${window.ic('trash')}</button></td>
      </tr>`;
    }).join('');
  }

  window.RZ = window.RZ || {};
  window.RZ.tab = function(el) {
    el.parentElement.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    const p = el.dataset.tab;
    document.querySelectorAll('.tab-panel').forEach(x => x.classList.toggle('active', x.dataset.panel === p));
  };

  window.RZ.openCron = function() {
    const ic = window.ic;
    const CMDS = window.CMDS;

    window.modal(`<div class="modal-h"><h3>New Cron Job</h3><button class="x" onclick="closeModal()">${ic('x')}</button></div>
      <div class="modal-b">
        <div class="field"><label>Description</label><input id="cj-desc" value="Nightly continuous optimisation"></div>
        <div class="field"><label>Cron expression (5 fields: min hour dom month dow)</label><input id="cj-expr" value="0 22 * * 5">
          <div class="tf-row mt8">${['0 22 * * 5', '0 0 * * *', '30 23 * * 0', '*/15 * * * *'].map(p => `<span class="tf-chip" onclick="document.getElementById('cj-expr').value='${p}'">${p}</span>`).join('')}</div>
        </div>
        <div class="field"><label>Command to execute</label><select id="cj-cmd">${CMDS.map(c => `<option value="${c.id}">${c.id} · ${c.t}</option>`).join('')}</select></div>
        <div class="hint">${ic('info')}<div>Engine stores the job in SQLite (CronJobManager) and evaluates it with NCrontab.</div></div>
      </div>
      <div class="modal-f"><button class="btn ghost" onclick="closeModal()">${window.t('cancel')}</button><button class="btn primary" onclick="RZ.saveCron()">${ic('check')} Create (1700)</button></div>`);
  };

  window.RZ.saveCron = function() {
    const expr = document.getElementById('cj-expr').value.trim();
    if (expr.split(/\s+/).length !== 5) {
      window.toast('Invalid cron', 'Expression must have 5 fields.', 'err');
      return;
    }
    window.DB.crons.unshift({
      id: window.uid(),
      expr,
      cmd: +document.getElementById('cj-cmd').value,
      enabled: true,
      next: 'scheduled',
      desc: document.getElementById('cj-desc').value || 'Cron job'
    });
    window.saveDB();
    window.closeModal();
    window.sendCommand(1700, 'SetCronJob', { expr }, () => {
      renderCronList();
      window.toast('Cron job created', expr, 'ok');
    });
  };

  window.RZ.toggleCron = function(id) {
    const c = window.DB.crons.find(x => x.id === id);
    if (!c) return;
    c.enabled = !c.enabled;
    window.saveDB();
    renderCronList();
    window.toast('Cron ' + (c.enabled ? 'enabled' : 'disabled'), c.desc, 'info');
  };

  window.RZ.delCron = function(id) {
    window.confirm('Delete cron job?', 'This removes the job from the engine SQLite.', () => {
      window.DB.crons = window.DB.crons.filter(x => x.id !== id);
      window.saveDB();
      renderCronList();
      window.sendCommand(1701, 'DeleteCronJob', {}, () => {});
      window.toast('Cron deleted', '', 'warn');
    });
  };

  window.RZ.openSched = function() {
    const ic = window.ic;
    const CMDS = window.CMDS;

    window.modal(`<div class="modal-h"><h3>New One-off Schedule</h3><button class="x" onclick="closeModal()">${ic('x')}</button></div>
      <div class="modal-b">
        <div class="field"><label>Description</label><input id="sc-desc" value="Start London session"></div>
        <div class="field"><label>Scheduled Date</label><input id="sc-date" type="date" value="2026-10-20" class="rz-date"></div>
        <div class="field"><label>Time (HH:MM)</label><input id="sc-time" type="time" value="08:30"></div>
        <div class="field"><label>Command</label><select id="sc-cmd">${CMDS.map(c => `<option value="${c.id}">${c.id} · ${c.t}</option>`).join('')}</select></div>
      </div>
      <div class="modal-f"><button class="btn ghost" onclick="closeModal()">${window.t('cancel')}</button><button class="btn primary" onclick="RZ.saveSched()">${ic('check')} Create (1703)</button></div>`);

    if (window.initDatePickers) {
      window.initDatePickers(document.getElementById('modalRoot'));
    }
  };

  window.RZ.saveSched = function() {
    const dateInput = document.getElementById('sc-date');
    const dateVal = dateInput.dataset.iso || dateInput.value;
    const timeVal = document.getElementById('sc-time').value || '00:00';

    if (!dateVal) {
      window.toast('Pick a date', '', 'err');
      return;
    }

    const fullStr = `${dateVal} ${timeVal} UTC`;
    window.DB.schedules.unshift({
      id: window.uid(),
      time: fullStr,
      cmd: +document.getElementById('sc-cmd').value,
      repeat: false,
      desc: document.getElementById('sc-desc').value || 'Scheduled task'
    });
    window.saveDB();
    window.closeModal();
    window.sendCommand(1703, 'SetSchedule', {}, () => {
      renderSchedList();
      window.toast('Schedule created', fullStr, 'ok');
    });
  };

  window.RZ.delSched = function(id) {
    window.DB.schedules = window.DB.schedules.filter(x => x.id !== id);
    window.saveDB();
    renderSchedList();
    window.toast('Schedule removed', '', 'warn');
  };

  window.renderScheduling = renderScheduling;
  if (!window.RENDER) window.RENDER = {};
  window.RENDER.scheduling = () => {
    const c = document.getElementById('content');
    if (c) renderScheduling(c);
  };
})();
