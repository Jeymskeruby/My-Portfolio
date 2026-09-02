/* ============================= MIGRATION ============================= */
// DB.teams didn't exist before Team Management was added — for a session
// that already has seeded users (with a .team string) but no DB.teams
// records yet (skGet's fallback is []), derive team entries from whatever
// distinct team names are already in use so existing data isn't orphaned.
async function ensureTeamsBackfilled(){
  if(!DB.teams) DB.teams = [];
  if(DB.teams.length > 0) return;
  const names = [...new Set(DB.users.filter(u=>u.team).map(u=>u.team))];
  if(names.length === 0) return;
  DB.teams = names.map(name=>({id:uid('team'), name, createdAt:nowTs()}));
  await skSet('teams', DB.teams);
}
// DB.categories didn't exist before Dynamic Category Management was added —
// same situation as ensureTeamsBackfilled() above. Seed the same defaults
// this app always shipped with, unioned with any category name already in
// use on existing tickets/agents/routing rules, so nothing already in a
// user's saved data ends up referencing a category that doesn't exist.
async function ensureCategoriesBackfilled(){
  if(!DB.categories) DB.categories = [];
  if(DB.categories.length > 0) return;
  const defaults = ['Networking','Hardware','Software','Account & Access','Email','Other'];
  const inUse = [
    ...DB.tickets.map(t=>t.category),
    ...DB.users.filter(u=>u.specialty && u.specialty!=='General').map(u=>u.specialty),
    ...DB.routing_rules.map(r=>r.category),
  ].filter(Boolean);
  DB.categories = [...new Set([...defaults, ...inUse])];
  await skSet('categories', DB.categories);
}
// Same situation as the two backfills above: DB.priority_matrix didn't
// exist before this feature. Seed it with the exact matrix this app
// always computed in code, so nothing changes for an existing session
// until an admin actually edits a cell.
async function ensurePriorityMatrixBackfilled(){
  if(!DB.priority_matrix) DB.priority_matrix = {};
  if(Object.keys(DB.priority_matrix).length > 0) return;
  DB.priority_matrix = {
    'Critical-Critical':'Critical', 'Critical-High':'Critical', 'Critical-Medium':'High', 'Critical-Low':'High',
    'High-Critical':'Critical', 'High-High':'High', 'High-Medium':'High', 'High-Low':'Normal',
    'Medium-Critical':'High', 'Medium-High':'High', 'Medium-Medium':'Normal', 'Medium-Low':'Normal',
    'Low-Critical':'High', 'Low-High':'Normal', 'Low-Medium':'Normal', 'Low-Low':'Low',
  };
  await skSet('priority_matrix', DB.priority_matrix);
}

