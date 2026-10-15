/* ============================================================
   RAZOR CLOUD — Overview Page Renderer
   ============================================================ */
(function() {
  function renderOverview(container) {
    const S = window.S;
    const DB = window.DB;
    const t = window.t;
    const ic = window.ic;
    const fmtM = window.fmtM;
    const fmtP = window.fmtP;
    const ago = window.ago;

    const myEngines = S.role === 'admin' ? DB.engines : DB.engines.filter(e => e.owner === S.user.email);
    const online = myEngines.filter(e => e.status === 'online').length;
    const latestBcast = DB.broadcasts[0];

    let html = '';
    if (latestBcast) {
      html += `<div class="bcast ${latestBcast.style}">${ic({ info: 'info', warning: 'alert', error: 'alert', success: 'check' }[latestBcast.style] || 'info')}<div><b>${latestBcast.style.toUpperCase()} · </b>${latestBcast.text}</div></div>`;
    }

    if (S.role === 'developer') {
      html += `<div class="hint warn">${ic('lock')}<div><b>${t('roleDeveloper')} tier.</b> Live trading uses the MockAdapter only; historical data limited to a 3-month rolling window. Upgrade to lift restrictions.</div></div>`;
    }

    // Stat Cards
    html += `<div class="grid g4 mb16">
      <div class="stat">
        <div class="lbl">${ic('radio')} ${t('enginesOnline')}</div>
        <div class="val">${window.fmtN(online)}<span style="font-size:14px;color:var(--mut)">/${window.fmtN(myEngines.length)}</span></div>
        <div class="delta up">${t('nominalHeartbeats')}</div>
        <div class="ic">${ic('server')}</div>
      </div>
      <div class="stat">
        <div class="lbl">${ic('bolt')} ${t('liveEquity')}</div>
        <div class="val ${S.live.eq >= S.live.start ? 'up' : 'down'}">${fmtM(S.live.eq)}</div>
        <div class="delta ${S.live.eq >= S.live.start ? 'up' : 'down'}">${fmtP((S.live.eq - S.live.start) / S.live.start * 100)} session</div>
        <div class="ic">${ic('trend')}</div>
      </div>
      <div class="stat">
        <div class="lbl">${ic('dna')} ${t('activeTasks')}</div>
        <div class="val">${window.fmtN((S.live.running ? 1 : 0) + (S.bt.running ? 1 : 0) + (S.opt.running ? 1 : 0))}</div>
        <div class="delta muted">live · backtest · opt</div>
        <div class="ic">${ic('layers')}</div>
      </div>
      <div class="stat">
        <div class="lbl">${ic('clock')} ${t('tickFreshness')}</div>
        <div class="val">${myEngines[0] && myEngines[0].status === 'online' ? window.fmtN(myEngines[0].tickAge) + 'ms' : '—'}</div>
        <div class="delta ${myEngines[0] && myEngines[0].tickAge < 300 ? 'up' : 'warn'}">${myEngines[0] && myEngines[0].status === 'online' ? t('streamHealthy') : t('noStream')}</div>
        <div class="ic">${ic('zap')}</div>
      </div>
    </div>`;

    // Engines & Activity
    html += `<div class="grid g2 mb16">
      <div class="card">
        <div class="card-h"><h3>${t('instances')}</h3><span class="sub">Cloud → Engine WSS</span></div>
        <div class="grid g2" style="gap:12px">`;

    myEngines.forEach(e => {
      html += `<div class="eng-card ${e.status === 'online' ? '' : 'offline'}">
        <div class="ec-top">
          <div><div class="ec-name">${e.name}</div><div class="ec-id">${e.id}</div></div>
          <span class="badge ${e.status === 'online' ? 'ok' : 'err'}"><span class="dot"></span>${e.status}</span>
        </div>
        <div class="ec-meta">
          <div><span class="k">${t('endpoint')}</span><span class="v">${e.endpoint}</span></div>
          <div><span class="k">${t('version')}</span><span class="v">${e.version}</span></div>
          <div><span class="k">CPU</span><span class="v">${window.fmtN(e.cpu)}%</span></div>
          <div><span class="k">MEM</span><span class="v">${window.fmtN(e.mem)}%</span></div>
        </div>
        <div class="ec-caps">${e.caps.slice(0, 6).map(c => `<span class="c">F${c}</span>`).join('')}${e.caps.length > 6 ? `<span class="c">+${e.caps.length - 6}</span>` : ''}</div>
      </div>`;
    });

    html += `</div></div>
      <div class="card">
        <div class="card-h"><h3>${t('logs')} Feed</h3><button class="btn xs ghost" onclick="RZ.go('logs')">${t('viewLogs')}</button></div>
        <div id="ov-activity"></div>
      </div>
    </div>`;

    // Quick Actions & Telemetry Chart
    html += `<div class="grid g3">
      <div class="card">
        <div class="card-h"><h3>Quick Actions</h3></div>
        <div style="display:flex;flex-direction:column;gap:8px">
          <button class="btn ghost" style="justify-content:flex-start" onclick="RZ.go('live')">${ic('bolt')} ${t('startLiveSession')}</button>
          <button class="btn ghost" style="justify-content:flex-start" onclick="RZ.go('backtest')">${ic('chart')} ${t('runBacktest')}</button>
          <button class="btn ghost" style="justify-content:flex-start" onclick="RZ.go('optimization')">${ic('dna')} ${t('startOptimization')}</button>
          <button class="btn ghost" style="justify-content:flex-start" onclick="RZ.go('extensions')">${ic('puzzle')} ${t('extensions')}</button>
        </div>
      </div>
      <div class="card" style="grid-column:span 2">
        <div class="card-h"><h3>Platform Telemetry</h3><span class="sub">last 60 samples</span></div>
        <div class="chart-box"><canvas id="ov-chart" style="height:170px"></canvas></div>
      </div>
    </div>`;

    const userName = S.user ? S.user.name.split(' ')[0] : 'Trader';
    const head = `<div class="page-head">
      <div>
        <h1>${t('overview')} · ${userName}</h1>
        <p>Cloud is the single source of truth. Your engines execute, stream raw data, and forget — every command, schedule and report lives here.</p>
      </div>
    </div>`;

    container.innerHTML = head + html;

    // Activity feed items
    const acts = [
      { ic: 'zap', c: 'acc', t: 'Command InjectGenes dispatched', d: 'to PROD-FRANKFURT-01', tm: Date.now() - 900000 },
      { ic: 'dna', c: 'vio', t: 'Optimization op_2b completed', d: 'best fitness 2.41', tm: Date.now() - 1800000 },
      { ic: 'chart', c: 'info', t: 'Backtest bt_7a finished', d: 'Sharpe 2.14', tm: Date.now() - 7200000 },
      { ic: 'radio', c: 'up', t: 'Heartbeat OK', d: 'all instances', tm: Date.now() - 30000 }
    ];

    const actEl = document.getElementById('ov-activity');
    if (actEl) {
      actEl.innerHTML = acts.map(a => `<div class="kv" style="align-items:flex-start">
        <div style="display:flex;gap:10px">
          <div style="color:var(--${a.c})">${ic(a.ic)}</div>
          <div>
            <div style="font-weight:600">${a.t}</div>
            <div class="muted" style="font-size:11.5px">${a.d}</div>
          </div>
        </div>
        <span class="cell-mono">${ago(a.tm)}</span>
      </div>`).join('');
    }

    const chartCv = document.getElementById('ov-chart');
    if (chartCv) {
      window.drawArea(chartCv, window.walk(60, 100, 0.02, 0.04, 99), '#0071e3', { baseline: 100, money: false, dec: 1 });
    }
  }

  window.renderOverview = renderOverview;
  if (!window.RENDER) window.RENDER = {};
  window.RENDER.overview = () => {
    const c = document.getElementById('content');
    if (c) renderOverview(c);
  };
})();
