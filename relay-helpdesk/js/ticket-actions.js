/* ============================= TICKET ACTIONS ============================= */
// Best-effort defense against a duplicate ticket number under concurrent
// creation (e.g. two tabs/sessions submitting around the same moment):
// reload both meta and tickets from storage right before computing, and
// take the max against whatever ticket numbers actually exist, not just
// what meta claims — self-heals if meta ever drifts behind, and shrinks
// (without fully closing) the race window. Closing it completely would
// need real transactional storage, which this app doesn't have — see
// Problems.txt #18 / NotImplemented.txt's backend-migration note.
async function nextTicketNumber(){
  const meta = await skGet('meta', DB.meta);
  const tickets = await skGet('tickets', DB.tickets);
  const highestExisting = tickets.reduce((max,t)=>Math.max(max, t.ticketNumber||0), 0);
  const num = Math.max(meta.nextTicketNumber || 1000, highestExisting) + 1;
  DB.meta = {...meta, nextTicketNumber:num};
  await skSet('meta', DB.meta);
  return num;
}
async function createTicket(fromEmail){
  let subject, description, category, priority, clientId, attachments, urgency, impact;
  if(fromEmail){
    subject = document.getElementById('em-subject').value.trim();
    description = document.getElementById('em-body').value.trim();
    const fromEmailAddr = document.getElementById('em-from').value.trim().toLowerCase();
    category = detectCategory(subject + ' ' + description);
    urgency = 'Medium';
    impact = 'Medium';
    priority = calculatePriority(urgency, impact);
    attachments = [];
    if(!subject || !description || !fromEmailAddr){ showToast('From, subject and body are required.'); return; }
    if(!isValidEmail(fromEmailAddr)){ showToast('That doesn\'t look like a valid email address.', 'warn'); return; }
    let client = DB.users.find(u=>u.email.toLowerCase()===fromEmailAddr);
    if(!client){
      client = {id:uid('u'), name: fromEmailAddr.split('@')[0].replace(/[._]/g,' ').replace(/\\b\\w/g,c=>c.toUpperCase()), email: fromEmailAddr, role:'client', company:'—', active:true};
      DB.users = [...DB.users, client];
      await skSet('users', DB.users);
    }
    clientId = client.id;
  } else {
    subject = document.getElementById('nt-subject').value.trim();
    category = document.getElementById('nt-category').value;
    urgency = document.getElementById('nt-urgency').value;
    impact = document.getElementById('nt-impact').value;
    priority = calculatePriority(urgency, impact);
    const richEl = document.getElementById('nt-body');
    description = richEl ? richEl.innerHTML.trim() : '';
    clientId = S.currentUser.id;
    attachments = S.newTicketAttachments;
    if(!subject || !description || description==='' ){ showToast('Please add a subject and description.'); return; }
  }

  const num = await nextTicketNumber();

  // Advanced routing: round-robin among available matching agents.
  // Manual routing rules still take precedence when any exist for this category —
  // a category can now have multiple rule agents, so round-robin across them too.
  const catRules = DB.routing_rules.filter(r=>r.category===category);
  let assigneeId = null;
  let routeNote = '';
  if(catRules.length){
    const picked = pickFromPool(eligibleRoutingRuleAgents(category), category);
    if(picked){
      assigneeId = picked.id;
      routeNote = `Manual rule (round-robin) to ${picked.name} (${category})`;
    } else {
      routeNote = `All routing-rule agents for ${category} are unavailable or at capacity — left unassigned`;
    }
  } else {
    const route = resolveRoute(category);
    if(route && route.agent){
      assigneeId = route.agent.id;
      routeNote = `Round-robin to ${route.agent.name} (${route.team}, ${category})`;
    } else if(route && route.note){
      routeNote = route.note;
    } else {
      routeNote = 'No team has an agent matching this category — left unassigned';
    }
  }
  const t = {
    id:uid('t'), ticketNumber:num, subject, description, category, priority, urgency, impact,
    status:'Open', clientId, assigneeId: assigneeId,
    createdAt: nowTs(), updatedAt: nowTs(), resolvedAt:null, closedAt:null,
    timeEntries:[], attachments: attachments||[], slaEscalated:false
  };
  DB.tickets = [...DB.tickets, t];
  await saveTickets();
  const openingMsg = {id:uid('m'), ticketId:t.id, authorId:clientId, body:description, kind:'public', createdAt:t.createdAt, attachments: attachments||[]};
  DB.messages = [...DB.messages, openingMsg];
  await saveMessages();
  await pushAudit(t.id, 'Ticket created', fromEmail ? 'Created via email intake' : 'Created via client portal');
  if(assigneeId){
    await pushAuditSystem(t.id, 'Auto-assigned', routeNote);
    await pushNotification(assigneeId, {type:'ticket_assigned', title:`New ticket assigned: ${ticketNumStr(t)}`, body:`"${subject}" (${category}, ${priority}) was routed to you.`, ticketId:t.id});
  } else {
    await pushAuditSystem(t.id, 'Unassigned', routeNote);
    const teamsWithCategory = [...new Set(DB.users.filter(u=>u.team).map(u=>u.team))].filter(team=>teamHasCategory(team, category));
    for(const team of teamsWithCategory){
      await notifyTeamLeader(team, {type:'unassigned_ticket', title:`Unassigned ${category} ticket: ${ticketNumStr(t)}`, body:`"${subject}" has no available agent and needs manual assignment.`, ticketId:t.id});
    }
  }

  S.newTicketAttachments = [];
  if(fromEmail){
    showToast(`Email parsed into ${ticketNumStr(t)}.`);
    document.getElementById('em-subject').value=''; document.getElementById('em-body').value=''; document.getElementById('em-from').value='';
    goto('admin-email');
  } else {
    goto(userView('ticket-detail'), t.id);
    showToast(`Ticket ${ticketNumStr(t)} submitted.`);
  }
}
function detectCategory(text){
  text = text.toLowerCase();
  const map = {Networking:['vpn','wifi','wi-fi','network','router','internet','connect'], Hardware:['laptop','monitor','keyboard','mouse','fan','battery','hardware','screen'],
    Software:['license','install','software','app ','application','update'], Email:['email','outlook','inbox','mail'], 'Account & Access':['password','login','locked','access','account']};
  // Categories can be renamed/removed (Admin > Categories) — only return a
  // keyword match if that category name still actually exists, otherwise
  // fall through to the 'Other' fallback below.
  for(const [cat, words] of Object.entries(map)){
    if(DB.categories.includes(cat) && words.some(w=>text.includes(w))) return cat;
  }
  return DB.categories.includes('Other') ? 'Other' : (DB.categories[0] || 'Other');
}
function userView(base){
  const r = S.currentUser.role;
  if(r==='client') return 'client-'+base;
  if(r==='agent') return 'agent-'+base;
  if(r==='teamleader') return 'leader-'+base;
  return 'admin-'+base;
}

