/* Importar clientes dos contatos do iPhone.
   Jeito 1: escolher contatos direto (Contact Picker, quando o Safari permite).
   Jeito 2: arquivo .vcf exportado do app Contatos (uma lista "Clientes" inteira de uma vez). */
(function(){
  if(window.importContacts)return;
  const esc=s=>String(s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const digits=s=>String(s||'').replace(/\D/g,'').replace(/^1(?=\d{10}$)/,'');
  const ST={florida:'FL'};

  function unfold(t){return t.replace(/\r\n/g,'\n').replace(/\n[ \t]/g,'')}
  function dec(v){ // QUOTED-PRINTABLE + escapes
    return v.replace(/\\n/gi,' ').replace(/\\([,;\\])/g,'$1').trim();
  }
  function parseVcf(text){
    const out=[];
    for(const card of unfold(text).split(/BEGIN:VCARD/i).slice(1)){
      const c={};const lines=card.split('\n');
      for(const raw of lines){
        const i=raw.indexOf(':');if(i<0)continue;
        let key=raw.slice(0,i).toUpperCase();let val=raw.slice(i+1);
        if(/QUOTED-PRINTABLE/.test(key)){try{val=decodeURIComponent(val.replace(/=([0-9A-F]{2})/gi,'%$1').replace(/=$/,''))}catch(e){}}
        key=key.replace(/^ITEM\d+\./,'');const base=key.split(';')[0];
        if(base==='FN')c.name=dec(val);
        else if(base==='N'&&!c.name){const p=val.split(';');c.name=dec([p[1],p[0]].filter(Boolean).join(' '))}
        else if(base==='ORG'&&!c.company)c.company=dec(val.split(';')[0]);
        else if(base==='TEL'&&!c.phone)c.phone=dec(val);
        else if(base==='EMAIL'&&!c.email)c.email=dec(val);
        else if(base==='ADR'&&!c.address){const p=val.split(';').map(dec);c.address=[p[1],p[2]].filter(Boolean).join(' ');c.city=p[3]||'';c.state=ST[(p[4]||'').toLowerCase()]||p[4]||'';c.zip=p[5]||''}
        else if(base==='NOTE'&&!c.notes)c.notes=dec(val);
      }
      if(c.name||c.phone)out.push(c);
    }
    return out;
  }
  function fromPicker(list){
    return list.map(p=>{const a=(p.address||[])[0]||{};return{
      name:(p.name||[])[0]||'',phone:(p.tel||[])[0]||'',email:(p.email||[])[0]||'',
      address:(a.addressLine||[]).join(' '),city:a.city||'',state:ST[(a.region||'').toLowerCase()]||a.region||'',zip:a.postalCode||''}}).filter(c=>c.name||c.phone);
  }

  function review(list){
    const have=new Set(Object.values(S.clients).map(c=>digits(c.phone)).filter(Boolean));
    const names=new Set(Object.values(S.clients).map(c=>(c.name||'').trim().toLowerCase()));
    const rows=list.map((c,i)=>{const dup=(c.phone&&have.has(digits(c.phone)))||names.has((c.name||'').trim().toLowerCase());
      return `<label style="display:flex;gap:10px;align-items:flex-start;padding:10px 4px;border-bottom:1px solid var(--line);font-size:14px;color:var(--ink);font-weight:400">
        <input type="checkbox" data-i="${i}" ${dup?'':'checked'} style="width:auto;margin-top:3px">
        <span><b>${esc(c.name||'(sem nome)')}</b>${dup?' <span class="tag">já cadastrado</span>':''}<br><span class="small muted">${esc([c.phone,[c.address,c.city].filter(Boolean).join(', ')].filter(Boolean).join(' · '))}</span></span></label>`}).join('');
    modal(`<h2>Importar ${list.length} contato${list.length>1?'s':''}</h2>
      <p class="small muted" style="margin-top:0">Desmarque quem não é cliente. Quem já está no app vem desmarcado.</p>
      <div style="max-height:55vh;overflow:auto">${rows}</div>
      <div class="row spread" style="margin-top:12px"><button class="btn" onclick="closeModal()">Cancelar</button><button class="btn p" id="ciGo">Importar marcados</button></div>`);
    $('#ciGo').onclick=()=>{
      const sel=[...document.querySelectorAll('#modalRoot [data-i]:checked')].map(x=>list[+x.dataset.i]);
      const t=new Date().toISOString();
      sel.forEach(c=>put('clients',{id:uid(),type:'Homeowner',state:'FL',...c,state:c.state||'FL',source:'Contatos do iPhone',createdAt:t,updatedAt:t}));
      closeModal();toast(sel.length+' cliente'+(sel.length===1?'':'s')+' importado'+(sel.length===1?'':'s'));
    };
  }

  async function pick(){
    try{const r=await navigator.contacts.select(['name','tel','email','address'],{multiple:true});if(r&&r.length)review(fromPicker(r))}
    catch(e){toast('Não deu para abrir os contatos')}
  }
  function file(){
    const inp=document.createElement('input');inp.type='file';inp.accept='.vcf,text/vcard,text/x-vcard';
    inp.onchange=async()=>{const f=inp.files[0];if(!f)return;const list=parseVcf(await f.text());
      list.length?review(list):toast('Nenhum contato encontrado no arquivo')};
    inp.click();
  }

  window.importContacts=function(){
    const can='contacts' in navigator&&'select' in navigator.contacts;
    modal(`<h2>📥 Importar clientes dos contatos</h2>
      ${can?`<button class="btn a" style="width:100%;padding:14px;margin-bottom:10px" onclick="closeModal();__ciPick()">Escolher contatos do celular</button>`:''}
      <button class="btn${can?'':' a'}" style="width:100%;padding:14px" onclick="closeModal();__ciFile()">Abrir arquivo de contatos (.vcf)</button>
      <div class="small" style="margin-top:14px;line-height:1.6;background:#faf6f8;border-radius:10px;padding:12px"><b>📱 Como importar os clientes do iPhone:</b><br>
      1. Abra o app <b>Contatos</b> do iPhone → toque em <b>Listas</b> (no canto de cima) → <b>Adicionar lista</b> → dê o nome <b>“Clientes”</b>.<br>
      2. Entre na lista e adicione <b>só os clientes</b>.<br>
      3. Volte em Listas, <b>segure o dedo</b> na lista “Clientes” → <b>Exportar</b> → <b>Salvar em Arquivos</b> → escolha <b>No meu iPhone</b> → Salvar.<br>
      4. Volte aqui e toque em <b>Abrir arquivo de contatos (.vcf)</b> → escolha o arquivo salvo.<br>
      5. Confira a lista, desmarque quem não for cliente e toque em <b>Importar marcados</b>.<br>
      <span class="muted">Não aparece “Listas” no app Contatos? Atualize o iPhone em Ajustes → Geral → Atualização de Software (precisa do iOS 16 ou mais novo).</span></div>
      <div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn" onclick="closeModal()">Fechar</button></div>`);
  };
  window.__ciPick=pick;window.__ciFile=file;window.__parseVcf=parseVcf;
})();
