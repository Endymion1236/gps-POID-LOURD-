import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q');
  if (!q || q.length < 3) {
    return NextResponse.json([]);
  }

  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', q);
  url.searchParams.set('format', 'json');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('limit', '6');
  url.searchParams.set('countrycodes', 'fr,be,ch,lu,de,es,it');
  url.searchParams.set('accept-language', 'fr');

  try {
    const r = await fetch(url.toString(), {
      headers: {
        // Nominatim exige un User-Agent identifiable
        'User-Agent': 'RouteHaul/1.0 (https://routehaul.vercel.app)',
        Accept: 'application/json',
      },
      // Mise en cache 1h côté Edge pour éviter de spammer Nominatim
      next: { revalidate: 3600 },
    });

    if (!r.ok) {
      return NextResponse.json({ error: 'Service de recherche indisponible.' }, { status: r.status });
    }

    const data = (await r.json()) as Array<{
      display_name: string;
      lat: string;
      lon: string;
      type?: string;
    }>;

    const results = data.map((d) => ({
      display_name: d.display_name,
      lat: parseFloat(d.lat),
      lon: parseFloat(d.lon),
      type: d.type,
    }));

    return NextResponse.json(results);
  } catch (e) {
    return NextResponse.json(
      { error: 'Erreur réseau.', details: String(e) },
      { status: 502 },
    );
  }
}