async function changeStatus(ticketId, newStatus){
  // Resolved requires photo proof — see openResolveModal()/resolveTicket(),
  // the only path that's actually allowed to set this status. This guard
  // is defense-in-depth (the dropdown's onchange already routes 'Resolved'
  // there directly, resetting its own visual selection first) — matches
  // the real Laravel app's changeStatus(), which explicitly refuses
  // Resolved for the same reason: resolve() there is the only endpoint
  // that can set it, so the photo-proof gate can't be bypassed by hitting
  // a different one. There is no "different one" here, but the shape of
  // the guard is worth keeping identical between the two.
  if(newStatus==='Resolved'){ openResolveModal(ticketId); return; }

  const t = DB.tickets.find(x=>x.id===ticketId);
  const old = t.status;
  t.status = newStatus; t.updatedAt = nowTs();
  if(newStatus==='Closed'){ t.closedAt = nowTs(); }
  if(old==='Resolved' && newStatus!=='Resolved'){ t.resolvedAt=null; }

  // Auto-pause timer when switching to Pending
  if(newStatus==='Pending' && S.timer && S.timer.ticketId === ticketId){
    await stopTimerAndSave();
  }

  // Auto-start timer when switching to In Progress (if assigned to current user)
  if(newStatus==='In Progress' && t.assigneeId === S.currentUser.id && (!S.timer || S.timer.ticketId !== ticketId)){
    await startTimerAuto(ticketId);
  }

  await saveTickets();
  await pushAudit(ticketId, 'Status changed', `${old} → ${newStatus}`);
  // changeStatus() is only ever reachable through the staff-only status
  // dropdown (see renderTicketDetail) — a client never calls this
  // directly, so it's always safe to notify them here.
  await pushNotification(t.clientId, {type:'status_change', title:`Ticket ${ticketNumStr(t)} status changed`, body:`"${t.subject}" is now ${STATUS_META[newStatus].label}.`, ticketId:t.id});
  render();
}
// Ported from the real Laravel app (built ahead of this in the same
// project) — an actual client requirement that never made it into this
// prototype until now: resolving a ticket requires photo proof attached.
// resolveTicket() is the ONLY function anywhere in this file that sets
// status='Resolved' — changeStatus() explicitly refuses and redirects here.
function openResolveModal(ticketId){
  openModal(`
    <div class="modal-head"><h3>Mark as Resolved</h3><button class="btn btn-ghost btn-sm" onclick="closeModal()">&times;</button></div>
    <div class="modal-body">
      <div class="small muted" style="margin-bottom:14px;">This client requires photo proof the issue is resolved before the ticket can close.</div>
      <div class="field"><label>Resolution proof (photo)</label><input type="file" id="resolve-photo" accept="image/*"></div>
      <button class="btn btn-primary" onclick="resolveTicket('${ticketId}')">Confirm Resolved</button>
    </div>`);
}
async function resolveTicket(ticketId){
  const fileInput = document.getElementById('resolve-photo');
  const file = fileInput && fileInput.files[0];
  if(!file){ showToast('A photo is required to mark this ticket Resolved.', 'warn'); return; }

  let dataUrl = await readFileAsDataURL(file);
  dataUrl = await resizeImageDataUrl(dataUrl, 700);

  const t = DB.tickets.find(x=>x.id===ticketId);
  const old = t.status;
  t.resolutionProof = {name:file.name||'resolution-proof.jpg', type:'image', dataUrl, size:file.size||0};
  t.status = 'Resolved';
  t.resolvedAt = nowTs();
  t.updatedAt = nowTs();

  // Auto-stop timer when resolved (same as any other status change would).
  if(S.timer && S.timer.ticketId === ticketId){
    await stopTimerAndSave();
  }

  await saveTickets();
  await pushAudit(ticketId, 'Status changed', `${old} → Resolved (photo proof attached)`);
  await pushNotification(t.clientId, {type:'status_change', title:`Ticket ${ticketNumStr(t)} status changed`, body:`"${t.subject}" is now Resolved.`, ticketId:t.id});
  closeModal();
  showToast('Ticket marked Resolved.');
  render();
}
async function reopenTicket(ticketId){
  const t = DB.tickets.find(x=>x.id===ticketId);
  const now = nowTs();
  const hoursSinceResolved = t.resolvedAt ? (now - t.resolvedAt) / 3600000 : 999;

  if(hoursSinceResolved > 24){
    showToast('Cannot reopen: Tickets can only be reopened within 24 hours of resolution.');
    return;
  }

  t.status='In Progress'; t.resolvedAt=null; t.updatedAt=now;
  await saveTickets();
  await pushAudit(ticketId, 'Ticket reopened', 'Reopened by client');
  // Client-initiated — don't notify the client about their own action,
  // but the assignee (and their team leader) need to know it's back open.
  if(t.assigneeId){
    const reopenOpts = {type:'ticket_reopened', title:`Ticket reopened: ${ticketNumStr(t)}`, body:`"${t.subject}" was reopened by the client.`, ticketId:t.id};
    await pushNotification(t.assigneeId, reopenOpts);
    const agent = getUser(t.assigneeId);
    if(agent && agent.team) await notifyTeamLeader(agent.team, reopenOpts);
  }
  render();
}
// Lets an agent take an unassigned ticket in their own matched category
// without waiting for a team leader/admin to assign it via the dropdown —
// reuses the same category-match and 1-active-ticket-per-category capacity
// rules the routing engine already enforces (agentMatchesCategory /
// agentActiveCategoryCount), so a claim can't bypass either.
async function claimTicket(ticketId){
  const t = DB.tickets.find(x=>x.id===ticketId);
  const u = S.currentUser;
  if(!t || !u || u.role !== 'agent' || t.assigneeId) return;
  if(!agentMatchesCategory(u, t.category)){ showToast('This ticket isn\'t in your category.', 'warn'); return; }
  if(agentActiveCategoryCount(u, t.category) >= 1){ showToast(`You already have an In Progress ${t.category} ticket — resolve or pend it first.`, 'warn'); return; }
  t.assigneeId = u.id; t.updatedAt = nowTs();
  await saveTickets();
  await pushAudit(ticketId, 'Assignee changed', `Unassigned → ${u.name} (self-claimed)`);
  showToast('Ticket claimed.');
  render();
}
async function assignTicket(ticketId, agentId){
  const t = DB.tickets.find(x=>x.id===ticketId);
  const oldAssigneeId = t.assigneeId;
  const old = t.assigneeId ? getUser(t.assigneeId).name : 'Unassigned';
  t.assigneeId = agentId || null; t.updatedAt = nowTs();
  await saveTickets();
  await pushAudit(ticketId, 'Assignee changed', `${old} → ${agentId?getUser(agentId).name:'Unassigned'}`);
  if(agentId && agentId !== oldAssigneeId){
    await pushNotification(agentId, {type:'ticket_assigned', title:`Ticket assigned to you: ${ticketNumStr(t)}`, body:`"${t.subject}" was manually assigned to you.`, ticketId:t.id});
  }
  render();
}
async function changePriority(ticketId, priority){
  const t = DB.tickets.find(x=>x.id===ticketId);
  const old = t.priority;
  t.priority = priority; t.updatedAt = nowTs(); t.slaEscalated=false;
  await saveTickets();
  await pushAudit(ticketId, 'Priority changed', `${old} → ${priority}`);
  render();
}

