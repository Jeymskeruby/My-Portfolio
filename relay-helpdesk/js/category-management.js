/* ============================= CATEGORY MANAGEMENT ============================= */
// Categories are plain strings (DB.categories) referenced directly by
// t.category, u.specialty, r.category, and a.category (kb_articles) —
// same simple design already used for everything else in this app.
// Renaming cascades to all four; removal is blocked while anything still
// references the category, so nothing can be silently orphaned.
function categoryUsage(name){
  const tickets = DB.tickets.filter(t=>t.category===name).length;
  const agents = DB.users.filter(u=>(u.role==='agent'||u.role==='teamleader') && u.specialty===name).length;
  const rules = DB.routing_rules.filter(r=>r.category===name).length;
  const kb = DB.kb_articles.filter(a=>a.category===name).length;
  return {tickets, agents, rules, kb, total: tickets+agents+rules+kb};
}
async function addCategory(){
  const nameEl = document.getElementById('new-cat-name');
  const name = nameEl.value.trim();
  if(!name){ showToast('Category name is required.'); return; }
  if(name.toLowerCase()==='general'){ showToast('"General" is reserved — it already means "matches every category" for an agent with no specialty.'); return; }
  if(DB.categories.find(c=>c.toLowerCase()===name.toLowerCase())){ showToast('This category already exists.'); return; }
  DB.categories = [...DB.categories, name];
  await skSet('categories', DB.categories);
  nameEl.value = '';
  showToast('Category added.');
  await pushAudit(null, 'Category added', `"${name}" was added by ${S.currentUser.name}.`);
  await notifyRoles(['admin','superadmin'], {type:'system_change', title:'Category added', body:`"${name}" was added by ${S.currentUser.name}.`});
  render();
}
async function renameCategory(index, newNameRaw){
  const oldName = DB.categories[index];
  if(oldName===undefined) return;
  const newName = newNameRaw.trim();
  if(!newName){ showToast('Category name is required.'); return; }
  if(newName===oldName){ closeModal(); return; }
  if(newName.toLowerCase()==='general'){ showToast('"General" is reserved — it already means "matches every category" for an agent with no specialty.'); return; }
  if(DB.categories.find((c,i)=>i!==index && c.toLowerCase()===newName.toLowerCase())){ showToast('This category already exists.'); return; }
  // Cascade: every entity that carries this category follows the rename.
  DB.tickets.forEach(t=>{ if(t.category===oldName) t.category=newName; });
  DB.users.forEach(u=>{ if(u.specialty===oldName) u.specialty=newName; });
  DB.routing_rules.forEach(r=>{ if(r.category===oldName) r.category=newName; });
  DB.kb_articles.forEach(a=>{ if(a.category===oldName) a.category=newName; });
  DB.categories[index] = newName;
  await saveTickets();
  await skSet('users', DB.users);
  await skSet('routing_rules', DB.routing_rules);
  await skSet('kb_articles', DB.kb_articles);
  await skSet('categories', DB.categories);
  closeModal();
  showToast(`Renamed "${oldName}" to "${newName}" — updated everywhere it was used.`);
  await pushAudit(null, 'Category renamed', `"${oldName}" was renamed to "${newName}" by ${S.currentUser.name}.`);
  await notifyRoles(['admin','superadmin'], {type:'system_change', title:'Category renamed', body:`"${oldName}" was renamed to "${newName}" by ${S.currentUser.name}.`});
  render();
}
async function removeCategory(index){
  const name = DB.categories[index];
  if(name===undefined) return;
  if(name==='Other'){ showToast('"Other" is the fallback category (used by default/undetected tickets) and can\'t be removed.'); return; }
  const usage = categoryUsage(name);
  if(usage.total > 0){
    showToast(`Can't remove "${name}" — still used by ${usage.tickets} ticket(s), ${usage.agents} agent(s), ${usage.rules} routing rule(s), and ${usage.kb} KB article(s). Reassign or remove those first.`);
    return;
  }
  if(!confirm(`Remove category "${name}"? This can't be undone.`)) return;
  DB.categories = DB.categories.filter((c,i)=>i!==index);
  await skSet('categories', DB.categories);
  showToast('Category removed.');
  await pushAudit(null, 'Category removed', `"${name}" was removed by ${S.currentUser.name}.`);
  await notifyRoles(['admin','superadmin'], {type:'system_change', title:'Category removed', body:`"${name}" was removed by ${S.currentUser.name}.`});
  render();
}
function openRenameCategoryModal(index){
  const name = DB.categories[index];
  if(name===undefined) return;
  openModal(`
    <div class="modal-head"><h3>Rename category</h3><button class="btn btn-ghost btn-sm" onclick="closeModal()">&times;</button></div>
    <div class="modal-body">
      <div class="field"><label>New name</label><input id="rename-cat-input" type="text" value="${esc(name)}"></div>
      <div class="small muted" style="margin-bottom:14px;">Updates every ticket, agent, and routing rule currently using "${esc(name)}".</div>
      <button class="btn btn-primary" onclick="renameCategory(${index}, document.getElementById('rename-cat-input').value)">Save</button>
    </div>`);
}
function renderAdminCategories(){
  return `
  <div class="card card-pad" style="max-width:640px;">
    <div class="small muted" style="margin-bottom:14px;">Categories determine what a ticket can be classified as, what an agent's specialty can be, what Routing Rules can target, and how KB articles are tagged. Renaming a category updates every ticket, agent, routing rule, and KB article that uses it. A category can't be removed while anything still uses it.</div>
    <table>
      <thead><tr><th>Category</th><th>In use</th><th></th></tr></thead>
      <tbody>
        ${DB.categories.map((c,i)=>{
          const usage = categoryUsage(c);
          const isProtected = c==='Other';
          return `<tr>
            <td style="font-weight:600;">${esc(c)}</td>
            <td class="muted small">${usage.total===0 ? 'Not in use' : `${usage.tickets} ticket${usage.tickets!==1?'s':''} · ${usage.agents} agent${usage.agents!==1?'s':''} · ${usage.rules} rule${usage.rules!==1?'s':''} · ${usage.kb} KB article${usage.kb!==1?'s':''}`}</td>
            <td style="text-align:right;white-space:nowrap;">
              <button class="btn btn-ghost btn-sm" onclick="openRenameCategoryModal(${i})">Rename</button>
              ${isProtected ? '<span class="muted small" style="margin-left:6px;">protected</span>' : `<button class="btn btn-ghost btn-sm btn-danger" onclick="removeCategory(${i})">Remove</button>`}
            </td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
    <hr class="hair">
    <div class="field"><label>New category</label><input id="new-cat-name" type="text" placeholder="e.g. Facilities"></div>
    <button class="btn btn-primary" onclick="addCategory()">Add category</button>
  </div>`;
}

