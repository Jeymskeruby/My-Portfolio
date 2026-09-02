/* ============================= AGENT STATUS ============================= */
// Status is persisted in DB.status (keyed by user id) so it survives refreshes.
//   online: true/false  — set on login/logout (and toggled manually for agents)
//   agentStatus: 'queuing' | 'break'  — only meaningful for role==='agent'
function getUserStatus(u){
  if(!u) return {online:false, agentStatus:'queuing'};
  const s = (DB.status && DB.status[u.id]) || {};
  return {
    online: u.online === true,
    agentStatus: (u.role==='agent') ? (s.agentStatus || 'queuing') : 'queuing'
  };
}
function isAgentOnline(u){ return u && u.online === true; }
function isAgentOnBreak(u){ return u && u.role==='agent' && getUserStatus(u).agentStatus === 'break'; }
// An agent is eligible to receive new tickets only when online, not on break,
// and not disabled (a disabled account must never be auto-routed new work).
function isAgentAvailable(u){ return isAgentOnline(u) && !isAgentOnBreak(u) && u.active !== false; }
function statusBadge(u){
  if(!u) return '<span class="badge b-closed"><span class="dot"></span>Offline</span>';
  const st = getUserStatus(u);
  if(u.role === 'agent'){
    if(!st.online) return '<span class="badge b-closed"><span class="dot"></span>Offline</span>';
    if(st.agentStatus === 'break') return '<span class="badge b-pending"><span class="dot"></span>On Break</span>';
    return '<span class="badge b-resolved"><span class="dot"></span>Queuing</span>';
  }
  // Non-agents: show online/offline only
  return st.online
    ? '<span class="badge b-resolved"><span class="dot"></span>Online</span>'
    : '<span class="badge b-closed"><span class="dot"></span>Offline</span>';
}
async function setUserOnline(userId, online){
  const u = getUser(userId);
  if(!u) return;
  u.online = online;
  await saveUsers();
}
async function setAgentStatus(userId, agentStatus){
  const u = getUser(userId);
  if(!u || u.role !== 'agent') return;
  if(!DB.status) DB.status = {};
  if(!DB.status[userId]) DB.status[userId] = {};
  DB.status[userId].agentStatus = agentStatus;
  await saveStatus();
}
// Sidebar status row shown to the currently signed-in user.
// Agents get a Queuing/Break toggle; everyone else gets a read-only online indicator.
function renderStatusRow(role){
  const u = S.currentUser;
  if(!u) return '';
  if(role === 'agent'){
    const st = getUserStatus(u);
    const onBreak = st.agentStatus === 'break';
    return `
      <div style="display:flex;align-items:center;gap:8px;margin-top:8px;padding:7px 9px;border:1px solid rgba(255,255,255,.1);border-radius:7px;">
        <span class="badge ${onBreak?'b-pending':'b-resolved'}"><span class="dot"></span>${onBreak?'On Break':'Queuing'}</span>
        <button class="logout-btn" style="margin:0;padding:5px 8px;font-size:11.5px;" onclick="toggleAgentStatus()">${onBreak?'Go Queuing':'Go On Break'}</button>
      </div>`;
  }
  // Non-agents: read-only online indicator (set by login/logout)
  return `
    <div style="display:flex;align-items:center;gap:8px;margin-top:8px;padding:7px 9px;border:1px solid rgba(255,255,255,.1);border-radius:7px;">
      ${statusBadge(u)}
    </div>`;
}
async function toggleAgentStatus(){
  const u = getUser(S.currentUser.id);
  if(!u) return;
  const st = getUserStatus(u);
  const next = (st.agentStatus === 'break') ? 'queuing' : 'break';
  await setAgentStatus(u.id, next);

  if(next === 'break'){
    // Pause the running timer, if any: log the elapsed time as a normal
    // timer session (same as switching a ticket to Pending), and remember
    // which ticket it was so it can resume once back to queuing.
    if(S.timer){
      S.pausedTimerTicketId = S.timer.ticketId;
      await stopTimerAndSave();
    }
    showToast('You are now on break — no new tickets will be routed to you, and your running timer is paused.');
  } else {
    // Resume the paused timer, but only if that ticket is still In Progress
    // and still assigned to this agent (things may have changed while away).
    const pausedTicketId = S.pausedTimerTicketId;
    S.pausedTimerTicketId = null;
    if(pausedTicketId){
      const t = DB.tickets.find(x=>x.id===pausedTicketId);
      if(t && t.status==='In Progress' && t.assigneeId===S.currentUser.id){
        await startTimerAuto(t.id);
      }
    }
    showToast('You are now queuing — available for new tickets.');
  }
  render();
}

