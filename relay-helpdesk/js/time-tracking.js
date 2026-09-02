/* ============================= TIME TRACKING ============================= */
function updateTimerDisplay(){
  if(!S.timer) return;
  const el = document.getElementById('timer-display');
  if(el){
    const elapsedSec = Math.round((nowTs() - S.timer.startedAt) / 1000);
    el.textContent = secondsToHuman(elapsedSec);
  }
}
async function startTimerAuto(ticketId){
  // Never auto-start (or resume) a timer while the current agent is on break —
  // covers viewing/reopening an In Progress ticket, and manually switching a
  // ticket's status to In Progress, all while on break.
  if(S.currentUser && isAgentOnBreak(S.currentUser)) return;
  // Auto-start timer if not already running for this ticket
  if(S.timer && S.timer.ticketId === ticketId) return;
  stopTimerIfRunning(true); // Stop and save any existing timer
  S.timer = {ticketId, startedAt: nowTs()};
  S.timerTick = setInterval(updateTimerDisplay, 1000);
  const t = DB.tickets.find(x=>x.id===ticketId);
  if(t){
    t.updatedAt = nowTs();
    await saveTickets();
  }
  render();
}
async function stopTimerAndSave(){
  if(!S.timer) return;
  // Real elapsed seconds, no artificial minimum — rounding this up to a
  // full minute (the old behavior) meant rapidly starting/stopping a timer
  // (e.g. spamming the break/queuing toggle) could log a minute of work
  // per toggle, stacking fake time in seconds.
  const elapsedSec = Math.round((nowTs() - S.timer.startedAt)/1000);
  const ticketId = S.timer.ticketId;
  clearInterval(S.timerTick); S.timerTick=null;
  S.timer = null;
  if(elapsedSec <= 0){ render(); return; } // instant start/stop — nothing to log
  const t = DB.tickets.find(x=>x.id===ticketId);
  if(t){
    t.timeEntries = [...(t.timeEntries||[]), {agentId:S.currentUser.id, seconds:elapsedSec, note:'Timer session', at:nowTs()}];
    t.updatedAt = nowTs();
    await saveTickets();
    await pushAudit(ticketId, 'Time logged', `${secondsToHuman(elapsedSec)} via timer`);
  }
  render();
}
function stopTimerIfRunning(save){
  if(S.timerTick){ clearInterval(S.timerTick); S.timerTick=null; }
  if(save) stopTimerAndSave();
  else S.timer=null;
}
async function addManualTime(ticketId){
  const mins = parseInt(document.getElementById('manualMins').value, 10);
  const note = document.getElementById('manualNote').value.trim();
  if(!mins || mins<=0){ showToast('Enter minutes greater than 0.'); return; }
  if(mins > 1440){ showToast('A single manual entry can\'t exceed 1440 minutes (24 hours). Log it in smaller chunks.', 'warn'); return; }
  const t = DB.tickets.find(x=>x.id===ticketId);
  t.timeEntries = [...(t.timeEntries||[]), {agentId:S.currentUser.id, seconds:mins*60, note: note||'Manual entry', at:nowTs()}];
  t.updatedAt = nowTs();
  await saveTickets();
  await pushAudit(ticketId, 'Time logged', `${mins}m manual entry${note?': '+note:''}`);
  closeModal(); render();
}

