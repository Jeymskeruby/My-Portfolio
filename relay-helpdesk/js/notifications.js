/* ============================= NOTIFICATIONS ============================= */
// One row per (recipient, event) — the simplest model for a client-only
// app with no pub/sub backend. Delivery is "eventually consistent" via
// the same poll-and-reload mechanism already used for everything else
// live in this app (see startPolling()).
async function pushNotification(userId, opts){
  if(!userId) return;
  const n = {id:uid('n'), userId, type:opts.type, title:opts.title, body:opts.body||'', ticketId:opts.ticketId||null, createdAt:nowTs(), read:false};
  DB.notifications = [...DB.notifications, n];
  await skSet('notifications', DB.notifications);
}
// Broadcast to every user holding one of these roles, except whoever is
// currently performing the action — nobody needs to be told about their
// own change.
async function notifyRoles(roles, opts){
  const targets = DB.users.filter(u=>roles.includes(u.role) && (!S.currentUser || u.id!==S.currentUser.id));
  for(const u of targets){ await pushNotification(u.id, opts); }
}
async function notifyTeamLeader(teamName, opts){
  if(!teamName) return;
  const leader = DB.users.find(u=>u.team===teamName && u.role==='teamleader');
  if(leader && (!S.currentUser || leader.id!==S.currentUser.id)) await pushNotification(leader.id, opts);
}
function unreadNotificationCount(userId){
  return DB.notifications.filter(n=>n.userId===userId && !n.read).length;
}
function notificationsFor(userId){
  return DB.notifications.filter(n=>n.userId===userId).sort((a,b)=>b.createdAt-a.createdAt);
}
async function markNotificationRead(id){
  const n = DB.notifications.find(x=>x.id===id);
  if(n && !n.read){ n.read = true; await skSet('notifications', DB.notifications); }
}
async function markAllNotificationsRead(){
  if(!S.currentUser) return;
  let changed = false;
  DB.notifications.forEach(n=>{ if(n.userId===S.currentUser.id && !n.read){ n.read=true; changed=true; } });
  if(changed) await skSet('notifications', DB.notifications);
}
async function openNotificationClick(id, ticketId){
  await markNotificationRead(id);
  closeModal();
  if(ticketId){
    const t = DB.tickets.find(x=>x.id===ticketId);
    if(t){ goto(userView('ticket-detail'), t.id); return; }
  }
  render();
}
function notificationBellHtml(){
  if(!S.currentUser) return '';
  const count = unreadNotificationCount(S.currentUser.id);
  return `<button class="btn btn-ghost" style="position:relative;padding:8px 10px;" onclick="openNotificationsModal()" title="Notifications">
    &#128276;${count>0?`<span class="nav-badge" style="position:absolute;top:-2px;right:-2px;">${count>99?'99+':count}</span>`:''}
  </button>`;
}
function openNotificationsModal(){
  if(!S.currentUser) return;
  const items = notificationsFor(S.currentUser.id);
  openModal(`
    <div class="modal-head"><h3>Notifications</h3><button class="btn btn-ghost btn-sm" onclick="closeModal()">&times;</button></div>
    <div class="modal-body" style="padding:0;max-height:64vh;overflow-y:auto;">
      ${items.length===0 ? `<div class="empty" style="padding:36px 20px;"><div class="big">&#128276;</div>No notifications yet.</div>` : `
      <div style="display:flex;justify-content:flex-end;padding:12px 16px 0;">
        <button class="btn btn-ghost btn-sm" onclick="markAllNotificationsRead().then(()=>openNotificationsModal())">Mark all as read</button>
      </div>
      ${items.map(n=>`
        <div style="padding:12px 16px;border-bottom:1px solid var(--line);cursor:pointer;${n.read?'':'background:var(--amber-bg);'}" onclick="openNotificationClick('${n.id}', ${n.ticketId?`'${n.ticketId}'`:'null'})">
          <div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start;">
            <div style="font-weight:600;font-size:13px;">${esc(n.title)}</div>
            ${n.read?'':'<span class="dot" style="background:var(--amber-deep);flex-shrink:0;margin-top:5px;"></span>'}
          </div>
          ${n.body?`<div class="small muted" style="margin-top:2px;">${esc(n.body)}</div>`:''}
          <div class="muted" style="font-size:11px;margin-top:4px;">${timeAgo(n.createdAt)}</div>
        </div>`).join('')}
      `}
    </div>`);
}

