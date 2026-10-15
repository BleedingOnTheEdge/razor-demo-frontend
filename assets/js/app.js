/* ============================================================
   RAZOR CLOUD — Core Application Controller & Router
   ============================================================ */
(function() {
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];

  window.$ = $;
  window.$$ = $$;

  const NAV = {
    trader: [
      ['overview', 'overview', 'grid'],
      ['live', 'live', 'bolt'],
      ['backtest', 'backtest', 'chart'],
      ['optimization', 'optimization', 'dna'],
      ['scheduling', 'scheduling', 'cal'],
      ['extensions', 'extensions', 'puzzle'],
      ['reports', 'reports', 'file'],
      ['logs', 'logs', 'term'],
      ['secrets', 'secrets', 'key'],
      ['instances', 'instances', 'server'],
      ['settings', 'settings', 'cog']
    ],
    developer: [
      ['overview', 'overview', 'grid'],
      ['backtest', 'backtest', 'chart'],
      ['optimization', 'optimization', 'dna'],
      ['live', 'live', 'bolt'],
      ['extensions', 'extensions', 'puzzle'],
      ['scheduling', 'scheduling', 'cal'],
      ['reports', 'reports', 'file'],
      ['logs', 'logs', 'term'],
      ['secrets', 'secrets', 'key'],
      ['instances', 'instances', 'server'],
      ['settings', 'settings', 'cog']
    ],
    admin: [
      ['admin-overview', 'admin-overview', 'grid'],
      ['admin-users', 'admin-users', 'users'],
      ['admin-licenses', 'admin-licenses', 'award'],
      ['admin-engines', 'admin-engines', 'server'],
      ['admin-broadcasts', 'admin-broadcasts', 'mega'],
      ['admin-marketplace', 'admin-marketplace', 'store'],
      ['admin-features', 'admin-features', 'sliders'],
      ['admin-audit', 'admin-audit', 'shield']
    ]
  };

  window.NAV = NAV;

  window.RZ = window.RZ || {};

  // Navigation Rendering
  window.renderNav = function() {
    const S = window.S;
    const navEl = $('#sbNav');
    if (!navEl) return;

    const items = NAV[S.role] || NAV.trader;
    const groupName = S.role === 'admin' ? window.t('adminGroup') : window.t('workspaceGroup');
    let html = `<div class="sb-group">${groupName}</div>`;

    items.forEach(([id, i18nKey, icon]) => {
      const label = window.t(i18nKey, id);
      html += `<div class="nav-item ${S.page === id ? 'active' : ''}" data-page="${id}" onclick="RZ.go('${id}')">
        ${window.ic(icon)}
        <span>${label}</span>
      </div>`;
    });

    navEl.innerHTML = html;
  };

  // Page Routing
  window.RZ.go = function(page, updateHash = true) {
    if (!page) page = 'overview';
    window.S.page = page;

    if (updateHash && window.location.pathname.endsWith('admin.html')) {
      window.location.hash = page;
    } else if (updateHash && (window.location.pathname.endsWith('workspace.html') || window.location.pathname.endsWith('index.html'))) {
      window.location.hash = page;
    }

    // Update active nav items
    $$('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === page));

    // Update Topbar Title
    const titleEl = $('#tbTitle');
    if (titleEl) {
      titleEl.innerHTML = window.t(page, page);
    }

    const content = $('#content');
    if (content) {
      content.scrollTop = 0;
      if (window.RENDER && window.RENDER[page]) {
        window.RENDER[page]();
      } else {
        content.innerHTML = `<div class="empty">Page view for "${page}" not found.</div>`;
      }
    }

    const sidebar = $('#sidebar');
    if (sidebar && window.innerWidth <= 760) {
      sidebar.classList.remove('open');
    }
  };

  window.RZ.toggleSidebar = function() {
    const sb = $('#sidebar');
    if (sb) sb.classList.toggle('open');
  };

  // Topbar Clock & Heartbeat
  function startClock() {
    window.every(1000, () => {
      const clk = $('#tbClock');
      if (clk) clk.textContent = window.utcStr();
    });
  }

  function startHeartbeat() {
    window.every(6000, () => {
      window.DB.engines.forEach(e => {
        if (e.status === 'online') {
          e.cpu = window.clamp(e.cpu + (Math.random() * 10 - 5), 8, 92);
          e.mem = window.clamp(e.mem + (Math.random() * 6 - 3), 20, 88);
          e.tickAge = window.clamp((e.tickAge || 100) + Math.floor(Math.random() * 60 - 30), 40, 520);
        }
      });

      const lat = 30 + Math.floor(Math.random() * 40);
      const latEl = $('#tbLat');
      if (latEl) latEl.textContent = window.fmtN(lat) + 'ms';

      window.ws('Heartbeat', { Status: 'OK', ServerTime: window.utcStr(), NextIntervalSeconds: 6, AuthValid: true });

      if (window.S.page === 'overview' && window.RENDER && window.RENDER.overview) window.RENDER.overview();
      if (window.S.page === 'live' && window.S.live.running) {
        const tag = $('#lv-tickage');
        if (tag) tag.textContent = window.fmtN(window.S.live.tickAge) + 'ms';
      }
      if (window.S.page === 'admin-engines' && window.RENDER && window.RENDER['admin-engines']) window.RENDER['admin-engines']();
    });
  }

  // Notifications
  window.renderNotifs = function() {
    const list = $('#notifList');
    const dot = $('#bellDot');
    if (!list) return;

    const unread = window.DB.notifs.length;
    if (dot) dot.style.display = unread ? 'block' : 'none';

    list.innerHTML = window.DB.notifs.map(n => `<div class="notif-item">
      <div class="ic">${window.ic(n.ic)}</div>
      <div>
        <div class="tt">${n.t}</div>
        <div class="ds">${n.d}</div>
        <div class="tm">${window.ago(n.tm)}</div>
      </div>
    </div>`).join('') || `<div class="empty">${window.t('noNotifications')}</div>`;
  };

  window.RZ.toggleNotifs = function(e) {
    if (e) e.stopPropagation();
    const p = $('#notifPanel');
    const u = $('#userMenu');
    if (p) p.classList.toggle('open');
    if (u) u.classList.remove('open');
  };

  window.RZ.markNotifs = function() {
    window.DB.notifs = [];
    window.saveDB();
    window.renderNotifs();
    window.toast('Notifications', 'All marked as read.', 'info');
  };

  window.RZ.toggleUser = function(e) {
    if (e) e.stopPropagation();
    const u = $('#userMenu');
    const p = $('#notifPanel');
    if (u) u.classList.toggle('open');
    if (p) p.classList.remove('open');
  };

  window.RZ.closeMenus = function() {
    const u = $('#userMenu');
    const p = $('#notifPanel');
    if (u) u.classList.remove('open');
    if (p) p.classList.remove('open');
  };

  document.addEventListener('click', e => {
    if (!e.target.closest('.notif-panel') && !e.target.closest('#tbBell')) {
      const p = $('#notifPanel');
      if (p) p.classList.remove('open');
    }
    if (!e.target.closest('.user-menu') && !e.target.closest('.tb-user')) {
      const u = $('#userMenu');
      if (u) u.classList.remove('open');
    }
  });

  // Modal & Toast
  window.modal = function(html, opts = {}) {
    let r = $('#modalRoot');
    if (!r) {
      r = document.createElement('div');
      r.id = 'modalRoot';
      document.body.appendChild(r);
    }
    r.innerHTML = `<div class="modal ${opts.lg ? 'lg' : ''}">${html}</div>`;
    r.classList.add('open');
    r.onclick = e => { if (e.target === r) window.closeModal(); };
  };

  window.closeModal = function() {
    const r = $('#modalRoot');
    if (r) {
      r.classList.remove('open');
      r.innerHTML = '';
    }
  };

  window.confirm = function(title, msg, yes, danger = false, yesLabel = '') {
    const label = yesLabel || window.t('confirm');
    window.modal(`<div class="modal-h"><h3>${title}</h3><button class="x" onclick="closeModal()">${window.ic('x')}</button></div>
      <div class="modal-b"><p style="color:var(--mut);font-size:13px">${msg}</p></div>
      <div class="modal-f"><button class="btn ghost" onclick="closeModal()">${window.t('cancel')}</button><button class="btn ${danger ? 'danger' : 'primary'}" id="cfmYes">${label}</button></div>`);
    const btn = $('#cfmYes');
    if (btn) {
      btn.onclick = () => {
        window.closeModal();
        yes();
      };
    }
  };

  window.toast = function(title, msg, type = 'info') {
    let r = $('#toastRoot');
    if (!r) {
      r = document.createElement('div');
      r.id = 'toastRoot';
      document.body.appendChild(r);
    }
    const t = document.createElement('div');
    t.className = 'toast ' + type;
    const i = { ok: 'check', err: 'alert', warn: 'alert', info: 'info' }[type] || 'info';
    t.innerHTML = `<div class="ic">${window.ic(i)}</div><div><div class="tt">${title}</div>${msg ? `<div class="tm">${msg}</div>` : ''}</div>`;
    r.appendChild(t);
    setTimeout(() => {
      t.style.transition = '.3s';
      t.style.opacity = '0';
      const isRtl = document.documentElement.getAttribute('dir') === 'rtl';
      t.style.transform = isRtl ? 'translateX(-30px)' : 'translateX(30px)';
      setTimeout(() => t.remove(), 300);
    }, 4200);
  };

  // Command Palette
  function buildPalette() {
    const S = window.S;
    const navItems = (NAV[S.role] || NAV.trader).map(([id, i18nKey, icon]) => ({
      label: window.t(i18nKey, id),
      grp: 'Page',
      icon,
      act: () => window.RZ.go(id)
    }));

    const acts = [
      { label: window.t('startLiveSession'), grp: 'Action', icon: 'play', act: () => { window.RZ.go('live'); window.RZ.startLive(); } },
      { label: window.t('runBacktest'), grp: 'Action', icon: 'chart', act: () => { window.RZ.go('backtest'); } },
      { label: window.t('startOptimization'), grp: 'Action', icon: 'dna', act: () => { window.RZ.go('optimization'); } },
      { label: window.t('wsConsole'), grp: 'Action', icon: 'term', act: () => window.toggleConsole() },
      { label: window.i18n.currentCulture === 'fa-IR' ? 'تغییر زبان به انگلیسی (en-US)' : 'Switch Language to Persian (فارسی)', grp: 'System', icon: 'globe', act: () => window.i18n.toggleCulture() },
      { label: window.t('logout'), grp: 'Action', icon: 'logout', act: () => window.RZ.logout() }
    ];

    S.palItems = [...navItems, ...acts];
  }

  window.RZ.openPalette = function() {
    buildPalette();
    window.S.palIdx = 0;
    const input = $('#palInput');
    if (input) input.value = '';
    renderPal();
    const p = $('#palette');
    if (p) p.classList.add('open');
    setTimeout(() => { if (input) input.focus(); }, 30);
  };

  function closePalette() {
    const p = $('#palette');
    if (p) p.classList.remove('open');
  }

  function renderPal(v = '') {
    const q = v.toLowerCase();
    const list = window.S.palItems.filter(i => i.label.toLowerCase().includes(q));
    window.S.palIdx = window.clamp(window.S.palIdx, 0, Math.max(0, list.length - 1));
    const palList = $('#palList');
    if (!palList) return;

    palList.innerHTML = list.map((i, idx) => `<div class="palette-item ${idx === window.S.palIdx ? 'sel' : ''}" data-i="${idx}" onclick="RZ.palPick(${idx})">
      ${window.ic(i.icon)}
      <span>${i.label}</span>
      <span class="grp">${i.grp}</span>
    </div>`).join('') || '<div class="empty">No matches</div>';

    window.S._palList = list;
  }

  window.RZ.palFilter = function(v) { renderPal(v); };
  window.RZ.palPick = function(idx) {
    const it = window.S._palList[idx];
    closePalette();
    if (it && it.act) it.act();
  };

  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      const pal = $('#palette');
      if (pal && pal.classList.contains('open')) closePalette();
      else window.RZ.openPalette();
    }
    if (e.key === 'Escape') {
      closePalette();
      window.closeModal();
    }
    const pal = $('#palette');
    if (pal && pal.classList.contains('open')) {
      const list = window.S._palList || [];
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        window.S.palIdx = window.clamp(window.S.palIdx + 1, 0, list.length - 1);
        renderPal($('#palInput').value);
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        window.S.palIdx = window.clamp(window.S.palIdx - 1, 0, list.length - 1);
        renderPal($('#palInput').value);
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (list[window.S.palIdx]) window.RZ.palPick(window.S.palIdx);
      }
    }
  });

  // Auth & Login
  let pickedRole = 'trader';
  window.RZ.pickRole = function(r) {
    pickedRole = r;
    $$('.role-card').forEach(c => c.classList.toggle('sel', c.dataset.role === r));
    const u = window.USERS.find(x => x.role === r);
    if (u) {
      const em = $('#li-email');
      const ps = $('#li-pass');
      const err = $('#li-err');
      if (em) em.value = u.email;
      if (ps) ps.value = u.pass;
      if (err) err.textContent = '';
    }
  };

  window.RZ.fillCreds = function(e, p, r) {
    const em = $('#li-email');
    const ps = $('#li-pass');
    if (em) em.value = e;
    if (ps) ps.value = p;
    window.RZ.pickRole(r);
  };

  window.RZ.doLogin = function(ev) {
    if (ev) ev.preventDefault();
    const em = $('#li-email');
    const ps = $('#li-pass');
    const err = $('#li-err');
    if (!em || !ps) return;

    const email = em.value.trim();
    const pass = ps.value;
    const u = window.USERS.find(x => x.email === email && x.pass === pass);

    if (!u) {
      if (err) err.textContent = window.t('invalidCredentials');
      return;
    }

    window.saveUserSession(u);

    // If on index.html (standalone login), navigate to workspace.html or admin.html
    const isIndexPage = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/') || window.location.pathname === '';
    if (isIndexPage && $('#loginView') && !$('#appView')) {
      const target = u.role === 'admin' ? 'admin.html' : 'workspace.html';
      window.location.href = target;
      return;
    }

    // Single-page shell transition
    const loginView = $('#loginView');
    const appView = $('#appView');
    if (loginView) loginView.classList.add('hidden');
    if (appView) appView.classList.remove('hidden');

    window.initUserBar(u);
    window.renderNav();
    window.renderNotifs();
    startClock();
    startHeartbeat();
    window.every(2200, window.logTick);

    window.ws('Auth', { Username: u.email, EngineVersion: '1.0.0 LTS', PublicKey: 'ECDH-ephemeral-…' });
    setTimeout(() => window.ws('Auth', { Type: 'AuthResponse', Status: 'Success', SessionId: window.uid() }), 300);
    setTimeout(() => window.ws('Auth', { Type: 'AuthAck', encrypted: 'AES-256-GCM' }), 600);

    const startPage = u.role === 'admin' ? 'admin-overview' : (u.role === 'developer' ? 'backtest' : 'overview');
    window.RZ.go(startPage);

    setTimeout(() => window.toast('Welcome, ' + u.name.split(' ')[0], 'Press Ctrl+K for command palette.', 'info'), 500);
  };

  window.RZ.logout = function() {
    window.closeMenus();
    window.TIMERS.forEach(clearInterval);
    window.TIMERS.length = 0;
    if (window.S._liveLoop) {
      clearInterval(window.S._liveLoop);
      window.S._liveLoop = null;
    }
    window.S.live.running = false;
    window.S.bt.running = false;
    window.S.opt.running = false;
    window.saveUserSession(null);

    // If multi-page:
    if (!window.location.pathname.endsWith('index.html')) {
      window.location.href = 'index.html';
      return;
    }

    const appView = $('#appView');
    const loginView = $('#loginView');
    if (appView) appView.classList.add('hidden');
    if (loginView) loginView.classList.remove('hidden');
    const con = $('#console');
    if (con) con.classList.remove('open');
    const err = $('#li-err');
    if (err) err.textContent = '';
  };

  window.initUserBar = function(u = window.S.user) {
    if (!u) return;
    const tbName = $('#tbName');
    const tbRole = $('#tbRole');
    const tbAvatar = $('#tbAvatar');
    const umName = $('#umName');
    const umEmail = $('#umEmail');

    if (tbName) tbName.textContent = u.name;
    if (tbRole) tbRole.textContent = u.tier;
    if (tbAvatar) tbAvatar.textContent = u.av;
    if (umName) umName.textContent = u.name;
    if (umEmail) umEmail.textContent = u.email;
  };

  // Static icon initialization
  window.initStaticIcons = function() {
    const rcT = $('#rc-trader'), rcD = $('#rc-developer'), rcA = $('#rc-admin');
    if (rcT) rcT.innerHTML = window.ic('bolt');
    if (rcD) rcD.innerHTML = window.ic('term');
    if (rcA) rcA.innerHTML = window.ic('shield');

    const liIc = $('#li-ic'), dhH = $('#dh-h');
    if (liIc) liIc.innerHTML = window.ic('lock');
    if (dhH) dhH.innerHTML = window.ic('info') + ' ' + window.t('demoHintTitle');

    const menuBtn = $('#menuBtn');
    if (menuBtn) menuBtn.innerHTML = window.ic('menu');

    const searchIc = $('#tbSearchIc');
    if (searchIc) searchIc.innerHTML = window.ic('search');

    const consoleBtn = $('#tbConsoleBtn');
    if (consoleBtn) consoleBtn.innerHTML = window.ic('term');

    const bellBtn = $('#tbBell');
    if (bellBtn) bellBtn.innerHTML = window.ic('bell') + '<span class="badge-dot" id="bellDot"></span>';

    const umSet = $('#umSettingsIc'), umPal = $('#umPalIc'), umOut = $('#umOutIc');
    if (umSet) umSet.innerHTML = window.ic('cog');
    if (umPal) umPal.innerHTML = window.ic('cmd');
    if (umOut) umOut.innerHTML = window.ic('logout');

    const conIc = $('#conIc'), conClr = $('#conClear'), conCls = $('#conClose'), palIc = $('#palIc');
    if (conIc) conIc.innerHTML = window.ic('radio');
    if (conClr) conClr.innerHTML = window.ic('trash');
    if (conCls) conCls.innerHTML = window.ic('x');
    if (palIc) palIc.innerHTML = window.ic('search');

    const langBtn = $('#tbLangSwitch');
    if (langBtn) {
      const isFa = window.i18n && window.i18n.currentCulture === 'fa-IR';
      langBtn.innerHTML = window.ic('globe') + ' ' + (isFa ? 'EN' : 'فا');
    }
  };

  // App bootstrap on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    window.initStaticIcons();
    window.initUserBar();

    // Check if appView exists (e.g. workspace.html or admin.html)
    const appView = $('#appView');
    if (appView) {
      window.renderNav();
      window.renderNotifs();
      startClock();
      startHeartbeat();
      window.every(2200, window.logTick);

      // Check URL hash or initial page
      let startPage = window.location.hash.replace('#', '');
      if (!startPage) {
        startPage = window.S.role === 'admin' ? 'admin-overview' : (window.S.role === 'developer' ? 'backtest' : 'overview');
      }
      window.RZ.go(startPage, false);
    }
  });
})();
