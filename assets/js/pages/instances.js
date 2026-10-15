/* ============================================================
   RAZOR CLOUD — Instances & API Keys Page Renderer
   ============================================================ */
(function() {
  function renderInstances(container) {
    const S = window.S;
    const DB = window.DB;
    const t = window.t;
    const ic = window.ic;

    const list = S.role === 'admin' ? DB.engines : DB.engines.filter(e => e.owner === S.user.email);

    let html = `<div class="page-head">
      <div>
        <h1>${t('instances')}</h1>
        <p>Each engine instance is registered and issued a unique API key for the 3-factor WebSocket handshake. Revoke keys instantly from here.</p>
      </div>
      <div class="page-actions">
        <button class="btn primary" onclick="RZ.openInstance()">${ic('plus')} ${t('registerInstance')}</button>
      </div>
    </div>`;

    if (S.role !== 'admin' && list.length >= S.user.instMax) {
      html += `<div class="hint warn mb16">${ic('alert')}<div>You've used ${list.length}/${S.user.instMax} instances on the ${S.user.tier} tier. Purchase additional instances to scale.</div></div>`;
    }

    html += `<div class="grid g2" id="inst-list"></div>`;
    container.innerHTML = html;
    renderInstCards();
  }

  function renderInstCards() {
    const el = document.getElementById('inst-list');
    if (!el) return;
    const S = window.S;
    const DB = window.DB;
    const ic = window.ic;
    const t = window.t;

    const list = S.role === 'admin' ? DB.engines : DB.engines.filter(e => e.owner === S.user.email);

    el.innerHTML = list.map(e => `<div class="eng-card ${e.status === 'online' ? '' : 'offline'} ${e._updating ? 'updating' : ''}">
      <div class="ec-top">
        <div>
          <div class="ec-name">${e.name}</div>
          <div class="ec-id">${e.id} · ${e.region}</div>
        </div>
        <span class="badge ${e.status === 'online' ? 'ok' : 'err'}"><span class="dot ${e.status === 'online' ? 'pulse' : ''}"></span>${e.status}</span>
      </div>
      <div class="kv">
        <span class="k">${t('licenseKey')}</span>
        <span class="v flex aic gap8">
          <span class="mask" id="key-${e.id}">••••${e.key.slice(-4)}</span>
          <button class="btn xs ghost" onclick="RZ.copy('${e.key}',this)">${ic('copy')}</button>
        </span>
      </div>
      <div class="ec-meta">
        <div><span class="k">${t('version')}</span><span class="v">${e.version}</span></div>
        <div><span class="k">${t('endpoint')}</span><span class="v">${e.endpoint}</span></div>
        <div><span class="k">Uptime</span><span class="v">${e.uptime}</span></div>
        <div><span class="k">${t('cpuMem')}</span><span class="v">${window.fmtN(e.cpu)}% / ${window.fmtN(e.mem)}%</span></div>
      </div>
      <div class="ec-caps">${e.caps.map(c => `<span class="c">F${c}</span>`).join('')}</div>
      <div class="kv">
        <span class="k">Self-update channel</span>
        <span class="flex aic gap8">
          <div class="toggle ${e.selfUpdate ? 'on' : ''}" onclick="RZ.toggleSelfUpd('${e.id}')"></div>
          <span class="muted" style="font-size:11px">${e.selfUpdate ? 'enabled' : 'disabled'}</span>
        </span>
      </div>
      <div class="ec-acts">
        <button class="btn xs ghost" onclick="RZ.regenKey('${e.id}')">${ic('refresh')} Regen key</button>
        <button class="btn xs ghost" onclick="RZ.pushUpdate('${e.id}')">${ic('upload')} Push update</button>
        <button class="btn xs ghost" onclick="RZ.restartEng('${e.id}')">${ic('refresh')} Restart</button>
        <button class="btn xs danger" onclick="RZ.killSwitch('${e.id}')">${ic('zap')} Kill switch</button>
      </div>
    </div>`).join('');
  }

  window.RZ = window.RZ || {};
  window.RZ.openInstance = function() {
    const S = window.S;
    const DB = window.DB;
    if (S.role !== 'admin' && DB.engines.filter(e => e.owner === S.user.email).length >= S.user.instMax) {
      window.toast('Instance limit reached', 'Upgrade your subscription to add more.', 'warn');
      return;
    }

    const ic = window.ic;
    window.modal(`<div class="modal-h"><h3>Register Engine Instance</h3><button class="x" onclick="closeModal()">${ic('x')}</button></div>
      <div class="modal-b">
        <div class="field"><label>Instance name</label><input id="in-n" value="PROD-NEW-01"></div>
        <div class="field"><label>Region</label><select id="in-r"><option>eu-central</option><option>eu-north</option><option>us-east</option><option>ap-southeast</option><option>local</option></select></div>
        <div class="hint">${ic('key')}<div>A unique instance API key is generated for the 3-factor handshake (username + password + key).</div></div>
      </div>
      <div class="modal-f"><button class="btn ghost" onclick="closeModal()">${window.t('cancel')}</button><button class="btn primary" onclick="RZ.createInstance()">${ic('check')} Register & issue key</button></div>`);
  };

  window.RZ.createInstance = function() {
    const key = 'rzr_live_' + Math.random().toString(36).slice(2, 12);
    window.DB.engines.push({
      id: window.uid(),
      name: document.getElementById('in-n').value,
      owner: window.S.user.email,
      version: '1.0.0 LTS',
      endpoint: 'primary',
      status: 'online',
      cpu: 12,
      mem: 24,
      tickAge: 90,
      uptime: '0d 00h',
      caps: [100, 101, 102, 104, 105, 108, 109],
      key,
      selfUpdate: true,
      region: document.getElementById('in-r').value
    });
    window.saveDB();
    window.closeModal();
    renderInstCards();
    window.toast('Instance registered', 'API key issued — configure your engine with --auth', 'ok');
  };

  window.RZ.regenKey = function(id) {
    window.confirm('Regenerate API key?', 'The current key is revoked immediately; the engine will fail its next heartbeat until reconfigured.', () => {
      const e = window.DB.engines.find(x => x.id === id);
      if (e) {
        e.key = 'rzr_live_' + Math.random().toString(36).slice(2, 12);
        window.saveDB();
        renderInstCards();
        window.toast('Key regenerated', 'Update the engine --auth flag.', 'warn');
      }
    }, true);
  };

  window.RZ.toggleSelfUpd = function(id) {
    const e = window.DB.engines.find(x => x.id === id);
    if (!e) return;
    e.selfUpdate = !e.selfUpdate;
    window.saveDB();
    renderInstCards();
    window.toast('Self-update ' + (e.selfUpdate ? 'enabled' : 'disabled'), e.name, 'info');
  };

  window.RZ.pushUpdate = function(id) {
    const e = window.DB.engines.find(x => x.id === id);
    if (!e) return;
    const ic = window.ic;

    window.modal(`<div class="modal-h"><h3>Push Engine Update</h3><button class="x" onclick="closeModal()">${ic('x')}</button></div>
      <div class="modal-b">
        <div class="field"><label>Target version</label><select id="up-v"><option>1.0.1 LTS</option><option>1.1.0</option></select></div>
        <div class="hint">${ic('upload')}<div>Cloud includes NewVersion + DownloadUrl + Checksum in the next HeartbeatResponse. The engine downloads, verifies SHA-256, stages, and restarts with --command=restart.</div></div>
        <div class="progress mt16" id="up-prog" style="display:none"><div class="bar" id="up-bar" style="width:0%"></div></div>
      </div>
      <div class="modal-f"><button class="btn ghost" onclick="closeModal()">${window.t('cancel')}</button><button class="btn primary" id="up-go">${ic('upload')} Stage update</button></div>`);

    document.getElementById('up-go').onclick = () => {
      document.getElementById('up-prog').style.display = 'block';
      document.getElementById('up-go').disabled = true;
      let p = 0;
      const t = window.every(220, () => {
        p += Math.random() * 25 + 10;
        window.ws('Binary', { Type: 'BinaryChunk', seq: Math.floor(p / 25) });
        document.getElementById('up-bar').style.width = Math.min(p, 100) + '%';
        if (p >= 100) {
          clearInterval(t);
          e._updating = true;
          e.version = document.getElementById('up-v').value;
          window.saveDB();
          renderInstCards();
          window.closeModal();
          window.toast('Update staged', e.name + ' will restart momentarily', 'ok');
          window.ws('Heartbeat', { NewVersion: e.version, Checksum: 'sha256:9c2a…' });
          setTimeout(() => {
            e._updating = false;
            e.status = 'online';
            window.saveDB();
            renderInstCards();
            window.toast('Engine updated', 'now running ' + e.version, 'ok');
          }, 4000);
        }
      });
    };
  };

  window.RZ.restartEng = function(id) {
    const e = window.DB.engines.find(x => x.id === id);
    if (!e) return;
    window.confirm('Restart engine?', 'Sends Restart (1005). Live tasks resume from SQLite state snapshot.', () => {
      e.status = 'offline';
      renderInstCards();
      window.sendCommand(1005, 'Restart', {}, () => {
        e.status = 'online';
        window.saveDB();
        renderInstCards();
        window.toast('Engine restarted', e.name, 'ok');
      });
    });
  };

  window.RZ.killSwitch = function(id) {
    const e = window.DB.engines.find(x => x.id === id);
    if (!e) return;
    window.confirm('⚠ KILL SWITCH', 'This closes ALL positions, stops all tasks, sends final status and exits the engine. Type-confirmed destructive action.', () => {
      e.status = 'offline';
      if (window.S.live.running) {
        window.S.live.running = false;
        window.S.live.positions = [];
        if (window.S._liveLoop) clearInterval(window.S._liveLoop);
      }
      window.saveDB();
      renderInstCards();
      window.sendCommand(2000, 'KillSwitch', {}, () => {});
      window.ws('Event', { Type: 'KillSwitch', engine: e.id });
      window.toast('KILL SWITCH activated', e.name + ' halted', 'err');
    }, true, 'Activate kill switch');
  };

  window.renderInstances = renderInstances;
  if (!window.RENDER) window.RENDER = {};
  window.RENDER.instances = () => {
    const c = document.getElementById('content');
    if (c) renderInstances(c);
  };
})();
