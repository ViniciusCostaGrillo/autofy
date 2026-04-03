const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

interface SearchPlacesResponse {
  data?: Array<{
    label: string;
    locality?: string;
    region?: string;
  }>;
  error?: string;
}

export async function searchRoutePlaces(query: string, countryCode = 'BR') {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase env vars missing for place search.');
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/route-places`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
    body: JSON.stringify({ query, countryCode }),
  });

  const payload = (await response.json()) as SearchPlacesResponse;

  if (!response.ok) {
    throw new Error(payload.error || 'Nao foi possivel buscar lugares.');
  }

  return payload.data || [];
}
