/* ============================= ADMIN VIEWS ============================= */
function renderTeamLeaderTeamView(){
  const myTeam = S.currentUser.team;
  const teamMembers = DB.users.filter(u=>u.team===myTeam && u.role==='agent');
  const teamTickets = DB.tickets.filter(t=>teamMembers.some(m=>m.id===t.assigneeId));

  // Count agents in each status bucket for the summary strip
  const online = teamMembers.filter(m=>isAgentOnline(m)).length;
  const onBreak = teamMembers.filter(m=>isAgentOnBreak(m)).length;
  const offline = teamMembers.filter(m=>!isAgentOnline(m)).length;

  return `
  <div class="card card-pad" style="margin-bottom:18px;">
    <div class="small muted" style="font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px;">Team: ${esc(myTeam)}</div>
    <div class="muted small">You are leading ${teamMembers.length} agent${teamMembers.length!==1?'s':''} with ${teamTickets.filter(t=>t.status!=='Closed').length} active ticket${teamTickets.filter(t=>t.status!=='Closed').length!==1?'s':''}.</div>
    <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">
      <span class="badge b-resolved"><span class="dot"></span>${online} Online</span>
      <span class="badge b-pending"><span class="dot"></span>${onBreak} On Break</span>
      <span class="badge b-closed"><span class="dot"></span>${offline} Offline</span>
    </div>
  </div>
  <div class="card">
    <table>
      <thead><tr><th>Agent</th><th>Email</th><th>Specialty</th><th>Active Tickets</th><th>Status</th><th>Current Category</th></tr></thead>
      <tbody>
        ${teamMembers.map(m=>{
          const activeCount = teamTickets.filter(t=>t.assigneeId===m.id && t.status!=='Closed' && t.status!=='Resolved').length;
          // Active category = the category of their currently In Progress ticket (if any)
          const inProg = teamTickets.find(t=>t.assigneeId===m.id && t.status==='In Progress');
          return `<tr>
            <td style="font-weight:600;">${esc(m.name)}</td>
            <td class="muted">${esc(m.email)}</td>
            <td>${esc(m.specialty||'General')}</td>
            <td>${activeCount}</td>
            <td>${statusBadge(m)}</td>
            <td class="muted small">${inProg ? esc(inProg.category) : '—'}</td>
          </tr>`;
        }).join('') || '<tr><td colspan="6" class="muted">No agents in your team yet.</td></tr>'}
      </tbody>
    </table>
  </div>`;
}

function renderAdminTeams(){
  return `
  <div style="display:flex;justify-content:flex-end;margin-bottom:12px;">
    <button class="btn btn-primary" onclick="openCreateTeamModal()">+ Create Team</button>
  </div>
  <div class="grid grid-2">
    ${DB.teams.map(team=>{
      const leader = DB.users.find(u=>u.team===team.name && u.role==='teamleader');
      const members = DB.users.filter(u=>u.team===team.name && u.role==='agent');
      return `
      <div class="card card-pad">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">
          <div>
            <div style="font-weight:700;font-size:15px;">${esc(team.name)}</div>
            <div class="muted small">Leader: ${leader?esc(leader.name):'<span style="color:var(--red);">No leader assigned</span>'}</div>
          </div>
          <button class="btn btn-ghost btn-sm" onclick="openManageTeamModal('${team.id}')">Manage</button>
        </div>
        <hr class="hair">
        <div class="small muted" style="font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">Members (${members.length})</div>
        ${members.length ? members.map(m=>`
          <div class="kvrow">
            <span class="k">${esc(m.name)}</span>
            <span class="v small">${esc(m.specialty||'General')}</span>
          </div>
        `).join('') : '<div class="muted small">No members yet.</div>'}
      </div>`;
    }).join('') || '<div class="empty"><div class="big">&#128101;</div>No teams created yet. Create one to get started.</div>'}
  </div>`;
}

