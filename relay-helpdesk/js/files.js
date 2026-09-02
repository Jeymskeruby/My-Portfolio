/* ============================= FILE / PASTE HANDLING ============================= */
function readFileAsDataURL(file){
  return new Promise((res,rej)=>{ const r = new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(file); });
}
function readFileAsText(file){
  return new Promise((res,rej)=>{ const r = new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsText(file); });
}
function resizeImageDataUrl(dataUrl, maxW){
  return new Promise((res)=>{
    const img = new Image();
    img.onload = ()=>{
      let w = img.width, h = img.height;
      if(w > maxW){ h = Math.round(h*maxW/w); w = maxW; }
      const c = document.createElement('canvas'); c.width=w; c.height=h;
      c.getContext('2d').drawImage(img,0,0,w,h);
      res(c.toDataURL('image/jpeg', 0.72));
    };
    img.onerror = ()=>res(dataUrl);
    img.src = dataUrl;
  });
}
async function addFilesToList(fileList, targetArr){
  for(const file of Array.from(fileList)){
    if(file.type.startsWith('image/')){
      let dataUrl = await readFileAsDataURL(file);
      dataUrl = await resizeImageDataUrl(dataUrl, 700);
      targetArr.push({name:file.name||'pasted-image.jpg', type:'image', dataUrl, size:file.size||0});
    } else {
      let text = '';
      try{ text = await readFileAsText(file); }catch(e){ text = '(binary file — preview unavailable)'; }
      targetArr.push({name:file.name, type:'text', textContent:text.slice(0,20000), size:file.size||0});
    }
  }
  render();
}

