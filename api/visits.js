// Site visits for the CRM home screens, read from Vercel Web Analytics.
//   /api/visits?site=zeferinos  -> carpentry site (every page except /cleaning)
//   /api/visits?site=cleaning   -> Eva's cleaning page (/cleaning)
// Needs one Vercel environment variable: VERCEL_ACCESS_TOKEN (a Vercel account token).
// Days are counted in Florida time. Responses are cached on Vercel's edge for 10 minutes.

const PROJECT_ID = 'prj_YGeMHZ1YG27G18pG6EjqFprqoLKV';
const TEAM_ID = 'team_1kCYvCK6XBG1h9W3LyG5od7j';
const TZ = 'America/New_York';
const DAYS = 30;

const FILTERS = {
  zeferinos: "not startswith(requestPath, '/cleaning')",
  cleaning: "startswith(requestPath, '/cleaning')"
};

// "YYYY-MM-DD" of a moment in Florida time
const etDay = d => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);

// UTC moment of midnight (Florida time) for a "YYYY-MM-DD"
function etMidnight(day) {
  const guess = new Date(day + 'T05:00:00Z');
  const hourThere = Number(new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: '2-digit', hourCycle: 'h23' }).format(guess));
  return new Date(guess.getTime() - hourThere * 3600e3);
}

export default async function handler(req, res) {
  const token = (process.env.VERCEL_ACCESS_TOKEN || '').trim();
  if (!token) return res.status(503).json({ ok: false, error: 'not_configured' });

  const site = String(req.query.site || 'zeferinos');
  const filter = FILTERS[site];
  if (!filter) return res.status(400).json({ ok: false, error: 'bad_site' });

  try {
    const now = new Date();
    const todayEt = etDay(now);
    const start = etMidnight(etDay(new Date(etMidnight(todayEt).getTime() - (DAYS - 1) * 86400e3 + 12 * 3600e3)));

    const qs = new URLSearchParams({
      projectId: PROJECT_ID,
      teamId: TEAM_ID,
      since: start.toISOString(),
      until: now.toISOString(),
      filter,
      limit: '1000'
    });
    qs.append('by', 'hour');
    const r = await fetch('https://api.vercel.com/v1/query/web-analytics/visits/aggregate?' + qs, {
      headers: { Authorization: 'Bearer ' + token }
    });
    if (!r.ok) throw new Error('vercel ' + r.status);
    const rows = (await r.json()).data || [];

    // Group hourly rows into Florida days
    const byDay = {};
    for (let i = 0; i < DAYS; i++) {
      byDay[etDay(new Date(start.getTime() + i * 86400e3 + 12 * 3600e3))] = { visitors: 0, pageviews: 0 };
    }
    for (const row of rows) {
      if (!row.timestamp) continue;
      const d = byDay[etDay(new Date(row.timestamp))];
      if (!d) continue;
      d.visitors += row.visitors || 0;
      d.pageviews += row.pageviews || 0;
    }
    const days = Object.keys(byDay).sort().map(date => ({ date, ...byDay[date] }));
    const sum = n => days.slice(-n).reduce((s, d) => ({ visitors: s.visitors + d.visitors, pageviews: s.pageviews + d.pageviews }), { visitors: 0, pageviews: 0 });

    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=3600');
    return res.status(200).json({
      ok: true,
      site,
      today: days[days.length - 1],
      yesterday: days[days.length - 2],
      last7: sum(7),
      last30: sum(DAYS),
      days,
      updatedAt: now.toISOString()
    });
  } catch (e) {
    res.setHeader('Cache-Control', 's-maxage=60');
    return res.status(502).json({ ok: false, error: String(e.message || e) });
  }
}
