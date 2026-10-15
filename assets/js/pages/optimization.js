/* ============================================================
   RAZOR CLOUD — Optimization Page Renderer
   ============================================================ */
(function() {
  function renderOpt(container) {
    const S = window.S;
    const DB = window.DB;
    const t = window.t;
    const ic = window.ic;

    let html = `<div class="page-head">
      <div>
        <h1>${t('optimization')}</h1>
        <p>Steppable GA with portable RNG (xorshift128+). Fitness evaluated via hook. Master seed guarantees reproducibility.</p>
      </div>
      <div class="page-actions">
        ${S.opt.running
          ? `<button class="btn ghost" onclick="RZ.pauseOpt()">${ic(S.opt.paused ? 'play' : 'pause')} ${S.opt.paused ? t('resume') : t('pause')}</button>
             <button class="btn danger" onclick="RZ.cancelOpt()">${ic('x')} ${t('cancel')}</button>`
          : `<button class="btn primary" onclick="RZ.startOpt()">${ic('play')} ${t('startOptimization')}</button>`}
      </div>
    </div>`;

    html += `<div class="grid" style="grid-template-columns:1fr 1.3fr;gap:16px">
      <div class="card">
        <div class="card-h"><h3>OptimizationSpecification</h3></div>
        <div class="form-grid">
          <div class="field"><label>Master seed (≥0)</label><input id="op-seed" type="number" value="42"></div>
          <div class="field"><label>Generations (&gt;0)</label><input id="op-gen" type="number" value="50"></div>
          <div class="field"><label>Population (≥4)</label><input id="op-pop" type="number" value="100"></div>
          <div class="field"><label>Tournament size (≥2)</label><input id="op-tour" type="number" value="3"></div>
          <div class="field"><label>Mutation rate [0,1]</label><input id="op-mut" type="number" step="0.01" value="0.1"></div>
          <div class="field"><label>Crossover rate [0,1]</label><input id="op-cx" type="number" step="0.01" value="0.5"></div>
          <div class="field"><label>Elitism [0,1]</label><input id="op-el" type="number" step="0.01" value="0.05"></div>
          <div class="field"><label>Stagnation → hyper</label><input id="op-stag" type="number" value="3"></div>
        </div>
      </div>
      <div>
        <div class="card mb16">
          <div class="card-h">
            <h3>Evolution</h3>
            <span class="flex aic gap8">
              <span class="badge ${S.opt.hyper ? 'warn' : 'muted'}" id="op-hyper">${S.opt.hyper ? '⚡ Hyper-mutation' : 'normal'}</span>
              <span class="sub" id="op-genlbl">gen ${S.opt.gen} / ${S.opt.total}</span>
            </span>
          </div>
          <div class="progress mb16"><div class="bar" id="op-bar" style="width:${(S.opt.gen / (S.opt.total || 1)) * 100}%"></div></div>
          <div class="grid g3 mb16">
            <div class="stat"><div class="lbl">${t('bestFitness')}</div><div class="val vio" id="op-best">${S.opt.best > -Infinity ? S.opt.best.toFixed(3) : '—'}</div></div>
            <div class="stat"><div class="lbl">${t('population')}</div><div class="val" id="op-popv">${S.opt.pop || 100}</div></div>
            <div class="stat"><div class="lbl">${t('status')}</div><div class="val" style="font-size:15px" id="op-stat">${S.opt.running ? 'evolving' : 'idle'}</div></div>
          </div>
          <div class="chart-box"><canvas id="op-fitness" style="height:170px"></canvas></div>
        </div>
        <div class="card">
          <div class="card-h"><h3>History</h3></div>
          <div id="op-history"></div>
        </div>
      </div>
    </div>`;

    html += `<div class="card mt16" id="op-res-card" style="display:none">
      <div class="card-h">
        <h3>Best Chromosome</h3>
        <button class="btn primary sm" onclick="RZ.injectBestGenes()">${ic('zap')} Inject to live (1102)</button>
      </div>
      <div id="op-res"></div>
    </div>`;

    container.innerHTML = html;
    renderOpHistory();

    const cv = document.getElementById('op-fitness');
    if (cv && S.opt.fitness && S.opt.fitness.length > 1) {
      window.drawLine(cv, S.opt.fitness, '#af52de');
    }
  }

  window.RZ = window.RZ || {};
  window.RZ.startOpt = function() {
    if (window.S.opt.running) return;

    const seed = +document.getElementById('op-seed').value;
    const gen = +document.getElementById('op-gen').value;
    const pop = +document.getElementById('op-pop').value;
    const tour = +document.getElementById('op-tour').value;
    const mut = +document.getElementById('op-mut').value;
    const cx = +document.getElementById('op-cx').value;
    const el = +document.getElementById('op-el').value;
    const stag = +document.getElementById('op-stag').value;

    if (seed < 0) { window.toast('Validation failed', 'MasterSeed must be ≥ 0.', 'err'); return; }
    if (!(gen > 0)) { window.toast('Validation failed', 'Generations must be > 0.', 'err'); return; }
    if (!(pop >= 4)) { window.toast('Validation failed', 'PopulationSize must be ≥ 4.', 'err'); return; }
    if (!(tour >= 2)) { window.toast('Validation failed', 'TournamentSize must be ≥ 2.', 'err'); return; }
    if (mut < 0 || mut > 1 || cx < 0 || cx > 1 || el < 0 || el > 1) { window.toast('Validation failed', 'Rates must be within [0,1].', 'err'); return; }
    if (!(stag >= 1)) { window.toast('Validation failed', 'StagnationGenerationsBeforeHyper must be ≥ 1.', 'err'); return; }

    window.S.opt = {
      running: true,
      paused: false,
      gen: 0,
      total: gen,
      pop,
      best: -Infinity,
      fitness: [],
      timer: null,
      hyper: false,
      stagn: 0,
      lastBest: -Infinity,
      seed
    };

    const popv = document.getElementById('op-popv');
    const stat = document.getElementById('op-stat');
    if (popv) popv.textContent = pop;
    if (stat) stat.textContent = 'evolving';

    window.sendCommand(1300, 'StartOptimization', { masterSeed: seed, generations: gen, populationSize: pop }, () => {}, 400);

    const r = window.mulberry32(seed + 1);
    window.S.opt.timer = window.every(620, () => {
      if (window.S.opt.paused) return;
      window.S.opt.gen++;

      const improve = Math.log(window.S.opt.gen + 1) * 0.32 + r() * 0.18;
      const fitness = +(improve + (r() - 0.5) * 0.12).toFixed(3);

      if (fitness > window.S.opt.lastBest + 0.02) {
        window.S.opt.stagn = 0;
        window.S.opt.lastBest = fitness;
      } else {
        window.S.opt.stagn++;
      }

      const hyperEl = document.getElementById('op-hyper');
      if (window.S.opt.stagn >= stag && !window.S.opt.hyper) {
        window.S.opt.hyper = true;
        if (hyperEl) {
          hyperEl.className = 'badge warn';
          hyperEl.textContent = '⚡ Hyper-mutation';
        }
        window.ws('Event', { Type: 'StagnationDetected', gen: window.S.opt.gen });
      }

      window.S.opt.best = Math.max(window.S.opt.best, fitness);
      window.S.opt.fitness.push(window.S.opt.best);

      const bestEl = document.getElementById('op-best');
      const genlblEl = document.getElementById('op-genlbl');
      const barEl = document.getElementById('op-bar');

      if (bestEl) bestEl.textContent = window.S.opt.best.toFixed(3);
      if (genlblEl) genlblEl.textContent = 'gen ' + window.S.opt.gen + ' / ' + window.S.opt.total;
      if (barEl) barEl.style.width = (window.S.opt.gen / window.S.opt.total * 100) + '%';

      window.ws('Event', { Type: 'OptimizationGeneration', generation: window.S.opt.gen, bestFitness: window.S.opt.best, hyper: window.S.opt.hyper });

      const cv = document.getElementById('op-fitness');
      if (cv) window.drawLine(cv, window.S.opt.fitness, '#af52de');

      if (window.S.opt.gen >= window.S.opt.total) {
        clearInterval(window.S.opt.timer);
        window.S.opt.running = false;
        if (stat) stat.textContent = 'completed';

        const run = {
          id: window.uid(),
          name: 'GA · ' + gen + ' gen',
          status: 'completed',
          date: Date.now(),
          gen,
          best: window.S.opt.best,
          hyper: window.S.opt.hyper,
          genes: [9, 28, 12, 58, 2.1, 0.4, 0.7]
        };

        window.DB.opts.unshift(run);
        window.saveDB();
        renderOpHistory();
        showOpRes(run);

        window.toast('Optimization completed', 'Best fitness ' + window.S.opt.best.toFixed(3), 'ok');
        window.DB.notifs.unshift({
          id: window.uid(),
          ic: 'dna',
          t: 'Optimization completed',
          d: 'Best fitness ' + window.S.opt.best.toFixed(3) + '. Inject genes to live?',
          tm: Date.now()
        });
        if (typeof window.renderNotifs === 'function') window.renderNotifs();
      }
    });
  };

  window.RZ.pauseOpt = function() {
    window.sendCommand(window.S.opt.paused ? 1303 : 1302, window.S.opt.paused ? 'ResumeOptimization' : 'PauseOptimization', {}, () => {
      window.S.opt.paused = !window.S.opt.paused;
      const s = document.getElementById('op-stat');
      if (s) s.textContent = window.S.opt.paused ? 'paused' : 'evolving';
      window.toast(window.S.opt.paused ? 'Paused' : 'Resumed', '', 'info');
    });
  };

  window.RZ.cancelOpt = function() {
    if (window.S.opt.timer) clearInterval(window.S.opt.timer);
    window.S.opt.running = false;
    const s = document.getElementById('op-stat');
    if (s) s.textContent = 'cancelled';
    window.sendCommand(1301, 'CancelOptimization', {}, () => {});
    window.toast('Optimization cancelled', '', 'warn');
  };

  function renderOpHistory() {
    const el = document.getElementById('op-history');
    if (!el) return;
    el.innerHTML = window.DB.opts.map(o => `<div class="kv">
      <div>
        <div style="font-weight:600">${o.name}</div>
        <div class="muted" style="font-size:11px">${window.ago(o.date)} · ${o.gen} gen ${o.hyper ? '· ⚡hyper' : ''}</div>
      </div>
      <span class="badge vio">ƒ ${o.best.toFixed(2)}</span>
    </div>`).join('');
  }

  function showOpRes(run) {
    const card = document.getElementById('op-res-card');
    const resBox = document.getElementById('op-res');
    if (!card || !resBox) return;

    card.style.display = 'block';
    const names = ['FastEMA', 'SlowEMA', 'RsiPeriod', 'RsiThreshold', 'RiskPct', 'NN.w1', 'NN.w2'];
    resBox.innerHTML = `<div class="tbl-wrap">
      <table>
        <thead><tr><th>Gene</th><th>Value</th><th>Type</th></tr></thead>
        <tbody>${run.genes.map((g, i) => `<tr>
          <td class="mono">${names[i] || 'gene_' + i}</td>
          <td class="mono"><b>${g}</b></td>
          <td><span class="chip">${i < 5 ? 'Continuous' : 'Parametric'}</span></td>
        </tr>`).join('')}</tbody>
      </table>
    </div>`;
  }

  window.RZ.injectBestGenes = function() {
    window.RZ.go('live');
    setTimeout(() => {
      if (window.RZ.openInjectGenes) window.RZ.openInjectGenes();
    }, 200);
  };

  window.renderOpt = renderOpt;
  if (!window.RENDER) window.RENDER = {};
  window.RENDER.optimization = () => {
    const c = document.getElementById('content');
    if (c) renderOpt(c);
  };
})();
