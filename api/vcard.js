// Gera um contato (.vcf) para salvar no celular. Recebe POST de formulário (sem dados na URL).
const clean = v => String(v ?? '').replace(/[\r\n]+/g, ' ').trim().slice(0, 300);
const esc = v => clean(v).replace(/([,;\\])/g, '\\$1');

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('POST only');
  let b = req.body || {};
  if (typeof b === 'string') b = Object.fromEntries(new URLSearchParams(b));
  const name = clean(b.name) || 'Lead';
  const parts = name.split(/\s+/);
  const last = parts.length > 1 ? parts.pop() : '';
  const first = parts.join(' ');
  const lines = ['BEGIN:VCARD', 'VERSION:3.0', `N:${esc(last)};${esc(first)};;;`, `FN:${esc(name)}`];
  if (b.org) lines.push(`ORG:${esc(b.org)}`);
  if (b.phone) lines.push(`TEL;TYPE=CELL:${clean(b.phone).replace(/[^0-9+()\- ]/g, '')}`);
  if (b.email) lines.push(`EMAIL;TYPE=INTERNET:${clean(b.email)}`);
  if (b.address || b.city) lines.push(`ADR;TYPE=HOME:;;${esc(b.address)};${esc(b.city)};${esc(b.state || 'FL')};${esc(b.zip)};USA`);
  if (b.note) lines.push(`NOTE:${esc(String(b.note).replace(/[\r\n]+/g, ' | ').slice(0, 1000))}`);
  lines.push('END:VCARD');
  const file = (name.replace(/[^A-Za-z0-9 _-]/g, '').trim() || 'contato').replace(/\s+/g, '_') + '.vcf';
  res.setHeader('Content-Type', 'text/vcard; charset=utf-8');
  res.setHeader('Content-Disposition', `inline; filename="${file}"`);
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).send(lines.join('\r\n') + '\r\n');
}
