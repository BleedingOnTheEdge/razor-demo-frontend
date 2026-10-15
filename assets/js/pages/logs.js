/* ============================================================
   RAZOR CLOUD — Logs & Telemetry Page Renderer
   ============================================================ */
(function() {
  const LOG_LEVELS = ['Trace', 'Debug', 'Information', 'Warning', 'Error', 'Critical'];

  function seedLogs() {
    if (window.DB.logs && window.DB.logs.length) return;
    const lv = ['Information', 'Information', 'Debug', 'Warning', 'Information', 'Error', 'Trace'];
    const msgs = [
      'CloudConnector: heartbeat OK',
      'TaskManager: live task reserved core #0',
      'BacktestRunner: 1.2M ticks merged',
      'ExtensionManager: double validation passed',
      'LiveBroker: state reconciled',
      'Adapter: transient WS drop, retrying',
      'SecurityManager: session key rotated'
    ];
    window.DB.logs = [];
    for (let i = 0; i < 40; i++) {
      const l = lv[i % lv.length];
      window.DB.logs.push({ t: Date.now() - i * 42000, l, m: msgs[i % msgs.length] });
    }
  }

  function renderLogs(container) {
    const t = window.t;
    const ic = window.ic;

    let html = `<div class="page-head">
      <div>
        <h1>${t('logs')}</h1>
        <p>Serilog structured JSON, daily rotation (10 MB / 31 days). Streamed to Cloud on demand via binary transfer. OpenTelemetry metrics under meters Core.Metrics & Razor.Core.Engine.</p>
      </div>
      <div class="page-actions">
        <button class="btn ghost" onclick="RZ.exportLogs()">${ic('download')} Export</button>
        <button class="btn ghost" onclick="RZ.clearLogs()">${ic('trash')} ${t('clearConsole')}</button>
      </div>
    </div>`;

    html += `<div class="grid g4 mb16">
      <div class="card flat" style="display:flex;align-items:center;gap:16px">
        <div class="gauge" id="g-cpu"><span id="g-cpu-v">0%</span></div>
        <div><div class="muted" style="font-size:11px">CPU</div><div style="font-weight:600">engine process</div></div>
      </div>
      <div class="card flat" style="display:flex;align-items:center;gap:16px">
        <div class="gauge" id="g-mem"><span id="g-mem-v">0%</span></div>
        <div><div class="muted" style="font-size:11px">Memory</div><div style="font-weight:600">working set</div></div>
      </div>
      <div class="card flat">
        <div class="muted" style="font-size:11px">core.backtest.ticks_per_second</div>
        <div class="chart-box mt8"><canvas id="m-tps" style="height:54px"></canvas></div>
      </div>
      <div class="card flat">
        <div class="muted" style="font-size:11px">core.live.tick_latency</div>
        <div class="chart-box mt8"><canvas id="m-lat" style="height:54px"></canvas></div>
      </div>
    </div>`;

    html += `<div class="card">
      <div class="card-h">
        <div class="flex aic gap12">
          <h3>Log Stream</h3>
          <div class="toggle ${window.S.logStream ? 'on' : ''}" onclick="RZ.toggleLogStream()"></div>
          <span class="muted" style="font-size:12px">${window.S.logStream ? 'streaming' : 'paused'}</span>
        </div>
        <div class="flex aic gap8">
          <select id="log-level" onchange="RZ.setLogLevel(this.value)" style="background:var(--bg2);border:1px solid var(--line);border-radius:8px;padding:6px 9px;color:var(--txt)">
            ${LOG_LEVELS.map(l => `<option>${l}</option>`).join('')}
          </select>
          <input id="log-filter" placeholder="filter…" oninput="RZ.filterLogs(this.value)" style="background:var(--bg2);border:1px solid var(--line);border-radius:8px;padding:6px 9px;color:var(--txt);width:150px">
        </div>
      </div>
      <div class="log-view" id="log-body"></div>
    </div>`;

    container.innerHTML = html;
    seedLogs();
    renderLogBody();
    renderLogMetrics();
  }

  function renderLogBody() {
    const f = (window.S.logFilter || '').toLowerCase();
    const body = document.getElementById('log-body');
    if (!body) return;

    body.innerHTML = window.DB.logs.filter(l => (!f || l.m.toLowerCase().includes(f))).slice(0, 120).map(l => {
      const timeStr = window.utcStr ? window.utcStr(new Date(l.t)).slice(11, 19) : new Date(l.t).toTimeString().slice(0, 8);
      return `<div class="log-line L-${l.l}"><span class="lt">${timeStr}</span> <span class="lv">[${l.l}]</span> ${l.m}</div>`;
    }).join('');
  }

  function renderLogMetrics() {
    const e = window.DB.engines.find(x => x.owner === window.S.user.email && x.status === 'online') || window.DB.engines[0];
    if (!e) return;

    window.setGauge(document.getElementById('g-cpu'), e.cpu, '#0071e3');
    const cpuV = document.getElementById('g-cpu-v');
    if (cpuV) cpuV.textContent = Math.round(e.cpu) + '%';

    window.setGauge(document.getElementById('g-mem'), e.mem, '#af52de');
    const memV = document.getElementById('g-mem-v');
    if (memV) memV.textContent = Math.round(e.mem) + '%';

    const tpsCv = document.getElementById('m-tps');
    if (tpsCv) window.drawSpark(tpsCv, window.walk(40, 100, 0, 0.2, 5), '#0071e3');

    const latCv = document.getElementById('m-lat');
    if (latCv) window.drawSpark(latCv, window.walk(40, 100, 0, 0.3, 8), '#ff9500');
  }

  window.RZ = window.RZ || {};
  window.RZ.setLogLevel = function(v) {
    window.sendCommand(1603, 'SetLogLevel', { level: v }, () => {
      window.toast('Log level set', v, 'info');
    });
  };

  window.RZ.toggleLogStream = function() {
    window.S.logStream = !window.S.logStream;
    const c = document.getElementById('content');
    if (c) renderLogs(c);
  };

  window.RZ.filterLogs = function(v) {
    window.S.logFilter = v;
    renderLogBody();
  };

  window.RZ.clearLogs = function() {
    window.DB.logs = [];
    renderLogBody();
  };

  window.RZ.exportLogs = function() {
    window.sendCommand(1605, 'ExportMetrics', {}, () => {
      const blob = new Blob([window.DB.logs.map(l => (window.utcStr ? window.utcStr(new Date(l.t)) : new Date(l.t).toISOString()) + ' [' + l.l + '] ' + l.m).join('\n')], { type: 'text/plain' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'razor_logs_' + Date.now() + '.log';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.ws('Binary', { Type: 'BinaryTransferStart', file: 'logs/export.log' });
      window.toast('Logs exported', 'binary transfer complete', 'ok');
    });
  };

  window.logTick = function() {
    if (!window.S.logStream) return;
    const lv = ['Information', 'Debug', 'Warning', 'Information'];
    const msgs = [
      'tick processed symbol=EURUSD age=' + window.S.live.tickAge + 'ms',
      'heartbeat ack seq=' + (Math.floor(Math.random() * 9000)),
      'GC gen0 collect, heap 48MB',
      'command queue depth=0'
    ];
    window.DB.logs.unshift({
      t: Date.now(),
      l: lv[Math.floor(Math.random() * lv.length)],
      m: msgs[Math.floor(Math.random() * msgs.length)]
    });
    if (window.DB.logs.length > 400) window.DB.logs.pop();
    if (window.S.page === 'logs') renderLogBody();
  };

  window.renderLogs = renderLogs;
  if (!window.RENDER) window.RENDER = {};
  window.RENDER.logs = () => {
    const c = document.getElementById('content');
    if (c) renderLogs(c);
  };
})();
