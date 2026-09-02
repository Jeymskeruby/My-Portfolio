/* ============================= POLLING (multi-user "live" sim) ============================= */
function startPolling(){
  stopPolling();
  S.pollHandle = setInterval(async ()=>{
    await loadDB();
    if(S.currentUser && S.view.includes('ticket-detail') && S.activeTicketId){
      await touchViewer(S.activeTicketId);
      // Ticket-detail is excluded from the render() below (it would wipe
      // the reply composer) — patch just the viewers banner instead, same
      // targeted-DOM-patch pattern as renderQueueList()/renderAuditList().
      renderViewersBanner();
    }
    // Only render on queue/dashboard views, NOT on ticket-detail views to avoid destroying comment box
    if(['agent-queue','admin-audit','admin-overview','client-dashboard','leader-queue','admin-queue'].includes(S.view)){
      await runSystemChecks(true);
      render();
    }
  }, 6000);
}
function stopPolling(){ if(S.pollHandle){ clearInterval(S.pollHandle); S.pollHandle=null; } }

async function touchViewer(ticketId){
  const v = DB.viewers[ticketId] || {};
  v[S.currentUser.id] = {name:S.currentUser.name, ts: nowTs()};
  DB.viewers = {...DB.viewers, [ticketId]:v};
  await skSet('viewers', DB.viewers);
}
function activeViewersFor(ticketId, excludeSelf){
  const v = (DB.viewers && DB.viewers[ticketId]) || {};
  const n = nowTs();
  return Object.entries(v)
    .filter(([uidKey, info]) => (n - info.ts) < 15000 && (!excludeSelf || uidKey !== S.currentUser.id))
    .map(([,info])=>info.name);
}
function viewersBannerHtml(ticketId){
  const others = activeViewersFor(ticketId, true);
  return others.length ? `<div class="viewers"><span class="eye">&#128065;</span> ${others.map(esc).join(', ')} ${others.length>1?'are':'is'} also viewing this ticket right now</div>` : '';
}
// Patches just the "X is also viewing" banner on an open ticket-detail view
// without touching the rest of the DOM — ticket-detail is deliberately
// excluded from the polling render() (it would wipe the reply composer),
// so this is what keeps the banner live during that 6s poll instead of it
// only ever refreshing on navigation.
function renderViewersBanner(){
  const el = document.getElementById('viewersBanner');
  if(el && S.activeTicketId) el.innerHTML = viewersBannerHtml(S.activeTicketId);
}

