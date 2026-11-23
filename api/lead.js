// Recebe o pedido de orçamento dos formulários do site (carpintaria e limpeza),
// salva no Supabase e manda notificação para o app certo.
// Variáveis de ambiente na Vercel: SUPABASE_SECRET_KEY e VAPID_PRIVATE_KEY.
import { cleanLead, saveAndNotify } from './_lib/leads.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = {}; } }
  const r = await saveAndNotify(cleanLead(b || {}));
  if (!r.ok) return res.status(r.error === 'empty' ? 400 : r.error === 'not_configured' ? 503 : 502).json(r);
  return res.status(200).json(r);
}
