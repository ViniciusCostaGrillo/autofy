const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchPlacesRequest {
  query: string;
  countryCode?: string;
}

interface OpenRouteGeocodeResponse {
  features?: Array<{
    properties?: Record<string, unknown>;
  }>;
  error?: {
    message?: string;
  };
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const openRouteServiceApiKey = Deno.env.get('OPENROUTESERVICE_API_KEY');
    if (!openRouteServiceApiKey) {
      return jsonResponse({ error: 'OPENROUTESERVICE_API_KEY nao configurada.' }, 500);
    }

    const body = (await request.json()) as SearchPlacesRequest;
    const query = body.query?.trim();
    const countryCode = (body.countryCode || 'BR').toUpperCase();

    if (!query || query.length < 2) {
      return jsonResponse({ data: [] });
    }

    const url = new URL('https://api.openrouteservice.org/geocode/autocomplete');
    url.searchParams.set('api_key', openRouteServiceApiKey);
    url.searchParams.set('text', query);
    url.searchParams.set('size', '5');
    url.searchParams.set('boundary.country', countryCode);
    url.searchParams.set('lang', countryCode === 'BR' ? 'pt-BR' : countryCode === 'ES' ? 'es' : 'en');

    const response = await fetch(url);
    const payload = (await response.json()) as OpenRouteGeocodeResponse;

    if (!response.ok) {
      return jsonResponse({ error: payload.error?.message || 'Falha ao buscar lugares.' }, response.status);
    }

    const data =
      payload.features?.map((feature) => {
        const properties = feature.properties || {};
        const locality = firstString(properties.locality, properties.localadmin, properties.county);
        const region = firstString(properties.region_a, properties.region);
        const label = firstString(properties.label, properties.name, properties.street);
        const display = label || [locality, region].filter(Boolean).join(', ');

        return {
          label: display,
          locality,
          region,
        };
      }) || [];

    return jsonResponse({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro inesperado ao buscar lugares.';
    return jsonResponse({ error: message }, 500);
  }
});

function firstString(...values: unknown[]) {
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
