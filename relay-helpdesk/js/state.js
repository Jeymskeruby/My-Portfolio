/* ============================= APP STATE ============================= */
const S = {
  currentUser:null,
  view:'login',
  activeTicketId:null,
  ticketTab:'thread',
  queueFilters:{status:'all', priority:'all', category:'all', assignee:'all', client:'all', q:''},
  querySort:{key:'updatedAt', dir:'desc'},
  auditFilters:{actor:'all', client:'all', category:'all', action:'all', ticket:'all', dateFrom:'', dateTo:'', q:''},
  composerKind:'public',
  composerBody:'',
  composerAttachments:[],
  newTicketAttachments:[],
  timer:null, // {ticketId, startedAt}
  timerTick:null,
  pausedTimerTicketId:null, // set while on break, so the timer can resume on Go Queuing
  pollHandle:null,
  adminTab:'overview',
  kbSearch:'',
  activeKbId:null,
  toast:null,
};

// Categories are dynamic (Admin > Categories) — see DB.categories, seeded
// in seedIfNeeded() and backfilled for existing sessions in
// ensureCategoriesBackfilled(). Nothing in the app should reference a
// hardcoded category list anymore; everything reads DB.categories live.
const PRIORITIES = ['Critical','High','Normal','Low'];
const URGENCY_LEVELS = ['Low','Medium','High','Critical'];
const IMPACT_LEVELS = ['Low','Medium','High','Critical'];

// ITSM Priority Matrix: determines priority based on urgency and impact.
// The 16 Urgency x Impact -> Priority mappings are admin-configurable
// (Admin > Priority Matrix, DB.priority_matrix) rather than hardcoded —
// Urgency/Impact themselves stay fixed at Low/Medium/High/Critical (see
// URGENCY_LEVELS/IMPACT_LEVELS above), only what each intersection maps
// to is customizable.
function calculatePriority(urgency, impact){
  const key = `${urgency}-${impact}`;
  return (DB.priority_matrix && DB.priority_matrix[key]) || 'Normal';
}

function root(){ return document.getElementById('app'); }
function esc(str){ return (str||'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function showToast(msg, type){ S.toast = {msg, type: type||'info'}; render(); setTimeout(()=>{ S.toast=null; renderToastOnly(); }, 2600); }
function toastHtml(){ return S.toast ? `<div class="toast ${S.toast.type==='warn'?'toast-warn':''}">${esc(S.toast.msg)}</div>` : ''; }
function renderToastOnly(){ const el = document.getElementById('toastHolder'); if(el) el.innerHTML = toastHtml(); }

