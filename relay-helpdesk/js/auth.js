/* ============================= AUTH ============================= */
// Canonical reset for the portfolio demo. Storage is now a single removable
// key, so wiping is just removeItem() — boot() reseeds on the fresh load
// because DB.meta.seeded is gone. Wired to the demo banner's "Reset Demo
// Data" button via window.resetRelayDemoData.
async function resetDemo(){
  openConfirm('This will delete all demo data and reset the demo to its starting state. Continue?', () => {
    try{ localStorage.removeItem(DB_KEY); }catch(e){}
    __memStore = null;           // drop any private-mode in-memory DB too
    location.reload();           // boot() -> loadDB() (empty) -> seedIfNeeded() reseeds
  }, {title:'Reset demo data', confirmLabel:'Reset data'});
}
window.resetRelayDemoData = resetDemo;

async function login(userId){
  const u = getUser(userId);
  if(!u) return;
  // Disabled accounts cannot log in at all.
  if(u.active === false){
    showToast('This account is disabled. Contact an administrator.', 'warn');
    return;
  }
  S.currentUser = u;
  // Mark this user as online (persisted across refreshes)
  u.online = true;
  await saveUsers();

  // Set default view based on role
  if(u.role === 'client') S.view = 'client-dashboard';
  else if(u.role === 'agent') S.view = 'agent-queue';
  else if(u.role === 'teamleader') S.view = 'leader-queue';
  else if(u.role === 'admin' || u.role === 'superadmin') S.view = 'admin-overview';
  else S.view = 'login';

  await runSystemChecks(true);
  startPolling();
  render();
}
async function signupClient(){
  const name = document.getElementById('su-name').value.trim();
  const email = document.getElementById('su-email').value.trim();
  const company = document.getElementById('su-company').value.trim();
  if(!name || !email){ showToast('Name and email are required.'); return; }
  const u = {id:uid('u'), name, email, role:'client', company: company||'—', active:true};
  DB.users = [...DB.users, u];
  await skSet('users', DB.users);
  await login(u.id);
}
async function logout(){
  if(S.currentUser){
    const u = getUser(S.currentUser.id);
    if(u) u.online = false;
    await saveUsers();
  }
  S.currentUser = null; S.view='login'; S.activeTicketId=null;
  stopPolling(); stopTimerIfRunning(false);
  render();
}

