/* ============================= HELPERS ============================= */
// Deliberately simple (not RFC 5322) — just enough to catch obviously
// malformed input like a missing "@" or domain dot, not to be a strict
// mail-address validator.
function isValidEmail(email){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
function getUser(id){ return DB.users.find(u=>u.id===id); }
function getAgents(){ return DB.users.filter(u=>u.role==='agent' && u.active!==false); }
function getClients(){ return DB.users.filter(u=>u.role==='client'); }
function getTeamAgents(){
  if(!S.currentUser) return getAgents();
  if(S.currentUser.role === 'admin' || S.currentUser.role === 'superadmin') return getAgents();
  if(S.currentUser.team){
    return DB.users.filter(u=>(u.role==='agent' || u.role==='teamleader') && u.team===S.currentUser.team && u.active!==false);
  }
  return getAgents();
}
function canModifyUser(targetUser){
  if(!targetUser || !S.currentUser) return false;
  if(targetUser.id === S.currentUser.id) return false;
  if(targetUser.role === 'superadmin') return S.currentUser.role === 'superadmin';
  return true;
}
function userInitials(u){ if(!u) return '?'; return u.name.split(' ').map(p=>p[0]).slice(0,2).join('').toUpperCase(); }

