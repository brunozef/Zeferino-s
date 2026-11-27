/* Busca rápida de cliente nos CRMs:
   1) botão 🔎 sempre visível: digita nome, telefone, endereço ou cidade e abre o cliente;
   2) nas listas "Cliente" (agenda, estimate, contrato, invoice) aparece um campo para filtrar. */
(function(){
  if(window.__qs)return;window.__qs=1;
  const norm=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
  const digits=s=>String(s||'').replace(/\D/g,'');
  const esc=s=>String(s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const clients=()=>{try{return Object.values(S.clients||{})}catch(e){return[]}};
  function match(c,q){
    const t=norm(q).trim();if(!t)return true;const d=digits(q);
    const hay=norm([c.name,c.company,c.email,c.address,c.city,c.zip].join(' '));
    return t.split(/\s+/).every(w=>hay.includes(w))||(d.length>=3&&digits(c.phone).includes(d));
  }

  const css=document.createElement('style');
  css.textContent=`#qsBtn{position:fixed;right:16px;bottom:calc(76px + env(safe-area-inset-bottom));z-index:60;width:56px;height:56px;border-radius:50%;border:0;background:var(--amber);color:#fff;font-size:24px;box-shadow:0 6px 18px rgba(0,0,0,.25);cursor:pointer}
@media(max-width:760px){#qsBtn{bottom:calc(84px + env(safe-area-inset-bottom));right:auto;left:16px}}
#qsBox{position:fixed;inset:0;z-index:70;background:rgba(15,20,35,.45);display:flex;align-items:flex-start;justify-content:center;padding:30px 12px}
#qsBox .in{background:#fff;border-radius:14px;width:100%;max-width:560px;padding:14px;box-shadow:0 20px 50px rgba(0,0,0,.25);max-height:85vh;display:flex;flex-direction:column}
#qsBox input{font-size:17px;padding:12px;border:1px solid var(--line);border-radius:10px;width:100%}
#qsBox .res{overflow:auto;margin-top:8px}#qsBox .r{padding:12px 6px;border-bottom:1px solid #eee;cursor:pointer}#qsBox .r:active,#qsBox .r:hover{background:#f6f2ee}
#qsBox .r small{display:block;color:#777;margin-top:2px}.qs-filter{margin-bottom:6px}`;
  document.head.appendChild(css);

  window.__qsMatch=match;window.openClientSearch=open;

  function open(){
    const box=document.createElement('div');box.id='qsBox';
    box.innerHTML=`<div class="in"><input placeholder="Buscar cliente: nome, telefone, rua, cidade…" autocomplete="off"><div class="res"></div></div>`;
    box.onclick=e=>{if(e.target===box)box.remove()};
    document.body.appendChild(box);
    const inp=box.querySelector('input'),res=box.querySelector('.res');
    const draw=()=>{const q=inp.value;const list=clients().filter(c=>match(c,q)).sort((a,b)=>(a.name||'').localeCompare(b.name||'')).slice(0,40);
      res.innerHTML=list.length?list.map(c=>`<div class="r" data-id="${esc(c.id)}"><b>${esc(c.name)}</b>${c.company?' · '+esc(c.company):''}<small>${esc([c.phone,[c.address,c.city].filter(Boolean).join(', ')].filter(Boolean).join(' · '))}</small></div>`).join(''):'<div class="r" style="cursor:default;color:#777">Nenhum cliente encontrado</div>'};
    res.onclick=e=>{const r=e.target.closest('.r[data-id]');if(!r)return;box.remove();try{closeModal()}catch(x){}
      try{go('clientes')}catch(x){}S.clientId=r.dataset.id;render();window.scrollTo(0,0)};
    inp.oninput=draw;draw();setTimeout(()=>inp.focus(),50);
  }

  // filtro nas listas de cliente
  function enhance(sel){
    if(sel.dataset.qs)return;sel.dataset.qs=1;
    const f=document.createElement('input');f.className='qs-filter';f.placeholder='🔎 Digite para achar o cliente';f.autocomplete='off';
    sel.parentNode.insertBefore(f,sel);
    f.oninput=()=>{const q=f.value;let shown=[];
      for(const o of sel.options){if(!o.value){o.hidden=false;continue}const c=(S.clients||{})[o.value];const ok=c?match(c,q):norm(o.text).includes(norm(q));o.hidden=!ok;if(ok)shown.push(o)}
      if(q&&shown.length===1&&sel.value!==shown[0].value){sel.value=shown[0].value;sel.dispatchEvent(new Event('change',{bubbles:true}))}};
  }
  const scan=()=>document.querySelectorAll('select[name="clientId"],select#e-client').forEach(enhance);
  new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});scan();
})();
