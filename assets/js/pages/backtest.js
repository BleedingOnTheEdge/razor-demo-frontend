/* ============================================================
   RAZOR CLOUD — Backtesting Page Renderer
   ============================================================ */
(function() {
  const TF = ['Tick', 'M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1'];

  function renderBacktest(container) {
    const S = window.S;
    const DB = window.DB;
    const t = window.t;
    const ic = window.ic;

    let html = `<div class="page-head">
      <div>
        <h1>${t('backtest')}</h1>
        <p>Tick-only deterministic replay. Configure strategy & execution specs — Cloud pushes the full payload per run. Same inputs ⇒ bit-identical golden hash output.</p>
      </div>
      <div class="page-actions">
        <button class="btn primary" onclick="RZ.runBacktest()" ${S.bt.running ? 'disabled' : ''}>${ic('play')} ${S.bt.running ? t('running') : t('runBacktest')}</button>
      </div>
    </div>`;

    html += `<div class="grid" style="grid-template-columns:1.1fr 1fr;gap:16px">
      <div class="card">
        <div class="card-h"><h3>Configuration</h3><span class="sub">StrategySpecification + ExecutionSpecification</span></div>
        <div class="form-grid">
          <div class="field full"><label>Strategy</label><select id="bt-strat">${DB.extensions.filter(e => e.cat === 'Strategies').map(e => `<option>${e.name}</option>`).join('')}</select></div>
          <div class="field"><label>Initial balance (&gt;0)</label><input id="bt-bal" type="number" value="10000"></div>
          <div class="field"><label>Leverage (&gt;0)</label><input id="bt-lev" type="number" value="100"></div>
          <div class="field"><label>Start date</label><input id="bt-start" type="date" value="2025-01-01" class="rz-date"></div>
          <div class="field"><label>End date</label><input id="bt-end" type="date" value="2025-12-31" class="rz-date"></div>
          <div class="field"><label>Max open positions (&gt;0)</label><input id="bt-mop" type="number" value="5"></div>
          <div class="field"><label>Stop-out level (0–1]</label><input id="bt-so" type="number" step="0.05" value="0.5"></div>
          <div class="field"><label>Warmup windows (≥0)</label><input id="bt-warm" type="number" value="100"></div>
          <div class="field"><label>Latency (100ns ticks)</label><input id="bt-lat" type="number" value="0"></div>
          <div class="field"><label>Gene init seed (≥0, optional)</label><input id="bt-seed" type="number" value="42"></div>
          <div class="field"><label>Max parallel threads (0=auto)</label><input id="bt-thr" type="number" value="0"></div>
          <div class="field full">
            <label>Requested symbols &amp; timeframes</label>
            <div id="bt-symbols"></div>
            <button class="btn xs ghost mt8" onclick="RZ.addSymRow('','',[])">${ic('plus')} ${t('addSymbol')}</button>
          </div>
        </div>
        <div id="bt-err" class="login-err"></div>
      </div>
      <div>
        <div class="card mb16">
          <div class="card-h"><h3>Run Progress</h3><span class="sub" id="bt-tps">idle</span></div>
          <div class="progress"><div class="bar" id="bt-bar" style="width:0%"></div></div>
          <div class="flex jcb mt8 muted" style="font-size:11px"><span id="bt-pct">0%</span><span>tick-only · memory-mapped</span></div>
        </div>
        <div class="card">
          <div class="card-h"><h3>History</h3><span class="sub">${window.fmtN(DB.backtests.length)} runs</span></div>
          <div id="bt-history" style="max-height:300px;overflow-y:auto"></div>
        </div>
      </div>
    </div>`;

    html += `<div class="card mt16" id="bt-results-card" style="display:none">
      <div class="card-h">
        <h3 id="bt-res-title">Results</h3>
        <div class="flex gap8">
          <button class="btn xs ghost" onclick="RZ.go('reports')">${ic('file')} ${t('generateReport')}</button>
          <button class="btn xs primary" onclick="RZ.go('optimization')">${ic('dna')} ${t('optimizeStrategy')}</button>
        </div>
      </div>
      <div id="bt-results"></div>
    </div>`;

    container.innerHTML = html;

    const symWrap = document.getElementById('bt-symbols');
    if (symWrap) {
      symWrap.innerHTML = '';
      window.RZ.addSymRow('EURUSD', '', ['M1', 'H1']);
      window.RZ.addSymRow('BTCUSDT', '', ['Tick']);
    }

    renderBtHistory();
    if (window.initDatePickers) window.initDatePickers(container);

    if (S.bt.current) {
      showBtResults(S.bt.current);
    }
  }

  window.RZ = window.RZ || {};
  window.RZ.addSymRow = function(sym, _x, tfs) {
    const wrap = document.getElementById('bt-symbols');
    if (!wrap) return;
    const row = document.createElement('div');
    row.className = 'sym-row';
    row.innerHTML = `<input placeholder="e.g. EURUSD" value="${sym}">
      <div style="flex:2">
        <div class="tf-row">${TF.map(t => `<span class="tf-chip ${tfs.includes(t) ? 'on' : ''}" onclick="this.classList.toggle('on')">${t}</span>`).join('')}</div>
      </div>
      <button class="btn xs ghost" onclick="this.closest('.sym-row').remove()">${window.ic('trash')}</button>`;
    wrap.appendChild(row);
  };

  function collectBt() {
    const syms = [...document.querySelectorAll('#bt-symbols .sym-row')].map(r => {
      const s = r.querySelector('input').value.trim();
      const tfs = [...r.querySelectorAll('.tf-chip.on')].map(c => c.textContent);
      return { Symbol: s, TimeFrames: tfs };
    }).filter(s => s.Symbol);

    const seen = new Set();
    for (const s of syms) {
      if (seen.has(s.Symbol.toLowerCase())) return { err: 'Duplicate symbol: ' + s.Symbol };
      if (!s.TimeFrames.length) return { err: 'Symbol ' + s.Symbol + ' needs ≥1 timeframe' };
      seen.add(s.Symbol.toLowerCase());
    }
    if (!syms.length) return { err: 'At least one symbol required.' };

    const num = id => parseFloat(document.querySelector(id).value);
    const bal = num('#bt-bal'), lev = num('#bt-lev'), mop = num('#bt-mop'), so = num('#bt-so'), warm = num('#bt-warm'), thr = num('#bt-thr');
    const seed = document.getElementById('bt-seed').value;

    const startInput = document.getElementById('bt-start');
    const endInput = document.getElementById('bt-end');
    const start = startInput.dataset.iso || startInput.value;
    const end = endInput.dataset.iso || endInput.value;

    if (!(bal > 0)) return { err: 'InitialBalance must be > 0.' };
    if (!(lev > 0)) return { err: 'Leverage must be > 0.' };
    if (!(mop > 0)) return { err: 'MaxOpenPositions must be > 0.' };
    if (!(so > 0 && so <= 1)) return { err: 'StopOutLevel must be in (0, 1].' };
    if (warm < 0) return { err: 'WarmupWindowCount must be ≥ 0.' };
    if (thr < 0) return { err: 'MaxParallelThreads must be ≥ 0.' };
    if (seed !== '' && +seed < 0) return { err: 'GeneInitializationSeed must be ≥ 0.' };
    if (!start || !end || new Date(end) <= new Date(start)) return { err: 'EndDate must be > StartDate.' };

    if (window.S.role === 'developer') {
      const min = new Date('2026-04-21');
      if (new Date(start) < min) return { err: 'Dev tier: history limited to a 3-month rolling window.' };
    }

    return {
      ok: true,
      payload: {
        InitialBalance: bal,
        Leverage: lev,
        RequestedSymbols: syms,
        StartDate: start,
        EndDate: end,
        MaxOpenPositions: mop,
        StopOutLevel: so,
        WarmupWindowCount: warm,
        LatencyTicks: num('#bt-lat') || 0,
        MaxParallelThreads: thr,
        GeneInitializationSeed: seed === '' ? null : +seed
      }
    };
  }

  window.RZ.runBacktest = function() {
    if (window.S.bt.running) return;
    const c = collectBt();
    const errEl = document.getElementById('bt-err');
    if (c.err) {
      if (errEl) errEl.textContent = c.err;
      window.toast('Validation failed', c.err, 'err');
      return;
    }
    if (errEl) errEl.textContent = '';

    window.S.bt.running = true;
    window.S.bt.progress = 0;
    const bar = document.getElementById('bt-bar');
    const pct = document.getElementById('bt-pct');
    const tps = document.getElementById('bt-tps');
    if (bar) bar.style.width = '0%';
    if (pct) pct.textContent = '0%';

    const id = window.uid();
    const stratName = document.getElementById('bt-strat').value;
    const run = {
      id,
      name: stratName + ' · ' + c.payload.RequestedSymbols.map(s => s.Symbol).join('+'),
      status: 'running',
      date: Date.now(),
      seed: c.payload.GeneInitializationSeed || 0,
      metrics: null,
      series: null
    };

    window.DB.backtests.unshift(run);
    window.saveDB();
    renderBtHistory();

    window.sendCommand(1200, 'RunBacktest', c.payload, () => {}, 400);

    window.S.bt.timer = window.every(180, () => {
      window.S.bt.progress += Math.random() * 7 + 2;
      if (tps) tps.textContent = window.fmtN(Math.floor(80000 + Math.random() * 40000)) + ' ticks/s';

      if (window.S.bt.progress >= 100) {
        window.S.bt.progress = 100;
        clearInterval(window.S.bt.timer);
        window.S.bt.running = false;

        const seed = run.seed || 7;
        const quality = (seed % 5) / 10;
        const series = window.walk(120, c.payload.InitialBalance, 0.004 + quality * 0.01, 0.02, seed + 1);
        const net = series[series.length - 1] - c.payload.InitialBalance;
        const ret = net / c.payload.InitialBalance * 100;

        const r2 = window.mulberry32(seed + 9);
        let peak = c.payload.InitialBalance, dd = 0;
        series.forEach(v => {
          peak = Math.max(peak, v);
          dd = Math.max(dd, (peak - v) / peak * 100);
        });

        const trades = 80 + Math.floor(r2() * 500);
        const win = 40 + r2() * 25;
        const pf = 1 + r2() * 1.4;
        const sharpe = (ret > 0 ? 1 : -0.4) * (0.8 + r2() * 1.6);

        run.metrics = {
          net: +net.toFixed(2),
          ret: +ret.toFixed(2),
          dd: +dd.toFixed(2),
          sharpe: +sharpe.toFixed(2),
          sortino: +(sharpe * 1.3).toFixed(2),
          pf: +pf.toFixed(2),
          trades,
          win: +win.toFixed(1)
        };
        run.series = series;
        run.status = 'completed';
        window.S.bt.current = run;
        window.saveDB();

        if (tps) tps.textContent = 'completed';
        if (pct) pct.textContent = '100%';

        window.ws('Event', { Type: 'BacktestCompleted', NetProfit: run.metrics.net, Sharpe: run.metrics.sharpe, MaxDrawdown: run.metrics.dd, Trades: trades });
        window.toast('Backtest completed', 'Sharpe ' + run.metrics.sharpe + ' · ' + window.fmtP(run.metrics.ret), 'ok');

        renderBtHistory();
        showBtResults(run);
      } else {
        if (bar) bar.style.width = window.S.bt.progress + '%';
        if (pct) pct.textContent = Math.floor(window.S.bt.progress) + '%';
      }
    });
  };

  function renderBtHistory() {
    const el = document.getElementById('bt-history');
    if (!el) return;
    el.innerHTML = window.DB.backtests.map(b => `<div class="kv" style="cursor:pointer;align-items:center" onclick="RZ.viewBacktest('${b.id}')">
      <div>
        <div style="font-weight:600">${b.name}</div>
        <div class="muted" style="font-size:11px">${window.ago(b.date)} · seed ${b.seed}</div>
      </div>
      ${b.status === 'running'
        ? '<span class="badge info"><span class="dot pulse"></span>running</span>'
        : (b.metrics ? `<span class="badge ${b.metrics.net >= 0 ? 'ok' : 'err'}">${window.fmtP(b.metrics.ret)}</span>` : '')}
    </div>`).join('');
  }

  window.RZ.viewBacktest = function(id) {
    const b = window.DB.backtests.find(x => x.id === id);
    if (b && b.metrics) {
      window.S.bt.current = b;
      showBtResults(b);
      const card = document.getElementById('bt-results-card');
      if (card) card.scrollIntoView({ behavior: 'smooth' });
    }
  };

  function genTrades(seed, n) {
    const r = window.mulberry32(seed + 3);
    const syms = ['EURUSD', 'GBPUSD', 'BTCUSDT', 'XAUUSD', 'USDJPY'];
    const o = [];
    for (let i = 0; i < Math.min(n, 40); i++) {
      o.push({
        s: syms[Math.floor(r() * syms.length)],
        side: r() > 0.5 ? 'BUY' : 'SELL',
        pnl: +((r() - 0.42) * 220).toFixed(2)
      });
    }
    return o;
  }

  function showBtResults(b) {
    const card = document.getElementById('bt-results-card');
    const title = document.getElementById('bt-res-title');
    const resBox = document.getElementById('bt-results');
    if (!card || !resBox) return;

    card.style.display = 'block';
    if (title) title.textContent = 'Results · ' + b.name;

    const m = b.metrics;
    const t = window.t;

    resBox.innerHTML = `<div class="grid g4 mb16">
      <div class="stat"><div class="lbl">${t('netProfit')}</div><div class="val ${m.net >= 0 ? 'up' : 'down'}">${window.fmtM(m.net)}</div></div>
      <div class="stat"><div class="lbl">${t('return')}</div><div class="val ${m.ret >= 0 ? 'up' : 'down'}">${window.fmtP(m.ret)}</div></div>
      <div class="stat"><div class="lbl">${t('maxDrawdown')}</div><div class="val down">${window.fmtP(m.dd)}</div></div>
      <div class="stat"><div class="lbl">${t('sharpeSortino')}</div><div class="val">${m.sharpe} <span style="font-size:14px;color:var(--mut)">/ ${m.sortino}</span></div></div>
      <div class="stat"><div class="lbl">${t('profitFactor')}</div><div class="val">${m.pf}</div></div>
      <div class="stat"><div class="lbl">${t('totalTrades')}</div><div class="val">${window.fmtN(m.trades)}</div></div>
      <div class="stat"><div class="lbl">${t('winRate')}</div><div class="val">${window.fmtP(m.win)}</div></div>
      <div class="stat"><div class="lbl">${t('determinism')}</div><div class="val up" style="font-size:15px">✓ golden-hash verified</div></div>
    </div>
    <div class="grid g2">
      <div class="chart-box"><canvas id="bt-eq" style="height:220px"></canvas></div>
      <div class="card flat">
        <div class="card-h"><h3>Trade sample</h3></div>
        <div class="tbl-wrap" style="max-height:220px;overflow-y:auto">
          <table>
            <thead><tr><th>#</th><th>${t('symbol')}</th><th>Side</th><th>${t('pnl')}</th></tr></thead>
            <tbody>${genTrades(b.seed, m.trades).slice(0, 14).map((tr, i) => `<tr>
              <td class="mono">${i + 1}</td>
              <td>${tr.s}</td>
              <td><span class="badge ${tr.side === 'BUY' ? 'ok' : 'err'}">${tr.side}</span></td>
              <td class="mono ${tr.pnl >= 0 ? 'up' : 'down'}">${window.fmtM(tr.pnl)}</td>
            </tr>`).join('')}</tbody>
          </table>
        </div>
      </div>
    </div>`;

    const cv = document.getElementById('bt-eq');
    if (cv && b.series) {
      window.drawArea(cv, b.series, '#0071e3', { baseline: b.series[0], money: true });
    }
  }

  window.renderBacktest = renderBacktest;
  if (!window.RENDER) window.RENDER = {};
  window.RENDER.backtest = () => {
    const c = document.getElementById('content');
    if (c) renderBacktest(c);
  };
})();
