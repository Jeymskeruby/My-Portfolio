/* ============================= RENDER: SHELL ============================= */
function navItemsFor(role){
  if(role==='client') return [
    {v:'client-dashboard', ico:'&#128203;', label:'My Tickets'},
    {v:'client-new', ico:'&#10133;', label:'New Ticket'},
    {v:'client-kb', ico:'&#128218;', label:'Knowledge Base'},
  ];
  if(role==='agent') return [
    {v:'agent-queue', ico:'&#128203;', label:'Ticket Queue'},
    {v:'agent-kb', ico:'&#128218;', label:'Knowledge Base'},
  ];
  if(role==='teamleader') return [
    {v:'leader-queue', ico:'&#128203;', label:'Team Queue'},
    {v:'leader-team', ico:'&#128101;', label:'My Team'},
    {v:'leader-kb', ico:'&#128218;', label:'Knowledge Base'},
  ];
  if(role==='admin') return [
    {v:'admin-overview', ico:'&#128202;', label:'Overview'},
    {v:'admin-queue', ico:'&#128203;', label:'All Tickets'},
    {v:'admin-teams', ico:'&#128101;', label:'Teams & Members'},
    {v:'admin-users', ico:'&#128100;', label:'Users & RBAC'},
    {v:'admin-categories', ico:'&#127991;', label:'Categories'},
    {v:'admin-sla', ico:'&#9201;', label:'SLA Rules'},
    {v:'admin-priority-matrix', ico:'&#127919;', label:'Priority Matrix'},
    {v:'admin-routing', ico:'&#128257;', label:'Routing Rules'},
    {v:'admin-canned', ico:'&#128172;', label:'Canned Responses'},
    {v:'admin-email', ico:'&#128231;', label:'Email Intake'},
    {v:'admin-audit', ico:'&#128220;', label:'Audit Log'},
    {v:'admin-kb', ico:'&#128218;', label:'Knowledge Base'},
  ];
  if(role==='superadmin') return [
    {v:'admin-overview', ico:'&#128202;', label:'Overview'},
    {v:'admin-queue', ico:'&#128203;', label:'All Tickets'},
    {v:'admin-teams', ico:'&#128101;', label:'Teams & Members'},
    {v:'admin-users', ico:'&#128100;', label:'Users & RBAC'},
    {v:'admin-categories', ico:'&#127991;', label:'Categories'},
    {v:'admin-sla', ico:'&#9201;', label:'SLA Rules'},
    {v:'admin-priority-matrix', ico:'&#127919;', label:'Priority Matrix'},
    {v:'admin-routing', ico:'&#128257;', label:'Routing Rules'},
    {v:'admin-canned', ico:'&#128172;', label:'Canned Responses'},
    {v:'admin-email', ico:'&#128231;', label:'Email Intake'},
    {v:'admin-audit', ico:'&#128220;', label:'Audit Log'},
    {v:'admin-kb', ico:'&#128218;', label:'Knowledge Base'},
  ];
  return [];
}
function pageTitleFor(view){
  const map = {
    'client-dashboard':['My Tickets','View status and history for your requests'],
    'client-new':['New Ticket','Tell us what\'s going on and we\'ll route it to the right person'],
    'client-kb':['Knowledge Base','Quick answers before you open a ticket'],
    'client-ticket-detail':['Ticket',''],
    'agent-queue':['Ticket Queue','All open work across the helpdesk'],
    'agent-ticket-detail':['Ticket',''],
    'agent-kb':['Knowledge Base','Reference articles for common issues'],
    'leader-queue':['Team Queue','Tickets assigned to your team'],
    'leader-team':['My Team','Monitor and manage your team members'],
    'leader-ticket-detail':['Ticket',''],
    'leader-kb':['Knowledge Base','Reference articles for common issues'],
    'admin-overview':['Overview','Helpdesk health at a glance'],
    'admin-queue':['All Tickets','Full ticket list across every client'],
    'admin-ticket-detail':['Ticket',''],
    'admin-teams':['Teams & Members','Create and manage teams, assign leaders and members'],
    'admin-users':['Users & RBAC','Manage accounts and permissions'],
    'admin-categories':['Categories','Ticket categories, agent specialties, and routing rule targets'],
    'admin-sla':['SLA Rules','First-response thresholds by priority'],
    'admin-priority-matrix':['Priority Matrix','Configure what each Urgency × Impact combination maps to'],
    'admin-routing':['Automated Routing','Auto-assign tickets by category'],
    'admin-canned':['Canned Responses','Reusable reply templates for agents'],
    'admin-email':['Email Intake','Simulates the email-to-ticket parser'],
    'admin-audit':['Audit Log','Permanent, append-only history of ticket changes'],
    'admin-kb':['Knowledge Base','Manage self-service articles'],
  };
  return map[view] || ['Relay',''];
}

