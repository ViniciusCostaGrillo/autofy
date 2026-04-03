import { supabase } from './supabase';

interface SearchPlacesResponse {
  data?: Array<{
    label: string;
    locality?: string;
    region?: string;
  }>;
  error?: string;
}

export async function searchRoutePlaces(query: string, countryCode = 'BR') {
  const { data, error } = await supabase.functions.invoke('route-places', {
    body: { query, countryCode },
  });

  const payload = data as SearchPlacesResponse | null;
  if (error) {
    throw new Error(payload?.error || error.message || 'Nao foi possivel buscar lugares.');
  }

  return payload?.data || [];
}
