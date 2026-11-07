// Google reviews for Zeferino's Precision Finish, served to the site's review carousel.
// Needs one Vercel environment variable: GOOGLE_PLACES_KEY (a Google Maps Platform key with
// "Places API (New)" enabled). Optional: GOOGLE_PLACE_ID to skip the name search.
// Responses are cached on Vercel's edge for 6 hours, so Google is called only a few times a day.

const QUERY = "Zeferino's Precision Finish Fort Myers FL";
const FIELDS = 'id,displayName,rating,userRatingCount,reviews';

export default async function handler(req, res) {
  const key = process.env.GOOGLE_PLACES_KEY;
  if (!key) return res.status(503).json({ ok: false, error: 'not_configured' });

  try {
    let place;
    const id = process.env.GOOGLE_PLACE_ID;
    if (id) {
      const r = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(id)}`, {
        headers: { 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': FIELDS }
      });
      if (!r.ok) throw new Error('details ' + r.status);
      place = await r.json();
    } else {
      const r = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': key,
          'X-Goog-FieldMask': FIELDS.split(',').map(f => 'places.' + f).join(',')
        },
        body: JSON.stringify({ textQuery: QUERY, maxResultCount: 1 })
      });
      if (!r.ok) throw new Error('search ' + r.status);
      place = ((await r.json()).places || [])[0];
    }
    if (!place) throw new Error('not_found');

    const reviews = (place.reviews || [])
      .filter(v => (v.originalText || v.text) && v.rating)
      .map(v => ({
        name: v.authorAttribution?.displayName || 'Google user',
        stars: v.rating,
        text: (v.originalText || v.text).text,
        when: v.relativePublishTimeDescription || '',
        time: v.publishTime || ''
      }));

    res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=86400');
    return res.status(200).json({
      ok: true,
      rating: place.rating || null,
      count: place.userRatingCount || reviews.length,
      reviews
    });
  } catch (e) {
    res.setHeader('Cache-Control', 's-maxage=600');
    return res.status(502).json({ ok: false, error: String(e.message || e) });
  }
}
