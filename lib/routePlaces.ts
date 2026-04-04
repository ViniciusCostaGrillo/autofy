import { logAppError } from './errorLogger';

interface PhotonFeature {
  properties?: Record<string, string>;
}

export async function searchRoutePlaces(query: string, countryCode = 'BR') {
  try {
    return await searchRoutePlacesDirect(query, countryCode);
  } catch (error) {
    await logAppError('routePlaces.search', error, {
      query,
      countryCode,
      strategy: 'client-photon',
    });
    throw error;
  }
}

async function searchRoutePlacesDirect(query: string, countryCode: string) {
  const sanitized = `${query || ''}`.trim();
  if (!sanitized) {
    return [];
  }

  const url = new URL('https://photon.komoot.io/api/');
  url.searchParams.set('q', sanitized);
  url.searchParams.set('limit', '8');

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Falha ao buscar lugares (${response.status}).`);
  }

  const payload = (await response.json()) as { features?: PhotonFeature[] };
  const seen = new Set<string>();

  return (payload.features || [])
    .filter((item) => {
      const itemCountry = (item.properties?.countrycode || '').toUpperCase();
      return !countryCode || !itemCountry || itemCountry === countryCode.toUpperCase();
    })
    .map((item) => {
      const name = firstString(item.properties?.name);
      const locality = firstString(
        item.properties?.city,
        item.properties?.district,
        item.properties?.county,
        name
      );
      const region = firstString(item.properties?.state, item.properties?.country);
      return {
        label: [name, locality !== name ? locality : '', region].filter(Boolean).join(', '),
        locality,
        region,
      };
    })
    .filter((item) => {
      if (!item.label || seen.has(item.label)) {
        return false;
      }

      seen.add(item.label);
      return true;
    });
}

function firstString(...values: Array<string | undefined>) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return '';
}
