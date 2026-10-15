/* ============================================================
   RAZOR CLOUD — Admin Platform Pages Renderer
   ============================================================ */
(function() {
  const DB = window.DB;
  const t = window.t;
  const ic = window.ic;

  // 1. Admin Platform Overview
  function rAOverview(container) {
    const online = window.DB.engines.filter(e => e.status === 'online').length;

    let html = `<div class="page-head">
      <div>
        <h1>${t('admin-overview')}</h1>
        <p>Razor Co. staff view — fleet health, revenue, and marketplace activity across all tenants.</p>
      </div>
    </div>`;

    html += `<div class="grid g4 mb16">
      <div class="stat"><div class="lbl">${t('totalUsers')}</div><div class="val">1,284</div><div class="delta up">+38 this week</div><div class="ic">${ic('users')}</div></div>
      <div class="stat"><div class="lbl">${t('enginesOnline')}</div><div class="val">${window.fmtN(online + 945)}</div><div class="delta up">99.2% fleet</div><div class="ic">${ic('server')}</div></div>
      <div class="stat"><div class="lbl">${t('mrr')}</div><div class="val">$86.4k</div><div class="delta up">+4.1% MoM</div><div class="ic">${ic('trend')}</div></div>
      <div class="stat"><div class="lbl">${t('marketplaceGmv')}</div><div class="val">$21.7k</div><div class="delta up">${t('razorFee')}</div><div class="ic">${ic('store')}</div></div>
    </div>`;

    html += `<div class="grid g3 mb16">
      <div class="card" style="grid-column:span 2">
        <div class="card-h"><h3>Engines online (24h)</h3></div>
        <div class="chart-box"><canvas id="ao-chart" style="height:180px"></canvas></div>
      </div>
      <div class="card">
        <div class="card-h"><h3>Version distribution</h3></div>
        <div style="display:flex;justify-content:center"><canvas id="ao-donut" style="height:150px;width:150px"></canvas></div>
        <div class="tag-row mt8" style="justify-content:center"><span class="chip on">1.0.0 LTS · 88%</span><span class="chip">0.9.x · 12%</span></div>
      </div>
    </div>`;

    html += `<div class="card">
      <div class="card-h"><h3>Recent platform events</h3></div>
      <div class="tbl-wrap">
        <table>
          <thead><tr><th>${t('time')}</th><th>${t('actor')}</th><th>${t('event')}</th><th>${t('ip')}</th></tr></thead>
          <tbody>${window.DB.audit.map(a => `<tr>
            <td class="mono muted">${window.ago(a.tm)}</td>
            <td>${a.who}</td>
            <td>${a.act}</td>
            <td class="mono muted">${a.ip}</td>
          </tr>`).join('')}</tbody>
        </table>
      </div>
    </div>`;

    container.innerHTML = html;
    const aoCv = document.getElementById('ao-chart');
    if (aoCv) window.drawArea(aoCv, window.walk(48, 940, 0.001, 0.01, 3), '#0071e3', { dec: 0 });

    const donutCv = document.getElementById('ao-donut');
    if (donutCv) window.drawDonut(donutCv, [{ v: 88, c: '#0071e3' }, { v: 12, c: '#af52de' }], { t: '88%', s: 'on LTS' });
  }

  // 2. User Management
  function rAUsers(container) {
    let html = `<div class="page-head">
      <div>
        <h1>${t('admin-users')}</h1>
        <p>Role-based access, subscription tracking, and tenant suspension.</p>
      </div>
      <div class="page-actions">
        <button class="btn primary" onclick="toast('Invite sent','Onboarding email dispatched.','ok')">${ic('plus')} ${t('inviteUser')}</button>
      </div>
    </div>`;

    html += `<div class="card">
      <div class="tbl-wrap">
        <table>
          <thead><tr><th>${t('user')}</th><th>${t('email')}</th><th>${t('tier')}</th><th>${t('instances')}</th><th>${t('joined')}</th><th>${t('status')}</th><th></th></tr></thead>
          <tbody id="au-list"></tbody>
        </table>
      </div>
    </div>`;

    container.innerHTML = html;
    rAUsersList();
  }

  function rAUsersList() {
    const el = document.getElementById('au-list');
    if (!el) return;
    el.innerHTML = window.DB.users.map(u => `<tr>
      <td><div class="flex aic gap8"><div class="avatar" style="width:26px;height:26px;font-size:10px">${u.name.split(' ').map(x => x[0]).join('')}</div><b>${u.name}</b></div></td>
      <td class="mono muted">${u.email}</td>
      <td><span class="chip">${u.tier}</span></td>
      <td class="mono">${window.fmtN(u.inst)}</td>
      <td class="mono muted">${u.joined}</td>
      <td><span class="badge ${u.status === 'active' ? 'ok' : 'err'}">${u.status}</span></td>
      <td class="cell-actions">
        <select onchange="RZ.changeTier('${u.id}',this.value)" style="background:var(--bg2);border:1px solid var(--line);border-radius:6px;padding:4px 6px;color:var(--txt);font-size:11px">
          <option ${u.tier === 'Free Developer' ? 'selected' : ''}>Free Developer</option>
          <option ${u.tier === 'Professional' ? 'selected' : ''}>Professional</option>
          <option ${u.tier === 'Enterprise' ? 'selected' : ''}>Enterprise</option>
        </select>
        <button class="btn xs ${u.status === 'active' ? 'warn' : 'ghost'}" onclick="RZ.suspendUser('${u.id}')">${u.status === 'active' ? 'Suspend' : 'Enable'}</button>
      </td>
    </tr>`).join('');
  }

  window.RZ = window.RZ || {};
  window.RZ.suspendUser = function(id) {
    const u = window.DB.users.find(x => x.id === id);
    if (!u) return;
    u.status = u.status === 'active' ? 'suspended' : 'active';
    rAUsersList();
    window.DB.audit.unshift({ id: window.uid(), who: window.S.user.email, act: (u.status === 'suspended' ? 'Suspended' : 'Enabled') + ' user ' + u.email, tm: Date.now(), ip: '10.0.4.12' });
    window.saveDB();
    window.toast('User ' + u.status, u.email, u.status === 'suspended' ? 'warn' : 'ok');
  };

  window.RZ.changeTier = function(id, t) {
    const u = window.DB.users.find(x => x.id === id);
    if (!u) return;
    u.tier = t;
    window.saveDB();
    rAUsersList();
    window.toast('Tier updated', u.email + ' → ' + t, 'ok');
  };

  // 3. License Management
  function rALicenses(container) {
    let html = `<div class="page-head">
      <div>
        <h1>${t('admin-licenses')}</h1>
        <p>Signed capability sets enforced by engines after authentication.</p>
      </div>
      <div class="page-actions">
        <button class="btn primary" onclick="RZ.issueLicense()">${ic('plus')} ${t('issueLicense')}</button>
      </div>
    </div>`;

    html += `<div class="card">
      <div class="tbl-wrap">
        <table>
          <thead><tr><th>${t('licenseKey')}</th><th>${t('user')}</th><th>${t('tier')}</th><th>${t('expires')}</th><th>${t('featureSet')}</th><th></th></tr></thead>
          <tbody id="al-list"></tbody>
        </table>
      </div>
    </div>`;

    container.innerHTML = html;
    rALicList();
  }

  function rALicList() {
    const el = document.getElementById('al-list');
    if (!el) return;
    el.innerHTML = window.DB.licenses.map(l => `<tr>
      <td class="mono"><b>${l.key}</b></td>
      <td class="mono muted">${l.user}</td>
      <td><span class="chip">${l.tier}</span></td>
      <td class="mono muted">${l.expires}</td>
      <td class="mono muted">${l.feats}</td>
      <td class="cell-actions"><button class="btn xs danger" onclick="RZ.revokeLic('${l.id}')">${window.ic('trash')} Revoke</button></td>
    </tr>`).join('');
  }

  window.RZ.issueLicense = function() {
    window.modal(`<div class="modal-h"><h3>Issue License</h3><button class="x" onclick="closeModal()">${window.ic('x')}</button></div>
      <div class="modal-b">
        <div class="field"><label>User email</label><input id="lc-u" value="new@tenant.io"></div>
        <div class="form-grid">
          <div class="field"><label>Tier</label><select id="lc-t"><option>Professional</option><option>Enterprise</option><option>Free Developer</option></select></div>
          <div class="field"><label>Duration</label><select id="lc-d"><option>4 months</option><option>6 months</option><option>12 months</option></select></div>
        </div>
      </div>
      <div class="modal-f"><button class="btn ghost" onclick="closeModal()">${window.t('cancel')}</button><button class="btn primary" onclick="RZ.saveLic()">${window.ic('check')} Issue</button></div>`);
  };

  window.RZ.saveLic = function() {
    const k = 'RZR-' + document.getElementById('lc-t').value.slice(0, 3).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
    window.DB.licenses.unshift({ id: window.uid(), key: k, user: document.getElementById('lc-u').value, tier: document.getElementById('lc-t').value, expires: '2027-07-21', feats: '100-111' });
    window.DB.audit.unshift({ id: window.uid(), who: window.S.user.email, act: 'Issued license ' + k, tm: Date.now(), ip: '10.0.4.12' });
    window.saveDB();
    window.closeModal();
    rALicList();
    window.toast('License issued', k, 'ok');
  };

  window.RZ.revokeLic = function(id) {
    const l = window.DB.licenses.find(x => x.id === id);
    if (!l) return;
    window.confirm('Revoke license?', 'Engines using this key will fail re-authentication on next heartbeat.', () => {
      window.DB.licenses = window.DB.licenses.filter(x => x.id !== id);
      window.saveDB();
      rALicList();
      window.toast('License revoked', l.key, 'warn');
    }, true);
  };

  // 4. Global Fleet
  function rAEngines(container) {
    let html = `<div class="page-head">
      <div>
        <h1>${t('admin-engines')}</h1>
        <p>All registered instances across tenants. Push updates fleet-wide.</p>
      </div>
      <div class="page-actions">
        <button class="btn primary" onclick="RZ.pushAll()">${ic('upload')} ${t('pushFleetUpdate')}</button>
      </div>
    </div>`;

    html += `<div class="card">
      <div class="tbl-wrap">
        <table>
          <thead><tr><th>${t('engine')}</th><th>${t('owner')}</th><th>${t('version')}</th><th>${t('endpoint')}</th><th>${t('cpuMem')}</th><th>${t('tickAge')}</th><th>${t('status')}</th></tr></thead>
          <tbody id="ae-list"></tbody>
        </table>
      </div>
    </div>`;

    container.innerHTML = html;
    rAEngList();
  }

  function rAEngList() {
    const el = document.getElementById('ae-list');
    if (!el) return;
    el.innerHTML = window.DB.engines.map(e => `<tr>
      <td><b>${e.name}</b><div class="cell-mono">${e.id}</div></td>
      <td class="mono muted">${e.owner}</td>
      <td class="mono">${e.version}</td>
      <td><span class="chip">${e.endpoint}</span></td>
      <td class="mono">${window.fmtN(e.cpu)}% / ${window.fmtN(e.mem)}%</td>
      <td class="mono ${e.tickAge && e.tickAge < 300 ? 'up' : 'warn'}">${e.tickAge ? window.fmtN(e.tickAge) + 'ms' : '—'}</td>
      <td><span class="badge ${e.status === 'online' ? 'ok' : 'err'}"><span class="dot"></span>${e.status}</span></td>
    </tr>`).join('');
  }

  window.RZ.pushAll = function() {
    window.confirm('Push update to entire fleet?', 'All self-update-enabled engines will stage v1.0.1 on next heartbeat.', () => {
      window.DB.engines.forEach(e => e.selfUpdate && (e.version = '1.0.1 LTS'));
      window.saveDB();
      rAEngList();
      window.toast('Fleet update dispatched', 'staged on ' + window.DB.engines.filter(e => e.selfUpdate).length + ' engines', 'ok');
    });
  };

  // 5. Broadcast Messages
  function rABroadcasts(container) {
    let html = `<div class="page-head">
      <div>
        <h1>${t('admin-broadcasts')}</h1>
        <p>Pushed to engines via HeartbeatResponse.AdminMessage and rendered on user dashboards with style hints.</p>
      </div>
    </div>`;

    html += `<div class="grid" style="grid-template-columns:1fr 1.4fr;gap:16px">
      <div class="card">
        <div class="card-h"><h3>Compose</h3></div>
        <div class="field"><label>Message</label><textarea id="bc-txt" rows="4" style="resize:vertical">New NN slot models available in the Marketplace.</textarea></div>
        <div class="field"><label>Style</label>
          <div class="seg" id="bc-style">
            <button class="on" data-s="info">info</button>
            <button data-s="warning">warning</button>
            <button data-s="error">error</button>
            <button data-s="success">success</button>
          </div>
        </div>
        <button class="btn primary" style="width:100%;justify-content:center" onclick="RZ.sendBroadcast()">${ic('send')} ${t('broadcastToFleet')}</button>
      </div>
      <div class="card">
        <div class="card-h"><h3>History</h3></div>
        <div id="ab-history"></div>
      </div>
    </div>`;

    container.innerHTML = html;
    document.querySelectorAll('#bc-style button').forEach(b => {
      b.onclick = () => {
        document.querySelectorAll('#bc-style button').forEach(x => x.classList.remove('on'));
        b.classList.add('on');
      };
    });
    rABHist();
  }

  function rABHist() {
    const el = document.getElementById('ab-history');
    if (!el) return;
    const ic = window.ic;
    el.innerHTML = window.DB.broadcasts.map(b => `<div class="bcast ${b.style}" style="margin-bottom:10px">
      ${ic({ info: 'info', warning: 'alert', error: 'alert', success: 'check' }[b.style] || 'info')}
      <div style="flex:1">${b.text}</div>
      <span class="mono muted" style="font-size:10px">${window.ago(b.date)}</span>
    </div>`).join('');
  }

  window.RZ.sendBroadcast = function() {
    const txt = document.getElementById('bc-txt').value.trim();
    if (!txt) { window.toast('Empty message', '', 'err'); return; }
    const sBtn = document.querySelector('#bc-style .on');
    const s = sBtn ? sBtn.dataset.s : 'info';

    window.DB.broadcasts.unshift({ id: window.uid(), text: txt, style: s, date: Date.now() });
    window.DB.audit.unshift({ id: window.uid(), who: window.S.user.email, act: 'Broadcast sent (' + s + ')', tm: Date.now(), ip: '10.0.4.12' });
    window.saveDB();
    window.ws('Heartbeat', { AdminMessage: { Text: txt, Style: s } });
    rABHist();
    window.toast('Broadcast sent', 'style: ' + s, 'ok');
  };

  // 6. Marketplace Oversight
  function rAMarket(container) {
    const gmv = window.DB.listings.reduce((a, l) => a + parseInt((l.price.replace(/[^0-9]/g, '')) || 0) * l.dl, 0);

    let html = `<div class="page-head">
      <div>
        <h1>${t('admin-marketplace')}</h1>
        <p>Approve listings, manage featured items, track the 15% transaction fee.</p>
      </div>
    </div>`;

    html += `<div class="grid g3 mb16">
      <div class="stat"><div class="lbl">Listings</div><div class="val">${window.fmtN(window.DB.listings.length)}</div><div class="ic">${ic('store')}</div></div>
      <div class="stat"><div class="lbl">Est. GMV</div><div class="val">$${window.fmtN(gmv)}</div><div class="ic">${ic('trend')}</div></div>
      <div class="stat"><div class="lbl">${t('razorFee')}</div><div class="val vio">$${window.fmtN(gmv * 0.15)}</div><div class="ic">${ic('award')}</div></div>
    </div>`;

    html += `<div class="card">
      <div class="tbl-wrap">
        <table>
          <thead><tr><th>${t('extension')}</th><th>${t('type')}</th><th>${t('price')}</th><th>${t('downloads')}</th><th>${t('status')}</th><th></th></tr></thead>
          <tbody id="am-list"></tbody>
        </table>
      </div>
    </div>`;

    container.innerHTML = html;
    rAMList();
  }

  function rAMList() {
    const el = document.getElementById('am-list');
    if (!el) return;
    const ic = window.ic;
    el.innerHTML = window.DB.listings.map(l => `<tr>
      <td><b>${l.name}</b></td>
      <td><span class="chip">${l.type}</span></td>
      <td class="mono">${l.price}</td>
      <td class="mono">${window.fmtN(l.dl)}</td>
      <td><span class="badge ${l.status === 'featured' ? 'vio' : l.status === 'approved' ? 'ok' : 'warn'}">${l.status}</span></td>
      <td class="cell-actions">
        ${l.status === 'pending' ? `<button class="btn xs ghost" onclick="RZ.approveList('${l.id}')">${ic('check')} Approve</button>` : ''}
        <button class="btn xs ghost" onclick="RZ.featureList('${l.id}')">${ic('award')} ${l.status === 'featured' ? 'Unfeature' : 'Feature'}</button>
      </td>
    </tr>`).join('');
  }

  window.RZ.approveList = function(id) {
    const l = window.DB.listings.find(x => x.id === id);
    if (!l) return;
    l.status = 'approved';
    window.DB.audit.unshift({ id: window.uid(), who: window.S.user.email, act: 'Approved listing ' + l.name, tm: Date.now(), ip: '10.0.4.12' });
    window.saveDB();
    rAMList();
    window.toast('Listing approved', l.name, 'ok');
  };

  window.RZ.featureList = function(id) {
    const l = window.DB.listings.find(x => x.id === id);
    if (!l) return;
    l.status = l.status === 'featured' ? 'approved' : 'featured';
    window.saveDB();
    rAMList();
    window.toast(l.name + (l.status === 'featured' ? ' featured' : ' unfeatured'), '', 'info');
  };

  // 7. Feature Flag Registry
  function rAFeatures(container) {
    let html = `<div class="page-head">
      <div>
        <h1>${t('admin-features')}</h1>
        <p>Capability IDs from the blueprint (§17). Toggling off notifies engines on next heartbeat; engines enforce locally.</p>
      </div>
    </div>`;

    html += `<div class="card">
      <div class="tbl-wrap">
        <table>
          <thead><tr><th>ID</th><th>Feature</th><th>Description</th><th>${t('enabled')}</th></tr></thead>
          <tbody id="af-list"></tbody>
        </table>
      </div>
    </div>`;

    container.innerHTML = html;
    rAFList();
  }

  function rAFList() {
    const el = document.getElementById('af-list');
    if (!el) return;
    el.innerHTML = window.FEATURES.map(f => `<tr>
      <td class="mono"><b>F${f.id}</b></td>
      <td>${f.name}</td>
      <td class="muted">${f.desc}</td>
      <td><div class="toggle ${window.DB.featureFlags[f.id] ? 'on' : ''}" onclick="RZ.toggleFeature(${f.id})"></div></td>
    </tr>`).join('');
  }

  window.RZ.toggleFeature = function(id) {
    window.DB.featureFlags[id] = !window.DB.featureFlags[id];
    window.saveDB();
    rAFList();
    window.toast('Feature F' + id + (window.DB.featureFlags[id] ? ' enabled' : ' disabled'), 'Engines notified on next heartbeat.', window.DB.featureFlags[id] ? 'ok' : 'warn');
  };

  // 8. Audit Log
  function rAAudit(container) {
    let html = `<div class="page-head">
      <div>
        <h1>${t('admin-audit')}</h1>
        <p>Immutable record of administrative actions.</p>
      </div>
    </div>`;

    html += `<div class="card">
      <div class="tbl-wrap">
        <table>
          <thead><tr><th>${t('time')}</th><th>${t('actor')}</th><th>Action</th><th>${t('ip')}</th></tr></thead>
          <tbody id="aa-list"></tbody>
        </table>
      </div>
    </div>`;

    container.innerHTML = html;
    const list = document.getElementById('aa-list');
    if (list) {
      list.innerHTML = window.DB.audit.map(a => `<tr>
        <td class="mono muted">${window.ago(a.tm)}</td>
        <td class="mono">${a.who}</td>
        <td>${a.act}</td>
        <td class="mono muted">${a.ip}</td>
      </tr>`).join('');
    }
  }

  if (!window.RENDER) window.RENDER = {};
  window.RENDER['admin-overview'] = () => { const c = document.getElementById('content'); if (c) rAOverview(c); };
  window.RENDER['admin-users'] = () => { const c = document.getElementById('content'); if (c) rAUsers(c); };
  window.RENDER['admin-licenses'] = () => { const c = document.getElementById('content'); if (c) rALicenses(c); };
  window.RENDER['admin-engines'] = () => { const c = document.getElementById('content'); if (c) rAEngines(c); };
  window.RENDER['admin-broadcasts'] = () => { const c = document.getElementById('content'); if (c) rABroadcasts(c); };
  window.RENDER['admin-marketplace'] = () => { const c = document.getElementById('content'); if (c) rAMarket(c); };
  window.RENDER['admin-features'] = () => { const c = document.getElementById('content'); if (c) rAFeatures(c); };
  window.RENDER['admin-audit'] = () => { const c = document.getElementById('content'); if (c) rAAudit(c); };
})();
