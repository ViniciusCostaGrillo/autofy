import { FuelType, RouteEstimate } from '@/types/models';
import { logAppError } from './errorLogger';

interface EstimateRouteInput {
  origin: string;
  destination: string;
  avgConsumptionKmL: number;
  fuelType: FuelType;
  pricingFuelType?: Extract<FuelType, 'gasoline' | 'ethanol' | 'diesel'>;
  countryCode?: string;
}

interface PhotonFeature {
  geometry?: {
    coordinates?: [number, number];
  };
  properties?: Record<string, string>;
}

interface OsrmRouteResponse {
  code?: string;
  routes?: Array<{
    distance?: number;
    duration?: number;
  }>;
  message?: string;
}

export async function estimateRoute(input: EstimateRouteInput): Promise<RouteEstimate> {
  try {
    return await estimateRouteDirect(input);
  } catch (error) {
    await logAppError('routeEstimate.estimate', error, {
      origin: input.origin,
      destination: input.destination,
      countryCode: input.countryCode || 'BR',
      strategy: 'client-photon-osrm',
    });
    throw error;
  }
}

async function estimateRouteDirect(input: EstimateRouteInput): Promise<RouteEstimate> {
  const countryCode = input.countryCode || 'BR';
  const origin = await geocodePlace(input.origin, countryCode);
  const destination = await geocodePlace(input.destination, countryCode);

  let distanceKm: number;
  let durationMinutes: number;
  let distanceSource = 'Nominatim + estimativa';

  try {
    const route = await fetchOsrmRoute(origin, destination);
    distanceKm = roundTo(route.distanceMeters / 1000, 1);
    durationMinutes = Math.max(1, Math.round(route.durationSeconds / 60));
    distanceSource = 'OSRM';
  } catch {
    const directDistanceKm = haversineDistanceKm(origin, destination);
    distanceKm = roundTo(directDistanceKm * 1.18, 1);
    durationMinutes = Math.max(1, Math.round((distanceKm / 70) * 60));
  }

  const fuelLiters = roundTo(distanceKm / input.avgConsumptionKmL, 2);

  return {
    distanceKm,
    durationMinutes,
    tollCost: 0,
    fuelLiters,
    fuelCost: 0,
    totalCost: 0,
    currencyCode: countryCode === 'BR' ? 'BRL' : 'USD',
    usedTollPass: false,
    distanceSource,
    tollSource: 'manual',
  };
}

async function geocodePlace(query: string, countryCode: string) {
  const url = new URL('https://photon.komoot.io/api/');
  url.searchParams.set('q', query.trim());
  url.searchParams.set('limit', '5');

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Falha ao localizar a cidade informada (${response.status}).`);
  }

  const payload = (await response.json()) as { features?: PhotonFeature[] };
  const place = (payload.features || []).find((item) => {
    const itemCountry = (item.properties?.countrycode || '').toUpperCase();
    return !countryCode || !itemCountry || itemCountry === countryCode.toUpperCase();
  });
  const coordinates = place?.geometry?.coordinates;
  if (!coordinates || coordinates.length < 2) {
    throw new Error('Nao foi possivel localizar a origem ou o destino informados.');
  }

  return {
    lat: Number(coordinates[1]),
    lon: Number(coordinates[0]),
  };
}

async function fetchOsrmRoute(
  origin: { lat: number; lon: number },
  destination: { lat: number; lon: number }
) {
  const url = new URL(
    `https://router.project-osrm.org/route/v1/driving/${origin.lon},${origin.lat};${destination.lon},${destination.lat}`
  );
  url.searchParams.set('overview', 'false');
  url.searchParams.set('alternatives', 'false');
  url.searchParams.set('steps', 'false');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url.toString(), {
      signal: controller.signal,
    });

    const payload = (await response.json()) as OsrmRouteResponse;
    if (!response.ok || payload.code !== 'Ok') {
      throw new Error(payload.message || `Falha ao consultar a rota (${response.status}).`);
    }

    const route = payload.routes?.[0];
    if (!route?.distance || !route?.duration) {
      throw new Error('Nao foi possivel encontrar uma rota valida.');
    }

    return {
      distanceMeters: route.distance,
      durationSeconds: route.duration,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function haversineDistanceKm(
  origin: { lat: number; lon: number },
  destination: { lat: number; lon: number }
) {
  const earthRadiusKm = 6371;
  const dLat = toRadians(destination.lat - origin.lat);
  const dLon = toRadians(destination.lon - origin.lon);
  const lat1 = toRadians(origin.lat);
  const lat2 = toRadians(destination.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function roundTo(value: number, fractionDigits: number) {
  return Number(value.toFixed(fractionDigits));
}
