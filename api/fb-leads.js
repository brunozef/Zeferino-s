// Leads dos anúncios do Facebook/Instagram (Meta Lead Ads) -> CRM.
//
// 1) Webhook direto da Meta (recomendado)
//    Callback URL:  https://www.zeferinosusa.com/api/fb-leads
//    Verify token:  o mesmo valor de FB_VERIFY_TOKEN
//    Campo:         leadgen (objeto Page)
//    Variáveis na Vercel:
//      FB_VERIFY_TOKEN   texto qualquer combinado na configuração do webhook
//      FB_APP_SECRET     "App Secret" do app da Meta (confere a assinatura da Meta)
//      FB_PAGE_TOKEN     token de acesso da Página (permissão leads_retrieval)
//      FB_PAGE_TOKENS    (opcional) JSON {"<page_id>":"<token>"} para mais de uma Página
//      FB_ZEFERINO_PAGE_IDS (opcional) IDs de Páginas cujos leads vão para o Zeferino's CRM;
//                        todas as outras vão para o Eva's CRM
//
// 2) Ponte por Make/Zapier (alternativa): POST /api/fb-leads?key=<LEADS_HOOK_KEY>
//    com JSON {name, phone, email, city, service, details, app:"eva"|"zeferinos"}
import crypto from 'crypto';
import { cleanLead, saveAndNotify } from './_lib/leads.js';

export const config = { api: { bodyParser: false } };

const env = k => (process.env[k] || '').trim();

async function rawBody(req) {
  // Lê o corpo cru ANTES de tocar em req.body (na Vercel o req.body é um getter que consome o stream
  // e o JSON re-serializado não bate com a assinatura da Meta).
  if (req.readable !== false && typeof req.on === 'function') {
    try {
      const chunks = [];
      for await (const c of req) chunks.push(typeof c === 'string' ? Buffer.from(c) : c);
      if (chunks.length) return Buffer.concat(chunks).toString('utf8');
    } catch {}
  }
  const b = req.body;
  if (typeof b === 'string') return b;
  if (Buffer.isBuffer(b)) return b.toString('utf8');
  return b && typeof b === 'object' ? JSON.stringify(b) : '';
}

function safeEqual(a, b) {
  const A = Buffer.from(a), B = Buffer.from(b);
  return A.length === B.length && crypto.timingSafeEqual(A, B);
}

const PICK = {
  name: ['full_name', 'name', 'nome', 'nome_completo'],
  first: ['first_name', 'primeiro_nome'], last: ['last_name', 'sobrenome'],
  phone: ['phone_number', 'phone', 'telefone', 'mobile_phone', 'whatsapp'],
  email: ['email', 'e-mail', 'work_email'],
  city: ['city', 'cidade', 'zip_code', 'post_code', 'zip', 'street_address']
};

function fromFieldData(fd) {
  const m = {}; const used = new Set();
  for (const f of fd || []) m[String(f.name || '').toLowerCase()] = (f.values || []).join(', ');
  const take = list => { for (const k of list) if (m[k]) { used.add(k); return m[k]; } return ''; };
  let name = take(PICK.name);
  if (!name) name = [take(PICK.first), take(PICK.last)].filter(Boolean).join(' ');
  const phone = take(PICK.phone), email = take(PICK.email), city = take(PICK.city);
  const extra = Object.entries(m).filter(([k]) => !used.has(k)).map(([k, v]) => `${k.replace(/_/g, ' ').replace(/\?$/, '')}: ${v}`);
  return { name, phone, email, city, extra };
}

// Token salvo pela página /api/fb-connect (Supabase eva_records, coll "_fb")
async function storedToken(pageId) {
  const key = env('SUPABASE_SECRET_KEY').replace(/^Bearer\s+/i, '');
  if (!key) return '';
  const h = { apikey: key };
  if (key.startsWith('eyJ')) h.Authorization = 'Bearer ' + key;
  try {
    const r = await fetch('https://oxjcnimuhjgcthvodmcn.supabase.co/rest/v1/eva_records?select=data&coll=eq._fb&id=eq.page_tokens', { headers: h });
    const rows = r.ok ? await r.json() : [];
    return ((rows[0] && rows[0].data) || {})[String(pageId)] || '';
  } catch { return ''; }
}

