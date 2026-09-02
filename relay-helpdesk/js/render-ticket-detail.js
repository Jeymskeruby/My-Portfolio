/* ============================= TICKET DETAIL ============================= */
async function renderTicketDetail(ctx){
  const t = DB.tickets.find(x=>x.id===S.activeTicketId);
  if(!t) return `<div class="empty">Ticket not found. <button class="link-btn" onclick="goto('${userView('dashboard')}')">Go back</button></div>`;

  // Auto-change Open -> In Progress when assignee views the ticket
  if(t.status === 'Open' && t.assigneeId === S.currentUser.id && (S.currentUser.role === 'agent' || S.currentUser.role === 'teamleader')){
    t.status = 'In Progress';
    t.updatedAt = nowTs();
    await saveTickets();
    await pushAudit(t.id, 'Status changed', 'Open → In Progress (assignee viewed ticket)');
    await startTimerAuto(t.id);
  }

  // Auto-start timer when In Progress ticket is viewed by assignee (for reopened tickets)
  if(t.status === 'In Progress' && t.assigneeId === S.currentUser.id && (!S.timer || S.timer.ticketId !== t.id) && (S.currentUser.role === 'agent' || S.currentUser.role === 'teamleader')){
    await startTimerAuto(t.id);
  }

  const client = getUser(t.clientId);
  const agent = t.assigneeId ? getUser(t.assigneeId) : null;
  const info = slaInfo(t);
  const isClient = ctx==='client';
  const isAgentOrAdmin = !isClient;

  // Check if user can modify this specific ticket
  let canModifyTicket = false;
  if(S.currentUser.role === 'admin' || S.currentUser.role === 'superadmin'){
    canModifyTicket = true; // Admin can modify all tickets
  } else if(S.currentUser.role === 'teamleader'){
    canModifyTicket = true; // Team leader can modify tickets in their team
  } else if(S.currentUser.role === 'agent'){
    canModifyTicket = t.assigneeId === S.currentUser.id; // Agent can only modify tickets assigned to them
  }
  // Reassigning who owns a ticket is a routing/management decision, not
  // something the assigned agent should be able to do themselves — even
  // on their own ticket. Only admin/superadmin/teamleader can change it.
  const canReassign = S.currentUser.role === 'admin' || S.currentUser.role === 'superadmin' || S.currentUser.role === 'teamleader';

  const msgs = DB.messages.filter(m=>m.ticketId===t.id && (isClient ? m.kind==='public' : true)).sort((a,b)=>a.createdAt-b.createdAt);
  const timeSpent = ticketTimeSpent(t);
  const resolutionTime = ticketTotalResolutionTime(t);

  // Get last 3 audit entries for viewing logs
  const ticketAudit = DB.audit_log.filter(a=>a.ticketId===t.id).sort((a,b)=>b.timestamp-a.timestamp).slice(0,3);

  return `
  <button class="btn btn-ghost btn-sm" style="margin-bottom:14px;" onclick="goto('${ctx==='client'?'client-dashboard':ctx==='agent'?'agent-queue':ctx==='leader'?'leader-queue':'admin-queue'}')">&larr; Back to ${ctx==='client'?'my tickets':ctx==='leader'?'team queue':'queue'}</button>
  <div class="grid" style="grid-template-columns:1.6fr 1fr;gap:20px;align-items:start;">
    <div>
      <div class="card card-pad">
        <div class="ticket-head">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap;">
            <div>
              <span class="stamp">${ticketNumStr(t)}</span>
              <h2 style="margin:8px 0 4px;">${esc(t.subject)}</h2>
              <div class="small muted">Opened ${fmtDate(t.createdAt)} by ${client?esc(client.name):'—'} ${client&&client.company?'· '+esc(client.company):''}</div>
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;">
              <span class="badge ${STATUS_META[t.status].cls}"><span class="dot"></span>${STATUS_META[t.status].label}</span>
              <span class="badge ${PRIORITY_CLS[t.priority]}">${PRIORITY_LABEL[t.priority]}</span>
              ${info.breached?'<span class="badge sla-breach">SLA BREACHED</span>':''}
            </div>
          </div>
        </div>
        <div id="viewersBanner">${viewersBannerHtml(t.id)}</div>

        ${!isClient && t.attachments && t.attachments.length ? `<div style="margin-bottom:12px;"><div class="small muted" style="margin-bottom:6px;">Original attachments</div>${renderAttachChipsReadonly(t.attachments)}</div>` : (isClient && t.attachments && t.attachments.length ? `<div style="margin-bottom:12px;">${renderAttachChipsReadonly(t.attachments)}</div>` : '')}

        ${t.resolutionProof ? `<div style="margin-bottom:12px;padding:10px;background:var(--teal-bg);border:1px solid rgba(20,150,130,.3);border-radius:8px;">
          <div class="small" style="font-weight:600;color:var(--teal);margin-bottom:6px;">&#10003; Resolution proof attached</div>
          ${renderAttachChipsReadonly([t.resolutionProof])}
        </div>` : ''}

        <div id="threadWrap">${renderThread(msgs, isClient)}</div>

        <hr class="hair">
        <div id="composerWrap">${t.status==='Closed' ? `<div class="muted small">This ticket is closed and locked. No further replies can be added.</div>` :
          (!canModifyTicket && !isClient) ? `<div class="muted small">You can only reply to tickets assigned to you.</div>` :
          renderComposer(t, isClient)}</div>
      </div>
    </div>

    <div>
      <div class="card card-pad" style="margin-bottom:14px;">
        <div class="small muted" style="font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">Details</div>
        <div class="kvrow"><span class="k">Category</span><span class="v">${esc(t.category)}</span></div>
        <div class="kvrow"><span class="k">Client</span><span class="v">${client?esc(client.name):'—'}</span></div>
        <div class="kvrow"><span class="k">Assignee</span><span class="v">${
          canReassign ? `<select onchange="assignTicket('${t.id}', this.value||null)" style="padding:3px 6px;font-size:12px;">
            <option value="">Unassigned</option>
            ${getTeamAgents().map(a=>`<option value="${a.id}" ${t.assigneeId===a.id?'selected':''}>${esc(a.name)}</option>`).join('')}
          </select>` : (agent?esc(agent.name):
            (!t.assigneeId && S.currentUser.role==='agent' && agentMatchesCategory(S.currentUser, t.category) ?
              `Unassigned <button class="btn btn-primary btn-sm" style="margin-left:6px;" onclick="claimTicket('${t.id}')">Claim ticket</button>` : 'Unassigned'))
        }</span></div>
        <div class="kvrow"><span class="k">Priority</span><span class="v">${
          canModifyTicket && t.status!=='Closed' ? `<select onchange="changePriority('${t.id}', this.value)" style="padding:3px 6px;font-size:12px;">
            ${PRIORITIES.map(p=>`<option value="${p}" ${t.priority===p?'selected':''}>${PRIORITY_LABEL[p]}</option>`).join('')}
          </select>` : PRIORITY_LABEL[t.priority]
        }</span></div>
        <div class="kvrow"><span class="k">Status</span><span class="v">${
          (isAgentOrAdmin && canModifyTicket && nextStatuses(t.status, S.currentUser.role).length) ? `<select onchange="const v=this.value; if(v==='Resolved') this.value='${t.status}'; changeStatus('${t.id}', v)" style="padding:3px 6px;font-size:12px;">
            <option value="${t.status}">${STATUS_META[t.status].label} (current)</option>
            ${nextStatuses(t.status, S.currentUser.role).map(s=>`<option value="${s}">${STATUS_META[s].label}</option>`).join('')}
          </select>` : STATUS_META[t.status].label
        }</span></div>
        ${isClient && t.status==='Resolved' ? `
          <div style="margin-top:10px;padding:8px;background:var(--amber-bg);border-radius:7px;font-size:12px;">
            <div style="font-weight:600;margin-bottom:4px;">Not fixed?</div>
            <div class="muted small" style="margin-bottom:6px;">You can reopen this ticket within 24 hours of resolution.</div>
            <button class="btn btn-sm" style="width:100%;" onclick="reopenTicket('${t.id}')">Reopen ticket</button>
          </div>
        `:''}
        <hr class="hair">
        <div class="kvrow"><span class="k">Created</span><span class="v">${fmtDate(t.createdAt)}</span></div>
        ${resolutionTime ? `<div class="kvrow"><span class="k">Time to resolution</span><span class="v">${msToHumanReadable(resolutionTime)}</span></div>` : ''}
        <div class="kvrow"><span class="k">First-response SLA</span><span class="v">${DB.sla_config[t.priority].minutes}m</span></div>
        <div class="kvrow"><span class="k">${info.active?'Time remaining':'SLA status'}</span><span class="v" style="${info.breached?'color:var(--red);':''}">${info.active ? (info.breached? 'Breached '+Math.abs(Math.round(info.remaining/60000))+'m ago' : Math.round(info.remaining/60000)+'m left') : (info.breached?'Breached before response':'Met')}</span></div>
        <div class="kvrow"><span class="k">Updated</span><span class="v">${timeAgo(t.updatedAt)}</span></div>
      </div>

      ${isAgentOrAdmin && canModifyTicket ? `
      <div class="card card-pad" style="margin-bottom:14px;">
        <div class="small muted" style="font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">Time tracking</div>
        <div class="kvrow"><span class="k">Total logged</span><span class="v">${secondsToHuman(timeSpent)}</span></div>
        ${S.timer && S.timer.ticketId===t.id ? `
          <div class="kvrow"><span class="k">Timer running</span><span class="v" id="timer-display" style="font-family:var(--font-mono);color:var(--amber-deep);">${secondsToHuman(Math.round((nowTs()-S.timer.startedAt)/1000))}</span></div>
          <div class="muted small" style="margin-top:8px;">⏱️ Timer automatically stops when you change status to Pending or Resolved, or when you go on break.</div>
        ` : S.pausedTimerTicketId===t.id ? `
          <div class="kvrow"><span class="k">Timer</span><span class="v" style="color:var(--amber-deep);">Paused (on break)</span></div>
          <div class="muted small" style="margin-top:8px;">⏱️ Resumes automatically once you go back to Queuing.</div>
        ` : `
          <div class="muted small" style="margin-top:8px;">⏱️ Timer starts automatically when you view In Progress tickets and stops when status changes to Pending or Resolved.</div>
        `}
        ${t.timeEntries && t.timeEntries.length ? `<hr class="hair">${t.timeEntries.slice().reverse().map(e=>`<div class="small" style="margin-bottom:6px;"><b>${secondsToHuman(entrySeconds(e))}</b> — ${esc(getUser(e.agentId)?getUser(e.agentId).name:'Agent')} <span class="muted">· ${esc(e.note||'')} · ${timeAgo(e.at)}</span></div>`).join('') }` : ''}
      </div>` : (isAgentOrAdmin ? `
      <div class="card card-pad" style="margin-bottom:14px;">
        <div class="small muted" style="font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">Time tracking</div>
        <div class="kvrow"><span class="k">Total logged</span><span class="v">${secondsToHuman(timeSpent)}</span></div>
        <div class="muted small" style="margin-top:8px;">You can only track time on tickets assigned to you.</div>
        ${t.timeEntries && t.timeEntries.length ? `<hr class="hair">${t.timeEntries.slice().reverse().map(e=>`<div class="small" style="margin-bottom:6px;"><b>${secondsToHuman(entrySeconds(e))}</b> — ${esc(getUser(e.agentId)?getUser(e.agentId).name:'Agent')} <span class="muted">· ${esc(e.note||'')} · ${timeAgo(e.at)}</span></div>`).join('') }` : ''}
      </div>` : '')}

      <div class="card card-pad">
        <div class="small muted" style="font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">Recent Activity</div>
        ${ticketAudit.length ? ticketAudit.map(a=>`
          <div class="small" style="margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid var(--line);">
            <div style="font-weight:600;">${esc(a.action)}</div>
            <div class="muted">${esc(a.detail||'')}</div>
            <div class="muted" style="font-size:11px;margin-top:2px;">${esc(a.actor)} · ${timeAgo(a.timestamp)}</div>
          </div>
        `).join('') : '<div class="muted small">No activity yet.</div>'}
        ${ctx==='admin' ? `<button class="link-btn small" onclick="S.auditFilters.ticket='${t.id}';goto('admin-audit');">View full history for this ticket &rarr;</button>` : ''}
      </div>
    </div>
  </div>`;
}
function renderAttachChipsReadonly(arr){
  return arr.map(a=>`<span class="attach-chip">${a.type==='image'?`<img src="${a.dataUrl}">`:'&#128196;'} ${esc(a.name)}</span>`).join('');
}
function renderThread(msgs, isClient){
  if(msgs.length===0) return `<div class="empty small">No messages yet.</div>`;
  return msgs.map(m=>{
    const author = getUser(m.authorId);
    return `<div class="msg ${m.kind==='internal'?'msg-internal':'msg-public'}">
      <div class="msg-top"><span class="msg-name">${author?esc(author.name):'Unknown'}</span>${m.kind==='internal'?'<span class="tag-internal">INTERNAL NOTE</span>':(isClient?'':'<span class="tag-public">PUBLIC</span>')}<span class="msg-time">${fmtDate(m.createdAt)}</span></div>
      <div>${m.body}</div>
      ${m.attachments && m.attachments.length ? `<div style="margin-top:8px;">${renderAttachChipsReadonly(m.attachments)}</div>` : ''}
    </div>`;
  }).join('');
}
// Switching Public/Internal only needs the pill selection, the send button
// label, and the placeholder text to update — but a full render() rebuilds
// #reply-body from scratch (it's a live contenteditable, not JS state), so
// that used to wipe any in-progress draft. Capture it, patch just
// #composerWrap (not the whole ticket-detail view), then restore it.
function switchComposerKind(kind){
  const el = document.getElementById('reply-body');
  const draft = el ? el.innerHTML : '';
  S.composerKind = kind;
  renderComposerOnly();
  const el2 = document.getElementById('reply-body');
  if(el2){ el2.innerHTML = draft; el2.focus(); }
}
function renderComposerOnly(){
  const wrap = document.getElementById('composerWrap');
  const t = DB.tickets.find(x=>x.id===S.activeTicketId);
  if(!wrap || !t) return;
  const isClient = S.currentUser.role === 'client';
  wrap.innerHTML = renderComposer(t, isClient);
}
function renderComposer(t, isClient){
  return `
  ${!isClient ? `
  <div class="pill-select" style="margin-bottom:10px;">
    <button type="button" class="pill ${S.composerKind==='public'?'sel':''}" onclick="switchComposerKind('public')">Public reply</button>
    <button type="button" class="pill ${S.composerKind==='internal'?'sel':''}" onclick="switchComposerKind('internal')">Internal note</button>
    <select onchange="if(this.value){insertCanned(this.value);this.value='';}" style="width:auto;padding:6px 8px;font-size:12px;margin-left:auto;">
      <option value="">Insert canned response...</option>
      ${DB.canned_responses.map(c=>`<option value="${c.id}">${esc(c.title)}</option>`).join('')}
    </select>
  </div>` : ''}
  <div class="toolbar">
    <button type="button" class="tbtn" onclick="rtCmd('bold','reply-body')"><b>B</b></button>
    <button type="button" class="tbtn" onclick="rtCmd('italic','reply-body')"><i>I</i></button>
    <button type="button" class="tbtn" onclick="rtCmd('insertUnorderedList','reply-body')">&#8226;≡</button>
  </div>
  <div id="reply-body" class="rich" contenteditable="true" data-ph="${isClient?'Add more details or ask a question...':(S.composerKind==='internal'?'Note visible only to IT staff...':'Write a reply the client will see...')}"></div>
  <div style="margin:8px 0;">
    <input type="file" multiple onchange="addFilesToList(this.files, S.composerAttachments)">
    <div style="margin-top:6px;">${renderAttachChips(S.composerAttachments, 'S.composerAttachments')}</div>
  </div>
  <button class="btn ${!isClient && S.composerKind==='internal' ? 'btn-amber' : 'btn-primary'}" onclick="sendReply('${t.id}')">${isClient?'Send reply':(S.composerKind==='internal'?'Add internal note':'Send public reply')}</button>
  `;
}
function openManualTimeModal(ticketId){
  openModal(`
    <div class="modal-head"><h3>Add time manually</h3><button class="btn btn-ghost btn-sm" onclick="closeModal()">&times;</button></div>
    <div class="modal-body">
      <div class="field"><label>Minutes spent</label><input id="manualMins" type="number" min="1" max="1440" placeholder="e.g. 20"></div>
      <div class="field"><label>Note (optional)</label><input id="manualNote" type="text" placeholder="What did you do?"></div>
      <button class="btn btn-primary" onclick="addManualTime('${ticketId}')">Log time</button>
    </div>`);
}

