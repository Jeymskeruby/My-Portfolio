/* ============================= QUEUE VIEW (agent + admin) ============================= */
// Guards against a stale S.queueFilters.assignee value (e.g. the referenced
// agent was disabled since it was picked) silently filtering the list by an
// id that's no longer offered as a selectable option in the dropdown.
// Shared by renderQueue()/renderQueueList() so the fix can't land on one
// copy and miss the other (see Problems.txt #33 for why that's worth
// avoiding here specifically).
function sanitizeQueueFilters(){
  const f = S.queueFilters;
  if(f.assignee!=='all' && f.assignee!=='unassigned' && !getAgents().find(a=>a.id===f.assignee)){
    f.assignee = 'all';
  }
}
function renderQueue(ctx){
  sanitizeQueueFilters();
  const f = S.queueFilters;
  let list = DB.tickets.slice();

  // For team leader, filter to only tickets assigned to their team agents or unassigned in their categories
  if(ctx === 'leader' && S.currentUser.team){
    const teamAgentIds = DB.users.filter(u=>u.team===S.currentUser.team && u.role==='agent').map(u=>u.id);
    // Include team leader's own tickets, their team agents' tickets, and any
    // unassigned ticket in a category one of this leader's agents covers
    // (specialty or Routing Rules) so the leader can manually assign it.
    list = list.filter(t=>
      teamAgentIds.includes(t.assigneeId) ||
      t.assigneeId === S.currentUser.id ||
      (!t.assigneeId && teamHasCategory(S.currentUser.team, t.category))
    );
  }

  // For agents: always see your own assigned tickets; otherwise see team members'
  // tickets and unclaimed tickets, but only within your matched category/categories
  // (specialty, or any category you're a Routing Rules agent for — see
  // agentMatchesCategory). A General-specialty agent sees everything in scope.
  if(ctx === 'agent' && S.currentUser.team){
    const teamMemberIds = DB.users.filter(u=>u.team===S.currentUser.team && (u.role==='agent' || u.role==='teamleader')).map(u=>u.id);
    if(S.currentUser.role === 'agent'){
      const sp = (S.currentUser.specialty || 'General').trim();
      const isGeneral = (sp === 'General' || sp === '');
      list = list.filter(t=>{
        if(t.assigneeId === S.currentUser.id) return true;
        if(!t.assigneeId) return isGeneral || agentMatchesCategory(S.currentUser, t.category);
        if(!teamMemberIds.includes(t.assigneeId)) return false;
        return isGeneral || agentMatchesCategory(S.currentUser, t.category);
      });
    } else {
      list = list.filter(t=>teamMemberIds.includes(t.assigneeId) || t.assigneeId === S.currentUser.id);
    }
  }

  if(f.status!=='all') list = list.filter(t=>t.status===f.status);
  if(f.priority!=='all') list = list.filter(t=>t.priority===f.priority);
  if(f.category!=='all') list = list.filter(t=>t.category===f.category);
  if(f.assignee!=='all') list = list.filter(t=> f.assignee==='unassigned' ? !t.assigneeId : t.assigneeId===f.assignee);
  if(f.client!=='all') list = list.filter(t=>t.clientId===f.client);
  if(f.q) list = list.filter(t=> t.subject.toLowerCase().includes(f.q.toLowerCase()) || ticketNumStr(t).toLowerCase().includes(f.q.toLowerCase()));

  const sk = S.querySort.key, sd = S.querySort.dir;
  list.sort((a,b)=>{
    let av=a[sk], bv=b[sk];
    if(sk==='priority'){ const ord={Critical:0,High:1,Normal:2,Low:3}; av=ord[a.priority]; bv=ord[b.priority]; }
    if(typeof av==='string'){ av=av.toLowerCase(); bv=bv.toLowerCase(); }
    if(av<bv) return sd==='asc'?-1:1; if(av>bv) return sd==='asc'?1:-1; return 0;
  });

  const breachCount = list.filter(t=>slaInfo(t).breached).length;

  return `
  <div class="filters">
    <div class="searchbox"><input type="text" placeholder="Search subject or ticket #..." value="${esc(f.q)}" oninput="S.queueFilters.q=this.value;renderQueueList();"></div>
    <select onchange="S.queueFilters.status=this.value;renderQueueList();">
      <option value="all" ${f.status==='all'?'selected':''}>All statuses</option>
      ${Object.keys(STATUS_META).map(s=>`<option value="${s}" ${f.status===s?'selected':''}>${STATUS_META[s].label}</option>`).join('')}
    </select>
    <select onchange="S.queueFilters.priority=this.value;renderQueueList();">
      <option value="all" ${f.priority==='all'?'selected':''}>All priorities</option>
      ${PRIORITIES.map(p=>`<option value="${p}" ${f.priority===p?'selected':''}>${PRIORITY_LABEL[p]}</option>`).join('')}
    </select>
    <select onchange="S.queueFilters.category=this.value;renderQueueList();">
      <option value="all" ${f.category==='all'?'selected':''}>All categories</option>
      ${DB.categories.map(c=>`<option value="${esc(c)}" ${f.category===c?'selected':''}>${esc(c)}</option>`).join('')}
    </select>
    <select onchange="S.queueFilters.assignee=this.value;renderQueueList();">
      <option value="all" ${f.assignee==='all'?'selected':''}>${(S.currentUser.role!=='admin' && S.currentUser.role!=='superadmin' && S.currentUser.team) ? 'All assignees (my team)' : 'All assignees'}</option>
      <option value="unassigned" ${f.assignee==='unassigned'?'selected':''}>Unassigned</option>
      ${getTeamAgents().map(a=>`<option value="${a.id}" ${f.assignee===a.id?'selected':''}>${esc(a.name)}</option>`).join('')}
    </select>
    <select onchange="S.queueFilters.client=this.value;renderQueueList();">
      <option value="all" ${f.client==='all'?'selected':''}>All clients</option>
      ${getClients().map(c=>`<option value="${c.id}" ${f.client===c.id?'selected':''}>${esc(c.name)}</option>`).join('')}
    </select>
    ${(f.status!=='all'||f.priority!=='all'||f.category!=='all'||f.assignee!=='all'||f.client!=='all'||f.q) ? `<button class="btn btn-ghost btn-sm" onclick="resetQueueFilters()">Clear filters</button>` : ''}
    ${breachCount>0?`<span class="badge sla-breach">&#9888; ${breachCount} SLA breach${breachCount>1?'es':''}</span>`:''}
  </div>
  <div class="card" id="queueTableWrap">${renderQueueTableInner(list, ctx)}</div>`;
}
function resetQueueFilters(){
  S.queueFilters = {status:'all', priority:'all', category:'all', assignee:'all', client:'all', q:''};
  render();
}
function renderQueueTableInner(list, ctx){
  if(list.length===0) return `<div class="empty"><div class="big">&#128203;</div>No tickets match these filters.</div>`;
  function th(key,label){ return `<th onclick="sortQueue('${key}')">${label}${S.querySort.key===key? (S.querySort.dir==='asc'?' &#8593;':' &#8595;'):''}</th>`; }
  return `
  <table>
    <thead><tr>${th('ticketNumber','Ticket')}${th('subject','Subject')}${th('clientId','Client')}${th('priority','Priority')}${th('status','Status')}${th('assigneeId','Assignee')}<th>SLA</th>${th('updatedAt','Updated')}</tr></thead>
    <tbody>
      ${list.map(t=>{
        const info = slaInfo(t);
        const client = getUser(t.clientId);
        const agent = t.assigneeId ? getUser(t.assigneeId) : null;
        return `<tr class="row" onclick="goto('${ctx}-ticket-detail','${t.id}')">
          <td><span class="stamp">${ticketNumStr(t)}</span></td>
          <td>${esc(t.subject)}</td>
          <td>${client?esc(client.name):'—'}</td>
          <td><span class="badge ${PRIORITY_CLS[t.priority]}">${PRIORITY_LABEL[t.priority]}</span></td>
          <td><span class="badge ${STATUS_META[t.status].cls}"><span class="dot"></span>${STATUS_META[t.status].label}</span></td>
          <td>${agent?esc(agent.name):'<span class="muted">Unassigned</span>'}</td>
          <td>${info.breached? '<span class="badge sla-breach">BREACHED</span>' : (info.active? `<span class="small muted">${Math.max(0,Math.round(info.remaining/60000))}m left</span>`:'<span class="small muted">—</span>')}</td>
          <td class="muted small">${timeAgo(t.updatedAt)}</td>
        </tr>`;
      }).join('')}
    </tbody>
  </table>`;
}
function sortQueue(key){
  if(S.querySort.key===key){ S.querySort.dir = S.querySort.dir==='asc'?'desc':'asc'; } else { S.querySort.key=key; S.querySort.dir='asc'; }
  renderQueueList();
}
function renderQueueList(){
  sanitizeQueueFilters();
  const ctx = S.view.split('-')[0];
  const f = S.queueFilters;
  let list = DB.tickets.slice();
  // Team + category visibility filters (same logic as renderQueue)
  if(ctx === 'leader' && S.currentUser.team){
    const teamAgentIds = DB.users.filter(u=>u.team===S.currentUser.team && u.role==='agent').map(u=>u.id);
    // Also surface unassigned tickets in a category one of this leader's agents
    // covers, so the leader can manually assign them (teamHasCategory checks
    // specialty + Routing Rules coverage via agentMatchesCategory).
    list = list.filter(t=>
      teamAgentIds.includes(t.assigneeId) ||
      t.assigneeId === S.currentUser.id ||
      (!t.assigneeId && teamHasCategory(S.currentUser.team, t.category))
    );
  }
  if(ctx === 'agent' && S.currentUser.team){
    const teamMemberIds = DB.users.filter(u=>u.team===S.currentUser.team && (u.role==='agent' || u.role==='teamleader')).map(u=>u.id);
    if(S.currentUser.role === 'agent'){
      const sp = (S.currentUser.specialty || 'General').trim();
      const isGeneral = (sp === 'General' || sp === '');
      list = list.filter(t=>{
        if(t.assigneeId === S.currentUser.id) return true;
        if(!t.assigneeId) return isGeneral || agentMatchesCategory(S.currentUser, t.category);
        if(!teamMemberIds.includes(t.assigneeId)) return false;
        return isGeneral || agentMatchesCategory(S.currentUser, t.category);
      });
    } else {
      list = list.filter(t=>teamMemberIds.includes(t.assigneeId) || t.assigneeId === S.currentUser.id);
    }
  }
  if(f.status!=='all') list = list.filter(t=>t.status===f.status);
  if(f.priority!=='all') list = list.filter(t=>t.priority===f.priority);
  if(f.category!=='all') list = list.filter(t=>t.category===f.category);
  if(f.assignee!=='all') list = list.filter(t=> f.assignee==='unassigned' ? !t.assigneeId : t.assigneeId===f.assignee);
  if(f.client!=='all') list = list.filter(t=>t.clientId===f.client);
  if(f.q) list = list.filter(t=> t.subject.toLowerCase().includes(f.q.toLowerCase()) || ticketNumStr(t).toLowerCase().includes(f.q.toLowerCase()));
  const sk = S.querySort.key, sd = S.querySort.dir;
  list.sort((a,b)=>{
    let av=a[sk], bv=b[sk];
    if(sk==='priority'){ const ord={Critical:0,High:1,Normal:2,Low:3}; av=ord[a.priority]; bv=ord[b.priority]; }
    if(typeof av==='string'){ av=av.toLowerCase(); bv=bv.toLowerCase(); }
    if(av<bv) return sd==='asc'?-1:1; if(av>bv) return sd==='asc'?1:-1; return 0;
  });
  const el = document.getElementById('queueTableWrap');
  if(el) el.innerHTML = renderQueueTableInner(list, ctx);
}

