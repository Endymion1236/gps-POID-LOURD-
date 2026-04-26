import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

type Body = {
  start: [number, number]; // [lon, lat]
  end: [number, number];
  vehicle: {
    height: number;
    width: number;
    length: number;
    weight: number;
    axleload?: number;
    hazmat?: boolean;
  };
};

export async function POST(req: NextRequest) {
  const apiKey = process.env.ORS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Clé API OpenRouteService non configurée côté serveur.' },
      { status: 500 },
    );
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide.' }, { status: 400 });
  }

  const { start, end, vehicle } = body;
  if (!start || !end || !vehicle) {
    return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400 });
  }

  const orsBody = {
    coordinates: [start, end],
    instructions: true,
    instructions_format: 'text',
    language: 'fr',
    units: 'm',
    geometry: true,
    elevation: false,
    options: {
      vehicle_type: 'hgv',
      profile_params: {
        restrictions: {
          height: vehicle.height,
          width: vehicle.width,
          length: vehicle.length,
          weight: vehicle.weight,
          ...(vehicle.axleload ? { axleload: vehicle.axleload } : {}),
          ...(vehicle.hazmat ? { hazmat: true } : {}),
        },
      },
    },
  };

  try {
    const r = await fetch(
      'https://api.openrouteservice.org/v2/directions/driving-hgv/geojson',
      {
        method: 'POST',
        headers: {
          Authorization: apiKey,
          'Content-Type': 'application/json',
          Accept: 'application/json, application/geo+json',
        },
        body: JSON.stringify(orsBody),
      },
    );

    const data = await r.json();
    if (!r.ok) {
      return NextResponse.json(
        { error: data?.error?.message || 'Erreur OpenRouteService.', details: data },
        { status: r.status },
      );
    }
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: 'Impossible de joindre OpenRouteService.', details: String(e) },
      { status: 502 },
    );
  }
}
