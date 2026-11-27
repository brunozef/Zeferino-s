// TEMPORÁRIO: cria/remove uma limpeza de teste de hoje no app da Eva e dispara o aviso do fim do dia.
// Protegido pelo segredo TEST_SEED_TOKEN (variável na Vercel). Apagar depois do teste.
import { runDayCheck } from './day-check.js';
const SB = 'https://oxjcnimuhjgcthvodmcn.supabase.co';
const ID = 'teste-aviso';
function todayNY() {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const g = t => p.find(x => x.type === t).value; return `${g('year')}-${g('month')}-${g('day')}`;
}
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const tok = (process.env.TEST_SEED_TOKEN || '').trim();
  if (!tok || req.query.t !== tok) return res.status(404).json({ error: 'not_found' });
  const key = (process.env.SUPABASE_SECRET_KEY || '').trim().replace(/^Bearer\s+/i, '');
  const h = { apikey: key, 'Content-Type': 'application/json' };
  if (key.startsWith('eyJ')) h.Authorization = 'Bearer ' + key;
  const now = new Date().toISOString();
  if (req.query.a === 'add') {
    const rows = [
      { coll: 'clients', id: ID, data: { id: ID, name: '🧪 TESTE – cliente de exemplo', type: 'Homeowner', address: 'Endereço de teste', city: 'Fort Myers', state: 'FL', price: 100, notes: 'Cliente de teste do aviso. Será apagado.' }, updated_at: now },
      { coll: 'jobs', id: ID, data: { id: ID, type: 'service', clientId: ID, title: '🧪 Limpeza de TESTE', date: todayNY(), time: '17:00', address: 'Endereço de teste, Fort Myers', status: 'scheduled', price: 100 }, updated_at: now }
    ];
    const r = await fetch(`${SB}/rest/v1/eva_records?on_conflict=coll,id`, { method: 'POST', headers: { ...h, Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify(rows) });
    if (!r.ok) return res.status(502).json({ error: 'db', detail: (await r.text()).slice(0, 300) });
    const out = await runDayCheck({});
    return res.status(200).json({ added: true, ...out });
  }
  if (req.query.a === 'push') return res.status(200).json(await runDayCheck({}));
  if (req.query.a === 'remove') {
    const r = await fetch(`${SB}/rest/v1/eva_records?id=eq.${ID}&coll=in.(clients,jobs)`, { method: 'DELETE', headers: h });
    return res.status(r.ok ? 200 : 502).json({ removed: r.ok });
  }
  return res.status(400).json({ error: 'a=add|push|remove' });
}
