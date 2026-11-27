// Manda AGORA o aviso do fim do dia só para o celular de quem tocou no botão (teste).
import { runDayCheck } from './day-check.js';
const SB = 'https://oxjcnimuhjgcthvodmcn.supabase.co';
const PUB = 'sb_publishable_zf_LFOOZ5EmB1C-_GHze6A_8s8xiwe8';
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const tok = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const r = tok ? await fetch(`${SB}/auth/v1/user`, { headers: { apikey: PUB, Authorization: 'Bearer ' + tok } }) : null;
  const u = r && r.ok ? await r.json() : null;
  if (!u || !u.id) return res.status(401).json({ error: 'login' });
  const out = await runDayCheck({ test: true, owner: u.id });
  return res.status(200).json(out);
}
