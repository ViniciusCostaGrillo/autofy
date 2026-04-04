const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('APP_ORIGIN') || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface SearchPlacesRequest {
  query: string;
  countryCode?: string;
}

interface PhotonFeature {
  properties?: Record<string, string>;
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405);
  }

  try {
    const body = (await request.json()) as SearchPlacesRequest;
    const query = sanitizeQuery(body.query);
    const countryCode = sanitizeCountryCode(body.countryCode);

    if (query.length < 1) {
      return jsonResponse({ data: [] });
    }

    const url = new URL('https://photon.komoot.io/api/');
    url.searchParams.set('q', query);
    url.searchParams.set('limit', '8');

    const response = await fetch(url);
    if (!response.ok) {
      return jsonResponse({ error: `Falha ao buscar lugares (${response.status}).` }, response.status);
    }

    const payload = (await response.json()) as { features?: PhotonFeature[] };
    const seen = new Set<string>();
    const data = (payload.features || [])
      .filter((feature) => {
        const featureCountry = (feature.properties?.countrycode || '').toUpperCase();
        return !countryCode || !featureCountry || featureCountry === countryCode.toUpperCase();
      })
      .map((feature) => {
        const name = firstString(feature.properties?.name);
        const locality = firstString(
          feature.properties?.city,
          feature.properties?.district,
          feature.properties?.county,
          name
        );
        const region = firstString(feature.properties?.state, feature.properties?.country);
        return {
          label: [name, locality !== name ? locality : '', region].filter(Boolean).join(', '),
          locality,
          region,
        };
      })
      .filter((item) => {
        const key = `${item.label}|${item.locality || ''}|${item.region || ''}`;
        if (!item.label || seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });

    return jsonResponse({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro inesperado ao buscar lugares.';
    return jsonResponse({ error: message }, 500);
  }
});

function sanitizeQuery(value: unknown) {
  return `${value || ''}`.replace(/\s+/g, ' ').trim().slice(0, 80);
}

function sanitizeCountryCode(value: unknown) {
  const normalized = `${value || 'BR'}`
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 2);

  return normalized || 'BR';
}

function firstString(...values: Array<string | undefined>) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return '';
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}
