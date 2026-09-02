/* ============================= LOGIN VIEW ============================= */
function renderLogin(){
  const groups = {superadmin:[], admin:[], teamleader:[], agent:[], client:[]};
  DB.users.forEach(u=>{ if(groups[u.role]) groups[u.role].push(u); });
  function grp(role, label, color){
    if(!groups[role] || groups[role].length === 0) return '';
    return `<div class="nav-label" style="margin:14px 0 6px;">${label}</div>` + groups[role].map(u=>`
      <div class="demo-user" onclick="login('${u.id}')">
        <div class="avatar" style="background:${color};color:#fff;">${userInitials(u)}</div>
        <div><div class="dn">${esc(u.name)}</div><div class="de">${esc(u.email)}</div></div>
        <span class="role-chip rc-${role}">${role.replace('team','team ')}</span>
      </div>`).join('');
  }
  return `
  <div class="login-shell">
    <div class="login-card">
      <div class="login-left">
        <div>
          <div class="tag">// IT HELPDESK PLATFORM</div>
          <h2>One queue. Every ticket. No dropped requests.</h2>
          <p>Relay routes client requests to the right specialist, tracks response SLAs automatically, and keeps a permanent audit trail of every change — so nothing falls through the cracks.</p>
        </div>
        <div>
          <div class="small" style="color:#7C8CA3;">Portfolio demo — pick any seeded account (no passwords), or sign up as a new client. Use “Reset Demo Data” in the bottom banner to start over.</div>
        </div>
      </div>
      <div class="login-right">
        <h3 style="margin-top:0;">Sign in</h3>
        ${grp('superadmin','Super Admin','var(--red)')}
        ${grp('admin','Admin','var(--red)')}
        ${grp('teamleader','Team Leaders','var(--violet)')}
        ${grp('agent','IT Agents','var(--amber)')}
        ${grp('client','Clients','var(--blue)')}
        <hr class="hair">
        <div class="nav-label" style="margin-bottom:8px;">New client? Create an account</div>
        <div class="field"><input id="su-name" type="text" placeholder="Full name"></div>
        <div class="field"><input id="su-email" type="email" placeholder="Work email"></div>
        <div class="field"><input id="su-company" type="text" placeholder="Company (optional)"></div>
        <button class="btn btn-primary" style="width:100%;justify-content:center;" onclick="signupClient()">Create client account &amp; sign in</button>
      </div>
    </div>
  </div>`;
}

