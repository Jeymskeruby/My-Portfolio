/* ============================= ROUTING HELPERS ============================= */
// An agent "matches" a category if their specialty equals it, if they have
// no specialty recorded yet (General) — in which case they catch everything —
// or if they've been added as a Routing Rules agent for that category (an
// agent can be a rule agent for more than one category; see Admin > Routing
// Rules). This is the single source of truth for both routing eligibility
// AND ticket-queue visibility, so the two stay in sync.
function agentMatchesCategory(u, category){
  if(!u || u.role !== 'agent') return false;
  const sp = (u.specialty || 'General').trim();
  if(sp === 'General' || sp === '') return true;
  if(sp === category) return true;
  return DB.routing_rules.some(r=>r.category===category && r.assigneeId===u.id);
}
// How many IN PROGRESS tickets does this agent already hold for this category?
// Capacity rule: 1 active ticket per category at a time.
function agentActiveCategoryCount(u, category){
  if(!u) return 0;
  return DB.tickets.filter(t =>
    t.assigneeId === u.id &&
    t.category === category &&
    t.status === 'In Progress'
  ).length;
}
// Eligible agents for a category within a team: matching specialty, online, not on break,
// and not already at capacity for this category.
function eligibleAgentsFor(category, team){
  return DB.users.filter(u =>
    u.role === 'agent' &&
    u.team === team &&
    agentMatchesCategory(u, category) &&
    isAgentAvailable(u) &&
    agentActiveCategoryCount(u, category) < 1
  );
}
// Shared round-robin picker: given a pool of candidate agents, pick the one
// who has worked this category least recently (by last assignment
// timestamp), tie-broken by lowest current active-category count.
function pickFromPool(pool, category){
  if(pool.length === 0) return null;
  const lastAssigned = {};
  DB.audit_log.filter(a=>a.action==='Auto-assigned').forEach(a=>{
    const m = a.detail.match(/to ([^(]+) \(/);
    if(m){ const name=m[1].trim(); const u=DB.users.find(x=>x.name===name); if(u) lastAssigned[u.id]=a.timestamp; }
  });
  const sorted = pool.slice().sort((a,b)=>{
    const ca = agentActiveCategoryCount(a, category), cb = agentActiveCategoryCount(b, category);
    if(ca !== cb) return ca - cb;
    const la = lastAssigned[a.id] || 0, lb = lastAssigned[b.id] || 0;
    return la - lb;
  });
  return sorted[0];
}
// Round-robin assignment across eligible agents. Falls back to any available
// matching agent (ignoring capacity) if none are strictly under capacity — the
// ticket stays unassigned only when there is literally nobody available.
function pickRoundRobin(category, team, excludeAgentId){
  const pool = eligibleAgentsFor(category, team).filter(a=>a.id !== excludeAgentId);
  return pickFromPool(pool, category);
}
// Agents manually configured as routing rules for this category (a category
// can now have any number of rule agents) who are currently online, not on
// break, and under the 1-active-ticket-per-category capacity limit.
function eligibleRoutingRuleAgents(category){
  const ruleAgentIds = DB.routing_rules.filter(r=>r.category===category).map(r=>r.assigneeId);
  return DB.users.filter(u =>
    u.role === 'agent' &&
    ruleAgentIds.includes(u.id) &&
    isAgentAvailable(u) &&
    agentActiveCategoryCount(u, category) < 1
  );
}
// Returns {team, agent} or null when no team has a matching available agent.
function resolveRoute(category){
  const teams = [...new Set(DB.users.filter(u=>u.team).map(u=>u.team))];
  for(const team of teams){
    const agent = pickRoundRobin(category, team);
    if(agent) return {team, agent};
  }
  // Fallback: any team that has at least one matching agent (even if busy/offline)
  for(const team of teams){
    const any = DB.users.find(u=>u.role==='agent' && u.team===team && agentMatchesCategory(u, category));
    if(any) return {team, agent:null, note:'no available agent — will stay unassigned'};
  }
  return null;
}
// Teams that have at least one agent matching this category (for routing validation).
function teamHasCategory(team, category){
  return DB.users.some(u=>u.role==='agent' && u.team===team && agentMatchesCategory(u, category));
}

function fmtDate(ts){ if(!ts) return '—'; const d = new Date(ts); return d.toLocaleDateString(undefined,{month:'short',day:'numeric'}) + ' · ' + d.toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'}); }
function timeAgo(ts){
  if(!ts) return '—';
  const s = Math.floor((nowTs()-ts)/1000);
  if(s<60) return 'just now';
  if(s<3600) return Math.floor(s/60)+'m ago';
  if(s<86400) return Math.floor(s/3600)+'h ago';
  return Math.floor(s/86400)+'d ago';
}
// Time entries are stored in seconds (see stopTimerAndSave/addManualTime).
// entrySeconds() also reads the old minutes-based format for any entries
// persisted before this change, so existing saved demo data still totals
// correctly without needing a Reset Demo.
function entrySeconds(e){
  if(typeof e.seconds === 'number') return e.seconds;
  if(typeof e.minutes === 'number') return e.minutes*60;
  return 0;
}
function secondsToHuman(totalSec){
  totalSec = Math.max(0, Math.round(totalSec||0));
  const h = Math.floor(totalSec/3600);
  const m = Math.floor((totalSec%3600)/60);
  const s = totalSec%60;
  if(h) return `${h}h ${m}m`;
  if(m) return `${m}m ${s}s`;
  return `${s}s`;
}
function ticketNumStr(t){ return 'RLY-' + t.ticketNumber; }

const STATUS_META = {
  Open:{cls:'b-open', label:'Open'},
  'In Progress':{cls:'b-progress', label:'In Progress'},
  Pending:{cls:'b-pending', label:'Pending Client'},
  Resolved:{cls:'b-resolved', label:'Resolved'},
  Closed:{cls:'b-closed', label:'Closed'},
};
const PRIORITY_CLS = {Critical:'p-critical', High:'p-high', Normal:'p-normal', Low:'p-low'};
const PRIORITY_LABEL = {Critical:'P1', High:'P2', Normal:'P3', Low:'P4'};

function nextStatuses(status, userRole){
  const isAdmin = userRole === 'admin' || userRole === 'superadmin';

  const statusMap = {
    'Open': ['In Progress','Pending','Resolved'],
    'In Progress': ['Pending','Resolved'],
    'Pending': ['In Progress','Resolved'],
    'Resolved': isAdmin ? ['Closed', 'Open', 'In Progress', 'Pending'] : [], // Only admin can manually close or reopen
    'Closed': isAdmin ? ['Open', 'In Progress', 'Pending'] : [] // Only admin can reopen closed tickets
  };

  return statusMap[status] || [];
}

function slaInfo(t){
  const cfg = DB.sla_config[t.priority] || {minutes:480};
  const deadline = t.createdAt + cfg.minutes*60000;
  const active = (t.status==='Open'); // first-response SLA clock stops once agent acts
  const remaining = deadline - nowTs();
  return {deadline, remaining, breached: active && remaining < 0, active};
}

function ticketTimeSpent(t){ return (t.timeEntries||[]).reduce((sum,e)=>sum+entrySeconds(e),0); }

function ticketTotalResolutionTime(t){
  if(!t.resolvedAt) return null;
  return t.resolvedAt - t.createdAt;
}

function msToHumanReadable(ms){
  if(!ms) return '—';
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  let parts = [];
  if(days) parts.push(days + 'd');
  if(hours) parts.push(hours + 'h');
  if(mins) parts.push(mins + 'm');
  return parts.length ? parts.join(' ') : '< 1m';
}

async function pushAudit(ticketId, action, detail){
  const entry = {id:uid('a'), ticketId, actor: S.currentUser ? S.currentUser.name : 'System', action, detail, timestamp: nowTs()};
  DB.audit_log = [...DB.audit_log, entry];
  await skSet('audit_log', DB.audit_log);
}

async function saveTickets(){ await skSet('tickets', DB.tickets); }
async function saveMessages(){ await skSet('messages', DB.messages); }
async function saveUsers(){ await skSet('users', DB.users); }
async function saveStatus(){ await skSet('status', DB.status); }

