/* ============================= KNOWLEDGE BASE CRUD ============================= */
// Admin/superadmin-only controls, wired into the same renderKB()/
// renderKbListInner() every role already shares for browsing — so a
// saved article is immediately visible to clients/agents/leaders too,
// since they all read the same DB.kb_articles collection.
function openAddKbModal(){
  openModal(`
    <div class="modal-head"><h3>New FAQ article</h3><button class="btn btn-ghost btn-sm" onclick="closeModal()">&times;</button></div>
    <div class="modal-body">
      <div class="field"><label>Title</label><input id="kb-title" type="text" placeholder="e.g. How to reset your VPN password"></div>
      <div class="field"><label>Category</label><select id="kb-category">${DB.categories.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('')}</select></div>
      <div class="field"><label>Body</label><textarea id="kb-body" rows="6" placeholder="Answer / step-by-step instructions..."></textarea></div>
      <button class="btn btn-primary" onclick="addKbArticle()">Save article</button>
    </div>`);
}
async function addKbArticle(){
  const title = document.getElementById('kb-title').value.trim();
  const category = document.getElementById('kb-category').value;
  const body = document.getElementById('kb-body').value.trim();
  if(!title||!body){ showToast('Title and body required.'); return; }
  DB.kb_articles = [...DB.kb_articles, {id:uid('kb'), title, category, body}];
  await skSet('kb_articles', DB.kb_articles);
  closeModal();
  showToast('Article added.');
  await notifyRoles(['admin','superadmin'], {type:'system_change', title:'FAQ article added', body:`${S.currentUser.name} added "${title}".`});
  render();
}
function openEditKbModal(id){
  const a = DB.kb_articles.find(x=>x.id===id);
  if(!a) return;
  openModal(`
    <div class="modal-head"><h3>Edit FAQ article</h3><button class="btn btn-ghost btn-sm" onclick="closeModal()">&times;</button></div>
    <div class="modal-body">
      <div class="field"><label>Title</label><input id="kb-title" type="text" value="${esc(a.title)}"></div>
      <div class="field"><label>Category</label><select id="kb-category">${DB.categories.map(c=>`<option value="${esc(c)}" ${a.category===c?'selected':''}>${esc(c)}</option>`).join('')}</select></div>
      <div class="field"><label>Body</label><textarea id="kb-body" rows="6">${esc(a.body)}</textarea></div>
      <button class="btn btn-primary" onclick="saveKbArticle('${id}')">Save changes</button>
    </div>`);
}
async function saveKbArticle(id){
  const a = DB.kb_articles.find(x=>x.id===id);
  if(!a) return;
  const title = document.getElementById('kb-title').value.trim();
  const category = document.getElementById('kb-category').value;
  const body = document.getElementById('kb-body').value.trim();
  if(!title||!body){ showToast('Title and body required.'); return; }
  a.title = title; a.category = category; a.body = body;
  await skSet('kb_articles', DB.kb_articles);
  closeModal();
  showToast('Article updated.');
  await notifyRoles(['admin','superadmin'], {type:'system_change', title:'FAQ article updated', body:`${S.currentUser.name} edited "${title}".`});
  render();
}
async function removeKbArticle(id){
  const a = DB.kb_articles.find(x=>x.id===id);
  if(!confirm('Remove this FAQ article? This can\'t be undone.')) return;
  DB.kb_articles = DB.kb_articles.filter(x=>x.id!==id);
  if(S.activeKbId===id) S.activeKbId = null;
  await skSet('kb_articles', DB.kb_articles);
  showToast('Article removed.');
  if(a) await notifyRoles(['admin','superadmin'], {type:'system_change', title:'FAQ article removed', body:`${S.currentUser.name} removed "${a.title}".`});
  render();
}

