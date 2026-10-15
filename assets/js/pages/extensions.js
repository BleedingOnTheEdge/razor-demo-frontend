/* ============================================================
   RAZOR CLOUD — Extensions & Profiles Page Renderer
   ============================================================ */
(function() {
  let extTab = 'Adapters';

  function renderExtensions(container) {
    const cats = ['Adapters', 'Strategies', 'Indicators', 'Hook Plugins', 'NeuralNetworks'];
    const myEngines = window.DB.engines.filter(e => e.owner === window.S.user.email);
    const t = window.t;
    const ic = window.ic;

    let html = `<div class="page-head">
      <div>
        <h1>${t('extensions')}</h1>
        <p>Double-validated activation: engine sends its manifest, Cloud validates signatures & license, then pushes the active set. Isolated AssemblyLoadContexts per extension.</p>
      </div>
      <div class="page-actions">
        <button class="btn ghost" onclick="RZ.reloadExt()">${ic('refresh')} ${t('reloadAll')}</button>
        <button class="btn primary" onclick="RZ.openDeploy()">${ic('upload')} ${t('deployExtension')}</button>
      </div>
    </div>`;

    html += `<div class="card flat mb16">
      <div class="flex aic jcb" style="flex-wrap:wrap;gap:12px">
        <div class="flex aic gap12">
          <span class="muted" style="font-size:12px">Active profile target:</span>
          <select id="ext-target" style="background:var(--bg2);border:1px solid var(--line);border-radius:8px;padding:7px 10px;color:var(--txt)">
            ${myEngines.map(e => `<option>${e.name}</option>`).join('')}
          </select>
        </div>
        <div class="flex aic gap8">
          <span class="badge ok"><span class="dot"></span>Manifest synced</span>
          <span class="badge vio">${window.fmtN(window.DB.extensions.filter(e => e.active).length)} active</span>
        </div>
      </div>
    </div>`;

    html += `<div class="tabs" id="ext-tabs">
      ${cats.map(c => `<div class="tab ${c === extTab ? 'active' : ''}" onclick="RZ.extTab('${c}')">${c}</div>`).join('')}
    </div>`;

    html += `<div id="ext-grid" class="grid g3"></div>`;
    html += `<div class="hint mt16">${ic('shield')}<div>In production, unsigned assemblies are rejected (PluginSafetyValidator). SDK major version must match the engine's; mismatches fail PluginValidator.</div></div>`;

    container.innerHTML = html;
    renderExtGrid();
  }

  function renderExtGrid() {
    const grid = document.getElementById('ext-grid');
    if (!grid) return;
    const list = window.DB.extensions.filter(e => e.cat === extTab);
    const ic = window.ic;

    grid.innerHTML = list.length
      ? list.map(e => `<div class="ext-card">
          <div class="ex-top">
            <div>
              <div class="ex-name">${e.name}</div>
              <div class="ex-desc">${e.desc}</div>
            </div>
            <div class="toggle ${e.active ? 'on' : ''}" onclick="RZ.toggleExt('${e.id}')"></div>
          </div>
          <div class="ex-meta">
            <span class="chip">v${e.ver}</span>
            <span class="chip">SDK ${e.sdk}</span>
            ${e.signed ? '<span class="badge ok">' + ic('shield') + ' signed</span>' : '<span class="badge err">unsigned</span>'}
            <span class="chip">${e.source}</span>
          </div>
          <div class="ex-foot">
            <span class="muted" style="font-size:11px">${e.author}</span>
            <div class="flex gap8">
              <button class="btn xs ghost" onclick="RZ.toggleExt('${e.id}')">${e.active ? 'Deactivate' : 'Activate'}</button>
              <button class="btn xs danger" onclick="RZ.removeExt('${e.id}')">${ic('trash')}</button>
            </div>
          </div>
        </div>`).join('')
      : `<div class="empty" style="grid-column:1/-1">${ic('puzzle')}<div>No extensions in this slot. Deploy one from the Marketplace.</div></div>`;
  }

  window.RZ = window.RZ || {};
  window.RZ.extTab = function(c) {
    extTab = c;
    const tabs = document.querySelectorAll('#ext-tabs .tab');
    tabs.forEach(t => t.classList.toggle('active', t.textContent === c));
    renderExtGrid();
  };

  window.RZ.toggleExt = function(id) {
    const e = window.DB.extensions.find(x => x.id === id);
    if (!e) return;
    const on = !e.active;

    window.toast('Validating…', 'Manifest → Cloud → Engine re-validation', 'info');
    window.ws('Event', { Type: 'ExtensionManifest', count: window.DB.extensions.length });

    setTimeout(() => window.ws('Command', { CommandId: 1404, CommandType: 'ActivateExtensions', set: on ? [e.name] : [] }), 500);
    setTimeout(() => {
      window.ws('Event', { Type: 'ActiveExtensionsAck', ok: true });
      e.active = on;
      window.saveDB();
      renderExtGrid();
      window.toast((on ? 'Activated ' : 'Deactivated ') + e.name, 'Double validation passed.', 'ok');
    }, 1100);
  };

  window.RZ.removeExt = function(id) {
    const e = window.DB.extensions.find(x => x.id === id);
    if (!e) return;
    window.confirm('Remove extension?', 'This sends RemoveExtension (1402) and unloads the AssemblyLoadContext.', () => {
      window.DB.extensions = window.DB.extensions.filter(x => x.id !== id);
      window.saveDB();
      renderExtGrid();
      window.sendCommand(1402, 'RemoveExtension', { name: e.name }, () => {});
      window.toast('Extension removed', e.name, 'warn');
    });
  };

  window.RZ.reloadExt = function() {
    window.sendCommand(1400, 'ReloadExtensions', {}, () => {
      window.toast('Extensions reloaded', 'Discovery + double validation complete.', 'ok');
    });
  };

  window.RZ.openDeploy = function() {
    const ic = window.ic;

    window.modal(`<div class="modal-h"><h3>Deploy Extension</h3><button class="x" onclick="closeModal()">${ic('x')}</button></div>
      <div class="modal-b">
        <div class="field"><label>Assembly file</label><input id="dp-file" value="MyStrategy.dll"></div>
        <div class="form-grid">
          <div class="field"><label>Slot / category</label><select id="dp-cat"><option>Strategies</option><option>Adapters</option><option>Indicators</option><option>Hook Plugins</option><option>NeuralNetworks</option></select></div>
          <div class="field"><label>Version</label><input id="dp-ver" value="1.0.0"></div>
        </div>
        <div class="hint">${ic('upload')}<div>Cloud pushes the signed DLL over the same WSS via chunked BinaryChunk transfer, then issues DeployExtension (1401).</div></div>
        <div class="progress mt16" id="dp-prog-wrap" style="display:none"><div class="bar" id="dp-bar" style="width:0%"></div></div>
      </div>
      <div class="modal-f"><button class="btn ghost" onclick="closeModal()">${window.t('cancel')}</button><button class="btn primary" id="dp-go">${ic('upload')} Deploy</button></div>`);

    document.getElementById('dp-go').onclick = () => {
      document.getElementById('dp-prog-wrap').style.display = 'block';
      document.getElementById('dp-go').disabled = true;
      const name = document.getElementById('dp-file').value;

      window.ws('Binary', { Type: 'BinaryTransferStart', file: name });
      let p = 0;
      const t = window.every(180, () => {
        p += Math.random() * 22 + 8;
        window.ws('Binary', { Type: 'BinaryChunk', seq: Math.floor(p / 20) });
        document.getElementById('dp-bar').style.width = Math.min(p, 100) + '%';
        if (p >= 100) {
          clearInterval(t);
          window.ws('Binary', { Type: 'BinaryTransferEnd', sha256: 'a1f9…c42' });
          window.DB.extensions.unshift({
            id: window.uid(),
            name: name.replace('.dll', ''),
            cat: document.getElementById('dp-cat').value,
            ver: document.getElementById('dp-ver').value,
            sdk: '1.0.0',
            signed: true,
            active: false,
            source: 'Local',
            author: 'You',
            desc: 'Newly deployed extension.'
          });
          window.saveDB();
          window.sendCommand(1401, 'DeployExtension', { file: name }, () => {
            window.closeModal();
            renderExtGrid();
            window.toast('Extension deployed', name + ' · checksum verified', 'ok');
          });
        }
      });
    };
  };

  window.renderExtensions = renderExtensions;
  if (!window.RENDER) window.RENDER = {};
  window.RENDER.extensions = () => {
    const c = document.getElementById('content');
    if (c) renderExtensions(c);
  };
})();
