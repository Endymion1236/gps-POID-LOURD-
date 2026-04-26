export type VehicleProfile = {
  id: string;
  name: string;
  emoji: string;
  height: number; // mètres
  width: number; // mètres
  length: number; // mètres
  weight: number; // tonnes
  axleload?: number; // tonnes par essieu
  hazmat?: boolean;
};

export type GeocodeResult = {
  display_name: string;
  lat: number;
  lon: number;
  type?: string;
};

export type RouteSummary = {
  distance: number; // mètres
  duration: number; // secondes
  ascent?: number;
  descent?: number;
};

export type RouteStep = {
  instruction: string;
  distance: number;
  duration: number;
  type: number;
  name?: string;
};

export type RouteResult = {
  geometry: GeoJSON.LineString;
  summary: RouteSummary;
  steps: RouteStep[];
  warnings?: string[];
  bbox: [number, number, number, number];
};
