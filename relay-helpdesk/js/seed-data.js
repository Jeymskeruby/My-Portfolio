/* ============================= SEED DATA ============================= */
async function seedIfNeeded(){
  if(DB.meta && DB.meta.seeded){ return; }
  const t0 = nowTs();
  const day = 86400000, hr = 3600000, min = 60000;

  // online starts false for everyone — it should only flip true once a user
  // actually logs in (see login()/logout()), not as a seeded default.
  DB.users = [
    {id:'u_superadmin', name:'Super Admin', email:'superadmin@relay.io', role:'superadmin', active:true, online:false},
    {id:'u_admin', name:'Admin User', email:'admin@relay.io', role:'admin', active:true, online:false},
    {id:'u_lead1', name:'Team Leader 1', email:'leader1@relay.io', role:'teamleader', team:'Team Alpha', active:true, online:false},
    {id:'u_lead2', name:'Team Leader 2', email:'leader2@relay.io', role:'teamleader', team:'Team Beta', active:true, online:false},
    {id:'u_agent1', name:'Agent Alice', email:'alice@relay.io', role:'agent', specialty:'Networking', team:'Team Alpha', teamLeader:'u_lead1', active:true, online:false, agentStatus:'queuing'},
    {id:'u_agent2', name:'Agent Bob', email:'bob@relay.io', role:'agent', specialty:'Hardware', team:'Team Alpha', teamLeader:'u_lead1', active:true, online:false, agentStatus:'queuing'},
    {id:'u_agent3', name:'Agent Charlie', email:'charlie@relay.io', role:'agent', specialty:'Software', team:'Team Beta', teamLeader:'u_lead2', active:true, online:false, agentStatus:'queuing'},
    {id:'u_agent4', name:'Agent Diana', email:'diana@relay.io', role:'agent', specialty:'Account & Access', team:'Team Beta', teamLeader:'u_lead2', active:true, online:false, agentStatus:'queuing'},
    {id:'u_client1', name:'Client John', email:'john@acmecorp.com', role:'client', company:'Acme Corp', active:true, online:false},
    {id:'u_client2', name:'Client Sarah', email:'sarah@brightleaf.io', role:'client', company:'Brightleaf Studio', active:true, online:false},
  ];

  DB.kb_articles = [
    {id:uid('kb'), title:'How to reset your VPN password', category:'Networking', body:'Go to vpn.relay.io/reset, enter your work email, and follow the link sent to your inbox. New passwords must be 12+ characters. If you don\'t receive the email within 5 minutes, check your spam folder before opening a ticket.'},
    {id:uid('kb'), title:'Fixing "No Internet Access" on Wi-Fi', category:'Networking', body:'Forget the network in your Wi-Fi settings, restart your router, and reconnect using the password on the bottom of the router. If the issue persists after a reboot, it is likely a hardware fault — please open a ticket.'},
    {id:uid('kb'), title:'Requesting a new software license', category:'Software', body:'Standard software (browsers, PDF tools, Slack) can be self-installed from the Company Portal app. For paid licenses (Adobe, design tools), submit a ticket with your manager cc\'d for approval.'},
    {id:uid('kb'), title:'Setting up company email on your phone', category:'Email', body:'Add a new account in your phone\'s Mail app using "Exchange" as the account type. Server: mail.relay.io. Use your full email address and network password. Two-factor confirmation will be sent to your existing device.'},
  ];

  DB.canned_responses = [
    {id:uid('cr'), title:'Acknowledging receipt', body:'Thanks for reaching out — I\'ve received your ticket and I\'m looking into it now. I\'ll follow up shortly with next steps.'},
    {id:uid('cr'), title:'Requesting more info', body:'To help track this down, could you send a screenshot of the error and let me know roughly when it started happening?'},
    {id:uid('cr'), title:'Resolution confirmation', body:'This should be resolved on our end now — could you confirm you\'re no longer seeing the issue? I\'ll mark this resolved once you\'ve had a chance to check.'},
  ];

  DB.routing_rules = [
    {id:uid('rr'), category:'Networking', assigneeId:'u_agent1'},
    {id:uid('rr'), category:'Hardware', assigneeId:'u_agent2'},
    {id:uid('rr'), category:'Software', assigneeId:'u_agent3'},
    {id:uid('rr'), category:'Account & Access', assigneeId:'u_agent4'},
  ];

  DB.sla_config = {
    Critical:{minutes:15}, High:{minutes:60}, Normal:{minutes:480}, Low:{minutes:1440}
  };

  const T = [];
  const M = [];
  const A = [];

  function mkTicket(over){
    const id = uid('t');
    const base = {id, ticketNumber:0, subject:'', description:'', category:'Other', priority:'Normal', urgency:'Medium', impact:'Medium',
      status:'Open', clientId:'', assigneeId:null, createdAt:t0, updatedAt:t0, resolvedAt:null, closedAt:null,
      timeEntries:[], attachments:[], slaEscalated:false};
    return Object.assign(base, over);
  }

  // Ticket 1: Critical, breached SLA, unresolved, Open
  let t1 = mkTicket({subject:'Office VPN down for entire team', category:'Networking', priority:'Critical', urgency:'Critical', impact:'Critical',
    status:'Open', clientId:'u_client1', assigneeId:null, createdAt: t0 - 45*min, updatedAt: t0 - 45*min});
  t1.ticketNumber = 1041;
  T.push(t1);
  M.push({id:uid('m'), ticketId:t1.id, authorId:'u_client1', body:'Nobody on our team can connect to the VPN since about 9am. This is blocking a client deploy — can someone look ASAP?', kind:'public', createdAt:t1.createdAt, attachments:[]});
  A.push({id:uid('a'), ticketId:t1.id, actor:'Maria Cruz', action:'Ticket created', detail:'Priority: Critical', timestamp:t1.createdAt});

  // Ticket 2: In Progress, Networking, assigned to Jordan
  let t2 = mkTicket({subject:'Wi-Fi drops every afternoon on 3rd floor', category:'Networking', priority:'High', urgency:'High', impact:'Medium',
    status:'In Progress', clientId:'u_client2', assigneeId:'u_agent1', createdAt: t0 - day, updatedAt: t0 - 2*hr});
  t2.ticketNumber = 1038;
  T.push(t2);
  M.push({id:uid('m'), ticketId:t2.id, authorId:'u_client2', body:'Around 2-3pm every day our Wi-Fi becomes unusable. Restarting the router doesn\'t help for long.', kind:'public', createdAt:t2.createdAt, attachments:[]});
  M.push({id:uid('m'), ticketId:t2.id, authorId:'u_agent1', body:'Checked the AP logs — channel congestion from a neighboring network at that time of day. Testing a channel switch now.', kind:'internal', createdAt:t0 - 3*hr, attachments:[]});
  M.push({id:uid('m'), ticketId:t2.id, authorId:'u_agent1', body:'Thanks for flagging — I found likely interference on our current Wi-Fi channel. Switching channels this afternoon, will confirm once done.', kind:'public', createdAt:t0 - 2*hr, attachments:[]});
  A.push({id:uid('a'), ticketId:t2.id, actor:'Diego Ramirez', action:'Ticket created', detail:'Priority: High', timestamp:t2.createdAt});
  A.push({id:uid('a'), ticketId:t2.id, actor:'System', action:'Auto-assigned', detail:'Routed to Jordan Lee (Networking)', timestamp:t2.createdAt+min});
  A.push({id:uid('a'), ticketId:t2.id, actor:'Jordan Lee', action:'Status changed', detail:'Open → In Progress', timestamp:t0 - 3*hr});

  // Ticket 3: Pending on client
  let t3 = mkTicket({subject:'Laptop fan making loud grinding noise', category:'Hardware', priority:'Normal', urgency:'Medium', impact:'Low',
    status:'Pending', clientId:'u_client1', assigneeId:'u_agent2', createdAt: t0 - 2*day, updatedAt: t0 - day});
  t3.ticketNumber = 1029;
  T.push(t3);
  M.push({id:uid('m'), ticketId:t3.id, authorId:'u_client1', body:'My laptop fan has been very loud and grinding for the past two days.', kind:'public', createdAt:t3.createdAt, attachments:[]});
  M.push({id:uid('m'), ticketId:t3.id, authorId:'u_agent2', body:'Could you confirm the asset tag on the bottom of the laptop, and whether it also feels hot near the left vent?', kind:'public', createdAt:t0 - day, attachments:[]});
  A.push({id:uid('a'), ticketId:t3.id, actor:'Maria Cruz', action:'Ticket created', detail:'Priority: Normal', timestamp:t3.createdAt});
  A.push({id:uid('a'), ticketId:t3.id, actor:'System', action:'Auto-assigned', detail:'Routed to Sam Patel (Hardware)', timestamp:t3.createdAt+min});
  A.push({id:uid('a'), ticketId:t3.id, actor:'Sam Patel', action:'Status changed', detail:'Open → Pending', timestamp:t0 - day});

  // Ticket 4: Resolved, awaiting auto-close
  let t4 = mkTicket({subject:'Need Adobe Acrobat Pro license', category:'Software', priority:'Low', urgency:'Low', impact:'Low',
    status:'Resolved', clientId:'u_client2', assigneeId:'u_agent2', createdAt: t0 - 5*day, updatedAt: t0 - 2*day, resolvedAt: t0 - 2*day});
  t4.ticketNumber = 1012;
  t4.timeEntries = [{agentId:'u_agent2', seconds:15*60, note:'Provisioned license, sent activation email', at:t0 - 2*day}];
  T.push(t4);
  M.push({id:uid('m'), ticketId:t4.id, authorId:'u_client2', body:'Need Acrobat Pro for a client contract review, manager (approved over email) is fine with it.', kind:'public', createdAt:t4.createdAt, attachments:[]});
  M.push({id:uid('m'), ticketId:t4.id, authorId:'u_agent2', body:'License assigned and activation email sent — let me know if it doesn\'t show up within the hour.', kind:'public', createdAt:t0 - 2*day, attachments:[]});
  A.push({id:uid('a'), ticketId:t4.id, actor:'Diego Ramirez', action:'Ticket created', detail:'Priority: Low', timestamp:t4.createdAt});
  A.push({id:uid('a'), ticketId:t4.id, actor:'Sam Patel', action:'Status changed', detail:'In Progress → Resolved', timestamp:t0 - 2*day});

  // Ticket 5: Closed, historical
  let t5 = mkTicket({subject:'Password reset for shared drive', category:'Account & Access', priority:'Normal', urgency:'Medium', impact:'Low',
    status:'Closed', clientId:'u_client1', assigneeId:'u_agent2', createdAt: t0 - 12*day, updatedAt: t0 - 7*day, resolvedAt: t0 - 9*day, closedAt: t0 - 7*day});
  t5.ticketNumber = 998;
  T.push(t5);
  M.push({id:uid('m'), ticketId:t5.id, authorId:'u_client1', body:'Locked out of the shared drive, keep getting an auth error.', kind:'public', createdAt:t5.createdAt, attachments:[]});
  M.push({id:uid('m'), ticketId:t5.id, authorId:'u_agent2', body:'Reset the drive credential cache on our end — should work now on next login.', kind:'public', createdAt:t0 - 9*day, attachments:[]});
  A.push({id:uid('a'), ticketId:t5.id, actor:'Sam Patel', action:'Status changed', detail:'In Progress → Resolved', timestamp:t0 - 9*day});
  A.push({id:uid('a'), ticketId:t5.id, actor:'System', action:'Auto-closed', detail:'No client response within 5 days of resolution', timestamp:t0 - 7*day});

  DB.tickets = T;
  DB.messages = M;
  DB.audit_log = A;
  DB.viewers = {};
  DB.teams = [
    {id:uid('team'), name:'Team Alpha', createdAt:t0},
    {id:uid('team'), name:'Team Beta', createdAt:t0},
  ];
  DB.categories = ['Networking','Hardware','Software','Account & Access','Email','Other'];
  // Default ITSM matrix — identical outcomes to the original hardcoded
  // P1-P4 mapping, just stored per-cell instead of computed in code, so
  // Admin > Priority Matrix can edit any intersection.
  DB.priority_matrix = {
    'Critical-Critical':'Critical', 'Critical-High':'Critical', 'Critical-Medium':'High', 'Critical-Low':'High',
    'High-Critical':'Critical', 'High-High':'High', 'High-Medium':'High', 'High-Low':'Normal',
    'Medium-Critical':'High', 'Medium-High':'High', 'Medium-Medium':'Normal', 'Medium-Low':'Normal',
    'Low-Critical':'High', 'Low-High':'Normal', 'Low-Medium':'Normal', 'Low-Low':'Low',
  };
  DB.meta = {seeded:true, nextTicketNumber:1042};

  for(const k of KEYS){ await skSet(k, DB[k]); }
}

