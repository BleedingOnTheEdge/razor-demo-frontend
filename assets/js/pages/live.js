/* ============================================================
   RAZOR CLOUD — Live Trading Page Renderer
   ============================================================ */
(function() {
  function seedLivePositions() {
    window.S.live.positions = [
      { id: 'p1', sym: 'EURUSD', type: 'BUY', vol: 0.5, open: 1.08420, cur: 1.08420, sl: 1.08100, tp: 1.09000, pnl: 0 },
      { id: 'p2', sym: 'BTCUSDT', type: 'SELL', vol: 0.08, open: 67420, cur: 67420, sl: 68000, tp: 66000, pnl: 0 }
    ];
  }

  function startLiveLoop() {
    if (window.S._liveLoop) clearInterval(window.S._liveLoop);
    window.S._liveLoop = window.every(900, () => {
      if (!window.S.live.running || window.S.live.paused) return;
      const L = window.S.live;
      L.eq *= (1 + (Math.random() - 0.48) * 0.004);
      L.peak = Math.max(L.peak, L.eq);
      L.dd = (L.peak - L.eq) / L.peak * 100;
      L.series.push(L.eq);
      if (L.series.length > 160) L.series.shift();
      L.tickAge = 40 + Math.floor(Math.random() * 180);

      L.positions.forEach(p => {
        const d = (Math.random() - 0.5) * (p.sym.includes('BTC') ? 40 : 0.0006);
        p.cur = +(p.cur + d).toFixed(p.sym.includes('BTC') ? 0 : 5);
        p.pnl = +((p.cur - p.open) * (p.type === 'BUY' ? 1 : -1) * (p.sym.includes('BTC') ? p.vol : p.vol * 100000)).toFixed(2);
      });

      L.ticks.unshift({
        time: window.utcStr ? window.utcStr().slice(11, 19) : new Date().toTimeString().slice(0, 8),
        sym: L.symbol,
        bid: (1.084 + Math.random() * 0.002).toFixed(5),
        ask: (1.084 + Math.random() * 0.002 + 0.00012).toFixed(5)
      });
      if (L.ticks.length > 12) L.ticks.pop();

      if (Math.random() < 0.12) window.ws('Event', { Type: 'Tick', symbol: L.symbol, age: L.tickAge });

      if (window.S.page === 'live') {
        const eqCv = document.getElementById('eq-canvas');
        if (eqCv) window.drawArea(eqCv, L.series, '#0071e3', { baseline: L.start, money: true });
        renderLiveTables();
        const tag = document.getElementById('lv-tickage');
        if (tag) tag.textContent = window.fmtN(L.tickAge) + 'ms';
      }
    });
  }

  function renderLive(container) {
    const S = window.S;
    const DB = window.DB;
    const t = window.t;
    const ic = window.ic;
    const fmtM = window.fmtM;
    const L = S.live;
    const devLock = S.role === 'developer';

    const statusBadge = L.running
      ? (L.paused ? '<span class="badge warn"><span class="dot"></span>Paused</span>' : '<span class="badge ok"><span class="dot pulse"></span>Live</span>')
      : '<span class="badge muted"><span class="dot"></span>Idle</span>';

    let html = `<div class="page-head">
      <div>
        <h1>${t('live')}</h1>
        <p>Real-time session control. Live tasks hold a reserved core with highest scheduling priority and are never pre-empted.</p>
      </div>
      <div class="page-actions">
        ${L.running
          ? `<button class="btn ghost" onclick="RZ.pauseLive()">${ic(L.paused ? 'play' : 'pause')} ${L.paused ? t('resume') : t('pause')}</button>
             <button class="btn primary" onclick="RZ.openInjectGenes()">${ic('dna')} ${t('injectGenes')}</button>
             <button class="btn ghost" onclick="RZ.syncNow()">${ic('refresh')} ${t('sync')}</button>
             <button class="btn danger" onclick="RZ.stopLive()">${ic('stop')} ${t('stopLiveSession')}</button>`
          : `<button class="btn primary" onclick="RZ.startLive()">${ic('play')} ${t('startLiveSession')}</button>`}
      </div>
    </div>`;

    if (devLock) {
      html += `<div class="hint warn mb16">${ic('lock')}<div><b>Mock adapter enforced.</b> On the Free Developer tier, live orders are recorded but never executed. Upgrade to live trade with real brokers.</div></div>`;
    }

    // Status bar
    html += `<div class="card flat mb16">
      <div class="flex aic jcb" style="flex-wrap:wrap;gap:14px">
        <div class="flex aic gap12">
          ${statusBadge}
          <span style="font-family:var(--head);font-weight:600">${L.symbol}</span>
          <span class="chip">${ic('puzzle')} ${L.adapter}</span>
          <span class="chip">magic ${window.fmtN(L.magic)}</span>
          <span class="chip">guard ${window.fmtN(L.guard)}s</span>
        </div>
        <div class="flex aic gap12">
          <span class="chip ${L.behavior ? 'on' : ''}">${ic('db')} Behavior log ${L.behavior ? 'ON' : 'OFF'}</span>
          <button class="btn xs ghost" onclick="RZ.toggleBehavior()">${L.behavior ? 'Disable' : 'Enable'}</button>
        </div>
      </div>
    </div>`;

    // Stats
    html += `<div class="grid g4 mb16">
      <div class="stat"><div class="lbl">${t('balance')}</div><div class="val">${fmtM(L.bal)}</div></div>
      <div class="stat"><div class="lbl">${t('equity')}</div><div class="val ${L.eq >= L.start ? 'up' : 'down'}">${fmtM(L.eq)}</div></div>
      <div class="stat"><div class="lbl">${t('drawdown')}</div><div class="val down">${window.fmtP(L.dd)}</div></div>
      <div class="stat"><div class="lbl">${t('tickAge')}</div><div class="val" id="lv-tickage">${window.fmtN(L.tickAge)}ms</div></div>
    </div>`;

    // Equity Curve Chart
    html += `<div class="card mb16">
      <div class="card-h">
        <h3>Live Equity Curve</h3>
        <span class="sub ${L.running ? 'up' : 'muted'}">${L.running ? '● streaming' : 'stopped'}</span>
      </div>
      <div class="chart-box"><canvas id="eq-canvas" style="height:260px"></canvas></div>
    </div>`;

    // Positions & Orders
    html += `<div class="grid g2 mb16">
      <div class="card">
        <div class="card-h"><h3>Open Positions</h3><span class="badge muted">${L.positions ? window.fmtN(L.positions.length) : '0'}</span></div>
        <div class="tbl-wrap">
          <table>
            <thead><tr><th>${t('symbol')}</th><th>${t('type')}</th><th>${t('volume')}</th><th>${t('openPrice')}</th><th>${t('currentPrice')}</th><th>${t('slTp')}</th><th style="text-align:right">${t('pnl')}</th><th></th></tr></thead>
            <tbody id="lv-positions"></tbody>
          </table>
        </div>
      </div>
      <div class="card">
        <div class="card-h"><h3>Pending Orders</h3><span class="badge muted">${window.fmtN(DB.orders.length)}</span></div>
        <div class="tbl-wrap">
          <table>
            <thead><tr><th>${t('symbol')}</th><th>${t('type')}</th><th>${t('volume')}</th><th>${t('price')}</th><th>${t('slTp')}</th><th></th></tr></thead>
            <tbody id="lv-orders"></tbody>
          </table>
        </div>
      </div>
    </div>`;

    // Ticks & Connection Info
    html += `<div class="grid g2">
      <div class="card">
        <div class="card-h"><h3>Tick Stream</h3><span class="sub mono">bid / ask</span></div>
        <div id="lv-ticks" style="font-family:var(--mono);font-size:11.5px;max-height:200px;overflow-y:auto"></div>
      </div>
      <div class="card">
        <div class="card-h"><h3>Connection & Reconciliation</h3></div>
        <div class="kv"><span class="k">Adapter state</span><span class="v ${L.running ? 'up' : 'muted'}">${L.running ? 'Connected' : 'Disconnected'}</span></div>
        <div class="kv"><span class="k">${t('endpoint')}</span><span class="v">wss://cloud.razor.io/engine</span></div>
        <div class="kv"><span class="k">Last state sync</span><span class="v" id="lv-sync">${L.running ? window.ago(Date.now() - 12000) : '—'}</span></div>
        <div class="kv"><span class="k">Reconnect attempts</span><span class="v">0</span></div>
        <div class="kv"><span class="k">Order guard (monotonic)</span><span class="v">${window.fmtN(L.guard)}s</span></div>
        <div class="hint mt8">${ic('info')}<div>Live broker reconciles balance, positions and orders with the adapter independently of ticks; full reconciliation runs after every reconnect.</div></div>
      </div>
    </div>`;

    container.innerHTML = html;
    renderLiveTables();

    const cv = document.getElementById('eq-canvas');
    if (cv) {
      if (L.running && L.series && L.series.length > 1) {
        window.drawArea(cv, L.series, '#0071e3', { baseline: L.start, money: true });
      } else {
        const { ctx, w, h } = window.setupCanvas(cv);
        if (ctx) {
          ctx.clearRect(0, 0, w, h);
          ctx.fillStyle = '#86868b';
          ctx.font = '13px -apple-system, BlinkMacSystemFont, "Inter", "Vazirmatn", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('No live session — press “Start live session”', w / 2, h / 2);
        }
      }
    }
  }

  function renderLiveTables() {
    const L = window.S.live;
    const pt = document.getElementById('lv-positions');
    if (pt) {
      pt.innerHTML = (L.running && L.positions && L.positions.length)
        ? L.positions.map(p => `<tr>
            <td><b>${p.sym}</b></td>
            <td><span class="badge ${p.type === 'BUY' ? 'ok' : 'err'}">${p.type}</span></td>
            <td class="mono">${window.fmtN(p.vol, 2)}</td>
            <td class="mono">${p.open}</td>
            <td class="mono">${p.cur}</td>
            <td class="mono muted">${p.sl} / ${p.tp}</td>
            <td class="mono ${p.pnl >= 0 ? 'up' : 'down'}" style="text-align:right">${window.fmtM(p.pnl)}</td>
            <td class="cell-actions"><button class="btn xs danger" onclick="RZ.closePosition('${p.id}')">Close</button></td>
          </tr>`).join('')
        : '<tr><td colspan="8" class="empty">No open positions</td></tr>';
    }

    const ot = document.getElementById('lv-orders');
    if (ot) {
      ot.innerHTML = (L.running && window.DB.orders.length)
        ? window.DB.orders.map(o => `<tr>
            <td><b>${o.sym}</b></td>
            <td class="mono">${o.type}</td>
            <td class="mono">${window.fmtN(o.vol, 2)}</td>
            <td class="mono">${o.price}</td>
            <td class="mono muted">${o.sl} / ${o.tp}</td>
            <td class="cell-actions"><button class="btn xs ghost" onclick="RZ.cancelOrder('${o.id}')">Cancel</button></td>
          </tr>`).join('')
        : '<tr><td colspan="6" class="empty">No pending orders</td></tr>';
    }

    const tk = document.getElementById('lv-ticks');
    if (tk && L.running) {
      tk.innerHTML = L.ticks.slice(0, 12).map(t => `<div class="kv" style="padding:5px 0">
        <span class="muted">${t.time}</span>
        <span><b>${t.sym}</b> <span class="up">${t.bid}</span> / <span class="down">${t.ask}</span></span>
      </div>`).join('') || '<div class="empty">awaiting ticks…</div>';
    }
  }

  window.RZ = window.RZ || {};
  window.RZ.startLive = function() {
    if (window.S.live.running) return;
    const t = window.t;
    const ic = window.ic;

    window.modal(`<div class="modal-h"><h3>${t('startLiveSession')}</h3><button class="x" onclick="closeModal()">${ic('x')}</button></div>
      <div class="modal-b">
        <div class="hint mb16">${ic('info')}<div>Full configuration is pushed from Cloud. The engine holds no local config beyond this session.</div></div>
        <div class="form-grid">
          <div class="field"><label>Adapter (slot)</label><select id="lv-adapter">${window.DB.extensions.filter(e => e.cat === 'Adapters').map(e => `<option ${e.id === 'e1' ? 'selected' : ''} ${window.S.role === 'developer' && e.signed && e.source !== 'Bundled' && e.id !== 'e3' ? 'disabled' : ''}>${e.name}${window.S.role === 'developer' && e.id !== 'e3' ? ' (mock only)' : ''}</option>`).join('')}</select></div>
          <div class="field"><label>Strategy (slot)</label><select id="lv-strat">${window.DB.extensions.filter(e => e.cat === 'Strategies').map(e => `<option>${e.name}</option>`).join('')}</select></div>
          <div class="field"><label>${t('symbol')}</label><input id="lv-sym" value="EURUSD"></div>
          <div class="field"><label>Magic Number (&gt;0)</label><input id="lv-magic" type="number" value="123456"></div>
          <div class="field"><label>Order guard timeout (s)</label><input id="lv-guard" type="number" value="5"></div>
          <div class="field"><label>Initial balance</label><input id="lv-bal" type="number" value="10000"></div>
        </div>
      </div>
      <div class="modal-f"><button class="btn ghost" onclick="closeModal()">${t('cancel')}</button><button class="btn primary" id="lv-go">${ic('play')} Dispatch StartLive (1100)</button></div>`);

    document.getElementById('lv-go').onclick = () => {
      const magic = parseInt(document.getElementById('lv-magic').value, 10);
      const guard = parseInt(document.getElementById('lv-guard').value, 10);
      const bal = parseFloat(document.getElementById('lv-bal').value);

      if (!(magic > 0)) { window.toast('Invalid config', 'MagicNumber must be > 0.', 'err'); return; }
      if (!(guard > 0)) { window.toast('Invalid config', 'OrderGuardTimeoutSeconds must be > 0.', 'err'); return; }
      if (!(bal > 0)) { window.toast('Invalid config', 'InitialBalance must be > 0.', 'err'); return; }

      window.closeModal();
      window.S.live.adapter = document.getElementById('lv-adapter').value;
      window.S.live.symbol = document.getElementById('lv-sym').value || 'EURUSD';
      window.S.live.magic = magic;
      window.S.live.guard = guard;
      window.S.live.start = bal;
      window.S.live.bal = bal;
      window.S.live.eq = bal;
      window.S.live.peak = bal;
      window.S.live.dd = 0;

      window.sendCommand(1100, 'StartLive', { magicNumber: magic, orderGuardTimeoutSeconds: guard, adapter: window.S.live.adapter }, () => {
        window.S.live.running = true;
        window.S.live.paused = false;
        window.S.live.series = [bal];
        window.S.live.ticks = [];
        seedLivePositions();
        window.toast('Live session started', window.S.live.symbol + ' on ' + window.S.live.adapter, 'ok');
        window.ws('Event', { Type: 'ConnectionState', IsConnected: true, Adapter: window.S.live.adapter });
        if (window.S.page === 'live') renderLive(document.getElementById('content'));
        startLiveLoop();
      });
    };
  };

  window.RZ.stopLive = function() {
    window.confirm('Stop live session?', 'All open positions will be closed and the live task released. The engine keeps retrying Cloud regardless.', () => {
      window.sendCommand(1101, 'StopLive', {}, () => {
        window.S.live.running = false;
        window.S.live.paused = false;
        if (window.S._liveLoop) { clearInterval(window.S._liveLoop); window.S._liveLoop = null; }
        window.S.live.positions = [];
        window.ws('Event', { Type: 'LiveSessionEnded', finalEquity: +window.S.live.eq.toFixed(2) });
        window.toast('Live session stopped', 'Final equity ' + window.fmtM(window.S.live.eq), 'warn');
        if (window.S.page === 'live') renderLive(document.getElementById('content'));
      });
    }, true, 'Stop session');
  };

  window.RZ.pauseLive = function() {
    window.sendCommand(window.S.live.paused ? 1104 : 1103, window.S.live.paused ? 'ResumeLive' : 'PauseLive', {}, () => {
      window.S.live.paused = !window.S.live.paused;
      window.toast(window.S.live.paused ? 'Live paused' : 'Live resumed', '', 'info');
      if (window.S.page === 'live') renderLive(document.getElementById('content'));
    });
  };

  window.RZ.syncNow = function() {
    window.sendCommand(1106, 'SyncLive', {}, () => {
      window.toast('State reconciled', 'Balance & positions synced with adapter.', 'ok');
      const el = document.getElementById('lv-sync');
      if (el) el.textContent = window.t('justNow');
    });
  };

  window.RZ.toggleBehavior = function() {
    const on = !window.S.live.behavior;
    window.sendCommand(on ? 2100 : 2101, on ? 'EnableBehaviorLogging' : 'DisableBehaviorLogging', {}, () => {
      window.S.live.behavior = on;
      window.toast('Behavior logging ' + (on ? 'enabled' : 'disabled'), 'Sparse RL records ' + (on ? 'buffered' : 'stopped') + '.', 'info');
      if (window.S.page === 'live') renderLive(document.getElementById('content'));
    });
  };

  window.RZ.closePosition = function(id) {
    window.S.live.positions = window.S.live.positions.filter(p => p.id !== id);
    window.ws('Event', { Type: 'PositionClosed', id });
    window.toast('Position closed', id, 'ok');
    renderLiveTables();
  };

  window.RZ.cancelOrder = function(id) {
    const o = window.DB.orders.find(x => x.id === id);
    window.DB.orders = window.DB.orders.filter(x => x.id !== id);
    window.ws('Event', { Type: 'OrderCancelled', id });
    window.toast('Order cancelled', o ? o.sym : '', 'ok');
    renderLiveTables();
  };

  window.RZ.openInjectGenes = function() {
    const genes = [['FastEMA', 12], ['SlowEMA', 34], ['RsiPeriod', 14], ['RsiThreshold', 62], ['RiskPct', 1.5]];
    window.modal(`<div class="modal-h"><h3>Inject Genes → Live</h3><button class="x" onclick="closeModal()">${window.ic('x')}</button></div>
      <div class="modal-b">
        <div class="hint mb16">${window.ic('dna')}<div>Push a new chromosome to the running strategy without restarting the session (command 1102).</div></div>
        <div id="gene-rows">${genes.map(g => `<div class="sym-row"><input value="${g[0]}" disabled style="max-width:140px"><input type="number" step="0.01" value="${g[1]}" class="gv"></div>`).join('')}</div>
        <button class="btn xs ghost mt8" onclick="RZ.autofillGenes()">${window.ic('refresh')} Autofill from latest optimization</button>
      </div>
      <div class="modal-f"><button class="btn ghost" onclick="closeModal()">${window.t('cancel')}</button><button class="btn primary" id="inj-go">${window.ic('zap')} Inject (1102)</button></div>`);

    document.getElementById('inj-go').onclick = () => {
      const vals = [...document.querySelectorAll('.gv')].map(i => +i.value);
      window.closeModal();
      window.sendCommand(1102, 'InjectGenes', { genes: vals }, () => window.toast('Genes injected', 'Live strategy updated in-place.', 'ok'));
    };
  };

  window.RZ.autofillGenes = function() {
    const vals = [9, 28, 12, 58, 2.1];
    document.querySelectorAll('.gv').forEach((el, i) => el.value = vals[i] || el.value);
    window.toast('Autofilled', 'From optimization op_2b best chromosome.', 'info');
  };

  window.renderLive = renderLive;
  if (!window.RENDER) window.RENDER = {};
  window.RENDER.live = () => {
    const c = document.getElementById('content');
    if (c) renderLive(c);
  };
})();
