/**
 * Helpers de calculs géographiques pour la navigation.
 * Toutes les coordonnées sont [longitude, latitude].
 */

const R = 6371000; // Rayon Terre en mètres
const toRad = (d: number) => (d * Math.PI) / 180;
const toDeg = (r: number) => (r * 180) / Math.PI;

/** Distance Haversine entre 2 points GPS, en mètres. */
export function distance(a: [number, number], b: [number, number]): number {
  const [lon1, lat1] = a;
  const [lon2, lat2] = b;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Cap (bearing) de A vers B, en degrés depuis le Nord (0-360). */
export function bearing(a: [number, number], b: [number, number]): number {
  const [lon1, lat1] = a;
  const [lon2, lat2] = b;
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δλ = toRad(lon2 - lon1);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);
  return (toDeg(θ) + 360) % 360;
}

/**
 * Trouve le point du tracé le plus proche de la position courante.
 * Renvoie l'index du segment + la distance perpendiculaire (cross-track) en mètres.
 */
export function projectOnRoute(
  pos: [number, number],
  coordinates: [number, number][],
): { index: number; crossTrack: number; alongTrack: number } {
  if (coordinates.length === 0) return { index: 0, crossTrack: Infinity, alongTrack: 0 };
  if (coordinates.length === 1) {
    return { index: 0, crossTrack: distance(pos, coordinates[0]), alongTrack: 0 };
  }

  let best = { index: 0, crossTrack: Infinity, alongTrack: 0 };
  let along = 0;

  for (let i = 0; i < coordinates.length - 1; i++) {
    const a = coordinates[i];
    const b = coordinates[i + 1];
    const segLen = distance(a, b);
    const d = pointToSegmentDistance(pos, a, b);
    if (d < best.crossTrack) {
      best = { index: i, crossTrack: d, alongTrack: along };
    }
    along += segLen;
  }
  return best;
}

/** Distance d'un point à un segment GPS, en mètres (approximation locale). */
function pointToSegmentDistance(
  p: [number, number],
  a: [number, number],
  b: [number, number],
): number {
  const segLen = distance(a, b);
  if (segLen < 0.5) return distance(p, a);

  // Projection en mètres autour du point a (approximation plate locale)
  const φ = toRad(a[1]);
  const mPerDegLat = 111320;
  const mPerDegLon = 111320 * Math.cos(φ);

  const ax = 0;
  const ay = 0;
  const bx = (b[0] - a[0]) * mPerDegLon;
  const by = (b[1] - a[1]) * mPerDegLat;
  const px = (p[0] - a[0]) * mPerDegLon;
  const py = (p[1] - a[1]) * mPerDegLat;

  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  const projX = ax + t * dx;
  const projY = ay + t * dy;
  return Math.hypot(px - projX, py - projY);
}

/**
 * Distance restante depuis la position courante jusqu'à la fin du tracé,
 * en suivant le tracé.
 */
export function remainingDistance(
  pos: [number, number],
  coordinates: [number, number][],
): number {
  const { index } = projectOnRoute(pos, coordinates);
  let remaining = distance(pos, coordinates[index + 1] ?? coordinates[index]);
  for (let i = index + 1; i < coordinates.length - 1; i++) {
    remaining += distance(coordinates[i], coordinates[i + 1]);
  }
  return remaining;
}
