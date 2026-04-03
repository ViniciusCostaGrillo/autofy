import { logAppError } from './errorLogger';
import { invokeMapFunction } from './mapFunctions';

interface SearchPlacesResponse {
  data?: Array<{
    label: string;
    locality?: string;
    region?: string;
  }>;
  error?: string;
}

export async function searchRoutePlaces(query: string, countryCode = 'BR') {
  try {
    const payload = await invokeMapFunction<SearchPlacesResponse>('route-places', {
      query,
      countryCode,
    });

    return payload.data || [];
  } catch (error) {
    await logAppError('functions.route-places', error, {
      query,
      countryCode,
    });
    throw error;
  }
}
