/* ============================= NAVIGATION ============================= */
function goto(view, ticketId){
  S.view = view;
  if(ticketId !== undefined) S.activeTicketId = ticketId;
  S.ticketTab = 'thread';
  render();
}

