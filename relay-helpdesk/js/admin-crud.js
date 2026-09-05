/* ============================= ADMIN CRUD ============================= */
async function addUser(){
  const name = document.getElementById('au-name').value.trim();
  const email = document.getElementById('au-email').value.trim();
  const role = document.getElementById('au-role').value;
  const extraEl = document.getElementById('au-extra'); // absent entirely for role==='admin'
  const extra = extraEl ? extraEl.value.trim() : '';
  if(!name||!email){ showToast('Name and email required.'); return; }
  // Super Admin is a single hardcoded, permanent account (seeded at boot) —
  // nobody, including an existing Super Admin, can create another one. The
  // role dropdown doesn't even offer this option; this is a defense-in-depth
  // check in case that value reaches here some other way.
  if(role === 'superadmin'){
    showToast('New Super Admin accounts cannot be created.', 'warn');
    return;
  }
  const u = {id:uid('u'), name, email, role, active:true};
  if(role==='client') u.company = extra || '—';
  if(role==='agent' || role==='teamleader') {
    u.specialty = extra || 'General';
    u.team = ''; // Can be assigned later via teams management
  }
  DB.users = [...DB.users, u];
  await skSet('users', DB.users);
  closeModal(); showToast('User created.');
  await pushAudit(null, 'User created', `${S.currentUser.name} created ${role} account "${name}" (${email}).`);
  await notifyRoles(['admin','superadmin'], {type:'system_change', title:'New user created', body:`${S.currentUser.name} created ${role} account "${name}".`});
  render();
}
async function toggleUserActive(userId){
  const u = getUser(userId);
  if(!canModifyUser(u)){
    showToast('You cannot modify this user.');
    return;
  }
  u.active = !u.active;
  // Disabling an agent should also force them offline immediately — otherwise
  // their status badge/online flag stays stale until their next login or
  // manual toggle, which is confusing even though isAgentAvailable() now
  // blocks routing to them regardless of the online flag.
  if(!u.active) u.online = false;
  await skSet('users', DB.users);
  await pushAudit(null, `User ${u.active?'enabled':'disabled'}`, `${S.currentUser.name} ${u.active?'enabled':'disabled'} ${u.name}'s account.`);
  await notifyRoles(['admin','superadmin'], {type:'system_change', title:`User ${u.active?'enabled':'disabled'}`, body:`${S.currentUser.name} ${u.active?'enabled':'disabled'} ${u.name}'s account.`});
  render();
}
async function changeUserRole(userId, role){
  const u = getUser(userId);
  const currentUser = S.currentUser;

  // Cannot change own role
  if(userId === currentUser.id){
    showToast('You cannot change your own role.');
    return;
  }

  // Nobody can be promoted to Super Admin — it's a single hardcoded,
  // permanent account. The role dropdown never lists this option for a
  // non-superadmin user, so this is defense-in-depth.
  if(role === 'superadmin'){
    showToast('Users cannot be promoted to Super Admin.', 'warn');
    return;
  }

  // Super Admin cannot change other Super Admins
  if(u.role === 'superadmin' && currentUser.role !== 'superadmin'){
    showToast('You cannot change a Super Admin role.');
    return;
  }

  // Admin cannot change Super Admins
  if(u.role === 'superadmin' && currentUser.role === 'admin'){
    showToast('You cannot change a Super Admin role.');
    return;
  }

  const oldRole = u.role;
  const oldTeam = u.team;
  u.role = role;

  // Moving away from 'agent' means they no longer receive auto-routed work
  // as an agent — strip any Routing Rules entries that still list them, so
  // Admin > Routing Rules doesn't keep displaying a rule for someone who
  // can no longer act on it.
  let removedRules = 0;
  if(oldRole === 'agent' && role !== 'agent'){
    const before = DB.routing_rules.length;
    DB.routing_rules = DB.routing_rules.filter(r=>r.assigneeId !== userId);
    removedRules = before - DB.routing_rules.length;
    if(removedRules > 0) await skSet('routing_rules', DB.routing_rules);
  }

  // team/specialty are only meaningful for agent/teamleader — clear them
  // when moving to a role where they'd otherwise be stale.
  let vacatedTeam = '';
  if((oldRole === 'agent' || oldRole === 'teamleader') && role !== 'agent' && role !== 'teamleader'){
    vacatedTeam = oldTeam || '';
    u.team = '';
    u.specialty = '';
  }
  await skSet('users', DB.users);

  // Warn immediately if demoting a team leader leaves their team leaderless
  // — this used to happen silently with zero indication at the moment of change.
  let warning = '';
  if(oldRole === 'teamleader' && vacatedTeam){
    const stillHasLeader = DB.users.some(x=>x.id!==userId && x.role==='teamleader' && x.team===vacatedTeam);
    if(!stillHasLeader) warning = ` "${vacatedTeam}" now has no team leader.`;
  }

  const detail = `${currentUser.name} changed ${u.name}'s role from ${oldRole} to ${role}.`
    + (removedRules > 0 ? ` Removed ${removedRules} stale routing rule(s).` : '')
    + warning;
  await pushAudit(null, 'Role changed', detail);
  await notifyRoles(['admin','superadmin'], {type:'system_change', title:'User role changed', body: detail});
  showToast(warning ? `Role changed.${warning}` : 'Role changed.', warning ? 'warn' : 'info');
  render();
}
async function saveSLA(){
  const cfg = {};
  for(const p of PRIORITIES){
    cfg[p] = {minutes: parseInt(document.getElementById('sla-'+p).value,10) || DB.sla_config[p].minutes};
  }
  DB.sla_config = cfg;
  await skSet('sla_config', DB.sla_config);
  showToast('SLA thresholds updated.');
  await notifyRoles(['admin','superadmin'], {type:'system_change', title:'SLA thresholds updated', body:`${S.currentUser.name} updated the SLA rules.`});
  render();
}
async function addRoutingRule(){
  const category = document.getElementById('rr-cat').value;
  const assigneeId = document.getElementById('rr-agent').value;
  // The "Assign to" <select> is populated from getAgents(), which excludes
  // disabled agents — if every agent happens to be disabled it renders with
  // zero <option>s and .value reads as "". Guard before proceeding, or this
  // saves a routing rule with assigneeId:"" and then crashes on
  // getUser(assigneeId).name below (getUser("") is undefined).
  if(!assigneeId){
    showToast('No active agents available to assign.');
    return;
  }
  // A category can have multiple rule agents now — only block re-adding the
  // exact same agent to the same category twice.
  if(DB.routing_rules.find(r=>r.category===category && r.assigneeId===assigneeId)){
    showToast('This agent is already a routing rule for this category.');
    return;
  }
  DB.routing_rules = [...DB.routing_rules, {id:uid('rr'), category, assigneeId}];
  await skSet('routing_rules', DB.routing_rules);
  showToast('Routing rule added.');
  await notifyRoles(['admin','superadmin'], {type:'system_change', title:'Routing rule added', body:`${S.currentUser.name} added ${getUser(assigneeId).name} as a ${category} routing rule.`});
  render();
}
async function removeRoutingRule(id){
  const rule = DB.routing_rules.find(r=>r.id===id);
  const agent = rule ? getUser(rule.assigneeId) : null;
  const doRemove = async () => {
    DB.routing_rules = DB.routing_rules.filter(r=>r.id!==id);
    await skSet('routing_rules', DB.routing_rules);
    if(rule){
      await notifyRoles(['admin','superadmin'], {type:'system_change', title:'Routing rule removed', body:`${S.currentUser.name} removed ${agent?agent.name:'an agent'} as a ${rule.category} routing rule.`});
    }
    render();
  };
  if(rule) openConfirm(`Remove ${agent?agent.name:'this agent'} as a ${rule.category} routing rule agent?`, doRemove, {title:'Remove routing rule', confirmLabel:'Remove'});
  else await doRemove();
}
async function addCanned(){
  const title = document.getElementById('cr-title').value.trim();
  const body = document.getElementById('cr-body').value.trim();
  if(!title||!body){ showToast('Title and body required.'); return; }
  DB.canned_responses = [...DB.canned_responses, {id:uid('cr'), title, body}];
  await skSet('canned_responses', DB.canned_responses);
  closeModal();
  await notifyRoles(['admin','superadmin'], {type:'system_change', title:'Canned response added', body:`${S.currentUser.name} added "${title}".`});
  render();
}
async function removeCanned(id){
  const c = DB.canned_responses.find(x=>x.id===id);
  const doRemove = async () => {
    DB.canned_responses = DB.canned_responses.filter(c=>c.id!==id);
    await skSet('canned_responses', DB.canned_responses);
    if(c) await notifyRoles(['admin','superadmin'], {type:'system_change', title:'Canned response removed', body:`${S.currentUser.name} removed "${c.title}".`});
    render();
  };
  if(c) openConfirm(`Remove the canned response "${c.title}"?`, doRemove, {title:'Remove canned response', confirmLabel:'Remove'});
  else await doRemove();
}
function insertCanned(id){
  const c = DB.canned_responses.find(x=>x.id===id);
  const el = document.getElementById('reply-body');
  if(el && c){ el.innerHTML += (el.innerHTML?'<br>':'') + c.body; }
}