function renderAdminOverview(){
  const counts = {Open:0,'In Progress':0,Pending:0,Resolved:0,Closed:0};
  DB.tickets.forEach(t=>counts[t.status]++);
  const breaches = DB.tickets.filter(t=>slaInfo(t).breached);
  const unassigned = DB.tickets.filter(t=>!t.assigneeId && t.status!=='Closed').length;
  const totalTime = DB.tickets.reduce((s,t)=>s+ticketTimeSpent(t),0);
  return `
  <div class="grid grid-4" style="margin-bottom:18px;">
    <div class="card stat"><div class="n">${counts.Open+counts['In Progress']+counts.Pending}</div><div class="l">Active tickets</div></div>
    <div class="card stat"><div class="n" style="color:${breaches.length?'var(--red)':'inherit'}">${breaches.length}</div><div class="l">SLA breaches</div></div>
    <div class="card stat"><div class="n">${unassigned}</div><div class="l">Unassigned</div></div>
    <div class="card stat"><div class="n">${secondsToHuman(totalTime)}</div><div class="l">Time logged (all time)</div></div>
  </div>
  <div class="grid grid-2">
    <div class="card card-pad">
      <div class="small muted" style="font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px;">By status</div>
      ${Object.keys(STATUS_META).map(s=>`<div class="kvrow"><span class="k"><span class="badge ${STATUS_META[s].cls}"><span class="dot"></span>${STATUS_META[s].label}</span></span><span class="v">${counts[s]}</span></div>`).join('')}
    </div>
    <div class="card card-pad">
      <div class="small muted" style="font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px;">SLA breaches right now</div>
      ${breaches.length===0? '<div class="muted small">None — all clear.</div>' : breaches.map(t=>`
        <div class="kvrow"><span class="k"><span class="stamp" style="margin-right:6px;">${ticketNumStr(t)}</span>${esc(t.subject)}</span><span class="v"><button class="link-btn" onclick="goto('admin-ticket-detail','${t.id}')">Open →</button></span></div>
      `).join('')}
    </div>
  </div>
  <div class="card card-pad" style="margin-top:14px;">
    <div class="small muted">System checks run automatically every few seconds while this app is open (SLA escalation + auto-close of Resolved tickets after 24 hours). Use "Run system checks" above to trigger immediately.</div>
  </div>`;
}

