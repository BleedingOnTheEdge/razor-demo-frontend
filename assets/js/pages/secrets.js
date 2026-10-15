/* ============================================================
   RAZOR CLOUD — Secrets Vault Page Renderer
   ============================================================ */
(function() {
  function renderSecrets(container) {
    const t = window.t;
    const ic = window.ic;

    let html = `<div class="page-head">
      <div>
        <h1>${t('secrets')}</h1>
        <p>Broker API keys and secrets stored in Cloud. The engine fetches them over the encrypted AES-256-GCM channel on demand — never persisted on engine disk.</p>
      </div>
      <div class="page-actions">
        <button class="btn primary" onclick="RZ.openSecret()">${ic('plus')} ${t('addSecret')}</button>
      </div>
    </div>`;

    html += `<div class="card">
      <div class="tbl-wrap">
        <table>
          <thead><tr><th>Name</th><th>Broker</th><th>Value</th><th>${t('created')}</th><th></th></tr></thead>
          <tbody id="sec-list"></tbody>
        </table>
      </div>
    </div>`;

    html += `<div class="hint mt16">${ic('shield')}<div>Secrets are encrypted at rest and in transit. Reveal only when needed; the engine retrieves them via the per-session key derived from ECDH.</div></div>`;

    container.innerHTML = html;
    renderSecList();
  }

  function renderSecList() {
    const el = document.getElementById('sec-list');
    if (!el) return;
    const ic = window.ic;

    el.innerHTML = window.DB.secrets.map(s => `<tr>
      <td><b>${s.name}</b></td>
      <td><span class="chip">${s.broker}</span></td>
      <td class="mono" id="sec-${s.id}"><span class="mask">••••••••${s.val.slice(-4)}</span></td>
      <td class="mono muted">${window.ago(s.created)}</td>
      <td class="cell-actions">
        <button class="btn xs ghost" onclick="RZ.revealSec('${s.id}')" title="Reveal / Hide">${ic('eye')}</button>
        <button class="btn xs ghost" onclick="RZ.copy('${s.val}',this)" title="Copy">${ic('copy')}</button>
        <button class="btn xs danger" onclick="RZ.delSec('${s.id}')" title="Delete">${ic('trash')}</button>
      </td>
    </tr>`).join('');
  }

  window.RZ = window.RZ || {};
  window.RZ.openSecret = function() {
    const ic = window.ic;

    window.modal(`<div class="modal-h"><h3>Add Secret</h3><button class="x" onclick="closeModal()">${ic('x')}</button></div>
      <div class="modal-b">
        <div class="field"><label>Name</label><input id="se-n" value="New broker key"></div>
        <div class="field"><label>Broker</label><select id="se-b"><option>MetaTrader5</option><option>Binance</option><option>Interactive Brokers</option><option>cTrader</option></select></div>
        <div class="field"><label>Secret value</label><input id="se-v" type="password" value="xK9m2pLq7Rz4wVc8nT3"></div>
      </div>
      <div class="modal-f"><button class="btn ghost" onclick="closeModal()">${window.t('cancel')}</button><button class="btn primary" onclick="RZ.saveSec()">${ic('check')} Store encrypted</button></div>`);
  };

  window.RZ.saveSec = function() {
    const v = document.getElementById('se-v').value;
    if (!v) {
      window.toast('Empty secret', '', 'err');
      return;
    }
    window.DB.secrets.unshift({
      id: window.uid(),
      name: document.getElementById('se-n').value,
      broker: document.getElementById('se-b').value,
      val: v,
      created: Date.now()
    });
    window.saveDB();
    window.closeModal();
    renderSecList();
    window.toast('Secret stored', 'encrypted at rest', 'ok');
  };

  window.RZ.revealSec = function(id) {
    const s = window.DB.secrets.find(x => x.id === id);
    if (!s) return;
    const el = document.getElementById('sec-' + id);
    if (!el) return;

    if (el.dataset.shown) {
      el.innerHTML = '<span class="mask">••••••••' + s.val.slice(-4) + '</span>';
      el.dataset.shown = '';
    } else {
      el.innerHTML = '<span class="mono">' + s.val + '</span>';
      el.dataset.shown = '1';
    }
  };

  window.RZ.delSec = function(id) {
    window.confirm('Delete secret?', 'This revokes the stored credential from Cloud.', () => {
      window.DB.secrets = window.DB.secrets.filter(x => x.id !== id);
      window.saveDB();
      renderSecList();
      window.toast('Secret deleted', '', 'warn');
    });
  };

  window.RZ.copy = function(text, btn) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    if (btn) {
      btn.classList.add('copy-ok');
      setTimeout(() => btn.classList.remove('copy-ok'), 900);
    }
    window.toast('Copied', 'to clipboard', 'info');
  };

  window.renderSecrets = renderSecrets;
  if (!window.RENDER) window.RENDER = {};
  window.RENDER.secrets = () => {
    const c = document.getElementById('content');
    if (c) renderSecrets(c);
  };
})();