async function render(){
  if(!S.currentUser){ root().innerHTML = renderLogin() + `<div id="modalHolder"></div><div id="toastHolder">${toastHtml()}</div>`; return; }
  const role = S.currentUser.role;
  const items = navItemsFor(role);
  const [title, sub] = pageTitleFor(S.view);
  // #modalHolder gets rebuilt empty below (it's a full innerHTML replace) —
  // preserve whatever's open in it so a full render() (e.g. the 6s poll on
  // a whitelisted view) can't silently close a modal out from under the
  // user. Not a currently-reachable path (nothing on those views opens a
  // modal today), but cheap insurance against it becoming one.
  const existingModalHolder = document.getElementById('modalHolder');
  const preservedModalHtml = existingModalHolder ? existingModalHolder.innerHTML : '';

  let sidebarLabel = 'Console';
  if(role==='client') sidebarLabel = 'Support';
  else if(role==='agent') sidebarLabel = 'Helpdesk';
  else if(role==='teamleader') sidebarLabel = 'Team Leader';
  else if(role==='admin' || role==='superadmin') sidebarLabel = 'Admin Console';

  const viewContent = await renderView();

  root().innerHTML = `
  <div class="shell">
    <div class="sidebar">
      <div class="nav">
        <div class="nav-group">
          <div class="nav-label">${sidebarLabel}</div>
          ${items.map(it=>`<button class="nav-item ${S.view===it.v?'active':''}" onclick="goto('${it.v}')"><span class="ico">${it.ico}</span>${it.label}</button>`).join('')}
        </div>
      </div>
      <div class="side-foot">
        <div class="who"><div class="avatar">${userInitials(S.currentUser)}</div><div><div class="who-name">${esc(S.currentUser.name)}</div><div class="who-role">${role.replace('team','team ')}</div></div></div>
        ${renderStatusRow(role)}
        <button class="logout-btn" onclick="logout()">Sign out</button>
      </div>
    </div>
    <div class="main">
      <div class="topbar"><div><h1>${title}</h1>${sub?`<div class="sub">${sub}</div>`:''}</div><div style="display:flex;gap:8px;align-items:center;">${notificationBellHtml()}${topRightFor(role)}</div></div>
      <div class="content" id="content">${viewContent}</div>
    </div>
  </div>
  <div id="modalHolder">${preservedModalHtml}</div>
  <div id="toastHolder">${toastHtml()}</div>
  `;
}
function topRightFor(role){
  if(role==='client') return `<button class="btn btn-amber" onclick="goto('client-new')">+ New ticket</button>`;
  if(role==='admin' || role==='superadmin') return `<button class="btn" onclick="runSystemChecks(false).then(render)">&#8635; Run system checks</button>`;
  return '';
}

async function renderView(){
  switch(S.view){
    case 'client-dashboard': return renderClientDashboard();
    case 'client-new': return renderClientNewTicket();
    case 'client-kb': return renderKB('client');
    case 'client-ticket-detail': return await renderTicketDetail('client');
    case 'agent-queue': return renderQueue('agent');
    case 'agent-ticket-detail': return await renderTicketDetail('agent');
    case 'agent-kb': return renderKB('agent');
    case 'leader-queue': return renderQueue('leader');
    case 'leader-team': return renderTeamLeaderTeamView();
    case 'leader-ticket-detail': return await renderTicketDetail('leader');
    case 'leader-kb': return renderKB('leader');
    case 'admin-overview': return renderAdminOverview();
    case 'admin-queue': return renderQueue('admin');
    case 'admin-ticket-detail': return await renderTicketDetail('admin');
    case 'admin-teams': return renderAdminTeams();
    case 'admin-users': return renderAdminUsers();
    case 'admin-categories': return renderAdminCategories();
    case 'admin-sla': return renderAdminSLA();
    case 'admin-priority-matrix': return renderAdminPriorityMatrix();
    case 'admin-routing': return renderAdminRouting();
    case 'admin-canned': return renderAdminCanned();
    case 'admin-email': return renderAdminEmail();
    case 'admin-audit': return renderAdminAudit();
    case 'admin-kb': return renderKB('admin');
    default: return '<div class="empty">Not found.</div>';
  }
}