function renderAdminUsers(){
  const currentUser = S.currentUser;
  const canModify = (u) => {
    if(u.id === currentUser.id) return false; // Cannot modify self
    if(u.role === 'superadmin' && currentUser.role !== 'superadmin') return false; // Cannot modify superadmin
    return true;
  };

  const getAvailableRoles = (u) => {
    if(u.role === 'superadmin') return ['superadmin'];
    if(u.role === 'admin' && currentUser.role === 'superadmin') return ['admin'];
    if(u.role === 'admin') return ['admin'];
    if(u.role === 'teamleader') return ['teamleader','agent','client'];
    if(u.role === 'agent') return ['teamleader','agent','client'];
    if(u.role === 'client') return ['client','agent','teamleader'];
    return ['agent','client'];
  };

  return `
  <div style="display:flex;justify-content:flex-end;margin-bottom:12px;"><button class="btn btn-primary" onclick="openAddUserModal()">+ Add user</button></div>
  <div class="card">
    <table>
      <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Detail</th><th>Status</th><th>Online</th><th>Actions</th></tr></thead>
      <tbody>
        ${DB.users.map(u=>{
          const modifiable = canModify(u);
          const availableRoles = getAvailableRoles(u);
          return `
        <tr>
          <td style="font-weight:600;">${esc(u.name)}</td>
          <td class="muted">${esc(u.email)}</td>
          <td>${modifiable ? `<select onchange="changeUserRole('${u.id}', this.value)" style="padding:4px 6px;font-size:12px;">
            ${availableRoles.map(r=>`<option value="${r}" ${u.role===r?'selected':''}>${r.replace('team','team ')}</option>`).join('')}
          </select>` : `<span class="badge rc-${u.role}" style="font-size:11px;padding:3px 8px;">${u.role.replace('team','team ')}</span>`}</td>
          <td class="muted small">${u.role==='client'?esc(u.company||'—'):(u.role==='agent'||u.role==='teamleader'?esc(u.team||'No team')+' · '+esc(u.specialty||'General'):'—')}</td>
          <td>${u.active!==false?'<span class="badge b-resolved"><span class="dot"></span>Active</span>':'<span class="badge b-closed"><span class="dot"></span>Disabled</span>'}</td>
          <td>${statusBadge(u)}</td>
          <td>
            ${modifiable
              ? `<button class="btn btn-ghost btn-sm ${u.active!==false?'btn-danger':''}" onclick="toggleUserActive('${u.id}')">${u.active!==false?'Disable':'Enable'}</button>`
              : '<span class="muted small">' + (u.id===S.currentUser.id?'you':'—') + '</span>'
            }
          </td>
        </tr>`;
        }).join('')}
      </tbody>
    </table>
  </div>`;
}
// The "extra" field means something different per role — company (free
// text, clients) vs. specialty (a real Category, agents/leaders) vs.
// nothing (admin) — so it's rebuilt live when the Role select changes.
function renderAddUserExtraField(role){
  if(role==='client'){
    return `<div class="field"><label>Company</label><input id="au-extra" type="text" placeholder="Optional"></div>`;
  }
  if(role==='agent' || role==='teamleader'){
    return `<div class="field"><label>Specialty</label>
      <select id="au-extra">
        <option value="General">General (matches every category)</option>
        ${DB.categories.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('')}
      </select>
      <div class="small muted" style="margin-top:4px;">Starts unassigned to a team — add them from Teams &amp; Members.</div>
    </div>`;
  }
  return '';
}
function updateAddUserExtraField(){
  const role = document.getElementById('au-role').value;
  const wrap = document.getElementById('au-extra-wrap');
  if(wrap) wrap.innerHTML = renderAddUserExtraField(role);
}
function openAddUserModal(){
  openModal(`
    <div class="modal-head"><h3>Add user</h3><button class="btn btn-ghost btn-sm" onclick="closeModal()">&times;</button></div>
    <div class="modal-body">
      <div class="field"><label>Name</label><input id="au-name" type="text"></div>
      <div class="field"><label>Email</label><input id="au-email" type="email"></div>
      <div class="field"><label>Role</label>
        <select id="au-role" onchange="updateAddUserExtraField()">
          <option value="client">Client</option>
          <option value="agent">IT Agent</option>
          <option value="teamleader">Team Leader</option>
          <option value="admin">Admin</option>
        </select>
        <div class="small muted" style="margin-top:4px;">Super Admin is a single permanent account and can't be created here.</div>
      </div>
      <div id="au-extra-wrap">${renderAddUserExtraField('client')}</div>
      <button class="btn btn-primary" onclick="addUser()">Create user</button>
    </div>`);
}

function renderAdminSLA(){
  return `
  <div class="card card-pad" style="max-width:520px;">
    <div class="small muted" style="margin-bottom:14px;">First-response threshold — how long an agent has to move a ticket out of <b>Open</b> before it's flagged as an SLA breach.</div>
    ${PRIORITIES.map(p=>`
      <div class="field" style="display:flex;align-items:center;gap:10px;">
        <label style="margin:0;flex:1;"><span class="badge ${PRIORITY_CLS[p]}">${p}</span></label>
        <input id="sla-${p}" type="number" min="1" value="${DB.sla_config[p].minutes}" style="width:100px;"> <span class="small muted">minutes</span>
      </div>`).join('')}
    <button class="btn btn-primary" onclick="saveSLA()">Save thresholds</button>
  </div>`;
}

