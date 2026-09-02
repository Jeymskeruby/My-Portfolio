/* ============================= BOOT ============================= */
async function boot(){
  await loadDB();
  await seedIfNeeded();
  await loadDB();
  await ensureTeamsBackfilled();
  await ensureCategoriesBackfilled();
  await ensurePriorityMatrixBackfilled();
  render();
}
boot();
