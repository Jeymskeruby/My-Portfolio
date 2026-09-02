/* ============================= TEAM MANAGEMENT ============================= */
// Teams are first-class records (DB.teams) so an empty team can exist before
// anyone is assigned to it. Membership itself is still just the existing
// user.team string field — these functions are the only place that mutates
// it going forward, instead of it only ever being set at user-creation time.
async function createTeam(){
  const nameEl = document.getElementById('team-name');
  const name = nameEl.value.trim();
  if(!name){ showToast('Team name is required.'); return; }
  if(DB.teams.find(t=>t.name.toLowerCase()===name.toLowerCase())){
    showToast('A team with this name already exists.');
    return;
  }
  DB.teams = [...DB.teams, {id:uid('team'), name, createdAt:nowTs()}];
  await skSet('teams', DB.teams);
  closeModal();
  showToast('Team created.');
  await pushAudit(null, 'Team created', `"${name}" was created by ${S.currentUser.name}.`);
  await notifyRoles(['admin','superadmin'], {type:'system_change', title:'New team created', body:`"${name}" was created by ${S.currentUser.name}.`});
  render();
}
async function assignTeamLeader(teamId, leaderId){
  const team = DB.teams.find(x=>x.id===teamId);
  if(!team) return;
  // Vacate the leadership of this team (whoever currently holds it) — if the
  // newly picked leader was leading a different team, overwriting their
  // .team field below naturally moves them off that team too, since a
  // team leader can only lead one team at a time.
  DB.users.forEach(u=>{ if(u.role==='teamleader' && u.team===team.name) u.team=''; });
  if(leaderId){
    const leader = getUser(leaderId);
    if(leader && leader.role==='teamleader') leader.team = team.name;
  }
  await skSet('users', DB.users);
  showToast('Team leader updated.');
  await pushAudit(null, 'Team leader updated', leaderId ? `${S.currentUser.name} made ${getUser(leaderId).name} the leader of ${team.name}.` : `${S.currentUser.name} removed ${team.name}'s leader.`);
  await notifyRoles(['admin','superadmin'], {type:'system_change', title:`Team leader updated: ${team.name}`, body: leaderId ? `${getUser(leaderId).name} is now leading ${team.name}.` : `${team.name} has no leader now.`});
  openManageTeamModal(teamId);
  render();
}
async function addTeamMember(teamId){
  const team = DB.teams.find(x=>x.id===teamId);
  const agentId = document.getElementById('team-add-agent').value;
  if(!team || !agentId) return;
  const a = getUser(agentId);
  if(a && a.role==='agent') a.team = team.name; // also covers transferring from another team
  await skSet('users', DB.users);
  if(a) await pushAudit(null, 'Team member added', `${a.name} was added to ${team.name} by ${S.currentUser.name}.`);
  await notifyRoles(['admin','superadmin'], {type:'system_change', title:`Team membership updated: ${team.name}`, body: a ? `${a.name} was added to ${team.name} by ${S.currentUser.name}.` : ''});
  openManageTeamModal(teamId);
  render();
}
async function removeTeamMember(teamId, userId){
  const u = getUser(userId);
  const team = DB.teams.find(x=>x.id===teamId);
  if(u) u.team = '';
  await skSet('users', DB.users);
  if(u && team){
    await pushAudit(null, 'Team member removed', `${u.name} was removed from ${team.name} by ${S.currentUser.name}.`);
    await notifyRoles(['admin','superadmin'], {type:'system_change', title:`Team membership updated: ${team.name}`, body:`${u.name} was removed from ${team.name} by ${S.currentUser.name}.`});
  }
  openManageTeamModal(teamId);
  render();
}
async function disbandTeam(teamId){
  const team = DB.teams.find(x=>x.id===teamId);
  if(!team) return;
  if(!confirm(`Disband ${team.name}? Its leader and members will become unassigned — nobody is deleted.`)) return;
  DB.users.forEach(u=>{ if(u.team===team.name) u.team=''; });
  DB.teams = DB.teams.filter(x=>x.id!==teamId);
  await skSet('users', DB.users);
  await skSet('teams', DB.teams);
  closeModal();
  showToast('Team disbanded.');
  await pushAudit(null, 'Team disbanded', `${S.currentUser.name} disbanded ${team.name}.`);
  await notifyRoles(['admin','superadmin'], {type:'system_change', title:`Team disbanded: ${team.name}`, body:`${S.currentUser.name} disbanded ${team.name}.`});
  render();
}
function openCreateTeamModal(){
  openModal(`
    <div class="modal-head"><h3>Create team</h3><button class="btn btn-ghost btn-sm" onclick="closeModal()">&times;</button></div>
    <div class="modal-body">
      <div class="field"><label>Team name</label><input id="team-name" type="text" placeholder="e.g. Team Gamma"></div>
      <button class="btn btn-primary" onclick="createTeam()">Create team</button>
    </div>`);
}
function openManageTeamModal(teamId){
  const team = DB.teams.find(x=>x.id===teamId);
  if(!team) return;
  const leader = DB.users.find(u=>u.team===team.name && u.role==='teamleader');
  const members = DB.users.filter(u=>u.team===team.name && u.role==='agent');
  const allLeaders = DB.users.filter(u=>u.role==='teamleader');
  const otherAgents = DB.users.filter(u=>u.role==='agent' && u.team!==team.name);
  openModal(`
    <div class="modal-head"><h3>Manage ${esc(team.name)}</h3><button class="btn btn-ghost btn-sm" onclick="closeModal()">&times;</button></div>
    <div class="modal-body">
      <div class="field">
        <label>Team leader</label>
        <select onchange="assignTeamLeader('${team.id}', this.value)">
          <option value="">— No leader —</option>
          ${allLeaders.map(l=>`<option value="${l.id}" ${leader&&leader.id===l.id?'selected':''}>${esc(l.name)}${l.team && l.team!==team.name ? ' (currently leads '+esc(l.team)+')' : ''}</option>`).join('')}
        </select>
      </div>
      <hr class="hair">
      <div class="small muted" style="font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">Members (${members.length})</div>
      ${members.length ? members.map(m=>`
        <div class="kvrow">
          <span class="k">${esc(m.name)} <span class="muted small">(${esc(m.specialty||'General')})</span></span>
          <span class="v"><button class="btn btn-ghost btn-sm btn-danger" onclick="removeTeamMember('${team.id}','${m.id}')">Remove</button></span>
        </div>`).join('') : '<div class="muted small">No members yet.</div>'}
      <div class="field" style="margin-top:12px;">
        <label>Add or transfer an agent into this team</label>
        <select id="team-add-agent">
          <option value="">Select an agent...</option>
          ${otherAgents.map(a=>`<option value="${a.id}">${esc(a.name)}${a.team ? ' (currently on '+esc(a.team)+')' : ' (unassigned)'}</option>`).join('')}
        </select>
        <button class="btn btn-sm" style="margin-top:8px;" onclick="addTeamMember('${team.id}')">Add to team</button>
      </div>
      <hr class="hair">
      <button class="btn btn-danger" style="width:100%;justify-content:center;" onclick="disbandTeam('${team.id}')">Disband team</button>
    </div>`);
}

