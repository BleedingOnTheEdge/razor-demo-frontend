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
        <button class="btn ghost" onclick="RZ.openPublishAdditive()">${ic('store')} ${t('publishAdditive', 'Publish Additive')}</button>
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
    const t = window.t;

    grid.innerHTML = list.length
      ? list.map(e => `<div class="ext-card">
          <div class="ex-top">
            <div style="cursor:pointer" onclick="RZ.openExtDetail('${e.id}')">
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
              <button class="btn xs ghost" onclick="RZ.openExtDetail('${e.id}')">${t('details', 'Details')}</button>
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

  window.RZ.openExtDetail = function(id) {
    const e = window.DB.extensions.find(x => x.id === id);
    if (!e) return;
    const ic = window.ic;
    const t = window.t;

    const permissions = [
      { name: 'MarketData:Read', desc: 'Real-time L1/L2 quotes, depth of book and tick subscriptions', ok: true },
      { name: 'OrderExecution:Write', desc: 'Direct market order routing and order life-cycle control', ok: e.cat === 'Adapters' || e.cat === 'Strategies' },
      { name: 'SharedMemory:ZeroCopy', desc: 'Direct IPC via zero-copy mapped ring buffers', ok: true },
      { name: 'NetworkSocket', desc: 'Outbound TCP/WSS broker connections', ok: e.cat === 'Adapters' }
    ];

    window.modal(`<div class="modal-h">
      <div>
        <div class="flex aic gap8">
          <span class="chip on">${e.cat}</span>
          <span class="chip">v${e.ver}</span>
          <span class="chip">SDK ${e.sdk}</span>
          ${e.signed ? `<span class="badge ok">${ic('shield')} Cryptographically Signed</span>` : `<span class="badge err">Unsigned Assembly</span>`}
        </div>
        <h3 style="margin-top:6px;font-size:18px">${e.name}</h3>
      </div>
      <button class="x" onclick="closeModal()">${ic('x')}</button>
    </div>
    <div class="modal-b" style="max-height:68vh;overflow-y:auto">
      <div class="card flat mb16" style="background:var(--bg2)">
        <div class="flex aic jcb" style="flex-wrap:wrap;gap:12px">
          <div>
            <div class="muted" style="font-size:11px">Author &amp; Publisher</div>
            <div class="flex aic gap6 mt4">
              <div class="avatar" style="width:22px;height:22px;font-size:10px">${e.author.split(' ').map(x => x[0]).join('')}</div>
              <span style="font-weight:600;font-size:12.5px">${e.author}</span>
              <span class="badge vio" style="font-size:9.5px">${ic('check')} Verified Additive</span>
            </div>
          </div>
          <div>
            <div class="muted" style="font-size:11px">Downloads &amp; Rating</div>
            <div class="flex aic gap6 mt4">
              <span style="font-weight:600;font-size:12.5px">${ic('star')} 4.95</span>
              <span class="muted" style="font-size:11.5px">(1,420 installs)</span>
            </div>
          </div>
          <div>
            <div class="muted" style="font-size:11px">Licensing &amp; Source</div>
            <div class="mt4"><span class="chip">${e.source}</span></div>
          </div>
        </div>
        <div class="mt12 pt12" style="border-top:1px solid var(--line);font-size:13px;line-height:1.5;color:var(--txt)">
          ${e.desc}
        </div>
      </div>

      <h4 style="font-size:13px;font-weight:600;margin-bottom:8px;color:var(--mut)">Runtime Sandbox Permissions (002-010 § Safety)</h4>
      <div class="card mb16" style="padding:10px 14px">
        ${permissions.map(p => `<div class="flex aic jcb py6" style="border-bottom:1px solid var(--line);padding:6px 0">
          <div>
            <div class="mono" style="font-weight:600;font-size:12px;color:${p.ok ? 'var(--txt)' : 'var(--mut)'}">${p.name}</div>
            <div class="muted" style="font-size:11px">${p.desc}</div>
          </div>
          <span class="badge ${p.ok ? 'ok' : 'muted'}">${p.ok ? 'Granted' : 'Restricted'}</span>
        </div>`).join('')}
      </div>

      <div class="card flat" style="background:var(--bg2);padding:10px 14px">
        <div class="kv"><span class="k">Isolation Boundary</span><span class="v mono">AssemblyLoadContext (Collectible)</span></div>
        <div class="kv"><span class="k">SHA-256 Checksum</span><span class="v mono" style="font-size:10.5px">e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</span></div>
        <div class="kv"><span class="k">Hot-Reload Policy</span><span class="v ok">Zero-Downtime Swap Supported</span></div>
      </div>
    </div>
    <div class="modal-f">
      <button class="btn ghost" onclick="RZ.contactAdditiveDev('${e.name}')">${ic('chat')} ${t('contactDeveloper', 'Contact Developer / Open Ticket')}</button>
      <div class="flex gap8">
        <button class="btn ghost" onclick="closeModal()">${t('close', 'Close')}</button>
        <button class="btn ${e.active ? 'ghost' : 'primary'}" onclick="closeModal();RZ.toggleExt('${e.id}')">${e.active ? t('deactivate', 'Deactivate') : t('activate', 'Activate')}</button>
      </div>
    </div>`);
  };

  window.RZ.contactAdditiveDev = function(itemName) {
    window.closeModal();
    window.RZ.go('tickets');
    setTimeout(() => {
      window.RZ.openNewTicket();
      setTimeout(() => {
        const tgt = document.getElementById('nt-target');
        if (tgt) {
          tgt.value = 'AdditiveDeveloper';
          document.getElementById('nt-additive-row').style.display = 'block';
        }
        const add = document.getElementById('nt-additive');
        if (add) add.value = itemName;
      }, 50);
    }, 100);
  };

  window.RZ.openPublishAdditive = function() {
    const ic = window.ic;
    const t = window.t;

    window.modal(`<div class="modal-h">
      <h3>${ic('store')} ${t('publishAdditiveModalTitle', 'Publish Additive to Razor Marketplace (002-010)')}</h3>
      <button class="x" onclick="closeModal()">${ic('x')}</button>
    </div>
    <div class="modal-b" style="max-height:68vh;overflow-y:auto">
      <div class="hint mb16">
        ${ic('shield')}
        <div>Extensions are compiled against the Razor Core SDK and execute within an isolated collectible AssemblyLoadContext with capability-restricted sandboxing.</div>
      </div>

      <div class="form-grid">
        <div class="field">
          <label>Additive Name</label>
          <input type="text" id="pa-name" placeholder="e.g. OrderFlowImbalanceAdapter">
        </div>
        <div class="field">
          <label>Slot / Category</label>
          <select id="pa-cat">
            <option>Strategies</option>
            <option>Adapters</option>
            <option>Indicators</option>
            <option>Hook Plugins</option>
            <option>NeuralNetworks</option>
          </select>
        </div>
        <div class="field">
          <label>Semantic Version</label>
          <input type="text" id="pa-ver" value="1.0.0">
        </div>
        <div class="field">
          <label>Publisher / Author Display Name</label>
          <input type="text" id="pa-author" value="${window.S.user ? window.S.user.name : 'Elena Voss'}">
        </div>
        <div class="field">
          <label>Pricing Model</label>
          <select id="pa-price">
            <option value="0">Free Community Listing ($0.00)</option>
            <option value="49">Commercial Additive ($49 / mo)</option>
            <option value="199">Enterprise Additive ($199 / mo)</option>
          </select>
        </div>
        <div class="field">
          <label>Target Core SDK</label>
          <input type="text" id="pa-sdk" value="1.0.0 LTS" disabled>
        </div>
        <div class="field" style="grid-column:span 2">
          <label>Description &amp; Architectural Highlights</label>
          <textarea id="pa-desc" rows="3" placeholder="Explain the underlying trading logic, zero-copy guarantees, and broker connectivity..."></textarea>
        </div>
      </div>

      <div class="mt12">
        <label style="font-size:12px;font-weight:600;color:var(--txt);display:block;margin-bottom:6px">Permissions Manifest (razor-additive.json)</label>
        <pre class="code-box" style="font-size:11px;padding:10px;border-radius:8px;background:var(--bg2);border:1px solid var(--line);margin:0">{
  "$schema": "https://razor.io/schemas/additive-manifest.v1.json",
  "targetSdk": "1.0.0",
  "capabilities": ["MarketData:Read", "OrderExecution:Write", "SharedMemory:ZeroCopy"],
  "memoryBudgetMb": 256,
  "isolatedContext": true
}</pre>
      </div>
    </div>
    <div class="modal-f">
      <button class="btn ghost" onclick="closeModal()">${t('cancel')}</button>
      <button class="btn primary" id="pa-submit-btn">${ic('store')} Submit Listing for Moderation</button>
    </div>`, { lg: true });

    document.getElementById('pa-submit-btn').onclick = () => {
      const name = document.getElementById('pa-name').value.trim();
      const desc = document.getElementById('pa-desc').value.trim();
      const cat = document.getElementById('pa-cat').value;
      const ver = document.getElementById('pa-ver').value.trim() || '1.0.0';
      const author = document.getElementById('pa-author').value.trim() || 'Community Developer';
      const price = parseFloat(document.getElementById('pa-price').value);

      if (!name) {
        window.toast('Missing name', 'Please provide a name for the additive.', 'err');
        return;
      }

      window.DB.extensions.unshift({
        id: window.uid(),
        name,
        cat,
        ver,
        sdk: '1.0.0',
        signed: true,
        active: false,
        source: price > 0 ? 'Marketplace ($' + price + ')' : 'Marketplace (Free)',
        author,
        desc: desc || 'Newly published additive extension.'
      });

      window.saveDB();
      window.closeModal();
      window.toast('Additive Submitted', `${name} submitted to Marketplace. Triage visible in Admin Moderation.`, 'ok');
      window.ws('Event', { Type: 'AdditiveListingSubmitted', name, cat, author, price });
      renderExtGrid();
    };
  };

  window.renderExtensions = renderExtensions;
  if (!window.RENDER) window.RENDER = {};
  window.RENDER.extensions = () => {
    const c = document.getElementById('content');
    if (c) renderExtensions(c);
  };
})();
