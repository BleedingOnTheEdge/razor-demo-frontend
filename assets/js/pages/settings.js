/* ============================================================
   RAZOR CLOUD — Account & Settings Page Renderer
   ============================================================ */
(function() {
  function renderSettings(container) {
    const S = window.S;
    const DB = window.DB;
    const t = window.t;
    const ic = window.ic;
    const FEATURES = window.FEATURES;

    const u = S.user || window.USERS[0];
    const myEnt = FEATURES.filter(f => u.tierId === 'dev' ? [100, 101, 102, 103, 104, 109].includes(f.id) : true);

    let html = `<div class="page-head">
      <div>
        <h1>${t('settings')}</h1>
        <p>Manage your profile, subscription tier, and feature entitlements.</p>
      </div>
    </div>`;

    html += `<div class="grid g2 mb16">
      <div class="card">
        <div class="card-h"><h3>Profile</h3></div>
        <div class="flex aic gap12 mb16">
          <div class="avatar" style="width:54px;height:54px;font-size:18px">${u.av}</div>
          <div>
            <div style="font-family:var(--head);font-weight:600;font-size:16px">${u.name}</div>
            <div class="mono muted" style="font-size:12px">${u.email}</div>
            <div class="muted" style="font-size:11px">Member since ${u.joined}</div>
          </div>
        </div>
        <div class="kv"><span class="k">Role</span><span class="v">${u.role}</span></div>
        <div class="kv"><span class="k">Default region</span><span class="v">eu-central</span></div>
        <div class="kv"><span class="k">2FA</span><span class="badge ok">enabled</span></div>
      </div>
      <div class="card">
        <div class="card-h">
          <h3>Subscription</h3>
          ${u.tierId === 'dev' ? `<button class="btn sm primary" onclick="RZ.upgrade()">${t('upgrade')}</button>` : ''}
        </div>
        <div class="flex aic gap12 mb16">
          <div style="width:46px;height:46px;border-radius:11px;background:var(--grad);display:grid;place-items:center;color:#04121a">${ic('award')}</div>
          <div>
            <div style="font-family:var(--head);font-weight:600">${u.tier}</div>
            <div class="muted" style="font-size:11px">${u.tierId === 'dev' ? 'Free forever · limited' : 'Renews 2026-11-21'}</div>
          </div>
        </div>
        <div class="kv"><span class="k">${t('instances')}</span><span class="v">${window.fmtN(DB.engines.filter(e => e.owner === u.email).length)} / ${u.instMax ? window.fmtN(u.instMax) : '∞'}</span></div>
        <div class="kv"><span class="k">Billing</span><span class="v">${u.tierId === 'dev' ? '—' : '$149 / mo'}</span></div>
        <div class="kv"><span class="k">Payment</span><span class="v">•••• 4242</span></div>
      </div>
    </div>`;

    html += `<div class="card mb16">
      <div class="card-h"><h3>Feature Entitlements</h3><span class="sub">signed capability set from Cloud</span></div>
      <div class="tag-row">
        ${FEATURES.map(f => `<span class="chip ${myEnt.includes(f) ? 'on' : ''}">${ic(myEnt.includes(f) ? 'check' : 'lock')} F${f.id} · ${f.name}</span>`).join('')}
      </div>
    </div>`;

    html += `<div class="card">
      <div class="card-h"><h3 style="color:var(--down)">Danger Zone</h3></div>
      <div class="kv"><span class="k">Sign out all sessions</span><button class="btn sm danger" onclick="RZ.logout()">${t('logout')}</button></div>
      <div class="kv"><span class="k">Delete account</span><button class="btn sm danger" onclick="toast('Contact support','Account deletion requires verification.','warn')">Request deletion</button></div>
    </div>`;

    container.innerHTML = html;
  }

  window.RZ = window.RZ || {};
  window.RZ.upgrade = function() {
    window.toast('Redirecting…', 'Opening checkout for Professional tier.', 'info');
  };

  window.renderSettings = renderSettings;
  if (!window.RENDER) window.RENDER = {};
  window.RENDER.settings = () => {
    const c = document.getElementById('content');
    if (c) renderSettings(c);
  };
})();