async function handleMetaLead(v) {
  const tokens = (() => { try { return JSON.parse(env('FB_PAGE_TOKENS') || '{}'); } catch { return {}; } })();
  const token = tokens[v.page_id] || (await storedToken(v.page_id)) || env('FB_PAGE_TOKEN');
  if (!token) return { ok: false, error: 'no_page_token' };
  const url = `https://graph.facebook.com/v21.0/${encodeURIComponent(v.leadgen_id)}?fields=created_time,field_data,ad_name,campaign_name,form_id&access_token=${encodeURIComponent(token)}`;
  const r = await fetch(url);
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.field_data) return { ok: false, error: 'graph_' + r.status, detail: j.error && j.error.message };
  const f = fromFieldData(j.field_data);
  const zefPages = env('FB_ZEFERINO_PAGE_IDS').split(',').map(x => x.trim()).filter(Boolean);
  const source = zefPages.includes(String(v.page_id)) ? 'site' : 'cleaning';
  const lead = cleanLead({
    name: f.name, phone: f.phone, email: f.email, city: f.city, source,
    service: 'Facebook Lead Ad' + (j.campaign_name ? ' – ' + j.campaign_name : ''),
    details: ['📣 Lead from Facebook/Instagram ad' + (j.ad_name ? ` (${j.ad_name})` : ''), ...f.extra].join('\n')
  });
  return saveAndNotify(lead);
}

export default async function handler(req, res) {
  // Verificação do webhook pela Meta
  if (req.method === 'GET') {
    const q = req.query || {};
    if (q['hub.mode'] === 'subscribe' && env('FB_VERIFY_TOKEN') && q['hub.verify_token'] === env('FB_VERIFY_TOKEN')) {
      return res.status(200).send(String(q['hub.challenge'] || ''));
    }
    return res.status(403).send('forbidden');
  }
  if (req.method !== 'POST') return res.status(405).json({ ok: false });

  const raw = await rawBody(req);
  let body = {};
  try { body = JSON.parse(raw || '{}'); } catch { body = {}; }

  // Ponte Make/Zapier
  const hookKey = env('LEADS_HOOK_KEY');
  if (req.query && req.query.key) {
    if (!hookKey || !safeEqual(String(req.query.key), hookKey)) return res.status(403).json({ ok: false });
    const app = String(body.app || 'eva').toLowerCase();
    const r = await saveAndNotify(cleanLead({ ...body, service: body.service || 'Facebook Lead Ad', source: app.startsWith('zef') ? 'site' : 'cleaning' }));
    return res.status(r.ok ? 200 : 502).json(r);
  }

  // Webhook da Meta: confere a assinatura
  const secret = env('FB_APP_SECRET');
  if (!secret) return res.status(503).json({ ok: false, error: 'not_configured' });
  const sig = String(req.headers['x-hub-signature-256'] || '');
  const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(raw, 'utf8').digest('hex');
  // Se a assinatura não bater, segue mesmo assim: os dados do lead vêm sempre da Graph API com o
  // nosso token (um aviso falso não traz dados). Só registra no log.
  if (!sig || !safeEqual(sig, expected)) console.warn('fb-leads: signature mismatch');

  const results = [];
  for (const entry of body.entry || []) {
    for (const ch of entry.changes || []) {
      if (ch.field === 'leadgen' && ch.value && ch.value.leadgen_id) {
        try { results.push(await handleMetaLead(ch.value)); }
        catch (e) { results.push({ ok: false, error: 'exception' }); }
      }
    }
  }
  if (results.some(r => !r.ok)) console.error('fb-leads', JSON.stringify(results));
  // Sempre 200 para a Meta não ficar reenviando; erros ficam no log da Vercel
  return res.status(200).json({ ok: true, results });
}
