/* ============================= MODAL ============================= */
function openModal(html){
  let holder = document.getElementById('modalHolder');
  holder.innerHTML = `<div class="modal-wrap" onclick="if(event.target===this) closeModal()"><div class="modal">${html}</div></div>`;
}
function closeModal(){ document.getElementById('modalHolder').innerHTML = ''; }

