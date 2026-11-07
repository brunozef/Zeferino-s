// Recebe o pedido de orçamento do formulário do site, salva no Supabase (tabela leads)
// e manda uma notificação push para o app Zeferino's CRM instalado no celular.
// Variáveis de ambiente na Vercel: SUPABASE_SECRET_KEY e VAPID_PRIVATE_KEY.
import * as wp from 'web-push';
const webpush = wp.default || wp;

const SB = 'https://oxjcnimuhjgcthvodmcn.supabase.co';
const VAPID_PUBLIC = 'BLaOpAHxXjQqAw2b4oXH9isncMoXRBKtzjjV0cOyZLfs53hBpSP2GQH3kR9yMTt_tu64vzlFGkTYhHEDdyPTyNA';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) return res.status(503).json({ ok: false, error: 'not_configured' });

  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = {}; } }
  b = b || {};
  const s = (v, n) => String(v ?? '').trim().slice(0, n);
  const lead = {
    name: s(b.name, 190), phone: s(b.phone, 40), email: s(b.email, 190), city: s(b.city, 120),
    service: s(b.service, 160), details: s(b.details, 4900), source: b.source === 'cleaning' ? 'cleaning' : 'site'
  };
  if (!lead.name && !lead.phone && !lead.email) return res.status(400).json({ ok: false });

  const h = { apikey: key, 'Content-Type': 'application/json' };
  if (key.startsWith('eyJ')) h.Authorization = 'Bearer ' + key; // chave antiga service_role

  const ins = await fetch(`${SB}/rest/v1/leads`, { method: 'POST', headers: { ...h, Prefer: 'return=minimal' }, body: JSON.stringify(lead) });
  if (!ins.ok) return res.status(502).json({ ok: false, error: 'db_' + ins.status });

  let sent = 0;
  const vp = process.env.VAPID_PRIVATE_KEY;
  if (vp) {
    try {
      webpush.setVapidDetails('mailto:zeferinosprecisionfinish@gmail.com', VAPID_PUBLIC, vp);
      const r = await fetch(`${SB}/rest/v1/push_subs?select=endpoint,sub`, { headers: h });
      const subs = r.ok ? await r.json() : [];
      const payload = JSON.stringify({
        title: '🔔 Novo lead: ' + (lead.name || 'cliente do site'),
        body: [lead.service, lead.city].filter(Boolean).join(' – ') + (lead.phone ? '\n' + lead.phone : ''),
        url: '/crm/#leads'
      });
      await Promise.all(subs.map(async x => {
        try { await webpush.sendNotification(x.sub, payload, { TTL: 86400, urgency: 'high' }); sent++; }
        catch (e) {
          if (e.statusCode === 404 || e.statusCode === 410) {
            await fetch(`${SB}/rest/v1/push_subs?endpoint=eq.${encodeURIComponent(x.endpoint)}`, { method: 'DELETE', headers: h });
          }
        }
      }));
    } catch (e) { /* o lead já foi salvo; a notificação é bônus */ }
  }
  return res.status(200).json({ ok: true, sent });
}
