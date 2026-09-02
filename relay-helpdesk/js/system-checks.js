/* ============================= SYSTEM CHECKS (SLA + auto-close) ============================= */
async function runSystemChecks(silent){
  let changed = false;
  const n = nowTs();
  for(const t of DB.tickets){
    // SLA breach escalation
    const info = slaInfo(t);
    if(info.breached && !t.slaEscalated){
      t.slaEscalated = true;
      changed = true;
      await pushAuditSystem(t.id, 'SLA breach — escalated', `${t.priority} priority ticket unanswered past ${DB.sla_config[t.priority].minutes}m threshold`);
      const breachOpts = {type:'sla_breach', title:`SLA breached: ${ticketNumStr(t)}`, body:`"${t.subject}" — ${t.priority} priority, unanswered past ${DB.sla_config[t.priority].minutes}m.`, ticketId:t.id};
      if(t.assigneeId){
        await pushNotification(t.assigneeId, breachOpts);
        const agent = getUser(t.assigneeId);
        if(agent && agent.team) await notifyTeamLeader(agent.team, breachOpts);
      } else {
        const teamsWithCategory = [...new Set(DB.users.filter(u=>u.team).map(u=>u.team))].filter(team=>teamHasCategory(team, t.category));
        for(const team of teamsWithCategory){ await notifyTeamLeader(team, breachOpts); }
      }
    }
    // Auto-close resolved tickets after 24 hours (changed from 5 days)
    if(t.status==='Resolved' && t.resolvedAt && (n - t.resolvedAt) > 24*3600000){
      t.status='Closed'; t.closedAt=n; t.updatedAt=n; changed=true;
      await pushAuditSystem(t.id, 'Auto-closed', 'No client response within 24 hours of resolution');
      await pushNotification(t.clientId, {type:'status_change', title:`Ticket ${ticketNumStr(t)} closed`, body:`"${t.subject}" was automatically closed after 24 hours with no response.`, ticketId:t.id});
    }
  }
  if(changed){ await saveTickets(); if(!silent) showToast('System checks applied updates.'); }
  return changed;
}
async function pushAuditSystem(ticketId, action, detail){
  const entry = {id:uid('a'), ticketId, actor:'System', action, detail, timestamp: nowTs()};
  DB.audit_log = [...DB.audit_log, entry];
  await skSet('audit_log', DB.audit_log);
}

