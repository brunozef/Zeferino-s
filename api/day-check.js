// Fim do dia (agendado na Vercel às 18h, 19h e 20h de Fort Myers):
// só avisa em dia que tem limpeza agendada e só enquanto alguma não foi respondida
// (feita, cancelada ou reagendada). Respondeu tudo → os próximos avisos não saem.
// se houver limpezas de hoje ainda não marcadas como feitas no app da Eva,
// manda uma notificação para os celulares do Eva's CRM. Ao tocar, abre a tela
// para marcar "Foi feita" ou "Reagendar".
import { handleSchedule } from '@vercel/schedules';
import * as wp from 'web-push';
const webpush = wp.default || wp;

const SB = 'https://oxjcnimuhjgcthvodmcn.supabase.co';
const VAPID_PUBLIC = 'BLaOpAHxXjQqAw2b4oXH9isncMoXRBKtzjjV0cOyZLfs53hBpSP2GQH3kR9yMTt_tu64vzlFGkTYhHEDdyPTyNA';

function todayFortMyers() {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const g = t => p.find(x => x.type === t).value;
  return `${g('year')}-${g('month')}-${g('day')}`;
}

// Função privada: só o agendador da Vercel chama (vercel.json → schedules.eva-day-check)
export const POST = handleSchedule(async (meta) => {
  const out = await runDayCheck();
  console.log('day-check', meta && meta.executionId, JSON.stringify(out));
});

function hourNY() { return +new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: 'numeric', hour12: false }).format(new Date()) % 24; }

export async function runDayCheck(opt = {}) {
  const key = (process.env.SUPABASE_SECRET_KEY || '').trim().replace(/^Bearer\s+/i, '');
  const vp = (process.env.VAPID_PRIVATE_KEY || '').trim();
  if (!key || !vp) return ({ ok: false, error: 'not_configured' });
  const h = { apikey: key };
  if (key.startsWith('eyJ')) h.Authorization = 'Bearer ' + key;

  const day = todayFortMyers();
  const r = await fetch(`${SB}/rest/v1/eva_records?select=id,data&coll=eq.jobs&data->>date=eq.${day}`, { headers: h });
  const jobs = (r.ok ? await r.json() : []).map(x => x.data || {}).filter(j => j.type === 'service' && j.status !== 'cancelled');
  const pending = jobs.filter(j => j.status !== 'done');
  if (!pending.length && !opt.test) return ({ ok: true, day, jobs: jobs.length, pending: 0, sent: 0 });

  // nomes dos clientes para a mensagem
  let names = [];
  try {
    const ids = [...new Set(pending.map(j => j.clientId).filter(Boolean))];
    if (ids.length) {
      const c = await fetch(`${SB}/rest/v1/eva_records?select=id,data&coll=eq.clients&id=in.(${ids.map(encodeURIComponent).join(',')})`, { headers: h });
      const map = Object.fromEntries((c.ok ? await c.json() : []).map(x => [x.id, (x.data || {}).name]));
      names = pending.map(j => map[j.clientId]).filter(Boolean);
    }
  } catch (e) { /* sem nomes, tudo bem */ }

  webpush.setVapidDetails('mailto:zeferinosprecisionfinish@gmail.com', VAPID_PUBLIC, vp);
  const s = await fetch(`${SB}/rest/v1/push_subs?select=endpoint,sub&app=eq.eva${opt.owner ? '&owner=eq.' + encodeURIComponent(opt.owner) : ''}`, { headers: h });
  const subs = s.ok ? await s.json() : [];
  const n = pending.length;
  const payload = JSON.stringify({
    title: (opt.test ? '[TESTE] ' : '') + (hourNY() >= 20 ? '⏰ Último lembrete: ' : hourNY() >= 19 ? '🔔 Lembrete: ' : '🧹 ') + `as limpezas de hoje foram feitas?`,
    body: !n ? 'Hoje não tem limpeza pendente — este é só um teste do aviso do fim do dia.' : (names.length ? 'Foi feita a casa de ' + names.slice(0, 5).join(', de ').replace(/, de ([^,]*)$/, ' e de $1') + (names.length > 5 ? '…' : '') + '?' : `${n} casa${n > 1 ? 's' : ''} para confirmar.`) + ' Toque para responder: Feito ou Reagendar.',
    url: `/eva-crm/#checkday-${day}`,
    tag: 'checkday-' + day
  });
  let sent = 0;
  await Promise.all(subs.map(async x => {
    try { await webpush.sendNotification(x.sub, payload, { TTL: 6 * 3600, urgency: 'high' }); sent++; }
    catch (e) {
      if (e.statusCode === 404 || e.statusCode === 410) await fetch(`${SB}/rest/v1/push_subs?endpoint=eq.${encodeURIComponent(x.endpoint)}`, { method: 'DELETE', headers: h });
    }
  }));
  return ({ ok: true, day, jobs: jobs.length, pending: n, sent });
}
