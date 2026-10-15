/* ============================================================
   RAZOR CLOUD — Simulated WebSocket Console & Command Lifecycle
   ============================================================ */
(function() {
  function ws(type, payload) {
    const b = document.getElementById('consoleBody');
    if (!b) return;

    const line = document.createElement('div');
    line.className = 'ws-line ' + type;
    const pl = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const short = pl.length > 220 ? pl.slice(0, 220) + '…' : pl;
    const now = new Date();
    const timeStr = window.utcStr ? window.utcStr(now).slice(11, 19) : now.toTimeString().slice(0, 8);

    line.innerHTML = `<span class="ts">${timeStr}</span> <span class="ty">${type}</span> <span class="pl">${short.replace(/</g, '&lt;')}</span>`;
    b.appendChild(line);

    while (b.children.length > 220) {
      b.removeChild(b.firstChild);
    }
    b.scrollTop = b.scrollHeight;
  }

  function sendCommand(id, type, params, onDone, dur = 1700) {
    const cid = Math.floor(Math.random() * 900000 + 100000);
    ws('Command', { MessageId: window.uid(), CommandId: id, CommandType: type, CorrelationId: cid, Parameters: params || {} });

    setTimeout(() => ws('Response', { CorrelationId: cid, Status: 'Acknowledged' }), 260);
    setTimeout(() => ws('Event', { Type: 'CommandProgress', CorrelationId: cid, progress: 60 }), dur * 0.55);
    setTimeout(() => {
      ws('Event', { Type: 'CommandCompleted', CorrelationId: cid, Status: 'Success' });
      if (onDone) onDone();
    }, dur);
  }

  function clearConsole() {
    const b = document.getElementById('consoleBody');
    if (b) b.innerHTML = '';
  }

  function toggleConsole() {
    const c = document.getElementById('console');
    if (c) c.classList.toggle('open');
  }

  window.ws = ws;
  window.sendCommand = sendCommand;
  window.clearConsole = clearConsole;
  window.toggleConsole = toggleConsole;
})();
