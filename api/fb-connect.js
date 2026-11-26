// Liga a Página do Facebook ao Eva's CRM com um token só.
// GET  /api/fb-connect  -> página simples para colar o token do Graph API Explorer
// POST /api/fb-connect  {token} -> confere o token, troca por token longo,
//      pega o token permanente da(s) Página(s), inscreve a Página no app (leadgen)
//      e guarda o token no Supabase (eva_records, coll "_fb").
const SB = 'https://oxjcnimuhjgcthvodmcn.supabase.co';
const G = 'https://graph.facebook.com/v21.0';
const env = k => (process.env[k] || '').trim();

function sbHeaders() {
  const key = env('SUPABASE_SECRET_KEY').replace(/^Bearer\s+/i, '');
  const h = { apikey: key, 'Content-Type': 'application/json' };
  if (key.startsWith('eyJ')) h.Authorization = 'Bearer ' + key;
  return key ? h : null;
}

async function gj(url, opt) {
  const r = await fetch(url, opt);
  const j = await r.json().catch(() => ({}));
  return { ok: r.ok && !j.error, j };
}

const PAGE = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Conectar Facebook – Eva's CRM</title>
<style>body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#fdf2f7;margin:0;padding:24px;color:#3a2030}
.b{max-width:560px;margin:0 auto;background:#fff;border-radius:14px;padding:24px;box-shadow:0 4px 20px rgba(0,0,0,.08)}
h1{font-size:20px;margin:0 0 6px}p{line-height:1.5}textarea{width:100%;box-sizing:border-box;height:110px;font-family:monospace;font-size:12px;padding:10px;border:1px solid #e5b8cc;border-radius:8px}
button{margin-top:12px;width:100%;padding:14px;font-size:16px;font-weight:600;border:0;border-radius:10px;background:#d63d7f;color:#fff;cursor:pointer}button:disabled{opacity:.6}
#m{margin-top:16px;padding:14px;border-radius:10px;display:none;white-space:pre-line}.ok{background:#e9f7ee;color:#1f6b3a}.er{background:#fdecec;color:#8a1f1f}</style></head>
<body><div class="b"><h1>🧼 Conectar o Facebook ao Eva's CRM</h1>
<p>Cole aqui o <b>Access Token</b> do Graph API Explorer (app <b>Eva Leads</b>) e clique em <b>Conectar</b>.</p>
<textarea id="t" placeholder="EAA…"></textarea><button id="g">Conectar</button><div id="m"></div></div>
<script>document.getElementById('g').onclick=async()=>{const b=document.getElementById('g'),m=document.getElementById('m'),t=document.getElementById('t').value.trim();
if(!t){return}b.disabled=true;b.textContent='Conectando…';m.style.display='none';
try{const r=await fetch('/api/fb-connect',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:t})});const j=await r.json();
m.className=j.ok?'ok':'er';m.textContent=j.ok?('✅ Conectado!\\n'+(j.pages||[]).map(p=>'• '+p.name+(p.subscribed?' – recebendo leads':' – inscrição falhou')).join('\\n')):('❌ '+(j.message||j.error||'Erro'));
if(j.ok)document.getElementById('t').value='';}catch(e){m.className='er';m.textContent='❌ Erro de conexão';}
m.style.display='block';b.disabled=false;b.textContent='Conectar';};</script></body></html>`;

export default async function handler(req, res) {
  if (req.method === 'GET') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(PAGE);
  }
  if (req.method !== 'POST') return res.status(405).json({ ok: false });

  const appId = env('FB_APP_ID') || '1149124514639566';
  const secret = env('FB_APP_SECRET');
  const h = sbHeaders();
  if (!secret || !h) return res.status(503).json({ ok: false, message: 'Servidor sem FB_APP_SECRET ou SUPABASE_SECRET_KEY.' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const token = String((body && body.token) || '').trim().replace(/^%20/, '');
  if (!/^EA[A-Za-z0-9]{20,}$/.test(token)) return res.status(400).json({ ok: false, message: 'Isso não parece um Access Token (deve começar com EAA).' });

  // 1) o token é deste app e válido?
  const dbg = await gj(`${G}/debug_token?input_token=${encodeURIComponent(token)}&access_token=${encodeURIComponent(appId + '|' + secret)}`);
  const d = dbg.j && dbg.j.data;
  if (!dbg.ok || !d || !d.is_valid) return res.status(400).json({ ok: false, message: 'Token inválido ou vencido. Gere um novo no Graph API Explorer.' });
  if (String(d.app_id) !== appId) return res.status(400).json({ ok: false, message: 'Esse token é de outro app. Escolha "Eva Leads" em Meta App.' });

  // 2) troca por token longo (de usuário)
  const ex = await gj(`${G}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${encodeURIComponent(secret)}&fb_exchange_token=${encodeURIComponent(token)}`);
  const longTok = (ex.ok && ex.j.access_token) || token;

  // 3) tokens permanentes das Páginas
  let pages = [];
  if (d.type === 'PAGE') {
    const p = await gj(`${G}/me?fields=id,name&access_token=${encodeURIComponent(longTok)}`);
    if (p.ok) pages = [{ id: p.j.id, name: p.j.name, access_token: longTok }];
  } else {
    const acc = await gj(`${G}/me/accounts?fields=id,name,access_token&limit=50&access_token=${encodeURIComponent(longTok)}`);
    if (acc.ok) pages = (acc.j.data || []).filter(p => p.access_token);
  }
  if (!pages.length) return res.status(400).json({ ok: false, message: 'Nenhuma Página liberada nesse token. Gere de novo e marque a página da Eva.' });

  // 4) inscreve cada Página no app (campo leadgen) e guarda os tokens
  const tokens = {};
  const out = [];
  for (const p of pages) {
    const s = await gj(`${G}/${p.id}/subscribed_apps?subscribed_fields=leadgen&access_token=${encodeURIComponent(p.access_token)}`, { method: 'POST' });
    tokens[p.id] = p.access_token;
    out.push({ id: p.id, name: p.name, subscribed: !!(s.ok && s.j.success) });
  }
  const prev = await fetch(`${SB}/rest/v1/eva_records?select=data&coll=eq._fb&id=eq.page_tokens`, { headers: h }).then(r => r.ok ? r.json() : []).catch(() => []);
  const merged = { ...((prev[0] && prev[0].data) || {}), ...tokens };
  const save = await fetch(`${SB}/rest/v1/eva_records?on_conflict=coll,id`, {
    method: 'POST',
    headers: { ...h, Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ coll: '_fb', id: 'page_tokens', data: merged, updated_by: 'fb-connect', updated_at: new Date().toISOString() })
  });
  if (!save.ok) return res.status(502).json({ ok: false, message: 'Não consegui salvar no banco (' + save.status + ').' });
  return res.status(200).json({ ok: true, pages: out.map(({ name, subscribed }) => ({ name, subscribed })) });
}
