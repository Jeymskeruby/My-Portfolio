/* ============================= MODAL ============================= */
function openModal(html){
  let holder = document.getElementById('modalHolder');
  holder.innerHTML = `<div class="modal-wrap" onclick="if(event.target===this) closeModal()"><div class="modal">${html}</div></div>`;
}
function closeModal(){ document.getElementById('modalHolder').innerHTML = ''; }

/* ---- confirm dialog (replaces window.confirm) ----
 * Native confirm() is synchronous and blocks the whole page until
 * dismissed, and looks inconsistent with the app's own styled modals.
 * openConfirm() renders the same choice as a modal instead; `action`
 * only runs if the user clicks the confirm button. Cancelling (Cancel,
 * the × button, or the backdrop) restores whatever modal was open
 * before the confirm was triggered — e.g. confirming a destructive
 * action from inside a "Manage team"-style modal returns you to it. */
let _confirmAction = null;
let _confirmPrevModalHtml = null;
function openConfirm(message, action, opts){
  opts = opts || {};
  const holder = document.getElementById('modalHolder');
  if(!holder){
    // modalHolder is part of the app's own render() output, so this can
    // only happen if it's called before the very first render() — fall
    // back to the native dialog rather than throw.
    if(confirm(message)) action();
    return;
  }
  _confirmAction = action;
  _confirmPrevModalHtml = holder.innerHTML;
  holder.innerHTML = `<div class="modal-wrap" onclick="if(event.target===this) cancelConfirm()"><div class="modal">
    <div class="modal-head"><h3>${esc(opts.title || 'Are you sure?')}</h3><button class="btn btn-ghost btn-sm" onclick="cancelConfirm()">&times;</button></div>
    <div class="modal-body">
      <p style="margin:0 0 16px;">${esc(message)}</p>
      <div style="display:flex;gap:8px;justify-content:flex-end;">
        <button class="btn btn-ghost" onclick="cancelConfirm()">Cancel</button>
        <button class="btn btn-ghost btn-danger" onclick="runConfirmedAction()">${esc(opts.confirmLabel || 'Confirm')}</button>
      </div>
    </div>
  </div></div>`;
}
function cancelConfirm(){
  _confirmAction = null;
  const holder = document.getElementById('modalHolder');
  if(holder) holder.innerHTML = _confirmPrevModalHtml || '';
  _confirmPrevModalHtml = null;
}
async function runConfirmedAction(){
  const action = _confirmAction;
  _confirmAction = null;
  _confirmPrevModalHtml = null;
  closeModal();
  if(action) await action();
}

