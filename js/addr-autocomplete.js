/* Autocompletar de endereço para os CRMs (Zeferino's e Eva).
   Grátis, sem chave: usa o Photon (OpenStreetMap). Ao digitar no campo de endereço,
   mostra sugestões; ao tocar numa, preenche endereço, cidade, estado e ZIP. */
(function(){
  const SEL='input[name="address"],input[data-w="address"],input[data-e="jobAddress"]';
  const CENTER={lat:26.40,lon:-81.80}; // Sudoeste da Flórida (Fort Myers / Naples)
  const BBOX='-87.7,24.3,-79.8,31.1';   // Flórida
  const ST={Alabama:'AL',Alaska:'AK',Arizona:'AZ',Arkansas:'AR',California:'CA',Colorado:'CO',Connecticut:'CT',Delaware:'DE',Florida:'FL',Georgia:'GA',Hawaii:'HI',Idaho:'ID',Illinois:'IL',Indiana:'IN',Iowa:'IA',Kansas:'KS',Kentucky:'KY',Louisiana:'LA',Maine:'ME',Maryland:'MD',Massachusetts:'MA',Michigan:'MI',Minnesota:'MN',Mississippi:'MS',Missouri:'MO',Montana:'MT',Nebraska:'NE',Nevada:'NV','New Hampshire':'NH','New Jersey':'NJ','New Mexico':'NM','New York':'NY','North Carolina':'NC','North Dakota':'ND',Ohio:'OH',Oklahoma:'OK',Oregon:'OR',Pennsylvania:'PA','Rhode Island':'RI','South Carolina':'SC','South Dakota':'SD',Tennessee:'TN',Texas:'TX',Utah:'UT',Vermont:'VT',Virginia:'VA',Washington:'WA','West Virginia':'WV',Wisconsin:'WI',Wyoming:'WY'};

  const css=document.createElement('style');
  css.textContent=`.addr-dd{position:absolute;left:0;right:0;top:100%;z-index:200;background:#fff;border:1px solid #d6d9e0;border-radius:10px;box-shadow:0 10px 28px rgba(0,0,0,.18);margin-top:4px;max-height:280px;overflow:auto}
.addr-dd div{padding:11px 12px;cursor:pointer;border-bottom:1px solid #f0f1f4;font-size:14px;line-height:1.3}
.addr-dd div:last-child{border-bottom:0}.addr-dd div.on,.addr-dd div:hover{background:#f3f0ea}
.addr-dd small{display:block;color:#6b7280;font-size:12px;margin-top:2px}.addr-dd .addr-msg{color:#6b7280;cursor:default;font-size:13px}`;
  document.head.appendChild(css);

  let dd=null,cur=null,items=[],idx=-1,timer=null,ctrl=null;

  function close(){if(dd){dd.remove();dd=null}items=[];idx=-1}
  function scope(el){return el.closest('form')||el.closest('.modal')||el.closest('.card')||document}
  function sib(el,key){ // campos cidade/estado/zip do mesmo formulário
    const s=scope(el);
    if(el.name==='address') return s.querySelector(`input[name="${key}"]`);
    if(el.dataset.w==='address') return s.querySelector(`input[data-w="${key}"]`);
    return null;
  }
  function setVal(inp,v){if(!inp||v==null)return;inp.value=v;inp.dispatchEvent(new Event('input',{bubbles:true}));inp.dispatchEvent(new Event('change',{bubbles:true}))}

  function parse(f,typed){
    const p=f.properties||{};
    if(p.countrycode&&p.countrycode!=='US')return null;
    let num=p.housenumber||'';
    const m=typed.match(/^\s*(\d+[A-Za-z]?)\s/);
    if(!num&&m&&p.street) num=m[1];            // OSM sem número: usa o que foi digitado
    const street=p.street||(p.type==='street'?p.name:'')||'';
    let line1=num&&street?`${num} ${street}`:(street||p.name||'');
    const city=p.city||p.town||p.village||p.locality||p.district||'';
    const state=ST[p.state]||p.state||'';
    const zip=(p.postcode||'').split(/[;,]/)[0].trim();
    if(!line1)return null;
    return {line1,city,state,zip,full:[line1,city,[state,zip].filter(Boolean).join(' ')].filter(Boolean).join(', ')};
  }

  function show(el,list,msg){
    close();cur=el;items=list;
    const host=el.parentElement;if(getComputedStyle(host).position==='static')host.style.position='relative';
    dd=document.createElement('div');dd.className='addr-dd';
    if(msg){dd.innerHTML=`<div class="addr-msg">${msg}</div>`}
    else list.forEach((r,i)=>{const d=document.createElement('div');
      d.innerHTML=`${esc(r.line1)}<small>${esc([r.city,[r.state,r.zip].filter(Boolean).join(' ')].filter(Boolean).join(', '))}</small>`;
      d.addEventListener('pointerdown',e=>{e.preventDefault();pick(i)});dd.appendChild(d)});
    host.appendChild(dd);
  }
  function esc(s){return String(s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}

  function pick(i){
    const r=items[i],el=cur;if(!r||!el)return;
    const zipI=sib(el,'zip');
    if(zipI){ // formulário com campos separados
      setVal(el,r.line1);
      if(r.city)setVal(sib(el,'city'),r.city);
      if(r.state)setVal(sib(el,'state'),r.state);
      if(r.zip)setVal(zipI,r.zip);
    } else setVal(el,r.full); // campo único (endereço da obra / limpeza)
    close();el.focus();
  }

  async function search(el){
    const q=el.value.trim();
    if(q.length<4){close();return}
    if(ctrl)ctrl.abort();ctrl=new AbortController();
    const url=`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=8&lang=en&lat=${CENTER.lat}&lon=${CENTER.lon}&bbox=${BBOX}`;
    try{
      const r=await fetch(url,{signal:ctrl.signal});const j=await r.json();
      const seen=new Set(),list=[];
      for(const f of j.features||[]){const x=parse(f,q);if(!x)continue;const k=x.full.toLowerCase();if(seen.has(k))continue;seen.add(k);list.push(x)}
      if(document.activeElement!==el)return;
      list.length?show(el,list.slice(0,6)):show(el,[],'Nenhum endereço encontrado — continue digitando');
    }catch(e){if(e.name!=='AbortError')close()}
  }

  document.addEventListener('input',e=>{
    const el=e.target;if(!el.matches||!el.matches(SEL)||!e.isTrusted)return;
    el.setAttribute('autocomplete','off');
    clearTimeout(timer);timer=setTimeout(()=>search(el),300);
  });
  document.addEventListener('keydown',e=>{
    if(!dd||e.target!==cur||!items.length)return;
    const rows=dd.children;
    if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();idx=(idx+(e.key==='ArrowDown'?1:-1)+items.length)%items.length;[...rows].forEach((r,i)=>r.classList.toggle('on',i===idx))}
    else if(e.key==='Enter'&&idx>=0){e.preventDefault();pick(idx)}
    else if(e.key==='Escape')close();
  });
  document.addEventListener('focusout',e=>{if(e.target===cur)setTimeout(close,150)});
})();
