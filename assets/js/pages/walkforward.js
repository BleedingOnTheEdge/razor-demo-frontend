/* ============================================================
   RAZOR CLOUD — Walk-Forward Analysis Page Renderer
   Cloud-orchestrated multi-window out-of-sample validation (007-090)
   ============================================================ */
(function() {
  const t = (k, f) => window.t(k, f);
  const ic = (n, cls) => window.ic(n, cls);

  function renderWalkForward(container) {
    const runs = (window.DB.flowRuns || []).filter(r => r.kind === 'WalkForward');
    const curRun = runs[0] || {
      id: 'run-wf-01',
      name: 'XAUUSD 5-Window Anchored WFA',
      status: 'Completed',
      netProfit: 4620.10,
      totalReturn: 46.20,
      sharpe: 1.95,
      maxDrawdown: 8.2,
      wfe: 78.4,
      goldenHash: '7f9a12c8401e56b4'
    };
    const windows = window.DB.walkForwardWindows || [];

    let html = `
    <div class="page-head">
      <div>
        <h1>${t('walkForwardAnalysis', 'Walk-Forward Analysis')}</h1>
        <p>${t('walkForwardDesc', 'Sequential out-of-sample parameter robustness testing. Evaluates algorithmic overfitting across rolling and anchored historical windows (007-090).')}</p>
      </div>
      <div class="page-actions">
        <button class="btn ghost sm" onclick="RZ.openWfaInfo()">${ic('info')} ${t('wfaSpecs', 'WFA Protocol')}</button>
        <button class="btn ghost sm" onclick="RZ.exportWfaReport()">${ic('download')} ${t('exportReport', 'Export Report')}</button>
        <button class="btn primary sm" onclick="RZ.openNewWfaModal()">${ic('plus')} ${t('startWfa', 'New Walk-Forward Run')}</button>
      </div>
    </div>

    <!-- KPI Metric Cards -->
    <div class="grid g4 mb16">
      <div class="stat">
        <div class="lbl">${t('wfeRatio', 'Walk-Forward Efficiency')}</div>
        <div class="val up">${curRun.wfe ? curRun.wfe.toFixed(1) + '%' : '78.4%'}</div>
        <div class="delta up">${ic('trend')} ${t('robustGrade', 'Robust (>70%)')}</div>
        <div class="ic">${ic('scale')}</div>
      </div>
      <div class="stat">
        <div class="lbl">${t('oosSharpe', 'Out-of-Sample Sharpe')}</div>
        <div class="val">${curRun.sharpe ? curRun.sharpe.toFixed(2) : '1.95'}</div>
        <div class="delta muted">${t('vsInSample', 'vs 2.41 In-Sample')}</div>
        <div class="ic">${ic('chart')}</div>
      </div>
      <div class="stat">
        <div class="lbl">${t('oosTotalReturn', 'Out-of-Sample Return')}</div>
        <div class="val up">+${curRun.totalReturn ? curRun.totalReturn.toFixed(1) : '46.2'}%</div>
        <div class="delta muted">${window.fmtM(curRun.netProfit || 4620.10)}</div>
        <div class="ic">${ic('bolt')}</div>
      </div>
      <div class="stat">
        <div class="lbl">${t('overfittingRisk', 'Overfitting Risk')}</div>
        <div class="val up" style="font-size:20px;margin-top:10px">${t('lowRisk', 'Low / Stable')}</div>
        <div class="delta muted">${ic('check')} ${t('goldenHashVerified', 'Golden hash verified')}</div>
        <div class="ic">${ic('shield')}</div>
      </div>
    </div>

    <!-- Active Run Configuration & Canvas Comparison -->
    <div class="grid g2 mb16">
      <!-- WFA Visual Progress & Charts -->
      <div class="card">
        <div class="card-h">
          <div>
            <h3>${t('oosEquityCurve', 'Out-of-Sample Cumulative Equity')}</h3>
            <div class="sub">${curRun.name} · ${windows.length} ${t('windowsCompleted', 'windows stitched')}</div>
          </div>
          <span class="badge ok">${curRun.status}</span>
        </div>
        <div class="chart-box"><canvas id="wfa-equity-chart" style="height:210px"></canvas></div>
        <div class="flex aic jcb mt8">
          <div class="cell-mono muted" style="font-size:11px">Golden Hash: <b style="color:var(--txt)">${curRun.goldenHash || '7f9a12c8401e56b4'}</b></div>
          <button class="btn xs ghost" onclick="RZ.go('lineage')">${ic('branch')} ${t('viewLineageTree', 'Inspect Lineage')}</button>
        </div>
      </div>

      <!-- In-Sample vs Out-of-Sample Sharpe Comparison Chart -->
      <div class="card">
        <div class="card-h">
          <div>
            <h3>${t('isVsOosComparison', 'In-Sample vs Out-of-Sample Sharpe')}</h3>
            <div class="sub">${t('consistencyRatio', 'Consistency Ratio Across Windows')}</div>
          </div>
          <div class="tag-row">
            <span class="chip on" style="font-size:10px">In-Sample</span>
            <span class="chip" style="font-size:10px">Out-of-Sample</span>
          </div>
        </div>
        <div class="chart-box"><canvas id="wfa-sharpe-chart" style="height:210px"></canvas></div>
        <div class="flex aic jcb mt8">
          <span class="muted" style="font-size:11.5px">${t('anchoredWindowModel', 'Window Model: Anchored 60d Train / 20d Test')}</span>
          <span class="mono ok" style="font-size:11px;font-weight:600">Avg WFE: 78.4%</span>
        </div>
      </div>
    </div>

    <!-- Windows Breakdown Table -->
    <div class="card">
      <div class="card-h">
        <div>
          <h3>${t('windowBreakdown', 'Walk-Forward Window Breakdown')}</h3>
          <div class="sub">${t('windowBreakdownSub', 'Optimization generation winners and blind forward performance')}</div>
        </div>
        <button class="btn xs ghost" onclick="RZ.stepWfaSim()">${ic('refresh')} ${t('simulateNextWindow', 'Simulate Run')}</button>
      </div>

      <div class="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th>${t('windowIndex', 'Window')}</th>
              <th>${t('trainPeriod', 'In-Sample Period')}</th>
              <th>${t('testPeriod', 'Out-of-Sample Period')}</th>
              <th style="text-align:right">${t('isSharpe', 'IS Sharpe')}</th>
              <th style="text-align:right">${t('oosSharpe', 'OOS Sharpe')}</th>
              <th style="text-align:right">${t('wfeRatio', 'WFE (%)')}</th>
              <th style="text-align:right">${t('oosReturn', 'OOS Return')}</th>
              <th>${t('bestGeneVector', 'Winning Gene Vector')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${windows.map(w => `
              <tr>
                <td><b>#${w.windowIndex}</b></td>
                <td class="cell-mono">${w.trainPeriod}</td>
                <td class="cell-mono">${w.testPeriod}</td>
                <td class="mono" style="text-align:right">${w.inSampleSharpe.toFixed(2)}</td>
                <td class="mono up" style="text-align:right"><b>${w.outOfSampleSharpe.toFixed(2)}</b></td>
                <td class="mono up" style="text-align:right">${w.wfe.toFixed(1)}%</td>
                <td class="mono up" style="text-align:right">+${w.outOfSampleReturn.toFixed(1)}%</td>
                <td><span class="chip on" style="font-size:10px;font-family:var(--mono)">[${w.bestGenes.slice(0, 4).join(', ')}...]</span></td>
                <td class="cell-actions">
                  <button class="btn xs ghost" onclick="RZ.injectWfaGenes(${w.windowIndex})" title="${t('injectToLive', 'Inject to Live Trading')}">${ic('zap')}</button>
                  <button class="btn xs ghost" onclick="RZ.branchFromWindow(${w.windowIndex})" title="${t('branchRun', 'Branch Run')}">${ic('branch')}</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>`;

    container.innerHTML = html;

    // Render Canvas Charts
    const eqCv = document.getElementById('wfa-equity-chart');
    if (eqCv) {
      const walkData = window.walk(50, 10000, 0.008, 0.015, 77);
      window.drawArea(eqCv, walkData, '#0071e3', { baseline: 10000, money: true });
    }

    const shCv = document.getElementById('wfa-sharpe-chart');
    if (shCv) {
      const isSeries = [2.45, 2.31, 2.60, 2.15, 2.52];
      window.drawLine(shCv, isSeries, '#af52de');
    }
  }

  // Window actions
  window.RZ = window.RZ || {};

  window.RZ.openWfaInfo = function() {
    window.modal(`
      <div class="modal-h">
        <h3>${t('wfaSpecsTitle', 'Razor Walk-Forward Analysis Protocol (007-090)')}</h3>
        <button class="x" onclick="closeModal()">${ic('x')}</button>
      </div>
      <div class="modal-b">
        <p style="margin-bottom:12px;color:var(--mut)">${t('wfaSpecsP1', 'Walk-Forward Analysis is a Cloud-orchestrated sequence that tests a strategy out of sample across historical time slices instead of once. Cloud owns the sequence: authors each window timings, dispatches StartOptimization (1300), collects winning genes, and dispatches RunBacktest (1200) on unseen out-of-sample data.')}</p>
        <div class="hint mb16">
          ${ic('shield')}
          <div><b>${t('determinismMandatory', 'Determinism is Mandatory')}</b>: ${t('wfaSpecsP2', 'Every window execution emits bit-identical golden hash hashes with serialised Xorshift128+ random generator positions so every step can be branched or replayed exactly.')}</div>
        </div>
        <div class="kv"><span class="k">${t('windowMode', 'Window Mode')}</span><span class="v">Anchored & Rolling supported</span></div>
        <div class="kv"><span class="k">${t('efficiencyThreshold', 'Efficiency Threshold')}</span><span class="v">WFE &gt; 70% qualifies as Robust</span></div>
        <div class="kv"><span class="k">${t('engineCommandSequence', 'Command Pipeline')}</span><span class="v">1300 (Opt) &rarr; 1200 (Backtest OOS)</span></div>
      </div>
      <div class="modal-f">
        <button class="btn primary" onclick="closeModal()">${t('understood', 'Understood')}</button>
      </div>
    `);
  };

  window.RZ.openNewWfaModal = function() {
    window.modal(`
      <div class="modal-h">
        <h3>${t('newWfaTitle', 'Configure Walk-Forward Analysis')}</h3>
        <button class="x" onclick="closeModal()">${ic('x')}</button>
      </div>
      <div class="modal-b">
        <div class="form-grid">
          <div class="field full">
            <label>${t('strategySlot', 'Strategy Extension')}</label>
            <select id="wfa-strat">
              <option value="CfdSmtDivergenceStrategy">CfdSmtDivergenceStrategy (v1.0.0)</option>
              <option value="MomentumStrategy">MomentumStrategy (v3.1.0)</option>
              <option value="MeanReversionNN">MeanReversionNN (v1.2.0)</option>
            </select>
          </div>
          <div class="field">
            <label>${t('symbol', 'Symbol')}</label>
            <input id="wfa-sym" value="EURUSD, GBPUSD">
          </div>
          <div class="field">
            <label>${t('windowModel', 'Window Model')}</label>
            <select id="wfa-mode">
              <option value="Anchored">Anchored (Expanding Train Range)</option>
              <option value="Rolling">Rolling (Constant Window Size)</option>
            </select>
          </div>
          <div class="field">
            <label>${t('inSampleDays', 'In-Sample Window (Days)')}</label>
            <input type="number" id="wfa-is-days" value="60">
          </div>
          <div class="field">
            <label>${t('outOfSampleDays', 'Out-of-Sample Window (Days)')}</label>
            <input type="number" id="wfa-oos-days" value="20">
          </div>
          <div class="field">
            <label>${t('windowCount', 'Window Steps')}</label>
            <input type="number" id="wfa-steps" value="5" min="2" max="20">
          </div>
          <div class="field">
            <label>${t('gaPopulation', 'GA Population / Gen')}</label>
            <input id="wfa-ga" value="50 pop / 30 gen">
          </div>
        </div>
      </div>
      <div class="modal-f">
        <button class="btn ghost" onclick="closeModal()">${t('cancel')}</button>
        <button class="btn primary" onclick="RZ.startWfaExecution()">${ic('play')} ${t('dispatchWfa', 'Dispatch Cloud Sequence')}</button>
      </div>
    `, { lg: true });
  };

  window.RZ.startWfaExecution = function() {
    window.closeModal();
    window.toast(t('wfaStarted', 'Walk-Forward Dispatched'), t('wfaStartedMsg', 'Cloud orchestrator initiated Window 1/5 with StartOptimization (1300).'), 'info');
    window.ws('Command', { CommandId: 1300, Name: 'StartOptimization', Parameters: { Window: 1, Mode: 'InSample', Days: 60 } });
  };

  window.RZ.stepWfaSim = function() {
    window.toast(t('wfaStepped', 'WFA Step Simulated'), t('wfaSteppedMsg', 'Out-of-sample backtest completed for current window. Metrics updated.'), 'ok');
    renderWalkForward(document.getElementById('content'));
  };

  window.RZ.injectWfaGenes = function(winIdx) {
    const w = (window.DB.walkForwardWindows || []).find(x => x.windowIndex === winIdx);
    if (!w) return;
    window.confirm(
      t('injectGenesTitle', 'Inject Genes to Live Session (1102)'),
      `${t('injectGenesConfirm', 'Inject winning chromosome from Window')} #${winIdx} ${t('intoActiveLiveEngine', 'into active live trading engine')}?`,
      () => {
        window.ws('Command', { CommandId: 1102, Name: 'InjectGenes', Parameters: { Genes: w.bestGenes, Source: `WFA-Window-${winIdx}` } });
        window.toast(t('genesInjected', 'Genes Injected'), t('genesInjectedLive', 'Chromosome applied mid-flight to live strategy.'), 'ok');
      }
    );
  };

  window.RZ.branchFromWindow = function(winIdx) {
    window.toast(t('runBranched', 'Child Run Branched'), `${t('branchedFromWindow', 'Created child flow run diverged at WFA Window')} #${winIdx}.`, 'info');
    window.RZ.go('lineage');
  };

  window.RZ.exportWfaReport = function() {
    const json = JSON.stringify({
      report: 'Razor Walk-Forward Analysis',
      timestamp: new Date().toISOString(),
      wfeRatio: 78.4,
      windows: window.DB.walkForwardWindows || []
    }, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Razor_WFA_Report_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    window.toast(t('reportExported', 'Report Exported'), 'Razor_WFA_Report.json', 'ok');
  };

  window.renderWalkForward = renderWalkForward;
  if (!window.RENDER) window.RENDER = {};
  window.RENDER.walkforward = () => {
    const c = document.getElementById('content');
    if (c) renderWalkForward(c);
  };
})();
