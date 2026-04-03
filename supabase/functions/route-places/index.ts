const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('APP_ORIGIN') || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405);
  }

  try {
    const openRouteServiceApiKey = Deno.env.get('OPENROUTESERVICE_API_KEY');
    if (!openRouteServiceApiKey) {
      return jsonResponse({ error: 'Serviço de rotas não configurado.' }, 500);
    }

    const body = (await request.json()) as SearchPlacesRequest;
    const query = sanitizeQuery(body.query);
    const countryCode = sanitizeCountryCode(body.countryCode);

    if (query.length < 1) {
      return jsonResponse({ data: [] });
    }

    const url = new URL('https://api.openrouteservice.org/geocode/autocomplete');
    url.searchParams.set('api_key', openRouteServiceApiKey);
    url.searchParams.set('text', query);
    url.searchParams.set('size', '8');
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
