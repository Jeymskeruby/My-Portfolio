/* ============================= CLIENT VIEWS ============================= */
function renderClientDashboard(){
  const mine = DB.tickets.filter(t=>t.clientId===S.currentUser.id).sort((a,b)=>b.updatedAt-a.updatedAt);
  const counts = {Open:0,'In Progress':0,Pending:0,Resolved:0,Closed:0};
  mine.forEach(t=>counts[t.status]++);
  return `
  <div class="grid grid-4" style="margin-bottom:20px;">
    <div class="card stat"><div class="n">${counts.Open+counts['In Progress']+counts.Pending}</div><div class="l">Active tickets</div></div>
    <div class="card stat"><div class="n">${counts.Open}</div><div class="l">Awaiting first response</div></div>
    <div class="card stat"><div class="n">${counts.Pending}</div><div class="l">Waiting on you</div></div>
    <div class="card stat"><div class="n">${counts.Resolved+counts.Closed}</div><div class="l">Completed</div></div>
  </div>
  <div class="card">
    ${mine.length===0? `<div class="empty"><div class="big">&#128172;</div>No tickets yet.<br><button class="btn btn-primary" style="margin-top:14px;" onclick="goto('client-new')">Submit your first ticket</button></div>` : `
    <table>
      <thead><tr><th>Ticket</th><th>Subject</th><th>Status</th><th>Priority</th><th>Created</th><th>Updated</th></tr></thead>
      <tbody>
        ${mine.map(t=>`
        <tr class="row" onclick="goto('client-ticket-detail','${t.id}')">
          <td><span class="stamp">${ticketNumStr(t)}</span></td>
          <td>${esc(t.subject)}</td>
          <td><span class="badge ${STATUS_META[t.status].cls}"><span class="dot"></span>${STATUS_META[t.status].label}</span></td>
          <td><span class="badge ${PRIORITY_CLS[t.priority]}">${PRIORITY_LABEL[t.priority]}</span></td>
          <td class="muted small">${fmtDate(t.createdAt)}</td>
          <td class="muted small">${timeAgo(t.updatedAt)}</td>
        </tr>`).join('')}
      </tbody>
    </table>`}
  </div>`;
}

