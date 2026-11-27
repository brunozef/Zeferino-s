// Documentos das ajudantes (W-9, ID, contrato, seguro…) num cofre PRIVADO do Supabase Storage.
// Só quem está logado no Eva's CRM (ou no da Zeferino's) consegue enviar, ver ou apagar.
// Os arquivos nunca ficam públicos: para ver, o app pede um link que expira em 5 minutos.
const SB = 'https://oxjcnimuhjgcthvodmcn.supabase.co';
const PUB = 'sb_publishable_zf_LFOOZ5EmB1C-_GHze6A_8s8xiwe8';
const BUCKET = 'helper-docs';
const ALLOWED = ['evasexpertcleaningservicesllc@gmail.com', 'zeferinosprecisionfinish@gmail.com', 'brunozeferino1@gmail.com'];
export const config = { api: { bodyParser: { sizeLimit: '4.5mb' } } };

const clean = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9._-]+/g, '_').slice(0, 80);

async function who(req) {
  const tok = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!tok) return null;
  const r = await fetch(`${SB}/auth/v1/user`, { headers: { apikey: PUB, Authorization: 'Bearer ' + tok } });
  if (!r.ok) return null;
  const u = await r.json();
  return u && ALLOWED.includes(String(u.email || '').toLowerCase()) ? u : null;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const key = (process.env.SUPABASE_SECRET_KEY || '').trim().replace(/^Bearer\s+/i, '');
  if (!key) return res.status(500).json({ error: 'not_configured' });
  const user = await who(req);
  if (!user) return res.status(401).json({ error: 'login' });
  const h = { apikey: key };
  if (key.startsWith('eyJ')) h.Authorization = 'Bearer ' + key; // chave antiga service_role

  let b = req.body || {};
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = {}; } }
  const action = b.action;

  if (action === 'upload') {
    const helperId = clean(b.helperId), name = clean(b.name) || 'arquivo';
    if (!helperId || !b.data) return res.status(400).json({ error: 'missing' });
    const buf = Buffer.from(String(b.data), 'base64');
    if (buf.length > 3.3 * 1024 * 1024) return res.status(413).json({ error: 'too_big' });
    const type = /^(application\/pdf|image\/(jpeg|png|heic|heif|webp))$/.test(b.type) ? b.type : 'application/octet-stream';
    const path = `${helperId}/${Date.now()}-${name}`;
    const up = async () => fetch(`${SB}/storage/v1/object/${BUCKET}/${path}`, { method: 'POST', headers: { ...h, 'Content-Type': type, 'x-upsert': 'false' }, body: buf });
    let r = await up();
    if (r.status === 400 || r.status === 404) { // cofre ainda não existe: cria (privado) e tenta de novo
      await fetch(`${SB}/storage/v1/bucket`, { method: 'POST', headers: { ...h, 'Content-Type': 'application/json' }, body: JSON.stringify({ id: BUCKET, name: BUCKET, public: false, file_size_limit: 5 * 1024 * 1024 }) });
      r = await up();
    }
    if (!r.ok) return res.status(502).json({ error: 'upload_failed', detail: (await r.text()).slice(0, 200) });
    return res.status(200).json({ ok: true, path, size: buf.length });
  }

  const path = String(b.path || '');
  if (!/^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/.test(path)) return res.status(400).json({ error: 'bad_path' });

  if (action === 'url') {
    const r = await fetch(`${SB}/storage/v1/object/sign/${BUCKET}/${path}`, { method: 'POST', headers: { ...h, 'Content-Type': 'application/json' }, body: JSON.stringify({ expiresIn: 300 }) });
    const j = r.ok ? await r.json() : null;
    if (!j || !j.signedURL) return res.status(404).json({ error: 'not_found' });
    return res.status(200).json({ url: SB + '/storage/v1' + j.signedURL });
  }
  if (action === 'delete') {
    const r = await fetch(`${SB}/storage/v1/object/${BUCKET}`, { method: 'DELETE', headers: { ...h, 'Content-Type': 'application/json' }, body: JSON.stringify({ prefixes: [path] }) });
    return res.status(r.ok ? 200 : 502).json({ ok: r.ok });
  }
  return res.status(400).json({ error: 'bad_action' });
}