function renderAdminPriorityMatrix(){
  return `
  <div class="card card-pad" style="max-width:760px;">
    <div class="small muted" style="margin-bottom:14px;">For each Urgency &times; Impact combination, choose the priority a new ticket gets. Urgency and Impact themselves stay fixed at Low/Medium/High/Critical — only what each intersection maps to is customizable. This is what the app actually uses; the reference image on the client's New Ticket form is just a general guide.</div>
    <div style="overflow-x:auto;">
    <table>
      <thead>
        <tr>
          <th></th>
          ${IMPACT_LEVELS.map(imp=>`<th style="text-align:center;">Impact: ${imp}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${URGENCY_LEVELS.map(urg=>`
          <tr>
            <th style="text-align:left;white-space:nowrap;">Urgency: ${urg}</th>
            ${IMPACT_LEVELS.map(imp=>{
              const key = `${urg}-${imp}`;
              const current = DB.priority_matrix[key] || 'Normal';
              return `<td style="text-align:center;">
                <select id="pm-${key}" style="width:auto;padding:5px 6px;font-size:12px;">
                  ${PRIORITIES.map(p=>`<option value="${p}" ${current===p?'selected':''}>${PRIORITY_LABEL[p]} — ${p}</option>`).join('')}
                </select>
              </td>`;
            }).join('')}
          </tr>`).join('')}
      </tbody>
    </table>
    </div>
    <button class="btn btn-primary" style="margin-top:14px;" onclick="savePriorityMatrix()">Save priority matrix</button>
  </div>`;
}
async function savePriorityMatrix(){
  const updated = {};
  for(const urg of URGENCY_LEVELS){
    for(const imp of IMPACT_LEVELS){
      const key = `${urg}-${imp}`;
      const el = document.getElementById('pm-'+key);
      updated[key] = el ? el.value : (DB.priority_matrix[key] || 'Normal');
    }
  }
  DB.priority_matrix = updated;
  await skSet('priority_matrix', DB.priority_matrix);
  showToast('Priority matrix updated.');
  await notifyRoles(['admin','superadmin'], {type:'system_change', title:'Priority matrix updated', body:`${S.currentUser.name} changed how urgency/impact map to priority.`});
  render();
}

function renderAdminRouting(){
  const rulesByCategory = {};
  DB.routing_rules.forEach(r=>{ (rulesByCategory[r.category] = rulesByCategory[r.category]||[]).push(r); });
  return `
  <div class="grid grid-2" style="align-items:start;">
    <div class="card">
      <table>
        <thead><tr><th>Category</th><th>Rule agents</th></tr></thead>
        <tbody>
          ${DB.categories.map(c=>{
            const rules = rulesByCategory[c] || [];
            return `<tr>
              <td style="vertical-align:top;padding-top:14px;white-space:nowrap;">${esc(c)}</td>
              <td style="padding-top:9px;">${rules.length ? rules.map(r=>`
                <span class="attach-chip">${esc(getUser(r.assigneeId).name)}<span class="x" onclick="removeRoutingRule('${r.id}')">&times;</span></span>
              `).join('') : '<span class="muted small">No manual rule — falls back to automatic round-robin.</span>'}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
    <div class="card card-pad">
      <div class="small muted" style="font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px;">Add rule</div>
      <div class="small muted" style="margin-bottom:12px;">A category can have more than one rule agent. New tickets in that category round-robin across all of its rule agents (respecting online/break status and the 1-active-ticket-per-category capacity limit) instead of always going to one fixed person.</div>
      <div class="field"><label>Category</label><select id="rr-cat">${DB.categories.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('')}</select></div>
      <div class="field"><label>Assign to</label><select id="rr-agent">${getAgents().map(a=>`<option value="${a.id}">${esc(a.name)} — ${esc(a.specialty||'General')}</option>`).join('')}</select></div>
      <button class="btn btn-primary" onclick="addRoutingRule()">Add rule</button>
    </div>
  </div>`;
}

function renderAdminCanned(){
  return `
  <div style="display:flex;justify-content:flex-end;margin-bottom:12px;"><button class="btn btn-primary" onclick="openAddCannedModal()">+ New template</button></div>
  <div class="grid grid-2">
    ${DB.canned_responses.map(c=>`
      <div class="card card-pad">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;"><div style="font-weight:700;">${esc(c.title)}</div><button class="btn btn-ghost btn-sm btn-danger" onclick="removeCanned('${c.id}')">Remove</button></div>
        <div class="small muted" style="margin-top:6px;">${esc(c.body)}</div>
      </div>`).join('')}
  </div>`;
}
function openAddCannedModal(){
  openModal(`
    <div class="modal-head"><h3>New canned response</h3><button class="btn btn-ghost btn-sm" onclick="closeModal()">&times;</button></div>
    <div class="modal-body">
      <div class="field"><label>Title</label><input id="cr-title" type="text" placeholder="e.g. Requesting a screenshot"></div>
      <div class="field"><label>Body</label><textarea id="cr-body" rows="4" placeholder="Template text..."></textarea></div>
      <button class="btn btn-primary" onclick="addCanned()">Save template</button>
    </div>`);
}

function renderAdminEmail(){
  return `
  <div class="card card-pad" style="max-width:640px;">
    <div class="small muted" style="margin-bottom:14px;">This simulates the inbound mail parser: in production, a dedicated address (e.g. <code class="mono">support@relay.io</code>) forwards to a mail webhook that extracts sender, subject and body into a new ticket automatically. Use this form to see that same parsing logic run against a sample message.</div>
    <div class="field"><label>From (client email)</label><input id="em-from" type="email" placeholder="client@company.com"></div>
    <div class="field"><label>Subject</label><input id="em-subject" type="text" placeholder="e.g. Can't connect to VPN"></div>
    <div class="field"><label>Body</label><textarea id="em-body" rows="5" placeholder="Paste the email body here..."></textarea></div>
    <button class="btn btn-primary" onclick="createTicket(true)">Process incoming email &rarr; create ticket</button>
  </div>`;
}

// Audit entries only carry a ticketId + a plain actor NAME string (not a
// user id) — see pushAudit()/pushAuditSystem(). "IT staff" and "action
// type" filters work directly off the distinct actor/action values seen
// in the log; "ticket creator" and "category" filters resolve through the
// linked ticket, same as the queue's client filter does.
function filteredAuditLog(){
  const f = S.auditFilters;
  let log = DB.audit_log.slice();
  if(f.actor!=='all') log = log.filter(a=>a.actor===f.actor);
  if(f.action!=='all') log = log.filter(a=>a.action===f.action);
  if(f.ticket!=='all') log = log.filter(a=>a.ticketId===f.ticket);
  if(f.client!=='all' || f.category!=='all'){
    log = log.filter(a=>{
      const t = DB.tickets.find(x=>x.id===a.ticketId);
      if(f.client!=='all' && (!t || t.clientId!==f.client)) return false;
      if(f.category!=='all' && (!t || t.category!==f.category)) return false;
      return true;
    });
  }
  if(f.dateFrom){ const from = new Date(f.dateFrom).getTime(); if(!isNaN(from)) log = log.filter(a=>a.timestamp>=from); }
  if(f.dateTo){ const to = new Date(f.dateTo).getTime() + 86400000 - 1; if(!isNaN(to)) log = log.filter(a=>a.timestamp<=to); } // inclusive of the whole "to" day
  if(f.q){
    const q = f.q.toLowerCase();
    log = log.filter(a=>{
      const t = DB.tickets.find(x=>x.id===a.ticketId);
      return a.actor.toLowerCase().includes(q) || a.action.toLowerCase().includes(q) ||
        (a.detail||'').toLowerCase().includes(q) || (t && ticketNumStr(t).toLowerCase().includes(q));
    });
  }
  return log.sort((a,b)=>b.timestamp-a.timestamp);
}
function renderAdminAudit(){
  const f = S.auditFilters;
  const actorNames = [...new Set(DB.audit_log.map(a=>a.actor))].sort();
  const actionTypes = [...new Set(DB.audit_log.map(a=>a.action))].sort();
  const hasActiveFilters = f.actor!=='all' || f.client!=='all' || f.category!=='all' || f.action!=='all' || f.ticket!=='all' || f.dateFrom || f.dateTo || f.q;
  const ticketsByRecency = DB.tickets.slice().sort((a,b)=>b.ticketNumber-a.ticketNumber);
  return `
  <div class="filters">
    <div class="searchbox"><input type="text" placeholder="Search actor, action, detail, ticket #..." value="${esc(f.q)}" oninput="S.auditFilters.q=this.value;renderAuditList();"></div>
    <select onchange="S.auditFilters.ticket=this.value;renderAuditList();">
      <option value="all" ${f.ticket==='all'?'selected':''}>All tickets</option>
      ${ticketsByRecency.map(t=>`<option value="${t.id}" ${f.ticket===t.id?'selected':''}>${ticketNumStr(t)} — ${esc(t.subject.length>36?t.subject.slice(0,36)+'…':t.subject)}</option>`).join('')}
    </select>
    <select onchange="S.auditFilters.actor=this.value;renderAuditList();">
      <option value="all" ${f.actor==='all'?'selected':''}>All staff/actors</option>
      ${actorNames.map(n=>`<option value="${esc(n)}" ${f.actor===n?'selected':''}>${esc(n)}</option>`).join('')}
    </select>
    <select onchange="S.auditFilters.action=this.value;renderAuditList();">
      <option value="all" ${f.action==='all'?'selected':''}>All action types</option>
      ${actionTypes.map(a=>`<option value="${esc(a)}" ${f.action===a?'selected':''}>${esc(a)}</option>`).join('')}
    </select>
    <select onchange="S.auditFilters.category=this.value;renderAuditList();">
      <option value="all" ${f.category==='all'?'selected':''}>All categories</option>
      ${DB.categories.map(c=>`<option value="${esc(c)}" ${f.category===c?'selected':''}>${esc(c)}</option>`).join('')}
    </select>
    <select onchange="S.auditFilters.client=this.value;renderAuditList();">
      <option value="all" ${f.client==='all'?'selected':''}>All ticket creators</option>
      ${getClients().map(c=>`<option value="${c.id}" ${f.client===c.id?'selected':''}>${esc(c.name)}</option>`).join('')}
    </select>
    <span class="small muted">From</span>
    <input type="date" value="${f.dateFrom}" onchange="S.auditFilters.dateFrom=this.value;renderAuditList();">
    <span class="small muted">to</span>
    <input type="date" value="${f.dateTo}" onchange="S.auditFilters.dateTo=this.value;renderAuditList();">
    ${hasActiveFilters ? `<button class="btn btn-ghost btn-sm" onclick="resetAuditFilters()">Clear filters</button>` : ''}
  </div>
  <div id="auditTableWrap">${renderAuditTableInner(filteredAuditLog())}</div>
  <div class="small muted" style="margin-top:10px;">Entries are append-only — there is no edit or delete action anywhere in this interface.</div>`;
}
function renderAuditTableInner(log){
  return `
  <div class="card">
    <table>
      <thead><tr><th>Time</th><th>Ticket</th><th>Actor</th><th>Action</th><th>Detail</th></tr></thead>
      <tbody>
        ${log.length===0 ? `<tr><td colspan="5"><div class="empty"><div class="big">&#128220;</div>No log entries match these filters.</div></td></tr>` :
        log.slice(0,300).map(a=>{
          const t = DB.tickets.find(x=>x.id===a.ticketId);
          return `<tr>
            <td class="muted small">${fmtDate(a.timestamp)}</td>
            <td>${t?`<span class="stamp" style="cursor:pointer;" onclick="goto('admin-ticket-detail','${t.id}')">${ticketNumStr(t)}</span>`:'—'}</td>
            <td>${esc(a.actor)}</td>
            <td style="font-weight:600;">${esc(a.action)}</td>
            <td class="muted">${esc(a.detail||'')}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  </div>
  <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-top:8px;">
    <div class="small muted">Showing ${Math.min(log.length,300)} of ${log.length} matching entr${log.length===1?'y':'ies'}${log.length>300?' — refine filters to narrow further' : ''}.</div>
    <div style="display:flex;gap:6px;">
      <button class="btn btn-ghost btn-sm" onclick="exportAuditCsv()">&#11015; Export CSV</button>
      <button class="btn btn-ghost btn-sm" onclick="exportAuditExcel()">&#11015; Export Excel</button>
    </div>
  </div>`;
}
function renderAuditList(){
  // Only patch the table, not the whole filters bar (same pattern as
  // renderQueueList()) — rebuilding the search <input> on every keystroke
  // would steal its own focus mid-type.
  const el = document.getElementById('auditTableWrap');
  if(el) el.innerHTML = renderAuditTableInner(filteredAuditLog());
}
function resetAuditFilters(){
  S.auditFilters = {actor:'all', client:'all', category:'all', action:'all', ticket:'all', dateFrom:'', dateTo:'', q:''};
  render();
}

