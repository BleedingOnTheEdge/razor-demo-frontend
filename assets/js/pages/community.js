/* ============================================================
   RAZOR CLOUD — Community Discussion Hub
   Institutional research, strategy discussion and additive support
   ============================================================ */
(function() {
  const t = (k, f) => window.t(k, f);
  const ic = (n, cls) => window.ic(n, cls);

  let activeCategory = 'All';
  let searchQuery = '';

  function renderCommunity(container) {
    const threads = window.DB.communityThreads || [];
    const categories = ['All', 'Announcements', 'Strategies', 'Additives', 'Feedback', 'General'];

    const filtered = threads.filter(th => {
      const matchCat = activeCategory === 'All' || th.category === activeCategory;
      const matchQ = !searchQuery || th.title.toLowerCase().includes(searchQuery.toLowerCase()) || th.content.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQ;
    });

    let html = `
    <div class="page-head">
      <div>
        <h1>${t('communityHubTitle', 'Community Discussion Hub')}</h1>
        <p>${t('communityHubDesc', 'Institutional quant discussions, extension developer support, algorithm sharing, and platform announcements.')}</p>
      </div>
      <div class="page-actions">
        <button class="btn primary sm" onclick="RZ.openNewThreadModal()">${ic('plus')} ${t('newDiscussion', 'New Discussion Thread')}</button>
      </div>
    </div>

    <!-- Category Filters & Search Bar -->
    <div class="card mb16" style="padding:12px 16px">
      <div class="flex aic jcb" style="flex-wrap:wrap;gap:12px">
        <div class="tag-row">
          ${categories.map(cat => `
            <button class="chip ${activeCategory === cat ? 'on' : ''}" onclick="RZ.setCommunityCat('${cat}')">${cat}</button>
          `).join('')}
        </div>
        <div class="flex aic gap8">
          <input id="comm-search" placeholder="${t('searchDiscussions', 'Search threads...')}" value="${searchQuery}" oninput="RZ.searchCommunity(this.value)" style="background:var(--bg2);border:1px solid var(--line);border-radius:8px;padding:6px 12px;font-size:12px;width:210px">
        </div>
      </div>
    </div>

    <!-- Discussion Threads List -->
    <div class="grid" style="grid-template-columns:1fr;gap:10px">
      ${filtered.length ? filtered.map(th => {
        const badgeColor = th.authorBadge === 'Core Team' ? 'var(--acc)' : (th.authorBadge === 'Verified Dev' ? 'var(--up)' : 'var(--vio)');

        return `
        <div class="card" style="padding:16px;cursor:pointer;transition:all 140ms ease" onclick="RZ.openThreadDetail('${th.id}')">
          <div class="flex aic jcb" style="margin-bottom:6px">
            <div class="flex aic gap8">
              <span class="chip on" style="font-size:10px">${th.category}</span>
              <div class="flex aic gap8">
                <div class="avatar" style="width:22px;height:22px;font-size:9.5px">${th.authorName.split(' ').map(x=>x[0]).join('')}</div>
                <b style="font-size:12px">${th.authorName}</b>
                <span class="badge" style="background:rgba(0,113,227,0.08);color:${badgeColor};font-size:9.5px">${th.authorBadge}</span>
              </div>
            </div>
            <span class="cell-mono muted" style="font-size:11px">${window.ago(th.createdAt)}</span>
          </div>

          <h3 style="font-size:15px;font-weight:600;margin:6px 0;color:var(--txt)">${th.title}</h3>
          <p class="muted" style="font-size:12.5px;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${th.content}</p>

          <div class="flex aic jcb mt8" style="padding-top:8px;border-top:1px solid var(--line);font-size:11.5px">
            <div class="flex aic gap12">
              <button class="btn xs ghost" onclick="event.stopPropagation();RZ.upvoteThread('${th.id}')" style="gap:4px">
                ${ic('thumbsUp')} <span style="font-weight:600">${th.upvotes}</span>
              </button>
              <span class="muted flex aic gap8">${ic('chat')} ${th.repliesCount} ${t('replies', 'replies')}</span>
            </div>
            <span class="cell-mono" style="color:var(--acc);font-weight:600">${t('viewThread', 'View discussion &rarr;')}</span>
          </div>
        </div>`;
      }).join('') : `
        <div class="empty" style="padding:60px 20px">
          ${ic('chat')}
          <div>${t('noThreadsFound', 'No discussion threads match this category or search.')}</div>
        </div>
      `}
    </div>`;

    container.innerHTML = html;
  }

  window.RZ = window.RZ || {};

  window.RZ.setCommunityCat = function(cat) {
    activeCategory = cat;
    renderCommunity(document.getElementById('content'));
  };

  window.RZ.searchCommunity = function(q) {
    searchQuery = q;
    renderCommunity(document.getElementById('content'));
  };

  window.RZ.upvoteThread = function(threadId) {
    const th = (window.DB.communityThreads || []).find(x => x.id === threadId);
    if (th) {
      th.upvotes = (th.upvotes || 0) + 1;
      window.saveDB();
      renderCommunity(document.getElementById('content'));
      window.toast(t('upvoted', 'Upvoted'), th.title, 'ok');
    }
  };

  window.RZ.openThreadDetail = function(threadId) {
    const th = (window.DB.communityThreads || []).find(x => x.id === threadId);
    if (!th) return;

    const replies = (window.DB.communityReplies || []).filter(r => r.threadId === threadId);

    window.modal(`
      <div class="modal-h">
        <div>
          <span class="chip on" style="font-size:10px;margin-bottom:4px">${th.category}</span>
          <h3 style="margin-top:4px">${th.title}</h3>
        </div>
        <button class="x" onclick="closeModal()">${ic('x')}</button>
      </div>

      <div class="modal-b">
        <div class="flex aic gap8 mb16">
          <div class="avatar" style="width:26px;height:26px;font-size:10px">${th.authorName.split(' ').map(x=>x[0]).join('')}</div>
          <b>${th.authorName}</b>
          <span class="badge ok" style="font-size:9.5px">${th.authorBadge}</span>
          <span class="cell-mono muted" style="margin-left:auto;font-size:10.5px">${window.ago(th.createdAt)}</span>
        </div>

        <div style="background:#fbfbfd;border:1px solid var(--line);border-radius:var(--r);padding:14px;font-size:13px;line-height:1.6;white-space:pre-line;color:var(--txt)">
          ${th.content}
        </div>

        <div class="flex aic jcb mt8 mb16">
          <button class="btn xs ghost" onclick="RZ.upvoteThread('${th.id}')" style="gap:4px">
            ${ic('thumbsUp')} ${th.upvotes} ${t('upvotes', 'Upvotes')}
          </button>
          <span class="muted" style="font-size:11.5px">${replies.length} ${t('replies', 'Replies')}</span>
        </div>

        <h4 style="font-size:13px;font-weight:600;margin-bottom:10px">${t('replies', 'Replies')}</h4>

        <div style="display:flex;flex-direction:column;gap:8px;max-height:260px;overflow-y:auto;margin-bottom:16px">
          ${replies.length ? replies.map(rep => `
            <div style="background:var(--bg2);border:1px solid var(--line);border-radius:8px;padding:10px 12px">
              <div class="flex aic jcb" style="margin-bottom:4px">
                <div class="flex aic gap8">
                  <b>${rep.authorName}</b>
                  <span class="badge info" style="font-size:9px">${rep.authorBadge}</span>
                </div>
                <span class="cell-mono muted" style="font-size:10px">${window.ago(rep.createdAt)}</span>
              </div>
              <div style="font-size:12px;color:var(--txt);line-height:1.5">${rep.content}</div>
            </div>
          `).join('') : `<div class="empty" style="padding:14px">${t('noRepliesYet', 'No replies yet. Be the first to share an insight!')}</div>`}
        </div>

        <!-- Add Reply Form -->
        <div class="field">
          <label>${t('addReply', 'Post a Reply')}</label>
          <textarea id="reply-text" rows="2" placeholder="${t('replyPlaceholder', 'Write a constructive reply or share technical benchmarks...')}"></textarea>
        </div>
      </div>

      <div class="modal-f">
        <button class="btn ghost" onclick="closeModal()">${t('cancel')}</button>
        <button class="btn primary" onclick="RZ.submitThreadReply('${th.id}')">${ic('send')} ${t('postReply', 'Post Reply')}</button>
      </div>
    `, { lg: true });
  };

  window.RZ.submitThreadReply = function(threadId) {
    const txtEl = document.getElementById('reply-text');
    const content = txtEl ? txtEl.value.trim() : '';
    if (!content) return;

    const th = (window.DB.communityThreads || []).find(x => x.id === threadId);
    if (th) {
      const newReply = {
        id: 'rep_' + Date.now(),
        threadId,
        authorName: window.S.user.name,
        authorBadge: window.S.user.tierId === 'staff' ? 'Core Team' : (window.S.user.tierId === 'pro' ? 'Verified Dev' : 'Trader'),
        content,
        upvotes: 0,
        createdAt: Date.now()
      };
      if (!window.DB.communityReplies) window.DB.communityReplies = [];
      window.DB.communityReplies.push(newReply);
      th.repliesCount = (th.repliesCount || 0) + 1;
      window.saveDB();
      window.closeModal();
      window.toast(t('replyPosted', 'Reply Posted'), t('replyPostedMsg', 'Your reply has been published to the thread.'), 'ok');
      renderCommunity(document.getElementById('content'));
    }
  };

  window.RZ.openNewThreadModal = function() {
    window.modal(`
      <div class="modal-h">
        <h3>${t('newThreadTitle', 'Start a New Discussion')}</h3>
        <button class="x" onclick="closeModal()">${ic('x')}</button>
      </div>
      <div class="modal-b">
        <div class="field">
          <label>${t('category', 'Category')}</label>
          <select id="th-cat">
            <option value="Strategies">Strategies &amp; Algorithms</option>
            <option value="Additives">Additives &amp; Extension SDK</option>
            <option value="Announcements">Announcements</option>
            <option value="Feedback">Feedback &amp; Feature Ideas</option>
            <option value="General">General Discussion</option>
          </select>
        </div>
        <div class="field">
          <label>${t('topicTitle', 'Discussion Title')}</label>
          <input id="th-title" placeholder="e.g. Memory mapped tick performance on 10M+ rows">
        </div>
        <div class="field">
          <label>${t('discussionContent', 'Message (Markdown supported)')}</label>
          <textarea id="th-content" rows="5" placeholder="Share findings, backtest results, or ask questions..."></textarea>
        </div>
      </div>
      <div class="modal-f">
        <button class="btn ghost" onclick="closeModal()">${t('cancel')}</button>
        <button class="btn primary" onclick="RZ.submitNewThread()">${ic('send')} ${t('publishThread', 'Publish Thread')}</button>
      </div>
    `, { lg: true });
  };

  window.RZ.submitNewThread = function() {
    const title = (document.getElementById('th-title') || {}).value || '';
    const content = (document.getElementById('th-content') || {}).value || '';
    const category = (document.getElementById('th-cat') || {}).value || 'General';

    if (!title || !content) {
      window.toast(t('validationError', 'Missing Fields'), t('fillTitleAndContent', 'Please enter both a title and message.'), 'warn');
      return;
    }

    const newTh = {
      id: 'th_' + Date.now(),
      title,
      category,
      authorName: window.S.user.name,
      authorBadge: window.S.user.tierId === 'staff' ? 'Core Team' : (window.S.user.tierId === 'pro' ? 'Verified Dev' : 'Trader'),
      content,
      upvotes: 1,
      repliesCount: 0,
      createdAt: Date.now()
    };

    if (!window.DB.communityThreads) window.DB.communityThreads = [];
    window.DB.communityThreads.unshift(newTh);
    window.saveDB();
    window.closeModal();
    window.toast(t('threadPublished', 'Thread Published'), title, 'ok');
    renderCommunity(document.getElementById('content'));
  };

  window.renderCommunity = renderCommunity;
  if (!window.RENDER) window.RENDER = {};
  window.RENDER.community = () => {
    const c = document.getElementById('content');
    if (c) renderCommunity(c);
  };
})();
