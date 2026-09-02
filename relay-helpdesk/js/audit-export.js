/* ============================= AUDIT LOG EXPORT ============================= */
// Exports whatever the current filters are showing (filteredAuditLog is
// unsliced, unlike the on-screen table's 300-row cap) — so "export
// everything" is just "clear filters, then export."
function auditExportRows(){
  return filteredAuditLog().map(a=>{
    const t = DB.tickets.find(x=>x.id===a.ticketId);
    const client = t ? getUser(t.clientId) : null;
    return {
      time: new Date(a.timestamp).toLocaleString(),
      ticket: t ? ticketNumStr(t) : '',
      category: t ? t.category : '',
      client: client ? client.name : '',
      actor: a.actor,
      action: a.action,
      detail: a.detail || '',
    };
  });
}
function downloadBlob(content, filename, mime){
  const blob = new Blob([content], {type: mime});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = filename;
  document.body.appendChild(link); link.click(); document.body.removeChild(link);
  setTimeout(()=>URL.revokeObjectURL(url), 1000);
}
function csvField(val){ return '"' + String(val==null?'':val).replace(/"/g,'""') + '"'; }
function exportAuditCsv(){
  const rows = auditExportRows();
  if(rows.length===0){ showToast('No matching log entries to export.'); return; }
  const headers = ['Time','Ticket','Category','Client','Actor','Action','Detail'];
  const lines = [headers.map(csvField).join(',')];
  rows.forEach(r=>lines.push([r.time,r.ticket,r.category,r.client,r.actor,r.action,r.detail].map(csvField).join(',')));
  // Leading BOM so Excel/Sheets detect UTF-8 correctly instead of mangling
  // non-ASCII characters (em dashes, curly quotes, etc.) in ticket subjects.
  downloadBlob('﻿'+lines.join('\r\n'), `relay-audit-log-${Date.now()}.csv`, 'text/csv;charset=utf-8;');
  showToast(`Exported ${rows.length} log entr${rows.length===1?'y':'ies'} to CSV.`);
}
function exportAuditExcel(){
  const rows = auditExportRows();
  if(rows.length===0){ showToast('No matching log entries to export.'); return; }
  // A real .xlsx needs a zip/XML library we don't have — an HTML table
  // saved with an .xls extension + the Excel MIME type is a well-known,
  // library-free trick that Excel opens natively as a proper worksheet
  // (real columns/cells), unlike a plain CSV misread with the wrong
  // delimiter in some locales.
  const headers = ['Time','Ticket','Category','Client','Actor','Action','Detail'];
  const html = `<html><head><meta charset="UTF-8"></head><body><table border="1">
    <tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr>
    ${rows.map(r=>`<tr>${[r.time,r.ticket,r.category,r.client,r.actor,r.action,r.detail].map(v=>`<td>${esc(v)}</td>`).join('')}</tr>`).join('')}
  </table></body></html>`;
  downloadBlob(html, `relay-audit-log-${Date.now()}.xls`, 'application/vnd.ms-excel');
  showToast(`Exported ${rows.length} log entr${rows.length===1?'y':'ies'} to Excel.`);
}