async function sendReply(ticketId){
  const richEl = document.getElementById('reply-body');
  const body = richEl.innerHTML.trim();
  if(!body || body===''){ showToast('Write a message before sending.'); return; }
  const kind = S.composerKind;
  const msg = {id:uid('m'), ticketId, authorId:S.currentUser.id, body, kind, createdAt:nowTs(), attachments: S.composerAttachments};
  DB.messages = [...DB.messages, msg];
  await saveMessages();
  const t = DB.tickets.find(x=>x.id===ticketId);
  t.updatedAt = nowTs();
  let statusNote = '';
  if(S.currentUser.role==='client' && t.status==='Pending'){
    t.status = 'In Progress'; statusNote = ' — status auto-moved to In Progress';
    await pushAuditSystem(ticketId, 'Status changed', 'Pending → In Progress (client replied)');
  }
  if(S.currentUser.role!=='client' && kind==='public' && t.status==='Open'){
    t.status = 'In Progress';
    await pushAudit(ticketId, 'Status changed', 'Open → In Progress (first response)');
  }
  await saveTickets();
  const plainBody = body.replace(/<[^>]+>/g,'').slice(0,80);
  await pushAudit(ticketId, kind==='public'?'Public reply sent':'Internal note added', plainBody+statusNote);
  // Internal notes aren't visible to the client, so only a public reply
  // notifies them; a client's own message notifies the assignee instead.
  if(S.currentUser.role==='client'){
    if(t.assigneeId) await pushNotification(t.assigneeId, {type:'client_reply', title:`New client message: ${ticketNumStr(t)}`, body:plainBody, ticketId:t.id});
  } else if(kind==='public'){
    await pushNotification(t.clientId, {type:'new_message', title:`New reply on your ticket: ${ticketNumStr(t)}`, body:plainBody, ticketId:t.id});
  }
  richEl.innerHTML='';
  S.composerAttachments = [];
  render();
}

