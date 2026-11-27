// Busca de endereço para os CRMs: junta o Census dos EUA (oficial, acerta número + ZIP)
// com o Photon/OpenStreetMap (sugestões enquanto digita). Grátis, sem chave.
const ST = {Alabama:'AL',Alaska:'AK',Arizona:'AZ',Arkansas:'AR',California:'CA',Colorado:'CO',Connecticut:'CT',Delaware:'DE',Florida:'FL',Georgia:'GA',Hawaii:'HI',Idaho:'ID',Illinois:'IL',Indiana:'IN',Iowa:'IA',Kansas:'KS',Kentucky:'KY',Louisiana:'LA',Maine:'ME',Maryland:'MD',Massachusetts:'MA',Michigan:'MI',Minnesota:'MN',Mississippi:'MS',Missouri:'MO',Montana:'MT',Nebraska:'NE',Nevada:'NV','New Hampshire':'NH','New Jersey':'NJ','New Mexico':'NM','New York':'NY','North Carolina':'NC','North Dakota':'ND',Ohio:'OH',Oklahoma:'OK',Oregon:'OR',Pennsylvania:'PA','Rhode Island':'RI','South Carolina':'SC','South Dakota':'SD',Tennessee:'TN',Texas:'TX',Utah:'UT',Vermont:'VT',Virginia:'VA',Washington:'WA','West Virginia':'WV',Wisconsin:'WI',Wyoming:'WY'};
const SUF = {DR:'Dr',ST:'St',AVE:'Ave',BLVD:'Blvd',RD:'Rd',LN:'Ln',CT:'Ct',CIR:'Cir',PL:'Pl',WAY:'Way',TER:'Ter',TRL:'Trl',PKWY:'Pkwy',HWY:'Hwy',LOOP:'Loop',PT:'Pt',CV:'Cv',RUN:'Run',PATH:'Path',SQ:'Sq',XING:'Xing'};
const title = s => String(s || '').toLowerCase().replace(/\b[a-z]/g, c => c.toUpperCase());
const make = (line1, city, state, zip, src) => ({ line1, city, state, zip, src, full: [line1, city, [state, zip].filter(Boolean).join(' ')].filter(Boolean).join(', ') });

async function getJson(url, ms) {
  const c = new AbortController(); const t = setTimeout(() => c.abort(), ms);
  try { const r = await fetch(url, { signal: c.signal, headers: { 'User-Agent': 'ZeferinosCRM/1.0 (zeferinosusa.com)' } }); return r.ok ? await r.json() : null; }
  catch { return null; } finally { clearTimeout(t); }
}

async function census(q) {
  const m = q.match(/^\s*(\d+[A-Za-z]?)\s+\S+/); if (!m) return [];
  const addr = /\b(FL|Florida)\b/i.test(q) ? q : q + ', FL';
  const j = await getJson('https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?benchmark=Public_AR_Current&format=json&address=' + encodeURIComponent(addr), 6000);
  const out = [];
  for (const a of (j?.result?.addressMatches || []).slice(0, 4)) {
    const c = a.addressComponents || {};
    const street = [c.preDirection, c.preType && title(c.preType), title(c.streetName), SUF[c.suffixType] || title(c.suffixType), c.suffixDirection].filter(Boolean).join(' ');
    out.push(make(`${m[1]} ${street}`, title(c.city), c.state || '', c.zip || '', 'census'));
  }
  return out;
}

async function photon(q) {
  const j = await getJson(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=8&lang=en&lat=26.40&lon=-81.80&bbox=-87.7,24.3,-79.8,31.1`, 4000);
  const typedNum = (q.match(/^\s*(\d+[A-Za-z]?)\s/) || [])[1];
  const out = [];
  for (const f of j?.features || []) {
    const p = f.properties || {}; if (p.countrycode && p.countrycode !== 'US') continue;
    const street = p.street || (p.type === 'street' ? p.name : '') || '';
    const num = p.housenumber || (street && typedNum) || '';
    const line1 = num && street ? `${num} ${street}` : (street || p.name || ''); if (!line1) continue;
    out.push(make(line1, p.city || p.town || p.village || p.locality || p.district || '', ST[p.state] || p.state || '', (p.postcode || '').split(/[;,]/)[0].trim(), 'osm'));
  }
  return out;
}

export default async function handler(req, res) {
  const q = String(req.query.q || '').slice(0, 200).trim();
  res.setHeader('Cache-Control', 'public, s-maxage=86400');
  if (q.length < 4) return res.status(200).json([]);
  const [a, b] = await Promise.all([census(q), photon(q)]);
  const seen = new Set(), list = [];
  const nums = new Set(a.map(r => r.line1.split(' ')[0]));
  for (const r of [...a, ...b.filter(r => !nums.has(r.line1.split(' ')[0]))]) { const k = r.full.toLowerCase().replace(/\s+/g, ' '); if (seen.has(k)) continue; seen.add(k); list.push(r); }
  return res.status(200).json(list.slice(0, 6));
}