function renderClientNewTicket(){
  return `
  <div class="grid" style="grid-template-columns:1.6fr 1fr;gap:20px;align-items:start;">
    <div class="card card-pad">
      <div class="field"><label>Subject</label><input id="nt-subject" type="text" placeholder="Short summary of the issue"></div>
      <div class="grid grid-2">
        <div class="field"><label>Category</label>
          <select id="nt-category" onchange="renderKbHints()">
            ${DB.categories.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('')}
          </select>
        </div>
        <div class="field"><label>Urgency (How soon does this need to be resolved?)</label>
          <select id="nt-urgency" onchange="updatePriorityPreview()">
            <option value="Low">Low — no rush</option>
            <option value="Medium" selected>Medium — within a day</option>
            <option value="High">High — blocking my work</option>
            <option value="Critical">Critical — outage / everyone affected</option>
          </select>
        </div>
      </div>
      <div class="grid grid-2">
        <div class="field"><label>Impact (How many people/systems affected?)</label>
          <select id="nt-impact" onchange="updatePriorityPreview()">
            <option value="Low">Low — just me</option>
            <option value="Medium" selected>Medium — my team</option>
            <option value="High">High — department</option>
            <option value="Critical">Critical — entire company</option>
          </select>
        </div>
        <div class="field"><label>Calculated Priority</label>
          <div id="priority-preview" style="padding:9px 11px;border:1px solid var(--line);border-radius:7px;background:var(--gray-bg);font-weight:600;">Normal (P3)</div>
        </div>
      </div>
      <div class="field">
        <label>Description</label>
        <div class="toolbar">
          <button type="button" class="tbtn" onclick="rtCmd('bold','nt-body')"><b>B</b></button>
          <button type="button" class="tbtn" onclick="rtCmd('italic','nt-body')"><i>I</i></button>
          <button type="button" class="tbtn" onclick="rtCmd('insertUnorderedList','nt-body')">&#8226;≡</button>
        </div>
        <div id="nt-body" class="rich" contenteditable="true" data-ph="Describe what's happening, what you expected, and any error messages..."></div>
      </div>
      <div class="field">
        <label>Attachments — paste a screenshot or attach files</label>
        <div class="dropzone" id="ntDrop" ondragover="event.preventDefault();this.classList.add('drag')" ondragleave="this.classList.remove('drag')"
          ondrop="event.preventDefault();this.classList.remove('drag');addFilesToList(event.dataTransfer.files, S.newTicketAttachments);">
          Drag files here, click to browse, or paste (Ctrl/Cmd+V) a screenshot anywhere in this form
          <div><input type="file" multiple style="margin-top:8px;" onchange="addFilesToList(this.files, S.newTicketAttachments)"></div>
        </div>
        <div style="margin-top:8px;">${renderAttachChips(S.newTicketAttachments, 'S.newTicketAttachments')}</div>
      </div>
      <button class="btn btn-primary" onclick="createTicket(false)">Submit ticket</button>
    </div>
    <div>
      <div class="card card-pad" style="margin-bottom:14px;">
        <div class="small muted" style="font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px;">ITSM Priority Matrix</div>
        <img src="assets/itsm-priority-matrix.jpg" alt="ITSM Priority Matrix" style="width:100%;border-radius:8px;border:1px solid var(--line);">
        <div class="small muted" style="margin-top:8px;">Priority is automatically calculated based on urgency and impact. This image is a general reference — your organization's actual mapping (Admin &gt; Priority Matrix) may be customized; the "Calculated Priority" box above always reflects the real result.</div>
      </div>
      <div class="card card-pad" id="kbHints">
        ${renderKbHintBox()}
      </div>
    </div>
  </div>`;
}
function updatePriorityPreview(){
  const urgEl = document.getElementById('nt-urgency');
  const impEl = document.getElementById('nt-impact');
  const prevEl = document.getElementById('priority-preview');
  if(urgEl && impEl && prevEl){
    const urg = urgEl.value;
    const imp = impEl.value;
    const priority = calculatePriority(urg, imp);
    const pLevel = {'Critical':'P1','High':'P2','Normal':'P3','Low':'P4'}[priority];
    prevEl.textContent = `${priority} (${pLevel})`;
    prevEl.className = '';
    prevEl.style.cssText = `padding:9px 11px;border:1px solid var(--line);border-radius:7px;font-weight:600;background:${
      priority==='Critical'?'var(--red-bg)':priority==='High'?'var(--amber-bg)':priority==='Normal'?'var(--blue-bg)':'var(--gray-bg)'
    };color:${
      priority==='Critical'?'var(--red)':priority==='High'?'var(--amber-deep)':priority==='Normal'?'var(--blue)':'var(--text-soft)'
    };`;
  }
}
function renderKbHintBox(){
  const catEl = document.getElementById('nt-category');
  const cat = catEl ? catEl.value : DB.categories[0];
  const arts = DB.kb_articles.filter(a=>a.category===cat).slice(0,3);
  return `
  <div class="small muted" style="font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px;">Might this help first?</div>
  ${arts.length===0 ? `<div class="muted small">No matching articles for this category yet.</div>` :
    arts.map(a=>`<div style="margin-bottom:12px;"><button class="link-btn" onclick="viewKbFromHint('${a.id}')">${esc(a.title)}</button></div>`).join('')}
  <hr class="hair">
  <div class="small muted">Still need help? Fill out the form and submit — it'll route straight to the right specialist${(()=>{
    const agents = DB.routing_rules.filter(r=>r.category===cat).map(r=>getUser(r.assigneeId)).filter(Boolean);
    if(agents.length===1) return ' ('+esc(agents[0].name)+')';
    if(agents.length>1) return ' (one of: '+agents.map(a=>esc(a.name)).join(', ')+')';
    return '';
  })()}.</div>
  `;
}
function renderKbHints(){
  const el = document.getElementById('kbHints');
  if(el) el.innerHTML = renderKbHintBox();
}
function viewKbFromHint(id){ S.activeKbId = id; goto(userView('kb')); }

// Modals already close on a background click; ESC was the one other
// expected way to dismiss one that didn't work anywhere in the app.
document.addEventListener('keydown', (e)=>{
  if(e.key === 'Escape'){
    const holder = document.getElementById('modalHolder');
    if(holder && holder.innerHTML) closeModal();
  }
});
document.addEventListener('paste', async (e)=>{
  if(S.view==='client-new' || (S.view.includes('ticket-detail') && S.currentUser)){
    const items = (e.clipboardData || window.clipboardData).items;
    const files = [];
    for(const item of items){ if(item.kind==='file'){ const f = item.getAsFile(); if(f) files.push(f); } }
    if(files.length){
      const target = S.view==='client-new' ? S.newTicketAttachments : S.composerAttachments;
      await addFilesToList(files, target);
    }
  }
});

function renderAttachChips(arr, refName){
  if(!arr || arr.length===0) return '';
  return arr.map((a,i)=>`
    <span class="attach-chip">
      ${a.type==='image' ? `<img src="${a.dataUrl}">` : '&#128196;'}
      ${esc(a.name)} <span class="x" onclick="${refName}.splice(${i},1);render();">&times;</span>
    </span>`).join('');
}

