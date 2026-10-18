/* ============================================================
   RAZOR CLOUD — Support & Incident Ticketing System
   Implements Ticket.cs, TicketEndpoints.cs, TicketTargetType,
   TicketCategory, TicketPriority, TicketStatus
   ============================================================ */
(function() {
  let filterTarget = 'ALL';
  let filterCategory = 'ALL';
  let filterPriority = 'ALL';
  let filterStatus = 'ALL';
  let searchQuery = '';

  function renderTickets(container) {
    const t = window.t;
    const ic = window.ic;
    const DB = window.DB;
    const tickets = DB.tickets || [];

    const openCount = tickets.filter(tk => tk.status === 'Open' || tk.status === 'InProgress').length;
    const criticalCount = tickets.filter(tk => (tk.priority === 'Critical' || tk.priority === 'High') && tk.status !== 'Closed').length;
    const resolvedCount = tickets.filter(tk => tk.status === 'Resolved' || tk.status === 'Closed').length;
    const avgResponseTime = '18m';

    let html = `<div class="page-head">
      <div>
        <h1>${t('supportTickets', 'Support & Incidents')}</h1>
        <p>${t('ticketsSubtitle', 'Unified ticketing plane spanning Cloud System Managers and Marketplace Additive Developers.')}</p>
      </div>
      <div class="page-actions">
        <button class="btn primary" onclick="RZ.openNewTicket()">${ic('plus')} ${t('newTicket', 'New Ticket')}</button>
      </div>
    </div>`;

    // Metrics Overview
    html += `<div class="grid g4 mb16">
      <div class="stat">
        <div class="lbl">${t('openTickets', 'Open Tickets')}</div>
        <div class="val ${openCount > 0 ? 'up' : 'muted'}">${window.fmtN(openCount)}</div>
        <div class="delta ${openCount > 0 ? 'warn' : 'ok'}">${t('activeTriage', 'Active triage')}</div>
        <div class="ic">${ic('ticket')}</div>
      </div>
      <div class="stat">
        <div class="lbl">${t('criticalIncidents', 'Critical / High')}</div>
        <div class="val ${criticalCount > 0 ? 'down' : 'ok'}">${window.fmtN(criticalCount)}</div>
        <div class="delta ${criticalCount > 0 ? 'down' : 'ok'}">${criticalCount > 0 ? t('urgentAttention', 'Requires action') : t('allNormal', 'Fleet normal')}</div>
        <div class="ic">${ic('alert')}</div>
      </div>
      <div class="stat">
        <div class="lbl">${t('resolvedTickets', 'Resolved')}</div>
        <div class="val ok">${window.fmtN(resolvedCount)}</div>
        <div class="delta ok">${t('slaMet', 'SLA 99.8%')}</div>
        <div class="ic">${ic('check')}</div>
      </div>
      <div class="stat">
        <div class="lbl">${t('avgResponseTime', 'Avg Response')}</div>
        <div class="val">${avgResponseTime}</div>
        <div class="delta up">${t('fastResolution', 'Sub-hour response')}</div>
        <div class="ic">${ic('bolt')}</div>
      </div>
    </div>`;

    // Filtering & Search Control Bar
    html += `<div class="card flat mb16">
      <div class="flex aic jcb" style="flex-wrap:wrap;gap:12px">
        <div class="flex aic gap8" style="flex-wrap:wrap">
          <span class="muted" style="font-size:12px;font-weight:600">${t('targetRouting', 'Target')}:</span>
          <div class="tag-row" style="margin:0">
            <button class="chip ${filterTarget === 'ALL' ? 'on' : ''}" onclick="RZ.filterTicketTarget('ALL')">${t('all', 'All')}</button>
            <button class="chip ${filterTarget === 'SystemManager' ? 'on' : ''}" onclick="RZ.filterTicketTarget('SystemManager')">${ic('server')} ${t('systemManager', 'System Manager')}</button>
            <button class="chip ${filterTarget === 'AdditiveDeveloper' ? 'on' : ''}" onclick="RZ.filterTicketTarget('AdditiveDeveloper')">${ic('puzzle')} ${t('additiveDeveloper', 'Additive Dev')}</button>
          </div>
        </div>
        <div class="flex aic gap8">
          <div class="field" style="margin:0;min-width:240px">
            <input type="text" id="tk-search" placeholder="${t('searchTickets', 'Search tickets, IDs, authors…')}" value="${searchQuery}" oninput="RZ.searchTickets(this.value)" style="padding:6px 10px;font-size:12px">
          </div>
        </div>
      </div>
      <div class="flex aic gap12 mt12" style="flex-wrap:wrap;border-top:1px solid var(--line);padding-top:12px">
        <div class="flex aic gap8">
          <span class="muted" style="font-size:12px">${t('priority', 'Priority')}:</span>
          <select id="tk-filter-prio" onchange="RZ.filterTicketPriority(this.value)" style="padding:4px 8px;border-radius:6px;border:1px solid var(--line);background:var(--bg2);color:var(--txt);font-size:11px">
            <option value="ALL" ${filterPriority === 'ALL' ? 'selected' : ''}>${t('all', 'All')}</option>
            <option value="Critical" ${filterPriority === 'Critical' ? 'selected' : ''}>Critical</option>
            <option value="High" ${filterPriority === 'High' ? 'selected' : ''}>High</option>
            <option value="Medium" ${filterPriority === 'Medium' ? 'selected' : ''}>Medium</option>
            <option value="Low" ${filterPriority === 'Low' ? 'selected' : ''}>Low</option>
          </select>
        </div>
        <div class="flex aic gap8">
          <span class="muted" style="font-size:12px">${t('category', 'Category')}:</span>
          <select id="tk-filter-cat" onchange="RZ.filterTicketCategory(this.value)" style="padding:4px 8px;border-radius:6px;border:1px solid var(--line);background:var(--bg2);color:var(--txt);font-size:11px">
            <option value="ALL" ${filterCategory === 'ALL' ? 'selected' : ''}>${t('all', 'All')}</option>
            <option value="Incident" ${filterCategory === 'Incident' ? 'selected' : ''}>Incident</option>
            <option value="Bug" ${filterCategory === 'Bug' ? 'selected' : ''}>Bug</option>
            <option value="FeatureRequest" ${filterCategory === 'FeatureRequest' ? 'selected' : ''}>Feature Request</option>
            <option value="Billing" ${filterCategory === 'Billing' ? 'selected' : ''}>Billing</option>
            <option value="General" ${filterCategory === 'General' ? 'selected' : ''}>General</option>
          </select>
        </div>
        <div class="flex aic gap8">
          <span class="muted" style="font-size:12px">${t('status', 'Status')}:</span>
          <select id="tk-filter-status" onchange="RZ.filterTicketStatus(this.value)" style="padding:4px 8px;border-radius:6px;border:1px solid var(--line);background:var(--bg2);color:var(--txt);font-size:11px">
            <option value="ALL" ${filterStatus === 'ALL' ? 'selected' : ''}>${t('all', 'All')}</option>
            <option value="Open" ${filterStatus === 'Open' ? 'selected' : ''}>Open</option>
            <option value="InProgress" ${filterStatus === 'InProgress' ? 'selected' : ''}>In Progress</option>
            <option value="Resolved" ${filterStatus === 'Resolved' ? 'selected' : ''}>Resolved</option>
            <option value="Closed" ${filterStatus === 'Closed' ? 'selected' : ''}>Closed</option>
          </select>
        </div>
      </div>
    </div>`;

    // Tickets Table
    html += `<div class="card">
      <div class="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th style="width:70px">ID</th>
              <th>${t('title', 'Title')} &amp; ${t('description', 'Description')}</th>
              <th>${t('targetRouting', 'Target')}</th>
              <th>${t('category', 'Category')}</th>
              <th>${t('priority', 'Priority')}</th>
              <th>${t('author', 'Author')}</th>
              <th>${t('status', 'Status')}</th>
              <th>${t('created', 'Created')}</th>
              <th style="text-align:right">${t('actions', 'Actions')}</th>
            </tr>
          </thead>
          <tbody id="tk-table-body"></tbody>
        </table>
      </div>
    </div>`;

    container.innerHTML = html;
    renderTicketsList();
  }

  function getFilteredTickets() {
    const DB = window.DB;
    let list = DB.tickets || [];

    if (filterTarget !== 'ALL') {
      list = list.filter(tk => tk.targetType === filterTarget);
    }
    if (filterCategory !== 'ALL') {
      list = list.filter(tk => tk.category === filterCategory);
    }
    if (filterPriority !== 'ALL') {
      list = list.filter(tk => tk.priority === filterPriority);
    }
    if (filterStatus !== 'ALL') {
      list = list.filter(tk => tk.status === filterStatus);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(tk =>
        tk.id.toLowerCase().includes(q) ||
        tk.title.toLowerCase().includes(q) ||
        (tk.desc && tk.desc.toLowerCase().includes(q)) ||
        tk.authorName.toLowerCase().includes(q) ||
        (tk.targetItemName && tk.targetItemName.toLowerCase().includes(q))
      );
    }
    return list;
  }

  function renderTicketsList() {
    const tbody = document.getElementById('tk-table-body');
    if (!tbody) return;
    const list = getFilteredTickets();
    const t = window.t;
    const ic = window.ic;

    if (!list.length) {
      tbody.innerHTML = `<tr><td colspan="9" class="empty">${ic('ticket')}<div>${t('noMatchingTickets', 'No tickets match the selected filters.')}</div></td></tr>`;
      return;
    }

    tbody.innerHTML = list.map(tk => {
      const pColor = {
        Critical: 'badge err',
        High: 'badge warn',
        Medium: 'badge vio',
        Low: 'badge muted'
      }[tk.priority] || 'badge muted';

      const sColor = {
        Open: 'badge warn',
        InProgress: 'badge vio',
        Resolved: 'badge ok',
        Closed: 'badge muted'
      }[tk.status] || 'badge muted';

      const targetBadge = tk.targetType === 'SystemManager'
        ? `<span class="chip on">${ic('server')} System Manager</span>`
        : `<span class="chip">${ic('puzzle')} ${tk.targetItemName || 'Additive'}</span>`;

      return `<tr>
        <td class="mono"><b>${tk.id}</b></td>
        <td>
          <div style="font-weight:600;font-size:13.5px;color:var(--txt);cursor:pointer" onclick="RZ.openTicketDetail('${tk.id}')">${tk.title}</div>
          <div class="muted" style="font-size:11.5px;line-height:1.4;margin-top:2px;max-width:380px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${tk.desc || ''}</div>
        </td>
        <td>${targetBadge}</td>
        <td><span class="chip">${tk.category}</span></td>
        <td><span class="${pColor}">${tk.priority}</span></td>
        <td>
          <div class="flex aic gap6">
            <div class="avatar" style="width:22px;height:22px;font-size:10px">${tk.authorName.split(' ').map(x => x[0]).join('')}</div>
            <span style="font-size:12px">${tk.authorName}</span>
          </div>
        </td>
        <td><span class="${sColor}"><span class="dot"></span>${tk.status}</span></td>
        <td class="mono muted" style="font-size:11px">${window.ago(tk.createdAt)}</td>
        <td class="cell-actions" style="text-align:right">
          <button class="btn xs ghost" onclick="RZ.openTicketDetail('${tk.id}')">${ic('chat')} ${t('viewThread', 'View')}</button>
        </td>
      </tr>`;
    }).join('');
  }

  window.RZ = window.RZ || {};

  window.RZ.filterTicketTarget = function(tgt) {
    filterTarget = tgt;
    const c = document.getElementById('content');
    if (c) renderTickets(c);
  };

  window.RZ.filterTicketCategory = function(cat) {
    filterCategory = cat;
    renderTicketsList();
  };

  window.RZ.filterTicketPriority = function(prio) {
    filterPriority = prio;
    renderTicketsList();
  };

  window.RZ.filterTicketStatus = function(stat) {
    filterStatus = stat;
    renderTicketsList();
  };

  window.RZ.searchTickets = function(q) {
    searchQuery = q.trim();
    renderTicketsList();
  };

  window.RZ.openTicketDetail = function(ticketId) {
    const DB = window.DB;
    const tk = (DB.tickets || []).find(x => x.id === ticketId);
    if (!tk) return;

    const msgs = (DB.ticketMessages || []).filter(m => m.ticketId === ticketId);
    const t = window.t;
    const ic = window.ic;

    const targetBadge = tk.targetType === 'SystemManager'
      ? `<span class="chip on">${ic('server')} System Manager (Platform Core)</span>`
      : `<span class="chip">${ic('puzzle')} Additive: <b>${tk.targetItemName || 'Extension Developer'}</b></span>`;

    let html = `<div class="modal-h">
      <div>
        <div class="flex aic gap8">
          <span class="mono" style="font-weight:700;color:var(--pri)">${tk.id}</span>
          <span class="badge ${tk.status === 'Resolved' || tk.status === 'Closed' ? 'ok' : 'warn'}">${tk.status}</span>
          <span class="chip">${tk.priority}</span>
          <span class="chip">${tk.category}</span>
        </div>
        <h3 style="margin-top:6px;font-size:17px">${tk.title}</h3>
      </div>
      <button class="x" onclick="closeModal()">${ic('x')}</button>
    </div>
    <div class="modal-b" style="max-height:68vh;overflow-y:auto">
      <div class="card flat mb16" style="background:var(--bg2)">
        <div class="flex aic jcb" style="flex-wrap:wrap;gap:10px">
          <div>
            <div class="muted" style="font-size:11px">${t('routedTo', 'Routed To')}</div>
            <div class="mt4">${targetBadge}</div>
          </div>
          <div>
            <div class="muted" style="font-size:11px">${t('submitter', 'Submitter')}</div>
            <div class="flex aic gap6 mt4">
              <div class="avatar" style="width:20px;height:20px;font-size:9px">${tk.authorName.split(' ').map(x => x[0]).join('')}</div>
              <span style="font-weight:600;font-size:12px">${tk.authorName}</span>
            </div>
          </div>
          <div>
            <div class="muted" style="font-size:11px">${t('created', 'Created')}</div>
            <div class="mono mt4" style="font-size:11px">${window.ago(tk.createdAt)}</div>
          </div>
          <div class="flex aic gap8">
            <button class="btn xs ${tk.status === 'Resolved' ? 'ghost' : 'primary'}" onclick="RZ.toggleTicketStatus('${tk.id}')">
              ${ic('check')} ${tk.status === 'Resolved' ? t('reopenTicket', 'Reopen') : t('markResolved', 'Resolve Ticket')}
            </button>
          </div>
        </div>
        ${tk.desc ? `<div class="mt12 pt12" style="border-top:1px solid var(--line);font-size:13px;line-height:1.5;color:var(--txt)">${tk.desc}</div>` : ''}
      </div>

      <h4 style="font-size:13px;font-weight:600;margin-bottom:12px;color:var(--mut)">${t('conversationHistory', 'Conversation History')} (${window.fmtN(msgs.length)})</h4>

      <div class="flex-col gap12 mb16" id="tk-thread-msgs">
        ${msgs.length ? msgs.map(m => {
          const isStaff = m.isStaff || m.authorRole === 'SystemManager' || m.authorName.includes('Staff');
          return `<div class="card" style="padding:12px 14px;border-left:${isStaff ? '3px solid var(--pri)' : '3px solid var(--line)'};background:${isStaff ? 'var(--bg)' : 'var(--bg2)'}">
            <div class="flex aic jcb mb6">
              <div class="flex aic gap8">
                <div class="avatar" style="width:22px;height:22px;font-size:9px;background:${isStaff ? 'var(--pri)' : 'var(--bg3)'};color:${isStaff ? '#fff' : 'var(--txt)'}">
                  ${m.authorName.split(' ').map(x => x[0]).join('')}
                </div>
                <span style="font-weight:600;font-size:12.5px">${m.authorName}</span>
                ${isStaff ? `<span class="badge vio" style="font-size:9.5px">${ic('shield')} Staff / Resolver</span>` : ''}
              </div>
              <span class="mono muted" style="font-size:11px">${window.ago(m.createdAt)}</span>
            </div>
            <div style="font-size:12.5px;line-height:1.5;color:var(--txt);white-space:pre-wrap">${m.message}</div>
          </div>`;
        }).join('') : `<div class="empty" style="padding:16px">${t('noMessagesYet', 'No messages in this ticket thread yet.')}</div>`}
      </div>

      <div class="card flat" style="border:1px solid var(--line);background:var(--bg)">
        <label style="font-size:12px;font-weight:600;color:var(--txt);margin-bottom:6px;display:block">${t('addResponse', 'Post a Response')}</label>
        <textarea id="tk-new-msg" rows="3" placeholder="${t('typeYourReply', 'Type your reply or diagnostic findings…')}" style="width:100%;border-radius:8px;border:1px solid var(--line);background:var(--bg2);color:var(--txt);padding:8px 10px;font-size:12.5px;resize:vertical"></textarea>
        <div class="flex aic jcb mt8">
          <div class="flex aic gap8">
            <label class="flex aic gap6" style="font-size:11.5px;color:var(--mut);cursor:pointer">
              <input type="checkbox" id="tk-reply-as-staff" ${window.S.role === 'admin' ? 'checked' : ''}>
              ${t('replyAsStaff', 'Reply as Staff / Author')}
            </label>
          </div>
          <button class="btn sm primary" onclick="RZ.sendTicketReply('${tk.id}')">${ic('chat')} ${t('sendReply', 'Send Response')}</button>
        </div>
      </div>
    </div>
    <div class="modal-f">
      <button class="btn ghost" onclick="closeModal()">${t('close', 'Close')}</button>
    </div>`;

    window.modal(html, { lg: true });
  }

  window.RZ.toggleTicketStatus = function(ticketId) {
    const DB = window.DB;
    const tk = (DB.tickets || []).find(x => x.id === ticketId);
    if (!tk) return;

    tk.status = tk.status === 'Resolved' ? 'InProgress' : 'Resolved';
    window.saveDB();
    window.toast(
      tk.status === 'Resolved' ? 'Ticket resolved' : 'Ticket reopened',
      `Status updated to ${tk.status}.`,
      tk.status === 'Resolved' ? 'ok' : 'info'
    );
    window.ws('Event', { Type: 'TicketStatusChanged', ticketId, newStatus: tk.status });
    window.closeModal();
    renderTicketsList();
  };

  window.RZ.sendTicketReply = function(ticketId) {
    const msgInput = document.getElementById('tk-new-msg');
    if (!msgInput) return;
    const text = msgInput.value.trim();
    if (!text) {
      window.toast('Empty response', 'Please enter a response message.', 'warn');
      return;
    }

    const asStaff = document.getElementById('tk-reply-as-staff')?.checked;
    const DB = window.DB;
    const S = window.S;

    const newReply = {
      id: 'tm-' + (DB.ticketMessages.length + 1),
      ticketId,
      authorName: asStaff ? 'Aria Sterling (Staff)' : (S.user ? S.user.name : 'Elena Voss'),
      isStaff: !!asStaff,
      authorRole: asStaff ? 'SystemManager' : 'User',
      message: text,
      createdAt: Date.now()
    };

    DB.ticketMessages.push(newReply);

    const tk = DB.tickets.find(x => x.id === ticketId);
    if (tk && tk.status === 'Open') {
      tk.status = 'InProgress';
    }

    window.saveDB();
    window.toast('Response posted', 'Notification dispatched to ticket participants.', 'ok');
    window.ws('Event', { Type: 'TicketMessageAdded', ticketId, author: newReply.authorName });

    // Refresh modal view
    window.RZ.openTicketDetail(ticketId);
    renderTicketsList();
  };

  window.RZ.openNewTicket = function() {
    const t = window.t;
    const ic = window.ic;
    const DB = window.DB;
    const extensions = DB.extensions || [];

    let html = `<div class="modal-h">
      <h3>${ic('ticket')} ${t('createSupportTicket', 'Open Support Ticket')}</h3>
      <button class="x" onclick="closeModal()">${ic('x')}</button>
    </div>
    <div class="modal-b">
      <div class="hint mb16">
        ${ic('info')}
        <div>${t('ticketRoutingHint', 'Tickets can be routed directly to Cloud System Managers (infrastructure, licensing, billing) or Marketplace Additive Developers (adapters, strategies, neural networks).')}</div>
      </div>
      <div class="form-grid">
        <div class="field" style="grid-column:span 2">
          <label>${t('targetRouting', 'Target Routing')}</label>
          <select id="nt-target" onchange="document.getElementById('nt-additive-row').style.display = this.value === 'AdditiveDeveloper' ? 'block' : 'none'">
            <option value="SystemManager">${t('systemManager', 'System Manager (Cloud Platform Operations)')}</option>
            <option value="AdditiveDeveloper">${t('additiveDeveloper', 'Additive Developer (Marketplace Extension)')}</option>
          </select>
        </div>

        <div class="field" id="nt-additive-row" style="grid-column:span 2;display:none">
          <label>${t('selectAdditive', 'Marketplace Additive / Extension')}</label>
          <select id="nt-additive">
            ${extensions.map(e => `<option value="${e.name}">${e.name} (${e.cat} · v${e.ver})</option>`).join('')}
          </select>
        </div>

        <div class="field">
          <label>${t('category', 'Category')}</label>
          <select id="nt-cat">
            <option value="Incident">${t('categoryIncident', 'Incident (Outage / Disruption)')}</option>
            <option value="Bug">${t('categoryBug', 'Bug (Defect / Error)')}</option>
            <option value="FeatureRequest">${t('categoryFeature', 'Feature Request')}</option>
            <option value="Billing">${t('categoryBilling', 'Billing / Licensing')}</option>
            <option value="General">${t('categoryGeneral', 'General Query')}</option>
          </select>
        </div>

        <div class="field">
          <label>${t('priority', 'Priority')}</label>
          <select id="nt-prio">
            <option value="Low">${t('priorityLow', 'Low — Routine query')}</option>
            <option value="Medium" selected>${t('priorityMedium', 'Medium — Workflow impact')}</option>
            <option value="High">${t('priorityHigh', 'High — Significant operational disruption')}</option>
            <option value="Critical">${t('priorityCritical', 'Critical — Execution halt or security')}</option>
          </select>
        </div>

        <div class="field" style="grid-column:span 2">
          <label>${t('ticketTitle', 'Ticket Title')}</label>
          <input type="text" id="nt-title" placeholder="${t('ticketTitlePlaceholder', 'Brief summary of the issue or enquiry…')}">
        </div>

        <div class="field" style="grid-column:span 2">
          <label>${t('ticketDescription', 'Description & Diagnostic Details')}</label>
          <textarea id="nt-desc" rows="4" placeholder="${t('ticketDescPlaceholder', 'Provide full context, engine logs, exception traces or steps to reproduce…')}"></textarea>
        </div>
      </div>
    </div>
    <div class="modal-f">
      <button class="btn ghost" onclick="closeModal()">${t('cancel', 'Cancel')}</button>
      <button class="btn primary" id="nt-submit-btn">${ic('check')} ${t('submitTicket', 'Submit Ticket')}</button>
    </div>`;

    window.modal(html);

    document.getElementById('nt-submit-btn').onclick = () => {
      const title = document.getElementById('nt-title').value.trim();
      const desc = document.getElementById('nt-desc').value.trim();
      const targetType = document.getElementById('nt-target').value;
      const additive = document.getElementById('nt-additive')?.value || null;
      const category = document.getElementById('nt-cat').value;
      const priority = document.getElementById('nt-prio').value;

      if (!title) {
        window.toast('Missing title', 'Please provide a title for the ticket.', 'err');
        return;
      }

      const DB = window.DB;
      const S = window.S;
      const nextNum = (DB.tickets.length + 1).toString().padStart(2, '0');
      const ticketId = 'tk-' + nextNum;

      const newTicket = {
        id: ticketId,
        authorName: S.user ? S.user.name : 'Elena Voss',
        targetType,
        targetItemName: targetType === 'AdditiveDeveloper' ? additive : null,
        category,
        priority,
        status: 'Open',
        title,
        desc,
        createdAt: Date.now()
      };

      DB.tickets.unshift(newTicket);

      // Seed initial message
      DB.ticketMessages.push({
        id: 'tm-' + (DB.ticketMessages.length + 1),
        ticketId,
        authorName: newTicket.authorName,
        isStaff: false,
        authorRole: 'Submitter',
        message: desc || title,
        createdAt: Date.now()
      });

      window.saveDB();
      window.closeModal();
      window.toast(
        'Ticket submitted',
        `Dispatched to ${targetType === 'SystemManager' ? 'System Manager' : additive} [${ticketId}].`,
        'ok'
      );
      window.ws('Event', { Type: 'TicketCreated', ticketId, targetType, priority });

      const c = document.getElementById('content');
      if (c && S.page === 'tickets') renderTickets(c);
    };
  };

  window.renderTickets = renderTickets;
  if (!window.RENDER) window.RENDER = {};
  window.RENDER.tickets = () => {
    const c = document.getElementById('content');
    if (c) renderTickets(c);
  };
})();
