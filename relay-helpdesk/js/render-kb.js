/* ============================= KB VIEW ============================= */
function renderKB(ctx){
  const q = S.kbSearch.toLowerCase();
  const arts = DB.kb_articles.filter(a=> a.title.toLowerCase().includes(q) || a.body.toLowerCase().includes(q));
  const active = S.activeKbId ? DB.kb_articles.find(a=>a.id===S.activeKbId) : null;
  return `
  <div style="display:flex;gap:12px;align-items:center;margin-bottom:14px;flex-wrap:wrap;">
    <div class="field" style="max-width:420px;margin-bottom:0;flex:1;"><input type="text" placeholder="Search articles..." value="${esc(S.kbSearch)}" oninput="S.kbSearch=this.value;renderKbList();"></div>
    ${ctx==='admin' ? `<button class="btn btn-primary" onclick="openAddKbModal()">+ New article</button>` : ''}
  </div>
  <div class="grid" style="grid-template-columns:1fr 1.4fr;gap:18px;align-items:start;" id="kbGrid">
    ${renderKbListInner(arts, active, ctx)}
  </div>`;
}
function renderKbListInner(arts, active, ctx){
  return `
  <div id="kbList">
    ${arts.map(a=>`
      <div class="card kb-card" style="cursor:pointer;${active&&active.id===a.id?'border-color:var(--ink);':''}" onclick="S.activeKbId='${a.id}';renderKbList();">
        <div class="kb-cat">${esc(a.category)}</div>
        <div style="font-weight:600;margin-top:3px;">${esc(a.title)}</div>
      </div>`).join('') || '<div class="empty small">No articles match.</div>'}
  </div>
  <div class="card card-pad">
    ${active ? `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">
        <div>
          <div class="kb-cat">${esc(active.category)}</div>
          <h2 style="margin:6px 0 12px;">${esc(active.title)}</h2>
        </div>
        ${ctx==='admin' ? `<div style="display:flex;gap:6px;flex-shrink:0;">
          <button class="btn btn-ghost btn-sm" onclick="openEditKbModal('${active.id}')">Edit</button>
          <button class="btn btn-ghost btn-sm btn-danger" onclick="removeKbArticle('${active.id}')">Remove</button>
        </div>` : ''}
      </div>
      <div style="white-space:pre-wrap;">${esc(active.body)}</div>
    ` : `<div class="empty"><div class="big">&#128218;</div>Select an article to read it.</div>`}
  </div>`;
}
function renderKbList(){
  const ctx = S.view.split('-')[0];
  const q = S.kbSearch.toLowerCase();
  const arts = DB.kb_articles.filter(a=> a.title.toLowerCase().includes(q) || a.body.toLowerCase().includes(q));
  const active = S.activeKbId ? DB.kb_articles.find(a=>a.id===S.activeKbId) : null;
  const el = document.getElementById('kbGrid');
  if(el) el.innerHTML = renderKbListInner(arts, active, ctx);
}

