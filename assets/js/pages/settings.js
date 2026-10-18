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

    // Multi-Account Broker Management
    const accounts = DB.accounts || [];
    html += `<div class="card mb16">
      <div class="card-h">
        <div>
          <h3>${t('brokerAccounts', 'Broker & Trading Accounts')}</h3>
          <span class="sub">${t('brokerAccountsSub', 'Configured trading gateways with unified routing and balance aggregation')}</span>
        </div>
        <button class="btn sm primary" onclick="RZ.openConnectAccount()">${ic('plus')} ${t('connectBroker', 'Connect Broker')}</button>
      </div>
      <div class="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th>${t('account', 'Account Name')}</th>
              <th>${t('broker', 'Broker / Gateway')}</th>
              <th>${t('server', 'Server')}</th>
              <th>${t('login', 'Login #')}</th>
              <th>${t('leverage', 'Leverage')}</th>
              <th style="text-align:right">${t('balance', 'Balance')}</th>
              <th style="text-align:right">${t('equity', 'Equity')}</th>
              <th>${t('status', 'Status')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${accounts.map(a => `<tr>
              <td><b>${a.name}</b></td>
              <td><span class="chip">${a.broker}</span></td>
              <td class="mono muted" style="font-size:11.5px">${a.server}</td>
              <td class="mono">${a.accountNumber}</td>
              <td class="mono">${a.leverage}</td>
              <td class="mono" style="text-align:right">${window.fmtM(a.balance)} ${a.currency}</td>
              <td class="mono up" style="text-align:right">${window.fmtM(a.equity)} ${a.currency}</td>
              <td><span class="badge ok"><span class="dot"></span>${a.status}</span></td>
              <td class="cell-actions"><button class="btn xs danger" onclick="RZ.removeBrokerAccount('${a.id}')">${ic('trash')}</button></td>
            </tr>`).join('')}
          </tbody>
        </table>
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

  window.RZ.openConnectAccount = function() {
    const ic = window.ic;
    const t = window.t;
    window.modal(`<div class="modal-h">
      <h3>${ic('server')} ${t('connectBrokerTitle', 'Connect Broker Account')}</h3>
      <button class="x" onclick="closeModal()">${ic('x')}</button>
    </div>
    <div class="modal-b">
      <div class="hint mb16">
        ${ic('lock')}
        <div>Credentials are encrypted using AES-256-GCM. The engine establishes direct low-latency FIX or socket connections without intermediate telemetry hops.</div>
      </div>
      <div class="form-grid">
        <div class="field">
          <label>Broker / Protocol Type</label>
          <select id="nb-type">
            <option value="MetaTrader 5">MetaTrader 5 (Socket Bridge EA)</option>
            <option value="Interactive Brokers">Interactive Brokers (TWS / Gateway)</option>
            <option value="Binance Prime">Binance Institutional Prime (FIX 4.4)</option>
            <option value="cTrader">cTrader Open API v2</option>
            <option value="FIX Gateway">Generic Institutional FIX 4.4 Engine</option>
          </select>
        </div>
        <div class="field">
          <label>Account Label</label>
          <input type="text" id="nb-name" placeholder="e.g. IC Markets Live VIP">
        </div>
        <div class="field">
          <label>Broker Server / Gateway Host</label>
          <input type="text" id="nb-server" placeholder="e.g. ICMarketsSC-Live or fix.binance.com">
        </div>
        <div class="field">
          <label>Account Number / Login ID</label>
          <input type="text" id="nb-num" placeholder="e.g. 5928103">
        </div>
        <div class="field">
          <label>Base Currency</label>
          <select id="nb-curr">
            <option>USD</option>
            <option>EUR</option>
            <option>GBP</option>
            <option>USDT</option>
          </select>
        </div>
        <div class="field">
          <label>Leverage</label>
          <input type="text" id="nb-lev" value="1:100">
        </div>
        <div class="field" style="grid-column:span 2">
          <label>API Key / Trader Password</label>
          <input type="password" id="nb-pass" placeholder="••••••••••••••••">
        </div>
      </div>
    </div>
    <div class="modal-f">
      <button class="btn ghost" onclick="closeModal()">${t('cancel')}</button>
      <button class="btn primary" id="nb-submit-btn">${ic('check')} Connect Account</button>
    </div>`);

    document.getElementById('nb-submit-btn').onclick = () => {
      const broker = document.getElementById('nb-type').value;
      const name = document.getElementById('nb-name').value.trim() || `${broker} Account`;
      const server = document.getElementById('nb-server').value.trim() || 'live.gateway.razor';
      const accountNumber = document.getElementById('nb-num').value.trim() || (Math.floor(1000000 + Math.random() * 9000000)).toString();
      const currency = document.getElementById('nb-curr').value;
      const leverage = document.getElementById('nb-lev').value.trim() || '1:100';

      const DB = window.DB;
      const newAcc = {
        id: 'acc-' + window.uid(),
        name,
        broker,
        server,
        accountNumber,
        type: 'Hedge Margin',
        currency,
        balance: 50000.00,
        equity: 50000.00,
        margin: 0.00,
        freeMargin: 50000.00,
        leverage,
        status: 'Connected'
      };

      if (!DB.accounts) DB.accounts = [];
      DB.accounts.push(newAcc);
      window.saveDB();
      window.closeModal();
      window.toast('Broker Account Connected', `${name} (${broker}) linked successfully.`, 'ok');
      window.ws('Event', { Type: 'BrokerAccountConnected', accountId: newAcc.id, broker, accountNumber });

      const c = document.getElementById('content');
      if (c && window.S.page === 'settings') renderSettings(c);
    };
  };

  window.RZ.removeBrokerAccount = function(id) {
    window.confirm('Disconnect broker account?', 'Active live sessions tied to this account must be re-routed.', () => {
      window.DB.accounts = (window.DB.accounts || []).filter(a => a.id !== id);
      window.saveDB();
      window.toast('Account disconnected', '', 'warn');
      const c = document.getElementById('content');
      if (c && window.S.page === 'settings') renderSettings(c);
    }, true, 'Disconnect');
  };

  window.renderSettings = renderSettings;
  if (!window.RENDER) window.RENDER = {};
  window.RENDER.settings = () => {
    const c = document.getElementById('content');
    if (c) renderSettings(c);
  };
})();
