/* ============================================================
   RAZOR CLOUD — Run Lineage, Provenance & Interventions (003-040)
   Tracks run genealogy, DAG branching, interventions and coverage gaps
   ============================================================ */
(function() {
  const t = (k, f) => window.t(k, f);
  const ic = (n, cls) => window.ic(n, cls);

  let selectedRunId = 'run-bt-02';

  function renderLineage(container) {
    const runs = window.DB.flowRuns || [];
    const selRun = runs.find(r => r.id === selectedRunId) || runs[0] || {};

    let html = `
    <div class="page-head">
      <div>
        <h1>${t('runLineageTitle', 'Run Lineage & Provenance')}</h1>
        <p>${t('runLineageDesc', 'Cryptographic provenance and DAG reproduction tree. Tracks branched runs, mid-flight interventions, and coverage gaps per architectural ruling 003-040.')}</p>
      </div>
      <div class="page-actions">
        <button class="btn ghost sm" onclick="RZ.openGapModal()">${ic('alert')} ${t('recordCoverageGap', 'Record Coverage Gap')}</button>
        <button class="btn ghost sm" onclick="RZ.replayRun('${selRun.id}')">${ic('refresh')} ${t('replayRun', 'Deterministic Replay')}</button>
        <button class="btn primary sm" onclick="RZ.openBranchModal('${selRun.id}')">${ic('branch')} ${t('branchRun', 'Branch from Fork Point')}</button>
      </div>
    </div>

    <!-- Summary Stats -->
    <div class="grid g4 mb16">
      <div class="stat">
        <div class="lbl">${t('totalTrackedRuns', 'Tracked Flow Runs')}</div>
        <div class="val">${runs.length}</div>
        <div class="delta muted">${ic('check')} ${t('provenanceIndexed', 'Full DAG Indexed')}</div>
        <div class="ic">${ic('layers')}</div>
      </div>
      <div class="stat">
        <div class="lbl">${t('branchedDescendants', 'Diverged / Branched')}</div>
        <div class="val up">${runs.filter(r => r.relation === 'Branched').length}</div>
        <div class="delta up">${ic('branch')} ${t('relationAxis', 'Relation: Branched/Spliced')}</div>
        <div class="ic">${ic('branch')}</div>
      </div>
      <div class="stat">
        <div class="lbl">${t('gappedRuns', 'Gapped Runs')}</div>
        <div class="val warn">${runs.filter(r => r.continuity === 'Gapped').length}</div>
        <div class="delta warn">${t('suppressedFlag', 'Headline figures flagged')}</div>
        <div class="ic">${ic('alert')}</div>
      </div>
      <div class="stat">
        <div class="lbl">${t('topSharpeRun', 'Leaderboard Best Sharpe')}</div>
        <div class="val up">2.38</div>
        <div class="delta muted">run-bt-02 (${t('branched', 'Branched')})</div>
        <div class="ic">${ic('award')}</div>
      </div>
    </div>

    <!-- DAG Genealogy Tree & Run Inspector -->
    <div class="grid g2 mb16">
      <!-- Interactive Lineage DAG Visualizer -->
      <div class="card">
        <div class="card-h">
          <div>
            <h3>${t('lineageDagTree', 'Lineage DAG (Provenance Graph)')}</h3>
            <div class="sub">${t('lineageDagSub', 'Click a node to inspect parameters, interventions, and gaps')}</div>
          </div>
          <span class="badge info">${t('auditVerified', '003-040 Verified')}</span>
        </div>

        <div style="display:flex;flex-direction:column;gap:10px;padding:10px 0">
          ${runs.map(r => {
            const isSel = r.id === selRun.id;
            const isGapped = r.continuity === 'Gapped';
            const isBranched = r.relation === 'Branched';
            const isSpliced = r.relation === 'Spliced';

            return `
            <div class="eng-card ${isSel ? 'sel' : ''}" style="cursor:pointer;border-color:${isSel ? 'var(--acc)' : 'var(--line)'};padding:12px 14px;background:${isSel ? 'rgba(0,113,227,0.03)' : '#ffffff'}" onclick="RZ.selectLineageRun('${r.id}')">
              <div class="flex aic jcb">
                <div class="flex aic gap8">
                  <div style="color:${isGapped ? 'var(--warn)' : (isBranched ? 'var(--vio)' : 'var(--acc)')}">${ic(isBranched ? 'branch' : (isGapped ? 'alert' : 'commit'))}</div>
                  <div>
                    <div style="font-weight:600;font-size:13px">${r.name}</div>
                    <div class="cell-mono muted" style="font-size:10px">${r.id} ${r.parentRunId ? `&larr; parent: ${r.parentRunId}` : '(Root)'}</div>
                  </div>
                </div>
                <div class="flex aic gap8">
                  <span class="badge ${r.status === 'Completed' ? 'ok' : (r.status === 'Running' ? 'info' : 'warn')}">${r.status}</span>
                  <span class="chip on" style="font-size:10px">${r.kind}</span>
                </div>
              </div>

              <div class="flex aic jcb mt8" style="font-size:11.5px">
                <div class="flex aic gap8">
                  <span class="muted">${t('relation', 'Relation')}: <b>${r.relation || t('originalRoot', 'Original Root')}</b></span>
                  <span class="muted">${t('continuity', 'Continuity')}: <b class="${isGapped ? 'warn' : 'up'}">${r.continuity || 'Contiguous'}</b></span>
                </div>
                <div class="mono ${r.netProfit >= 0 ? 'up' : 'down'}"><b>${window.fmtM(r.netProfit)}</b> (Sharpe: ${r.sharpe ? r.sharpe.toFixed(2) : '—'})</div>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>

      <!-- Selected Run Deep Inspector -->
      <div class="card">
        <div class="card-h">
          <div>
            <h3>${t('runInspector', 'Run Inspector & Interventions')}</h3>
            <div class="sub">${selRun.name} (${selRun.id})</div>
          </div>
          <span class="badge ${selRun.continuity === 'Gapped' ? 'warn' : 'ok'}">${selRun.continuity || 'Contiguous'}</span>
        </div>

        ${selRun.headlineFiguresSuppressed ? `
          <div class="bcast warning mb16">
            ${ic('alert')}
            <div>
              <b>${t('headlineSuppressed', 'Headline Figures Flagged / Partial')}</b>:
              ${t('suppressedReason', 'Per architectural decision 003-040, runs with recorded coverage gaps or broker drops are flagged so unverified numbers never masquerade as whole.')}
              <div class="cell-mono mt8" style="font-size:11px">${selRun.divergenceFlag || 'Coverage gap detected'}</div>
            </div>
          </div>
        ` : ''}

        <div class="kv"><span class="k">${t('runKind', 'Run Kind')}</span><span class="v">${selRun.kind}</span></div>
        <div class="kv"><span class="k">${t('goldenHash', 'Deterministic Golden Hash')}</span><span class="v mono">${selRun.goldenHash || '9a7fbc2041d8e12a'}</span></div>
        <div class="kv"><span class="k">${t('parentRun', 'Parent Origin')}</span><span class="v mono">${selRun.parentRunId || t('noneRoot', 'None (Original Lineage Root)')}</span></div>
        <div class="kv"><span class="k">${t('forkPointStep', 'Fork Point Step')}</span><span class="v">${selRun.forkPointStep ? `#${selRun.forkPointStep}` : '—'}</span></div>
        <div class="kv"><span class="k">${t('baseMasterSeed', 'Base Master Seed')}</span><span class="v mono">${selRun.baseSeed || '42 (Xorshift128+)'}</span></div>

        <!-- Interventions & Gaps Tabs -->
        <div class="tabs mt16">
          <div class="tab active" id="tab-iv" onclick="RZ.switchLineageTab('iv')">${t('interventions', 'Interventions')} (${(selRun.interventions || []).length})</div>
          <div class="tab" id="tab-gp" onclick="RZ.switchLineageTab('gp')">${t('coverageGaps', 'Recorded Gaps')} (${(selRun.gaps || []).length})</div>
        </div>

        <div id="panel-iv" class="tab-panel active">
          ${(selRun.interventions && selRun.interventions.length) ? selRun.interventions.map(iv => `
            <div class="hint mb16" style="background:#fafafc">
              ${ic('branch')}
              <div style="flex:1">
                <div class="flex aic jcb">
                  <b>Step #${iv.step}: ${iv.reason}</b>
                  <span class="cell-mono muted">${iv.actor}</span>
                </div>
                <div class="muted mt8" style="font-size:11px">${iv.modificationsSummary || 'Parameters injected mid-flight'}</div>
                <div class="cell-mono mt8" style="font-size:10px;color:var(--mut2)">Fingerprint: ${iv.previousFingerprint} &rarr; ${iv.newFingerprint}</div>
              </div>
            </div>
          `).join('') : `<div class="empty" style="padding:20px">${t('noInterventions', 'No mid-flight interventions recorded. Run is unbroken.')}</div>`}
        </div>

        <div id="panel-gp" class="tab-panel">
          ${(selRun.gaps && selRun.gaps.length) ? selRun.gaps.map(gp => `
            <div class="hint warn mb16">
              ${ic('alert')}
              <div style="flex:1">
                <div class="flex aic jcb">
                  <b>Steps #${gp.startStep} &ndash; #${gp.endStep}: ${gp.reason}</b>
                  <span class="badge warn" style="font-size:9.5px">${gp.replayed ? 'Replayed' : 'Unreplayed'}</span>
                </div>
                <div class="muted mt8" style="font-size:11px">${t('missingTicks', 'Missing tick count')}: <b>${gp.missingTicks || 1420}</b></div>
                <div class="mt8"><button class="btn xs ghost" onclick="RZ.replayGap('${gp.id}')">${ic('refresh')} ${t('reconcileGap', 'Reconcile Gap')}</button></div>
              </div>
            </div>
          `).join('') : `<div class="empty" style="padding:20px">${t('noGapsRecorded', 'No coverage or execution gaps detected.')}</div>`}
        </div>

        <div class="flex aic jcb mt16" style="padding-top:12px;border-top:1px solid var(--line)">
          <button class="btn sm ghost" onclick="RZ.exportLineageJson('${selRun.id}')">${ic('download')} ${t('exportLineageJson', 'Export Provenance JSON')}</button>
          <button class="btn sm primary" onclick="RZ.openBranchModal('${selRun.id}')">${ic('branch')} ${t('branchFromRun', 'Branch New Run')}</button>
        </div>
      </div>
    </div>

    <!-- Fleet-wide Run Rankings Leaderboard (GetRunRankingEndpoint) -->
    <div class="card">
      <div class="card-h">
        <div>
          <h3>${t('runRankingsTitle', 'Fleet Run Rankings & Performance Leaderboard')}</h3>
          <div class="sub">${t('runRankingsSub', 'Multi-factor ranking with Sharpe ratio, Sortino, and provenance verification')}</div>
        </div>
        <div class="tag-row">
          <span class="chip on">All Runs (${runs.length})</span>
          <span class="chip">Backtests</span>
          <span class="chip">Optimizations</span>
          <span class="chip">Walk-Forward</span>
        </div>
      </div>

      <div class="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th>${t('runName', 'Run Specification')}</th>
              <th>${t('kind', 'Kind')}</th>
              <th>${t('relationAxis', 'Relation')}</th>
              <th>${t('continuityAxis', 'Continuity')}</th>
              <th style="text-align:right">${t('netProfit', 'Net Profit')}</th>
              <th style="text-align:right">${t('sharpe', 'Sharpe')}</th>
              <th style="text-align:right">${t('sortino', 'Sortino')}</th>
              <th style="text-align:right">${t('profitFactor', 'PF')}</th>
              <th style="text-align:right">${t('drawdown', 'Max DD')}</th>
              <th style="text-align:right">${t('trades', 'Trades')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${runs.map(r => `
              <tr style="cursor:pointer;background:${r.id === selRun.id ? 'rgba(0,113,227,0.03)' : 'transparent'}" onclick="RZ.selectLineageRun('${r.id}')">
                <td>
                  <div style="font-weight:600">${r.name}</div>
                  <div class="cell-mono" style="font-size:10px">${r.id} · Hash: ${r.goldenHash ? r.goldenHash.slice(0, 8) : '—'}</div>
                </td>
                <td><span class="chip on" style="font-size:10px">${r.kind}</span></td>
                <td><span class="badge ${r.relation === 'Branched' ? 'vio' : 'muted'}">${r.relation || 'Root'}</span></td>
                <td><span class="badge ${r.continuity === 'Gapped' ? 'warn' : 'ok'}">${r.continuity || 'Contiguous'}</span></td>
                <td class="mono ${r.netProfit >= 0 ? 'up' : 'down'}" style="text-align:right"><b>${window.fmtM(r.netProfit)}</b></td>
                <td class="mono up" style="text-align:right"><b>${r.sharpe ? r.sharpe.toFixed(2) : '—'}</b></td>
                <td class="mono" style="text-align:right">${r.sortino ? r.sortino.toFixed(2) : '—'}</td>
                <td class="mono" style="text-align:right">${r.pf ? r.pf.toFixed(2) : '—'}</td>
                <td class="mono down" style="text-align:right">-${r.maxDrawdown ? r.maxDrawdown.toFixed(1) : '—'}%</td>
                <td class="mono" style="text-align:right">${r.tradeCount || '—'}</td>
                <td class="cell-actions">
                  <button class="btn xs ghost" onclick="event.stopPropagation();RZ.replayRun('${r.id}')" title="${t('replayRun', 'Replay Run')}">${ic('refresh')}</button>
                  <button class="btn xs ghost" onclick="event.stopPropagation();RZ.openBranchModal('${r.id}')" title="${t('branchRun', 'Branch Run')}">${ic('branch')}</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>`;

    container.innerHTML = html;
  }

  window.RZ = window.RZ || {};

  window.RZ.selectLineageRun = function(id) {
    selectedRunId = id;
    renderLineage(document.getElementById('content'));
  };

  window.RZ.switchLineageTab = function(tab) {
    const tabIv = document.getElementById('tab-iv');
    const tabGp = document.getElementById('tab-gp');
    const panIv = document.getElementById('panel-iv');
    const panGp = document.getElementById('panel-gp');

    if (tab === 'iv') {
      if (tabIv) tabIv.classList.add('active');
      if (tabGp) tabGp.classList.remove('active');
      if (panIv) panIv.classList.add('active');
      if (panGp) panGp.classList.remove('active');
    } else {
      if (tabIv) tabIv.classList.remove('active');
      if (tabGp) tabGp.classList.add('active');
      if (panIv) panIv.classList.remove('active');
      if (panGp) panGp.classList.add('active');
    }
  };

  window.RZ.openBranchModal = function(baseRunId) {
    const runs = window.DB.flowRuns || [];
    const r = runs.find(x => x.id === baseRunId) || runs[0];

    window.modal(`
      <div class="modal-h">
        <h3>${t('branchRunTitle', 'Branch Flow Run (003-040)')}</h3>
        <button class="x" onclick="closeModal()">${ic('x')}</button>
      </div>
      <div class="modal-b">
        <p style="color:var(--mut);margin-bottom:14px">${t('branchRunDesc', 'Derives a new child flow run from the recorded parent state without invalidating the parent timeline.')}</p>
        <div class="form-grid">
          <div class="field full">
            <label>${t('parentOriginRun', 'Parent Origin Run')}</label>
            <input value="${r.name} (${r.id})" disabled style="background:var(--bg2)">
          </div>
          <div class="field">
            <label>${t('relationAxis', 'Relation Axis')}</label>
            <select id="br-relation">
              <option value="Branched">Branched (Starts afresh from point in past)</option>
              <option value="Appended">Appended (Continues without change)</option>
              <option value="Spliced">Spliced (Replaces suffix from fork point)</option>
            </select>
          </div>
          <div class="field">
            <label>${t('forkPointStep', 'Fork Point Step / Gen')}</label>
            <input type="number" id="br-step" value="150">
          </div>
          <div class="field full">
            <label>${t('interventionReason', 'Mandatory Business Rationale / Reason')}</label>
            <input id="br-reason" placeholder="e.g. Adjusted stoploss cushion for high volatility regime">
          </div>
          <div class="field full">
            <label>${t('paramOverrides', 'Parameter Overrides (JSON)')}</label>
            <textarea id="br-params" rows="3" style="font-family:var(--mono);font-size:11px">{\n  "DivergenceThreshold": 0.00015,\n  "RiskPercent": 0.0025\n}</textarea>
          </div>
        </div>
      </div>
      <div class="modal-f">
        <button class="btn ghost" onclick="closeModal()">${t('cancel')}</button>
        <button class="btn primary" onclick="RZ.submitBranchRun('${r.id}')">${ic('branch')} ${t('createChildRun', 'Create Child Run')}</button>
      </div>
    `, { lg: true });
  };

  window.RZ.submitBranchRun = function(parentId) {
    const reason = (document.getElementById('br-reason') || {}).value || 'Operator parameter tuning';
    const relation = (document.getElementById('br-relation') || {}).value || 'Branched';
    const step = parseInt((document.getElementById('br-step') || {}).value || '150', 10);

    const newId = 'run-bt-' + Math.random().toString(36).slice(2, 6);
    const newRun = {
      id: newId,
      name: `Child Branch of ${parentId} @ #${step}`,
      kind: 'Backtest',
      status: 'Completed',
      parentRunId: parentId,
      relation,
      continuity: 'Contiguous',
      forkPointStep: step,
      baseSeed: 42,
      netProfit: 1980.50,
      totalReturn: 19.8,
      sharpe: 2.25,
      sortino: 2.95,
      pf: 1.95,
      maxDrawdown: 5.8,
      tradeCount: 325,
      winRate: 60.1,
      isPartial: false,
      headlineFiguresSuppressed: false,
      goldenHash: Math.random().toString(16).slice(2, 18),
      createdAt: Date.now(),
      interventions: [{ id: 'iv_' + Date.now(), step, actor: window.S.user.name, reason, previousFingerprint: 'FP-OLD', newFingerprint: 'FP-NEW' }],
      gaps: []
    };

    window.DB.flowRuns.unshift(newRun);
    window.saveDB();
    window.closeModal();
    selectedRunId = newId;
    window.toast(t('childRunCreated', 'Child Run Created'), `${newRun.name} added to Lineage DAG.`, 'ok');
    renderLineage(document.getElementById('content'));
  };

  window.RZ.replayRun = function(id) {
    window.toast(t('replayStarted', 'Deterministic Replay Dispatched'), `Re-running ${id} against portable RNG Xorshift128+ seed position.`, 'info');
    window.ws('Command', { CommandId: 1200, Name: 'RunBacktest', Parameters: { ReplayMode: true, TargetRunId: id } });
  };

  window.RZ.openGapModal = function() {
    window.modal(`
      <div class="modal-h">
        <h3>${t('recordCoverageGap', 'Record Coverage or Execution Gap')}</h3>
        <button class="x" onclick="closeModal()">${ic('x')}</button>
      </div>
      <div class="modal-b">
        <p style="color:var(--mut);margin-bottom:14px">${t('gapNotice', 'Records an offline period or feed drop so subsequent analytics mark aggregates as partial per 003-040.')}</p>
        <div class="form-grid">
          <div class="field">
            <label>${t('startStep', 'Start Step / Timestamp')}</label>
            <input id="gap-start" value="120">
          </div>
          <div class="field">
            <label>${t('endStep', 'End Step / Timestamp')}</label>
            <input id="gap-end" value="145">
          </div>
          <div class="field full">
            <label>${t('gapReason', 'Disconnection / Outage Reason')}</label>
            <input id="gap-reason" value="Primary broker connectivity timeout; failover in progress">
          </div>
        </div>
      </div>
      <div class="modal-f">
        <button class="btn ghost" onclick="closeModal()">${t('cancel')}</button>
        <button class="btn warn" onclick="RZ.submitGap()">${ic('alert')} ${t('flagGap', 'Flag Run as Gapped')}</button>
      </div>
    `);
  };

  window.RZ.submitGap = function() {
    const sel = (window.DB.flowRuns || []).find(r => r.id === selectedRunId);
    if (sel) {
      sel.continuity = 'Gapped';
      sel.headlineFiguresSuppressed = true;
      sel.isPartial = true;
      sel.divergenceFlag = 'Gapped: Feed drop reported';
      sel.gaps.push({
        id: 'gap_' + Date.now(),
        startStep: 120,
        endStep: 145,
        reason: (document.getElementById('gap-reason') || {}).value || 'Manual gap reported',
        missingTicks: 850,
        replayed: false
      });
      window.saveDB();
      window.closeModal();
      window.toast(t('gapRecorded', 'Coverage Gap Recorded'), `${sel.id} marked as Gapped. Headline figures suppressed.`, 'warn');
      renderLineage(document.getElementById('content'));
    }
  };

  window.RZ.replayGap = function(gapId) {
    window.toast(t('gapReconciled', 'Gap Reconciled'), 'Historical tick synthesis filled missing 1,420 ticks. Run marked clean.', 'ok');
    const sel = (window.DB.flowRuns || []).find(r => r.id === selectedRunId);
    if (sel) {
      const g = sel.gaps.find(x => x.id === gapId);
      if (g) g.replayed = true;
      if (sel.gaps.every(x => x.replayed)) {
        sel.continuity = 'Contiguous';
        sel.headlineFiguresSuppressed = false;
        sel.isPartial = false;
        sel.divergenceFlag = null;
      }
      window.saveDB();
      renderLineage(document.getElementById('content'));
    }
  };

  window.RZ.exportLineageJson = function(id) {
    const sel = (window.DB.flowRuns || []).find(r => r.id === id);
    const json = JSON.stringify(sel, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Provenance_${id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    window.toast(t('lineageExported', 'Provenance JSON Exported'), `Provenance_${id}.json`, 'ok');
  };

  window.renderLineage = renderLineage;
  if (!window.RENDER) window.RENDER = {};
  window.RENDER.lineage = () => {
    const c = document.getElementById('content');
    if (c) renderLineage(c);
  };
})();
